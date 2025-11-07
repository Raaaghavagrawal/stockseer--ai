import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  BarChart3,
  Target,
  Brain,
  Activity,
  Zap,
  Shield,
  Minus,
  ChevronRight,
  Calculator,
  PieChart,
  Globe,
  Building2,
  Gauge,
  RefreshCw,
  Clock,
  Eye,
  Star,
  AlertCircle
} from 'lucide-react';
import { fetchAllMarketData, getMockData, formatPrice, formatMarketCap } from '../utils/marketApi';
import type { PriceData } from '../utils/marketApi';
import LiveMarketData from '../components/LiveMarketData';
import LiveMetalPrices from '../components/LiveMetalPrices';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts';

// API status interface
interface ApiStatus {
  isOnline: boolean;
  lastError: string | null;
  usingMockData: boolean;
}

// Mock data for charts and predictions
const performanceData = [
  { name: 'Jan', gold: 1800, bitcoin: 42000, sp500: 3800 },
  { name: 'Feb', gold: 1850, bitcoin: 45000, sp500: 3900 },
  { name: 'Mar', gold: 1900, bitcoin: 48000, sp500: 4000 },
  { name: 'Apr', gold: 1950, bitcoin: 52000, sp500: 4100 },
  { name: 'May', gold: 2000, bitcoin: 55000, sp500: 4200 },
  { name: 'Jun', gold: 2050, bitcoin: 58000, sp500: 4300 },
  { name: 'Jul', gold: 2100, bitcoin: 62000, sp500: 4400 },
  { name: 'Aug', gold: 2150, bitcoin: 65000, sp500: 4500 },
  { name: 'Sep', gold: 2200, bitcoin: 68000, sp500: 4600 },
  { name: 'Oct', gold: 2250, bitcoin: 70000, sp500: 4700 },
  { name: 'Nov', gold: 2300, bitcoin: 72000, sp500: 4800 },
  { name: 'Dec', gold: 2350, bitcoin: 75000, sp500: 4900 }
];

const sentimentData = [
  { name: 'Gold', bullish: 65, bearish: 25, neutral: 10, color: '#FFD700' },
  { name: 'Bitcoin', bullish: 72, bearish: 18, neutral: 10, color: '#F7931A' },
  { name: 'Ethereum', bullish: 68, bearish: 22, neutral: 10, color: '#627EEA' },
  { name: 'Silver', bullish: 58, bearish: 32, neutral: 10, color: '#C0C0C0' }
];

const macroFactors = [
  { factor: 'USD Index', impact: 'High', trend: 'down', value: '103.2', change: '-0.8%' },
  { factor: 'Inflation Rate', impact: 'High', trend: 'up', value: '3.2%', change: '+0.1%' },
  { factor: 'Fed Interest Rate', impact: 'Critical', trend: 'up', value: '5.25%', change: '+0.25%' },
  { factor: 'Crude Oil', impact: 'Medium', trend: 'up', value: '$78.50', change: '+2.1%' },
  { factor: '10Y Treasury', impact: 'High', trend: 'up', value: '4.35%', change: '+0.15%' },
  { factor: 'VIX Index', impact: 'Medium', trend: 'down', value: '18.5', change: '-1.2%' }
];

const eventAlerts = [
  { 
    type: 'fed', 
    title: 'Fed Rate Decision', 
    description: 'Federal Reserve announces interest rate decision', 
    impact: 'High', 
    date: '2024-01-31',
    icon: Building2,
    color: 'text-red-500'
  },
  { 
    type: 'regulation', 
    title: 'Crypto Regulation Update', 
    description: 'New SEC guidelines for cryptocurrency trading', 
    impact: 'Medium', 
    date: '2024-02-15',
    icon: Shield,
    color: 'text-blue-500'
  },
  { 
    type: 'geopolitical', 
    title: 'Global Tensions', 
    description: 'Rising geopolitical tensions affecting safe-haven assets', 
    impact: 'High', 
    date: '2024-02-20',
    icon: Globe,
    color: 'text-orange-500'
  },
  { 
    type: 'economic', 
    title: 'Inflation Data', 
    description: 'Monthly inflation figures released', 
    impact: 'Medium', 
    date: '2024-02-25',
    icon: BarChart3,
    color: 'text-green-500'
  }
];

const GoldCryptoPage: React.FC = () => {
  const [investmentAmount, setInvestmentAmount] = useState<string>('');
  const [portfolioRecommendation, setPortfolioRecommendation] = useState<{
    gold: number;
    crypto: number;
    reasoning: string;
  } | null>(null);
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    isOnline: true,
    lastError: null,
    usingMockData: false
  });

  // Quick Actions state
  const [showPriceAlerts, setShowPriceAlerts] = useState(false);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [showMarketAnalysis, setShowMarketAnalysis] = useState(false);
  const [priceAlerts, setPriceAlerts] = useState<Array<{asset: string, price: number, type: 'above' | 'below', id: string}>>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<string>('');
  const [alertPrice, setAlertPrice] = useState<string>('');
  const [alertType, setAlertType] = useState<'above' | 'below'>('above');

  // Initialize price data
  useEffect(() => {
    loadMarketData();
  }, []);

  // Auto-refresh prices every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadMarketData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadMarketData = async () => {
    try {
      setIsRefreshing(true);
      setApiStatus(prev => ({ ...prev, lastError: null }));
      
      const data = await fetchAllMarketData();
      
      if (data.length > 0) {
        setPriceData(data);
        setLastUpdated(new Date());
        setApiStatus({
          isOnline: true,
          lastError: null,
          usingMockData: false
        });
      } else {
        // Fallback to mock data if API fails
        const mockData = getMockData();
        setPriceData(mockData);
        setLastUpdated(new Date());
        setApiStatus({
          isOnline: false,
          lastError: 'API unavailable, showing demo data',
          usingMockData: true
        });
      }
    } catch (error) {
      console.error('Error loading market data:', error);
      const mockData = getMockData();
      setPriceData(mockData);
      setLastUpdated(new Date());
      setApiStatus({
        isOnline: false,
        lastError: error instanceof Error ? error.message : 'Unknown error',
        usingMockData: true
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const refreshPrices = async () => {
    await loadMarketData();
  };

  const calculatePortfolio = () => {
    const amount = parseFloat(investmentAmount);
    if (amount > 0) {
      // Simple AI-based recommendation (in real app, this would call an API)
      const goldAllocation = Math.min(0.4, Math.max(0.2, 0.3 + (Math.random() - 0.5) * 0.2));
      const cryptoAllocation = 1 - goldAllocation;
      
      setPortfolioRecommendation({
        gold: Math.round(amount * goldAllocation),
        crypto: Math.round(amount * cryptoAllocation),
        reasoning: goldAllocation > 0.35 
          ? 'Current market conditions favor gold as a hedge against inflation'
          : 'Balanced approach with crypto for growth potential'
      });
    }
  };

  // Quick Actions helper functions
  const addPriceAlert = () => {
    if (selectedAsset && alertPrice) {
      const newAlert = {
        id: Date.now().toString(),
        asset: selectedAsset,
        price: parseFloat(alertPrice),
        type: alertType
      };
      setPriceAlerts(prev => [...prev, newAlert]);
      setSelectedAsset('');
      setAlertPrice('');
      setShowPriceAlerts(false);
    }
  };

  const removePriceAlert = (id: string) => {
    setPriceAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const toggleWatchlist = (asset: string) => {
    setWatchlist(prev => 
      prev.includes(asset) 
        ? prev.filter(item => item !== asset)
        : [...prev, asset]
    );
  };

  const getAIInsights = () => {
    setShowAIInsights(true);
    // In a real app, this would fetch AI insights
  };

  const getMarketAnalysis = () => {
    setShowMarketAnalysis(true);
    // In a real app, this would fetch market analysis
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'Critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23F59E0B' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl mb-6 shadow-lg">
              <Coins className="w-8 h-8 text-white" />
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Gold & Crypto
              <span className="block bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                Insights
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
              AI-powered forecasts and analytics for commodities and digital assets
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <Brain className="w-4 h-4 mr-2" />
                <span>AI Predictions</span>
              </div>
              <div className="flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                <span>Real-time Analytics</span>
              </div>
              <div className="flex items-center">
                <Zap className="w-4 h-4 mr-2" />
                <span>Instant Alerts</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Live Market Data Component */}
      <LiveMarketData />

      {/* Live Metal Prices Component */}
      <LiveMetalPrices />

      {/* AI Insights Section */}
      <section className="py-16 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              AI-Powered Market Insights
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Get intelligent predictions, risk analysis, and investment recommendations powered by advanced machine learning algorithms.
            </p>
          </motion.div>

          {/* AI Insights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {/* Market Sentiment */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="p-6 h-full">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-4">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Market Sentiment</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">AI Analysis</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Gold</span>
                    <div className="flex items-center">
                      <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mr-2">
                        <div className="w-3/4 h-2 bg-green-500 rounded-full"></div>
                      </div>
                      <span className="text-sm font-medium text-green-600">75% Bullish</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Bitcoin</span>
                    <div className="flex items-center">
                      <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mr-2">
                        <div className="w-4/5 h-2 bg-green-500 rounded-full"></div>
                      </div>
                      <span className="text-sm font-medium text-green-600">80% Bullish</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Silver</span>
                    <div className="flex items-center">
                      <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mr-2">
                        <div className="w-1/2 h-2 bg-yellow-500 rounded-full"></div>
                      </div>
                      <span className="text-sm font-medium text-yellow-600">50% Neutral</span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Risk Assessment */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Card className="p-6 h-full">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center mr-4">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Risk Assessment</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Portfolio Risk</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Volatility</span>
                    <span className="text-sm font-medium text-orange-600">Medium</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Correlation</span>
                    <span className="text-sm font-medium text-green-600">Low</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Diversification</span>
                    <span className="text-sm font-medium text-green-600">Good</span>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* AI Predictions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <Card className="p-6 h-full">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-4">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Predictions</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Next 30 Days</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Gold Trend</span>
                    <span className="text-sm font-medium text-green-600 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      +3.2%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Bitcoin Trend</span>
                    <span className="text-sm font-medium text-green-600 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      +8.5%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Confidence</span>
                    <span className="text-sm font-medium text-blue-600">85%</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Real-time Prices Section */}
      <section className="py-8 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-green-500 mr-2" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Live Prices</h2>
              <div className="ml-4 flex items-center text-sm text-gray-500 dark:text-gray-400">
                <div className={`w-2 h-2 rounded-full animate-pulse mr-2 ${apiStatus.isOnline ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
              {apiStatus.usingMockData && (
                <div className="ml-4 flex items-center text-sm text-orange-500">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Demo Data
                </div>
              )}
            </div>
            <Button 
              onClick={refreshPrices}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              className="flex items-center"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
            {priceData.map((asset, index) => (
              <motion.div
                key={asset.symbol}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="text-2xl mr-2">{asset.icon}</div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{asset.symbol}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{asset.name}</p>
                    </div>
                  </div>
                  <div className={`flex items-center ${asset.changePercent24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {asset.changePercent24h >= 0 ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    <span className="text-xs font-medium">
                      {asset.changePercent24h >= 0 ? '+' : ''}{asset.changePercent24h.toFixed(2)}%
                    </span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    ${formatPrice(asset.price, asset.symbol)}
                  </div>
                  <div className={`text-sm ${asset.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {asset.change24h >= 0 ? '+' : ''}${asset.change24h.toFixed(2)}
                  </div>
                  {asset.marketCap && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      MCap: {formatMarketCap(asset.marketCap)}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* AI Price Prediction */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <Brain className="w-6 h-6 text-purple-500 mr-3" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Price Predictions</h2>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Star className="w-4 h-4 mr-1" />
                    <span>Powered by Machine Learning</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Gold Prediction */}
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="text-3xl mr-3">🥇</div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Gold</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Current: ${formatPrice(priceData.find(p => p.symbol === 'GOLD')?.price || 2347.85, 'GOLD')}/oz
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center text-green-500">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          <span className="font-semibold text-sm">Bullish</span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">+0.53% (24h)</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Target Price</span>
                        <span className="font-semibold text-gray-900 dark:text-white">$2,450</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Confidence</span>
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                          </div>
                          <span className="text-sm font-semibold">85%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Timeframe</span>
                        <span className="text-sm font-semibold">3 months</span>
                      </div>
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Strong inflation hedge demand expected
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bitcoin Prediction */}
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-6 border border-orange-200 dark:border-orange-800 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="text-3xl mr-3">₿</div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Bitcoin</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Current: ${formatPrice(priceData.find(p => p.symbol === 'BTC')?.price || 75234, 'BTC')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center text-green-500">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          <span className="font-semibold text-sm">Bullish</span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">+3.94% (24h)</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Target Price</span>
                        <span className="font-semibold text-gray-900 dark:text-white">$85,000</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Confidence</span>
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                          </div>
                          <span className="text-sm font-semibold">78%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Timeframe</span>
                        <span className="text-sm font-semibold">6 months</span>
                      </div>
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Institutional adoption accelerating
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Ethereum Prediction */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="text-3xl mr-3">Ξ</div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ethereum</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Current: ${formatPrice(priceData.find(p => p.symbol === 'ETH')?.price || 3847, 'ETH')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center text-green-500">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          <span className="font-semibold text-sm">Bullish</span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">+2.39% (24h)</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Target Price</span>
                        <span className="font-semibold text-gray-900 dark:text-white">$4,200</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Confidence</span>
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: '72%' }}></div>
                          </div>
                          <span className="text-sm font-semibold">72%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Timeframe</span>
                        <span className="text-sm font-semibold">4 months</span>
                      </div>
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          DeFi ecosystem growth driving demand
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Macro Factor Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card className="p-6">
                <div className="flex items-center mb-6">
                  <BarChart3 className="w-6 h-6 text-blue-500 mr-3" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Macro Factor Analysis</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {macroFactors.map((factor, index) => (
                    <motion.div
                      key={factor.factor}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{factor.factor}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(factor.impact)}`}>
                          {factor.impact}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">{factor.value}</span>
                        <div className="flex items-center">
                          {getTrendIcon(factor.trend)}
                          <span className={`text-sm font-medium ml-1 ${
                            factor.trend === 'up' ? 'text-green-500' : 
                            factor.trend === 'down' ? 'text-red-500' : 'text-gray-500'
                          }`}>
                            {factor.change}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Event-Driven Alerts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="p-6">
                <div className="flex items-center mb-6">
                  <AlertTriangle className="w-6 h-6 text-orange-500 mr-3" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Event-Driven Alerts</h2>
                </div>
                
                <div className="space-y-4">
                  {eventAlerts.map((alert, index) => (
                    <motion.div
                      key={alert.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="flex items-start p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                    >
                      <div className={`p-2 rounded-lg bg-white dark:bg-gray-700 mr-4 ${alert.color}`}>
                        <alert.icon className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">{alert.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(alert.impact)}`}>
                            {alert.impact} Impact
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{alert.description}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">{alert.date}</p>
                      </div>
                      
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Gold vs Other Assets Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="p-6">
                <div className="flex items-center mb-6">
                  <Activity className="w-6 h-6 text-green-500 mr-3" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gold vs Other Assets</h2>
                </div>
                
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === 'gold' ? `$${value}/oz` : 
                          name === 'bitcoin' ? `$${value.toLocaleString()}` : 
                          `$${value}`, 
                          name === 'gold' ? 'Gold' : 
                          name === 'bitcoin' ? 'Bitcoin' : 'S&P 500'
                        ]}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="gold" 
                        stroke="#FFD700" 
                        strokeWidth={3}
                        dot={{ fill: '#FFD700', strokeWidth: 2, r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="bitcoin" 
                        stroke="#F7931A" 
                        strokeWidth={3}
                        dot={{ fill: '#F7931A', strokeWidth: 2, r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="sp500" 
                        stroke="#3B82F6" 
                        strokeWidth={3}
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-8">
            
            {/* Market Overview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <BarChart3 className="w-5 h-5 text-blue-500 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Live Market</h3>
                  </div>
                  <Eye className="w-4 h-4 text-gray-400" />
                </div>
                
                <div className="space-y-4">
                  {priceData.slice(0, 6).map((asset) => (
                    <div key={asset.symbol} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                      <div className="flex items-center">
                        <div className="text-lg mr-2">{asset.icon}</div>
                        <div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{asset.symbol}</span>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{asset.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">
                          ${formatPrice(asset.price, asset.symbol)}
                        </div>
                        <div className={`flex items-center text-xs ${asset.changePercent24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {asset.changePercent24h >= 0 ? (
                            <TrendingUp className="w-3 h-3 mr-1" />
                          ) : (
                            <TrendingDown className="w-3 h-3 mr-1" />
                          )}
                          <span>{asset.changePercent24h >= 0 ? '+' : ''}{asset.changePercent24h.toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Market Sentiment</span>
                      <div className="text-right">
                        <span className="font-semibold text-orange-500">Bullish</span>
                        <div className="text-xs text-gray-600 dark:text-gray-400">72/100</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
            
            {/* Portfolio Simulation */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card className="p-6">
                <div className="flex items-center mb-6">
                  <Calculator className="w-6 h-6 text-purple-500 mr-3" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Portfolio Simulation</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Enter investment amount
                    </label>
                    <Input
                      type="number"
                      placeholder="e.g., 10000"
                      value={investmentAmount}
                      onChange={(e) => setInvestmentAmount(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  
                  <Button 
                    onClick={calculatePortfolio}
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                  >
                    Calculate Portfolio
                  </Button>
                  
                  {portfolioRecommendation && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
                    >
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Recommended Allocation</h4>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <Coins className="w-4 h-4 text-yellow-500 mr-2" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">Gold</span>
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            ${portfolioRecommendation.gold.toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center mr-2">
                              <span className="text-white font-bold text-xs">₿</span>
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Crypto</span>
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            ${portfolioRecommendation.crypto.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {portfolioRecommendation.reasoning}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Sentiment & Insights */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Card className="p-6">
                <div className="flex items-center mb-6">
                  <Gauge className="w-6 h-6 text-green-500 mr-3" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Market Sentiment</h3>
                </div>
                
                <div className="space-y-4">
                  {sentimentData.map((asset, index) => (
                    <motion.div
                      key={asset.name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: asset.color }}
                          ></div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{asset.name}</span>
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {asset.bullish}% Bullish
                        </span>
                      </div>
                      
                      <div className="flex space-x-1">
                        <div 
                          className="h-2 rounded-l-full bg-green-500" 
                          style={{ width: `${asset.bullish}%` }}
                        ></div>
                        <div 
                          className="h-2 bg-gray-300 dark:bg-gray-600" 
                          style={{ width: `${asset.neutral}%` }}
                        ></div>
                        <div 
                          className="h-2 rounded-r-full bg-red-500" 
                          style={{ width: `${asset.bearish}%` }}
                        ></div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Enhanced Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Quick Actions</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {priceAlerts.length} alerts • {watchlist.length} watched
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setShowPriceAlerts(!showPriceAlerts)}
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Price Alerts ({priceAlerts.length})
                  </Button>
                  
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setShowPortfolio(!showPortfolio)}
                  >
                    <PieChart className="w-4 h-4 mr-2" />
                    Portfolio
                  </Button>
                  
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={getAIInsights}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    AI Insights
                  </Button>
                  
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={getMarketAnalysis}
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    Market Analysis
                  </Button>
                </div>

                {/* Price Alerts Section */}
                {showPriceAlerts && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600"
                  >
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Set Price Alert</h4>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Asset
                          </label>
                          <select
                            value={selectedAsset}
                            onChange={(e) => setSelectedAsset(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="">Select Asset</option>
                            <option value="Gold">Gold</option>
                            <option value="Bitcoin">Bitcoin</option>
                            <option value="Ethereum">Ethereum</option>
                            <option value="Silver">Silver</option>
                            <option value="Platinum">Platinum</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Price
                          </label>
                          <Input
                            type="number"
                            placeholder="Enter price"
                            value={alertPrice}
                            onChange={(e) => setAlertPrice(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="above"
                            name="alertType"
                            value="above"
                            checked={alertType === 'above'}
                            onChange={(e) => setAlertType(e.target.value as 'above' | 'below')}
                            className="text-blue-600"
                          />
                          <label htmlFor="above" className="text-sm text-gray-700 dark:text-gray-300">
                            Above
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="below"
                            name="alertType"
                            value="below"
                            checked={alertType === 'below'}
                            onChange={(e) => setAlertType(e.target.value as 'above' | 'below')}
                            className="text-blue-600"
                          />
                          <label htmlFor="below" className="text-sm text-gray-700 dark:text-gray-300">
                            Below
                          </label>
                        </div>
                      </div>
                      
                      <Button onClick={addPriceAlert} className="w-full">
                        Add Alert
                      </Button>
                    </div>

                    {/* Active Alerts */}
                    {priceAlerts.length > 0 && (
                      <div className="mt-4">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Active Alerts</h5>
                        <div className="space-y-2">
                          {priceAlerts.map((alert) => (
                            <div key={alert.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium">{alert.asset}</span>
                                <span className="text-sm text-gray-500">
                                  {alert.type === 'above' ? '>' : '<'} ${alert.price.toLocaleString()}
                                </span>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removePriceAlert(alert.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Portfolio Section */}
                {showPortfolio && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600"
                  >
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Watchlist</h4>
                    
                    <div className="space-y-2">
                      {priceData.map((asset) => (
                        <div key={asset.symbol} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{asset.icon}</span>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">{asset.symbol}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{asset.name}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {formatPrice(asset.price, asset.symbol)}
                            </span>
                            <Button
                              size="sm"
                              variant={watchlist.includes(asset.symbol) ? "default" : "outline"}
                              onClick={() => toggleWatchlist(asset.symbol)}
                            >
                              {watchlist.includes(asset.symbol) ? 'Watching' : 'Watch'}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* AI Insights Modal */}
                {showAIInsights && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">AI Insights</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowAIInsights(false)}
                      >
                        Close
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Brain className="w-5 h-5 text-blue-500" />
                          <span className="font-medium text-gray-900 dark:text-white">Market Analysis</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Current market conditions show strong bullish sentiment for precious metals and moderate optimism for cryptocurrencies. 
                          Gold appears to be a safe haven with inflation concerns, while Bitcoin shows technical strength above key support levels.
                        </p>
                      </div>
                      
                      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Target className="w-5 h-5 text-green-500" />
                          <span className="font-medium text-gray-900 dark:text-white">Recommendations</span>
                        </div>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <li>• Consider increasing gold allocation to 40-50% of portfolio</li>
                          <li>• Bitcoin shows strong technical indicators for short-term gains</li>
                          <li>• Silver may present buying opportunity below $25/oz</li>
                          <li>• Monitor Fed policy changes for market direction</li>
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Market Analysis Modal */}
                {showMarketAnalysis && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Market Analysis</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowMarketAnalysis(false)}
                      >
                        Close
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <h5 className="font-medium text-gray-900 dark:text-white mb-2">Technical Indicators</h5>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">RSI (Gold)</span>
                              <span className="text-green-600">65 (Neutral)</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">MACD (BTC)</span>
                              <span className="text-green-600">Bullish</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Volume</span>
                              <span className="text-orange-600">Above Average</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <h5 className="font-medium text-gray-900 dark:text-white mb-2">Market Sentiment</h5>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Fear & Greed Index</span>
                              <span className="text-yellow-600">55 (Neutral)</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Volatility</span>
                              <span className="text-orange-600">Medium</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Trend</span>
                              <span className="text-green-600">Upward</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoldCryptoPage;
