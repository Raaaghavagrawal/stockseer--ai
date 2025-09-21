// Market Data API Service
// Integrates with Twelve Data API and Alpha Vantage API for real-time market data

export interface PriceData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap?: number;
  icon: string;
  color: string;
  lastUpdated: string;
}

export interface ApiConfig {
  twelveDataApiKey: string;
  alphaVantageApiKey: string;
  metalsApiKey: string;
}

// Default API keys (in production, these should be environment variables)
const API_CONFIG: ApiConfig = {
  twelveDataApiKey: process.env.REACT_APP_TWELVE_DATA_API_KEY || 'demo',
  alphaVantageApiKey: process.env.REACT_APP_ALPHA_VANTAGE_API_KEY || 'demo',
  metalsApiKey: process.env.REACT_APP_METALS_API_KEY || 'demo'
};

// Asset configuration
const ASSET_CONFIG = {
  // Precious Metals (using Metals API and Alpha Vantage)
  metals: {
    GOLD: { symbol: 'GOLD', name: 'Gold', icon: '🥇', color: '#FFD700', metalsSymbol: 'XAU', avSymbol: 'XAUUSD' },
    SILVER: { symbol: 'SILVER', name: 'Silver', icon: '🥈', color: '#C0C0C0', metalsSymbol: 'XAG', avSymbol: 'XAGUSD' },
    PLATINUM: { symbol: 'PLATINUM', name: 'Platinum', icon: '🥉', color: '#E5E4E2', metalsSymbol: 'XPT', avSymbol: 'XPTUSD' },
    PALLADIUM: { symbol: 'PALLADIUM', name: 'Palladium', icon: '💎', color: '#B87333', metalsSymbol: 'XPD', avSymbol: 'XPDUSD' },
    RHODIUM: { symbol: 'RHODIUM', name: 'Rhodium', icon: '💠', color: '#C7C7C7', metalsSymbol: 'RH', avSymbol: 'RHUSD' },
    IRIDIUM: { symbol: 'IRIDIUM', name: 'Iridium', icon: '⚡', color: '#3D3D3D', metalsSymbol: 'IR', avSymbol: 'IRUSD' },
    RUTHENIUM: { symbol: 'RUTHENIUM', name: 'Ruthenium', icon: '🔸', color: '#1C1C1C', metalsSymbol: 'RU', avSymbol: 'RUUSD' },
    OSMIUM: { symbol: 'OSMIUM', name: 'Osmium', icon: '🔹', color: '#2C2C2C', metalsSymbol: 'OS', avSymbol: 'OSUSD' }
  },
  // Cryptocurrencies (using Twelve Data)
  crypto: {
    BTC: { symbol: 'BTC', name: 'Bitcoin', icon: '₿', color: '#F7931A', tdSymbol: 'BTC/USD' },
    ETH: { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ', color: '#627EEA', tdSymbol: 'ETH/USD' },
    ADA: { symbol: 'ADA', name: 'Cardano', icon: '₳', color: '#0033AD', tdSymbol: 'ADA/USD' },
    SOL: { symbol: 'SOL', name: 'Solana', icon: '◎', color: '#9945FF', tdSymbol: 'SOL/USD' },
    BNB: { symbol: 'BNB', name: 'Binance Coin', icon: '🟡', color: '#F3BA2F', tdSymbol: 'BNB/USD' },
    XRP: { symbol: 'XRP', name: 'Ripple', icon: '💧', color: '#23292F', tdSymbol: 'XRP/USD' },
    DOGE: { symbol: 'DOGE', name: 'Dogecoin', icon: '🐕', color: '#C2A633', tdSymbol: 'DOGE/USD' },
    MATIC: { symbol: 'MATIC', name: 'Polygon', icon: '🔷', color: '#8247E5', tdSymbol: 'MATIC/USD' },
    AVAX: { symbol: 'AVAX', name: 'Avalanche', icon: '🔺', color: '#E84142', tdSymbol: 'AVAX/USD' },
    DOT: { symbol: 'DOT', name: 'Polkadot', icon: '⚫', color: '#E6007A', tdSymbol: 'DOT/USD' },
    LINK: { symbol: 'LINK', name: 'Chainlink', icon: '🔗', color: '#2A5ADA', tdSymbol: 'LINK/USD' },
    UNI: { symbol: 'UNI', name: 'Uniswap', icon: '🦄', color: '#FF007A', tdSymbol: 'UNI/USD' },
    ATOM: { symbol: 'ATOM', name: 'Cosmos', icon: '⚛️', color: '#2E3148', tdSymbol: 'ATOM/USD' },
    NEAR: { symbol: 'NEAR', name: 'NEAR Protocol', icon: '🌐', color: '#000000', tdSymbol: 'NEAR/USD' },
    FTM: { symbol: 'FTM', name: 'Fantom', icon: '👻', color: '#1969FF', tdSymbol: 'FTM/USD' },
    ALGO: { symbol: 'ALGO', name: 'Algorand', icon: '🔺', color: '#000000', tdSymbol: 'ALGO/USD' }
  }
};

// Metals API functions (for better precious metals data)
export const fetchMetalPriceFromMetalsAPI = async (symbol: string): Promise<PriceData | null> => {
  try {
    const metalConfig = ASSET_CONFIG.metals[symbol as keyof typeof ASSET_CONFIG.metals];
    if (!metalConfig) return null;

    const response = await fetch(
      `https://metals-api.com/api/latest?access_key=${API_CONFIG.metalsApiKey}&base=USD&symbols=${metalConfig.metalsSymbol}`
    );
    
    const data = await response.json();
    
    if (data.error) {
      console.error(`Metals API Error for ${symbol}:`, data.error);
      return null;
    }

    const rate = data.rates[metalConfig.metalsSymbol];
    if (!rate) return null;

    // Metals API returns rates as 1 USD = X metal units, so we need to invert
    const price = 1 / rate;
    
    // For change calculation, we'll fetch historical data
    const historicalResponse = await fetch(
      `https://metals-api.com/api/${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]}?access_key=${API_CONFIG.metalsApiKey}&base=USD&symbols=${metalConfig.metalsSymbol}`
    );
    
    let change24h = 0;
    let changePercent24h = 0;
    
    if (historicalResponse.ok) {
      const historicalData = await historicalResponse.json();
      if (!historicalData.error && historicalData.rates[metalConfig.metalsSymbol]) {
        const historicalRate = historicalData.rates[metalConfig.metalsSymbol];
        const historicalPrice = 1 / historicalRate;
        change24h = price - historicalPrice;
        changePercent24h = (change24h / historicalPrice) * 100;
      }
    }

    return {
      symbol: metalConfig.symbol,
      name: metalConfig.name,
      price,
      change24h,
      changePercent24h,
      volume24h: 0, // Metals API doesn't provide volume
      icon: metalConfig.icon,
      color: metalConfig.color,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error fetching ${symbol} price from Metals API:`, error);
    return null;
  }
};

// Alpha Vantage API functions (fallback)
export const fetchMetalPrice = async (symbol: string): Promise<PriceData | null> => {
  try {
    const metalConfig = ASSET_CONFIG.metals[symbol as keyof typeof ASSET_CONFIG.metals];
    if (!metalConfig) return null;

    const response = await fetch(
      `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${metalConfig.avSymbol}&to_currency=USD&apikey=${API_CONFIG.alphaVantageApiKey}`
    );
    
    const data = await response.json();
    
    if (data['Error Message']) {
      console.error(`Alpha Vantage Error for ${symbol}:`, data['Error Message']);
      return null;
    }

    const exchangeRate = data['Realtime Currency Exchange Rate'];
    if (!exchangeRate) return null;

    const price = parseFloat(exchangeRate['5. Exchange Rate']);
    const change24h = parseFloat(exchangeRate['9. Change']) || 0;
    const changePercent24h = parseFloat(exchangeRate['10. Change Percent']) || 0;

    return {
      symbol: metalConfig.symbol,
      name: metalConfig.name,
      price,
      change24h,
      changePercent24h: changePercent24h * 100, // Convert to percentage
      volume24h: 0, // Alpha Vantage doesn't provide volume for metals
      icon: metalConfig.icon,
      color: metalConfig.color,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error fetching ${symbol} price:`, error);
    return null;
  }
};

// Twelve Data API functions
export const fetchCryptoPrice = async (symbol: string): Promise<PriceData | null> => {
  try {
    const cryptoConfig = ASSET_CONFIG.crypto[symbol as keyof typeof ASSET_CONFIG.crypto];
    if (!cryptoConfig) return null;

    const response = await fetch(
      `https://api.twelvedata.com/price?symbol=${cryptoConfig.tdSymbol}&apikey=${API_CONFIG.twelveDataApiKey}`
    );
    
    const data = await response.json();
    
    if (data.status === 'error') {
      console.error(`Twelve Data Error for ${symbol}:`, data.message);
      return null;
    }

    const price = parseFloat(data.price);
    if (isNaN(price)) return null;

    // For crypto, we'll also fetch quote data for change information
    const quoteResponse = await fetch(
      `https://api.twelvedata.com/quote?symbol=${cryptoConfig.tdSymbol}&apikey=${API_CONFIG.twelveDataApiKey}`
    );
    
    const quoteData = await quoteResponse.json();
    
    let change24h = 0;
    let changePercent24h = 0;
    let volume24h = 0;
    let marketCap = 0;

    if (quoteData.status !== 'error') {
      change24h = parseFloat(quoteData.change) || 0;
      changePercent24h = parseFloat(quoteData.percent_change) || 0;
      volume24h = parseFloat(quoteData.volume) || 0;
      marketCap = parseFloat(quoteData.market_cap) || 0;
    }

    return {
      symbol: cryptoConfig.symbol,
      name: cryptoConfig.name,
      price,
      change24h,
      changePercent24h,
      volume24h,
      marketCap: marketCap > 0 ? marketCap : undefined,
      icon: cryptoConfig.icon,
      color: cryptoConfig.color,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error fetching ${symbol} price:`, error);
    return null;
  }
};

// Fetch all market data with priority: Metals API > Alpha Vantage > Twelve Data
export const fetchAllMarketData = async (): Promise<PriceData[]> => {
  const results: PriceData[] = [];
  
  // Fetch metals data (try Metals API first, then Alpha Vantage)
  const metalPromises = Object.keys(ASSET_CONFIG.metals).map(async (symbol) => {
    // Try Metals API first
    let result = await fetchMetalPriceFromMetalsAPI(symbol);
    
    // If Metals API fails, try Alpha Vantage
    if (!result) {
      result = await fetchMetalPrice(symbol);
    }
    
    return result;
  });
  
  // Fetch crypto data
  const cryptoPromises = Object.keys(ASSET_CONFIG.crypto).map(symbol => 
    fetchCryptoPrice(symbol)
  );
  
  try {
    const [metalResults, cryptoResults] = await Promise.all([
      Promise.all(metalPromises),
      Promise.all(cryptoPromises)
    ]);
    
    // Filter out null results and add to results array
    metalResults.forEach(result => {
      if (result) results.push(result);
    });
    
    cryptoResults.forEach(result => {
      if (result) results.push(result);
    });
    
    return results;
  } catch (error) {
    console.error('Error fetching market data:', error);
    return [];
  }
};

// Fallback mock data for when APIs fail
export const getMockData = (): PriceData[] => [
  // Precious Metals
  {
    symbol: 'GOLD',
    name: 'Gold',
    price: 2347.85,
    change24h: 12.45,
    changePercent24h: 0.53,
    volume24h: 1250000000,
    icon: '🥇',
    color: '#FFD700',
    lastUpdated: new Date().toISOString()
  },
  {
    symbol: 'SILVER',
    name: 'Silver',
    price: 28.45,
    change24h: -0.15,
    changePercent24h: -0.52,
    volume24h: 450000000,
    icon: '🥈',
    color: '#C0C0C0',
    lastUpdated: new Date().toISOString()
  },
  {
    symbol: 'PLATINUM',
    name: 'Platinum',
    price: 1024.30,
    change24h: 8.75,
    changePercent24h: 0.86,
    volume24h: 320000000,
    icon: '🥉',
    color: '#E5E4E2',
    lastUpdated: new Date().toISOString()
  },
  {
    symbol: 'PALLADIUM',
    name: 'Palladium',
    price: 2847.50,
    change24h: -45.20,
    changePercent24h: -1.56,
    volume24h: 180000000,
    icon: '💎',
    color: '#B87333',
    lastUpdated: new Date().toISOString()
  },
  {
    symbol: 'RHODIUM',
    name: 'Rhodium',
    price: 14500.00,
    change24h: 250.00,
    changePercent24h: 1.75,
    volume24h: 45000000,
    icon: '💠',
    color: '#C7C7C7',
    lastUpdated: new Date().toISOString()
  },
  // Top Cryptocurrencies
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 75234.50,
    change24h: 2847.20,
    changePercent24h: 3.94,
    volume24h: 28500000000,
    marketCap: 1480000000000,
    icon: '₿',
    color: '#F7931A',
    lastUpdated: new Date().toISOString()
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    price: 3847.25,
    change24h: 89.75,
    changePercent24h: 2.39,
    volume24h: 12500000000,
    marketCap: 463000000000,
    icon: 'Ξ',
    color: '#627EEA',
    lastUpdated: new Date().toISOString()
  },
  {
    symbol: 'BNB',
    name: 'Binance Coin',
    price: 624.50,
    change24h: 18.75,
    changePercent24h: 3.10,
    volume24h: 2100000000,
    marketCap: 95000000000,
    icon: '🟡',
    color: '#F3BA2F',
    lastUpdated: new Date().toISOString()
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    price: 187.45,
    change24h: 8.92,
    changePercent24h: 4.99,
    volume24h: 2100000000,
    marketCap: 85000000000,
    icon: '◎',
    color: '#9945FF',
    lastUpdated: new Date().toISOString()
  },
  {
    symbol: 'XRP',
    name: 'Ripple',
    price: 0.6234,
    change24h: 0.0123,
    changePercent24h: 2.01,
    volume24h: 1800000000,
    marketCap: 35000000000,
    icon: '💧',
    color: '#23292F',
    lastUpdated: new Date().toISOString()
  },
  {
    symbol: 'ADA',
    name: 'Cardano',
    price: 0.4856,
    change24h: 0.0123,
    changePercent24h: 2.60,
    volume24h: 450000000,
    marketCap: 17200000000,
    icon: '₳',
    color: '#0033AD',
    lastUpdated: new Date().toISOString()
  },
  {
    symbol: 'AVAX',
    name: 'Avalanche',
    price: 42.15,
    change24h: 1.85,
    changePercent24h: 4.59,
    volume24h: 650000000,
    marketCap: 16000000000,
    icon: '🔺',
    color: '#E84142',
    lastUpdated: new Date().toISOString()
  },
  {
    symbol: 'DOT',
    name: 'Polkadot',
    price: 7.85,
    change24h: 0.25,
    changePercent24h: 3.29,
    volume24h: 320000000,
    marketCap: 11000000000,
    icon: '⚫',
    color: '#E6007A',
    lastUpdated: new Date().toISOString()
  },
  {
    symbol: 'LINK',
    name: 'Chainlink',
    price: 18.45,
    change24h: 0.75,
    changePercent24h: 4.24,
    volume24h: 480000000,
    marketCap: 10800000000,
    icon: '🔗',
    color: '#2A5ADA',
    lastUpdated: new Date().toISOString()
  },
  {
    symbol: 'MATIC',
    name: 'Polygon',
    price: 0.95,
    change24h: 0.03,
    changePercent24h: 3.26,
    volume24h: 280000000,
    marketCap: 9000000000,
    icon: '🔷',
    color: '#8247E5',
    lastUpdated: new Date().toISOString()
  }
];

// Utility function to format prices
export const formatPrice = (price: number, symbol: string): string => {
  const decimals = symbol === 'GOLD' || symbol === 'SILVER' || symbol === 'PLATINUM' || symbol === 'PALLADIUM' || 
                   symbol === 'RHODIUM' || symbol === 'IRIDIUM' || symbol === 'RUTHENIUM' || symbol === 'OSMIUM' ? 2 :
                   symbol === 'ADA' || symbol === 'XRP' ? 4 : 2;
  
  return price.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

// Utility function to format market cap
export const formatMarketCap = (marketCap: number): string => {
  if (marketCap >= 1e12) {
    return `$${(marketCap / 1e12).toFixed(1)}T`;
  } else if (marketCap >= 1e9) {
    return `$${(marketCap / 1e9).toFixed(1)}B`;
  } else if (marketCap >= 1e6) {
    return `$${(marketCap / 1e6).toFixed(1)}M`;
  } else {
    return `$${marketCap.toLocaleString()}`;
  }
};
