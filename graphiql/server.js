#!/usr/bin/env node

const http = require("node:http");

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

// Pre-generated JWT token for Hasura authentication
const HASURA_JWT = process.env.HASURA_GRAPHQL_JWT || "";

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
  </style>
  <link rel="stylesheet" href="https://unpkg.com/graphiql@3/graphiql.min.css" />
</head>
<body>
  <div class="topBar">
    <strong>Yearn Indexer</strong>
    <span>Endpoint: <code>${endpoint}</code></span>
  </div>
  <div id="graphiql"></div>

  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/graphiql@3/graphiql.min.js"></script>

  <script>
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

    ReactDOM.createRoot(document.getElementById("graphiql")).render(
      React.createElement(GraphiQL, {
        fetcher: createFetcher(${JSON.stringify(endpoint)}, ${JSON.stringify(token)}),
        defaultEditorToolsVisibility: true,
      }),
    );
  </script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------
const server = http.createServer((req, res) => {
  // Health check
  if (req.url === "/healthz") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    return res.end("ok");
  }

  // Serve GraphiQL
  if (!HASURA_JWT) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    return res.end("HASURA_GRAPHQL_JWT is not set");
  }

  const html = buildHtml(HASURA_ENDPOINT, HASURA_JWT);
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  return res.end(html);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`GraphiQL server listening on http://0.0.0.0:${PORT}`);
  console.log(`Hasura endpoint: ${HASURA_ENDPOINT}`);
});
