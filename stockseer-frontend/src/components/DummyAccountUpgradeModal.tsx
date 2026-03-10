import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Crown, CheckCircle, ArrowRight } from 'lucide-react';
import { useDummyAccount } from '../contexts/DummyAccountContext';
import { useSubscription } from '../contexts/SubscriptionContext';

interface DummyAccountUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

const DummyAccountUpgradeModal: React.FC<DummyAccountUpgradeModalProps> = ({
  isOpen,
  onClose,
  onUpgrade
}) => {
  const { zolosBalance } = useDummyAccount();
  const { setCurrentPlan } = useSubscription();

  const handleUpgrade = () => {
    setCurrentPlan('premium-plus');
    onUpgrade();
    onClose();
  };

  const features = [
    'Unlimited market access',
    'Advanced AI predictions',
    'Portfolio tracking',
    'Custom alerts',
    'Data export',
    'API access',
    'Priority support'
  ];

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
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center mb-4">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Upgrade to Live Account
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Your trial with {zolosBalance} Zolos is ending. Upgrade to continue using premium features.
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Current Status */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium text-yellow-800 dark:text-yellow-200">
                    Trial Account Status
                  </span>
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  You're currently using a dummy account with virtual currency. 
                  Upgrade to unlock all features permanently.
                </p>
              </div>

              {/* Features */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  What you'll get with a Live Account:
                </h3>
                <div className="space-y-3">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    $59<span className="text-lg text-gray-500">/month</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Premium Plus Plan
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleUpgrade}
                  className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2"
                >
                  <span>Upgrade to Live Account</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                
                <button
                  onClick={onClose}
                  className="w-full text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium py-2 px-6 rounded-lg transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DummyAccountUpgradeModal;
