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

  // 3. Create a public domain FIRST so we know it before setting env vars.
  //    targetPort: 8080 is required for Railway's HTTP proxy to correctly route
  //    WebSocket traffic. Without it, Railway's Fastly CDN intercepts WebSocket
  //    upgrade requests and returns HTTP 200 instead of 101.
  const domainData = await gql(token,
    `mutation { serviceDomainCreate(input: { serviceId: "${serviceId}", environmentId: "${environmentId}", targetPort: 8080 }) { domain } }`
  );
  const domain: string = domainData.serviceDomainCreate?.domain ?? `${projectName}.up.railway.app`;

  // 4. Build the OC_INIT script (base64-encoded Node.js startup script).
  //
  //    This runs inside the Railway container on every startup. It:
  //    - Writes /tmp/oc.json (the OpenClaw config) using only known-good config keys
  //    - Writes SOUL.md into /tmp/workspace (writable by node user; /data is root-owned)
  //    - Launches the gateway via absolute path /app/openclaw.mjs
  //
  //    Key design decisions:
  //    - CLAW_DOMAIN (not RAILWAY_PUBLIC_DOMAIN): we inject the domain we know at
  //      provision time so allowedOrigins is correct on first boot.
  //    - /app/openclaw.mjs: absolute path avoids cwd ambiguity in the Docker image.
  //    - anthropic plugin explicitly enabled: required for the API key to be picked up.
  //    - Full error logging: any crash now surfaces in Railway logs.
  //    - process.exit(1) on gateway exit: Railway ON_FAILURE restarts the service.
  const initScript = `
const fs = require('fs');
const cp = require('child_process');

// CLAW_DOMAIN is set by us at provision time — reliable at first boot.
// Falls back to Railway's injected var as belt-and-suspenders.
const d = process.env.CLAW_DOMAIN || process.env.RAILWAY_PUBLIC_DOMAIN || '';
const wd = '/tmp/workspace';
const soul = process.env.OPENCLAW_SOUL_B64
  ? Buffer.from(process.env.OPENCLAW_SOUL_B64, 'base64').toString('utf8')
  : '';

const cfg = {
  gateway: {
    port: 8080,
    mode: 'local',
    bind: 'lan',
    auth: { mode: 'token', token: process.env.OPENCLAW_GATEWAY_TOKEN },
    controlUi: {
      basePath: '/openclaw',
      allowedOrigins: d ? ['https://' + d] : [],
      dangerouslyDisableDeviceAuth: true,
      dangerouslyAllowHostHeaderOriginFallback: true,
      allowInsecureAuth: true
    }
  },
  agents: {
    defaults: {
      workspace: wd,
      model: { primary: 'anthropic/claude-sonnet-4-6' },
      skipBootstrap: false
    }
  },
  channels: {
    telegram: {
      enabled: true,
      dmPolicy: 'open',
      allowFrom: ['*'],
      groupPolicy: 'open',
      streaming: 'partial'
    }
  },
  plugins: {
    entries: {
      anthropic: { enabled: true, config: {} }
    }
  }
};

// Create workspace directory
try {
  fs.mkdirSync(wd, { recursive: true });
} catch (e) {
  console.error('[claw-init] Failed to create workspace dir:', e.message);
}

// Write SOUL.md
if (soul) {
  try {
    fs.writeFileSync(wd + '/SOUL.md', soul, 'utf8');
    console.log('[claw-init] SOUL.md written');
  } catch (e) {
    console.error('[claw-init] Failed to write SOUL.md:', e.message);
  }
}

// Write OpenClaw config
try {
  fs.writeFileSync('/tmp/oc.json', JSON.stringify(cfg, null, 2), 'utf8');
  console.log('[claw-init] Config written, domain=' + (d || '(not set)'));
} catch (e) {
  console.error('[claw-init] Failed to write config:', e.message);
  process.exit(1);
}

// Launch gateway using absolute path
console.log('[claw-init] Launching OpenClaw gateway...');
const result = cp.spawnSync('node', ['/app/openclaw.mjs', 'gateway', '--port', '8080'], {
  stdio: 'inherit',
  env: { ...process.env, OPENCLAW_CONFIG_PATH: '/tmp/oc.json' }
});

if (result.error) {
  console.error('[claw-init] Gateway launch error:', result.error.message);
  process.exit(1);
}

// spawnSync only returns if the child exits — gateway has crashed.
console.error('[claw-init] Gateway exited unexpectedly, status:', result.status);
process.exit(result.status || 1);
`;
  const ocInit = Buffer.from(initScript).toString("base64");

  // 5. Set all environment variables — including CLAW_DOMAIN now that we have it.
  //    API keys are NOT stored in Supabase. They live only inside the user's Railway project.
  const envVars: Record<string, string> = {
    OC_INIT: ocInit,
    OPENCLAW_GATEWAY_TOKEN: gatewayToken,
    TELEGRAM_BOT_TOKEN: params.telegramToken,
    ANTHROPIC_API_KEY: params.anthropicKey,
    OPENCLAW_SOUL_B64: Buffer.from(params.soulContent).toString("base64"),
    CLAW_DOMAIN: domain,
  };
  if (params.openaiKey) envVars.OPENAI_API_KEY = params.openaiKey;

  await gql(token,
    `mutation VariableCollectionUpsert($input: VariableCollectionUpsertInput!) { variableCollectionUpsert(input: $input) }`,
    { input: { projectId, environmentId, serviceId, variables: envVars } }
  );

  // 6. Configure service instance.
  //    Start command: decode OC_INIT and eval it.
  //    healthcheckPath: /openclaw/ — Railway waits for HTTP 200 here before marking healthy.
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

  // 7. Attach persistent volume at /data.
  //    NOTE: /data is root-owned on Railway — workspace files go to /tmp/workspace instead.
  //    The volume provides persistence for sessions, memory, and OpenClaw state files
  //    that are written by the gateway process itself (which runs as the openclaw user
  //    that has access once the volume is initialised by Railway's entrypoint).
  await gql(token,
    `mutation VolumeCreate($input: VolumeCreateInput!) { volumeCreate(input: $input) { id } }`,
    { input: { projectId, serviceId, environmentId, mountPath: "/data" } }
  );

  // 8. Trigger deployment
  await gql(token,
    `mutation ServiceInstanceDeploy($serviceId: String!, $environmentId: String!) { serviceInstanceDeploy(serviceId: $serviceId, environmentId: $environmentId) }`,
    { serviceId, environmentId }
  );

  return { projectId, serviceId, environmentId, domain, gatewayToken };
}
