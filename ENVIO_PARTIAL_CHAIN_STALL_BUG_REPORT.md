# Bug: some chains permanently stop dispatching queries in a live multi-chain indexer

## Summary

In a single-worker, eight-chain HyperIndex deployment using Envio `3.3.0`,
individual chains can permanently stop fetching and processing new blocks while
the process remains healthy and other chains continue indexing.

For the affected chains:

- HyperIndex's source/known height remains current and continues following the
  chain head;
- query concurrency becomes zero;
- the event buffer is empty;
- the `getLogs` request counter stops increasing; and
- fetched and processed cursors remain unchanged.

This appears to be a partial starvation or stuck state in multi-chain
query dispatch. It does not look like a dead height source, database lock,
handler bottleneck, or process-wide failure.

## Environment

- Envio: `3.3.0`
- Node.js: `24.3.0`
- Deployment: one worker
- Database: PostgreSQL 18
- Chains: 8
  - Ethereum (`1`)
  - Optimism (`10`)
  - Gnosis (`100`)
  - Polygon (`137`)
  - Base (`8453`)
  - Arbitrum (`42161`)
  - Berachain (`80094`)
  - Katana (`747474`)
- Primary sources: HyperSync
- Base HyperSync endpoint: `https://8453.hypersync.xyz`
- Indexer configuration:
  [config.yaml](https://github.com/chain-events/yearn-indexing-test/blob/0681abd/apps/indexer/config.yaml)
- Deployed indexer commit:
  [`0681abd`](https://github.com/chain-events/yearn-indexing-test/commit/0681abd)

The worker had previously reached live indexing on all chains and was resuming
from an existing database checkpoint. It was not performing an initial
backfill when the incident was diagnosed.

## Expected behavior

Once a chain source reports a newer height, HyperIndex should eventually
dispatch the required log queries for that chain and advance its fetched and
processed cursors.

One chain reaching a transient source or scheduling problem should not leave
that chain permanently inactive while the process continues indexing other
chains.

## Actual behavior

At approximately 2026-07-29 11:54 UTC, Base had the following state:

| Measurement | Value |
| --- | ---: |
| HyperIndex known height | `49,268,230` |
| HyperSync source known height | `49,268,230` |
| Durable processed block | `49,246,476` |
| Durable fetched block | `49,246,476` |
| Indexing buffer block | `49,246,476` |
| Blocks behind known height | `21,754` |
| Query concurrency | `0` |
| Address partitions | `6` |
| Buffer size | `0` |
| `getLogs` request count | `10,142`, unchanged across samples |

Relevant metrics:

```text
envio_indexing_known_height{chainId="8453"} 49268230
envio_source_known_height{source="HyperSync",chainId="8453"} 49268230
envio_indexing_concurrency{chainId="8453"} 0
envio_indexing_partitions{chainId="8453"} 6
envio_indexing_buffer_size{chainId="8453"} 0
envio_indexing_buffer_block{chainId="8453"} 49246476
envio_progress_block{chainId="8453"} 49246476
```

The Base `getLogs` total remained at `10,142` while the known height continued
advancing. The durable `latest_fetched_block_number`,
`latest_processed_block`, and event count also remained unchanged.

Optimism and Katana showed the same zero-concurrency/no-progress pattern at the
same time. Other chains in the same process still had active concurrency and
continued fetching, for example:

```text
Berachain indexing concurrency: 5
Arbitrum indexing concurrency: 2-3
Gnosis indexing concurrency: 3
```

This made the failure process-local but chain-selective: the worker stayed
alive, served metrics, tracked new source heights, and processed some chains
while silently abandoning query dispatch for others.

## Logs

The worker periodically logged:

```text
No new blocks detected within 20s. Polling will continue at a reduced rate.
For better reliability, refer to our RPC fallback guide
```

Trace logs also repeatedly contained:

```text
EventSource error on height stream, reconnecting
```

and:

```text
onHeight subscription stale, switching to polling fallback
```

However, after these messages, Envio's own metrics showed that the affected
chains' HyperSync source heights were current. The persistent failure was that
no new query work was dispatched after the head was known.

## Checks performed

We ruled out the following:

- **Dead HyperSync head feed:** source known height was current and advancing.
- **PostgreSQL blocking:** there were no blocked database sessions.
- **Slow handlers or writes:** affected chains had zero query concurrency,
  empty buffers, flat `getLogs` counters, and no new fetched data to process.
- **Whole-process failure:** other chains in the same worker remained active.
- **Intentional end block:** the affected chains are configured for live
  indexing without a terminal `end_block`.
- **Database reset:** the database and existing cursors remained present; the
  symptom was a frozen cursor, not lost state.
- **RPC fallback configuration:** no fallback RPC is currently declared in the
  Envio chain configuration. More importantly, the primary HyperSync source
  was already reporting the current height, so a height-source fallback would
  not explain or directly repair the missing query dispatch.

## Reproduction

We do not yet have a small deterministic reproduction. The production sequence
was:

1. Run one HyperIndex worker with eight HyperSync-backed chains.
2. Allow every chain to finish its historical sync and enter live mode.
3. Continue running through HyperSync height-stream reconnects and polling
   fallback transitions.
4. Observe that one or more chains eventually retain a current source known
   height but stop issuing `getLogs` requests.
5. Observe that unaffected chains in the same worker continue indexing.

The issue may depend on the cross-chain scheduling state after all chains have
entered live mode, possibly following a height-subscription reconnect.

## Suspected area

This is an inference, not a confirmed root cause.

The evidence suggests that a chain can fall out of the shared cross-chain
scheduler's query-admission path even though its source frontier advances.
Possible areas to inspect include:

- shared target-buffer admission and per-chain reservations;
- pending partition/query bookkeeping after returning to live mode;
- cleanup after an `onHeight` subscription becomes stale;
- transitions between height-stream subscription and polling fallback; and
- whether an affected chain is re-enqueued when its source height advances but
  it currently has no buffer and zero active queries.

The key invariant violation is:

```text
source known height advances
+ progress materially behind
+ empty buffer
+ zero concurrency
+ no getLogs calls
= chain never resumes query dispatch
```

## Impact

The failure is silent from a process-health perspective. The worker remains
alive and can continue indexing other networks, while applications receive
increasingly stale or missing events for affected chains.

A standard process liveness probe cannot detect the condition. Without
independent per-chain head and cursor monitoring, the missing data may go
unnoticed indefinitely.

## Requested help

Could you confirm:

1. whether Envio `3.3.0` has a known multi-chain scheduling issue matching this
   state;
2. which additional internal metrics or trace fields would identify why a
   chain with a newer known height has zero runnable queries;
3. whether a newer release contains relevant scheduler, height-subscription,
   or cross-chain buffer fixes; and
4. whether there is a supported way to force a chain to re-enter query
   scheduling without restarting or resetting the indexer.

We can provide a longer sanitized metrics/log capture or run an instrumented
build in an isolated staging environment if you can point us to the scheduler
state that would be most useful.
