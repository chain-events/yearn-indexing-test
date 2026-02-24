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

HASURA_URL="${1:?Usage: $0 <hasura-url> <admin-secret>}"
ADMIN_SECRET="${2:?Usage: $0 <hasura-url> <admin-secret>}"
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
  curl -s -w "\n%{time_total}" \
    -X POST "$HASURA_URL" \
    -H "Content-Type: application/json" \
    -H "X-Hasura-Admin-Secret: $ADMIN_SECRET" \
    -d "{\"query\": \"$query\"}"
}

timed_query() {
  local name="$1"
  local query="$2"
  local start_ms=$(date +%s%3N)
  local response
  response=$(graphql_query "$query" 2>/dev/null) || true
  local end_ms=$(date +%s%3N)
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
  result=$(graphql_query "{ chain_metadata { chain_id first_event_block_number latest_processed_block num_events_processed } }" 2>/dev/null) || true

  if echo "$result" | command -v jq > /dev/null 2>&1 && jq -e '.data.chain_metadata' <<< "$result" > /dev/null 2>&1; then
    echo "$result" | jq -r '.data.chain_metadata[] | [.chain_id, .latest_processed_block, .num_events_processed] | @csv' | while IFS= read -r line; do
      echo "$(date -u +%Y-%m-%dT%H:%M:%SZ),$line" >> "$SYNC_LOG"
    done
    echo "$result" | jq -r '.data.chain_metadata[] | "  Chain \(.chain_id): block \(.latest_processed_block), \(.num_events_processed) events"'
  else
    echo "  (chain_metadata not available yet or query failed)"
  fi
}

# ---------- Query latency benchmarks ----------
run_query_benchmarks() {
  echo "--- Query latency samples ---"

  # Simple lookup - single vault events
  timed_query "single_vault_events" \
    "{ YearnV3Vault_Deposit(limit: 10) { id sender assets shares } }"

  # Filtered list - deposits above threshold
  timed_query "filtered_deposits" \
    "{ YearnV3Vault_Deposit(limit: 50, order_by: {assets: desc}) { id sender owner assets shares } }"

  # Cross-entity - strategy reports
  timed_query "strategy_reports" \
    "{ YearnV3Vault_StrategyReported(limit: 20, order_by: {db_write_timestamp: desc}) { id strategy gain loss current_debt } }"

  # Transfer lookups
  timed_query "recent_transfers" \
    "{ YearnV3Vault_Transfer(limit: 50, order_by: {db_write_timestamp: desc}) { id sender receiver value } }"

  # V2 vault data (if indexed)
  timed_query "v2_deposits" \
    "{ YearnV2Vault_Deposit(limit: 20) { id recipient shares amount } }"

  # Count query
  timed_query "event_count" \
    "{ YearnV3Vault_Deposit_aggregate { aggregate { count } } }"
}

# ---------- Database size ----------
check_db_size() {
  echo "--- Database size ---"
  # This runs via Hasura's run_sql if enabled, otherwise skip
  local result
  result=$(curl -s -X POST "${HASURA_URL%/v1/graphql}/v1/query" \
    -H "Content-Type: application/json" \
    -H "X-Hasura-Admin-Secret: $ADMIN_SECRET" \
    -d '{"type":"run_sql","args":{"sql":"SELECT pg_size_pretty(pg_database_size(current_database())) as db_size;"}}' 2>/dev/null) || true

  if echo "$result" | grep -q "db_size"; then
    echo "  $(echo "$result" | jq -r '.result[1][0]' 2>/dev/null || echo 'parse error')"
  else
    echo "  (run_sql not available — check db size manually)"
  fi
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
