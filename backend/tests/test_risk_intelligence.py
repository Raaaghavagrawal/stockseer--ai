"""Deterministic offline tests for ticker-specific risk calculations."""
import os
import sys
import unittest

import numpy as np
import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from risk_intelligence import (  # noqa: E402
    build_analysis,
    build_features,
    calculate_risk,
    clean_history,
    evaluate_forecast,
    normalize_ticker,
)


def history(seed: int, daily_scale: float, rows: int = 520) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    returns = rng.normal(0.0002, daily_scale, rows)
    close = 100 * np.cumprod(1 + returns)
    index = pd.bdate_range("2022-01-03", periods=rows, tz="UTC")
    return pd.DataFrame({
        "Open": close * (1 - returns * 0.2),
        "High": close * 1.05,
        "Low": close * 0.95,
        "Close": close,
        "Adj Close": close,
        "Volume": rng.integers(100_000, 2_000_000, rows),
    }, index=index)


class TestRiskIntelligence(unittest.TestCase):
    def test_normalizes_and_validates_tickers(self):
        self.assertEqual(normalize_ticker(" tcs.ns "), "TCS.NS")
        self.assertEqual(normalize_ticker("^nsei"), "^NSEI")
        for invalid in ("", "RELIANCE/NS", "A" * 25):
            with self.subTest(invalid=invalid), self.assertRaises(ValueError):
                normalize_ticker(invalid)

    def test_clean_history_orders_deduplicates_and_drops_invalid_candles(self):
        data = history(1, 0.01, rows=40)
        duplicate = pd.concat([data, data.iloc[[4]]])
        invalid = duplicate.iloc[[6]].copy()
        invalid["High"] = invalid["Low"] * 0.5
        raw = pd.concat([duplicate, invalid])
        clean, metadata = clean_history(raw, "TCS.NS")
        self.assertTrue(clean.index.is_monotonic_increasing)
        self.assertEqual(clean.index.nunique(), len(clean))
        self.assertGreaterEqual(metadata["duplicate_timestamps_removed"], 1)
        self.assertGreaterEqual(metadata["dropped_observations"], 1)

    def test_risk_responds_to_distinct_ticker_histories(self):
        calm, _ = clean_history(history(10, 0.006), "TCS.NS")
        volatile, _ = clean_history(history(20, 0.035), "RELIANCE.NS")
        calm_risk = calculate_risk(calm)
        volatile_risk = calculate_risk(volatile)
        self.assertNotAlmostEqual(calm_risk["metrics"]["annualized_volatility"], volatile_risk["metrics"]["annualized_volatility"], places=2)
        self.assertNotEqual(calm_risk["metrics"]["max_drawdown"], volatile_risk["metrics"]["max_drawdown"])
        self.assertEqual(set(calm_risk["components"]), {"volatility", "drawdown", "historical_var_95"})
        self.assertTrue(all(abs(item["weight"] - 1 / 3) < 1e-12 for item in calm_risk["components"].values()))

    def test_forecast_features_are_available_at_forecast_origin(self):
        data, _ = clean_history(history(30, 0.015, rows=400), "INFY.NS")
        features = build_features(data)
        expected_return = data["AdjClose"].pct_change(fill_method=None).iloc[-1]
        self.assertAlmostEqual(features["return_1d"].iloc[-1], expected_return)
        result = evaluate_forecast(data, 5)
        self.assertIn(result["status"], {"validated", "experimental"})
        self.assertGreaterEqual(result["evaluation"]["samples"], 30)
        if result["status"] == "experimental":
            self.assertIsNone(result["estimate_return"])
            self.assertFalse(result["evaluation"]["passed_criteria"])

    def test_analysis_metadata_is_bound_to_requested_ticker(self):
        data = history(50, 0.012)
        result = build_analysis("INFY.NS", data, "2y", 5)
        self.assertEqual(result["ticker"], "INFY.NS")
        self.assertEqual(result["analysis_version"], "risk-v1")
        self.assertEqual(result["data_quality"]["source"], "Yahoo Finance via yfinance")
        self.assertEqual(result["forecast"]["horizon_sessions"], 5)

    def test_stale_market_data_withholds_forecast_estimate(self):
        data = history(51, 0.012)
        retrieved = pd.Timestamp.now(tz="UTC").to_pydatetime()
        data.index = data.index - pd.Timedelta(days=20)
        result = build_analysis("INFY.NS", data, "2y", 5, retrieved_at=retrieved)
        self.assertEqual(result["data_quality"]["freshness"], "stale")
        self.assertIsNone(result["forecast"]["estimate_return"])

    def test_short_history_does_not_return_zero_risk(self):
        data, _ = clean_history(history(60, 0.01, rows=50), "AAPL")
        risk = calculate_risk(data)
        self.assertIsNone(risk["score"])
        self.assertEqual(risk["classification"], "Unavailable")

    def test_unsupported_horizon_is_rejected(self):
        data, _ = clean_history(history(70, 0.01), "MSFT")
        with self.assertRaises(ValueError):
            evaluate_forecast(data, 3)


if __name__ == "__main__":
    unittest.main()
