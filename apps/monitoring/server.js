import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadDotEnv(path) {
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadDotEnv(join(__dirname, ".env"));

const PORT = Number(process.env.PORT || 4100);
// Prefer a full GRAPHQL_URL when provided (local dev). On Render we wire
// GRAPHQL_HOST via fromService (bare hostname) and build the URL against the
// graphql-engine internal port.
const GRAPHQL_URL =
  process.env.GRAPHQL_URL ||
  (process.env.GRAPHQL_HOST
    ? `http://${process.env.GRAPHQL_HOST}:8080/v1/graphql`
    : null);
// Bearer token for Hasura (signed JWT matching HASURA_GRAPHQL_JWT_SECRET).
// Accepts either HASURA_GRAPHQL_JWT or GRAPHQL_BEARER_TOKEN.
const GRAPHQL_BEARER_TOKEN =
  process.env.GRAPHQL_BEARER_TOKEN || process.env.HASURA_GRAPHQL_JWT;
const INDEXER_PROJECT_PATH = resolve(
  __dirname,
  process.env.INDEXER_PROJECT_PATH || "../indexer",
);

if (!GRAPHQL_URL) {
  console.error("GRAPHQL_URL (or GRAPHQL_HOST) is required");
  process.exit(1);
}

const CHAIN_NAMES = {
  1: "Ethereum",
  10: "Optimism",
  137: "Polygon",
  250: "Fantom",
  8453: "Base",
  42161: "Arbitrum",
  747474: "Katana",
};

function readEnvioVersion() {
  const candidates = [
    {
      path: join(INDEXER_PROJECT_PATH, "generated", "persisted_state.envio.json"),
      extract: (json) => json.envio_version,
    },
    {
      path: join(INDEXER_PROJECT_PATH, "package.json"),
      extract: (json) => json?.dependencies?.envio ?? json?.devDependencies?.envio,
    },
  ];
  for (const { path, extract } of candidates) {
    try {
      if (!existsSync(path)) continue;
      const json = JSON.parse(readFileSync(path, "utf8"));
      const v = extract(json);
      if (v) return v;
    } catch {}
  }
  return null;
}

async function queryGraphQL(query) {
  const headers = { "Content-Type": "application/json" };
  if (GRAPHQL_BEARER_TOKEN) headers["Authorization"] = `Bearer ${GRAPHQL_BEARER_TOKEN}`;
  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`GraphQL request failed: ${res.status} ${res.statusText}`);
  const body = await res.json();
  if (body.errors) throw new Error(`GraphQL errors: ${JSON.stringify(body.errors)}`);
  return body.data;
}

async function getStatus() {
  const data = await queryGraphQL(`
    {
      chain_metadata {
        chain_id
        block_height
        start_block
        end_block
        first_event_block_number
        latest_processed_block
        latest_fetched_block_number
        num_events_processed
        is_hyper_sync
        timestamp_caught_up_to_head_or_endblock
      }
    }
  `);

  const chains = (data.chain_metadata ?? []).map((c) => {
    const syncStart = c.first_event_block_number ?? c.start_block ?? 0;
    const target = c.end_block ?? c.block_height ?? 0;
    const processed = c.latest_processed_block ?? 0;
    const totalRange = Math.max(0, target - syncStart);
    const doneRange = Math.max(0, processed - syncStart);
    const caughtUp = c.timestamp_caught_up_to_head_or_endblock != null;
    let percent = 0;
    if (caughtUp) percent = 100;
    else if (totalRange > 0) percent = Math.min(100, (doneRange / totalRange) * 100);
    return {
      chainId: c.chain_id,
      chainName: CHAIN_NAMES[c.chain_id] ?? `Chain ${c.chain_id}`,
      blockHeight: c.block_height,
      startBlock: c.start_block,
      endBlock: c.end_block,
      firstEventBlock: c.first_event_block_number,
      latestProcessedBlock: processed,
      latestFetchedBlock: c.latest_fetched_block_number,
      numEventsProcessed: Number(c.num_events_processed ?? 0),
      isHyperSync: c.is_hyper_sync,
      caughtUp,
      caughtUpAt: c.timestamp_caught_up_to_head_or_endblock,
      percentSynced: percent,
      blocksBehind: Math.max(0, target - processed),
    };
  });

  chains.sort((a, b) => a.chainId - b.chainId);

  const totalEvents = chains.reduce((acc, c) => acc + c.numEventsProcessed, 0);
  const avgPercent = chains.length
    ? chains.reduce((acc, c) => acc + c.percentSynced, 0) / chains.length
    : 0;

  return {
    envioVersion: readEnvioVersion(),
    indexerProjectPath: INDEXER_PROJECT_PATH,
    fetchedAt: new Date().toISOString(),
    chains,
    totals: {
      chainCount: chains.length,
      totalEvents,
      averagePercentSynced: avgPercent,
      allCaughtUp: chains.length > 0 && chains.every((c) => c.caughtUp),
    },
  };
}

const server = createServer(async (req, res) => {
  try {
    if (req.url === "/api/status") {
      const status = await getStatus();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(status));
      return;
    }
    if (req.url === "/healthz") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("ok");
      return;
    }
    if (req.url === "/" || req.url === "/index.html") {
      const html = await readFile(join(__dirname, "public", "index.html"));
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
      return;
    }
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("not found");
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  }
});

server.listen(PORT, () => {
  console.log(`envio-monitoring dashboard: http://localhost:${PORT}`);
  console.log(`  GraphQL: ${GRAPHQL_URL}`);
  console.log(`  Indexer project: ${INDEXER_PROJECT_PATH}`);
});
