import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  RefreshCw,
  Menu,
  X,
  Home
} from 'lucide-react';

// Import all tab components
import OverviewTab from '../components/tabs/OverviewTab';
import FinancialsTab from '../components/tabs/FinancialsTab';
import NewsTab from '../components/tabs/NewsTab';
import PerformanceTab from '../components/tabs/PerformanceTab';
import ChatTab from '../components/tabs/ChatTab';
import AIRiskNewsTab from '../components/tabs/AIRiskNewsTab';
import LifePlannerTab from '../components/tabs/LifePlannerTab';
import AboutCompanyTab from '../components/tabs/AboutCompanyTab';
import AboutStockSeerTab from '../components/tabs/AboutStockSeerTab';
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
  const [selectedStock, setSelectedStock] = useState<string>('');
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [chartData, setChartData] = useState<StockChartData[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
    { id: 'about-stockseer', label: 'ℹ️ About' },
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

  const handleStockSearch = async () => {
    if (searchQuery.trim()) {
      await fetchStockData(searchQuery.trim().toUpperCase());
      setSelectedStock(searchQuery.trim().toUpperCase());
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
      case 'about-stockseer':
        return <AboutStockSeerTab />;
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
    <div className="min-h-screen bg-background text-white flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-card border-r border-border transition-all duration-300 flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div>
                <h1 className="text-xl font-bold text-white">📈 StockSeer.AI</h1>
                <p className="text-xs text-slate-400">AI-Powered Analysis</p>
              </div>
            )}
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Stock Search */}
        <div className="p-4 border-b border-border">
          <div className="space-y-3">
            <div>
              <input
                type="text"
                placeholder={sidebarOpen ? "Enter stock symbol" : "Symbol"}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStockSearch()}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded px-3 py-2 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button 
              onClick={handleStockSearch}
              disabled={loading || !searchQuery.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center"
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
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-300 hover:bg-secondary hover:text-white'
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
          <div className="p-4 border-t border-border">
            <div className="text-xs text-slate-400 text-center">
              {selectedStock && (
                <div>
                  <div className="font-medium text-white">{selectedStock}</div>
                  {stockData && (
                    <div className="text-green-400">${stockData.price?.toFixed(2)}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-card border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                title="Go to Home"
              >
                <Home className="w-5 h-5" />
              </Link>
              <div>
                <h2 className="text-2xl font-bold text-white capitalize">
                  {allTabs.find(tab => tab.id === activeTab)?.label || 'Dashboard'}
                </h2>
                {selectedStock && (
                  <p className="text-slate-400">Analyzing {selectedStock}</p>
                )}
              </div>
            </div>
            {selectedStock && stockData && (
              <div className="text-right">
                <div className="text-2xl font-bold text-white">${stockData.price?.toFixed(2)}</div>
                <div className={`text-sm ${stockData.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stockData.changePercent >= 0 ? '+' : ''}{stockData.changePercent?.toFixed(2)}%
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="bg-card/50 border border-border rounded-lg p-6 h-full">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
