#!/usr/bin/env node

import "dotenv/config";

const ROLE = process.argv[2] || "public";
// Every non-base role we manage is an inherited role deriving from `public`,
// which is the anonymous role envio grants plain SELECT on every table
// (HASURA_GRAPHQL_UNAUTHORIZED_ROLE=public in render.yaml).
const PARENT_ROLE = "public";
const HASURA_URL =
  process.env.HASURA_GRAPHQL_ENDPOINT ||
  "https://graphql-engine-3ljk.onrender.com/";
const ADMIN_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET;

if (!ADMIN_SECRET) {
  console.error("HASURA_GRAPHQL_ADMIN_SECRET is not set");
  process.exit(1);
}

const metadataUrl = `${HASURA_URL.replace(/\/v1\/metadata$/, "")}/v1/metadata`;

async function metadataRequest(body) {
  const res = await fetch(metadataUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": ADMIN_SECRET,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Hasura metadata API error (${res.status}): ${text}`);
  }
  return res.json();
}

// Grant a role plain SELECT on every tracked table. This is how the base
// `public` role gets its access — it can't be expressed as an inherited role
// (it has no parent to inherit from). envio does this itself for public on
// startup; kept here as a manual fallback.
async function grantSelectPerTable(role) {
  const metadata = await metadataRequest({ type: "export_metadata", args: {} });

  const sources = metadata.sources || [];
  const totalTables = sources.reduce((n, s) => n + (s.tables || []).length, 0);
  console.log(
    `Found ${totalTables} table(s) tracked across ${sources.length} source(s).`,
  );
  if (totalTables === 0) {
    console.error(
      "No tables are tracked in Hasura at all, so there is nothing to grant. " +
        "envio's own tracking step (which runs before this) likely failed silently — " +
        "check that HASURA_GRAPHQL_ADMIN_SECRET is identical on the graphql-engine and " +
        "envio-indexer services in Render, and that HASURA_GRAPHQL_ENDPOINT resolves " +
        "to graphql-engine's internal hostname.",
    );
    process.exitCode = 1;
    return;
  }

  const bulkArgs = [];
  for (const source of sources) {
    for (const table of source.tables || []) {
      const { schema, name } = table.table;
      const hasSelect = (table.select_permissions || []).some(
        (p) => p.role === role,
      );
      if (hasSelect) {
        console.log(`  skip ${schema}.${name} (${role} select already exists)`);
        continue;
      }
      bulkArgs.push({
        type: "pg_create_select_permission",
        args: {
          source: source.name,
          table: { schema, name },
          role,
          permission: { columns: "*", filter: {} },
        },
      });
    }
  }

  if (bulkArgs.length === 0) {
    console.log(`All tables already have ${role} select permissions.`);
    return;
  }

  console.log(`Granting ${role} SELECT on ${bulkArgs.length} tables...`);
  await metadataRequest({ type: "bulk", args: bulkArgs });
  console.log("Done.");
}

// Create a Hasura inherited role that derives all of its permissions from
// `parent` (public). This is the Hasura-native "readonly inherits public":
// a single metadata entry that automatically tracks whatever SELECT access
// public has on every table — present and future — with no per-table grants to
// replicate. envio wipes all metadata (inherited roles included) on every
// startup/reset, so this is recreated each time after tracking completes.
async function ensureInheritedRole(role, parent) {
  const metadata = await metadataRequest({ type: "export_metadata", args: {} });

  const existing = (metadata.inherited_roles || []).find(
    (r) => r.role_name === role,
  );
  if (existing) {
    const set = existing.role_set || [];
    if (set.length === 1 && set[0] === parent) {
      console.log(`Inherited role '${role}' already inherits '${parent}'.`);
      return;
    }
    // Present but pointing at the wrong parent set — drop and recreate so it
    // matches exactly.
    console.log(
      `Recreating inherited role '${role}' (was inheriting ${JSON.stringify(set)}).`,
    );
    await metadataRequest({
      type: "drop_inherited_role",
      args: { role_name: role },
    });
  }

  console.log(`Creating inherited role '${role}' inheriting from '${parent}'...`);
  await metadataRequest({
    type: "add_inherited_role",
    args: { role_name: role, role_set: [parent] },
  });
  console.log("Done.");
}

async function main() {
  if (ROLE === PARENT_ROLE) {
    await grantSelectPerTable(ROLE);
  } else {
    await ensureInheritedRole(ROLE, PARENT_ROLE);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
