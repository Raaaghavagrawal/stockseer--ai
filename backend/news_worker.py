import asyncio
import httpx
import datetime

try:
    import feedparser
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
    import dateutil.parser
    from sqlalchemy import select
    from apscheduler.schedulers.asyncio import AsyncIOScheduler
    from database import AsyncSessionLocal, SQLALCHEMY_AVAILABLE
    from models import NewsArticle
    from company_mappings import TICKER_TO_NAME
    WORKER_AVAILABLE = SQLALCHEMY_AVAILABLE
except ImportError as e:
    print(f"[WARNING] News Worker dependencies not fully installed: {e}. News background fetching disabled.")
    WORKER_AVAILABLE = False

RSS_FEEDS = {
    "Economic Times": "https://economictimes.indiatimes.com/markets/rssfeeds/2146842.cms",
    "MoneyControl": "https://www.moneycontrol.com/rss/marketreports.xml"
}

# Use centralized mapping for high-precision detection
TICKER_MAP_LOWER = {k.lower(): v for k, v in TICKER_TO_NAME.items()}
# Also add common keywords that might appear in text
KEYWORD_TO_TICKER = {
    "reliance": "RELIANCE.NS", "mukesh ambani": "RELIANCE.NS", "jio": "RELIANCE.NS",
    "tcs": "TCS.NS", "tata consultancy": "TCS.NS",
    "hdfc": "HDFCBANK.NS", "infosys": "INFY.NS", "infy": "INFY.NS",
    "tesla": "TSLA", "elon musk": "TSLA",
    "apple": "AAPL", "iphone": "AAPL",
    "nvidia": "NVDA", "nvidia corp": "NVDA",
    "google": "GOOGL", "alphabet": "GOOGL",
    "microsoft": "MSFT", "meta": "META", "facebook": "META"
}

if WORKER_AVAILABLE:
    sentiment_analyzer = SentimentIntensityAnalyzer()

async def fetch_rss_feed(source_name: str, url: str):
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        async with httpx.AsyncClient(headers=headers, timeout=15.0, follow_redirects=True) as client:
            response = await client.get(url)
            response.raise_for_status()
            feed = feedparser.parse(response.text)
            return source_name, feed.entries
    except Exception as e:
        print(f"Error fetching {source_name}: {e}")
        return source_name, []

def analyze_article(entry, source_name: str):
    title = entry.get("title", "")
    summary = entry.get("summary", "")
    url = entry.get("link", "")

    try:
        pub_date_str = entry.get("published", entry.get("updated", ""))
        published_at = dateutil.parser.parse(pub_date_str) if pub_date_str else datetime.datetime.now()
    except Exception:
        published_at = datetime.datetime.now()

    if published_at.tzinfo is not None:
        published_at = published_at.replace(tzinfo=None)

    text_to_analyze = f"{title}. {summary}"
    scores = sentiment_analyzer.polarity_scores(text_to_analyze)
    compound = scores['compound']
    label = "Bullish" if compound >= 0.05 else "Bearish" if compound <= -0.05 else "Neutral"

    found_tickers = []
    text_lower = text_to_analyze.lower()
    
    # 1. Check Keywords Map with word boundaries
    import re
    for keyword, ticker in KEYWORD_TO_TICKER.items():
        if re.search(rf'\b{re.escape(keyword)}\b', text_lower):
            if ticker not in found_tickers:
                found_tickers.append(ticker)
    
    # 2. Check Full Company Names from Global Map
    for ticker, name in TICKER_TO_NAME.items():
        if name.lower() in text_lower:
            if ticker not in found_tickers:
                found_tickers.append(ticker)
                
    # 3. Look for uppercase tickers in text
    import re
    for ticker_symbol in TICKER_TO_NAME.keys():
        clean_ticker = ticker_symbol.split('.')[0] 
        pattern = rf'\b{re.escape(clean_ticker)}\b'
        if re.search(pattern, text_to_analyze): # Use original text for case-sensitivity if needed, though tickers here are upper
            if ticker_symbol not in found_tickers:
                found_tickers.append(ticker_symbol)

    category = "market_news"
    if found_tickers:
        category = "company_news"
    elif any(w in text_to_analyze.lower() for w in ["inflation", "fed", "rate", "gdp", "recession"]):
        category = "macro"

    return {
        "title": title,
        "source": source_name,
        "url": url,
        "summary": summary[:1000] if summary else "",
        "published_at": published_at,
        "sentiment_score": compound,
        "sentiment_label": label,
        "category": category,
        "related_tickers": str(found_tickers)
    }

async def fetch_and_store_news():
    if not WORKER_AVAILABLE:
        return
    print(f"[{datetime.datetime.now()}] Background News Worker running...")

    tasks = [fetch_rss_feed(name, url) for name, url in RSS_FEEDS.items()]
    results = await asyncio.gather(*tasks)

    all_parsed_articles = []
    for source_name, entries in results:
        for entry in entries[:20]:
            all_parsed_articles.append(analyze_article(entry, source_name))

    if not all_parsed_articles:
        return

    all_parsed_articles.sort(key=lambda x: x['published_at'])

    async with AsyncSessionLocal() as session:
        added_count = 0
        for article_data in all_parsed_articles:
            stmt = select(NewsArticle).where(NewsArticle.url == article_data["url"])
            existing = await session.execute(stmt)
            if existing.scalar_one_or_none() is None:
                session.add(NewsArticle(**article_data))
                added_count += 1
        if added_count > 0:
            await session.commit()
            print(f"[{datetime.datetime.now()}] Added {added_count} new articles.")

def start_news_scheduler():
    if not WORKER_AVAILABLE:
        print("[WARNING] News Scheduler not started — dependencies missing.")
        return
    scheduler = AsyncIOScheduler()
    scheduler.add_job(fetch_and_store_news, 'interval', minutes=15, id='news_fetcher_job', replace_existing=True)
    scheduler.start()
