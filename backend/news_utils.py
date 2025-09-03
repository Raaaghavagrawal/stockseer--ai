import os
import requests
from bs4 import BeautifulSoup
import feedparser
from datetime import datetime, timedelta
from urllib.parse import quote_plus
import yfinance as yf
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

def get_stock_news_from_newsapi(ticker_symbol_or_company_name, api_key=None):
    """Get stock news from NewsAPI with enhanced functionality (similar to main app.py)"""
    news_items, error_message = [], None
    if not api_key:
        api_key = os.getenv("NEWS_API_KEY")
    
    if not api_key: 
        return news_items, "NEWS_API_KEY not configured."
    
    query_term = ticker_symbol_or_company_name
    try:
        stock_info_temp = yf.Ticker(ticker_symbol_or_company_name).info
        if stock_info_temp and stock_info_temp.get('shortName'):
            company_name_for_search = stock_info_temp['shortName'].replace(" Inc.", "").replace(" Corp.", "").replace(" Ltd.", "")
            if len(company_name_for_search) > 3: 
                query_term = company_name_for_search
    except: 
        pass
    
    to_date, from_date = datetime.now().strftime('%Y-%m-%d'), (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
    url = f"https://newsapi.org/v2/everything?q={query_term}&from={from_date}&to={to_date}&language=en&sortBy=relevancy&pageSize=15&apiKey={api_key}"
    
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        articles_data = response.json().get("articles", [])
        if not articles_data: 
            error_message = f"No recent news for '{query_term}' via NewsAPI."
        else:
            for item in articles_data:
                publish_time_readable = datetime.strptime(item['publishedAt'], '%Y-%m-%dT%H:%M:%SZ').strftime('%Y-%m-%d %H:%M') if item.get('publishedAt') else "N/A"
                # Enhanced image URL handling
                image_url = item.get('urlToImage')
                if not image_url or not image_url.startswith('http'):
                    # Try to get image from article URL
                    try:
                        article_response = requests.get(item.get('url', ''), timeout=5)
                        if article_response.status_code == 200:
                            soup = BeautifulSoup(article_response.text, 'html.parser')
                            # Try to find the first valid image
                            for img in soup.find_all('img'):
                                if img.get('src') and img['src'].startswith('http'):
                                    image_url = img['src']
                                    break
                    except:
                        pass
                
                news_items.append({
                    'title': item.get('title', 'N/A'), 
                    'description': item.get('description'), 
                    'url': item.get('url', '#'), 
                    'publishedAt': publish_time_readable, 
                    'source': item.get('source', {}).get('name', 'N/A'), 
                    'publisher': item.get('source', {}).get('name', 'N/A'),
                    'source_api': 'NewsAPI',
                    'image_url': image_url
                })
            news_items = news_items[:5] 
    except requests.exceptions.RequestException as e:
        error_message = f"NewsAPI Error for '{query_term}': {str(e)}"
        if hasattr(e, 'response') and e.response is not None:
            if e.response.status_code == 401: 
                error_message += " (Invalid Key?)"
            elif e.response.status_code == 429: 
                error_message += " (Rate Limit?)"
    except Exception as e: 
        error_message = f"NewsAPI Unexpected Error for '{query_term}': {str(e)}"
    
    return news_items, error_message

def scrape_google_news(query_term):
    """Scrape Google News for stock-related articles (enhanced version from main app.py)"""
    news_items, error_message = [], None
    safe_query = quote_plus(query_term + " stock news")
    search_url = f"https://news.google.com/search?q={safe_query}&hl=en-US&gl=US&ceid=US%3Aen"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"}
    
    try:
        response = requests.get(search_url, headers=headers, timeout=8)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        articles_tags = soup.find_all('article', limit=15)
        processed_urls = set()
        
        for article_tag in articles_tags:
            link_tag = article_tag.find('a', href=True)
            if link_tag and link_tag['href'].startswith('./articles/'):
                title_text = (link_tag.get_text(strip=True) or 
                            (article_tag.find(['h3', 'h4']) and article_tag.find(['h3', 'h4']).get_text(strip=True)) or 
                            article_tag.get_text(separator=' ', strip=True).split(' temporally ')[0])
                full_link = "https://news.google.com" + link_tag['href'][1:]
                
                # Try to get image from article
                image_url = None
                try:
                    article_response = requests.get(full_link, headers=headers, timeout=5)
                    if article_response.status_code == 200:
                        article_soup = BeautifulSoup(article_response.text, 'html.parser')
                        # Try to find the first valid image
                        for img in article_soup.find_all('img'):
                            if img.get('src') and img['src'].startswith('http'):
                                image_url = img['src']
                                break
                except:
                    pass
                
                if full_link not in processed_urls and len(title_text) > 15:
                    news_items.append({
                        'title': title_text, 
                        'url': full_link, 
                        'source': 'Google News (Scraped)', 
                        'publisher': 'Google News Aggregated',
                        'publishedAt': datetime.now().strftime('%Y-%m-%d %H:%M'),
                        'image_url': image_url
                    })
                    processed_urls.add(full_link)
            if len(news_items) >= 7: 
                break
                
        if not news_items: 
            potential_links = soup.find_all('a', href=lambda href: href and href.startswith('./articles/'), limit=50)
            for link_tag in potential_links:
                title_text = (link_tag.get_text(strip=True) or 
                            (link_tag.find(['h3','h4','div'], recursive=False) and link_tag.find(['h3','h4','div'], recursive=False).get_text(strip=True)) or 
                            (link_tag.img and link_tag.img.get('alt')))
                full_link = "https://news.google.com" + link_tag['href'][1:]
                
                # Try to get image from article
                image_url = None
                try:
                    article_response = requests.get(full_link, headers=headers, timeout=5)
                    if article_response.status_code == 200:
                        article_soup = BeautifulSoup(article_response.text, 'html.parser')
                        # Try to find the first valid image
                        for img in article_soup.find_all('img'):
                            if img.get('src') and img['src'].startswith('http'):
                                image_url = img['src']
                                break
                except:
                    pass
                
                if (full_link not in processed_urls and title_text and len(title_text) > 20 and 
                    (query_term.split()[0].lower() in title_text.lower() or query_term.lower() in title_text.lower())):
                    news_items.append({
                        'title': title_text, 
                        'url': full_link, 
                        'source': 'Google News (Scraped)', 
                        'publisher': 'Google News Aggregated',
                        'publishedAt': datetime.now().strftime('%Y-%m-%d %H:%M'),
                        'image_url': image_url
                    })
                    processed_urls.add(full_link)
                if len(news_items) >= 7: 
                    break 
                    
        if not news_items: 
            error_message = f"Google News: No articles for '{query_term}'."
    except requests.exceptions.Timeout: 
        error_message = f"Google News: Timeout for '{query_term}'."
    except requests.exceptions.RequestException as e: 
        error_message = f"Google News Error for '{query_term}': {str(e)}"
    except Exception as e: 
        error_message = f"Google News Unexpected Error for '{query_term}': {str(e)}"
    
    return news_items[:5], error_message

def scrape_yahoo_finance_news(ticker_symbol):
    """Scrape Yahoo Finance news for a specific ticker (enhanced version from main app.py)"""
    news_items, error_message = [], None
    search_url = f"https://finance.yahoo.com/quote/{ticker_symbol}/news"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"}
    
    try:
        response = requests.get(search_url, headers=headers, timeout=8)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        article_containers = soup.find_all('li', class_=lambda x: x and 'stream-item' in x.lower(), limit=15)
        if not article_containers: 
            article_containers = soup.select('div.Cf div.js-stream-content > div', limit=15)
        processed_urls = set()
        
        for item_container in article_containers:
            link_tag, title_tag = item_container.find('a', href=True), item_container.find(['h3', 'h2'])
            if link_tag and title_tag and link_tag['href']:
                raw_link, title_text, full_link = link_tag['href'], title_tag.get_text(strip=True), ""
                if raw_link.startswith('/news/'): 
                    full_link = "https://finance.yahoo.com" + raw_link
                elif raw_link.startswith('https://finance.yahoo.com/news/'): 
                    full_link = raw_link
                elif raw_link.startswith(('http://', 'https://')) and 'yahoo.com' in raw_link: 
                    full_link = raw_link
                else: 
                    continue
                
                # Try to get image from article
                image_url = None
                try:
                    article_response = requests.get(full_link, headers=headers, timeout=5)
                    if article_response.status_code == 200:
                        article_soup = BeautifulSoup(article_response.text, 'html.parser')
                        # Try to find the first valid image
                        for img in article_soup.find_all('img'):
                            if img.get('src') and img['src'].startswith('http'):
                                image_url = img['src']
                                break
                except:
                    pass
                
                if full_link not in processed_urls and title_text and len(title_text) > 20:
                    news_items.append({
                        'title': title_text, 
                        'url': full_link, 
                        'source': 'Yahoo Finance (Scraped)', 
                        'publisher': 'Yahoo Finance',
                        'publishedAt': datetime.now().strftime('%Y-%m-%d %H:%M'),
                        'image_url': image_url
                    })
                    processed_urls.add(full_link)
                if len(news_items) >= 10: 
                    break
                    
        if not news_items:
            # Fallback to RSS feed
            try:
                feed_url = f"https://feeds.finance.yahoo.com/rss/2.0/headline?s={ticker_symbol}&region=US&lang=en-US"
                feed = feedparser.parse(feed_url)
                
                if not feed.bozo:
                    for entry in feed.entries[:10]:
                        news_items.append({
                            'title': entry.get('title', 'No title'),
                            'description': entry.get('description', 'No description'),
                            'url': entry.get('link', ''),
                            'source': 'Yahoo Finance (RSS)',
                            'publisher': 'Yahoo Finance',
                            'publishedAt': datetime.now().strftime('%Y-%m-%d %H:%M')
                        })
            except:
                pass
                
        if not news_items:
            error_message = f"Yahoo Finance: No articles for '{ticker_symbol}'."
    except requests.exceptions.Timeout: 
        error_message = f"Yahoo Finance: Timeout for '{ticker_symbol}'."
    except requests.exceptions.RequestException as e: 
        error_message = f"Yahoo Finance Error for '{ticker_symbol}': {str(e)}"
    except Exception as e: 
        error_message = f"Yahoo Finance Unexpected Error for '{ticker_symbol}': {str(e)}"
    
    return news_items[:5], error_message

def analyze_news_item_sentiment_vader(text):
    """Analyze sentiment of news text using VADER"""
    try:
        analyzer = SentimentIntensityAnalyzer()
        scores = analyzer.polarity_scores(text)
        
        # Determine sentiment label
        if scores['compound'] >= 0.05:
            sentiment = 'positive'
        elif scores['compound'] <= -0.05:
            sentiment = 'negative'
        else:
            sentiment = 'neutral'
            
        return {
            'sentiment': sentiment,
            'compound': scores['compound'],
            'positive': scores['pos'],
            'negative': scores['neg'],
            'neutral': scores['neu']
        }
    except Exception as e:
        return {
            'sentiment': 'neutral',
            'compound': 0.0,
            'positive': 0.0,
            'negative': 0.0,
            'neutral': 1.0
        }

def add_sentiment_to_news_items(news_items):
    """Add sentiment analysis to news items"""
    for item in news_items:
        # Combine title and description for sentiment analysis
        text_for_sentiment = f"{item.get('title', '')} {item.get('description', '')}"
        sentiment_data = analyze_news_item_sentiment_vader(text_for_sentiment)
        item['sentiment'] = sentiment_data['sentiment']
        item['sentiment_score'] = sentiment_data['compound']
        item['vader_sentiment'] = sentiment_data
    
    return news_items
