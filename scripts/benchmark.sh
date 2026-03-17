#!/bin/bash
# Benchmark script — run this while the indexer is syncing
# Usage: ./scripts/benchmark.sh <hasura-url> <admin-secret>
#
# Collects:
#   1. Sync progress over time (events indexed, blocks processed)
#   2. Query latency samples
#   3. Resource usage snapshots (if running locally with docker)
#
# Output: benchmark-results/ directory with timestamped CSVs

set -euo pipefail

HASURA_BASE="${1:?Usage: $0 <hasura-base-url> <admin-secret>}"
ADMIN_SECRET="${2:?Usage: $0 <hasura-base-url> <admin-secret>}"
# Strip trailing slash and ensure /v1/graphql suffix
HASURA_BASE="${HASURA_BASE%/}"
HASURA_URL="${HASURA_BASE%/v1/graphql}/v1/graphql"
RESULTS_DIR="benchmark-results"
mkdir -p "$RESULTS_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SYNC_LOG="$RESULTS_DIR/sync_progress_${TIMESTAMP}.csv"
QUERY_LOG="$RESULTS_DIR/query_latency_${TIMESTAMP}.csv"

# Headers
echo "timestamp,chain_id,block_number,events_count" > "$SYNC_LOG"
echo "timestamp,query_name,latency_ms,status" > "$QUERY_LOG"

graphql_query() {
  local query="$1"
  curl -s \
    -X POST "$HASURA_URL" \
    -H "Content-Type: application/json" \
    -H "X-Hasura-Admin-Secret: $ADMIN_SECRET" \
    -d "{\"query\": \"$query\"}"
}

timed_query() {
  local name="$1"
  local query="$2"
  local start_ms=$(python3 -c 'import time; print(int(time.time()*1000))')
  local response
  response=$(graphql_query "$query" 2>/dev/null) || true
  local end_ms=$(python3 -c 'import time; print(int(time.time()*1000))')
  local latency=$((end_ms - start_ms))
  local status="ok"
  if echo "$response" | grep -q '"errors"'; then
    status="error"
  fi
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ),$name,${latency},$status" >> "$QUERY_LOG"
  echo "  $name: ${latency}ms ($status)"
}

echo "=== Benchmark started at $(date -u) ==="
echo "Results in: $RESULTS_DIR/"
echo ""

# ---------- Sync progress polling ----------
poll_sync_progress() {
  echo "--- Sync progress snapshot ---"
  # Get chain metadata (adjust table name if different)
  local result
  result=$(graphql_query "{ envio_chain_metadata { chain_id first_event_block_number latest_processed_block num_events_processed } }" 2>/dev/null) || true

  if jq -e '.data.envio_chain_metadata' <<< "$result" > /dev/null 2>&1; then
    echo "$result" | jq -r '.data.envio_chain_metadata[] | [.chain_id, .latest_processed_block, .num_events_processed] | @csv' | while IFS= read -r line; do
      echo "$(date -u +%Y-%m-%dT%H:%M:%SZ),$line" >> "$SYNC_LOG"
    done
    echo "$result" | jq -r '.data.envio_chain_metadata[] | "  Chain \(.chain_id): block \(.latest_processed_block), \(.num_events_processed) events"'
  else
    echo "  (chain_metadata not available yet or query failed)"
  fi
}

# ---------- Query latency benchmarks ----------
run_query_benchmarks() {
  echo "--- Query latency samples ---"

  # Simple lookup - single vault events
  timed_query "single_vault_events" \
    "{ envio_Deposit(limit: 10) { id sender assets shares } }"

  # Filtered list - deposits above threshold
  timed_query "filtered_deposits" \
    "{ envio_Deposit(limit: 50, order_by: {assets: desc}) { id sender owner assets shares } }"

  # Cross-entity - strategy reports
  timed_query "strategy_reports" \
    "{ envio_StrategyReported(limit: 20, order_by: {blockTimestamp: desc}) { id strategy gain loss current_debt } }"

  # Transfer lookups
  timed_query "recent_transfers" \
    "{ envio_Transfer(limit: 50, order_by: {blockTimestamp: desc}) { id sender receiver value } }"

  # Aggregate count
  timed_query "event_count" \
    "{ envio_Deposit_aggregate { aggregate { count } } }"

  # Referral deposits
  timed_query "referral_deposits" \
    "{ envio_ReferralDeposit(limit: 20) { id receiver referrer vault assets shares } }"
}

# ---------- Database size ----------
check_db_size() {
  echo "--- Database size ---"
  # This runs via Hasura's run_sql if enabled, otherwise skip
  local result
  # Try v2 API first (Hasura v2.x), then v1 fallback
  for api_path in "/v2/query" "/v1/query"; do
    result=$(curl -s -X POST "${HASURA_URL%/v1/graphql}${api_path}" \
      -H "Content-Type: application/json" \
      -H "X-Hasura-Admin-Secret: $ADMIN_SECRET" \
      -d '{"type":"run_sql","args":{"source":"default","sql":"SELECT pg_size_pretty(pg_database_size(current_database())) as db_size;"}}' 2>/dev/null) || true

    if echo "$result" | grep -q "db_size"; then
      echo "  $(echo "$result" | jq -r '.result[1][0]' 2>/dev/null || echo 'parse error')"
      return
    fi
  done
  echo "  (run_sql not available — check db size manually)"
}

# ---------- Main loop ----------
echo "Polling every 60 seconds. Ctrl+C to stop."
echo "Query benchmarks run every 5 minutes."
echo ""

iteration=0
while true; do
  echo "=== $(date -u) ==="
  poll_sync_progress
  check_db_size

  # Run query benchmarks every 5 iterations (5 min)
  if (( iteration % 5 == 0 )); then
    run_query_benchmarks
  fi

  echo ""
  iteration=$((iteration + 1))
  sleep 60
done
