
CREATE INDEX CONCURRENTLY IF NOT EXISTS deposit_chainid_transactionhash_idx
ON "envio"."Deposit" ("chainId", "transactionHash");

CREATE INDEX CONCURRENTLY IF NOT EXISTS withdraw_chainid_transactionhash_idx
ON "envio"."Withdraw" ("chainId", "transactionHash");

CREATE INDEX CONCURRENTLY IF NOT EXISTS transfer_chainid_transactionhash_idx
ON "envio"."Transfer" ("chainId", "transactionHash");

CREATE INDEX CONCURRENTLY IF NOT EXISTS v2deposit_chainid_transactionhash_idx
ON "envio"."V2Deposit" ("chainId", "transactionHash");

CREATE INDEX CONCURRENTLY IF NOT EXISTS v2withdraw_chainid_transactionhash_idx
ON "envio"."V2Withdraw" ("chainId", "transactionHash");

CREATE INDEX CONCURRENTLY IF NOT EXISTS deposit_transactionfrom_idx
ON "envio"."Deposit" ("transactionFrom");

CREATE INDEX CONCURRENTLY IF NOT EXISTS withdraw_transactionfrom_idx
ON "envio"."Withdraw" ("transactionFrom");

CREATE INDEX CONCURRENTLY IF NOT EXISTS transfer_transactionfrom_idx
ON "envio"."Transfer" ("transactionFrom");

CREATE INDEX CONCURRENTLY IF NOT EXISTS v2deposit_transactionfrom_idx
ON "envio"."V2Deposit" ("transactionFrom");

CREATE INDEX CONCURRENTLY IF NOT EXISTS v2withdraw_transactionfrom_idx
ON "envio"."V2Withdraw" ("transactionFrom");
