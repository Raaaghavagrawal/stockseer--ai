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
    WORKER_AVAILABLE = SQLALCHEMY_AVAILABLE
except ImportError as e:
    print(f"[WARNING] News Worker dependencies not fully installed: {e}. News background fetching disabled.")
    WORKER_AVAILABLE = False

RSS_FEEDS = {
    "MarketWatch": "http://feeds.marketwatch.com/marketwatch/topstories/",
    "Yahoo Finance": "https://finance.yahoo.com/news/rssindex",
    "WSJ Business": "https://www.wsj.com/xml/rss/3_7014.xml",
    "Economic Times": "https://economictimes.indiatimes.com/markets/rssfeeds/2146842.cms",
    "MoneyControl": "https://www.moneycontrol.com/rss/marketreports.xml"
}

TICKER_MAP = {
    "Tesla": "TSLA", "Elon Musk": "TSLA", "Model 3": "TSLA",
    "Apple": "AAPL", "iPhone": "AAPL", "Tim Cook": "AAPL",
    "Nvidia": "NVDA", "Jensen Huang": "NVDA",
    "Microsoft": "MSFT", "Windows": "MSFT", "Satya Nadella": "MSFT",
    "Amazon": "AMZN", "AWS": "AMZN",
    "Google": "GOOGL", "Alphabet": "GOOGL",
    "Meta": "META", "Facebook": "META", "Zuckerberg": "META",
    "Reliance": "RELIANCE.NS", "Mukesh Ambani": "RELIANCE.NS", "Jio": "RELIANCE.NS",
    "TCS": "TCS.NS", "HDFC": "HDFCBANK.NS"
}

if WORKER_AVAILABLE:
    sentiment_analyzer = SentimentIntensityAnalyzer()

async def fetch_rss_feed(source_name: str, url: str):
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
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
    for keyword, ticker in TICKER_MAP.items():
        if keyword.lower() in text_to_analyze.lower():
            if ticker not in found_tickers:
                found_tickers.append(ticker)

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
    scheduler.add_job(fetch_and_store_news, 'interval', minutes=5, id='news_fetcher_job', replace_existing=True)
    scheduler.start()
    print("Background News Scheduler started successfully.")
