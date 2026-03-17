#!/bin/bash
# Benchmark script for Envio HOSTED service (production comparison)
# Usage: ./scripts/prod_benchmark.sh <envio-hosted-url>
# Example: ./scripts/prod_benchmark.sh https://indexer.hyperindex.xyz/3fec0a4
#
# No admin secret needed — hosted service uses public access
#
# Output: benchmark-results/ directory with timestamped CSVs

set -euo pipefail

ENVIO_BASE="${1:?Usage: $0 <envio-hosted-url>}"
ENVIO_BASE="${ENVIO_BASE%/}"
ENVIO_URL="${ENVIO_BASE%/v1/graphql}/v1/graphql"
RESULTS_DIR="benchmark-results/hosted"
mkdir -p "$RESULTS_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SYNC_LOG="$RESULTS_DIR/prod_sync_progress_${TIMESTAMP}.csv"
QUERY_LOG="$RESULTS_DIR/prod_query_latency_${TIMESTAMP}.csv"

# Headers
echo "timestamp,chain_id,block_number,events_count" > "$SYNC_LOG"
echo "timestamp,query_name,latency_ms,status" > "$QUERY_LOG"

graphql_query() {
  local query="$1"
  curl -s \
    -X POST "$ENVIO_URL" \
    -H "Content-Type: application/json" \
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

echo "=== Hosted Envio Benchmark started at $(date -u) ==="
echo "Endpoint: $ENVIO_URL"
echo "Results in: $RESULTS_DIR/"
echo ""

# ---------- Sync progress polling ----------
poll_sync_progress() {
  echo "--- Sync progress snapshot ---"
  local result
  result=$(graphql_query "{ chain_metadata { chain_id first_event_block_number latest_processed_block num_events_processed } }" 2>/dev/null) || true

  if jq -e '.data.chain_metadata' <<< "$result" > /dev/null 2>&1; then
    echo "$result" | jq -r '.data.chain_metadata[] | [.chain_id, .latest_processed_block, .num_events_processed] | @csv' | while IFS= read -r line; do
      echo "$(date -u +%Y-%m-%dT%H:%M:%SZ),$line" >> "$SYNC_LOG"
    done
    echo "$result" | jq -r '.data.chain_metadata[] | "  Chain \(.chain_id): block \(.latest_processed_block), \(.num_events_processed) events"'
  else
    echo "  (chain_metadata not available yet or query failed)"
    echo "  Raw: $(echo "$result" | head -c 200)"
  fi
}

# ---------- Query latency benchmarks ----------
# Note: hosted uses unprefixed table names (no envio_ prefix)
run_query_benchmarks() {
  echo "--- Query latency samples ---"

  # Simple lookup - single vault events
  timed_query "single_vault_events" \
    "{ Deposit(limit: 10) { id sender assets shares } }"

  # Filtered list - deposits above threshold
  timed_query "filtered_deposits" \
    "{ Deposit(limit: 50, order_by: {assets: desc}) { id sender owner assets shares } }"

  # Cross-entity - strategy reports
  timed_query "strategy_reports" \
    "{ StrategyReported(limit: 20, order_by: {blockTimestamp: desc}) { id strategy gain loss current_debt } }"

  # Transfer lookups
  timed_query "recent_transfers" \
    "{ Transfer(limit: 50, order_by: {blockTimestamp: desc}) { id sender receiver value } }"

  # Referral deposits
  timed_query "referral_deposits" \
    "{ ReferralDeposit(limit: 20) { id receiver referrer vault assets shares } }"
}

# ---------- Main loop ----------
echo "Polling every 60 seconds. Ctrl+C to stop."
echo "Query benchmarks run every 5 minutes."
echo ""

iteration=0
while true; do
  echo "=== $(date -u) ==="
  poll_sync_progress

  # Run query benchmarks every 5 iterations (5 min)
  if (( iteration % 5 == 0 )); then
    run_query_benchmarks
  fi

  echo ""
  iteration=$((iteration + 1))
  sleep 60
done
