'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Pause, Play } from 'lucide-react';

// Types
export interface StockTickerData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency?: string;
  volume?: number;
  marketCap?: number;
}

interface AdvancedStockTickerProps {
  stocks: StockTickerData[];
  speed?: number; // pixels per second
  direction?: 'left' | 'right';
  pauseOnHover?: boolean;
  showControls?: boolean;
  height?: 'sm' | 'md' | 'lg';
  className?: string;
  onStockClick?: (stock: StockTickerData) => void;
}

// Default stock data for demonstration
const defaultStocks: StockTickerData[] = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 175.43,
    change: 2.34,
    changePercent: 1.35,
    currency: 'USD',
    volume: 45678900,
    marketCap: 2800000000000
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    price: 142.56,
    change: -1.23,
    changePercent: -0.86,
    currency: 'USD',
    volume: 23456700,
    marketCap: 1800000000000
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    price: 378.85,
    change: 5.67,
    changePercent: 1.52,
    currency: 'USD',
    volume: 34567800,
    marketCap: 2800000000000
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    price: 248.42,
    change: -3.21,
    changePercent: -1.28,
    currency: 'USD',
    volume: 56789000,
    marketCap: 790000000000
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    price: 155.23,
    change: 1.89,
    changePercent: 1.23,
    currency: 'USD',
    volume: 45678900,
    marketCap: 1600000000000
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    price: 875.28,
    change: 12.45,
    changePercent: 1.44,
    currency: 'USD',
    volume: 67890100,
    marketCap: 2200000000000
  },
  {
    symbol: 'META',
    name: 'Meta Platforms Inc.',
    price: 485.67,
    change: -2.34,
    changePercent: -0.48,
    currency: 'USD',
    volume: 34567800,
    marketCap: 1200000000000
  },
  {
    symbol: 'NFLX',
    name: 'Netflix Inc.',
    price: 612.34,
    change: 8.76,
    changePercent: 1.45,
    currency: 'USD',
    volume: 23456700,
    marketCap: 270000000000
  },
  {
    symbol: 'BSE',
    name: 'BSE Sensex',
    price: 73261.31,
    change: 245.67,
    changePercent: 0.34,
    currency: 'INR',
    volume: 0,
    marketCap: 0
  },
  {
    symbol: 'NIFTY',
    name: 'Nifty 50',
    price: 22217.45,
    change: -89.23,
    changePercent: -0.40,
    currency: 'INR',
    volume: 0,
    marketCap: 0
  }
];

const AdvancedStockTicker: React.FC<AdvancedStockTickerProps> = ({
  stocks = defaultStocks,
  speed = 50,
  direction = 'left',
  pauseOnHover = true,
  showControls = false,
  height = 'md',
  className = '',
  onStockClick
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [tickerWidth, setTickerWidth] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const tickerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Height classes
  const heightClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16'
  };

  // Duplicate stocks for seamless looping
  const duplicatedStocks = [...stocks, ...stocks];

  // Calculate ticker width
  useEffect(() => {
    if (tickerRef.current) {
      setTickerWidth(tickerRef.current.scrollWidth / 2);
    }
  }, [stocks]);

  // Format currency
  const formatCurrency = useCallback((amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }, []);

  // Format change percentage
  const formatChangePercent = useCallback((change: number): string => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  }, []);

  // Get change color
  const getChangeColor = useCallback((change: number): string => {
    return change >= 0 ? 'text-green-400' : 'text-red-400';
  }, []);

  // Get change icon
  const getChangeIcon = useCallback((change: number) => {
    return change >= 0 ? (
      <TrendingUp className="w-3 h-3" />
    ) : (
      <TrendingDown className="w-3 h-3" />
    );
  }, []);

  // Handle stock click
  const handleStockClick = useCallback((stock: StockTickerData) => {
    if (onStockClick) {
      onStockClick(stock);
    }
  }, [onStockClick]);

  // Toggle pause
  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  // Close ticker
  const closeTicker = useCallback(() => {
    setIsVisible(false);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${heightClasses[height]} bg-black overflow-hidden ${className}`}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      {/* Controls */}
      {showControls && (
        <div className="absolute top-0 right-0 z-20 flex items-center space-x-2 p-2">
          <button
            onClick={togglePause}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? (
              <Play className="w-3 h-3 text-white" />
            ) : (
              <Pause className="w-3 h-3 text-white" />
            )}
          </button>
          <button
            onClick={closeTicker}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
            title="Close"
          >
            <span className="text-white text-xs">×</span>
          </button>
        </div>
      )}

      {/* Ticker Content */}
      <motion.div
        ref={tickerRef}
        className="flex items-center h-full whitespace-nowrap"
        animate={{
          x: direction === 'left' 
            ? isPaused ? 0 : [-tickerWidth, 0]
            : isPaused ? 0 : [0, tickerWidth]
        }}
        transition={{
          x: {
            repeat: Infinity,
            duration: tickerWidth / speed,
            ease: 'linear'
          }
        }}
      >
        {/* Render duplicated stocks */}
        {duplicatedStocks.map((stock, index) => (
          <motion.div
            key={`${stock.symbol}-${index}`}
            className="flex items-center px-4 sm:px-6 py-2 text-white cursor-pointer hover:bg-gray-900 transition-colors"
            onClick={() => handleStockClick(stock)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Stock Symbol */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <span className="font-bold text-xs sm:text-sm text-white">
                {stock.symbol}
              </span>
              
              {/* Stock Name (hidden on mobile) */}
              <span className="hidden sm:inline text-xs text-gray-300 truncate max-w-20">
                {stock.name}
              </span>
              
              {/* Price */}
              <span className="font-semibold text-xs sm:text-sm text-white">
                {formatCurrency(stock.price, stock.currency)}
              </span>
              
              {/* Change */}
              <div className={`flex items-center space-x-1 ${getChangeColor(stock.change)}`}>
                {getChangeIcon(stock.change)}
                <span className="text-xs font-medium">
                  {formatChangePercent(stock.changePercent)}
                </span>
              </div>
            </div>
            
            {/* Separator */}
            <div className="ml-3 sm:ml-4 w-px h-4 sm:h-6 bg-gray-600" />
          </motion.div>
        ))}
      </motion.div>

      {/* Gradient Overlays for smooth edges */}
      <div className="absolute left-0 top-0 bottom-0 w-6 sm:w-8 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-6 sm:w-8 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
    </div>
  );
};

export default AdvancedStockTicker;
