import { describe, expect, it, vi } from "vitest";
import { fetchLiveHead, observeLiveHeads, rpcEnvKeyForChain } from "./live-head-source.mjs";

describe("live head source", () => {
  it("gets eth_blockNumber from the chain-specific RPC URL", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({ result: "0x17d7840" }),
    }));

    await expect(
      fetchLiveHead({ url: "https://rpc.example/secret", fetchImpl, timeoutMs: 100 }),
    ).resolves.toEqual({ source: "rpc", head: 25_000_000 });
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toMatchObject({
      method: "eth_blockNumber",
      params: [],
    });
  });

  it("returns a redacted unknown result on RPC failure", async () => {
    const result = await fetchLiveHead({
      url: "https://rpc.example/private-key",
      fetchImpl: async () => {
        throw new Error("https://rpc.example/private-key leaked");
      },
      timeoutMs: 100,
    });

    expect(result).toEqual({ source: "rpc", reason: "request_failed" });
    expect(JSON.stringify(result)).not.toContain("private-key");
  });

  it("redacts timeouts as an unknown RPC head", async () => {
    const timeout = new Error("provider token should not be logged");
    timeout.name = "AbortError";

    await expect(
      fetchLiveHead({
        url: "https://rpc.example/secret",
        fetchImpl: async () => {
          throw timeout;
        },
        timeoutMs: 100,
      }),
    ).resolves.toEqual({ source: "rpc", reason: "timeout" });
  });

  it("treats malformed JSON-RPC replies as unknown heads", async () => {
    await expect(
      fetchLiveHead({
        url: "https://rpc.example/secret",
        fetchImpl: async () => ({
          ok: true,
          json: async () => ({ result: "not-a-hex-block" }),
        }),
        timeoutMs: 100,
      }),
    ).resolves.toEqual({ source: "rpc", reason: "invalid_response" });
  });

  it("uses chain-specific variables with bounded fan-out and leaves unknown chains fail-open", async () => {
    let active = 0;
    let maxActive = 0;
    const fetchImpl = async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await Promise.resolve();
      active -= 1;
      return { ok: true, json: async () => ({ result: "0x10" }) };
    };
    const heads = await observeLiveHeads({
      rows: [{ chain_id: 1 }, { chain_id: 10 }, { chain_id: 999_999 }],
      env: {
        ENVIO_RPC_URL_ETHEREUM: "https://ethereum.example",
        ENVIO_RPC_URL_OPTIMISM: "https://optimism.example",
      },
      timeoutMs: 100,
      concurrency: 1,
      fetchImpl,
    });

    expect(maxActive).toBe(1);
    expect(heads.get(1)).toMatchObject({ head: 16, envKey: "ENVIO_RPC_URL_ETHEREUM" });
    expect(heads.get(10)).toMatchObject({ head: 16, envKey: "ENVIO_RPC_URL_OPTIMISM" });
    expect(heads.get(999_999)).toMatchObject({ reason: "missing_rpc_url" });
    expect(rpcEnvKeyForChain(42161)).toBe("ENVIO_RPC_URL_ARBITRUM");
  });

  it("clamps malformed concurrency instead of skipping head observations", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({ result: "0x10" }),
    }));

    const heads = await observeLiveHeads({
      rows: [{ chain_id: 1 }, { chain_id: 10 }],
      env: {
        ENVIO_RPC_URL_ETHEREUM: "https://ethereum.example",
        ENVIO_RPC_URL_OPTIMISM: "https://optimism.example",
      },
      timeoutMs: 0,
      concurrency: Number.NaN,
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(heads.get(1)).toMatchObject({ head: 16 });
    expect(heads.get(10)).toMatchObject({ head: 16 });
  });
});
