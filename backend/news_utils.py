import os
import httpx
from bs4 import BeautifulSoup
import feedparser
from datetime import datetime, timedelta
from urllib.parse import quote_plus
import yfinance as yf
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import asyncio

async def fetch_url_async(url: str, headers: dict = None, timeout: int = 10):
    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            return response.text, response.status_code
        except httpx.RequestError as exc:
            print(f"An error occurred while requesting {exc.request.url!r}.")
            return None, None
        except httpx.HTTPStatusError as exc:
            print(f"Error response {exc.response.status_code} while requesting {exc.request.url!r}.")
            return None, exc.response.status_code

async def get_stock_news_from_newsapi(ticker_symbol_or_company_name, api_key=None):
    news_items, error_message = [], None
    if not api_key:
        api_key = os.getenv("NEWS_API_KEY")
    if not api_key: 
        return news_items, "NEWS_API_KEY not configured."
    
    query_term = ticker_symbol_or_company_name
    try:
        stock_info_temp = await asyncio.to_thread(lambda: yf.Ticker(ticker_symbol_or_company_name).info)
        if stock_info_temp and stock_info_temp.get('shortName'):
            company_name_for_search = stock_info_temp['shortName'].replace(" Inc.", "").replace(" Corp.", "").replace(" Ltd.", "")
            if len(company_name_for_search) > 3: 
                query_term = company_name_for_search
    except: 
        pass
    
    to_date = datetime.now().strftime('%Y-%m-%d')
    from_date = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
    url = f"https://newsapi.org/v2/everything?q={query_term}&from={from_date}&to={to_date}&language=en&sortBy=relevancy&pageSize=15&apiKey={api_key}"
    
    response_text, status_code = await fetch_url_async(url)
    if not response_text:
        return news_items, f"NewsAPI Error for '{query_term}': Status {status_code}"
    
    import json
    try:
        data = json.loads(response_text)
        articles_data = data.get("articles", [])
        if not articles_data: 
            error_message = f"No recent news for '{query_term}' via NewsAPI."
        else:
            for item in articles_data:
                publish_time_readable = datetime.strptime(item['publishedAt'], '%Y-%m-%dT%H:%M:%SZ').strftime('%Y-%m-%d %H:%M') if item.get('publishedAt') else "N/A"
                image_url = item.get('urlToImage')
                
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
    except Exception as e: 
        error_message = f"NewsAPI Unexpected Error for '{query_term}': {str(e)}"
    
    return news_items, error_message

async def scrape_google_news(query_term):
    news_items, error_message = [], None
    safe_query = quote_plus(query_term + " stock news")
    search_url = f"https://news.google.com/search?q={safe_query}&hl=en-US&gl=US&ceid=US%3Aen"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    
    html, _ = await fetch_url_async(search_url, headers=headers)
    if not html:
        return news_items, f"Google News: Failed to fetch for '{query_term}'."

    def parse_html(html_text):
        soup = BeautifulSoup(html_text, 'html.parser')
        articles_tags = soup.find_all('article', limit=15)
        processed_urls = set()
        items = []
        for article_tag in articles_tags:
            link_tag = article_tag.find('a', href=True)
            if link_tag and link_tag['href'].startswith('./articles/'):
                title_text = (link_tag.get_text(strip=True) or 
                            (article_tag.find(['h3', 'h4']) and article_tag.find(['h3', 'h4']).get_text(strip=True)) or 
                            article_tag.get_text(separator=' ', strip=True).split(' temporally ')[0])
                full_link = "https://news.google.com" + link_tag['href'][1:]
                
                if full_link not in processed_urls and len(title_text) > 15:
                    items.append({
                        'title': title_text, 
                        'url': full_link, 
                        'source': 'Google News (Scraped)', 
                        'publisher': 'Google News Aggregated',
                        'publishedAt': datetime.now().strftime('%Y-%m-%d %H:%M'),
                        'image_url': None
                    })
                    processed_urls.add(full_link)
            if len(items) >= 7: 
                break
        return items

    news_items = await asyncio.to_thread(parse_html, html)
    if not news_items:
        error_message = f"Google News: No articles for '{query_term}'."
    
    return news_items[:5], error_message

async def scrape_yahoo_finance_news(ticker_symbol):
    news_items, error_message = [], None
    search_url = f"https://finance.yahoo.com/quote/{ticker_symbol}/news"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    
    html, _ = await fetch_url_async(search_url, headers=headers)
    if not html:
        # Fallback to RSS
        feed_url = f"https://feeds.finance.yahoo.com/rss/2.0/headline?s={ticker_symbol}&region=US&lang=en-US"
        rss_xml, _ = await fetch_url_async(feed_url, headers=headers)
        if rss_xml:
            feed = await asyncio.to_thread(feedparser.parse, rss_xml)
            if not feed.bozo:
                for entry in feed.entries[:5]:
                    news_items.append({
                        'title': entry.get('title', 'No title'),
                        'description': entry.get('description', 'No description'),
                        'url': entry.get('link', ''),
                        'source': 'Yahoo Finance (RSS)',
                        'publisher': 'Yahoo Finance',
                        'publishedAt': datetime.now().strftime('%Y-%m-%d %H:%M')
                    })
        return news_items, "Used RSS Fallback"

    def parse_html(html_text):
        soup = BeautifulSoup(html_text, 'html.parser')
        article_containers = soup.find_all('li', class_=lambda x: x and 'stream-item' in x.lower(), limit=15)
        if not article_containers: 
            article_containers = soup.select('div.Cf div.js-stream-content > div', limit=15)
        processed_urls = set()
        items = []
        for item_container in article_containers:
            link_tag, title_tag = item_container.find('a', href=True), item_container.find(['h3', 'h2'])
            if link_tag and title_tag and link_tag['href']:
                raw_link, title_text = link_tag['href'], title_tag.get_text(strip=True)
                full_link = ""
                if raw_link.startswith('/news/'): 
                    full_link = "https://finance.yahoo.com" + raw_link
                elif raw_link.startswith('https://finance.yahoo.com/news/'): 
                    full_link = raw_link
                elif raw_link.startswith(('http://', 'https://')) and 'yahoo.com' in raw_link: 
                    full_link = raw_link
                else: 
                    continue
                
                if full_link not in processed_urls and title_text and len(title_text) > 20:
                    items.append({
                        'title': title_text, 
                        'url': full_link, 
                        'source': 'Yahoo Finance (Scraped)', 
                        'publisher': 'Yahoo Finance',
                        'publishedAt': datetime.now().strftime('%Y-%m-%d %H:%M'),
                        'image_url': None
                    })
                    processed_urls.add(full_link)
                if len(items) >= 5: 
                    break
        return items

    news_items = await asyncio.to_thread(parse_html, html)
    if not news_items:
        error_message = f"Yahoo Finance: No articles for '{ticker_symbol}'."
    
    return news_items, error_message

def analyze_news_item_sentiment_vader(text):
    try:
        analyzer = SentimentIntensityAnalyzer()
        scores = analyzer.polarity_scores(text)
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
        return {'sentiment': 'neutral', 'compound': 0.0, 'positive': 0.0, 'negative': 0.0, 'neutral': 1.0}

async def add_sentiment_to_news_items(news_items):
    def process(items):
        for item in items:
            text_for_sentiment = f"{item.get('title', '')} {item.get('description', '')}"
            sentiment_data = analyze_news_item_sentiment_vader(text_for_sentiment)
            item['sentiment'] = sentiment_data['sentiment']
            item['sentiment_score'] = sentiment_data['compound']
            item['vader_sentiment'] = sentiment_data
        return items
    return await asyncio.to_thread(process, news_items)
