import os
import httpx
from bs4 import BeautifulSoup
import feedparser
from datetime import datetime, timedelta
from urllib.parse import quote_plus
import yfinance as yf
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import asyncio
from company_mappings import get_company_name

async def fetch_url_async(url: str, headers: dict = None, timeout: int = 15):
    """Async URL fetcher with robust error handling and browser-like headers."""
    if not headers:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Cache-Control": "max-age=0",
        }
    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
        try:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            return response.text, response.status_code
        except httpx.RequestError as exc:
            print(f"[FETCH ERROR] Request error for {exc.request.url!r}: {exc}")
            return None, None
        except httpx.HTTPStatusError as exc:
            print(f"[FETCH ERROR] Status {exc.response.status_code} for {exc.request.url!r}")
            return None, exc.response.status_code
        except Exception as e:
            print(f"[FETCH ERROR] Unexpected error: {e}")
            return None, None

async def get_stock_news_from_newsapi(ticker_symbol_or_company_name, api_key=None):
    """
    REFACTORED: Now a pure scraping aggregator. 
    Removes dependency on NEWS_API_KEY while preserving the function signature for compatibility.
    """
    ticker = str(ticker_symbol_or_company_name).upper()
    print(f"[NEWS] Aggregate fetch started for: {ticker}")
    
    # 1. Get descriptive company name for search
    company_name = get_company_name(ticker)
    print(f"[NEWS] Using company name for search: {company_name}")
    
    news_items = []
    
    # 2. Determine market region
    is_indian = ticker.endswith('.NS') or ticker.endswith('.BO') or ".NS" in ticker or ".BO" in ticker
    region = 'IN' if is_indian else 'US'
    
    # 3. Create diverse search queries
    # Query A: Pure stock news
    query_stock = f"{company_name} stock news"
    # Query B: Site-specific high-quality financial news
    if is_indian:
        query_sites = f"{company_name} site:moneycontrol.com OR site:economictimes.indiatimes.com OR site:financialexpress.com"
        print("[NEWS] Scraping Indian sources: Moneycontrol, Economic Times...")
    else:
        query_sites = f"{company_name} site:finance.yahoo.com OR site:reuters.com OR site:bloomberg.com"
        print("[NEWS] Scraping Global sources: Yahoo Finance, Reuters...")

    # 4. Fetch concurrently from multiple scrapers
    try:
        tasks = [
            scrape_yahoo_finance_news(ticker),
            scrape_google_news(query_stock, region=region),
            scrape_google_news(query_sites, region=region)
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        processed_urls = set()
        for res in results:
            if isinstance(res, Exception):
                print(f"[NEWS WARNING] Scraper task failed: {res}")
                continue
            
            # results[x] is usually (items, error_message)
            items = res[0] if (isinstance(res, tuple) and len(res) == 2) else res
            if not isinstance(items, list): continue
            
            for item in items:
                url = item.get('url', item.get('link', ''))
                if url and url not in processed_urls:
                    # Ensure normalization
                    news_items.append({
                        'title': item.get('title', 'N/A'),
                        'url': url,
                        'source': item.get('source', item.get('publisher', 'Financial News')),
                        'publisher': item.get('publisher', item.get('source', 'Financial News')),
                        'publishedAt': item.get('publishedAt', datetime.now().strftime('%Y-%m-%d %H:%M')),
                        'description': item.get('description', item.get('title', '')),
                        'image_url': item.get('image_url')
                    })
                    processed_urls.add(url)
                    
    except Exception as e:
        print(f"[NEWS CRITICAL ERROR] Aggregator failed: {e}")

    # 5. Sentiment Analysis
    if news_items:
        print(f"[NEWS] Analyzing sentiment for {len(news_items)} articles...")
        news_items = await add_sentiment_to_news_items(news_items)
    else:
        print(f"[NEWS] No news found for {ticker}")

    # Return structure expected by existing pipeline
    return news_items[:15], None

async def scrape_google_news(query_term, region='US'):
    """Scrapes Google News search results with improved parsing."""
    try:
        news_items, error_message = [], None
        safe_query = quote_plus(query_term)
        
        # Localization parameters
        gl_val = 'IN' if region == 'IN' else 'US'
        hl_val = 'en-IN' if region == 'IN' else 'en-US'
        ceid_val = 'IN:en' if region == 'IN' else 'US:en'
        
        search_url = f"https://news.google.com/search?q={safe_query}&hl={hl_val}&gl={gl_val}&ceid={ceid_val}"
        print(f"[NEWS] Scraping Google News: {query_term}")
        
        html, _ = await fetch_url_async(search_url)
        if not html:
            return [], "Fetch Failed"

        def parse_google_html(html_text):
            items = []
            try:
                soup = BeautifulSoup(html_text, 'html.parser')
                articles = soup.find_all('article', limit=15)
                for art in articles:
                    link_tag = art.find('a', href=True)
                    if not link_tag: continue
                    
                    title = art.find(['h4', 'h3'])
                    title_text = title.get_text(strip=True) if title else link_tag.get_text(strip=True)
                    
                    if len(title_text) < 15: continue
                    
                    # Convert internal relative link to full link
                    rel_link = link_tag['href']
                    full_link = rel_link if rel_link.startswith('http') else f"https://news.google.com{rel_link[1:]}"
                    
                    source_tag = art.find('div', string=lambda s: s and len(s) < 30) or art.find('time')
                    source_name = source_tag.previous_sibling.get_text(strip=True) if source_tag and source_tag.previous_sibling else "Google News"
                    
                    items.append({
                        'title': title_text,
                        'url': full_link,
                        'source': source_name,
                        'publisher': source_name,
                        'publishedAt': datetime.now().strftime('%Y-%m-%d %H:%M'),
                        'description': title_text
                    })
                    if len(items) >= 8: break
            except Exception as e:
                print(f"[GOOGLE PARSE ERROR] {e}")
            return items

        news_items = await asyncio.to_thread(parse_google_html, html)
        return news_items, None
    except Exception as e:
        print(f"[GOOGLE NEWS ERROR] {e}")
        return [], str(e)

async def scrape_yahoo_finance_news(ticker_symbol):
    """Fetches news from Yahoo Finance using native API and fallback scraping."""
    try:
        print(f"[NEWS] Scraping Yahoo Finance: {ticker_symbol}")
        news_items = []
        
        # 1. Native yfinance news (Optimized)
        try:
            stock = yf.Ticker(ticker_symbol)
            # Use fast_info if available or just news
            yf_news = await asyncio.to_thread(lambda: stock.news)
            if yf_news:
                for item in yf_news:
                    news_items.append({
                        'title': item.get('title'),
                        'url': item.get('link'),
                        'source': item.get('publisher', 'Yahoo Finance'),
                        'publisher': item.get('publisher', 'Yahoo Finance'),
                        'publishedAt': datetime.fromtimestamp(item.get('providerPublishTime', datetime.now().timestamp())).strftime('%Y-%m-%d %H:%M'),
                        'description': item.get('title')
                    })
                if len(news_items) >= 5:
                    return news_items, None
        except Exception as e:
            print(f"[YAHOO NATIVE ERROR] {e}")

        # 2. RSS Fallback
        feed_url = f"https://feeds.finance.yahoo.com/rss/2.0/headline?s={ticker_symbol}&region=US&lang=en-US"
        try:
            headers = {"User-Agent": "Mozilla/5.0"}
            async with httpx.AsyncClient(timeout=10) as client:
                res = await client.get(feed_url, headers=headers)
                if res.status_code == 200:
                    feed = feedparser.parse(res.text)
                    for entry in feed.entries[:5]:
                        news_items.append({
                            'title': entry.get('title', 'N/A'),
                            'url': entry.get('link', ''),
                            'source': 'Yahoo Finance (RSS)',
                            'publisher': 'Yahoo Finance',
                            'publishedAt': datetime.now().strftime('%Y-%m-%d %H:%M'),
                            'description': entry.get('summary', entry.get('title', ''))
                        })
        except Exception as e:
            print(f"[YAHOO RSS ERROR] {e}")

        return news_items, None
    except Exception as e:
        print(f"[YAHOO NEWS ERROR] {e}")
        return [], str(e)

def analyze_news_item_sentiment_vader(text):
    """Analyzes text sentiment and returns Bullish/Bearish/Neutral labels."""
    try:
        analyzer = SentimentIntensityAnalyzer()
        scores = analyzer.polarity_scores(text)
        compound = scores['compound']
        
        if compound >= 0.05:
            sentiment = 'Bullish'
        elif compound <= -0.05:
            sentiment = 'Bearish'
        else:
            sentiment = 'Neutral'
            
        return {
            'sentiment': sentiment,
            'compound': compound,
            'positive': scores['pos'],
            'negative': scores['neg'],
            'neutral': scores['neu']
        }
    except Exception as e:
        print(f"[SENTIMENT ERROR] {e}")
        return {'sentiment': 'Neutral', 'compound': 0.0, 'positive': 0.0, 'negative': 0.0, 'neutral': 1.0}

async def add_sentiment_to_news_items(news_items):
    """Enriches news items with sentiment analysis results."""
    if not news_items: return []
    
    def process_sentiment(items):
        for item in items:
            try:
                # Use title and description for context
                text = f"{item.get('title', '')} {item.get('description', '')}"
                res = analyze_news_item_sentiment_vader(text)
                item['sentiment'] = res['sentiment']
                item['sentiment_score'] = res['compound']
                item['vader_sentiment'] = res
            except:
                item['sentiment'] = 'Neutral'
                item['sentiment_score'] = 0.0
        return items
        
    return await asyncio.to_thread(process_sentiment, news_items)
