// Currency formatting utilities

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  decimalPlaces: number;
}

export const CURRENCY_MAP: Record<string, CurrencyInfo> = {
  'USD': { code: 'USD', symbol: '$', name: 'US Dollar', decimalPlaces: 2 },
  'INR': { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimalPlaces: 2 },
  'JPY': { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimalPlaces: 0 },
  'EUR': { code: 'EUR', symbol: '€', name: 'Euro', decimalPlaces: 2 },
  'GBP': { code: 'GBP', symbol: '£', name: 'British Pound', decimalPlaces: 2 },
  'CAD': { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', decimalPlaces: 2 },
  'AUD': { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', decimalPlaces: 2 },
  'HKD': { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', decimalPlaces: 2 },
  'SGD': { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', decimalPlaces: 2 },
  'CHF': { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', decimalPlaces: 2 },
  'KRW': { code: 'KRW', symbol: '₩', name: 'South Korean Won', decimalPlaces: 0 },
  'BRL': { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', decimalPlaces: 2 },
  'MXN': { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso', decimalPlaces: 2 },
  'RUB': { code: 'RUB', symbol: '₽', name: 'Russian Ruble', decimalPlaces: 2 },
  'CNY': { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', decimalPlaces: 2 },
  'TRY': { code: 'TRY', symbol: '₺', name: 'Turkish Lira', decimalPlaces: 2 },
  'ZAR': { code: 'ZAR', symbol: 'R', name: 'South African Rand', decimalPlaces: 2 },
  'ILS': { code: 'ILS', symbol: '₪', name: 'Israeli Shekel', decimalPlaces: 2 },
  'THB': { code: 'THB', symbol: '฿', name: 'Thai Baht', decimalPlaces: 2 },
  'MYR': { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', decimalPlaces: 2 },
  'IDR': { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', decimalPlaces: 0 },
  'PHP': { code: 'PHP', symbol: '₱', name: 'Philippine Peso', decimalPlaces: 2 },
  'VND': { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', decimalPlaces: 0 },
};

export function getCurrencyInfo(currencyCode: string): CurrencyInfo {
  return CURRENCY_MAP[currencyCode] || CURRENCY_MAP['USD'];
}

export function formatCurrency(
  value: number, 
  currencyCode: string = 'USD', 
  options: {
    showSymbol?: boolean;
    showCode?: boolean;
    compact?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string {
  const {
    showSymbol = true,
    showCode = false,
    compact = false,
    minimumFractionDigits,
    maximumFractionDigits
  } = options;

  const currencyInfo = getCurrencyInfo(currencyCode);
  
  // Determine decimal places
  const minDigits = minimumFractionDigits ?? currencyInfo.decimalPlaces;
  const maxDigits = maximumFractionDigits ?? currencyInfo.decimalPlaces;

  // Format the number
  let formattedValue: string;
  
  if (compact && value >= 1000000) {
    // For large numbers, use compact notation
    const formatter = new Intl.NumberFormat('en-US', {
      notation: 'compact',
      minimumFractionDigits: minDigits,
      maximumFractionDigits: maxDigits,
    });
    formattedValue = formatter.format(value);
  } else {
    // Regular formatting
    const formatter = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: minDigits,
      maximumFractionDigits: maxDigits,
    });
    formattedValue = formatter.format(value);
  }

  // Add currency symbol/code
  let result = formattedValue;
  
  if (showSymbol) {
    result = `${currencyInfo.symbol}${result}`;
  }
  
  if (showCode) {
    result = `${result} ${currencyCode}`;
  }

  return result;
}

export function formatPrice(
  price: number, 
  currencyCode: string = 'USD',
  options: {
    showSymbol?: boolean;
    compact?: boolean;
  } = {}
): string {
  return formatCurrency(price, currencyCode, {
    showSymbol: options.showSymbol ?? true,
    compact: options.compact ?? false,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export function formatChange(
  change: number, 
  currencyCode: string = 'USD',
  options: {
    showSymbol?: boolean;
    showSign?: boolean;
  } = {}
): string {
  const { showSymbol = true, showSign = true } = options;
  
  const sign = showSign && change > 0 ? '+' : '';
  const formattedChange = formatCurrency(Math.abs(change), currencyCode, {
    showSymbol,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return `${sign}${formattedChange}`;
}

export function formatChangePercent(
  changePercent: number,
  options: {
    showSign?: boolean;
    showSymbol?: boolean;
  } = {}
): string {
  const { showSign = true, showSymbol = false } = options;
  
  const sign = showSign && changePercent > 0 ? '+' : '';
  const formattedPercent = changePercent.toFixed(2);
  const symbol = showSymbol ? '%' : '';
  
  return `${sign}${formattedPercent}${symbol}`;
}

export function formatVolume(
  volume: number,
  currencyCode: string = 'USD'
): string {
  if (volume >= 1000000000) {
    return `${formatCurrency(volume / 1000000000, currencyCode, { showSymbol: false })}B`;
  } else if (volume >= 1000000) {
    return `${formatCurrency(volume / 1000000, currencyCode, { showSymbol: false })}M`;
  } else if (volume >= 1000) {
    return `${formatCurrency(volume / 1000, currencyCode, { showSymbol: false })}K`;
  } else {
    return formatCurrency(volume, currencyCode, { showSymbol: false });
  }
}

export function formatMarketCap(
  marketCap: number,
  currencyCode: string = 'USD'
): string {
  return formatCurrency(marketCap, currencyCode, { compact: true });
}
