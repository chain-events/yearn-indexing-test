# yearn-indexing-test

Monorepo containing the Yearn Envio indexer and its supporting services.

## Layout

```
apps/
  indexer/            # envio indexer — config.yaml, schema.graphql, src/, Dockerfile, graphiql/, ...
  monitoring/         # sync-status dashboard (envio version, % synced per chain, total events)
package.json          # monorepo root (scripts that proxy to workspaces)
pnpm-workspace.yaml   # workspace definition (apps/*)
pnpm-lock.yaml        # single lockfile for the whole monorepo
render.yaml           # Render blueprint for all services (graphql-engine, envio-indexer, graphiql, envio-monitoring)
```

## Local dev

Install everything from the root:

```sh
pnpm install
```

- **Indexer** — `pnpm indexer:dev` (or `pnpm --filter envio-indexer dev`)
- **Monitoring dashboard** — `cd apps/monitoring && cp .env.example .env && pnpm monitoring:start` then open <http://localhost:4100>

## Render deployment

The root `render.yaml` is the blueprint for:

| Service | Type | `rootDir` | Domain |
| --- | --- | --- | --- |
| `graphql-engine` | web (Hasura image) | — | `envio-gql.yearn.dev` |
| `envio-indexer` | docker worker | `apps/indexer` | — |
| `graphiql` | node web | `apps/indexer/graphiql` | `envio-explorer.yearn.dev` |
| `envio-monitoring` | node web | `apps/monitoring` | — |
