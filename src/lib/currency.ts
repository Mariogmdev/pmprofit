import { CurrencyCode, CURRENCIES } from '@/types';

/**
 * Formatea un número como moneda según el código de moneda
 */
export function formatCurrency(
  amount: number,
  currencyCode: CurrencyCode,
  customSymbol?: string
): string {
  if (currencyCode === 'CUSTOM') {
    const symbol = customSymbol || '$';
    return `${symbol}${amount.toLocaleString('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  }

  const currency = CURRENCIES[currencyCode];
  
  try {
    const formatted = new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
    
    // Reemplazar el código ISO con el símbolo si es necesario
    return formatted.replace(currencyCode, currency.symbol).trim();
  } catch {
    // Fallback si el formato falla
    return `${currency.symbol}${amount.toLocaleString('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  }
}

/**
 * Formatea un número con separadores de miles
 */
export function formatNumber(value: number, decimals = 0): string {
  return value.toLocaleString('es-CO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Formatea un porcentaje
 */
export function formatPercent(value: number): string {
  return `${formatNumber(value, 1)}%`;
}

/**
 * Obtiene el símbolo de la moneda
 */
export function getCurrencySymbol(currencyCode: CurrencyCode, customSymbol?: string): string {
  if (currencyCode === 'CUSTOM') {
    return customSymbol || '$';
  }
  return CURRENCIES[currencyCode]?.symbol || '$';
}

/**
 * Parsea un string de moneda a número
 */
export function parseCurrencyString(value: string): number {
  // Remover todo excepto números, puntos y comas
  const cleaned = value.replace(/[^\d.,\-]/g, '');
  // Reemplazar coma por punto para decimales
  const normalized = cleaned.replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
}
