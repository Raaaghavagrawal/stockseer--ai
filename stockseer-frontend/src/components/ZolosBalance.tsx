import React from 'react';
import { motion } from 'framer-motion';
import { Coins, Zap } from 'lucide-react';
import { useDummyAccount } from '../contexts/DummyAccountContext';

interface ZolosBalanceProps {
  className?: string;
  showUpgradeButton?: boolean;
  onUpgradeClick?: () => void;
}

const ZolosBalance: React.FC<ZolosBalanceProps> = ({ 
  className = '', 
  showUpgradeButton = false,
  onUpgradeClick 
}) => {
  const { isDummyAccount, zolosBalance, showUpgradePrompt } = useDummyAccount();

  if (!isDummyAccount) {
    return null;
  }

  const getBalanceColor = () => {
    if (zolosBalance <= 100) return 'text-red-500';
    if (zolosBalance <= 500) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getBalanceStatus = () => {
    if (zolosBalance <= 100) return 'Low Balance';
    if (zolosBalance <= 500) return 'Running Low';
    return 'Good';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-yellow-100 dark:bg-yellow-800 p-2 rounded-full">
            <Coins className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Zolos Balance
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                zolosBalance <= 100 
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : zolosBalance <= 500
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              }`}>
                {getBalanceStatus()}
              </span>
            </div>
            <div className={`text-2xl font-bold ${getBalanceColor()}`}>
              {zolosBalance.toLocaleString()} Z
            </div>
          </div>
        </div>

        {showUpgradeButton && (
          <button
            onClick={onUpgradeClick}
            className="flex items-center space-x-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">Upgrade</span>
          </button>
        )}
      </div>

      {showUpgradePrompt && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg"
        >
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-700 dark:text-red-400 font-medium">
              Trial ending soon! Upgrade to continue using premium features.
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ZolosBalance;
