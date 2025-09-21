import React from 'react';
import { motion } from 'framer-motion';
import { Coins, Lock, Zap } from 'lucide-react';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { useDummyAccount } from '../contexts/DummyAccountContext';

interface FeatureAccessGuardProps {
  feature: 'stockAnalysis' | 'advancedPrediction' | 'portfolioTracking' | 'customAlert' | 'dataExport' | 'apiCall';
  children: React.ReactNode;
  onFeatureUse?: () => void;
  fallback?: React.ReactNode;
  className?: string;
}

const FeatureAccessGuard: React.FC<FeatureAccessGuardProps> = ({
  feature,
  children,
  onFeatureUse,
  fallback,
  className = ''
}) => {
  const { canUseFeature, getFeatureCost, isDummyAccount } = useFeatureAccess();
  const { deductZolos, zolosBalance } = useDummyAccount();

  const handleFeatureUse = async () => {
    if (!isDummyAccount) {
      onFeatureUse?.();
      return;
    }

    const cost = getFeatureCost(feature);
    const success = await deductZolos(cost);
    
    if (success) {
      onFeatureUse?.();
    }
  };

  const canUse = canUseFeature(feature);
  const cost = getFeatureCost(feature);

  if (!isDummyAccount) {
    // Live accounts have full access
    return <>{children}</>;
  }

  if (canUse) {
    // Dummy account with sufficient Zolos
    return (
      <div className={className} onClick={handleFeatureUse}>
        {children}
      </div>
    );
  }

  // Dummy account without sufficient Zolos
  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      className={`relative ${className}`}
    >
      <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-200 dark:border-gray-700 max-w-sm text-center">
          <div className="flex items-center justify-center mb-3">
            <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full">
              <Lock className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Insufficient Zolos
          </h3>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            You need {cost} Zolos to use this feature. You have {zolosBalance} Zolos remaining.
          </p>
          
          <div className="flex items-center justify-center space-x-2 text-yellow-600 dark:text-yellow-400">
            <Coins className="w-4 h-4" />
            <span className="text-sm font-medium">
              {zolosBalance} / {cost} Zolos
            </span>
          </div>
        </div>
      </div>
      
      {children}
    </motion.div>
  );
};

export default FeatureAccessGuard;
