import { spawn, spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const env = { ...process.env };
const databaseUrlSource = env.ENVIO_DATABASE_URL
  ? "ENVIO_DATABASE_URL"
  : env.DATABASE_URL
    ? "DATABASE_URL"
    : undefined;
const databaseUrl = databaseUrlSource ? env[databaseUrlSource] : undefined;

if (env.RENDER && !env.ENVIO_DATABASE_URL) {
  console.error(
    "Missing ENVIO_DATABASE_URL on Render. Sync the Blueprint or add ENVIO_DATABASE_URL from the Render Postgres internal connection string.",
  );
  process.exit(1);
}

if (databaseUrl) {
  const url = new URL(databaseUrl);
  env.ENVIO_PG_HOST = url.hostname;
  env.ENVIO_PG_PORT = url.port || "5432";
  env.ENVIO_PG_USER = decodeURIComponent(url.username);
  env.ENVIO_POSTGRES_PASSWORD = decodeURIComponent(url.password);
  env.ENVIO_PG_DATABASE = decodeURIComponent(url.pathname.replace(/^\//, ""));
}

for (const key of [
  "ENVIO_PG_HOST",
  "ENVIO_PG_PORT",
  "ENVIO_PG_USER",
  "ENVIO_POSTGRES_PASSWORD",
  "ENVIO_PG_DATABASE",
]) {
  if (!env[key]) {
    console.error(`Missing required database environment variable: ${key}`);
    process.exit(1);
  }
}

console.log(
  `Starting Envio with Postgres ${env.ENVIO_PG_USER}@${env.ENVIO_PG_HOST}:${env.ENVIO_PG_PORT}/${env.ENVIO_PG_DATABASE}`,
);
console.log(`Database config source: ${databaseUrlSource ?? "ENVIO_PG_*"}`);

// Envio itself only reads HASURA_GRAPHQL_ENDPOINT (must be a full URL ending
// in /v1/metadata) — it has no notion of HASURA_SERVICE_HOST/PORT. Render's
// blueprint sets those two (see render.yaml) so the indexer can resolve
// graphql-engine's internal hostname without hardcoding it; assemble them
// into the URL envio actually expects.
if (!env.HASURA_GRAPHQL_ENDPOINT && env.HASURA_SERVICE_HOST) {
  const hasuraPort = env.HASURA_SERVICE_PORT || "8080";
  env.HASURA_GRAPHQL_ENDPOINT = `http://${env.HASURA_SERVICE_HOST}:${hasuraPort}/v1/metadata`;
  console.log(`Derived HASURA_GRAPHQL_ENDPOINT: ${env.HASURA_GRAPHQL_ENDPOINT}`);
}

// Both `envio local db-migrate up` and `envio start` independently check
// config.yaml/schema.graphql against the already-indexed data and refuse to
// resume when the change is incompatible (e.g. a new contract/event, not
// just an address-list tweak — see patches/envio@3.0.1.patch). Normally that
// just crashes the process forever until someone manually reruns with the
// reset variant of the command. Detect that specific failure per-command and
// reset automatically instead.
//
// envio's compatibility check doesn't flag *removing* a chain from
// config.yaml as incompatible, but a later startup step still crashes trying
// to resume the removed chain's leftover progress row ("No chain with id N
// found in config.yaml") — treat that the same way: it only clears up with a
// full reset, since a fresh init builds chain state from config.yaml alone.
const RESET_TRIGGER_PATTERNS = [
  /config changes are incompatible with the existing indexer data/,
  /No chain with id \d+ found in config\.yaml/,
];
const needsReset = (output) =>
  RESET_TRIGGER_PATTERNS.some((pattern) => pattern.test(output));

// `envio start` runs for the life of the deploy, so accumulating its full
// output here would leak memory. Only the tail matters — reset-trigger errors
// appear right before the process exits, and the Hasura-tracking-done marker
// (see below) is checked as it streams in — so keep a bounded window instead.
const OUTPUT_TAIL_CHARS = 16_000;

const runPnpm = (args, { onOutput } = {}) =>
  new Promise((resolve) => {
    const child = spawn("pnpm", args, {
      env,
      stdio: ["inherit", "pipe", "pipe"],
    });

    let output = "";
    const relay = (source, dest) => {
      source.on("data", (chunk) => {
        dest.write(chunk);
        output = (output + chunk).slice(-OUTPUT_TAIL_CHARS);
        onOutput?.(output);
      });
    };
    relay(child.stdout, process.stdout);
    relay(child.stderr, process.stderr);

    child.on("close", (code) => resolve({ code, output }));
  });

// Runs `pnpm <args>`; if it fails specifically because envio detected an
// incompatible config change, reruns with `resetArgs` (which wipes and
// reinitializes) instead. Any other failure just exits the process.
const runPnpmWithReset = async (args, resetArgs, opts) => {
  const attempt = await runPnpm(args, opts);
  if (attempt.code === 0) {
    return;
  }

  if (needsReset(attempt.output)) {
    console.warn(
      `config.yaml (or schema.graphql) drifted from the existing indexed data — resetting the database and reindexing from scratch (\`pnpm ${resetArgs.join(" ")}\`).`,
    );
    const reset = await runPnpm(resetArgs, opts);
    if (reset.code !== 0) {
      process.exit(reset.code ?? 1);
    }
    return;
  }

  process.exit(attempt.code ?? 1);
};

// envio wipes and rebuilds all Hasura metadata on every startup (clear then
// re-track), but it only ever grants `select` to the `public` role —
// hardcoded in its own Hasura.res.mjs, with no env var to change it. Clients
// authenticated via HASURA_GRAPHQL_JWT (graphiql, apps/monitoring) are pinned
// to the `readonly` role instead (see HASURA_GRAPHQL_JWT_SECRET's claims_map),
// which never gets those grants and sees a GraphQL schema missing every
// table. Once envio logs that tracking finished, grant `readonly` the same
// select access as `public` so those clients aren't left broken after every
// deploy or reset.
const HASURA_TRACKING_DONE_PATTERN = /Hasura configuration completed/;
let readonlyGrantTriggered = false;
const grantReadonlySelect = () => {
  if (readonlyGrantTriggered) return;
  readonlyGrantTriggered = true;
  console.log("Hasura tracking finished — granting the readonly role select access...");
  const grant = spawn(
    "node",
    ["scripts/hasura_grant_public_select.js", "readonly"],
    { env, stdio: "inherit" },
  );
  grant.on("close", (code) => {
    if (code !== 0) {
      console.warn(
        `Failed to grant Hasura 'readonly' role select access (exit ${code}) — the monitoring dashboard and graphiql may see "field not found" GraphQL errors until this is fixed.`,
      );
    } else {
      console.log("Granted Hasura 'readonly' role select access.");
    }
  });
};

await runPnpmWithReset(
  ["envio", "local", "db-migrate", "up"],
  ["envio", "local", "db-migrate", "setup"],
);

const migrationsDir = join(process.cwd(), "migrations");
if (existsSync(migrationsDir)) {
  const migrationFiles = readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of migrationFiles) {
    const migrationPath = join(migrationsDir, file);
    console.log(`Running SQL migration: ${file}`);
    const result = spawnSync(
      "psql",
      [
        "--host",
        env.ENVIO_PG_HOST,
        "--port",
        env.ENVIO_PG_PORT,
        "--username",
        env.ENVIO_PG_USER,
        "--dbname",
        env.ENVIO_PG_DATABASE,
        "--set",
        "ON_ERROR_STOP=1",
        "--file",
        migrationPath,
      ],
      {
        env: {
          ...env,
          PGPASSWORD: env.ENVIO_POSTGRES_PASSWORD,
        },
        stdio: "inherit",
      },
    );

    if (result.status !== 0) {
      process.exit(result.status ?? 1);
    }
  }
}

await runPnpmWithReset(["envio", "start"], ["envio", "start", "-r"], {
  onOutput: (tail) => {
    if (HASURA_TRACKING_DONE_PATTERN.test(tail)) grantReadonlySelect();
  },
});
process.exit(0);
