const RAILWAY_API = "https://backboard.railway.com/graphql/v2";
const OPENCLAW_TEMPLATE_ID = "97b39ed3-6bd5-4b5a-9976-abedd357d405";

async function gql(token: string, query: string, variables: Record<string, unknown>) {
  const res = await fetch(RAILWAY_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(`Railway API error: ${json.errors[0].message}`);
  }
  return json.data;
}

function generateToken(): string {
  const chars = "abcdef0123456789";
  return Array.from({ length: 48 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export type ProvisionResult = {
  projectId: string;
  serviceId: string;
  domain: string;
  gatewayToken: string;
  environmentId: string;
};

export async function provisionClaw(params: {
  clawName: string;
  anthropicKey: string;
  telegramToken: string;
  openaiKey?: string;
  soulContent: string;
}): Promise<ProvisionResult> {
  const token = process.env.RAILWAY_API_TOKEN;
  if (!token) throw new Error("RAILWAY_API_TOKEN is not configured.");

  const gatewayToken = generateToken();
  const projectSlug = `claw-${params.clawName.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 20)}-${Date.now().toString(36)}`;

  // 1. Deploy from the official OpenClaw Railway template
  const deployData = await gql(token,
    `mutation TemplateDeploy($input: TemplateDeployInput!) {
      templateDeploy(input: $input) {
        projectId
        workflowId
      }
    }`,
    {
      input: {
        templateCode: "clawdbot-railway-template",
        projectName: projectSlug,
        services: [
          {
            templateServiceId: "openclaw",
            variables: {
              OPENCLAW_GATEWAY_PORT: "8080",
              OPENCLAW_GATEWAY_TOKEN: gatewayToken,
              OPENCLAW_STATE_DIR: "/data/.openclaw",
              OPENCLAW_WORKSPACE_DIR: "/data/workspace",
              TELEGRAM_BOT_TOKEN: params.telegramToken,
              ANTHROPIC_API_KEY: params.anthropicKey,
              ...(params.openaiKey ? { OPENAI_API_KEY: params.openaiKey } : {}),
              OPENCLAW_SOUL: Buffer.from(params.soulContent).toString("base64"),
            },
          },
        ],
      },
    }
  );

  const projectId: string = deployData.templateDeploy.projectId;

  // 2. Get the environment and service IDs
  await new Promise((r) => setTimeout(r, 3000)); // brief pause for project setup

  const projectData = await gql(token,
    `query Project($id: String!) {
      project(id: $id) {
        environments { edges { node { id name } } }
        services { edges { node { id name } } }
      }
    }`,
    { id: projectId }
  );

  const environmentId: string = projectData.project.environments.edges[0]?.node?.id;
  const serviceId: string = projectData.project.services.edges[0]?.node?.id;

  if (!environmentId || !serviceId) {
    throw new Error("Could not find environment or service after template deploy.");
  }

  // 3. Get or generate public domain
  let domain = `${projectSlug}.up.railway.app`;

  try {
    const domainData = await gql(token,
      `mutation ServiceInstanceDomainCreate($environmentId: String!, $serviceId: String!) {
        serviceInstanceDomainCreate(environmentId: $environmentId, serviceId: $serviceId) {
          domain
        }
      }`,
      { environmentId, serviceId }
    );
    if (domainData.serviceInstanceDomainCreate?.domain) {
      domain = domainData.serviceInstanceDomainCreate.domain;
    }
  } catch {
    // Domain may already exist or be auto-created by template
  }

  return { projectId, serviceId, environmentId, domain, gatewayToken };
}
