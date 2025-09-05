import axios from 'axios';

// Configure axios with base URL and default headers
const api = axios.create({
  baseURL: 'http://localhost:8000', // Direct connection to Python backend
  timeout: 30000, // Increased timeout to 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
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
  getStockData: async (symbol: string): Promise<StockData> => {
    try {
      const response = await api.get(`/stocks/${symbol}`);
      return response.data as StockData;
    } catch (error) {
      console.error('API Error in getStockData:', error);
      // Return mock data for testing if API fails
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
        timestamp: new Date().toISOString()
      } as StockData;
    }
  },

  // Get historical chart data
  getStockChartData: async (symbol: string, period: string = '3mo', interval: string = '1d'): Promise<StockChartData[]> => {
    try {
      const response = await api.get(`/stocks/${symbol}/chart`, {
        params: { period, interval }
      });
      return (response.data as any).data as StockChartData[]; // Backend returns {data: [...]}
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
    const response = await api.get(`/stocks/${symbol}/technical`);
    return response.data as TechnicalIndicators;
  },

  // Search stocks
  searchStocks: async (query: string): Promise<{ symbol: string; name: string }[]> => {
    const response = await api.get('/stocks/search-simple', {
      params: { q: query }
    });
    return response.data as { symbol: string; name: string }[];
  },

  // Get company info
  getCompanyInfo: async (symbol: string): Promise<any> => {
    const response = await api.get(`/stocks/${symbol}/info`);
    return response.data;
  },

  // Get advanced metrics
  getAdvancedMetrics: async (symbol: string, period: string = '1y', riskFreeRate: number = 0.03): Promise<any> => {
    const response = await api.get(`/stocks/${symbol}/advanced-metrics`, {
      params: { period, risk_free_rate: riskFreeRate }
    });
    return response.data;
  },
};

// Life Planner API calls
export const lifePlannerAPI = {
  // Get all goals
  getGoals: async (): Promise<any> => {
    const response = await api.get('/life-planner/goals');
    return response.data;
  },

  // Create a new goal
  createGoal: async (goalData: any): Promise<any> => {
    const response = await api.post('/life-planner/goals', goalData);
    return response.data;
  },

  // Update an existing goal
  updateGoal: async (goalId: string, goalData: any): Promise<any> => {
    const response = await api.put(`/life-planner/goals/${goalId}`, goalData);
    return response.data;
  },

  // Delete a goal
  deleteGoal: async (goalId: string): Promise<any> => {
    const response = await api.delete(`/life-planner/goals/${goalId}`);
    return response.data;
  },
};

// Notes API calls
export const notesAPI = {
  // Get all notes
  getNotes: async (): Promise<any> => {
    const response = await api.get('/notes');
    return response.data;
  },

  // Create a new note
  createNote: async (noteData: any): Promise<any> => {
    const response = await api.post('/notes', noteData);
    return response.data;
  },

  // Update an existing note
  updateNote: async (noteId: string, noteData: any): Promise<any> => {
    const response = await api.put(`/notes/${noteId}`, noteData);
    return response.data;
  },

  // Delete a note
  deleteNote: async (noteId: string): Promise<any> => {
    const response = await api.delete(`/notes/${noteId}`);
    return response.data;
  },
};

// Predictions API calls
export const predictionsAPI = {
  // Get AI predictions for a stock
  getStockPrediction: async (symbol: string): Promise<StockPrediction> => {
    const response = await api.get(`/predictions/${symbol}`);
    return response.data as StockPrediction;
  },

  // Get all predictions
  getAllPredictions: async (): Promise<StockPrediction[]> => {
    const response = await api.get('/predictions');
    return response.data as StockPrediction[];
  },

  // Get trending predictions
  getTrendingPredictions: async (): Promise<StockPrediction[]> => {
    const response = await api.get('/predictions/trending');
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
    const response = await api.get(`/stocks/${symbol}/news`);
    return response.data;
  },

  // Get market news (using Google news scraping)
  getMarketNews: async (): Promise<NewsItem[]> => {
    const response = await api.get('/news/scrape/google');
    return response.data as NewsItem[];
  },

  // Get trending news (using Yahoo Finance for a default stock)
  getTrendingNews: async (): Promise<NewsItem[]> => {
    const response = await api.get('/news/scrape/yahoo/AAPL');
    return response.data as NewsItem[];
  },
};

// Error handling utility
export const handleAPIError = (error: any): string => {
  if (error.response) {
    // Server responded with error status
    return error.response.data?.message || `Error ${error.response.status}: ${error.response.statusText}`;
  } else if (error.request) {
    // Request made but no response
    return 'No response from server. Please check your connection.';
  } else {
    // Something else happened
    return error.message || 'An unexpected error occurred.';
  }
};

export default api;
