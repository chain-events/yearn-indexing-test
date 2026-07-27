export class ChainProgressTracker {
  constructor({ timeoutMs, minBlockLag }) {
    this.timeoutMs = timeoutMs;
    this.minBlockLag = minBlockLag;
    this.observations = new Map();
  }

  observe(rows, now = Date.now()) {
    const stalled = [];

    for (const row of rows) {
      const toNumber = (value) =>
        value === null || value === undefined || value === ""
          ? Number.NaN
          : Number(value);
      const chainId = toNumber(row.chain_id);
      const blockHeight = toNumber(row.block_height);
      const processed = toNumber(row.latest_processed_block);
      const fetched = toNumber(row.latest_fetched_block_number);
      const events = toNumber(row.num_events_processed);
      if (
        ![chainId, blockHeight, processed, fetched, events].every(
          Number.isFinite,
        )
      ) {
        continue;
      }

      const lag = Math.max(0, blockHeight - processed);
      const signature = `${processed}:${fetched}:${events}`;
      const previous = this.observations.get(chainId);

      if (
        lag < this.minBlockLag ||
        !previous ||
        previous.signature !== signature
      ) {
        this.observations.set(chainId, { signature, lastProgressAt: now });
        continue;
      }

      const stalledFor = now - previous.lastProgressAt;
      if (stalledFor >= this.timeoutMs) {
        stalled.push({
          chainId,
          lag,
          processed,
          fetched,
          events,
          stalledFor,
        });
      }
    }

    return stalled;
  }
}
