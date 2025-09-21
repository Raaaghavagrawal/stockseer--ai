import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Plus, Minus, BarChart3, LineChart, BarChart } from 'lucide-react';
import type { StockData, StockChartData } from '../../types/stock';
import { formatPrice, formatChange, formatChangePercent } from '../../utils/currency';
// import { useLiveAccount } from '../../contexts/LiveAccountContext';
import CandlestickChart from '../CandlestickChart';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface LiveOverviewTabProps {
  stockData: StockData | null;
  watchlist: string[];
  chartData: StockChartData[];
  onAddToWatchlist: (symbol: string) => void;
  onRemoveFromWatchlist: (symbol: string) => void;
}

export default function LiveOverviewTab({ stockData, watchlist, chartData, onAddToWatchlist, onRemoveFromWatchlist }: LiveOverviewTabProps) {
  const [chartPeriod, setChartPeriod] = useState('1M');
  const [chartType, setChartType] = useState<'line' | 'candlestick'>('line');
  
  // Live account context available if needed
  // const { isLiveAccount } = useLiveAccount();

  // Chart period options
  const chartPeriods = [
    { value: '1D', label: '1 Day' },
    { value: '1W', label: '1 Week' },
    { value: '1M', label: '1 Month' },
    { value: '3M', label: '3 Months' },
    { value: '6M', label: '6 Months' },
    { value: '1Y', label: '1 Year' },
    { value: '5Y', label: '5 Years' }
  ];

  // Process chart data for display
  const processedChartData = useMemo(() => {
    if (!chartData || chartData.length === 0) return null;

    const labels = chartData.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: chartPeriod === '1D' ? '2-digit' : undefined,
        minute: chartPeriod === '1D' ? '2-digit' : undefined
      });
    });

    const prices = chartData.map(item => item.close);
    const volumes = chartData.map(item => item.volume);

    return {
      labels,
      prices,
      volumes,
      rawData: chartData
    };
  }, [chartData, chartPeriod]);

  // Chart configuration
  const chartConfig = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const value = context.parsed.y;
            const currency = stockData?.currency || 'USD';
            return `${context.dataset.label}: ${formatPrice(value, currency)}`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false
        },
        ticks: {
          maxTicksLimit: 8,
          color: '#6B7280'
        }
      },
      y: {
        display: true,
        position: 'right' as const,
        grid: {
          color: 'rgba(107, 114, 128, 0.1)'
        },
        ticks: {
          color: '#6B7280',
          callback: function(value: any) {
            const currency = stockData?.currency || 'USD';
            return formatPrice(value, currency);
          }
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    }
  };

  // Line chart data
  const lineChartData = {
    labels: processedChartData?.labels || [],
      datasets: [
        {
        label: 'Price',
        data: processedChartData?.prices || [],
        borderColor: stockData?.changePercent && stockData.changePercent >= 0 ? '#10B981' : '#EF4444',
        backgroundColor: stockData?.changePercent && stockData.changePercent >= 0 
          ? 'rgba(16, 185, 129, 0.1)' 
          : 'rgba(239, 68, 68, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: stockData?.changePercent && stockData.changePercent >= 0 ? '#10B981' : '#EF4444',
        pointHoverBorderColor: '#FFFFFF',
        pointHoverBorderWidth: 2
      }
    ]
  };

  // Volume chart data
  const volumeChartData = {
    labels: processedChartData?.labels || [],
    datasets: [
      {
        label: 'Volume',
        data: processedChartData?.volumes || [],
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 0.8)',
        borderWidth: 1,
        borderRadius: 2
      }
    ]
  };

  // Get current holding for this stock (placeholder for live account)
  // Live accounts would have different holding structure
  const currentHolding: any = null;

  if (!stockData) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <BarChart3 className="w-16 h-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
          No Stock Selected
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Search for a stock symbol to view its overview and analysis
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stock Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {stockData.symbol}
              </h1>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {stockData.name}
              </span>
          </div>
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatPrice(stockData.price || 0, stockData.currency)}
              </span>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
                stockData.changePercent && stockData.changePercent >= 0
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                {stockData.changePercent && stockData.changePercent >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span>
                {formatChange(stockData.change || 0, stockData.currency)} ({formatChangePercent(stockData.changePercent || 0)}%)
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Watchlist Button */}
              <button
              onClick={() => {
                if (watchlist.includes(stockData.symbol)) {
                  onRemoveFromWatchlist(stockData.symbol);
                } else {
                  onAddToWatchlist(stockData.symbol);
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                watchlist.includes(stockData.symbol)
                  ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {watchlist.includes(stockData.symbol) ? (
                <>
                  <Minus className="w-4 h-4" />
                  Remove from Watchlist
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add to Watchlist
                </>
                )}
              </button>
          </div>
        </div>
      </div>

      {/* Current Holdings */}
      {currentHolding && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Your Holdings
          </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Shares</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {currentHolding.shares.toLocaleString()}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Value</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {formatPrice(currentHolding.totalValue, stockData.currency)}
            </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Gain/Loss</div>
              <div className={`text-xl font-bold ${
                currentHolding.gainLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {formatPrice(currentHolding.gainLoss, stockData.currency)} ({formatChangePercent(currentHolding.gainLossPercent)}%)
        </div>
      </div>
        </div>
        </div>
      )}

      {/* Chart Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Price Chart
          </h3>
          
          <div className="flex items-center gap-3">
            {/* Chart Type Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setChartType('line')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                  chartType === 'line' 
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <LineChart className="w-4 h-4" />
              </button>
              <button
                onClick={() => setChartType('candlestick')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                  chartType === 'candlestick' 
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <BarChart className="w-4 h-4" />
              </button>
            </div>
            
            {/* Period Selector */}
            <select
              value={chartPeriod}
              onChange={(e) => setChartPeriod(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-binance-yellow focus:border-binance-yellow"
            >
              {chartPeriods.map(period => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Chart Display */}
        <div className="h-96 w-full">
          {chartType === 'line' ? (
            <Line data={lineChartData} options={chartConfig} />
          ) : (
            <CandlestickChart 
              data={processedChartData?.rawData || []}
              chartPeriod={chartPeriod}
            />
          )}
              </div>
            </div>

      {/* Volume Chart */}
      {processedChartData && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Volume
          </h3>
          <div className="h-48 w-full">
            <Line
              data={volumeChartData} 
              options={{
                ...chartConfig,
                    scales: {
                  ...chartConfig.scales,
                  y: {
                    ...chartConfig.scales.y,
                    ticks: {
                      ...chartConfig.scales.y.ticks,
                      callback: function(value: any) {
                        return value.toLocaleString();
                      }
                    }
                  }
                }
              }} 
            />
          </div>
        </div>
      )}
    </div>
  );
}