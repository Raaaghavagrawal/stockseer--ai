import React, { createContext, useContext, useState, useEffect } from 'react';

export type SubscriptionPlan = 'free' | 'premium' | 'premium-plus';
export type Continent = 'asia' | 'americas' | 'europe' | 'oceania' | 'africa' | 'global';

interface SubscriptionContextType {
  currentPlan: SubscriptionPlan;
  setCurrentPlan: (plan: SubscriptionPlan) => void;
  selectedContinent: Continent | null;
  setSelectedContinent: (continent: Continent) => void;
  showFreePlanNotification: boolean;
  setShowFreePlanNotification: (show: boolean) => void;
  isTrialActive: boolean;
  trialEndDate: Date | null;
  canAccessMarket: (market: string) => boolean;
  getAvailableMarkets: () => string[];
  getContinentPlan: (continent: Continent) => SubscriptionPlan;
  getPlanLimits: () => {
    maxWatchlistItems: number;
    maxPortfolios: number;
    hasAPIAccess: boolean;
    hasAdvancedAI: boolean;
    hasCustomAlerts: boolean;
    hasDataExport: boolean;
  };
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// Market definitions by plan
const MARKET_ACCESS = {
  free: [
    'NIKKEI', 'TSE', 'SSE', 'SZSE', 'NSE', 'BSE', 'KRX', 'SGX'
  ],
  premium: [
    // All free markets
    'NIKKEI', 'TSE', 'SSE', 'SZSE', 'NSE', 'BSE', 'KRX', 'SGX',
    // Additional premium markets
    'NYSE', 'NASDAQ', 'AMEX', 'LSE', 'AIM', 'XETRA', 'FSE', 'EPA',
    'TSX', 'TSXV', 'ASX', 'HKEX', 'TWSE', 'B3', 'BMV', 'JSE',
    'SIX', 'AEX', 'BIT', 'BME', 'OMX', 'OSE', 'Euronext'
  ],
  'premium-plus': [
    // All premium markets plus additional ones
    'NIKKEI', 'TSE', 'SSE', 'SZSE', 'NSE', 'BSE', 'KRX', 'SGX',
    'NYSE', 'NASDAQ', 'AMEX', 'LSE', 'AIM', 'XETRA', 'FSE', 'EPA',
    'TSX', 'TSXV', 'ASX', 'HKEX', 'TWSE', 'B3', 'BMV', 'JSE',
    'SIX', 'AEX', 'BIT', 'BME', 'OMX', 'OSE', 'Euronext',
    // Additional premium-plus markets
    'CRYPTO', 'FOREX', 'COMMODITIES', 'BONDS', 'ETFS', 'REITS',
    'EMERGING_MARKETS', 'OTC', 'PINK_SHEETS'
  ]
};

// Plan limits
const PLAN_LIMITS = {
  free: {
    maxWatchlistItems: 5,
    maxPortfolios: 0,
    hasAPIAccess: false,
    hasAdvancedAI: false,
    hasCustomAlerts: false,
    hasDataExport: false
  },
  premium: {
    maxWatchlistItems: -1, // unlimited
    maxPortfolios: 3,
    hasAPIAccess: false,
    hasAdvancedAI: true,
    hasCustomAlerts: true,
    hasDataExport: true
  },
  'premium-plus': {
    maxWatchlistItems: -1, // unlimited
    maxPortfolios: -1, // unlimited
    hasAPIAccess: true,
    hasAdvancedAI: true,
    hasCustomAlerts: true,
    hasDataExport: true
  }
};

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan>('free');
  const [selectedContinent, setSelectedContinent] = useState<Continent | null>(null);
  const [showFreePlanNotification, setShowFreePlanNotification] = useState(false);
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [trialEndDate, setTrialEndDate] = useState<Date | null>(null);

  // Load subscription data from localStorage on mount
  useEffect(() => {
    const savedPlan = localStorage.getItem('stockseer_subscription_plan') as SubscriptionPlan;
    const savedContinent = localStorage.getItem('stockseer_selected_continent') as Continent;
    const savedTrial = localStorage.getItem('stockseer_trial_active');
    const savedTrialEnd = localStorage.getItem('stockseer_trial_end');

    if (savedPlan) {
      setCurrentPlan(savedPlan);
    }

    if (savedContinent) {
      setSelectedContinent(savedContinent);
    }

    if (savedTrial === 'true' && savedTrialEnd) {
      const trialEnd = new Date(savedTrialEnd);
      if (trialEnd > new Date()) {
        setIsTrialActive(true);
        setTrialEndDate(trialEnd);
      }
    }
  }, []);

  // Save subscription data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('stockseer_subscription_plan', currentPlan);
  }, [currentPlan]);

  useEffect(() => {
    if (selectedContinent) {
      localStorage.setItem('stockseer_selected_continent', selectedContinent);
    }
  }, [selectedContinent]);

  useEffect(() => {
    localStorage.setItem('stockseer_trial_active', isTrialActive.toString());
    if (trialEndDate) {
      localStorage.setItem('stockseer_trial_end', trialEndDate.toISOString());
    }
  }, [isTrialActive, trialEndDate]);

  const canAccessMarket = (market: string): boolean => {
    const availableMarkets = MARKET_ACCESS[currentPlan];
    return availableMarkets.includes(market.toUpperCase());
  };

  const getAvailableMarkets = (): string[] => {
    return MARKET_ACCESS[currentPlan];
  };

  const getPlanLimits = () => {
    return PLAN_LIMITS[currentPlan];
  };

  const getContinentPlan = (continent: Continent): SubscriptionPlan => {
    if (continent === 'asia') {
      return 'free';
    } else if (continent === 'global') {
      return 'premium-plus';
    } else {
      return 'premium';
    }
  };

  const handleSetCurrentPlan = (plan: SubscriptionPlan) => {
    setCurrentPlan(plan);
    
    // If upgrading to a paid plan (but not premium-plus), start trial if not already active
    if (plan !== 'free' && plan !== 'premium-plus' && !isTrialActive) {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14); // 14-day trial
      setIsTrialActive(true);
      setTrialEndDate(trialEnd);
    }
  };

  const value: SubscriptionContextType = {
    currentPlan,
    setCurrentPlan: handleSetCurrentPlan,
    selectedContinent,
    setSelectedContinent,
    showFreePlanNotification,
    setShowFreePlanNotification,
    isTrialActive,
    trialEndDate,
    canAccessMarket,
    getAvailableMarkets,
    getContinentPlan,
    getPlanLimits
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
