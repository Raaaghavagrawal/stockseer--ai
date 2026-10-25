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

export interface RiskAnalysisResponse {
  ticker: string;
  period: string;
  analysis_version: string;
  score: number | null;
  classification: string;
  score_interpretation: string;
  metrics: {
    annualized_volatility: number | null;
    short_term_volatility_20d: number | null;
    long_term_volatility: number | null;
    short_to_long_volatility_ratio: number | null;
    max_drawdown: number | null;
    downside_deviation: number | null;
    historical_var_95: number | null;
    historical_cvar_95: number | null;
    sharpe_ratio: number | null;
    sortino_ratio: number | null;
    annualized_return: number | null;
    beta: number | null;
    benchmark_correlation: number | null;
    relative_return: number | null;
  };
  components: Record<string, { current_63d_value: number | null; historical_percentile: number | null; weight: number }>;
  indicators: Record<string, number | null>;
  history: Array<{ date: string; close: number; drawdown: number; volatility_20d: number | null; sma_20: number | null; sma_50: number | null }>;
  data_quality: {
    source: string;
    input_observations: number;
    retrieved_at: string;
    latest_observation: string;
    age_days: number;
    freshness: 'current' | 'stale';
    validation_status: 'valid' | 'partial';
    period_start: string;
    period_end: string;
    observations: number;
    dropped_observations: number;
    duplicate_timestamps_removed: number;
    missing_data_count: number;
    missing_data_ratio: number;
    adjusted_close_missing: number | null;
    uses_adjusted_close: boolean;
  };
  benchmark: { ticker: string | null; available: boolean };
  forecast: {
    status: 'validated' | 'experimental' | 'unavailable';
    reason: string;
    horizon_sessions: number;
    model: string;
    model_version?: string;
    trained_at?: string | null;
    training_period_start?: string;
    training_period_end?: string;
    features: string[];
    reference_price?: number;
    reference_timestamp?: string;
    estimate_return: number | null;
    estimate_price: number | null;
    uncertainty?: string | null;
    evaluation: null | {
      method: string;
      samples: number;
      test_start: string;
      test_end: string;
      mae: number;
      rmse: number;
      baseline: string;
      baseline_mae: number;
      baseline_rmse: number;
      directional_accuracy: number;
      passed_criteria: boolean;
    };
  };
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
async function requestWithRetry<T>(fn: () => PromiseLike<T> | T, maxRetries = 2, baseDelayMs = 300): Promise<T> {
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
      const isTimeout = axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT';
      
      // A refused connection is a backend availability/configuration issue; retrying
      // it only delays useful feedback. Retry bounded transient responses/timeouts.
      if (![429, 502, 503, 504].includes(status ?? 0) && !isTimeout) break;
      
      console.warn(`API call failed (Attempt ${attempt + 1}/${maxRetries + 1}). Retrying...`, {
        status,
        isTimeout,
        error: axiosError.message
      });

      const retryAfterHeader = axiosError?.response?.headers?.['retry-after'];
      const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : NaN;
      const delayMs = Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0
        ? Math.min(retryAfterSeconds * 1000, 3000)
        : baseDelayMs * Math.pow(2, attempt);
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
      // Handle market restriction errors
      if (onMarketRestriction) {
        const restrictionError = handleMarketRestrictionError(error);
        if (restrictionError.isMarketRestricted) {
          onMarketRestriction(restrictionError);
          throw error; // Re-throw to maintain error handling flow
        }
      }

      throw error;
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
      throw error;
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
  getAnalysis: async (symbol: string, period: '1y' | '2y' | '5y', horizon: 1 | 5 | 20): Promise<RiskAnalysisResponse> => {
    const sanitizedSymbol = sanitizeSymbol(symbol);
    if (!sanitizedSymbol) throw new Error('Invalid stock symbol');
    const response = await api.get<RiskAnalysisResponse>(`/api/ml/analysis/${encodeURIComponent(sanitizedSymbol)}`, {
      params: { period, horizon },
    });
    return response.data;
  },

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
    const status = err.response.status ?? 0;
    const body = err.response.data;
    const detail = body?.detail && typeof body.detail === 'object'
      ? body.detail as NonNullable<AxiosLikeError['response']>['data']
      : body;
    if (err.response.status === 403 && detail?.error === 'market_restricted') {
      return `Market Access Restricted: ${detail.message || ''}`;
    }
    if (typeof detail === 'string') {
      if (status === 400) return `Invalid stock symbol: ${detail}`;
      if (status >= 500) return 'The stock data service is temporarily unavailable. Please try again shortly.';
      return detail;
    }
    if (status === 400) return 'Invalid stock symbol. Check the ticker and exchange suffix (for example, TCS.NS).';
    if (status === 429) return 'Too many requests. Please wait a moment and try again.';
    if (status >= 500) return detail?.message || body?.message || 'The stock data service is temporarily unavailable. Please try again shortly.';
    return detail?.message || body?.message || `Request failed (${status}).`;
  } else if (err?.request) {
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      return 'The backend did not respond in time. Please try again shortly.';
    }
    return `Cannot reach the StockSeer backend at ${API_BASE_URL}. Check that the backend is running and VITE_API_BASE_URL points to it.`;
  } else if (err instanceof Error || typeof err?.message === 'string') {
    return err.message || 'An unexpected error occurred.';
  }
  return 'An unexpected error occurred.';
};

// Market restriction error handler
export const handleMarketRestrictionError = (error: unknown): MarketRestrictionDetails => {
  const err = error as AxiosLikeError;
  const body = err?.response?.data;
  const detail = body?.detail && typeof body.detail === 'object'
    ? body.detail as NonNullable<AxiosLikeError['response']>['data']
    : body;
  if (err?.response?.status === 403 && detail?.error === 'market_restricted') {
    return {
      isMarketRestricted: true,
      error: detail,
      message: detail.message || '',
      details: typeof detail.details === 'string' ? detail.details : JSON.stringify(detail.details || ''),
      requiredPlan: detail.required_plan || '',
      currentPlan: detail.current_plan || '',
      upgradeUrl: detail.upgrade_url || '',
      market: detail.market || 'Unknown',
      availableMarkets: detail.available_markets || []
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
