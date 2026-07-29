# Envio Partial-Chain Stall: Implementation Plan

## Status and scope

This plan is based on the production incident observed on 2026-07-29 and the
code deployed from `origin/main` at `0681abd`.

The immediate incident is a partial-chain indexing stall. Base, Optimism, and
Katana stopped making durable progress while the single Envio worker remained
alive and continued indexing other chains. This was not a database reset,
schema migration failure, Postgres lock, or a dead HyperSync height feed.

This document plans detection, safe recovery, monitoring correctness, and the
work needed to isolate or mitigate the Envio runtime defect. It does not
authorize a production database reset. The implementation must preserve the
current database and resume from existing checkpoints.

## Diagnosis to design against

The following production observations define the problem:

- Base's durable cursor was fixed at block `49,246,476` while the live Base
  head continued past `49,268,000`.
- Envio's own `/metrics` reported the current Base source/known height, but
  `envio_indexing_concurrency` was `0`, the buffer was empty, the `getLogs`
  count was flat, and the progress cursor did not move.
- The same pattern affected Optimism and Katana while other chains still had
  active query concurrency. The worker process was therefore live but only
  partially useful.
- Postgres had no blocking sessions, and the affected chains were not making
  new durable writes.
- Envio repeatedly logged height-stream reconnects and polling fallback, but
  the live HyperSync source height was still current. The evidence points to
  Envio 3.3's multi-chain scheduling/query-dispatch path failing to admit new
  work for some chains. The exact internal reservation or scheduler defect is
  not yet proven.
- The current watchdog compares `latest_processed_block` with
  `chain_metadata.block_height`. Both values can become stale together. Base
  appeared only 360 blocks behind to the watchdog, below its 10,000-block
  threshold, even though it was more than 21,000 blocks behind the independent
  RPC head.
- The monitoring API calculates `blocksBehind` from an independent RPC head,
  but marks a chain caught up whenever Envio's historical
  `timestamp_caught_up_to_head_or_endblock` is non-null. Because that timestamp
  is sticky, the dashboard showed stale chains as green and 100% synchronized.
- Render's `ENVIO_RPC_URL_*` variables are currently used by the monitoring
  service. They are not Envio runtime fallbacks because the chain entries in
  `apps/indexer/config.yaml` do not declare `rpc`/`rpcs`.
- Automatic database-reset paths have already been removed. The remaining
  startup migration command is an incremental `db-migrate up`, not an
  unconditional reset.

## Invariants

Every implementation and rollout step must maintain these properties:

1. No code path may automatically drop, recreate, truncate, or reset the Envio
   schema or database.
2. Automated recovery may restart only the Envio process. It must resume from
   the durable checkpoint already in Postgres.
3. An unavailable or rate-limited RPC endpoint must not cause a restart loop.
4. A historical "caught up once" timestamp must never be used as current
   health.
5. Render must continue to run exactly one indexer worker.
6. A config change that Envio considers incompatible must fail CI and require
   an explicit migration/reindex decision; deployment code must not resolve it
   by resetting production.

## Phase 0: Recovery runbook

Document a short, repeatable operator procedure before changing automation.

1. Capture a pre-restart snapshot for every chain:
   - independent RPC head;
   - `block_height`, `latest_fetched_block_number`,
     `latest_processed_block`, and `num_events_processed`;
   - Envio `known_height`, source height, concurrency, buffer, progress, and
     `getLogs` counters;
   - current deploy and process identifier.
2. Restart the Envio service without running a reset command.
3. Verify that it starts at the same or a later durable cursor and that row
   counts do not decrease.
4. Confirm that affected-chain `getLogs`, fetched, and processed counters move
   within ten minutes.
5. Escalate rather than repeatedly restart if two checkpoint-preserving
   restarts fail within one hour.

The runbook is also the manual fallback while the new watchdog is in
observe-only mode.

## Phase 1: Make monitoring truthful

### Backend status model

Refactor `apps/monitoring/server.js` so current sync state is derived from a
fresh, independent head:

- Preserve Envio's timestamp as `metadataCaughtUpAt`; treat it as historical
  metadata only.
- Return an explicit head state:
  - `live`: an RPC head was fetched successfully;
  - `bounded`: the chain has a configured `end_block`;
  - `unknown`: neither a live head nor a bounded target is available.
- Calculate `blocksBehind` only when the target is known.
- Derive `syncStatus` as `caught_up`, `behind`, or `unknown`.
- Derive `caughtUp` from the known target and a configurable per-chain lag
  tolerance, never from `timestamp_caught_up_to_head_or_endblock`.
- Do not force `percentSynced` to 100 because a sticky timestamp exists.
- Return the RPC observation time and distinguish RPC failure from a zero lag.

Use per-chain time-based freshness for alerting. Raw block thresholds alone are
not comparable across Ethereum, Base, Arbitrum, and Katana. If block timestamps
are not available in the first iteration, define documented per-chain block
tolerances derived from the one-hour service objective.

### Health endpoints and UI

- Keep `/livez` as process liveness for Render deployment health.
- Add `/readyz` for current chain-head readiness:
  - fail when any chain has exceeded its allowed lag for a sustained window;
  - report `unknown` separately when live-head checks fail;
  - include every failing chain and the observation used in the response.
- Keep `/healthz` as the existing vault-event semantic canary, but rename its
  internal concepts and documentation so it cannot be mistaken for the
  one-hour chain-lag alert. Review the current 30-day threshold separately
  against how frequently each canary vault is expected to emit events.
- Keep Render pointed only at `/livez`. Neither readiness nor event frequency
  may control deployment success or process liveness.
- Render `behind` as warning/error and `unknown` as unknown, never green.
- Always display live head, durable processed block, blocks behind, last head
  observation, and the deployed commit.
- Make the summary and each chain card use the same status calculation.
- Add a response field identifying the source of every target height so alerts
  and the UI are auditable.

### Deployment parity

Add a post-deploy assertion for the monitoring service that its reported commit
equals the expected `main` commit. A stale monitoring deployment must alert and
must not be treated as proof that the indexer is healthy.

## Phase 2: Repair the checkpoint-preserving watchdog

### Independent head provider

Create a shared live-head module used by monitoring and the indexer wrapper:

- Resolve the existing `ENVIO_RPC_URL_<CHAIN>` settings through a single
  chain-ID map.
- Request `eth_blockNumber` with a short timeout and bounded concurrency.
- Return a typed result containing height, observed time, endpoint class, and
  failure reason without logging credentials.
- Prefer a configured `end_block` over a live head for intentionally bounded
  indexing.
- Fail open on RPC errors: record an unknown observation and do not restart.

Do not copy RPC parsing and timeout behavior into two services. Unit-test the
module independently.

### Progress state machine

Replace the current `block_height - latest_processed_block` gate in
`ChainProgressTracker` with a state machine that receives both durable metadata
and independent head observations.

For each chain, track:

- last independent head and the time it advanced;
- last durable signature
  (`latest_processed_block`, `latest_fetched_block_number`,
  `num_events_processed`);
- time the durable signature last changed;
- current lag and observation confidence;
- whether the chain is bounded, catching up, caught up, suspected stalled, or
  confirmed stalled.

A chain becomes confirmed stalled only when all of the following are true:

1. a fresh independent target is known;
2. the target is materially ahead according to that chain's configured
   tolerance;
3. the target has advanced, or remains independently confirmed ahead;
4. no durable counter has changed for the configured timeout;
5. the condition exists in consecutive observations; and
6. the watchdog has not restarted the worker inside its cooldown window.

Any durable progress clears the stall timer. RPC failure, incomplete metadata,
a configured terminal `end_block`, initial backfill behavior, or a process still
inside its startup grace period must not trigger a restart.

### Recovery behavior

- Add `ENVIO_STALL_WATCHDOG_MODE=off|observe|restart`; default new deployments
  to `observe`.
- In `observe`, emit the exact decision inputs and the action that would have
  occurred.
- In `restart`, terminate the Envio child process group once and let Render
  restart the service from the existing checkpoint.
- Add a startup grace period and a restart cooldown.
- Keep a restart budget, for example at most two automatic restarts in six
  hours. Exhausting the budget raises a critical alert and leaves the process
  running for inspection.
- Emit structured events for suspected stall, confirmed stall, recovery,
  restart requested, cooldown suppression, and head-check failure.
- Never invoke `envio dev`, a reset command, schema deletion, or a reindex from
  the watchdog.

## Phase 3: Detect the Envio scheduler failure directly

The independent-head watchdog is the safe recovery mechanism. Add Envio metrics
to make the root failure observable and to avoid relying only on durable rows.

Collect, per chain:

- indexer known height and source known height;
- progress block;
- query concurrency and partition count;
- buffer size and buffer block;
- `getLogs` request count and duration deltas;
- height-stream reconnect and polling-fallback counts.

Define a scheduler-stall signal:

- source/known height is current or advancing;
- durable and Envio progress blocks are materially behind;
- `getLogs` does not increase;
- concurrency remains zero;
- the condition persists across the configured window.

Expose the signal in monitoring and alert on every affected chain in a single
incident. Do not rely on exact log wording, which can change between Envio
versions.

If Envio's metrics endpoint cannot be reached safely from the monitoring
service, have the wrapper sample it locally and publish only sanitized,
chain-level observations. Do not expose the raw metrics endpoint publicly.

## Phase 4: Vendor isolation and mitigations

### Reproduction and upstream report

Create an isolated staging deployment with its own database and the production
eight-chain topology. The test should:

1. synchronize all chains to head;
2. restart repeatedly from an at-head checkpoint;
3. inject height-stream disconnects or delayed sources;
4. verify that each chain continues issuing log queries and advancing;
5. capture scheduler state when one chain reaches zero concurrency while its
   source height advances.

Prepare an Envio issue with:

- Envio version and topology;
- sanitized config;
- incident timeline;
- source height, progress, concurrency, buffer, and `getLogs` deltas;
- the fact that other chains continued progressing;
- the checkpoint-preserving restart result;
- a minimal reproduction if staging can produce one.

Test the latest Envio patch release in staging. Promote it only after config
compatibility, generated code, full backfill, resume-at-head, and multi-chain
soak tests pass.

### RPC fallback as defense in depth

Separately evaluate per-chain fallback declarations in
`apps/indexer/config.yaml`, using the syntax supported by the pinned Envio
version, for example:

```yaml
rpc:
  - url: ${ENVIO_RPC_URL_BASE}
    for: fallback
```

This can help when HyperSync stops producing a usable head or request results.
It is not the primary fix for this incident because Envio already knew the live
head while its query scheduler stopped dispatching work.

Because adding fallback declarations changes parsed Envio configuration:

- validate the exact diff with `check_envio_config_compatibility.mjs`;
- test it only against an isolated staging database first;
- do not bypass the CI compatibility failure;
- do not make production reset itself to accept the change.

If Envio treats the fallback-only change as incompatible with the existing
database, defer it until there is an explicit, separately approved migration or
blue/green cutover plan.

## Test plan

### Unit tests

Add tracker and head-provider cases for:

- live head far ahead while persisted `block_height` is stale and close to
  `latest_processed_block`;
- progress in processed, fetched, or event count clearing the timer;
- independently advancing head with flat durable counters;
- chain close to the live head;
- RPC timeout, malformed result, and rate limit failing open;
- missing/incomplete metadata;
- configured `end_block`;
- startup grace, consecutive observations, cooldown, and restart budget;
- credentials never appearing in logs.

Add monitoring cases for:

- sticky `timestamp_caught_up_to_head_or_endblock` plus real lag producing
  `behind`;
- RPC failure producing `unknown`, not `caught_up`;
- bounded chains using `end_block`;
- API totals matching chain-card status;
- `/livez` remaining independent from data readiness;
- `/readyz` reporting all lagging/unknown chain IDs and reasons;
- `/healthz` continuing to test semantic event freshness independently.

### Integration and CI

- Run monitoring server tests, indexer wrapper tests, `check:config`, Envio
  code generation, and TypeScript build in pull requests targeting `dev`.
- Add a fixture with multiple chains where one chain's source head advances but
  no queries are dispatched; assert a stall is detected without touching the
  database.
- Add a test that scans startup/recovery commands and rejects known reset
  commands in production entrypoints.
- Pin every GitHub Action to a full commit SHA and keep lifecycle-script
  dependencies explicitly allowlisted.

### Staging soak

Run the candidate for at least 24 hours and through several controlled restarts.
Acceptance requires:

- no database row-count decrease;
- resume at or after every pre-restart checkpoint;
- every live chain remains inside its freshness objective;
- dashboard, `/api/status`, `/readyz`, and lag alerts agree;
- `/healthz` continues to report the separate event-canary result;
- observe-mode stall decisions have no false positives;
- Envio metrics continue advancing for all chains after returning to head.

## Rollout sequence

1. Merge monitoring truthfulness and deploy it independently of watchdog
   behavior.
2. Verify monitoring deploy parity and alert/dashboard agreement.
3. Deploy the new watchdog in `observe` mode.
4. Compare its decisions with Envio metrics and operator snapshots for at least
   24 hours.
5. Enable `restart` mode with startup grace, cooldown, and restart budget.
6. Keep the timeout conservative initially (30 minutes) and tune per-chain lag
   tolerances from measured block times.
7. Run the Envio version/fallback experiments only in isolated staging.
8. Promote a vendor upgrade or config mitigation only after the soak criteria
   pass.

## Proposed pull-request breakdown

### PR 1: Truthful status and readiness

Primary files:

- `apps/monitoring/server.js`
- `apps/monitoring/public/index.html`
- `apps/monitoring/README.md`
- `apps/monitoring/.env.example`
- new monitoring unit tests and test script

Deliver the explicit head source/status model, remove the sticky timestamp from
current health decisions, add `/readyz`, and update the UI. Do not change
indexer startup or Envio config in this PR.

### PR 2: Independent-head watchdog in observe mode

Primary files:

- a small shared workspace package for chain IDs, RPC head observations, and
  redacted errors;
- `pnpm-workspace.yaml` and the indexer Dockerfile so the shared package is
  available in both deployments;
- `apps/indexer/bin/chain-progress-tracker.mjs`
- `apps/indexer/bin/start-envio.mjs`
- tracker/head-provider tests;
- `render.yaml`

Deliver the state machine, startup grace, structured decisions, and
`off|observe|restart` configuration. Set Render to `observe`.

### PR 3: Bounded automatic recovery and direct diagnostics

Primary files:

- `apps/indexer/bin/start-envio.mjs`
- the tracker tests;
- a sanitized local Envio metrics sampler;
- monitoring status/UI files;
- operator runbook.

Add cooldown, restart budget, alert events, and the direct scheduler-stall
signal. Enable restart mode only after observe-mode evidence is reviewed.

### PR 4: Staging/vendor experiment

Create an isolated staging Blueprint/database and an explicit test matrix for
an Envio patch upgrade and optional RPC fallback declarations. This PR must not
change production Envio config or point staging at the production database.
The outcome is either a verified upgrade/mitigation PR or an upstream issue
with a reproducible evidence bundle.

## Rollback

- Set the watchdog mode to `off`; no database change is required.
- Roll back monitoring code without changing indexer state, while retaining an
  external alert until the UI is trustworthy again.
- Revert an Envio package upgrade only if both versions accept the same
  persisted configuration and the staging downgrade test passed.
- Never use a production reset as rollback. If persisted configuration is
  incompatible, use a separately approved blue/green database and controlled
  cutover.

## Definition of done

- A live source head that advances without durable progress is detected even
  when `chain_metadata.block_height` is stale.
- The dashboard cannot show a lagging or unknown chain as green/100%.
- A confirmed partial-chain stall causes at most one checkpoint-preserving
  restart within the cooldown and cannot enter an infinite restart loop.
- Alerts identify every affected chain and agree with the dashboard.
- Production contains no automatic reset/reindex path.
- Staging demonstrates resume-at-head reliability for all eight chains.
- The Envio upstream report contains enough evidence to distinguish source
  connectivity from cross-chain query-dispatch starvation.
