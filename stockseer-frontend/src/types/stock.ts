// Stock Data Types
export interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  pe?: number;
  dividend?: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  sector?: string;
  industry?: string;
  description?: string;
  currency?: string;
}

export interface StockChartData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  sma_20: number;
  sma_50: number;
  sma_200: number;
  ema_20: number;
  ema_50: number;
  ema_200: number;
  rsi: number;
  rsi_ma: number;
  macd_line: number;
  macd_signal: number;
  macd_histogram: number;
  bb_high: number;
  bb_mid: number;
  bb_low: number;
  bb_width: number;
  bb_position: number;
  stoch_k: number;
  stoch_d: number;
  williams_r: number;
  cci: number;
  atr: number;
  obv: number;
  mfi: number;
}

export interface EnhancedTechnicalAnalysis {
  symbol: string;
  period: string;
  signal: string;
  reason: string;
  indicators: TechnicalIndicators;
}

export interface StockPrediction {
  symbol: string;
  predictedPrice: number;
  confidence: number;
  timeframe: string;
  reasoning: string;
  timestamp: string;
}

export interface PortfolioHolding {
  symbol: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  totalValue: number;
  gainLoss: number;
  gainLossPercent: number;
}

export interface PortfolioMetrics {
  totalValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  totalCost: number;
}

export interface NewsItem {
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  source: string;
  sentiment: string;
  vader_sentiment?: {
    compound: number;
    pos: number;
    neg: number;
    neu: number;
  };
  image_url?: string;
  publisher?: string;
}

export interface StockSearchResult {
  symbol: string;
  name: string;
  price?: number;
  change?: number;
  sector?: string;
  relevance?: number;
}

export interface Alert {
  id: string;
  symbol: string;
  type: 'price' | 'technical' | 'news';
  condition: string;
  value: number;
  status: 'active' | 'triggered' | 'expired';
  message: string;
  createdAt: Date;
  triggeredAt?: Date;
  expiresAt: Date;
}

export interface MonteCarloSimulation {
  initial_investment: number;
  years: number;
  num_simulations: number;
  parameters: {
    mean_return: number;
    volatility: number;
    risk_free_rate: number;
  };
  results: {
    simulation_data: number[][];
    final_values: number[];
    percentiles: {
      '5th': number;
      '25th': number;
      '50th': number;
      '75th': number;
      '95th': number;
    };
    expected_return: number;
    volatility: number;
    sharpe_ratio: number;
    avg_max_drawdown: number;
    success_rate: number;
  };
}

export interface AdvancedMetrics {
  total_return: number;
  annualized_return: number;
  volatility: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  max_drawdown: number;
  var_95: number;
  calmar_ratio: number;
  skewness: number;
  kurtosis: number;
}

export interface FinancialData {
  symbol: string;
  financials: {
    annual: Record<string, any>;
    quarterly: Record<string, any>;
  };
  earnings: {
    annual: Record<string, any>;
    quarterly: Record<string, any>;
  };
  balance_sheet: {
    annual: Record<string, any>;
    quarterly: Record<string, any>;
  };
  cashflow: {
    annual: Record<string, any>;
    quarterly: Record<string, any>;
  };
}

export interface AnalystData {
  symbol: string;
  recommendations: Record<string, any>;
  price_targets: Record<string, any>;
  earnings_dates: Record<string, any>;
}

export interface HolderData {
  symbol: string;
  institutional_holders: Record<string, any>;
  major_holders: Record<string, any>;
  insider_transactions: Record<string, any>;
  insider_transactions_summary: Record<string, any>;
}

export interface StockScreenerCriteria {
  minPrice: number;
  maxPrice: number;
  minMarketCap: number;
  maxMarketCap: number;
  minVolume: number;
  minPE: number;
  maxPE: number;
  minPB: number;
  maxPB: number;
  minROE: number;
  minROA: number;
  minDebtToEquity: number;
  maxDebtToEquity: number;
  sectors: string[];
  countries: string[];
}

export interface ScreenedStock {
  symbol: string;
  name: string;
  price: number;
  changePercent?: number;
  marketCap: number;
  pe: number;
  pb?: number;
  roe?: number;
  roa?: number;
  debtToEquity?: number;
  volume: number;
  sector?: string;
  country?: string;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface WatchlistItem {
  symbol: string;
  name: string;
  price?: number;
  change?: number;
  changePercent?: number;
  volume?: number;
  marketCap?: number;
}

export interface LifePlannerGoal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  monthly_contribution: number;
  risk_tolerance: 'Low' | 'Medium' | 'High';
  investment_strategy: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  related_stocks: string[];
}

export interface MarketSimulation {
  years: number;
  initial_value: number;
  volatility: number;
  growth_rate: number;
  data: Array<{
    date: string;
    price: number;
  }>;
}
