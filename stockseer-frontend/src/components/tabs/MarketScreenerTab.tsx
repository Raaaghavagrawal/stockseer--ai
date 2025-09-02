import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  Search,
  Filter,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  DollarSign,
  Percent,
  Users,
  Building2,
  Globe,
  Star,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';
import type { StockScreenerCriteria, ScreenedStock } from '@/types/stock';

export default function MarketScreenerTab() {
  const [criteria, setCriteria] = useState<StockScreenerCriteria>({
    minPrice: 0,
    maxPrice: 1000,
    minMarketCap: 0,
    maxMarketCap: 1000000000000,
    minVolume: 0,
    minPE: 0,
    maxPE: 100,
    minPB: 0,
    maxPB: 10,
    minROE: 0,
    minROA: 0,
    minDebtToEquity: 0,
    maxDebtToEquity: 2,
    sectors: [],
    countries: []
  });
  
  const [screenedStocks, setScreenedStocks] = useState<ScreenedStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sortBy, setSortBy] = useState<'symbol' | 'name' | 'price' | 'marketCap' | 'pe' | 'pb' | 'roe'>('symbol');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Sample sectors and countries
  const availableSectors = [
    'Technology', 'Healthcare', 'Financial Services', 'Consumer Cyclical',
    'Communication Services', 'Industrials', 'Consumer Defensive', 'Energy',
    'Basic Materials', 'Real Estate', 'Utilities'
  ];

  const availableCountries = [
    'United States', 'Canada', 'United Kingdom', 'Germany', 'France',
    'Japan', 'China', 'India', 'Australia', 'Brazil', 'South Korea'
  ];

  // Initialize with empty data
  useEffect(() => {
    setScreenedStocks([]);
  }, []);

  const runScreener = async () => {
    setLoading(true);
    try {
      // Call the backend screener API
      const response = await fetch('http://localhost:8000/screener/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(criteria),
      });
      
      if (!response.ok) {
        throw new Error('Failed to run screener');
      }
      
      const data = await response.json();
      setScreenedStocks(data.stocks || []);
    } catch (error) {
      console.error('Error running screener:', error);
      setScreenedStocks([]);
    } finally {
      setLoading(false);
    }
  };

  const resetCriteria = () => {
    setCriteria({
      minPrice: 0,
      maxPrice: 1000,
      minMarketCap: 0,
      maxMarketCap: 1000000000000,
      minVolume: 0,
      minPE: 0,
      maxPE: 100,
      minPB: 0,
      maxPB: 10,
      minROE: 0,
      minROA: 0,
      minDebtToEquity: 0,
      maxDebtToEquity: 2,
      sectors: [],
      countries: []
    });
  };

  const toggleSector = (sector: string) => {
    setCriteria(prev => ({
      ...prev,
      sectors: prev.sectors.includes(sector)
        ? prev.sectors.filter(s => s !== sector)
        : [...prev.sectors, sector]
    }));
  };

  const toggleCountry = (country: string) => {
    setCriteria(prev => ({
      ...prev,
      countries: prev.countries.includes(country)
        ? prev.countries.filter(c => c !== country)
        : [...prev.countries, country]
    }));
  };

  const filteredStocks = screenedStocks.filter(stock => {
    if (stock.price < criteria.minPrice || stock.price > criteria.maxPrice) return false;
    if (stock.marketCap < criteria.minMarketCap || stock.marketCap > criteria.maxMarketCap) return false;
    if (stock.volume < criteria.minVolume) return false;
    if (stock.pe && (stock.pe < criteria.minPE || stock.pe > criteria.maxPE)) return false;
    if (stock.pb && (stock.pb < criteria.minPB || stock.pb > criteria.maxPB)) return false;
    if (stock.roe && stock.roe < criteria.minROE) return false;
    if (stock.roa && stock.roa < criteria.minROA) return false;
    if (stock.debtToEquity && (stock.debtToEquity < criteria.minDebtToEquity || stock.debtToEquity > criteria.maxDebtToEquity)) return false;
    if (criteria.sectors.length > 0 && stock.sector && !criteria.sectors.includes(stock.sector)) return false;
    if (criteria.countries.length > 0 && stock.country && !criteria.countries.includes(stock.country)) return false;
    return true;
  });

  const sortedStocks = [...filteredStocks].sort((a, b) => {
    let aValue: any = a[sortBy];
    let bValue: any = b[sortBy];
    
    if (aValue === undefined || aValue === null) aValue = 0;
    if (bValue === undefined || bValue === null) bValue = 0;
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: typeof sortBy) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatNumber = (value: number) => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
    return value.toString();
  };

  const exportResults = () => {
    const csvContent = [
      ['Symbol', 'Name', 'Price', 'Change %', 'Market Cap', 'P/E', 'P/B', 'ROE', 'ROA', 'Debt/Equity', 'Volume', 'Sector', 'Country'],
      ...sortedStocks.map(stock => [
        stock.symbol,
        stock.name,
        stock.price?.toString() || '',
        stock.changePercent?.toString() || '',
        stock.marketCap?.toString() || '',
        stock.pe?.toString() || '',
        stock.pb?.toString() || '',
        stock.roe?.toString() || '',
        stock.roa?.toString() || '',
        stock.debtToEquity?.toString() || '',
        stock.volume?.toString() || '',
        stock.sector || '',
        stock.country || ''
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `screener_results_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-white">
                🔍 Market Screener
              </CardTitle>
              <CardDescription className="text-slate-400">
                Filter stocks based on fundamental and technical criteria
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={resetCriteria}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-600"
              >
                Reset
              </Button>
              <Button
                onClick={runScreener}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Run Screener
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Screening Criteria */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Screening Criteria</CardTitle>
          <CardDescription>
            Set your investment criteria to find the perfect stocks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Criteria */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Basic Criteria</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-white mb-2 block">Price Range</label>
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={criteria.minPrice.toString()}
                    onChange={(e) => setCriteria(prev => ({ ...prev, minPrice: parseFloat(e.target.value) || 0 }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={criteria.maxPrice.toString()}
                    onChange={(e) => setCriteria(prev => ({ ...prev, maxPrice: parseFloat(e.target.value) || 1000 }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-white mb-2 block">Market Cap Range</label>
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={criteria.minMarketCap.toString()}
                    onChange={(e) => setCriteria(prev => ({ ...prev, minMarketCap: parseFloat(e.target.value) || 0 }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={criteria.maxMarketCap.toString()}
                    onChange={(e) => setCriteria(prev => ({ ...prev, maxMarketCap: parseFloat(e.target.value) || 1000000000000 }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-white mb-2 block">Min Volume</label>
                <Input
                  type="number"
                  placeholder="Min Volume"
                  value={criteria.minVolume.toString()}
                  onChange={(e) => setCriteria(prev => ({ ...prev, minVolume: parseFloat(e.target.value) || 0 }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
          </div>

          {/* Advanced Criteria Toggle */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="border-slate-600 text-slate-300 hover:bg-slate-600"
            >
              <Filter className="w-4 h-4 mr-2" />
              {showAdvanced ? 'Hide' : 'Show'} Advanced Criteria
            </Button>
          </div>

          {/* Advanced Criteria */}
          {showAdvanced && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Advanced Criteria</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white mb-2 block">P/E Ratio Range</label>
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={criteria.minPE.toString()}
                      onChange={(e) => setCriteria(prev => ({ ...prev, minPE: parseFloat(e.target.value) || 0 }))}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={criteria.maxPE.toString()}
                      onChange={(e) => setCriteria(prev => ({ ...prev, maxPE: parseFloat(e.target.value) || 100 }))}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-white mb-2 block">P/B Ratio Range</label>
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={criteria.minPB.toString()}
                      onChange={(e) => setCriteria(prev => ({ ...prev, minPB: parseFloat(e.target.value) || 0 }))}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={criteria.maxPB.toString()}
                      onChange={(e) => setCriteria(prev => ({ ...prev, maxPB: parseFloat(e.target.value) || 10 }))}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-white mb-2 block">Min ROE (%)</label>
                  <Input
                    type="number"
                    placeholder="Min ROE"
                    value={criteria.minROE.toString()}
                    onChange={(e) => setCriteria(prev => ({ ...prev, minROE: parseFloat(e.target.value) || 0 }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-white mb-2 block">Min ROA (%)</label>
                  <Input
                    type="number"
                    placeholder="Min ROA"
                    value={criteria.minROA.toString()}
                    onChange={(e) => setCriteria(prev => ({ ...prev, minROA: parseFloat(e.target.value) || 0 }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-white mb-2 block">Debt/Equity Range</label>
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={criteria.minDebtToEquity.toString()}
                      onChange={(e) => setCriteria(prev => ({ ...prev, minDebtToEquity: parseFloat(e.target.value) || 0 }))}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={criteria.maxDebtToEquity.toString()}
                      onChange={(e) => setCriteria(prev => ({ ...prev, maxDebtToEquity: parseFloat(e.target.value) || 2 }))}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sectors and Countries */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Sectors</h4>
              <div className="flex flex-wrap gap-2">
                {availableSectors.map(sector => (
                  <div
                    key={sector}
                    onClick={() => toggleSector(sector)}
                    className="cursor-pointer"
                  >
                    <Badge
                      variant={criteria.sectors.includes(sector) ? "default" : "outline"}
                      className={`${
                        criteria.sectors.includes(sector)
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : 'border-slate-600 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {sector}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Countries</h4>
              <div className="flex flex-wrap gap-2">
                {availableCountries.map(country => (
                  <div
                    key={country}
                    onClick={() => toggleCountry(country)}
                    className="cursor-pointer"
                  >
                    <Badge
                      variant={criteria.countries.includes(country) ? "default" : "outline"}
                      className={`${
                        criteria.countries.includes(country)
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'border-slate-600 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {country}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Screener Results</CardTitle>
              <CardDescription>
                {filteredStocks.length} stocks match your criteria
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="bg-slate-700 text-white border border-slate-600 rounded px-3 py-2"
              >
                <option value="symbol">Symbol</option>
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="marketCap">Market Cap</option>
                <option value="pe">P/E</option>
                <option value="pb">P/B</option>
                <option value="roe">ROE</option>
              </select>
              <Button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-600"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
              <Button
                onClick={exportResults}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-600"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sortedStocks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-2 text-slate-300">Symbol</th>
                    <th className="text-left py-3 px-2 text-slate-300">Name</th>
                    <th className="text-right py-3 px-2 text-slate-300">Price</th>
                    <th className="text-right py-3 px-2 text-slate-300">Change %</th>
                    <th className="text-right py-3 px-2 text-slate-300">Market Cap</th>
                    <th className="text-right py-3 px-2 text-slate-300">P/E</th>
                    <th className="text-right py-3 px-2 text-slate-300">P/B</th>
                    <th className="text-right py-3 px-2 text-slate-300">ROE %</th>
                    <th className="text-right py-3 px-2 text-slate-300">ROA %</th>
                    <th className="text-right py-3 px-2 text-slate-300">D/E</th>
                    <th className="text-right py-3 px-2 text-slate-300">Volume</th>
                    <th className="text-left py-3 px-2 text-slate-300">Sector</th>
                    <th className="text-left py-3 px-2 text-slate-300">Country</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedStocks.map((stock) => (
                    <tr key={stock.symbol} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="py-3 px-2">
                        <div className="font-semibold text-white">{stock.symbol}</div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="text-slate-300">{stock.name}</div>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="font-semibold text-white">
                          {stock.price ? formatCurrency(stock.price) : 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className={`font-semibold ${
                          stock.changePercent && stock.changePercent > 0 ? 'text-green-400' : 
                          stock.changePercent && stock.changePercent < 0 ? 'text-red-400' : 'text-slate-300'
                        }`}>
                          {stock.changePercent ? `${stock.changePercent > 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%` : 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="text-slate-300">
                          {stock.marketCap ? formatNumber(stock.marketCap) : 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="text-slate-300">
                          {stock.pe ? stock.pe.toFixed(1) : 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="text-slate-300">
                          {stock.pb ? stock.pb.toFixed(2) : 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="text-slate-300">
                          {stock.roe ? stock.roe.toFixed(1) : 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="text-slate-300">
                          {stock.roa ? stock.roa.toFixed(1) : 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="text-slate-300">
                          {stock.debtToEquity ? stock.debtToEquity.toFixed(2) : 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="text-slate-300">
                          {stock.volume ? formatNumber(stock.volume) : 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant="outline" className="border-slate-600 text-slate-300">
                          {stock.sector}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant="outline" className="border-slate-600 text-slate-300">
                          {stock.country}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Filter className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400 text-lg mb-2">No stocks match your criteria</p>
              <p className="text-slate-500">Try adjusting your screening parameters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">💡 Screening Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-700/50 rounded-lg">
              <h4 className="font-semibold text-white mb-2">Value Investing</h4>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>• Look for P/E ratios below 15</li>
                <li>• P/B ratios below 1.5</li>
                <li>• ROE above 15%</li>
                <li>• Low debt-to-equity ratios</li>
              </ul>
            </div>
            <div className="p-4 bg-slate-700/50 rounded-lg">
              <h4 className="font-semibold text-white mb-2">Growth Investing</h4>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>• Higher P/E ratios acceptable</li>
                <li>• Strong revenue growth</li>
                <li>• High ROE and ROA</li>
                <li>• Innovative sectors</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
