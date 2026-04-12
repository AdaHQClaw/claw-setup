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

  // 3. Set environment variables
  //
  // OC_INIT: base64-encoded Node.js init script that writes openclaw.json to /tmp
  // and launches the gateway. Stored as env var to avoid all shell quoting issues
  // in the Railway start command (which is passed through docker-entrypoint.sh).
  //
  // Why workspace is /tmp/workspace not /data/workspace:
  //   The Railway volume at /data is owned by root. The node user gets permission
  //   denied when trying to mkdir /data/workspace at startup. /tmp is always
  //   writable. Persistent storage (sessions, memory) goes to /data once the
  //   volume is accessible, but workspace files (SOUL.md, agent context) live in /tmp.
  const initScript = `
const fs = require('fs');
const cp = require('child_process');
const d = process.env.RAILWAY_PUBLIC_DOMAIN || '';
const wd = '/tmp/workspace';
const soul = process.env.OPENCLAW_SOUL_B64 ? Buffer.from(process.env.OPENCLAW_SOUL_B64, 'base64').toString('utf8') : '';
const cfg = {
  gateway: {
    mode: 'local',
    bind: 'lan',
    auth: { mode: 'token', token: process.env.OPENCLAW_GATEWAY_TOKEN },
    controlUi: {
      basePath: '/openclaw',
      allowedOrigins: d ? ['https://' + d] : [],
      dangerouslyDisableDeviceAuth: true
    }
  },
  agents: {
    defaults: {
      workspace: wd,
      model: { primary: 'anthropic/claude-sonnet-4-5' }
    }
  },
  channels: { telegram: { enabled: true, dmPolicy: 'open', allowFrom: ['*'] } }
};
fs.mkdirSync(wd, { recursive: true });
if (soul) { try { fs.writeFileSync(wd + '/SOUL.md', soul); } catch(e) {} }
fs.writeFileSync('/tmp/oc.json', JSON.stringify(cfg));
console.log('cfg ok domain=' + d);
cp.spawnSync('node', ['openclaw.mjs', 'gateway', '--port', '8080', '--allow-unconfigured'], {
  stdio: 'inherit',
  env: { ...process.env, OPENCLAW_CONFIG_PATH: '/tmp/oc.json' }
});
`;
  const ocInit = Buffer.from(initScript).toString("base64");

  const envVars: Record<string, string> = {
    OC_INIT: ocInit,
    OPENCLAW_GATEWAY_TOKEN: gatewayToken,
    TELEGRAM_BOT_TOKEN: params.telegramToken,
    ANTHROPIC_API_KEY: params.anthropicKey,
    OPENCLAW_SOUL_B64: Buffer.from(params.soulContent).toString("base64"),
  };
  if (params.openaiKey) envVars.OPENAI_API_KEY = params.openaiKey;

  await gql(token,
    `mutation VariableCollectionUpsert($input: VariableCollectionUpsertInput!) { variableCollectionUpsert(input: $input) }`,
    { input: { projectId, environmentId, serviceId, variables: envVars } }
  );

  // 4. Configure service instance
  //
  // Start command: decode and eval the OC_INIT base64 script.
  // Simple double-quoted node -e with no inner quoting issues.
  const startCommand = `node -e "eval(Buffer.from(process.env.OC_INIT,'base64').toString())"`;


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
