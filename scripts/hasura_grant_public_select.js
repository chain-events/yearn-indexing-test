#!/usr/bin/env node

const dotenv = require("dotenv");
dotenv.config();

const ROLE = process.argv[2] || "public";
const HASURA_URL = process.env.HASURA_GRAPHQL_ENDPOINT || "https://graphql-engine-dxp4.onrender.com";
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
    console.log("All tables already have public select permissions.");
    return;
  }

  console.log(`Granting public SELECT on ${bulkArgs.length} tables...`);
  await metadataRequest({ type: "bulk", args: bulkArgs });
  console.log("Done.");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
