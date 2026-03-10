import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, TrendingDown, Target, Clock } from 'lucide-react';
import { predictionsAPI } from '../utils/api';
import type { StockPrediction } from '../types/stock';
import { formatCurrency, getConfidenceLevel } from '../utils/helpers';

const PredictionsPanel: React.FC = () => {
  const [predictions, setPredictions] = useState<StockPrediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const data = await predictionsAPI.getAllPredictions();
      setPredictions(data);
    } catch (error) {
      console.error('Error fetching predictions:', error);
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-blue-500 rounded-xl flex items-center justify-center">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Predictions</h1>
          <p className="text-gray-600 dark:text-gray-400">AI-powered stock price predictions and insights</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {predictions.map((prediction, index) => {
          const confidence = getConfidenceLevel(prediction.confidence);
          return (
            <motion.div
              key={prediction.symbol}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="card hover:shadow-glow transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-blue-500 rounded-xl flex items-center justify-center">
                    <span className="text-lg font-bold text-white">{prediction.symbol}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {prediction.symbol}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {prediction.timeframe} prediction
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary-600">
                    {formatCurrency(prediction.predictedPrice)}
                  </div>
                  <div className={`text-sm font-medium ${confidence.color}`}>
                    {confidence.text} Confidence
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>Generated {new Date(prediction.timestamp).toLocaleDateString()}</span>
                </div>
                
                <div className="p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">AI Reasoning</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{prediction.reasoning}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-dark-600">
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-primary-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Target Price</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-success-500" />
                    <span className="text-sm font-medium text-success-600">
                      {((prediction.confidence * 100) - 50).toFixed(1)}% Upside
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">How AI Predictions Work</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-primary-600" />
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Technical Analysis</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Advanced algorithms analyze price patterns, volume, and technical indicators
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Machine Learning</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Neural networks learn from historical data to identify predictive patterns
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Risk Assessment</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Confidence scores help evaluate prediction reliability and risk factors
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionsPanel;
