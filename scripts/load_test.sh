#!/usr/bin/env bash
# Load test for Hasura GraphQL endpoints
# Measures query latency at increasing concurrency levels
#
# Usage:
#   Self-hosted:  HASURA_ENDPOINT=https://your-hasura.onrender.com HASURA_ADMIN_SECRET=secret ./scripts/load_test.sh
#   Hosted Envio: HASURA_ENDPOINT=https://indexer.hyperindex.xyz/3fec0a4/v1/graphql ./scripts/load_test.sh
#
# Requires: ab (Apache Bench) — pre-installed on macOS

set -euo pipefail

ENDPOINT="${HASURA_ENDPOINT:?Set HASURA_ENDPOINT}"
ADMIN_SECRET="${HASURA_ADMIN_SECRET:-}"
REQUESTS_PER_LEVEL="${REQUESTS_PER_LEVEL:-100}"
OUTPUT_DIR="benchmark-results/load-test"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_FILE="${OUTPUT_DIR}/load_test_${TIMESTAMP}.csv"

# Auto-append /v1/graphql if not present
if [[ "$ENDPOINT" != */v1/graphql ]]; then
  ENDPOINT="${ENDPOINT%/}/v1/graphql"
fi

mkdir -p "$OUTPUT_DIR"

# Concurrency levels to test
CONCURRENCY_LEVELS=(1 5 10 25 50)

# Queries to test — one simple, one filtered
# Hosted (no admin secret) uses unprefixed tables, self-hosted uses envio_ prefix
# Hosted schema may differ in available fields — use only fields confirmed in prod_benchmark.sh
declare -A QUERIES
if [[ -n "$ADMIN_SECRET" ]]; then
  # Self-hosted: envio_ prefix
  QUERIES[simple_lookup]='{"query":"{ envio_Deposit(limit: 10) { id sender assets shares } }"}'
  QUERIES[filtered_sorted]='{"query":"{ envio_Deposit(limit: 50, order_by: { blockTimestamp: desc }, where: { chainId: { _eq: 1 } }) { id sender assets shares blockTimestamp } }"}'
else
  # Hosted: no prefix, use fields matching prod_benchmark.sh
  QUERIES[simple_lookup]='{"query":"{ Deposit(limit: 10) { id sender assets shares } }"}'
  QUERIES[filtered_sorted]='{"query":"{ Deposit(limit: 50, order_by: { blockTimestamp: desc }, where: { chainId: { _eq: 1 } }) { id sender assets shares blockTimestamp } }"}'
fi

# Build auth header
AUTH_HEADER=""
if [[ -n "$ADMIN_SECRET" ]]; then
  AUTH_HEADER="-H 'x-hasura-admin-secret: ${ADMIN_SECRET}'"
fi

echo "Load Test Configuration"
echo "======================"
echo "Endpoint:       $ENDPOINT"
echo "Auth:           $([ -n "$ADMIN_SECRET" ] && echo "admin secret" || echo "none (hosted)")"
echo "Requests/level: $REQUESTS_PER_LEVEL"
echo "Concurrency:    ${CONCURRENCY_LEVELS[*]}"
echo "Output:         $OUTPUT_FILE"
echo ""

# CSV header
echo "query,concurrency,requests,failed,rps,mean_ms,p50_ms,p95_ms,p99_ms,min_ms,max_ms" > "$OUTPUT_FILE"

for query_name in "${!QUERIES[@]}"; do
  query_body="${QUERIES[$query_name]}"

  # Write query body to temp file for ab
  TMPFILE=$(mktemp /tmp/load_test_XXXXXXXXXXXX.json)
  echo "$query_body" > "$TMPFILE"

  for concurrency in "${CONCURRENCY_LEVELS[@]}"; do
    # Don't run more concurrent than total requests
    actual_requests=$REQUESTS_PER_LEVEL
    if (( concurrency > actual_requests )); then
      actual_requests=$concurrency
    fi

    echo "Running: ${query_name} @ concurrency=${concurrency} (${actual_requests} requests)..."

    # Build ab command
    ab_cmd="ab -n ${actual_requests} -c ${concurrency} -p '${TMPFILE}' -T 'application/json'"
    if [[ -n "$ADMIN_SECRET" ]]; then
      ab_cmd="${ab_cmd} -H 'x-hasura-admin-secret: ${ADMIN_SECRET}'"
    fi
    ab_cmd="${ab_cmd} '${ENDPOINT}'"

    # Run ab and capture output
    ab_output=$(eval "$ab_cmd" 2>&1) || true

    # Parse ab output
    failed=$(echo "$ab_output" | grep "Failed requests:" | awk '{print $3}' || echo "0")
    rps=$(echo "$ab_output" | grep "Requests per second:" | awk '{print $4}' || echo "0")
    mean_ms=$(echo "$ab_output" | grep "Time per request:.*\(mean\)" | head -1 | awk '{print $4}' || echo "0")
    min_ms=$(echo "$ab_output" | grep -A1 "Total:" | tail -1 | awk '{print $2}' || echo "0")
    max_ms=$(echo "$ab_output" | grep -A1 "Total:" | tail -1 | awk '{print $NF}' || echo "0")

    # Parse percentiles from ab output
    p50_ms=$(echo "$ab_output" | grep "50%" | awk '{print $2}' || echo "0")
    p95_ms=$(echo "$ab_output" | grep "95%" | awk '{print $2}' || echo "0")
    p99_ms=$(echo "$ab_output" | grep "99%" | awk '{print $2}' || echo "0")

    echo "  → RPS: ${rps}, Mean: ${mean_ms}ms, p50: ${p50_ms}ms, p95: ${p95_ms}ms, Failed: ${failed}"

    echo "${query_name},${concurrency},${actual_requests},${failed},${rps},${mean_ms},${p50_ms},${p95_ms},${p99_ms},${min_ms},${max_ms}" >> "$OUTPUT_FILE"
  done

  rm -f "$TMPFILE"
  echo ""
done

echo "Results saved to: $OUTPUT_FILE"
echo ""
echo "Summary"
echo "======="
column -t -s',' "$OUTPUT_FILE"
