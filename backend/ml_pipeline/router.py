"""
FastAPI router that exposes an ML-based prediction endpoint.
This endpoint can serve both dummy and live accounts (same contract).
"""
from __future__ import annotations

from typing import Any, Dict

import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException

from .ingestion import fetch_price_history, fetch_recent_news, PriceIngestionConfig
from .features import add_technical_indicators, compute_volatility_metrics
from .sentiment import get_sentiment_score


router = APIRouter(prefix="/ml", tags=["ml"])


def _build_price_features(df: pd.DataFrame) -> np.ndarray:
    df = add_technical_indicators(df)
    if df.empty or len(df) < 20:
        raise HTTPException(status_code=400, detail="Insufficient price history for features")
    latest = df.iloc[-1]
    feats = np.array([
        latest.get("Close", 0.0),
        latest.get("SMA_20", 0.0), latest.get("SMA_50", 0.0),
        latest.get("EMA_20", 0.0), latest.get("EMA_50", 0.0),
        latest.get("RSI", 50.0),
        latest.get("MACD_line", 0.0), latest.get("MACD_signal", 0.0), latest.get("MACD_hist", 0.0),
        latest.get("BB_Mid", 0.0), latest.get("BB_High", 0.0), latest.get("BB_Low", 0.0),
    ], dtype=np.float32)
    return feats


def _compute_risk_level(sharpe: float, max_drawdown: float) -> str:
    # Same heuristic as models.compute_risk_level; local to avoid heavy imports.
    if sharpe >= 1.0 and max_drawdown > -0.2:
        return "Low"
    if sharpe >= 0.5 and max_drawdown > -0.35:
        return "Medium"
    return "High"


@router.get("/predict/{symbol}")
def predict(symbol: str, days: int = 5) -> Dict[str, Any]:
    # 1) Ingest
    # Try multiple periods to improve coverage for international tickers
    prices = fetch_price_history(symbol, PriceIngestionConfig(period="2y", interval="1d"))
    if prices.empty:
        for p in ["1y", "6mo", "3mo", "1mo"]:
            prices = fetch_price_history(symbol, PriceIngestionConfig(period=p, interval="1d"))
            if not prices.empty:
                break
    if prices.empty:
        return {
            "ticker": symbol.upper(),
            "error": f"No price data available for '{symbol}'.",
        }
    news_items = fetch_recent_news(symbol)

    # 2) Features
    price_feats_np = _build_price_features(prices)
    vol = compute_volatility_metrics(prices)

    texts = [n.get("title") or n.get("summary") or "" for n in news_items]
    sentiment = float(get_sentiment_score(texts))  # [-1,1]

    # 3) Lightweight forecast + probability (no heavy deps) and risk
    df_ind = add_technical_indicators(prices)
    latest = df_ind.iloc[-1]
    close = float(latest.get("Close", float(prices["Close"].iloc[-1])))

    returns = prices["Close"].pct_change().dropna()
    mu = float(returns.tail(60).mean()) if len(returns) >= 5 else 0.0
    sigma = float(returns.tail(60).std()) if len(returns) >= 5 else 0.0

    n_days = max(int(days), 1)
    projected_growth = (1.0 + mu) ** n_days
    predicted_price = float(close * projected_growth)

    z = mu / (sigma + 1e-6)
    p_price = float(1.0 / (1.0 + np.exp(-z)))
    p_sent = (sentiment + 1.0) / 2.0
    p_bull = float(np.clip(0.6 * p_price + 0.4 * p_sent, 0.0, 1.0))
    risk_level = _compute_risk_level(vol.get("sharpe", 0.0), vol.get("max_drawdown", 0.0))

    signal = "Bullish" if p_bull >= 0.5 else "Bearish"
    confidence = float(abs(p_bull - 0.5) * 2)  # map 0.5->0, 1/0->1
    sentiment_label = "Positive" if sentiment > 0.2 else ("Negative" if sentiment < -0.2 else "Neutral")

    return {
        "ticker": symbol.upper(),
        "signal": signal,
        "confidence": round(confidence, 3),
        "sentiment": sentiment_label,
        "risk_level": risk_level,
        "predicted_price": round(predicted_price, 4),
    }


