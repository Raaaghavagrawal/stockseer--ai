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
  Clock,
  ChevronDown,
  X
} from 'lucide-react';
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
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0B0E11] via-[#1E2329] to-[#0B0E11] border-b border-[#2B3139] py-12">
        {/* Animated background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center space-x-4 mb-4"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-[#F0B90B] to-[#FCD535] rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
                  <BarChart3 className="w-7 h-7 text-[#0B0E11]" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white tracking-tight font-orbitron">
                    ETF, <span className="text-[#F0B90B]">Bonds</span> & Forex
                  </h1>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center text-xs font-medium text-[#848E9C] bg-[#2B3139] px-2 py-1 rounded-md">
                      <Clock className="w-3.5 h-3.5 mr-1.5" />
                      <span>{lastUpdated.toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center text-xs font-medium text-[#02C076] bg-[#02C076]/10 px-2 py-1 rounded-md">
                      <div className="w-1.5 h-1.5 bg-[#02C076] rounded-full animate-pulse mr-1.5"></div>
                      <span>LIVE MARKET DATA</span>
                    </div>
                  </div>
                </div>
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-[#848E9C] text-lg max-w-2xl leading-relaxed"
              >
                Master your portfolio with professional-grade tools. Access AI-driven ETF predictions, real-time treasury analytics, and institutional forex data.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center gap-3"
            >
              <Button
                variant="outline"
                onClick={() => setShowTutorial(!showTutorial)}
                className="bg-[#2B3139] border-[#3A4049] hover:bg-[#3A4049] text-[#EAECEF] rounded-xl px-5"
              >
                <HelpCircle className="w-4.5 h-4.5 mr-2" />
                Tutorial
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAlerts(!showAlerts)}
                className="bg-[#2B3139] border-[#3A4049] hover:bg-[#3A4049] text-[#EAECEF] rounded-xl px-5 relative"
              >
                <Bell className="w-4.5 h-4.5 mr-2" />
                Alerts
                {alerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#F0B90B] text-[#0B0E11] text-[10px] font-bold">
                    {alerts.length}
                  </span>
                )}
              </Button>
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="bg-[#F0B90B] hover:bg-[#FCD535] text-[#0B0E11] font-bold rounded-xl px-6 shadow-lg shadow-yellow-500/10"
              >
                <RefreshCw className={`w-4.5 h-4.5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </motion.div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
            {[
              { label: 'Market ETFs', value: mockETFs.length, icon: BarChart3, color: 'text-blue-400', bg: 'bg-blue-400/10' },
              { label: 'Active Bonds', value: mockBonds.length, icon: Shield, color: 'text-green-400', bg: 'bg-green-400/10' },
              { label: 'Forex Pairs', value: mockForex.length, icon: Globe, color: 'text-purple-400', bg: 'bg-purple-400/10' },
              { label: 'Saved Assets', value: watchlist.length, icon: Bookmark, color: 'text-orange-400', bg: 'bg-orange-400/10' },
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + idx * 0.1 }}
                className="bg-[#1E2329]/50 backdrop-blur-md border border-[#2B3139] rounded-2xl p-5 hover:border-[#F0B90B]/50 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#848E9C] uppercase tracking-wider mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Search and Filter */}
        <div className="mb-10">
          <div className="bg-[#1E2329] rounded-[24px] border border-[#2B3139] p-6 shadow-2xl">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#848E9C] w-5 h-5 group-focus-within:text-[#F0B90B] transition-colors" />
                  <Input
                    placeholder="Search market instruments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 bg-[#0B0E11] border-[#2B3139] text-[#EAECEF] focus:border-[#F0B90B] focus:ring-[#F0B90B]/20 h-14 rounded-2xl transition-all text-base"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                {[
                  { id: 'all', label: 'All Assets', icon: Filter },
                  { id: 'trending', label: 'Trending', icon: TrendingUp },
                  { id: 'high-yield', label: 'High Yield', icon: Award }
                ].map((cat) => (
                  <Button
                    key={cat.id}
                    variant={selectedCategory === cat.id ? 'default' : 'outline'}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center space-x-2 rounded-xl h-12 px-6 transition-all ${selectedCategory === cat.id
                      ? 'bg-[#F0B90B] text-[#0B0E11] border-[#F0B90B] font-bold'
                      : 'bg-transparent border-[#2B3139] text-[#848E9C] hover:border-[#F0B90B] hover:text-[#F0B90B]'
                      }`}
                  >
                    <cat.icon className="w-4.5 h-4.5" />
                    <span>{cat.label}</span>
                  </Button>
                ))}
              </div>

              <div className="flex bg-[#0B0E11] p-1.5 rounded-xl border border-[#2B3139] items-center space-x-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('grid')}
                  className={`h-9 w-12 rounded-lg ${viewMode === 'grid' ? 'bg-[#2B3139] text-[#F0B90B]' : 'text-[#848E9C]'}`}
                >
                  <BarChart3 className="w-5 h-5" />
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('table')}
                  className={`h-9 w-12 rounded-lg ${viewMode === 'table' ? 'bg-[#2B3139] text-[#F0B90B]' : 'text-[#848E9C]'}`}
                >
                  <LineChart className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Advanced Filters */}
            <div className="mt-8 flex flex-wrap gap-6 items-center border-t border-[#2B3139] pt-6">
              <div className="flex items-center space-x-3">
                <label className="text-xs font-bold text-[#848E9C] uppercase tracking-[0.1em]">Sort by:</label>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="appearance-none px-4 py-2 pr-10 border border-[#2B3139] rounded-xl bg-[#0B0E11] text-[#EAECEF] text-sm font-semibold focus:border-[#F0B90B] transition-all outline-none"
                  >
                    <option value="change">Change %</option>
                    <option value="price">Price</option>
                    <option value="volume">Volume</option>
                    {activeTab === 'bonds' && <option value="yield">Yield</option>}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#848E9C] pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <label className="text-xs font-bold text-[#848E9C] uppercase tracking-[0.1em]">Order:</label>
                <Button
                  variant="outline"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="h-9 border-[#2B3139] bg-[#0B0E11] text-[#EAECEF] hover:text-[#F0B90B] hover:border-[#F0B90B] rounded-xl text-xs font-bold"
                >
                  {sortOrder === 'asc' ? <TrendingUp className="w-3.5 h-3.5 mr-2" /> : <TrendingDown className="w-3.5 h-3.5 mr-2" />}
                  {sortOrder === 'asc' ? 'ASC' : 'DESC'}
                </Button>
              </div>

              {selectedAssets.length > 0 && (
                <div className="flex items-center space-x-3 px-4 py-1.5 bg-[#02C076]/10 border border-[#02C076]/20 rounded-full">
                  <span className="text-xs font-bold text-[#02C076] uppercase">
                    {selectedAssets.length} Assets Comparison
                  </span>
                  <button
                    onClick={() => setSelectedAssets([])}
                    className="text-[#02C076] hover:text-[#02C076]/70"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modern Tab Navigation */}
        <div className="mb-10">
          <div className="flex bg-[#1E2329] p-1.5 rounded-2xl border border-[#2B3139] w-full max-w-md mx-auto">
            {[
              { id: 'etf', name: 'ETFs', icon: BarChart3 },
              { id: 'bonds', name: 'Bonds', icon: Shield },
              { id: 'forex', name: 'Forex', icon: Globe }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === tab.id
                  ? 'bg-[#F0B90B] text-[#0B0E11] shadow-lg shadow-yellow-500/10'
                  : 'text-[#848E9C] hover:text-[#F0B90B] hover:bg-[#2B3139]'
                  }`}
              >
                <tab.icon className={`w-4.5 h-4.5 ${activeTab === tab.id ? 'animate-bounce' : ''}`} />
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ETF Section */}
        {activeTab === 'etf' && (
          <div className="space-y-6">
            {/* AI Recommendations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#1E2329] border border-[#2B3139] rounded-[24px] overflow-hidden shadow-2xl"
            >
              <div className="bg-gradient-to-r from-[#F0B90B]/10 to-transparent px-6 py-5 border-b border-[#2B3139]">
                <div className="flex items-center space-x-3">
                  <div className="bg-[#F0B90B] p-2 rounded-lg">
                    <Zap className="w-5 h-5 text-[#0B0E11] animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold text-white uppercase tracking-wider">AI Selection <span className="text-[#F0B90B]">Masterpicks</span></h3>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredETFs.slice(0, 3).map((etf, index) => (
                    <motion.div
                      key={etf.symbol}
                      whileHover={{ scale: 1.02 }}
                      className="p-6 bg-[#0B0E11] border border-[#2B3139] rounded-2xl hover:border-[#F0B90B]/40 transition-all group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-xl font-bold text-[#F0B90B] font-orbitron">{etf.symbol}</span>
                          <span className={`${getRecommendationColor(etf.recommendation)} text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter`}>
                            {etf.recommendation}
                          </span>
                        </div>
                        <div className={`p-2 rounded-lg ${etf.trend === 'up' ? 'bg-[#02C076]/10 text-[#02C076]' : 'bg-[#F84960]/10 text-[#F84960]'}`}>
                          {etf.trend === 'up' ? <TrendingUpIcon className="w-5 h-5" /> : <TrendingDownIcon className="w-5 h-5" />}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-[#848E9C] mb-4 group-hover:text-[#EAECEF] transition-colors">{etf.name}</div>
                      <div className="flex items-baseline justify-between border-t border-[#2B3139] pt-4">
                        <span className="text-2xl font-bold text-white">
                          {formatCurrency(etf.price)}
                        </span>
                        <span className={`text-sm font-bold ${getTrendColor(etf.trend, etf.change)}`}>
                          {formatPercentage(etf.changePercent)}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* ETF Display - Grid or Table View */}
            <div className="bg-[#1E2329] border border-[#2B3139] rounded-[24px] overflow-hidden shadow-xl">
              <div className="px-6 py-5 border-b border-[#2B3139] flex items-center justify-between bg-[#1E2329]">
                <h3 className="text-xl font-bold text-white">Popular Markets</h3>
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-bold text-[#848E9C] bg-[#0B0E11] px-2 py-1 rounded">
                    {filteredETFs.length} INSTRUMENTS
                  </span>
                </div>
              </div>
              <div className="p-6">
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredETFs.map((etf, index) => (
                      <motion.div
                        key={etf.symbol}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-4 border rounded-lg hover:shadow-md transition-all cursor-pointer ${selectedAssets.includes(etf.symbol)
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
              </div>
            </div>
          </div>
        )}

        {/* Bonds Section */}
        {activeTab === 'bonds' && (
          <div className="space-y-10">
            {/* Interest Rate Analytics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#1E2329] border border-[#2B3139] rounded-[24px] p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] pointer-events-none"></div>
              <div className="flex items-center space-x-3 mb-8">
                <div className="bg-blue-500/10 p-2.5 rounded-xl">
                  <Target className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white uppercase tracking-wider">Interest Rate <span className="text-blue-400">Analytics</span></h3>
                  <p className="text-xs font-semibold text-[#848E9C] tracking-widest mt-0.5">YIELD CURVE SENSITIVITY</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Rate Hike Impact', value: '+0.25%', sub: 'BEARISH PRESSURE', color: 'text-red-400', bg: 'bg-red-400/5' },
                  { label: 'Rate Cut Impact', value: '-0.15%', sub: 'BULLISH POTENTIAL', color: 'text-green-400', bg: 'bg-green-400/5' },
                  { label: 'Avg Duration', value: '8.5Y', sub: 'PORTFOLIO RISK', color: 'text-blue-400', bg: 'bg-blue-400/5' }
                ].map((stat, i) => (
                  <div key={i} className={`${stat.bg} border border-[#2B3139] rounded-2xl p-6 relative group hover:border-blue-400/30 transition-all`}>
                    <div className="text-xs font-bold text-[#848E9C] uppercase mb-4 tracking-widest">{stat.label}</div>
                    <div className={`text-3xl font-orbitron font-bold ${stat.color} mb-1`}>{stat.value}</div>
                    <div className="text-[10px] font-bold text-[#848E9C]">{stat.sub}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Bonds Market Table */}
            <div className="bg-[#1E2329] border border-[#2B3139] rounded-[24px] overflow-hidden shadow-2xl">
              <div className="px-8 py-6 border-b border-[#2B3139] flex items-center justify-between bg-[#1E2329]">
                <h3 className="text-xl font-bold text-white uppercase tracking-tight">Institutional <span className="text-blue-400">Fixed Income</span></h3>
                <Badge className="bg-[#0B0E11] text-[#848E9C] border-[#2B3139] rounded-lg px-3 py-1.5 text-xs font-bold">
                  {filteredBonds.length} SECURED ASSETS
                </Badge>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#0B0E11]/30 text-[11px] font-bold text-[#848E9C] uppercase tracking-[0.15em]">
                      <th className="py-5 px-8">Instrument</th>
                      <th className="py-5 px-6 text-right">Yield (YTM)</th>
                      <th className="py-5 px-6 text-right">Market Price</th>
                      <th className="py-5 px-6 text-center">Credit Rating</th>
                      <th className="py-5 px-6 text-right">Maturity Date</th>
                      <th className="py-5 px-8 text-right">Security Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2B3139]">
                    {filteredBonds.map((bond, index) => (
                      <motion.tr
                        key={bond.symbol}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-[#2B3139]/40 group transition-colors"
                      >
                        <td className="py-5 px-8">
                          <div className="font-bold text-[#EAECEF] group-hover:text-white transition-colors">{bond.name}</div>
                          <div className="text-[10px] font-bold text-[#848E9C] tracking-widest uppercase mt-0.5">{bond.symbol}</div>
                        </td>
                        <td className="py-5 px-6 text-right font-orbitron font-bold text-[#02C076] text-base">
                          {bond.yield.toFixed(2)}%
                        </td>
                        <td className="py-5 px-6 text-right font-bold text-white">
                          {formatCurrency(bond.price)}
                        </td>
                        <td className="py-5 px-6 text-center">
                          <span className={`px-2 py-1 rounded-md text-[11px] font-black border tracking-tighter ${bond.rating.startsWith('AAA') ? 'bg-green-400/10 text-green-400 border-green-400/20' :
                            bond.rating.startsWith('AA') ? 'bg-blue-400/10 text-blue-400 border-blue-400/20' :
                              'bg-yellow-400/10 text-yellow-400 border-yellow-400/20'
                            }`}>
                            {bond.rating}
                          </span>
                        </td>
                        <td className="py-5 px-6 text-right text-sm font-semibold text-[#848E9C]">
                          {new Date(bond.maturityDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="py-5 px-8 text-right">
                          <span className={`uppercase text-[10px] font-bold px-2.5 py-1 rounded-full ${bond.type === 'government' ? 'bg-[#F0B90B]/10 text-[#F0B90B]' : 'bg-purple-400/10 text-purple-400'
                            }`}>
                            {bond.type}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Forex Section */}
        {activeTab === 'forex' && (
          <div className="space-y-6">
            {/* Live Forex Rates */}
            <div className="bg-[#1E2329] border border-[#2B3139] rounded-[24px] overflow-hidden shadow-2xl">
              <div className="px-8 py-6 border-b border-[#2B3139] flex items-center justify-between bg-[#1E2329]">
                <div className="flex items-center space-x-3">
                  <div className="bg-[#02C076]/10 p-2 rounded-lg">
                    <Globe className="w-6 h-6 text-[#02C076]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white uppercase tracking-tight">Global <span className="text-[#02C076]">FX Terminals</span></h3>
                    <div className="flex items-center text-[10px] font-bold text-[#848E9C] tracking-widest mt-0.5">
                      <div className="w-1.5 h-1.5 bg-[#02C076] rounded-full mr-2 animate-pulse"></div>
                      REAL-TIME INTERBANK RATES
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredForex.map((forex, index) => (
                    <motion.div
                      key={forex.pair}
                      whileHover={{ scale: 1.02, translateY: -4 }}
                      className="group bg-[#0B0E11] border border-[#2B3139] rounded-2xl p-6 hover:border-[#F0B90B]/50 transition-all shadow-lg"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <span className="text-lg font-black text-white font-orbitron tracking-tighter">{forex.pair}</span>
                        <div className={`p-2 rounded-lg ${forex.changePercent >= 0 ? 'bg-[#02C076]/10 text-[#02C076]' : 'bg-[#F84960]/10 text-[#F84960]'}`}>
                          {forex.changePercent >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-end">
                          <div className="text-[10px] font-bold text-[#848E9C] uppercase tracking-widest">BID PRICE</div>
                          <div className="text-xl font-orbitron font-bold text-white leading-none tracking-tighter">{forex.bid.toFixed(4)}</div>
                        </div>
                        <div className="flex justify-between items-end border-t border-[#2B3139] pt-4">
                          <div className="text-[10px] font-bold text-[#848E9C] uppercase tracking-widest">ASK PRICE</div>
                          <div className="text-xl font-orbitron font-bold text-white leading-none tracking-tighter">{forex.ask.toFixed(4)}</div>
                        </div>
                        <div className="flex justify-between items-center bg-[#1E2329] p-2 rounded-xl border border-[#2B3139]">
                          <span className="text-[9px] font-black text-[#848E9C] uppercase pl-1">24H VOL</span>
                          <span className="text-xs font-bold text-[#EAECEF] pr-1">{(forex.volume / 1000000).toFixed(0)}M</span>
                        </div>
                      </div>

                      <div className={`mt-4 text-center py-1.5 rounded-lg text-xs font-black tracking-widest uppercase ${forex.changePercent >= 0 ? 'bg-[#02C076]/5 text-[#02C076]' : 'bg-[#F84960]/5 text-[#F84960]'
                        }`}>
                        {formatPercentage(forex.changePercent)}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Currency Heatmap */}
            <div className="bg-[#1E2329] border border-[#2B3139] rounded-[24px] p-8 shadow-2xl">
              <div className="flex items-center space-x-3 mb-8">
                <div className="bg-[#F0B90B]/10 p-2.5 rounded-xl">
                  <Activity className="w-6 h-6 text-[#F0B90B]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white uppercase tracking-wider">Currency <span className="text-[#F0B90B]">Master Index</span></h3>
                  <p className="text-xs font-semibold text-[#848E9C] tracking-widest mt-0.5">RELATIVE STRENGTH HEATMAP</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {['USD', 'EUR', 'GBP', 'JPY', 'INR', 'CAD', 'AUD', 'CHF'].map((currency, index) => {
                  const strength = index < 2 ? 'STRONG' : index < 4 ? 'NEUTRAL' : 'WEAK';
                  const colorClass = index < 2 ? 'text-[#02C076] border-[#02C076]/30 bg-[#02C076]/5' :
                    index < 4 ? 'text-[#F0B90B] border-[#F0B90B]/30 bg-[#F0B90B]/5' :
                      'text-[#F84960] border-[#F84960]/30 bg-[#F84960]/5';
                  return (
                    <div
                      key={currency}
                      className={`p-6 border rounded-2xl text-center group hover:scale-105 transition-all cursor-pointer ${colorClass}`}
                    >
                      <div className="text-2xl font-black font-orbitron group-hover:tracking-widest transition-all">{currency}</div>
                      <div className="text-[10px] font-black tracking-widest mt-2">{strength}</div>
                      <div className="mt-4 h-1 w-full bg-[#0B0E11] rounded-full overflow-hidden">
                        <div className={`h-full ${index < 2 ? 'w-full bg-[#02C076]' : index < 4 ? 'w-1/2 bg-[#F0B90B]' : 'w-1/4 bg-[#F84960]'}`}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Portfolio Simulation */}
        {/* Portfolio Simulation */}
        <div className="bg-[#1E2329] border border-[#2B3139] rounded-[24px] overflow-hidden shadow-2xl relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#F0B90B] via-blue-500 to-purple-500"></div>
          <div className="p-8">
            <div className="flex items-center space-x-3 mb-8">
              <div className="bg-purple-500/10 p-2.5 rounded-xl">
                <PieChart className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white uppercase tracking-tight">Strategy <span className="text-purple-400">Simulator</span></h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div>
                  <label className="block text-xs font-black text-[#848E9C] uppercase tracking-[0.2em] mb-4">
                    Hypothetical Investment
                  </label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#F0B90B] font-bold text-xl">$</span>
                    <Input
                      type="number"
                      value={portfolioAmount.toString()}
                      onChange={(e) => setPortfolioAmount(Number(e.target.value))}
                      className="pl-10 bg-[#0B0E11] border-[#2B3139] text-white focus:border-[#F0B90B] h-16 rounded-2xl text-2xl font-orbitron font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'ETFs', weight: '40%', value: portfolioAllocation.etf, color: 'bg-blue-400' },
                    { label: 'Bonds', weight: '30%', value: portfolioAllocation.bonds, color: 'bg-green-400' },
                    { label: 'Forex', weight: '10%', value: portfolioAllocation.forex, color: 'bg-purple-400' },
                    { label: 'Cash', weight: '20%', value: portfolioAllocation.cash, color: 'bg-[#848E9C]' }
                  ].map((asset, i) => (
                    <div key={i} className="bg-[#0B0E11] p-4 rounded-xl border border-[#2B3139]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-[#848E9C] tracking-widest">{asset.label} ({asset.weight})</span>
                        <div className={`w-2 h-2 rounded-full ${asset.color}`}></div>
                      </div>
                      <div className="text-lg font-bold text-white font-orbitron">{formatCurrency(asset.value)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-center justify-center bg-[#0B0E11]/50 rounded-[32px] border border-[#2B3139] p-8 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent"></div>
                <div className="relative z-10 text-center">
                  <div className="w-48 h-48 rounded-full border-[12px] border-[#2B3139] flex items-center justify-center mb-6 relative">
                    <div className="absolute inset-0 rounded-full border-[12px] border-blue-500 border-r-transparent border-b-transparent -rotate-45"></div>
                    <div className="absolute inset-0 rounded-full border-[12px] border-purple-500 border-l-transparent border-t-transparent rotate-12"></div>
                    <PieChart className="w-16 h-16 text-[#848E9C] group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <h4 className="text-white font-bold mb-2">Portfolio Blueprint</h4>
                  <p className="text-xs text-[#848E9C] leading-relaxed max-w-[200px]">
                    Optimized allocation based on current market volatility and risk-adjusted return vectors.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tutorial Section */}
        <AnimatePresence>
          {showTutorial && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-12"
            >
              <div className="bg-[#1E2329] border border-[#2B3139] rounded-[24px] overflow-hidden shadow-2xl">
                <div className="px-8 py-6 border-b border-[#2B3139] flex items-center justify-between bg-[#1E2329]/50">
                  <div className="flex items-center space-x-3">
                    <div className="bg-[#F0B90B]/10 p-2 rounded-lg">
                      <Lightbulb className="w-6 h-6 text-[#F0B90B]" />
                    </div>
                    <h3 className="text-xl font-bold text-white uppercase tracking-tight">Market <span className="text-[#F0B90B]">Mastery</span> Guide</h3>
                  </div>
                  <button onClick={() => setShowTutorial(false)} className="text-[#848E9C] hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                      {
                        title: 'ETFs',
                        icon: BarChart3,
                        color: 'text-blue-400',
                        bg: 'bg-blue-400/5',
                        items: ['Diversified index tracking', 'Lower systemic volatility', 'Optimize for expense ratios', 'Long-term wealth building']
                      },
                      {
                        title: 'Bonds',
                        icon: Shield,
                        color: 'text-green-400',
                        bg: 'bg-green-400/5',
                        items: ['Fixed yield generation', 'Capital preservation focus', 'Rate cycle sensitivity', 'Institutional credit parity']
                      },
                      {
                        title: 'Forex',
                        icon: Globe,
                        color: 'text-purple-400',
                        bg: 'bg-purple-400/5',
                        items: ['Global currency arbitrage', 'High liquidity framework', 'Economic catalyst trading', 'Leveraged risk protocols']
                      }
                    ].map((section, i) => (
                      <div key={i} className={`${section.bg} rounded-2xl p-6 border border-[#2B3139]`}>
                        <div className="flex items-center space-x-3 mb-4">
                          <section.icon className={`w-5 h-5 ${section.color}`} />
                          <h4 className="text-lg font-bold text-white">{section.title}</h4>
                        </div>
                        <ul className="space-y-3">
                          {section.items.map((item, j) => (
                            <li key={j} className="flex items-center text-sm text-[#848E9C] font-semibold">
                              <div className={`w-1 h-1 rounded-full ${section.color.replace('text-', 'bg-')} mr-3`}></div>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
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
              className="mb-12"
            >
              <div className="bg-[#1E2329] border border-[#2B3139] rounded-[24px] overflow-hidden shadow-2xl relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[60px] pointer-events-none"></div>
                <div className="px-8 py-6 border-b border-[#2B3139] flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-500/10 p-2 rounded-lg">
                      <LineChart className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white uppercase tracking-tight">Vantage <span className="text-blue-400">Comparison</span></h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-400/5 font-bold text-xs tracking-widest"
                    onClick={() => setSelectedAssets([])}
                  >
                    WIPE SELECTION
                  </Button>
                </div>
                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {selectedAssets.map(symbol => {
                      const etfAsset = mockETFs.find(a => a.symbol === symbol);
                      const bondAsset = mockBonds.find(a => a.symbol === symbol);
                      const forexAsset = mockForex.find(a => a.pair === symbol);
                      const asset = etfAsset || bondAsset || forexAsset;

                      if (!asset) return null;

                      const price = (asset as any).price || (asset as any).bid || 0;
                      const changePercent = (asset as any).changePercent || 0;

                      return (
                        <motion.div
                          layout
                          key={symbol}
                          className="bg-[#0B0E11] border border-[#2B3139] rounded-2xl p-6 relative group"
                        >
                          <button
                            onClick={() => toggleAssetSelection(symbol)}
                            className="absolute top-4 right-4 text-[#848E9C] hover:text-white p-1 rounded-lg hover:bg-[#2B3139] transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <div className="text-xl font-black text-[#F0B90B] font-orbitron mb-6">{symbol}</div>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-[#848E9C] uppercase tracking-[0.15em]">Live Price</span>
                              <span className="text-lg font-bold text-white">{formatCurrency(price)}</span>
                            </div>
                            <div className="flex justify-between items-center border-t border-[#2B3139] pt-4">
                              <span className="text-[10px] font-bold text-[#848E9C] uppercase tracking-[0.15em]">24H Delta</span>
                              <span className={`text-sm font-black ${changePercent >= 0 ? 'text-[#02C076]' : 'text-[#F84960]'}`}>
                                {formatPercentage(changePercent)}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
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
              className="mb-12"
            >
              <div className="bg-[#1E2329] border border-[#2B3139] rounded-[24px] overflow-hidden shadow-2xl">
                <div className="px-8 py-6 border-b border-[#2B3139] flex items-center justify-between bg-[#1E2329]/30">
                  <div className="flex items-center space-x-3">
                    <div className="bg-orange-500/10 p-2 rounded-lg">
                      <Bell className="w-6 h-6 text-orange-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white uppercase tracking-tight">Price <span className="text-orange-400">Sentinels</span></h3>
                  </div>
                </div>
                <div className="p-8">
                  <div className="flex items-center space-x-4 mb-8">
                    <div className="relative flex-1">
                      <Input
                        placeholder="ENTER ASSET SYMBOL & PRICE..."
                        className="bg-[#0B0E11] border-[#2B3139] text-white focus:border-orange-500 h-14 rounded-xl font-bold uppercase tracking-widest placeholder:text-[#848E9C]/50"
                        value={alertInput}
                        onChange={(e) => setAlertInput(e.target.value)}
                      />
                    </div>
                    <Button
                      className="h-14 px-8 bg-orange-500 hover:bg-orange-600 text-[#0B0E11] font-black rounded-xl tracking-widest transition-transform active:scale-95"
                      onClick={() => {
                        if (alertInput.trim()) {
                          addAlert(alertInput.trim());
                          setAlertInput('');
                        }
                      }}
                    >
                      DEPLOY ALERT
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {alerts.length === 0 ? (
                      <div className="col-span-full py-12 text-center bg-[#0B0E11]/30 rounded-[32px] border border-dashed border-[#2B3139]">
                        <Bell className="w-12 h-12 text-[#2B3139] mx-auto mb-4" />
                        <p className="text-[#848E9C] font-bold tracking-widest text-xs">NO ACTIVE SENTINELS DETECTED</p>
                      </div>
                    ) : (
                      alerts.map((alert, index) => (
                        <div key={index} className="flex items-center justify-between p-5 bg-[#0B0E11] border border-[#2B3139] rounded-2xl group hover:border-orange-500/30 transition-all">
                          <span className="text-sm font-bold text-[#EAECEF] tracking-tight">{alert}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300 hover:bg-red-400/5 group-hover:opacity-100"
                            onClick={() => removeAlert(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ETFBondsForexPage;
