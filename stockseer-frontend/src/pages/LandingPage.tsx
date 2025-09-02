import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Brain, 
  BarChart3, 
  Globe, 
  ArrowRight,
  Zap,
  Shield,
  Target
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const LandingPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Predictions',
      description: 'Advanced machine learning algorithms analyze market patterns to provide accurate stock predictions.'
    },
    {
      icon: BarChart3,
      title: 'Technical Analysis',
      description: 'Comprehensive technical indicators and charting tools for informed decision making.'
    },
    {
      icon: TrendingUp,
      title: 'Real-time Insights',
      description: 'Live market data and instant notifications to stay ahead of market movements.'
    },
    {
      icon: Globe,
      title: 'Global Coverage',
      description: 'Access to markets worldwide with comprehensive data and analysis tools.'
    }
  ];

  const stats = [
    { label: 'Stocks Tracked', value: '10,000+' },
    { label: 'AI Models', value: '50+' },
    { label: 'Accuracy Rate', value: '85%' },
    { label: 'Active Users', value: '100K+' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-dark-900 dark:via-dark-800 dark:to-dark-700">
      {/* Header */}
      <header className="relative z-10 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-blue-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">StockSeer.ai</span>
          </div>
          
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-white/80 dark:bg-dark-800/80 backdrop-blur-sm border border-gray-200 dark:border-dark-700 hover:bg-white dark:hover:bg-dark-800 transition-all duration-200"
          >
            {theme === 'dark' ? '🌞' : '🌙'}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 font-display">
              AI-Powered
              <span className="gradient-text block">Stock Market</span>
              Analytics
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Leverage advanced artificial intelligence to make informed investment decisions. 
              Get real-time insights, technical analysis, and predictive analytics.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/dashboard"
                className="btn-primary text-lg px-8 py-4 inline-flex items-center justify-center group"
              >
                Launch Dashboard
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
              <button className="btn-secondary text-lg px-8 py-4 inline-flex items-center justify-center">
                <Shield className="mr-2 w-5 h-5" />
                Learn More
              </button>
            </div>
          </motion.div>
        </div>

        {/* Floating Elements */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute top-20 right-10 w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full blur-xl"
        />
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 4, repeat: Infinity, delay: 1 }}
          className="absolute bottom-20 left-10 w-32 h-32 bg-blue-100 dark:bg-blue-900/30 rounded-full blur-xl"
        />
      </section>

      {/* Features Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4 font-heading">
              Why Choose StockSeer.ai?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Our platform combines cutting-edge AI technology with comprehensive market data 
              to give you the edge in stock market investing.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card text-center group hover:shadow-glow transition-all duration-300"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 bg-white/50 dark:bg-dark-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-3xl lg:text-4xl font-bold gradient-text mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Ready to Transform Your Trading?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Join thousands of investors who are already using AI-powered insights 
              to make better investment decisions.
            </p>
            <Link
              to="/dashboard"
              className="btn-primary text-lg px-8 py-4 inline-flex items-center justify-center group"
            >
              <Target className="mr-2 w-5 h-5" />
              Get Started Now
              <Zap className="ml-2 w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-12 sm:px-6 lg:px-8 border-t border-gray-200 dark:border-dark-700">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-gradient-to-r from-primary-600 to-blue-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">StockSeer.ai</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            © 2024 StockSeer.ai. All rights reserved. AI-powered stock market analytics.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
