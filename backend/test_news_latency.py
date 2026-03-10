import requests
import time

try:
    # 1. First trigger the internal news fetcher to populate the database
    from news_worker import fetch_and_store_news
    import asyncio
    print("Pre-fetching RSS feeds to populate database (takes ~10s)...")
    asyncio.run(fetch_and_store_news())
    
    # Wait for the backend uvicorn to pick up DB changes if needed
    time.sleep(2)
    
    print("Testing API speeds...")
    
    # 2. Test Market News Latency
    start_time = time.time()
    res1 = requests.get("http://localhost:8000/api/news/market")
    lat1 = (time.time() - start_time) * 1000
    print(f"[Market News] Latency: {lat1:.2f}ms | Status: {res1.status_code}")
    
    # 3. Test TSLA Stock News Latency
    start_time = time.time()
    res2 = requests.get("http://localhost:8000/stocks/TSLA/news")
    lat2 = (time.time() - start_time) * 1000
    print(f"[Stock News: TSLA] Latency: {lat2:.2f}ms | Status: {res2.status_code}")
except Exception as e:
    print(f"Error: {e}")
