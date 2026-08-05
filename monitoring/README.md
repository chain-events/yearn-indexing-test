# envio-monitoring

Dashboard for the Envio **cloud** GraphQL instance (HyperIndex). Also works with a local or self-hosted Hasura endpoint via legacy env aliases.

Shows:

- **Envio version** — read from the indexer project (`generated/persisted_state.envio.json`, falling back to `package.json`)
- **Live readiness per chain** — computed from `chain_metadata.latest_processed_block` against an independent RPC head (or an explicit Envio `end_block`)
- **Total events processed** — summed from `chain_metadata.num_events_processed`

## Setup

```sh
cp .env.example .env
# Set ENVIO_PASSWORD to the cloud GraphQL Bearer token (same as root fee scripts).
# Or rely on the parent repo `.env` — this package also loads `../.env`.
node server.js
# or: npm start
```

Open <http://localhost:4100>. The page auto-refreshes every 5 seconds.

`/livez` is process liveness: it does not depend on GraphQL, RPC, or indexed data.
`/healthz` is the vault-event semantic canary and may return 503 when canary data is stale.
`/readyz` reports current per-chain sync readiness and returns 503 with every behind or unknown chain.
`/api/status` returns the full JSON used by the dashboard UI.

## Env vars

| Var | Default | Purpose |
| --- | --- | --- |
| `ENVIO_GRAPHQL_URL` | `https://indexer.hyperindex.xyz/3fec0a4/v1/graphql` | Cloud HyperIndex GraphQL endpoint (built-in default) |
| `ENVIO_PASSWORD` | — | Bearer token for cloud GraphQL (`Authorization: Bearer …`) |
| `GRAPHQL_URL` | — | Legacy full URL fallback when `ENVIO_GRAPHQL_URL` is unset |
| `GRAPHQL_BEARER_TOKEN` / `HASURA_GRAPHQL_JWT` | — | Legacy Bearer aliases when `ENVIO_PASSWORD` is unset |
| `GRAPHQL_HOST` | — | Bare hostname → `http://$GRAPHQL_HOST:8080/v1/graphql` (old Render wiring) |
| `INDEXER_PROJECT_PATH` | `..` | Path to the indexer project (reads envio version); default is repo root |
| `PORT` | `4100` | Dashboard port |
| `SYNC_BLOCK_TOLERANCE` | `2` | A chain is `caught_up` only when within this many blocks of its RPC/end-block target |
| `HEALTH_MAX_DATA_AGE_DAYS` | `30` | Max age (days) of newest deposit/withdraw for `/healthz` canaries |

## How sync % is computed

For each chain in `chain_metadata`, the API exposes `rpcHead`, `metadataHead`,
`targetBlock`, `headSource`, and `observedAt`. For an open-ended chain, an RPC
head is required; an unavailable RPC makes its status `unknown` rather than
falling back to Envio metadata. An explicit `end_block` remains a valid target
even if that RPC is unavailable.

```
percent = (latest_processed_block - first_event_block_number)
        / ((end_block ?? rpc_head) - first_event_block_number)
```

`caught_up` and 100% are assigned only when the current target is within
`SYNC_BLOCK_TOLERANCE`. `timestamp_caught_up_to_head_or_endblock` is returned
only as historical `metadataCaughtUpAt`; it never changes current readiness.

## Tests

```sh
npm test
# or: node --test
```
