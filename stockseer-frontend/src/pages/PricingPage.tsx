import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, Star, Crown, Globe, Clock, AlertCircle, ArrowLeft } from 'lucide-react';
import { useSubscription } from '../contexts/SubscriptionContext';
import PaymentModal from '../components/PaymentModal';

export default function PricingPage() {
  const { currentPlan, setCurrentPlan, isTrialActive, trialEndDate, selectedContinent } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'premium' | 'premium-plus'>(currentPlan);
  const [isAnnual, setIsAnnual] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<'premium' | 'premiumPlus'>('premium');

  // Auto-show payment modal for Premium Plus when redirected from continent selection
  useEffect(() => {
    if (currentPlan === 'premium-plus' && selectedContinent === 'global') {
      setSelectedPlanForPayment('premiumPlus');
      setShowPaymentModal(true);
    }
  }, [currentPlan, selectedContinent]);

  const plans = {
    free: {
      name: 'Free',
      icon: Globe,
      price: { monthly: 0, annual: 0 },
      description: 'Perfect for getting started with Asian markets',
      features: [
        'Asian markets only (Japan, China, India, South Korea, Singapore)',
        'Basic stock analysis',
        'Real-time price data',
        'Basic charts and technical indicators',
        '5 stocks in watchlist',
        'Email support',
        'Basic news feed'
      ],
      limitations: [
        'Limited to 5 Asian markets',
        'No advanced AI predictions',
        'No portfolio tracking',
        'No custom alerts',
        'No data export'
      ],
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      popular: false
    },
    premium: {
      name: 'Premium',
      icon: Star,
      price: { monthly: 29, annual: 290 },
      description: 'Access to 20+ global markets with advanced features',
      features: [
        '20+ global markets (US, EU, Asia, Australia, Canada)',
        'Advanced AI predictions and analysis',
        'Portfolio tracking and management',
        'Custom alerts and notifications',
        'Advanced technical indicators',
        'Unlimited watchlist',
        'Data export (CSV, Excel)',
        'Priority email support',
        'Market screener with filters',
        'Real-time news and sentiment analysis',
        'Historical data (5 years)',
        'Mobile app access'
      ],
      limitations: [
        'No API access',
        'No custom indicators',
        'Limited to 20 markets'
      ],
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800',
      popular: true
    },
    premiumPlus: {
      name: 'Premium Plus',
      icon: Crown,
      price: { monthly: 59, annual: 590 },
      description: 'Complete access to 50+ markets with enterprise features',
      features: [
        '50+ global markets (All major exchanges worldwide)',
        'Advanced AI predictions with machine learning',
        'Portfolio optimization and risk analysis',
        'Custom alerts with advanced conditions',
        'All technical indicators and custom indicators',
        'Unlimited watchlists and portfolios',
        'Full data export and API access',
        '24/7 priority support',
        'Advanced market screener with AI filters',
        'Real-time news, sentiment, and social media analysis',
        'Historical data (20+ years)',
        'Mobile and desktop apps',
        'White-label solutions',
        'Team collaboration features',
        'Advanced backtesting tools',
        'Institutional-grade data feeds'
      ],
      limitations: [],
      color: 'from-amber-500 to-orange-600',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      borderColor: 'border-amber-200 dark:border-amber-800',
      popular: false
    }
  };

  const markets = {
    free: [
      { name: 'Japan (NIKKEI)', flag: '🇯🇵', exchanges: ['TSE'] },
      { name: 'China (SSE)', flag: '🇨🇳', exchanges: ['SSE', 'SZSE'] },
      { name: 'India (NSE)', flag: '🇮🇳', exchanges: ['NSE', 'BSE'] },
      { name: 'South Korea (KOSPI)', flag: '🇰🇷', exchanges: ['KRX'] },
      { name: 'Singapore (SGX)', flag: '🇸🇬', exchanges: ['SGX'] }
    ],
    premium: [
      { name: 'United States', flag: '🇺🇸', exchanges: ['NYSE', 'NASDAQ', 'AMEX'] },
      { name: 'United Kingdom', flag: '🇬🇧', exchanges: ['LSE', 'AIM'] },
      { name: 'Germany', flag: '🇩🇪', exchanges: ['XETRA', 'FSE'] },
      { name: 'France', flag: '🇫🇷', exchanges: ['EPA'] },
      { name: 'Canada', flag: '🇨🇦', exchanges: ['TSX', 'TSXV'] },
      { name: 'Australia', flag: '🇦🇺', exchanges: ['ASX'] },
      { name: 'Hong Kong', flag: '🇭🇰', exchanges: ['HKEX'] },
      { name: 'Taiwan', flag: '🇹🇼', exchanges: ['TWSE'] },
      { name: 'Brazil', flag: '🇧🇷', exchanges: ['B3'] },
      { name: 'Mexico', flag: '🇲🇽', exchanges: ['BMV'] },
      { name: 'South Africa', flag: '🇿🇦', exchanges: ['JSE'] },
      { name: 'Switzerland', flag: '🇨🇭', exchanges: ['SIX'] },
      { name: 'Netherlands', flag: '🇳🇱', exchanges: ['AEX'] },
      { name: 'Italy', flag: '🇮🇹', exchanges: ['BIT'] },
      { name: 'Spain', flag: '🇪🇸', exchanges: ['BME'] },
      { name: 'Sweden', flag: '🇸🇪', exchanges: ['OMX'] },
      { name: 'Norway', flag: '🇳🇴', exchanges: ['OSE'] },
      { name: 'Denmark', flag: '🇩🇰', exchanges: ['OMX Copenhagen'] },
      { name: 'Finland', flag: '🇫🇮', exchanges: ['OMX Helsinki'] },
      { name: 'Belgium', flag: '🇧🇪', exchanges: ['Euronext Brussels'] }
    ],
    premiumPlus: [
      { name: 'All Premium Markets', flag: '🌍', exchanges: ['20+ exchanges'] },
      { name: 'Additional 30+ Markets', flag: '🌐', exchanges: ['Emerging markets'] },
      { name: 'Crypto Markets', flag: '₿', exchanges: ['Major crypto exchanges'] },
      { name: 'Commodities', flag: '🥇', exchanges: ['COMEX', 'NYMEX', 'LME'] },
      { name: 'Forex', flag: '💱', exchanges: ['Major currency pairs'] },
      { name: 'Bonds', flag: '📈', exchanges: ['Government & corporate bonds'] },
      { name: 'ETFs', flag: '📊', exchanges: ['Global ETF markets'] },
      { name: 'REITs', flag: '🏢', exchanges: ['Real estate investment trusts'] }
    ]
  };

  const handlePlanSelect = (plan: 'free' | 'premium' | 'premium-plus') => {
    setSelectedPlan(plan);
    
    if (plan === 'free') {
      setCurrentPlan(plan);
    } else {
      // For paid plans, show payment modal
      // Convert kebab-case to camelCase for PaymentModal
      const paymentPlan = plan === 'premium-plus' ? 'premiumPlus' : plan;
      setSelectedPlanForPayment(paymentPlan as 'premium' | 'premiumPlus');
      setShowPaymentModal(true);
    }
  };

  const getCurrentPrice = (plan: keyof typeof plans) => {
    return isAnnual ? plans[plan].price.annual : plans[plan].price.monthly;
  };

  const getSavings = (plan: keyof typeof plans) => {
    if (plan === 'free') return 0;
    const monthlyTotal = plans[plan].price.monthly * 12;
    const annualPrice = plans[plan].price.annual;
    return monthlyTotal - annualPrice;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-binance-gray-dark">
      {/* Header */}
      <header className="relative sticky top-0 z-50 bg-white/95 dark:bg-binance-gray-dark/95 backdrop-blur-sm border-b border-gray-200 dark:border-binance-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Back Button */}
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="flex items-center space-x-2 text-gray-600 dark:text-binance-text-secondary hover:text-binance-yellow transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </Link>
              <div className="h-6 w-px bg-gray-300 dark:bg-binance-gray"></div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-binance-yellow to-binance-yellow-dark rounded-lg flex items-center justify-center">
                  <Crown className="w-6 h-6 text-binance-gray-dark" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-binance-text">Pricing Plans</h1>
              </div>
            </div>
            
            {/* Plan Status */}
            <div className="flex items-center space-x-2">
              <Crown className={`w-5 h-5 ${
                currentPlan === 'free' ? 'text-gray-400' : 
                currentPlan === 'premium' ? 'text-purple-500' : 'text-amber-500'
              }`} />
              <span className={`text-sm font-medium ${
                currentPlan === 'free' ? 'text-gray-500 dark:text-gray-400' : 
                currentPlan === 'premium' ? 'text-purple-600 dark:text-purple-400' : 'text-amber-600 dark:text-amber-400'
              }`}>
                {currentPlan === 'free' ? 'Free Plan' : 
                 currentPlan === 'premium' ? 'Premium' : 'Premium Plus'}
                {isTrialActive && ' (Trial)'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-12">
          {/* Header Section */}
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-binance-yellow/10 dark:bg-binance-yellow/20 rounded-full text-binance-yellow-dark dark:text-binance-yellow font-semibold text-sm mb-6">
              <Crown className="w-4 h-4 mr-2" />
              Choose Your Perfect Plan
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Choose Your <span className="bg-gradient-to-r from-binance-yellow to-binance-yellow-dark bg-clip-text text-transparent">Trading Plan</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-binance-text-secondary mb-8 max-w-3xl mx-auto">
              Unlock the power of AI-driven stock analysis across global markets. 
              Select the plan that fits your trading needs and budget.
            </p>
            
            {/* Trial Status */}
            {isTrialActive && trialEndDate && (
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 mb-8 max-w-md mx-auto">
                <div className="flex items-center justify-center space-x-2 text-white">
                  <Clock className="w-5 h-5" />
                  <span className="font-semibold">
                    Free Trial Active - {Math.ceil((trialEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                  </span>
                </div>
              </div>
            )}
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center space-x-4 mb-8">
              <span className={`text-sm font-medium ${!isAnnual ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>Monthly</span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isAnnual ? 'bg-binance-yellow' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isAnnual ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm font-medium ${isAnnual ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>Annual</span>
              {isAnnual && (
                <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                  Save up to 17%
                </span>
              )}
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {Object.entries(plans).map(([key, plan]) => {
              const Icon = plan.icon;
              const isSelected = selectedPlan === key;
              const isCurrentPlan = currentPlan === key;
              const price = getCurrentPrice(key as keyof typeof plans);
              const savings = getSavings(key as keyof typeof plans);
              
              return (
                <div
                  key={key}
                  className={`relative rounded-2xl border-2 transition-all duration-300 cursor-pointer bg-white dark:bg-binance-gray-light ${
                    isSelected
                      ? `${plan.borderColor} ${plan.bgColor} scale-105 shadow-2xl`
                      : 'border-gray-200 dark:border-binance-gray hover:border-gray-300 dark:hover:border-binance-gray-light'
                  } ${plan.popular ? 'ring-2 ring-purple-500 ring-opacity-50' : ''}`}
                  onClick={() => handlePlanSelect(key as 'free' | 'premium' | 'premium-plus')}
                >
                  {/* Popular Badge */}
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold px-4 py-1 rounded-full flex items-center">
                        <Star className="w-4 h-4 mr-1" />
                        Most Popular
                      </div>
                    </div>
                  )}

                  {/* Current Plan Badge */}
                  {isCurrentPlan && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-green-600 text-white text-sm font-bold px-4 py-1 rounded-full flex items-center">
                        <Check className="w-4 h-4 mr-1" />
                        Current Plan
                      </div>
                    </div>
                  )}

                  <div className="p-8">
                    {/* Plan Header */}
                    <div className="text-center mb-6">
                      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${plan.color} mb-4`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                      <p className="text-gray-600 dark:text-binance-text-secondary mb-4">{plan.description}</p>
                      
                      {/* Price */}
                      <div className="mb-4">
                        <span className="text-5xl font-bold text-gray-900 dark:text-white">${price}</span>
                        <span className="text-gray-500 dark:text-gray-400 ml-2">
                          /{isAnnual ? 'year' : 'month'}
                        </span>
                        {isAnnual && savings > 0 && (
                          <div className="text-green-500 text-sm mt-1 font-semibold">
                            Save ${savings}/year
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-4 mb-8">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">What's included:</h4>
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-binance-text text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Limitations */}
                    {plan.limitations.length > 0 && (
                      <div className="space-y-2 mb-8">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Limitations:</h4>
                        {plan.limitations.map((limitation, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-500 dark:text-gray-400 text-sm">{limitation}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* CTA Button */}
                    <button
                      className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                        isCurrentPlan
                          ? 'bg-green-500 text-white cursor-default'
                          : isSelected
                          ? `bg-gradient-to-r ${plan.color} text-white hover:opacity-90`
                          : 'bg-gray-100 dark:bg-binance-gray text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-binance-gray-light'
                      }`}
                      disabled={isCurrentPlan}
                    >
                      {isCurrentPlan ? 'Current Plan' : `Choose ${plan.name}`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Market Coverage */}
          <div className="mt-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white text-center mb-8">
              Market Coverage by Plan
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {Object.entries(markets).map(([planKey, marketList]) => {
                const plan = plans[planKey as keyof typeof plans];
                const Icon = plan.icon;
                
                return (
                  <div key={planKey} className="bg-white dark:bg-binance-gray-light border border-gray-200 dark:border-binance-gray rounded-2xl p-6 hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center mb-4">
                      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r ${plan.color} mr-3`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name} Markets</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">{marketList.length} markets</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {marketList.map((market, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <span className="text-2xl">{market.flag}</span>
                          <div>
                            <div className="text-gray-900 dark:text-white font-medium">{market.name}</div>
                            <div className="text-gray-500 dark:text-gray-400 text-sm">{market.exchanges.join(', ')}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Feature Comparison */}
          <div className="mt-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white text-center mb-8">
              Feature Comparison
            </h2>
            
            <div className="bg-white dark:bg-binance-gray-light border border-gray-200 dark:border-binance-gray rounded-2xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-binance-gray">
                    <tr>
                      <th className="text-left p-4 text-gray-900 dark:text-white font-semibold">Features</th>
                      <th className="text-center p-4 text-gray-900 dark:text-white font-semibold">Free</th>
                      <th className="text-center p-4 text-gray-900 dark:text-white font-semibold">Premium</th>
                      <th className="text-center p-4 text-gray-900 dark:text-white font-semibold">Premium Plus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { feature: 'Markets Access', free: '5 Asian', premium: '20+ Global', premiumPlus: '50+ Global' },
                      { feature: 'AI Predictions', free: 'Basic', premium: 'Advanced', premiumPlus: 'ML-Powered' },
                      { feature: 'Portfolio Tracking', free: '❌', premium: '✅', premiumPlus: '✅' },
                      { feature: 'Custom Alerts', free: '❌', premium: '✅', premiumPlus: '✅' },
                      { feature: 'Data Export', free: '❌', premium: 'CSV/Excel', premiumPlus: 'Full API' },
                      { feature: 'Historical Data', free: '1 Year', premium: '5 Years', premiumPlus: '20+ Years' },
                      { feature: 'Support', free: 'Email', premium: 'Priority', premiumPlus: '24/7' },
                      { feature: 'API Access', free: '❌', premium: '❌', premiumPlus: '✅' },
                      { feature: 'Team Features', free: '❌', premium: '❌', premiumPlus: '✅' },
                      { feature: 'White-label', free: '❌', premium: '❌', premiumPlus: '✅' }
                    ].map((row, index) => (
                      <tr key={index} className="border-b border-gray-200 dark:border-binance-gray hover:bg-gray-50 dark:hover:bg-binance-gray transition-colors">
                        <td className="p-4 text-gray-900 dark:text-white font-medium">{row.feature}</td>
                        <td className="p-4 text-center text-gray-700 dark:text-binance-text">{row.free}</td>
                        <td className="p-4 text-center text-gray-700 dark:text-binance-text">{row.premium}</td>
                        <td className="p-4 text-center text-gray-700 dark:text-binance-text">{row.premiumPlus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white text-center mb-8">
              Frequently Asked Questions
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {[
                {
                  question: "Can I upgrade or downgrade my plan anytime?",
                  answer: "Yes, you can change your plan at any time. Upgrades take effect immediately, while downgrades take effect at the next billing cycle."
                },
                {
                  question: "What payment methods do you accept?",
                  answer: "We accept all major credit cards, PayPal, and bank transfers for annual plans. All payments are processed securely through Stripe."
                },
                {
                  question: "Is there a free trial for paid plans?",
                  answer: "Yes! We offer a 14-day free trial for both Premium and Premium Plus plans. No credit card required to start."
                },
                {
                  question: "What happens to my data if I cancel?",
                  answer: "Your data remains accessible for 30 days after cancellation. You can export all your data during this period."
                },
                {
                  question: "Do you offer refunds?",
                  answer: "We offer a 30-day money-back guarantee for all paid plans. If you're not satisfied, contact our support team."
                },
                {
                  question: "Can I use the API with the Free plan?",
                  answer: "API access is only available with the Premium Plus plan. The Free and Premium plans focus on the web interface."
                }
              ].map((faq, index) => (
                <div key={index} className="bg-white dark:bg-binance-gray-light border border-gray-200 dark:border-binance-gray rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{faq.question}</h3>
                  <p className="text-gray-600 dark:text-binance-text-secondary">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-16 text-center">
            <div className="bg-gradient-to-r from-binance-yellow/20 to-binance-yellow-dark/20 dark:from-binance-yellow/10 dark:to-binance-yellow-dark/10 rounded-2xl p-8 border border-binance-yellow/20">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Ready to Start Trading Smarter?
              </h2>
              <p className="text-xl text-gray-600 dark:text-binance-text-secondary mb-6">
                Join thousands of traders who trust StockSeer.AI for their investment decisions
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => handlePlanSelect('premium')}
                  className="bg-binance-yellow hover:bg-binance-yellow-dark text-binance-gray-dark px-8 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105 shadow-lg"
                >
                  Start Free Trial
                </button>
                <Link
                  to="/dashboard"
                  className="border-2 border-gray-300 dark:border-binance-gray text-gray-700 dark:text-binance-text px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-binance-gray transition-colors"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        plan={selectedPlanForPayment}
        isAnnual={isAnnual}
      />
    </div>
  );
}
