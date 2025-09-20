import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Plus, Minus, Download, BarChart3, LineChart, BarChart, FileText, BookOpen } from 'lucide-react';
import type { StockData, StockChartData } from '../../types/stock';
import { formatPrice, formatChange, formatChangePercent } from '../../utils/currency';
import { useLiveAccount } from '../../contexts/LiveAccountContext';
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

export default function LiveOverviewTab({ 
  stockData, 
  watchlist, 
  chartData, 
  onAddToWatchlist, 
  onRemoveFromWatchlist 
}: LiveOverviewTabProps) {
  const { addToWatchlist, removeFromWatchlist, createResearchNote, generateAnalysisReport } = useLiveAccount();
  const [chartType, setChartType] = useState<'line' | 'candlestick'>('line');
  const [chartPeriod, setChartPeriod] = useState('1Y');
  const [showHistoricalData, setShowHistoricalData] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  
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

    const dataToUse = zoomState.isZoomed 
      ? chartData.slice(zoomState.startIndex, zoomState.endIndex + 1)
      : chartData;

    return {
      labels: dataToUse.map(d => new Date(d.date).toLocaleDateString()),
      datasets: [
        {
          label: 'Price',
          data: dataToUse.map(d => d.close),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.1,
        },
      ],
    };
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

  const handleWatchlistToggle = async () => {
    if (isInWatchlist) {
      await removeFromWatchlist(stockData.symbol);
      onRemoveFromWatchlist(stockData.symbol);
    } else {
      await addToWatchlist(stockData.symbol);
      onAddToWatchlist(stockData.symbol);
    }
  };

  const handleGenerateReport = async () => {
    if (!stockData) return;
    
    setIsGeneratingReport(true);
    try {
      const report = await generateAnalysisReport(stockData.symbol, 'technical');
      if (report) {
        // Handle successful report generation
        console.log('Report generated:', report);
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleCreateNote = async () => {
    if (!stockData) return;
    
    const title = `Research Note - ${stockData.symbol}`;
    const content = `Initial research notes for ${stockData.name} (${stockData.symbol})`;
    const tags = [stockData.symbol, 'research', 'initial'];
    
    await createResearchNote(stockData.symbol, title, content, tags);
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden">
      {/* Stock Header with Research Actions */}
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
              {/* Generate Report Button */}
              <button
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
                className="p-2 sm:p-3 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
                title="Generate Analysis Report"
              >
                {isGeneratingReport ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 text-white" />
                )}
              </button>
              {/* Create Note Button */}
              <button
                onClick={handleCreateNote}
                className="p-2 sm:p-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition-all duration-200 transform hover:scale-105"
                title="Create Research Note"
              >
                <BookOpen className="w-4 h-4 text-white" />
              </button>
              {/* Watchlist Button */}
              <button
                onClick={handleWatchlistToggle}
                className={`p-2 sm:p-3 rounded-lg transition-all duration-200 ${isInWatchlist ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {isInWatchlist ? <Minus className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-white" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Research & Development Tools */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Research & Development Tools</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleGenerateReport}
            disabled={isGeneratingReport}
            className="flex items-center space-x-3 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors disabled:opacity-50"
          >
            <FileText className="w-6 h-6 text-purple-600" />
            <div className="text-left">
              <div className="font-medium text-purple-800 dark:text-purple-200">Technical Analysis</div>
              <div className="text-sm text-purple-600 dark:text-purple-400">Generate detailed report</div>
            </div>
          </button>
          
          <button
            onClick={handleCreateNote}
            className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <BookOpen className="w-6 h-6 text-blue-600" />
            <div className="text-left">
              <div className="font-medium text-blue-800 dark:text-blue-200">Research Notes</div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Create research note</div>
            </div>
          </button>
          
          <button
            onClick={() => {/* TODO: Implement fundamental analysis */}}
            className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <BarChart3 className="w-6 h-6 text-green-600" />
            <div className="text-left">
              <div className="font-medium text-green-800 dark:text-green-200">Fundamental Analysis</div>
              <div className="text-sm text-green-600 dark:text-green-400">Deep dive analysis</div>
            </div>
          </button>
        </div>
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
                    resetZoom();
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
          </div>
        </div>

        {/* Chart Display */}
        <div className="h-64 sm:h-80 w-full">
          {processedChartData ? (
            <Line
              data={processedChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: false,
                    grid: {
                      color: 'rgba(156, 163, 175, 0.1)',
                    },
                    ticks: {
                      color: 'rgb(156, 163, 175)',
                    },
                  },
                  x: {
                    grid: {
                      color: 'rgba(156, 163, 175, 0.1)',
                    },
                    ticks: {
                      color: 'rgb(156, 163, 175)',
                    },
                  },
                },
                interaction: {
                  intersect: false,
                  mode: 'index',
                },
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No chart data available</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
