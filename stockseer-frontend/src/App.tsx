import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SubscriptionProvider, useSubscription } from './contexts/SubscriptionContext';
import { MarketRestrictionProvider } from './contexts/MarketRestrictionContext';
import { DummyAccountProvider } from './contexts/DummyAccountContext';
import { LiveAccountProvider } from './contexts/LiveAccountContext';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import PricingPage from './pages/PricingPage';
import GoldCryptoPage from './pages/GoldCryptoPage';
import StockTickerDemo from './pages/StockTickerDemo';
import ETFBondsForexPage from './pages/ETFBondsForexPage';
import ProtectedRoute from './components/ProtectedRoute';
import ContinentSelectionModal from './components/ContinentSelectionModal';
import ChatWidget from './components/ChatWidget';
import './App.css';
import About from './pages/About';

// Component to handle continent selection modal
function AppContent() {
  const navigate = useNavigate();
  const { showContinentModal, setShowContinentModal } = useAuth();
  const { setSelectedContinent, getContinentPlan, setCurrentPlan, setShowFreePlanNotification } = useSubscription();

  const handleContinentSelect = (continent: string) => {
    setSelectedContinent(continent as any);
    const requiredPlan = getContinentPlan(continent as any);
    setCurrentPlan(requiredPlan);
    
    // Handle different continent selections
    if (continent === 'asia') {
      // Show free plan notification for Asian markets
      setShowFreePlanNotification(true);
      // Navigate to dashboard
      navigate('/dashboard');
    } else if (continent === 'global') {
      // For global markets (Premium Plus), redirect to pricing page
      navigate('/pricing');
    } else {
      // For other premium markets, start with free plan and go to dashboard
      // User can upgrade later if needed
      setCurrentPlan('free');
      navigate('/dashboard');
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-background transition-colors duration-200">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/gold" element={<GoldCryptoPage />} />
          <Route path="/ticker-demo" element={<StockTickerDemo />} />
          <Route path="/etf-bonds-forex" element={<ETFBondsForexPage />} />
          <Route 
            path="/stocks" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/pricing" 
            element={<PricingPage />} 
          />
          {/* Catch-all route to redirect to landing page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <ChatWidget />
      
      {/* Continent Selection Modal */}
      <ContinentSelectionModal
        isOpen={showContinentModal}
        onClose={() => setShowContinentModal(false)}
        onSelectContinent={handleContinentSelect}
      />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <SubscriptionProvider>
          <MarketRestrictionProvider>
            <DummyAccountProvider>
              <LiveAccountProvider>
                <AppContent />
              </LiveAccountProvider>
            </DummyAccountProvider>
          </MarketRestrictionProvider>
        </SubscriptionProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;