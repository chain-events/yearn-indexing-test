## Yearn V3 Vault Indexer (and Timelocks too)

This repository contains an Envio indexer for Yearn V3 vaults and a fee calculator script to analyze depositor positions. Timelock contracts have also been added to reduce dependency on Tenderly alert monitoring (and reduce Tenderly RPC consumption/costs).

*Please refer to the [documentation website](https://docs.envio.dev) for a thorough guide on all [Envio](https://envio.dev) indexer features*

### Debugging

1. Start docker desktop
2. Run `ps auxf | grep docker-proxy` and then `sudo kill 1234` to manually kill the processes with docker-proxy
3. Stop and remove the current docker containers
```
docker stop generated-graphql-engine-1 generated-envio-postgres-1
docker rm generated-graphql-engine-1 generated-envio-postgres-1
```
4. Now run envio with `pnpm dev`

### Pre-requisites

- [Node.js (use v18 or newer)](https://nodejs.org/en/download/current)
- [pnpm (use v8 or newer)](https://pnpm.io/installation)
- [Docker desktop](https://www.docker.com/products/docker-desktop/)

### Setup

```bash
# Install dependencies
pnpm install
```

### Run the Indexer

```bash
pnpm dev
```

Visit http://localhost:8080 to see the GraphQL Playground, local password is `testing`.

### Environment Variables

Copy `.env.example` to `.env` and fill in values as needed:

- `ENVIO_GRAPHQL_URL`, `ENVIO_PASSWORD`
- `ENVIO_PG_SSL_MODE=false` for local Docker or Render internal Postgres
- `HASURA_GRAPHQL_ROLE=admin`
- `ENVIO_THROTTLE_CHAIN_METADATA_INTERVAL_MILLIS=500`
- `ENVIO_THROTTLE_PRUNE_STALE_DATA_INTERVAL_MILLIS=30000`
- `ENVIO_THROTTLE_LIVE_METRICS_BENCHMARK_INTERVAL_MILLIS=1000`
- `ENVIO_THROTTLE_JSON_FILE_BENCHMARK_INTERVAL_MILLIS=500`
- `RPC_URL` (global override), or chain-specific `RPC_URL_ETHEREUM`, `RPC_URL_BASE`, `RPC_URL_ARBITRUM`, `RPC_URL_POLYGON`

### Render

`render.yaml` now sets the Envio runtime vars that recent Envio versions require in production mode. The indexer also derives `HASURA_GRAPHQL_ENDPOINT` from `HASURA_SERVICE_HOST` and `HASURA_SERVICE_PORT`, so you should not need a manual post-deploy override in Render anymore. The only secrets you still need to provide in the Render dashboard are:

The indexer start script derives `ENVIO_PG_*` from Render's `DATABASE_URL`, runs `envio local db-migrate up`, then runs `envio start` in the same environment. This keeps Envio's entity and history tables in sync with `schema.graphql` before rollback/reorg handling can touch them.

- `ENVIO_API_TOKEN`
- `HASURA_GRAPHQL_ADMIN_SECRET`
- `HASURA_GRAPHQL_JWT_SECRET`

For `HASURA_GRAPHQL_JWT_SECRET`, use a JSON value that pins all JWT-authenticated traffic to the `readonly` Hasura role:

```json
{"type":"HS256","key":"<random-secret>","claims_namespace":"https://hasura.io/jwt/claims","claims_format":"json","claims_map":{"x-hasura-default-role":{"value":"readonly"},"x-hasura-allowed-roles":{"value":["readonly"]}}}
```

Generate the `key` value with:

```bash
openssl rand -base64 32
```

Keep this value in Render as a secret env var and do not commit it to the repository.

### Generate Hasura JWTs

This repo includes a helper that reads `HASURA_GRAPHQL_JWT_SECRET` and generates a signed JWT. It always emits Hasura claims with the `readonly` role.

```bash
HASURA_GRAPHQL_JWT_SECRET='{"type":"HS256","key":"<random-secret>","claims_namespace":"https://hasura.io/jwt/claims","claims_format":"json","claims_map":{"x-hasura-default-role":{"value":"readonly"},"x-hasura-allowed-roles":{"value":["readonly"]}}}' \
pnpm jwt:generate --sub user-123 --ttl 3600 --user-id user-123
```

### Calculate Depositor Fees

Once the indexer is running, use the Python calculator to analyze any depositor:

```bash
python3 scripts/calc_depositor_fees.py <depositor-address>
```

**Example:**
```bash
python3 scripts/calc_depositor_fees.py 0x93A62dA5a14C80f265DAbC077fCEE437B1a0Efde
```

The script now validates that the performance fee stays constant across the depositor's entire history and that the management fee remains zero. It samples five even-spaced blocks between the first and last event, checks the fee configuration via the accountant contract, and stops with a clear error if anything changed so you can trust the rest of the calculation.

**Output includes:**
- Complete list of deposits, withdrawals, and transfers
- Current position (shares and value)
- Total profit/loss to date
- Estimated fees paid
- Complete event timeline
- Debugging information for fee calculation verification

**Environment Variables:**
- `ENVIO_GRAPHQL_URL` - GraphQL endpoint (default: `http://localhost:8080/v1/graphql`)
- `ENVIO_PASSWORD` - GraphQL password (default: `testing`)
- `RPC_URL` - Ethereum RPC endpoint for current state queries (default: `https://eth.merkle.io`)

### Generate files from `config.yaml` or `schema.graphql`

```bash
pnpm codegen
```
