import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

interface DummyAccountContextType {
  isDummyAccount: boolean;
  zolosBalance: number;
  updateZolosBalance: (newBalance: number) => Promise<void>;
  deductZolos: (amount: number) => Promise<boolean>;
  canAfford: (amount: number) => boolean;
  showUpgradePrompt: boolean;
  setShowUpgradePrompt: (show: boolean) => void;
  convertToLiveAccount: () => Promise<void>;
}

const DummyAccountContext = createContext<DummyAccountContextType | undefined>(undefined);

export const useDummyAccount = (): DummyAccountContextType => {
  const context = useContext(DummyAccountContext);
  if (context === undefined) {
    throw new Error('useDummyAccount must be used within a DummyAccountProvider');
  }
  return context;
};

interface DummyAccountProviderProps {
  children: ReactNode;
}

export const DummyAccountProvider: React.FC<DummyAccountProviderProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const [isDummyAccount, setIsDummyAccount] = useState(false);
  const [zolosBalance, setZolosBalance] = useState(0);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

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
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      } else {
        setIsDummyAccount(false);
        setZolosBalance(0);
        setShowUpgradePrompt(false);
      }
    };

    loadUserData();
  }, [currentUser]);

  const updateZolosBalance = async (newBalance: number) => {
    if (!currentUser || !isDummyAccount) return;

    try {
      // Update Firestore
      await updateDoc(doc(db, 'users', currentUser.uid), {
        zolosBalance: newBalance
      });
      
      // Update backend
      const response = await fetch(`http://localhost:8000/users/${currentUser.uid}/zolos-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.uid,
          amount: Math.abs(newBalance - zolosBalance),
          transactionType: newBalance > zolosBalance ? 'add' : 'deduct',
          description: `Balance updated to ${newBalance}`,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update backend');
      }

      setZolosBalance(newBalance);
    } catch (error) {
      console.error('Error updating Zolos balance:', error);
      throw error;
    }
  };

  const deductZolos = async (amount: number): Promise<boolean> => {
    if (!isDummyAccount || zolosBalance < amount) {
      return false;
    }

    const newBalance = zolosBalance - amount;
    await updateZolosBalance(newBalance);
    
    // Show upgrade prompt if balance is low
    if (newBalance <= 100) {
      setShowUpgradePrompt(true);
    }
    
    return true;
  };

  const canAfford = (amount: number): boolean => {
    return isDummyAccount && zolosBalance >= amount;
  };

  const convertToLiveAccount = async () => {
    if (!currentUser || !isDummyAccount) return;

    try {
      // Update Firestore
      await updateDoc(doc(db, 'users', currentUser.uid), {
        accountType: 'live',
        zolosBalance: 0 // Reset Zolos balance for live account
      });

      // Update backend
      const response = await fetch(`http://localhost:8000/users/${currentUser.uid}/upgrade-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.uid,
          newAccountType: 'live',
          subscriptionPlan: 'premium-plus'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to upgrade account in backend');
      }

      setIsDummyAccount(false);
      setZolosBalance(0);
      setShowUpgradePrompt(false);
    } catch (error) {
      console.error('Error converting to live account:', error);
      throw error;
    }
  };

  const value: DummyAccountContextType = {
    isDummyAccount,
    zolosBalance,
    updateZolosBalance,
    deductZolos,
    canAfford,
    showUpgradePrompt,
    setShowUpgradePrompt,
    convertToLiveAccount
  };

  return (
    <DummyAccountContext.Provider value={value}>
      {children}
    </DummyAccountContext.Provider>
  );
};