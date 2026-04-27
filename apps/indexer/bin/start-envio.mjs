import { spawnSync } from "node:child_process";

const env = { ...process.env };

if (env.DATABASE_URL) {
  const url = new URL(env.DATABASE_URL);
  env.ENVIO_PG_HOST = url.hostname;
  env.ENVIO_PG_PORT = url.port || "5432";
  env.ENVIO_PG_USER = decodeURIComponent(url.username);
  env.ENVIO_PG_PASSWORD = decodeURIComponent(url.password);
  env.ENVIO_PG_DATABASE = decodeURIComponent(url.pathname.replace(/^\//, ""));
}

for (const key of [
  "ENVIO_PG_HOST",
  "ENVIO_PG_PORT",
  "ENVIO_PG_USER",
  "ENVIO_PG_PASSWORD",
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

for (const args of [
  ["envio", "local", "db-migrate", "up"],
  ["envio", "start"],
]) {
  const result = spawnSync("pnpm", args, {
    env,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
