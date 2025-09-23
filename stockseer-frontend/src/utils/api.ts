import axios from 'axios';

// Simple in-memory cache with TTL
type CacheEntry<T> = { data: T; timestamp: number };
const STOCK_TTL_MS = 60_000; // 1 minute
const CHART_TTL_MS = 60_000; // 1 minute
const stockDataCache: Map<string, CacheEntry<any>> = new Map();
const chartDataCache: Map<string, CacheEntry<any>> = new Map();

// Retry helper for transient errors (e.g., 429/503)
async function requestWithRetry(fn: () => any, maxRetries = 3, baseDelayMs = 300): Promise<any> {
  let attempt = 0;
  let lastError: any;
  while (attempt <= maxRetries) {
    try {
      // Support both promise-returning and value-returning functions
      return await Promise.resolve(fn());
    } catch (error: any) {
      lastError = error;
      const status = error?.response?.status;
      if (status !== 429 && status !== 503) break;
      const retryAfterHeader = error?.response?.headers?.['retry-after'];
      const retryAfter = retryAfterHeader ? Number(retryAfterHeader) * 1000 : null;
      const delayMs = retryAfter ?? baseDelayMs * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delayMs));
      attempt += 1;
    }
  }
  throw lastError;
}

// Currency detection function
function detectCurrencyFromSymbol(symbol: string): string {
  const symbolUpper = symbol.toUpperCase();
  
  // Indian stocks (NSE/BSE)
  if (symbolUpper.endsWith('.NS') || symbolUpper.endsWith('.BO')) {
    return 'INR';
  }
  
  // Japanese stocks (Tokyo Stock Exchange)
  if (symbolUpper.endsWith('.T') || symbolUpper.endsWith('.TO')) {
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

// Configure axios with base URL and default headers
const api = axios.create({
  baseURL: 'http://localhost:8000', // Direct connection to Python backend
  timeout: 30000, // Increased timeout to 30 seconds
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
  config.headers = { ...config.headers, ...subscriptionHeaders };
  return config;
});

// Import types from the main types file
import type { 
  StockData, 
  StockChartData, 
  TechnicalIndicators, 
  StockPrediction, 
  PortfolioHolding, 
  NewsItem 
} from '@/types/stock';

// Stock data API calls
export const stockAPI = {
  // Get real-time stock data
  getStockData: async (symbol: string, onMarketRestriction?: (details: any) => void): Promise<StockData> => {
    try {
      const cacheKey = symbol.toUpperCase();
      const cached = stockDataCache.get(cacheKey);
      const now = Date.now();
      if (cached && now - cached.timestamp < STOCK_TTL_MS) {
        return cached.data as StockData;
      }

      const response: any = await requestWithRetry(() => api.get(`/stocks/${symbol}`));
      const data = response.data as StockData;
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
      const cacheKey = `${symbol.toUpperCase()}|${period}|${interval}`;
      const cached = chartDataCache.get(cacheKey);
      const now = Date.now();
      if (cached && now - cached.timestamp < CHART_TTL_MS) {
        return cached.data as StockChartData[];
      }

      const response: any = await requestWithRetry(() => api.get(`/stocks/${symbol}/chart`, { params: { period, interval } }));
      const data = (response.data as { data: StockChartData[] }).data;
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
          volume: Math.floor(Math.random() * 10000000) + 1000000
        });
      }
      return mockData;
    }
  },

  // Get technical indicators
  getTechnicalIndicators: async (symbol: string): Promise<TechnicalIndicators> => {
    const response: any = await requestWithRetry(() => api.get(`/stocks/${symbol}/technical`));
    return response.data as TechnicalIndicators;
  },

  // Search stocks
  searchStocks: async (query: string): Promise<{ symbol: string; name: string }[]> => {
    const response: any = await requestWithRetry(() => api.get('/stocks/search-simple', { params: { q: query } }));
    return response.data as { symbol: string; name: string }[];
  },

  // Get company info
  getCompanyInfo: async (symbol: string): Promise<any> => {
    const response: any = await requestWithRetry(() => api.get(`/stocks/${symbol}/info`));
    return response.data;
  },

  // Get advanced metrics
  getAdvancedMetrics: async (symbol: string, period: string = '1y', riskFreeRate: number = 0.03): Promise<any> => {
    const response: any = await requestWithRetry(() => api.get(`/stocks/${symbol}/advanced-metrics`, { params: { period, risk_free_rate: riskFreeRate } }));
    return response.data;
  },
};

// Life Planner API calls
export const lifePlannerAPI = {
  // Get all goals
  getGoals: async (): Promise<any> => {
    const response: any = await requestWithRetry(() => api.get('/life-planner/goals'));
    return response.data;
  },

  // Create a new goal
  createGoal: async (goalData: any): Promise<any> => {
    const response: any = await requestWithRetry(() => api.post('/life-planner/goals', goalData));
    return response.data;
  },

  // Update an existing goal
  updateGoal: async (goalId: string, goalData: any): Promise<any> => {
    const response: any = await requestWithRetry(() => api.put(`/life-planner/goals/${goalId}`, goalData));
    return response.data;
  },

  // Delete a goal
  deleteGoal: async (goalId: string): Promise<any> => {
    const response: any = await requestWithRetry(() => api.delete(`/life-planner/goals/${goalId}`));
    return response.data;
  },
};

// Notes API calls
export const notesAPI = {
  // Get all notes
  getNotes: async (): Promise<any> => {
    const response: any = await requestWithRetry(() => api.get('/notes'));
    return response.data;
  },

  // Create a new note
  createNote: async (noteData: any): Promise<any> => {
    const response: any = await requestWithRetry(() => api.post('/notes', noteData));
    return response.data;
  },

  // Update an existing note
  updateNote: async (noteId: string, noteData: any): Promise<any> => {
    const response: any = await requestWithRetry(() => api.put(`/notes/${noteId}`, noteData));
    return response.data;
  },

  // Delete a note
  deleteNote: async (noteId: string): Promise<any> => {
    const response: any = await requestWithRetry(() => api.delete(`/notes/${noteId}`));
    return response.data;
  },
};

// Predictions API calls
export const predictionsAPI = {
  // Get AI predictions for a stock
  getStockPrediction: async (symbol: string): Promise<StockPrediction> => {
    // Backend exposes /predictions/{symbol}
    const response: any = await requestWithRetry(() => api.get(`/predictions/${symbol}`));
    return response.data as StockPrediction;
  },

  // Get all predictions
  getAllPredictions: async (): Promise<StockPrediction[]> => {
    const response: any = await requestWithRetry(() => api.get('/predictions'));
    return response.data as StockPrediction[];
  },

  // Get trending predictions
  getTrendingPredictions: async (): Promise<StockPrediction[]> => {
    const response: any = await requestWithRetry(() => api.get('/predictions/trending'));
    return response.data as StockPrediction[];
  },
};

// Portfolio API calls
export const portfolioAPI = {
  // Get portfolio holdings
  getPortfolio: async (): Promise<PortfolioHolding[]> => {
    const response = await api.get('/portfolio');
    return response.data as PortfolioHolding[];
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
  getStockNews: async (symbol: string): Promise<any> => {
    const response: any = await requestWithRetry(() => api.get(`/stocks/${symbol}/news`));
    return response.data;
  },

  // Get market news (using Google news scraping)
  getMarketNews: async (): Promise<NewsItem[]> => {
    const response: any = await requestWithRetry(() => api.get('/news/scrape/google'));
    return response.data as NewsItem[];
  },

  // Get trending news (using Yahoo Finance for a default stock)
  getTrendingNews: async (): Promise<NewsItem[]> => {
    const response: any = await requestWithRetry(() => api.get('/news/scrape/yahoo/AAPL'));
    return response.data as NewsItem[];
  },
};

// Subscription API calls
export const subscriptionAPI = {
  getSubscriptionInfo: async (): Promise<any> => {
    const response: any = await requestWithRetry(() => api.get('/subscription/info'));
    return response.data;
  },

  // Get available markets for current subscription
  getAvailableMarkets: async (): Promise<any> => {
    const response: any = await requestWithRetry(() => api.get('/subscription/markets'));
    return response.data;
  },

  // Validate market access
  validateMarketAccess: async (market: string): Promise<any> => {
    const response: any = await requestWithRetry(() => api.post('/subscription/validate-market', { market }));
    return response.data;
  },
};

// ML Prediction API
export const mlAPI = {
  getPrediction: async (symbol: string): Promise<{
    signal: 'Bullish' | 'Bearish';
    confidence: number;
    sentiment: 'Positive' | 'Neutral' | 'Negative';
    risk_level: 'High' | 'Medium' | 'Low';
    p_bull: number;
    volatility: { sharpe: number; max_drawdown: number };
  }> => {
    const response: any = await requestWithRetry(() => api.get(`/ml/predict/${symbol}`));
    return response.data as any;
  }
};

// Error handling utility
export const handleAPIError = (error: any): string => {
  if (error.response) {
    if (error.response.status === 403 && error.response.data?.error === 'market_restricted') {
      return `Market Access Restricted: ${error.response.data.message}`;
    }
    return error.response.data?.message || `Error ${error.response.status}: ${error.response.statusText}`;
  } else if (error.request) {
    return 'No response from server. Please check your connection.';
  } else {
    return error.message || 'An unexpected error occurred.';
  }
};

// Market restriction error handler
export const handleMarketRestrictionError = (error: any) => {
  if (error.response?.status === 403 && error.response.data?.error === 'market_restricted') {
    return {
      isMarketRestricted: true,
      error: error.response.data,
      message: error.response.data.message,
      details: error.response.data.details,
      requiredPlan: error.response.data.required_plan,
      currentPlan: error.response.data.current_plan,
      upgradeUrl: error.response.data.upgrade_url,
      market: error.response.data.market || 'Unknown',
      availableMarkets: error.response.data.available_markets || []
    };
  }
  return {
    isMarketRestricted: false,
    error: error
  };
};

// Enhanced API call with market restriction handling
export const apiCallWithMarketRestriction = async (
  apiCall: () => Promise<any>,
  onMarketRestriction: (restrictionDetails: any) => void
) => {
  try {
    return await apiCall();
  } catch (error: any) {
    const restrictionError = handleMarketRestrictionError(error);
    if (restrictionError.isMarketRestricted) {
      onMarketRestriction(restrictionError);
      throw error; // Re-throw to maintain error handling flow
    }
    throw error;
  }
};

export default api;
