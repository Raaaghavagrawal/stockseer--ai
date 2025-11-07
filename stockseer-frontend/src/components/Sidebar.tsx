import React from 'react';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  Brain, 
  X,
  Home,
  Wallet,
  Cog,
  Crown
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, onClose }) => {
  const menuItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: Home,
      description: 'Market overview and trending stocks'
    },
    {
      id: 'predictions',
      label: 'AI Predictions',
      icon: Brain,
      description: 'AI-powered stock predictions'
    },
    {
      id: 'portfolio',
      label: 'Portfolio',
      icon: Wallet,
      description: 'Manage your investments'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Cog,
      description: 'App preferences and configuration'
    }
  ];

  const pricingItem = {
    id: 'pricing',
    label: 'Pricing',
    icon: Crown,
    description: 'Choose your subscription plan',
    href: '/pricing'
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 h-full w-64 bg-white dark:bg-dark-800 border-r border-gray-200 dark:border-dark-700 z-30">
        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 flex items-center justify-center">
              <img src="/stocks.png" alt="StockSeer" className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white uppercase">STOCKSEER.AI</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">AI Analytics</p>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group ${
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${
                    isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                  }`} />
                  <div className="flex-1">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{item.description}</div>
                  </div>
                </button>
              );
            })}
            
            {/* Pricing Link */}
            <Link
              to={pricingItem.href}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 hover:text-gray-900 dark:hover:text-white"
            >
              <Crown className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
              <div className="flex-1">
                <div className="font-medium">{pricingItem.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{pricingItem.description}</div>
              </div>
            </Link>
          </nav>

          {/* Quick Stats */}
          <div className="mt-8 p-4 bg-gray-50 dark:bg-dark-700 rounded-xl">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Quick Stats</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Portfolio Value</span>
                <span className="font-medium text-gray-900 dark:text-white">$125,430</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Today's Change</span>
                <span className="font-medium text-success-600">+$2,450</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Active Alerts</span>
                <span className="font-medium text-warning-600">3</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: isOpen ? 0 : '-100%' }}
        transition={{ type: 'tween', duration: 0.3 }}
        className="lg:hidden fixed left-0 top-0 h-full w-80 bg-white dark:bg-dark-800 border-r border-gray-200 dark:border-dark-700 z-50"
        {...({} as HTMLMotionProps<'div'>)}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 flex items-center justify-center">
                <img src="/stocks.png" alt="StockSeer" className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white uppercase">STOCKSEER.AI</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">AI Analytics</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group ${
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${
                    isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                  }`} />
                  <div className="flex-1">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{item.description}</div>
                  </div>
                </button>
              );
            })}
            
            {/* Pricing Link */}
            <Link
              to={pricingItem.href}
              onClick={onClose}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 hover:text-gray-900 dark:hover:text-white"
            >
              <Crown className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
              <div className="flex-1">
                <div className="font-medium">{pricingItem.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{pricingItem.description}</div>
              </div>
            </Link>
          </nav>

          {/* Quick Stats */}
          <div className="mt-8 p-4 bg-gray-50 dark:bg-dark-700 rounded-xl">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Quick Stats</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Portfolio Value</span>
                <span className="font-medium text-gray-900 dark:text-white">$125,430</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Today's Change</span>
                <span className="font-medium text-success-600">+$2,450</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Active Alerts</span>
                <span className="font-medium text-warning-600">3</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default Sidebar;
