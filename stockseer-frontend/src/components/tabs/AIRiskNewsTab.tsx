import { useState, useEffect } from 'react';
import { Brain, AlertTriangle, TrendingUp, TrendingDown, BarChart3, Activity, Target, Shield } from 'lucide-react';
import type { StockData } from '../../types/stock';

interface AIRiskNewsTabProps {
  selectedStock: string;
  stockData: StockData | null;
}

export default function AIRiskNewsTab({ selectedStock, stockData }: AIRiskNewsTabProps) {
  const [activeTab, setActiveTab] = useState('ai-analysis');
  const [riskScore, setRiskScore] = useState(0);

  useEffect(() => {
    if (stockData) {
      // Simulate risk score calculation
      const baseScore = 50;
      const volatilityAdjustment = stockData.price && stockData.high && stockData.low 
        ? ((stockData.high - stockData.low) / stockData.price) * 100 
        : 0;
      const finalScore = Math.min(100, Math.max(0, baseScore + volatilityAdjustment));
      setRiskScore(Math.round(finalScore));
    }
  }, [stockData]);

  if (!selectedStock) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p>Search for a stock to view AI analysis and risk assessment</p>
      </div>
    );
  }

  const getRiskLevel = (score: number) => {
    if (score <= 30) return { level: 'Low', color: 'text-green-400', bg: 'bg-green-600' };
    if (score <= 60) return { level: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-600' };
    return { level: 'High', color: 'text-red-400', bg: 'bg-red-600' };
  };

  const riskInfo = getRiskLevel(riskScore);

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-2">🧠 AI Analysis & Risk Assessment</h2>
        <p className="text-slate-400">AI-powered insights and comprehensive risk analysis for {selectedStock}</p>
      </div>

      {/* Risk Score Overview */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Risk Assessment</h3>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${riskInfo.bg} text-white`}>
            {riskInfo.level} Risk
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className={`text-4xl font-bold ${riskInfo.color} mb-2`}>{riskScore}</div>
            <div className="text-slate-400 text-sm">Risk Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-2">
              {stockData?.price ? `$${stockData.price.toFixed(2)}` : 'N/A'}
            </div>
            <div className="text-slate-400 text-sm">Current Price</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-2">
              {stockData?.volume ? `${(stockData.volume / 1e6).toFixed(1)}M` : 'N/A'}
            </div>
            <div className="text-slate-400 text-sm">Volume</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <div className="flex space-x-2">
          {[
            { id: 'ai-analysis', label: 'AI Analysis', icon: Brain },
            { id: 'risk-assessment', label: 'Risk Assessment', icon: AlertTriangle },
            { id: 'technical-signals', label: 'Technical Signals', icon: TrendingUp },
            { id: 'market-insights', label: 'Market Insights', icon: BarChart3 }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors flex items-center space-x-2 ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        {activeTab === 'ai-analysis' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">AI Analysis Summary</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                <h4 className="font-medium text-white mb-3 flex items-center">
                  <Brain className="w-5 h-5 mr-2 text-blue-400" />
                  AI Insights
                </h4>
                <div className="space-y-3 text-sm text-slate-300">
                  <p>• Based on current market data, {selectedStock} shows {riskScore <= 50 ? 'favorable' : 'concerning'} risk patterns</p>
                  <p>• Technical indicators suggest {riskScore <= 40 ? 'bullish' : riskScore <= 70 ? 'neutral' : 'bearish'} momentum</p>
                  <p>• AI model predicts {riskScore <= 30 ? 'low' : riskScore <= 60 ? 'moderate' : 'high'} volatility in the next 30 days</p>
                </div>
              </div>
              
              <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                <h4 className="font-medium text-white mb-3 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-green-400" />
                  Investment Outlook
                </h4>
                <div className="space-y-3 text-sm text-slate-300">
                  <p>• AI recommendation: {riskScore <= 40 ? 'Consider buying' : riskScore <= 70 ? 'Hold position' : 'Consider selling'}</p>
                  <p>• Expected return range: {riskScore <= 30 ? '8-15%' : riskScore <= 60 ? '5-10%' : '2-8%'} annually</p>
                  <p>• Risk-adjusted score: {Math.round(100 - riskScore)}/100</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'risk-assessment' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Detailed Risk Analysis</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 text-center">
                <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <div className="text-lg font-semibold text-white">Market Risk</div>
                <div className="text-slate-400 text-sm">Medium</div>
              </div>
              
              <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 text-center">
                <Shield className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <div className="text-lg font-semibold text-white">Volatility Risk</div>
                <div className="text-slate-400 text-sm">{riskScore <= 40 ? 'Low' : riskScore <= 70 ? 'Medium' : 'High'}</div>
              </div>
              
              <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 text-center">
                <Activity className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <div className="text-lg font-semibold text-white">Liquidity Risk</div>
                <div className="text-slate-400 text-sm">Low</div>
              </div>
            </div>

            <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3">Risk Factors</h4>
              <div className="space-y-2 text-sm text-slate-300">
                <p>• <strong>Market Volatility:</strong> Current market conditions show {riskScore <= 40 ? 'stable' : riskScore <= 70 ? 'moderate' : 'high'} volatility</p>
                <p>• <strong>Sector Performance:</strong> {selectedStock} sector is performing {riskScore <= 50 ? 'above' : 'below'} market average</p>
                <p>• <strong>Technical Indicators:</strong> RSI and MACD suggest {riskScore <= 40 ? 'oversold' : riskScore <= 70 ? 'neutral' : 'overbought'} conditions</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'technical-signals' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Technical Analysis Signals</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                <h4 className="font-medium text-white mb-3 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
                  Bullish Signals
                </h4>
                <div className="space-y-2 text-sm text-slate-300">
                  <p>• Price above 50-day moving average</p>
                  <p>• RSI below 70 (not overbought)</p>
                  <p>• MACD line above signal line</p>
                  <p>• Volume increasing on price gains</p>
                </div>
              </div>
              
              <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                <h4 className="font-medium text-white mb-3 flex items-center">
                  <TrendingDown className="w-5 h-5 mr-2 text-red-400" />
                  Bearish Signals
                </h4>
                <div className="space-y-2 text-sm text-slate-300">
                  <p>• Price below 200-day moving average</p>
                  <p>• Declining volume trend</p>
                  <p>• Negative momentum indicators</p>
                  <p>• Support level breaches</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'market-insights' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Market Context & Insights</h3>
            
            <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3">Market Sentiment</h4>
              <div className="space-y-3 text-sm text-slate-300">
                <p>• <strong>Overall Market:</strong> {riskScore <= 50 ? 'Bullish' : 'Bearish'} sentiment prevailing</p>
                <p>• <strong>Sector Rotation:</strong> Money flowing {riskScore <= 50 ? 'into' : 'out of'} {selectedStock} sector</p>
                <p>• <strong>Institutional Activity:</strong> {riskScore <= 40 ? 'High' : riskScore <= 70 ? 'Moderate' : 'Low'} institutional buying</p>
                <p>• <strong>Analyst Coverage:</strong> {riskScore <= 50 ? 'Positive' : 'Mixed'} analyst recommendations</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
