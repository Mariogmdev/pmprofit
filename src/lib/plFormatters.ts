/**
 * P&L formatting helpers
 */

export function formatPLCurrency(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    const millions = value / 1_000_000;
    return millions >= 1000
      ? `$${millions.toLocaleString('es-CO', { maximumFractionDigits: 0 })}M`
      : `$${millions.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`;
  }
  if (abs >= 1_000) {
    return `$${(value / 1_000).toLocaleString('es-CO', { maximumFractionDigits: 0 })}K`;
  }
  return `$${value.toFixed(0)}`;
}

export function formatPLPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}
