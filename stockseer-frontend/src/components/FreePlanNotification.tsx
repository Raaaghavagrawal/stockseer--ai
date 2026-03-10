import { useState, useEffect } from 'react';
import { CheckCircle, Crown, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FreePlanNotificationProps {
  isVisible: boolean;
  onClose: () => void;
  continent: string;
}

export default function FreePlanNotification({ isVisible, onClose, continent }: FreePlanNotificationProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      // Auto-hide after 8 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div
        className={`transform transition-all duration-300 ${
          isAnimating
            ? 'translate-x-0 opacity-100 scale-100'
            : 'translate-x-full opacity-0 scale-95'
        }`}
      >
        <div className="bg-white dark:bg-binance-gray-light rounded-xl shadow-2xl border border-green-200 dark:border-green-800 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-white" />
                <h3 className="text-white font-semibold text-sm">Free Plan Active</h3>
              </div>
              <button
                onClick={handleClose}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="space-y-3">
              <div>
                <h4 className="text-gray-900 dark:text-white font-semibold text-sm mb-1">
                  Welcome to {continent} Markets!
                </h4>
                <p className="text-gray-600 dark:text-binance-text-secondary text-xs leading-relaxed">
                  You're now using the free plan with access to Asian markets. 
                  Enjoy basic features and start your trading journey!
                </p>
              </div>

              {/* Features List */}
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-binance-text-secondary">
                  <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                  <span>Asian market data</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-binance-text-secondary">
                  <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                  <span>Basic stock analysis</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-binance-text-secondary">
                  <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                  <span>Limited watchlist (5 stocks)</span>
                </div>
              </div>

              {/* Upgrade CTA */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center space-x-2 mb-2">
                  <Crown className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-xs font-semibold text-purple-800 dark:text-purple-300">
                    Want More Markets?
                  </span>
                </div>
                <p className="text-xs text-purple-700 dark:text-purple-400 mb-3">
                  Upgrade to Premium for access to 20+ global markets, advanced AI predictions, and more features.
                </p>
                <Link
                  to="/pricing"
                  className="inline-flex items-center space-x-1 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                  onClick={handleClose}
                >
                  <span>View Pricing Plans</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-2">
                <button
                  onClick={handleClose}
                  className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 dark:text-binance-text-secondary hover:text-gray-800 dark:hover:text-white transition-colors"
                >
                  Dismiss
                </button>
                <Link
                  to="/pricing"
                  className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white text-xs font-semibold px-3 py-2 rounded-lg text-center transition-all duration-200 hover:scale-105"
                  onClick={handleClose}
                >
                  Upgrade Now
                </Link>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-1 bg-gray-200 dark:bg-binance-gray">
            <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
