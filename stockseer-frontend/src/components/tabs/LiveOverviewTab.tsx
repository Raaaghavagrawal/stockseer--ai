import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Plus, Minus, Download, BarChart3, LineChart, BarChart, FileText, BookOpen } from 'lucide-react';
import type { StockData, StockChartData } from '../../types/stock';
import { formatPrice, formatChange, formatChangePercent } from '../../utils/currency';
import { useLiveAccount } from '../../contexts/LiveAccountContext';
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
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<any | null>(null);
  
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
        // Open modal with generated report
        setGeneratedReport(report);
        setReportModalOpen(true);
      }
    } catch (error) {
      // Optionally surface a toast in future; avoid noisy console
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleDownloadReportPDF = () => {
    if (!generatedReport || !stockData) return;
    const title = `${stockData.symbol} ${generatedReport.reportType?.toUpperCase?.() || 'ANALYSIS'} Report`;
    const reportHtml = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
            h1 { font-size: 20px; margin: 0 0 8px 0; }
            h2 { font-size: 16px; margin: 16px 0 8px 0; }
            .meta { color: #6B7280; font-size: 12px; margin-bottom: 16px; }
            .section { margin-bottom: 16px; }
            ul { margin: 8px 0 0 16px; }
            li { margin: 4px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { border: 1px solid #E5E7EB; padding: 8px; font-size: 12px; text-align: left; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="meta">Generated: ${new Date(generatedReport.timestamp || Date.now()).toLocaleString()}</div>
          <div class="section">
            <h2>Stock Snapshot</h2>
            <table>
              <tbody>
                <tr><th>Symbol</th><td>${stockData.symbol}</td></tr>
                <tr><th>Name</th><td>${stockData.name || ''}</td></tr>
                <tr><th>Price</th><td>${formatPrice(stockData.price || 0, stockData.currency)}</td></tr>
                <tr><th>Change</th><td>${formatChange(stockData.change || 0, stockData.currency)} (${formatChangePercent(stockData.changePercent || 0)}%)</td></tr>
                ${stockData.marketCap ? `<tr><th>Market Cap</th><td>$${(stockData.marketCap/1e9).toFixed(2)}B</td></tr>` : ''}
                ${stockData.volume ? `<tr><th>Volume</th><td>${(stockData.volume/1e6).toFixed(1)}M</td></tr>` : ''}
                ${typeof stockData.pe === 'number' ? `<tr><th>P/E Ratio</th><td>${stockData.pe.toFixed(2)}</td></tr>` : ''}
                ${typeof stockData.high === 'number' ? `<tr><th>52W High</th><td>$${stockData.high.toFixed(2)}</td></tr>` : ''}
              </tbody>
            </table>
          </div>
          <div class="section">
            <h2>Summary</h2>
            <p>${generatedReport?.content?.summary || 'No summary available.'}</p>
          </div>
          ${Array.isArray(generatedReport?.content?.highlights) ? `
            <div class="section">
              <h2>Highlights</h2>
              <ul>
                ${generatedReport.content.highlights.map((h: string) => `<li>${h}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          ${generatedReport?.metrics ? `
            <div class="section">
              <h2>Metrics</h2>
              <table>
                <tbody>
                  ${Object.entries(generatedReport.metrics).map(([k,v]) => `<tr><th>${k}</th><td>${String(v)}</td></tr>`).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}
        </body>
      </html>
    `;

    const w = window.open('', '_blank');
    if (!w) return;
    w.document.open();
    w.document.write(reportHtml);
    w.document.close();
    w.onload = () => {
      w.focus();
      w.print();
    };
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

      {/* Download Data */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Export Data</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Download stock data for analysis</p>
          </div>
          <button className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-white flex items-center justify-center transition-all duration-200">
            <Download className="w-4 h-4 mr-2" />
            Download CSV
          </button>
        </div>
      </div>

      {/* Analysis Report Modal */}
      {reportModalOpen && generatedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setReportModalOpen(false)} />
          <div className="relative z-10 w-[92vw] max-w-2xl max-h-[85vh] overflow-auto bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">{stockData.symbol} {String(generatedReport.reportType || '').toUpperCase()} Report</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(generatedReport.timestamp || Date.now()).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadReportPDF}
                  className="inline-flex items-center px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm shadow"
                >
                  <Download className="w-4 h-4 mr-1" /> Download PDF
                </button>
                <button
                  onClick={() => setReportModalOpen(false)}
                  className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Stock Snapshot</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-md px-3 py-2"><span className="text-gray-600 dark:text-gray-400">Symbol</span><span className="text-gray-900 dark:text-white font-medium">{stockData.symbol}</span></div>
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-md px-3 py-2"><span className="text-gray-600 dark:text-gray-400">Name</span><span className="text-gray-900 dark:text-white font-medium truncate">{stockData.name}</span></div>
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-md px-3 py-2"><span className="text-gray-600 dark:text-gray-400">Price</span><span className="text-gray-900 dark:text-white font-medium">{formatPrice(stockData.price || 0, stockData.currency)}</span></div>
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-md px-3 py-2"><span className="text-gray-600 dark:text-gray-400">Change</span><span className={`font-medium ${stockData.changePercent && stockData.changePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{formatChange(stockData.change || 0, stockData.currency)} ({formatChangePercent(stockData.changePercent || 0)}%)</span></div>
                  {stockData.marketCap ? (
                    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-md px-3 py-2"><span className="text-gray-600 dark:text-gray-400">Market Cap</span><span className="text-gray-900 dark:text-white font-medium">${(stockData.marketCap/1e9).toFixed(2)}B</span></div>
                  ) : null}
                  {stockData.volume ? (
                    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-md px-3 py-2"><span className="text-gray-600 dark:text-gray-400">Volume</span><span className="text-gray-900 dark:text-white font-medium">{(stockData.volume/1e6).toFixed(1)}M</span></div>
                  ) : null}
                  {typeof stockData.pe === 'number' ? (
                    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-md px-3 py-2"><span className="text-gray-600 dark:text-gray-400">P/E Ratio</span><span className="text-gray-900 dark:text-white font-medium">{stockData.pe.toFixed(2)}</span></div>
                  ) : null}
                  {typeof stockData.high === 'number' ? (
                    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-md px-3 py-2"><span className="text-gray-600 dark:text-gray-400">52W High</span><span className="text-gray-900 dark:text-white font-medium">${stockData.high.toFixed(2)}</span></div>
                  ) : null}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Summary</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">{generatedReport?.content?.summary || 'No summary available.'}</p>
              </div>

              {Array.isArray(generatedReport?.content?.highlights) && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Highlights</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {generatedReport.content.highlights.map((h: string, idx: number) => (
                      <li key={idx} className="text-sm text-gray-700 dark:text-gray-300">{h}</li>
                    ))}
                  </ul>
                </div>
              )}

              {generatedReport?.metrics && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Metrics</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(generatedReport.metrics).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-md px-3 py-2">
                        <span className="text-gray-600 dark:text-gray-400">{k}</span>
                        <span className="text-gray-900 dark:text-white font-medium">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
