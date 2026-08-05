export function chainVisualState(chain) {
  switch (chain.status) {
    case "caught_up":
      return { tone: "ok", label: "caught up" };
    case "behind":
      return { tone: "warn", label: "behind" };
    default:
      return { tone: "error", label: "head unknown" };
  }
}

export function summaryVisualState(totals) {
  if (totals.allCaughtUp) return { tone: "ok", label: "all chains live" };
  if (totals.unknownChainCount > 0) return { tone: "err", label: "chain head unknown" };
  return { tone: "warn", label: "chains behind" };
}

export function summaryDetail(totals) {
  if (totals.allCaughtUp) return "all caught up";
  const parts = [];
  if (totals.behindChainCount) parts.push(`${totals.behindChainCount} behind`);
  if (totals.unknownChainCount) parts.push(`${totals.unknownChainCount} unknown`);
  return parts.join(", ") || "no chain status";
}

export function formatPercent(percent) {
  if (percent == null) return "—";
  return percent >= 99.995 ? "100.00" : percent.toFixed(2);
}
