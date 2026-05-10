import { spawnSync } from "node:child_process";
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

runPnpm(["envio", "start"]);
