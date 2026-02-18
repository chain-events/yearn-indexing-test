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
  AaveTimelock,
  CompoundTimelock,
  PufferTimelock,
  LidoTimelock,
  TimelockEvent,
  YearnReferralWrapper,
  ReferralDeposit,
  YearnV2Vault,
  V2Deposit,
  V2Withdraw,
  V2StrategyReported,
  V2StrategyAdded,
  V2StrategyRevoked,
  V2UpdateManagement,
  V2UpdateGovernance,
  V2UpdateGuardian,
  V2UpdateDepositLimit,
  V2UpdatePerformanceFee,
  V2UpdateManagementFee,
  V2EmergencyShutdown,
  YearnGauge,
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

// ─── YearnReferralWrapper Handlers ───────────────────────────────────────────

YearnReferralWrapper.ReferralDeposit.handler(async ({ event, context }) => {
  const entity: ReferralDeposit = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    contractAddress: event.srcAddress,
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: event.transaction.from,
    logIndex: event.logIndex,
    receiver: event.params.receiver,
    referrer: event.params.referrer,
    vault: event.params.vault,
    assets: event.params.assets,
    shares: event.params.shares,
  };
  context.ReferralDeposit.set(entity);
});

// ─── Unified Timelock Handlers ───────────────────────────────────────────────
// All timelock events are mapped into a single TimelockEvent entity.

TimelockController.CallScheduled.handler(async ({ event, context }) => {
  const entity: TimelockEvent = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    timelockAddress: event.srcAddress,
    timelockType: "TimelockController",
    eventName: "CallScheduled",
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: event.transaction.from,
    logIndex: event.logIndex,
    operationId: event.params.id,
    target: event.params.target,
    value: event.params.value,
    data: event.params.data,
    delay: event.params.delay,
    predecessor: event.params.predecessor,
    index: event.params.index,
    signature: undefined,
    creator: undefined,
    metadata: undefined,
    votesFor: undefined,
    votesAgainst: undefined,
  };
  context.TimelockEvent.set(entity);
});

AaveTimelock.ProposalQueued.handler(async ({ event, context }) => {
  const entity: TimelockEvent = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    timelockAddress: event.srcAddress,
    timelockType: "Aave",
    eventName: "ProposalQueued",
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: event.transaction.from,
    logIndex: event.logIndex,
    operationId: event.params.proposalId.toString(),
    target: undefined,
    value: undefined,
    data: undefined,
    delay: undefined,
    predecessor: undefined,
    index: undefined,
    signature: undefined,
    creator: undefined,
    metadata: undefined,
    votesFor: event.params.votesFor,
    votesAgainst: event.params.votesAgainst,
  };
  context.TimelockEvent.set(entity);
});

CompoundTimelock.QueueTransaction.handler(async ({ event, context }) => {
  const entity: TimelockEvent = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    timelockAddress: event.srcAddress,
    timelockType: "Compound",
    eventName: "QueueTransaction",
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: event.transaction.from,
    logIndex: event.logIndex,
    operationId: event.params.txHash,
    target: event.params.target,
    value: event.params.value,
    data: event.params.data,
    delay: event.params.eta,
    predecessor: undefined,
    index: undefined,
    signature: event.params.signature,
    creator: undefined,
    metadata: undefined,
    votesFor: undefined,
    votesAgainst: undefined,
  };
  context.TimelockEvent.set(entity);
});

PufferTimelock.TransactionQueued.handler(async ({ event, context }) => {
  const entity: TimelockEvent = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    timelockAddress: event.srcAddress,
    timelockType: "Puffer",
    eventName: "TransactionQueued",
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: event.transaction.from,
    logIndex: event.logIndex,
    operationId: event.params.txHash,
    target: event.params.target,
    value: undefined,
    data: event.params.callData,
    delay: event.params.lockedUntil,
    predecessor: undefined,
    index: undefined,
    signature: undefined,
    creator: undefined,
    metadata: undefined,
    votesFor: undefined,
    votesAgainst: undefined,
  };
  context.TimelockEvent.set(entity);
});

LidoTimelock.StartVote.handler(async ({ event, context }) => {
  const entity: TimelockEvent = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    timelockAddress: event.srcAddress,
    timelockType: "Lido",
    eventName: "StartVote",
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: event.transaction.from,
    logIndex: event.logIndex,
    operationId: event.params.voteId.toString(),
    target: undefined,
    value: undefined,
    data: undefined,
    delay: undefined,
    predecessor: undefined,
    index: undefined,
    signature: undefined,
    creator: event.params.creator,
    metadata: event.params.metadata,
    votesFor: undefined,
    votesAgainst: undefined,
  };
  context.TimelockEvent.set(entity);
});

// ─── YearnV2Vault Handlers ──────────────────────────────────────────────────

YearnV2Vault.Transfer.handler(async ({ event, context }) => {
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

YearnV2Vault.Deposit.handler(async ({ event, context }) => {
  const entity: V2Deposit = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: event.srcAddress,
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: event.transaction.from,
    logIndex: event.logIndex,
    recipient: event.params.recipient,
    shares: event.params.shares,
    amount: event.params.amount,
  };
  context.V2Deposit.set(entity);
});

YearnV2Vault.Withdraw.handler(async ({ event, context }) => {
  const entity: V2Withdraw = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: event.srcAddress,
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: event.transaction.from,
    logIndex: event.logIndex,
    recipient: event.params.recipient,
    shares: event.params.shares,
    amount: event.params.amount,
  };
  context.V2Withdraw.set(entity);
});

YearnV2Vault.StrategyReported.handler(async ({ event, context }) => {
  const entity: V2StrategyReported = {
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
    debtPaid: event.params.debtPaid,
    totalGain: event.params.totalGain,
    totalLoss: event.params.totalLoss,
    totalDebt: event.params.totalDebt,
    debtAdded: event.params.debtAdded,
    debtRatio: event.params.debtRatio,
  };
  context.V2StrategyReported.set(entity);
});

YearnV2Vault.StrategyAdded.handler(async ({ event, context }) => {
  const entity: V2StrategyAdded = {
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
    debtRatio: event.params.debtRatio,
    minDebtPerHarvest: event.params.minDebtPerHarvest,
    maxDebtPerHarvest: event.params.maxDebtPerHarvest,
    performanceFee: event.params.performanceFee,
  };
  context.V2StrategyAdded.set(entity);
});

YearnV2Vault.StrategyRevoked.handler(async ({ event, context }) => {
  const entity: V2StrategyRevoked = {
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
  };
  context.V2StrategyRevoked.set(entity);
});

YearnV2Vault.UpdateManagement.handler(async ({ event, context }) => {
  const entity: V2UpdateManagement = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: event.srcAddress,
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: event.transaction.from,
    logIndex: event.logIndex,
    management: event.params.management,
  };
  context.V2UpdateManagement.set(entity);
});

YearnV2Vault.UpdateGovernance.handler(async ({ event, context }) => {
  const entity: V2UpdateGovernance = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: event.srcAddress,
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: event.transaction.from,
    logIndex: event.logIndex,
    governance: event.params.governance,
  };
  context.V2UpdateGovernance.set(entity);
});

YearnV2Vault.UpdateGuardian.handler(async ({ event, context }) => {
  const entity: V2UpdateGuardian = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: event.srcAddress,
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: event.transaction.from,
    logIndex: event.logIndex,
    guardian: event.params.guardian,
  };
  context.V2UpdateGuardian.set(entity);
});

YearnV2Vault.UpdateDepositLimit.handler(async ({ event, context }) => {
  const entity: V2UpdateDepositLimit = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: event.srcAddress,
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: event.transaction.from,
    logIndex: event.logIndex,
    depositLimit: event.params.depositLimit,
  };
  context.V2UpdateDepositLimit.set(entity);
});

YearnV2Vault.UpdatePerformanceFee.handler(async ({ event, context }) => {
  const entity: V2UpdatePerformanceFee = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: event.srcAddress,
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: event.transaction.from,
    logIndex: event.logIndex,
    performanceFee: event.params.performanceFee,
  };
  context.V2UpdatePerformanceFee.set(entity);
});

YearnV2Vault.UpdateManagementFee.handler(async ({ event, context }) => {
  const entity: V2UpdateManagementFee = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: event.srcAddress,
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: event.transaction.from,
    logIndex: event.logIndex,
    managementFee: event.params.managementFee,
  };
  context.V2UpdateManagementFee.set(entity);
});

YearnV2Vault.EmergencyShutdown.handler(async ({ event, context }) => {
  const entity: V2EmergencyShutdown = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: event.srcAddress,
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: event.transaction.from,
    logIndex: event.logIndex,
    active: event.params.active,
  };
  context.V2EmergencyShutdown.set(entity);
});

// ─── YearnGauge Handlers ────────────────────────────────────────────────────
// Gauge events use the same structure as V3 vaults

YearnGauge.Deposit.handler(async ({ event, context }) => {
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

YearnGauge.Withdraw.handler(async ({ event, context }) => {
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

YearnGauge.Transfer.handler(async ({ event, context }) => {
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
