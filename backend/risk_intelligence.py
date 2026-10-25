"""Deterministic, ticker-specific risk and forecast analysis primitives."""
from __future__ import annotations

from datetime import datetime, timezone
import math
import re
from typing import Any

import numpy as np
import pandas as pd


ANALYSIS_VERSION = "risk-v1"
TRADING_DAYS_PER_YEAR = 252
MIN_HISTORY = 126
FORECAST_FEATURES = ("return_1d", "return_5d", "return_20d", "sma_gap_20", "rsi_14", "volatility_20d")


def normalize_ticker(symbol: str) -> str:
    ticker = str(symbol or "").strip().upper()
    if not ticker or len(ticker) > 24 or not re.fullmatch(r"[A-Z0-9^][A-Z0-9.^=_-]*", ticker):
        raise ValueError("Ticker must contain only letters, digits, '.', '^', '=', '_' or '-'.")
    return ticker


def clean_history(raw: pd.DataFrame, ticker: str) -> tuple[pd.DataFrame, dict[str, Any]]:
    """Select/normalize OHLCV columns and discard invalid observations."""
    if raw is None or raw.empty:
        raise ValueError(f"No historical market data is available for {ticker}.")
    df = raw.copy()
    if isinstance(df.columns, pd.MultiIndex):
        wanted = ticker.upper()
        kept = {}
        for field in ("Open", "High", "Low", "Close", "Adj Close", "Volume"):
            matches = [column for column in df.columns if any(str(part).upper() == field.upper() for part in column)]
            if matches:
                selected = next((column for column in matches if wanted in [str(part).upper() for part in column]), matches[0])
                kept[field] = df[selected]
        df = pd.DataFrame(kept, index=df.index)
    else:
        df.columns = [str(column) for column in df.columns]
    rename = {column: str(column).title() for column in df.columns}
    df = df.rename(columns=rename)
    if "Adj Close" in df.columns:
        df = df.rename(columns={"Adj Close": "AdjClose"})
    required = {"Open", "High", "Low", "Close"}
    if not required.issubset(df.columns):
        raise ValueError(f"Market data for {ticker} is missing required OHLC columns.")
    df.index = pd.to_datetime(df.index, utc=True, errors="coerce")
    df = df.loc[~df.index.isna()].sort_index()
    duplicate_count = int(df.index.duplicated(keep="last").sum())
    df = df.loc[~df.index.duplicated(keep="last")]
    for col in ("Open", "High", "Low", "Close", "AdjClose", "Volume"):
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
            df.loc[~np.isfinite(df[col]), col] = np.nan
    adjusted_close_missing = int(df["AdjClose"].isna().sum() + (df["AdjClose"] <= 0).sum()) if "AdjClose" in df.columns else None
    if "Volume" in df.columns:
        df.loc[df["Volume"] < 0, "Volume"] = np.nan
    before = len(df)
    quality_columns = ["Open", "High", "Low", "Close"] + (["Volume"] if "Volume" in df.columns else [])
    missing_data_count = int(df[quality_columns].isna().sum().sum())
    missing_data_ratio = float(missing_data_count / max(1, before * len(quality_columns)))
    df = df.dropna(subset=["Open", "High", "Low", "Close"])
    valid = (
        (df[["Open", "High", "Low", "Close"]] > 0).all(axis=1)
        & (df["High"] >= df[["Open", "Low", "Close"]].max(axis=1))
        & (df["Low"] <= df[["Open", "High", "Close"]].min(axis=1))
    )
    df = df.loc[valid]
    if "Volume" in df.columns:
        df.loc[df["Volume"] < 0, "Volume"] = np.nan
    if len(df) < 30:
        raise ValueError(f"Insufficient valid history for {ticker}: {len(df)} observations; at least 30 are required.")
    return df, {
        "input_observations": int(before),
        "observations": int(len(df)),
        "dropped_observations": int(before - len(df)),
        "duplicate_timestamps_removed": duplicate_count,
        "missing_data_count": missing_data_count,
        "missing_data_ratio": missing_data_ratio,
        "adjusted_close_missing": adjusted_close_missing,
        "uses_adjusted_close": bool("AdjClose" in df.columns and adjusted_close_missing == 0),
    }


def _rsi(close: pd.Series, window: int = 14) -> pd.Series:
    delta = close.diff()
    gain = delta.clip(lower=0).ewm(alpha=1 / window, min_periods=window, adjust=False).mean()
    loss = -delta.clip(upper=0).ewm(alpha=1 / window, min_periods=window, adjust=False).mean()
    rs = gain / loss.replace(0, np.nan)
    result = 100 - 100 / (1 + rs)
    result = result.where(loss.ne(0), 100.0)
    result = result.where(~(gain.eq(0) & loss.eq(0)), 50.0)
    return result


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    close = _analysis_close(df)
    returns = close.pct_change(fill_method=None)
    features = pd.DataFrame(index=df.index)
    features["return_1d"] = returns
    features["return_5d"] = close.pct_change(5, fill_method=None)
    features["return_20d"] = close.pct_change(20, fill_method=None)
    sma20 = close.rolling(20, min_periods=20).mean()
    features["sma_gap_20"] = close / sma20 - 1
    features["rsi_14"] = _rsi(close) / 100
    features["volatility_20d"] = returns.rolling(20, min_periods=20).std(ddof=1) * math.sqrt(TRADING_DAYS_PER_YEAR)
    return features.replace([np.inf, -np.inf], np.nan)


def _risk_percentile(current: float, history: pd.Series) -> float | None:
    sample = history.dropna().tail(252)
    if len(sample) < 60 or not np.isfinite(current):
        return None
    return float((sample <= current).mean() * 100)


def _safe_float(value: Any) -> float | None:
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return None
    return numeric if math.isfinite(numeric) else None


def _analysis_close(df: pd.DataFrame) -> pd.Series:
    if "AdjClose" in df.columns:
        adjusted = df["AdjClose"].where(df["AdjClose"] > 0)
        if adjusted.notna().all():
            return adjusted.astype(float)
    return df["Close"].astype(float)


def calculate_risk(df: pd.DataFrame, benchmark: pd.Series | None = None) -> dict[str, Any]:
    close = _analysis_close(df)
    returns = close.pct_change(fill_method=None).dropna()
    if len(returns) < 30:
        raise ValueError("At least 30 daily returns are required for risk analysis.")
    annual_vol = float(returns.std(ddof=1) * math.sqrt(TRADING_DAYS_PER_YEAR))
    short_vol = float(returns.tail(20).std(ddof=1) * math.sqrt(TRADING_DAYS_PER_YEAR)) if len(returns.tail(20)) >= 10 else None
    downside = returns.clip(upper=0)
    downside_deviation = float(math.sqrt(float((downside ** 2).mean()) * TRADING_DAYS_PER_YEAR))
    q05 = float(returns.quantile(0.05))
    cvar = float(max(0.0, -returns.loc[returns <= q05].mean()))
    equity = (1 + returns).cumprod()
    max_drawdown = float((equity / equity.cummax() - 1).min())
    annual_return = float((equity.iloc[-1] ** (TRADING_DAYS_PER_YEAR / len(returns))) - 1) if equity.iloc[-1] > 0 else None
    sharpe = float(returns.mean() / returns.std(ddof=1) * math.sqrt(TRADING_DAYS_PER_YEAR)) if returns.std(ddof=1) > 0 else None
    sortino = float(returns.mean() * TRADING_DAYS_PER_YEAR / downside_deviation) if downside_deviation > 0 else None

    vol63 = returns.rolling(63, min_periods=40).std(ddof=1) * math.sqrt(TRADING_DAYS_PER_YEAR)
    rolling_peak = close.rolling(63, min_periods=40).max()
    rolling_dd = (close / rolling_peak - 1).rolling(63, min_periods=40).min()
    var63 = (-returns.rolling(63, min_periods=40).quantile(0.05)).clip(lower=0)
    component_values = {
        "volatility": (float(vol63.iloc[-1]), _risk_percentile(float(vol63.iloc[-1]), vol63)),
        "drawdown": (float(abs(rolling_dd.iloc[-1])), _risk_percentile(float(abs(rolling_dd.iloc[-1])), rolling_dd.abs())),
        "historical_var_95": (float(var63.iloc[-1]), _risk_percentile(float(var63.iloc[-1]), var63)),
    }
    available_percentiles = [item[1] for item in component_values.values() if item[1] is not None]
    score = float(np.mean(available_percentiles)) if len(available_percentiles) == 3 else None
    if score is None:
        category = "Unavailable"
    elif score <= 20:
        category = "Low"
    elif score <= 40:
        category = "Moderate"
    elif score <= 60:
        category = "Elevated"
    elif score <= 80:
        category = "High"
    else:
        category = "Very High"

    beta = correlation = relative_return = None
    if benchmark is not None:
        aligned = pd.concat([returns.rename("asset"), benchmark.pct_change(fill_method=None).rename("benchmark")], axis=1).dropna()
        if len(aligned) >= 30 and aligned["benchmark"].var(ddof=1) > 0:
            covariance = aligned["asset"].cov(aligned["benchmark"])
            beta = _safe_float(covariance / aligned["benchmark"].var(ddof=1))
            correlation = _safe_float(aligned["asset"].corr(aligned["benchmark"]))
            relative_return = _safe_float((1 + aligned["asset"]).prod() - (1 + aligned["benchmark"]).prod())

    latest = df.iloc[-1]
    close_now = float(close.iloc[-1])
    rsi = float(_rsi(close).iloc[-1]) if pd.notna(_rsi(close).iloc[-1]) else None
    sma20 = float(close.rolling(20).mean().iloc[-1]) if len(close) >= 20 else None
    sma50 = float(close.rolling(50).mean().iloc[-1]) if len(close) >= 50 else None
    sma200 = float(close.rolling(200).mean().iloc[-1]) if len(close) >= 200 else None
    ema12, ema26 = close.ewm(span=12, adjust=False).mean(), close.ewm(span=26, adjust=False).mean()
    macd = ema12 - ema26
    macd_signal = macd.ewm(span=9, adjust=False).mean()
    adjustment = close / df["Close"].astype(float)
    adjusted_high = df["High"].astype(float) * adjustment
    adjusted_low = df["Low"].astype(float) * adjustment
    tr = pd.concat([(adjusted_high - adjusted_low), (adjusted_high - close.shift(1)).abs(), (adjusted_low - close.shift(1)).abs()], axis=1).max(axis=1)
    atr = tr.rolling(14, min_periods=14).mean()
    if "Volume" in df.columns:
        avg_volume = df["Volume"].rolling(20, min_periods=10).mean()
        relative_volume = float(latest["Volume"] / avg_volume.iloc[-1]) if pd.notna(latest.get("Volume")) and pd.notna(avg_volume.iloc[-1]) and avg_volume.iloc[-1] > 0 else None
    else:
        relative_volume = None

    indicators = {
        "sma_20": _safe_float(sma20), "sma_50": _safe_float(sma50), "sma_200": _safe_float(sma200),
        "ema_12": _safe_float(ema12.iloc[-1]), "ema_26": _safe_float(ema26.iloc[-1]),
        "rsi_14": _safe_float(rsi), "macd": _safe_float(macd.iloc[-1]), "macd_signal": _safe_float(macd_signal.iloc[-1]),
        "atr_14": _safe_float(atr.iloc[-1]),
        "volume_vs_20d_avg": _safe_float(relative_volume),
        "price_vs_sma20": _safe_float(close_now / sma20 - 1) if sma20 and sma20 > 0 else None,
        "price_vs_sma50": _safe_float(close_now / sma50 - 1) if sma50 and sma50 > 0 else None,
        "price_vs_sma200": _safe_float(close_now / sma200 - 1) if sma200 and sma200 > 0 else None,
    }
    return {
        "metrics": {
            "annualized_volatility": _safe_float(annual_vol),
            "short_term_volatility_20d": _safe_float(short_vol),
            "long_term_volatility": _safe_float(annual_vol),
            "short_to_long_volatility_ratio": _safe_float(short_vol / annual_vol) if short_vol is not None and annual_vol > 0 else None,
            "max_drawdown": _safe_float(max_drawdown),
            "downside_deviation": _safe_float(downside_deviation),
            "historical_var_95": _safe_float(max(0.0, -q05)),
            "historical_cvar_95": _safe_float(cvar),
            "sharpe_ratio": _safe_float(sharpe), "sortino_ratio": _safe_float(sortino),
            "annualized_return": _safe_float(annual_return),
            "beta": beta, "benchmark_correlation": correlation,
            "relative_return": relative_return,
        },
        "score": score,
        "classification": category,
        "score_interpretation": "Equal-weight mean of volatility, 63-session drawdown, and 63-session 95% VaR percentiles versus this ticker's trailing analysis-period history. It is a relative historical risk rank, not a loss probability.",
        "components": {
            name: {"current_63d_value": value if np.isfinite(value) else None, "historical_percentile": percentile, "weight": 1 / 3}
            for name, (value, percentile) in component_values.items()
        },
        "indicators": indicators,
        "history": _history_series(df, returns),
    }


def _history_series(df: pd.DataFrame, returns: pd.Series) -> list[dict[str, Any]]:
    close = _analysis_close(df)
    equity = (1 + returns).cumprod()
    drawdown = equity / equity.cummax() - 1
    volatility = returns.rolling(20, min_periods=15).std(ddof=1) * math.sqrt(TRADING_DAYS_PER_YEAR)
    sma20, sma50 = close.rolling(20).mean(), close.rolling(50).mean()
    start = max(0, len(df) - 252)
    rows = []
    for i in range(start, len(df)):
        rows.append({
            "date": df.index[i].date().isoformat(),
            "close": float(close.iloc[i]),
            "drawdown": float(drawdown.reindex(df.index).fillna(0).iloc[i]),
            "volatility_20d": float(volatility.reindex(df.index).iloc[i]) if pd.notna(volatility.reindex(df.index).iloc[i]) else None,
            "sma_20": float(sma20.iloc[i]) if pd.notna(sma20.iloc[i]) else None,
            "sma_50": float(sma50.iloc[i]) if pd.notna(sma50.iloc[i]) else None,
        })
    return rows


def _ridge_fit_predict(x_train: np.ndarray, y_train: np.ndarray, x_test: np.ndarray) -> np.ndarray:
    mean = x_train.mean(axis=0)
    scale = x_train.std(axis=0)
    scale[scale < 1e-12] = 1.0
    x = (x_train - mean) / scale
    xt = (x_test - mean) / scale
    x = np.column_stack([np.ones(len(x)), x])
    xt = np.column_stack([np.ones(len(xt)), xt])
    penalty = np.eye(x.shape[1])
    penalty[0, 0] = 0
    coefficients = np.linalg.solve(x.T @ x + penalty, x.T @ y_train)
    return xt @ coefficients


def evaluate_forecast(df: pd.DataFrame, horizon: int) -> dict[str, Any]:
    if horizon not in (1, 5, 20):
        raise ValueError("Forecast horizon must be 1, 5, or 20 trading sessions.")
    close = _analysis_close(df)
    features = build_features(df)
    target = close.shift(-horizon) / close - 1
    samples = pd.concat([features, target.rename("target")], axis=1).replace([np.inf, -np.inf], np.nan).dropna()
    latest_features = features.iloc[[-1]].dropna()
    if len(samples) < MIN_HISTORY + horizon + 30 or latest_features.empty:
        return {"status": "unavailable", "reason": f"At least {MIN_HISTORY + horizon + 30} usable observations are required for a purged walk-forward evaluation.", "horizon_sessions": horizon, "model": "ridge-v1", "features": list(FORECAST_FEATURES), "evaluation": None, "estimate_return": None, "estimate_price": None}
    x = samples[list(FORECAST_FEATURES)].to_numpy(dtype=float)
    y = samples["target"].to_numpy(dtype=float)
    split = max(MIN_HISTORY + horizon, int(len(samples) * 0.5))
    if len(samples) - split < 30:
        return {"status": "unavailable", "reason": "The available history cannot support a purged chronological test window.", "horizon_sessions": horizon, "model": "ridge-v1", "features": list(FORECAST_FEATURES), "evaluation": None, "estimate_return": None, "estimate_price": None}
    predicted, actual = [], []
    # Evaluate non-overlapping forecast origins so adjacent target windows do not inflate the sample count.
    for origin in range(split, len(samples), horizon):
        # Purge labels whose forward horizon would still be unresolved at this origin.
        train_end = origin - horizon + 1
        if train_end < MIN_HISTORY:
            continue
        predicted.append(float(_ridge_fit_predict(x[:train_end], y[:train_end], x[origin:origin + 1])[0]))
        actual.append(float(y[origin]))
    if len(actual) < 30:
        return {"status": "unavailable", "reason": "Fewer than 30 non-overlapping out-of-sample forecast origins are available.", "horizon_sessions": horizon, "model": "ridge-v1", "features": list(FORECAST_FEATURES), "evaluation": None, "estimate_return": None, "estimate_price": None}
    pred = np.asarray(predicted)
    truth = np.asarray(actual)
    baseline = np.zeros_like(truth)
    mae = float(np.mean(np.abs(truth - pred)))
    rmse = float(np.sqrt(np.mean((truth - pred) ** 2)))
    baseline_mae = float(np.mean(np.abs(truth - baseline)))
    baseline_rmse = float(np.sqrt(np.mean((truth - baseline) ** 2)))
    directional = float(np.mean(np.sign(pred) == np.sign(truth)))
    passed = len(truth) >= 60 and mae < baseline_mae and directional > 0.5
    status = "validated" if passed else "experimental"
    estimate = float(_ridge_fit_predict(x, y, latest_features[list(FORECAST_FEATURES)].to_numpy(dtype=float))[0])
    latest_close = float(df["Close"].iloc[-1])
    return {
        "status": status,
        "reason": "Passed walk-forward criteria." if passed else "Did not pass the predefined out-of-sample baseline criteria; point estimate is withheld.",
        "horizon_sessions": horizon,
        "model": "standardized ridge regression (alpha=1.0)",
        "model_version": "ridge-v1",
        "features": list(FORECAST_FEATURES),
        "training_period_start": samples.index[0].date().isoformat(),
        "training_period_end": samples.index[-1].date().isoformat(),
        "reference_price": latest_close,
        "reference_timestamp": df.index[-1].isoformat(),
        "estimate_return": estimate if passed else None,
        "estimate_price": latest_close * (1 + estimate) if passed else None,
        "uncertainty": "No prediction interval is provided; this point estimate is not calibrated as a probability." if passed else None,
        "evaluation": {
            "method": "Expanding-window walk-forward; initial training uses the first half, test origins are non-overlapping, and training labels are purged until their outcomes are known.",
            "samples": len(truth),
            "test_start": samples.index[split].date().isoformat(),
            "test_end": samples.index[-1].date().isoformat(),
            "mae": mae, "rmse": rmse, "baseline": "zero-return",
            "baseline_mae": baseline_mae, "baseline_rmse": baseline_rmse,
            "directional_accuracy": directional,
            "passed_criteria": passed,
        },
    }


def build_analysis(ticker: str, raw: pd.DataFrame, period: str, horizon: int, retrieved_at: datetime | None = None, benchmark_raw: pd.DataFrame | None = None) -> dict[str, Any]:
    ticker = normalize_ticker(ticker)
    df, quality = clean_history(raw, ticker)
    benchmark = None
    if benchmark_raw is not None and not benchmark_raw.empty:
        try:
            benchmark_df, _ = clean_history(benchmark_raw, "BENCHMARK")
            benchmark = _analysis_close(benchmark_df)
        except ValueError:
            benchmark = None
    risk = calculate_risk(df, benchmark)
    forecast = evaluate_forecast(df, horizon)
    now = retrieved_at or datetime.now(timezone.utc)
    forecast["trained_at"] = now.astimezone(timezone.utc).isoformat() if forecast.get("evaluation") else None
    latest = df.index[-1]
    age_days = max(0, (now.astimezone(timezone.utc) - latest.to_pydatetime()).total_seconds() / 86400)
    freshness = "stale" if age_days > 7 else "current"
    if freshness == "stale":
        forecast["status"] = "experimental"
        forecast["reason"] = "The latest market observation is more than seven days old; forecast estimate withheld."
        forecast["estimate_return"] = None
        forecast["estimate_price"] = None
        forecast["uncertainty"] = None
    risk["ticker"] = ticker
    risk["period"] = period
    risk["analysis_version"] = ANALYSIS_VERSION
    risk["data_quality"] = {
        **quality,
        "source": "Yahoo Finance via yfinance",
        "retrieved_at": now.astimezone(timezone.utc).isoformat(),
        "latest_observation": latest.isoformat(),
        "age_days": age_days,
        "freshness": freshness,
        "validation_status": "valid" if quality["dropped_observations"] == 0 and quality["missing_data_count"] == 0 else "partial",
        "period_start": df.index[0].date().isoformat(),
        "period_end": latest.date().isoformat(),
        "observations": len(df),
    }
    risk["forecast"] = forecast
    risk["benchmark"] = "^NSEI" if ticker.endswith((".NS", ".BO")) else "^GSPC"
    return risk
