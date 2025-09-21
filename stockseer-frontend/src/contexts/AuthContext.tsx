import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { auth, db } from '../config/firebase';

interface AuthContextType {
  currentUser: any | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  showContinentModal: boolean;
  setShowContinentModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showContinentModal, setShowContinentModal] = useState(false);

  const signup = async (email: string, password: string, displayName: string) => {
    try {
      const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
      const { doc, setDoc } = await import('firebase/firestore');
      
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's display name
      await updateProfile(user, { displayName });
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        createdAt: new Date().toISOString(),
        watchlist: [],
        preferences: {
          theme: 'dark',
          notifications: true
        }
      });
      
      // Show continent selection modal after successful signup
      setShowContinentModal(true);
    } catch (error) {
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      await signInWithEmailAndPassword(auth, email, password);
      // Show continent selection modal after successful login
      setShowContinentModal(true);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { signOut } = await import('firebase/auth');
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    const setupAuth = async () => {
      const { onAuthStateChanged } = await import('firebase/auth');
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        console.log('Auth state changed:', user ? 'User logged in' : 'User logged out');
        setCurrentUser(user);
        setLoading(false);
      });
      return unsubscribe;
    };

    let unsubscribe: (() => void) | undefined;
    setupAuth().then(unsub => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const value: AuthContextType = {
    currentUser,
    login,
    signup,
    logout,
    loading,
    showContinentModal,
    setShowContinentModal
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};