import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  RefreshCw,
  Menu,
  X,
  Home,
  Crown,
  TrendingUp
} from 'lucide-react';
import { useSubscription } from '../contexts/SubscriptionContext';
import FreePlanNotification from '../components/FreePlanNotification';
import { formatPrice, formatChange, formatChangePercent } from '../utils/currency';

// Import all tab components
import OverviewTab from '../components/tabs/OverviewTab';
import FinancialsTab from '../components/tabs/FinancialsTab';
import NewsTab from '../components/tabs/NewsTab';
import PerformanceTab from '../components/tabs/PerformanceTab';
import ChatTab from '../components/tabs/ChatTab';
import AIRiskNewsTab from '../components/tabs/AIRiskNewsTab';
import LifePlannerTab from '../components/tabs/LifePlannerTab';
import AboutCompanyTab from '../components/tabs/AboutCompanyTab';
import TutorialTab from '../components/tabs/TutorialTab';
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
import { stockAPI, handleAPIError } from '../utils/api';

export default function Dashboard() {
  const { currentPlan, isTrialActive, showFreePlanNotification, setShowFreePlanNotification, selectedContinent } = useSubscription();
  const [searchParams] = useSearchParams();
  const [selectedStock, setSelectedStock] = useState<string>('');
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [chartData, setChartData] = useState<StockChartData[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
    { id: 'chat', label: '🤖 Chat' },
    { id: 'ai-risk', label: '🧠 AI & Risk' },
    { id: 'life-planner', label: '🎯 Life Planner' },
    { id: 'about-company', label: '🏢 Company' },
    { id: 'tutorial', label: '📚 Tutorial' },
    { id: 'watchlist', label: '👀 Watchlist' },
    { id: 'market-screener', label: '🔍 Screener' },
    { id: 'alerts', label: '🔔 Alerts' },
    { id: 'notes', label: '📝 Notes' }
  ];

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const fetchStockData = async (symbol: string) => {
    setLoading(true);
    try {
      // Fetch stock data from backend
      const stockDataResponse = await stockAPI.getStockData(symbol);
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
      const errorMessage = handleAPIError(error);
      console.error('API Error:', errorMessage);
      // Reset data on error
      setStockData(null);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const q = searchQuery.trim().toUpperCase();
    if (!q) return;
    const handle = setTimeout(async () => {
      await fetchStockData(q);
      setSelectedStock(q);
    }, 400);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  const handleStockSearch = async () => {
    const q = searchQuery.trim().toUpperCase();
    if (q) {
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
        return (
          <OverviewTab 
            stockData={stockData}
            watchlist={watchlist}
            chartData={chartData}
            onAddToWatchlist={addToWatchlist}
            onRemoveFromWatchlist={removeFromWatchlist}
          />
        );
      case 'financials':
        return <FinancialsTab stockData={stockData} selectedStock={selectedStock} />;
      case 'news':
        return <NewsTab selectedStock={selectedStock} />;
      case 'performance':
        return <PerformanceTab stockData={stockData} selectedStock={selectedStock} />;
      case 'chat':
        return <ChatTab selectedStock={selectedStock} />;
      case 'ai-risk':
        return <AIRiskNewsTab selectedStock={selectedStock} stockData={stockData} />;
      case 'life-planner':
        return <LifePlannerTab />;
      case 'about-company':
        return <AboutCompanyTab selectedStock={selectedStock} stockData={stockData} />;
      case 'tutorial':
        return <TutorialTab />;
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
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex flex-col shadow-lg overflow-hidden`}>
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
                onChange={(e) => setSearchQuery(e.target.value)}
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
                  onClick={() => setActiveTab(tab.id)}
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
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 ease-in-out transform hover:scale-110"
                title="Go to Home"
              >
                <Home className="w-5 h-5 text-gray-700 dark:text-binance-text" />
              </Link>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-binance-text capitalize">
                  {allTabs.find(tab => tab.id === activeTab)?.label || 'Dashboard'}
                </h2>
                {selectedStock && (
                  <p className="text-gray-600 dark:text-binance-text-secondary">Analyzing {selectedStock}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Pricing Button */}
              <Link
                to="/pricing"
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-binance-yellow to-binance-yellow-dark hover:from-binance-yellow-dark hover:to-binance-yellow text-binance-gray-dark rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold"
              >
                <Crown className="w-4 h-4" />
                <span className="text-sm font-medium">Upgrade Plan</span>
              </Link>
              
              {/* Plan Status */}
              <div className="flex items-center space-x-2">
                <Crown className={`w-5 h-5 ${
                  currentPlan === 'free' ? 'text-gray-500 dark:text-binance-text-secondary' : 
                  currentPlan === 'premium' ? 'text-binance-yellow' : 'text-binance-yellow-dark'
                }`} />
                <span className={`text-sm font-medium ${
                  currentPlan === 'free' ? 'text-gray-500 dark:text-binance-text-secondary' : 
                  currentPlan === 'premium' ? 'text-binance-yellow' : 'text-binance-yellow-dark'
                }`}>
                  {currentPlan === 'free' ? 'Free Plan' : 
                   currentPlan === 'premium' ? 'Premium' : 'Premium Plus'}
                  {isTrialActive && ' (Trial)'}
                </span>
              </div>
              
                      {selectedStock && stockData && (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900 dark:text-binance-text">
                            {formatPrice(stockData.price || 0, stockData.currency)}
                          </div>
                          <div className={`text-sm font-semibold ${stockData.changePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {formatChange(stockData.change || 0, stockData.currency)} ({formatChangePercent(stockData.changePercent || 0)}%)
                          </div>
                        </div>
                      )}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-6 overflow-y-auto bg-gray-50 dark:bg-black will-change-transform [backface-visibility:hidden]">
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-lg">
            {!selectedStock ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-binance-yellow to-binance-yellow-dark rounded-full flex items-center justify-center mb-6 shadow-lg">
                  <Search className="w-12 h-12 text-binance-gray-dark" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-binance-text mb-4">
                  Search for a stock to view overview
                </h3>
                <p className="text-gray-600 dark:text-binance-text-secondary max-w-md">
                  Enter a stock symbol in the sidebar to get started with real-time data, charts, and analysis.
                </p>
              </div>
            ) : (
              renderTabContent()
            )}
          </div>
        </div>
      </div>
      
      {/* Free Plan Notification */}
      <FreePlanNotification
        isVisible={showFreePlanNotification}
        onClose={() => setShowFreePlanNotification(false)}
        continent={selectedContinent === 'asia' ? 'Asia' : 'Selected Region'}
      />
    </div>
  );
}
