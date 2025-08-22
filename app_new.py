import streamlit as st
import pandas as pd
import plotly.graph_objs as go
from plotly.subplots import make_subplots
import yfinance as yf
import ta
import numpy as np
import numpy_financial as npf
import requests
from bs4 import BeautifulSoup
from urllib.parse import quote_plus, urlparse
import os
from dotenv import load_dotenv
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import time
from datetime import datetime, timedelta
import json
from streamlit_lottie import st_lottie
import plotly.express as px
import random

# --- HELPER FUNCTIONS ---
def create_custom_alert(message, alert_type="info"):
    """Create a custom styled alert"""
    return f"""
        <div class="custom-alert alert-{alert_type}">
            {message}
        </div>
    """

def create_tooltip(content, tooltip_text):
    """Create a tooltip with custom styling"""
    return f"""
        <div class="tooltip">
            {content}
            <span class="tooltiptext">{tooltip_text}</span>
        </div>
    """

def generate_market_simulation(years, initial_value, volatility=0.15, growth_rate=0.08):
    """Generate simulated market data for visualization"""
    dates = pd.date_range(start=datetime.now(), periods=years*252, freq='B')
    returns = np.random.normal(growth_rate/252, volatility/np.sqrt(252), len(dates))
    price = initial_value * (1 + returns).cumprod()
    return pd.Series(price, index=dates)

# --- PAGE CONFIG ---
st.set_page_config(page_title="StockSeer.AI", layout="wide", page_icon="📈") 

# --- DARK MODE TOGGLE ---
if 'dark_mode' not in st.session_state:
    st.session_state.dark_mode = True

# --- LOAD ENVIRONMENT VARIABLES (for API Key) ---
load_dotenv()
NEWS_API_KEY = os.getenv("NEWS_API_KEY")

# --- MARKET CONFIGURATIONS ---
MARKET_CONFIGS = {
    "Indian": {
        "stocks": [
            "TCS.NS", "RELIANCE.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS",
            "HINDUNILVR.NS", "BHARTIARTL.NS", "ITC.NS", "SBIN.NS", "LT.NS",
            "WIPRO.NS", "HCLTECH.NS", "ASIANPAINT.NS", "AXISBANK.NS", "MARUTI.NS"
        ],
        "currency": "INR",
        "currency_symbol": "₹",
        "default_ticker": "TCS.NS",
        "exchange": "NSE",
        "retirement_age": 60,
        "life_expectancy": 75,
        "inflation_rate": 0.06,
        "market_return": 0.12,
        "risk_free_rate": 0.07,
        "tax_brackets": [
            {"limit": 250000, "rate": 0},
            {"limit": 500000, "rate": 0.05},
            {"limit": 750000, "rate": 0.10},
            {"limit": 1000000, "rate": 0.15},
            {"limit": 1250000, "rate": 0.20},
            {"limit": float('inf'), "rate": 0.30}
        ]
    },
    "US": {
        "stocks": [
            "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", 
            "JPM", "V", "JNJ", "LLY", 
            "PG", "COST", "XOM"
        ],
        "currency": "USD",
        "currency_symbol": "$",
        "default_ticker": "AAPL",
        "exchange": "NASDAQ/NYSE",
        "retirement_age": 65,
        "life_expectancy": 80,
        "inflation_rate": 0.03,
        "market_return": 0.10,
        "risk_free_rate": 0.04,
        "tax_brackets": [
            {"limit": 10000, "rate": 0.10},
            {"limit": 40000, "rate": 0.12},
            {"limit": 85000, "rate": 0.22},
            {"limit": 165000, "rate": 0.24},
            {"limit": 210000, "rate": 0.32},
            {"limit": float('inf'), "rate": 0.35}
        ]
    }
}

# --- SESSION STATE INITIALIZATION ---
if 'selected_market' not in st.session_state: st.session_state.selected_market = "Indian"
if 'chat_history' not in st.session_state: st.session_state.chat_history = []
if 'current_ticker_for_chat' not in st.session_state: st.session_state.current_ticker_for_chat = ""
if 'stock_notes' not in st.session_state: st.session_state.stock_notes = {}

# --- ASSET PATHS ---
APP_ICON_SIDEBAR_PATH = "assets/app_icon_sidebar.png"
APP_LOGO_MAIN_PATH = "assets/app_icon_main.png"
LOTTIE_LOADER_PATH = "assets/loader_orb.json"  
NEWSAPI_LOGO_PATH = "assets/newsapi_logo.png"
GOOGLE_NEWS_LOGO_PATH = "assets/google_news_logo.png"
YAHOO_FINANCE_LOGO_PATH = "assets/yahoo_finance_logo.png"
DEFAULT_COMPANY_ICON_PATH = "assets/default_company_icon.png"

# --- LOTTIE HELPER ---
@st.cache_data
def load_lottiefile(filepath: str):
    try:
        with open(filepath, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Lottie/Asset file not found: {filepath}")
        return None
    except json.JSONDecodeError:
        print(f"Error decoding Lottie JSON: {filepath}")
        return None

# --- SENTIMENT MODELS ---
@st.cache_resource
def load_vader_sentiment_analyzer():
    return SentimentIntensityAnalyzer()
vader_analyzer = load_vader_sentiment_analyzer()

@st.cache_data(show_spinner=False)
def analyze_sentiment_text(text):
    if not text or not isinstance(text, str) or not text.strip():
        return {"label": "NEUTRAL", "score": 0.0, "compound": 0.0}
    vs = vader_analyzer.polarity_scores(text)
    compound_score = vs['compound']
    label = "POSITIVE" if compound_score >= 0.05 else "NEGATIVE" if compound_score <= -0.05 else "NEUTRAL"
    return {"label": label, "score": compound_score, "compound": compound_score}

# --- STYLING ---
st.markdown("""
    <style>
    /* Base Theme */
    :root {
        --primary-color: #39ff14;
        --bg-color: """ + ("#0a0a0a" if st.session_state.dark_mode else "#ffffff") + """;
        --text-color: """ + ("#e0e0e0" if st.session_state.dark_mode else "#1a1a1a") + """;
        --card-bg: """ + ("#1a1a1a" if st.session_state.dark_mode else "#f5f5f5") + """;
        --hover-color: """ + ("#2b2b2b" if st.session_state.dark_mode else "#e0e0e0") + """;
    }
</style>
""") 