import { useEffect, useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Plus, Minus, BarChart3, LineChart, BarChart, DollarSign, Coins } from 'lucide-react';
import type { StockData, StockChartData, StockPrediction } from '../../types/stock';
import { formatPrice, formatChange, formatChangePercent } from '../../utils/currency';
import { useDummyAccount } from '../../contexts/DummyAccountContext';
import InvestmentModal from '../InvestmentModal';
import CandlestickChart from '../CandlestickChart';
import { predictionsAPI } from '../../utils/api';
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

interface DummyOverviewTabProps {
  stockData: StockData | null;
  watchlist: string[];
  chartData: StockChartData[];
  onAddToWatchlist: (symbol: string) => void;
  onRemoveFromWatchlist: (symbol: string) => void;
}

export default function DummyOverviewTab({ 
  stockData, 
  watchlist, 
  chartData, 
  onAddToWatchlist, 
  onRemoveFromWatchlist 
}: DummyOverviewTabProps) {
  const { zolosBalance, holdings, getZolosToCurrency } = useDummyAccount();
  const [chartType, setChartType] = useState<'line' | 'candlestick'>('line');
  const [chartPeriod, setChartPeriod] = useState('1Y');
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);
  const [showHistoricalData, setShowHistoricalData] = useState(false);
  const [prediction, setPrediction] = useState<StockPrediction | null>(null);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  
  // Zoom state for both charts
  const [zoomState, setZoomState] = useState({
    isZoomed: false,
    startIndex: 0,
    endIndex: 0,
    originalData: null as StockChartData[] | null
  });

  // Zoom functions
  const handleZoom = (startIndex: number, endIndex: number) => {
    if (!chartData || chartData.length === 0) return;
    
    setZoomState({
      isZoomed: true,
      startIndex,
      endIndex,
      originalData: chartData
    });
  };

  const resetZoom = () => {
    setZoomState({
      isZoomed: false,
      startIndex: 0,
      endIndex: 0,
      originalData: null
    });
  };

  // Process chart data for Chart.js
  const processedChartData = useMemo(() => {
    if (!chartData || chartData.length === 0) return null;

    let dataToProcess = chartData;
    
    // Apply zoom if active
    if (zoomState.isZoomed && zoomState.originalData) {
      dataToProcess = zoomState.originalData.slice(zoomState.startIndex, zoomState.endIndex + 1);
    } else {
      // Map period to actual data range
      const periodMap: { [key: string]: number } = {
        '1D': chartData.length, // Show all intraday data
        '1W': 168, // 7 days * 24 hours
        '1M': 30,
        '3M': 90,
        '1Y': 365
      };

      const maxPoints = periodMap[chartPeriod] || 365;
      dataToProcess = chartData.slice(-maxPoints);
    }

    return {
      labels: dataToProcess.map(item => item.date),
      datasets: [
        {
          label: 'Close Price',
          data: dataToProcess.map(item => item.close),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.1,
        }
      ]
    };
  }, [chartData, chartPeriod, zoomState]);

  // Process candlestick data for custom rendering
  const candlestickData = useMemo(() => {
    if (!chartData || chartData.length === 0) return null;

    let dataToProcess = chartData;
    
    // Apply zoom if active
    if (zoomState.isZoomed && zoomState.originalData) {
      dataToProcess = zoomState.originalData.slice(zoomState.startIndex, zoomState.endIndex + 1);
    } else {
      // For intraday data (1D), show all data points
      // For other periods, limit based on period
      const periodMap: { [key: string]: number } = {
        '1D': chartData.length, // Show all intraday data
        '1W': 168, // 7 days * 24 hours
        '1M': 30,
        '3M': 90,
        '1Y': 365
      };

      const maxPoints = periodMap[chartPeriod] || 365;
      dataToProcess = chartData.slice(-maxPoints);
    }

    return dataToProcess;
  }, [chartData, chartPeriod, zoomState]);

  if (!stockData) {
    return (
      <div className="text-center py-12 text-slate-400">
        <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p>Search for a stock to view overview</p>
      </div>
    );
  }

  const isInWatchlist = watchlist.includes(stockData.symbol);
  const currentHolding = holdings.find(h => h.symbol === stockData.symbol);
  const currencyValue = getZolosToCurrency(zolosBalance);

  // Fetch real AI prediction from backend to keep parity with live
  useEffect(() => {
    const fetchPrediction = async () => {
      if (!stockData?.symbol) {
        setPrediction(null);
        return;
      }
      try {
        setLoadingPrediction(true);
        const resp = await predictionsAPI.getStockPrediction(stockData.symbol);
        setPrediction(resp);
      } catch (e) {
        // Fallback to null prediction silently in dummy mode
        setPrediction(null);
      } finally {
        setLoadingPrediction(false);
      }
    };
    fetchPrediction();
  }, [stockData?.symbol]);

  // Derive modal-friendly prediction and sentiment
  const modalPrediction = useMemo(() => {
    if (!prediction || !stockData) return undefined;
    const sentiment: 'bullish' | 'bearish' | 'neutral' =
      Math.abs(prediction.predictedPrice - (stockData.price || 0)) < 1e-6
        ? 'neutral'
        : prediction.predictedPrice >= (stockData.price || 0)
          ? 'bullish'
          : 'bearish';
    return {
      predictedPrice: prediction.predictedPrice,
      confidence: prediction.confidence ?? 0.7,
      prediction: sentiment,
      reasoning: prediction.reasoning || ''
    } as const;
  }, [prediction, stockData]);

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden">
      {/* Stock Header with Investment Button */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{stockData.symbol}</h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{stockData.name}</p>
          </div>
          <div className="flex items-center justify-between sm:justify-end space-x-4">
            <div className="text-left sm:text-right">
              <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {formatPrice(stockData.price || 0, stockData.currency)}
              </div>
              <div className={`flex items-center text-sm sm:text-base ${stockData.change && stockData.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {stockData.change && stockData.change >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                {formatChange(stockData.change || 0, stockData.currency)} ({formatChangePercent(stockData.changePercent || 0)}%)
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Investment Button */}
              <button
                onClick={() => setShowInvestmentModal(true)}
                className="p-2 sm:p-3 rounded-lg bg-green-600 hover:bg-green-700 transition-all duration-200 transform hover:scale-105"
                title="Invest in this stock"
              >
                <Plus className="w-4 h-4 text-white" />
              </button>
              {/* Watchlist Button */}
              <button
                onClick={() => isInWatchlist ? onRemoveFromWatchlist(stockData.symbol) : onAddToWatchlist(stockData.symbol)}
                className={`p-2 sm:p-3 rounded-lg transition-all duration-200 ${isInWatchlist ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {isInWatchlist ? <Minus className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-white" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Zolos Balance & Current Holding */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Coins className="w-5 h-5 text-yellow-600" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Available Zolos</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {zolosBalance.toLocaleString()} Z
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-500">
            ≈ {formatPrice(currencyValue, stockData.currency)}
          </div>
        </div>

        {currentHolding && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Your Holding</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentHolding.shares} shares
            </div>
            <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              {formatPrice(currentHolding.totalValue, stockData.currency)}
            </div>
            <div className={`text-sm ${currentHolding.gainLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatChangePercent(currentHolding.gainLossPercent)} ({formatPrice(currentHolding.gainLoss, stockData.currency)})
            </div>
          </div>
        )}
      </div>

      {/* AI Prediction */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">AI Prediction</h3>
        {loadingPrediction ? (
          <div className="text-sm text-gray-600 dark:text-gray-400">Loading prediction...</div>
        ) : prediction ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Predicted Price</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(prediction.predictedPrice, stockData.currency)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Confidence</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {(prediction.confidence * 100).toFixed(0)}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Sentiment</div>
                <div className={`text-xl font-bold capitalize ${
                  prediction.prediction === 'bullish' ? 'text-green-600 dark:text-green-400' :
                  prediction.prediction === 'bearish' ? 'text-red-600 dark:text-red-400' :
                  'text-gray-600 dark:text-gray-400'
                }`}>
                  {prediction.prediction}
                </div>
              </div>
            </div>
            {prediction.reasoning && (
              <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">{prediction.reasoning}</div>
            )}
          </>
        ) : (
          <div className="text-sm text-gray-600 dark:text-gray-400">Prediction unavailable.</div>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4">
          <div className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Market Cap</div>
          <div className="text-gray-900 dark:text-white font-semibold text-sm sm:text-base">${stockData.marketCap ? (stockData.marketCap / 1e9).toFixed(2) : 'N/A'}B</div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4">
          <div className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Volume</div>
          <div className="text-gray-900 dark:text-white font-semibold text-sm sm:text-base">{(stockData.volume / 1e6).toFixed(1)}M</div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4">
          <div className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">P/E Ratio</div>
          <div className="text-gray-900 dark:text-white font-semibold text-sm sm:text-base">{stockData.pe?.toFixed(2)}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4">
          <div className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">52W High</div>
          <div className="text-gray-900 dark:text-white font-semibold text-sm sm:text-base">${stockData.high?.toFixed(2)}</div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Price Chart</h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            {/* Chart Type Selection */}
            <div className="flex space-x-2">
              <button
                onClick={() => setChartType('line')}
                className={`px-3 py-2 rounded-lg text-sm flex items-center space-x-1 transition-all duration-200 ${
                  chartType === 'line' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <LineChart className="w-4 h-4" />
                <span className="hidden sm:inline">Line</span>
              </button>
              <button
                onClick={() => setChartType('candlestick')}
                className={`px-3 py-2 rounded-lg text-sm flex items-center space-x-1 transition-all duration-200 ${
                  chartType === 'candlestick' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <BarChart className="w-4 h-4" />
                <span className="hidden sm:inline">Candlestick</span>
              </button>
            </div>
            
            {/* Period Selection */}
            <div className="flex flex-wrap gap-2">
              {['1D', '1W', '1M', '3M', '1Y'].map(period => (
                <button
                  key={period}
                  onClick={() => {
                    setChartPeriod(period);
                    resetZoom(); // Reset zoom when changing period
                  }}
                  className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                    chartPeriod === period 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
            
            {/* Zoom Controls */}
            {zoomState.isZoomed && (
              <div className="flex items-center space-x-2">
                <span className="text-gray-600 dark:text-gray-400 text-sm">Zoomed</span>
                <button
                  onClick={resetZoom}
                  className="px-3 py-2 rounded-lg text-sm bg-orange-600 text-white hover:bg-orange-700 flex items-center space-x-1 transition-all duration-200"
                >
                  <span>Reset Zoom</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Chart Display */}
        <div className="h-80 sm:h-96 bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4 relative w-full overflow-hidden">
          {chartData && chartData.length > 10 && (
            <div className="absolute top-2 left-2 bg-blue-600/80 text-white text-xs px-2 py-1 rounded z-10">
              {zoomState.isZoomed ? 'Double-click to zoom out' : 'Click to zoom'}
            </div>
          )}
          {!chartData || chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-600 dark:text-gray-400">
                <LineChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm sm:text-base">No chart data available</p>
                <p className="text-xs sm:text-sm">Search for a stock to view charts</p>
              </div>
            </div>
          ) : (
            <div 
              className={`h-full w-full ${chartData && chartData.length > 10 ? 'cursor-pointer' : ''}`}
              onDoubleClick={() => {
                if (zoomState.isZoomed) {
                  resetZoom();
                }
              }}
            >
              {chartType === 'line' && processedChartData && (
                <Line
                  data={processedChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                      tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: 'rgba(59, 130, 246, 0.5)',
                        borderWidth: 1,
                      },
                    },
                    scales: {
                      x: {
                        grid: {
                          color: 'rgba(255, 255, 255, 0.1)',
                        },
                        ticks: {
                          color: 'rgba(255, 255, 255, 0.7)',
                        },
                      },
                      y: {
                        grid: {
                          color: 'rgba(255, 255, 255, 0.1)',
                        },
                        ticks: {
                          color: 'rgba(255, 255, 255, 0.7)',
                          callback: function(value) {
                            return '$' + Number(value).toFixed(2);
                          },
                        },
                      },
                    },
                    interaction: {
                      mode: 'nearest',
                      axis: 'x',
                      intersect: false,
                    },
                    onClick: (_, elements) => {
                      if (elements.length > 0 && !zoomState.isZoomed) {
                        const elementIndex = elements[0].index;
                        const dataLength = processedChartData.labels.length;
                        
                        // Calculate zoom range (show 20% of data around clicked point)
                        const zoomRange = Math.max(5, Math.floor(dataLength * 0.2));
                        const startIndex = Math.max(0, elementIndex - Math.floor(zoomRange / 2));
                        const endIndex = Math.min(dataLength - 1, startIndex + zoomRange - 1);
                        
                        // Find the actual indices in the original data
                        const originalStartIndex = chartData.length - dataLength + startIndex;
                        const originalEndIndex = chartData.length - dataLength + endIndex;
                        
                        handleZoom(originalStartIndex, originalEndIndex);
                      }
                    },
                  }}
                />
              )}
              
              {chartType === 'candlestick' && candlestickData && (
                <CandlestickChart
                  data={candlestickData}
                  chartPeriod={chartPeriod}
                  stockData={stockData}
                  onZoom={(startIndex, endIndex) => {
                    // Find the actual indices in the original data
                    const originalStartIndex = chartData.length - candlestickData.length + startIndex;
                    const originalEndIndex = chartData.length - candlestickData.length + endIndex;
                    handleZoom(originalStartIndex, originalEndIndex);
                  }}
                  zoomState={zoomState}
                  onResetZoom={resetZoom}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Historical Data */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Historical Data</h3>
          <button
            onClick={() => setShowHistoricalData(!showHistoricalData)}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
          >
            {showHistoricalData ? 'Hide' : 'Show'}
          </button>
        </div>
        
        {showHistoricalData && (
          <div className="overflow-x-auto">
            {!chartData || chartData.length === 0 ? (
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                <p className="text-sm sm:text-base">No historical data available</p>
                <p className="text-xs sm:text-sm">Search for a stock to view historical data</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-gray-300 dark:border-gray-600">
                      <th className="text-left py-2 text-gray-600 dark:text-gray-400">Date</th>
                      <th className="text-right py-2 text-gray-600 dark:text-gray-400">Open</th>
                      <th className="text-right py-2 text-gray-600 dark:text-gray-400">High</th>
                      <th className="text-right py-2 text-gray-600 dark:text-gray-400">Low</th>
                      <th className="text-right py-2 text-gray-600 dark:text-gray-400">Close</th>
                      <th className="text-right py-2 text-gray-600 dark:text-gray-400">Volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.slice(-10).map((item, index) => (
                      <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                        <td className="py-2 text-gray-700 dark:text-gray-300">{item.date}</td>
                        <td className="py-2 text-right text-gray-700 dark:text-gray-300">${item.open.toFixed(2)}</td>
                        <td className="py-2 text-right text-gray-700 dark:text-gray-300">${item.high.toFixed(2)}</td>
                        <td className="py-2 text-right text-gray-700 dark:text-gray-300">${item.low.toFixed(2)}</td>
                        <td className="py-2 text-right text-gray-700 dark:text-gray-300">${item.close.toFixed(2)}</td>
                        <td className="py-2 text-right text-gray-700 dark:text-gray-300">{(item.volume / 1e6).toFixed(1)}M</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Investment Modal */}
      <InvestmentModal
        isOpen={showInvestmentModal}
        onClose={() => setShowInvestmentModal(false)}
        symbol={stockData?.symbol || ''}
        stockName={stockData?.name || ''}
        currentPrice={stockData.price || 0}
        currency={stockData?.currency || 'USD'}
        aiPrediction={modalPrediction}
      />
    </div>
  );
}
