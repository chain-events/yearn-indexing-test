import {
  YearnV3Vault,
  Deposit,
  Withdraw,
  Transfer,
  StrategyReported,
  DebtUpdated,
  DebtPurchased,
  StrategyChanged,
  UpdatedMaxDebtForStrategy,
  RoleSet,
  UpdateFutureRoleManager,
  UpdateRoleManager,
  UpdateAccountant,
  UpdateDefaultQueue,
  UpdateUseDefaultQueue,
  UpdateAutoAllocate,
  UpdateDepositLimit,
  UpdateDepositLimitModule,
  UpdateWithdrawLimitModule,
  UpdateMinimumTotalIdle,
  UpdateProfitMaxUnlockTime,
  Shutdown,
  TimelockController,
  CallScheduled,
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

YearnV3Vault.DebtPurchased.handler(async ({ event, context }) => {
  const entity: DebtPurchased = {
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
    amount: event.params.amount,
  };
  context.DebtPurchased.set(entity);
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

YearnV3Vault.UpdatedMaxDebtForStrategy.handler(async ({ event, context }) => {
  const entity: UpdatedMaxDebtForStrategy = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: event.srcAddress,
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: event.transaction.from,
    logIndex: event.logIndex,
    sender: event.params.sender,
    strategy: event.params.strategy,
    new_debt: event.params.new_debt,
  };
  context.UpdatedMaxDebtForStrategy.set(entity);
});

YearnV3Vault.RoleSet.handler(async ({ event, context }) => {
  const entity: RoleSet = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: event.srcAddress,
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: event.transaction.from,
    logIndex: event.logIndex,
    account: event.params.account,
    role: event.params.role,
  };
  context.RoleSet.set(entity);
});

YearnV3Vault.UpdateFutureRoleManager.handler(async ({ event, context }) => {
  const entity: UpdateFutureRoleManager = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: event.srcAddress,
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: event.transaction.from,
    logIndex: event.logIndex,
    future_role_manager: event.params.future_role_manager,
  };
  context.UpdateFutureRoleManager.set(entity);
});

YearnV3Vault.UpdateRoleManager.handler(async ({ event, context }) => {
  const entity: UpdateRoleManager = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: event.srcAddress,
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: event.transaction.from,
    logIndex: event.logIndex,
    role_manager: event.params.role_manager,
  };
  context.UpdateRoleManager.set(entity);
});

YearnV3Vault.UpdateAccountant.handler(async ({ event, context }) => {
  const entity: UpdateAccountant = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: event.srcAddress,
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: event.transaction.from,
    logIndex: event.logIndex,
    accountant: event.params.accountant,
  };
  context.UpdateAccountant.set(entity);
});

YearnV3Vault.UpdateDefaultQueue.handler(async ({ event, context }) => {
  const entity: UpdateDefaultQueue = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: event.srcAddress,
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: event.transaction.from,
    logIndex: event.logIndex,
    new_default_queue: event.params.new_default_queue,
  };
  context.UpdateDefaultQueue.set(entity);
});

YearnV3Vault.UpdateUseDefaultQueue.handler(async ({ event, context }) => {
  const entity: UpdateUseDefaultQueue = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: event.srcAddress,
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: event.transaction.from,
    logIndex: event.logIndex,
    use_default_queue: event.params.use_default_queue,
  };
  context.UpdateUseDefaultQueue.set(entity);
});

YearnV3Vault.UpdateAutoAllocate.handler(async ({ event, context }) => {
  const entity: UpdateAutoAllocate = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: event.srcAddress,
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: event.transaction.from,
    logIndex: event.logIndex,
    auto_allocate: event.params.auto_allocate,
  };
  context.UpdateAutoAllocate.set(entity);
});

YearnV3Vault.UpdateDepositLimit.handler(async ({ event, context }) => {
  const entity: UpdateDepositLimit = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: event.srcAddress,
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: event.transaction.from,
    logIndex: event.logIndex,
    deposit_limit: event.params.deposit_limit,
  };
  context.UpdateDepositLimit.set(entity);
});

YearnV3Vault.UpdateDepositLimitModule.handler(async ({ event, context }) => {
  const entity: UpdateDepositLimitModule = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: event.srcAddress,
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: event.transaction.from,
    logIndex: event.logIndex,
    deposit_limit_module: event.params.deposit_limit_module,
  };
  context.UpdateDepositLimitModule.set(entity);
});

YearnV3Vault.UpdateWithdrawLimitModule.handler(async ({ event, context }) => {
  const entity: UpdateWithdrawLimitModule = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: event.srcAddress,
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: event.transaction.from,
    logIndex: event.logIndex,
    withdraw_limit_module: event.params.withdraw_limit_module,
  };
  context.UpdateWithdrawLimitModule.set(entity);
});

YearnV3Vault.UpdateMinimumTotalIdle.handler(async ({ event, context }) => {
  const entity: UpdateMinimumTotalIdle = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: event.srcAddress,
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: event.transaction.from,
    logIndex: event.logIndex,
    minimum_total_idle: event.params.minimum_total_idle,
  };
  context.UpdateMinimumTotalIdle.set(entity);
});

YearnV3Vault.UpdateProfitMaxUnlockTime.handler(async ({ event, context }) => {
  const entity: UpdateProfitMaxUnlockTime = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: event.srcAddress,
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: event.transaction.from,
    logIndex: event.logIndex,
    profit_max_unlock_time: event.params.profit_max_unlock_time,
  };
  context.UpdateProfitMaxUnlockTime.set(entity);
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

TimelockController.CallScheduled.handler(async ({ event, context }) => {
  const entity: CallScheduled = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    timelockAddress: event.srcAddress,
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: event.transaction.from,
    logIndex: event.logIndex,
    operationId: event.params.id,
    index: event.params.index,
    target: event.params.target,
    value: event.params.value,
    data: event.params.data,
    predecessor: event.params.predecessor,
    delay: event.params.delay,
  };
  context.CallScheduled.set(entity);
});
