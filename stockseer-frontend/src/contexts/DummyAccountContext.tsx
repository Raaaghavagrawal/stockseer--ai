import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Dummy Account Types
export interface DummyPortfolio {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  zolosBalance: number;
  holdings: DummyStockHolding[];
  lastUpdated: string;
}

export interface DummyStockHolding {
  symbol: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  totalValue: number;
  totalCost: number;
  gainLoss: number;
  gainLossPercent: number;
  lastUpdated: string;
}

export interface DummyTransaction {
  id: string;
  userId: string;
  symbol: string;
  transactionType: 'buy' | 'sell';
  shares: number;
  price: number;
  totalValue: number;
  zolosUsed: number;
  timestamp: string;
  aiPrediction?: any;
}

export interface DummyInvestment {
  symbol: string;
  zolosAmount: number;
  shares: number;
  price: number;
  timestamp: string;
  aiPrediction?: any;
}

interface DummyAccountContextType {
  // Account Status
  isDummyAccount: boolean;
  zolosBalance: number;
  
  // Portfolio
  portfolio: DummyPortfolio | null;
  holdings: DummyStockHolding[];
  transactions: DummyTransaction[];
  
  // Investment Functions
  makeInvestment: (symbol: string, zolosAmount: number, currentPrice: number, aiPrediction?: any) => Promise<boolean>;
  sellStock: (symbol: string, shares: number, currentPrice: number) => Promise<boolean>;
  
  // Portfolio Management
  loadPortfolio: () => Promise<void>;
  refreshPortfolio: () => Promise<void>;
  updateZolosBalance: (newBalance: number) => Promise<void>;
  
  // Utility Functions
  canAfford: (amount: number) => boolean;
  getZolosToCurrency: (zolos: number) => number;
  getCurrencyToZolos: (currency: number) => number;
  
  // UI State
  showUpgradePrompt: boolean;
  setShowUpgradePrompt: (show: boolean) => void;
}

const DummyAccountContext = createContext<DummyAccountContextType | undefined>(undefined);

interface DummyAccountProviderProps {
  children: ReactNode;
}

export const DummyAccountProvider: React.FC<DummyAccountProviderProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const [isDummyAccount, setIsDummyAccount] = useState(false);
  const [zolosBalance, setZolosBalance] = useState(0);
  const [portfolio, setPortfolio] = useState<DummyPortfolio | null>(null);
  const [holdings, setHoldings] = useState<DummyStockHolding[]>([]);
  const [transactions, setTransactions] = useState<DummyTransaction[]>([]);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Zolos to Currency conversion: 1 Zolo = 10 of any currency
  const ZOLOS_TO_CURRENCY_RATE = 10;

  // Load user account data when currentUser changes
  useEffect(() => {
    const loadUserData = async () => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const accountType = userData.accountType || 'live';
            setIsDummyAccount(accountType === 'dummy');
            setZolosBalance(userData.zolosBalance || 0);
            
            if (accountType === 'dummy') {
              await loadPortfolio();
            }
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      } else {
        setIsDummyAccount(false);
        setZolosBalance(0);
        setPortfolio(null);
        setHoldings([]);
        setTransactions([]);
        setShowUpgradePrompt(false);
      }
    };

    loadUserData();
  }, [currentUser]);

  const loadPortfolio = async () => {
    if (!currentUser || !isDummyAccount) return;

    try {
      // Load portfolio from backend
      const response = await fetch(`http://localhost:8000/dummy-portfolio/${currentUser.uid}`);
      if (response.ok) {
        const portfolioData = await response.json();
        setPortfolio(portfolioData);
        setHoldings(portfolioData.holdings || []);
      }

      // Load transactions
      const transactionsResponse = await fetch(`http://localhost:8000/dummy-transactions/${currentUser.uid}`);
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        setTransactions(transactionsData);
      }
    } catch (error) {
      console.error('Error loading portfolio:', error);
    }
  };

  const refreshPortfolio = async () => {
    await loadPortfolio();
  };

  const makeInvestment = async (symbol: string, zolosAmount: number, currentPrice: number, aiPrediction?: any): Promise<boolean> => {
    if (!currentUser || !isDummyAccount || !canAfford(zolosAmount)) {
      return false;
    }

    try {
      const shares = Math.floor(zolosAmount / currentPrice);
      if (shares <= 0) return false;

      const response = await fetch(`http://localhost:8000/dummy-invest/${currentUser.uid}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol,
          zolosAmount,
          shares,
          price: currentPrice,
          aiPrediction
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Update local state immediately
        setZolosBalance(result.newZolosBalance);
        setPortfolio(result.portfolio);
        setHoldings(result.portfolio.holdings || []);
        
        // Update Firestore
        await updateDoc(doc(db, 'users', currentUser.uid), {
          zolosBalance: result.newZolosBalance
        });
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error making investment:', error);
      return false;
    }
  };

  const sellStock = async (symbol: string, shares: number, currentPrice: number): Promise<boolean> => {
    if (!currentUser || !isDummyAccount) return false;

    try {
      const response = await fetch(`http://localhost:8000/dummy-sell/${currentUser.uid}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol,
          shares,
          price: currentPrice
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Update local state immediately
        setZolosBalance(result.newZolosBalance);
        setPortfolio(result.portfolio);
        setHoldings(result.portfolio.holdings || []);
        
        // Update Firestore
        await updateDoc(doc(db, 'users', currentUser.uid), {
          zolosBalance: result.newZolosBalance
        });
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error selling stock:', error);
      return false;
    }
  };

  const updateZolosBalance = async (newBalance: number) => {
    if (!currentUser || !isDummyAccount) return;

    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        zolosBalance: newBalance
      });
      setZolosBalance(newBalance);
    } catch (error) {
      console.error('Error updating Zolos balance:', error);
    }
  };

  const canAfford = (amount: number): boolean => {
    return isDummyAccount && zolosBalance >= amount;
  };

  const getZolosToCurrency = (zolos: number): number => {
    return zolos * ZOLOS_TO_CURRENCY_RATE;
  };

  const getCurrencyToZolos = (currency: number): number => {
    return currency / ZOLOS_TO_CURRENCY_RATE;
  };

  const value: DummyAccountContextType = {
    isDummyAccount,
    zolosBalance,
    portfolio,
    holdings,
    transactions,
    makeInvestment,
    sellStock,
    loadPortfolio,
    refreshPortfolio,
    updateZolosBalance,
    canAfford,
    getZolosToCurrency,
    getCurrencyToZolos,
    showUpgradePrompt,
    setShowUpgradePrompt
  };

  return (
    <DummyAccountContext.Provider value={value}>
      {children}
    </DummyAccountContext.Provider>
  );
};

export const useDummyAccount = (): DummyAccountContextType => {
  const context = useContext(DummyAccountContext);
  if (context === undefined) {
    throw new Error('useDummyAccount must be used within a DummyAccountProvider');
  }
  return context;
};