#!/usr/bin/env node
// One-shot recovery for DBs created by older envio (pre-`envio_addresses`,
// pre-`envio_info`) now running envio 3.0.1.
//
// Creates the two missing internal tables, backfills `envio_addresses`
// from the current config (static, registration_block=-1) and from
// `dynamic_contract_registry` (dynamic), and writes an `envio_info` row
// whose JSON matches what `getEnvioInfo()` produces at runtime so the
// resume-time compat check passes.
//
// Safe to re-run: all DDL uses IF NOT EXISTS; inserts use ON CONFLICT
// DO NOTHING. Does not touch entity tables or history tables.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { getAddress } from 'viem';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const dbUrl = process.env.DATABASE_URL || process.env.ENVIO_DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL or ENVIO_DATABASE_URL must be set');
  process.exit(1);
}
const schema = process.env.ENVIO_PG_PUBLIC_SCHEMA || 'envio';

const cfgPath = path.join(repoRoot, 'generated/internal.config.json');
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));

// Replicate Config.stripSensitiveData: drop rpcs/rpc/hypersync per chain
// across evm/fuel/svm, drop top-level isDev.
function stripSensitiveData(json) {
  const cloned = JSON.parse(JSON.stringify(json));
  for (const eco of ['evm', 'fuel', 'svm']) {
    const ecoObj = cloned[eco];
    if (ecoObj && typeof ecoObj === 'object' && ecoObj.chains && typeof ecoObj.chains === 'object') {
      for (const chain of Object.values(ecoObj.chains)) {
        if (chain && typeof chain === 'object') {
          delete chain.rpcs;
          delete chain.rpc;
          delete chain.hypersync;
        }
      }
    }
  }
  delete cloned.isDev;
  return cloned;
}

const envioInfoJson = JSON.stringify(stripSensitiveData(cfg));

// Enumerate static addresses from config (checksum format per
// addressFormat=checksum).
const staticRows = [];
const evmChains = cfg.evm?.chains || {};
for (const chain of Object.values(evmChains)) {
  const chainId = chain.id;
  const contracts = chain.contracts || {};
  for (const [contractName, c] of Object.entries(contracts)) {
    for (const a of (c.addresses || [])) {
      const checksum = getAddress(a);
      staticRows.push({
        id: `${chainId}-${checksum}`,
        chain_id: chainId,
        registration_block: -1,
        registration_log_index: -1,
        contract_name: contractName,
      });
    }
  }
}

const sql = postgres(dbUrl, { ssl: 'require', max: 1 });

try {
  console.log(`schema=${schema}`);
  console.log(`static addresses to insert: ${staticRows.length}`);

  await sql.begin(async (tx) => {
    // 1. envio_addresses
    await tx.unsafe(`
      CREATE TABLE IF NOT EXISTS "${schema}"."envio_addresses" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "chain_id" INTEGER NOT NULL,
        "registration_block" INTEGER NOT NULL,
        "registration_log_index" INTEGER NOT NULL,
        "contract_name" TEXT NOT NULL
      );
    `);

    // 2. envio_info
    await tx.unsafe(`
      CREATE TABLE IF NOT EXISTS "${schema}"."envio_info" (
        "id" INTEGER PRIMARY KEY NOT NULL DEFAULT 1,
        "config" TEXT NOT NULL
      );
    `);

    // 3. static addresses
    if (staticRows.length > 0) {
      const ids = staticRows.map((r) => r.id);
      const chainIds = staticRows.map((r) => r.chain_id);
      const contractNames = staticRows.map((r) => r.contract_name);
      await tx.unsafe(
        `INSERT INTO "${schema}"."envio_addresses"
           ("id","chain_id","registration_block","registration_log_index","contract_name")
         SELECT id, chain_id, -1, -1, contract_name
         FROM unnest($1::text[], $2::int[], $3::text[]) AS t(id, chain_id, contract_name)
         ON CONFLICT ("id") DO NOTHING;`,
        [ids, chainIds, contractNames]
      );
    }

    // 4. dynamic addresses migrated from dynamic_contract_registry
    const dynResult = await tx.unsafe(
      `INSERT INTO "${schema}"."envio_addresses"
         ("id","chain_id","registration_block","registration_log_index","contract_name")
       SELECT
         chain_id::text || '-' || contract_address,
         chain_id,
         registering_event_block_number,
         registering_event_log_index,
         contract_name
       FROM "${schema}"."dynamic_contract_registry"
       ON CONFLICT ("id") DO NOTHING
       RETURNING id;`
    );
    console.log(`dynamic addresses migrated: ${dynResult.count}`);

    // 5. envio_info row
    await tx.unsafe(
      `INSERT INTO "${schema}"."envio_info" ("id","config") VALUES (1, $1)
         ON CONFLICT ("id") DO UPDATE SET "config" = EXCLUDED."config";`,
      [envioInfoJson]
    );
  });

  const counts = await sql.unsafe(
    `SELECT
       (SELECT count(*) FROM "${schema}"."envio_addresses") AS addresses,
       (SELECT count(*) FROM "${schema}"."envio_info") AS info,
       (SELECT count(*) FROM "${schema}"."dynamic_contract_registry") AS dynamic_legacy;`
  );
  console.log('post-migration counts:', counts[0]);
  console.log('Done. Re-run the indexer.');
} catch (err) {
  console.error('Migration failed:', err);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
