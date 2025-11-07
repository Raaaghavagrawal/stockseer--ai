import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, RefreshCw, Clock } from 'lucide-react';

// Stock data interface
interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  lastUpdated: string;
}

// Popular stocks to display (5 stocks like Binance)
const POPULAR_STOCKS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'
];

// Base prices for more realistic data (5 stocks only)
const BASE_PRICES: { [key: string]: number } = {
  'AAPL': 175.43,
  'MSFT': 378.91,
  'GOOGL': 142.56,
  'AMZN': 155.23,
  'TSLA': 248.87
};

// Mock data generator for demonstration with more realistic price movements
const generateMockStockData = (symbol: string): StockData => {
  const basePrice = BASE_PRICES[symbol] || 100;
  // Generate smaller, more realistic price changes (-5% to +5%)
  const changePercent = (Math.random() - 0.5) * 10;
  const change = (basePrice * changePercent) / 100;
  const newPrice = basePrice + change;
  
  return {
    symbol,
    name: getStockName(symbol),
    price: parseFloat(newPrice.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    changePercent: parseFloat(changePercent.toFixed(2)),
    volume: Math.floor(Math.random() * 50000000) + 5000000,
    marketCap: Math.floor(Math.random() * 2000000000000) + 500000000000,
    lastUpdated: new Date().toISOString()
  };
};

// Get stock name from symbol (5 stocks only)
const getStockName = (symbol: string): string => {
  const names: { [key: string]: string } = {
    'AAPL': 'Apple Inc.',
    'MSFT': 'Microsoft Corporation',
    'GOOGL': 'Alphabet Inc.',
    'AMZN': 'Amazon.com Inc.',
    'TSLA': 'Tesla Inc.'
  };
  return names[symbol] || symbol;
};

// Format currency
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Format large numbers
const formatNumber = (value: number): string => {
  if (value >= 1e12) return (value / 1e12).toFixed(1) + 'T';
  if (value >= 1e9) return (value / 1e9).toFixed(1) + 'B';
  if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M';
  if (value >= 1e3) return (value / 1e3).toFixed(1) + 'K';
  return value.toString();
};

const LiveStockTicker: React.FC = () => {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [priceChanges, setPriceChanges] = useState<{ [key: string]: 'up' | 'down' | 'neutral' }>({});

  // Fetch stock data
  const fetchStockData = async () => {
    try {
      setIsRefreshing(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate mock data for demonstration
      const stockData = POPULAR_STOCKS.map(symbol => generateMockStockData(symbol));
      
      // Track price changes for animations
      const newPriceChanges: { [key: string]: 'up' | 'down' | 'neutral' } = {};
      stockData.forEach(stock => {
        const previousStock = stocks.find(s => s.symbol === stock.symbol);
        if (previousStock) {
          if (stock.price > previousStock.price) {
            newPriceChanges[stock.symbol] = 'up';
          } else if (stock.price < previousStock.price) {
            newPriceChanges[stock.symbol] = 'down';
          } else {
            newPriceChanges[stock.symbol] = 'neutral';
          }
        } else {
          newPriceChanges[stock.symbol] = 'neutral';
        }
      });
      
      setPriceChanges(newPriceChanges);
      setStocks(stockData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching stock data:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchStockData();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStockData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchStockData();
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-300">Loading live market data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-[#0B0E11] border border-[#1E2329] rounded-lg overflow-hidden"
      >
        {/* Binance-style Header */}
        <div className="bg-[#1E2329] px-4 py-3 border-b border-[#2B3139]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-[#F0B90B] to-[#F0B90B] rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#0B0E11]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#F0B90B]">Live Market</h3>
                <p className="text-xs text-[#707A8A]">Real-time stock prices</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <motion.div 
                  className="w-2 h-2 bg-[#02C076] rounded-full"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.7, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                <span className="text-sm text-[#02C076] font-medium">Live</span>
              </div>
              
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 rounded-lg bg-[#2B3139] hover:bg-[#3A4049] transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 text-[#707A8A] ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Binance-style Stock Table */}
        <div className="bg-[#0B0E11]">
          {/* Table Header */}
          <div className="grid grid-cols-5 gap-4 px-4 py-3 text-xs font-medium text-[#707A8A] border-b border-[#2B3139]">
            <div className="text-left">Symbol</div>
            <div className="text-right">Price</div>
            <div className="text-right">24h Change</div>
            <div className="text-right">Volume</div>
            <div className="text-right">Market Cap</div>
          </div>
          
          {/* Stock Rows */}
          <div className="divide-y divide-[#2B3139]">
            {stocks.map((stock, index) => {
              const priceChange = priceChanges[stock.symbol];
              const isUp = priceChange === 'up';
              const isDown = priceChange === 'down';
              
              return (
                <motion.div
                  key={stock.symbol}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`grid grid-cols-5 gap-4 px-4 py-3 hover:bg-[#1E2329] transition-colors ${
                    isUp ? 'bg-[#0A1B0A]' : isDown ? 'bg-[#1B0A0A]' : ''
                  }`}
                >
                  {/* Symbol */}
                  <div className="flex items-center">
                    <div>
                      <div className="font-semibold text-[#F0B90B] text-sm">{stock.symbol}</div>
                      <div className="text-xs text-[#707A8A] truncate">{stock.name}</div>
                    </div>
                  </div>
                  
                  {/* Price */}
                  <div className="text-right">
                    <motion.div 
                      key={`${stock.symbol}-price-${stock.price}`}
                      initial={{ scale: 1 }}
                      animate={{ 
                        scale: isUp ? [1, 1.05, 1] : isDown ? [1, 0.95, 1] : 1 
                      }}
                      transition={{ duration: 0.3 }}
                      className="font-semibold text-[#F0B90B] text-sm"
                    >
                      {formatCurrency(stock.price)}
                    </motion.div>
                  </div>
                  
                  {/* 24h Change */}
                  <div className="text-right">
                    <motion.div 
                      key={`${stock.symbol}-change-${stock.change}`}
                      initial={{ opacity: 1 }}
                      animate={{ opacity: [1, 0.7, 1] }}
                      transition={{ duration: 0.5 }}
                      className={`flex items-center justify-end text-sm ${
                        stock.change >= 0 ? 'text-[#02C076]' : 'text-[#F84960]'
                      }`}
                    >
                      {stock.change >= 0 ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      <span>
                        {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                      </span>
                    </motion.div>
                  </div>
                  
                  {/* Volume */}
                  <div className="text-right text-sm text-[#F0B90B]">
                    {formatNumber(stock.volume)}
                  </div>
                  
                  {/* Market Cap */}
                  <div className="text-right text-sm text-[#F0B90B]">
                    {formatNumber(stock.marketCap)}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Binance-style Footer */}
        <div className="bg-[#1E2329] px-4 py-2 border-t border-[#2B3139]">
          <div className="flex items-center justify-between text-xs text-[#707A8A]">
            <span>Data updates every 30 seconds</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-[#02C076] rounded-full animate-pulse"></div>
              <span>Market Live</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LiveStockTicker;
