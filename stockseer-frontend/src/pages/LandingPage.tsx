import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Brain, 
  BarChart3, 
  Globe, 
  ArrowRight,
  Menu,
  X,
  Star,
  Users,
  Shield,
  Zap,
  Target,
  CheckCircle,
  Play,
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
  LogOut,
  Mail,
  Info
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from '../components/AuthModal';

// Animated Text Component
const AnimatedText: React.FC<{ 
  text: string; 
  className?: string; 
  delay?: number;
  gradient?: boolean;
}> = ({ 
  text, 
  className = '', 
  delay = 0,
  gradient = false
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [delay]);

  if (!isVisible) {
    return <span className={className}></span>;
  }

  return (
    <span className={className}>
      {text.split('').map((letter, index) => (
        <span
          key={index}
          className={`letter-animate ${gradient ? 'text-yellow-500' : ''}`}
          style={{
            animationDelay: `${index * 0.08}s`
          }}
        >
          {letter === ' ' ? '\u00A0' : letter}
        </span>
      ))}
    </span>
  );
};

// Animated Counter Component
const AnimatedCounter: React.FC<{
  end: number;
  duration?: number;
  suffix?: string;
  className?: string;
}> = ({ end, duration = 2000, suffix = '', className = '' }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById(`counter-${end}`);
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [end]);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    const startValue = 0;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(startValue + (end - startValue) * easeOutQuart);
      
      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, end, duration]);

  return (
    <span id={`counter-${end}`} className={className}>
      {count.toLocaleString()}{suffix}
    </span>
  );
};

const LandingPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { currentUser, logout } = useAuth();
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Close hamburger menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isHamburgerOpen && !target.closest('.hamburger-menu')) {
        setIsHamburgerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isHamburgerOpen]);

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Predictions',
      description: 'Advanced machine learning algorithms analyze market patterns to provide accurate stock predictions.',
      color: 'from-yellow-400 to-orange-500'
    },
    {
      icon: BarChart3,
      title: 'Technical Analysis',
      description: 'Comprehensive technical indicators and charting tools for informed decision making.',
      color: 'from-blue-400 to-cyan-500'
    },
    {
      icon: TrendingUp,
      title: 'Real-time Insights',
      description: 'Live market data and instant notifications to stay ahead of market movements.',
      color: 'from-green-400 to-emerald-500'
    },
    {
      icon: Globe,
      title: 'Global Coverage',
      description: 'Access to markets worldwide with comprehensive data and analysis tools.',
      color: 'from-purple-400 to-pink-500'
    }
  ];

  const stats = [
    { label: 'Stocks Tracked', value: 10000, suffix: '+', icon: TrendingUp },
    { label: 'AI Models', value: 50, suffix: '+', icon: Brain },
    { label: 'Accuracy Rate', value: 85, suffix: '%', icon: Target },
    { label: 'Active Users', value: 100000, suffix: '+', icon: Users }
  ];

  const benefits = [
    'Advanced AI algorithms for market prediction',
    'Real-time market data and analysis',
    'Professional-grade technical indicators',
    'Risk management and portfolio optimization',
    '24/7 market monitoring and alerts',
    'Secure and reliable platform'
  ];

  const faqs = [
    {
      question: "How accurate are StockSeer.ai's predictions?",
      answer: "Our AI models achieve an average accuracy rate of 85% across different market conditions. We use advanced machine learning algorithms that analyze over 200+ technical indicators, market sentiment, and historical patterns to provide reliable predictions. However, past performance doesn't guarantee future results, and all investments carry risk."
    },
    {
      question: "What markets and stocks does StockSeer.ai cover?",
      answer: "We cover over 10,000+ stocks across major global markets including NYSE, NASDAQ, LSE, TSE, and more. Our platform supports stocks from the US, UK, Canada, Australia, Japan, and European markets. We're continuously expanding our coverage to include emerging markets and additional asset classes."
    },
    {
      question: "Is there a free trial available?",
      answer: "Yes! We offer a 14-day free trial with full access to all features including AI predictions, technical analysis tools, real-time data, and portfolio tracking. No credit card required to start your trial. You can upgrade to a paid plan anytime during or after your trial period."
    },
    {
      question: "How does the AI prediction system work?",
      answer: "Our AI system combines multiple machine learning models including neural networks, ensemble methods, and deep learning algorithms. It analyzes technical indicators, price patterns, volume data, market sentiment from news and social media, and macroeconomic factors to generate predictions. The system continuously learns and improves from new market data."
    },
    {
      question: "Can I use StockSeer.ai for day trading?",
      answer: "Absolutely! StockSeer.ai is designed for all types of trading including day trading, swing trading, and long-term investing. Our real-time data feeds, instant alerts, and short-term prediction models make it particularly suitable for active traders who need quick, accurate insights."
    },
    {
      question: "Is my data and portfolio information secure?",
      answer: "Security is our top priority. We use bank-level encryption (256-bit SSL) to protect all data transmission and storage. Your portfolio information is encrypted and never shared with third parties. We're SOC 2 compliant and follow strict data protection regulations including GDPR and CCPA."
    },
    {
      question: "What technical indicators are available?",
      answer: "We provide over 50+ technical indicators including Moving Averages (SMA, EMA, WMA), RSI, MACD, Bollinger Bands, Stochastic Oscillator, Williams %R, CCI, ADX, and many more. Our platform also includes custom indicators and the ability to create your own technical analysis strategies."
    },
    {
      question: "Do you offer mobile apps?",
      answer: "Yes! StockSeer.ai is available as a responsive web application that works seamlessly on all devices including smartphones and tablets. We're also developing dedicated iOS and Android apps that will be available in the App Store and Google Play Store soon."
    },
    {
      question: "Can I integrate StockSeer.ai with my existing trading platform?",
      answer: "We offer comprehensive API access for developers and advanced users. You can integrate our predictions and data feeds with popular trading platforms like MetaTrader, TradingView, and custom trading systems. Our webhook support allows for real-time data streaming to your applications."
    },
    {
      question: "What support options are available?",
      answer: "We provide multiple support channels including 24/7 live chat, email support, comprehensive documentation, video tutorials, and a community forum. Premium users get priority support with faster response times. We also offer one-on-one training sessions for new users."
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-binance-gray-dark">
      {/* Header */}
      <header className="relative sticky top-0 z-50 bg-white/95 dark:bg-binance-gray-dark/95 backdrop-blur-sm border-b border-gray-200 dark:border-binance-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-binance-yellow to-binance-yellow-dark rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-binance-gray-dark" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-binance-text">StockSeer.ai</span>
            </div>
            
                        {/* Right side - Navigation and buttons */}
            <div className="flex items-center space-x-4">
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-8">
                <a href="#features" className="text-gray-700 dark:text-binance-text-secondary hover:text-binance-yellow transition-colors">Features</a>
                <a href="#stats" className="text-gray-700 dark:text-binance-text-secondary hover:text-binance-yellow transition-colors">Stats</a>
                <a href="#faq" className="text-gray-700 dark:text-binance-text-secondary hover:text-binance-yellow transition-colors">FAQ</a>
              </nav>

              {/* Auth buttons, theme toggle and hamburger menu */}
              <div className="flex items-center space-x-4">
                {/* Authentication buttons */}
                {!currentUser && (
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setAuthModalOpen(true);
                    }}
                    className="bg-binance-yellow hover:bg-binance-yellow-dark text-black font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    Sign In
                  </button>
                )}

                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-binance-gray hover:bg-gray-200 dark:hover:bg-binance-gray-light transition-colors"
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                {/* Hamburger menu button */}
                <button
                  onClick={() => setIsHamburgerOpen(!isHamburgerOpen)}
                  className="hamburger-menu p-2 rounded-lg bg-gray-100 dark:bg-binance-gray hover:bg-gray-200 dark:hover:bg-binance-gray-light transition-colors"
                >
                  {isHamburgerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Hamburger Menu Popup */}
          {isHamburgerOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="hamburger-menu absolute right-4 top-16 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 min-w-[200px] z-50"
            >
              <div className="space-y-1">
                <a 
                  href="#contact" 
                  onClick={() => setIsHamburgerOpen(false)} 
                  className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Mail className="w-4 h-4 mr-3" />
                  Contact Us
                </a>
                <a 
                  href="#about" 
                  onClick={() => setIsHamburgerOpen(false)} 
                  className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Info className="w-4 h-4 mr-3" />
                  About
                </a>
                
                {currentUser && (
                  <button
                    onClick={() => {
                      logout();
                      setIsHamburgerOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Logout
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Content */}
          <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
              className="text-center lg:text-left"
            >
              <div className="inline-flex items-center px-4 py-2 bg-binance-yellow/10 dark:bg-binance-yellow/20 rounded-full text-binance-yellow-dark dark:text-binance-yellow font-semibold text-sm mb-6">
                <Star className="w-4 h-4 mr-2" />
                AI-Powered Stock Analytics
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight font-orbitron">
                <AnimatedText 
                  text="The Future of" 
                  className="block"
                  delay={200}
                />
                <AnimatedText 
                  text="Stock Trading" 
                  className="block"
                  delay={1200}
                  gradient={true}
                />
            </h1>
              
              <p className="text-xl text-gray-600 dark:text-binance-text-secondary mb-8 max-w-2xl">
              Leverage advanced artificial intelligence to make informed investment decisions. 
              Get real-time insights, technical analysis, and predictive analytics.
            </p>
            
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
              {currentUser ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center px-8 py-4 bg-binance-yellow hover:bg-binance-yellow-dark text-binance-gray-dark font-semibold rounded-lg transition-all duration-200 hover:scale-105 shadow-lg"
                >
                  Start Trading Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              ) : (
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setAuthModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center px-8 py-4 bg-binance-yellow hover:bg-binance-yellow-dark text-binance-gray-dark font-semibold rounded-lg transition-all duration-200 hover:scale-105 shadow-lg"
                >
                  Start Trading Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </button>
              )}
                <button className="inline-flex items-center justify-center px-8 py-4 border-2 border-gray-300 dark:border-binance-gray text-gray-700 dark:text-binance-text font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-binance-gray transition-colors">
                  <Play className="mr-2 w-5 h-5" />
                  Watch Demo
                </button>
              </div>

              {/* Trust indicators */}
              <div className="flex items-center justify-center lg:justify-start space-x-8 text-sm text-gray-500 dark:text-binance-text-secondary">
                <div className="flex items-center">
                  <Shield className="w-4 h-4 mr-2" />
                  Secure Platform
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  100K+ Users
                </div>
                <div className="flex items-center">
                  <Zap className="w-4 h-4 mr-2" />
                  Real-time Data
                </div>
              </div>
            </motion.div>

            {/* Right side - Visual */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative bg-gradient-to-br from-binance-yellow/20 to-binance-yellow-dark/20 dark:from-binance-yellow/10 dark:to-binance-yellow-dark/10 rounded-3xl p-8 backdrop-blur-sm">
                <div className="bg-white dark:bg-binance-gray rounded-2xl p-6 shadow-2xl">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-binance-yellow to-binance-yellow-dark rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-binance-gray-dark" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-binance-text">Live Market</h3>
                        <p className="text-xs text-gray-500 dark:text-binance-text-secondary">Real-time prices</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-500 font-medium">Live</span>
                    </div>
                  </div>
                  
                  {/* Market Data Table */}
                  <div className="space-y-3">
                    {/* Table Header */}
                    <div className="grid grid-cols-4 gap-4 text-xs font-medium text-gray-500 dark:text-binance-text-secondary border-b border-gray-200 dark:border-binance-gray-light pb-2">
                      <div>Symbol</div>
                      <div className="text-right">Price</div>
                      <div className="text-right">24h Change</div>
                      <div className="text-right">Volume</div>
                    </div>
                    
                    {/* Stock Rows */}
                    <div className="space-y-2">
                      {/* AAPL */}
                      <div className="grid grid-cols-4 gap-4 items-center py-2 hover:bg-gray-50 dark:hover:bg-binance-gray-light rounded-lg px-2 transition-colors">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-white">A</span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-binance-text text-sm">AAPL</div>
                            <div className="text-xs text-gray-500 dark:text-binance-text-secondary">Apple Inc.</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900 dark:text-binance-text">$175.43</div>
                        </div>
                        <div className="text-right">
                          <div className="text-green-500 font-semibold text-sm">+2.45%</div>
                        </div>
                        <div className="text-right">
                          <div className="text-gray-600 dark:text-binance-text-secondary text-sm">45.2M</div>
                        </div>
                      </div>

                      {/* TSLA */}
                      <div className="grid grid-cols-4 gap-4 items-center py-2 hover:bg-gray-50 dark:hover:bg-binance-gray-light rounded-lg px-2 transition-colors">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-gradient-to-r from-red-500 to-red-700 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-white">T</span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-binance-text text-sm">TSLA</div>
                            <div className="text-xs text-gray-500 dark:text-binance-text-secondary">Tesla Inc.</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900 dark:text-binance-text">$248.87</div>
                        </div>
                        <div className="text-right">
                          <div className="text-red-500 font-semibold text-sm">-1.23%</div>
                        </div>
                        <div className="text-right">
                          <div className="text-gray-600 dark:text-binance-text-secondary text-sm">28.7M</div>
                        </div>
                      </div>

                      {/* GOOGL */}
                      <div className="grid grid-cols-4 gap-4 items-center py-2 hover:bg-gray-50 dark:hover:bg-binance-gray-light rounded-lg px-2 transition-colors">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-white">G</span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-binance-text text-sm">GOOGL</div>
                            <div className="text-xs text-gray-500 dark:text-binance-text-secondary">Alphabet Inc.</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900 dark:text-binance-text">$142.56</div>
                        </div>
                        <div className="text-right">
                          <div className="text-green-500 font-semibold text-sm">+0.87%</div>
                        </div>
                        <div className="text-right">
                          <div className="text-gray-600 dark:text-binance-text-secondary text-sm">18.9M</div>
                        </div>
                      </div>

                      {/* MSFT */}
                      <div className="grid grid-cols-4 gap-4 items-center py-2 hover:bg-gray-50 dark:hover:bg-binance-gray-light rounded-lg px-2 transition-colors">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-orange-700 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-white">M</span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-binance-text text-sm">MSFT</div>
                            <div className="text-xs text-gray-500 dark:text-binance-text-secondary">Microsoft Corp.</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900 dark:text-binance-text">$378.91</div>
                        </div>
                        <div className="text-right">
                          <div className="text-green-500 font-semibold text-sm">+1.56%</div>
                        </div>
                        <div className="text-right">
                          <div className="text-gray-600 dark:text-binance-text-secondary text-sm">22.1M</div>
                        </div>
                      </div>
                    </div>

                    {/* View More Button */}
                    <div className="pt-3 border-t border-gray-200 dark:border-binance-gray-light">
                      <button className="w-full py-2 text-sm font-medium text-binance-yellow hover:text-binance-yellow-dark transition-colors">
                        View All Markets →
              </button>
                    </div>
                  </div>
                </div>
            </div>
          </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50 dark:bg-binance-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-binance-text mb-4">
              Why Choose StockSeer.ai?
            </h2>
            <p className="text-xl text-gray-600 dark:text-binance-text-secondary max-w-3xl mx-auto">
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
                className="bg-white dark:bg-binance-gray-light rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-binance-text mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-binance-text-secondary">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <div className="w-16 h-16 bg-binance-yellow/10 dark:bg-binance-yellow/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-8 h-8 text-binance-yellow" />
                </div>
                <div className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-binance-text mb-2">
                  <AnimatedCounter 
                    end={stat.value} 
                    suffix={stat.suffix}
                    duration={2000}
                  />
                </div>
                <div className="text-gray-600 dark:text-binance-text-secondary">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50 dark:bg-binance-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-binance-text mb-6">
                Everything you need to succeed in trading
              </h2>
              <p className="text-xl text-gray-600 dark:text-binance-text-secondary mb-8">
                Our comprehensive platform provides all the tools and insights you need 
                to make informed trading decisions and maximize your returns.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center"
                  >
                    <CheckCircle className="w-6 h-6 text-binance-yellow mr-3 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-binance-text">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-binance-yellow/20 to-binance-yellow-dark/20 dark:from-binance-yellow/10 dark:to-binance-yellow-dark/10 rounded-3xl p-8">
                <div className="bg-white dark:bg-binance-gray-light rounded-2xl p-6">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-binance-yellow rounded-full flex items-center justify-center mx-auto mb-4">
                      <Brain className="w-10 h-10 text-binance-gray-dark" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-binance-text mb-2">
                      AI-Powered Insights
                    </h3>
                    <p className="text-gray-600 dark:text-binance-text-secondary">
                      Get personalized recommendations based on advanced machine learning algorithms
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section id="faq" className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-binance-text mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600 dark:text-binance-text-secondary">
              Everything you need to know about StockSeer.ai
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-binance-gray-light rounded-2xl border border-gray-200 dark:border-binance-gray overflow-hidden"
              >
                <button
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                  className="w-full px-6 py-6 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-binance-gray transition-colors"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-binance-text pr-4">
                    {faq.question}
                  </h3>
                  <div className="flex-shrink-0">
                    {openFAQ === index ? (
                      <ChevronUp className="w-5 h-5 text-binance-yellow" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 dark:text-binance-text-secondary" />
                    )}
                  </div>
                </button>
                
                <motion.div
                  initial={false}
                  animate={{
                    height: openFAQ === index ? 'auto' : 0,
                    opacity: openFAQ === index ? 1 : 0
                  }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6">
                    <p className="text-gray-600 dark:text-binance-text-secondary leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>

          {/* Contact Support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <div className="bg-gradient-to-r from-binance-yellow/10 to-binance-yellow-dark/10 dark:from-binance-yellow/5 dark:to-binance-yellow-dark/5 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-binance-text mb-4">
                Still have questions?
              </h3>
              <p className="text-gray-600 dark:text-binance-text-secondary mb-6">
                Our support team is here to help you get the most out of StockSeer.ai
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="inline-flex items-center justify-center px-6 py-3 bg-binance-yellow hover:bg-binance-yellow-dark text-binance-gray-dark font-semibold rounded-lg transition-colors">
                  <Users className="mr-2 w-4 h-4" />
                  Contact Support
                </button>
                <button className="inline-flex items-center justify-center px-6 py-3 border-2 border-gray-300 dark:border-binance-gray text-gray-700 dark:text-binance-text font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-binance-gray transition-colors">
                  <Brain className="mr-2 w-4 h-4" />
                  View Documentation
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-binance-text mb-6">
              Ready to Transform Your Trading?
            </h2>
            <p className="text-xl text-gray-600 dark:text-binance-text-secondary mb-8">
              Join thousands of investors who are already using AI-powered insights 
              to make better investment decisions.
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center px-8 py-4 bg-binance-yellow hover:bg-binance-yellow-dark text-binance-gray-dark font-semibold rounded-lg transition-all duration-200 hover:scale-105 shadow-lg"
            >
              <Target className="mr-2 w-5 h-5" />
              Get Started Now
              <Zap className="ml-2 w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-50 dark:bg-[hsl(0,0%,6%)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Get in Touch
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Have questions about StockSeer.ai? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Mail className="w-6 h-6 text-binance-yellow mr-4" />
                  <div>
                    <p className="text-gray-900 dark:text-white font-semibold">Email</p>
                    <p className="text-gray-600 dark:text-gray-400">support@stockseer.ai</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Users className="w-6 h-6 text-binance-yellow mr-4" />
                  <div>
                    <p className="text-gray-900 dark:text-white font-semibold">Support</p>
                    <p className="text-gray-600 dark:text-gray-400">24/7 Customer Support</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Globe className="w-6 h-6 text-binance-yellow mr-4" />
                  <div>
                    <p className="text-gray-900 dark:text-white font-semibold">Website</p>
                    <p className="text-gray-600 dark:text-gray-400">www.stockseer.ai</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Send us a Message</h3>
              <form className="space-y-6">
                <div>
                  <input
                    type="text"
                    placeholder="Your Name"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="Your Email"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <textarea
                    rows={4}
                    placeholder="Your Message"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full bg-binance-yellow hover:bg-binance-yellow-dark text-black font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-binance-gray-dark border-t border-gray-200 dark:border-binance-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-binance-yellow to-binance-yellow-dark rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-binance-gray-dark" />
                </div>
                <span className="text-2xl font-bold text-white">StockSeer.ai</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                The world's leading AI-powered stock market analytics platform. 
                Make informed investment decisions with cutting-edge technology.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-binance-gray rounded-lg flex items-center justify-center hover:bg-binance-gray-light transition-colors cursor-pointer">
                  <span className="text-white font-semibold">f</span>
                </div>
                <div className="w-10 h-10 bg-binance-gray rounded-lg flex items-center justify-center hover:bg-binance-gray-light transition-colors cursor-pointer">
                  <span className="text-white font-semibold">t</span>
                </div>
                <div className="w-10 h-10 bg-binance-gray rounded-lg flex items-center justify-center hover:bg-binance-gray-light transition-colors cursor-pointer">
                  <span className="text-white font-semibold">in</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-binance-yellow transition-colors">Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-binance-yellow transition-colors">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-binance-yellow transition-colors">API</a></li>
                <li><a href="#" className="text-gray-400 hover:text-binance-yellow transition-colors">Documentation</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-binance-yellow transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-binance-yellow transition-colors">Contact Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-binance-yellow transition-colors">Status</a></li>
                <li><a href="#" className="text-gray-400 hover:text-binance-yellow transition-colors">Community</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
            © 2024 StockSeer.ai. All rights reserved. AI-powered stock market analytics.
          </p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </div>
  );
};

export default LandingPage;