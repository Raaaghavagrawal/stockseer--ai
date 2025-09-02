import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BarChart3, LineChart, Activity, Target, Calendar, Loader2 } from 'lucide-react';
import type { StockData, AdvancedMetrics } from '../../types/stock';
import { stockAPI } from '../../utils/api';

interface PerformanceTabProps {
  selectedStock: string;
  stockData: StockData | null;
}

export default function PerformanceTab({ selectedStock }: PerformanceTabProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('1y');
  const [performanceData, setPerformanceData] = useState<AdvancedMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPerformanceData = async () => {
    if (!selectedStock) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await stockAPI.getAdvancedMetrics(selectedStock, selectedPeriod);
      setPerformanceData(data.metrics);
    } catch (err) {
      console.error('Error fetching performance data:', err);
      setError('Failed to fetch performance data. Please try again later.');
      setPerformanceData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStock) {
      fetchPerformanceData();
    }
  }, [selectedStock, selectedPeriod]);

  if (!selectedStock) {
    return (
      <div className="text-center py-12 text-slate-400">
        <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p>Search for a stock to view performance metrics</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Loader2 className="w-16 h-16 mx-auto mb-4 opacity-50 animate-spin" />
        <p>Loading performance data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-slate-400">
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-6">
          <p className="text-red-400 mb-2">Error loading performance data</p>
          <p className="text-sm text-red-300 mb-4">{error}</p>
          <button 
            onClick={fetchPerformanceData}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!performanceData) {
    return (
      <div className="text-center py-12 text-slate-400">
        <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p>No performance data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-2">
          <LineChart className="w-8 h-8 text-blue-400" />
          <h2 className="text-2xl font-bold text-white">📈 Performance Analysis</h2>
        </div>
        <p className="text-slate-400">Comprehensive performance metrics and analysis for {selectedStock}</p>
      </div>

      {/* Period Selector */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <div className="flex space-x-2">
          {[
            { value: '1mo', label: '1M' },
            { value: '3mo', label: '3M' },
            { value: '6mo', label: '6M' },
            { value: '1y', label: '1Y' },
            { value: '2y', label: '2Y' },
            { value: '5y', label: '5Y' }
          ].map(period => (
            <button
              key={period.value}
              onClick={() => setSelectedPeriod(period.value)}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                selectedPeriod === period.value 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            {performanceData.total_return >= 0 ? (
              <TrendingUp className="w-5 h-5 text-green-400" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-400" />
            )}
            <div className={`text-2xl font-bold ${performanceData.total_return >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {(performanceData.total_return * 100).toFixed(2)}%
            </div>
          </div>
          <div className="text-slate-400 text-sm">Total Return</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center">
          <div className={`text-2xl font-bold ${performanceData.annualized_return >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {(performanceData.annualized_return * 100).toFixed(2)}%
          </div>
          <div className="text-slate-400 text-sm">Annualized Return</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center">
          <div className="text-yellow-400 text-2xl font-bold">
            {(performanceData.volatility * 100).toFixed(2)}%
          </div>
          <div className="text-slate-400 text-sm">Volatility</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center">
          <div className={`text-2xl font-bold ${performanceData.sharpe_ratio >= 1 ? 'text-green-400' : performanceData.sharpe_ratio >= 0.5 ? 'text-yellow-400' : 'text-red-400'}`}>
            {performanceData.sharpe_ratio.toFixed(2)}
          </div>
          <div className="text-slate-400 text-sm">Sharpe Ratio</div>
        </div>
      </div>

      {/* Risk Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3">Risk Metrics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Max Drawdown</span>
              <span className={`font-semibold ${performanceData.max_drawdown >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {(performanceData.max_drawdown * 100).toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Sortino Ratio</span>
              <span className={`font-semibold ${performanceData.sortino_ratio >= 1 ? 'text-green-400' : performanceData.sortino_ratio >= 0.5 ? 'text-yellow-400' : 'text-red-400'}`}>
                {performanceData.sortino_ratio.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">VaR (95%)</span>
              <span className="font-semibold text-red-400">
                {(performanceData.var_95 * 100).toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Calmar Ratio</span>
              <span className={`font-semibold ${performanceData.calmar_ratio >= 1 ? 'text-green-400' : performanceData.calmar_ratio >= 0.5 ? 'text-yellow-400' : 'text-red-400'}`}>
                {performanceData.calmar_ratio.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3">Statistical Metrics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Skewness</span>
              <span className={`font-semibold ${performanceData.skewness >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {performanceData.skewness.toFixed(3)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Kurtosis</span>
              <span className={`font-semibold ${performanceData.kurtosis >= 3 ? 'text-yellow-400' : 'text-green-400'}`}>
                {performanceData.kurtosis.toFixed(3)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Risk-Free Rate</span>
              <span className="font-semibold text-white">3.00%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Period</span>
              <span className="font-semibold text-white">{selectedPeriod.toUpperCase()}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3">Performance Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Risk Level:</span>
              <span className={`font-semibold ${performanceData.volatility <= 0.2 ? 'text-green-400' : performanceData.volatility <= 0.3 ? 'text-yellow-400' : 'text-red-400'}`}>
                {performanceData.volatility <= 0.2 ? 'Low' : performanceData.volatility <= 0.3 ? 'Medium' : 'High'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Return Quality:</span>
              <span className={`font-semibold ${performanceData.sharpe_ratio >= 1 ? 'text-green-400' : performanceData.sharpe_ratio >= 0.5 ? 'text-yellow-400' : 'text-red-400'}`}>
                {performanceData.sharpe_ratio >= 1 ? 'Excellent' : performanceData.sharpe_ratio >= 0.5 ? 'Good' : 'Poor'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Downside Risk:</span>
              <span className={`font-semibold ${performanceData.max_drawdown >= -0.1 ? 'text-green-400' : performanceData.max_drawdown >= -0.2 ? 'text-yellow-400' : 'text-red-400'}`}>
                {performanceData.max_drawdown >= -0.1 ? 'Low' : performanceData.max_drawdown >= -0.2 ? 'Moderate' : 'High'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Overall Rating:</span>
              <span className={`font-semibold ${performanceData.sharpe_ratio >= 1 && performanceData.max_drawdown >= -0.2 ? 'text-green-400' : performanceData.sharpe_ratio >= 0.5 ? 'text-yellow-400' : 'text-red-400'}`}>
                {performanceData.sharpe_ratio >= 1 && performanceData.max_drawdown >= -0.2 ? 'Strong' : performanceData.sharpe_ratio >= 0.5 ? 'Moderate' : 'Weak'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}