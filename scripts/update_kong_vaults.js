#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_URL = "https://kong.yearn.farm/api/rest/list/vaults?origin=yearn";
const DEFAULT_CONFIG_PATH = path.join(process.cwd(), "config.yaml");
const TARGET_CONTRACTS = [
  { contractName: "YearnV3Vault", version: "v3" },
  { contractName: "YearnV2Vault", version: "v2" },
];

const CHAIN_NAMES = {
  1: "Ethereum",
  10: "Optimism",
  137: "Polygon",
  250: "Fantom",
  8453: "Base",
  42161: "Arbitrum",
  747474: "Katana",
};

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const configPath = path.resolve(args.configPath ?? DEFAULT_CONFIG_PATH);
  const configText = fs.readFileSync(configPath, "utf8");
  const supportedChainIds = getSupportedChainIds(configText);
  const vaults = await loadVaults(args.fromFile);
  const groupedVaults = groupVaults(vaults, supportedChainIds);
  const nextConfigText = updateConfig(configText, groupedVaults);

  if (nextConfigText === configText) {
    console.log("config.yaml is already up to date");
    return;
  }

  fs.writeFileSync(configPath, nextConfigText);

  for (const chainId of supportedChainIds) {
    for (const { version } of TARGET_CONTRACTS) {
      const items = groupedVaults.get(makeGroupKey(chainId, version));
      if (items?.length) {
        console.log(`${chainId} ${version}: ${items.length}`);
      }
    }
  }
}

function parseArgs(args) {
  const parsed = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--from-file") {
      parsed.fromFile = args[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--config") {
      parsed.configPath = args[index + 1];
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return parsed;
}

async function loadVaults(fromFile) {
  if (fromFile) {
    return JSON.parse(fs.readFileSync(path.resolve(fromFile), "utf8"));
  }

  const response = await fetch(DEFAULT_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch Kong vault list: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function getSupportedChainIds(configText) {
  const chainIds = [];
  const matches = configText.matchAll(/^  - id: (\d+)/gm);

  for (const match of matches) {
    chainIds.push(Number(match[1]));
  }

  return chainIds;
}

function groupVaults(vaults, supportedChainIds) {
  const supported = new Set(supportedChainIds);
  const grouped = new Map();

  for (const vault of vaults) {
    if (!supported.has(vault.chainId)) {
      continue;
    }

    const version = vault.v3 === true ? "v3" : vault.v3 === false ? "v2" : null;
    if (!version) {
      continue;
    }

    const isHidden = Boolean(vault.meta?.isHidden ?? vault.isHidden);
    if (isHidden) {
      continue;
    }

    const key = makeGroupKey(vault.chainId, version);
    if (!grouped.has(key)) {
      grouped.set(key, new Map());
    }

    const deduped = grouped.get(key);
    deduped.set(vault.address.toLowerCase(), vault);
  }

  for (const [key, deduped] of grouped) {
    const items = [...deduped.values()].sort(compareVaults);
    grouped.set(key, items);
  }

  return grouped;
}

function compareVaults(left, right) {
  if (right.tvl !== left.tvl) {
    return right.tvl - left.tvl;
  }

  return left.address.localeCompare(right.address);
}

function updateConfig(configText, groupedVaults) {
  const lines = configText.split("\n");
  const networkRanges = getNetworkRanges(lines);
  const updated = [];

  for (let networkIndex = 0; networkIndex < networkRanges.length; networkIndex += 1) {
    const { start, end, chainId } = networkRanges[networkIndex];
    const nextStart = networkIndex === 0 ? 0 : networkRanges[networkIndex - 1].end;

    if (networkIndex === 0) {
      updated.push(...lines.slice(0, start));
    } else {
      updated.push(...lines.slice(nextStart, start));
    }

    updated.push(...updateNetworkBlock(lines.slice(start, end), chainId, groupedVaults));
  }

  if (networkRanges.length === 0) {
    return configText;
  }

  updated.push(...lines.slice(networkRanges[networkRanges.length - 1].end));

  while (updated.length > 0 && updated[updated.length - 1] === "") {
    updated.pop();
  }

  return `${updated.join("\n")}\n`;
}

function getNetworkRanges(lines) {
  const starts = [];

  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^  - id: (\d+)/);
    if (match) {
      starts.push({ start: index, chainId: Number(match[1]) });
    }
  }

  return starts.map((entry, index) => ({
    ...entry,
    end: index + 1 < starts.length ? starts[index + 1].start : lines.length,
  }));
}

function updateNetworkBlock(blockLines, chainId, groupedVaults) {
  const contractsIndex = blockLines.findIndex((line) => line === "    contracts:");
  if (contractsIndex === -1) {
    return blockLines;
  }

  const beforeContracts = blockLines.slice(0, contractsIndex + 1);
  const afterContracts = blockLines.slice(contractsIndex + 1);
  const contractBlocks = splitContractBlocks(afterContracts);
  const otherBlocks = contractBlocks.filter(
    (block) => !TARGET_CONTRACTS.some((target) => target.contractName === block.name),
  );
  const replacementBlocks = [];

  for (const { contractName, version } of TARGET_CONTRACTS) {
    const items = groupedVaults.get(makeGroupKey(chainId, version));
    if (!items?.length) {
      continue;
    }

    replacementBlocks.push(buildVaultBlock(contractName, version, chainId, items));
  }

  return [...beforeContracts, ...replacementBlocks.flat(), ...otherBlocks.flatMap((block) => block.lines)];
}

function splitContractBlocks(lines) {
  const blocks = [];
  let current = null;

  for (const line of lines) {
    const match = line.match(/^      - name: (.+)$/);
    if (match) {
      if (current) {
        blocks.push(current);
      }

      current = { name: match[1], lines: [line] };
      continue;
    }

    if (!current) {
      continue;
    }

    current.lines.push(line);
  }

  if (current) {
    blocks.push(current);
  }

  return blocks;
}

function buildVaultBlock(contractName, version, chainId, items) {
  const versionLabel = version === "v3" ? "V3" : "V2";
  const chainName = CHAIN_NAMES[chainId] ?? `chain ${chainId}`;
  const header = `          # ${versionLabel} vaults on ${chainName} from Kong API (all TVL, excluding hidden)`;
  const lines = [
    `      - name: ${contractName}`,
    "        address:",
    header,
  ];

  for (const vault of items) {
    lines.push(`          - "${vault.address}" # ${formatVaultComment(vault)}`);
  }

  return lines;
}

function formatVaultComment(vault) {
  const fallback = vault.address;
  const symbol = normalizeCommentPart(vault.symbol) ?? fallback;
  const name = normalizeCommentPart(vault.name);
  const parts = [symbol];

  if (name && name !== symbol) {
    parts.push("-", name);
  }

  if (vault.isRetired) {
    parts.push("(retired)");
  }

  return parts.join(" ");
}

function normalizeCommentPart(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === "none") {
    return null;
  }

  const ascii = trimmed
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return ascii || null;
}

function makeGroupKey(chainId, version) {
  return `${chainId}:${version}`;
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
