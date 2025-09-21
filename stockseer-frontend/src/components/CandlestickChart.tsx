import React from 'react';
import type { StockChartData } from '../types/stock';
import { formatPrice } from '../utils/currency';

interface CandlestickChartProps {
  data: StockChartData[];
  chartPeriod: string;
  stockData?: { currency?: string } | null;
  onZoom?: (startIndex: number, endIndex: number) => void;
  zoomState?: {
    isZoomed: boolean;
    startIndex: number;
    endIndex: number;
  };
  onResetZoom?: () => void;
}

export default function CandlestickChart({ 
  data, 
  chartPeriod, 
  stockData,
  onZoom,
  zoomState,
  onResetZoom 
}: CandlestickChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-gray-600 dark:text-gray-400 py-8">
        <p>No candlestick data available</p>
      </div>
    );
  }

  const minPrice = Math.min(...data.map(d => d.low));
  const maxPrice = Math.max(...data.map(d => d.high));
  const priceRange = maxPrice - minPrice;
  const xStep = 1400 / (data.length - 1);
  const yScale = 600 / priceRange;

  return (
    <div className="relative w-full h-full">
      <svg 
        className={`w-full h-full ${data.length > 10 ? 'cursor-pointer' : ''}`}
        viewBox={`0 0 ${1400} ${700}`} 
        preserveAspectRatio="xMidYMid meet"
        onClick={(e) => {
          if (!zoomState?.isZoomed && data.length > 10 && onZoom) {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const clickedIndex = Math.round(x / xStep);
            
            // Calculate zoom range (show 20% of data around clicked point)
            const zoomRange = Math.max(5, Math.floor(data.length * 0.2));
            const startIndex = Math.max(0, clickedIndex - Math.floor(zoomRange / 2));
            const endIndex = Math.min(data.length - 1, startIndex + zoomRange - 1);
            
            onZoom(startIndex, endIndex);
          }
        }}
        onDoubleClick={() => {
          if (zoomState?.isZoomed && onResetZoom) {
            onResetZoom();
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
        {[0, 0.2, 0.4, 0.6, 0.8, 1].map((ratio, i) => {
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
        })}
       
        {/* X-axis labels */}
        {(() => {
          const labelInterval = Math.max(1, Math.floor(data.length / 10));
          return data.map((item, index) => {
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
        {data.map((item, index) => {
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
              height={Math.max(2, (item.volume / Math.max(...data.map(d => d.volume))) * 80)}
              fill={isGreen ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}
              stroke={isGreen ? 'rgba(34, 197, 94, 0.7)' : 'rgba(239, 68, 68, 0.7)'}
              strokeWidth="0.5"
              rx="1"
            />
          </g>
         );
       })}
     </svg>
     
     {/* Volume Label */}
     <div className="absolute bottom-2 left-4 text-slate-400 text-sm font-mono">
       Volume
     </div>
     
     {/* Price range info */}
     <div className="absolute top-4 right-4 text-slate-400 text-sm font-mono">
       {data.length > 0 && (
         <>
           <div>Range: ${Math.min(...data.map(d => d.low)).toFixed(2)} - ${Math.max(...data.map(d => d.high)).toFixed(2)}</div>
           <div>Points: {data.length}</div>
           {zoomState?.isZoomed && (
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
  );
}
