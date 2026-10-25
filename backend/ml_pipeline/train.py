"""Run the same chronological evaluation used by the Risk Analysis API.

No artifact is written: Render's local filesystem is not assumed to be durable,
and this small ridge model is refit from validated history and cached in memory.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

import yfinance as yf

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from risk_intelligence import build_analysis, normalize_ticker  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description="Evaluate a ticker-specific ridge return model against a zero-return baseline.")
    parser.add_argument("--ticker", required=True, help="Yahoo Finance ticker, for example TCS.NS or AAPL")
    parser.add_argument("--period", choices=("1y", "2y", "5y"), default="5y")
    parser.add_argument("--horizon", type=int, choices=(1, 5, 20), default=5)
    args = parser.parse_args()
    ticker = normalize_ticker(args.ticker)
    raw = yf.Ticker(ticker).history(period=args.period, interval="1d", auto_adjust=False, actions=True)
    if raw is None or raw.empty:
        print(json.dumps({"status": "unavailable", "ticker": ticker, "reason": "No historical market data was returned."}))
        return 2
    result = build_analysis(ticker, raw, args.period, args.horizon)
    report = {
        "ticker": ticker,
        "period": args.period,
        "forecast": result["forecast"],
        "data_quality": result["data_quality"],
    }
    print(json.dumps(report, indent=2, allow_nan=False))
    return 0 if result["forecast"]["evaluation"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
