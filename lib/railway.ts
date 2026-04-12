const RAILWAY_API = "https://backboard.railway.com/graphql/v2";

async function gql(token: string, query: string, variables: Record<string, unknown> = {}) {
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
    throw new Error(`Railway API: ${json.errors[0].message}`);
  }
  return json.data;
}

function generateToken(length = 48): string {
  const chars = "abcdef0123456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export type ProvisionResult = {
  projectId: string;
  serviceId: string;
  environmentId: string;
  domain: string;
  gatewayToken: string;
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

  const gatewayToken = generateToken(48);
  const projectName = `claw-${params.clawName.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 20)}-${Date.now().toString(36)}`;

  // 1. Create a new Railway project
  const projectData = await gql(token,
    `mutation ProjectCreate($input: ProjectCreateInput!) { projectCreate(input: $input) { id environments { edges { node { id } } } } }`,
    { input: { name: projectName } }
  );
  const projectId: string = projectData.projectCreate.id;
  const environmentId: string = projectData.projectCreate.environments.edges[0].node.id;

  // 2. Create service using the OpenClaw Docker image
  const serviceData = await gql(token,
    `mutation ServiceCreate($input: ServiceCreateInput!) { serviceCreate(input: $input) { id } }`,
    {
      input: {
        projectId,
        name: "OpenClaw",
        source: { image: "ghcr.io/openclaw/openclaw:latest" },
      },
    }
  );
  const serviceId: string = serviceData.serviceCreate.id;

  // 3. Set environment variables (API keys stored here only, not in Supabase)
  const envVars: Record<string, string> = {
    OPENCLAW_GATEWAY_PORT: "8080",
    OPENCLAW_GATEWAY_TOKEN: gatewayToken,
    OPENCLAW_STATE_DIR: "/data/.openclaw",
    OPENCLAW_WORKSPACE_DIR: "/data/workspace",
    TELEGRAM_BOT_TOKEN: params.telegramToken,
    ANTHROPIC_API_KEY: params.anthropicKey,
    // SOUL content stored as base64 — written to workspace at startup
    OPENCLAW_SOUL_B64: Buffer.from(params.soulContent).toString("base64"),
  };
  if (params.openaiKey) envVars.OPENAI_API_KEY = params.openaiKey;

  await gql(token,
    `mutation VariableCollectionUpsert($input: VariableCollectionUpsertInput!) { variableCollectionUpsert(input: $input) }`,
    { input: { projectId, environmentId, serviceId, variables: envVars } }
  );

  // 4. Configure service instance (start command + healthcheck)
  //
  // The start command writes a complete openclaw.json and SOUL.md before launching.
  //
  // Why each setting is needed:
  //   gateway.mode=local         — required, gateway refuses to start otherwise
  //   gateway.bind=lan           — Railway bridge networking requires 0.0.0.0, not loopback
  //   gateway.auth               — token auth using the generated OPENCLAW_GATEWAY_TOKEN
  //   controlUi.allowedOrigins   — REQUIRED for non-loopback: without this, all browser
  //                                WebSocket connections are rejected with "origin not allowed"
  //   controlUi.dangerouslyDisableDeviceAuth — without this, every new browser triggers
  //                                a pairing flow requiring `openclaw devices approve` via
  //                                shell access — unusable for end users
  //   channels.telegram          — explicit config with dmPolicy:"open" so the bot accepts
  //                                messages immediately; default is "pairing" which blocks
  //                                all new users until they complete an out-of-band approval
  //   agents.defaults.workspace  — sets the workspace directory where SOUL.md lives
  //
  // RAILWAY_PUBLIC_DOMAIN is injected automatically by Railway at container start.
  // The startup script must handle Railway's volume mount timing:
  // Railway mounts the /data volume after container start, so /data may not be
  // writable immediately. We poll until it is before writing config.
  const startCommand =
    `node -e "` +
    `const fs=require('fs'),path=require('path');` +
    `const sd=process.env.OPENCLAW_STATE_DIR||'/data/.openclaw';` +
    `const wd=process.env.OPENCLAW_WORKSPACE_DIR||'/data/workspace';` +
    // Wait until /data is writable (Railway volume mount timing)
    `function waitForVolume(cb,tries){` +
    `  tries=tries||0;` +
    `  try{fs.mkdirSync(sd,{recursive:true});fs.mkdirSync(wd,{recursive:true});cb();}` +
    `  catch(e){if(tries>30)throw e;setTimeout(()=>waitForVolume(cb,tries+1),1000);}` +
    `}` +
    `waitForVolume(function(){` +
    // Write SOUL.md to workspace
    `if(process.env.OPENCLAW_SOUL_B64){` +
    `  fs.writeFileSync(path.join(wd,'SOUL.md'),Buffer.from(process.env.OPENCLAW_SOUL_B64,'base64').toString('utf8'));` +
    `}` +
    // Write full openclaw.json
    `const domain=process.env.RAILWAY_PUBLIC_DOMAIN||'';` +
    `const cfg={` +
    `  gateway:{mode:'local',bind:'lan',` +
    `    auth:{mode:'token',token:process.env.OPENCLAW_GATEWAY_TOKEN},` +
    `    controlUi:{basePath:'/openclaw',allowedOrigins:domain?['https://'+domain]:[],dangerouslyDisableDeviceAuth:true}` +
    `  },` +
    `  agents:{defaults:{workspace:wd}},` +
    `  channels:{telegram:{enabled:true,dmPolicy:'open',allowFrom:['*']}}` +
    `};` +
    `fs.writeFileSync(path.join(sd,'openclaw.json'),JSON.stringify(cfg));` +
    `require('child_process').spawn('openclaw',['gateway','--port','8080'],{stdio:'inherit',detached:false});` +
    `});` +
    `"`;

  await gql(token,
    `mutation ServiceInstanceUpdate($serviceId: String!, $environmentId: String!, $input: ServiceInstanceUpdateInput!) { serviceInstanceUpdate(serviceId: $serviceId, environmentId: $environmentId, input: $input) }`,
    {
      serviceId,
      environmentId,
      input: {
        startCommand,
        healthcheckPath: "/openclaw/",
        restartPolicyType: "ON_FAILURE",
      },
    }
  );

  // 5. Attach persistent volume at /data
  await gql(token,
    `mutation VolumeCreate($input: VolumeCreateInput!) { volumeCreate(input: $input) { id } }`,
    { input: { projectId, serviceId, environmentId, mountPath: "/data" } }
  );

  // 6. Create a public domain with targetPort set to 8080
  // targetPort is required for Railway's HTTP proxy to correctly route WebSocket traffic.
  // Without it, Railway's Fastly CDN intercepts WebSocket upgrade requests and returns
  // HTTP 200 instead of 101, breaking the dashboard Control UI connection entirely.
  const domainData = await gql(token,
    `mutation { serviceDomainCreate(input: { serviceId: "${serviceId}", environmentId: "${environmentId}", targetPort: 8080 }) { domain } }`
  );
  const domain: string = domainData.serviceDomainCreate?.domain ?? `${projectName}.up.railway.app`;

  // 7. Trigger deployment
  await gql(token,
    `mutation ServiceInstanceDeploy($serviceId: String!, $environmentId: String!) { serviceInstanceDeploy(serviceId: $serviceId, environmentId: $environmentId) }`,
    { serviceId, environmentId }
  );

  return { projectId, serviceId, environmentId, domain, gatewayToken };
}
