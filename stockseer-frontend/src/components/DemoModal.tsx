import React, { useState, useEffect } from 'react';
import { SkipBack, X, ChevronRight, ChevronLeft, Sparkles, TrendingUp, BarChart3, Brain, Shield, Zap } from 'lucide-react';

interface DemoStep {
  id: string;
  title: string;
  description: string;
  action: string;
  highlight?: string;
  duration?: number;
  icon?: React.ReactNode;
  color?: string;
  features?: string[];
  animation?: string;
}

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DemoModal: React.FC<DemoModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isCompleting, setIsCompleting] = useState(false);

  const demoSteps: DemoStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to StockSeer AI',
      description: 'Experience AI-powered stock analysis with real-time data, predictive analytics, and intelligent insights.',
      action: 'Explore cutting-edge features that make StockSeer the ultimate investment companion.',
      icon: <Sparkles className="w-6 h-6" />,
      color: 'from-purple-500 to-pink-500',
      features: ['AI Analysis', 'Real-time Data', 'Predictive Insights', 'Smart Alerts'],
      animation: 'fadeInUp',
      duration: 5000
    },
    {
      id: 'search',
      title: 'Intelligent Stock Discovery',
      description: 'AI-powered search that understands natural language queries and finds perfect stocks instantly.',
      action: 'Try "tech giants" or "dividend stocks" - our AI understands!',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'from-blue-500 to-cyan-500',
      features: ['Natural Language', 'Global Markets', 'Instant Results', 'Smart Suggestions'],
      animation: 'slideInLeft',
      highlight: 'search-bar',
      duration: 6000
    },
    {
      id: 'overview',
      title: 'AI-Enhanced Dashboard',
      description: 'Comprehensive stock view with AI insights, real-time charts, and predictive indicators.',
      action: 'Watch AI highlight key trends and opportunities in real-time.',
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-500',
      features: ['Real-time Charts', 'AI Insights', 'Predictive Data', 'Smart Interface'],
      animation: 'zoomIn',
      highlight: 'overview-tab',
      duration: 7000
    },
    {
      id: 'financials',
      title: 'Deep Financial Intelligence',
      description: 'AI analyzes complex financial data to provide clear, actionable investment insights.',
      action: 'See how AI transforms financial data into intelligence.',
      icon: <Brain className="w-6 h-6" />,
      color: 'from-orange-500 to-red-500',
      features: ['AI Analysis', 'Financial Ratios', 'Trend Detection', 'Risk Assessment'],
      animation: 'fadeInRight',
      highlight: 'financials-tab',
      duration: 6000
    },
    {
      id: 'news',
      title: 'Sentiment Analysis Engine',
      description: 'AI processes millions of news articles and social media to gauge market sentiment.',
      action: 'Watch AI analyze sentiment and predict market impact.',
      icon: <Zap className="w-6 h-6" />,
      color: 'from-yellow-500 to-orange-500',
      features: ['Sentiment Analysis', 'News Impact', 'Social Monitoring', 'Trend Detection'],
      animation: 'bounceIn',
      highlight: 'news-tab',
      duration: 6000
    },
    {
      id: 'performance',
      title: 'Predictive Performance Analytics',
      description: 'AI-powered performance predictions based on patterns and market conditions.',
      action: 'Discover how AI predicts future performance.',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'from-indigo-500 to-purple-500',
      features: ['Performance Prediction', 'Risk Modeling', 'Pattern Recognition', 'Forecasting'],
      animation: 'slideInUp',
      highlight: 'performance-tab',
      duration: 7000
    },
    {
      id: 'ai-features',
      title: 'Advanced AI Capabilities',
      description: 'Full AI system with risk assessment, portfolio optimization, and personalized recommendations.',
      action: 'See how AI creates personalized strategies for you.',
      icon: <Brain className="w-6 h-6" />,
      color: 'from-pink-500 to-rose-500',
      features: ['Portfolio Optimization', 'Risk Assessment', 'Personalized AI', 'Goal Tracking'],
      animation: 'pulse',
      highlight: 'ai-tab',
      duration: 6000
    },
    {
      id: 'watchlist',
      title: 'Smart Portfolio Management',
      description: 'AI manages your watchlist with intelligent alerts and performance tracking.',
      action: 'Set up AI-powered alerts that adapt to your style.',
      icon: <Shield className="w-6 h-6" />,
      color: 'from-teal-500 to-blue-500',
      features: ['Smart Alerts', 'Auto Rebalancing', 'Performance Tracking', 'Learning AI'],
      animation: 'fadeInLeft',
      highlight: 'watchlist-tab',
      duration: 6000
    },
    {
      id: 'market-screener',
      title: 'AI-Powered Stock Discovery',
      description: 'AI screener analyzes thousands of stocks to find perfect investment opportunities.',
      action: 'Watch AI screen stocks to find your matches.',
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'from-violet-500 to-purple-500',
      features: ['AI Screening', 'Pattern Recognition', 'Opportunity Detection', 'Smart Filters'],
      animation: 'rotateIn',
      highlight: 'screener-tab',
      duration: 6000
    },
    {
      id: 'complete',
      title: 'Your AI Investment Journey Begins',
      description: 'You now have a powerful AI assistant that learns and grows with your investment journey.',
      action: 'Start your AI-powered investment journey today!',
      icon: <Sparkles className="w-6 h-6" />,
      color: 'from-rainbow-500 to-rainbow-600',
      features: ['AI Assistant', 'Continuous Learning', 'Adaptive Intelligence', 'Future-Ready'],
      animation: 'celebrate',
      duration: 5000
    }
  ];

  // Initialize progress to 10% when modal opens
  useEffect(() => {
    if (isOpen) {
      setOverallProgress(10); // Start at 10% for first slide
    }
  }, [isOpen]);

  const handleNext = () => {
    if (currentStep < demoSteps.length - 1) {
      // Mark current step as completed before moving
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      // Update overall progress: 10% for first slide, 20% for second, etc.
      const newProgress = ((nextStep + 1) / demoSteps.length) * 100;
      setOverallProgress(newProgress);
    } else {
      // If we're on the last step, show completion animation and close modal
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setOverallProgress(100);
      setIsCompleting(true);
      
      // Close the modal after showing completion animation
      setTimeout(() => {
        onClose();
        setIsCompleting(false);
      }, 2000);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      // Update overall progress: 10% for first slide, 20% for second, etc.
      const newProgress = ((prevStep + 1) / demoSteps.length) * 100;
      setOverallProgress(newProgress);
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setOverallProgress(10); // Start at 10% for first slide
    setCompletedSteps(new Set());
  };

  const handleStepClick = (stepIndex: number) => {
    // Mark current step as completed before moving
    if (stepIndex > currentStep) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
    }
    setCurrentStep(stepIndex);
    // Update overall progress: 10% for first slide, 20% for second, etc.
    const newProgress = ((stepIndex + 1) / demoSteps.length) * 100;
    setOverallProgress(newProgress);
    
    // If clicking on the last step, mark it as completed and set to 100%
    if (stepIndex === demoSteps.length - 1) {
      setCompletedSteps(prev => new Set([...prev, stepIndex]));
      setOverallProgress(100);
    }
  };

  const currentStepData = demoSteps[currentStep];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-md pt-8 animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-2xl shadow-2xl max-w-[600px] w-full mx-4 max-h-[85vh] overflow-hidden border border-gray-200 dark:border-gray-700 animate-slideInDown">
        {/* Compact Header with gradient background */}
        <div className={`bg-gradient-to-r ${currentStepData.color} p-3 text-white relative overflow-hidden`}>
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-white/20 rounded-md backdrop-blur-sm">
                  {currentStepData.icon}
                </div>
                <div>
                  <h2 className="text-lg font-bold">
                    {currentStepData.title}
                  </h2>
                  <p className="text-white/80 text-xs">
                    Step {currentStep + 1} of {demoSteps.length}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-md bg-white/20 hover:bg-white/30 transition-all duration-300 backdrop-blur-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Animated background elements */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-8 translate-x-8 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-12 h-12 bg-white/5 rounded-full translate-y-6 -translate-x-6 animate-bounce"></div>
        </div>

        <div className="px-4 pb-4 pt-2">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span className="font-medium">AI Demo Progress</span>
              <span className="font-bold text-base">{Math.round(overallProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner">
              <div 
                className={`bg-gradient-to-r ${currentStepData.color} h-3 rounded-full transition-all duration-500 ease-out shadow-lg relative`}
                style={{ width: `${overallProgress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500 mt-1">
              <span>Step {currentStep + 1} of {demoSteps.length}</span>
              <span className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span>AI-Powered Demo</span>
              </span>
            </div>
            {completedSteps.size > 0 && (
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 text-center">
                <span className="bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                  ✅ Completed: {completedSteps.size}/{demoSteps.length} steps
                </span>
              </div>
            )}
          </div>

          {/* Step Content with Animation */}
          <div className="mb-4">
            <div className="animate-fadeInUp">
              <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed mb-4">
                {currentStepData.description}
              </p>
              
              {/* Features List */}
              {currentStepData.features && (
                <div className="grid grid-cols-2 gap-1 mb-4">
                  {currentStepData.features.map((feature, index) => (
                    <div 
                      key={index}
                      className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-md p-2 animate-slideInLeft"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="w-1.5 h-1.5 bg-gradient-to-r from-green-400 to-green-500 rounded-full"></div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Action Callout */}
              <div className={`bg-gradient-to-r ${currentStepData.color} bg-opacity-10 border border-current border-opacity-20 rounded-lg p-3 animate-pulse`}>
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">AI</span>
                  </div>
                  <p className="text-gray-800 dark:text-gray-200 font-medium text-sm">
                    {currentStepData.action}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Controls */}
          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg p-3 -mx-4 -mb-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex items-center space-x-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-md text-sm"
              >
                <ChevronLeft className="w-3 h-3" />
                <span>Previous</span>
              </button>
              
              <button
                onClick={handleRestart}
                className="flex items-center space-x-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 hover:shadow-md text-sm"
              >
                <SkipBack className="w-3 h-3" />
                <span>Restart</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleNext}
                className={`flex items-center space-x-1 px-4 py-2 bg-gradient-to-r ${currentStepData.color} hover:scale-105 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform text-sm`}
              >
                <span>{currentStep === demoSteps.length - 1 ? 'Complete' : 'Next'}</span>
                {currentStep !== demoSteps.length - 1 && <ChevronRight className="w-3 h-3" />}
                {currentStep === demoSteps.length - 1 && <Sparkles className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Enhanced Step Indicators */}
          <div className="flex justify-center space-x-2 mt-4">
            {demoSteps.map((step, index) => (
              <button
                key={index}
                onClick={() => handleStepClick(index)}
                className={`relative w-3 h-3 rounded-full transition-all duration-300 hover:scale-125 ${
                  index === currentStep
                    ? `bg-gradient-to-r ${step.color} scale-125 shadow-lg ring-1 ring-white dark:ring-gray-800`
                    : completedSteps.has(index)
                    ? 'bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 shadow-md'
                    : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                }`}
                title={`Step ${index + 1}: ${step.title}`}
              >
                {completedSteps.has(index) && index !== currentStep && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                  </div>
                )}
                {index === currentStep && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Completion Overlay */}
      {isCompleting && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 text-center shadow-2xl animate-zoomIn">
            <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Demo Complete! 🎉
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You've successfully explored all StockSeer AI features!
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full w-full animate-pulse"></div>
            </div>
          </div>
        </div>
      )}
      
      {/* Custom Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideInDown {
          from { 
            opacity: 0; 
            transform: translateY(-30px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        @keyframes fadeInUp {
          from { 
            opacity: 0; 
            transform: translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        @keyframes slideInLeft {
          from { 
            opacity: 0; 
            transform: translateX(-20px); 
          }
          to { 
            opacity: 1; 
            transform: translateX(0); 
          }
        }
        
        @keyframes slideInRight {
          from { 
            opacity: 0; 
            transform: translateX(20px); 
          }
          to { 
            opacity: 1; 
            transform: translateX(0); 
          }
        }
        
        @keyframes slideInUp {
          from { 
            opacity: 0; 
            transform: translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        @keyframes zoomIn {
          from { 
            opacity: 0; 
            transform: scale(0.9); 
          }
          to { 
            opacity: 1; 
            transform: scale(1); 
          }
        }
        
        @keyframes bounceIn {
          0% { 
            opacity: 0; 
            transform: scale(0.3); 
          }
          50% { 
            opacity: 1; 
            transform: scale(1.05); 
          }
          70% { 
            transform: scale(0.9); 
          }
          100% { 
            opacity: 1; 
            transform: scale(1); 
          }
        }
        
        @keyframes pulse {
          0%, 100% { 
            transform: scale(1); 
          }
          50% { 
            transform: scale(1.05); 
          }
        }
        
        @keyframes rotateIn {
          from { 
            opacity: 0; 
            transform: rotate(-180deg) scale(0.5); 
          }
          to { 
            opacity: 1; 
            transform: rotate(0deg) scale(1); 
          }
        }
        
        @keyframes celebrate {
          0% { 
            opacity: 0; 
            transform: scale(0.5) rotate(-10deg); 
          }
          50% { 
            opacity: 1; 
            transform: scale(1.1) rotate(5deg); 
          }
          100% { 
            opacity: 1; 
            transform: scale(1) rotate(0deg); 
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        
        .animate-slideInDown {
          animation: slideInDown 0.6s ease-out;
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out;
        }
        
        .animate-slideInLeft {
          animation: slideInLeft 0.5s ease-out;
        }
        
        .animate-slideInRight {
          animation: slideInRight 0.5s ease-out;
        }
        
        .animate-slideInUp {
          animation: slideInUp 0.5s ease-out;
        }
        
        .animate-zoomIn {
          animation: zoomIn 0.6s ease-out;
        }
        
        .animate-bounceIn {
          animation: bounceIn 0.8s ease-out;
        }
        
        .animate-pulse {
          animation: pulse 2s infinite;
        }
        
        .animate-rotateIn {
          animation: rotateIn 0.7s ease-out;
        }
        
        .animate-celebrate {
          animation: celebrate 1s ease-out;
        }
      `}</style>
    </div>
  );
};

export default DemoModal;
