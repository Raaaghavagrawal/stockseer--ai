import { useState } from 'react';
import { 
  Search, 
  RefreshCw,
  ChevronLeft,
  ChevronRight
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
  const [currentTabPage, setCurrentTabPage] = useState(0);

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

  const tabsPerPage = 5;
  const totalPages = Math.ceil(allTabs.length / tabsPerPage);

  // Get current page tabs
  const getCurrentPageTabs = () => {
    const startIndex = currentTabPage * tabsPerPage;
    const endIndex = startIndex + tabsPerPage;
    return allTabs.slice(startIndex, endIndex);
  };

  // Navigation functions
  const goToPreviousPage = () => {
    setCurrentTabPage(prev => Math.max(0, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentTabPage(prev => Math.min(totalPages - 1, prev + 1));
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
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2">
            📈 StockSeer.AI
          </h1>
          <p className="text-slate-400">
            AI-Powered Stock Analysis & Portfolio Management
          </p>
        </div>
      </div>

      {/* Stock Search */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-6">
          <div className="flex space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Enter stock symbol (e.g., AAPL, TSLA, GOOGL)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStockSearch()}
                className="w-full bg-slate-700 border border-slate-600 text-white text-lg rounded px-4 py-2"
              />
            </div>
            <button 
              onClick={handleStockSearch}
              disabled={loading || !searchQuery.trim()}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 mr-2 animate-spin inline" />
              ) : (
                <Search className="w-5 h-5 mr-2 inline" />
              )}
              Search
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex items-center justify-between bg-slate-800/50 border border-slate-700 rounded-lg p-2">
            {/* Left Arrow */}
            <button
              onClick={goToPreviousPage}
              disabled={currentTabPage === 0}
              className={`p-3 rounded-xl transition-all duration-300 ease-in-out transform ${
                currentTabPage === 0
                  ? 'text-slate-500 cursor-not-allowed'
                  : 'text-slate-300 hover:text-white hover:bg-gradient-to-r hover:from-slate-700 hover:to-slate-600 hover:scale-110 hover:shadow-lg'
              }`}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Tab Buttons */}
            <div className="flex-1 flex justify-center space-x-3 mx-4">
              {getCurrentPageTabs().map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-8 py-3 text-base font-semibold rounded-xl transition-all duration-300 ease-in-out whitespace-nowrap transform hover:scale-105 hover:shadow-lg ${
                    activeTab === tab.id 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg scale-105' 
                      : 'bg-slate-700/50 border border-slate-600 text-slate-300 hover:bg-gradient-to-r hover:from-slate-600 hover:to-slate-700 hover:text-white hover:border-slate-500 hover:shadow-md'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Right Arrow */}
            <button
              onClick={goToNextPage}
              disabled={currentTabPage === totalPages - 1}
              className={`p-3 rounded-xl transition-all duration-300 ease-in-out transform ${
                currentTabPage === totalPages - 1
                  ? 'text-slate-500 cursor-not-allowed'
                  : 'text-slate-300 hover:text-white hover:bg-gradient-to-r hover:from-slate-700 hover:to-slate-600 hover:scale-110 hover:shadow-lg'
              }`}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Page Indicator */}
          <div className="flex justify-center mt-3">
            <div className="flex space-x-2">
              {Array.from({ length: totalPages }, (_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTabPage(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ease-in-out transform hover:scale-125 ${
                    index === currentTabPage
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg scale-125'
                      : 'bg-slate-600 hover:bg-gradient-to-r hover:from-slate-500 hover:to-slate-400 hover:shadow-md'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
