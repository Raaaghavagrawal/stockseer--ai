'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

// Types
export interface StockTickerData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency?: string;
}

interface StockTickerProps {
  stocks: StockTickerData[];
  speed?: number; // pixels per second
  direction?: 'left' | 'right';
  pauseOnHover?: boolean;
  className?: string;
  height?: string;
}

// Default stock data for demonstration
const defaultStocks: StockTickerData[] = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 175.43,
    change: 2.34,
    changePercent: 1.35,
    currency: 'USD'
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    price: 142.56,
    change: -1.23,
    changePercent: -0.86,
    currency: 'USD'
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    price: 378.85,
    change: 5.67,
    changePercent: 1.52,
    currency: 'USD'
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    price: 248.42,
    change: -3.21,
    changePercent: -1.28,
    currency: 'USD'
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    price: 155.23,
    change: 1.89,
    changePercent: 1.23,
    currency: 'USD'
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    price: 875.28,
    change: 12.45,
    changePercent: 1.44,
    currency: 'USD'
  },
  {
    symbol: 'META',
    name: 'Meta Platforms Inc.',
    price: 485.67,
    change: -2.34,
    changePercent: -0.48,
    currency: 'USD'
  },
  {
    symbol: 'NFLX',
    name: 'Netflix Inc.',
    price: 612.34,
    change: 8.76,
    changePercent: 1.45,
    currency: 'USD'
  }
];

const StockTicker: React.FC<StockTickerProps> = ({
  stocks = defaultStocks,
  speed = 50,
  direction = 'left',
  pauseOnHover = true,
  className = ''
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [tickerWidth, setTickerWidth] = useState(0);
  const tickerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Duplicate stocks for seamless looping
  const duplicatedStocks = [...stocks, ...stocks];

  // Calculate ticker width
  useEffect(() => {
    if (tickerRef.current) {
      setTickerWidth(tickerRef.current.scrollWidth / 2); // Divide by 2 since we duplicate
    }
  }, [stocks]);

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Format change percentage
  const formatChangePercent = (change: number): string => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  // Get change color
  const getChangeColor = (change: number): string => {
    return change >= 0 ? 'text-green-400' : 'text-red-400';
  };

  // Get change icon
  const getChangeIcon = (change: number) => {
    return change >= 0 ? (
      <TrendingUp className="w-3 h-3" />
    ) : (
      <TrendingDown className="w-3 h-3" />
    );
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-12 bg-black overflow-hidden ${className}`}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
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
          <div
            key={`${stock.symbol}-${index}`}
            className="flex items-center px-6 py-2 text-white"
          >
            {/* Stock Symbol */}
            <div className="flex items-center space-x-3">
              <span className="font-bold text-sm sm:text-base text-white">
                {stock.symbol}
              </span>
              
              {/* Stock Name (hidden on mobile) */}
              <span className="hidden sm:inline text-xs text-gray-300 truncate max-w-24">
                {stock.name}
              </span>
              
              {/* Price */}
              <span className="font-semibold text-sm sm:text-base text-white">
                {formatCurrency(stock.price, stock.currency)}
              </span>
              
              {/* Change */}
              <div className={`flex items-center space-x-1 ${getChangeColor(stock.change)}`}>
                {getChangeIcon(stock.change)}
                <span className="text-xs sm:text-sm font-medium">
                  {formatChangePercent(stock.changePercent)}
                </span>
              </div>
            </div>
            
            {/* Separator */}
            <div className="ml-4 w-px h-6 bg-gray-600" />
          </div>
        ))}
      </motion.div>

      {/* Gradient Overlays for smooth edges */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
    </div>
  );
};

export default StockTicker;
