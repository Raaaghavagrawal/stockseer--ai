from app import get_stock_news

print("Testing news function...")
news = get_stock_news('AAPL', 3)
print(f"Got {len(news)} news items")
if news:
    print("First title:", news[0].get('title'))
    print("First source:", news[0].get('source'))
else:
    print("No news returned")
