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
  RoleStatusChanged,
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
  MapleTimelock,
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
  DebtAllocatorFactory,
  DebtAllocator,
  NewDebtAllocator,
  UpdateStrategyDebtRatios,
  UpdateKeeper,
  GovernanceTransferred,
  UpdateMaxAcceptableBaseFee,
  UpdateMaxDebtUpdateLoss,
  UpdateMinimumChange,
  UpdateMinimumWait,
  Erc4626Vault,
  VotingEscrowFactory,
  VotingEscrowCreated,
  YearnStakingRegistry,
  YearnStakingRegistryIndexed,
  StakingPoolAdded,
  YearnVeyfiRegistry,
  VeyfiGaugeRegistered,
  YearnV2Registry,
  YearnV2Registry2,
  V2RegistryNewVault,
  V2RegistryNewExperimentalVault,
  V2Registry2NewVault,
  YearnV2Strategy,
  V2StrategyMigrated,
  V2StrategyHarvested,
  YearnV2TradeHandler,
  V2TradeEnabled,
  V2TradeDisabled,
  YearnV3Registry,
  V3RegistryNewEndorsedVault,
  YearnV3VaultFactory,
  V3VaultFactoryNewVault,
  YearnV3RoleManagerFactory,
  V3RoleManagerFactoryNewProject,
  YearnV3RoleManager,
  V3RoleManagerAddedNewVault,
  YearnV3Accountant,
  V3AccountantVaultChanged,
  YearnV3Strategy,
  V3StrategyReported,
  YearnV3SplitterFactory,
  V3SplitterNewSplitter,
  YearnV3YieldSplitterFactory,
  V3YieldSplitterNewYieldSplitter,
} from "generated";
import { getAddress } from "viem";

const addr = (a: string | undefined): string | undefined =>
  a ? getAddress(a) : undefined;

const eventId = (event: {
  chainId: number;
  block: { number: number };
  logIndex: number;
}): string => `${event.chainId}_${event.block.number}_${event.logIndex}`;

YearnV3Vault.Deposit.handler(async ({ event, context }) => {
  const entity: Deposit = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: getAddress(event.transaction.from ?? event.params.sender),
    logIndex: event.logIndex,
    sender: getAddress(event.params.sender),
    owner: getAddress(event.params.owner),
    assets: event.params.assets,
    shares: event.params.shares,
  };
  context.Deposit.set(entity);
});

YearnV3Vault.Withdraw.handler(async ({ event, context }) => {
  const entity: Withdraw = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: getAddress(event.transaction.from ?? event.params.sender),
    logIndex: event.logIndex,
    sender: getAddress(event.params.sender),
    receiver: getAddress(event.params.receiver),
    owner: getAddress(event.params.owner),
    assets: event.params.assets,
    shares: event.params.shares,
  };
  context.Withdraw.set(entity);
});

YearnV3Vault.Transfer.handler(async ({ event, context }) => {
  const entity: Transfer = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: getAddress(event.transaction.from ?? event.params.sender),
    logIndex: event.logIndex,
    sender: getAddress(event.params.sender),
    receiver: getAddress(event.params.receiver),
    value: event.params.value,
  };
  context.Transfer.set(entity);
});

YearnV3Vault.StrategyReported.handler(async ({ event, context }) => {
  const entity: StrategyReported = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    strategy: getAddress(event.params.strategy),
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
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    strategy: getAddress(event.params.strategy),
    current_debt: event.params.current_debt,
    new_debt: event.params.new_debt,
  };
  context.DebtUpdated.set(entity);
});

YearnV3Vault.DebtPurchased.handler(async ({ event, context }) => {
  const entity: DebtPurchased = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    strategy: getAddress(event.params.strategy),
    amount: event.params.amount,
  };
  context.DebtPurchased.set(entity);
});

YearnV3Vault.StrategyChanged.contractRegister(({ event, context }) => {
  context.addYearnV3Strategy(getAddress(event.params.strategy));
});

YearnV3Vault.StrategyChanged.handler(async ({ event, context }) => {
  const entity: StrategyChanged = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    strategy: getAddress(event.params.strategy),
    change_type: event.params.change_type,
  };
  context.StrategyChanged.set(entity);
});

YearnV3Vault.UpdatedMaxDebtForStrategy.handler(async ({ event, context }) => {
  const entity: UpdatedMaxDebtForStrategy = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    sender: getAddress(event.params.sender),
    strategy: getAddress(event.params.strategy),
    new_debt: event.params.new_debt,
  };
  context.UpdatedMaxDebtForStrategy.set(entity);
});

YearnV3Vault.RoleSet.handler(async ({ event, context }) => {
  const entity: RoleSet = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    account: getAddress(event.params.account),
    role: event.params.role,
  };
  context.RoleSet.set(entity);
});

YearnV3Vault.RoleStatusChanged.handler(async ({ event, context }) => {
  const entity: RoleStatusChanged = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    role: event.params.role,
    status: event.params.status,
  };
  context.RoleStatusChanged.set(entity);
});

YearnV3Vault.UpdateFutureRoleManager.handler(async ({ event, context }) => {
  const entity: UpdateFutureRoleManager = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    future_role_manager: getAddress(event.params.future_role_manager),
  };
  context.UpdateFutureRoleManager.set(entity);
});

YearnV3Vault.UpdateRoleManager.handler(async ({ event, context }) => {
  const entity: UpdateRoleManager = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    role_manager: getAddress(event.params.role_manager),
  };
  context.UpdateRoleManager.set(entity);
});

YearnV3Vault.UpdateAccountant.handler(async ({ event, context }) => {
  const entity: UpdateAccountant = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    accountant: getAddress(event.params.accountant),
  };
  context.UpdateAccountant.set(entity);
});

YearnV3Vault.UpdateDefaultQueue.handler(async ({ event, context }) => {
  const entity: UpdateDefaultQueue = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    new_default_queue: event.params.new_default_queue.map((a: string) =>
      getAddress(a),
    ),
  };
  context.UpdateDefaultQueue.set(entity);
});

YearnV3Vault.UpdateUseDefaultQueue.handler(async ({ event, context }) => {
  const entity: UpdateUseDefaultQueue = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    use_default_queue: event.params.use_default_queue,
  };
  context.UpdateUseDefaultQueue.set(entity);
});

YearnV3Vault.UpdateAutoAllocate.handler(async ({ event, context }) => {
  const entity: UpdateAutoAllocate = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    auto_allocate: event.params.auto_allocate,
  };
  context.UpdateAutoAllocate.set(entity);
});

YearnV3Vault.UpdateDepositLimit.handler(async ({ event, context }) => {
  const entity: UpdateDepositLimit = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    deposit_limit: event.params.deposit_limit,
  };
  context.UpdateDepositLimit.set(entity);
});

YearnV3Vault.UpdateDepositLimitModule.handler(async ({ event, context }) => {
  const entity: UpdateDepositLimitModule = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    deposit_limit_module: getAddress(event.params.deposit_limit_module),
  };
  context.UpdateDepositLimitModule.set(entity);
});

YearnV3Vault.UpdateWithdrawLimitModule.handler(async ({ event, context }) => {
  const entity: UpdateWithdrawLimitModule = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    withdraw_limit_module: getAddress(event.params.withdraw_limit_module),
  };
  context.UpdateWithdrawLimitModule.set(entity);
});

YearnV3Vault.UpdateMinimumTotalIdle.handler(async ({ event, context }) => {
  const entity: UpdateMinimumTotalIdle = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    minimum_total_idle: event.params.minimum_total_idle,
  };
  context.UpdateMinimumTotalIdle.set(entity);
});

YearnV3Vault.UpdateProfitMaxUnlockTime.handler(async ({ event, context }) => {
  const entity: UpdateProfitMaxUnlockTime = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    profit_max_unlock_time: event.params.profit_max_unlock_time,
  };
  context.UpdateProfitMaxUnlockTime.set(entity);
});

YearnV3Vault.Shutdown.handler(async ({ event, context }) => {
  const entity: Shutdown = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
  };
  context.Shutdown.set(entity);
});

// ─── YearnReferralWrapper Handlers ───────────────────────────────────────────

YearnReferralWrapper.ReferralDeposit.handler(async ({ event, context }) => {
  const entity: ReferralDeposit = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    contractAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    receiver: getAddress(event.params.receiver),
    referrer: getAddress(event.params.referrer),
    vault: getAddress(event.params.vault),
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
    timelockAddress: getAddress(event.srcAddress),
    timelockType: "TimelockController",
    eventName: "CallScheduled",
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    operationId: event.params.id,
    target: getAddress(event.params.target),
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
    timelockAddress: getAddress(event.srcAddress),
    timelockType: "Aave",
    eventName: "ProposalQueued",
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
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
    timelockAddress: getAddress(event.srcAddress),
    timelockType: "Compound",
    eventName: "QueueTransaction",
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    operationId: event.params.txHash,
    target: getAddress(event.params.target),
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
    timelockAddress: getAddress(event.srcAddress),
    timelockType: "Puffer",
    eventName: "TransactionQueued",
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    operationId: event.params.txHash,
    target: getAddress(event.params.target),
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
    timelockAddress: getAddress(event.srcAddress),
    timelockType: "Lido",
    eventName: "StartVote",
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    operationId: event.params.voteId.toString(),
    target: undefined,
    value: undefined,
    data: undefined,
    delay: undefined,
    predecessor: undefined,
    index: undefined,
    signature: undefined,
    creator: getAddress(event.params.creator),
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
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: getAddress(event.transaction.from ?? event.params.sender),
    logIndex: event.logIndex,
    sender: getAddress(event.params.sender),
    receiver: getAddress(event.params.receiver),
    value: event.params.value,
  };
  context.Transfer.set(entity);
});

YearnV2Vault.Deposit.handler(async ({ event, context }) => {
  const entity: V2Deposit = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    recipient: getAddress(event.params.recipient),
    shares: event.params.shares,
    amount: event.params.amount,
  };
  context.V2Deposit.set(entity);
});

YearnV2Vault.Withdraw.handler(async ({ event, context }) => {
  const entity: V2Withdraw = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    recipient: getAddress(event.params.recipient),
    shares: event.params.shares,
    amount: event.params.amount,
  };
  context.V2Withdraw.set(entity);
});

YearnV2Vault.StrategyReported.handler(async ({ event, context }) => {
  const entity: V2StrategyReported = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    strategy: getAddress(event.params.strategy),
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

YearnV2Vault.StrategyAdded.contractRegister(({ event, context }) => {
  context.addYearnV2Strategy(getAddress(event.params.strategy));
});

YearnV2Vault.StrategyAdded.handler(async ({ event, context }) => {
  const entity: V2StrategyAdded = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    strategy: getAddress(event.params.strategy),
    debtRatio: event.params.debtRatio,
    minDebtPerHarvest: event.params.minDebtPerHarvest,
    maxDebtPerHarvest: event.params.maxDebtPerHarvest,
    performanceFee: event.params.performanceFee,
  };
  context.V2StrategyAdded.set(entity);
});

YearnV2Vault.StrategyMigrated.contractRegister(({ event, context }) => {
  context.addYearnV2Strategy(getAddress(event.params.newVersion));
});

YearnV2Vault.StrategyMigrated.handler(async ({ event, context }) => {
  const entity: V2StrategyMigrated = {
    id: eventId(event),
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    oldVersion: getAddress(event.params.oldVersion),
    newVersion: getAddress(event.params.newVersion),
  };
  context.V2StrategyMigrated.set(entity);
});

YearnV2Vault.StrategyRevoked.handler(async ({ event, context }) => {
  const entity: V2StrategyRevoked = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    strategy: getAddress(event.params.strategy),
  };
  context.V2StrategyRevoked.set(entity);
});

YearnV2Vault.UpdateManagement.handler(async ({ event, context }) => {
  const entity: V2UpdateManagement = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    management: getAddress(event.params.management),
  };
  context.V2UpdateManagement.set(entity);
});

YearnV2Vault.UpdateGovernance.handler(async ({ event, context }) => {
  const entity: V2UpdateGovernance = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    governance: getAddress(event.params.governance),
  };
  context.V2UpdateGovernance.set(entity);
});

YearnV2Vault.UpdateGuardian.handler(async ({ event, context }) => {
  const entity: V2UpdateGuardian = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    guardian: getAddress(event.params.guardian),
  };
  context.V2UpdateGuardian.set(entity);
});

YearnV2Vault.UpdateDepositLimit.handler(async ({ event, context }) => {
  const entity: V2UpdateDepositLimit = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    depositLimit: event.params.depositLimit,
  };
  context.V2UpdateDepositLimit.set(entity);
});

YearnV2Vault.UpdatePerformanceFee.handler(async ({ event, context }) => {
  const entity: V2UpdatePerformanceFee = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    performanceFee: event.params.performanceFee,
  };
  context.V2UpdatePerformanceFee.set(entity);
});

YearnV2Vault.UpdateManagementFee.handler(async ({ event, context }) => {
  const entity: V2UpdateManagementFee = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    managementFee: event.params.managementFee,
  };
  context.V2UpdateManagementFee.set(entity);
});

YearnV2Vault.EmergencyShutdown.handler(async ({ event, context }) => {
  const entity: V2EmergencyShutdown = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
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
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: getAddress(event.transaction.from ?? event.params.sender),
    logIndex: event.logIndex,
    sender: getAddress(event.params.sender),
    owner: getAddress(event.params.owner),
    assets: event.params.assets,
    shares: event.params.shares,
  };
  context.Deposit.set(entity);
});

YearnGauge.Withdraw.handler(async ({ event, context }) => {
  const entity: Withdraw = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: getAddress(event.transaction.from ?? event.params.sender),
    logIndex: event.logIndex,
    sender: getAddress(event.params.sender),
    receiver: getAddress(event.params.receiver),
    owner: getAddress(event.params.owner),
    assets: event.params.assets,
    shares: event.params.shares,
  };
  context.Withdraw.set(entity);
});

YearnGauge.Transfer.handler(async ({ event, context }) => {
  const entity: Transfer = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: getAddress(event.transaction.from ?? event.params.sender),
    logIndex: event.logIndex,
    sender: getAddress(event.params.sender),
    receiver: getAddress(event.params.receiver),
    value: event.params.value,
  };
  context.Transfer.set(entity);
});

// ─── Additional Yearn Discovery And Strategy Handlers ───────────────────────

Erc4626Vault.Deposit.handler(async ({ event, context }) => {
  const entity: Deposit = {
    id: eventId(event),
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: getAddress(event.transaction.from ?? event.params.sender),
    logIndex: event.logIndex,
    sender: getAddress(event.params.sender),
    owner: getAddress(event.params.owner),
    assets: event.params.assets,
    shares: event.params.shares,
  };
  context.Deposit.set(entity);
});

Erc4626Vault.Withdraw.handler(async ({ event, context }) => {
  const entity: Withdraw = {
    id: eventId(event),
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: getAddress(event.transaction.from ?? event.params.sender),
    logIndex: event.logIndex,
    sender: getAddress(event.params.sender),
    receiver: getAddress(event.params.receiver),
    owner: getAddress(event.params.owner),
    assets: event.params.assets,
    shares: event.params.shares,
  };
  context.Withdraw.set(entity);
});

VotingEscrowFactory.VestingEscrowCreated.handler(async ({ event, context }) => {
  const entity: VotingEscrowCreated = {
    id: eventId(event),
    factoryAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    funder: getAddress(event.params.funder),
    token: getAddress(event.params.token),
    recipient: getAddress(event.params.recipient),
    escrow: getAddress(event.params.escrow),
    amount: event.params.amount,
    vesting_start: event.params.vesting_start,
    vesting_duration: event.params.vesting_duration,
    cliff_length: event.params.cliff_length,
    open_claim: event.params.open_claim,
  };
  context.VotingEscrowCreated.set(entity);
});

YearnStakingRegistry.StakingPoolAdded.contractRegister(({ event, context }) => {
  context.addYearnGauge(getAddress(event.params.stakingPool));
});

YearnStakingRegistry.StakingPoolAdded.handler(async ({ event, context }) => {
  const entity: StakingPoolAdded = {
    id: eventId(event),
    registryAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    token: getAddress(event.params.token),
    stakingPool: getAddress(event.params.stakingPool),
  };
  context.StakingPoolAdded.set(entity);
});

YearnStakingRegistryIndexed.StakingPoolAdded.contractRegister(
  ({ event, context }) => {
    context.addYearnGauge(getAddress(event.params.stakingPool));
  },
);

YearnStakingRegistryIndexed.StakingPoolAdded.handler(
  async ({ event, context }) => {
    const entity: StakingPoolAdded = {
      id: eventId(event),
      registryAddress: getAddress(event.srcAddress),
      chainId: event.chainId,
      blockNumber: event.block.number,
      blockTimestamp: event.block.timestamp,
      blockHash: event.block.hash,
      transactionHash: event.transaction.hash,
      transactionFrom: addr(event.transaction.from),
      logIndex: event.logIndex,
      token: getAddress(event.params.token),
      stakingPool: getAddress(event.params.stakingPool),
    };
    context.StakingPoolAdded.set(entity);
  },
);

YearnVeyfiRegistry.Register.contractRegister(({ event, context }) => {
  context.addYearnGauge(getAddress(event.params.gauge));
});

YearnVeyfiRegistry.Register.handler(async ({ event, context }) => {
  const entity: VeyfiGaugeRegistered = {
    id: eventId(event),
    registryAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    gauge: getAddress(event.params.gauge),
    idx: event.params.idx,
  };
  context.VeyfiGaugeRegistered.set(entity);
});

YearnV2Registry.NewVault.contractRegister(({ event, context }) => {
  context.addYearnV2Vault(getAddress(event.params.vault));
});

YearnV2Registry.NewVault.handler(async ({ event, context }) => {
  const entity: V2RegistryNewVault = {
    id: eventId(event),
    registryAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    token: getAddress(event.params.token),
    deployment_id: event.params.deployment_id,
    vault: getAddress(event.params.vault),
    api_version: event.params.api_version,
  };
  context.V2RegistryNewVault.set(entity);
});

YearnV2Registry.NewExperimentalVault.contractRegister(({ event, context }) => {
  context.addYearnV2Vault(getAddress(event.params.vault));
});

YearnV2Registry.NewExperimentalVault.handler(async ({ event, context }) => {
  const entity: V2RegistryNewExperimentalVault = {
    id: eventId(event),
    registryAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    token: getAddress(event.params.token),
    deployer: getAddress(event.params.deployer),
    vault: getAddress(event.params.vault),
    api_version: event.params.api_version,
  };
  context.V2RegistryNewExperimentalVault.set(entity);
});

YearnV2Registry2.NewVault.contractRegister(({ event, context }) => {
  context.addYearnV2Vault(getAddress(event.params.vault));
});

YearnV2Registry2.NewVault.handler(async ({ event, context }) => {
  const entity: V2Registry2NewVault = {
    id: eventId(event),
    registryAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    token: getAddress(event.params.token),
    vaultId: event.params.vaultId,
    vaultType: event.params.vaultType,
    vault: getAddress(event.params.vault),
    apiVersion: event.params.apiVersion,
  };
  context.V2Registry2NewVault.set(entity);
});

YearnV2Strategy.Harvested.handler(async ({ event, context }) => {
  const entity: V2StrategyHarvested = {
    id: eventId(event),
    strategyAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    profit: event.params.profit,
    loss: event.params.loss,
    debtPayment: event.params.debtPayment,
    debtOutstanding: event.params.debtOutstanding,
  };
  context.V2StrategyHarvested.set(entity);
});

YearnV2TradeHandler.TradeEnabled.handler(async ({ event, context }) => {
  const entity: V2TradeEnabled = {
    id: eventId(event),
    tradeHandlerAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    seller: getAddress(event.params.seller),
    tokenIn: getAddress(event.params.tokenIn),
    tokenOut: getAddress(event.params.tokenOut),
  };
  context.V2TradeEnabled.set(entity);
});

YearnV2TradeHandler.TradeDisabled.handler(async ({ event, context }) => {
  const entity: V2TradeDisabled = {
    id: eventId(event),
    tradeHandlerAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    seller: getAddress(event.params.seller),
    tokenIn: getAddress(event.params.tokenIn),
    tokenOut: getAddress(event.params.tokenOut),
  };
  context.V2TradeDisabled.set(entity);
});

YearnV3Registry.NewEndorsedVault.contractRegister(({ event, context }) => {
  context.addYearnV3Vault(getAddress(event.params.vault));
});

YearnV3Registry.NewEndorsedVault.handler(async ({ event, context }) => {
  const entity: V3RegistryNewEndorsedVault = {
    id: eventId(event),
    registryAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    vault: getAddress(event.params.vault),
    asset: getAddress(event.params.asset),
    releaseVersion: event.params.releaseVersion,
    vaultType: event.params.vaultType,
  };
  context.V3RegistryNewEndorsedVault.set(entity);
});

YearnV3VaultFactory.NewVault.contractRegister(({ event, context }) => {
  context.addYearnV3Vault(getAddress(event.params.vault_address));
});

YearnV3VaultFactory.NewVault.handler(async ({ event, context }) => {
  const entity: V3VaultFactoryNewVault = {
    id: eventId(event),
    factoryAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    vault_address: getAddress(event.params.vault_address),
    asset: getAddress(event.params.asset),
  };
  context.V3VaultFactoryNewVault.set(entity);
});

YearnV3RoleManagerFactory.NewProject.contractRegister(({ event, context }) => {
  context.addYearnV3RoleManager(getAddress(event.params.roleManager));
});

YearnV3RoleManagerFactory.NewProject.handler(async ({ event, context }) => {
  const entity: V3RoleManagerFactoryNewProject = {
    id: eventId(event),
    factoryAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    projectId: event.params.projectId,
    roleManager: getAddress(event.params.roleManager),
  };
  context.V3RoleManagerFactoryNewProject.set(entity);
});

YearnV3RoleManager.AddedNewVault.contractRegister(({ event, context }) => {
  context.addYearnV3Vault(getAddress(event.params.vault));
  context.addDebtAllocator(getAddress(event.params.debtAllocator));
});

YearnV3RoleManager.AddedNewVault.handler(async ({ event, context }) => {
  const entity: V3RoleManagerAddedNewVault = {
    id: eventId(event),
    roleManagerAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    vault: getAddress(event.params.vault),
    debtAllocator: getAddress(event.params.debtAllocator),
    category: event.params.category,
  };
  context.V3RoleManagerAddedNewVault.set(entity);
});

YearnV3Accountant.VaultChanged.handler(async ({ event, context }) => {
  const entity: V3AccountantVaultChanged = {
    id: eventId(event),
    accountantAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    vault: getAddress(event.params.vault),
    change: event.params.change,
  };
  context.V3AccountantVaultChanged.set(entity);
});

YearnV3Strategy.Reported.handler(async ({ event, context }) => {
  const entity: V3StrategyReported = {
    id: eventId(event),
    strategyAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    profit: event.params.profit,
    loss: event.params.loss,
    protocolFees: event.params.protocolFees,
    performanceFees: event.params.performanceFees,
  };
  context.V3StrategyReported.set(entity);
});

YearnV3SplitterFactory.NewSplitter.handler(async ({ event, context }) => {
  const entity: V3SplitterNewSplitter = {
    id: eventId(event),
    factoryAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    splitter: getAddress(event.params.splitter),
    manager: getAddress(event.params.manager),
    manager_recipient: getAddress(event.params.manager_recipient),
    splitee: getAddress(event.params.splitee),
  };
  context.V3SplitterNewSplitter.set(entity);
});

YearnV3YieldSplitterFactory.NewYieldSplitter.contractRegister(
  ({ event, context }) => {
    context.addYearnV3Strategy(getAddress(event.params.strategy));
    context.addYearnV3Vault(getAddress(event.params.vault));
  },
);

YearnV3YieldSplitterFactory.NewYieldSplitter.handler(
  async ({ event, context }) => {
    const entity: V3YieldSplitterNewYieldSplitter = {
      id: eventId(event),
      factoryAddress: getAddress(event.srcAddress),
      chainId: event.chainId,
      blockNumber: event.block.number,
      blockTimestamp: event.block.timestamp,
      blockHash: event.block.hash,
      transactionHash: event.transaction.hash,
      transactionFrom: addr(event.transaction.from),
      logIndex: event.logIndex,
      strategy: getAddress(event.params.strategy),
      vault: getAddress(event.params.vault),
      want: getAddress(event.params.want),
    };
    context.V3YieldSplitterNewYieldSplitter.set(entity);
  },
);

// ─── DebtAllocatorFactory Handlers ──────────────────────────────────────────
// Each NewDebtAllocator event registers a new DebtAllocator contract for
// dynamic indexing.

DebtAllocatorFactory.NewDebtAllocator.contractRegister(({ event, context }) => {
  context.addDebtAllocator(getAddress(event.params.allocator));
});

DebtAllocatorFactory.NewDebtAllocator.handler(async ({ event, context }) => {
  const entity: NewDebtAllocator = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    factoryAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    allocator: getAddress(event.params.allocator),
    vault: getAddress(event.params.vault),
  };
  context.NewDebtAllocator.set(entity);
});

// ─── DebtAllocator Handlers ─────────────────────────────────────────────────

DebtAllocator.UpdateStrategyDebtRatios.handler(async ({ event, context }) => {
  const entity: UpdateStrategyDebtRatios = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    allocatorAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    strategy: getAddress(event.params.strategy),
    newTargetRatio: event.params.newTargetRatio,
    newMaxRatio: event.params.newMaxRatio,
    newTotalDebtRatio: event.params.newTotalDebtRatio,
  };
  context.UpdateStrategyDebtRatios.set(entity);
});

DebtAllocator.UpdateKeeper.handler(async ({ event, context }) => {
  const entity: UpdateKeeper = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    allocatorAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    keeper: getAddress(event.params.keeper),
    allowed: event.params.allowed,
  };
  context.UpdateKeeper.set(entity);
});

DebtAllocator.GovernanceTransferred.handler(async ({ event, context }) => {
  const entity: GovernanceTransferred = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    allocatorAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    previousGovernance: getAddress(event.params.previousGovernance),
    newGovernance: getAddress(event.params.newGovernance),
  };
  context.GovernanceTransferred.set(entity);
});

DebtAllocator.UpdateMaxAcceptableBaseFee.handler(async ({ event, context }) => {
  const entity: UpdateMaxAcceptableBaseFee = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    allocatorAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    newMaxAcceptableBaseFee: event.params.newMaxAcceptableBaseFee,
  };
  context.UpdateMaxAcceptableBaseFee.set(entity);
});

DebtAllocator.UpdateMaxDebtUpdateLoss.handler(async ({ event, context }) => {
  const entity: UpdateMaxDebtUpdateLoss = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    allocatorAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    newMaxDebtUpdateLoss: event.params.newMaxDebtUpdateLoss,
  };
  context.UpdateMaxDebtUpdateLoss.set(entity);
});

DebtAllocator.UpdateMinimumChange.handler(async ({ event, context }) => {
  const entity: UpdateMinimumChange = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    allocatorAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    newMinimumChange: event.params.newMinimumChange,
  };
  context.UpdateMinimumChange.set(entity);
});

DebtAllocator.UpdateMinimumWait.handler(async ({ event, context }) => {
  const entity: UpdateMinimumWait = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    allocatorAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    newMinimumWait: event.params.newMinimumWait,
  };
  context.UpdateMinimumWait.set(entity);
});

MapleTimelock.ProposalScheduled.handler(async ({ event, context }) => {
  const entity: TimelockEvent = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    timelockAddress: getAddress(event.srcAddress),
    timelockType: "Maple",
    eventName: "ProposalScheduled",
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    operationId: event.params.proposalId.toString(),
    target: undefined,
    value: undefined,
    data: undefined,
    delay: event.params.proposal[3], // delayedUntil (absolute timestamp)
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
