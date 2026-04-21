# Timelock Indexing

## Indexed Contracts

Five timelock contract types are indexed, each listening for a single event:

### TimelockController (OpenZeppelin-style)

Used by: CAP, ETH+, Lombard, Silo, Renzo (ezETH), EtherFi, KelpDAO (rsETH), Infinifi (Long + Short)

```
CallScheduled(bytes32 indexed id, uint256 indexed index, address target, uint256 value, bytes data, bytes32 predecessor, uint256 delay)
```

This is the most common pattern. It includes the full call details: target contract, ETH value, calldata, a predecessor dependency (for chaining operations), and the delay in seconds before the call can be executed. The `id` is a unique operation identifier (hash of the call parameters), and `index` distinguishes individual calls within a batch operation.

### AaveTimelock

Used by: Aave governance

```
ProposalQueued(uint256 indexed proposalId, uint128 votesFor, uint128 votesAgainst)
```

Aave's governance timelock emits a proposal-centric event. Rather than exposing the raw calldata, it surfaces the proposal ID and the vote tallies at the time of queuing. The actual execution details are resolved on-chain via the proposal ID.

### CompoundTimelock

Used by: Compound, Fluid

```
QueueTransaction(bytes32 indexed txHash, address indexed target, uint value, string signature, bytes data, uint eta)
```

Compound's timelock includes the target address, value, calldata, and notably a human-readable function `signature` (e.g., `"transfer(address,uint256)"`). The `eta` field is the absolute Unix timestamp after which the transaction can be executed (as opposed to a relative delay).

### PufferTimelock

Used by: Puffer Finance

```
TransactionQueued(bytes32 indexed txHash, address indexed target, bytes callData, uint256 indexed operationId, uint256 lockedUntil)
```

Similar to the Compound pattern but uses `operationId` as a numeric identifier and `lockedUntil` as the absolute timestamp when the lock expires. The `callData` field holds the encoded function call.

### LidoTimelock (Aragon Voting)

Used by: Lido DAO

```
StartVote(uint256 indexed voteId, address indexed creator, string metadata)
```

Lido uses Aragon-based governance where votes are the timelock mechanism. The `StartVote` event captures who created the vote and includes a `metadata` string (typically an IPFS hash or description pointing to the proposal details). Execution is gated by the vote outcome, not a time delay.

## Unified `TimelockEvent` Schema

All five events are mapped to this single GraphQL type defined in `schema.graphql`:

```graphql
type TimelockEvent {
  id: ID!
  timelockAddress: String! @index
  timelockType: String! @index       # "TimelockController", "Aave", "Compound", "Puffer", "Lido"
  eventName: String! @index          # Original event name
  chainId: Int! @index
  blockNumber: Int! @index
  blockTimestamp: Int! @index
  blockHash: String!
  transactionHash: String! @index
  transactionFrom: String @index
  logIndex: Int!
  operationId: String @index         # Unified identifier for the queued action
  target: String @index              # Target contract address
  value: BigInt                      # ETH value attached to the call
  data: String                       # Encoded calldata
  delay: BigInt                      # Time delay or absolute eta/lockedUntil
  predecessor: String                # Predecessor operation (TimelockController only)
  index: BigInt                      # Batch index (TimelockController only)
  signature: String                  # Human-readable function signature (Compound only)
  creator: String @index             # Vote creator address (Lido only)
  metadata: String                   # Vote metadata / description (Lido only)
  votesFor: BigInt                   # Votes in favor (Aave only)
  votesAgainst: BigInt               # Votes against (Aave only)
}
```

### Common Fields (always populated)

Every `TimelockEvent` record includes these fields regardless of the source protocol:

- **`timelockAddress`** -- The on-chain address of the timelock contract that emitted the event.
- **`timelockType`** -- A human-readable discriminator: `"TimelockController"`, `"Aave"`, `"Compound"`, `"Puffer"`, or `"Lido"`.
- **`eventName`** -- The original Solidity event name (e.g., `"CallScheduled"`, `"QueueTransaction"`).
- **`operationId`** -- A unified identifier for the queued action, mapped from whichever field the protocol uses (`id`, `proposalId`, `txHash`, `voteId`).
- Standard block/transaction metadata: `chainId`, `blockNumber`, `blockTimestamp`, `blockHash`, `transactionHash`, `transactionFrom`, `logIndex`.

### Field Mapping Table

The table below shows exactly which original event parameter maps to which `TimelockEvent` field for each protocol. A dash (`-`) means the field is not applicable and will be `null`.

| TimelockEvent Field | TimelockController | Aave | Compound | Puffer | Lido |
|---|---|---|---|---|---|
| `timelockType` | `"TimelockController"` | `"Aave"` | `"Compound"` | `"Puffer"` | `"Lido"` |
| `eventName` | `"CallScheduled"` | `"ProposalQueued"` | `"QueueTransaction"` | `"TransactionQueued"` | `"StartVote"` |
| `operationId` | `id` (bytes32) | `proposalId` (uint256) | `txHash` (bytes32) | `txHash` (bytes32) | `voteId` (uint256) |
| `target` | `target` | - | `target` | `target` | - |
| `value` | `value` | - | `value` | - | - |
| `data` | `data` | - | `data` | `callData` | - |
| `delay` | `delay` (relative seconds) | - | `eta` (absolute timestamp) | `lockedUntil` (absolute timestamp) | - |
| `predecessor` | `predecessor` | - | - | - | - |
| `index` | `index` | - | - | - | - |
| `signature` | - | - | `signature` | - | - |
| `creator` | - | - | - | - | `creator` |
| `metadata` | - | - | - | - | `metadata` |
| `votesFor` | - | `votesFor` | - | - | - |
| `votesAgainst` | - | `votesAgainst` | - | - | - |

### Important Notes on `delay`

The `delay` field has different semantics depending on the source:

- **TimelockController**: A *relative* duration in seconds. The operation becomes executable at `blockTimestamp + delay`.
- **Compound** (`eta`): An *absolute* Unix timestamp. The transaction can execute after this time.
- **Puffer** (`lockedUntil`): An *absolute* Unix timestamp. The transaction is locked until this time.
- **Aave** and **Lido**: Do not use a time-based delay in their queuing event. Aave proposals have a separate execution delay configured in the governance contract, and Lido votes are gated by vote outcome rather than time.

## Handler Implementation

All handlers live in `src/EventHandlers.ts`. Each contract's handler follows the same pattern:

1. Receive the decoded event from the indexer runtime.
2. Construct a `TimelockEvent` entity with the common block/transaction fields.
3. Map the protocol-specific event parameters to the corresponding unified fields.
4. Set all inapplicable fields to `undefined` (stored as `null` in the database).
5. Write the entity via `context.TimelockEvent.set(entity)`.

The `id` for each record is `${chainId}_${blockNumber}_${logIndex}`, which guarantees uniqueness across chains and within a single block.

## Example Queries

### Get all timelock events across all protocols

```graphql
{
  TimelockEvent(order_by: { blockTimestamp: desc }, limit: 50) {
    timelockType
    eventName
    timelockAddress
    operationId
    target
    delay
    blockTimestamp
    transactionHash
    chainId
  }
}
```

### Filter by a specific protocol

```graphql
{
  TimelockEvent(where: { timelockType: { _eq: "Compound" } }, order_by: { blockTimestamp: desc }) {
    timelockAddress
    operationId
    target
    value
    signature
    delay
    blockTimestamp
    transactionHash
  }
}
```

### Get all events for a specific timelock address

```graphql
{
  TimelockEvent(where: { timelockAddress: { _eq: "0x3c28b7c7ba1a1f55c9ce66b263b33b204f2126ea" } }) {
    eventName
    operationId
    target
    data
    delay
    blockTimestamp
    transactionHash
  }
}
```
