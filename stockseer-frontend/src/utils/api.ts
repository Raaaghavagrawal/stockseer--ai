import axios from 'axios';
import { API_BASE_URL } from './apiConfig';
import type {
  StockData,
  StockChartData,
  StockChartResponse,
  TechnicalIndicators,
  StockPrediction,
  PortfolioHolding,
  NewsItem,
  AdvancedMetrics,
  LifePlannerGoal,
  Note
} from '../types/stock';

export interface NotesResponse {
  notes: Note[];
  [key: string]: unknown;
}

export interface GoalsResponse {
  goals: LifePlannerGoal[];
  [key: string]: unknown;
}

export interface SubscriptionInfo {
  plan: string;
  status: string;
  expiresAt?: string;
  allowedMarkets?: string[];
  [key: string]: unknown;
}

export interface MLPrediction {
  signal: 'Bullish' | 'Bearish';
  confidence: number;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  risk_level: 'High' | 'Medium' | 'Low';
  p_bull: number;
  volatility: { sharpe: number; max_drawdown: number };
}

export interface MarketRestrictionDetails {
  isMarketRestricted: boolean;
  error?: unknown;
  market: string;
  currentPlan: string;
  requiredPlan: string;
  message: string;
  details: string;
  availableMarkets: string[];
  upgradeUrl: string;
}

export interface AxiosLikeError {
  response?: {
    status?: number;
    statusText?: string;
    data?: {
      error?: string;
      message?: string;
      details?: unknown;
      required_plan?: string;
      current_plan?: string;
      upgrade_url?: string;
      market?: string;
      available_markets?: string[];
      [key: string]: unknown;
    };
    headers?: Record<string, string>;
  };
  request?: unknown;
  code?: string;
  message?: string;
}

/**
 * Sanitizes a stock symbol by trimming whitespace, converting to uppercase,
 * and removing trailing dots.
 */
export function sanitizeSymbol(symbol: string): string {
  if (!symbol) return '';
  
  let sanitized = symbol.trim().toUpperCase();
  
  // Remove trailing dots recursively (e.g., "ITC..." -> "ITC")
  while (sanitized.endsWith('.')) {
    sanitized = sanitized.slice(0, -1);
  }
  
  // Prevent duplicate suffixes (e.g., "ITC.NS.NS" -> "ITC.NS")
  const suffixes = ['.NS', '.BO', '.T', '.TO', '.L', '.PA', '.DE', '.AS', '.BR', '.MI', '.MC', '.AX', '.HK', '.SI', '.SW', '.KS', '.SA', '.MX', '.ME', '.SS', '.SZ', '.IS', '.JO', '.TA', '.BK', '.KL', '.JK', '.PS', '.VN'];
  
  for (const suffix of suffixes) {
    if (sanitized.endsWith(suffix + suffix)) {
      sanitized = sanitized.replace(suffix + suffix, suffix);
    }
  }
  
  return sanitized;
}

// Simple in-memory cache with TTL
type CacheEntry<T> = { data: T; timestamp: number };
const STOCK_TTL_MS = 60_000; // 1 minute
const CHART_TTL_MS = 60_000; // 1 minute
const stockDataCache: Map<string, CacheEntry<StockData>> = new Map();
const chartDataCache: Map<string, CacheEntry<StockChartData[]>> = new Map();

// Retry helper for transient errors (e.g., 429/503)
async function requestWithRetry<T>(fn: () => PromiseLike<T> | T, maxRetries = 3, baseDelayMs = 300): Promise<T> {
  let attempt = 0;
  let lastError: unknown;
  while (attempt <= maxRetries) {
    try {
      // Support both promise-returning and value-returning functions
      return await Promise.resolve(fn());
    } catch (error: unknown) {
      lastError = error;
      const axiosError = error as AxiosLikeError;
      const status = axiosError?.response?.status;
      const isTimeout = axiosError.code === 'ECONNABORTED' || (axiosError.message ? axiosError.message.toLowerCase().includes('timeout') : false);
      
      // Retry on Rate Limit (429), Service Unavailable (503), or Timeout
      if (status !== 429 && status !== 503 && !isTimeout) break;
      
      console.warn(`API call failed (Attempt ${attempt + 1}/${maxRetries + 1}). Retrying...`, {
        status,
        isTimeout,
        error: axiosError.message
      });

      const retryAfterHeader = axiosError?.response?.headers?.['retry-after'];
      const retryAfter = retryAfterHeader ? Number(retryAfterHeader) * 1000 : null;
      const delayMs = retryAfter ?? baseDelayMs * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delayMs));
      attempt += 1;
    }
  }
  throw lastError;
}

function detectCurrencyFromSymbol(symbol: string): string {
  const symbolUpper = symbol.toUpperCase();
  if (symbolUpper.endsWith('.NS') || symbolUpper.endsWith('.BO')) {
    return 'INR';
  }
  
  // Japanese stocks (Tokyo Stock Exchange)
  if (symbolUpper.endsWith('.T')) {
    return 'JPY';
  }
  
  // European stocks
  if (symbolUpper.endsWith('.L')) return 'GBP';  // London
  if (symbolUpper.endsWith('.PA')) return 'EUR'; // Paris
  if (symbolUpper.endsWith('.DE')) return 'EUR'; // Frankfurt
  if (symbolUpper.endsWith('.AS')) return 'EUR'; // Amsterdam
  if (symbolUpper.endsWith('.BR')) return 'EUR'; // Brussels
  if (symbolUpper.endsWith('.MI')) return 'EUR'; // Milan
  if (symbolUpper.endsWith('.MC')) return 'EUR'; // Madrid
  
  // Canadian stocks
  if (symbolUpper.endsWith('.TO') || symbolUpper.endsWith('.V')) {
    return 'CAD';
  }
  
  // Australian stocks
  if (symbolUpper.endsWith('.AX')) return 'AUD';
  
  // Hong Kong stocks
  if (symbolUpper.endsWith('.HK')) return 'HKD';
  
  // Singapore stocks
  if (symbolUpper.endsWith('.SI')) return 'SGD';
  
  // Swiss stocks
  if (symbolUpper.endsWith('.SW')) return 'CHF';
  
  // South Korean stocks
  if (symbolUpper.endsWith('.KS')) return 'KRW';
  
  // Brazilian stocks
  if (symbolUpper.endsWith('.SA')) return 'BRL';
  
  // Mexican stocks
  if (symbolUpper.endsWith('.MX')) return 'MXN';
  
  // Russian stocks
  if (symbolUpper.endsWith('.ME')) return 'RUB';
  
  // Chinese stocks
  if (symbolUpper.endsWith('.SS') || symbolUpper.endsWith('.SZ')) {
    return 'CNY';
  }
  
  // Turkish stocks
  if (symbolUpper.endsWith('.IS')) return 'TRY';
  
  // South African stocks
  if (symbolUpper.endsWith('.JO')) return 'ZAR';
  
  // Israeli stocks
  if (symbolUpper.endsWith('.TA')) return 'ILS';
  
  // Thai stocks
  if (symbolUpper.endsWith('.BK')) return 'THB';
  
  // Malaysian stocks
  if (symbolUpper.endsWith('.KL')) return 'MYR';
  
  // Indonesian stocks
  if (symbolUpper.endsWith('.JK')) return 'IDR';
  
  // Philippine stocks
  if (symbolUpper.endsWith('.PS')) return 'PHP';
  
  // Vietnamese stocks
  if (symbolUpper.endsWith('.VN')) return 'VND';
  
  // Default to USD for US stocks and unknown
  return 'USD';
}

export { API_BASE_URL } from './apiConfig';

/**
 * Pings backend /health on app mount to wake up dormant free Render instance
 * without showing anything in the UI or blocking any user action.
 */
export const warmUpBackend = (): void => {
  try {
    fetch(`${API_BASE_URL}/health`, { method: 'GET', cache: 'no-store' }).catch(() => {
      // Ignore background warmup errors
    });
  } catch {
    // Ignore background warmup errors
  }
};

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to get subscription headers from localStorage
const getSubscriptionHeaders = () => {
  const plan = localStorage.getItem('stockseer_subscription_plan') || 'free';
  const continent = localStorage.getItem('stockseer_selected_continent') || null;
  const userId = localStorage.getItem('stockseer_user_id') || null;
  
  return {
    'X-Subscription-Plan': plan,
    'X-Selected-Continent': continent,
    'X-User-Id': userId,
  };
};

// Add request interceptor to include subscription headers
api.interceptors.request.use((config) => {
  const subscriptionHeaders = getSubscriptionHeaders();
  config.headers = Object.assign(config.headers || {}, subscriptionHeaders);
  return config;
});

// Stock data API calls
export const stockAPI = {
  // Get real-time stock data
  getStockData: async (symbol: string, onMarketRestriction?: (details: MarketRestrictionDetails) => void): Promise<StockData> => {
    try {
      const sanitizedSymbol = sanitizeSymbol(symbol);
      if (!sanitizedSymbol) throw new Error('Invalid stock symbol');

      const cacheKey = sanitizedSymbol;
      const cached = stockDataCache.get(cacheKey);
      const now = Date.now();
      if (cached && now - cached.timestamp < STOCK_TTL_MS) {
        return cached.data;
      }

      const response = await requestWithRetry(() => api.get<StockData>(`/stocks/${sanitizedSymbol}`));
      const data = { ...response.data, currency: response.data.currency || detectCurrencyFromSymbol(sanitizedSymbol) };
      stockDataCache.set(cacheKey, { data, timestamp: now });
      return data;
    } catch (error) {
      console.error('API Error in getStockData:', error);
      
      // Handle market restriction errors
      if (onMarketRestriction) {
        const restrictionError = handleMarketRestrictionError(error);
        if (restrictionError.isMarketRestricted) {
          onMarketRestriction(restrictionError);
          throw error; // Re-throw to maintain error handling flow
        }
      }
      
      // For non-restriction errors, return mock data for testing
      const currency = detectCurrencyFromSymbol(symbol);
      return {
        symbol: symbol,
        name: `${symbol} Inc.`,
        price: 150.25,
        change: 2.15,
        changePercent: 1.45,
        volume: 45000000,
        marketCap: 2500000000000,
        pe: 25.5,
        dividendYield: 0.5,
        high52Week: 180.00,
        low52Week: 120.00,
        high: 152.30,
        low: 148.20,
        open: 148.50,
        previousClose: 148.10,
        currency: currency,
        timestamp: new Date().toISOString()
      } as StockData;
    }
  },

  // Get historical chart data
  getStockChartData: async (symbol: string, period: string = '3mo', interval: string = '1d'): Promise<StockChartData[]> => {
    try {
      const sanitizedSymbol = sanitizeSymbol(symbol);
      if (!sanitizedSymbol) throw new Error('Invalid stock symbol');

      const cacheKey = `${sanitizedSymbol}|${period}|${interval}`;
      const cached = chartDataCache.get(cacheKey);
      const now = Date.now();
      if (cached && now - cached.timestamp < CHART_TTL_MS) {
        return cached.data;
      }

      const response = await requestWithRetry(() => api.get<StockChartResponse>(`/stocks/${sanitizedSymbol}/chart`, { params: { period, interval } }));
      const currency = response.data.currency || detectCurrencyFromSymbol(sanitizedSymbol);
      const data = response.data.data.map((point: StockChartData) => ({ ...point, currency }));
      chartDataCache.set(cacheKey, { data, timestamp: now });
      return data;
    } catch (error) {
      console.error('API Error in getStockChartData:', error);
      // Return mock chart data for testing if API fails
      const mockData: StockChartData[] = [];
      const now = new Date();
      for (let i = 30; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        mockData.push({
          date: date.toISOString().split('T')[0],
          open: 145 + Math.random() * 10,
          high: 150 + Math.random() * 10,
          low: 140 + Math.random() * 10,
          close: 145 + Math.random() * 10,
          volume: Math.floor(Math.random() * 10000000),
          currency: detectCurrencyFromSymbol(symbol)
        });
      }
      return mockData;
    }
  },

  // Get technical indicators
  getTechnicalIndicators: async (symbol: string): Promise<TechnicalIndicators> => {
    const sanitizedSymbol = sanitizeSymbol(symbol);
    if (!sanitizedSymbol) throw new Error('Invalid stock symbol');
    const response = await requestWithRetry(() => api.get<TechnicalIndicators>(`/stocks/${sanitizedSymbol}/technical`));
    return response.data;
  },

  // Search stocks
  searchStocks: async (query: string): Promise<{ symbol: string; name: string; price?: number; change?: number; currency?: string }[]> => {
    const response = await requestWithRetry(() => api.get<{ symbol: string; name: string; price?: number; change?: number; currency?: string }[]>('/stocks/search-simple', { params: { q: query } }));
    return response.data;
  },

  // Get company info
  getCompanyInfo: async (symbol: string): Promise<Record<string, unknown>> => {
    const sanitizedSymbol = sanitizeSymbol(symbol);
    if (!sanitizedSymbol) throw new Error('Invalid stock symbol');
    const response = await requestWithRetry(() => api.get<Record<string, unknown>>(`/stocks/${sanitizedSymbol}/info`));
    return response.data;
  },

  // Get advanced metrics
  getAdvancedMetrics: async (symbol: string, period: string = '1y', riskFreeRate: number = 0.03): Promise<{ metrics: AdvancedMetrics; [key: string]: unknown }> => {
    const sanitizedSymbol = sanitizeSymbol(symbol);
    if (!sanitizedSymbol) throw new Error('Invalid stock symbol');
    const response = await requestWithRetry(() => api.get<{ metrics: AdvancedMetrics; [key: string]: unknown }>(`/stocks/${sanitizedSymbol}/advanced-metrics`, { params: { period, risk_free_rate: riskFreeRate } }));
    return response.data;
  },
};

// Life Planner API calls
export const lifePlannerAPI = {
  // Get all goals
  getGoals: async (): Promise<GoalsResponse> => {
    const response = await requestWithRetry(() => api.get<GoalsResponse>('/life-planner/goals'));
    return response.data;
  },

  // Create a new goal
  createGoal: async (goalData: Partial<LifePlannerGoal> | Record<string, unknown>): Promise<LifePlannerGoal> => {
    const response = await requestWithRetry(() => api.post<LifePlannerGoal>('/life-planner/goals', goalData));
    return response.data;
  },

  // Update an existing goal
  updateGoal: async (goalId: string, goalData: Partial<LifePlannerGoal> | Record<string, unknown>): Promise<LifePlannerGoal> => {
    const response = await requestWithRetry(() => api.put<LifePlannerGoal>(`/life-planner/goals/${goalId}`, goalData));
    return response.data;
  },

  // Delete a goal
  deleteGoal: async (goalId: string): Promise<{ success?: boolean }> => {
    const response = await requestWithRetry(() => api.delete<{ success?: boolean }>(`/life-planner/goals/${goalId}`));
    return response.data;
  },
};

// Notes API calls
export const notesAPI = {
  // Get all notes
  getNotes: async (): Promise<NotesResponse> => {
    const response = await requestWithRetry(() => api.get<NotesResponse>('/notes'));
    return response.data;
  },

  // Create a new note
  createNote: async (noteData: Partial<Note> | Record<string, unknown>): Promise<Note> => {
    const response = await requestWithRetry(() => api.post<Note>('/notes', noteData));
    return response.data;
  },

  // Update an existing note
  updateNote: async (noteId: string, noteData: Partial<Note> | Record<string, unknown>): Promise<Note> => {
    const response = await requestWithRetry(() => api.put<Note>(`/notes/${noteId}`, noteData));
    return response.data;
  },

  // Delete a note
  deleteNote: async (noteId: string): Promise<{ success?: boolean }> => {
    const response = await requestWithRetry(() => api.delete<{ success?: boolean }>(`/notes/${noteId}`));
    return response.data;
  },
};

// Predictions API calls
export const predictionsAPI = {
  // Get AI predictions for a stock
  getStockPrediction: async (symbol: string): Promise<StockPrediction> => {
    const sanitizedSymbol = sanitizeSymbol(symbol);
    if (!sanitizedSymbol) throw new Error('Invalid stock symbol');
    // Backend exposes /predictions/{symbol}
    const response = await requestWithRetry(() => api.get<StockPrediction>(`/predictions/${sanitizedSymbol}`));
    return response.data;
  },

  // Get all predictions
  getAllPredictions: async (): Promise<StockPrediction[]> => {
    const response = await requestWithRetry(() => api.get<StockPrediction[]>('/predictions'));
    return response.data;
  },

  // Get trending predictions
  getTrendingPredictions: async (): Promise<StockPrediction[]> => {
    const response = await requestWithRetry(() => api.get<StockPrediction[]>('/predictions/trending'));
    return response.data;
  },
};

// Portfolio API calls
export const portfolioAPI = {
  // Get portfolio holdings
  getPortfolio: async (): Promise<PortfolioHolding[]> => {
    const response = await api.get<{ holdings: PortfolioHolding[]; metrics?: unknown }>('/portfolio');
    return response.data.holdings.map((holding) => ({
      ...holding,
      currency: holding.currency || detectCurrencyFromSymbol(holding.symbol)
    }));
  },

  // Add stock to portfolio
  addToPortfolio: async (symbol: string, shares: number, avgPrice: number): Promise<void> => {
    await api.post('/portfolio', { symbol, shares, avgPrice });
  },

  // Update portfolio holding
  updateHolding: async (symbol: string, shares: number, avgPrice: number): Promise<void> => {
    await api.put(`/portfolio/${symbol}`, { shares, avgPrice });
  },

  // Remove from portfolio
  removeFromPortfolio: async (symbol: string): Promise<void> => {
    await api.delete(`/portfolio/${symbol}`);
  },
};

// News API calls
export const newsAPI = {
  // Get stock-specific news
  getStockNews: async (symbol: string): Promise<NewsItem[]> => {
    const sanitizedSymbol = sanitizeSymbol(symbol);
    if (!sanitizedSymbol) throw new Error('Invalid stock symbol');
    const response = await requestWithRetry(() => api.get<NewsItem[]>(`/stocks/${sanitizedSymbol}/news`));
    return response.data;
  },

  // Get market news (using Google news scraping)
  getMarketNews: async (): Promise<NewsItem[]> => {
    const response = await requestWithRetry(() => api.get<NewsItem[]>('/news/scrape/google'));
    return response.data;
  },

  // Get trending news (using Yahoo Finance for a default stock)
  getTrendingNews: async (): Promise<NewsItem[]> => {
    const response = await requestWithRetry(() => api.get<NewsItem[]>('/news/scrape/yahoo/AAPL'));
    return response.data;
  },
};

// Subscription API calls
export const subscriptionAPI = {
  getSubscriptionInfo: async (): Promise<SubscriptionInfo> => {
    const response = await requestWithRetry(() => api.get<SubscriptionInfo>('/subscription/info'));
    return response.data;
  },

  // Get available markets for current subscription
  getAvailableMarkets: async (): Promise<string[]> => {
    const response = await requestWithRetry(() => api.get<string[]>('/subscription/markets'));
    return response.data;
  },

  // Validate market access
  validateMarketAccess: async (market: string): Promise<{ allowed: boolean; message?: string }> => {
    const response = await requestWithRetry(() => api.post<{ allowed: boolean; message?: string }>('/subscription/validate-market', { market }));
    return response.data;
  },
};

// ML Prediction API
export const mlAPI = {
  getPrediction: async (symbol: string): Promise<MLPrediction> => {
    const sanitizedSymbol = sanitizeSymbol(symbol);
    if (!sanitizedSymbol) throw new Error('Invalid stock symbol');
    const response = await requestWithRetry(() => api.get<MLPrediction>(`/ml/predict/${sanitizedSymbol}`));
    return response.data;
  }
};

// Error handling utility
export const handleAPIError = (error: unknown): string => {
  const err = error as AxiosLikeError;
  if (err?.response) {
    if (err.response.status === 403 && err.response.data?.error === 'market_restricted') {
      return `Market Access Restricted: ${err.response.data.message || ''}`;
    }
    return err.response.data?.message || `Error ${err.response.status}: ${err.response.statusText || ''}`;
  } else if (err?.request) {
    return 'No response from server. Please check your connection.';
  } else if (err instanceof Error || typeof err?.message === 'string') {
    return err.message || 'An unexpected error occurred.';
  }
  return 'An unexpected error occurred.';
};

// Market restriction error handler
export const handleMarketRestrictionError = (error: unknown): MarketRestrictionDetails => {
  const err = error as AxiosLikeError;
  if (err?.response?.status === 403 && err.response.data?.error === 'market_restricted') {
    return {
      isMarketRestricted: true,
      error: err.response.data,
      message: err.response.data.message || '',
      details: typeof err.response.data.details === 'string' ? err.response.data.details : JSON.stringify(err.response.data.details || ''),
      requiredPlan: err.response.data.required_plan || '',
      currentPlan: err.response.data.current_plan || '',
      upgradeUrl: err.response.data.upgrade_url || '',
      market: err.response.data.market || 'Unknown',
      availableMarkets: err.response.data.available_markets || []
    };
  }
  return {
    isMarketRestricted: false,
    error: error,
    market: 'Unknown',
    currentPlan: '',
    requiredPlan: '',
    message: '',
    details: '',
    availableMarkets: [],
    upgradeUrl: ''
  };
};

// Enhanced API call with market restriction handling
export const apiCallWithMarketRestriction = async <T>(
  apiCall: () => Promise<T>,
  onMarketRestriction: (restrictionDetails: MarketRestrictionDetails) => void
): Promise<T> => {
  try {
    return await apiCall();
  } catch (error: unknown) {
    const restrictionError = handleMarketRestrictionError(error);
    if (restrictionError.isMarketRestricted) {
      onMarketRestriction(restrictionError);
      throw error; // Re-throw to maintain error handling flow
    }
    throw error;
  }
};

export default api;
