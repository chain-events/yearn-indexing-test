FROM node:24.3.0-slim

# --no-install-recommends keeps the image smaller by avoiding extra dependencies.
# rm -rf /var/lib/apt/lists/* cleans up cached package lists to reduce image size.
# psql is needed for dumping and restoring the initial effects cache.
RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates postgresql-client && \
    rm -rf /var/lib/apt/lists/*

# Point Rust/native TLS to the system CA bundle
ENV SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt
ENV SSL_CERT_DIR=/etc/ssl/certs

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@9.7.1

# Build context is the monorepo root (see render.yaml: no rootDir on envio-indexer).
WORKDIR /repo

# Copy workspace manifests + lockfile first so the install layer stays cached
# across code-only changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/indexer/package.json ./apps/indexer/package.json
COPY apps/monitoring/package.json ./apps/monitoring/package.json

# Install only the indexer's dependency closure.
RUN pnpm install --frozen-lockfile --filter envio-indexer...

# Copy the full indexer source (generated/ is excluded via .dockerignore so
# the container's codegen output is authoritative).
COPY apps/indexer ./apps/indexer

WORKDIR /repo/apps/indexer

# Codegen parses config.yaml, schema.graphql, and the event handler source to
# produce generated/src/Index.res.mjs (the start entry point). It doesn't
# connect, so a placeholder RPC URL is fine at build time.
ARG ENVIO_RPC_URL_KATANA=http://placeholder
RUN ENVIO_RPC_URL_KATANA=${ENVIO_RPC_URL_KATANA} pnpm envio codegen

CMD ["pnpm", "start"]
