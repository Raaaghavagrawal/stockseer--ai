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
  twelveDataApiKey: import.meta.env.VITE_TWELVE_DATA_API_KEY || 'demo',
  alphaVantageApiKey: import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || 'demo',
  metalsApiKey: import.meta.env.VITE_METALS_API_KEY || 'demo'
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

// Fetch all market data
export const fetchAllMarketData = async (): Promise<PriceData[]> => {
  const results: PriceData[] = [];
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  
  // 1. Fetch metals data from our backend scraper
  try {
    console.log('Fetching metals data for GoldCryptoPage from backend');
    const metalsResponse = await fetch(`${baseUrl}/api/metals?currency=USD`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000)
    });
    
    if (metalsResponse.ok) {
      const data = await metalsResponse.json();
      if (data.rates) {
        data.rates.forEach((rate: any) => {
          const config = ASSET_CONFIG.metals[rate.symbol as keyof typeof ASSET_CONFIG.metals] || 
            Object.values(ASSET_CONFIG.metals).find(m => m.metalsSymbol === rate.symbol);
            
          results.push({
            symbol: config ? config.symbol : rate.symbol,
            name: rate.name,
            price: rate.price,
            change24h: rate.change24h,
            changePercent24h: rate.changePercent24h,
            volume24h: 0,
            icon: config ? config.icon : '💎',
            color: config ? config.color : '#B87333',
            lastUpdated: rate.lastUpdated
          });
        });
      }
    }
  } catch (error) {
    console.error('Error fetching metals data for GoldCryptoPage:', error);
  }
  
  // 2. Fetch crypto data from CoinGecko
  try {
    console.log('Fetching crypto data for GoldCryptoPage from CoinGecko');
    const cryptoResponse = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=15&page=1&sparkline=false&price_change_percentage=24h',
      {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000)
      }
    );
    
    if (cryptoResponse.ok) {
      const cryptoData = await cryptoResponse.json();
      cryptoData.forEach((coin: any) => {
        const symbolUpper = coin.symbol.toUpperCase();
        // Skip stablecoins to prioritize interesting assets if we want, or just include them
        const config = ASSET_CONFIG.crypto[symbolUpper as keyof typeof ASSET_CONFIG.crypto];
        
        let changePercent = coin.price_change_percentage_24h || 0;
        let changeVal = (coin.current_price * changePercent) / 100;
        
        results.push({
          symbol: symbolUpper,
          name: coin.name,
          price: coin.current_price,
          change24h: changeVal,
          changePercent24h: changePercent,
          volume24h: coin.total_volume,
          marketCap: coin.market_cap,
          icon: config ? config.icon : '🪙',
          color: config ? config.color : '#999999',
          lastUpdated: new Date().toISOString()
        });
      });
    }
  } catch (error) {
    console.error('Error fetching crypto data for GoldCryptoPage:', error);
  }
  
  return results;
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
