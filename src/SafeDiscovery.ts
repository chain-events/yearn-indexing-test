// =============================================================================
// TEMPORARY / RESEARCH ONLY — Safe multisig discovery
// =============================================================================
// This file is NOT part of the production Yearn indexer. It exists solely for a
// research project enumerating Gnosis Safe deployments on Ethereum mainnet, and
// is wired to the SafeProxyFactory* contract entries marked TEMPORARY / RESEARCH
// ONLY in config.yaml. Nothing in src/EventHandlers.ts depends on it. Remove
// this file (plus the SafeProxyFactory* config entries and the SafeProxy entity
// in schema.graphql) to fully drop the research additions.
// =============================================================================

import { indexer } from "envio";
import type { SafeProxy } from "envio";
import { getAddress } from "viem";

// Known Safe singletons (masterCopies) resolved to their version. The factory is
// permissionless, so any contract can be passed as the singleton; an undefined
// version means an unrecognized singleton (arbitrary contract, or a Safe version
// newer than this map). Sources: safe-global/safe-deployments (canonical +
// eip155 variants), empirically verified via the Safe tx-service /creation/
// endpoint and eth_getLogs.
const SAFE_SINGLETON_VERSIONS: Record<string, string> = Object.fromEntries(
  (
    [
      ["0x34CfAC646f301356fAa8B21e94227e3583Fe3F5F", "1.1.1"],
      ["0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552", "1.3.0"],
      ["0x69f4D1788e39c87893C980c06EdF4b7f686e2938", "1.3.0"],
      ["0x3E5c63644E683549055b9Be8653de26E0B4CD36E", "1.3.0+L2"],
      ["0xfb1bffC9d739B8D520DaF37dF666da4C687191EA", "1.3.0+L2"],
      ["0x41675C099F32341bf84BFc5382aF534df5C7461a", "1.4.1"],
      ["0x29fcB43b46531BcA003ddC8FCB67FFE91900C762", "1.4.1+L2"],
      ["0xFf51A5898e281Db6DfC7855790607438dF2ca44b", "1.5.0"],
      ["0xEdd160fEBBD92E350D4D398fb636302fccd67C7e", "1.5.0+L2"],
    ] as [string, string][]
  ).map(([checksummed, version]) => [getAddress(checksummed), version]),
);

// Shared writer. The ProxyCreation event ABI differs per factory generation
// (verified on-chain via eth_getLogs):
//   v1.1.1:          ProxyCreation(address proxy)                    — proxy in data, no singleton
//   v1.3.0 (both):   ProxyCreation(address proxy, address singleton) — BOTH in data (proxy NOT indexed)
//   v1.4.1 / v1.5.0: ProxyCreation(address indexed proxy, address singleton)
// envio keys events by name within a contract, so each generation is a separate
// config contract (SafeProxyFactory / SafeProxyFactoryV130 / SafeProxyFactoryV111)
// sharing this handler file. envio delivers params by NAME regardless of
// indexed-ness, so all three decode to { proxy, singleton? }.
type ProxyCreationEvent = {
  chainId: number;
  block: { number: number; timestamp: number; hash: string };
  transaction: { hash: string; transactionIndex: number; from: string | undefined };
  logIndex: number;
  srcAddress: string;
  params: { proxy: string; singleton?: string };
};

const saveSafeProxy = async (
  event: ProxyCreationEvent,
  context: { SafeProxy: { set: (e: SafeProxy) => void } },
): Promise<void> => {
  const proxy = getAddress(event.params.proxy);
  const singleton = event.params.singleton ? getAddress(event.params.singleton) : undefined;
  const entity: SafeProxy = {
    id: `${event.chainId}_${proxy}`, // one row per Safe; overwrite on re-creation
    chainId: event.chainId,
    proxy,
    singleton,
    singletonVersion: singleton ? SAFE_SINGLETON_VERSIONS[singleton] : undefined,
    factoryAddress: getAddress(event.srcAddress),
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: event.transaction.from ? getAddress(event.transaction.from) : undefined,
    logIndex: event.logIndex,
  };
  await context.SafeProxy.set(entity);
};

// v1.4.1 + v1.5.0 factories
indexer.onEvent({ contract: "SafeProxyFactory", event: "ProxyCreation" }, async ({ event, context }) => {
  await saveSafeProxy(event, context);
});

// v1.3.0 canonical + eip155 factories (proxy NOT indexed)
indexer.onEvent({ contract: "SafeProxyFactoryV130", event: "ProxyCreation" }, async ({ event, context }) => {
  await saveSafeProxy(event, context);
});

// v1.1.1 factory (no singleton in the event)
indexer.onEvent({ contract: "SafeProxyFactoryV111", event: "ProxyCreation" }, async ({ event, context }) => {
  await saveSafeProxy(event, context);
});
