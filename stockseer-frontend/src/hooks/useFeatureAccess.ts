import { useSubscription } from '../contexts/SubscriptionContext';
import { useDummyAccount } from '../contexts/DummyAccountContext';

export const useFeatureAccess = () => {
  const { currentPlan, canAccessMarket, getPlanLimits } = useSubscription();
  const { isDummyAccount, zolosBalance, canAfford } = useDummyAccount();

  // Define Zolos costs for different features
  const ZOLOS_COSTS = {
    stockAnalysis: 10,
    advancedPrediction: 25,
    portfolioTracking: 15,
    customAlert: 5,
    dataExport: 20,
    apiCall: 2
  };

  const canUseFeature = (feature: keyof typeof ZOLOS_COSTS): boolean => {
    // Live accounts have full access based on their subscription plan
    if (!isDummyAccount) {
      return true; // Live accounts have full access
    }

    // Dummy accounts need sufficient Zolos balance
    return canAfford(ZOLOS_COSTS[feature]);
  };

  const getFeatureCost = (feature: keyof typeof ZOLOS_COSTS): number => {
    return ZOLOS_COSTS[feature];
  };

  const canAccessMarketWithZolos = (market: string): boolean => {
    // First check if the market is accessible with current plan
    if (!canAccessMarket(market)) {
      return false;
    }

    // For dummy accounts, check if they can afford the market access cost
    if (isDummyAccount) {
      return canAfford(ZOLOS_COSTS.stockAnalysis);
    }

    return true;
  };

  const getEffectivePlan = (): string => {
    if (isDummyAccount) {
      return 'dummy';
    }
    return currentPlan;
  };

  const getPlanLimitsWithZolos = () => {
    const baseLimits = getPlanLimits();
    
    if (isDummyAccount) {
      // Dummy accounts get premium-plus features but with Zolos restrictions
      return {
        ...baseLimits,
        maxWatchlistItems: -1, // unlimited
        maxPortfolios: -1, // unlimited
        hasAPIAccess: true,
        hasAdvancedAI: true,
        hasCustomAlerts: true,
        hasDataExport: true,
        isDummyAccount: true,
        zolosBalance: zolosBalance
      };
    }

    return {
      ...baseLimits,
      isDummyAccount: false,
      zolosBalance: 0
    };
  };

  return {
    canUseFeature,
    getFeatureCost,
    canAccessMarketWithZolos,
    getEffectivePlan,
    getPlanLimitsWithZolos,
    isDummyAccount,
    zolosBalance,
    ZOLOS_COSTS
  };
};
