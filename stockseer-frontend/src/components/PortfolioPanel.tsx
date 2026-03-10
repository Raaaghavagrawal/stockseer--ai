import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Plus, Edit, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { portfolioAPI } from '../utils/api';
import type { PortfolioHolding } from '../types/stock';
import { formatCurrency, formatPercentage, getChangeColor } from '../utils/helpers';

const PortfolioPanel: React.FC = () => {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    setLoading(true);
    try {
      const data = await portfolioAPI.getPortfolio();
      setHoldings(data);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      setHoldings([]);
    } finally {
      setLoading(false);
    }
  };

  const totalValue = holdings.reduce((sum, holding) => sum + holding.totalValue, 0);
  const totalGainLoss = holdings.reduce((sum, holding) => sum + holding.gainLoss, 0);
  const totalGainLossPercent = totalValue > 0 ? (totalGainLoss / (totalValue - totalGainLoss)) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-blue-500 rounded-xl flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Portfolio</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your investment holdings</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary inline-flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Holding</span>
        </button>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card text-center"
        >
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Value</h3>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(totalValue)}
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card text-center"
        >
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Gain/Loss</h3>
          <div className={`text-3xl font-bold ${getChangeColor(totalGainLoss)}`}>
            {formatCurrency(totalGainLoss)}
          </div>
          <div className={`text-sm ${getChangeColor(totalGainLossPercent, true)}`}>
            {formatPercentage(totalGainLossPercent)}
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card text-center"
        >
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Holdings</h3>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {holdings.length}
          </div>
        </motion.div>
      </div>

      {/* Holdings Table */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Holdings</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-dark-600">
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Stock</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Shares</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Avg Price</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Current</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Total Value</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Gain/Loss</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((holding, index) => (
                <motion.tr
                  key={holding.symbol}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border-b border-gray-100 dark:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-700"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-blue-500 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-bold text-white">{holding.symbol.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{holding.symbol}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {holding.shares} shares
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right text-gray-900 dark:text-white">
                    {holding.shares.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-right text-gray-900 dark:text-white">
                    {formatCurrency(holding.avgPrice)}
                  </td>
                  <td className="py-4 px-4 text-right text-gray-900 dark:text-white">
                    {formatCurrency(holding.currentPrice)}
                  </td>
                  <td className="py-4 px-4 text-right text-gray-900 dark:text-white">
                    {formatCurrency(holding.totalValue)}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className={`font-medium ${getChangeColor(holding.gainLoss)}`}>
                      {formatCurrency(holding.gainLoss)}
                    </div>
                    <div className={`text-sm ${getChangeColor(holding.gainLossPercent, true)}`}>
                      {formatPercentage(holding.gainLossPercent)}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="p-1 hover:bg-gray-100 dark:hover:bg-dark-600 rounded transition-colors">
                        <Edit className="w-4 h-4 text-gray-500" />
                      </button>
                      <button className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Holding Form Placeholder */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New Holding</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Stock Symbol"
              className="input-field"
            />
            <input
              type="number"
              placeholder="Number of Shares"
              className="input-field"
            />
            <input
              type="number"
              placeholder="Average Price"
              className="input-field"
            />
          </div>
          <div className="flex items-center justify-end space-x-3 mt-4">
            <button
              onClick={() => setShowAddForm(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button className="btn-primary">
              Add Holding
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default PortfolioPanel;
