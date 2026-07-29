const toNumber = (value) =>
  value === null || value === undefined || value === ""
    ? Number.NaN
    : Number(value);

// Tracks each chain independently. A watchdog decision is only possible after
// a live RPC head and all durable Envio counters have been observed together.
// Missing data deliberately disarms the timer: a monitoring failure must not
// turn into an indexer restart.
export class ChainProgressTracker {
  constructor({
    timeoutMs,
    minBlockLag,
    startupGraceMs = 0,
    cooldownMs = 0,
    consecutiveObservations = 2,
    restartBudget = 1,
  }) {
    this.timeoutMs = timeoutMs;
    this.minBlockLag = minBlockLag;
    this.startupGraceMs = startupGraceMs;
    this.cooldownMs = cooldownMs;
    this.consecutiveObservations = Math.max(1, consecutiveObservations);
    this.restartBudget = Math.max(0, restartBudget);
    this.restartCount = 0;
    this.states = new Map();
  }

  observe(rows, now = Date.now()) {
    const stalled = [];

    for (const row of rows) {
      const chainId = toNumber(row.chain_id);
      if (!Number.isFinite(chainId)) continue;

      const previous = this.states.get(chainId);
      const liveHead = toNumber(row.liveHead);
      const processed = toNumber(row.latest_processed_block);
      const fetched = toNumber(row.latest_fetched_block_number);
      const events = toNumber(row.num_events_processed);
      const endBlock = toNumber(row.end_block);

      // Both an independent head and the complete durable signature are
      // required. Resetting eligibility here makes RPC/database uncertainty
      // fail open, including after a long monitoring outage.
      if (
        !Number.isFinite(liveHead) ||
        ![processed, fetched, events].every(Number.isFinite)
      ) {
        if (previous) {
          previous.eligibleAt = undefined;
          previous.consecutiveStalled = 0;
        }
        continue;
      }

      const target = Number.isFinite(endBlock)
        ? Math.min(liveHead, endBlock)
        : liveHead;
      const lag = Math.max(0, target - processed);
      const signature = `${processed}:${fetched}:${events}`;
      const state = previous ?? {
        signature,
        firstObservedAt: now,
        lastProgressAt: now,
        eligibleAt: undefined,
        consecutiveStalled: 0,
        lastAlertAt: undefined,
      };
      this.states.set(chainId, state);

      if (state.signature !== signature) {
        state.signature = signature;
        state.lastProgressAt = now;
        state.eligibleAt = lag >= this.minBlockLag ? now : undefined;
        state.consecutiveStalled = lag >= this.minBlockLag ? 1 : 0;
        continue;
      }

      if (lag < this.minBlockLag) {
        state.eligibleAt = undefined;
        state.consecutiveStalled = 0;
        continue;
      }

      state.eligibleAt ??= now;
      state.consecutiveStalled += 1;
      const stalledFor = now - Math.max(state.lastProgressAt, state.eligibleAt);
      const inStartupGrace = now - state.firstObservedAt < this.startupGraceMs;
      const inCooldown =
        state.lastAlertAt !== undefined && now - state.lastAlertAt < this.cooldownMs;

      if (
        inStartupGrace ||
        inCooldown ||
        state.consecutiveStalled < this.consecutiveObservations ||
        stalledFor < this.timeoutMs
      ) {
        continue;
      }

      state.lastAlertAt = now;
      stalled.push({
        chainId,
        head: liveHead,
        target,
        source: row.headSource ?? "rpc",
        lag,
        processed,
        fetched,
        events,
        stalledFor,
        reason: "no_durable_progress",
        restartBudgetRemaining: Math.max(0, this.restartBudget - this.restartCount),
      });
    }

    return stalled;
  }

  consumeRestartBudget() {
    if (this.restartCount >= this.restartBudget) return false;
    this.restartCount += 1;
    return true;
  }
}
