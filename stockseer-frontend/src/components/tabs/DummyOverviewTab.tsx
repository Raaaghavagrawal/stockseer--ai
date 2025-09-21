import { useState } from 'react';
import { TrendingUp, TrendingDown, Plus, Minus, BarChart3 } from 'lucide-react';
import type { StockData, StockChartData } from '../../types/stock';
import { formatPrice, formatChange, formatChangePercent } from '../../utils/currency';
import { useDummyAccount } from '../../contexts/DummyAccountContext';
import FeatureAccessGuard from '../FeatureAccessGuard';
import InvestmentModal from '../InvestmentModal';

interface DummyOverviewTabProps {
  stockData: StockData | null;
  watchlist: string[];
  chartData: StockChartData[];
  onAddToWatchlist: (symbol: string) => void;
  onRemoveFromWatchlist: (symbol: string) => void;
}

export default function DummyOverviewTab({ stockData, watchlist, onAddToWatchlist, onRemoveFromWatchlist }: DummyOverviewTabProps) {
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);
  
  const { 
    holdings
  } = useDummyAccount();

  // Get current holding for this stock
  const currentHolding = holdings.find(h => h.symbol === stockData?.symbol);

  if (!stockData) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <BarChart3 className="w-16 h-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
          No Stock Selected
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Search for a stock symbol to view its overview and make investments
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
            {/* Investment Button */}
            <FeatureAccessGuard feature="stockAnalysis">
              <button
                onClick={() => setShowInvestmentModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-binance-yellow to-binance-yellow-dark hover:from-binance-yellow-dark hover:to-binance-yellow text-binance-gray-dark rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-4 h-4" />
                Invest with Zolos
              </button>
            </FeatureAccessGuard>
            
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

      {/* Investment Modal */}
      <InvestmentModal
        isOpen={showInvestmentModal}
        onClose={() => setShowInvestmentModal(false)}
        symbol={stockData.symbol}
        stockName={stockData.name}
        currentPrice={stockData.price || 0}
        currency={stockData.currency || 'USD'}
      />
    </div>
  );
}
