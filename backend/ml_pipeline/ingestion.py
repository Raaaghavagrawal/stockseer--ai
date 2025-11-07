"""
Data ingestion utilities for stock price history and news sentiment.
"""
from __future__ import annotations

import datetime as dt
from dataclasses import dataclass
from typing import List, Optional, Tuple

import pandas as pd
import yfinance as yf


@dataclass
class PriceIngestionConfig:
    period: str = "2y"            # e.g., "1y", "2y"
    interval: str = "1d"          # e.g., "1d", "1h"


def fetch_price_history(symbol: str, config: Optional[PriceIngestionConfig] = None) -> pd.DataFrame:
    """
    Download OHLCV data using yfinance.
    Returns a DataFrame with columns: [Open, High, Low, Close, Volume].
    """
    cfg = config or PriceIngestionConfig()
    ticker = yf.Ticker(symbol)
    # yfinance sometimes fails for certain periods; try a short cascade
    periods = [cfg.period] if cfg.period else ["2y", "1y", "6mo", "3mo", "1mo"]
    df = pd.DataFrame()
    for p in periods:
        try:
            df = ticker.history(period=p, interval=cfg.interval, auto_adjust=False)
            if not df.empty:
                break
        except Exception:
            continue
    if df.empty:
        return df
    df = df.rename(columns={"Adj Close": "AdjClose"})
    df.index = pd.to_datetime(df.index)
    return df


@dataclass
class NewsIngestionConfig:
    max_items: int = 64


def fetch_recent_news(symbol: str, max_items: int = 64) -> List[dict]:
    """
    Placeholder for news ingestion. In production, replace with NewsAPI, Twitter/X API, or
    your existing scraping utilities. We return a small synthetic set when unavailable.
    """
    # In a real system, wire this into your `news_utils.py` or external APIs.
    now = dt.datetime.utcnow()
    return [
        {
            "title": f"{symbol} market update",
            "summary": f"Latest commentary on {symbol}.",
            "publishedAt": (now - dt.timedelta(hours=i)).isoformat() + "Z",
            "source": "synthetic",
        }
        for i in range(min(max_items, 10))
    ]


