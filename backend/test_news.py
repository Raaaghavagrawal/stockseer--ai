#!/usr/bin/env python3
"""Test script to debug news functionality"""

import sys
import os
sys.path.append('.')

def test_news_function():
    """Test the news function directly"""
    try:
        from app import get_stock_news
        print("✓ Successfully imported get_stock_news")
        
        # Test with a simple stock
        print("Testing news fetch for AAPL...")
        news = get_stock_news('AAPL', 3)
        print(f"✓ Got {len(news)} news items")
        
        if news:
            print("First article:")
            print(f"  Title: {news[0].get('title', 'No title')}")
            print(f"  Source: {news[0].get('source', 'No source')}")
            print(f"  Sentiment: {news[0].get('sentiment', 'No sentiment')}")
        else:
            print("No news items returned")
            
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()

def test_news_utils():
    """Test news utils functions"""
    try:
        from news_utils import get_stock_news_from_newsapi, scrape_google_news, scrape_yahoo_finance_news
        print("✓ Successfully imported news_utils functions")
        
        # Test NewsAPI
        print("Testing NewsAPI...")
        news_api, error = get_stock_news_from_newsapi('AAPL')
        print(f"NewsAPI: {len(news_api)} articles, error: {error}")
        
        # Test Google News
        print("Testing Google News...")
        google_news, error = scrape_google_news('AAPL')
        print(f"Google News: {len(google_news)} articles, error: {error}")
        
        # Test Yahoo Finance
        print("Testing Yahoo Finance...")
        yahoo_news, error = scrape_yahoo_finance_news('AAPL')
        print(f"Yahoo Finance: {len(yahoo_news)} articles, error: {error}")
        
    except Exception as e:
        print(f"✗ Error in news_utils: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("=== Testing News Functionality ===")
    test_news_utils()
    print("\n=== Testing Main News Function ===")
    test_news_function()
