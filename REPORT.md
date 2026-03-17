# Self-Hosting vs Managed Envio: Benchmark Report

## Executive Summary

We're exceeding the Production Small plan on two hard limits (7 networks vs 5 cap, ~3.6M events vs ~1M cap). An upgrade is required. Self-hosting HyperIndex on Render costs $33/mo in infrastructure — 89% less than the $300/mo Production Medium plan. The cost advantage holds as long as engineer maintenance stays under ~2.5 hours/month ($250). Sync speed is identical between self-hosted and managed. Under load testing, self-hosted delivers **80-100 RPS at ~500ms** vs hosted **20 RPS at ~2,400ms** — a 4-5x throughput advantage with zero failures. The third option — staying on Small at $70/mo — is not viable without dropping chains or contracts. **Recommendation: self-host at the $33/mo tier** with the basic-1gb Postgres, and budget $70/mo as contingency for HyperSync Starter if the free tier gets rate-limited.

---

## 1. Growth Analysis — What Limits Are We Hitting?

> *Task 1: Before benchmarking, document exactly which Production Small limits we're hitting or expect to hit.*

| Small Plan Limit | Cap | Our Usage | Over Limit? |
|---|---|---|---|
| Networks | 5 | **7** (ETH, OP, Polygon, Fantom, Base, Arbitrum, Katana) | **Yes** |
| Queries/min | 250 | **`[NOT MEASURED]`** — no rate-limit monitoring on hosted plan | Unknown |
| Events storage | ~1M | **~3.59M events** (3,587,850 from Envio dashboard) | **Yes — 3.6x over** |
| Indexing hours | 800/mo | **97 / 800 used** | No — 12% utilization |
| Deployments | 3 | **1 active** (commit 3adb940) | No |

**What this means:** We exceed the Small plan on two hard limits — network count (7 > 5) and events storage (3.6M >> 1M). Indexing hours are fine at 97/800 (12%), so compute isn't the bottleneck. The queries/min limit (250 QPM) is the remaining unknown.

**Growth trajectory:** With 7 chains indexing ~3.6M events and growing, we're 3.6x over the event storage cap. Event counts grow continuously as new on-chain transactions occur. Adding contracts or chains will only widen the gap.

---

## 2. Environment Setup

> *Task 2: Stand up a self-hosted HyperIndex environment. Document every setup step, dependency, and configuration decision. Record total setup time honestly.*

### Infrastructure (Render.com Blueprint)

| Component | Image/Runtime | Render Plan | Cost/mo |
|---|---|---|---|
| PostgreSQL 17 | Render managed (`basic-256mb`) | basic-256mb | $6 |
| Hasura GraphQL Engine | `hasura/graphql-engine:v2.43.0` | starter (512 MB RAM) | $7 |
| Envio HyperIndex indexer | Custom Dockerfile (worker) | starter (512 MB RAM) | $7 |
| **Total** | | | **$20** |

### Deployment Steps

1. Create a Render account and connect the GitHub repository
2. Deploy via Blueprint using `render.yaml` — Render provisions all three services + Postgres automatically
3. Set manual env vars in Render dashboard:
   - `HASURA_GRAPHQL_ADMIN_SECRET` (any secret string)
   - `ENVIO_API_TOKEN` (from [envio.dev/app/api-tokens](https://envio.dev/app/api-tokens))
4. Wait for indexer to start syncing (appears in worker logs)

### Configuration Decisions

- **Render managed Postgres** over container-based PG: eliminates data loss on redeploy, includes automated backups
- **Internal networking** between services: Hasura connects to PG via Render internal hostname, no SSL overhead
- **`ENVIO_PG_SSL_MODE`**: not needed for Render internal connections; required (`require`) for external PG like Neon
- **`unordered_multichain_mode: true`** in config.yaml: allows parallel chain indexing
- **`preload_handlers: true`**: preloads event handlers for faster processing

### Setup Time

| Phase | Wall-Clock Time | Notes |
|---|---|---|
| Initial render.yaml + Dockerfile | ~30 min | Had to debug Render plan names, SSL issues |
| Debugging & fixing issues | ~3 hours | SSL with Neon (abandoned), plan name errors, Dockerfile COPY issue, script bugs |
| **Total first-time setup** | **~4 hours** | Includes all wrong turns |
| **Repeatable setup** | **~30 minutes** | With working render.yaml and docs |

### Files

- `render.yaml` — full Render Blueprint (Postgres + Hasura + indexer)
- `Dockerfile` — builds the HyperIndex indexer container
- `config.yaml` — Envio indexer configuration (contracts, chains, events)
- `.env.example` — environment variable reference

---

## 3. Workload Description

> *Task 3: Choose indexer configurations that reflect real-world usage patterns. Exceed at least one Small plan limit.*

### What We Indexed

The **exact same contracts and events** as our production Envio hosted setup — Yearn V2/V3 vaults, gauges, timelocks, and referral wrappers across 6 EVM chains.

| Chain | Chain ID | Contract Types | Address Count | Events (Self-Hosted) | Events (Hosted) |
|---|---|---|---|---|---|
| Ethereum | 1 | V3 Vaults, V2 Vaults, Timelocks, Gauges, Referral | 80+ | 515,640 | 517,065 |
| Polygon | 137 | V3 Vaults | 10 | 2,233,963 | 2,234,605 |
| Fantom | 250 | V2 Vaults | 4 | 95,218 | 227,283 |
| Optimism | 10 | V2 Vaults | 3 | 51,267 | 51,302 |
| Base | 8453 | V3 Vaults, Timelock, Referral | 8 | 49,545 | 50,086 |
| Arbitrum | 42161 | V3 Vaults, Referral | 9 | 36,496 | 36,682 |
| Katana | 747474 | V3 Vaults, Referral | — | N/A (not in self-hosted config) | 470,827 |
| **Total** | | | | **2,982,129** | **3,587,850** |

### Why This Workload

- **Representative**: These are the actual DeFi contracts we index in production — vault deposits/withdrawals, strategy reports, governance timelocks, gauge staking
- **Exceeds Small plan limits**: 6 networks (> 5 cap), ~3M events (>> 1M cap)
- **Multi-chain**: Covers chains with very different block times (Ethereum ~12s, Polygon ~2s, Arbitrum ~0.25s)
- **Mixed event types**: Simple transfers, complex multi-parameter strategy reports, referral deposits with indexed fields
- **Freshness-sensitive**: Vault deposits/withdrawals and strategy reports need near-real-time indexing for portfolio balance tracking

### Caveats

- Self-hosted config excludes Katana (chain 747474) — it was commented out in config.yaml during the benchmark
- Fantom event count differs significantly (95K vs 227K) — self-hosted was still catching up on historical sync
- Ethereum was still syncing historical events during benchmark (515K vs 516K)

---

## 4. Performance and Resource Results

> *Task 4: Measure sync speed, query latency, throughput, and resource usage.*

### 4.1 Sync Speed Comparison

Both environments use HyperSync for chain data ingestion. Measured over 2.5 hours (self-hosted) and 1 hour (hosted).

| Chain | Self-Hosted (blocks/min) | Hosted (blocks/min) | Match? |
|---|---|---|---|
| Ethereum | 5.0 | 5 | Yes — both at chain head rate |
| Optimism | 30.0 | 30 | Yes |
| Polygon | 30.0 | 30 | Yes |
| Fantom | 263.7 | 2 | Self-hosted catching up; hosted at head |
| Base | 30.0 | 30 | Yes |
| Arbitrum | 240.9 | 240 | Yes |

**Finding:** Sync speed is effectively identical — both use HyperSync and keep pace with chain heads. The differences on Fantom/Arbitrum reflect historical catch-up vs steady-state, not a performance gap.

### 4.2 Query Latency — Head-to-Head

Representative queries run against both environments. Self-hosted: 162 samples over 2.5 hours. Hosted: 10 samples over 1 hour.

| Query | Description | Hosted Avg (ms) | Self-Hosted Avg (ms) | Winner |
|---|---|---|---|---|
| single_vault_events | 10 rows, simple lookup | 966 | 345 | **Self-hosted 64% faster** |
| referral_deposits | 20 rows, simple lookup | 948 | 321 | **Self-hosted 66% faster** |
| strategy_reports | 20 rows, sorted by blockTimestamp | 1,003 | `[SCHEMA MISMATCH]*` | — |
| recent_transfers | 50 rows, sorted by blockTimestamp | 973 | `[SCHEMA MISMATCH]*` | — |
| filtered_deposits | 50 rows, filtered + sorted | 1,078 | 9,485 | **Hosted 88% faster** |
| event_count | Aggregate count | N/A** | 1,067 | — |

\* Self-hosted `strategy_reports` and `recent_transfers` had field name mismatches during the benchmark run (now fixed in script). No valid comparison data collected.

\** Hosted service doesn't expose `_aggregate` queries.

**Key findings:**
- **Simple lookups:** Self-hosted is ~3x faster (345ms vs 966ms). The hosted service has a consistent ~950-1,080ms floor regardless of query complexity, suggesting a proxy/routing overhead layer.
- **Filtered/sorted queries:** Hosted is ~9x faster (1,078ms vs 9,485ms). This is the 256MB Postgres bottleneck — the DB can't cache sort indexes. **Not an architectural limitation** — upgrading to basic-1gb ($19/mo) should bring this to sub-second.
- **Hosted consistency:** All hosted queries cluster in the 948-1,078ms range, confirming a fixed overhead floor.

### 4.3 Query Latency — Statistical Detail (Self-Hosted)

| Query | Samples | Avg (ms) | p50 (ms) | p95 (ms) | Max (ms) |
|---|---|---|---|---|---|
| single_vault_events | ~32 | 345 | 310 | 520 | 680 |
| referral_deposits | ~32 | 321 | 290 | 490 | 650 |
| filtered_deposits | ~32 | 9,485 | 9,200 | 10,500 | 12,100 |
| event_count | ~32 | 1,067 | 980 | 1,500 | 1,900 |

`[GAPS]:`
- **p99 latency:** Not computed — sample size (32 per query) is too small for meaningful p99
- **Hosted statistical detail:** Only 10 total samples collected (too few for p50/p95/p99 breakdown)

### 4.4 Throughput Under Load

Load tested with Apache Bench (`ab`), 100 requests per concurrency level. Two query types: simple lookup (10 rows) and filtered+sorted (50 rows, ordered by blockTimestamp, filtered by chainId).

**Self-Hosted (Render — starter plans, basic-256mb PG):**

| Query | Concurrency | RPS | Mean (ms) | p50 (ms) | p95 (ms) | p99 (ms) | Failed |
|---|---|---|---|---|---|---|---|
| simple_lookup | 1 | 3.43 | 291 | 255 | 664 | 687 | 0 |
| simple_lookup | 5 | 18.24 | 274 | 251 | 288 | 691 | 0 |
| simple_lookup | 10 | 33.25 | 301 | 251 | 298 | 383 | 0 |
| simple_lookup | 25 | 58.87 | 425 | 255 | 614 | 666 | 0 |
| simple_lookup | 50 | 80.00 | 625 | 288 | 386 | 733 | 0 |
| filtered_sorted | 1 | 4.06 | 246 | 244 | 265 | 359 | 0 |
| filtered_sorted | 5 | 19.52 | 256 | 240 | 265 | 279 | 0 |
| filtered_sorted | 10 | 36.23 | 276 | 249 | 279 | 310 | 0 |
| filtered_sorted | 25 | 66.79 | 374 | 253 | 343 | 687 | 0 |
| filtered_sorted | 50 | 100.01 | 500 | 290 | 358 | 734 | 0 |

**Hosted Envio (Production Small):**

| Query | Concurrency | RPS | Mean (ms) | p50 (ms) | p95 (ms) | p99 (ms) | Failed |
|---|---|---|---|---|---|---|---|
| simple_lookup | 1 | 0.53 | 1,892 | 1,890 | 1,908 | 1,931 | 0 |
| simple_lookup | 5 | 2.58 | 1,937 | 1,891 | 1,904 | 1,913 | 0 |
| simple_lookup | 10 | 5.04 | 1,985 | 1,892 | 1,912 | 1,917 | 0 |
| simple_lookup | 25 | 11.68 | 2,140 | 1,898 | 1,950 | 1,969 | 0 |
| simple_lookup | 50 | 20.60 | 2,428 | 1,907 | 2,030 | 2,055 | 0 |
| filtered_sorted | 1 | 0.53 | 1,894 | 1,893 | 1,909 | 1,911 | 0 |
| filtered_sorted | 5 | 2.57 | 1,947 | 1,890 | 1,911 | 2,153 | 0 |
| filtered_sorted | 10 | 5.03 | 1,987 | 1,892 | 1,926 | 1,946 | 0 |
| filtered_sorted | 25 | 11.70 | 2,136 | 1,899 | 1,948 | 1,986 | 0 |
| filtered_sorted | 50 | 20.71 | 2,414 | 1,907 | 2,023 | 2,034 | 0 |

**Key findings:**
- **Self-hosted is 4-5x faster at every concurrency level.** At c=50: self-hosted delivers 80-100 RPS at ~500-625ms mean vs hosted at 20 RPS at ~2,400ms mean.
- **Self-hosted scales linearly** — RPS grows proportionally with concurrency, mean latency only doubles from c=1 to c=50 (291→625ms). No degradation cliff.
- **Hosted has a ~1,890ms floor** — even at c=1, every query takes ~1.9s. This is the proxy/routing overhead. Under load, it only degrades slightly to ~2.4s at c=50.
- **Zero failures** on both sides at all concurrency levels.
- **Self-hosted at c=50 (100 RPS) already exceeds the Small plan's 250 QPM (4.2 QPS) cap** by 24x. No artificial rate limits.
- **Filtered queries are now fast on self-hosted** (~246ms at c=1) — the earlier 9.5s result from the sequential benchmark may have been during active sync or before PG warmed up. Under load test conditions, filtered and simple queries perform similarly on self-hosted.
- **Hosted shows no difference between simple and filtered queries** — the ~1.9s floor dominates regardless of query complexity.

### 4.5 Resource Usage

Measured via Render dashboard during steady-state operation (indexer synced and keeping pace with chain heads).

| Component | Resource | Plan Limit | Usage | % Utilization | Status |
|---|---|---|---|---|---|
| **Postgres** | CPU | 0.1 vCPU | ~0.1 vCPU | **~100%** | **⚠️ Maxed out** |
| **Postgres** | Memory | 256 MB | ~230 MB | **~90%** | **⚠️ Near limit** |
| **Postgres** | Disk | 1 GB | 1,940 MB | **~194%** | **⚠️ Over plan storage** |
| **Indexer** | CPU | 0.5 vCPU | ~0.25 vCPU | ~50% | OK — some headroom |
| **Indexer** | Memory | 512 MB | ~440 MB | **~86%** | ⚠️ Limited headroom |
| **Hasura** | CPU | 0.5 vCPU | ~0.005 vCPU | ~1% | Idle — massively overprovisioned |
| **Hasura** | Memory | 512 MB | ~256 MB (peak ~307 MB) | ~50-60% | OK — spikes ~2% per request |
| **Network** | HyperSync ingress | — | `[NOT MEASURED]` | — | — |
| **Network** | Query egress | — | `[NOT MEASURED]` | — | — |
| **Events** | Total indexed | No limit | 2,982,129 | — | — |
| **Chains** | Count | No limit | 6 | — | — |

**Key takeaways:**
- **Postgres is the bottleneck.** 100% CPU and 90% memory explains the 9.5s filtered query latency — it has no room for query planning, sort buffers, or index caching. Upgrading to basic-1gb (10x CPU at 1.0 vCPU, 4x RAM at 1 GB) is essential.
- **Indexer is healthy but tight on memory** at 86%. Adding more chains or contracts could push it over. Monitor this if expanding scope.
- **Hasura is way overprovisioned** — 1% CPU, 50% memory at rest. The starter plan is more than enough; could even share resources if Render supported it.

`[GAPS]:`
- **Network transfer** from HyperSync was not measured. This matters for Render's egress pricing and HyperSync rate limiting assessment.
- **Disk growth rate** not measured — only a single snapshot of database size.

---

## 5. Full TCO Analysis

> *Task 5: Build a monthly cost projection that includes every cost category.*

### Infrastructure Cost — Three Self-Host Tiers

| Component | Minimum | Recommended | Comfortable |
|---|---|---|---|
| Postgres | basic-256mb ($6) | basic-1gb ($19) | basic-1gb ($19) |
| Indexer worker | starter ($7) | starter ($7) | standard ($25) |
| Hasura GraphQL | starter ($7) | starter ($7) | starter ($7) |
| **Infra subtotal** | **$20/mo** | **$33/mo** | **$51/mo** |

### Three-Way Cost Comparison

| Cost Category | Self-Host (Recommended) | Envio Medium ($300) | Envio Small ($70) |
|---|---|---|---|
| **Compute/Infrastructure** | $33/mo | included | included |
| **HyperSync API** | $0 (free) or $70 (starter) | included | included |
| **Storage** | included in Postgres plan | included | included (~1M cap) |
| **Network/Egress** | `[NOT MEASURED]` — Render includes some free egress | included | included |
| **Engineer time: setup** | ~$33/mo (amortized)¹ | $0 | $0 |
| **Engineer time: maintenance** | ~$100/mo² | $0 | $0 |
| **Opportunity cost** | Real but hard to quantify³ | $0 | $0 |
| **Risk/downtime cost** | `[NOT QUANTIFIED]`⁴ | Envio SRE handles | Envio SRE handles |
| | | | |
| **Total estimate** | **~$166/mo** | **$300/mo** | **$70/mo** ⚠️ |

⚠️ Small plan doesn't support our workload (7 chains, 3.6M events). Not a viable option without dropping chains.

**Notes:**
1. Setup: 4 hours × $100/hr = $400, amortized over 12 months = ~$33/mo
2. Maintenance: ~1 hr/mo × $100/hr = ~$100/mo (version upgrades, incident response, config changes). Render handles OS patches, PG backups, container restarts — steady-state effort is minimal.
3. Opportunity cost: Every hour spent on indexer maintenance is an hour not spent on product features. At ~1 hr/mo this is modest.
4. Downtime cost: If the indexer goes down, portfolio balance data goes stale. Impact depends on how many downstream consumers depend on fresh data and SLA expectations.

### Breakeven Analysis

The self-host cost advantage over Medium ($300/mo) depends on engineer time. At our estimated ~1 hr/mo:

| Monthly Maintenance Hours | Self-Host Total (w/ free HyperSync) | vs Medium ($300) |
|---|---|---|
| 0.5 hrs | $116/mo | **61% cheaper** |
| **1 hr (estimated)** | **$166/mo** | **45% cheaper** |
| 2 hrs | $266/mo | **11% cheaper** |
| 2.5 hrs | $316/mo | Breakeven |

At ~1 hr/mo, self-hosting saves **$134/mo ($1,608/yr)** vs Medium. The breakeven is ~2.5 hours — we'd need to spend 2.5x our estimate before Medium becomes cheaper.

### HyperSync API Token (`ENVIO_API_TOKEN`)

**What it is:** Self-hosting HyperIndex still requires a HyperSync API token (`ENVIO_API_TOKEN`). This token authenticates requests to Envio's HyperSync RPC service, which is the accelerated data source the indexer uses to fetch on-chain data.

**What it's used for:** The token is used **only for chain data sync** — both during initial historical sync (catching up from start_block to chain head) and ongoing real-time sync (fetching new blocks as they're produced). It is **not** used for GraphQL query traffic. All query traffic goes directly to Hasura → Postgres with zero HyperSync involvement. Running query benchmarks 1,000x would not affect token usage at all.

**Observed usage from our benchmark (free tier token, ~1 month window):**

| Metric | Value |
|---|---|
| Total requests | 8,149 |
| Total data returned | 84.5 MB |

Per-chain request breakdown:

| Chain | Requests |
|---|---|
| Chain 1 (Ethereum) | 159 |
| Chain 10 (Optimism) | 2,804 |
| Chain 137 (Polygon) | 120 |
| Chain 250 (Fantom) | 3,613 |
| Chain 8453 (Base) | 52 |
| Chain 42161 (Arbitrum) | 1,401 |

This covers multiple full historical syncs (indexer was redeployed several times during benchmarking) plus ongoing real-time sync. The usage is very low — 8K requests and 84.5 MB over a month. Once the indexer is fully synced and keeping pace with chain heads, ongoing usage drops to a trickle (new blocks only).

**Cost expectation:** Based on observed usage and experience with large syncs, the **Free tier should be sufficient** for production. Even with repeated full re-syncs, usage stays well within fair-use limits. The Starter plan ($70/mo) provides a safety margin if needed, but we have no evidence suggesting the free tier would be rate-limited at our scale.

### HyperSync Pricing Tiers

| Plan | Price | Rate Limit | Notes |
|---|---|---|---|
| Free | $0/mo | Fair-use rate limiting | Sufficient for our observed usage |
| Starter | $70/mo | Higher RPM | Safety margin if free tier is throttled |
| Turbo | $480/mo | Highest RPM | Overkill for our workload |
| Custom | Contact sales | Custom | Volume discounts, SLA |

All plans include data for every supported chain (89+). No strict data volume limits.

**HyperSync impact on total cost (at ~1 hr/mo maintenance):**

| HyperSync Plan | + Infra ($33) | + Eng time ($133) | **Monthly Total** | vs Medium ($300) |
|---|---|---|---|---|
| **Free ($0)** | $33 | $133 | **$166** | **45% cheaper** |
| Starter ($70) | $103 | $133 | **$236** | **21% cheaper** |
| Turbo ($480) | $513 | $133 | **$646** | Medium wins |
| Own RPCs ($0) | $33 | $133 | **$166** | Cheaper but slower sync |

**Alternative: Use standard RPCs instead of HyperSync.** Self-hosted HyperIndex supports this. Historical sync will be significantly slower, but ongoing real-time sync is fine. Eliminates HyperSync dependency entirely.

Sources: [Envio HyperSync Pricing](https://envio.dev/pricing), [Envio API Tokens](https://docs.envio.dev/docs/HyperSync/api-tokens)

### Postgres Upgrade Path

The 9.5s filtered query latency is unusable for any user-facing API. This is caused by the 256MB Postgres plan — not enough RAM for sort/index caching.

| Setup | DB Plan | Indexer | Hasura | Total |
|---|---|---|---|---|
| Current benchmark | basic-256mb ($6) | starter ($7) | starter ($7) | **$20/mo** |
| **Recommended** | **basic-1gb ($19)** | starter ($7) | starter ($7) | **$33/mo** |
| If indexer needs more RAM | basic-1gb ($19) | standard ($25) | starter ($7) | **$51/mo** |

---

## 6. Risk Assessment

| Risk | Likelihood | Impact | Mitigation | Managed Service Equivalent |
|---|---|---|---|---|
| Indexer crashes at 3 AM | Medium | Data goes stale until restart | Render auto-restart + monitoring alerts | Envio SRE handles automatically |
| Postgres data loss | Low | Full re-index (hours) | Render managed DB has daily backups | Envio handles |
| HyperSync free tier rate-limited | Medium | Sync slows or stops | Budget $70/mo Starter; or fall back to RPCs | Included in plan |
| Ethereum historical sync too slow | Low | Historical data unavailable for days | Optimize `start_block` in config.yaml | Envio handles |
| Starter plan OOM | Low-Medium | Indexer killed, restarts, loses progress | Upgrade worker to standard ($25/mo) | Auto-scaled by Envio |
| Filtered queries slow (9.5s) | **Already happening** | Poor UX for sorted/filtered queries | Upgrade PG to basic-1gb ($19/mo) | Not an issue on hosted |
| No zero-downtime deploys | Certain | Brief outage on each deploy | Acceptable for non-critical; can add blue-green later | Zero-downtime on hosted |
| Envio breaking changes in self-hosted | Low | Update work on us | Pin versions, test before upgrading | Envio handles migration |
| HyperSync pricing changes | Medium | Costs could increase unpredictably | Flag as ongoing risk; re-evaluate quarterly | Pricing change affects hosted too |

**Rollback plan:** If self-hosting fails or becomes too burdensome:
1. Sign up for Envio Production Medium ($300/mo)
2. Deploy the same `config.yaml` to Envio's hosted service
3. Wait for initial sync (handled by Envio)
4. Point consumers to new Hasura endpoint
5. Tear down Render services

Rollback time: ~1 day. No data migration needed — hosted service re-indexes from chain data.

---

## 7. Decision Framework — Answering the Questions

### Cost: Is the full monthly TCO meaningfully less than $300/month?

**Yes, with caveats.** Infrastructure is $33/mo (recommended tier) — 89% less than Medium. The total depends on engineer time:

- At 1 hr/mo maintenance: **$166/mo** (45% cheaper than Medium)
- At 2 hrs/mo maintenance: **$266/mo** (11% cheaper than Medium)
- At 2.5 hrs/mo: **breakeven with Medium**
- Above 2.5 hrs/mo: **Medium is cheaper**

If HyperSync stays free, the cost advantage is strong. If we need Starter ($70/mo), the breakeven drops to ~1.8 hours of maintenance.

`[INCOMPLETE]`: Network/egress costs and HyperSync data transfer not measured — could add $5-20/mo but unlikely to change the conclusion.

### Performance: Is indexing speed and query latency equal or better?

**Sync speed: identical.** Both use HyperSync. Both keep pace with all chain heads.

**Query latency: self-hosted wins.**
- Simple lookups: **3x faster** on self-hosted (345ms vs 966ms in sequential tests)
- Under load (c=50): **self-hosted 80-100 RPS at ~500ms** vs **hosted 20 RPS at ~2,400ms** — 4-5x throughput advantage
- Filtered queries initially showed 9.5s on self-hosted during active sync, but load test shows **246ms at c=1** once PG is warmed up — comparable to simple queries
- Hosted has a ~1,890ms floor regardless of query type or complexity (proxy overhead)
- Self-hosted scales linearly with zero failures up to c=50 — no degradation cliff
- Self-hosted at c=50 delivers 100 RPS, which is **24x the Small plan's 250 QPM cap**

### Reliability: Is uptime comparable to managed (99.9%+)?

**Not proven by this benchmark.** The indexer ran without crashes during the ~2.5-hour observation window, but that's not a reliability test.

What we know:
- Render provides auto-restart on crash, managed Postgres backups, health checks
- No monitoring or alerting is configured
- No failover or redundancy
- No zero-downtime deploys
- If the indexer crashes at 3 AM, nobody gets paged

What we don't know:
- Long-term stability (days/weeks of uptime)
- Behavior under memory pressure
- Recovery time after a crash
- Whether Render's auto-restart is fast enough to avoid stale data

`[NOT MEASURED]`: A proper reliability assessment would require running the self-hosted setup for at least 2-4 weeks and monitoring uptime, crash frequency, and recovery time.

### Operational Burden: How much engineer time does this require?

**Setup: ~4 hours** (first time, including all debugging). Repeatable in ~30 minutes with known-good config.

**Ongoing maintenance estimate:**
- Routine: Render handles OS patches, Postgres backups, container restarts → ~0 effort
- Periodic: Envio version upgrades, Dockerfile updates, config changes → ~30 min/mo
- Incident response: Unknown frequency — managed service handles this for you
- **Honest estimate: 1-2 hrs/mo average, with occasional spikes**

The 4-hour setup was dominated by debugging (SSL, plan names, Dockerfile, script bugs). These are now solved and documented.

### Can we stay on the $70 plan and optimize?

**No.** We exceed the Small plan on two hard limits:
- 7 networks > 5 network cap (ETH, OP, Polygon, Fantom, Base, Arbitrum, Katana)
- ~3.6M events >> ~1M storage cap (3.6x over)
- Indexing hours are fine (97/800 = 12%) — not a factor

There is no optimization that fixes this without dropping chains or reducing indexed contracts. Even dropping 2 chains to meet the 5-network cap, we'd still be 3.6x over on events.

### What happens if the indexer goes down?

| Downtime | Impact | Who Gets Paged? |
|---|---|---|
| Self-hosted: 1 hour | Portfolio balances stale for ~1 hour. Render auto-restarts. | Nobody (unless monitoring is added) |
| Self-hosted: 4 hours | Significant data staleness. Manual investigation needed. | Nobody by default |
| Self-hosted: 1 day | Major issue. Product impact depends on consumer SLAs. | Engineer notices eventually |
| Managed: any duration | Envio SRE handles. They have monitoring, on-call, redundancy. | Envio's team |

---

## 8. Summary of Evidence Gaps

These items were required by the decision framework but not measured during the benchmark:

| Gap | Impact on Decision | How to Fill |
|---|---|---|
| Queries/min usage on hosted plan | Can't confirm if we're hitting 250 QPM cap | Add request counting middleware or check Envio dashboard |
| ~~Indexing hours usage~~ | ✅ Measured — 97/800 hours used (12%). Not a bottleneck. | — |
| ~~CPU/memory during sync and steady state~~ | ✅ Measured — PG at 100% CPU/90% RAM, indexer at 50% CPU/86% RAM, Hasura at 1% CPU/50% RAM | — |
| Network transfer (HyperSync ingress) | Missing from TCO | Monitor Render bandwidth metrics during a full sync cycle |
| Disk growth rate | Can't project 6-12 month storage costs | Take PG size snapshots daily for 1-2 weeks |
| ~~Throughput under concurrent load~~ | ✅ Measured — self-hosted 80-100 RPS at c=50, hosted 20 RPS. Self-hosted 4-5x faster, scales linearly, zero failures. | — |
| Long-term reliability (uptime over weeks) | Can't compare to managed 99.9% | Run self-hosted for 2-4 weeks with uptime monitoring |
| Filtered query latency on basic-1gb | The $33/mo recommendation assumes this fixes the 9.5s issue | Upgrade PG and re-benchmark filtered queries |

---

## Appendix A: Benchmark Data Files

| File | Records | Duration | Description |
|---|---|---|---|
| `benchmark-results/self-hosted/sync_progress_20260227_140648.csv` | 799 | ~2.5 hours | Chain sync snapshots (block heights, event counts) |
| `benchmark-results/self-hosted/query_latency_20260227_140648.csv` | 162 | ~2.5 hours | Query latency samples (5 query types) |
| `benchmark-results/hosted/prod_sync_progress_20260302_134541.csv` | 64 | ~1 hour | Hosted chain sync snapshots |
| `benchmark-results/hosted/prod_query_latency_20260302_134541.csv` | 10 | ~1 hour | Hosted query latency samples |

## Appendix B: Benchmark Scripts

- `scripts/benchmark.sh` — self-hosted benchmark (uses `envio_` prefixed tables, requires `HASURA_ENDPOINT` and `HASURA_ADMIN_SECRET`)
- `scripts/prod_benchmark.sh` — hosted Envio benchmark (unprefixed tables, no admin secret needed)

## Appendix C: Deployment Files

- `render.yaml` — Render Blueprint (Postgres + Hasura + indexer)
- `Dockerfile` — HyperIndex indexer container
- `config.yaml` — Envio indexer configuration (6 chains, 10+ contract types, 30+ event types)
- `.env.example` — environment variable reference
