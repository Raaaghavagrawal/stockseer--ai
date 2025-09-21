import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Live Account Types
export interface LiveAccountData {
  uid: string;
  email: string;
  displayName: string;
  accountType: 'live';
  subscriptionPlan: 'free' | 'premium' | 'premium-plus';
  createdAt: string;
  watchlist: string[];
  preferences: {
    theme: string;
    notifications: boolean;
    researchPreferences: {
      sectors: string[];
      marketCap: string[];
      riskTolerance: 'low' | 'medium' | 'high';
    };
  };
}

export interface ResearchNote {
  id: string;
  symbol: string;
  title: string;
  content: string;
  tags: string[];
  timestamp: string;
  lastModified: string;
}

export interface AnalysisReport {
  id: string;
  symbol: string;
  reportType: 'technical' | 'fundamental' | 'sentiment' | 'custom';
  title: string;
  content: string;
  metrics: Record<string, any>;
  timestamp: string;
}

interface LiveAccountContextType {
  // Account Status
  isLiveAccount: boolean;
  accountData: LiveAccountData | null;
  
  // Research & Development Features
  researchNotes: ResearchNote[];
  analysisReports: AnalysisReport[];
  
  // Research Functions
  createResearchNote: (symbol: string, title: string, content: string, tags: string[]) => Promise<boolean>;
  updateResearchNote: (noteId: string, updates: Partial<ResearchNote>) => Promise<boolean>;
  deleteResearchNote: (noteId: string) => Promise<boolean>;
  
  // Analysis Functions
  generateAnalysisReport: (symbol: string, reportType: string, customParams?: any) => Promise<AnalysisReport | null>;
  saveAnalysisReport: (report: AnalysisReport) => Promise<boolean>;
  
  // Watchlist Management
  addToWatchlist: (symbol: string) => Promise<boolean>;
  removeFromWatchlist: (symbol: string) => Promise<boolean>;
  
  // Preferences
  updatePreferences: (preferences: Partial<LiveAccountData['preferences']>) => Promise<boolean>;
  
  // Data Loading
  loadAccountData: () => Promise<void>;
  loadResearchData: () => Promise<void>;
  
  // Subscription Features
  canAccessFeature: (feature: string) => boolean;
  getSubscriptionLimits: () => Record<string, any>;
}

const LiveAccountContext = createContext<LiveAccountContextType | undefined>(undefined);

interface LiveAccountProviderProps {
  children: ReactNode;
}

export const LiveAccountProvider: React.FC<LiveAccountProviderProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const [isLiveAccount, setIsLiveAccount] = useState(false);
  const [accountData, setAccountData] = useState<LiveAccountData | null>(null);
  const [researchNotes, setResearchNotes] = useState<ResearchNote[]>([]);
  const [analysisReports, setAnalysisReports] = useState<AnalysisReport[]>([]);

  // Load user account data when currentUser changes
  useEffect(() => {
    const loadUserData = async () => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const accountType = userData.accountType || 'live';
            setIsLiveAccount(accountType === 'live');
            
            if (accountType === 'live') {
              setAccountData(userData as LiveAccountData);
              await loadResearchData();
            }
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      } else {
        setIsLiveAccount(false);
        setAccountData(null);
        setResearchNotes([]);
        setAnalysisReports([]);
      }
    };

    loadUserData();
  }, [currentUser]);

  const loadAccountData = async () => {
    if (!currentUser || !isLiveAccount) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setAccountData(userData as LiveAccountData);
      }
    } catch (error) {
      console.error('Error loading account data:', error);
    }
  };

  const loadResearchData = async () => {
    if (!currentUser || !isLiveAccount) return;

    try {
      // Load research notes
      const notesResponse = await fetch(`http://localhost:8000/live-research-notes/${currentUser.uid}`);
      if (notesResponse.ok) {
        const notes = await notesResponse.json();
        setResearchNotes(notes);
      }

      // Load analysis reports
      const reportsResponse = await fetch(`http://localhost:8000/live-analysis-reports/${currentUser.uid}`);
      if (reportsResponse.ok) {
        const reports = await reportsResponse.json();
        setAnalysisReports(reports);
      }
    } catch (error) {
      console.error('Error loading research data:', error);
    }
  };

  const createResearchNote = async (symbol: string, title: string, content: string, tags: string[]): Promise<boolean> => {
    if (!currentUser || !isLiveAccount) return false;

    try {
      const response = await fetch(`http://localhost:8000/live-research-notes/${currentUser.uid}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol,
          title,
          content,
          tags
        })
      });

      if (response.ok) {
        await loadResearchData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error creating research note:', error);
      return false;
    }
  };

  const updateResearchNote = async (noteId: string, updates: Partial<ResearchNote>): Promise<boolean> => {
    if (!currentUser || !isLiveAccount) return false;

    try {
      const response = await fetch(`http://localhost:8000/live-research-notes/${currentUser.uid}/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        await loadResearchData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating research note:', error);
      return false;
    }
  };

  const deleteResearchNote = async (noteId: string): Promise<boolean> => {
    if (!currentUser || !isLiveAccount) return false;

    try {
      const response = await fetch(`http://localhost:8000/live-research-notes/${currentUser.uid}/${noteId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadResearchData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting research note:', error);
      return false;
    }
  };

  const generateAnalysisReport = async (symbol: string, reportType: string, customParams?: any): Promise<AnalysisReport | null> => {
    if (!currentUser || !isLiveAccount) return null;

    try {
      const response = await fetch(`http://localhost:8000/live-generate-analysis/${currentUser.uid}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol,
          reportType,
          customParams
        })
      });

      if (response.ok) {
        const report = await response.json();
        return report;
      }
      return null;
    } catch (error) {
      console.error('Error generating analysis report:', error);
      return null;
    }
  };

  const saveAnalysisReport = async (report: AnalysisReport): Promise<boolean> => {
    if (!currentUser || !isLiveAccount) return false;

    try {
      const response = await fetch(`http://localhost:8000/live-analysis-reports/${currentUser.uid}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report)
      });

      if (response.ok) {
        await loadResearchData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving analysis report:', error);
      return false;
    }
  };

  const addToWatchlist = async (symbol: string): Promise<boolean> => {
    if (!currentUser || !isLiveAccount || !accountData) return false;

    try {
      const updatedWatchlist = [...accountData.watchlist, symbol];
      await updateDoc(doc(db, 'users', currentUser.uid), {
        watchlist: updatedWatchlist
      });
      
      setAccountData({
        ...accountData,
        watchlist: updatedWatchlist
      });
      return true;
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      return false;
    }
  };

  const removeFromWatchlist = async (symbol: string): Promise<boolean> => {
    if (!currentUser || !isLiveAccount || !accountData) return false;

    try {
      const updatedWatchlist = accountData.watchlist.filter(s => s !== symbol);
      await updateDoc(doc(db, 'users', currentUser.uid), {
        watchlist: updatedWatchlist
      });
      
      setAccountData({
        ...accountData,
        watchlist: updatedWatchlist
      });
      return true;
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      return false;
    }
  };

  const updatePreferences = async (preferences: Partial<LiveAccountData['preferences']>): Promise<boolean> => {
    if (!currentUser || !isLiveAccount || !accountData) return false;

    try {
      const updatedPreferences = {
        ...accountData.preferences,
        ...preferences
      };
      
      await updateDoc(doc(db, 'users', currentUser.uid), {
        preferences: updatedPreferences
      });
      
      setAccountData({
        ...accountData,
        preferences: updatedPreferences
      });
      return true;
    } catch (error) {
      console.error('Error updating preferences:', error);
      return false;
    }
  };

  const canAccessFeature = (feature: string): boolean => {
    if (!accountData) return false;
    
    const subscriptionLimits = getSubscriptionLimits();
    return subscriptionLimits[feature] || false;
  };

  const getSubscriptionLimits = (): Record<string, any> => {
    if (!accountData) return {};

    const limits = {
      free: {
        maxWatchlistItems: 10,
        maxResearchNotes: 5,
        maxAnalysisReports: 2,
        hasAdvancedCharts: false,
        hasAPIAccess: false,
        hasCustomAlerts: false,
        hasDataExport: false
      },
      premium: {
        maxWatchlistItems: 50,
        maxResearchNotes: 25,
        maxAnalysisReports: 10,
        hasAdvancedCharts: true,
        hasAPIAccess: false,
        hasCustomAlerts: true,
        hasDataExport: false
      },
      'premium-plus': {
        maxWatchlistItems: -1, // unlimited
        maxResearchNotes: -1, // unlimited
        maxAnalysisReports: -1, // unlimited
        hasAdvancedCharts: true,
        hasAPIAccess: true,
        hasCustomAlerts: true,
        hasDataExport: true
      }
    };

    return limits[accountData.subscriptionPlan] || limits.free;
  };

  const value: LiveAccountContextType = {
    isLiveAccount,
    accountData,
    researchNotes,
    analysisReports,
    createResearchNote,
    updateResearchNote,
    deleteResearchNote,
    generateAnalysisReport,
    saveAnalysisReport,
    addToWatchlist,
    removeFromWatchlist,
    updatePreferences,
    loadAccountData,
    loadResearchData,
    canAccessFeature,
    getSubscriptionLimits
  };

  return (
    <LiveAccountContext.Provider value={value}>
      {children}
    </LiveAccountContext.Provider>
  );
};

export const useLiveAccount = (): LiveAccountContextType => {
  const context = useContext(LiveAccountContext);
  if (context === undefined) {
    throw new Error('useLiveAccount must be used within a LiveAccountProvider');
  }
  return context;
};