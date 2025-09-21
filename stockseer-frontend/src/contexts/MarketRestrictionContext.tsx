import React, { createContext, useContext, useState, ReactNode } from 'react';

interface MarketRestrictionDetails {
  market: string;
  currentPlan: string;
  requiredPlan: string;
  message: string;
  details: string;
  availableMarkets: string[];
  upgradeUrl: string;
}

interface MarketRestrictionContextType {
  showRestrictionModal: boolean;
  restrictionDetails: MarketRestrictionDetails | null;
  showMarketRestriction: (details: MarketRestrictionDetails) => void;
  hideMarketRestriction: () => void;
  handleUpgrade: () => void;
}

const MarketRestrictionContext = createContext<MarketRestrictionContextType | undefined>(undefined);

export const useMarketRestriction = (): MarketRestrictionContextType => {
  const context = useContext(MarketRestrictionContext);
  if (context === undefined) {
    throw new Error('useMarketRestriction must be used within a MarketRestrictionProvider');
  }
  return context;
};

interface MarketRestrictionProviderProps {
  children: ReactNode;
}

export const MarketRestrictionProvider: React.FC<MarketRestrictionProviderProps> = ({ children }) => {
  const [showRestrictionModal, setShowRestrictionModal] = useState(false);
  const [restrictionDetails, setRestrictionDetails] = useState<MarketRestrictionDetails | null>(null);

  const showMarketRestriction = (details: MarketRestrictionDetails) => {
    setRestrictionDetails(details);
    setShowRestrictionModal(true);
  };

  const hideMarketRestriction = () => {
    setShowRestrictionModal(false);
    setRestrictionDetails(null);
  };

  const handleUpgrade = () => {
    // Navigate to pricing page or handle upgrade
    window.location.href = '/pricing';
    hideMarketRestriction();
  };

  const value: MarketRestrictionContextType = {
    showRestrictionModal,
    restrictionDetails,
    showMarketRestriction,
    hideMarketRestriction,
    handleUpgrade
  };

  return (
    <MarketRestrictionContext.Provider value={value}>
      {children}
    </MarketRestrictionContext.Provider>
  );
};
