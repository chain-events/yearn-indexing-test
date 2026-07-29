const RPC_ENV_SUFFIX_BY_CHAIN_ID = new Map([
  [1, "ETHEREUM"],
  [10, "OPTIMISM"],
  [100, "GNOSIS"],
  [137, "POLYGON"],
  [8453, "BASE"],
  [42161, "ARBITRUM"],
  [80094, "BERACHAIN"],
  [747474, "KATANA"],
]);

// These are deliberately hard limits, rather than trusting deployment
// configuration. A malformed environment must not create an unbounded number
// of sockets or a timer that effectively never expires.
const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_TIMEOUT_MS = 120_000;
const MAX_CONCURRENCY = 16;

const boundedTimeout = (value) => {
  const timeout = Number(value);
  return Number.isFinite(timeout) && timeout > 0
    ? Math.min(Math.floor(timeout), MAX_TIMEOUT_MS)
    : DEFAULT_TIMEOUT_MS;
};

const boundedConcurrency = (value) => {
  const concurrency = Number(value);
  return Number.isSafeInteger(concurrency) && concurrency > 0
    ? Math.min(concurrency, MAX_CONCURRENCY)
    : 1;
};

const redactError = (error) => {
  if (error?.name === "AbortError") return "timeout";
  return "request_failed";
};

export const rpcEnvKeyForChain = (chainId) => {
  const suffix = RPC_ENV_SUFFIX_BY_CHAIN_ID.get(Number(chainId));
  return suffix ? `ENVIO_RPC_URL_${suffix}` : undefined;
};

export const fetchLiveHead = async ({ url, fetchImpl = fetch, timeoutMs }) => {
  if (!url) return { source: "rpc", reason: "missing_rpc_url" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), boundedTimeout(timeoutMs));
  try {
    const response = await fetchImpl(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_blockNumber",
        params: [],
      }),
      signal: controller.signal,
    });
    if (!response.ok) return { source: "rpc", reason: `http_${response.status}` };

    const { result } = await response.json();
    if (typeof result !== "string" || !/^0x[0-9a-f]+$/i.test(result)) {
      return { source: "rpc", reason: "invalid_response" };
    }

    const head = Number.parseInt(result, 16);
    return Number.isSafeInteger(head) ? { source: "rpc", head } : { source: "rpc", reason: "invalid_response" };
  } catch (error) {
    return { source: "rpc", reason: redactError(error) };
  } finally {
    clearTimeout(timer);
  }
};

const mapWithConcurrency = async (items, concurrency, fn) => {
  const results = new Array(items.length);
  let index = 0;
  const workers = Array.from(
    { length: Math.min(boundedConcurrency(concurrency), items.length) },
    async () => {
      while (index < items.length) {
        const current = index++;
        results[current] = await fn(items[current]);
      }
    },
  );
  await Promise.all(workers);
  return results;
};

export const observeLiveHeads = async ({
  rows,
  env,
  timeoutMs,
  concurrency,
  fetchImpl,
}) => {
  const uniqueChainIds = [
    ...new Set(rows.map((row) => Number(row.chain_id)).filter(Number.isFinite)),
  ];
  const observations = await mapWithConcurrency(uniqueChainIds, concurrency, async (chainId) => {
    const envKey = rpcEnvKeyForChain(chainId);
    const result = await fetchLiveHead({
      url: envKey ? env[envKey] : undefined,
      fetchImpl,
      timeoutMs,
    });
    return [chainId, { ...result, envKey }];
  });
  return new Map(observations);
};
