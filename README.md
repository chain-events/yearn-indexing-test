## Yearn V3 Vault Indexer

This repository contains an Envio indexer for Yearn V3 vaults and a fee calculator script to analyze depositor positions.

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

### Calculate Depositor Fees

Once the indexer is running, you can calculate fees and profit for any depositor:

```bash
# Using pnpm script
pnpm calc-fees <depositor-address>

# Or directly with tsx
tsx src/calculate-depositor-fees.ts <depositor-address>
```

**Example:**
```bash
pnpm calc-fees 0x1234567890123456789012345678901234567890
```

**Output includes:**
- Complete list of deposits, withdrawals, and transfers
- Current position (shares and value)
- Total profit/loss to date
- Estimated fees paid
- Complete event timeline
- Debugging information for fee calculation verification

**Environment Variables:**
- `ENVIO_GRAPHQL_URL` - GraphQL endpoint (default: `http://localhost:8080/graphql`)
- `ENVIO_PASSWORD` - GraphQL password (default: `testing`)
- `RPC_URL` - Ethereum RPC endpoint for current state queries (default: `https://eth.merkle.io`)

### Generate files from `config.yaml` or `schema.graphql`

```bash
pnpm codegen
```
