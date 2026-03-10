import React from 'react';
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useContactForm } from '../hooks/useContactForm';

interface ContactFormProps {
  className?: string;
}

const ContactForm: React.FC<ContactFormProps> = ({ className = '' }) => {
  const {
    formData,
    errors,
    isSubmitting,
    submitResponse,
    updateField,
    submitForm,
    clearResponse
  } = useContactForm();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitForm();
  };

  const subjectOptions = [
    { value: '', label: 'Select a subject' },
    { value: 'general', label: 'General Inquiry' },
    { value: 'technical', label: 'Technical Support' },
    { value: 'billing', label: 'Billing Question' },
    { value: 'feature', label: 'Feature Request' },
    { value: 'bug', label: 'Bug Report' },
    { value: 'partnership', label: 'Partnership' }
  ];

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-200 dark:border-gray-800 ${className}`}>
      <div className="mb-6 sm:mb-8">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Send us a Message
        </h3>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Fill out the form below and we'll get back to you as soon as possible.
        </p>
      </div>

      {/* Success/Error Messages */}
      {submitResponse && (
        <div className={`mb-6 p-4 rounded-xl flex items-start space-x-3 ${
          submitResponse.success 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        }`}>
          {submitResponse.success ? (
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className={`text-sm font-medium ${
              submitResponse.success 
                ? 'text-green-800 dark:text-green-200' 
                : 'text-red-800 dark:text-red-200'
            }`}>
              {submitResponse.message}
            </p>
            {submitResponse.success && submitResponse.id && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Reference ID: {submitResponse.id}
              </p>
            )}
          </div>
          <button
            onClick={clearResponse}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            ×
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Full Name */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
              placeholder="Enter your full name"
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-binance-yellow focus:border-transparent transition-all duration-200 placeholder-gray-500 dark:placeholder-gray-400 text-sm sm:text-base ${
                errors.fullName 
                  ? 'border-red-300 dark:border-red-600 focus:ring-red-500' 
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              disabled={isSubmitting}
            />
            {errors.fullName && (
              <p className="text-xs text-red-600 dark:text-red-400">{errors.fullName}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="Enter your email"
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-binance-yellow focus:border-transparent transition-all duration-200 placeholder-gray-500 dark:placeholder-gray-400 text-sm sm:text-base ${
                errors.email 
                  ? 'border-red-300 dark:border-red-600 focus:ring-red-500' 
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="text-xs text-red-600 dark:text-red-400">{errors.email}</p>
            )}
          </div>
        </div>

        {/* Subject */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Subject
          </label>
          <select
            value={formData.subject}
            onChange={(e) => updateField('subject', e.target.value)}
            className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-binance-yellow focus:border-transparent transition-all duration-200 text-sm sm:text-base ${
              errors.subject 
                ? 'border-red-300 dark:border-red-600 focus:ring-red-500' 
                : 'border-gray-300 dark:border-gray-600'
            }`}
            disabled={isSubmitting}
          >
            {subjectOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.subject && (
            <p className="text-xs text-red-600 dark:text-red-400">{errors.subject}</p>
          )}
        </div>

        {/* Message */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Message *
          </label>
          <textarea
            rows={4}
            value={formData.message}
            onChange={(e) => updateField('message', e.target.value)}
            placeholder="Tell us how we can help you..."
            className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-binance-yellow focus:border-transparent resize-none transition-all duration-200 placeholder-gray-500 dark:placeholder-gray-400 text-sm sm:text-base ${
              errors.message 
                ? 'border-red-300 dark:border-red-600 focus:ring-red-500' 
                : 'border-gray-300 dark:border-gray-600'
            }`}
            disabled={isSubmitting}
          />
          {errors.message && (
            <p className="text-xs text-red-600 dark:text-red-400">{errors.message}</p>
          )}
        </div>

        {/* Newsletter Checkbox */}
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="newsletter"
            checked={formData.newsletter}
            onChange={(e) => updateField('newsletter', e.target.checked)}
            className="mt-1 w-4 h-4 text-binance-yellow bg-gray-100 border-gray-300 rounded focus:ring-binance-yellow focus:ring-2"
            disabled={isSubmitting}
          />
          <label htmlFor="newsletter" className="text-sm text-gray-600 dark:text-gray-400">
            I'd like to receive updates about new features and market insights
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-binance-yellow to-binance-yellow-dark hover:from-binance-yellow-dark hover:to-binance-yellow text-black font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-binance-yellow focus:ring-offset-2 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <span className="flex items-center justify-center">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                Sending Message...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Send Message
              </>
            )}
          </span>
        </button>
      </form>
    </div>
  );
};

export default ContactForm;
