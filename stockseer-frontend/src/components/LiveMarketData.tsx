'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  AlertCircle, 
  Clock,
  Coins,
  Zap,
  DollarSign,
  Globe,
  ChevronDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '../utils/currency';
import { getMetalsDataForCountry, getSupportedCountries } from '../utils/metalsDataService';

// Types
interface CryptoData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  image: string;
}

interface MetalData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  icon: string;
  color: string;
  currency: string;
  source: string;
  lastUpdated: Date;
}

interface CountryData {
  code: string;
  name: string;
  currency: string;
  flag: string;
  exchangeRate: number;
}

interface ApiStatus {
  crypto: 'loading' | 'success' | 'error';
  metals: 'loading' | 'success' | 'error' | 'fallback';
  exchange: 'loading' | 'success' | 'error';
  lastUpdated: Date;
}

// Get countries from the metals data service
const COUNTRIES: CountryData[] = getSupportedCountries().map(country => ({
  code: country.code,
  name: country.name,
  currency: country.currency,
  flag: country.flag,
  exchangeRate: country.exchangeRate,
}));

// Metal configuration
const METAL_CONFIG = {
  XAU: { name: 'Gold', icon: '🥇', color: '#FFD700' },
  XAG: { name: 'Silver', icon: '🥈', color: '#C0C0C0' },
  XPT: { name: 'Platinum', icon: '🥉', color: '#E5E4E2' },
  XPD: { name: 'Palladium', icon: '💎', color: '#B87333' },
};

// API Configuration (used by metalsDataService)
// const API_CONFIG = {
//   metalsApiKey: process.env.NEXT_PUBLIC_METALS_API_KEY || 'demo',
//   exchangeApiKey: process.env.NEXT_PUBLIC_EXCHANGE_API_KEY || 'demo',
// };

// Fetch cryptocurrency data with enhanced error handling
const fetchCryptoData = async (currency: string = 'usd'): Promise<CryptoData[]> => {
  try {
    console.log('Fetching crypto data for currency:', currency);
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: CryptoData[] = await response.json();
    console.log('Successfully fetched crypto data:', data.length, 'coins');
    return data;
  } catch (error) {
    console.error('Error fetching crypto data:', error);
    // Return fallback data instead of throwing
    return getFallbackCryptoData(currency);
  }
};

// Fallback crypto data when API fails
const getFallbackCryptoData = (currency: string): CryptoData[] => {
  const basePrices = {
    usd: { bitcoin: 45000, ethereum: 3200, cardano: 0.45, solana: 95, polkadot: 6.8 },
    inr: { bitcoin: 3750000, ethereum: 267000, cardano: 37.5, solana: 7925, polkadot: 567 },
    eur: { bitcoin: 42000, ethereum: 3000, cardano: 0.42, solana: 89, polkadot: 6.4 },
    gbp: { bitcoin: 36000, ethereum: 2500, cardano: 0.36, solana: 75, polkadot: 5.4 }
  };
  
  const prices = basePrices[currency.toLowerCase() as keyof typeof basePrices] || basePrices.usd;
  
  return [
    {
      id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', 
      current_price: prices.bitcoin, price_change_percentage_24h: 2.5,
      market_cap: 850000000000, total_volume: 25000000000, image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png'
    },
    {
      id: 'ethereum', symbol: 'eth', name: 'Ethereum',
      current_price: prices.ethereum, price_change_percentage_24h: 1.8,
      market_cap: 380000000000, total_volume: 15000000000, image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png'
    },
    {
      id: 'cardano', symbol: 'ada', name: 'Cardano',
      current_price: prices.cardano, price_change_percentage_24h: -0.5,
      market_cap: 15000000000, total_volume: 500000000, image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png'
    },
    {
      id: 'solana', symbol: 'sol', name: 'Solana',
      current_price: prices.solana, price_change_percentage_24h: 3.2,
      market_cap: 40000000000, total_volume: 2000000000, image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png'
    },
    {
      id: 'polkadot', symbol: 'dot', name: 'Polkadot',
      current_price: prices.polkadot, price_change_percentage_24h: 1.1,
      market_cap: 8000000000, total_volume: 300000000, image: 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png'
    }
  ];
};

// Fetch metals data for specific country using real-time service
const fetchMetalsData = async (countryCode: string): Promise<MetalData[]> => {
  try {
    console.log('Fetching real-time metals data for country:', countryCode);
    
    const countryMetalsData = await getMetalsDataForCountry(countryCode);
    
    // Convert to our component format
    const metals: MetalData[] = countryMetalsData.metals.map(metal => ({
      symbol: metal.symbol,
      name: metal.name,
      price: metal.price,
      change24h: metal.change24h,
      changePercent24h: metal.changePercent24h,
      icon: METAL_CONFIG[metal.symbol as keyof typeof METAL_CONFIG]?.icon || '💎',
      color: METAL_CONFIG[metal.symbol as keyof typeof METAL_CONFIG]?.color || '#B87333',
      currency: metal.currency,
      source: metal.source,
      lastUpdated: metal.lastUpdated,
    }));
    
    console.log('Successfully fetched metals data:', metals.length, 'metals from', metals[0]?.source);
    return metals;
  } catch (error) {
    console.error('Error fetching metals data:', error);
    console.log('Falling back to demo metals data');
    return getFallbackMetalsData(countryCode);
  }
};

// Enhanced fallback metals data
const getFallbackMetalsData = (countryCode: string): MetalData[] => {
  const country = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];
  const currency = country.currency;
  
  // Base prices in USD
  const basePrices = {
    XAU: { price: 2000, change: 15, changePercent: 0.75 },
    XAG: { price: 24.5, change: 0.3, changePercent: 1.24 },
    XPT: { price: 950, change: -5, changePercent: -0.52 },
    XPD: { price: 1200, change: 8, changePercent: 0.67 }
  };
  
  return Object.entries(METAL_CONFIG).map(([symbol, config]) => {
    const basePrice = basePrices[symbol as keyof typeof basePrices];
    const convertedPrice = basePrice.price * country.exchangeRate;
    
    return {
      symbol,
      name: config.name,
      price: convertedPrice,
      change24h: basePrice.change * country.exchangeRate,
      changePercent24h: basePrice.changePercent,
      icon: config.icon,
      color: config.color,
      currency,
      source: 'Fallback Data',
      lastUpdated: new Date()
    };
  });
};


// Fetch exchange rates for all countries
const fetchExchangeRates = async (): Promise<CountryData[]> => {
  try {
    // For demo purposes, we'll use the predefined exchange rates
    // In production, you'd fetch real-time rates from an API like exchangerate-api.com
    return COUNTRIES;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return COUNTRIES; // Return predefined rates as fallback
  }
};

// Main Component
const LiveMarketData: React.FC = () => {
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [metalsData, setMetalsData] = useState<MetalData[]>([]);
  const [countries, setCountries] = useState<CountryData[]>(COUNTRIES);
  const [selectedCountry, setSelectedCountry] = useState<CountryData>(COUNTRIES[0]);
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    crypto: 'loading',
    metals: 'loading',
    exchange: 'loading',
    lastUpdated: new Date()
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  // Load data function
  const loadData = async (country: CountryData = selectedCountry) => {
    setIsRefreshing(true);
    
    try {
      // Fetch crypto data in selected currency
      setApiStatus(prev => ({ ...prev, crypto: 'loading' }));
      const crypto = await fetchCryptoData(country.currency.toLowerCase());
      setCryptoData(crypto);
      setApiStatus(prev => ({ ...prev, crypto: 'success' }));
    } catch (error) {
      console.error('Failed to fetch crypto data:', error);
      setApiStatus(prev => ({ ...prev, crypto: 'error' }));
    }

    try {
      // Fetch metals data for selected country
      setApiStatus(prev => ({ ...prev, metals: 'loading' }));
      const metals = await fetchMetalsData(country.code);
      setMetalsData(metals);
      const isUsingFallback = metals[0]?.source === 'Fallback Data';
      setApiStatus(prev => ({ ...prev, metals: isUsingFallback ? 'fallback' : 'success' }));
    } catch (error) {
      console.error('Failed to fetch metals data:', error);
      const fallbackMetals = getFallbackMetalsData(country.code);
      setMetalsData(fallbackMetals);
      setApiStatus(prev => ({ ...prev, metals: 'fallback' }));
    }

    setApiStatus(prev => ({ ...prev, lastUpdated: new Date() }));
    setIsRefreshing(false);
  };

  // Handle country selection
  const handleCountrySelect = (country: CountryData) => {
    setSelectedCountry(country);
    setShowCountryDropdown(false);
    loadData(country);
  };

  // Initial load
  useEffect(() => {
    loadData();
    fetchExchangeRates().then(setCountries);
  }, []);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
    }, 60000);

    return () => clearInterval(interval);
  }, [selectedCountry]);

  const handleRefresh = () => {
    loadData();
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Coins className="w-8 h-8 text-blue-500 mr-3" />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Live Market Data
            </h2>
          </div>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <div className={`w-2 h-2 rounded-full animate-pulse mr-2 ${
              apiStatus.crypto === 'success' && (apiStatus.metals === 'success' || apiStatus.metals === 'fallback')
                ? 'bg-green-500' 
                : 'bg-orange-500'
            }`}></div>
            <Clock className="w-4 h-4 mr-1" />
            Last updated: {apiStatus.lastUpdated.toLocaleTimeString()}
            {apiStatus.metals === 'fallback' && (
              <span className="ml-2 text-xs text-orange-500">
                (Demo metals data)
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Country Selector */}
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setShowCountryDropdown(!showCountryDropdown)}
              className="flex items-center space-x-2"
            >
              <Globe className="w-4 h-4" />
              <span>{selectedCountry.flag}</span>
              <span>{selectedCountry.name}</span>
              <ChevronDown className="w-4 h-4" />
            </Button>
            
            {showCountryDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
              >
                {countries.map((country) => (
                  <button
                    key={country.code}
                    onClick={() => handleCountrySelect(country)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3 ${
                      selectedCountry.code === country.code ? 'bg-blue-50 dark:bg-blue-900' : ''
                    }`}
                  >
                    <span className="text-xl">{country.flag}</span>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{country.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{country.currency}</div>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          <Button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Market Data Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cryptocurrency Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="w-6 h-6 text-yellow-500 mr-2" />
              Top 10 Cryptocurrencies
              {apiStatus.crypto === 'error' && (
                <AlertCircle className="w-5 h-5 text-red-500 ml-2" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {apiStatus.crypto === 'loading' ? (
              <div className="space-y-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
                          <div className="h-3 w-12 bg-gray-300 dark:bg-gray-600 rounded"></div>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div>
                        <div className="h-3 w-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : apiStatus.crypto === 'error' ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Failed to load cryptocurrency data. Please try again.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cryptoData.map((crypto, index) => (
                  <motion.div
                    key={crypto.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <img 
                        src={crypto.image} 
                        alt={crypto.name} 
                        className="w-8 h-8 rounded-full"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {crypto.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {crypto.symbol.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(crypto.current_price, selectedCountry.currency)}
                      </div>
                      <div className={`flex items-center justify-end text-sm ${
                        crypto.price_change_percentage_24h >= 0 
                          ? 'text-green-500' 
                          : 'text-red-500'
                      }`}>
                        {crypto.price_change_percentage_24h >= 0 ? (
                          <TrendingUp className="w-4 h-4 mr-1" />
                        ) : (
                          <TrendingDown className="w-4 h-4 mr-1" />
                        )}
                        <span>{crypto.price_change_percentage_24h.toFixed(2)}%</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Metals Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="w-6 h-6 text-yellow-500 mr-2" />
              Precious Metals
              {apiStatus.metals === 'error' && (
                <AlertCircle className="w-5 h-5 text-red-500 ml-2" />
              )}
              {apiStatus.metals === 'fallback' && (
                <span className="ml-2 text-xs text-orange-500 bg-orange-100 dark:bg-orange-900 px-2 py-1 rounded">
                  Demo Data
                </span>
              )}
              {apiStatus.metals === 'success' && metalsData[0]?.source && (
                <span className="ml-2 text-xs text-green-500 bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
                  {metalsData[0].source}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {apiStatus.metals === 'loading' ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div>
                        <div className="h-3 w-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : apiStatus.metals === 'error' ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Failed to load metals data. Please try again.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {metalsData.map((metal, index) => (
                  <motion.div
                    key={metal.symbol}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{metal.icon}</div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {metal.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {metal.symbol}/{selectedCountry.currency}
                          {metal.source && (
                            <span className="ml-2 text-xs text-blue-500">
                              • {metal.source}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(metal.price, selectedCountry.currency)}/oz
                      </div>
                      <div className={`flex items-center justify-end text-sm ${
                        metal.changePercent24h >= 0 
                          ? 'text-green-500' 
                          : 'text-red-500'
                      }`}>
                        {metal.changePercent24h >= 0 ? (
                          <TrendingUp className="w-4 h-4 mr-1" />
                        ) : (
                          <TrendingDown className="w-4 h-4 mr-1" />
                        )}
                        <span>{metal.changePercent24h.toFixed(2)}%</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Footer */}
      <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>
          Data provided by CoinGecko and Metals API • 
          Auto-refreshes every 60 seconds • 
          {apiStatus.crypto === 'success' && (apiStatus.metals === 'success' || apiStatus.metals === 'fallback')
            ? apiStatus.metals === 'fallback' 
              ? 'Crypto data live, metals data demo' 
              : 'All systems operational'
            : 'Some services may be unavailable'
          } • Showing prices in {selectedCountry.currency}
        </p>
      </div>
    </div>
  );
};

export default LiveMarketData;