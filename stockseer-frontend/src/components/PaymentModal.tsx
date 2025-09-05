import { useState } from 'react';
import { X, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { useSubscription } from '../contexts/SubscriptionContext';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: 'premium' | 'premiumPlus';
  isAnnual: boolean;
}

export default function PaymentModal({ isOpen, onClose, plan, isAnnual }: PaymentModalProps) {
  const { setCurrentPlan } = useSubscription();
  const [step, setStep] = useState<'form' | 'processing' | 'success' | 'error'>('form');
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    name: '',
    email: ''
  });

  if (!isOpen) return null;

  // Normalize plan parameter (convert camelCase to kebab-case for planInfo lookup)
  const normalizedPlan = plan === 'premiumPlus' ? 'premium-plus' : plan;
  
  // Validate plan parameter
  if (!plan || !['premium', 'premiumPlus'].includes(plan)) {
    console.error('Invalid plan provided to PaymentModal:', plan);
    return null;
  }

  // Debug logging
  console.log('PaymentModal props:', { isOpen, plan, isAnnual });

  const planInfo = {
    premium: {
      name: 'Premium',
      price: isAnnual ? 290 : 29,
      period: isAnnual ? 'year' : 'month'
    },
    'premium-plus': {
      name: 'Premium Plus',
      price: isAnnual ? 590 : 59,
      period: isAnnual ? 'year' : 'month'
    }
  };

  const currentPlan = planInfo[normalizedPlan] || planInfo.premium; // Fallback to premium if plan is undefined

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('processing');
    
    // Simulate payment processing
    setTimeout(() => {
      // Simulate success (in real app, this would be actual payment processing)
      setStep('success');
      setCurrentPlan(normalizedPlan as 'premium' | 'premium-plus');
      
      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
        setStep('form');
      }, 2000);
    }, 2000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const formatCardNumber = (value: string) => {
    return value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiryDate = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-binance-gray-light rounded-2xl max-w-2xl w-full max-h-[95vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-binance-gray">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {step === 'form' && `Subscribe to ${currentPlan?.name || 'Premium'}`}
            {step === 'processing' && 'Processing Payment...'}
            {step === 'success' && 'Payment Successful!'}
            {step === 'error' && 'Payment Failed'}
          </h2>
          {step === 'form' && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-binance-gray rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'form' && (
            <>
              {/* Plan Summary */}
              <div className="bg-gray-50 dark:bg-binance-gray rounded-2xl p-6 mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{currentPlan?.name || 'Premium'}</h3>
                    <p className="text-gray-600 dark:text-binance-text-secondary">
                      {isAnnual ? 'Annual billing' : 'Monthly billing'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      ${currentPlan?.price || 29}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 text-sm">
                      /{currentPlan?.period || 'month'}
                    </div>
                  </div>
                </div>
                {isAnnual && (
                  <div className="mt-3 text-green-600 dark:text-green-400 text-sm font-semibold">
                    Save ${((currentPlan?.price || 29) * 12) - (isAnnual ? (currentPlan?.price || 29) : 0)}/year
                  </div>
                )}
              </div>

              {/* Payment Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Card Number
                  </label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={(e) => {
                      const formatted = formatCardNumber(e.target.value);
                      setFormData(prev => ({ ...prev, cardNumber: formatted }));
                    }}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className="w-full bg-white dark:bg-binance-gray border border-gray-300 dark:border-binance-gray-light rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-binance-yellow focus:border-binance-yellow"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      name="expiryDate"
                      value={formData.expiryDate}
                      onChange={(e) => {
                        const formatted = formatExpiryDate(e.target.value);
                        setFormData(prev => ({ ...prev, expiryDate: formatted }));
                      }}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full bg-white dark:bg-binance-gray border border-gray-300 dark:border-binance-gray-light rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-binance-yellow focus:border-binance-yellow"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      CVV
                    </label>
                    <input
                      type="text"
                      name="cvv"
                      value={formData.cvv}
                      onChange={handleInputChange}
                      placeholder="123"
                      maxLength={4}
                      className="w-full bg-white dark:bg-binance-gray border border-gray-300 dark:border-binance-gray-light rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-binance-yellow focus:border-binance-yellow"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className="w-full bg-white dark:bg-binance-gray border border-gray-300 dark:border-binance-gray-light rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-binance-yellow focus:border-binance-yellow"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                    className="w-full bg-white dark:bg-binance-gray border border-gray-300 dark:border-binance-gray-light rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-binance-yellow focus:border-binance-yellow"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-binance-yellow hover:bg-binance-yellow-dark text-binance-gray-dark font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 hover:scale-105 shadow-lg"
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Subscribe for ${currentPlan?.price || 29}/{currentPlan?.period || 'month'}</span>
                </button>
              </form>

              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-6">
                🔒 Your payment information is secure and encrypted
              </p>
            </>
          )}

          {step === 'processing' && (
            <div className="text-center py-12">
              <div className="animate-spin w-16 h-16 border-4 border-binance-yellow border-t-transparent rounded-full mx-auto mb-6"></div>
              <p className="text-gray-900 dark:text-white text-xl font-semibold">Processing your payment...</p>
              <p className="text-gray-600 dark:text-binance-text-secondary text-sm mt-2">Please don't close this window</p>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-12">
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Welcome to {currentPlan?.name || 'Premium'}!</h3>
              <p className="text-gray-600 dark:text-binance-text-secondary text-lg">
                Your subscription is now active. You can access all premium features.
              </p>
            </div>
          )}

          {step === 'error' && (
            <div className="text-center py-12">
              <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Payment Failed</h3>
              <p className="text-gray-600 dark:text-binance-text-secondary mb-6 text-lg">
                There was an issue processing your payment. Please try again.
              </p>
              <button
                onClick={() => setStep('form')}
                className="bg-binance-yellow hover:bg-binance-yellow-dark text-binance-gray-dark px-8 py-3 rounded-lg transition-all duration-200 hover:scale-105 shadow-lg font-semibold"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
