import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, DollarSign, Coins, AlertCircle, CheckCircle } from 'lucide-react';
import { useDummyAccount } from '../contexts/DummyAccountContext';
import { formatPrice } from '../utils/currency';

interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  stockName: string;
  currentPrice: number;
  currency: string;
  aiPrediction?: {
    predictedPrice: number;
    confidence: number;
    prediction: 'bullish' | 'bearish' | 'neutral';
    reasoning: string;
  };
}

const InvestmentModal: React.FC<InvestmentModalProps> = ({
  isOpen,
  onClose,
  symbol,
  stockName,
  currentPrice,
  currency,
  aiPrediction
}) => {
  const { zolosBalance, makeInvestment, getZolosToCurrency } = useDummyAccount();
  const [zolosAmount, setZolosAmount] = useState<number>(0);
  const [isInvesting, setIsInvesting] = useState(false);
  const [investmentSuccess, setInvestmentSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setZolosAmount(0);
      setIsInvesting(false);
      setInvestmentSuccess(false);
      setErrorMessage('');
    }
  }, [isOpen]);

  const handleInvestment = async () => {
    if (zolosAmount <= 0 || zolosAmount > zolosBalance) {
      setErrorMessage('Invalid investment amount');
      return;
    }

    // Check if investment would result in at least 1 share
    const currencyValue = getZolosToCurrency(zolosAmount);
    const shares = Math.floor(currencyValue / currentPrice);
    
    if (shares <= 0) {
      setErrorMessage(`Minimum investment required: ${Math.ceil(currentPrice / 10)} Zolos (1 share)`);
      return;
    }

    setIsInvesting(true);
    setErrorMessage('');
    
    try {
      const success = await makeInvestment(symbol, zolosAmount, currentPrice, aiPrediction);
      if (success) {
        setInvestmentSuccess(true);
        // Show success message for 2 seconds then close
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        // Handle investment failure
        setErrorMessage('Investment failed. Please check your balance and try again.');
      }
    } catch (error) {
      console.error('Investment failed:', error);
      setErrorMessage('An error occurred. Please try again.');
    } finally {
      setIsInvesting(false);
    }
  };

  const quickAmounts = [100, 500, 1000, 2000];
  // Convert Zolos to currency first, then calculate shares
  const currencyValue = getZolosToCurrency(zolosAmount);
  const shares = currencyValue > 0 ? Math.floor(currencyValue / currentPrice) : 0;

  const getPredictionColor = (prediction: string) => {
    switch (prediction) {
      case 'bullish': return 'text-green-600 dark:text-green-400';
      case 'bearish': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getPredictionIcon = (prediction: string) => {
    switch (prediction) {
      case 'bullish': return <TrendingUp className="w-4 h-4" />;
      case 'bearish': return <TrendingDown className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
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
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="relative p-6 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
              
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mb-4">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Invest in {symbol}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {stockName}
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {investmentSuccess ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Investment Successful!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    You've invested {zolosAmount} Zolos in {symbol}
                  </p>
                </div>
              ) : (
                <>
                  {/* Current Price & AI Prediction */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Current Price</span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatPrice(currentPrice, currency)}
                      </span>
                    </div>
                    
                    {aiPrediction && (
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mt-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">AI Prediction</span>
                          <div className={`flex items-center space-x-1 ${getPredictionColor(aiPrediction.prediction)}`}>
                            {getPredictionIcon(aiPrediction.prediction)}
                            <span className="text-sm font-medium capitalize">{aiPrediction.prediction}</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Confidence: {(aiPrediction.confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Zolos Balance */}
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Coins className="w-5 h-5 text-yellow-600" />
                        <span className="font-medium text-yellow-800 dark:text-yellow-200">Available Zolos</span>
                      </div>
                      <span className="text-lg font-bold text-yellow-800 dark:text-yellow-200">
                        {zolosBalance.toLocaleString()} Z
                      </span>
                    </div>
                    <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                      1 Zolo = 10 {currency} • ≈ {formatPrice(zolosBalance * 10, currency)} available
                    </div>
                  </div>

                  {/* Investment Amount */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Investment Amount (Zolos)
                    </label>
                    <input
                      type="number"
                      value={zolosAmount || ''}
                      onChange={(e) => setZolosAmount(Number(e.target.value))}
                      placeholder="Enter amount in Zolos"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                      min="1"
                      max={zolosBalance}
                    />
                    
                    {/* Quick Amount Buttons */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {quickAmounts.map((amount) => (
                        <button
                          key={amount}
                          onClick={() => setZolosAmount(Math.min(amount, zolosBalance))}
                          className={`px-3 py-1 text-sm rounded-full transition-colors ${
                            zolosAmount === amount
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                          }`}
                        >
                          {amount}Z
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Investment Summary */}
                  {zolosAmount > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
                      <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Investment Summary</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-blue-700 dark:text-blue-300">Zolos Amount:</span>
                          <span className="font-medium text-blue-800 dark:text-blue-200">{zolosAmount.toLocaleString()} Z</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700 dark:text-blue-300">Currency Value:</span>
                          <span className="font-medium text-blue-800 dark:text-blue-200">
                            {formatPrice(currencyValue, currency)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700 dark:text-blue-300">Price per Share:</span>
                          <span className="font-medium text-blue-800 dark:text-blue-200">
                            {formatPrice(currentPrice, currency)}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-blue-200 dark:border-blue-600 pt-1 mt-2">
                          <span className="text-blue-700 dark:text-blue-300 font-medium">Shares to Purchase:</span>
                          <span className="font-bold text-blue-800 dark:text-blue-200">{shares}</span>
                        </div>
                        {shares > 0 && (
                          <div className="flex justify-between">
                            <span className="text-blue-700 dark:text-blue-300">Total Investment Value:</span>
                            <span className="font-medium text-blue-800 dark:text-blue-200">
                              {formatPrice(shares * currentPrice, currency)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {errorMessage && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3 mb-4">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-700 dark:text-red-400">{errorMessage}</span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={handleInvestment}
                      disabled={zolosAmount <= 0 || zolosAmount > zolosBalance || shares <= 0 || isInvesting}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {isInvesting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Investing...</span>
                        </>
                      ) : (
                        <>
                          <DollarSign className="w-5 h-5" />
                          <span>Invest {zolosAmount > 0 ? `${zolosAmount} Zolos` : 'Now'}</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={onClose}
                      className="w-full text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium py-2 px-6 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InvestmentModal;