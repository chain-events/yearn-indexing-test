import { describe, expect, it } from "vitest";
import { ChainProgressTracker } from "./chain-progress-tracker.mjs";

const row = (overrides = {}) => ({
  chain_id: 1,
  block_height: 25_000_000,
  latest_processed_block: 21_000_000,
  latest_fetched_block_number: 21_000_000,
  num_events_processed: 600_000,
  ...overrides,
});

describe("ChainProgressTracker", () => {
  it("reports a materially behind chain after every progress counter stalls", () => {
    const tracker = new ChainProgressTracker({
      timeoutMs: 30 * 60_000,
      minBlockLag: 10_000,
    });

    expect(tracker.observe([row()], 0)).toEqual([]);
    expect(tracker.observe([row()], 30 * 60_000)).toEqual([
      expect.objectContaining({
        chainId: 1,
        lag: 4_000_000,
        stalledFor: 30 * 60_000,
      }),
    ]);
  });

  it("resets the timer when processed, fetched, or event progress changes", () => {
    const tracker = new ChainProgressTracker({
      timeoutMs: 30 * 60_000,
      minBlockLag: 10_000,
    });

    tracker.observe([row()], 0);
    expect(
      tracker.observe(
        [
          row({
            latest_fetched_block_number: 21_100_000,
          }),
        ],
        29 * 60_000,
      ),
    ).toEqual([]);
    expect(
      tracker.observe(
        [
          row({
            latest_fetched_block_number: 21_100_000,
          }),
        ],
        31 * 60_000,
      ),
    ).toEqual([]);
  });

  it("does not restart chains that are close to the observed head", () => {
    const tracker = new ChainProgressTracker({
      timeoutMs: 30 * 60_000,
      minBlockLag: 10_000,
    });
    const caughtUp = row({
      latest_processed_block: 24_995_000,
      latest_fetched_block_number: 24_995_000,
    });

    tracker.observe([caughtUp], 0);
    expect(tracker.observe([caughtUp], 60 * 60_000)).toEqual([]);
  });

  it("ignores incomplete metadata rows", () => {
    const tracker = new ChainProgressTracker({
      timeoutMs: 30 * 60_000,
      minBlockLag: 10_000,
    });
    const incomplete = row({ latest_processed_block: null });

    tracker.observe([incomplete], 0);
    expect(tracker.observe([incomplete], 60 * 60_000)).toEqual([]);
  });
});
