#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI()

class StockSearchResult(BaseModel):
    symbol: str
    name: str
    price: Optional[float] = None
    change: Optional[float] = None
    sector: Optional[str] = None
    relevance: Optional[int] = None

@app.get("/test")
async def test_endpoint():
    return {"message": "Test endpoint working"}

@app.get("/stocks/search", response_model=List[StockSearchResult])
async def search_stocks(q: str):
    """Search for stocks by symbol or name"""
    try:
        if len(q) < 2:
            return []
        
        # Clean the query
        q = q.strip().upper()
        
        # Simple test database
        stock_database = {
            'AAPL': {'name': 'Apple Inc.', 'sector': 'Technology'},
            'GOOGL': {'name': 'Alphabet Inc.', 'sector': 'Technology'},
            'MSFT': {'name': 'Microsoft Corporation', 'sector': 'Technology'},
            'TSLA': {'name': 'Tesla Inc.', 'sector': 'Automotive'},
            'AMZN': {'name': 'Amazon.com Inc.', 'sector': 'Consumer Discretionary'},
        }
        
        search_results = []
        query_upper = q.upper()
        query_lower = q.lower()
        
        # Search through the database
        for symbol, info in stock_database.items():
            # Check if symbol or name matches the query
            if (query_upper in symbol or 
                query_lower in info['name'].lower() or
                query_lower in symbol.lower()):
                
                # Calculate relevance score for sorting
                relevance_score = 0
                if symbol == query_upper:
                    relevance_score = 100  # Exact symbol match
                elif symbol.startswith(query_upper):
                    relevance_score = 95   # Starts with query
                elif query_upper in symbol:
                    relevance_score = 85   # Contains query
                elif query_lower in info['name'].lower():
                    relevance_score = 75   # Name match
                
                search_results.append({
                    'symbol': symbol,
                    'name': info['name'],
                    'sector': info['sector'],
                    'relevance': relevance_score,
                    'price': None,
                    'change': None
                })
        
        # Sort by relevance score
        search_results.sort(key=lambda x: x['relevance'], reverse=True)
        
        # Convert to StockSearchResult objects
        result_objects = []
        for result in search_results[:10]:  # Limit to 10 results
            result_objects.append(StockSearchResult(**result))
        
        return result_objects
        
    except Exception as e:
        print(f"Error in stock search for query '{q}': {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
