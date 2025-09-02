// Format currency values
export const formatCurrency = (value: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Format percentage values
export const formatPercentage = (value: number, decimals: number = 2): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
};

// Format large numbers (e.g., market cap, volume)
export const formatLargeNumber = (value: number): string => {
  if (value >= 1e12) {
    return `${(value / 1e12).toFixed(2)}T`;
  } else if (value >= 1e9) {
    return `${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e6) {
    return `${(value / 1e6).toFixed(2)}M`;
  } else if (value >= 1e3) {
    return `${(value / 1e3).toFixed(2)}K`;
  }
  return value.toFixed(2);
};

// Format date strings
export const formatDate = (dateString: string, format: 'short' | 'long' | 'relative' = 'short'): string => {
  const date = new Date(dateString);
  
  if (format === 'relative') {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  }
  
  if (format === 'long') {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Get color based on value change (positive/negative)
export const getChangeColor = (change: number, isPercentage: boolean = false): string => {
  if (isPercentage) {
    return change >= 0 ? 'text-success-600' : 'text-danger-600';
  }
  return change >= 0 ? 'text-success-600' : 'text-danger-600';
};

// Get background color for change indicators
export const getChangeBgColor = (change: number, isPercentage: boolean = false): string => {
  if (isPercentage) {
    return change >= 0 ? 'bg-success-50 dark:bg-success-900/20' : 'bg-danger-50 dark:bg-danger-900/20';
  }
  return change >= 0 ? 'bg-success-50 dark:bg-success-900/20' : 'bg-danger-50 dark:bg-danger-900/20';
};

// Calculate percentage change
export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

// Debounce function for search inputs
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Generate random ID for temporary items
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

// Validate stock symbol format
export const isValidStockSymbol = (symbol: string): boolean => {
  return /^[A-Z]{1,5}$/.test(symbol);
};

// Get sentiment color
export const getSentimentColor = (sentiment: 'positive' | 'negative' | 'neutral'): string => {
  switch (sentiment) {
    case 'positive':
      return 'text-success-600';
    case 'negative':
      return 'text-danger-600';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
};

// Get sentiment background color
export const getSentimentBgColor = (sentiment: 'positive' | 'negative' | 'neutral'): string => {
  switch (sentiment) {
    case 'positive':
      return 'bg-success-50 dark:bg-success-900/20';
    case 'negative':
      return 'bg-danger-50 dark:bg-danger-900/20';
    default:
      return 'bg-gray-50 dark:bg-dark-700';
  }
};

// Format time for charts
export const formatChartTime = (timestamp: string | number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

// Get confidence level text and color
export const getConfidenceLevel = (confidence: number): { text: string; color: string } => {
  if (confidence >= 0.8) {
    return { text: 'Very High', color: 'text-success-600' };
  } else if (confidence >= 0.6) {
    return { text: 'High', color: 'text-primary-600' };
  } else if (confidence >= 0.4) {
    return { text: 'Medium', color: 'text-warning-600' };
  } else {
    return { text: 'Low', color: 'text-danger-600' };
  }
};
