import React from 'react';
import { X, Lock, Crown, Globe, AlertTriangle } from 'lucide-react';

interface MarketRestrictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  restrictionDetails: {
    market: string;
    currentPlan: string;
    requiredPlan: string;
    message: string;
    details: string;
    availableMarkets: string[];
    upgradeUrl: string;
  } | null;
}

export const MarketRestrictionModal: React.FC<MarketRestrictionModalProps> = ({
  isOpen,
  onClose,
  onUpgrade,
  restrictionDetails
}) => {
  if (!isOpen || !restrictionDetails) return null;

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'free':
        return <Lock className="w-6 h-6 text-gray-500" />;
      case 'premium':
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 'premium-plus':
        return <Globe className="w-6 h-6 text-blue-500" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-orange-500" />;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'free':
        return 'text-gray-600 bg-gray-100';
      case 'premium':
        return 'text-yellow-700 bg-yellow-100';
      case 'premium-plus':
        return 'text-blue-700 bg-blue-100';
      default:
        return 'text-orange-700 bg-orange-100';
    }
  };

  const getUpgradeButtonText = () => {
    if (restrictionDetails.requiredPlan === 'premium') {
      return 'Upgrade to Premium';
    } else if (restrictionDetails.requiredPlan === 'premium-plus') {
      return 'Upgrade to Premium Plus';
    }
    return 'Upgrade Plan';
  };

  const getUpgradeButtonColor = () => {
    if (restrictionDetails.requiredPlan === 'premium') {
      return 'bg-yellow-500 hover:bg-yellow-600 text-white';
    } else if (restrictionDetails.requiredPlan === 'premium-plus') {
      return 'bg-blue-500 hover:bg-blue-600 text-white';
    }
    return 'bg-gray-500 hover:bg-gray-600 text-white';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Market Access Restricted
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {restrictionDetails.market} Market
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Current Plan Status */}
          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            {getPlanIcon(restrictionDetails.currentPlan)}
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Current Plan: {restrictionDetails.currentPlan.charAt(0).toUpperCase() + restrictionDetails.currentPlan.slice(1)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Limited to {restrictionDetails.availableMarkets.length} markets
              </p>
            </div>
          </div>

          {/* Warning Message */}
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200 font-medium">
              {restrictionDetails.message}
            </p>
            <p className="text-xs text-red-600 dark:text-red-300 mt-1">
              {restrictionDetails.details}
            </p>
          </div>

          {/* Available Markets */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Available Markets ({restrictionDetails.currentPlan.charAt(0).toUpperCase() + restrictionDetails.currentPlan.slice(1)} Plan):
            </h4>
            <div className="flex flex-wrap gap-2">
              {restrictionDetails.availableMarkets.slice(0, 6).map((market, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full"
                >
                  {market}
                </span>
              ))}
              {restrictionDetails.availableMarkets.length > 6 && (
                <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                  +{restrictionDetails.availableMarkets.length - 6} more
                </span>
              )}
            </div>
          </div>

          {/* Upgrade Benefits */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
              Upgrade Benefits:
            </h4>
            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              {restrictionDetails.requiredPlan === 'premium' && (
                <>
                  <li>• Access to {restrictionDetails.requiredPlan === 'premium' ? '50+' : '100+'} global markets</li>
                  <li>• Advanced AI predictions</li>
                  <li>• Custom alerts & notifications</li>
                  <li>• Data export capabilities</li>
                </>
              )}
              {restrictionDetails.requiredPlan === 'premium-plus' && (
                <>
                  <li>• Access to ALL markets worldwide</li>
                  <li>• Crypto, Forex & Commodities</li>
                  <li>• Unlimited portfolios</li>
                  <li>• API access</li>
                  <li>• Priority support</li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            Continue with Limited Access
          </button>
          <button
            onClick={onUpgrade}
            className={`px-6 py-2 text-sm font-medium rounded-lg transition-colors ${getUpgradeButtonColor()}`}
          >
            {getUpgradeButtonText()}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarketRestrictionModal;
