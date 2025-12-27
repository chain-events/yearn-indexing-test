import {
  YearnV3Vault,
  Deposit,
  Withdraw,
  Transfer,
  StrategyReported,
  DebtUpdated,
  StrategyChanged,
  Shutdown,
} from "generated";

YearnV3Vault.Deposit.handler(async ({ event, context }) => {
  const entity: Deposit = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: event.srcAddress,
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: event.transaction.from ?? event.params.sender,
    logIndex: event.logIndex,
    sender: event.params.sender,
    owner: event.params.owner,
    assets: event.params.assets,
    shares: event.params.shares,
  };
  context.Deposit.set(entity);
});

YearnV3Vault.Withdraw.handler(async ({ event, context }) => {
  const entity: Withdraw = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: event.srcAddress,
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: event.transaction.from ?? event.params.sender,
    logIndex: event.logIndex,
    sender: event.params.sender,
    receiver: event.params.receiver,
    owner: event.params.owner,
    assets: event.params.assets,
    shares: event.params.shares,
  };
  context.Withdraw.set(entity);
});

YearnV3Vault.Transfer.handler(async ({ event, context }) => {
  const entity: Transfer = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: event.srcAddress,
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: event.transaction.from ?? event.params.sender,
    logIndex: event.logIndex,
    sender: event.params.sender,
    receiver: event.params.receiver,
    value: event.params.value,
  };
  context.Transfer.set(entity);
});

YearnV3Vault.StrategyReported.handler(async ({ event, context }) => {
  const entity: StrategyReported = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: event.srcAddress,
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: event.transaction.from,
    logIndex: event.logIndex,
    strategy: event.params.strategy,
    gain: event.params.gain,
    loss: event.params.loss,
    current_debt: event.params.current_debt,
    protocol_fees: event.params.protocol_fees,
    total_fees: event.params.total_fees,
    total_refunds: event.params.total_refunds,
  };
  context.StrategyReported.set(entity);
});

YearnV3Vault.DebtUpdated.handler(async ({ event, context }) => {
  const entity: DebtUpdated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: event.srcAddress,
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: event.transaction.from,
    logIndex: event.logIndex,
    strategy: event.params.strategy,
    current_debt: event.params.current_debt,
    new_debt: event.params.new_debt,
  };
  context.DebtUpdated.set(entity);
});

YearnV3Vault.StrategyChanged.handler(async ({ event, context }) => {
  const entity: StrategyChanged = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: event.srcAddress,
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: event.transaction.from,
    logIndex: event.logIndex,
    strategy: event.params.strategy,
    change_type: event.params.change_type,
  };
  context.StrategyChanged.set(entity);
});

YearnV3Vault.Shutdown.handler(async ({ event, context }) => {
  const entity: Shutdown = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: event.srcAddress,
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: event.transaction.from,
    logIndex: event.logIndex,
  };
  context.Shutdown.set(entity);
});
