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

const runPnpm = (args) =>
  new Promise((resolve) => {
    const child = spawn("pnpm", args, {
      env,
      stdio: ["inherit", "pipe", "pipe"],
    });

    let output = "";
    // The incompatible-config error prints its trigger line *first* and then
    // dumps a diff of every changed entity/property — often hundreds of lines,
    // far larger than OUTPUT_TAIL_CHARS. If we only test the bounded tail after
    // the process closes, that diff has already pushed the trigger line out of
    // the window and the reset never fires (exactly the production regression
    // this guards against). Latch the match as it streams past instead: test
    // both the raw chunk (in case the whole error arrives in one write) and the
    // rolling tail (in case the trigger line spans a chunk boundary), while the
    // trigger line is still visible.
    let sawResetTrigger = false;
    const relay = (source, dest) => {
      source.on("data", (chunk) => {
        dest.write(chunk);
        const text = chunk.toString();
        output = (output + text).slice(-OUTPUT_TAIL_CHARS);
        if (!sawResetTrigger && (needsReset(text) || needsReset(output))) {
          sawResetTrigger = true;
        }
      });
    };
    relay(child.stdout, process.stdout);
    relay(child.stderr, process.stderr);

    child.on("close", (code) => resolve({ code, output, sawResetTrigger }));
  });

// Runs `pnpm <args>`; if it fails specifically because envio detected an
// incompatible config change, reruns with `resetArgs` (which wipes and
// reinitializes) instead. Any other failure just exits the process.
const runPnpmWithReset = async (args, resetArgs) => {
  const attempt = await runPnpm(args);
  if (attempt.code === 0) {
    return;
  }

  if (attempt.sawResetTrigger) {
    console.warn(
      `config.yaml (or schema.graphql) drifted from the existing indexed data — resetting the database and reindexing from scratch (\`pnpm ${resetArgs.join(" ")}\`).`,
    );
    const reset = await runPnpm(resetArgs);
    if (reset.code !== 0) {
      process.exit(reset.code ?? 1);
    }
    return;
  }

  process.exit(attempt.code ?? 1);
};

// envio wipes and rebuilds all Hasura metadata on every startup/reset (clear
// then re-track), but it only ever grants `select` to the `public` role —
// hardcoded in its own Hasura.res.mjs, with no env var to change it. Clients
// authenticated via HASURA_GRAPHQL_JWT (graphiql, apps/monitoring) are pinned
// to the `readonly` role instead (see HASURA_GRAPHQL_JWT_SECRET's claims_map),
// which Hasura doesn't even know exists after a metadata wipe, so those clients
// see a GraphQL schema missing every table. `readonly` must be recreated as an
// inherited role of `public` (see scripts/hasura_grant_public_select.js) so it
// automatically has public's select on every table.
//
// This used to be triggered by scraping envio's stdout for a "tracking done"
// log line, but that marker never reliably fired in production (envio's exact
// wording isn't guaranteed and a single miss leaves readonly broken). Instead,
// reconcile against Hasura's actual state: poll its metadata while envio runs
// and, whenever tables are tracked and `public` has been granted but the
// readonly inherited role is missing, (re)create it. This self-heals across the
// initial startup, resets (`envio start -r`), and any later metadata rebuild,
// with no dependency on log wording.
const HASURA_RECONCILE_INTERVAL_MS = 20_000;

const hasuraMetadataUrl = () => {
  const base = (env.HASURA_GRAPHQL_ENDPOINT || "").replace(/\/v1\/metadata\/?$/, "");
  return base ? `${base}/v1/metadata` : undefined;
};

// One reconciliation pass. Returns without acting (and stays quiet) whenever
// there's nothing to do, so the steady state is silent. Never throws — a
// transient Hasura/network error just means we retry on the next tick.
const reconcileReadonlyRoleOnce = async () => {
  const url = hasuraMetadataUrl();
  const secret = env.HASURA_GRAPHQL_ADMIN_SECRET;
  if (!url || !secret) return;

  let metadata;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hasura-admin-secret": secret,
      },
      body: JSON.stringify({ type: "export_metadata", args: {} }),
    });
    if (!res.ok) return;
    metadata = await res.json();
  } catch {
    return;
  }

  const sources = metadata.sources || [];
  // Only act once `public` actually has grants: envio applies them as part of
  // tracking, and add_inherited_role fails if its parent role doesn't exist
  // yet. This gate also means we wait out the brief post-clear window.
  const publicHasSelect = sources.some((s) =>
    (s.tables || []).some((t) =>
      (t.select_permissions || []).some((p) => p.role === "public"),
    ),
  );
  if (!publicHasSelect) return;

  const readonlyReady = (metadata.inherited_roles || []).some(
    (r) => r.role_name === "readonly" && (r.role_set || []).includes("public"),
  );
  if (readonlyReady) return;

  console.log(
    "readonly inherited role missing from Hasura — creating it (inherits public)...",
  );
  await new Promise((resolve) => {
    const grant = spawn(
      "node",
      ["scripts/hasura_grant_public_select.js", "readonly"],
      { env, stdio: "inherit" },
    );
    // A spawn 'error' event is otherwise an uncaught exception that would crash
    // the indexer — reconciling the readonly role must never take down envio.
    grant.on("error", (err) => {
      console.warn(
        `Failed to spawn the readonly role reconciler: ${err.message} — graphiql and the monitoring dashboard may see "field not found" errors until this succeeds; retrying.`,
      );
      resolve();
    });
    grant.on("close", (code) => {
      if (code !== 0) {
        console.warn(
          `readonly role reconciler exited ${code} — will retry on the next tick.`,
        );
      }
      resolve();
    });
  });
};

const startReadonlyRoleReconciler = () => {
  let running = false;
  const tick = async () => {
    if (running) return; // never overlap passes (a create can outlast a tick)
    running = true;
    try {
      await reconcileReadonlyRoleOnce();
    } finally {
      running = false;
    }
  };
  tick();
  // .unref() so this timer alone never keeps the process alive; `envio start`
  // is what holds it open.
  setInterval(tick, HASURA_RECONCILE_INTERVAL_MS).unref();
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

// Reconcile the readonly inherited role in the background for the whole life of
// the indexer — it survives the initial track, resets, and metadata rebuilds.
startReadonlyRoleReconciler();

await runPnpmWithReset(["envio", "start"], ["envio", "start", "-r"]);
process.exit(0);
