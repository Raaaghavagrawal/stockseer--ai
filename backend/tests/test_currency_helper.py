"""Unit tests for get_currency_for_symbol helper in utils.py.

These tests exercise ONLY the suffix-based fallback (_get_currency_from_suffix),
not the live yfinance path, so they run offline and fast.
"""
import sys
import os

# Allow importing utils directly without installing the package
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import unittest
from unittest.mock import patch
from utils import _get_currency_from_suffix, get_currency_for_symbol, _currency_cache
from datetime import datetime, timedelta


# ---------------------------------------------------------------------------
# Suffix-based lookup (pure, offline)
# ---------------------------------------------------------------------------

class TestGetCurrencyFromSuffix(unittest.TestCase):
    def test_nse_india(self):
        self.assertEqual(_get_currency_from_suffix("RELIANCE.NS"), "INR")

    def test_bse_india(self):
        self.assertEqual(_get_currency_from_suffix("RELIANCE.BO"), "INR")

    def test_tcs_nse(self):
        self.assertEqual(_get_currency_from_suffix("TCS.NS"), "INR")

    def test_us_stock_no_suffix(self):
        self.assertEqual(_get_currency_from_suffix("AAPL"), "USD")

    def test_us_stock_no_suffix_tsla(self):
        self.assertEqual(_get_currency_from_suffix("TSLA"), "USD")

    def test_japanese_stock(self):
        self.assertEqual(_get_currency_from_suffix("7203.T"), "JPY")

    def test_london(self):
        self.assertEqual(_get_currency_from_suffix("HSBA.L"), "GBP")

    def test_toronto(self):
        self.assertEqual(_get_currency_from_suffix("SHOP.TO"), "CAD")

    def test_australian(self):
        self.assertEqual(_get_currency_from_suffix("CBA.AX"), "AUD")

    def test_frankfurt(self):
        self.assertEqual(_get_currency_from_suffix("BMW.DE"), "EUR")

    def test_paris(self):
        self.assertEqual(_get_currency_from_suffix("AIR.PA"), "EUR")

    def test_hong_kong(self):
        self.assertEqual(_get_currency_from_suffix("0700.HK"), "HKD")

    def test_singapore(self):
        self.assertEqual(_get_currency_from_suffix("D05.SI"), "SGD")

    def test_korea(self):
        self.assertEqual(_get_currency_from_suffix("005930.KS"), "KRW")

    def test_unknown_suffix(self):
        # Unknown suffix should default to USD
        self.assertEqual(_get_currency_from_suffix("XYZ.ZZ"), "USD")

    def test_case_insensitive(self):
        self.assertEqual(_get_currency_from_suffix("reliance.ns"), "INR")


# ---------------------------------------------------------------------------
# get_currency_for_symbol with cache (no network call)
# ---------------------------------------------------------------------------

class TestGetCurrencyForSymbolCached(unittest.TestCase):
    @patch("utils.yf.Ticker", side_effect=RuntimeError("offline test"))
    def test_suffix_fallbacks_without_provider(self, _ticker):
        expected = {
            "RELIANCE.NS": "INR",
            "AAPL": "USD",
            "7203.T": "JPY",
            "XYZ.ZZ": "USD",
        }
        for symbol, currency in expected.items():
            with self.subTest(symbol=symbol):
                _currency_cache.pop(symbol, None)
                self.assertEqual(get_currency_for_symbol(symbol), currency)

    def test_returns_cached_value(self):
        """If cache has a valid entry, return it without calling yfinance."""
        # Pre-populate cache
        _currency_cache["TEST_CACHED"] = ("INR", datetime.now() + timedelta(hours=1))
        result = get_currency_for_symbol("test_cached")
        self.assertEqual(result, "INR")

    @patch("utils.yf.Ticker", side_effect=RuntimeError("offline test"))
    def test_expired_cache_falls_through(self, _ticker):
        """Expired cache entry should fall through to suffix lookup."""
        _currency_cache["AAPL"] = ("XYZ", datetime.now() - timedelta(hours=1))
        # yfinance may or may not respond in unit test environment;
        # either way we should get back a valid ISO code (not "XYZ")
        # We just verify it doesn't return the expired value.
        result = get_currency_for_symbol("AAPL")
        self.assertNotEqual(result, "XYZ")


if __name__ == "__main__":
    unittest.main()
