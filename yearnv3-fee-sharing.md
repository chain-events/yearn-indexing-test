# Yearn V3 Depositor Fee Tracker - Price Per Share Differential Method
## Implementation Specification

---

## Overview

This specification describes how to calculate the exact value of fees accumulated by a specific depositor address in a Yearn V3 vault (e.g., yvUSDC) using the **Price Per Share Differential Method**.

### Core Principle

Fees in Yearn V3 are charged by minting new vault shares, which dilutes existing shareholders. This method calculates fees by comparing:
1. **Theoretical Value**: What the depositor's shares would be worth if no fees were charged
2. **Actual Value**: What the depositor's shares are actually worth with fees charged

The difference represents the total fees paid by the depositor.

---

## Architecture: Using Envio for Off-Chain Data Collection

This implementation leverages the **Envio indexer** infrastructure that already exists in this repository. The architecture consists of two main components:

### 1. Envio Indexer (Off-Chain Data Collection)
- **Purpose**: Automatically collects and indexes vault events from the blockchain
- **Components**:
  - `config.yaml`: Defines which contracts and events to index
  - `src/EventHandlers.ts`: Processes events and stores them in the database
  - `schema.graphql`: Defines the data structure for indexed events
  - PostgreSQL database: Stores indexed event data
  - GraphQL API: Provides query interface at http://localhost:8080

### 2. Fee Calculation Engine (This Specification)
- **Purpose**: Queries indexed events and calculates fees paid by a depositor
- **Data Sources**:
  - **Envio GraphQL API**: For historical event data (Deposits, Withdrawals, Transfers, StrategyReported)
  - **Archive Node RPC**: For historical state queries (only when needed for pricePerShare, totalSupply, etc.)

**Benefits of This Architecture:**
- Event data is collected once and stored locally (no repeated RPC calls)
- Fast GraphQL queries instead of slow event log filtering
- Real-time indexing keeps data up-to-date
- Reduced dependency on archive nodes (only needed for state queries)

---

## Prerequisites

### Required Knowledge
- GraphQL query syntax
- ERC-4626 vault standard
- Basic understanding of Yearn V3 architecture
- Event log parsing
- Understanding of Envio indexer architecture

### Required Infrastructure
- **Envio Indexer**: This repository includes an Envio indexer that automatically collects and indexes vault events
- **Node.js 18+** and **pnpm**
- **Docker Desktop**: Required for running the Envio indexer locally
- **Archive Node Access** (optional): Only needed for real-time state queries (Alchemy, Infura, QuickNode, or self-hosted)

### Required Contract Addresses
You will need:
1. Yearn V3 Vault address (e.g., yvUSDC vault)
2. Vault's Accountant contract address (obtained from vault)
3. VaultFactory address (for protocol fee config)
4. Underlying asset address (e.g., USDC)

---

## Envio Indexer Setup

### Step 0: Running the Envio Indexer

Before calculating fees, you need to ensure the Envio indexer is running and has indexed the relevant vault events.

**Starting the Indexer:**
```bash
# Install dependencies
pnpm install

# Start the indexer (includes GraphQL API on http://localhost:8080)
pnpm dev
```

**Verify Indexer Status:**
Visit http://localhost:8080 to access the GraphQL Playground (password: `testing`)

**Check Indexed Events:**
```graphql
query {
  Deposit(limit: 5, orderBy: { id: "desc" }) {
    items {
      id
      sender
      owner
      assets
      shares
    }
  }
}
```

### Indexed Event Types

The Envio indexer in this repository automatically collects the following events from the Yearn V3 vault:

- **Deposit**: User deposits into the vault
- **Withdraw**: User withdrawals from the vault
- **Transfer**: Share transfers between addresses
- **StrategyReported**: Strategy profit/loss reports with fee information
- **UpdateAccountant**: Changes to the accountant contract
- And various other vault configuration events

All events are stored in a PostgreSQL database and queryable via GraphQL API at `http://localhost:8080`.

---

## Data Collection Phase

### Step 1: Collect Depositor Transaction History

**Objective**: Build a complete timeline of the depositor's interactions with the vault using the Envio GraphQL API.

#### GraphQL Queries for Events

**1.1 Deposit Events**

Query the Envio indexer for all deposits made by a specific address:

```graphql
query GetDepositorDeposits($depositorAddress: String!) {
  Deposit(
    where: { owner: { eq: $depositorAddress } }
    orderBy: { id: "asc" }
  ) {
    items {
      id
      sender
      owner
      assets
      shares
    }
  }
}
```

**Data Available**:
- `id`: Unique identifier in format `{chainId}_{blockNumber}_{logIndex}`
- `owner`: Address that owns the deposited shares
- `sender`: Address that initiated the deposit
- `assets`: Amount of underlying asset deposited
- `shares`: Vault shares received
- `price_per_share_at_deposit`: Can be calculated as `assets / shares`

**1.2 Withdrawal Events**

Query for all withdrawals by a specific address:

```graphql
query GetDepositorWithdrawals($depositorAddress: String!) {
  Withdraw(
    where: { owner: { eq: $depositorAddress } }
    orderBy: { id: "asc" }
  ) {
    items {
      id
      sender
      receiver
      owner
      assets
      shares
    }
  }
}
```

**Data Available**:
- `id`: Unique identifier with block and log index information
- `owner`: Address that owns the shares being withdrawn
- `receiver`: Address receiving the underlying assets
- `assets`: Amount of underlying asset withdrawn
- `shares`: Vault shares burned
- `price_per_share_at_withdrawal`: Can be calculated as `assets / shares`

**1.3 Transfer Events (for share movements)**

Query for share transfers involving the depositor:

```graphql
query GetDepositorTransfers($depositorAddress: String!) {
  transfersFrom: Transfer(
    where: { sender: { eq: $depositorAddress } }
    orderBy: { id: "asc" }
  ) {
    items {
      id
      sender
      receiver
      value
    }
  }

  transfersTo: Transfer(
    where: { receiver: { eq: $depositorAddress } }
    orderBy: { id: "asc" }
  ) {
    items {
      id
      sender
      receiver
      value
    }
  }
}
```

**Purpose**: Detect if depositor transferred shares to another address (reduces their exposure) or received shares from another address.

**Note**: The `id` field format (`{chainId}_{blockNumber}_{logIndex}`) contains the block number, which can be parsed to determine the block when each event occurred.

---

### Step 2: Collect Vault Strategy Report Events

**Objective**: Identify all times when strategies reported profits/losses and fees were charged using the Envio GraphQL API.

#### GraphQL Query for Strategy Reports

Query all strategy reports from the vault:

```graphql
query GetStrategyReports {
  StrategyReported(
    orderBy: { id: "asc" }
  ) {
    items {
      id
      strategy
      gain
      loss
      current_debt
      protocol_fees
      total_fees
      total_refunds
    }
  }
}
```

**Data Available**:
- `id`: Unique identifier in format `{chainId}_{blockNumber}_{logIndex}` (contains block number)
- `strategy`: Strategy address that reported
- `gain`: Profit generated since last report (in underlying asset units)
- `loss`: Loss incurred since last report (in underlying asset units)
- `current_debt`: Current amount of vault assets deployed to this strategy
- `protocol_fees`: Fees paid to Yearn protocol (in vault shares)
- `total_fees`: Total fees charged (in vault shares)
- `total_refunds`: Refunds given back (in underlying asset units)

**Important Notes**:
- `total_fees` includes both protocol fees AND performance fees paid to vault manager
- Fees (`protocol_fees` and `total_fees`) are denominated in vault shares, not underlying asset
- `gain` is the gross profit before fees
- The block number can be extracted from the `id` field for timeline ordering

---

### Step 3: Query Fee Configuration

**Objective**: Understand the fee structure to reconstruct theoretical no-fee scenarios.

#### 3.1 Accountant Contract Fee Configuration

**Contract Call**: `accountant.feeConfig(vault_address)`

Typical return structure:
```solidity
struct FeeConfig {
    uint16 managementFee;      // Annual management fee in basis points
    uint16 performanceFee;     // Performance fee in basis points
    uint16 refundRatio;        // Ratio for fee refunds
    uint16 maxFee;             // Maximum fee cap
    uint16 maxGain;            // Maximum gain to charge fees on
    uint16 maxLoss;            // Maximum loss to recognize
}
```

**Data to Extract**:
- `management_fee_bps`: Annual management fee (e.g., 200 = 2%)
- `performance_fee_bps`: Performance fee on gains (e.g., 1000 = 10%)

**Note**: Management fees are typically charged over time, performance fees on strategy gains.

#### 3.2 Protocol Fee Configuration

**Contract**: VaultFactory address
**Function**: `protocol_fee_config(vault_address)` or `protocol_fee_config()` for default

**Returns**: `protocol_fee_bps` (basis points, e.g., 1000 = 10% of total fees)

**Important**: Protocol fees are a percentage OF the total fees, not a separate fee on gains.

**Example Calculation**:
```
Gain = 100 USDC
Performance Fee = 10% = 10 USDC (in fee shares)
Protocol Fee = 10% of 10 = 1 USDC (of the fee shares)
Vault Manager Fee = 9 USDC (of the fee shares)
```

---

### Step 4: Query Historical State at Key Blocks

**Objective**: Get point-in-time state of the vault and depositor's position.

**Note**: While the Envio indexer provides event data, you still need RPC access (archive node) for historical state queries at specific blocks.

#### Required State Queries

For each deposit, withdrawal, and strategy report block, query using viem or ethers.js:

**4.1 Vault State**
```typescript
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

const client = createPublicClient({
  chain: mainnet,
  transport: http('YOUR_ARCHIVE_NODE_URL'),
});

// At specific block_number:
const [pricePerShare, totalSupply, totalAssets, totalDebt, totalIdle] =
  await Promise.all([
    client.readContract({
      address: vaultAddress,
      abi: vaultAbi,
      functionName: 'pricePerShare',
      blockNumber: blockNumber,
    }),
    client.readContract({
      address: vaultAddress,
      abi: vaultAbi,
      functionName: 'totalSupply',
      blockNumber: blockNumber,
    }),
    client.readContract({
      address: vaultAddress,
      abi: vaultAbi,
      functionName: 'totalAssets',
      blockNumber: blockNumber,
    }),
    // ... additional calls
  ]);
```

**4.2 Depositor State**
```typescript
// At specific block_number:
const depositorBalance = await client.readContract({
  address: vaultAddress,
  abi: vaultAbi,
  functionName: 'balanceOf',
  args: [depositorAddress],
  blockNumber: blockNumber,
});

const assetsValue = await client.readContract({
  address: vaultAddress,
  abi: vaultAbi,
  functionName: 'convertToAssets',
  args: [depositorBalance],
  blockNumber: blockNumber,
});
```

**4.3 Strategy State (for each strategy)**
```typescript
// Query strategy state at specific block
const strategyAssets = await client.readContract({
  address: strategyAddress,
  abi: strategyAbi,
  functionName: 'totalAssets',
  blockNumber: blockNumber,
});
```

---

## Calculation Phase

### Step 5: Build Depositor Position Timeline

**Objective**: Create a chronological record of the depositor's position changes.

#### Data Structure

```typescript
interface PositionSnapshot {
  blockNumber: number;
  timestamp: Date;
  eventType: string; // 'deposit', 'withdraw', 'transfer', 'report'

  // Depositor state
  sharesBalance: bigint;
  sharesChange: bigint; // Delta from previous snapshot
  assetsDeposited: bigint; // Cumulative
  assetsWithdrawn: bigint; // Cumulative

  // Vault state
  totalSupply: bigint;
  totalAssets: bigint;
  pricePerShare: bigint;

  // Ownership
  ownershipPercentage: bigint; // shares_balance / total_supply (in basis points)

  // For report events
  gain: bigint;
  loss: bigint;
  totalFeesShares: bigint;
  protocolFeesShares: bigint;
}

interface DepositorPosition {
  address: string;
  snapshots: PositionSnapshot[];
  currentShares: bigint;
  totalDeposited: bigint;
  totalWithdrawn: bigint;
}
```

**Note**: This specification uses TypeScript with `bigint` for precision. The calculation algorithms shown in later sections use Python-style pseudocode for clarity, but should be implemented with proper big number handling in your chosen language (TypeScript/JavaScript should use `bigint`, Python should use `Decimal`, etc.).

#### Algorithm

```typescript
interface DepositEvent {
  id: string;
  owner: string;
  sender: string;
  assets: bigint;
  shares: bigint;
}

interface WithdrawEvent {
  id: string;
  owner: string;
  receiver: string;
  sender: string;
  assets: bigint;
  shares: bigint;
}

interface TransferEvent {
  id: string;
  sender: string;
  receiver: string;
  value: bigint;
}

interface StrategyReportedEvent {
  id: string;
  strategy: string;
  gain: bigint;
  loss: bigint;
  protocol_fees: bigint;
  total_fees: bigint;
  total_refunds: bigint;
}

// Helper function to parse block number from Envio event ID
function parseBlockNumber(eventId: string): number {
  // ID format: {chainId}_{blockNumber}_{logIndex}
  const parts = eventId.split('_');
  return parseInt(parts[1]);
}

function parseLogIndex(eventId: string): number {
  const parts = eventId.split('_');
  return parseInt(parts[2]);
}

async function buildPositionTimeline(
  depositorAddress: string,
  deposits: DepositEvent[],
  withdrawals: WithdrawEvent[],
  transfers: TransferEvent[],
  reports: StrategyReportedEvent[],
  vaultClient: any, // viem PublicClient
  startBlock: number,
  endBlock: number
): Promise<DepositorPosition> {
  /**
   * Build a complete timeline of depositor's position changes.
   */

  // Combine all events and sort by block number and log index
  const allEvents: Array<{type: string, event: any}> = [
    ...deposits.map(e => ({ type: 'deposit', event: e })),
    ...withdrawals.map(e => ({ type: 'withdraw', event: e })),
    ...transfers.map(e => ({ type: 'transfer', event: e })),
    ...reports.map(e => ({ type: 'report', event: e })),
  ];

  allEvents.sort((a, b) => {
    const blockA = parseBlockNumber(a.event.id);
    const blockB = parseBlockNumber(b.event.id);
    if (blockA !== blockB) return blockA - blockB;
    return parseLogIndex(a.event.id) - parseLogIndex(b.event.id);
  });

  const snapshots: PositionSnapshot[] = [];
  let currentShares = 0n;
  let totalDeposited = 0n;
  let totalWithdrawn = 0n;

  for (const { type: eventType, event } of allEvents) {
    // Parse block number from event ID
    const block = BigInt(parseBlockNumber(event.id));

    // Query vault state at this block using viem
    const [totalSupply, totalAssets, pricePerShare, depositorShares] =
      await Promise.all([
        vaultClient.readContract({
          address: vaultAddress,
          abi: vaultAbi,
          functionName: 'totalSupply',
          blockNumber: block,
        }),
        vaultClient.readContract({
          address: vaultAddress,
          abi: vaultAbi,
          functionName: 'totalAssets',
          blockNumber: block,
        }),
        vaultClient.readContract({
          address: vaultAddress,
          abi: vaultAbi,
          functionName: 'pricePerShare',
          blockNumber: block,
        }),
        vaultClient.readContract({
          address: vaultAddress,
          abi: vaultAbi,
          functionName: 'balanceOf',
          args: [depositorAddress],
          blockNumber: block,
        }),
      ]);

    let sharesChange = 0n;

    if (eventType === 'deposit') {
      sharesChange = event.shares;
      currentShares += sharesChange;
      totalDeposited += event.assets;
    } else if (eventType === 'withdraw') {
      sharesChange = -event.shares;
      currentShares += sharesChange; // shares_change is negative
      totalWithdrawn += event.assets;
    } else if (eventType === 'transfer') {
      if (event.sender.toLowerCase() === depositorAddress.toLowerCase()) {
        sharesChange = -event.value;
      } else {
        // to_address is depositor
        sharesChange = event.value;
      }
      currentShares += sharesChange;
    }

    // Create snapshot
    const snapshot: PositionSnapshot = {
      blockNumber: Number(block),
      timestamp: await getBlockTimestamp(vaultClient, block),
      eventType,
      sharesBalance: depositorShares, // Use actual on-chain value
      sharesChange,
      assetsDeposited: totalDeposited,
      assetsWithdrawn: totalWithdrawn,
      totalSupply,
      totalAssets,
      pricePerShare,
      ownershipPercentage:
        totalSupply > 0n ? (depositorShares * 10000n) / totalSupply : 0n,
      // Add report-specific data
      gain: eventType === 'report' ? event.gain : 0n,
      loss: eventType === 'report' ? event.loss : 0n,
      totalFeesShares: eventType === 'report' ? event.total_fees : 0n,
      protocolFeesShares: eventType === 'report' ? event.protocol_fees : 0n,
    };

    snapshots.push(snapshot);
  }

  return {
    address: depositorAddress,
    snapshots,
    currentShares,
    totalDeposited,
    totalWithdrawn,
  };
}
```

---

### Step 6: Calculate Theoretical No-Fee Position

**Objective**: Determine what the depositor's shares would be worth if no fees were ever charged.

#### Conceptual Approach

The key insight is that fees are charged by **minting new shares**, which dilutes existing shareholders. To calculate the no-fee scenario:

1. Start with the depositor's actual shares at each point in time
2. For each fee event, calculate how much dilution occurred
3. "Undo" the dilution to compute what shares would have been worth
4. Calculate the theoretical value using reconstructed price per share

#### Algorithm

```python
def calculate_theoretical_no_fee_position(
    position: DepositorPosition,
    fee_config: FeeConfig
) -> Decimal:
    """
    Calculate what depositor's shares would be worth without fees.
    
    Returns: Theoretical asset value (in underlying asset units)
    """
    
    # We'll track the theoretical state alongside actual state
    theoretical_snapshots = []
    
    # Starting conditions
    theoretical_total_supply = Decimal('0')
    theoretical_total_assets = Decimal('0')
    
    for snapshot in position.snapshots:
        
        if snapshot.event_type == 'deposit':
            # Deposits are the same in both scenarios
            theoretical_total_supply += snapshot.shares_change
            theoretical_total_assets += Decimal(
                snapshot.shares_change * snapshot.price_per_share
            )
            
        elif snapshot.event_type == 'withdraw':
            # Withdrawals are the same in both scenarios
            theoretical_total_supply += snapshot.shares_change  # negative
            theoretical_total_assets += Decimal(
                snapshot.shares_change * snapshot.price_per_share
            )
            
        elif snapshot.event_type == 'report':
            # This is where fees are charged - adjust for no-fee scenario
            
            # Actual: gain was added and fees were minted
            # Theoretical: gain is added but NO fees are minted
            
            gross_gain = snapshot.gain
            gross_loss = snapshot.loss
            
            # In actual scenario, fees were charged:
            # total_fees_shares were minted
            # This diluted everyone
            
            # In theoretical scenario:
            # No fee shares are minted
            # All gain goes to existing shareholders
            
            net_gain = gross_gain - gross_loss
            
            # Add the full gain to theoretical assets
            theoretical_total_assets += net_gain
            
            # No change to theoretical supply (no fee shares minted)
            # In actual scenario: total_supply increased by total_fees_shares
        
        # Store theoretical state
        theoretical_snapshots.append({
            'block': snapshot.block_number,
            'theoretical_total_supply': theoretical_total_supply,
            'theoretical_total_assets': theoretical_total_assets,
            'theoretical_pps': (
                theoretical_total_assets / theoretical_total_supply 
                if theoretical_total_supply > 0 
                else Decimal('0')
            )
        })
    
    # Calculate final theoretical value
    final_depositor_shares = position.current_shares
    final_theoretical_state = theoretical_snapshots[-1]
    theoretical_pps = final_theoretical_state['theoretical_pps']
    
    theoretical_value = final_depositor_shares * theoretical_pps
    
    return theoretical_value
```

**Important Clarification**: The depositor keeps the SAME number of shares in the theoretical scenario. The difference is:
- **Actual**: Their shares are worth less because PPS decreased due to fee share minting
- **Theoretical**: Their shares are worth more because PPS is higher (no dilution)

---

### Step 7: Calculate Actual Position Value

**Objective**: Determine the current value of the depositor's shares.

This is straightforward:

```python
def calculate_actual_position_value(
    position: DepositorPosition,
    current_price_per_share: Decimal
) -> Decimal:
    """
    Calculate actual current value of depositor's position.
    
    Returns: Actual asset value (in underlying asset units)
    """
    return position.current_shares * current_price_per_share
```

If the depositor has already withdrawn all funds, use the final withdrawal price per share.

---

### Step 8: Calculate Total Fees Paid

**Objective**: The difference between theoretical and actual value.

```python
def calculate_total_fees_paid(
    theoretical_value: Decimal,
    actual_value: Decimal
) -> Decimal:
    """
    Calculate total fees paid by depositor.
    
    Returns: Total fees in underlying asset units
    """
    total_fees = theoretical_value - actual_value
    
    # Sanity check
    if total_fees < 0:
        raise ValueError(
            f"Theoretical value ({theoretical_value}) is less than "
            f"actual value ({actual_value}). This should not happen."
        )
    
    return total_fees
```

---

### Step 9: Break Down Fees by Type

**Objective**: Separate fees into protocol fees vs. performance/management fees.

```python
def calculate_fee_breakdown(
    position: DepositorPosition,
    protocol_fee_bps: int
) -> dict[str, Decimal]:
    """
    Break down total fees into components.
    
    Returns: Dictionary with fee breakdown
    """
    
    total_protocol_fees = Decimal('0')
    total_performance_fees = Decimal('0')
    total_management_fees = Decimal('0')
    
    for snapshot in position.snapshots:
        if snapshot.event_type == 'report':
            # Calculate depositor's share of fees charged in this report
            ownership_pct = snapshot.ownership_percentage
            
            # Protocol fees (in shares, convert to assets)
            protocol_fees_shares = snapshot.protocol_fees_shares
            protocol_fees_assets = protocol_fees_shares * snapshot.price_per_share
            depositor_protocol_fees = protocol_fees_assets * ownership_pct
            total_protocol_fees += depositor_protocol_fees
            
            # Total fees minus protocol fees = vault manager fees
            total_fees_shares = snapshot.total_fees_shares
            total_fees_assets = total_fees_shares * snapshot.price_per_share
            depositor_total_fees = total_fees_assets * ownership_pct
            
            manager_fees = depositor_total_fees - depositor_protocol_fees
            
            # Distinguish between performance and management fees
            # This requires understanding if gain was positive (performance)
            # or if it's time-based (management)
            
            if snapshot.gain > 0:
                # Assume this report includes performance fees
                total_performance_fees += manager_fees
            else:
                # Time-based management fee
                total_management_fees += manager_fees
    
    return {
        'total_fees': total_protocol_fees + total_performance_fees + total_management_fees,
        'protocol_fees': total_protocol_fees,
        'performance_fees': total_performance_fees,
        'management_fees': total_management_fees
    }
```

**Note**: Accurately separating performance vs. management fees requires understanding the Accountant contract's logic, which may charge both in a single report.

---

## Advanced Considerations

### Handling Profit Unlocking

Yearn V3 vaults gradually unlock profits over time (`profit_max_unlock_time`). This means:

- When a strategy reports a gain, it's not immediately reflected in `pricePerShare`
- Profits are distributed linearly over the unlock period (typically 10 days)
- This affects the theoretical calculation

**Solution**: Query `profit_unlocking_rate` and `full_profit_unlock_date` from the vault to reconstruct the exact PPS at any point in time.

```python
def get_exact_price_per_share(
    vault: Contract,
    block_number: int
) -> Decimal:
    """
    Calculate exact price per share including locked profits.
    """
    total_supply = Decimal(vault.functions.totalSupply().call(
        block_identifier=block_number
    ))
    total_assets = Decimal(vault.functions.totalAssets().call(
        block_identifier=block_number
    ))
    
    # Get locked profit info
    profit_unlocking_rate = Decimal(
        vault.functions.profitUnlockingRate().call(
            block_identifier=block_number
        )
    )
    full_profit_unlock_date = vault.functions.fullProfitUnlockDate().call(
        block_identifier=block_number
    )
    last_profit_update = vault.functions.lastProfitUpdate().call(
        block_identifier=block_number
    )
    
    block_timestamp = get_block_timestamp(block_number)
    
    # Calculate unlocked shares
    if block_timestamp >= full_profit_unlock_date:
        unlocked_shares = Decimal('0')
    else:
        time_passed = block_timestamp - last_profit_update
        unlocked_shares = profit_unlocking_rate * Decimal(time_passed) / Decimal(10_000)
    
    effective_supply = total_supply - unlocked_shares
    
    if effective_supply <= 0:
        return Decimal('1')  # 1:1 ratio
    
    return total_assets / effective_supply
```

### Handling Multiple Deposits/Withdrawals

The method naturally handles multiple deposits and withdrawals by tracking the complete timeline. Each deposit/withdrawal adjusts the depositor's share balance, and fees are calculated based on their ownership percentage at each fee event.

### Handling Share Transfers

If the depositor transferred shares to another address or received shares from another address, this must be accounted for:

```python
# In the timeline building step, Transfer events adjust share balance
if event_type == 'transfer':
    if event.from_address == depositor_address:
        # Depositor sent shares away
        current_shares -= event.value
    elif event.to_address == depositor_address:
        # Depositor received shares
        current_shares += event.value
```

### Handling Losses

When a strategy reports a loss, the vault's total assets decrease, lowering the price per share. This is NOT a fee—it's an actual loss.

**Distinction**:
- **Loss**: Decrease in underlying asset value (bad investment performance)
- **Fee**: Decrease in share value due to dilution (cost of vault management)

In the theoretical calculation, losses should STILL apply (they happen regardless of fees). Only fee-related dilution is removed.

---

## Implementation Pseudocode

### High-Level Flow

```typescript
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

// GraphQL client for querying Envio indexer
async function queryEnvioGraphQL(query: string, variables: any) {
  const response = await fetch('http://localhost:8080/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + btoa(':testing'), // Default local password
    },
    body: JSON.stringify({ query, variables }),
  });
  return response.json();
}

async function calculateDepositorFees(
  depositorAddress: string,
  vaultAddress: string,
  fromBlock: number,
  toBlock: number,
  archiveNodeUrl: string
): Promise<FeeCalculationResult> {
  /**
   * Main entry point for fee calculation using Envio indexer data.
   */

  // 1. Initialize viem client for state queries
  const publicClient = createPublicClient({
    chain: mainnet,
    transport: http(archiveNodeUrl),
  });

  // Get contract addresses
  const accountantAddress = await publicClient.readContract({
    address: vaultAddress,
    abi: VAULT_ABI,
    functionName: 'accountant',
  });

  const factoryAddress = await publicClient.readContract({
    address: vaultAddress,
    abi: VAULT_ABI,
    functionName: 'factory',
  });

  // 2. Get fee configuration from chain
  const feeConfig = await publicClient.readContract({
    address: accountantAddress,
    abi: ACCOUNTANT_ABI,
    functionName: 'feeConfig',
    args: [vaultAddress],
  });

  const [protocolFeeBps] = await publicClient.readContract({
    address: factoryAddress,
    abi: FACTORY_ABI,
    functionName: 'protocol_fee_config',
    args: [vaultAddress],
  });

  // 3. Collect events from Envio GraphQL API
  const deposits = await getDepositEvents(depositorAddress);
  const withdrawals = await getWithdrawEvents(depositorAddress);
  const transfers = await getTransferEvents(depositorAddress);
  const reports = await getStrategyReportedEvents();

  // 4. Build position timeline
  const position = await buildPositionTimeline(
    depositorAddress,
    deposits,
    withdrawals,
    transfers,
    reports,
    publicClient,
    fromBlock,
    toBlock
  );

  // 5. Calculate theoretical no-fee value
  const theoreticalValue = calculateTheoreticalNoFeePosition(
    position,
    feeConfig
  );

  // 6. Calculate actual value
  const currentPps = await publicClient.readContract({
    address: vaultAddress,
    abi: VAULT_ABI,
    functionName: 'pricePerShare',
  });
  const actualValue = calculateActualPositionValue(position, currentPps);

  // 7. Calculate total fees
  const totalFees = calculateTotalFeesPaid(theoreticalValue, actualValue);

  // 8. Break down fees
  const feeBreakdown = calculateFeeBreakdown(position, protocolFeeBps);

  // 9. Return results
  return {
    depositorAddress,
    vaultAddress,
    fromBlock,
    toBlock,
    currentShares: position.currentShares.toString(),
    totalDeposited: position.totalDeposited.toString(),
    totalWithdrawn: position.totalWithdrawn.toString(),
    actualValue: actualValue.toString(),
    theoreticalNoFeeValue: theoreticalValue.toString(),
    totalFeesPaid: totalFees.toString(),
    feeBreakdown: {
      totalFees: feeBreakdown.totalFees.toString(),
      protocolFees: feeBreakdown.protocolFees.toString(),
      performanceFees: feeBreakdown.performanceFees.toString(),
      managementFees: feeBreakdown.managementFees.toString(),
    },
    feePercentage:
      theoreticalValue > 0n
        ? ((totalFees * 10000n) / theoreticalValue).toString()
        : '0',
    snapshots: position.snapshots.map((s) => ({
      block: s.blockNumber,
      timestamp: s.timestamp,
      eventType: s.eventType,
      sharesBalance: s.sharesBalance.toString(),
      pricePerShare: s.pricePerShare.toString(),
      ownershipPercentage: (s.ownershipPercentage / 100n).toString(),
    })),
  };
}

// Helper functions to query Envio GraphQL API
async function getDepositEvents(
  depositorAddress: string
): Promise<DepositEvent[]> {
  const query = `
    query GetDepositorDeposits($depositorAddress: String!) {
      Deposit(
        where: { owner: { eq: $depositorAddress } }
        orderBy: { id: "asc" }
      ) {
        items {
          id
          sender
          owner
          assets
          shares
        }
      }
    }
  `;

  const result = await queryEnvioGraphQL(query, { depositorAddress });
  return result.data.Deposit.items;
}

async function getWithdrawEvents(
  depositorAddress: string
): Promise<WithdrawEvent[]> {
  const query = `
    query GetDepositorWithdrawals($depositorAddress: String!) {
      Withdraw(
        where: { owner: { eq: $depositorAddress } }
        orderBy: { id: "asc" }
      ) {
        items {
          id
          sender
          receiver
          owner
          assets
          shares
        }
      }
    }
  `;

  const result = await queryEnvioGraphQL(query, { depositorAddress });
  return result.data.Withdraw.items;
}

async function getTransferEvents(
  depositorAddress: string
): Promise<TransferEvent[]> {
  const query = `
    query GetDepositorTransfers($depositorAddress: String!) {
      transfersFrom: Transfer(
        where: { sender: { eq: $depositorAddress } }
        orderBy: { id: "asc" }
      ) {
        items {
          id
          sender
          receiver
          value
        }
      }
      transfersTo: Transfer(
        where: { receiver: { eq: $depositorAddress } }
        orderBy: { id: "asc" }
      ) {
        items {
          id
          sender
          receiver
          value
        }
      }
    }
  `;

  const result = await queryEnvioGraphQL(query, { depositorAddress });
  return [
    ...result.data.transfersFrom.items,
    ...result.data.transfersTo.items,
  ];
}

async function getStrategyReportedEvents(): Promise<
  StrategyReportedEvent[]
> {
  const query = `
    query GetStrategyReports {
      StrategyReported(orderBy: { id: "asc" }) {
        items {
          id
          strategy
          gain
          loss
          current_debt
          protocol_fees
          total_fees
          total_refunds
        }
      }
    }
  `;

  const result = await queryEnvioGraphQL(query, {});
  return result.data.StrategyReported.items;
}
```

---

## Data Validation & Sanity Checks

### Validation Checks to Implement

```python
def validate_calculations(
    position: DepositorPosition,
    actual_value: Decimal,
    theoretical_value: Decimal,
    vault: Contract
) -> list[str]:
    """
    Perform sanity checks on calculations.
    
    Returns: List of warnings/errors
    """
    warnings = []
    
    # Check 1: Theoretical value should be >= actual value
    if theoretical_value < actual_value:
        warnings.append(
            f"ERROR: Theoretical value ({theoretical_value}) < "
            f"Actual value ({actual_value})"
        )
    
    # Check 2: Share balance should match on-chain value
    on_chain_balance = Decimal(vault.functions.balanceOf(
        position.address
    ).call())
    if abs(on_chain_balance - position.current_shares) > Decimal('0.000001'):
        warnings.append(
            f"WARNING: Calculated shares ({position.current_shares}) "
            f"!= on-chain ({on_chain_balance})"
        )
    
    # Check 3: Deposited - Withdrawn should be reasonable
    net_flow = position.total_deposited - position.total_withdrawn
    if actual_value > net_flow * Decimal('2'):
        warnings.append(
            f"WARNING: Actual value ({actual_value}) seems too high "
            f"compared to net flow ({net_flow}). Check for errors."
        )
    
    # Check 4: All snapshots should have positive ownership percentage
    for snapshot in position.snapshots:
        if snapshot.ownership_percentage < 0:
            warnings.append(
                f"ERROR: Negative ownership at block {snapshot.block_number}"
            )
    
    return warnings
```

---

## Output Format

### Expected Output Structure

```json
{
  "depositor_address": "0x1234...5678",
  "vault_address": "0xabcd...ef00",
  "vault_name": "yvUSDC-1",
  "underlying_asset": "USDC",
  "from_block": 17000000,
  "to_block": 18000000,
  "analysis_timestamp": "2024-01-15T12:00:00Z",
  
  "position_summary": {
    "current_shares": "1000.523456",
    "current_shares_value": "1050.234567",
    "total_deposited": "1000.00",
    "total_withdrawn": "0.00",
    "net_position": "1000.00",
    "unrealized_gain_with_fees": "50.234567",
    "unrealized_gain_without_fees": "65.123456",
    "return_percentage": "5.02%",
    "return_percentage_without_fees": "6.51%"
  },
  
  "fee_analysis": {
    "total_fees_paid": "14.888889",
    "total_fees_paid_usd": "14.89",
    "fee_percentage_of_deposits": "1.49%",
    "fee_percentage_of_theoretical_value": "1.41%",
    
    "fee_breakdown": {
      "protocol_fees": "1.488889",
      "performance_fees": "11.400000",
      "management_fees": "2.000000"
    },
    
    "fee_events": [
      {
        "block_number": 17500000,
        "timestamp": "2023-12-01T10:30:00Z",
        "strategy": "0xstrategy1...",
        "gain": "100.00",
        "total_fees_vault": "10.00",
        "depositor_ownership_pct": "5.23%",
        "depositor_fees_paid": "0.523"
      }
    ]
  },
  
  "position_timeline": [
    {
      "block_number": 17000000,
      "timestamp": "2023-11-01T08:00:00Z",
      "event_type": "deposit",
      "shares_balance": "980.392157",
      "shares_change": "+980.392157",
      "assets_value": "1000.00",
      "price_per_share": "1.020000",
      "ownership_percentage": "0.98%"
    }
  ],
  
  "validation": {
    "status": "success",
    "warnings": [],
    "on_chain_balance_matches": true,
    "calculation_confidence": "high"
  }
}
```

---

## Error Handling

### Common Errors and Solutions

**Error 1: Archive Node Required**
```
Error: Requested data from block X but node only has recent blocks
Solution: Use an archive node (Alchemy, Infura Archive tier, or self-hosted)
```

**Error 2: Missing Events**
```
Error: No deposit events found for depositor
Solution: Check address format, verify depositor used this vault, expand block range
```

**Error 3: Price Per Share Calculation Mismatch**
```
Error: Calculated PPS doesn't match on-chain PPS
Solution: Account for profit unlocking, check for vault upgrades/migrations
```

**Error 4: Negative Fees**
```
Error: Theoretical value < Actual value
Solution: Check loss handling logic, verify strategy report parsing
```

---

## Testing Strategy

### Unit Tests

```python
def test_single_deposit_no_fees():
    """Test with single deposit and no fee events."""
    # Setup: 1 deposit, no reports
    # Expected: theoretical_value == actual_value
    pass

def test_single_deposit_with_one_fee_event():
    """Test with single deposit and one fee-charging report."""
    # Setup: 1 deposit, 1 report with gain and fees
    # Expected: theoretical_value > actual_value
    pass

def test_multiple_deposits_and_withdrawals():
    """Test complex deposit/withdraw pattern."""
    # Setup: multiple deposits and partial withdrawals
    # Expected: fees calculated proportionally
    pass

def test_share_transfers():
    """Test handling of share transfers."""
    # Setup: depositor transfers shares to another address
    # Expected: fees only calculated for ownership period
    pass
```

### Integration Tests

```python
def test_against_known_vault():
    """Test against real vault with known depositor."""
    # Use a real vault address and depositor
    # Manually verify results against block explorer
    pass
```

---

## Performance Optimizations

### Batch RPC Calls

```python
from web3.middleware import construct_batch_middleware

# Add batch middleware to web3 instance
web3.middleware_onion.add(construct_batch_middleware)

# Batch multiple state queries
with web3.batch_requests() as batch:
    results = []
    for block in blocks_to_query:
        results.append(
            batch.add(vault.functions.pricePerShare().call(block_identifier=block))
        )
```

### Caching

```python
import functools
from cachetools import TTLCache

# Cache block timestamps
block_timestamp_cache = TTLCache(maxsize=10000, ttl=3600)

@functools.lru_cache(maxsize=1000)
def get_block_timestamp(block_number: int) -> int:
    if block_number in block_timestamp_cache:
        return block_timestamp_cache[block_number]
    
    timestamp = web3.eth.get_block(block_number)['timestamp']
    block_timestamp_cache[block_number] = timestamp
    return timestamp
```

### Parallel Processing

```python
from concurrent.futures import ThreadPoolExecutor

def fetch_snapshots_parallel(
    blocks: list[int],
    vault: Contract,
    depositor: str
) -> list[dict]:
    """Fetch multiple block states in parallel."""
    
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = [
            executor.submit(fetch_block_state, vault, depositor, block)
            for block in blocks
        ]
        return [f.result() for f in futures]
```

---

## Dependencies

### TypeScript Requirements

This implementation uses TypeScript with the following dependencies:

```json
{
  "dependencies": {
    "viem": "^2.21.0",
    "envio": "latest",
    "graphql": "^16.8.0",
    "graphql-request": "^6.1.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^18.0.0"
  }
}
```

**Key Libraries:**
- **viem**: Modern Ethereum library for contract interactions and RPC calls
- **envio**: The indexer framework that powers the off-chain data collection
- **graphql-request**: Client for querying the Envio GraphQL API
- **TypeScript**: Type-safe implementation

---

## Security Considerations

1. **Input Validation**: Always validate addresses (checksummed)
2. **Decimal Precision**: Use `Decimal` type or BigInt, never float
3. **RPC Rate Limiting**: Respect rate limits, implement backoff
4. **Private Key Safety**: Never log or expose private keys (if signing txs)
5. **Reentrancy**: Read-only operations, but validate contract addresses

---

## Appendix A: Contract ABIs

### Minimal Vault ABI

```json
[
  {
    "name": "Deposit",
    "type": "event",
    "inputs": [
      {"name": "sender", "type": "address", "indexed": true},
      {"name": "owner", "type": "address", "indexed": true},
      {"name": "assets", "type": "uint256", "indexed": false},
      {"name": "shares", "type": "uint256", "indexed": false}
    ]
  },
  {
    "name": "Withdraw",
    "type": "event",
    "inputs": [
      {"name": "sender", "type": "address", "indexed": true},
      {"name": "receiver", "type": "address", "indexed": true},
      {"name": "owner", "type": "address", "indexed": true},
      {"name": "assets", "type": "uint256", "indexed": false},
      {"name": "shares", "type": "uint256", "indexed": false}
    ]
  },
  {
    "name": "StrategyReported",
    "type": "event",
    "inputs": [
      {"name": "strategy", "type": "address", "indexed": true},
      {"name": "gain", "type": "uint256", "indexed": false},
      {"name": "loss", "type": "uint256", "indexed": false},
      {"name": "current_debt", "type": "uint256", "indexed": false},
      {"name": "protocol_fees", "type": "uint256", "indexed": false},
      {"name": "total_fees", "type": "uint256", "indexed": false},
      {"name": "total_refunds", "type": "uint256", "indexed": false}
    ]
  },
  {
    "name": "pricePerShare",
    "type": "function",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256"}]
  },
  {
    "name": "totalAssets",
    "type": "function",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256"}]
  },
  {
    "name": "totalSupply",
    "type": "function",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256"}]
  },
  {
    "name": "balanceOf",
    "type": "function",
    "stateMutability": "view",
    "inputs": [{"name": "owner", "type": "address"}],
    "outputs": [{"name": "", "type": "uint256"}]
  },
  {
    "name": "accountant",
    "type": "function",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [{"name": "", "type": "address"}]
  },
  {
    "name": "factory",
    "type": "function",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [{"name": "", "type": "address"}]
  }
]
```

---

## Appendix B: Example Calculation

### Scenario

- Depositor deposits **1,000 USDC** at block 100
- Gets **980.392 shares** (PPS = 1.02)
- At block 200, strategy reports **+100 USDC gain**
- **10% performance fee** charged = 10 USDC fee
- Fee charged as **9.615 shares** minted (at PPS ~1.04)
- Depositor owns **5%** of vault

### Step-by-Step Calculation

**At Block 100 (Deposit):**
- Vault Total Assets: 20,000 USDC
- Vault Total Supply: 19,608 shares
- Depositor Assets: 1,000 USDC
- Depositor Shares: 980.392
- PPS: 20,000 / 19,608 = 1.02

**At Block 200 (Before Report):**
- Vault Total Assets: 20,100 USDC (gained 100)
- Vault Total Supply: 19,608 shares (unchanged)
- PPS: 20,100 / 19,608 = 1.0251

**At Block 200 (After Report):**
- Gain: 100 USDC
- Performance Fee: 10% × 100 = 10 USDC
- Fee Shares Minted: 10 / 1.0251 = 9.756 shares
- New Total Supply: 19,608 + 9.756 = 19,617.756
- New Total Assets: 20,100 (gain stays, fees are just shares)
- New PPS: 20,100 / 19,617.756 = 1.0246

**Depositor Position:**
- Shares: 980.392 (unchanged)
- Actual Value: 980.392 × 1.0246 = 1,004.51 USDC

**Theoretical No-Fee Position:**
- Shares: 980.392 (same shares)
- Theoretical Total Supply: 19,608 (no fee shares minted)
- Theoretical PPS: 20,100 / 19,608 = 1.0251
- Theoretical Value: 980.392 × 1.0251 = 1,005.00 USDC

**Fees Paid:**
- Total Fees: 1,005.00 - 1,004.51 = **0.49 USDC**
- Depositor's share of fee: 9.756 × 0.05 = 0.488 shares
- In USDC: 0.488 × 1.0246 ≈ 0.50 USDC ✓

---

## Appendix C: Common Pitfalls

### Pitfall 1: Using Float Instead of Decimal
```python
# ❌ WRONG - loses precision
price_per_share = 1.020345678901234567  # float
shares = 980.392157  # float
value = shares * price_per_share  # precision lost

# ✅ CORRECT
from decimal import Decimal
price_per_share = Decimal('1.020345678901234567')
shares = Decimal('980.392157')
value = shares * price_per_share  # precise
```

### Pitfall 2: Ignoring Profit Unlocking
```python
# ❌ WRONG - doesn't account for locked profits
pps = vault.totalAssets() / vault.totalSupply()

# ✅ CORRECT - uses vault's pricePerShare function
pps = vault.pricePerShare()  # Already accounts for locked profits
```

### Pitfall 3: Not Handling Edge Cases
```python
# ❌ WRONG - division by zero
ownership_pct = depositor_shares / total_supply

# ✅ CORRECT
ownership_pct = (
    depositor_shares / total_supply 
    if total_supply > 0 
    else Decimal('0')
)
```

### Pitfall 4: Confusing Losses and Fees
```python
# ❌ WRONG - treating losses as fees
if strategy_loss > 0:
    fees += strategy_loss  # NO! Losses are not fees

# ✅ CORRECT - only count fee-related dilution
if total_fees_shares > 0:
    fees += calculate_dilution_impact(total_fees_shares)
```

---

## Summary

This specification provides a complete blueprint for implementing the **Price Per Share Differential Method** to calculate fees paid by a Yearn V3 vault depositor, leveraging the **Envio off-chain indexer** infrastructure in this repository. Key steps:

1. **Run the Envio Indexer** - Start `pnpm dev` to automatically collect and index vault events
2. **Query Events via GraphQL** - Use the Envio GraphQL API at http://localhost:8080 to fetch Deposit, Withdraw, Transfer, and StrategyReported events
3. **Build** a complete position timeline using indexed event data
4. **Calculate** theoretical no-fee scenario
5. **Compare** with actual position value (using archive node RPC for historical state)
6. **Report** the difference as fees paid

The method is accurate, handles complex scenarios (multiple deposits, withdrawals, transfers), and provides detailed breakdowns of different fee types.

### Advantages of Using Envio

By using the Envio indexer in this repository, you get:

- **Automatic Event Collection**: No need to manually query blockchain logs with complex filters
- **Fast Query Performance**: Events are pre-indexed in PostgreSQL and queryable via GraphQL
- **Structured Data**: Events are normalized and stored with consistent IDs containing block numbers
- **Real-time Updates**: The indexer continuously syncs new events as they occur
- **Easy Testing**: GraphQL Playground at http://localhost:8080 for interactive queries

**Next Steps for Implementation:**

1. ✅ Envio indexer is already configured in this repository (`config.yaml`)
2. ✅ Event handlers are implemented (`src/EventHandlers.ts`)
3. ✅ GraphQL schema is defined (`schema.graphql`)
4. Start the indexer: `pnpm dev`
5. Implement the fee calculation logic using the GraphQL queries provided in this spec
6. Add archive node configuration for historical state queries
7. Build position timeline tracker
8. Implement theoretical calculation engine
9. Add validation and testing
10. Create user-friendly output format

The heavy lifting of event collection is already done by Envio - you can focus on the fee calculation logic!