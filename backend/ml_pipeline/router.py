"""API routes for data-backed risk analytics and validated forecasts."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from copy import deepcopy
from threading import RLock
from typing import Literal, Optional

import yfinance as yf
from fastapi import APIRouter, HTTPException, Query, Response
from pydantic import BaseModel
from starlette.concurrency import run_in_threadpool

from risk_intelligence import ANALYSIS_VERSION, build_analysis, normalize_ticker

router = APIRouter(prefix="/api/ml", tags=["risk-intelligence"])
_CACHE_TTL = timedelta(minutes=15)
_ANALYSIS_CACHE: dict[tuple[str, str, int, str], tuple[datetime, dict]] = {}
_CACHE_LOCK = RLock()


class RiskMetrics(BaseModel):
    annualized_volatility: Optional[float]
    short_term_volatility_20d: Optional[float]
    long_term_volatility: Optional[float]
    short_to_long_volatility_ratio: Optional[float]
    max_drawdown: Optional[float]
    downside_deviation: Optional[float]
    historical_var_95: Optional[float]
    historical_cvar_95: Optional[float]
    sharpe_ratio: Optional[float]
    sortino_ratio: Optional[float]
    annualized_return: Optional[float]
    beta: Optional[float]
    benchmark_correlation: Optional[float]
    relative_return: Optional[float]


class DataQuality(BaseModel):
    input_observations: int
    observations: int
    dropped_observations: int
    duplicate_timestamps_removed: int
    missing_data_count: int
    missing_data_ratio: float
    adjusted_close_missing: Optional[int]
    uses_adjusted_close: bool
    source: str
    retrieved_at: str
    latest_observation: str
    age_days: float
    freshness: Literal["current", "stale"]
    validation_status: Literal["valid", "partial"]
    period_start: str
    period_end: str


class ForecastEvaluation(BaseModel):
    method: str
    samples: int
    test_start: str
    test_end: str
    mae: float
    rmse: float
    baseline: str
    baseline_mae: float
    baseline_rmse: float
    directional_accuracy: float
    passed_criteria: bool


class ForecastAnalysis(BaseModel):
    status: Literal["validated", "experimental", "unavailable"]
    reason: str
    horizon_sessions: int
    model: str
    model_version: Optional[str] = None
    trained_at: Optional[str] = None
    training_period_start: Optional[str] = None
    training_period_end: Optional[str] = None
    features: list[str]
    reference_price: Optional[float] = None
    reference_timestamp: Optional[str] = None
    estimate_return: Optional[float] = None
    estimate_price: Optional[float] = None
    uncertainty: Optional[str] = None
    evaluation: Optional[ForecastEvaluation] = None


class RiskAnalysisResponse(BaseModel):
    ticker: str
    period: str
    analysis_version: str
    score: Optional[float]
    classification: str
    score_interpretation: str
    metrics: RiskMetrics
    components: dict[str, dict[str, Optional[float]]]
    indicators: dict[str, Optional[float]]
    history: list[dict]
    data_quality: DataQuality
    benchmark: dict[str, object]
    forecast: ForecastAnalysis


def _benchmark_for(ticker: str) -> str | None:
    if ticker.endswith((".NS", ".BO")):
        return "^NSEI"
    if ticker.endswith(".T"):
        return "^N225"
    if ticker.endswith(".L"):
        return "^FTSE"
    if ticker.endswith(".AX"):
        return "^AXJO"
    if ticker.endswith((".TO", ".V")):
        return "^GSPTSE"
    if ticker.endswith(".DE"):
        return "^GDAXI"
    if ticker.endswith(".PA"):
        return "^FCHI"
    if ticker.endswith(".HK"):
        return "^HSI"
    if ticker.endswith(".SI"):
        return "^STI"
    if ticker.endswith(".KS"):
        return "^KS11"
    if ticker.startswith("^"):
        return None
    if "." not in ticker:
        return "^GSPC"
    return None


async def _download_history(ticker: str, period: str):
    return await run_in_threadpool(
        lambda: yf.Ticker(ticker).history(period=period, interval="1d", auto_adjust=False, actions=True)
    )


@router.get("/analysis/{symbol}", response_model=RiskAnalysisResponse)
async def get_risk_analysis(
    symbol: str,
    response: Response,
    period: Literal["1y", "2y", "5y"] = Query("2y"),
    horizon: int = Query(5),
):
    response.headers["Cache-Control"] = "private, no-store"
    if horizon not in (1, 5, 20):
        raise HTTPException(
            status_code=422,
            detail={"code": "invalid_horizon", "message": "horizon must be 1, 5, or 20 trading sessions."},
        )
    try:
        ticker = normalize_ticker(symbol)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail={"code": "invalid_ticker", "message": str(exc)}) from exc

    key = (ticker, period, horizon, ANALYSIS_VERSION)
    now = datetime.now(timezone.utc)
    with _CACHE_LOCK:
        cached = _ANALYSIS_CACHE.get(key)
        if cached and now - cached[0] < _CACHE_TTL:
            result = deepcopy(cached[1])
            quality = result["data_quality"]
            latest = datetime.fromisoformat(quality["latest_observation"])
            if latest.tzinfo is None:
                latest = latest.replace(tzinfo=timezone.utc)
            quality["age_days"] = max(0, (now - latest.astimezone(timezone.utc)).total_seconds() / 86400)
            quality["freshness"] = "stale" if quality["age_days"] > 7 else "current"
            if quality["freshness"] == "stale":
                result["forecast"]["status"] = "experimental"
                result["forecast"]["reason"] = "The latest market observation is more than seven days old; forecast estimate withheld."
                result["forecast"]["estimate_return"] = None
                result["forecast"]["estimate_price"] = None
                result["forecast"]["uncertainty"] = None
            return result

    try:
        raw = await _download_history(ticker, period)
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail={"code": "market_data_unavailable", "ticker": ticker, "message": "Historical market data could not be retrieved."},
        ) from exc
    if raw is None or raw.empty:
        raise HTTPException(
            status_code=503,
            detail={"code": "market_data_unavailable", "ticker": ticker, "message": "No historical market data was returned."},
        )

    benchmark_ticker = _benchmark_for(ticker)
    benchmark_raw = None
    if benchmark_ticker:
        try:
            benchmark_raw = await _download_history(benchmark_ticker, period)
        except Exception:
            benchmark_raw = None
    retrieved_at = datetime.now(timezone.utc)
    try:
        result = build_analysis(ticker, raw, period, horizon, retrieved_at, benchmark_raw)
        result["benchmark"] = {"ticker": benchmark_ticker, "available": result["metrics"]["beta"] is not None}
    except ValueError as exc:
        raise HTTPException(
            status_code=503,
            detail={"code": "analysis_unavailable", "ticker": ticker, "message": str(exc)},
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail={"code": "analysis_failed", "ticker": ticker, "message": "Risk analysis could not be completed."},
        ) from exc

    with _CACHE_LOCK:
        _ANALYSIS_CACHE[key] = (retrieved_at, result)
        for stale_key, (stored_at, _) in list(_ANALYSIS_CACHE.items()):
            if now - stored_at >= _CACHE_TTL:
                _ANALYSIS_CACHE.pop(stale_key, None)
    return result


@router.get("/predict/{symbol}")
async def legacy_prediction(symbol: str):
    """Retire unvalidated legacy predictions rather than serving a TSLA fallback."""
    try:
        ticker = normalize_ticker(symbol)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail={"code": "invalid_ticker", "message": str(exc)}) from exc
    raise HTTPException(
        status_code=410,
        detail={"code": "legacy_forecast_retired", "ticker": ticker, "message": "Use /api/ml/analysis/{ticker}; this legacy endpoint returned unvalidated model output."},
    )
