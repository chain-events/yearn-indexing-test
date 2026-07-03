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

const runPnpm = (args) => {
  const result = spawnSync("pnpm", args, {
    env,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

runPnpm(["envio", "local", "db-migrate", "up"]);

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

// Envio refuses to resume when config.yaml/schema.graphql changed in a way
// that's incompatible with already-indexed data (e.g. a new contract/event,
// not just an address-list tweak — see patches/envio@3.0.1.patch). Normally
// that just crashes the process forever until someone manually reruns with
// `-r`. Detect that specific failure and reset automatically instead.
const INCOMPATIBLE_CONFIG_MARKER =
  "config changes are incompatible with the existing indexer data";

const runEnvioStart = (extraArgs) =>
  new Promise((resolve) => {
    const child = spawn("pnpm", ["envio", "start", ...extraArgs], {
      env,
      stdio: ["inherit", "pipe", "pipe"],
    });

    let output = "";
    const relay = (source, dest) => {
      source.on("data", (chunk) => {
        output += chunk;
        dest.write(chunk);
      });
    };
    relay(child.stdout, process.stdout);
    relay(child.stderr, process.stderr);

    child.on("close", (code) => resolve({ code, output }));
  });

const attempt = await runEnvioStart([]);

if (attempt.code === 0) {
  process.exit(0);
}

if (attempt.output.includes(INCOMPATIBLE_CONFIG_MARKER)) {
  console.warn(
    "config.yaml (or schema.graphql) changed incompatibly with the existing indexed data — resetting the database and reindexing from scratch (`envio start -r`).",
  );
  const reset = await runEnvioStart(["-r"]);
  process.exit(reset.code ?? 1);
}

process.exit(attempt.code ?? 1);
