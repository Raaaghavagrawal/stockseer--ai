import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Activity } from 'lucide-react';
import { stockAPI } from '../utils/api';
import type { StockData, StockChartData } from '../types/stock';
import { formatCurrency, formatPercentage, getChangeColor } from '../utils/helpers';

const StockOverview: React.FC = () => {
  const [selectedStock, setSelectedStock] = useState('AAPL');
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [chartData, setChartData] = useState<StockChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStockData();
  }, [selectedStock]);

  const fetchStockData = async () => {
    setLoading(true);
    try {
      const [data, chart] = await Promise.all([
        stockAPI.getStockData(selectedStock),
        stockAPI.getStockChartData(selectedStock)
      ]);
      setStockData(data);
      setChartData(chart);
    } catch (error) {
      console.error('Error fetching stock data:', error);
    } finally {
      setLoading(false);
    }
  };

  const kpiCards = [
    {
      title: 'Current Price',
      value: stockData?.price ? formatCurrency(stockData.price) : '--',
      change: stockData?.changePercent || 0,
      icon: TrendingUp,
      color: 'primary'
    },
    {
      title: 'Market Cap',
      value: stockData?.marketCap ? `$${(stockData.marketCap / 1e9).toFixed(2)}B` : '--',
      change: 0,
      icon: BarChart3,
      color: 'blue'
    },
    {
      title: 'Volume',
      value: stockData?.volume ? (stockData.volume / 1e6).toFixed(2) + 'M' : '--',
      change: 0,
      icon: Activity,
      color: 'green'
    },
    {
      title: 'P/E Ratio',
      value: stockData?.pe ? stockData.pe.toFixed(2) : '--',
      change: 0,
      icon: TrendingDown,
      color: 'purple'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Market Overview</h1>
        <div className="flex items-center space-x-2">
          <select
            value={selectedStock}
            onChange={(e) => setSelectedStock(e.target.value)}
            className="input-field w-32"
          >
            <option value="AAPL">AAPL</option>
            <option value="GOOGL">GOOGL</option>
            <option value="MSFT">MSFT</option>
            <option value="TSLA">TSLA</option>
            <option value="AMZN">AMZN</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, index) => (
          <div
            key={card.title}
            className="card hover:shadow-glow transition-all duration-300 animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.title}</h3>
              <card.icon className={`w-5 h-5 text-${card.color}-500`} />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {card.value}
            </div>
            {card.change !== 0 && (
              <div className={`text-sm ${getChangeColor(card.change, true)}`}>
                {formatPercentage(card.change)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Stock Chart Placeholder */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Price Chart</h3>
        <div className="h-64 bg-gray-50 dark:bg-dark-700 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <BarChart3 className="w-12 h-12 mx-auto mb-2" />
            <p>Chart component will be integrated here</p>
            <p className="text-sm">Using Recharts for interactive stock charts</p>
          </div>
        </div>
      </div>

      {/* Market News Placeholder */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Market News</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                    Market Update #{item}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    This is a placeholder for market news content that will be fetched from your backend API.
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StockOverview;
