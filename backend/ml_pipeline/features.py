"""
Feature engineering: technical indicators, volatility metrics, and text sentiment.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import List, Tuple

import numpy as np
import pandas as pd


def add_technical_indicators(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    if df.empty:
        return df

    # Moving averages
    df["SMA_20"] = df["Close"].rolling(20).mean()
    df["SMA_50"] = df["Close"].rolling(50).mean()
    df["EMA_20"] = df["Close"].ewm(span=20, adjust=False).mean()
    df["EMA_50"] = df["Close"].ewm(span=50, adjust=False).mean()

    # RSI
    delta = df["Close"].diff()
    gain = (delta.where(delta > 0, 0)).rolling(14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
    rs = gain / (loss.replace(0, np.nan))
    df["RSI"] = 100 - (100 / (1 + rs))

    # MACD
    ema12 = df["Close"].ewm(span=12, adjust=False).mean()
    ema26 = df["Close"].ewm(span=26, adjust=False).mean()
    df["MACD_line"] = ema12 - ema26
    df["MACD_signal"] = df["MACD_line"].ewm(span=9, adjust=False).mean()
    df["MACD_hist"] = df["MACD_line"] - df["MACD_signal"]

    # Bollinger Bands
    bb_mid = df["Close"].rolling(20).mean()
    bb_std = df["Close"].rolling(20).std()
    df["BB_Mid"] = bb_mid
    df["BB_High"] = bb_mid + 2 * bb_std
    df["BB_Low"] = bb_mid - 2 * bb_std

    return df


def compute_volatility_metrics(df: pd.DataFrame) -> dict:
    if df.empty:
        return {"sharpe": 0.0, "max_drawdown": 0.0}
    returns = df["Close"].pct_change().dropna()
    sharpe = (returns.mean() / (returns.std() + 1e-9)) * np.sqrt(252)
    cummax = (1 + returns).cumprod().cummax()
    equity = (1 + returns).cumprod()
    drawdown = equity / cummax - 1
    max_drawdown = drawdown.min()
    return {"sharpe": float(sharpe), "max_drawdown": float(max_drawdown)}


