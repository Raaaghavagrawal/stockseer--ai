import { useState } from 'react';
import { X, Globe, Crown, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ContinentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectContinent: (continent: string) => void;
}

const continents = [
  {
    id: 'asia',
    name: 'Asia',
    description: 'Free access to Asian markets',
    markets: ['Japan', 'China', 'India', 'South Korea', 'Singapore', 'Hong Kong'],
    plan: 'free',
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800'
  },
  {
    id: 'americas',
    name: 'Americas',
    description: 'Premium access to American markets',
    markets: ['United States', 'Canada', 'Brazil', 'Mexico', 'Argentina'],
    plan: 'premium',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800'
  },
  {
    id: 'europe',
    name: 'Europe',
    description: 'Premium access to European markets',
    markets: ['United Kingdom', 'Germany', 'France', 'Italy', 'Spain', 'Netherlands'],
    plan: 'premium',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800'
  },
  {
    id: 'oceania',
    name: 'Oceania',
    description: 'Premium access to Oceanic markets',
    markets: ['Australia', 'New Zealand'],
    plan: 'premium',
    color: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800'
  },
  {
    id: 'africa',
    name: 'Africa',
    description: 'Premium access to African markets',
    markets: ['South Africa', 'Nigeria', 'Egypt', 'Kenya'],
    plan: 'premium',
    color: 'from-amber-500 to-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800'
  },
  {
    id: 'global',
    name: 'Global',
    description: 'Premium Plus access to all markets worldwide',
    markets: ['All 50+ markets worldwide'],
    plan: 'premium-plus',
    color: 'from-indigo-500 to-indigo-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    borderColor: 'border-indigo-200 dark:border-indigo-800'
  }
];

export default function ContinentSelectionModal({ isOpen, onClose, onSelectContinent }: ContinentSelectionModalProps) {
  const [selectedContinent, setSelectedContinent] = useState<string>('');

  if (!isOpen) return null;

  const handleSelect = () => {
    if (selectedContinent) {
      onSelectContinent(selectedContinent);
      onClose();
    }
  };

  const selectedContinentData = continents.find(c => c.id === selectedContinent);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-binance-gray-light rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-binance-gray">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-binance-yellow to-binance-yellow-dark rounded-lg flex items-center justify-center">
              <Globe className="w-6 h-6 text-binance-gray-dark" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Choose Your Market Region</h2>
              <p className="text-gray-600 dark:text-binance-text-secondary">Select your primary trading region to get started</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-binance-gray rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {continents.map((continent) => (
              <div
                key={continent.id}
                className={`relative rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                  selectedContinent === continent.id
                    ? `${continent.borderColor} ${continent.bgColor} scale-105 shadow-lg`
                    : 'border-gray-200 dark:border-binance-gray hover:border-gray-300 dark:hover:border-binance-gray-light'
                }`}
                onClick={() => setSelectedContinent(continent.id)}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r ${continent.color}`}>
                      <Globe className="w-4 h-4 text-white" />
                    </div>
                    {selectedContinent === continent.id && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {continent.name}
                  </h3>
                  
                  <p className="text-sm text-gray-600 dark:text-binance-text-secondary mb-3">
                    {continent.description}
                  </p>
                  
                  <div className="space-y-1">
                    {continent.markets.slice(0, 3).map((market, index) => (
                      <div key={index} className="text-xs text-gray-500 dark:text-gray-400">
                        • {market}
                      </div>
                    ))}
                    {continent.markets.length > 3 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        • +{continent.markets.length - 3} more
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      continent.plan === 'free' 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : continent.plan === 'premium'
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                        : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                    }`}>
                      {continent.plan === 'free' ? 'Free Plan' : 
                       continent.plan === 'premium' ? 'Premium' : 'Premium Plus'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Continent Info */}
          {selectedContinentData && (
            <div className={`${selectedContinentData.bgColor} ${selectedContinentData.borderColor} border-2 rounded-xl p-4 mb-6`}>
              <div className="flex items-center space-x-3 mb-3">
                <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r ${selectedContinentData.color}`}>
                  <Globe className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedContinentData.name} Markets
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-binance-text-secondary">
                    {selectedContinentData.description}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {selectedContinentData.markets.map((market, index) => (
                  <div key={index} className="text-sm text-gray-700 dark:text-binance-text">
                    • {market}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 dark:border-binance-gray text-gray-700 dark:text-binance-text font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-binance-gray transition-colors"
            >
              Skip for now
            </button>
            <button
              onClick={handleSelect}
              disabled={!selectedContinent}
              className={`px-6 py-3 font-semibold rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
                selectedContinent
                  ? 'bg-binance-yellow hover:bg-binance-yellow-dark text-binance-gray-dark hover:scale-105 shadow-lg'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              <span>Continue with {selectedContinentData?.name || 'Selected Region'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Upgrade Message for Non-Asian Regions */}
          {selectedContinentData && selectedContinentData.plan !== 'free' && (
            <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <Crown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <div>
                  <h4 className="text-sm font-semibold text-purple-800 dark:text-purple-300">
                    Premium Plan Required
                  </h4>
                  <p className="text-sm text-purple-700 dark:text-purple-400">
                    {selectedContinentData.name} markets require a {selectedContinentData.plan === 'premium-plus' ? 'Premium Plus' : 'Premium'} subscription. 
                    {selectedContinentData.plan === 'premium-plus' 
                      ? ' Premium Plus requires immediate payment - no trial available.' 
                      : ' You\'ll get a 14-day free trial when you upgrade.'}
                    You'll be redirected to the pricing page to upgrade.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Free Plan Message for Asian Region */}
          {selectedContinentData && selectedContinentData.plan === 'free' && (
            <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div>
                  <h4 className="text-sm font-semibold text-green-800 dark:text-green-300">
                    Free Plan Active
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    You're continuing with the free plan for Asian markets. 
                    You'll be redirected to the dashboard to start trading.
                    <Link to="/pricing" className="underline hover:no-underline ml-1">
                      Click here to upgrade
                    </Link> for access to global markets.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
