#!/usr/bin/env node

const http = require("node:http");
const crypto = require("node:crypto");

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const PORT = Number(process.env.PORT) || 4000;
// HASURA_GRAPHQL_ENDPOINT can be a full URL or just a hostname (from Render's
// RENDER_EXTERNAL_HOSTNAME). When it's a bare hostname we build the full URL.
const HASURA_ENDPOINT = (() => {
  const raw = process.env.HASURA_GRAPHQL_ENDPOINT || "http://localhost:8080/v1/graphql";
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  return `https://${raw}/v1/graphql`;
})();

const HASURA_CLAIMS_NAMESPACE = "https://hasura.io/jwt/claims";
const READONLY_ROLE = "readonly";
const TOKEN_TTL = 86400; // 24 h

const SUPPORTED_HMAC_TYPES = {
  HS256: "sha256",
  HS384: "sha384",
  HS512: "sha512",
};

// ---------------------------------------------------------------------------
// JWT helpers (same logic as scripts/generate_hasura_jwt.js)
// ---------------------------------------------------------------------------
function readJwtConfig() {
  const raw = process.env.HASURA_GRAPHQL_JWT_SECRET;
  if (!raw) throw new Error("HASURA_GRAPHQL_JWT_SECRET is not set");

  const config = JSON.parse(raw);
  if (!config.type || !SUPPORTED_HMAC_TYPES[config.type]) {
    throw new Error("Only HMAC JWT configs are supported (HS256/HS384/HS512)");
  }
  if (typeof config.key !== "string" || config.key.length === 0) {
    throw new Error("JWT secret key must be a non-empty string");
  }
  return config;
}

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

function signJwt(header, payload, key, algorithm) {
  const hdr = base64url(JSON.stringify(header));
  const pld = base64url(JSON.stringify(payload));
  const sig = crypto
    .createHmac(algorithm, key)
    .update(`${hdr}.${pld}`)
    .digest("base64url");
  return `${hdr}.${pld}.${sig}`;
}

function generateToken() {
  const config = readJwtConfig();
  const now = Math.floor(Date.now() / 1000);

  const claimsNs =
    typeof config.claims_namespace === "string" && config.claims_namespace.length > 0
      ? config.claims_namespace
      : HASURA_CLAIMS_NAMESPACE;

  const payload = {
    sub: "graphiql-explorer",
    iat: now,
    exp: now + TOKEN_TTL,
    [claimsNs]: {
      "x-hasura-default-role": READONLY_ROLE,
      "x-hasura-allowed-roles": [READONLY_ROLE],
    },
  };

  return signJwt(
    { alg: config.type, typ: "JWT" },
    payload,
    config.key,
    SUPPORTED_HMAC_TYPES[config.type],
  );
}

// ---------------------------------------------------------------------------
// HTML – GraphiQL served from CDN
// ---------------------------------------------------------------------------
function buildHtml(endpoint, token) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>GraphiQL – Yearn Indexer</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔷</text></svg>" />
  <style>
    body { height: 100vh; margin: 0; overflow: hidden; }
    #graphiql { height: 100vh; }
    .topBar {
      display: flex; align-items: center; gap: 12px;
      padding: 6px 16px;
      background: #1b1b2f; color: #e0e0e0;
      font-family: system-ui, sans-serif; font-size: 13px;
    }
    .topBar strong { color: #61dafb; }
    .topBar .refresh-btn {
      margin-left: auto; padding: 4px 12px;
      background: #61dafb; color: #1b1b2f; border: none; border-radius: 4px;
      cursor: pointer; font-size: 12px; font-weight: 600;
    }
    .topBar .refresh-btn:hover { background: #4fc3f7; }
  </style>
  <link rel="stylesheet" href="https://unpkg.com/graphiql@3/graphiql.min.css" />
</head>
<body>
  <div class="topBar">
    <strong>Yearn Indexer</strong>
    <span>Endpoint: <code>${endpoint}</code></span>
    <button class="refresh-btn" onclick="refreshToken()">Refresh JWT</button>
  </div>
  <div id="graphiql"></div>

  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/graphiql@3/graphiql.min.js"></script>

  <script>
    let currentToken = ${JSON.stringify(token)};

    function createFetcher(endpoint, token) {
      return function graphQLFetcher(graphQLParams) {
        return fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token,
          },
          body: JSON.stringify(graphQLParams),
        }).then(function (response) { return response.json(); });
      };
    }

    function renderGraphiQL() {
      const root = ReactDOM.createRoot(document.getElementById("graphiql"));
      root.render(
        React.createElement(GraphiQL, {
          fetcher: createFetcher(${JSON.stringify(endpoint)}, currentToken),
          defaultEditorToolsVisibility: true,
        }),
      );
    }

    async function refreshToken() {
      try {
        const res = await fetch("/token");
        const data = await res.json();
        currentToken = data.token;
        renderGraphiQL();
      } catch (err) {
        console.error("Failed to refresh token", err);
      }
    }

    renderGraphiQL();
  </script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------
const server = http.createServer((req, res) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    return res.end();
  }

  // Token endpoint – returns a fresh JWT
  if (req.url === "/token" && req.method === "GET") {
    try {
      const token = generateToken();
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ token }));
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  // Health check
  if (req.url === "/healthz") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    return res.end("ok");
  }

  // Serve GraphiQL
  try {
    const token = generateToken();
    const html = buildHtml(HASURA_ENDPOINT, token);
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(html);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    return res.end(`Failed to generate JWT: ${err.message}`);
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`GraphiQL server listening on http://0.0.0.0:${PORT}`);
  console.log(`Hasura endpoint: ${HASURA_ENDPOINT}`);
});
