import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

import { 
  Bell,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Target,
  Download,
  Search
} from 'lucide-react';
import type { Alert } from '@/types/stock';

export default function AlertsTab() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'price' | 'technical' | 'news'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'triggered' | 'expired'>('all');

  // Fetch real alerts data
  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/alerts');
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      } else {
        console.error('Failed to fetch alerts');
        setAlerts([]);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setAlerts([]);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const [newAlert, setNewAlert] = useState({
    symbol: '',
    type: 'price' as 'price' | 'technical' | 'news',
    condition: 'above' as 'above' | 'below' | 'rsi_above' | 'rsi_below' | 'macd_crossover' | 'volume_spike',
    value: '',
    message: ''
  });

  const addAlert = () => {
    if (newAlert.symbol && newAlert.value) {
      const alert: Alert = {
        id: Date.now().toString(),
        symbol: newAlert.symbol.toUpperCase(),
        type: newAlert.type,
        condition: newAlert.condition,
        value: parseFloat(newAlert.value),
        status: 'active',
        message: newAlert.message || `${newAlert.symbol.toUpperCase()} ${newAlert.condition} ${newAlert.value}`,
        createdAt: new Date(),
        triggeredAt: undefined,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
      };
      setAlerts(prev => [...prev, alert]);
      setNewAlert({ symbol: '', type: 'price', condition: 'above', value: '', message: '' });
      setShowAddForm(false);
    }
  };

  const editAlert = (alert: Alert) => {
    setEditingAlert(alert);
    setNewAlert({
      symbol: alert.symbol,
      type: alert.type,
      condition: alert.condition as any,
      value: alert.value.toString(),
      message: alert.message
    });
    setShowAddForm(true);
  };

  const updateAlert = () => {
    if (editingAlert && newAlert.symbol && newAlert.value) {
      setAlerts(prev => prev.map(alert => 
        alert.id === editingAlert.id 
          ? { ...alert, ...newAlert, value: parseFloat(newAlert.value) }
          : alert
      ));
      setEditingAlert(null);
      setNewAlert({ symbol: '', type: 'price', condition: 'above', value: '', message: '' });
      setShowAddForm(false);
    }
  };

  const deleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const toggleAlertStatus = (id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id 
        ? { ...alert, status: alert.status === 'active' ? 'expired' : 'active' }
        : alert
    ));
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         alert.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || alert.type === filterType;
    const matchesStatus = filterStatus === 'all' || alert.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const exportAlerts = () => {
    const csvContent = [
      ['Symbol', 'Type', 'Condition', 'Value', 'Status', 'Message', 'Created', 'Triggered', 'Expires'],
      ...filteredAlerts.map(alert => [
        alert.symbol,
        alert.type,
        alert.condition,
        alert.value.toString(),
        alert.status,
        alert.message,
        alert.createdAt.toLocaleDateString(),
        alert.triggeredAt?.toLocaleDateString() || '',
        alert.expiresAt.toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alerts_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-600';
      case 'triggered': return 'bg-yellow-600';
      case 'expired': return 'bg-slate-600';
      default: return 'bg-slate-600';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'price': return <Target className="w-4 h-4" />;
      case 'technical': return <TrendingUp className="w-4 h-4" />;
      case 'news': return <Bell className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Header */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-white">
                🔔 Stock Alerts
              </CardTitle>
              <CardDescription className="text-slate-400">
                Set price, technical, and news alerts for your stocks
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Alert
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Add/Edit Alert Form */}
      {showAddForm && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">
              {editingAlert ? 'Edit Alert' : 'Add New Alert'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-white mb-2 block">Stock Symbol</label>
                <Input
                  placeholder="e.g., AAPL, TSLA"
                  value={newAlert.symbol}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, symbol: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-white mb-2 block">Alert Type</label>
                <select
                  value={newAlert.type}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full bg-slate-700 text-white border border-slate-600 rounded px-3 py-2"
                >
                  <option value="price">Price Alert</option>
                  <option value="technical">Technical Alert</option>
                  <option value="news">News Alert</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-white mb-2 block">Condition</label>
                <select
                  value={newAlert.condition}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, condition: e.target.value as any }))}
                  className="w-full bg-slate-700 text-white border border-slate-600 rounded px-3 py-2"
                >
                  <option value="above">Above</option>
                  <option value="below">Below</option>
                  <option value="rsi_above">RSI Above</option>
                  <option value="rsi_below">RSI Below</option>
                  <option value="macd_crossover">MACD Crossover</option>
                  <option value="volume_spike">Volume Spike</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-white mb-2 block">Value</label>
                <Input
                  type="number"
                  placeholder="Enter value"
                  value={newAlert.value}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, value: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-white mb-2 block">Message (Optional)</label>
              <Input
                placeholder="Custom alert message"
                value={newAlert.message}
                onChange={(e) => setNewAlert(prev => ({ ...prev, message: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={editingAlert ? updateAlert : addAlert}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {editingAlert ? 'Update Alert' : 'Add Alert'}
              </Button>
              <Button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingAlert(null);
                  setNewAlert({ symbol: '', type: 'price', condition: 'above', value: '', message: '' });
                }}
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
          <CardTitle className="text-white">Alert Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-white mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search alerts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-white mb-2 block">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full bg-slate-700 text-white border border-slate-600 rounded px-3 py-2"
              >
                <option value="all">All Types</option>
                <option value="price">Price</option>
                <option value="technical">Technical</option>
                <option value="news">News</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-white mb-2 block">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full bg-slate-700 text-white border border-slate-600 rounded px-3 py-2"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="triggered">Triggered</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={exportAlerts}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-600 w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Your Alerts</CardTitle>
          <CardDescription>
            {filteredAlerts.length} alerts found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAlerts.length > 0 ? (
            <div className="space-y-4">
              {filteredAlerts.map((alert) => (
                <div key={alert.id} className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getTypeIcon(alert.type)}
                      <div>
                        <div className="font-semibold text-white">{alert.symbol}</div>
                        <div className="text-sm text-slate-400">{alert.message}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(alert.status)}>
                        {alert.status}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => editAlert(alert)}
                        className="border-slate-600 text-slate-300 hover:bg-slate-600"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleAlertStatus(alert.id)}
                        className="border-slate-600 text-slate-300 hover:bg-slate-600"
                      >
                        {alert.status === 'active' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteAlert(alert.id)}
                        className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Type:</span>
                      <span className="text-white ml-2 capitalize">{alert.type}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Condition:</span>
                      <span className="text-white ml-2">{alert.condition}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Value:</span>
                      <span className="text-white ml-2">{alert.value}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Created:</span>
                      <span className="text-white ml-2">{alert.createdAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400 text-lg mb-2">
                {searchQuery || filterType !== 'all' || filterStatus !== 'all' 
                  ? 'No alerts match your filters' 
                  : 'No alerts set yet'}
              </p>
              <p className="text-slate-500">
                {searchQuery || filterType !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Create your first alert to get started'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">💡 Alert Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-700/50 rounded-lg">
              <h4 className="font-semibold text-white mb-2">Price Alerts</h4>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>• Set support and resistance levels</li>
                <li>• Monitor breakout points</li>
                <li>• Track earnings-related moves</li>
                <li>• Use for entry/exit timing</li>
              </ul>
            </div>
            <div className="p-4 bg-slate-700/50 rounded-lg">
              <h4 className="font-semibold text-white mb-2">Technical Alerts</h4>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>• RSI oversold/overbought levels</li>
                <li>• MACD crossover signals</li>
                <li>• Volume spike detection</li>
                <li>• Moving average crossovers</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
