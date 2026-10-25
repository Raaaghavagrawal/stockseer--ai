// Currency formatting utilities – single source of truth for all price displays.
// Uses Intl.NumberFormat for correct locale-aware grouping (e.g. ₹2,45,000 for INR).

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  decimalPlaces: number;
  locale: string;
}

export const CURRENCY_MAP: Record<string, CurrencyInfo> = {
  'USD': { code: 'USD', symbol: '$',    name: 'US Dollar',         decimalPlaces: 2, locale: 'en-US' },
  'INR': { code: 'INR', symbol: '₹',   name: 'Indian Rupee',      decimalPlaces: 2, locale: 'en-IN' },
  'JPY': { code: 'JPY', symbol: '¥',   name: 'Japanese Yen',      decimalPlaces: 0, locale: 'ja-JP' },
  'EUR': { code: 'EUR', symbol: '€',   name: 'Euro',              decimalPlaces: 2, locale: 'de-DE' },
  'GBP': { code: 'GBP', symbol: '£',   name: 'British Pound',     decimalPlaces: 2, locale: 'en-GB' },
  'CAD': { code: 'CAD', symbol: 'C$',  name: 'Canadian Dollar',   decimalPlaces: 2, locale: 'en-CA' },
  'AUD': { code: 'AUD', symbol: 'A$',  name: 'Australian Dollar', decimalPlaces: 2, locale: 'en-AU' },
  'HKD': { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar',  decimalPlaces: 2, locale: 'zh-HK' },
  'SGD': { code: 'SGD', symbol: 'S$',  name: 'Singapore Dollar',  decimalPlaces: 2, locale: 'en-SG' },
  'CHF': { code: 'CHF', symbol: 'Fr',  name: 'Swiss Franc',       decimalPlaces: 2, locale: 'de-CH' },
  'KRW': { code: 'KRW', symbol: '₩',   name: 'South Korean Won',  decimalPlaces: 0, locale: 'ko-KR' },
  'BRL': { code: 'BRL', symbol: 'R$',  name: 'Brazilian Real',    decimalPlaces: 2, locale: 'pt-BR' },
  'MXN': { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso',      decimalPlaces: 2, locale: 'es-MX' },
  'RUB': { code: 'RUB', symbol: '₽',   name: 'Russian Ruble',     decimalPlaces: 2, locale: 'ru-RU' },
  'CNY': { code: 'CNY', symbol: '¥',   name: 'Chinese Yuan',      decimalPlaces: 2, locale: 'zh-CN' },
  'TRY': { code: 'TRY', symbol: '₺',   name: 'Turkish Lira',      decimalPlaces: 2, locale: 'tr-TR' },
  'ZAR': { code: 'ZAR', symbol: 'R',   name: 'South African Rand',decimalPlaces: 2, locale: 'en-ZA' },
  'ILS': { code: 'ILS', symbol: '₪',   name: 'Israeli Shekel',    decimalPlaces: 2, locale: 'he-IL' },
  'THB': { code: 'THB', symbol: '฿',   name: 'Thai Baht',         decimalPlaces: 2, locale: 'th-TH' },
  'MYR': { code: 'MYR', symbol: 'RM',  name: 'Malaysian Ringgit', decimalPlaces: 2, locale: 'ms-MY' },
  'IDR': { code: 'IDR', symbol: 'Rp',  name: 'Indonesian Rupiah', decimalPlaces: 0, locale: 'id-ID' },
  'PHP': { code: 'PHP', symbol: '₱',   name: 'Philippine Peso',   decimalPlaces: 2, locale: 'en-PH' },
  'VND': { code: 'VND', symbol: '₫',   name: 'Vietnamese Dong',   decimalPlaces: 0, locale: 'vi-VN' },
  'SEK': { code: 'SEK', symbol: 'kr',  name: 'Swedish Krona',     decimalPlaces: 2, locale: 'sv-SE' },
  'NOK': { code: 'NOK', symbol: 'kr',  name: 'Norwegian Krone',   decimalPlaces: 2, locale: 'nb-NO' },
  'DKK': { code: 'DKK', symbol: 'kr',  name: 'Danish Krone',      decimalPlaces: 2, locale: 'da-DK' },
  'NZD': { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar',decimalPlaces: 2, locale: 'en-NZ' },
};

export function getCurrencyInfo(currencyCode: string): CurrencyInfo {
  return CURRENCY_MAP[currencyCode?.toUpperCase()] || CURRENCY_MAP['USD'];
}

/** Return the currency symbol for a given ISO 4217 code. */
export function getCurrencySymbol(currencyCode: string): string {
  return getCurrencyInfo(currencyCode).symbol;
}

/**
 * Format a monetary value using the correct locale and currency symbol.
 * Uses Intl.NumberFormat with style:'currency' for proper locale formatting
 * (e.g. INR → ₹2,45,000.00 with Indian lakh/crore grouping).
 */
export function formatCurrency(
  value: number,
  currencyCode: string = 'USD',
  opts: {
    compact?: boolean;
    showSymbol?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string {
  if (value === null || value === undefined || isNaN(value)) return '—';

  const info = getCurrencyInfo(currencyCode);
  const locale = info.locale;
  const minFrac = opts.minimumFractionDigits ?? info.decimalPlaces;
  const maxFrac = opts.maximumFractionDigits ?? info.decimalPlaces;

  try {
    if (opts.showSymbol === false) {
      // Plain number with locale grouping, no currency symbol
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: minFrac,
        maximumFractionDigits: maxFrac,
        ...(opts.compact ? { notation: 'compact' } : {}),
      }).format(value);
    }

    const formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: info.code,
      minimumFractionDigits: minFrac,
      maximumFractionDigits: maxFrac,
      ...(opts.compact ? { notation: 'compact' } : {}),
    }).format(value);

    return formatted;
  } catch {
    // Fallback if Intl doesn't support the currency
    const sym = info.symbol;
    const num = value.toFixed(maxFrac);
    return `${sym}${num}`;
  }
}

/**
 * Format for Y-axis chart ticks: uses compact notation to avoid label overflow.
 * Examples: ₹2.5K, $3.2M, ¥245K
 */
export function formatCompactCurrency(value: number, currencyCode: string = 'USD'): string {
  if (value === null || value === undefined || isNaN(value)) return '—';

  const info = getCurrencyInfo(currencyCode);
  const locale = info.locale;

  try {
    // For large numbers use compact; for small (< 1000) use full precision
    if (Math.abs(value) >= 1000) {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: info.code,
        notation: 'compact',
        maximumSignificantDigits: 3,
      }).format(value);
    }

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: info.code,
      minimumFractionDigits: info.decimalPlaces,
      maximumFractionDigits: info.decimalPlaces,
    }).format(value);
  } catch {
    const sym = info.symbol;
    if (Math.abs(value) >= 1_000_000_000) return `${sym}${(value / 1_000_000_000).toFixed(1)}B`;
    if (Math.abs(value) >= 1_000_000)     return `${sym}${(value / 1_000_000).toFixed(1)}M`;
    if (Math.abs(value) >= 1_000)         return `${sym}${(value / 1_000).toFixed(1)}K`;
    return `${sym}${value.toFixed(info.decimalPlaces)}`;
  }
}

/**
 * Format a price with the correct currency for display in headers and cards.
 * Respects decimal places for the currency (0 for JPY/KRW, 2 for most others).
 */
export function formatPrice(
  price: number,
  currencyCode: string = 'USD',
  options: { compact?: boolean } = {}
): string {
  return formatCurrency(price, currencyCode, { compact: options.compact ?? false });
}

/**
 * Format a price change amount (with optional sign prefix).
 */
export function formatChange(
  change: number,
  currencyCode: string = 'USD',
  options: { showSign?: boolean } = {}
): string {
  const { showSign = true } = options;
  const sign = showSign && change > 0 ? '+' : '';
  const formatted = formatCurrency(Math.abs(change), currencyCode);
  return `${sign}${change < 0 ? '-' : ''}${formatted.replace(/^[+-]/, '')}`;
}

/**
 * Format a percentage change value.
 */
export function formatChangePercent(
  changePercent: number,
  options: { showSign?: boolean; showSymbol?: boolean } = {}
): string {
  const { showSign = true, showSymbol = false } = options;

  const sign = showSign && changePercent > 0 ? '+' : '';
  const formattedPercent = changePercent.toFixed(2);
  const symbol = showSymbol ? '%' : '';

  return `${sign}${formattedPercent}${symbol}`;
}

/**
 * Format a volume number with K/M/B suffix (no currency symbol).
 */
export function formatVolume(volume: number, currencyCode: string = 'USD'): string {
  const info = getCurrencyInfo(currencyCode);
  const locale = info.locale;

  try {
    return new Intl.NumberFormat(locale, {
      notation: 'compact',
      maximumSignificantDigits: 3,
    }).format(volume);
  } catch {
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(2)}K`;
    return volume.toString();
  }
}

/**
 * Format a market cap value with appropriate suffix and currency symbol.
 */
export function formatMarketCap(marketCap: number, currencyCode: string = 'USD'): string {
  return formatCurrency(marketCap, currencyCode, { compact: true });
}
