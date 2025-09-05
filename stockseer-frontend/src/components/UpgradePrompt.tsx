import { Crown, ArrowRight } from 'lucide-react';
import { useSubscription } from '../contexts/SubscriptionContext';

interface UpgradePromptProps {
  feature: string;
  requiredPlan: 'premium' | 'premium-plus';
  onUpgrade?: () => void;
  className?: string;
}

export default function UpgradePrompt({ 
  feature, 
  requiredPlan, 
  onUpgrade,
  className = '' 
}: UpgradePromptProps) {
  const { currentPlan, setCurrentPlan } = useSubscription();

  const getPlanInfo = (plan: 'premium' | 'premium-plus') => {
    switch (plan) {
      case 'premium':
        return {
          name: 'Premium',
          color: 'purple',
          price: '$29/month',
          features: ['20+ global markets', 'Advanced AI predictions', 'Portfolio tracking']
        };
      case 'premium-plus':
        return {
          name: 'Premium Plus',
          color: 'amber',
          price: '$59/month',
          features: ['50+ global markets', 'ML-powered AI', 'API access', 'Team features']
        };
    }
  };

  const planInfo = getPlanInfo(requiredPlan);
  const isCurrentPlanSufficient = 
    (requiredPlan === 'premium' && currentPlan !== 'free') ||
    (requiredPlan === 'premium-plus' && currentPlan === 'premium-plus');

  if (isCurrentPlanSufficient) {
    return null;
  }

  const handleUpgrade = () => {
    setCurrentPlan(requiredPlan);
    onUpgrade?.();
  };

  return (
    <div className={`bg-slate-800/50 border border-slate-700 rounded-lg p-6 text-center ${className}`}>
      <div className="flex items-center justify-center mb-4">
        <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${
          planInfo.color === 'purple' 
            ? 'from-purple-500 to-purple-600' 
            : 'from-amber-500 to-orange-600'
        } flex items-center justify-center`}>
          <Crown className="w-8 h-8 text-white" />
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-white mb-2">
        {feature} requires {planInfo.name}
      </h3>
      
      <p className="text-slate-400 mb-4">
        Upgrade to {planInfo.name} to unlock this feature and many more
      </p>
      
      <div className="space-y-2 mb-6">
        {planInfo.features.map((feature, index) => (
          <div key={index} className="flex items-center justify-center space-x-2 text-slate-300">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
            <span className="text-sm">{feature}</span>
          </div>
        ))}
      </div>
      
      <div className="space-y-3">
        <div className="text-2xl font-bold text-white">
          {planInfo.price}
        </div>
        
        <button
          onClick={handleUpgrade}
          className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 bg-gradient-to-r ${
            planInfo.color === 'purple'
              ? 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
              : 'from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700'
          } text-white hover:opacity-90 flex items-center justify-center space-x-2`}
        >
          <span>Upgrade to {planInfo.name}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
        
        <p className="text-xs text-slate-500">
          14-day free trial • Cancel anytime
        </p>
      </div>
    </div>
  );
}

// Hook for checking if a feature is available
export const useFeatureAccess = () => {
  const { currentPlan } = useSubscription();
  
  return {
    canAccessPremium: currentPlan !== 'free',
    canAccessPremiumPlus: currentPlan === 'premium-plus',
    currentPlan
  };
};
