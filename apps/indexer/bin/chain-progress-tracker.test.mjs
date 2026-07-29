import { describe, expect, it } from "vitest";
import { ChainProgressTracker } from "./chain-progress-tracker.mjs";

const row = (overrides = {}) => ({
  chain_id: 1,
  // This intentionally looks caught up. The tracker must use liveHead, not
  // this lagging Envio metadata field, to catch a partially stalled chain.
  block_height: 21_000_010,
  latest_processed_block: 21_000_000,
  latest_fetched_block_number: 21_000_000,
  num_events_processed: 600_000,
  liveHead: 25_000_000,
  headSource: "rpc",
  ...overrides,
});

const tracker = (overrides = {}) =>
  new ChainProgressTracker({
    timeoutMs: 30 * 60_000,
    minBlockLag: 10_000,
    startupGraceMs: 0,
    cooldownMs: 0,
    consecutiveObservations: 2,
    restartBudget: 1,
    ...overrides,
  });

describe("ChainProgressTracker", () => {
  it("uses the independent live head when stale metadata looks caught up", () => {
    const subject = tracker();

    expect(subject.observe([row()], 0)).toEqual([]);
    expect(subject.observe([row()], 30 * 60_000)).toEqual([
      expect.objectContaining({
        chainId: 1,
        head: 25_000_000,
        target: 25_000_000,
        source: "rpc",
        lag: 4_000_000,
        stalledFor: 30 * 60_000,
      }),
    ]);
  });

  it("fails open for missing live heads and incomplete metadata", () => {
    const subject = tracker();

    subject.observe([row()], 0);
    expect(subject.observe([row({ liveHead: null })], 60 * 60_000)).toEqual([]);
    expect(subject.observe([row()], 61 * 60_000)).toEqual([]);
    expect(
      subject.observe([row({ latest_processed_block: null })], 100 * 60_000),
    ).toEqual([]);
  });

  it("resets the timer whenever any durable progress counter changes", () => {
    const subject = tracker();

    subject.observe([row()], 0);
    subject.observe([row({ latest_fetched_block_number: 21_100_000 })], 29 * 60_000);
    expect(
      subject.observe([row({ latest_fetched_block_number: 21_100_000 })], 31 * 60_000),
    ).toEqual([]);
    expect(
      subject.observe([row({ latest_fetched_block_number: 21_100_000 })], 59 * 60_000),
    ).toEqual([
      expect.objectContaining({ stalledFor: 30 * 60_000 }),
    ]);
  });

  it("keeps chains independent", () => {
    const subject = tracker();
    const chainTwo = row({ chain_id: 10, latest_processed_block: 24_999_000 });

    subject.observe([row(), chainTwo], 0);
    expect(subject.observe([row(), chainTwo], 30 * 60_000)).toEqual([
      expect.objectContaining({ chainId: 1 }),
    ]);
  });

  it("caps the live target at end_block", () => {
    const subject = tracker();
    const finished = row({ end_block: 21_005_000 });

    subject.observe([finished], 0);
    expect(subject.observe([finished], 60 * 60_000)).toEqual([]);
  });

  it("honors startup grace and required consecutive observations", () => {
    const subject = tracker({ startupGraceMs: 40 * 60_000, consecutiveObservations: 3 });

    subject.observe([row()], 0);
    expect(subject.observe([row()], 30 * 60_000)).toEqual([]);
    expect(subject.observe([row()], 40 * 60_000)).toEqual([
      expect.objectContaining({ chainId: 1 }),
    ]);
  });

  it("rate limits repeated diagnostics with cooldown", () => {
    const subject = tracker({ cooldownMs: 20 * 60_000 });

    subject.observe([row()], 0);
    expect(subject.observe([row()], 30 * 60_000)).toHaveLength(1);
    expect(subject.observe([row()], 40 * 60_000)).toEqual([]);
    expect(subject.observe([row()], 50 * 60_000)).toHaveLength(1);
  });

  it("enforces the restart budget separately from observation", () => {
    const subject = tracker({ restartBudget: 1 });

    expect(subject.consumeRestartBudget()).toBe(true);
    expect(subject.consumeRestartBudget()).toBe(false);
  });
});
