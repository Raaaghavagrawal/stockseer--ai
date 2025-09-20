import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SubscriptionProvider, useSubscription } from './contexts/SubscriptionContext';
import { DummyAccountProvider } from './contexts/DummyAccountContext';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import PricingPage from './pages/PricingPage';
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
      // For other premium markets, redirect to pricing page
      navigate('/pricing');
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-background transition-colors duration-200">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<About />} />
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
          <DummyAccountProvider>
            <AppContent />
          </DummyAccountProvider>
        </SubscriptionProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
