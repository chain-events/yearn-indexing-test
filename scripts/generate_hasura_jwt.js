#!/usr/bin/env node

const crypto = require("crypto");

const HASURA_CLAIMS_NAMESPACE = "https://hasura.io/jwt/claims";
const READONLY_ROLE = "readonly";
const SUPPORTED_HMAC_TYPES = {
  HS256: "sha256",
  HS384: "sha384",
  HS512: "sha512",
};

function usage() {
  console.error(
    [
      "Usage:",
      "  pnpm jwt:generate --sub <subject> [--ttl <seconds>] [--user-id <id>] [--issuer <iss>] [--audience <aud>] [--extra '{\"foo\":\"bar\"}']",
      "",
      "Notes:",
      "  - Reads HASURA_GRAPHQL_JWT_SECRET from the environment",
      `  - Always emits Hasura claims with x-hasura-default-role=${READONLY_ROLE}`,
      `  - Always emits Hasura claims with x-hasura-allowed-roles=[\"${READONLY_ROLE}\"]`,
      "  - Supports HMAC JWT configs only (HS256/HS384/HS512)",
    ].join("\n"),
  );
}

function parseArgs(argv) {
  const options = {
    ttl: 3600,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (!arg.startsWith("--")) {
      throw new Error(`Unexpected argument: ${arg}`);
    }

    const key = arg.slice(2);
    const value = argv[i + 1];
    if (value == null || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }

    options[key] = value;
    i += 1;
  }

  return options;
}

function readJwtConfig() {
  const rawConfig = process.env.HASURA_GRAPHQL_JWT_SECRET;
  if (!rawConfig) {
    throw new Error("HASURA_GRAPHQL_JWT_SECRET is not set");
  }

  let config;
  try {
    config = JSON.parse(rawConfig);
  } catch (error) {
    throw new Error("HASURA_GRAPHQL_JWT_SECRET must be valid JSON");
  }

  if (Array.isArray(config)) {
    throw new Error("HASURA_GRAPHQL_JWT_SECRET must be a single JWT config object");
  }

  if (!config.type || !SUPPORTED_HMAC_TYPES[config.type]) {
    throw new Error(
      "Only HMAC JWT configs are supported by this generator (type must be HS256, HS384, or HS512)",
    );
  }

  if (typeof config.key !== "string" || config.key.length === 0) {
    throw new Error("HASURA_GRAPHQL_JWT_SECRET.key must be a non-empty string");
  }

  return config;
}

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

function signJwt(header, payload, key, algorithm) {
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac(algorithm, key)
    .update(signingInput)
    .digest("base64url");

  return `${signingInput}.${signature}`;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    usage();
    process.exit(0);
  }

  const config = readJwtConfig();
  const now = Math.floor(Date.now() / 1000);
  const ttl = Number(options.ttl);

  if (!Number.isFinite(ttl) || ttl <= 0) {
    throw new Error("--ttl must be a positive number of seconds");
  }

  let extraClaims = {};
  if (options.extra) {
    try {
      extraClaims = JSON.parse(options.extra);
    } catch (error) {
      throw new Error("--extra must be valid JSON");
    }
  }

  const claimsNamespace =
    typeof config.claims_namespace === "string" && config.claims_namespace.length > 0
      ? config.claims_namespace
      : HASURA_CLAIMS_NAMESPACE;

  const payload = {
    sub: options.sub || "readonly-user",
    iat: now,
    exp: now + ttl,
    ...extraClaims,
    [claimsNamespace]: {
      "x-hasura-default-role": READONLY_ROLE,
      "x-hasura-allowed-roles": [READONLY_ROLE],
      ...(options["user-id"] ? { "x-hasura-user-id": options["user-id"] } : {}),
    },
  };

  if (options.issuer) {
    payload.iss = options.issuer;
  }

  if (options.audience) {
    payload.aud = options.audience;
  }

  const token = signJwt(
    { alg: config.type, typ: "JWT" },
    payload,
    config.key,
    SUPPORTED_HMAC_TYPES[config.type],
  );

  process.stdout.write(`${token}\n`);
}

try {
  main();
} catch (error) {
  console.error(`generate_hasura_jwt: ${error.message}`);
  usage();
  process.exit(1);
}
