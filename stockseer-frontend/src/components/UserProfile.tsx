import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  X, 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3,
  Settings,
  LogOut,
  Crown
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDummyAccount } from '../contexts/DummyAccountContext';
import { useLiveAccount } from '../contexts/LiveAccountContext';
import { formatPrice, formatChangePercent } from '../utils/currency';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ isOpen, onClose }) => {
  const { currentUser, logout } = useAuth();
  const { isDummyAccount, zolosBalance, portfolio, holdings } = useDummyAccount();
  const { isLiveAccount, accountData } = useLiveAccount();
  const [activeTab, setActiveTab] = useState<'profile' | 'holdings' | 'settings'>('profile');

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getPerformanceColor = (value: number) => {
    if (value > 0) return 'text-green-600 dark:text-green-400';
    if (value < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getPerformanceIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-4 h-4" />;
    if (value < 0) return <TrendingDown className="w-4 h-4" />;
    return <BarChart3 className="w-4 h-4" />;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="relative p-6 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
              
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {currentUser?.displayName || 'User'}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {currentUser?.email}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    {isDummyAccount && (
                      <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 text-xs font-medium rounded-full">
                        Dummy Account
                      </span>
                    )}
                    {isLiveAccount && (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 text-xs font-medium rounded-full">
                        Live Account
                      </span>
                    )}
                    {accountData?.subscriptionPlan && accountData.subscriptionPlan !== 'free' && (
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200 text-xs font-medium rounded-full flex items-center space-x-1">
                        <Crown className="w-3 h-3" />
                        <span>{accountData.subscriptionPlan}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'profile', label: 'Profile', icon: User },
                  { id: 'holdings', label: 'Holdings', icon: BarChart3 },
                  { id: 'settings', label: 'Settings', icon: Settings }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="p-6 max-h-96 overflow-y-auto">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  {/* Account Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {isDummyAccount && (
                      <>
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <Coins className="w-5 h-5 text-yellow-600" />
                            <span className="font-medium text-yellow-800 dark:text-yellow-200">Zolos Balance</span>
                          </div>
                          <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">
                            {zolosBalance.toLocaleString()} Z
                          </div>
                          <div className="text-sm text-yellow-600 dark:text-yellow-400">
                            ≈ {formatPrice(zolosBalance * 10, 'USD')}
                          </div>
                        </div>

                        {portfolio && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <DollarSign className="w-5 h-5 text-blue-600" />
                              <span className="font-medium text-blue-800 dark:text-blue-200">Portfolio Value</span>
                            </div>
                            <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                              {formatPrice(portfolio.totalValue, 'USD')}
                            </div>
                            <div className={`text-sm flex items-center space-x-1 ${getPerformanceColor(portfolio.totalGainLossPercent)}`}>
                              {getPerformanceIcon(portfolio.totalGainLossPercent)}
                              <span>{formatChangePercent(portfolio.totalGainLossPercent)}</span>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {isLiveAccount && accountData && (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Crown className="w-5 h-5 text-green-600" />
                          <span className="font-medium text-green-800 dark:text-green-200">Subscription Plan</span>
                        </div>
                        <div className="text-2xl font-bold text-green-800 dark:text-green-200 capitalize">
                          {accountData.subscriptionPlan}
                        </div>
                        <div className="text-sm text-green-600 dark:text-green-400">
                          Research & Development Account
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Account Details */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">Account Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Account Type:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {isDummyAccount ? 'Dummy Account' : isLiveAccount ? 'Live Account' : 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Member Since:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      {isDummyAccount && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Holdings:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {holdings.length} stocks
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Holdings Tab */}
              {activeTab === 'holdings' && (
                <div>
                  {isDummyAccount ? (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Your Holdings
                      </h3>
                      {holdings.length === 0 ? (
                        <div className="text-center py-8">
                          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            No Holdings Yet
                          </h4>
                          <p className="text-gray-600 dark:text-gray-400">
                            Start investing to build your portfolio
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {holdings.map((holding, index) => (
                            <motion.div
                              key={holding.symbol}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {holding.symbol}
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {holding.shares} shares
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {formatPrice(holding.totalValue, 'USD')}
                                  </div>
                                  <div className={`text-sm flex items-center space-x-1 ${getPerformanceColor(holding.gainLossPercent)}`}>
                                    {getPerformanceIcon(holding.gainLossPercent)}
                                    <span>{formatChangePercent(holding.gainLossPercent)}</span>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No Holdings Available
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400">
                        Live accounts focus on research and analysis, not trading
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Account Settings
                  </h3>
                  
                  <div className="space-y-3">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <LogOut className="w-5 h-5 text-red-600" />
                      <span className="font-medium text-red-800 dark:text-red-200">Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UserProfile;
