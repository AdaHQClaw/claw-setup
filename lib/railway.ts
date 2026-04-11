const RAILWAY_API = "https://backboard.railway.com/graphql/v2";

async function railwayQuery(query: string, variables: Record<string, unknown>) {
  const token = process.env.RAILWAY_API_TOKEN;
  if (!token) throw new Error("RAILWAY_API_TOKEN is not set");

  const res = await fetch(RAILWAY_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();
  if (json.errors) {
    throw new Error(json.errors[0]?.message ?? "Railway API error");
  }
  return json.data;
}

export async function provisionClaw(params: {
  clawName: string;
  anthropicKey: string;
  telegramToken: string;
  openaiKey?: string;
  soulContent: string;
}): Promise<{ projectId: string; serviceId: string }> {
  // 1. Create a new project
  const projectData = await railwayQuery(
    `mutation ProjectCreate($input: ProjectCreateInput!) {
      projectCreate(input: $input) { id }
    }`,
    { input: { name: `claw-${params.clawName.toLowerCase().replace(/\s+/g, "-")}` } }
  );
  const projectId: string = projectData.projectCreate.id;

  // 2. Get the default environment ID
  const envData = await railwayQuery(
    `query Project($id: String!) {
      project(id: $id) {
        environments { edges { node { id name } } }
      }
    }`,
    { id: projectId }
  );
  const environmentId: string =
    envData.project.environments.edges[0]?.node?.id;

  // 3. Create a service using the openclaw npm package via Node image
  const serviceData = await railwayQuery(
    `mutation ServiceCreate($input: ServiceCreateInput!) {
      serviceCreate(input: $input) { id }
    }`,
    {
      input: {
        projectId,
        name: params.clawName,
        source: {
          image: "node:20-alpine",
        },
      },
    }
  );
  const serviceId: string = serviceData.serviceCreate.id;

  // 4. Set environment variables
  const envVars: Record<string, string> = {
    ANTHROPIC_API_KEY: params.anthropicKey,
    TELEGRAM_BOT_TOKEN: params.telegramToken,
    CLAW_NAME: params.clawName,
    OPENCLAW_SOUL: Buffer.from(params.soulContent).toString("base64"),
    NODE_ENV: "production",
  };
  if (params.openaiKey) {
    envVars.OPENAI_API_KEY = params.openaiKey;
  }

  await railwayQuery(
    `mutation VariableCollectionUpsert($input: VariableCollectionUpsertInput!) {
      variableCollectionUpsert(input: $input)
    }`,
    {
      input: {
        projectId,
        environmentId,
        serviceId,
        variables: envVars,
      },
    }
  );

  // 5. Trigger deployment
  await railwayQuery(
    `mutation ServiceInstanceDeploy($serviceId: String!, $environmentId: String!) {
      serviceInstanceDeploy(serviceId: $serviceId, environmentId: $environmentId)
    }`,
    { serviceId, environmentId }
  );

  return { projectId, serviceId };
}
