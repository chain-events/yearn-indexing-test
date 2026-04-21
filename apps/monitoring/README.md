# envio-monitoring

Minimal dashboard for a self-hosted Envio indexer. Shows:

- **Envio version** — read from the indexer project (`generated/persisted_state.envio.json`, falling back to `package.json`)
- **% synced per chain** — computed from `chain_metadata.latest_processed_block` vs `block_height`
- **Total events processed** — summed from `chain_metadata.num_events_processed`

## Setup

```sh
cp .env.example .env
# Generate a JWT with the readonly role and drop it in HASURA_GRAPHQL_JWT:
(cd ../indexer && pnpm jwt:generate)
node server.js
```

Open <http://localhost:4100>. The page auto-refreshes every 5 seconds.

## Env vars

| Var | Default | Purpose |
| --- | --- | --- |
| `GRAPHQL_URL` | `https://envio-gql.yearn.dev/v1/graphql` | Hasura endpoint in front of the indexer DB |
| `HASURA_GRAPHQL_JWT` | — | Bearer token (signed JWT). Sent as `Authorization: Bearer <token>`. Requires `chain_metadata` select permission on the role the JWT resolves to (`readonly` by default). |
| `GRAPHQL_BEARER_TOKEN` | — | Alias for `HASURA_GRAPHQL_JWT` |
| `GRAPHQL_HOST` | — | Alternative to `GRAPHQL_URL`; bare hostname combined with `:8080/v1/graphql` (used by Render's `fromService` wiring) |
| `INDEXER_PROJECT_PATH` | `../indexer` | Path to the indexer app (used to read the envio version) |
| `PORT` | `4100` | Dashboard port |

## How sync % is computed

For each chain in `chain_metadata`:

```
percent = (latest_processed_block - first_event_block_number)
        / ((end_block ?? block_height) - first_event_block_number)
```

If `timestamp_caught_up_to_head_or_endblock` is set, the chain is reported as 100% / "caught up" regardless.
