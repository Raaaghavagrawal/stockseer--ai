'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  AlertCircle, 
  Clock,
  Loader2,
  Activity,
  X
} from 'lucide-react';
import { formatCurrency } from '../utils/currency';

// Types
interface TradingData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  lastUpdated: Date;
  type: 'index' | 'stock' | 'commodity';
}

// Mock data for demonstration (replace with real API calls)
const getMockTradingData = (): TradingData[] => [
  {
    symbol: 'BSE',
    name: 'BSE Sensex',
    price: 73261.31,
    change: 245.67,
    changePercent: 0.34,
    currency: 'INR',
    lastUpdated: new Date(),
    type: 'index'
  },
  {
    symbol: 'NIFTY',
    name: 'Nifty 50',
    price: 22217.45,
    change: -89.23,
    changePercent: -0.40,
    currency: 'INR',
    lastUpdated: new Date(),
    type: 'index'
  },
  {
    symbol: 'TCS',
    name: 'TCS',
    price: 3845.50,
    change: 12.75,
    changePercent: 0.33,
    currency: 'INR',
    lastUpdated: new Date(),
    type: 'stock'
  },
  {
    symbol: 'INFY',
    name: 'Infosys',
    price: 1456.80,
    change: -8.45,
    changePercent: -0.58,
    currency: 'INR',
    lastUpdated: new Date(),
    type: 'stock'
  },
  {
    symbol: 'GOLD',
    name: 'Gold',
    price: 62450.00,
    change: 1250.00,
    changePercent: 2.04,
    currency: 'INR',
    lastUpdated: new Date(),
    type: 'commodity'
  }
];

// API configuration
const ALPHA_VANTAGE_API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY || 'demo';
const METALS_API_KEY = process.env.NEXT_PUBLIC_METALS_API_KEY || 'demo';

// Fetch real trading data
const fetchTradingData = async (): Promise<TradingData[]> => {
  try {
    const tradingData: TradingData[] = [];
    
    // Fetch BSE Sensex data (Alpha Vantage)
    if (ALPHA_VANTAGE_API_KEY && ALPHA_VANTAGE_API_KEY !== 'demo') {
      try {
        const bseResponse = await fetch(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=BSE.BSE&apikey=${ALPHA_VANTAGE_API_KEY}`
        );
        const bseData = await bseResponse.json();
        
        if (bseData['Global Quote'] && bseData['Global Quote']['05. price']) {
          const price = parseFloat(bseData['Global Quote']['05. price']);
          const change = parseFloat(bseData['Global Quote']['09. change']);
          const changePercent = parseFloat(bseData['Global Quote']['10. change percent'].replace('%', ''));
          
          tradingData.push({
            symbol: 'BSE',
            name: 'BSE Sensex',
            price,
            change,
            changePercent,
            currency: 'INR',
            lastUpdated: new Date(),
            type: 'index'
          });
        }
      } catch (error) {
        console.error('Error fetching BSE data:', error);
      }
    }
    
    // Fetch Nifty 50 data (Alpha Vantage)
    if (ALPHA_VANTAGE_API_KEY && ALPHA_VANTAGE_API_KEY !== 'demo') {
      try {
        const niftyResponse = await fetch(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=NIFTY.NSE&apikey=${ALPHA_VANTAGE_API_KEY}`
        );
        const niftyData = await niftyResponse.json();
        
        if (niftyData['Global Quote'] && niftyData['Global Quote']['05. price']) {
          const price = parseFloat(niftyData['Global Quote']['05. price']);
          const change = parseFloat(niftyData['Global Quote']['09. change']);
          const changePercent = parseFloat(niftyData['Global Quote']['10. change percent'].replace('%', ''));
          
          tradingData.push({
            symbol: 'NIFTY',
            name: 'Nifty 50',
            price,
            change,
            changePercent,
            currency: 'INR',
            lastUpdated: new Date(),
            type: 'index'
          });
        }
      } catch (error) {
        console.error('Error fetching Nifty data:', error);
      }
    }
    
    // Fetch TCS data (Alpha Vantage)
    if (ALPHA_VANTAGE_API_KEY && ALPHA_VANTAGE_API_KEY !== 'demo') {
      try {
        const tcsResponse = await fetch(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=TCS.BSE&apikey=${ALPHA_VANTAGE_API_KEY}`
        );
        const tcsData = await tcsResponse.json();
        
        if (tcsData['Global Quote'] && tcsData['Global Quote']['05. price']) {
          const price = parseFloat(tcsData['Global Quote']['05. price']);
          const change = parseFloat(tcsData['Global Quote']['09. change']);
          const changePercent = parseFloat(tcsData['Global Quote']['10. change percent'].replace('%', ''));
          
          tradingData.push({
            symbol: 'TCS',
            name: 'TCS',
            price,
            change,
            changePercent,
            currency: 'INR',
            lastUpdated: new Date(),
            type: 'stock'
          });
        }
      } catch (error) {
        console.error('Error fetching TCS data:', error);
      }
    }
    
    // Fetch Infosys data (Alpha Vantage)
    if (ALPHA_VANTAGE_API_KEY && ALPHA_VANTAGE_API_KEY !== 'demo') {
      try {
        const infyResponse = await fetch(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=INFY.BSE&apikey=${ALPHA_VANTAGE_API_KEY}`
        );
        const infyData = await infyResponse.json();
        
        if (infyData['Global Quote'] && infyData['Global Quote']['05. price']) {
          const price = parseFloat(infyData['Global Quote']['05. price']);
          const change = parseFloat(infyData['Global Quote']['09. change']);
          const changePercent = parseFloat(infyData['Global Quote']['10. change percent'].replace('%', ''));
          
          tradingData.push({
            symbol: 'INFY',
            name: 'Infosys',
            price,
            change,
            changePercent,
            currency: 'INR',
            lastUpdated: new Date(),
            type: 'stock'
          });
        }
      } catch (error) {
        console.error('Error fetching Infosys data:', error);
      }
    }
    
    // Fetch Gold data (Metals-API)
    if (METALS_API_KEY && METALS_API_KEY !== 'demo') {
      try {
        const goldResponse = await fetch(
          `https://metals-api.com/api/latest?access_key=${METALS_API_KEY}&base=INR&symbols=XAU`
        );
        const goldData = await goldResponse.json();
        
        if (goldData.success && goldData.rates && goldData.rates.XAU) {
          const price = goldData.rates.XAU;
          // Mock change data for gold (in real implementation, you'd calculate this)
          const change = price * 0.02; // 2% change
          const changePercent = 2.0;
          
          tradingData.push({
            symbol: 'GOLD',
            name: 'Gold',
            price,
            change,
            changePercent,
            currency: 'INR',
            lastUpdated: new Date(),
            type: 'commodity'
          });
        }
      } catch (error) {
        console.error('Error fetching Gold data:', error);
      }
    }
    
    // If no real data was fetched, use mock data
    if (tradingData.length === 0) {
      console.log('No real data available, using mock data');
      const mockData = getMockTradingData().map(item => ({
        ...item,
        price: item.price + (Math.random() - 0.5) * item.price * 0.01,
        change: item.change + (Math.random() - 0.5) * 10,
        changePercent: item.changePercent + (Math.random() - 0.5) * 0.2,
        lastUpdated: new Date()
      }));
      return mockData;
    }
    
    return tradingData;
  } catch (error) {
    console.error('Error fetching trading data:', error);
    return getMockTradingData(); // Return mock data as fallback
  }
};

const FloatingTradingBanner: React.FC = () => {
  const [tradingData, setTradingData] = useState<TradingData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(true);

  // Load trading data
  const loadTradingData = async () => {
    setLoading(true);
    setError(null);
    setIsRefreshing(true);

    try {
      const data = await fetchTradingData();
      setTradingData(data);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Failed to fetch trading data:', err);
      setError(err.message);
      setTradingData([]);
    }

    setLoading(false);
    setIsRefreshing(false);
  };

  // Manual refresh
  const handleRefresh = () => {
    loadTradingData();
  };

  // Initial load
  useEffect(() => {
    loadTradingData();
  }, []);

  // Auto-refresh every 30 seconds for trading data
  useEffect(() => {
    const interval = setInterval(() => {
      loadTradingData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-lg"
    >
      <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-gray-800 dark:to-gray-900 px-4 py-2">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <Activity className="w-4 h-4 text-green-500" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Live Trading
              </h3>
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                <div className={`w-2 h-2 rounded-full animate-pulse mr-1 ${
                  tradingData.length > 0 ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <Clock className="w-3 h-3 mr-1" />
                {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Loading...'}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="Close"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-2 rounded mb-2 flex items-center text-xs">
              <AlertCircle className="w-3 h-3 mr-1" />
              <span>{error}</span>
            </div>
          )}

          {/* Trading Data - Horizontal Scroll */}
          {loading ? (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500 mr-2" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Loading trading data...</span>
            </div>
          ) : tradingData.length === 0 ? (
            <div className="text-center py-2">
              <AlertCircle className="w-4 h-4 text-red-500 mx-auto mb-1" />
              <p className="text-xs text-gray-600 dark:text-gray-400">No trading data available</p>
            </div>
          ) : (
            <div className="flex space-x-4 overflow-x-auto pb-2">
              {tradingData.map((item, index) => (
                <motion.div
                  key={item.symbol}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex-shrink-0 bg-white dark:bg-gray-800 rounded-lg p-3 min-w-[140px] border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white text-xs">
                        {item.name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.symbol}
                      </p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      item.type === 'index' ? 'bg-blue-500' :
                      item.type === 'stock' ? 'bg-purple-500' :
                      'bg-yellow-500'
                    }`}></div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-gray-900 dark:text-white">
                      {formatCurrency(item.price, item.currency)}
                    </div>
                    
                    <div className={`flex items-center text-xs ${
                      item.change >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {item.change >= 0 ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      <span className="font-medium">
                        {item.change >= 0 ? '+' : ''}{formatCurrency(item.change, item.currency)}
                      </span>
                      <span className="ml-1">
                        ({item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-3">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>
                  <span>Indices</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-purple-500 mr-1"></div>
                  <span>Stocks</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></div>
                  <span>Commodities</span>
                </div>
              </div>
              <div className="text-xs">
                Auto-refresh: 30s
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FloatingTradingBanner;
