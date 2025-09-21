import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Plus, Minus, Download, BarChart3, LineChart, BarChart } from 'lucide-react';
import type { StockData, StockChartData } from '../../types/stock';
import { formatPrice, formatChange, formatChangePercent } from '../../utils/currency';
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

interface OverviewTabProps {
  stockData: StockData | null;
  watchlist: string[];
  chartData: StockChartData[];
  onAddToWatchlist: (symbol: string) => void;
  onRemoveFromWatchlist: (symbol: string) => void;
}

export default function OverviewTab({ stockData, watchlist, chartData, onAddToWatchlist, onRemoveFromWatchlist }: OverviewTabProps) {
  const [chartPeriod, setChartPeriod] = useState('1M');
  const [chartType, setChartType] = useState<'line' | 'candlestick'>('line');
  const [showHistoricalData, setShowHistoricalData] = useState(false);
  
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

      const maxPoints = periodMap[chartPeriod] || 30;
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

      const maxPoints = periodMap[chartPeriod] || 30;
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

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden">
      {/* Stock Header */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{stockData.symbol}</h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{stockData.name}</p>
          </div>
          <div className="flex items-center justify-between sm:justify-end space-x-4">
            <div className="text-left sm:text-right">
              <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{formatPrice(stockData.price || 0, stockData.currency)}</div>
              <div className={`flex items-center text-sm sm:text-base ${stockData.change && stockData.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {stockData.change && stockData.change >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                {formatChange(stockData.change || 0, stockData.currency)} ({formatChangePercent(stockData.changePercent || 0)}%)
              </div>
            </div>
            <button
              onClick={() => isInWatchlist ? onRemoveFromWatchlist(stockData.symbol) : onAddToWatchlist(stockData.symbol)}
              className={`p-2 sm:p-3 rounded-lg transition-all duration-200 ${isInWatchlist ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {isInWatchlist ? <Minus className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-white" />}
            </button>
          </div>
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

      {/* Chart Controls */}
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
                 <div className="relative w-full h-full">
                   <svg 
                     className={`w-full h-full ${candlestickData.length > 10 ? 'cursor-pointer' : ''}`}
                     viewBox={`0 0 ${1400} ${700}`} 
                     preserveAspectRatio="xMidYMid meet"
                     onClick={(e) => {
                       if (!zoomState.isZoomed && candlestickData.length > 10) {
                         const rect = e.currentTarget.getBoundingClientRect();
                         const x = e.clientX - rect.left;
                         const xStep = 1400 / (candlestickData.length - 1);
                         const clickedIndex = Math.round(x / xStep);
                         
                         // Calculate zoom range (show 20% of data around clicked point)
                         const zoomRange = Math.max(5, Math.floor(candlestickData.length * 0.2));
                         const startIndex = Math.max(0, clickedIndex - Math.floor(zoomRange / 2));
                         const endIndex = Math.min(candlestickData.length - 1, startIndex + zoomRange - 1);
                         
                         // Find the actual indices in the original data
                         const originalStartIndex = chartData.length - candlestickData.length + startIndex;
                         const originalEndIndex = chartData.length - candlestickData.length + endIndex;
                         
                         handleZoom(originalStartIndex, originalEndIndex);
                       }
                     }}
                     onDoubleClick={() => {
                       if (zoomState.isZoomed) {
                         resetZoom();
                       }
                     }}
                   >
                     {/* Grid lines */}
                     <defs>
                       <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                         <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/>
                       </pattern>
                       <pattern id="majorGrid" width="200" height="100" patternUnits="userSpaceOnUse">
                         <path d="M 200 0 L 0 0 0 100" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
                       </pattern>
                     </defs>
                     <rect width="100%" height="100%" fill="url(#grid)" />
                     <rect width="100%" height="100%" fill="url(#majorGrid)" />
                     
                     {/* Y-axis labels */}
                     {(() => {
                       const minPrice = Math.min(...candlestickData.map(d => d.low));
                       const maxPrice = Math.max(...candlestickData.map(d => d.high));
                       const priceRange = maxPrice - minPrice;
                       const yScale = 600 / priceRange;
                       
                       return [0, 0.2, 0.4, 0.6, 0.8, 1].map((ratio, i) => {
                         const price = minPrice + (priceRange * ratio);
                         const y = 600 - (price - minPrice) * yScale;
                         return (
                           <g key={i}>
                             <line x1="0" y1={y} x2="1400" y2={y} stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
                             <text
                               x="10" y={y + 5}
                               fill="rgba(255, 255, 255, 0.8)"
                               fontSize="12"
                               textAnchor="start"
                               className="font-mono"
                             >
                               {formatPrice(price, stockData?.currency)}
                             </text>
                           </g>
                         );
                       });
                     })()}
                    
                     {/* X-axis labels */}
                     {(() => {
                       const xStep = 1400 / (candlestickData.length - 1);
                       const labelInterval = Math.max(1, Math.floor(candlestickData.length / 10));
                       return candlestickData.map((item, index) => {
                         if (index % labelInterval === 0) {
                           const x = index * xStep;
                           return (
                             <g key={index}>
                               <line x1={x} y1="0" x2={x} y2="600" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
                               <text
                                 x={x} y="680"
                                 fill="rgba(255, 255, 255, 0.8)"
                                 fontSize="10"
                                 textAnchor="middle"
                                 className="font-mono"
                               >
                                 {chartPeriod === '1D' 
                                   ? new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                                   : new Date(item.date).toLocaleDateString()
                                 }
                               </text>
                             </g>
                           );
                         }
                         return null;
                       });
                     })()}
                    
                     {/* Candlesticks */}
                     {(() => {
                       const minPrice = Math.min(...candlestickData.map(d => d.low));
                       const maxPrice = Math.max(...candlestickData.map(d => d.high));
                       const priceRange = maxPrice - minPrice;
                       const xStep = 1400 / (candlestickData.length - 1);
                       const yScale = 600 / priceRange;
                       
                       return candlestickData.map((item, index) => {
                         const x = index * xStep;
                         const isGreen = item.close >= item.open;
                         const color = isGreen ? '#22c55e' : '#ef4444';
                         const fillColor = isGreen ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)';
                         
                         // Calculate positions
                         const highY = 600 - ((item.high - minPrice) * yScale);
                         const lowY = 600 - ((item.low - minPrice) * yScale);
                         const openY = 600 - ((item.open - minPrice) * yScale);
                         const closeY = 600 - ((item.close - minPrice) * yScale);
                         
                         // Dynamic body width based on data density
                         const bodyWidth = Math.max(2, Math.min(8, xStep * 0.8));
                         const bodyX = x - bodyWidth / 2;
                         
                         // Wick width
                         const wickWidth = Math.max(1, bodyWidth * 0.3);
                        
                        return (
                          <g key={index} className="candlestick-group">
                            {/* High-Low wick */}
                            <line
                              x1={x} y1={highY} x2={x} y2={lowY}
                              stroke={color}
                              strokeWidth={wickWidth}
                              strokeLinecap="round"
                            />
                            
                            {/* Open tick */}
                            <line
                              x1={x - bodyWidth/2} y1={openY} x2={x} y2={openY}
                              stroke={color}
                              strokeWidth={wickWidth}
                              strokeLinecap="round"
                            />
                            
                            {/* Close tick */}
                            <line
                              x1={x} y1={closeY} x2={x + bodyWidth/2} y2={closeY}
                              stroke={color}
                              strokeWidth={wickWidth}
                              strokeLinecap="round"
                            />
                            
                            {/* Body */}
                            <rect
                              x={bodyX}
                              y={Math.min(openY, closeY)}
                              width={bodyWidth}
                              height={Math.max(1, Math.abs(closeY - openY))}
                              fill={fillColor}
                              stroke={color}
                              strokeWidth="0.5"
                              rx="1"
                            />
                            
                            {/* Interactive area for tooltip */}
                            <rect
                              x={x - xStep / 2} y="0"
                              width={xStep} height="600"
                              fill="transparent"
                              className="cursor-pointer"
                              onMouseEnter={(e) => {
                                const tooltip = document.getElementById('chart-tooltip');
                                if (tooltip) {
                                  const change = item.close - item.open;
                                  const changePercent = ((change / item.open) * 100);
                                  const isPositive = change >= 0;
                                  
                                  tooltip.innerHTML = `
                                    <div class="bg-slate-800 border border-slate-600 text-white p-4 rounded-lg shadow-xl min-w-[200px]">
                                      <div class="font-bold text-lg mb-2 text-white">
                                        ${chartPeriod === '1D' 
                                          ? new Date(item.date).toLocaleString()
                                          : new Date(item.date).toLocaleDateString()
                                        }
                                      </div>
                                      <div class="space-y-2">
                                        <div class="flex justify-between">
                                          <span class="text-slate-300">Open:</span>
                                          <span class="text-blue-400 font-mono">$${item.open.toFixed(2)}</span>
                                        </div>
                                        <div class="flex justify-between">
                                          <span class="text-slate-300">High:</span>
                                          <span class="text-green-400 font-mono">$${item.high.toFixed(2)}</span>
                                        </div>
                                        <div class="flex justify-between">
                                          <span class="text-slate-300">Low:</span>
                                          <span class="text-red-400 font-mono">$${item.low.toFixed(2)}</span>
                                        </div>
                                        <div class="flex justify-between">
                                          <span class="text-slate-300">Close:</span>
                                          <span class="text-yellow-400 font-mono">$${item.close.toFixed(2)}</span>
                                        </div>
                                        <div class="flex justify-between">
                                          <span class="text-slate-300">Change:</span>
                                          <span class="font-mono ${isPositive ? 'text-green-400' : 'text-red-400'}">
                                            ${isPositive ? '+' : ''}${change.toFixed(2)} (${isPositive ? '+' : ''}${changePercent.toFixed(2)}%)
                                          </span>
                                        </div>
                                        <div class="border-t border-slate-600 pt-2 mt-2">
                                          <div class="flex justify-between">
                                            <span class="text-slate-300">Volume:</span>
                                            <span class="text-purple-400 font-mono">${(item.volume / 1e6).toFixed(1)}M</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  `;
                                  tooltip.style.display = 'block';
                                  tooltip.style.left = e.clientX + 15 + 'px';
                                  tooltip.style.top = e.clientY - 15 + 'px';
                                }
                              }}
                              onMouseLeave={() => {
                                const tooltip = document.getElementById('chart-tooltip');
                                if (tooltip) {
                                  tooltip.style.display = 'none';
                                }
                              }}
                            />
                            
                           {/* Volume bar */}
                           <rect
                             x={x - xStep * 0.4} y="610"
                             width={xStep * 0.8} 
                             height={Math.max(2, (item.volume / Math.max(...candlestickData.map(d => d.volume))) * 80)}
                             fill={isGreen ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}
                             stroke={isGreen ? 'rgba(34, 197, 94, 0.7)' : 'rgba(239, 68, 68, 0.7)'}
                             strokeWidth="0.5"
                             rx="1"
                           />
                         </g>
                        );
                       });
                     })()}
                   </svg>
                   
                   {/* Volume Label */}
                   <div className="absolute bottom-2 left-4 text-slate-400 text-sm font-mono">
                     Volume
                   </div>
                   
                   {/* Price range info */}
                   <div className="absolute top-4 right-4 text-slate-400 text-sm font-mono">
                     {candlestickData.length > 0 && (
                       <>
                         <div>Range: ${Math.min(...candlestickData.map(d => d.low)).toFixed(2)} - ${Math.max(...candlestickData.map(d => d.high)).toFixed(2)}</div>
                         <div>Points: {candlestickData.length}</div>
                         {zoomState.isZoomed && (
                           <div className="text-orange-400">Zoomed: {zoomState.startIndex + 1}-{zoomState.endIndex + 1}</div>
                         )}
                       </>
                     )}
                   </div>
                   
                   {/* Tooltip */}
                   <div 
                     id="chart-tooltip" 
                     className="fixed z-50 pointer-events-none hidden"
                     style={{ zIndex: 9999 }}
                   />
                 </div>
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
    </div>
  );
}
