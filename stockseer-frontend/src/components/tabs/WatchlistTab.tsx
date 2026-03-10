import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  Eye, 
  EyeOff,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  Filter,
  Download,
  Settings,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import type { WatchlistItem } from '@/types/stock';
import { stockAPI } from '../../utils/api';

interface WatchlistTabProps {
  watchlist: string[];
  onRemoveFromWatchlist: (symbol: string) => void;
}

export default function WatchlistTab({ watchlist, onRemoveFromWatchlist }: WatchlistTabProps) {
  const [watchlistData, setWatchlistData] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'symbol' | 'name' | 'price' | 'change' | 'volume' | 'marketCap'>('symbol');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStock, setNewStock] = useState('');

  // Fetch real watchlist data
  const fetchWatchlistData = async () => {
    if (watchlist.length === 0) {
      setWatchlistData([]);
      return;
    }

    setLoading(true);
    try {
      const promises = watchlist.map(symbol => stockAPI.getStockData(symbol));
      const results = await Promise.all(promises);
      
      const transformedData: WatchlistItem[] = results.map(stock => ({
        symbol: stock.symbol,
        name: stock.name || stock.symbol,
        price: stock.price,
        change: stock.change,
        changePercent: stock.changePercent,
        volume: stock.volume,
        marketCap: stock.marketCap || 0
      }));
      
      setWatchlistData(transformedData);
    } catch (error) {
      console.error('Error fetching watchlist data:', error);
      setWatchlistData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlistData();
  }, [watchlist]);

  const refreshWatchlist = async () => {
    await fetchWatchlistData();
  };

  const addToWatchlist = () => {
    if (newStock.trim() && !watchlist.includes(newStock.trim().toUpperCase())) {
      // In a real app, this would call the API
      setNewStock('');
      setShowAddForm(false);
    }
  };

  const removeFromWatchlist = (symbol: string) => {
    onRemoveFromWatchlist(symbol);
    setWatchlistData(prev => prev.filter(item => item.symbol !== symbol));
  };

  const filteredData = watchlistData.filter(item =>
    item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedData = [...filteredData].sort((a, b) => {
    let aValue: any = a[sortBy];
    let bValue: any = b[sortBy];
    
    if (sortBy === 'price' || sortBy === 'change' || sortBy === 'volume' || sortBy === 'marketCap') {
      aValue = aValue || 0;
      bValue = bValue || 0;
    } else {
      aValue = String(aValue || '').toLowerCase();
      bValue = String(bValue || '').toLowerCase();
    }
    
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

  const exportWatchlist = () => {
    const csvContent = [
      ['Symbol', 'Name', 'Price', 'Change', 'Change %', 'Volume', 'Market Cap'],
      ...sortedData.map(item => [
        item.symbol,
        item.name,
        item.price?.toString() || '',
        item.change?.toString() || '',
        item.changePercent?.toString() || '',
        item.volume?.toString() || '',
        item.marketCap?.toString() || ''
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `watchlist_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Header */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-white">
                👀 My Watchlist
              </CardTitle>
              <CardDescription className="text-slate-400">
                Track your favorite stocks and monitor their performance
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={refreshWatchlist}
                disabled={loading}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-600"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Stock
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Add Stock Form */}
      {showAddForm && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Add Stock to Watchlist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Enter stock symbol (e.g., AAPL, GOOGL)"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && addToWatchlist()}
                className="flex-1 bg-slate-700 border border-slate-600 text-white rounded px-3 py-2"
              />
              <Button onClick={addToWatchlist} className="bg-blue-600 hover:bg-blue-700">
                Add
              </Button>
              <Button
                onClick={() => setShowAddForm(false)}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-600"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Watchlist Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-white mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search stocks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-white mb-2 block">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="w-full bg-slate-700 text-white border border-slate-600 rounded px-3 py-2"
              >
                <option value="symbol">Symbol</option>
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="change">Change</option>
                <option value="volume">Volume</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-white mb-2 block">Order</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="w-full bg-slate-700 text-white border border-slate-600 rounded px-3 py-2"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-300">
              {sortedData.length} stocks in watchlist
            </span>
            <Button
              onClick={exportWatchlist}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-600"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Watchlist Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Watchlist Stocks</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th 
                      className="text-left py-3 px-2 text-slate-300 cursor-pointer hover:text-white"
                      onClick={() => toggleSort('symbol')}
                    >
                      Symbol {getSortIcon('symbol')}
                    </th>
                    <th 
                      className="text-left py-3 px-2 text-slate-300 cursor-pointer hover:text-white"
                      onClick={() => toggleSort('name')}
                    >
                      Name {getSortIcon('name')}
                    </th>
                    <th 
                      className="text-right py-3 px-2 text-slate-300 cursor-pointer hover:text-white"
                      onClick={() => toggleSort('price')}
                    >
                      Price {getSortIcon('price')}
                    </th>
                    <th 
                      className="text-right py-3 px-2 text-slate-300 cursor-pointer hover:text-white"
                      onClick={() => toggleSort('change')}
                    >
                      Change {getSortIcon('change')}
                    </th>
                    <th className="text-right py-3 px-2 text-slate-300">Change %</th>
                    <th 
                      className="text-right py-3 px-2 text-slate-300 cursor-pointer hover:text-white"
                      onClick={() => toggleSort('volume')}
                    >
                      Volume {getSortIcon('volume')}
                    </th>
                    <th className="text-right py-3 px-2 text-slate-300">Market Cap</th>
                    <th className="text-center py-3 px-2 text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedData.map((item) => (
                    <tr key={item.symbol} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="py-3 px-2">
                        <div className="font-semibold text-white">{item.symbol}</div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="text-slate-300">{item.name}</div>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="font-semibold text-white">
                          {item.price ? formatCurrency(item.price) : 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className={`font-semibold ${
                          item.change && item.change > 0 ? 'text-green-400' : 
                          item.change && item.change < 0 ? 'text-red-400' : 'text-slate-300'
                        }`}>
                          {item.change ? formatCurrency(item.change) : 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className={`font-semibold ${
                          item.changePercent && item.changePercent > 0 ? 'text-green-400' : 
                          item.changePercent && item.changePercent < 0 ? 'text-red-400' : 'text-slate-300'
                        }`}>
                          {item.changePercent ? `${item.changePercent > 0 ? '+' : ''}${item.changePercent.toFixed(2)}%` : 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="text-slate-300">
                          {item.volume ? formatNumber(item.volume) : 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="text-slate-300">
                          {item.marketCap ? formatNumber(item.marketCap) : 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFromWatchlist(item.symbol)}
                          className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <EyeOff className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400 text-lg mb-2">
                {searchQuery ? 'No stocks match your search' : 'Your watchlist is empty'}
              </p>
              <p className="text-slate-500">
                {searchQuery ? 'Try adjusting your search terms' : 'Add some stocks to get started'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Watchlist Summary */}
      {sortedData.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Watchlist Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                <div className="text-sm text-slate-400">Total Stocks</div>
                <div className="text-2xl font-bold text-white">{sortedData.length}</div>
              </div>
              <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                <div className="text-sm text-slate-400">Gainers</div>
                <div className="text-2xl font-bold text-green-400">
                  {sortedData.filter(item => item.change && item.change > 0).length}
                </div>
              </div>
              <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                <div className="text-sm text-slate-400">Losers</div>
                <div className="text-2xl font-bold text-red-400">
                  {sortedData.filter(item => item.change && item.change < 0).length}
                </div>
              </div>
              <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                <div className="text-sm text-slate-400">Unchanged</div>
                <div className="text-2xl font-bold text-slate-400">
                  {sortedData.filter(item => !item.change || item.change === 0).length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">💡 Watchlist Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-700/50 rounded-lg">
              <h4 className="font-semibold text-white mb-2">Effective Monitoring</h4>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>• Keep your watchlist focused (10-20 stocks)</li>
                <li>• Group stocks by sector or strategy</li>
                <li>• Set price alerts for key levels</li>
                <li>• Review and update regularly</li>
              </ul>
            </div>
            <div className="p-4 bg-slate-700/50 rounded-lg">
              <h4 className="font-semibold text-white mb-2">Best Practices</h4>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>• Include both growth and value stocks</li>
                <li>• Monitor volume and price action</li>
                <li>• Track news and earnings dates</li>
                <li>• Use technical indicators</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
