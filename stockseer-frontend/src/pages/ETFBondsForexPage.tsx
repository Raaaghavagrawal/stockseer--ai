'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Filter, 
  Bell, 
  BarChart3, 
  PieChart, 
  Globe, 
  Shield, 
  Target,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Bookmark,
  BookmarkCheck,
  LineChart,
  Minus,
  Plus,
  HelpCircle,
  Lightbulb,
  Award,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';

// Types
interface ETFData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  category: string;
  expenseRatio: number;
  assets: number;
  recommendation: 'buy' | 'hold' | 'sell';
  trend: 'up' | 'down' | 'sideways';
}

interface BondData {
  name: string;
  symbol: string;
  yield: number;
  maturityDate: string;
  price: number;
  rating: string;
  type: 'government' | 'corporate';
  duration: number;
  coupon: number;
}

interface ForexData {
  pair: string;
  bid: number;
  ask: number;
  change: number;
  changePercent: number;
  high24h: number;
  low24h: number;
  volume: number;
  trend: 'up' | 'down' | 'sideways';
}

interface PortfolioAllocation {
  etf: number;
  bonds: number;
  forex: number;
  cash: number;
}

// Mock data
const mockETFs: ETFData[] = [
  {
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    price: 445.67,
    change: 2.34,
    changePercent: 0.53,
    volume: 45678900,
    category: 'Large Cap',
    expenseRatio: 0.0945,
    assets: 400000000000,
    recommendation: 'buy',
    trend: 'up'
  },
  {
    symbol: 'QQQ',
    name: 'Invesco QQQ Trust',
    price: 378.45,
    change: -1.23,
    changePercent: -0.32,
    volume: 34567800,
    category: 'Technology',
    expenseRatio: 0.20,
    assets: 200000000000,
    recommendation: 'hold',
    trend: 'sideways'
  },
  {
    symbol: 'VTI',
    name: 'Vanguard Total Stock Market ETF',
    price: 234.56,
    change: 1.45,
    changePercent: 0.62,
    volume: 23456700,
    category: 'Total Market',
    expenseRatio: 0.03,
    assets: 300000000000,
    recommendation: 'buy',
    trend: 'up'
  },
  {
    symbol: 'IWM',
    name: 'iShares Russell 2000 ETF',
    price: 198.34,
    change: -0.87,
    changePercent: -0.44,
    volume: 12345600,
    category: 'Small Cap',
    expenseRatio: 0.19,
    assets: 50000000000,
    recommendation: 'hold',
    trend: 'down'
  }
];

const mockBonds: BondData[] = [
  {
    name: 'US Treasury 10Y',
    symbol: 'US10Y',
    yield: 4.25,
    maturityDate: '2034-02-15',
    price: 98.45,
    rating: 'AAA',
    type: 'government',
    duration: 8.5,
    coupon: 4.25
  },
  {
    name: 'Apple Inc. Corporate Bond',
    symbol: 'AAPL-CB',
    yield: 5.12,
    maturityDate: '2029-03-15',
    price: 102.34,
    rating: 'AA+',
    type: 'corporate',
    duration: 4.2,
    coupon: 5.0
  },
  {
    name: 'US Treasury 2Y',
    symbol: 'US2Y',
    yield: 4.85,
    maturityDate: '2026-02-15',
    price: 99.12,
    rating: 'AAA',
    type: 'government',
    duration: 1.8,
    coupon: 4.85
  }
];

const mockForex: ForexData[] = [
  {
    pair: 'USD/INR',
    bid: 83.25,
    ask: 83.27,
    change: 0.15,
    changePercent: 0.18,
    high24h: 83.45,
    low24h: 82.95,
    volume: 1250000000,
    trend: 'up'
  },
  {
    pair: 'EUR/USD',
    bid: 1.0845,
    ask: 1.0847,
    change: -0.0023,
    changePercent: -0.21,
    high24h: 1.0890,
    low24h: 1.0820,
    volume: 890000000,
    trend: 'down'
  },
  {
    pair: 'GBP/INR',
    bid: 105.67,
    ask: 105.72,
    change: 0.45,
    changePercent: 0.43,
    high24h: 106.20,
    low24h: 104.85,
    volume: 450000000,
    trend: 'up'
  },
  {
    pair: 'JPY/USD',
    bid: 149.85,
    ask: 149.88,
    change: -0.32,
    changePercent: -0.21,
    high24h: 150.45,
    low24h: 149.20,
    volume: 670000000,
    trend: 'down'
  }
];

const ETFBondsForexPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'etf' | 'bonds' | 'forex'>('etf');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [portfolioAmount, setPortfolioAmount] = useState<number>(10000);
  const [showAlerts, setShowAlerts] = useState(false);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'price' | 'change' | 'volume' | 'yield'>('change');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showTutorial, setShowTutorial] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [alertInput, setAlertInput] = useState('');

  // Enhanced filtering and sorting with useMemo for performance
  const filteredETFs = useMemo(() => {
    let filtered = mockETFs.filter(etf => 
      etf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      etf.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Apply category filter
    if (selectedCategory === 'trending') {
      filtered = filtered.filter(etf => etf.recommendation === 'buy');
    } else if (selectedCategory === 'high-yield') {
      filtered = filtered.filter(etf => etf.changePercent > 1);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'change':
          aValue = a.changePercent;
          bValue = b.changePercent;
          break;
        case 'volume':
          aValue = a.volume;
          bValue = b.volume;
          break;
        default:
          aValue = a.changePercent;
          bValue = b.changePercent;
      }
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [searchQuery, selectedCategory, sortBy, sortOrder]);

  const filteredBonds = useMemo(() => {
    let filtered = mockBonds.filter(bond => 
      bond.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bond.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Apply sorting for bonds
    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'yield':
          aValue = a.yield;
          bValue = b.yield;
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        default:
          aValue = a.yield;
          bValue = b.yield;
      }
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [searchQuery, sortBy, sortOrder]);

  const filteredForex = useMemo(() => {
    let filtered = mockForex.filter(forex => 
      forex.pair.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Apply sorting for forex
    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'price':
          aValue = a.bid;
          bValue = b.bid;
          break;
        case 'change':
          aValue = a.changePercent;
          bValue = b.changePercent;
          break;
        default:
          aValue = a.changePercent;
          bValue = b.changePercent;
      }
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [searchQuery, sortBy, sortOrder]);

  // Helper functions
  const toggleWatchlist = (symbol: string) => {
    setWatchlist(prev => 
      prev.includes(symbol) 
        ? prev.filter(item => item !== symbol)
        : [...prev, symbol]
    );
  };

  const toggleAssetSelection = (symbol: string) => {
    setSelectedAssets(prev => 
      prev.includes(symbol) 
        ? prev.filter(item => item !== symbol)
        : [...prev, symbol]
    );
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLastUpdated(new Date());
    setIsRefreshing(false);
  };

  const addAlert = (alert: string) => {
    if (alert.trim() && !alerts.includes(alert.trim())) {
      setAlerts(prev => [...prev, alert.trim()]);
    }
  };

  const removeAlert = (index: number) => {
    setAlerts(prev => prev.filter((_, i) => i !== index));
  };

  // Portfolio simulation with enhanced calculations
  const calculatePortfolioAllocation = (amount: number): PortfolioAllocation => {
    return {
      etf: amount * 0.4,
      bonds: amount * 0.3,
      forex: amount * 0.1,
      cash: amount * 0.2
    };
  };

  const portfolioAllocation = calculatePortfolioAllocation(portfolioAmount);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Get trend color
  const getTrendColor = (trend: string, change: number): string => {
    if (trend === 'up' || change > 0) return 'text-green-500';
    if (trend === 'down' || change < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  // Get recommendation color
  const getRecommendationColor = (recommendation: string): string => {
    switch (recommendation) {
      case 'buy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'sell': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  // Get rating color
  const getRatingColor = (rating: string): string => {
    if (rating.includes('AAA')) return 'text-green-600';
    if (rating.includes('AA')) return 'text-blue-600';
    if (rating.includes('A')) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    ETF, Bonds & Forex
                  </h1>
                  <div className="flex items-center space-x-4 mt-1">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                      <span>Live Data</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
                Comprehensive investment tools for ETFs, bonds, and forex trading with AI-driven insights and real-time market data.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowTutorial(!showTutorial)}
                className="flex items-center space-x-2"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Tutorial</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAlerts(!showAlerts)}
                className="flex items-center space-x-2"
              >
                <Bell className="w-4 h-4" />
                <span>Alerts ({alerts.length})</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowComparison(!showComparison)}
                className="flex items-center space-x-2"
              >
                <LineChart className="w-4 h-4" />
                <span>Compare</span>
              </Button>
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total ETFs</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{mockETFs.length}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Bonds</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{mockBonds.length}</p>
                </div>
                <Shield className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Forex Pairs</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{mockForex.length}</p>
                </div>
                <Globe className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Watchlist</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{watchlist.length}</p>
                </div>
                <Bookmark className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Search and Filter */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search ETFs, bonds, or currency pairs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory('all')}
                  className="flex items-center space-x-1"
                >
                  <Filter className="w-4 h-4" />
                  <span>All</span>
                </Button>
                <Button
                  variant={selectedCategory === 'trending' ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory('trending')}
                  className="flex items-center space-x-1"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Trending</span>
                </Button>
                <Button
                  variant={selectedCategory === 'high-yield' ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory('high-yield')}
                  className="flex items-center space-x-1"
                >
                  <Award className="w-4 h-4" />
                  <span>High Yield</span>
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  onClick={() => setViewMode('grid')}
                  size="sm"
                >
                  <BarChart3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  onClick={() => setViewMode('table')}
                  size="sm"
                >
                  <LineChart className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Advanced Filters */}
            <div className="mt-4 flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="change">Change %</option>
                  <option value="price">Price</option>
                  <option value="volume">Volume</option>
                  {activeTab === 'bonds' && <option value="yield">Yield</option>}
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Order:</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="flex items-center space-x-1"
                >
                  {sortOrder === 'asc' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
                </Button>
              </div>

              {selectedAssets.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedAssets.length} selected
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedAssets([])}
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'etf', name: 'ETFs', icon: BarChart3 },
                { id: 'bonds', name: 'Bonds', icon: Shield },
                { id: 'forex', name: 'Forex', icon: Globe }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* ETF Section */}
        {activeTab === 'etf' && (
          <div className="space-y-6">
            {/* AI Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <span>AI-Driven ETF Recommendations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredETFs.slice(0, 3).map((etf, index) => (
                    <motion.div
                      key={etf.symbol}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-900 dark:text-white">{etf.symbol}</span>
                          <Badge className={getRecommendationColor(etf.recommendation)}>
                            {etf.recommendation.toUpperCase()}
                          </Badge>
                        </div>
                        <div className={`flex items-center ${getTrendColor(etf.trend, etf.change)}`}>
                          {etf.trend === 'up' ? <TrendingUpIcon className="w-4 h-4" /> : 
                           etf.trend === 'down' ? <TrendingDownIcon className="w-4 h-4" /> : 
                           <Activity className="w-4 h-4" />}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{etf.name}</div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(etf.price)}
                        </span>
                        <span className={`text-sm ${getTrendColor(etf.trend, etf.change)}`}>
                          {formatPercentage(etf.changePercent)}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ETF Display - Grid or Table View */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Popular ETFs</CardTitle>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {filteredETFs.length} results
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
                    >
                      {viewMode === 'grid' ? <LineChart className="w-4 h-4" /> : <BarChart3 className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredETFs.map((etf, index) => (
                      <motion.div
                        key={etf.symbol}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-4 border rounded-lg hover:shadow-md transition-all cursor-pointer ${
                          selectedAssets.includes(etf.symbol) 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                        onClick={() => toggleAssetSelection(etf.symbol)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-900 dark:text-white">{etf.symbol}</span>
                            <Badge className={getRecommendationColor(etf.recommendation)}>
                              {etf.recommendation.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleWatchlist(etf.symbol);
                              }}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            >
                              {watchlist.includes(etf.symbol) ? (
                                <BookmarkCheck className="w-4 h-4 text-orange-500" />
                              ) : (
                                <Bookmark className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                            <div className={`flex items-center ${getTrendColor(etf.trend, etf.change)}`}>
                              {etf.trend === 'up' ? <TrendingUpIcon className="w-4 h-4" /> : 
                               etf.trend === 'down' ? <TrendingDownIcon className="w-4 h-4" /> : 
                               <Activity className="w-4 h-4" />}
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{etf.name}</div>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(etf.price)}
                            </span>
                            <span className={`text-sm font-medium ${getTrendColor(etf.trend, etf.change)}`}>
                              {formatPercentage(etf.changePercent)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>Vol: {(etf.volume / 1000000).toFixed(1)}M</span>
                            <span>Expense: {etf.expenseRatio}%</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Symbol</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Name</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Price</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Change</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Volume</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredETFs.map((etf, index) => (
                          <motion.tr
                            key={etf.symbol}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-gray-900 dark:text-white">{etf.symbol}</span>
                                <Badge variant="outline" className="text-xs">{etf.category}</Badge>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{etf.name}</td>
                            <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(etf.price)}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className={`text-sm ${getTrendColor(etf.trend, etf.change)}`}>
                                {formatPercentage(etf.changePercent)}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right text-sm text-gray-600 dark:text-gray-400">
                              {(etf.volume / 1000000).toFixed(1)}M
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center space-x-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => toggleWatchlist(etf.symbol)}
                                >
                                  {watchlist.includes(etf.symbol) ? (
                                    <BookmarkCheck className="w-4 h-4" />
                                  ) : (
                                    <Bookmark className="w-4 h-4" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => toggleAssetSelection(etf.symbol)}
                                >
                                  {selectedAssets.includes(etf.symbol) ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                </Button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bonds Section */}
        {activeTab === 'bonds' && (
          <div className="space-y-6">
            {/* Interest Rate Sensitivity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  <span>Interest Rate Sensitivity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">+0.25%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Rate Increase Impact</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">-0.15%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Rate Decrease Impact</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">8.5Y</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Average Duration</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bonds Table */}
            <Card>
              <CardHeader>
                <CardTitle>Government & Corporate Bonds</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Name</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Yield</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Price</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Rating</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Maturity</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBonds.map((bond, index) => (
                        <motion.tr
                          key={bond.symbol}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-white">{bond.name}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">{bond.symbol}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white">
                            {bond.yield.toFixed(2)}%
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(bond.price)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`font-semibold ${getRatingColor(bond.rating)}`}>
                              {bond.rating}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-sm text-gray-600 dark:text-gray-400">
                            {new Date(bond.maturityDate).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant={bond.type === 'government' ? 'default' : 'secondary'}>
                              {bond.type}
                            </Badge>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Forex Section */}
        {activeTab === 'forex' && (
          <div className="space-y-6">
            {/* Live Forex Rates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="w-5 h-5 text-green-500" />
                  <span>Live Forex Rates</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {filteredForex.map((forex, index) => (
                    <motion.div
                      key={forex.pair}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900 dark:text-white">{forex.pair}</span>
                        <div className={`flex items-center ${getTrendColor(forex.trend, forex.change)}`}>
                          {forex.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : 
                           forex.trend === 'down' ? <ArrowDownRight className="w-4 h-4" /> : 
                           <Activity className="w-4 h-4" />}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Bid:</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{forex.bid.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Ask:</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{forex.ask.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Change:</span>
                          <span className={`font-semibold ${getTrendColor(forex.trend, forex.change)}`}>
                            {formatPercentage(forex.changePercent)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Currency Heatmap */}
            <Card>
              <CardHeader>
                <CardTitle>Currency Strength Heatmap</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['USD', 'EUR', 'GBP', 'JPY', 'INR', 'CAD', 'AUD', 'CHF'].map((currency, index) => (
                    <div
                      key={currency}
                      className={`p-4 rounded-lg text-center ${
                        index < 2 ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' :
                        index < 4 ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200' :
                        'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                      }`}
                    >
                      <div className="font-semibold">{currency}</div>
                      <div className="text-sm">
                        {index < 2 ? 'Strong' : index < 4 ? 'Neutral' : 'Weak'}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Portfolio Simulation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="w-5 h-5 text-purple-500" />
              <span>Portfolio Simulation</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Investment Amount
                </label>
                <Input
                  type="number"
                  value={portfolioAmount.toString()}
                  onChange={(e) => setPortfolioAmount(Number(e.target.value))}
                  placeholder="Enter amount"
                  className="mb-4"
                />
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">ETFs (40%)</span>
                    <span className="font-semibold">{formatCurrency(portfolioAllocation.etf)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Bonds (30%)</span>
                    <span className="font-semibold">{formatCurrency(portfolioAllocation.bonds)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Forex (10%)</span>
                    <span className="font-semibold">{formatCurrency(portfolioAllocation.forex)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Cash (20%)</span>
                    <span className="font-semibold">{formatCurrency(portfolioAllocation.cash)}</span>
                  </div>
                </div>
              </div>
              <div>
                <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 dark:text-gray-400">Portfolio Allocation Chart</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tutorial Section */}
        <AnimatePresence>
          {showTutorial && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                    <span>How to Use This Platform</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                        <BarChart3 className="w-5 h-5 text-blue-500" />
                        <span>ETFs</span>
                      </h4>
                      <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <li>• Diversified investment funds</li>
                        <li>• Lower risk than individual stocks</li>
                        <li>• Look for low expense ratios</li>
                        <li>• Consider your investment goals</li>
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                        <Shield className="w-5 h-5 text-green-500" />
                        <span>Bonds</span>
                      </h4>
                      <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <li>• Fixed income investments</li>
                        <li>• Government bonds are safer</li>
                        <li>• Higher yield = higher risk</li>
                        <li>• Consider interest rate sensitivity</li>
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                        <Globe className="w-5 h-5 text-purple-500" />
                        <span>Forex</span>
                      </h4>
                      <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <li>• Currency pair trading</li>
                        <li>• High volatility and risk</li>
                        <li>• Watch economic indicators</li>
                        <li>• Use proper risk management</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Comparison Tools */}
        <AnimatePresence>
          {showComparison && selectedAssets.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <LineChart className="w-5 h-5 text-blue-500" />
                    <span>Asset Comparison</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Comparing {selectedAssets.length} assets
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedAssets([])}
                      >
                        Clear Selection
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedAssets.map(symbol => {
                        const etfAsset = mockETFs.find(a => a.symbol === symbol);
                        const bondAsset = mockBonds.find(a => a.symbol === symbol);
                        const forexAsset = mockForex.find(a => a.pair === symbol);
                        const asset = etfAsset || bondAsset || forexAsset;
                        
                        if (!asset) return null;
                        
                        const price = (asset as any).price || (asset as any).bid || 0;
                        const changePercent = (asset as any).changePercent || 0;
                        const trend = (asset as any).trend || 'sideways';
                        const change = (asset as any).change || 0;
                        
                        return (
                          <div key={symbol} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {symbol}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleAssetSelection(symbol)}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Price:</span>
                                <span className="font-medium">
                                  {formatCurrency(price)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Change:</span>
                                <span className={`font-medium ${getTrendColor(trend, change)}`}>
                                  {formatPercentage(changePercent)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Alerts Section */}
        <AnimatePresence>
          {showAlerts && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="w-5 h-5 text-orange-500" />
                    <span>Price Alerts</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <Input 
                        placeholder="Set price alert..." 
                        className="flex-1"
                        value={alertInput}
                        onChange={(e) => setAlertInput(e.target.value)}
                      />
                      <Button onClick={() => {
                        if (alertInput.trim()) {
                          addAlert(alertInput.trim());
                          setAlertInput('');
                        }
                      }}>
                        Add Alert
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {alerts.length === 0 ? (
                        <p className="text-gray-600 dark:text-gray-400 text-center py-4">
                          No alerts set. Create your first price alert above.
                        </p>
                      ) : (
                        alerts.map((alert, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <span className="text-sm">{alert}</span>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => removeAlert(index)}
                            >
                              Remove
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ETFBondsForexPage;
