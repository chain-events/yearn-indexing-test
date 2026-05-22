import { indexer } from "envio";
import type {
  DebtPurchased,
  DebtUpdated,
  Deposit,
  GovernanceTransferred,
  NewDebtAllocator,
  ReferralDeposit,
  RoleSet,
  RoleStatusChanged,
  Shutdown,
  StakingPoolAdded,
  StrategyChanged,
  StrategyReported,
  TimelockEvent,
  Transfer,
  UpdateAccountant,
  UpdateAutoAllocate,
  UpdateDefaultQueue,
  UpdateDepositLimit,
  UpdateDepositLimitModule,
  UpdateFutureRoleManager,
  UpdateKeeper,
  UpdateMaxAcceptableBaseFee,
  UpdateMaxDebtUpdateLoss,
  UpdateMinimumChange,
  UpdateMinimumTotalIdle,
  UpdateMinimumWait,
  UpdateProfitMaxUnlockTime,
  UpdateRoleManager,
  UpdateStrategyDebtRatios,
  UpdateUseDefaultQueue,
  UpdateWithdrawLimitModule,
  UpdatedMaxDebtForStrategy,
  V2Deposit,
  V2EmergencyShutdown,
  V2FeeReport,
  V2LockedProfitDegradationUpdated,
  V2NewPendingGovernance,
  V2Registry2NewVault,
  V2RegistryNewExperimentalVault,
  V2RegistryNewVault,
  V2StrategyAdded,
  V2StrategyAddedToQueue,
  V2StrategyHarvested,
  V2StrategyMigrated,
  V2StrategyRemovedFromQueue,
  V2StrategyReported,
  V2StrategyRevoked,
  V2StrategyUpdateDebtRatio,
  V2StrategyUpdateMaxDebtPerHarvest,
  V2StrategyUpdateMinDebtPerHarvest,
  V2StrategyUpdatePerformanceFee,
  V2Sweep,
  V2TradeAddressEvent,
  V2TradeDisabled,
  V2TradeEnabled,
  V2UpdateDepositLimit,
  V2UpdateGovernance,
  V2UpdateGuardian,
  V2UpdateManagement,
  V2UpdateManagementFee,
  V2UpdatePerformanceFee,
  V2UpdateRewards,
  V2UpdateWithdrawalQueue,
  V2Withdraw,
  V2WithdrawFromStrategy,
  V3AccountantVaultChanged,
  V3RegistryNewEndorsedVault,
  V3RoleManagerAddedNewVault,
  V3RoleManagerFactoryNewProject,
  V3SplitterNewSplitter,
  V3StrategyReported,
  V3VaultFactoryNewVault,
  V3YieldSplitterNewYieldSplitter,
  VeyfiGaugeRegistered,
  VotingEscrowCreated,
  Withdraw,
} from "envio";
import { getAddress } from "viem";

const addr = (a: string | undefined): string | undefined =>
  a ? getAddress(a) : undefined;

const eventId = (event: {
  chainId: number;
  block: { number: number };
  logIndex: number;
}): string => `${event.chainId}_${event.block.number}_${event.logIndex}`;

const eventCore = (event: any) => ({
  id: eventId(event),
  chainId: event.chainId,
  blockNumber: event.block.number,
  blockTimestamp: event.block.timestamp,
  blockHash: event.block.hash,
  transactionHash: event.transaction.hash,
  transactionIndex: event.transaction.transactionIndex,
  transactionFrom: addr(event.transaction.from),
  logIndex: event.logIndex,
});

indexer.onEvent({ contract: "YearnV3Vault", event: "Deposit" }, async ({ event, context }) => {
  const entity: Deposit = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: getAddress(event.transaction.from ?? event.params.sender),
    logIndex: event.logIndex,
    sender: getAddress(event.params.sender),
    owner: getAddress(event.params.owner),
    assets: event.params.assets,
    shares: event.params.shares,
  };
  context.Deposit.set(entity);
});

indexer.onEvent({ contract: "YearnV3Vault", event: "Withdraw" }, async ({ event, context }) => {
  const entity: Withdraw = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
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

indexer.onEvent({ contract: "YearnV3Vault", event: "Transfer" }, async ({ event, context }) => {
  const entity: Transfer = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: getAddress(event.transaction.from ?? event.params.sender),
    logIndex: event.logIndex,
    sender: getAddress(event.params.sender),
    receiver: getAddress(event.params.receiver),
    value: event.params.value,
  };
  context.Transfer.set(entity);
});

indexer.onEvent({ contract: "YearnV3Vault", event: "StrategyReported" }, async ({ event, context }) => {
  const entity: StrategyReported = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
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

indexer.onEvent({ contract: "YearnV3Vault", event: "DebtUpdated" }, async ({ event, context }) => {
  const entity: DebtUpdated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    strategy: getAddress(event.params.strategy),
    current_debt: event.params.current_debt,
    new_debt: event.params.new_debt,
  };
  context.DebtUpdated.set(entity);
});

indexer.onEvent({ contract: "YearnV3Vault", event: "DebtPurchased" }, async ({ event, context }) => {
  const entity: DebtPurchased = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    strategy: getAddress(event.params.strategy),
    amount: event.params.amount,
  };
  context.DebtPurchased.set(entity);
});

indexer.contractRegister({ contract: "YearnV3Vault", event: "StrategyChanged" }, async ({ event, context }) => {
  context.chain.YearnV3Strategy.add(getAddress(event.params.strategy));
});

indexer.onEvent({ contract: "YearnV3Vault", event: "StrategyChanged" }, async ({ event, context }) => {
  const entity: StrategyChanged = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    strategy: getAddress(event.params.strategy),
    change_type: event.params.change_type,
  };
  context.StrategyChanged.set(entity);
});

indexer.onEvent({ contract: "YearnV3Vault", event: "UpdatedMaxDebtForStrategy" }, async ({ event, context }) => {
  const entity: UpdatedMaxDebtForStrategy = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    sender: getAddress(event.params.sender),
    strategy: getAddress(event.params.strategy),
    new_debt: event.params.new_debt,
  };
  context.UpdatedMaxDebtForStrategy.set(entity);
});

indexer.onEvent({ contract: "YearnV3Vault", event: "RoleSet" }, async ({ event, context }) => {
  const entity: RoleSet = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    account: getAddress(event.params.account),
    role: event.params.role,
  };
  context.RoleSet.set(entity);
});

indexer.onEvent({ contract: "YearnV3Vault", event: "RoleStatusChanged" }, async ({ event, context }) => {
  const entity: RoleStatusChanged = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    role: event.params.role,
    status: event.params.status,
  };
  context.RoleStatusChanged.set(entity);
});

indexer.onEvent({ contract: "YearnV3Vault", event: "UpdateFutureRoleManager" }, async ({ event, context }) => {
  const entity: UpdateFutureRoleManager = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    future_role_manager: getAddress(event.params.future_role_manager),
  };
  context.UpdateFutureRoleManager.set(entity);
});

indexer.onEvent({ contract: "YearnV3Vault", event: "UpdateRoleManager" }, async ({ event, context }) => {
  const entity: UpdateRoleManager = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    role_manager: getAddress(event.params.role_manager),
  };
  context.UpdateRoleManager.set(entity);
});

indexer.onEvent({ contract: "YearnV3Vault", event: "UpdateAccountant" }, async ({ event, context }) => {
  const entity: UpdateAccountant = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    accountant: getAddress(event.params.accountant),
  };
  context.UpdateAccountant.set(entity);
});

indexer.onEvent({ contract: "YearnV3Vault", event: "UpdateDefaultQueue" }, async ({ event, context }) => {
  const entity: UpdateDefaultQueue = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    new_default_queue: event.params.new_default_queue.map((a: string) =>
      getAddress(a),
    ),
  };
  context.UpdateDefaultQueue.set(entity);
});

indexer.onEvent({ contract: "YearnV3Vault", event: "UpdateUseDefaultQueue" }, async ({ event, context }) => {
  const entity: UpdateUseDefaultQueue = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    use_default_queue: event.params.use_default_queue,
  };
  context.UpdateUseDefaultQueue.set(entity);
});

indexer.onEvent({ contract: "YearnV3Vault", event: "UpdateAutoAllocate" }, async ({ event, context }) => {
  const entity: UpdateAutoAllocate = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    auto_allocate: event.params.auto_allocate,
  };
  context.UpdateAutoAllocate.set(entity);
});

indexer.onEvent({ contract: "YearnV3Vault", event: "UpdateDepositLimit" }, async ({ event, context }) => {
  const entity: UpdateDepositLimit = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    deposit_limit: event.params.deposit_limit,
  };
  context.UpdateDepositLimit.set(entity);
});

indexer.onEvent({ contract: "YearnV3Vault", event: "UpdateDepositLimitModule" }, async ({ event, context }) => {
  const entity: UpdateDepositLimitModule = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    deposit_limit_module: getAddress(event.params.deposit_limit_module),
  };
  context.UpdateDepositLimitModule.set(entity);
});

indexer.onEvent({ contract: "YearnV3Vault", event: "UpdateWithdrawLimitModule" }, async ({ event, context }) => {
  const entity: UpdateWithdrawLimitModule = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    withdraw_limit_module: getAddress(event.params.withdraw_limit_module),
  };
  context.UpdateWithdrawLimitModule.set(entity);
});

indexer.onEvent({ contract: "YearnV3Vault", event: "UpdateMinimumTotalIdle" }, async ({ event, context }) => {
  const entity: UpdateMinimumTotalIdle = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    minimum_total_idle: event.params.minimum_total_idle,
  };
  context.UpdateMinimumTotalIdle.set(entity);
});

indexer.onEvent({ contract: "YearnV3Vault", event: "UpdateProfitMaxUnlockTime" }, async ({ event, context }) => {
  const entity: UpdateProfitMaxUnlockTime = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    profit_max_unlock_time: event.params.profit_max_unlock_time,
  };
  context.UpdateProfitMaxUnlockTime.set(entity);
});

indexer.onEvent({ contract: "YearnV3Vault", event: "Shutdown" }, async ({ event, context }) => {
  const entity: Shutdown = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
  };
  context.Shutdown.set(entity);
});

// ─── YearnReferralWrapper Handlers ───────────────────────────────────────────

indexer.onEvent({ contract: "YearnReferralWrapper", event: "ReferralDeposit" }, async ({ event, context }) => {
  const entity: ReferralDeposit = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    contractAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
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

indexer.onEvent({ contract: "TimelockController", event: "CallScheduled" }, async ({ event, context }) => {
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
    transactionIndex: event.transaction.transactionIndex,
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

indexer.onEvent({ contract: "AaveTimelock", event: "ProposalQueued" }, async ({ event, context }) => {
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
    transactionIndex: event.transaction.transactionIndex,
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

indexer.onEvent({ contract: "CompoundTimelock", event: "QueueTransaction" }, async ({ event, context }) => {
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
    transactionIndex: event.transaction.transactionIndex,
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

indexer.onEvent({ contract: "LidoTimelock", event: "StartVote" }, async ({ event, context }) => {
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
    transactionIndex: event.transaction.transactionIndex,
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

indexer.onEvent({ contract: "YearnV2Vault", event: "Transfer" }, async ({ event, context }) => {
  const entity: Transfer = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: getAddress(event.transaction.from ?? event.params.sender),
    logIndex: event.logIndex,
    sender: getAddress(event.params.sender),
    receiver: getAddress(event.params.receiver),
    value: event.params.value,
  };
  context.Transfer.set(entity);
});

indexer.onEvent({ contract: "YearnV2Vault", event: "Deposit" }, async ({ event, context }) => {
  const entity: V2Deposit = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    recipient: getAddress(event.params.recipient),
    shares: event.params.shares,
    amount: event.params.amount,
  };
  context.V2Deposit.set(entity);
});

indexer.onEvent({ contract: "YearnV2Vault", event: "Withdraw" }, async ({ event, context }) => {
  const entity: V2Withdraw = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    recipient: getAddress(event.params.recipient),
    shares: event.params.shares,
    amount: event.params.amount,
  };
  context.V2Withdraw.set(entity);
});

indexer.onEvent({ contract: "YearnV2Vault", event: "Sweep" }, async ({ event, context }) => {
  const entity: V2Sweep = {
    ...eventCore(event),
    vaultAddress: getAddress(event.srcAddress),
    token: getAddress(event.params.token),
    amount: event.params.amount,
  };
  context.V2Sweep.set(entity);
});

indexer.onEvent({ contract: "YearnV2Vault", event: "LockedProfitDegradationUpdated" }, 
  async ({ event, context }) => {
    const entity: V2LockedProfitDegradationUpdated = {
      ...eventCore(event),
      vaultAddress: getAddress(event.srcAddress),
      value: event.params.value,
    };
    context.V2LockedProfitDegradationUpdated.set(entity);
  },
);

indexer.onEvent({ contract: "YearnV2Vault", event: "StrategyReported" }, async ({ event, context }) => {
  const entity: V2StrategyReported = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
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

indexer.onEvent({ contract: "YearnV2Vault", event: "FeeReport" }, async ({ event, context }) => {
  const entity: V2FeeReport = {
    ...eventCore(event),
    vaultAddress: getAddress(event.srcAddress),
    management_fee: event.params.management_fee,
    performance_fee: event.params.performance_fee,
    strategist_fee: event.params.strategist_fee,
    duration: event.params.duration,
  };
  context.V2FeeReport.set(entity);
});

indexer.onEvent({ contract: "YearnV2Vault", event: "WithdrawFromStrategy" }, async ({ event, context }) => {
  const entity: V2WithdrawFromStrategy = {
    ...eventCore(event),
    vaultAddress: getAddress(event.srcAddress),
    strategy: getAddress(event.params.strategy),
    totalDebt: event.params.totalDebt,
    loss: event.params.loss,
  };
  context.V2WithdrawFromStrategy.set(entity);
});

indexer.contractRegister({ contract: "YearnV2Vault", event: "StrategyAdded" }, async ({ event, context }) => {
  context.chain.YearnV2Strategy.add(getAddress(event.params.strategy));
});

indexer.onEvent({ contract: "YearnV2Vault", event: "StrategyAdded" }, async ({ event, context }) => {
  const entity: V2StrategyAdded = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
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

indexer.onEvent({ contract: "YearnV2Vault", event: "StrategyUpdateDebtRatio" }, async ({ event, context }) => {
  const entity: V2StrategyUpdateDebtRatio = {
    ...eventCore(event),
    vaultAddress: getAddress(event.srcAddress),
    strategy: getAddress(event.params.strategy),
    debtRatio: event.params.debtRatio,
  };
  context.V2StrategyUpdateDebtRatio.set(entity);
});

indexer.onEvent({ contract: "YearnV2Vault", event: "StrategyUpdateMinDebtPerHarvest" }, 
  async ({ event, context }) => {
    const entity: V2StrategyUpdateMinDebtPerHarvest = {
      ...eventCore(event),
      vaultAddress: getAddress(event.srcAddress),
      strategy: getAddress(event.params.strategy),
      minDebtPerHarvest: event.params.minDebtPerHarvest,
    };
    context.V2StrategyUpdateMinDebtPerHarvest.set(entity);
  },
);

indexer.onEvent({ contract: "YearnV2Vault", event: "StrategyUpdateMaxDebtPerHarvest" }, 
  async ({ event, context }) => {
    const entity: V2StrategyUpdateMaxDebtPerHarvest = {
      ...eventCore(event),
      vaultAddress: getAddress(event.srcAddress),
      strategy: getAddress(event.params.strategy),
      maxDebtPerHarvest: event.params.maxDebtPerHarvest,
    };
    context.V2StrategyUpdateMaxDebtPerHarvest.set(entity);
  },
);

indexer.onEvent({ contract: "YearnV2Vault", event: "StrategyUpdatePerformanceFee" }, 
  async ({ event, context }) => {
    const entity: V2StrategyUpdatePerformanceFee = {
      ...eventCore(event),
      vaultAddress: getAddress(event.srcAddress),
      strategy: getAddress(event.params.strategy),
      performanceFee: event.params.performanceFee,
    };
    context.V2StrategyUpdatePerformanceFee.set(entity);
  },
);

indexer.contractRegister({ contract: "YearnV2Vault", event: "StrategyMigrated" }, async ({ event, context }) => {
  context.chain.YearnV2Strategy.add(getAddress(event.params.newVersion));
});

indexer.onEvent({ contract: "YearnV2Vault", event: "StrategyMigrated" }, async ({ event, context }) => {
  const entity: V2StrategyMigrated = {
    id: eventId(event),
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    oldVersion: getAddress(event.params.oldVersion),
    newVersion: getAddress(event.params.newVersion),
  };
  context.V2StrategyMigrated.set(entity);
});

indexer.onEvent({ contract: "YearnV2Vault", event: "StrategyRevoked" }, async ({ event, context }) => {
  const entity: V2StrategyRevoked = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    strategy: getAddress(event.params.strategy),
  };
  context.V2StrategyRevoked.set(entity);
});

indexer.onEvent({ contract: "YearnV2Vault", event: "StrategyRemovedFromQueue" }, async ({ event, context }) => {
  const entity: V2StrategyRemovedFromQueue = {
    ...eventCore(event),
    vaultAddress: getAddress(event.srcAddress),
    strategy: getAddress(event.params.strategy),
  };
  context.V2StrategyRemovedFromQueue.set(entity);
});

indexer.onEvent({ contract: "YearnV2Vault", event: "StrategyAddedToQueue" }, async ({ event, context }) => {
  const entity: V2StrategyAddedToQueue = {
    ...eventCore(event),
    vaultAddress: getAddress(event.srcAddress),
    strategy: getAddress(event.params.strategy),
  };
  context.V2StrategyAddedToQueue.set(entity);
});

indexer.onEvent({ contract: "YearnV2Vault", event: "NewPendingGovernance" }, async ({ event, context }) => {
  const entity: V2NewPendingGovernance = {
    ...eventCore(event),
    vaultAddress: getAddress(event.srcAddress),
    pendingGovernance: getAddress(event.params.pendingGovernance),
  };
  context.V2NewPendingGovernance.set(entity);
});

indexer.onEvent({ contract: "YearnV2Vault", event: "UpdateManagement" }, async ({ event, context }) => {
  const entity: V2UpdateManagement = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    management: getAddress(event.params.management),
  };
  context.V2UpdateManagement.set(entity);
});

indexer.onEvent({ contract: "YearnV2Vault", event: "UpdateGovernance" }, async ({ event, context }) => {
  const entity: V2UpdateGovernance = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    governance: getAddress(event.params.governance),
  };
  context.V2UpdateGovernance.set(entity);
});

indexer.onEvent({ contract: "YearnV2Vault", event: "UpdateGuardian" }, async ({ event, context }) => {
  const entity: V2UpdateGuardian = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    guardian: getAddress(event.params.guardian),
  };
  context.V2UpdateGuardian.set(entity);
});

indexer.onEvent({ contract: "YearnV2Vault", event: "UpdateRewards" }, async ({ event, context }) => {
  const entity: V2UpdateRewards = {
    ...eventCore(event),
    vaultAddress: getAddress(event.srcAddress),
    rewards: getAddress(event.params.rewards),
  };
  context.V2UpdateRewards.set(entity);
});

indexer.onEvent({ contract: "YearnV2Vault", event: "UpdateDepositLimit" }, async ({ event, context }) => {
  const entity: V2UpdateDepositLimit = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    depositLimit: event.params.depositLimit,
  };
  context.V2UpdateDepositLimit.set(entity);
});

indexer.onEvent({ contract: "YearnV2Vault", event: "UpdatePerformanceFee" }, async ({ event, context }) => {
  const entity: V2UpdatePerformanceFee = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    performanceFee: event.params.performanceFee,
  };
  context.V2UpdatePerformanceFee.set(entity);
});

indexer.onEvent({ contract: "YearnV2Vault", event: "UpdateManagementFee" }, async ({ event, context }) => {
  const entity: V2UpdateManagementFee = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    managementFee: event.params.managementFee,
  };
  context.V2UpdateManagementFee.set(entity);
});

indexer.onEvent({ contract: "YearnV2Vault", event: "UpdateWithdrawalQueue" }, async ({ event, context }) => {
  const entity: V2UpdateWithdrawalQueue = {
    ...eventCore(event),
    vaultAddress: getAddress(event.srcAddress),
    queue: event.params.queue.map((a: string) => getAddress(a)),
  };
  context.V2UpdateWithdrawalQueue.set(entity);
});

indexer.onEvent({ contract: "YearnV2Vault", event: "EmergencyShutdown" }, async ({ event, context }) => {
  const entity: V2EmergencyShutdown = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    active: event.params.active,
  };
  context.V2EmergencyShutdown.set(entity);
});

// ─── YearnGauge Handlers ────────────────────────────────────────────────────
// Gauge events use the same structure as V3 vaults

indexer.onEvent({ contract: "YearnGauge", event: "Deposit" }, async ({ event, context }) => {
  const entity: Deposit = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: getAddress(event.transaction.from ?? event.params.sender),
    logIndex: event.logIndex,
    sender: getAddress(event.params.sender),
    owner: getAddress(event.params.owner),
    assets: event.params.assets,
    shares: event.params.shares,
  };
  context.Deposit.set(entity);
});

indexer.onEvent({ contract: "YearnGauge", event: "Withdraw" }, async ({ event, context }) => {
  const entity: Withdraw = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
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

indexer.onEvent({ contract: "YearnGauge", event: "Transfer" }, async ({ event, context }) => {
  const entity: Transfer = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: getAddress(event.transaction.from ?? event.params.sender),
    logIndex: event.logIndex,
    sender: getAddress(event.params.sender),
    receiver: getAddress(event.params.receiver),
    value: event.params.value,
  };
  context.Transfer.set(entity);
});

// ─── Additional Yearn Discovery And Strategy Handlers ───────────────────────

indexer.onEvent({ contract: "Erc4626Vault", event: "Deposit" }, async ({ event, context }) => {
  const entity: Deposit = {
    id: eventId(event),
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: getAddress(event.transaction.from ?? event.params.sender),
    logIndex: event.logIndex,
    sender: getAddress(event.params.sender),
    owner: getAddress(event.params.owner),
    assets: event.params.assets,
    shares: event.params.shares,
  };
  context.Deposit.set(entity);
});

indexer.onEvent({ contract: "Erc4626Vault", event: "Withdraw" }, async ({ event, context }) => {
  const entity: Withdraw = {
    id: eventId(event),
    vaultAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
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

indexer.onEvent({ contract: "VotingEscrowFactory", event: "VestingEscrowCreated" }, async ({ event, context }) => {
  const entity: VotingEscrowCreated = {
    id: eventId(event),
    factoryAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
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

indexer.contractRegister({ contract: "YearnStakingRegistry", event: "StakingPoolAdded" }, async ({ event, context }) => {
  context.chain.YearnGauge.add(getAddress(event.params.stakingPool));
});

indexer.onEvent({ contract: "YearnStakingRegistry", event: "StakingPoolAdded" }, async ({ event, context }) => {
  const entity: StakingPoolAdded = {
    id: eventId(event),
    registryAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    token: getAddress(event.params.token),
    stakingPool: getAddress(event.params.stakingPool),
  };
  context.StakingPoolAdded.set(entity);
});

indexer.contractRegister({ contract: "YearnStakingRegistryIndexed", event: "StakingPoolAdded" },
  async ({ event, context }) => {
    context.chain.YearnGauge.add(getAddress(event.params.stakingPool));
  },
);

indexer.onEvent({ contract: "YearnStakingRegistryIndexed", event: "StakingPoolAdded" }, 
  async ({ event, context }) => {
    const entity: StakingPoolAdded = {
      id: eventId(event),
      registryAddress: getAddress(event.srcAddress),
      chainId: event.chainId,
      blockNumber: event.block.number,
      blockTimestamp: event.block.timestamp,
      blockHash: event.block.hash,
      transactionHash: event.transaction.hash,
      transactionIndex: event.transaction.transactionIndex,
      transactionFrom: addr(event.transaction.from),
      logIndex: event.logIndex,
      token: getAddress(event.params.token),
      stakingPool: getAddress(event.params.stakingPool),
    };
    context.StakingPoolAdded.set(entity);
  },
);

indexer.contractRegister({ contract: "YearnVeyfiRegistry", event: "Register" }, async ({ event, context }) => {
  context.chain.YearnGauge.add(getAddress(event.params.gauge));
});

indexer.onEvent({ contract: "YearnVeyfiRegistry", event: "Register" }, async ({ event, context }) => {
  const entity: VeyfiGaugeRegistered = {
    id: eventId(event),
    registryAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    gauge: getAddress(event.params.gauge),
    idx: event.params.idx,
  };
  context.VeyfiGaugeRegistered.set(entity);
});

indexer.contractRegister({ contract: "YearnV2Registry", event: "NewVault" }, async ({ event, context }) => {
  context.chain.YearnV2Vault.add(getAddress(event.params.vault));
});

indexer.onEvent({ contract: "YearnV2Registry", event: "NewVault" }, async ({ event, context }) => {
  const entity: V2RegistryNewVault = {
    id: eventId(event),
    registryAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    token: getAddress(event.params.token),
    deployment_id: event.params.deployment_id,
    vault: getAddress(event.params.vault),
    api_version: event.params.api_version,
  };
  context.V2RegistryNewVault.set(entity);
});

indexer.contractRegister({ contract: "YearnV2Registry", event: "NewExperimentalVault" }, async ({ event, context }) => {
  context.chain.YearnV2Vault.add(getAddress(event.params.vault));
});

indexer.onEvent({ contract: "YearnV2Registry", event: "NewExperimentalVault" }, async ({ event, context }) => {
  const entity: V2RegistryNewExperimentalVault = {
    id: eventId(event),
    registryAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    token: getAddress(event.params.token),
    deployer: getAddress(event.params.deployer),
    vault: getAddress(event.params.vault),
    api_version: event.params.api_version,
  };
  context.V2RegistryNewExperimentalVault.set(entity);
});

indexer.contractRegister({ contract: "YearnV2Registry2", event: "NewVault" }, async ({ event, context }) => {
  context.chain.YearnV2Vault.add(getAddress(event.params.vault));
});

indexer.onEvent({ contract: "YearnV2Registry2", event: "NewVault" }, async ({ event, context }) => {
  const entity: V2Registry2NewVault = {
    id: eventId(event),
    registryAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
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

indexer.onEvent({ contract: "YearnV2Strategy", event: "Harvested" }, async ({ event, context }) => {
  const entity: V2StrategyHarvested = {
    id: eventId(event),
    strategyAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    profit: event.params.profit,
    loss: event.params.loss,
    debtPayment: event.params.debtPayment,
    debtOutstanding: event.params.debtOutstanding,
  };
  context.V2StrategyHarvested.set(entity);
});

const setTradeAddressEvent = (
  event: any,
  context: any,
  eventName: string,
  account: string,
) => {
  const entity: V2TradeAddressEvent = {
    ...eventCore(event),
    tradeHandlerAddress: getAddress(event.srcAddress),
    eventName,
    account: getAddress(account),
  };
  context.V2TradeAddressEvent.set(entity);
};

indexer.onEvent({ contract: "YearnV2TradeHandler", event: "AddedMech" }, async ({ event, context }) => {
  setTradeAddressEvent(event, context, "AddedMech", event.params.mech);
});

indexer.onEvent({ contract: "YearnV2TradeHandler", event: "AddedSolver" }, async ({ event, context }) => {
  setTradeAddressEvent(event, context, "AddedSolver", event.params.solver);
});

indexer.onEvent({ contract: "YearnV2TradeHandler", event: "RemovedMech" }, async ({ event, context }) => {
  setTradeAddressEvent(event, context, "RemovedMech", event.params.mech);
});

indexer.onEvent({ contract: "YearnV2TradeHandler", event: "RemovedSolver" }, async ({ event, context }) => {
  setTradeAddressEvent(event, context, "RemovedSolver", event.params.solver);
});

indexer.onEvent({ contract: "YearnV2TradeHandler", event: "TradeEnabled" }, async ({ event, context }) => {
  const entity: V2TradeEnabled = {
    id: eventId(event),
    tradeHandlerAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    seller: getAddress(event.params.seller),
    tokenIn: getAddress(event.params.tokenIn),
    tokenOut: getAddress(event.params.tokenOut),
  };
  context.V2TradeEnabled.set(entity);
});

indexer.onEvent({ contract: "YearnV2TradeHandler", event: "TradeDisabled" }, async ({ event, context }) => {
  const entity: V2TradeDisabled = {
    id: eventId(event),
    tradeHandlerAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    seller: getAddress(event.params.seller),
    tokenIn: getAddress(event.params.tokenIn),
    tokenOut: getAddress(event.params.tokenOut),
  };
  context.V2TradeDisabled.set(entity);
});

indexer.onEvent({ contract: "YearnV2TradeHandler", event: "UpdatedGovernance" }, async ({ event, context }) => {
  setTradeAddressEvent(
    event,
    context,
    "UpdatedGovernance",
    event.params.governance,
  );
});

indexer.onEvent({ contract: "YearnV2TradeHandler", event: "UpdatedSettlement" }, async ({ event, context }) => {
  setTradeAddressEvent(
    event,
    context,
    "UpdatedSettlement",
    event.params.settlement,
  );
});

indexer.onEvent({ contract: "YearnV2TradeHandler", event: "UpdatedTreasury" }, async ({ event, context }) => {
  setTradeAddressEvent(
    event,
    context,
    "UpdatedTreasury",
    event.params.treasury,
  );
});

indexer.contractRegister({ contract: "YearnV3Registry", event: "NewEndorsedVault" }, async ({ event, context }) => {
  context.chain.YearnV3Vault.add(getAddress(event.params.vault));
});

indexer.onEvent({ contract: "YearnV3Registry", event: "NewEndorsedVault" }, async ({ event, context }) => {
  const entity: V3RegistryNewEndorsedVault = {
    id: eventId(event),
    registryAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    vault: getAddress(event.params.vault),
    asset: getAddress(event.params.asset),
    releaseVersion: event.params.releaseVersion,
    vaultType: event.params.vaultType,
  };
  context.V3RegistryNewEndorsedVault.set(entity);
});

indexer.contractRegister({ contract: "YearnV3VaultFactory", event: "NewVault" }, async ({ event, context }) => {
  context.chain.YearnV3Vault.add(getAddress(event.params.vault_address));
});

indexer.onEvent({ contract: "YearnV3VaultFactory", event: "NewVault" }, async ({ event, context }) => {
  const entity: V3VaultFactoryNewVault = {
    id: eventId(event),
    factoryAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    vault_address: getAddress(event.params.vault_address),
    asset: getAddress(event.params.asset),
  };
  context.V3VaultFactoryNewVault.set(entity);
});

indexer.contractRegister({ contract: "YearnV3RoleManagerFactory", event: "NewProject" }, async ({ event, context }) => {
  context.chain.YearnV3RoleManager.add(getAddress(event.params.roleManager));
});

indexer.onEvent({ contract: "YearnV3RoleManagerFactory", event: "NewProject" }, async ({ event, context }) => {
  const entity: V3RoleManagerFactoryNewProject = {
    id: eventId(event),
    factoryAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    projectId: event.params.projectId,
    roleManager: getAddress(event.params.roleManager),
  };
  context.V3RoleManagerFactoryNewProject.set(entity);
});

indexer.contractRegister({ contract: "YearnV3RoleManager", event: "AddedNewVault" }, async ({ event, context }) => {
  context.chain.YearnV3Vault.add(getAddress(event.params.vault));
  context.chain.DebtAllocator.add(getAddress(event.params.debtAllocator));
});

indexer.onEvent({ contract: "YearnV3RoleManager", event: "AddedNewVault" }, async ({ event, context }) => {
  const entity: V3RoleManagerAddedNewVault = {
    id: eventId(event),
    roleManagerAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    vault: getAddress(event.params.vault),
    debtAllocator: getAddress(event.params.debtAllocator),
    category: event.params.category,
  };
  context.V3RoleManagerAddedNewVault.set(entity);
});

indexer.onEvent({ contract: "YearnV3Accountant", event: "VaultChanged" }, async ({ event, context }) => {
  const entity: V3AccountantVaultChanged = {
    id: eventId(event),
    accountantAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    vault: getAddress(event.params.vault),
    change: event.params.change,
  };
  context.V3AccountantVaultChanged.set(entity);
});

indexer.onEvent({ contract: "YearnV3Strategy", event: "Reported" }, async ({ event, context }) => {
  const entity: V3StrategyReported = {
    id: eventId(event),
    strategyAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    profit: event.params.profit,
    loss: event.params.loss,
    protocolFees: event.params.protocolFees,
    performanceFees: event.params.performanceFees,
  };
  context.V3StrategyReported.set(entity);
});

indexer.onEvent({ contract: "YearnV3SplitterFactory", event: "NewSplitter" }, async ({ event, context }) => {
  const entity: V3SplitterNewSplitter = {
    id: eventId(event),
    factoryAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    splitter: getAddress(event.params.splitter),
    manager: getAddress(event.params.manager),
    manager_recipient: getAddress(event.params.manager_recipient),
    splitee: getAddress(event.params.splitee),
  };
  context.V3SplitterNewSplitter.set(entity);
});

indexer.contractRegister({ contract: "YearnV3YieldSplitterFactory", event: "NewYieldSplitter" },
  async ({ event, context }) => {
    context.chain.YearnV3Strategy.add(getAddress(event.params.strategy));
    context.chain.YearnV3Vault.add(getAddress(event.params.vault));
  },
);

indexer.onEvent({ contract: "YearnV3YieldSplitterFactory", event: "NewYieldSplitter" }, 
  async ({ event, context }) => {
    const entity: V3YieldSplitterNewYieldSplitter = {
      id: eventId(event),
      factoryAddress: getAddress(event.srcAddress),
      chainId: event.chainId,
      blockNumber: event.block.number,
      blockTimestamp: event.block.timestamp,
      blockHash: event.block.hash,
      transactionHash: event.transaction.hash,
      transactionIndex: event.transaction.transactionIndex,
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

indexer.contractRegister({ contract: "DebtAllocatorFactory", event: "NewDebtAllocator" }, async ({ event, context }) => {
  context.chain.DebtAllocator.add(getAddress(event.params.allocator));
});

indexer.onEvent({ contract: "DebtAllocatorFactory", event: "NewDebtAllocator" }, async ({ event, context }) => {
  const entity: NewDebtAllocator = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    factoryAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    allocator: getAddress(event.params.allocator),
    vault: getAddress(event.params.vault),
  };
  context.NewDebtAllocator.set(entity);
});

// ─── DebtAllocator Handlers ─────────────────────────────────────────────────

indexer.onEvent({ contract: "DebtAllocator", event: "UpdateStrategyDebtRatios" }, async ({ event, context }) => {
  const entity: UpdateStrategyDebtRatios = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    allocatorAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    strategy: getAddress(event.params.strategy),
    newTargetRatio: event.params.newTargetRatio,
    newMaxRatio: event.params.newMaxRatio,
    newTotalDebtRatio: event.params.newTotalDebtRatio,
  };
  context.UpdateStrategyDebtRatios.set(entity);
});

indexer.onEvent({ contract: "DebtAllocator", event: "UpdateKeeper" }, async ({ event, context }) => {
  const entity: UpdateKeeper = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    allocatorAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    keeper: getAddress(event.params.keeper),
    allowed: event.params.allowed,
  };
  context.UpdateKeeper.set(entity);
});

indexer.onEvent({ contract: "DebtAllocator", event: "GovernanceTransferred" }, async ({ event, context }) => {
  const entity: GovernanceTransferred = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    allocatorAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    previousGovernance: getAddress(event.params.previousGovernance),
    newGovernance: getAddress(event.params.newGovernance),
  };
  context.GovernanceTransferred.set(entity);
});

indexer.onEvent({ contract: "DebtAllocator", event: "UpdateMaxAcceptableBaseFee" }, async ({ event, context }) => {
  const entity: UpdateMaxAcceptableBaseFee = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    allocatorAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    newMaxAcceptableBaseFee: event.params.newMaxAcceptableBaseFee,
  };
  context.UpdateMaxAcceptableBaseFee.set(entity);
});

indexer.onEvent({ contract: "DebtAllocator", event: "UpdateMaxDebtUpdateLoss" }, async ({ event, context }) => {
  const entity: UpdateMaxDebtUpdateLoss = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    allocatorAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    newMaxDebtUpdateLoss: event.params.newMaxDebtUpdateLoss,
  };
  context.UpdateMaxDebtUpdateLoss.set(entity);
});

indexer.onEvent({ contract: "DebtAllocator", event: "UpdateMinimumChange" }, async ({ event, context }) => {
  const entity: UpdateMinimumChange = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    allocatorAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    newMinimumChange: event.params.newMinimumChange,
  };
  context.UpdateMinimumChange.set(entity);
});

indexer.onEvent({ contract: "DebtAllocator", event: "UpdateMinimumWait" }, async ({ event, context }) => {
  const entity: UpdateMinimumWait = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    allocatorAddress: getAddress(event.srcAddress),
    chainId: event.chainId,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    blockHash: event.block.hash,
    transactionHash: event.transaction.hash,
    transactionIndex: event.transaction.transactionIndex,
    transactionFrom: addr(event.transaction.from),
    logIndex: event.logIndex,
    newMinimumWait: event.params.newMinimumWait,
  };
  context.UpdateMinimumWait.set(entity);
});

indexer.onEvent({ contract: "MapleTimelock", event: "ProposalScheduled" }, async ({ event, context }) => {
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
    transactionIndex: event.transaction.transactionIndex,
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
