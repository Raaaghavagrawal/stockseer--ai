import { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, Search, Loader2 } from 'lucide-react';
import { newsAPI } from '../../utils/api';

interface NewsTabProps {
  selectedStock: string;
}

interface NewsItem {
  title: string;
  summary?: string;
  description?: string;
  url: string;
  link?: string;
  publishedAt: string;
  published?: string;
  source: string;
  publisher?: string;
  sentiment: string;
}

export default function NewsTab({ selectedStock }: NewsTabProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [filteredNews, setFilteredNews] = useState<NewsItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedSentiment, setSelectedSentiment] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchNews = async (retryAttempt: number = 0) => {
    if (!selectedStock) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await newsAPI.getStockNews(selectedStock);
      console.log('News API Response:', response);
      
      // Handle the actual response format from backend: {symbol, news_by_source: {source: [...]}}
      let newsData: any[] = [];
      
      if (response && typeof response === 'object') {
        // Check if it's the expected format with news_by_source
        if ((response as any).news_by_source) {
          // Flatten all news from all sources into a single array
          const newsBySource = (response as any).news_by_source;
          newsData = Object.values(newsBySource).flat() as any[];
        }
        // Check if it's the old format with articles
        else if ((response as any).articles) {
          newsData = (response as any).articles;
        }
        // Check if response is directly an array
        else if (Array.isArray(response)) {
          newsData = response;
        }
      }
      
      // Ensure newsData is an array before mapping
      if (!Array.isArray(newsData)) {
        console.warn('News data is not an array:', newsData);
        newsData = [];
      }
      
      console.log('Processed news data:', newsData);
      
      // Transform the data to match our interface
      const transformedNews = newsData.map((item: any) => ({
        title: item.title || 'No Title',
        summary: item.summary || item.description || 'No summary available',
        url: item.url || item.link || '#',
        publishedAt: item.publishedAt || item.published || new Date().toISOString(),
        source: item.source || item.publisher || 'Unknown Source',
        sentiment: item.sentiment || 'neutral'
      }));
      
      setNews(transformedNews);
      setFilteredNews(transformedNews);
      setRetryCount(0); // Reset retry count on success
    } catch (err: any) {
      console.error('Error fetching news:', err);
      
      // Handle different types of errors
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('Request timed out. The news service is taking longer than expected. Please try again.');
      } else if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        setError('Cannot connect to the server. Please make sure the backend server is running on http://localhost:8000');
      } else if (err.response?.status === 500) {
        setError('Server error occurred while fetching news. Please try again later.');
      } else if (err.response?.status === 404) {
        setError('No news found for this stock symbol.');
      } else if (err.response?.status === 0) {
        setError('Backend server is not running. Please start the backend server first.');
      } else {
        setError(`Failed to fetch news: ${err.message || 'Unknown error'}. Please check your connection and try again.`);
      }
      
      setNews([]);
      setFilteredNews([]);
      
      // Auto-retry for network errors with exponential backoff
      if ((err.code === 'ERR_NETWORK' || err.message?.includes('Network Error') || err.response?.status === 0) && retryAttempt < 3) {
        const delay = Math.pow(2, retryAttempt) * 1000; // 1s, 2s, 4s
        setTimeout(() => {
          setRetryCount(retryAttempt + 1);
          fetchNews(retryAttempt + 1);
        }, delay);
        return; // Don't set loading to false yet
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStock) {
      fetchNews();
    }
  }, [selectedStock]);

  useEffect(() => {
    let filtered = news;
    
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.summary && item.summary.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    if (selectedSource !== 'all') {
      filtered = filtered.filter(item => item.source === selectedSource);
    }
    
    if (selectedSentiment !== 'all') {
      filtered = filtered.filter(item => item.sentiment === selectedSentiment);
    }
    
    setFilteredNews(filtered);
  }, [news, searchQuery, selectedSource, selectedSentiment]);

  if (!selectedStock) {
    return (
      <div className="text-center py-12 text-gray-600 dark:text-gray-400">
        <Newspaper className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p className="text-sm sm:text-base">Search for a stock to view news</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-600 dark:text-gray-400">
        <Loader2 className="w-16 h-16 mx-auto mb-4 opacity-50 animate-spin" />
        <p className="text-sm sm:text-base">Fetching latest news...</p>
        {retryCount > 0 && (
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 mt-2">Retry attempt {retryCount}</p>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-gray-600 dark:text-gray-400">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-6">
          <p className="text-red-600 dark:text-red-400 mb-2 text-sm sm:text-base">Error loading news</p>
          <p className="text-xs sm:text-sm text-red-500 dark:text-red-300">{error}</p>
          <button 
            onClick={() => {
              setRetryCount(0);
              fetchNews(0);
            }}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm transition-colors"
          >
            Try Again {retryCount > 0 && `(${retryCount})`}
          </button>
        </div>
      </div>
    );
  }

  const sources = Array.from(new Set(news.map(item => item.source)));
  const sentimentCounts = {
    positive: news.filter(item => item.sentiment === 'positive').length,
    negative: news.filter(item => item.sentiment === 'negative').length,
    neutral: news.filter(item => item.sentiment === 'neutral').length
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">📰 News & Sentiment</h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Latest news and sentiment analysis for {selectedStock}</p>
      </div>

      {/* Sentiment Overview */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center">
          <div className="text-green-400 text-2xl font-bold">{sentimentCounts.positive}</div>
          <div className="text-slate-400 text-sm">Positive</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center">
          <div className="text-red-400 text-2xl font-bold">{sentimentCounts.negative}</div>
          <div className="text-slate-400 text-sm">Negative</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center">
          <div className="text-slate-400 text-2xl font-bold">{sentimentCounts.neutral}</div>
          <div className="text-slate-400 text-sm">Neutral</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search news..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg"
              />
            </div>
          </div>
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg"
          >
            <option value="all">All Sources</option>
            {sources.map(source => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>
          <select
            value={selectedSentiment}
            onChange={(e) => setSelectedSentiment(e.target.value)}
            className="px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg"
          >
            <option value="all">All Sentiments</option>
            <option value="positive">Positive</option>
            <option value="negative">Negative</option>
            <option value="neutral">Neutral</option>
          </select>
        </div>
      </div>

      {/* News List */}
      <div className="space-y-4">
        {filteredNews.map((item, index) => (
          <div key={index} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    item.sentiment === 'positive' ? 'bg-green-600 text-white' :
                    item.sentiment === 'negative' ? 'bg-red-600 text-white' :
                    'bg-slate-600 text-slate-300'
                  }`}>
                    {item.sentiment}
                  </span>
                  <span className="text-slate-400 text-sm">{item.source}</span>
                  <span className="text-slate-400 text-sm">•</span>
                  <span className="text-slate-400 text-sm">{item.publishedAt}</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-slate-300 mb-3">{item.summary}</p>
              </div>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-4 p-2 text-blue-400 hover:text-blue-300 hover:bg-slate-700 rounded"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {filteredNews.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Newspaper className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No news found matching your criteria</p>
        </div>
      )}
    </div>
  );
}
