/**
 * P&L formatting helpers
 */

export function formatPLCurrency(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) {
    return `$${(value / 1_000_000).toFixed(0)}M`;
  }
  if (abs >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

export function formatPLPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}
