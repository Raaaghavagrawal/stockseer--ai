import React, { useState, useEffect, useRef } from 'react';
import { Search, X, TrendingUp, TrendingDown } from 'lucide-react';
import { stockAPI } from '../utils/api';
import { debounce } from '../utils/helpers';

interface SearchResult {
  symbol: string;
  name: string;
  price?: number;
  change?: number;
}

const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounced search function
  const debouncedSearch = debounce(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const searchResults = await stockAPI.searchStocks(searchQuery);
      setResults(searchResults);
      if (searchResults.length === 0) {
        setError('No stocks found. Try a different search term.');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Search failed. Please try again.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, 500); // Increased debounce time to avoid too many API calls

  useEffect(() => {
    debouncedSearch(query);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setQuery(value);
    setShowResults(true);
    setSelectedIndex(-1);
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < results.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleResultSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowResults(false);
      setSelectedIndex(-1);
    }
  };

  const handleResultSelect = (result: SearchResult) => {
    // Navigate to stock detail or update search
    setQuery(result.symbol);
    setShowResults(false);
    setSelectedIndex(-1);
    // You can add navigation logic here
    console.log('Selected:', result);
    
    // For now, let's show an alert with the selected stock
    alert(`Selected: ${result.symbol} - ${result.name}`);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    setSelectedIndex(-1);
    setError(null);
  };

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search stocks..."
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowResults(true)}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (query.length >= 2) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {isLoading && (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2">Searching...</p>
            </div>
          )}
          
          {error && (
            <div className="p-4 text-center text-red-500 dark:text-red-400">
              <p>{error}</p>
            </div>
          )}
          
          {!isLoading && !error && results.length > 0 && (
            <div className="py-2">
              {results.map((result, index) => (
                <div
                  key={result.symbol}
                  onClick={() => handleResultSelect(result)}
                  className={`px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors ${
                    index === selectedIndex ? 'bg-gray-100 dark:bg-dark-700' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {result.symbol}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {result.name}
                      </div>
                    </div>
                    {result.price && (
                      <div className="text-right">
                        <div className="font-medium text-gray-900 dark:text-white">
                          ${result.price.toFixed(2)}
                        </div>
                        {result.change !== undefined && (
                          <div className={`text-sm flex items-center ${
                            result.change >= 0 ? 'text-success-600' : 'text-danger-600'
                          }`}>
                            {result.change >= 0 ? (
                              <TrendingUp className="w-3 h-3 mr-1" />
                            ) : (
                              <TrendingDown className="w-3 h-3 mr-1" />
                            )}
                            {Math.abs(result.change).toFixed(2)}%
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!isLoading && !error && results.length === 0 && query.length >= 2 && (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <p>No stocks found for "{query}"</p>
              <p className="text-sm mt-1">Try searching for a different symbol</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
