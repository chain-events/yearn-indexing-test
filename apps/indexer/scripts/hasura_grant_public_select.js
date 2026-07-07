#!/usr/bin/env node

import "dotenv/config";

const ROLE = process.argv[2] || "public";
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

async function main() {
  const metadata = await metadataRequest({ type: "export_metadata", args: {} });

  const sources = metadata.sources || [];
  const totalTables = sources.reduce((n, s) => n + (s.tables || []).length, 0);
  console.log(`Found ${totalTables} table(s) tracked across ${sources.length} source(s).`);
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
    const tables = source.tables || [];
    for (const table of tables) {
      const schema = table.table.schema;
      const name = table.table.name;

      const hasPublicSelect = (table.select_permissions || []).some(
        (p) => p.role === ROLE,
      );

      if (hasPublicSelect) {
        console.log(`  skip ${schema}.${name} (${ROLE} select already exists)`);
        continue;
      }

      bulkArgs.push({
        type: "pg_create_select_permission",
        args: {
          source: source.name,
          table: { schema, name },
          role: ROLE,
          permission: {
            columns: "*",
            filter: {},
          },
        },
      });
    }
  }

  if (bulkArgs.length === 0) {
    console.log(`All tables already have ${ROLE} select permissions.`);
    return;
  }

  console.log(`Granting ${ROLE} SELECT on ${bulkArgs.length} tables...`);
  await metadataRequest({ type: "bulk", args: bulkArgs });
  console.log("Done.");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
