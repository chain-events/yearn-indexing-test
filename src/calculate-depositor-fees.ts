#!/usr/bin/env tsx
/**
 * Yearn V3 Depositor Fee Calculator
 *
 * This script calculates fees and profit for a specific depositor address
 * using data from the Envio indexer.
 *
 * Usage: tsx src/calculate-depositor-fees.ts <depositor-address>
 */

import { createPublicClient, http, formatUnits } from 'viem';
import { mainnet } from 'viem/chains';
import { existsSync, readFileSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

// ============================================================================
// Configuration
// ============================================================================

const DOTENV_FILE = path.resolve(process.cwd(), '.env.local');

loadLocalEnv(DOTENV_FILE);

/**
 * Lightweight reader for `.env.local` so the script picks up the RPC URL.
 */
function loadLocalEnv(filePath: string): void {
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, 'utf-8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

const ENVIO_GRAPHQL_URL = process.env.ENVIO_GRAPHQL_URL || 'http://localhost:8080/v1/graphql';
const ENVIO_PASSWORD = process.env.ENVIO_PASSWORD || 'testing';
const VAULT_ADDRESS = '0xBe53A109B494E5c9f97b9Cd39Fe969BE68BF6204'; // From config.yaml
const RPC_URL = process.env.RPC_URL || 'https://eth.merkle.io';

const PRICE_PER_SHARE_SELECTOR = '0x99530b06';
const DECIMALS_SELECTOR = '0x313ce567';

const pricePerShareCache = new Map<number, bigint>();

function getPricePerShareAtBlock(blockNumber: number): bigint {
  if (pricePerShareCache.has(blockNumber)) {
    return pricePerShareCache.get(blockNumber)!;
  }

  const priceHex = contractCallViaCurl(VAULT_ADDRESS, PRICE_PER_SHARE_SELECTOR, blockNumber);
  const value = BigInt(priceHex);
  pricePerShareCache.set(blockNumber, value);
  return value;
}

// ============================================================================
// Type Definitions
// ============================================================================

interface DepositEvent {
  id: string;
  sender: string;
  owner: string;
  assets: string;
  shares: string;
}

interface WithdrawEvent {
  id: string;
  sender: string;
  receiver: string;
  owner: string;
  assets: string;
  shares: string;
}

interface TransferEvent {
  id: string;
  sender: string;
  receiver: string;
  value: string;
}


interface Event {
  type: 'deposit' | 'withdraw' | 'transfer_in' | 'transfer_out';
  blockNumber: number;
  logIndex: number;
  data: any;
}

interface PositionSnapshot {
  blockNumber: number;
  eventType: string;
  sharesBalance: bigint;
  sharesChange: bigint;
  assetsDeposited: bigint;
  assetsWithdrawn: bigint;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse block number and log index from Envio event ID
 * Format: {chainId}_{blockNumber}_{logIndex}
 */
function parseEventId(eventId: string): { blockNumber: number; logIndex: number } {
  const parts = eventId.split('_');
  return {
    blockNumber: parseInt(parts[1]),
    logIndex: parseInt(parts[2]),
  };
}

/**
 * Query the Envio GraphQL API
 */
async function queryEnvioGraphQL(query: string, variables: any = {}): Promise<any> {
  const response = await fetch(ENVIO_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + Buffer.from(':' + ENVIO_PASSWORD).toString('base64'),
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL query failed: ${response.statusText}`);
  }

  const result = await response.json() as any;

  if (result.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
  }

  return result.data;
}

/**
 * Make an RPC call using curl (fallback for when Node.js fetch fails due to network restrictions)
 */
function rpcCallViaCurl(method: string, params: any[] = []): any {
  const payload = JSON.stringify({
    jsonrpc: '2.0',
    method,
    params,
    id: 1,
  });

  try {
    const result = execSync(
      `curl -s -X POST ${RPC_URL} -H "Content-Type: application/json" -d '${payload}'`,
      { encoding: 'utf-8', timeout: 30000 }
    );
    const parsed = JSON.parse(result);
    if (parsed.error) {
      throw new Error(`RPC error: ${parsed.error.message}`);
    }
    return parsed.result;
  } catch (error) {
    throw new Error(`RPC call failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Make a contract call via curl
 */
function contractCallViaCurl(address: string, data: string, blockNumber?: number): string {
  const params: any[] = [
    {
      to: address,
      data: data,
    },
    blockNumber !== undefined ? `0x${blockNumber.toString(16)}` : 'latest',
  ];
  return rpcCallViaCurl('eth_call', params);
}

/**
 * Get timestamp for a block number
 */
function getBlockTimestamp(blockNumber: number): Date {
  try {
    const blockHex = rpcCallViaCurl('eth_getBlockByNumber', [`0x${blockNumber.toString(16)}`, false]);
    const timestamp = parseInt(blockHex.timestamp, 16);
    return new Date(timestamp * 1000);
  } catch (error) {
    // Fallback: estimate based on average block time (12 seconds)
    try {
      const currentBlockHex = rpcCallViaCurl('eth_blockNumber', []);
      const currentBlock = parseInt(currentBlockHex, 16);
      const currentTime = Date.now();
      const blockDiff = currentBlock - blockNumber;
      const estimatedTime = currentTime - (blockDiff * 12 * 1000);
      return new Date(estimatedTime);
    } catch {
      // Last resort: use current time
      return new Date();
    }
  }
}

/**
 * Format date in human-readable format
 */
function formatDate(date: Date): string {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
}

// ============================================================================
// Data Collection Functions
// ============================================================================

async function getDepositEvents(depositorAddress: string): Promise<DepositEvent[]> {
  const query = `
    query GetDepositorDeposits($depositorAddress: String!) {
      Deposit(
        where: { owner: { _eq: $depositorAddress } }
        order_by: { id: asc }
      ) {
        id
        sender
        owner
        assets
        shares
      }
    }
  `;

  const data = await queryEnvioGraphQL(query, { depositorAddress: depositorAddress.toLowerCase() });
  return data.Deposit || [];
}

async function getWithdrawEvents(depositorAddress: string): Promise<WithdrawEvent[]> {
  const query = `
    query GetDepositorWithdrawals($depositorAddress: String!) {
      Withdraw(
        where: { owner: { _eq: $depositorAddress } }
        order_by: { id: asc }
      ) {
        id
        sender
        receiver
        owner
        assets
        shares
      }
    }
  `;

  const data = await queryEnvioGraphQL(query, { depositorAddress: depositorAddress.toLowerCase() });
  return data.Withdraw || [];
}

async function getTransferEvents(depositorAddress: string): Promise<TransferEvent[]> {
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  const query = `
    query GetDepositorTransfers($depositorAddress: String!, $zeroAddress: String!) {
      transfersFrom: Transfer(
        where: {
          sender: { _eq: $depositorAddress }
          receiver: { _neq: $zeroAddress }
        }
        order_by: { id: asc }
      ) {
        id
        sender
        receiver
        value
      }
      transfersTo: Transfer(
        where: {
          receiver: { _eq: $depositorAddress }
          sender: { _neq: $zeroAddress }
        }
        order_by: { id: asc }
      ) {
        id
        sender
        receiver
        value
      }
    }
  `;

  const data = await queryEnvioGraphQL(query, {
    depositorAddress: depositorAddress.toLowerCase(),
    zeroAddress: ZERO_ADDRESS.toLowerCase()
  });

  return [
    ...(data.transfersFrom || []),
    ...(data.transfersTo || []),
  ];
}


// ============================================================================
// Calculation Functions
// ============================================================================

/**
 * Build a complete timeline of all events affecting the depositor
 */
function buildEventTimeline(
  deposits: DepositEvent[],
  withdrawals: WithdrawEvent[],
  transfers: TransferEvent[],
  depositorAddress: string
): Event[] {
  const events: Event[] = [];

  // Add deposits
  deposits.forEach(d => {
    const { blockNumber, logIndex } = parseEventId(d.id);
    events.push({
      type: 'deposit',
      blockNumber,
      logIndex,
      data: d,
    });
  });

  // Add withdrawals
  withdrawals.forEach(w => {
    const { blockNumber, logIndex } = parseEventId(w.id);
    events.push({
      type: 'withdraw',
      blockNumber,
      logIndex,
      data: w,
    });
  });

  // Add transfers
  transfers.forEach(t => {
    const { blockNumber, logIndex } = parseEventId(t.id);
    const type = t.sender.toLowerCase() === depositorAddress.toLowerCase()
      ? 'transfer_out'
      : 'transfer_in';
    events.push({
      type,
      blockNumber,
      logIndex,
      data: t,
    });
  });

  // Sort by block number, then log index
  events.sort((a, b) => {
    if (a.blockNumber !== b.blockNumber) {
      return a.blockNumber - b.blockNumber;
    }
    return a.logIndex - b.logIndex;
  });

  return events;
}

/**
 * Calculate the depositor's position over time
 */
function calculatePosition(events: Event[], depositorAddress: string): {
  snapshots: PositionSnapshot[];
  currentShares: bigint;
  totalDeposited: bigint;
  totalWithdrawn: bigint;
  userEvents: Event[];
  peakShares: bigint;
  peakSharesBlock: number;
} {
  const snapshots: PositionSnapshot[] = [];
  const userEvents: Event[] = [];

  let currentShares = 0n;
  let totalDeposited = 0n;
  let totalWithdrawn = 0n;

  // Track peak balance
  let peakShares = 0n;
  let peakSharesBlock = 0;

  for (const event of events) {
    let sharesChange = 0n;

    switch (event.type) {
      case 'deposit':
        sharesChange = BigInt(event.data.shares);
        currentShares += sharesChange;
        totalDeposited += BigInt(event.data.assets);
        userEvents.push(event);
        break;

      case 'withdraw':
        sharesChange = -BigInt(event.data.shares);
        currentShares += sharesChange;
        totalWithdrawn += BigInt(event.data.assets);
        userEvents.push(event);
        break;

      case 'transfer_in':
        sharesChange = BigInt(event.data.value);
        currentShares += sharesChange;
        userEvents.push(event);
        break;

      case 'transfer_out':
        sharesChange = -BigInt(event.data.value);
        currentShares += sharesChange;
        userEvents.push(event);
        break;
    }

    // Track peak shares
    if (currentShares > peakShares) {
      peakShares = currentShares;
      peakSharesBlock = event.blockNumber;
    }

    // Create snapshot
    snapshots.push({
      blockNumber: event.blockNumber,
      eventType: event.type,
      sharesBalance: currentShares,
      sharesChange,
      assetsDeposited: totalDeposited,
      assetsWithdrawn: totalWithdrawn,
    });
  }

  return {
    snapshots,
    currentShares,
    totalDeposited,
    totalWithdrawn,
    userEvents,
    peakShares,
    peakSharesBlock,
  };
}

/**
 * Calculate current value of depositor's shares
 */
async function getCurrentValue(shares: bigint): Promise<bigint> {
  const client = createPublicClient({
    chain: mainnet,
    transport: http(RPC_URL),
  });

  const VAULT_ABI = [
    {
      name: 'pricePerShare',
      type: 'function',
      stateMutability: 'view',
      inputs: [],
      outputs: [{ name: '', type: 'uint256' }],
    },
    {
      name: 'decimals',
      type: 'function',
      stateMutability: 'view',
      inputs: [],
      outputs: [{ name: '', type: 'uint8' }],
    },
  ] as const;

  try {
    const pricePerShare = await client.readContract({
      address: VAULT_ADDRESS as `0x${string}`,
      abi: VAULT_ABI,
      functionName: 'pricePerShare',
    });

    const decimals = await client.readContract({
      address: VAULT_ADDRESS as `0x${string}`,
      abi: VAULT_ABI,
      functionName: 'decimals',
    });

    // Value = shares * pricePerShare / 10^decimals
    const value = (shares * pricePerShare) / BigInt(10 ** decimals);

    return value;
  } catch (error) {
    console.warn('Could not fetch current price per share from RPC, using estimated value');
    return shares; // Fallback: assume 1:1 ratio
  }
}

/**
 * Calculate weighted average entry price per share
 * This accounts for multiple deposits and the shares/assets ratio at each deposit
 */
function calculateWeightedAverageEntryPPS(deposits: DepositEvent[]): bigint {
  let totalAssets = 0n;
  let totalShares = 0n;

  for (const deposit of deposits) {
    totalAssets += BigInt(deposit.assets);
    totalShares += BigInt(deposit.shares);
  }

  if (totalShares === 0n) return 0n;

  // Weighted average PPS = total assets / total shares
  // Return in 6 decimals (same as USDC)
  return (totalAssets * 1000000n) / totalShares;
}

/**
 * Get the vault's performance fee rate from the accountant contract
 */
function getPerformanceFeeRate(vaultAddress: string): number {
  try {
    const accountantHex = contractCallViaCurl(vaultAddress, '0x4fb3ccc5');
    const accountantAddress = '0x' + accountantHex.slice(-40);

    // getVaultConfig() selector: 0xb2a2353e
    const selector = '0xde1eb9a3';
    const vaultParam = vaultAddress.toLowerCase().replace(/^0x/, '').padStart(64, '0');
    const configHex = contractCallViaCurl(accountantAddress, selector + vaultParam);
    if (!configHex) {
      throw new Error('Empty getVaultConfig response');
    }
    const hex = (configHex.startsWith('0x') ? configHex.slice(2) : configHex).padEnd(64 * 4, '0');

    if (hex.length < 64 * 4) {
      throw new Error(`getVaultConfig returned ${hex.length} hex chars`);
    }

    const words = [];
    for (let i = 0; i < 4; i++) {
      const start = i * 64;
      const chunk = hex.slice(start, start + 64);
      words.push(BigInt('0x' + chunk));
    }

    const managementFee = words[0];
    const performanceFee = words[1];
    const maxFee = words[3];

    if (managementFee !== 0n) {
      throw new Error(`Unexpected management fee ${managementFee} (expected 0)`);
    }

    if (maxFee === 0n) {
      throw new Error('maxFee is zero');
    }

    const ratioBps = Number((performanceFee * 10000n) / maxFee);
    console.log(`Performance fee ${ratioBps / 100}% (calculated from on-chain)`);
    return ratioBps;
  } catch (error) {
    console.error('getPerformanceFeeRate error:', error instanceof Error ? error.message : error);
    console.warn('Could not fetch performance fee rate, using default 10%');
    return 1000;
  }
}

/**
 * Calculate profit and fees based on price per share differential
 */
function calculateIncrementalProfitAndFees(
  snapshots: PositionSnapshot[],
  performanceFeeBps: number,
  currentPPS: bigint,
  currentShares: bigint,
  decimals: number
): {
  netProfit: bigint;
  grossProfit: bigint;
  totalFees: bigint;
  effectiveShares: bigint;
} {
  const scale = BigInt(10 ** decimals);

  let netProfit = 0n;
  let previousShares = 0n;
  let previousPPS = snapshots.length > 0
    ? getPricePerShareAtBlock(snapshots[0].blockNumber)
    : currentPPS;

  for (const snapshot of snapshots) {
    const snapshotPPS = getPricePerShareAtBlock(snapshot.blockNumber);
    const deltaPPS = snapshotPPS - previousPPS;
    netProfit += (previousShares * deltaPPS) / scale;

    previousShares = snapshot.sharesBalance;
    previousPPS = snapshotPPS;
  }

  netProfit += (previousShares * (currentPPS - previousPPS)) / scale;

  const feeRate = BigInt(performanceFeeBps);
  const basisPoints = 10000n;

  let grossProfit = 0n;
  let totalFees = 0n;

  if (netProfit > 0n) {
    grossProfit = (netProfit * basisPoints) / (basisPoints - feeRate);
    totalFees = grossProfit - netProfit;
  } else {
    grossProfit = netProfit;
  }

  return {
    netProfit,
    grossProfit,
    totalFees,
    effectiveShares: currentShares,
  };
}

// ============================================================================
// Output Formatting
// ============================================================================

function formatOutput(
  depositorAddress: string,
  deposits: DepositEvent[],
  withdrawals: WithdrawEvent[],
  transfers: TransferEvent[],
  position: ReturnType<typeof calculatePosition>,
  currentValue: bigint,
  weightedAvgEntryPPS: bigint,
  profitAndFees: ReturnType<typeof calculateIncrementalProfitAndFees>,
  performanceFeeBps: number,
  currentPPS: bigint,
  firstInteractionDate: Date | null,
  firstInteractionBlock: number | null,
  peakValue: bigint | null,
  peakDate: Date | null,
  decimals: number
) {
  const { currentShares, totalDeposited, totalWithdrawn, userEvents } = position;
  const { netProfit, grossProfit, totalFees } = profitAndFees;

  // Count transfers
  const transfersIn = transfers.filter(t => t.receiver.toLowerCase() === depositorAddress.toLowerCase());
  const transfersOut = transfers.filter(t => t.sender.toLowerCase() === depositorAddress.toLowerCase());
  const netTransferredShares = transfersIn.reduce((sum, t) => sum + BigInt(t.value), 0n) -
                                transfersOut.reduce((sum, t) => sum + BigInt(t.value), 0n);

  const hasSignificantTransfers = transfersIn.length > 0 || transfersOut.length > 0;

  // Calculate simple profit for deposits/withdrawals only (for comparison)
  const netDeposited = totalDeposited - totalWithdrawn;

  console.log('\n' + '='.repeat(80));
  console.log('YEARN V3 DEPOSITOR FEE & PROFIT ANALYSIS');
  console.log('='.repeat(80));

  console.log('\n📊 DEPOSITOR INFORMATION');
  console.log('-'.repeat(80));
  console.log(`Address: ${depositorAddress}`);
  console.log(`Vault:   ${VAULT_ADDRESS}`);

  if (firstInteractionDate && firstInteractionBlock) {
    console.log(`First Interaction: Block ${firstInteractionBlock} (${formatDate(firstInteractionDate)})`);
  }

  console.log('\n💰 POSITION SUMMARY');
  console.log('-'.repeat(80));
  console.log(`Current Shares:     ${formatUnits(currentShares, 6)} shares`);
  console.log(`Current Value:      ${formatUnits(currentValue, 6)} USDC`);
  console.log(`Total Deposited:    ${formatUnits(totalDeposited, 6)} USDC`);
  console.log(`Total Withdrawn:    ${formatUnits(totalWithdrawn, 6)} USDC`);
  console.log(`Net Deposited:      ${formatUnits(netDeposited, 6)} USDC`);

  // Show peak position if available
  if (position.peakShares > 0n) {
    console.log('');
    console.log(`📊 Peak Position:`);
    console.log(`   Highest Shares:  ${formatUnits(position.peakShares, 6)} shares`);

    if (peakValue !== null) {
      console.log(`   Peak Value:      ${formatUnits(peakValue, 6)} USDC`);
    }

    if (peakDate) {
      console.log(`   Peak Date:       Block ${position.peakSharesBlock} (${formatDate(peakDate)})`);
    } else {
      console.log(`   Peak Block:      ${position.peakSharesBlock}`);
    }

    // Show change from peak
    const sharesDiff = currentShares - position.peakShares;
    const sharesDiffPct = position.peakShares > 0n
      ? (sharesDiff * 10000n) / position.peakShares
      : 0n;

    if (sharesDiff < 0n) {
      console.log(`   Change from peak: ${formatUnits(-sharesDiff, 6)} shares lower (${Number(sharesDiffPct) / 100}%)`);
    } else if (sharesDiff === 0n) {
      console.log(`   Change from peak: Currently at peak!`);
    }
  }

  console.log('\n💰 PRICE PER SHARE ANALYSIS');
  console.log('-'.repeat(80));
  console.log(`Weighted Avg Entry PPS: ${formatUnits(weightedAvgEntryPPS, 6)}`);
  console.log(`Current PPS:            ${formatUnits(currentPPS, 6)}`);
  const ppsDiff = currentPPS - weightedAvgEntryPPS;
  const ppsDiffPct = weightedAvgEntryPPS > 0n
    ? (ppsDiff * 10000n) / weightedAvgEntryPPS
    : 0n;
  const ppsSign = ppsDiff >= 0n ? '+' : '';
  console.log(`PPS Change:             ${ppsSign}${formatUnits(ppsDiff, 6)} (${ppsSign}${Number(ppsDiffPct) / 100}%)`);

  console.log('\n📈 PROFIT/LOSS (Price Per Share Method)');
  console.log('-'.repeat(80));

  if (hasSignificantTransfers) {
    console.log('⚠️  WARNING: This address has share transfers!');
    console.log(`    Shares transferred IN:  ${formatUnits(transfersIn.reduce((sum, t) => sum + BigInt(t.value), 0n), 6)}`);
    console.log(`    Shares transferred OUT: ${formatUnits(transfersOut.reduce((sum, t) => sum + BigInt(t.value), 0n), 6)}`);
    console.log(`    Net shares transferred: ${formatUnits(netTransferredShares, 6)}`);
    console.log('');
    console.log('    Profit calculation below is based on deposited shares only.');
    console.log('    Transferred shares may have different cost basis.');
    console.log('');
  }

  const netProfitSign = netProfit >= 0n ? '+' : '';
  const grossProfitSign = grossProfit >= 0n ? '+' : '';

  console.log(`Gross Profit (before fees): ${grossProfitSign}${formatUnits(grossProfit, 6)} USDC`);
  console.log(`Net Profit (after fees):    ${netProfitSign}${formatUnits(netProfit, 6)} USDC`);

  const netProfitPct = netDeposited > 0n
    ? (netProfit * 10000n) / netDeposited
    : 0n;
  console.log(`Return on Investment:       ${netProfitSign}${Number(netProfitPct) / 100}%`);

  console.log('\n💸 FEES PAID');
  console.log('-'.repeat(80));
  console.log(`Performance Fee Rate:   ${performanceFeeBps / 100}%`);
  console.log(`Total Fees Paid:        ${formatUnits(totalFees, 6)} USDC`);

  if (grossProfit > 0n) {
    const feePercentage = (totalFees * 10000n) / grossProfit;
    console.log(`Fees as % of Gross:     ${Number(feePercentage) / 100}%`);
  }

  console.log('');
  console.log('Calculation Method:');
  console.log('  • Weighted average entry PPS calculated from all deposits');
  console.log('  • Net profit = (Current PPS - Entry PPS) × Current Shares');
  console.log('  • Gross profit = Net profit / (1 - Fee Rate)');
  console.log('  • Fees = Gross profit - Net profit');

  console.log('\n📝 USER EVENTS');
  console.log('-'.repeat(80));
  console.log(`Total Deposits:     ${deposits.length}`);
  console.log(`Total Withdrawals:  ${withdrawals.length}`);
  console.log(`Total Transfers:    ${transfers.length} (excluding mint/burn)`);
  console.log(`  - Transfers IN:   ${transfersIn.length}`);
  console.log(`  - Transfers OUT:  ${transfersOut.length}`);

  if (deposits.length > 0) {
    console.log('\n  Deposits:');
    deposits.forEach((d, i) => {
      const { blockNumber } = parseEventId(d.id);
      console.log(`    ${i + 1}. Block ${blockNumber}: ${formatUnits(BigInt(d.assets), 6)} USDC → ${formatUnits(BigInt(d.shares), 6)} shares`);
    });
  }

  if (withdrawals.length > 0) {
    console.log('\n  Withdrawals:');
    withdrawals.forEach((w, i) => {
      const { blockNumber } = parseEventId(w.id);
      console.log(`    ${i + 1}. Block ${blockNumber}: ${formatUnits(BigInt(w.shares), 6)} shares → ${formatUnits(BigInt(w.assets), 6)} USDC`);
    });
  }

  if (transfers.length > 0) {
    console.log('\n  Transfers:');
    transfers.forEach((t, i) => {
      const { blockNumber } = parseEventId(t.id);
      const direction = t.sender.toLowerCase() === depositorAddress.toLowerCase() ? 'OUT' : 'IN';
      console.log(`    ${i + 1}. Block ${blockNumber}: ${direction} ${formatUnits(BigInt(t.value), 6)} shares`);
    });
  }

  console.log('\n🐛 DEBUGGING INFO');
  console.log('-'.repeat(80));
  console.log(`Total Events Processed:     ${userEvents.length}`);
  console.log(`User-Specific Events:       ${userEvents.length}`);
  console.log(`Position Snapshots:         ${position.snapshots.length}`);

  // Show detailed timeline
  console.log('\n📅 COMPLETE EVENT TIMELINE');
  console.log('-'.repeat(80));
  const allEvents = buildEventTimeline(deposits, withdrawals, transfers, depositorAddress);
  console.log(`Total events: ${allEvents.length}`);

  if (allEvents.length > 0) {
    console.log('\n  First 10 events:');
    allEvents.slice(0, 10).forEach((e, i) => {
      console.log(`    ${i + 1}. Block ${e.blockNumber} [${e.type}]`);
    });

    if (allEvents.length > 10) {
      console.log(`    ... and ${allEvents.length - 10} more events`);
    }
  }

  console.log('\n' + '='.repeat(80));
}

// ============================================================================
// Main Function
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: tsx src/calculate-depositor-fees.ts <depositor-address>');
    console.error('Example: tsx src/calculate-depositor-fees.ts 0x1234567890123456789012345678901234567890');
    process.exit(1);
  }

  const depositorAddress = args[0];

  // Validate address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(depositorAddress)) {
    console.error('Error: Invalid Ethereum address format');
    process.exit(1);
  }

  console.log('Fetching data from Envio indexer...');

  try {
    // Fetch all events
    const [deposits, withdrawals, transfers] = await Promise.all([
      getDepositEvents(depositorAddress),
      getWithdrawEvents(depositorAddress),
      getTransferEvents(depositorAddress),
    ]);

    console.log('Building position timeline...');

    // Calculate position
    const position = calculatePosition(
      buildEventTimeline(deposits, withdrawals, transfers, depositorAddress),
      depositorAddress
    );

    console.log('Fetching current vault state...');

    // Get current value and price per share using curl
    // pricePerShare() function selector: 0x99530b06
    // decimals() function selector: 0x313ce567
    const pricePerShareHex = contractCallViaCurl(VAULT_ADDRESS, '0x99530b06');
    const decimalsHex = contractCallViaCurl(VAULT_ADDRESS, '0x313ce567');

    const pricePerShare = BigInt(pricePerShareHex);
    const decimals = parseInt(decimalsHex, 16);

    const currentValue = (position.currentShares * pricePerShare) / BigInt(10 ** decimals);

    // Get performance fee rate
    console.log('Fetching performance fee rate...');
    const performanceFeeBps = await getPerformanceFeeRate(VAULT_ADDRESS);

    // Calculate weighted entry price per share
    const weightedAvgEntryPPS = calculateWeightedAverageEntryPPS(deposits);

    // Calculate profit and fees using incremental PPS tracking
    const profitAndFees = calculateIncrementalProfitAndFees(
      position.snapshots,
      performanceFeeBps,
      pricePerShare,
      position.currentShares,
      decimals
    );

    // Find first interaction
    let firstInteractionBlock: number | null = null;
    let firstInteractionDate: Date | null = null;

    const allUserEvents = [
      ...deposits.map(d => parseEventId(d.id).blockNumber),
      ...withdrawals.map(w => parseEventId(w.id).blockNumber),
      ...transfers.map(t => parseEventId(t.id).blockNumber),
    ];

    if (allUserEvents.length > 0) {
      firstInteractionBlock = Math.min(...allUserEvents);
      console.log('Fetching first interaction timestamp...');
      firstInteractionDate = await getBlockTimestamp(firstInteractionBlock);
    }

    // Calculate peak position value and timestamp
    let peakValue: bigint | null = null;
    let peakDate: Date | null = null;

    if (position.peakShares > 0n && position.peakSharesBlock > 0) {
      console.log('Calculating peak position value...');

      const client = createPublicClient({
        chain: mainnet,
        transport: http(RPC_URL),
      });

      const VAULT_ABI = [
        {
          name: 'pricePerShare',
          type: 'function',
          stateMutability: 'view',
          inputs: [],
          outputs: [{ name: '', type: 'uint256' }],
        },
        {
          name: 'decimals',
          type: 'function',
          stateMutability: 'view',
          inputs: [],
          outputs: [{ name: '', type: 'uint8' }],
        },
      ] as const;

      try {
        const [pricePerShare, decimals] = await Promise.all([
          client.readContract({
            address: VAULT_ADDRESS as `0x${string}`,
            abi: VAULT_ABI,
            functionName: 'pricePerShare',
            blockNumber: BigInt(position.peakSharesBlock),
          }),
          client.readContract({
            address: VAULT_ADDRESS as `0x${string}`,
            abi: VAULT_ABI,
            functionName: 'decimals',
          }),
        ]);

        peakValue = (position.peakShares * pricePerShare) / BigInt(10 ** decimals);
        peakDate = await getBlockTimestamp(position.peakSharesBlock);
      } catch (error) {
        console.warn('Could not fetch peak position value, will show shares only');
      }
    }

    // Output results
    formatOutput(
      depositorAddress,
      deposits,
      withdrawals,
      transfers,
      position,
      currentValue,
      weightedAvgEntryPPS,
      profitAndFees,
      performanceFeeBps,
      pricePerShare,
      firstInteractionDate,
      firstInteractionBlock,
      peakValue,
      peakDate,
      decimals
    );

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
