import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  RefreshCw,
  Menu,
  X,
  Home,
  Crown,
  TrendingUp,
  Play
} from 'lucide-react';
import { useSubscription } from '../contexts/SubscriptionContext';

import { useMarketRestriction } from '../contexts/MarketRestrictionContext';
import FreePlanNotification from '../components/FreePlanNotification';
import MarketRestrictionModal from '../components/MarketRestrictionModal';
import DemoModal from '../components/DemoModal';

import { useDummyAccount } from '../contexts/DummyAccountContext';
import { useLiveAccount } from '../contexts/LiveAccountContext';
import FreePlanNotification from '../components/FreePlanNotification';
import ZolosBalance from '../components/ZolosBalance';
import DummyAccountUpgradeModal from '../components/DummyAccountUpgradeModal';
import UserProfileButton from '../components/UserProfileButton';

import { formatPrice, formatChange, formatChangePercent } from '../utils/currency';

// Import all tab components
import OverviewTab from '../components/tabs/OverviewTab';
import DummyOverviewTab from '../components/tabs/DummyOverviewTab';
import LiveOverviewTab from '../components/tabs/LiveOverviewTab';
import FinancialsTab from '../components/tabs/FinancialsTab';
import NewsTab from '../components/tabs/NewsTab';

// Welcome Screen Component
const WelcomeScreen: React.FC<{
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearch: () => void;
  loading: boolean;
}> = ({ searchQuery, onSearchChange, onSearch, loading }) => {
  const [showDemo, setShowDemo] = useState(false);
  const tabCards = [
    {
      id: 'overview',
      title: 'Overview',
      description: 'Real-time stock data, price charts, and key metrics',
      icon: '📊',
      color: 'from-blue-500 to-blue-600',
      features: ['Live Price Data', 'Interactive Charts', 'Key Metrics', 'Market Status'],
      status: 'active'
    },
    {
      id: 'financials',
      title: 'Financials',
      description: 'Income statements, balance sheets, and financial ratios',
      icon: '💰',
      color: 'from-green-500 to-green-600',
      features: ['P&L Statements', 'Balance Sheets', 'Cash Flow', 'Financial Ratios'],
      status: 'active'
    },
    {
      id: 'news',
      title: 'News',
      description: 'Latest news, market updates, and company announcements',
      icon: '📰',
      color: 'from-purple-500 to-purple-600',
      features: ['Real-time News', 'Market Updates', 'Company Announcements', 'Sentiment Analysis'],
      status: 'active'
    },
    {
      id: 'performance',
      title: 'Performance',
      description: 'Historical performance, returns, and risk analysis',
      icon: '📈',
      color: 'from-orange-500 to-orange-600',
      features: ['Historical Data', 'Returns Analysis', 'Risk Metrics', 'Volatility Charts'],
      status: 'active'
    },
    {
      id: 'ai-risk-news',
      title: 'AI Risk News',
      description: 'AI-powered risk assessment and market sentiment',
      icon: '🤖',
      color: 'from-red-500 to-red-600',
      features: ['AI Risk Score', 'Sentiment Analysis', 'Predictive Alerts', 'Market Intelligence'],
      status: 'premium'
    },
    {
      id: 'life-planner',
      title: 'Life Planner',
      description: 'Personal finance planning and investment strategies',
      icon: '🎯',
      color: 'from-indigo-500 to-indigo-600',
      features: ['Goal Setting', 'Portfolio Planning', 'Risk Assessment', 'Retirement Planning'],
      status: 'premium'
    },
    {
      id: 'about-company',
      title: 'About Company',
      description: 'Company information, business model, and leadership',
      icon: '🏢',
      color: 'from-teal-500 to-teal-600',
      features: ['Company Profile', 'Business Model', 'Leadership Team', 'Corporate Governance'],
      status: 'active'
    },
    {
      id: 'watchlist',
      title: 'Watchlist',
      description: 'Track your favorite stocks and create alerts',
      icon: '⭐',
      color: 'from-yellow-500 to-yellow-600',
      features: ['Custom Lists', 'Price Alerts', 'Portfolio Tracking', 'Quick Access'],
      status: 'active'
    },
    {
      id: 'market-screener',
      title: 'Market Screener',
      description: 'Filter and discover stocks based on your criteria',
      icon: '🔍',
      color: 'from-cyan-500 to-cyan-600',
      features: ['Advanced Filters', 'Custom Criteria', 'Sector Analysis', 'Stock Discovery'],
      status: 'premium'
    },
    {
      id: 'alerts',
      title: 'Alerts',
      description: 'Set up price alerts and notifications',
      icon: '🔔',
      color: 'from-amber-500 to-amber-600',
      features: ['Price Alerts', 'News Alerts', 'Custom Notifications', 'Email & SMS'],
      status: 'active'
    },
    {
      id: 'notes',
      title: 'Notes',
      description: 'Take notes and save your analysis',
      icon: '📝',
      color: 'from-gray-500 to-gray-600',
      features: ['Personal Notes', 'Analysis Tracking', 'Research Log', 'Export Options'],
      status: 'active'
    }
  ];

  return (
    <>
      <style>{`
        .card-hover {
          transform-style: preserve-3d;
          backface-visibility: hidden;
        }
        .card-hover:hover {
          transform: translateY(-8px) scale(1.02);
        }
        .tick-mark {
          animation: tickAppear 0.3s ease-out;
        }
        @keyframes tickAppear {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .feature-item {
          animation: slideIn 0.4s ease-out;
          animation-fill-mode: both;
        }
        .feature-item:nth-child(1) { animation-delay: 0.1s; }
        .feature-item:nth-child(2) { animation-delay: 0.2s; }
        .feature-item:nth-child(3) { animation-delay: 0.3s; }
        .feature-item:nth-child(4) { animation-delay: 0.4s; }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
      <div className="h-full flex flex-col">
      {/* Search Section */}
      <div className="mb-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-binance-yellow to-binance-yellow-dark rounded-full mb-4 shadow-lg">
            <Search className="w-8 h-8 text-binance-gray-dark" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Welcome to StockSeer
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Your comprehensive stock analysis platform with real-time data, AI insights, and advanced analytics
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-binance-yellow/20 to-binance-yellow-dark/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search for a stock symbol (e.g., AAPL, TCS.NS, MSFT)"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                className="w-full px-8 py-5 text-lg border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-binance-yellow/30 focus:border-binance-yellow transition-all duration-300 shadow-xl hover:shadow-2xl"
              />
              <button
                onClick={onSearch}
                disabled={loading || !searchQuery.trim()}
                className="absolute right-3 top-3 bottom-3 px-8 bg-gradient-to-r from-binance-yellow to-binance-yellow-dark hover:from-binance-yellow-dark hover:to-binance-yellow disabled:bg-gray-300 dark:disabled:bg-gray-600 text-binance-gray-dark dark:text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:hover:scale-100"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-binance-gray-dark border-t-transparent rounded-full animate-spin"></div>
                    <span>Searching...</span>
                  </div>
                ) : (
                  'Search'
                )}
              </button>
            </div>
          </div>
          
          {/* Watch Demo Button */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowDemo(true)}
              className="inline-flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Play className="w-5 h-5" />
              <span>Watch Demo</span>
            </button>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              New to StockSeer? Take a guided tour of our features
            </p>
          </div>
        </div>
      </div>

      {/* Tab Cards Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
          {tabCards.map((tab) => (
            <div
              key={tab.id}
              className="group cursor-pointer bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 ease-out card-hover border border-gray-200 dark:border-gray-700 overflow-hidden relative will-change-transform"
            >
              {/* Background gradient overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${tab.color} opacity-0 group-hover:opacity-8 transition-opacity duration-500 ease-out rounded-2xl`}></div>
              
              {/* Content */}
              <div className="relative z-10 h-full flex flex-col">
                {/* Header with icon and status */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tab.color} flex items-center justify-center text-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 ease-out shadow-lg group-hover:shadow-xl`}>
                    {tab.icon}
                  </div>
                  <div className="flex items-center space-x-1">
                    {tab.status === 'active' && (
                      <div className="flex items-center space-x-1 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-medium text-green-700 dark:text-green-400">Active</span>
                      </div>
                    )}
                    {tab.status === 'premium' && (
                      <div className="flex items-center space-x-1 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded-full">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">Premium</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Title and description */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-binance-yellow transition-colors duration-500 ease-out">
                  {tab.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-500 ease-out mb-4">
                  {tab.description}
                </p>

                {/* Features list with green tick marks */}
                <div className="flex-1">
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Key Features
                  </h4>
                  <ul className="space-y-1">
                    {tab.features.map((feature, index) => (
                      <li key={index} className="feature-item flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300">
                        <div className="w-3 h-3 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 tick-mark group-hover:bg-green-600 transition-colors duration-300">
                          <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="leading-tight">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {/* Subtle border glow on hover */}
              <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-binance-yellow/30 transition-all duration-500 ease-out"></div>
              
              {/* Shine effect on hover */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Demo Modal */}
      <DemoModal 
        isOpen={showDemo} 
        onClose={() => setShowDemo(false)} 
      />
      </div>
    </>
  );
};
import PerformanceTab from '../components/tabs/PerformanceTab';
import AIRiskNewsTab from '../components/tabs/AIRiskNewsTab';
import LifePlannerTab from '../components/tabs/LifePlannerTab';
import AboutCompanyTab from '../components/tabs/AboutCompanyTab';
import WatchlistTab from '../components/tabs/WatchlistTab';
import MarketScreenerTab from '../components/tabs/MarketScreenerTab';
import AlertsTab from '../components/tabs/AlertsTab';
import NotesTab from '../components/tabs/NotesTab';

// Import types
import type { 
  StockData, 
  StockChartData
} from '../types/stock';

// Import API functions
import { stockAPI, handleAPIError, handleMarketRestrictionError } from '../utils/api';

export default function Dashboard() {
  const { currentPlan, isTrialActive, showFreePlanNotification, setShowFreePlanNotification, selectedContinent } = useSubscription();

  const { showRestrictionModal, restrictionDetails, hideMarketRestriction, handleUpgrade, showMarketRestriction } = useMarketRestriction();

  const { isDummyAccount, showUpgradePrompt, setShowUpgradePrompt } = useDummyAccount();
  const { isLiveAccount } = useLiveAccount();

  const [searchParams] = useSearchParams();
  const [showDemo, setShowDemo] = useState(false);
  const [selectedStock, setSelectedStock] = useState<string>('');
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [chartData, setChartData] = useState<StockChartData[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarHidden, setMobileSidebarHidden] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Handle URL parameter for tab navigation
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Tab configuration
  const allTabs = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'financials', label: '💰 Financials' },
    { id: 'news', label: '📰 News' },
    { id: 'performance', label: '📈 Performance' },
    { id: 'ai-risk', label: '🧠 AI & Risk' },
    { id: 'life-planner', label: '🎯 Life Planner' },
    { id: 'about-company', label: '🏢 Company' },
    { id: 'watchlist', label: '👀 Watchlist' },
    { id: 'market-screener', label: '🔍 Screener' },
    { id: 'alerts', label: '🔔 Alerts' },
    { id: 'notes', label: '📝 Notes' }
  ];

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Toggle mobile sidebar visibility
  const toggleMobileSidebar = () => {
    setMobileSidebarHidden(!mobileSidebarHidden);
  };

  // Check if market is restricted before making API call
  const checkMarketRestriction = (symbol: string) => {
    const plan = localStorage.getItem('stockseer_subscription_plan') || 'free';
    
    // Ensure symbol is uppercase for consistent detection
    const upperSymbol = symbol.toUpperCase();
    
    let market = 'US'; // Default to US
    let marketName = 'US';
    
    if (upperSymbol.includes('.NS')) {
      market = 'Indian';
      marketName = 'Indian';
    } else if (upperSymbol.includes('.SS') || upperSymbol.includes('.SZ')) {
      market = 'Chinese';
      marketName = 'Chinese';
    } else if (upperSymbol.includes('.T')) {
      market = 'Japanese';
      marketName = 'Japanese';
    } else if (upperSymbol.includes('.KS')) {
      market = 'Korean';
      marketName = 'Korean';
    } else if (upperSymbol.includes('.SI')) {
      market = 'Singaporean';
      marketName = 'Singaporean';
    } else if (upperSymbol.includes('.BK')) {
      market = 'Thai';
      marketName = 'Thai';
    } else if (upperSymbol.includes('.JK')) {
      market = 'Indonesian';
      marketName = 'Indonesian';
    } else if (upperSymbol.includes('.KL')) {
      market = 'Malaysian';
      marketName = 'Malaysian';
    } else if (upperSymbol.includes('.PS')) {
      market = 'Philippine';
      marketName = 'Philippine';
    } else if (upperSymbol.includes('.VN')) {
      market = 'Vietnamese';
      marketName = 'Vietnamese';
    } else {
      // For US stocks (no suffix), analyze the symbol
      market = 'US';
      marketName = 'US';
    }
    // Check if market is allowed for current plan
    if (plan === 'free' && market !== 'Indian' && market !== 'Chinese' && market !== 'Japanese' && 
        market !== 'Korean' && market !== 'Singaporean' && market !== 'Thai' && 
        market !== 'Indonesian' && market !== 'Malaysian' && market !== 'Philippine' && 
        market !== 'Vietnamese') {
      
      const restrictionDetails = {
        message: `Access to ${marketName} market is restricted on the Free plan.`,
        details: `Free plan only includes Asian markets. Upgrade to Premium or Premium Plus to access global markets.`,
        requiredPlan: 'premium',
        currentPlan: 'free',
        availableMarkets: ['Indian', 'Chinese', 'Japanese', 'Korean', 'Singaporean', 'Thai', 'Indonesian', 'Malaysian', 'Philippine', 'Vietnamese'],
        upgradeUrl: '/pricing',
        market: marketName
      };
      
      showMarketRestriction(restrictionDetails);
      return true; // Market is restricted
    }
    
    return false; // Market is allowed
  };


  const fetchStockData = async (symbol: string) => {
    setLoading(true);
    try {
      // Fetch stock data from backend with market restriction handling
      const stockDataResponse = await stockAPI.getStockData(symbol, (restrictionDetails) => {
        // Show market restriction modal
        showMarketRestriction(restrictionDetails);
      });
      setStockData(stockDataResponse);
      
      // Fetch chart data
      try {
        const chartDataResponse = await stockAPI.getStockChartData(symbol, '1y', '1d');
        setChartData(chartDataResponse);
      } catch (chartError) {
        console.error('Error fetching chart data:', chartError);
        setChartData([]);
      }
      
    } catch (error) {
      console.error('Error fetching stock data:', error);
      
      // Check if it's a market restriction error
      const restrictionError = handleMarketRestrictionError(error);
      if (restrictionError.isMarketRestricted) {
        // Don't reset data for market restrictions, let the modal handle it
        console.log('Market restriction detected, showing modal');
        return;
      }
      
      // For other errors, show error message and reset data
      const errorMessage = handleAPIError(error);
      console.error('API Error:', errorMessage);
      setStockData(null);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  // Check market restriction on search input change
  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value);
    // Don't check market restriction while typing - only when user searches
  };

  useEffect(() => {
    const q = searchQuery.trim().toUpperCase();
    if (!q) return;
    const handle = setTimeout(async () => {
      // Don't check market restriction in debounced search - only when user explicitly searches
      await fetchStockData(q);
      setSelectedStock(q);
    }, 400);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  const handleStockSearch = async () => {
    const q = searchQuery.trim().toUpperCase();
    if (q) {
      // Check market restriction before searching
      if (checkMarketRestriction(q)) {
        return; // Don't proceed with search if market is restricted
      }
      await fetchStockData(q);
      setSelectedStock(q);
    }
  };

  const addToWatchlist = (symbol: string) => {
    if (!watchlist.includes(symbol)) {
      setWatchlist(prev => [...prev, symbol]);
    }
  };

  const removeFromWatchlist = (symbol: string) => {
    setWatchlist(prev => prev.filter(s => s !== symbol));
  };



  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        // Use different overview tabs based on account type
        if (isDummyAccount) {
          return (
            <DummyOverviewTab 
              stockData={stockData}
              watchlist={watchlist}
              chartData={chartData}
              onAddToWatchlist={addToWatchlist}
              onRemoveFromWatchlist={removeFromWatchlist}
            />
          );
        } else if (isLiveAccount) {
          return (
            <LiveOverviewTab 
              stockData={stockData}
              watchlist={watchlist}
              chartData={chartData}
              onAddToWatchlist={addToWatchlist}
              onRemoveFromWatchlist={removeFromWatchlist}
            />
          );
        } else {
          return (
            <OverviewTab 
              stockData={stockData}
              watchlist={watchlist}
              chartData={chartData}
              onAddToWatchlist={addToWatchlist}
              onRemoveFromWatchlist={removeFromWatchlist}
            />
          );
        }
      case 'financials':
        return <FinancialsTab stockData={stockData} selectedStock={selectedStock} />;
      case 'news':
        return <NewsTab selectedStock={selectedStock} />;
      case 'performance':
        return <PerformanceTab stockData={stockData} selectedStock={selectedStock} />;
      case 'ai-risk':
        return <AIRiskNewsTab selectedStock={selectedStock} stockData={stockData} />;
      case 'life-planner':
        return <LifePlannerTab />;
      case 'about-company':
        return <AboutCompanyTab selectedStock={selectedStock} stockData={stockData} />;
      case 'watchlist':
        return (
          <WatchlistTab 
            watchlist={watchlist}
            onRemoveFromWatchlist={removeFromWatchlist}
          />
        );
      case 'market-screener':
        return <MarketScreenerTab />;
      case 'alerts':
        return <AlertsTab />;
      case 'notes':
        return <NotesTab />;
      default:
        return (
          <OverviewTab 
            stockData={stockData}
            watchlist={watchlist}
            chartData={chartData}
            onAddToWatchlist={addToWatchlist}
            onRemoveFromWatchlist={removeFromWatchlist}
          />
        );
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-gray-50 dark:bg-black text-gray-900 dark:text-white flex">
      {/* Mobile Overlay */}
      {sidebarOpen && !mobileSidebarHidden && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`${mobileSidebarHidden ? 'hidden lg:flex' : 'flex'} ${sidebarOpen ? 'w-64' : 'w-16'} bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex-col shadow-lg overflow-hidden fixed lg:relative z-50 lg:z-auto h-full flex-shrink-0`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-binance-yellow to-binance-yellow-dark rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-binance-gray-dark" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-binance-text">StockSeer.AI</h1>
                    <p className="text-xs text-gray-600 dark:text-binance-text-secondary">AI-Powered Analysis</p>
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={toggleSidebar}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 ease-in-out transform hover:scale-110"
            >
              {sidebarOpen ? <X className="w-4 h-4 text-gray-700 dark:text-binance-text" /> : <Menu className="w-4 h-4 text-gray-700 dark:text-binance-text" />}
            </button>
          </div>
        </div>

        {/* Stock Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="space-y-3">
            <div>
              <input
                type="text"
                placeholder={sidebarOpen ? "Enter stock symbol" : "Symbol"}
                value={searchQuery}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStockSearch()}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg px-3 py-2 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-binance-yellow focus:border-binance-yellow transition-all duration-300"
              />
            </div>
            <button 
              onClick={handleStockSearch}
              disabled={loading || !searchQuery.trim()}
              className="w-full bg-gradient-to-r from-binance-yellow to-binance-yellow-dark hover:from-binance-yellow-dark hover:to-binance-yellow disabled:bg-gray-300 dark:disabled:bg-binance-gray px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center text-binance-gray-dark dark:text-white font-semibold transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              {sidebarOpen && <span className="ml-2">Search</span>}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex-1 overflow-y-auto">
          <nav className="p-2">
            <div className="space-y-1">
              {allTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    // Close sidebar on mobile after selecting a tab
                    if (window.innerWidth < 1024) {
                      setSidebarOpen(false);
                    }
                  }}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ease-in-out transform hover:scale-105 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-binance-yellow to-binance-yellow-dark text-binance-gray-dark shadow-lg'
                      : 'text-gray-700 dark:text-binance-text-secondary hover:bg-gray-100 dark:hover:bg-binance-gray hover:text-binance-yellow dark:hover:text-binance-yellow'
                  }`}
                  title={!sidebarOpen ? tab.label : undefined}
                >
                  <span className="text-lg">{tab.label.split(' ')[0]}</span>
                  {sidebarOpen && <span className="ml-3">{tab.label.split(' ').slice(1).join(' ')}</span>}
                </button>
              ))}
            </div>
          </nav>
        </div>

        {/* Sidebar Footer */}
        {sidebarOpen && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <div className="text-xs text-gray-600 dark:text-binance-text-secondary text-center">
              {selectedStock && (
                <div>
                  <div className="font-medium text-gray-900 dark:text-binance-text">{selectedStock}</div>
                  {stockData && (
                    <div className="text-binance-yellow font-semibold">
                      {formatPrice(stockData.price || 0, stockData.currency)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden min-w-0 ${mobileSidebarHidden ? 'w-full' : ''}`}>
        {/* Top Bar */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              
              <Link
                to="/"
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 ease-in-out transform hover:scale-110"
                title="Go to Home"
              >
                <Home className="w-5 h-5 text-gray-700 dark:text-binance-text" />
              </Link>
              {selectedStock && (
                <button
                  onClick={() => setSelectedStock('')}
                  className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  title="Back to Overview"
                >
                  ← Back to Overview
                </button>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-binance-text capitalize truncate">
                    {allTabs.find(tab => tab.id === activeTab)?.label || 'Dashboard'}
                  </h2>
                  {mobileSidebarHidden && (
                    <span className="lg:hidden px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                      Full View
                    </span>
                  )}
                </div>
                {selectedStock && (
                  <p className="text-sm sm:text-base text-gray-600 dark:text-binance-text-secondary truncate">Analyzing {selectedStock}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Pricing Button - Hidden on small screens */}
              <Link
                to="/pricing"
                className="hidden sm:flex items-center space-x-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-binance-yellow to-binance-yellow-dark hover:from-binance-yellow-dark hover:to-binance-yellow text-binance-gray-dark rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold"
              >
                <Crown className="w-4 h-4" />
                <span className="text-sm font-medium">Upgrade</span>
              </Link>
              
              {/* Plan Status - Simplified on mobile */}
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Crown className={`w-4 h-4 sm:w-5 sm:h-5 ${
                  currentPlan === 'free' ? 'text-gray-500 dark:text-binance-text-secondary' : 
                  currentPlan === 'premium' ? 'text-binance-yellow' : 'text-binance-yellow-dark'
                }`} />
                <span className={`text-xs sm:text-sm font-medium hidden sm:inline ${
                  currentPlan === 'free' ? 'text-gray-500 dark:text-binance-text-secondary' : 
                  currentPlan === 'premium' ? 'text-binance-yellow' : 'text-binance-yellow-dark'
                }`}>
                  {currentPlan === 'free' ? 'Free' : 
                   currentPlan === 'premium' ? 'Premium' : 'Premium Plus'}
                  {isTrialActive && ' (Trial)'}
                </span>
              </div>
              
              {/* Stock Price - Responsive */}
              {selectedStock && stockData && (
                <div className="text-right min-w-0">
                  <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-binance-text truncate">
                    {formatPrice(stockData.price || 0, stockData.currency)}
                  </div>
                  <div className={`text-xs sm:text-sm font-semibold ${stockData.changePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatChange(stockData.change || 0, stockData.currency)} ({formatChangePercent(stockData.changePercent || 0)}%)
                  </div>
                </div>
              )}
              
              {/* User Profile Button */}
              <UserProfileButton />
            </div>
          </div>
        </div>

        {/* Zolos Balance Display for Dummy Accounts */}
        {isDummyAccount && (
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <ZolosBalance 
              showUpgradeButton={true}
              onUpgradeClick={() => setShowUpgradeModal(true)}
            />
          </div>
        )}

        {/* Tab Content */}
        <div className={`flex-1 p-3 sm:p-6 overflow-y-auto bg-gray-50 dark:bg-black will-change-transform [backface-visibility:hidden] ${mobileSidebarHidden ? 'w-full' : ''}`}>
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-xl p-3 sm:p-6 shadow-lg min-h-full max-w-full overflow-hidden">
            {!selectedStock ? (
              <WelcomeScreen 
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onSearch={handleStockSearch}
                loading={loading}
              />
            ) : (
              renderTabContent()
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Floating Action Button for Sidebar */}
      {mobileSidebarHidden && (
        <button
          onClick={toggleMobileSidebar}
          className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-binance-yellow to-binance-yellow-dark hover:from-binance-yellow-dark hover:to-binance-yellow text-binance-gray-dark rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-110 flex items-center justify-center"
          title="Show Sidebar"
        >
          <Menu className="w-6 h-6" />
        </button>
      )}

      {/* Free Plan Notification */}
      <FreePlanNotification
        isVisible={showFreePlanNotification}
        onClose={() => setShowFreePlanNotification(false)}
        continent={selectedContinent === 'asia' ? 'Asia' : 'Selected Region'}
      />


      {/* Market Restriction Modal */}
      <MarketRestrictionModal
        isOpen={showRestrictionModal}
        onClose={hideMarketRestriction}
        onUpgrade={handleUpgrade}
        restrictionDetails={restrictionDetails}
      />
      
      {/* Demo Modal */}
      <DemoModal 
        isOpen={showDemo} 
        onClose={() => setShowDemo(false)} 

      {/* Dummy Account Upgrade Modal */}
      <DummyAccountUpgradeModal
        isOpen={showUpgradeModal || showUpgradePrompt}
        onClose={() => {
          setShowUpgradeModal(false);
          setShowUpgradePrompt(false);
        }}
        onUpgrade={() => {
          // Handle upgrade logic here
          console.log('User upgraded to live account');
        }}

      />
    </div>
  );
}
