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
render.staging.yaml   # isolated Render staging stack, continuously deployed from main
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

| Service | Type | Domain |
| --- | --- | --- |
| `graphql-engine` | web (Hasura image) | `envio-gql.yearn.dev` |
| `envio-indexer` | docker worker | — |
| `graphiql` | node web | `envio-explorer.yearn.dev` |
| `envio-monitoring` | node web | `envio-monitoring.yearn.dev` |

## Render staging

`render.staging.yaml` defines a separate `staging` Render environment containing
its own Postgres database, Hasura, one Envio worker, GraphiQL, and monitoring
dashboard. The Git-backed services follow `main` with
`autoDeployTrigger: commit`, so every main commit is deployed without touching
production or resetting production data. Staging keeps its database between
deploys and performs its own full historical indexing.

Create it once as a separate Render Blueprint:

1. Merge the staging Blueprint to `main`.
2. In Render, create a Blueprint for this repository and set **Blueprint file**
   to `render.staging.yaml`.
3. Keep its linked branch as `main` and assign/review the generated
   `envio-indexer-staging / Staging` project environment.
4. Fill every secret placeholder. Use staging-specific Hasura secrets and the
   `envio-staging-*` environment groups; do not reuse production database
   credentials.
5. Generate the shared read-only bearer token from the staging
   `HASURA_GRAPHQL_JWT_SECRET` and set it as `HASURA_GRAPHQL_JWT` in the
   `envio-staging-readonly-jwt` group:

   ```sh
   HASURA_GRAPHQL_JWT_SECRET='<staging JWT config JSON>' \
     pnpm --filter envio-indexer jwt:generate --sub staging --ttl none
   ```

6. Apply the Blueprint. Render-provided service URLs are used until dedicated
   staging domains are configured.

The staging Blueprint intentionally uses paid capacity (`standard` for the
indexer, `starter` for web services, and `basic-1gb` for Postgres) because a
full eight-chain historical backfill is not a free-tier workload. Review the
estimated monthly cost in Render before applying it.

The first staging deployment starts from an empty staging database. Subsequent
main deployments resume that staging database unless an incompatible Envio
configuration change intentionally triggers the existing automatic reset path.
