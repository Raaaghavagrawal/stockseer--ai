import os
import requests
from bs4 import BeautifulSoup
import feedparser
from datetime import datetime, timedelta

def get_stock_news_from_newsapi(company_name, api_key=None):
    """Get news from NewsAPI."""
    if not api_key:
        api_key = os.getenv('NEWS_API_KEY')
    
    if not api_key:
        return [], "NewsAPI key not found"
        
    try:
        base_url = "https://newsapi.org/v2/everything"
        week_ago = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
        
        params = {
            'q': f'"{company_name}" AND (stock OR shares OR market OR trading)',
            'from': week_ago,
            'sortBy': 'relevancy',
            'language': 'en',
            'apiKey': api_key
        }
        
        response = requests.get(base_url, params=params)
        response.raise_for_status()
        news_data = response.json()
        
        if news_data.get('status') != 'ok':
            return [], f"NewsAPI error: {news_data.get('message', 'Unknown error')}"
            
        articles = news_data.get('articles', [])[:5]  # Get top 5 articles
        return articles, None
        
    except Exception as e:
        return [], f"Error fetching news from NewsAPI: {str(e)}"

def scrape_google_news(company_name):
    """Scrape news from Google News."""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        search_url = f"https://www.google.com/search?q={company_name}+stock+news&tbm=nws"
        response = requests.get(search_url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        news_items = []
        
        for article in soup.select('div.g')[:5]:  # Get top 5 articles
            try:
                title_elem = article.select_one('div.vvjwJb')
                if not title_elem:
                    title_elem = article.select_one('h3')
                    
                title = title_elem.get_text() if title_elem else "No title available"
                
                description_elem = article.select_one('div.VwiC3b')
                description = description_elem.get_text() if description_elem else ""
                
                link_elem = article.select_one('a')
                url = link_elem['href'] if link_elem else ""
                
                if title and description:
                    news_items.append({
                        'title': title,
                        'description': description,
                        'url': url,
                        'source': {'name': 'Google News'}
                    })
            except Exception as e:
                continue
                
        return news_items, None if news_items else "No news found"
        
    except Exception as e:
        return [], f"Error scraping Google News: {str(e)}"

def scrape_yahoo_finance_news(ticker_symbol):
    """Scrape news from Yahoo Finance."""
    try:
        feed_url = f"https://feeds.finance.yahoo.com/rss/2.0/headline?s={ticker_symbol}&region=US&lang=en-US"
        feed = feedparser.parse(feed_url)
        
        if feed.bozo:
            return [], "Invalid RSS feed"
            
        news_items = []
        for entry in feed.entries[:5]:  # Get top 5 articles
            news_items.append({
                'title': entry.get('title', 'No title'),
                'description': entry.get('description', 'No description'),
                'url': entry.get('link', ''),
                'source': {'name': 'Yahoo Finance'}
            })
            
        return news_items, None if news_items else "No news found"
        
    except Exception as e:
        return [], f"Error fetching Yahoo Finance news: {str(e)}"
