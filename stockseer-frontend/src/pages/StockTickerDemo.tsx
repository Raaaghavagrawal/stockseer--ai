'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Settings, X } from 'lucide-react';
import StockTicker from '../components/StockTicker';
import AdvancedStockTicker from '../components/AdvancedStockTicker';
import type { StockTickerData } from '../components/StockTicker';

const StockTickerDemo: React.FC = () => {
  const [selectedStock, setSelectedStock] = useState<StockTickerData | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [tickerSettings, setTickerSettings] = useState({
    speed: 50,
    direction: 'left' as 'left' | 'right',
    pauseOnHover: true,
    showControls: false,
    height: 'md' as 'sm' | 'md' | 'lg'
  });

  // Sample stock data
  const sampleStocks: StockTickerData[] = [
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
    },
    {
      symbol: 'BSE',
      name: 'BSE Sensex',
      price: 73261.31,
      change: 245.67,
      changePercent: 0.34,
      currency: 'INR'
    },
    {
      symbol: 'NIFTY',
      name: 'Nifty 50',
      price: 22217.45,
      change: -89.23,
      changePercent: -0.40,
      currency: 'INR'
    }
  ];

  // Handle stock click
  const handleStockClick = (stock: StockTickerData) => {
    setSelectedStock(stock);
  };

  // Update stock prices randomly (for demo)
  const [stocks, setStocks] = useState<StockTickerData[]>(sampleStocks);

  useEffect(() => {
    const interval = setInterval(() => {
      setStocks(prevStocks => 
        prevStocks.map(stock => ({
          ...stock,
          price: stock.price + (Math.random() - 0.5) * stock.price * 0.01,
          change: stock.change + (Math.random() - 0.5) * 2,
          changePercent: stock.changePercent + (Math.random() - 0.5) * 0.5
        }))
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Stock Ticker Components
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Professional stock ticker with smooth animations and responsive design
          </p>
        </div>

        {/* Settings Panel */}
        <div className="mb-8">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>

          {showSettings && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Speed (px/s)
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={tickerSettings.speed}
                    onChange={(e) => setTickerSettings(prev => ({ ...prev, speed: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">{tickerSettings.speed}</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Direction
                  </label>
                  <select
                    value={tickerSettings.direction}
                    onChange={(e) => setTickerSettings(prev => ({ ...prev, direction: e.target.value as 'left' | 'right' }))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="left">Left to Right</option>
                    <option value="right">Right to Left</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Height
                  </label>
                  <select
                    value={tickerSettings.height}
                    onChange={(e) => setTickerSettings(prev => ({ ...prev, height: e.target.value as 'sm' | 'md' | 'lg' }))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="sm">Small</option>
                    <option value="md">Medium</option>
                    <option value="lg">Large</option>
                  </select>
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={tickerSettings.pauseOnHover}
                      onChange={(e) => setTickerSettings(prev => ({ ...prev, pauseOnHover: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Pause on Hover</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={tickerSettings.showControls}
                      onChange={(e) => setTickerSettings(prev => ({ ...prev, showControls: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Show Controls</span>
                  </label>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Basic Stock Ticker */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Basic Stock Ticker
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <StockTicker
              stocks={stocks}
              speed={tickerSettings.speed}
              direction={tickerSettings.direction}
              pauseOnHover={tickerSettings.pauseOnHover}
            />
          </div>
        </div>

        {/* Advanced Stock Ticker */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Advanced Stock Ticker
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <AdvancedStockTicker
              stocks={stocks}
              speed={tickerSettings.speed}
              direction={tickerSettings.direction}
              pauseOnHover={tickerSettings.pauseOnHover}
              showControls={tickerSettings.showControls}
              height={tickerSettings.height}
              onStockClick={handleStockClick}
            />
          </div>
        </div>

        {/* Multiple Tickers */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Multiple Tickers
          </h2>
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <StockTicker
                stocks={stocks.slice(0, 5)}
                speed={30}
                direction="left"
                height="sm"
                className="h-8"
              />
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <StockTicker
                stocks={stocks.slice(5)}
                speed={70}
                direction="right"
                height="sm"
                className="h-8"
              />
            </div>
          </div>
        </div>

        {/* Selected Stock Info */}
        {selectedStock && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Selected Stock: {selectedStock.symbol}
              </h3>
              <button
                onClick={() => setSelectedStock(null)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Name</span>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedStock.name}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Price</span>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: selectedStock.currency || 'USD'
                  }).format(selectedStock.price)}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Change</span>
                <p className={`font-semibold ${selectedStock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {selectedStock.change >= 0 ? '+' : ''}{selectedStock.change.toFixed(2)} ({selectedStock.changePercent >= 0 ? '+' : ''}{selectedStock.changePercent.toFixed(2)}%)
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Code Examples */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Usage Examples
          </h2>
          <div className="bg-gray-900 rounded-lg p-6 overflow-x-auto">
            <pre className="text-green-400 text-sm">
              <code>{`// Basic Usage
import StockTicker from '../components/StockTicker';

<StockTicker
  stocks={stockData}
  speed={50}
  direction="left"
  pauseOnHover={true}
/>

// Advanced Usage
import AdvancedStockTicker from '../components/AdvancedStockTicker';

<AdvancedStockTicker
  stocks={stockData}
  speed={50}
  direction="left"
  pauseOnHover={true}
  showControls={true}
  height="md"
  onStockClick={(stock) => console.log('Clicked:', stock)}
/>

// Stock Data Format
interface StockTickerData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency?: string;
}`}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockTickerDemo;
