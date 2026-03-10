import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Cog, Bell, Shield, Palette, Globe, User, Key } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const SettingsPanel: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState({
    priceAlerts: true,
    newsUpdates: true,
    predictionAlerts: false,
    portfolioUpdates: true
  });

  const [privacy, setPrivacy] = useState({
    shareData: false,
    analytics: true,
    marketing: false
  });

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handlePrivacyChange = (key: keyof typeof privacy) => {
    setPrivacy(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const settingsSections = [
    {
      icon: Palette,
      title: 'Appearance',
      description: 'Customize the look and feel of the application'
    },
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Manage your notification preferences'
    },
    {
      icon: Shield,
      title: 'Privacy & Security',
      description: 'Control your data and security settings'
    },
    {
      icon: Globe,
      title: 'Regional',
      description: 'Set your timezone and currency preferences'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-blue-500 rounded-xl flex items-center justify-center">
          <Cog className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Customize your StockSeer.ai experience</p>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settingsSections.map((section, index) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="card hover:shadow-glow transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-primary-100 to-blue-100 dark:from-primary-900/20 dark:to-blue-900/20 rounded-xl flex items-center justify-center">
                <section.icon className="w-6 h-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {section.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {section.description}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Appearance Settings */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
          <Palette className="w-5 h-5 text-primary-600" />
          <span>Appearance</span>
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Theme</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Choose your preferred color scheme</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setTheme('light')}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  theme === 'light'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'border-gray-300 dark:border-dark-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700'
                }`}
              >
                Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  theme === 'dark'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'border-gray-300 dark:border-dark-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700'
                }`}
              >
                Dark
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
          <Bell className="w-5 h-5 text-primary-600" />
          <span>Notifications</span>
        </h3>
        
        <div className="space-y-4">
          {Object.entries(notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Receive notifications for {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </p>
              </div>
              <button
                onClick={() => handleNotificationChange(key as keyof typeof notifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  value ? 'bg-primary-600' : 'bg-gray-200 dark:bg-dark-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    value ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
          <Shield className="w-5 h-5 text-primary-600" />
          <span>Privacy & Security</span>
        </h3>
        
        <div className="space-y-4">
          {Object.entries(privacy).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Allow {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </p>
              </div>
              <button
                onClick={() => handlePrivacyChange(key as keyof typeof privacy)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  value ? 'bg-primary-600' : 'bg-gray-200 dark:bg-dark-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    value ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Account Settings */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
          <User className="w-5 h-5 text-primary-600" />
          <span>Account</span>
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Email</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">user@example.com</p>
            </div>
            <button className="btn-secondary">Change</button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Password</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Last changed 30 days ago</p>
            </div>
            <button className="btn-secondary">Update</button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">API Key</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Manage your API access</p>
            </div>
            <button className="btn-secondary">Manage</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
