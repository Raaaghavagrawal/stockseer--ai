import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
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
              // Load portfolio data directly here to ensure proper initialization
              const currentZolosBalance = userData.zolosBalance || 0;
              
              // Load portfolio data from Firestore
              if (userData.portfolio && userData.portfolio.holdings) {
                setPortfolio(userData.portfolio);
                setHoldings(userData.portfolio.holdings);
                console.log('Loaded portfolio with holdings from Firestore:', userData.portfolio.holdings);
              } else {
                // Try to load from localStorage as backup
                const backupData = localStorage.getItem(`portfolio_${currentUser.uid}`);
                if (backupData) {
                  try {
                    const parsedData = JSON.parse(backupData);
                    if (parsedData.holdings && parsedData.holdings.length > 0) {
                      setPortfolio(parsedData.portfolio);
                      setHoldings(parsedData.holdings);
                      setTransactions(parsedData.transactions || []);
                      console.log('Loaded portfolio with holdings from localStorage:', parsedData.holdings);
                      
                      // Save back to Firestore
                      await updateDoc(doc(db, 'users', currentUser.uid), {
                        portfolio: parsedData.portfolio,
                        transactions: parsedData.transactions || []
                      });
                      return; // Exit early since we loaded from backup
                    }
                  } catch (error) {
                    console.error('Error parsing localStorage backup:', error);
                  }
                }
                
                // Initialize portfolio if it doesn't exist anywhere
                const initialPortfolio = {
                  totalValue: 0,
                  totalCost: 0,
                  totalGainLoss: 0,
                  totalGainLossPercent: 0,
                  zolosBalance: currentZolosBalance,
                  holdings: [],
                  lastUpdated: new Date().toISOString()
                };
                setPortfolio(initialPortfolio);
                setHoldings([]);
                console.log('Initialized new portfolio');
              }
              
              // Load transactions if they exist
              if (userData.transactions) {
                setTransactions(userData.transactions);
              }
              
              // Ensure portfolio is properly initialized
              setTimeout(() => {
                ensurePortfolioExists();
              }, 1000); // Small delay to ensure state is set
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

  // Additional effect to ensure portfolio persistence
  useEffect(() => {
    if (isDummyAccount && currentUser && holdings.length > 0) {
      // Save holdings to localStorage as backup
      localStorage.setItem(`portfolio_${currentUser.uid}`, JSON.stringify({
        portfolio,
        holdings,
        transactions
      }));
    }
  }, [holdings, portfolio, transactions, isDummyAccount, currentUser]);

  const loadPortfolio = async () => {
    if (!currentUser || !isDummyAccount) return;

    try {
      // Frontend-only implementation - load from Firestore
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const currentZolosBalance = userData.zolosBalance || 0;
        setZolosBalance(currentZolosBalance);
        
        // Load portfolio data from Firestore
        if (userData.portfolio && userData.portfolio.holdings) {
          setPortfolio(userData.portfolio);
          setHoldings(userData.portfolio.holdings);
          console.log('Reloaded portfolio with holdings:', userData.portfolio.holdings);
        } else {
          // Initialize portfolio if it doesn't exist
          const initialPortfolio = {
            totalValue: 0,
            totalCost: 0,
            totalGainLoss: 0,
            totalGainLossPercent: 0,
            zolosBalance: currentZolosBalance,
            holdings: [],
            lastUpdated: new Date().toISOString()
          };
          setPortfolio(initialPortfolio);
          setHoldings([]);
          console.log('Reloaded - initialized new portfolio');
        }
        
        // Load transactions if they exist
        if (userData.transactions) {
          setTransactions(userData.transactions);
        }
      }
    } catch (error) {
      console.error('Error loading portfolio:', error);
    }
  };

  const refreshPortfolio = async () => {
    await loadPortfolio();
  };

  // Ensure portfolio is properly initialized and saved
  const ensurePortfolioExists = async () => {
    if (!currentUser || !isDummyAccount) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // If portfolio doesn't exist or is incomplete, create it
        if (!userData.portfolio || !userData.portfolio.holdings) {
          const currentZolosBalance = userData.zolosBalance || 0;
          const initialPortfolio = {
            totalValue: 0,
            totalCost: 0,
            totalGainLoss: 0,
            totalGainLossPercent: 0,
            zolosBalance: currentZolosBalance,
            holdings: [],
            lastUpdated: new Date().toISOString()
          };
          
          // Save to Firestore
          await updateDoc(doc(db, 'users', currentUser.uid), {
            portfolio: initialPortfolio,
            transactions: userData.transactions || []
          });
          
          // Update local state
          setPortfolio(initialPortfolio);
          setHoldings([]);
          setTransactions(userData.transactions || []);
          
          console.log('Created and saved initial portfolio to Firestore');
        }
      }
    } catch (error) {
      console.error('Error ensuring portfolio exists:', error);
    }
  };

  const makeInvestment = async (symbol: string, zolosAmount: number, currentPrice: number, aiPrediction?: any): Promise<boolean> => {
    if (!currentUser || !isDummyAccount || !canAfford(zolosAmount)) {
      return false;
    }

    try {
      // Convert Zolos to currency first, then calculate shares
      const currencyValue = getZolosToCurrency(zolosAmount);
      const shares = Math.floor(currencyValue / currentPrice);
      if (shares <= 0) return false;

      // Frontend-only implementation - no backend calls
      const newZolosBalance = zolosBalance - zolosAmount;
      
      // Update Zolos balance immediately
      setZolosBalance(newZolosBalance);
      
      // Create new transaction
      const newTransaction = {
        id: `tx_${currentUser.uid}_${Date.now()}`,
        userId: currentUser.uid,
          symbol,
        transactionType: 'buy' as const,
          shares,
          price: currentPrice,
        totalValue: shares * currentPrice,
        zolosUsed: zolosAmount,
        timestamp: new Date().toISOString(),
          aiPrediction
      };
      
      // Update transactions list
      const updatedTransactions = [newTransaction, ...transactions];
      setTransactions(updatedTransactions);
      
      // Update or create portfolio
      const currentPortfolio = portfolio || {
        totalValue: 0,
        totalCost: 0,
        totalGainLoss: 0,
        totalGainLossPercent: 0,
        zolosBalance: newZolosBalance,
        holdings: [],
        lastUpdated: new Date().toISOString()
      };
      
      // Check if user already has this stock
      const existingHoldingIndex = currentPortfolio.holdings.findIndex(h => h.symbol === symbol);
      
      if (existingHoldingIndex >= 0) {
        // Update existing holding
        const existingHolding = currentPortfolio.holdings[existingHoldingIndex];
        const totalShares = existingHolding.shares + shares;
        const totalCost = existingHolding.totalCost + (shares * currentPrice);
        const avgPrice = totalCost / totalShares;
        
        currentPortfolio.holdings[existingHoldingIndex] = {
          ...existingHolding,
          shares: totalShares,
          avgPrice: avgPrice,
          currentPrice: currentPrice,
          totalValue: totalShares * currentPrice,
          totalCost: totalCost,
          gainLoss: (totalShares * currentPrice) - totalCost,
          gainLossPercent: ((totalShares * currentPrice) - totalCost) / totalCost * 100,
          lastUpdated: new Date().toISOString()
        };
      } else {
        // Create new holding
        const newHolding = {
          symbol: symbol,
          shares: shares,
          avgPrice: currentPrice,
          currentPrice: currentPrice,
          totalValue: shares * currentPrice,
          totalCost: shares * currentPrice,
          gainLoss: 0,
          gainLossPercent: 0,
          lastUpdated: new Date().toISOString()
        };
        currentPortfolio.holdings.push(newHolding);
      }
      
      // Update portfolio totals
      const totalValue = currentPortfolio.holdings.reduce((sum, h) => sum + h.totalValue, 0);
      const totalCost = currentPortfolio.holdings.reduce((sum, h) => sum + h.totalCost, 0);
      const totalGainLoss = totalValue - totalCost;
      const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
      
      const updatedPortfolio = {
        ...currentPortfolio,
        totalValue,
        totalCost,
        totalGainLoss,
        totalGainLossPercent,
        zolosBalance: newZolosBalance,
        lastUpdated: new Date().toISOString()
      };
      
      // Update portfolio and holdings state
      setPortfolio(updatedPortfolio);
      setHoldings(updatedPortfolio.holdings);
      
      // Update Firestore for persistence
        await updateDoc(doc(db, 'users', currentUser.uid), {
        zolosBalance: newZolosBalance,
        portfolio: updatedPortfolio,
        transactions: updatedTransactions
        });
        
        return true;
    } catch (error) {
      console.error('Error making investment:', error);
      return false;
    }
  };

  const sellStock = async (symbol: string, shares: number, currentPrice: number): Promise<boolean> => {
    if (!currentUser || !isDummyAccount) return false;

    try {
      // Check if user has enough shares to sell
      const holding = holdings.find(h => h.symbol === symbol);
      if (!holding || holding.shares < shares) {
        return false;
      }

      // Frontend-only implementation - no backend calls
      const zolosGained = getCurrencyToZolos(shares * currentPrice);
      const newZolosBalance = zolosBalance + zolosGained;
      
      // Update Zolos balance immediately
      setZolosBalance(newZolosBalance);
      
      // Create new transaction
      const newTransaction = {
        id: `tx_${currentUser.uid}_${Date.now()}`,
        userId: currentUser.uid,
          symbol,
        transactionType: 'sell' as const,
          shares,
        price: currentPrice,
        totalValue: shares * currentPrice,
        zolosUsed: zolosGained, // Zolos gained from sale
        timestamp: new Date().toISOString()
      };
      
      // Update transactions list
      const updatedTransactions = [newTransaction, ...transactions];
      setTransactions(updatedTransactions);
      
      // Update portfolio
      const currentPortfolio = portfolio || {
        totalValue: 0,
        totalCost: 0,
        totalGainLoss: 0,
        totalGainLossPercent: 0,
        zolosBalance: newZolosBalance,
        holdings: [],
        lastUpdated: new Date().toISOString()
      };
      
      // Update or remove holding
      const holdingIndex = currentPortfolio.holdings.findIndex(h => h.symbol === symbol);
      
      if (holdingIndex >= 0) {
        const holding = currentPortfolio.holdings[holdingIndex];
        const remainingShares = holding.shares - shares;
        
        if (remainingShares <= 0) {
          // Remove holding completely
          currentPortfolio.holdings.splice(holdingIndex, 1);
        } else {
          // Update holding
          const remainingCost = holding.totalCost * (remainingShares / holding.shares);
          currentPortfolio.holdings[holdingIndex] = {
            ...holding,
            shares: remainingShares,
            totalCost: remainingCost,
            currentPrice: currentPrice,
            totalValue: remainingShares * currentPrice,
            gainLoss: (remainingShares * currentPrice) - remainingCost,
            gainLossPercent: ((remainingShares * currentPrice) - remainingCost) / remainingCost * 100,
            lastUpdated: new Date().toISOString()
          };
        }
      }
      
      // Update portfolio totals
      const totalValue = currentPortfolio.holdings.reduce((sum, h) => sum + h.totalValue, 0);
      const totalCost = currentPortfolio.holdings.reduce((sum, h) => sum + h.totalCost, 0);
      const totalGainLoss = totalValue - totalCost;
      const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
      
      const updatedPortfolio = {
        ...currentPortfolio,
        totalValue,
        totalCost,
        totalGainLoss,
        totalGainLossPercent,
        zolosBalance: newZolosBalance,
        lastUpdated: new Date().toISOString()
      };
      
      // Update portfolio and holdings state
      setPortfolio(updatedPortfolio);
      setHoldings(updatedPortfolio.holdings);
      
      // Update Firestore for persistence
        await updateDoc(doc(db, 'users', currentUser.uid), {
        zolosBalance: newZolosBalance,
        portfolio: updatedPortfolio,
        transactions: updatedTransactions
        });
        
        return true;
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