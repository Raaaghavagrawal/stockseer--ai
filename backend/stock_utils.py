import yfinance as yf
import pandas as pd
import ta
import numpy as np
import asyncio
from datetime import datetime, timedelta

# --- Data Fetching and Processing ---

# --- GLOBAL YFINANCE SESSION ---
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

def create_yf_session():
    session = requests.Session()
    retries = Retry(total=3, backoff_factor=0.5, status_forcelist=[429, 500, 502, 503, 504])
    adapter = HTTPAdapter(max_retries=retries)
    session.mount('https://', adapter)
    session.mount('http://', adapter)
    return session

YF_SESSION = create_yf_session()

async def fetch_stock_data_async(ticker_symbol, period='3mo', interval='1d'):
    """Fetch stock data asynchronously using threads for yfinance"""
    def _fetch():
        stock = yf.Ticker(ticker_symbol, session=YF_SESSION)
        df = stock.history(period=period, interval=interval)
        df.dropna(inplace=True)
        return df
    return await asyncio.to_thread(_fetch)

async def add_technical_indicators_async(df):
    """Add technical indicators asynchronously"""
    def _calc(df_in):
        if df_in.empty or 'Close' not in df_in.columns:
            return pd.DataFrame()
        df_ta = df_in.copy()
        df_ta['SMA_20'] = ta.trend.sma_indicator(df_ta['Close'], window=20)
        df_ta['RSI'] = ta.momentum.rsi(df_ta['Close'], window=14)
        df_ta['MACD'] = ta.trend.macd_diff(df_ta['Close'])
        return df_ta
    return await asyncio.to_thread(_calc, df)

async def generate_signal_basic_async(df):
    """Generate basic trading signal asynchronously"""
    def _signal(df_in):
        if df_in.empty or not all(k in df_in.columns for k in ['RSI', 'MACD']):
            return "N/A"
        latest = df_in.iloc[-1]
        if pd.isna(latest['RSI']) or pd.isna(latest['MACD']):
            return "N/A"
        if latest['RSI'] < 30 and latest['MACD'] > 0:
            return "BUY"
        elif latest['RSI'] > 70 and latest['MACD'] < 0:
            return "SELL"
        else:
            return "HOLD"
    return await asyncio.to_thread(_signal, df)

async def generate_signal_detailed_async(df):
    """Generate detailed trading signal with reasoning asynchronously"""
    def _signal(df_in):
        if df_in.empty or not all(k in df_in.columns for k in ['RSI', 'MACD', 'SMA_20', 'Close']) or len(df_in) < 20:
            return "N/A", "Insufficient data for detailed signal generation (need ~20 days)."
        latest = df_in.iloc[-1]
        if len(df_in) < 2: return "N/A", "Not enough data for crossover signal logic."
        previous = df_in.iloc[-2] 
        rsi_val = latest['RSI']; macd_hist_val = latest['MACD']
        try:
            macd_line_series = ta.trend.macd(df_in['Close'])
            macd_signal_series = ta.trend.macd_signal(df_in['Close'])
            if len(macd_line_series) < 2 or len(macd_signal_series) < 2: return "N/A", "Not enough data for MACD line calculation."
            macd_line_val = macd_line_series.iloc[-1]; macd_signal_line_val = macd_signal_series.iloc[-1]
            prev_macd_line = macd_line_series.iloc[-2]; prev_macd_signal_line = macd_signal_series.iloc[-2]
        except Exception as e: return "N/A", f"Error calculating MACD lines: {e}"
        close_price = latest['Close']; sma20 = latest['SMA_20']
        reasons = []; buy_score = 0; sell_score = 0
        if pd.isna(rsi_val) or pd.isna(macd_hist_val) or pd.isna(macd_line_val) or pd.isna(macd_signal_line_val) or pd.isna(sma20):
            return "N/A", "Indicator data has NaNs."
        if rsi_val < 30: reasons.append(f"RSI ({rsi_val:.2f}) is in oversold territory (<30)."); buy_score += 2
        elif rsi_val < 40: reasons.append(f"RSI ({rsi_val:.2f}) is approaching oversold (<40)."); buy_score += 1
        elif rsi_val > 70: reasons.append(f"RSI ({rsi_val:.2f}) is in overbought territory (>70)."); sell_score += 2
        elif rsi_val > 60: reasons.append(f"RSI ({rsi_val:.2f}) is approaching overbought (>60)."); sell_score += 1
        else: reasons.append(f"RSI ({rsi_val:.2f}) is neutral (30-70).")
        if macd_line_val > macd_signal_line_val and prev_macd_line <= prev_macd_signal_line: reasons.append(f"MACD Line ({macd_line_val:.2f}) crossed above Signal Line ({macd_signal_line_val:.2f}) (Bullish Crossover)."); buy_score += 2
        elif macd_line_val < macd_signal_line_val and prev_macd_line >= prev_macd_signal_line: reasons.append(f"MACD Line ({macd_line_val:.2f}) crossed below Signal Line ({macd_signal_line_val:.2f}) (Bearish Crossover)."); sell_score += 2
        elif macd_line_val > macd_signal_line_val: reasons.append(f"MACD Line ({macd_line_val:.2f}) is above Signal Line ({macd_signal_line_val:.2f}) (Bullish)."); buy_score +=1
        elif macd_line_val < macd_signal_line_val: reasons.append(f"MACD Line ({macd_line_val:.2f}) is below Signal Line ({macd_signal_line_val:.2f}) (Bearish)."); sell_score +=1
        if macd_hist_val > 0: reasons.append(f"MACD Histogram ({macd_hist_val:.2f}) is positive (Bullish momentum)."); buy_score += 0.5
        elif macd_hist_val < 0: reasons.append(f"MACD Histogram ({macd_hist_val:.2f}) is negative (Bearish momentum)."); sell_score += 0.5
        if close_price > sma20: reasons.append(f"Price (${close_price:.2f}) is above 20-Day SMA (${sma20:.2f}) (Short-term uptrend)."); buy_score += 1
        elif close_price < sma20: reasons.append(f"Price (${close_price:.2f}) is below 20-Day SMA (${sma20:.2f}) (Short-term downtrend)."); sell_score += 1
        final_signal = "HOLD"
        if buy_score > sell_score + 1.5 : final_signal = "STRONG BUY"
        elif sell_score > buy_score + 1.5: final_signal = "STRONG SELL"
        elif buy_score > sell_score : final_signal = "BUY"
        elif sell_score > buy_score: final_signal = "SELL"
        return final_signal, " ".join(reasons) if reasons else "Neutral signals or insufficient conviction."
    return await asyncio.to_thread(_signal, df)

async def get_company_info_async(ticker_symbol):
    def _fetch():
        try:
            stock = yf.Ticker(ticker_symbol, session=YF_SESSION)
            info = stock.info
            if not info: return "Info not available.", "N/A", "N/A", None, "N/A", {}
            return (info.get('longBusinessSummary', "No summary available via yfinance API."), info.get('sector', 'N/A'), info.get('industry', 'N/A'),
                    info.get('marketCap'), info.get('exchange', 'N/A'), info)
        except Exception as e:
            return (f"yfinance info retrieval failed: {e}", "N/A", "N/A", None, "N/A", {})
    return await asyncio.to_thread(_fetch)

# Keeping backwards compatibility wrappers for old synchronous calls if any are missed
def fetch_stock_data(*args, **kwargs):
    return asyncio.run(fetch_stock_data_async(*args, **kwargs))
    
def add_technical_indicators(*args, **kwargs):
    return asyncio.run(add_technical_indicators_async(*args, **kwargs))

def generate_signal_basic(*args, **kwargs):
    return asyncio.run(generate_signal_basic_async(*args, **kwargs))

def generate_signal_detailed(*args, **kwargs):
    return asyncio.run(generate_signal_detailed_async(*args, **kwargs))

def get_company_info_yfinance(*args, **kwargs):
    # This matches the signature expected by app.py
    import pandas as pd
    try:
        stock = yf.Ticker(args[0], session=YF_SESSION)
        info = stock.info
        if not info: return "Info not available.", "N/A", "N/A", None, "N/A", {}, pd.DataFrame(), pd.DataFrame(), None, None, pd.DataFrame(), pd.DataFrame()
        return (info.get('longBusinessSummary', "No summary available."), info.get('sector', 'N/A'), info.get('industry', 'N/A'),
                info.get('marketCap'), info.get('exchange', 'N/A'), info,
                pd.DataFrame(), pd.DataFrame(), None, None, pd.DataFrame(), pd.DataFrame())
    except:
        return ("Failed", "N/A", "N/A", None, "N/A", {}, pd.DataFrame(), pd.DataFrame(), None, None, pd.DataFrame(), pd.DataFrame())

def get_company_profile_scraping(*args, **kwargs): return "Migrated"
def get_stock_news_feedparser(*args, **kwargs): return [], "Migrated"
def plot_stock_chart_simple(df, symbol): return {'x':[], 'y':[], 'sma_20':[]}
