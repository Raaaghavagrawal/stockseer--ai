import pandas as pd
import plotly.graph_objs as go
from plotly.subplots import make_subplots
import yfinance as yf
import ta
import numpy as np
import numpy_financial as npf
from transformers import pipeline
import requests
from bs4 import BeautifulSoup
from urllib.parse import quote_plus, urlparse
import os
from dotenv import load_dotenv
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import time
from datetime import datetime, timedelta
import json
import plotly.express as px
import random
import re

# FastAPI imports
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn

# Rate limiting for Yahoo Finance API
import time
from datetime import datetime, timedelta

# Import utility modules
from stock_utils import (
    fetch_stock_data, add_technical_indicators, generate_signal_basic, 
    generate_signal_detailed, get_company_info_yfinance, 
    get_company_profile_scraping, get_stock_news_feedparser, plot_stock_chart_simple
)
from news_utils import (
    get_stock_news_from_newsapi, scrape_google_news, scrape_yahoo_finance_news, add_sentiment_to_news_items
)
from signal_utils import (
    generate_signal
)
from utils import (
    get_currency_symbol, format_large_number, get_about_stock_info,
    format_fundamentals, calculate_percentage_change, format_percentage_change,
    validate_ticker_symbol, get_market_status, calculate_risk_metrics,
    format_timestamp, sanitize_text
)
from logo_utils import (
    get_company_logo_url, is_valid_url, extract_domain
)
from about_tab import (
    render_about_tab
)
import os
from dotenv import load_dotenv
try:
    import google.generativeai as genai
except Exception:
    genai = None

# --- MARKET CONFIGURATIONS ---
market_options = {
    "Indian": {
        "suffix": ".NS", 
        "currency": "INR", 
        "timezone": "Asia/Kolkata", 
        "index": "^BSESN",
        "stocks": ["TCS.NS", "RELIANCE.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS"],
        "default_ticker": "RELIANCE.NS",
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
        "suffix": "", 
        "currency": "USD", 
        "timezone": "America/New_York", 
        "index": "^GSPC",
        "stocks": ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA"],
        "default_ticker": "AAPL",
        "exchange": "NASDAQ",
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
    },
    "Chinese": {
        "suffix": ".SS",
        "currency": "CNY",
        "timezone": "Asia/Shanghai",
        "index": "000001.SS",
        "stocks": ["600519.SS", "601398.SS", "601988.SS", "601288.SS", "601628.SS"],
        "default_ticker": "600519.SS",
        "exchange": "SSE",
        "retirement_age": 60, "life_expectancy": 77, "inflation_rate": 0.03,
        "market_return": 0.09, "risk_free_rate": 0.03
    },
    "Dutch": {
        "suffix": ".AS",
        "currency": "EUR",
        "timezone": "Europe/Amsterdam",
        "index": "^AEX",
        "stocks": ["ASML.AS", "SHEL.AS", "UNA.AS", "INGA.AS", "AD.AS"],
        "default_ticker": "ASML.AS",
        "exchange": "Euronext Amsterdam",
        "retirement_age": 67, "life_expectancy": 82, "inflation_rate": 0.02,
        "market_return": 0.08, "risk_free_rate": 0.025
    },
    "UAE": {
        "suffix": ".AE",
        "currency": "AED",
        "timezone": "Asia/Dubai",
        "index": "^ADI",
        "stocks": ["IHC.AE", "FAB.AE", "EMIRATESNBD.DU", "ADCB.AE", "Emaar.DU"],
        "default_ticker": "IHC.AE",
        "exchange": "ADX/DFM",
        "retirement_age": 60, "life_expectancy": 78, "inflation_rate": 0.02,
        "market_return": 0.07, "risk_free_rate": 0.03
    },
    "Saudi Arabian": {
        "suffix": ".SR",
        "currency": "SAR",
        "timezone": "Asia/Riyadh",
        "index": "^TASI",
        "stocks": ["2222.SR", "1120.SR", "7010.SR", "1180.SR", "4002.SR"],
        "default_ticker": "2222.SR",
        "exchange": "Tadawul",
        "retirement_age": 60, "life_expectancy": 75, "inflation_rate": 0.025,
        "market_return": 0.08, "risk_free_rate": 0.035
    },
    "Qatari": {
        "suffix": ".QA",
        "currency": "QAR",
        "timezone": "Asia/Qatar",
        "index": "^QSI",
        "stocks": ["QNBK.QA", "IQCD.QA", "QIBK.QA", "CBQK.QA", "ORDS.QA"],
        "default_ticker": "QNBK.QA",
        "exchange": "QE",
        "retirement_age": 60, "life_expectancy": 80, "inflation_rate": 0.02,
        "market_return": 0.07, "risk_free_rate": 0.03
    },
    "UK": {
        "suffix": ".L", 
        "currency": "GBP", 
        "timezone": "Europe/London", 
        "index": "^FTSE",
        "stocks": ["BARC.L", "HSBA.L", "BP.L", "SHEL.L", "GSK.L"],
        "default_ticker": "SHEL.L",
        "exchange": "LSE",
        "retirement_age": 66,
        "life_expectancy": 81,
        "inflation_rate": 0.02,
        "market_return": 0.08,
        "risk_free_rate": 0.03
    },
    "Japanese": {
        "suffix": ".T", 
        "currency": "JPY", 
        "timezone": "Asia/Tokyo", 
        "index": "^N225",
        "stocks": ["7203.T", "9432.T", "9984.T", "6758.T", "8058.T"],
        "default_ticker": "7203.T",
        "exchange": "TSE",
        "retirement_age": 65,
        "life_expectancy": 84,
        "inflation_rate": 0.01,
        "market_return": 0.06,
        "risk_free_rate": 0.02
    },
    "German": {
        "suffix": ".DE", 
        "currency": "EUR", 
        "timezone": "Europe/Berlin", 
        "index": "^GDAXI",
        "stocks": ["BMW.DE", "SAP.DE", "SIE.DE", "ALV.DE", "BAS.DE"],
        "default_ticker": "SAP.DE",
        "exchange": "XETRA",
        "retirement_age": 67,
        "life_expectancy": 81,
        "inflation_rate": 0.02,
        "market_return": 0.07,
        "risk_free_rate": 0.02
    },
    "Australian": {
        "suffix": ".AX", 
        "currency": "AUD", 
        "timezone": "Australia/Sydney", 
        "index": "^AXJO",
        "stocks": ["BHP.AX", "CBA.AX", "NAB.AX", "CSL.AX", "WBC.AX"],
        "default_ticker": "BHP.AX",
        "exchange": "ASX",
        "retirement_age": 67,
        "life_expectancy": 83,
        "inflation_rate": 0.025,
        "market_return": 0.09,
        "risk_free_rate": 0.03
    },
    "Canadian": {
        "suffix": ".TO",
        "currency": "CAD",
        "timezone": "America/Toronto",
        "index": "^GSPTSE",
        "stocks": ["RY.TO", "TD.TO", "ENB.TO", "CNR.TO", "BAM.TO"],
        "default_ticker": "RY.TO",
        "exchange": "TSX",
        "retirement_age": 65,
        "life_expectancy": 82,
        "inflation_rate": 0.02,
        "market_return": 0.08,
        "risk_free_rate": 0.03
    },
    "Hong Kong": {
        "suffix": ".HK",
        "currency": "HKD",
        "timezone": "Asia/Hong_Kong",
        "index": "^HSI",
        "stocks": ["0700.HK", "0941.HK", "0005.HK", "1299.HK", "0388.HK"],
        "default_ticker": "0700.HK",
        "exchange": "HKEX",
        "retirement_age": 65,
        "life_expectancy": 85,
        "inflation_rate": 0.025,
        "market_return": 0.08,
        "risk_free_rate": 0.02
    },
    "Swiss": {
        "suffix": ".SW",
        "currency": "CHF",
        "timezone": "Europe/Zurich",
        "index": "^SSMI",
        "stocks": ["NESN.SW", "ROG.SW", "NOVN.SW", "UHR.SW", "ZURN.SW"],
        "default_ticker": "NESN.SW",
        "exchange": "SIX",
        "retirement_age": 65,
        "life_expectancy": 84,
        "inflation_rate": 0.01,
        "market_return": 0.07,
        "risk_free_rate": 0.02
    },
    "South Korean": {
        "suffix": ".KS",
        "currency": "KRW",
        "timezone": "Asia/Seoul",
        "index": "^KS11",
        "stocks": ["005930.KS", "000660.KS", "051910.KS", "035420.KS", "005380.KS"],
        "default_ticker": "005930.KS",
        "exchange": "KRX",
        "retirement_age": 62,
        "life_expectancy": 83,
        "inflation_rate": 0.02,
        "market_return": 0.09,
        "risk_free_rate": 0.03
    },
    "Brazilian": {
        "suffix": ".SA",
        "currency": "BRL",
        "timezone": "America/Sao_Paulo",
        "index": "^BVSP",
        "stocks": ["PETR4.SA", "VALE3.SA", "ITUB4.SA", "BBDC4.SA", "B3SA3.SA"],
        "default_ticker": "PETR4.SA",
        "exchange": "B3",
        "retirement_age": 65,
        "life_expectancy": 76,
        "inflation_rate": 0.04,
        "market_return": 0.11,
        "risk_free_rate": 0.05
    },
    "Singapore": {
        "suffix": ".SI",
        "currency": "SGD",
        "timezone": "Asia/Singapore",
        "index": "^STI",
        "stocks": ["D05.SI", "O39.SI", "U11.SI", "C6L.SI", "Z74.SI"],
        "default_ticker": "D05.SI",
        "exchange": "SGX",
        "retirement_age": 63,
        "life_expectancy": 84,
        "inflation_rate": 0.02,
        "market_return": 0.08,
        "risk_free_rate": 0.03
    },
    "French": {
        "suffix": ".PA",
        "currency": "EUR",
        "timezone": "Europe/Paris",
        "index": "^FCHI",
        "stocks": ["AI.PA", "BNP.PA", "MC.PA", "OR.PA", "SU.PA"],
        "default_ticker": "MC.PA",
        "exchange": "Euronext Paris",
        "retirement_age": 62,
        "life_expectancy": 83,
        "inflation_rate": 0.02,
        "market_return": 0.07,
        "risk_free_rate": 0.02
    },
    "Italian": {
        "suffix": ".MI",
        "currency": "EUR",
        "timezone": "Europe/Rome",
        "index": "^FTMIB",
        "stocks": ["ENI.MI", "ISP.MI", "UCG.MI", "ENEL.MI", "STM.MI"],
        "default_ticker": "ENI.MI",
        "exchange": "Borsa Italiana",
        "retirement_age": 67,
        "life_expectancy": 83,
        "inflation_rate": 0.015,
        "market_return": 0.065,
        "risk_free_rate": 0.02
    },
    "Spanish": {
        "suffix": ".MC",
        "currency": "EUR",
        "timezone": "Europe/Madrid",
        "index": "^IBEX",
        "stocks": ["SAN.MC", "IBE.MC", "TEF.MC", "BBVA.MC", "ITX.MC"],
        "default_ticker": "SAN.MC",
        "exchange": "BME",
        "retirement_age": 65,
        "life_expectancy": 84,
        "inflation_rate": 0.02,
        "market_return": 0.07,
        "risk_free_rate": 0.02
    },
    "Swedish": {
        "suffix": ".ST",
        "currency": "SEK",
        "timezone": "Europe/Stockholm",
        "index": "^OMX",
        "stocks": ["ERIC-B.ST", "HM-B.ST", "VOLV-B.ST", "SEB-A.ST", "SAND.ST"],
        "default_ticker": "VOLV-B.ST",
        "exchange": "Nasdaq Stockholm",
        "retirement_age": 65,
        "life_expectancy": 83,
        "inflation_rate": 0.02,
        "market_return": 0.08,
        "risk_free_rate": 0.02
    },
    "Norwegian": {
        "suffix": ".OL",
        "currency": "NOK",
        "timezone": "Europe/Oslo",
        "index": "^OSEAX",
        "stocks": ["DNB.OL", "EQNR.OL", "TEL.OL", "ORK.OL", "YAR.OL"],
        "default_ticker": "EQNR.OL",
        "exchange": "Oslo Børs",
        "retirement_age": 67,
        "life_expectancy": 83,
        "inflation_rate": 0.02,
        "market_return": 0.08,
        "risk_free_rate": 0.03
    },
    "Danish": {
        "suffix": ".CO",
        "currency": "DKK",
        "timezone": "Europe/Copenhagen",
        "index": "^OMXC20",
        "stocks": ["NOVO-B.CO", "MAERSK-B.CO", "DANSKE.CO", "NZYM-B.CO", "CARL-B.CO"],
        "default_ticker": "NOVO-B.CO",
        "exchange": "Nasdaq Copenhagen",
        "retirement_age": 67,
        "life_expectancy": 81,
        "inflation_rate": 0.015,
        "market_return": 0.075,
        "risk_free_rate": 0.02
    },
    "Finnish": {
        "suffix": ".HE",
        "currency": "EUR",
        "timezone": "Europe/Helsinki",
        "index": "^OMXH25",
        "stocks": ["NOKIA.HE", "SAMPO.HE", "KNEBV.HE", "NESTE.HE", "UPM.HE"],
        "default_ticker": "NOKIA.HE",
        "exchange": "Nasdaq Helsinki",
        "retirement_age": 65,
        "life_expectancy": 82,
        "inflation_rate": 0.02,
        "market_return": 0.075,
        "risk_free_rate": 0.02
    },
    "Israeli": {
        "suffix": ".TA",
        "currency": "ILS",
        "timezone": "Asia/Jerusalem",
        "index": "^TA125",
        "stocks": ["TEVA.TA", "LUMI.TA", "ICL.TA", "NICE.TA", "POLI.TA"],
        "default_ticker": "TEVA.TA",
        "exchange": "TASE",
        "retirement_age": 67,
        "life_expectancy": 83,
        "inflation_rate": 0.015,
        "market_return": 0.08,
        "risk_free_rate": 0.02
    },
    "New Zealand": {
        "suffix": ".NZ",
        "currency": "NZD",
        "timezone": "Pacific/Auckland",
        "index": "^NZ50",
        "stocks": ["FPH.NZ", "SPK.NZ", "MEL.NZ", "CEN.NZ", "MFT.NZ"],
        "default_ticker": "FPH.NZ",
        "exchange": "NZX",
        "retirement_age": 65,
        "life_expectancy": 82,
        "inflation_rate": 0.02,
        "market_return": 0.085,
        "risk_free_rate": 0.03
    },
    "South African": {
        "suffix": ".JO",
        "currency": "ZAR",
        "timezone": "Africa/Johannesburg",
        "index": "^J200",
        "stocks": ["NPN.JO", "BTI.JO", "FSR.JO", "SBK.JO", "AGL.JO"],
        "default_ticker": "NPN.JO",
        "exchange": "JSE",
        "retirement_age": 60,
        "life_expectancy": 64,
        "inflation_rate": 0.045,
        "market_return": 0.12,
        "risk_free_rate": 0.06
    }
}

# For backward compatibility
MARKET_CONFIGS = market_options

# --- ASSET PATHS ---
APP_ICON_SIDEBAR_PATH = "assets/app_icon_sidebar.png"
APP_LOGO_MAIN_PATH = "assets/app_icon_main.png"
LOTTIE_LOADER_PATH = "assets/loader_orb.json"  
NEWSAPI_LOGO_PATH = "assets/newsapi_logo.png"
GOOGLE_NEWS_LOGO_PATH = "assets/google_news_logo.png"
YAHOO_FINANCE_LOGO_PATH = "assets/yahoo_finance_logo.png"
DEFAULT_COMPANY_ICON_PATH = "assets/default_company_icon.png"

# --- MARKET REGIONS AND ICONS ---
market_regions = {
    "Asia Pacific": ["Indian", "Japanese", "Australian", "Hong Kong", "South Korean", "Singapore", "New Zealand", "Chinese"],
    "Americas": ["US", "Canadian", "Brazilian"],
    "Europe": ["UK", "German", "French", "Swiss", "Italian", "Spanish", "Swedish", "Norwegian", "Danish", "Finnish", "Dutch"],
    "Middle East & Africa": ["Israeli", "South African", "UAE", "Saudi Arabian", "Qatari"]
}

market_icons = {
    "Indian": "🇮🇳", "US": "🇺🇸", "UK": "🇬🇧", "Chinese": "🇨🇳",
    "Japanese": "🇯🇵", "German": "🇩🇪", "French": "🇫🇷", "Canadian": "🇨🇦",
    "Australian": "🇦🇺", "Brazilian": "🇧🇷", "Singapore": "🇸🇬", "Swiss": "🇨🇭",
    "Dutch": "🇳🇱", "UAE": "🇦🇪", "Saudi Arabian": "🇸🇦", "Qatari": "🇶🇦",
    "Hong Kong": "🇭🇰", "South Korean": "🇰🇷", "Italian": "🇮🇹", "Spanish": "🇪🇸",
    "Swedish": "🇸🇪", "Norwegian": "🇳🇴", "Danish": "🇩🇰", "Finnish": "🇫🇮",
    "Israeli": "🇮🇱", "New Zealand": "🇳🇿", "South African": "🇿🇦"
}

# Simple rate limiter
class RateLimiter:
    def __init__(self, max_requests=10, time_window=60):
        self.max_requests = max_requests
        self.time_window = time_window
        self.requests = []
    
    def acquire(self):
        now = datetime.now()
        # Remove old requests outside the time window
        self.requests = [req_time for req_time in self.requests 
                        if now - req_time < timedelta(seconds=self.time_window)]
        
        if len(self.requests) >= self.max_requests:
            # Wait until we can make another request
            oldest_request = min(self.requests)
            wait_time = self.time_window - (now - oldest_request).seconds + 1
            time.sleep(wait_time)
        
        self.requests.append(now)

# Global rate limiter instance
rate_limiter = RateLimiter(max_requests=8, time_window=60)  # 8 requests per minute

# Simple cache for stock info to reduce API calls
stock_cache = {}
cache_ttl = 300  # 5 minutes cache TTL

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="StockSeer API", version="1.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4173", "http://127.0.0.1:4173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for API requests/responses
class StockData(BaseModel):
    symbol: str
    price: Optional[float] = None
    change: Optional[float] = None
    changePercent: Optional[float] = None
    volume: Optional[int] = None
    marketCap: Optional[float] = None
    pe: Optional[float] = None
    dividend: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    open: Optional[float] = None
    previousClose: Optional[float] = None
    currency: Optional[str] = None

class StockChartData(BaseModel):
    date: str
    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    close: Optional[float] = None
    volume: Optional[int] = None

class TechnicalIndicators(BaseModel):
    sma_20: Optional[float] = None
    rsi: Optional[float] = None
    macd: Optional[float] = None
    macd_signal: Optional[float] = None
    macd_histogram: Optional[float] = None
    

class StockPrediction(BaseModel):
    symbol: str
    predictedPrice: Optional[float] = None
    confidence: Optional[float] = None
    timeframe: str
    reasoning: str
    timestamp: str

class PortfolioHolding(BaseModel):
    symbol: str
    shares: int
    avgPrice: float
    currentPrice: float
    totalValue: float
    gainLoss: float
    gainLossPercent: float

class NewsItem(BaseModel):
    title: str
    summary: str
    url: str
    publishedAt: str
    source: str
    sentiment: str

class StockSearchResult(BaseModel):
    symbol: str
    name: str
    price: Optional[float] = None
    change: Optional[float] = None
    sector: Optional[str] = None
    relevance: Optional[int] = None

# In-memory storage for portfolio (replace with database in production)
portfolio_holdings: Dict[str, PortfolioHolding] = {}

# --- Chatbot (Gemini) ---
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []

class ChatResponse(BaseModel):
    reply: str

def _get_gemini_model():
    if genai is None:
        raise HTTPException(status_code=500, detail="google-generativeai not installed. Add to requirements.")
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Missing GEMINI_API_KEY in environment. Please set it in your .env file.")
    genai.configure(api_key=api_key)
    return genai.GenerativeModel("gemini-1.5-flash")

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest) -> ChatResponse:
    try:
        model = _get_gemini_model()
        system_preamble = (
            "You are StockSeer AI, the assistant for the StockSeer stock analytics platform. "
            "Your scope is strictly limited to: stocks, markets, tickers, charts, indicators, risk metrics, portfolio/alerts/news within the app, and questions about using StockSeer (features, plans, onboarding). "
            "Do not answer general or unrelated questions. If a request is out of scope, reply: 'I can help with stock analysis and StockSeer-related questions only.' "
            "Be concise, accurate, and friendly. This is not financial advice."
        )
        history_text = "\n\n".join([
            ("User: " + m.content) if m.role == "user" else ("Assistant: " + m.content)
            for m in req.history[-12:]
        ])
        prompt = f"""{system_preamble}

{history_text}

User: {req.message}
Assistant:"""
        result = model.generate_content(prompt)
        text = (getattr(result, "text", "") or "").strip()
        if not text:
            text = "I'm sorry, I couldn't generate a response right now. Please try again."
        return ChatResponse(reply=text)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

# --- HELPER FUNCTIONS ---
def get_currency_symbol(currency_code):
    symbols = {
        "USD": "$", "INR": "₹", "EUR": "€", "GBP": "£", "JPY": "¥",
        "CAD": "C$", "AUD": "A$", "CHF": "CHF", "CNY": "¥", 
        "HKD": "HK$", "SGD": "S$", "KRW": "₩", "BRL": "R$", "RUB": "₽",
        "ZAR": "R", "TRY": "₺", "MXN": "Mex$"
    }
    return symbols.get(str(currency_code).upper(), str(currency_code))

def fetch_stock_data(ticker_symbol, period='1y', interval='1d', max_retries=3):
    for attempt in range(max_retries):
        try:
            stock = yf.Ticker(ticker_symbol)
            df = stock.history(period=period, interval=interval)
            df.dropna(inplace=True)
            df.attrs['ticker_symbol'] = ticker_symbol
            
            # Check if we got any data
            if df.empty:
                print(f"Warning: No data returned for {ticker_symbol}")
                return pd.DataFrame()
            
            return df
        except Exception as e:
            print(f"Attempt {attempt + 1} failed for {ticker_symbol}: {e}")
            if "rate limit" in str(e).lower() and attempt < max_retries - 1:
                time.sleep(2 ** attempt)  # Exponential backoff
                continue
            if attempt == max_retries - 1:
                print(f"All attempts failed for {ticker_symbol}")
                return pd.DataFrame()  # Return empty DataFrame instead of raising exception
    return pd.DataFrame()

def add_technical_indicators(df):
    if df.empty or 'Close' not in df.columns:
        return pd.DataFrame()
    
    df_ta = df.copy()
    
    if len(df_ta) > 20:
        df_ta['SMA_20'] = ta.trend.sma_indicator(df_ta['Close'], window=20)
        bb_indicator = ta.volatility.BollingerBands(close=df_ta['Close'], window=20, window_dev=2)
        df_ta['BB_High'] = bb_indicator.bollinger_hband()
        df_ta['BB_Mid'] = bb_indicator.bollinger_mavg()
        df_ta['BB_Low'] = bb_indicator.bollinger_lband()
    else:
        df_ta['SMA_20'], df_ta['BB_High'], df_ta['BB_Mid'], df_ta['BB_Low'] = np.nan, np.nan, np.nan, np.nan
    
    if len(df_ta) > 50:
        df_ta['SMA_50'] = ta.trend.sma_indicator(df_ta['Close'], window=50)
    else:
        df_ta['SMA_50'] = np.nan
    
    if len(df_ta) > 14:
        df_ta['RSI'] = ta.momentum.rsi(df_ta['Close'], window=14)
    else:
        df_ta['RSI'] = np.nan
    
    if len(df_ta) > 34:
        df_ta['MACD_line'] = ta.trend.macd(df_ta['Close'])
        df_ta['MACD_signal'] = ta.trend.macd_signal(df_ta['Close'])
        df_ta['MACD_hist'] = ta.trend.macd_diff(df_ta['Close'])
    else:
        df_ta['MACD_line'], df_ta['MACD_signal'], df_ta['MACD_hist'] = np.nan, np.nan, np.nan
    
    return df_ta

def generate_signal(df, overall_news_sentiment_score=0.0, company_name="the company"):
    MIN_DATA_POINTS = 35
    required_cols = ['RSI', 'MACD_hist', 'SMA_20', 'Close', 'MACD_line', 'MACD_signal']
    
    if df.empty or not all(k in df.columns for k in required_cols) or len(df) < MIN_DATA_POINTS:
        missing_cols = [col for col in required_cols if col not in df.columns]
        reason = f"Insufficient data (need {MIN_DATA_POINTS} days, have {len(df)})."
        if missing_cols:
            reason += f" Missing TAs: {', '.join(missing_cols)}."
        return "N/A", reason
    
    latest = df.iloc[-1]
    previous = df.iloc[-2 if len(df) >= 2 else -1]
    
    rsi_val = latest.get('RSI', np.nan)
    macd_hist_val = latest.get('MACD_hist', np.nan)
    macd_line_val = latest.get('MACD_line', np.nan)
    macd_signal_line_val = latest.get('MACD_signal', np.nan)
    sma20 = latest.get('SMA_20', np.nan)
    close_price = latest.get('Close', np.nan)
    prev_macd_line = previous.get('MACD_line', np.nan)
    prev_macd_signal_line = previous.get('MACD_signal', np.nan)
    
    nan_indicators = [n for n, v in {
        "RSI": rsi_val, "MACD Hist": macd_hist_val, "MACD Line": macd_line_val,
        "MACD Signal": macd_signal_line_val, "SMA20": sma20, "Close": close_price,
        "Prev MACD Line": prev_macd_line, "Prev MACD Signal": prev_macd_signal_line
    }.items() if pd.isna(v)]
    
    if nan_indicators:
        return "N/A", f"Indicator NaNs: {', '.join(nan_indicators)}. Short data period?"
    
    reasons, buy_score, sell_score = [], 0, 0
    
    if rsi_val < 30:
        reasons.append(f"RSI ({rsi_val:.2f}) < 30 (Oversold).")
        buy_score += 2
    elif rsi_val < 40:
        reasons.append(f"RSI ({rsi_val:.2f}) < 40 (Nearing Oversold).")
        buy_score += 1
    elif rsi_val > 70:
        reasons.append(f"RSI ({rsi_val:.2f}) > 70 (Overbought).")
        sell_score += 2
    elif rsi_val > 60:
        reasons.append(f"RSI ({rsi_val:.2f}) > 60 (Nearing Overbought).")
        sell_score += 1
    else:
        reasons.append(f"RSI ({rsi_val:.2f}) is neutral.")
    
    if macd_line_val > macd_signal_line_val and prev_macd_line <= prev_macd_signal_line:
        reasons.append("MACD Bullish Crossover.")
        buy_score += 2
    elif macd_line_val < macd_signal_line_val and prev_macd_line >= prev_macd_signal_line:
        reasons.append("MACD Bearish Crossover.")
        sell_score += 2
    elif macd_line_val > macd_signal_line_val:
        reasons.append("MACD Line > Signal (Bullish).")
        buy_score += 1
    elif macd_line_val < macd_signal_line_val:
        reasons.append("MACD Line < Signal (Bearish).")
        sell_score += 1
    
    if macd_hist_val > 0:
        reasons.append(f"MACD Hist ({macd_hist_val:.2f}) positive.")
        buy_score += 0.5
    elif macd_hist_val < 0:
        reasons.append(f"MACD Hist ({macd_hist_val:.2f}) negative.")
        sell_score += 0.5
    
    if pd.notna(close_price) and pd.notna(sma20):
        if close_price > sma20:
            reasons.append(f"Price > SMA20.")
            buy_score += 1
        elif close_price < sma20:
            reasons.append(f"Price < SMA20.")
            sell_score += 1
    else:
        reasons.append("SMA20 data unavailable for price comparison.")
    
    if overall_news_sentiment_score > 0.2:
        reasons.append(f"News for {company_name} strongly positive ({overall_news_sentiment_score:.2f}).")
        buy_score += 1.5
    elif overall_news_sentiment_score > 0.05:
        reasons.append(f"News for {company_name} mildly positive ({overall_news_sentiment_score:.2f}).")
        buy_score += 0.5
    elif overall_news_sentiment_score < -0.2:
        reasons.append(f"News for {company_name} strongly negative ({overall_news_sentiment_score:.2f}).")
        sell_score += 1.5
    elif overall_news_sentiment_score < -0.05:
        reasons.append(f"News for {company_name} mildly negative ({overall_news_sentiment_score:.2f}).")
        sell_score += 0.5
    else:
        reasons.append(f"News for {company_name} neutral ({overall_news_sentiment_score:.2f}).")
    
    final_signal = "HOLD"
    if not reasons and abs(buy_score - sell_score) <= 1:
        return "HOLD", "Neutral technicals and news sentiment."
    
    if buy_score > sell_score + 2.5:
        final_signal = "STRONG BUY"
    elif sell_score > buy_score + 2.5:
        final_signal = "STRONG SELL"
    elif buy_score > sell_score + 1:
        final_signal = "BUY"
    elif sell_score > buy_score + 1:
        final_signal = "SELL"
    
    return final_signal, " ".join(reasons) if reasons else "Neutral signals, leaning HOLD."

def get_dividend_yield(info):
    """Extract dividend yield from yfinance info, with fallback calculation"""
    # Try direct dividend yield fields first
    dividend_yield = (info.get('dividendYield') or 
                     info.get('trailingAnnualDividendYield') or 
                     info.get('forwardDividendYield'))
    
    if dividend_yield is not None:
        return dividend_yield
    
    # Fallback: calculate from dividend rate and current price
    dividend_rate = (info.get('dividendRate') or 
                    info.get('trailingAnnualDividendRate') or 
                    info.get('forwardAnnualDividendRate'))
    
    current_price = (info.get('regularMarketPrice') or 
                    info.get('currentPrice') or 
                    info.get('previousClose'))
    
    if dividend_rate and current_price and current_price > 0:
        return dividend_rate / current_price
    
    return None

def detect_currency_from_symbol(symbol, info=None):
    """Detect currency based on stock symbol and exchange information"""
    symbol_upper = symbol.upper()
    
    # Check if currency is already provided in info
    if info and info.get('currency'):
        return info.get('currency')
    
    # Indian stocks (NSE/BSE)
    if symbol_upper.endswith('.NS') or symbol_upper.endswith('.BO'):
        return 'INR'
    
    # Japanese stocks (Tokyo Stock Exchange)
    if symbol_upper.endswith('.T') or symbol_upper.endswith('.TO'):
        return 'JPY'
    
    # European stocks
    if symbol_upper.endswith('.L'):  # London Stock Exchange
        return 'GBP'
    if symbol_upper.endswith('.PA'):  # Paris Stock Exchange
        return 'EUR'
    if symbol_upper.endswith('.DE'):  # Frankfurt Stock Exchange
        return 'EUR'
    if symbol_upper.endswith('.AS'):  # Amsterdam Stock Exchange
        return 'EUR'
    if symbol_upper.endswith('.BR'):  # Brussels Stock Exchange
        return 'EUR'
    if symbol_upper.endswith('.MI'):  # Milan Stock Exchange
        return 'EUR'
    if symbol_upper.endswith('.MC'):  # Madrid Stock Exchange
        return 'EUR'
    
    # Canadian stocks
    if symbol_upper.endswith('.TO') or symbol_upper.endswith('.V'):
        return 'CAD'
    
    # Australian stocks
    if symbol_upper.endswith('.AX'):
        return 'AUD'
    
    # Hong Kong stocks
    if symbol_upper.endswith('.HK'):
        return 'HKD'
    
    # Singapore stocks
    if symbol_upper.endswith('.SI'):
        return 'SGD'
    
    # Swiss stocks
    if symbol_upper.endswith('.SW'):
        return 'CHF'
    
    # South Korean stocks
    if symbol_upper.endswith('.KS'):
        return 'KRW'
    
    # Brazilian stocks
    if symbol_upper.endswith('.SA'):
        return 'BRL'
    
    # Mexican stocks
    if symbol_upper.endswith('.MX'):
        return 'MXN'
    
    # Russian stocks
    if symbol_upper.endswith('.ME'):
        return 'RUB'
    
    # Chinese stocks
    if symbol_upper.endswith('.SS') or symbol_upper.endswith('.SZ'):
        return 'CNY'
    
    # Turkish stocks
    if symbol_upper.endswith('.IS'):
        return 'TRY'
    
    # South African stocks
    if symbol_upper.endswith('.JO'):
        return 'ZAR'
    
    # Israeli stocks
    if symbol_upper.endswith('.TA'):
        return 'ILS'
    
    # Thai stocks
    if symbol_upper.endswith('.BK'):
        return 'THB'
    
    # Malaysian stocks
    if symbol_upper.endswith('.KL'):
        return 'MYR'
    
    # Indonesian stocks
    if symbol_upper.endswith('.JK'):
        return 'IDR'
    
    # Philippine stocks
    if symbol_upper.endswith('.PS'):
        return 'PHP'
    
    # Vietnamese stocks
    if symbol_upper.endswith('.VN'):
        return 'VND'
    
    # Default to USD for US stocks and unknown
    return 'USD'

def get_stock_info(ticker_symbol, max_retries=3):
    """Get stock information with retry logic for rate limiting and caching"""
    # Check cache first
    cache_key = f"info_{ticker_symbol}"
    if cache_key in stock_cache:
        cache_time, cache_data = stock_cache[cache_key]
        if (datetime.now() - cache_time).seconds < cache_ttl:
            return cache_data
    
    for attempt in range(max_retries):
        try:
            stock = yf.Ticker(ticker_symbol)
            info = stock.info
            
            if not info:
                if attempt == max_retries - 1:
                    raise HTTPException(status_code=404, detail=f"Stock info not found for {ticker_symbol}")
                continue
            
            # Get price data similar to main app.py
            current_price = info.get('regularMarketPrice', info.get('currentPrice'))
            previous_close = info.get('regularMarketPreviousClose', info.get('previousClose'))
            
            # Calculate change and change percent like main app.py
            today_change = None
            today_change_percent = None
            if current_price and previous_close and previous_close != 0:
                today_change = current_price - previous_close
                today_change_percent = (today_change / previous_close) * 100
            
            result = {
                'symbol': ticker_symbol,
                'name': info.get('longName', info.get('shortName', ticker_symbol)),
                'price': current_price,
                'change': today_change if today_change is not None else info.get('regularMarketChange', 0),
                'changePercent': today_change_percent if today_change_percent is not None else info.get('regularMarketChangePercent', 0),
                'volume': info.get('regularMarketVolume', info.get('volume', 0)),
                'marketCap': info.get('marketCap'),
                'pe': info.get('trailingPE'),
                'dividend': get_dividend_yield(info),
                'high': info.get('dayHigh', info.get('regularMarketDayHigh')),
                'low': info.get('dayLow', info.get('regularMarketDayLow')),
                'open': info.get('open', info.get('regularMarketOpen')),
                'previousClose': previous_close,
                'sector': info.get('sector'),
                'industry': info.get('industry'),
                'description': info.get('longBusinessSummary'),
                'currency': detect_currency_from_symbol(ticker_symbol, info),
                'high52Week': info.get('fiftyTwoWeekHigh'),
                'low52Week': info.get('fiftyTwoWeekLow'),
                'timestamp': datetime.now().isoformat()
            }
            
            # Cache the result
            stock_cache[cache_key] = (datetime.now(), result)
            return result
            
        except Exception as e:
            error_str = str(e).lower()
            
            # Handle rate limiting
            if "too many requests" in error_str or "rate limit" in error_str:
                if attempt < max_retries - 1:
                    wait_time = (2 ** attempt) + 1  # Exponential backoff: 2, 3, 5 seconds
                    time.sleep(wait_time)
                    continue
                else:
                    raise HTTPException(
                        status_code=429, 
                        detail=f"Rate limit exceeded for {ticker_symbol}. Please try again later."
                    )
            
            # Handle JSON decode errors (often from rate limiting)
            elif "jsondecodeerror" in error_str or "expecting value" in error_str:
                if attempt < max_retries - 1:
                    time.sleep(2)
                    continue
                else:
                    raise HTTPException(
                        status_code=503, 
                        detail=f"Service temporarily unavailable for {ticker_symbol}. Please try again later."
                    )
            
            # Handle other errors
            else:
                if attempt == max_retries - 1:
                    raise HTTPException(status_code=500, detail=f"Error fetching stock info for {ticker_symbol}: {str(e)}")
                time.sleep(1)
    
    # This should never be reached, but just in case
    raise HTTPException(status_code=500, detail=f"Failed to fetch stock info for {ticker_symbol} after {max_retries} attempts")

def get_stock_news(ticker_symbol, max_articles=8):
    """Get news for a stock with fast fallback to avoid timeouts"""
    try:
        print(f"Fetching news for {ticker_symbol}")
        
        # Always return fallback news quickly to avoid timeouts
        fallback_news = [
            {
                'title': f"{ticker_symbol} Stock Market Update",
                'summary': f"Latest market information and analysis for {ticker_symbol}. Stay updated with current market trends and stock performance.",
                'url': f"https://finance.yahoo.com/quote/{ticker_symbol}",
                'publishedAt': datetime.now().isoformat(),
                'source': 'Market Data',
                'sentiment': 'neutral'
            },
            {
                'title': f"{ticker_symbol} Trading Analysis",
                'summary': f"Comprehensive trading analysis and market insights for {ticker_symbol}. Monitor key metrics and market movements.",
                'url': f"https://finance.yahoo.com/quote/{ticker_symbol}",
                'publishedAt': datetime.now().isoformat(),
                'source': 'Financial News',
                'sentiment': 'neutral'
            },
            {
                'title': f"{ticker_symbol} Market Performance",
                'summary': f"Current market performance and analysis for {ticker_symbol}. Track price movements and trading volume.",
                'url': f"https://finance.yahoo.com/quote/{ticker_symbol}",
                'publishedAt': datetime.now().isoformat(),
                'source': 'Trading News',
                'sentiment': 'neutral'
            }
        ]
        
        # Try multiple news sources in order of preference with faster fallbacks
        processed_news = []
        
        # 1. Try NewsAPI first if key is available (fastest)
        if os.getenv("NEWS_API_KEY"):
            try:
                news_items_api, _ = get_stock_news_from_newsapi(ticker_symbol)
                if news_items_api:
                    processed_news.extend(news_items_api)
                    print(f"NewsAPI returned {len(news_items_api)} articles for {ticker_symbol}")
            except Exception as e:
                print(f"NewsAPI failed for {ticker_symbol}: {e}")
        
        # 2. If we have some news, return early to avoid timeouts
        if len(processed_news) >= 3:
            print(f"Returning {len(processed_news)} articles from NewsAPI for {ticker_symbol}")
        else:
            # 3. Try Yahoo Finance scraping (usually faster than Google)
            try:
                scraped_yfinance_items, _ = scrape_yahoo_finance_news(ticker_symbol)
                if scraped_yfinance_items:
                    processed_news.extend(scraped_yfinance_items)
                    print(f"Yahoo Finance returned {len(scraped_yfinance_items)} articles for {ticker_symbol}")
            except Exception as e:
                print(f"Yahoo Finance failed for {ticker_symbol}: {e}")
            
            # 4. Try Google News scraping only if we still need more articles
            if len(processed_news) < 3:
                try:
                    scraped_gnews_items, _ = scrape_google_news(ticker_symbol)
                    if scraped_gnews_items:
                        processed_news.extend(scraped_gnews_items)
                        print(f"Google News returned {len(scraped_gnews_items)} articles for {ticker_symbol}")
                except Exception as e:
                    print(f"Google News failed for {ticker_symbol}: {e}")
        
        # 5. If still no news, create informative sample news
        if not processed_news:
            try:
                # Try to get company info, but don't fail if rate limited
                company_name = ticker_symbol
                try:
                    stock = yf.Ticker(ticker_symbol)
                    info = stock.info
                    if info and info.get('shortName'):
                        company_name = info.get('shortName', ticker_symbol)
                except Exception as e:
                    print(f"Warning: Rate limited or error getting company info for {ticker_symbol}: {e}")
                    # Use ticker symbol as fallback
                
                # Create comprehensive informative news based on company info
                market_cap = 0
                pe_ratio = 0
                dividend_yield = 0
                beta = 0
                
                # Try to get financial data if available
                try:
                    if 'info' in locals() and info:
                        market_cap = info.get('marketCap', 0)
                        pe_ratio = info.get('trailingPE', 0)
                        dividend_yield = info.get('dividendYield', 0)
                        beta = info.get('beta', 0)
                except:
                    pass
                
                market_cap_formatted = f"${(market_cap / 1e9):.1f}B" if market_cap > 0 else "N/A"
                revenue = 0
                try:
                    if 'info' in locals() and info:
                        revenue = info.get('totalRevenue', 0)
                except:
                    pass
                revenue_formatted = f"${(revenue / 1e9):.1f}B" if revenue > 0 else "N/A"
                
                sample_news = [
                    {
                        'title': f"{company_name} Stock Analysis and Market Update",
                        'summary': f"Latest market analysis and stock performance for {company_name}. Current market cap: {market_cap_formatted}, P/E Ratio: {pe_ratio:.2f}, Beta: {beta:.2f}. The stock shows strong fundamentals and market presence.",
                        'url': f"https://finance.yahoo.com/quote/{ticker_symbol}",
                        'publishedAt': datetime.now().isoformat(),
                        'source': 'Yahoo Finance',
                        'sentiment': 'neutral'
                    },
                    {
                        'title': f"{company_name} Financial Results and Outlook",
                        'summary': f"Recent financial performance and future outlook for {company_name}. Industry: {info.get('industry', 'N/A')}, Revenue: {revenue_formatted}, Dividend Yield: {(dividend_yield * 100):.2f}%. The company shows strong financial health with consistent growth prospects.",
                        'url': f"https://finance.yahoo.com/quote/{ticker_symbol}",
                        'publishedAt': (datetime.now() - timedelta(days=1)).isoformat(),
                        'source': 'Financial News',
                        'sentiment': 'positive'
                    },
                    {
                        'title': f"{company_name} Market Trends and Analysis",
                        'summary': f"Market trends and analysis for {company_name}. Sector: {info.get('sector', 'N/A')}, Industry: {info.get('industry', 'N/A')}. The company operates in a competitive market with significant growth potential and strong market positioning.",
                        'url': f"https://finance.yahoo.com/quote/{ticker_symbol}",
                        'publishedAt': (datetime.now() - timedelta(days=2)).isoformat(),
                        'source': 'Market Analysis',
                        'sentiment': 'neutral'
                    },
                    {
                        'title': f"{company_name} Investment Analysis and Recommendations",
                        'summary': f"Investment analysis for {company_name}. Current price: ₹{info.get('regularMarketPrice', 'N/A')}, 52-week high: ₹{info.get('fiftyTwoWeekHigh', 'N/A')}, 52-week low: ₹{info.get('fiftyTwoWeekLow', 'N/A')}. Risk assessment shows moderate volatility with stable long-term prospects.",
                        'url': f"https://finance.yahoo.com/quote/{ticker_symbol}",
                        'publishedAt': (datetime.now() - timedelta(days=3)).isoformat(),
                        'source': 'Investment Research',
                        'sentiment': 'positive'
                    },
                    {
                        'title': f"{company_name} Business Model and Competitive Position",
                        'summary': f"Analysis of {company_name}'s business model and competitive position. The company operates in {info.get('industry', 'N/A')} with a market cap of {market_cap_formatted}. Key strengths include strong brand recognition and market leadership in the {info.get('sector', 'N/A')} sector.",
                        'url': f"https://finance.yahoo.com/quote/{ticker_symbol}",
                        'publishedAt': (datetime.now() - timedelta(days=4)).isoformat(),
                        'source': 'Business Analysis',
                        'sentiment': 'neutral'
                    },
                    {
                        'title': f"{company_name} ESG and Sustainability Report",
                        'summary': f"ESG and sustainability analysis for {company_name}. The company demonstrates commitment to environmental, social, and governance practices. With {info.get('fullTimeEmployees', 'N/A')} employees, the company maintains strong corporate governance standards.",
                        'url': f"https://finance.yahoo.com/quote/{ticker_symbol}",
                        'publishedAt': (datetime.now() - timedelta(days=5)).isoformat(),
                        'source': 'ESG Research',
                        'sentiment': 'positive'
                    },
                    {
                        'title': f"{company_name} Technical Analysis and Trading Signals",
                        'summary': f"Technical analysis for {company_name}. Current trading signals suggest {('bullish' if info.get('regularMarketChange', 0) > 0 else 'bearish')} momentum. Support levels at ₹{info.get('fiftyTwoWeekLow', 'N/A')} and resistance at ₹{info.get('fiftyTwoWeekHigh', 'N/A')}. Volume analysis indicates {('strong' if info.get('averageVolume', 0) > 1000000 else 'moderate')} investor interest.",
                        'url': f"https://finance.yahoo.com/quote/{ticker_symbol}",
                        'publishedAt': (datetime.now() - timedelta(days=6)).isoformat(),
                        'source': 'Technical Analysis',
                        'sentiment': 'neutral'
                    },
                    {
                        'title': f"{company_name} Industry Outlook and Future Prospects",
                        'summary': f"Industry outlook and future prospects for {company_name}. The {info.get('industry', 'N/A')} industry is expected to grow significantly, with {company_name} well-positioned to capitalize on emerging trends. The company's strategic initiatives and market expansion plans support long-term growth.",
                        'url': f"https://finance.yahoo.com/quote/{ticker_symbol}",
                        'publishedAt': (datetime.now() - timedelta(days=7)).isoformat(),
                        'source': 'Industry Research',
                        'sentiment': 'positive'
                    }
                ]
                processed_news.extend(sample_news)
            except Exception as e:
                print(f"Error creating sample news for {ticker_symbol}: {e}")
                pass
        
        # 6. Final fallback - always return some basic news
        if not processed_news:
            print(f"Creating fallback news for {ticker_symbol}")
            processed_news = [
                {
                    'title': f"{ticker_symbol} Stock Market Update",
                    'summary': f"Latest market information and analysis for {ticker_symbol}. Stay updated with current market trends and stock performance.",
                    'url': f"https://finance.yahoo.com/quote/{ticker_symbol}",
                    'publishedAt': datetime.now().isoformat(),
                    'source': 'Market Data',
                    'sentiment': 'neutral'
                },
                {
                    'title': f"{ticker_symbol} Trading Analysis",
                    'summary': f"Comprehensive trading analysis and market insights for {ticker_symbol}. Monitor key metrics and market movements.",
                    'url': f"https://finance.yahoo.com/quote/{ticker_symbol}",
                    'publishedAt': datetime.now().isoformat(),
                    'source': 'Financial News',
                    'sentiment': 'neutral'
                }
            ]
        
        # Add sentiment analysis to all news items (only if we have news)
        if processed_news:
            processed_news_with_sentiment = add_sentiment_to_news_items(processed_news)
        else:
            processed_news_with_sentiment = []
        
        # Transform all news to consistent format
        transformed_items = []
        for item in processed_news_with_sentiment[:max_articles]:
            # Handle different source formats
            if isinstance(item, dict):
                transformed_items.append({
                    'title': item.get('title', 'N/A'),
                    'summary': item.get('summary') or item.get('description', f"News about {ticker_symbol}"),
                    'url': item.get('url') or item.get('link', '#'),
                    'publishedAt': item.get('publishedAt') or item.get('published', datetime.now().isoformat()),
                    'source': item.get('source') or item.get('publisher', 'Unknown Source'),
                    'sentiment': item.get('sentiment', 'neutral'),
                    'sentiment_score': item.get('sentiment_score', 0.0),
                    'image_url': item.get('image_url')
                })
        
        return transformed_items
        
    except Exception as e:
        print(f"Error in get_stock_news: {e}")
        return []

def calculate_portfolio_metrics(holdings):
    if not holdings:
        return {
            'totalValue': 0,
            'totalGainLoss': 0,
            'totalGainLossPercent': 0,
            'totalCost': 0
        }
    
    total_cost = sum(h.shares * h.avgPrice for h in holdings.values())
    total_value = sum(h.totalValue for h in holdings.values())
    total_gain_loss = total_value - total_cost
    
    if total_cost > 0:
        total_gain_loss_percent = (total_gain_loss / total_cost) * 100
    else:
        total_gain_loss_percent = 0
    
    return {
        'totalValue': total_value,
        'totalGainLoss': total_gain_loss,
        'totalGainLossPercent': total_gain_loss_percent,
        'totalCost': total_cost
    }

def get_company_logo_url(ticker_symbol, company_name=None, company_website=None):
    """Get company logo URL from hardcoded mappings or generate one"""
    hardcoded_logos = {
        "AAPL": "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
        "MSFT": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/1024px-Microsoft_logo.svg.png",
        "GOOGL": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/1200px-Google_2015_logo.svg.png",
        "AMZN": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/1024px-Amazon_logo.svg.png"
    }
    if ticker_symbol in hardcoded_logos:
        return hardcoded_logos[ticker_symbol]
    return None

def get_about_stock_info(ticker_symbol):
    """Get comprehensive stock information including financials and earnings"""
    description, sector, industry, market_cap, exchange = "Info not available.", "N/A", "N/A", None, "N/A"
    info_dict, financials_df, earnings_df, analyst_recs_df, analyst_price_target_dict, company_officers_list = {}, pd.DataFrame(), pd.DataFrame(), None, None, []
    
    try:
        stock = yf.Ticker(ticker_symbol)
        info = stock.info
        
        if info:
            description = info.get('longBusinessSummary', description)
            sector = info.get('sector', sector)
            industry = info.get('industry', industry)
            market_cap = info.get('marketCap')
            exchange = info.get('exchange', exchange)
            info_dict = info
            company_officers_list = info.get('companyOfficers', [])
            info_dict['currency_symbol'] = get_currency_symbol(info.get('currency', 'USD'))
            info_dict['logo_url'] = get_company_logo_url(ticker_symbol, info.get('shortName'), info.get('website'))
        
        try:
            financials_df = stock.quarterly_financials if not stock.quarterly_financials.empty else stock.financials
        except:
            pass
        
        try:
            earnings_df = stock.quarterly_earnings if not stock.quarterly_earnings.empty else stock.earnings
        except:
            pass
        
        try:
            analyst_recs_df = stock.recommendations
        except:
            pass
        
        try:
            analyst_price_target_dict = stock.analyst_price_target
        except:
            pass
            
    except Exception as e:
        description = f"Info retrieval failed: {e}"
    
    return (description, sector, industry, market_cap, exchange, info_dict, financials_df, earnings_df, analyst_recs_df, analyst_price_target_dict, company_officers_list)

def assess_volatility_and_risk(df, window=60):
    """Assess volatility and risk level of a stock"""
    if df.empty or 'Close' not in df.columns or len(df) < window + 1:
        return None, "N/A", "Not enough data."
    
    daily_returns = df['Close'].pct_change().dropna()
    
    if len(daily_returns) < window:
        return None, "N/A", f"Need {window} returns, have {len(daily_returns)}."
    
    actual_window = min(window, len(daily_returns))
    
    if actual_window < 2:
        return None, "N/A", "Too few points for std dev."
    
    vol_percent = daily_returns.rolling(window=actual_window).std().iloc[-1] * np.sqrt(252) * 100
    
    if pd.isna(vol_percent):
        return None, "N/A", "Volatility NaN."
    
    if vol_percent < 15:
        risk_level, risk_explanation = "Low", "Low price swings."
    elif vol_percent < 30:
        risk_level, risk_explanation = "Moderate", "Moderate price swings."
    elif vol_percent < 50:
        risk_level, risk_explanation = "High", "Significant price swings."
    else:
        risk_level, risk_explanation = "Very High", "Extreme price swings."
    
    return vol_percent, risk_level, risk_explanation

def get_historical_volatility_data(df, window=30, trading_days=252):
    """Get historical volatility data for a stock"""
    if df.empty or 'Close' not in df.columns or len(df) < window + 1:
        return None
    
    return (df['Close'].pct_change().rolling(window=window).std() * np.sqrt(trading_days) * 100).dropna()

def get_correlation_data(ticker1_df, ticker2_symbol, main_ticker_symbol, period='1y', interval='1d'):
    """Get correlation data between two stocks"""
    try:
        ticker2_df = fetch_stock_data(ticker2_symbol, period=period, interval=interval)
        
        if ticker1_df.empty or ticker2_df.empty:
            return None, None, "Not enough data for correlation."
        
        returns1 = ticker1_df['Close'].pct_change().rename(main_ticker_symbol)
        returns2 = ticker2_df['Close'].pct_change().rename(ticker2_symbol)
        
        combined_returns = pd.concat([returns1, returns2], axis=1).dropna()
        
        if len(combined_returns) < 20:
            return None, None, "Not enough overlapping data for correlation."
        
        rolling_corr = combined_returns[main_ticker_symbol].rolling(window=30).corr(combined_returns[returns2.name])
        overall_corr = combined_returns[main_ticker_symbol].corr(combined_returns[returns2.name])
        
        return rolling_corr.dropna(), overall_corr, None
        
    except Exception as e:
        return None, None, f"Corr. Error with {ticker2_symbol}: {e}"

def calculate_historical_performance_and_cagr(df_hist, initial_investment=1000):
    """Calculate historical performance and CAGR"""
    if df_hist.empty or len(df_hist) < 2 or 'Close' not in df_hist.columns:
        return None, None, None, "Not enough hist. data."
    
    start_price = df_hist['Close'].iloc[0]
    end_price = df_hist['Close'].iloc[-1]
    num_years = (df_hist.index[-1] - df_hist.index[0]).days / 365.25
    
    if num_years < 0.1:
        return initial_investment, initial_investment * (end_price/start_price if start_price != 0 else 1), None, "Period too short for CAGR."
    
    total_return_multiple = end_price / start_price if start_price != 0 else 1
    final_value = initial_investment * total_return_multiple
    cagr = None
    
    if total_return_multiple > 0 and num_years > 0:
        cagr = ((total_return_multiple) ** (1/num_years)) - 1
    
    return initial_investment, final_value, cagr * 100 if cagr is not None else None, None

def project_future_value_cagr(initial_investment, cagr_percent, years_to_project):
    """Project future value based on CAGR"""
    if cagr_percent is None or initial_investment is None or years_to_project is None:
        return None
    
    return initial_investment * ((1 + (cagr_percent / 100)) ** years_to_project)

def calculate_max_drawdown(df):
    """Calculate the maximum drawdown of a stock"""
    if df.empty or 'Close' not in df.columns or len(df) < 2:
        return None, None, None
    
    roll_max = df['Close'].cummax()
    daily_drawdown = df['Close'] / roll_max - 1.0
    max_drawdown = daily_drawdown.min()
    end_date = daily_drawdown.idxmin()
    
    try:
        start_date = df['Close'][:end_date].idxmax()
    except ValueError:
        start_date = df.index[0]
    
    return max_drawdown, start_date, end_date

def calculate_sharpe_ratio(returns, risk_free_rate):
    """Calculate the Sharpe ratio"""
    if returns is None or returns.empty or len(returns) < 2:
        return None
    
    if not isinstance(returns, pd.Series):
        returns = pd.Series(returns)
    
    excess_returns = returns - risk_free_rate / 252  # Daily risk-free rate
    sharpe_ratio = (excess_returns.mean() / excess_returns.std()) * np.sqrt(252) if excess_returns.std() != 0 else 0
    
    return sharpe_ratio

def calculate_sortino_ratio(returns, risk_free_rate):
    """Calculate the Sortino ratio"""
    if returns is None or returns.empty or len(returns) < 2:
        return None
    
    if not isinstance(returns, pd.Series):
        returns = pd.Series(returns)
    
    target_return = risk_free_rate / 252
    downside_returns = returns[returns < target_return]
    
    expected_return = returns.mean()
    downside_std = downside_returns.std()
    
    if downside_std == 0 or pd.isna(downside_std):
        return 0.0
    
    sortino_ratio = (expected_return - target_return) / downside_std * np.sqrt(252)
    return sortino_ratio

def calculate_beta(stock_returns, index_returns):
    """Calculate the beta of a stock against an index"""
    if stock_returns is None or index_returns is None or len(stock_returns) < 2 or len(index_returns) < 2:
        return None
    
    covariance = stock_returns.cov(index_returns)
    variance = index_returns.var()
    
    if variance == 0 or pd.isna(variance):
        return None
    
    beta = covariance / variance
    return beta

def calculate_calmar_ratio(cagr, max_drawdown):
    """Calculate the Calmar ratio"""
    if cagr is None or max_drawdown is None or max_drawdown == 0:
        return None
    
    # Max drawdown is negative, so we use its absolute value
    return cagr / abs(max_drawdown)

def scrape_company_images(query_term, max_images=9):
    """Scrape company images from multiple sources with fallbacks."""
    image_urls = []
    error_message = None
    
    # Try different search queries to get more relevant results
    search_queries = [
        f"{query_term} company logo",
        f"{query_term} headquarters",
        f"{query_term} office building",
        f"{query_term} corporate",
        f"{query_term} brand"
    ]
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
    }
    
    for search_query in search_queries:
        if len(image_urls) >= max_images:
            break
            
        try:
            # Try Google Images
            search_url = f"https://www.google.com/search?q={quote_plus(search_query)}&tbm=isch"
            response = requests.get(search_url, headers=headers, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Try multiple methods to find images
            # Method 1: Direct img tags
            for img in soup.find_all('img'):
                if 'src' in img.attrs and img['src'].startswith('http'):
                    url = img['src']
                    if url not in image_urls and not any(x in url.lower() for x in ['gstatic', 'google', 'favicon']):
                        image_urls.append(url)
                        if len(image_urls) >= max_images:
                            break
            
            # Method 2: Look for image data in script tags
            scripts = soup.find_all('script')
            for script in scripts:
                if script.string:
                    # Look for image URLs in script content
                    urls = re.findall(r'"(https?://[^"]+\.(?:jpg|jpeg|png|gif|webp))"', script.string)
                    for url in urls:
                        if url not in image_urls and not any(x in url.lower() for x in ['gstatic', 'google', 'favicon']):
                            image_urls.append(url)
                            if len(image_urls) >= max_images:
                                break
            
            # Method 3: Try to find image data in JSON format
            for script in scripts:
                if script.string and 'AF_initDataCallback' in script.string:
                    try:
                        # Extract JSON data
                        json_str = re.search(r'data:\[(.*?)\]', script.string)
                        if json_str:
                            data = json.loads(f"[{json_str.group(1)}]")
                            for item in data:
                                if isinstance(item, list):
                                    for subitem in item:
                                        if isinstance(subitem, str) and subitem.startswith('http'):
                                            if subitem not in image_urls and not any(x in subitem.lower() for x in ['gstatic', 'google', 'favicon']):
                                                image_urls.append(subitem)
                                                if len(image_urls) >= max_images:
                                                    break
                    except:
                        continue
            
        except Exception as e:
            error_message = f"Error with query '{search_query}': {str(e)}"
            continue
    
    # If we still don't have enough images, try a fallback to a stock image service
    if len(image_urls) < max_images:
        try:
            # Try Unsplash API as a fallback
            unsplash_url = f"https://source.unsplash.com/featured/?{quote_plus(query_term)},company"
            response = requests.head(unsplash_url, allow_redirects=True)
            if response.status_code == 200:
                image_urls.append(response.url)
        except:
            pass
    
    # Remove any duplicate URLs
    image_urls = list(dict.fromkeys(image_urls))
    
    # If we still have no images, return a default company image
    if not image_urls:
        image_urls = ["https://source.unsplash.com/featured/?office,building"]
        error_message = "Using fallback image"
    
    return image_urls[:max_images], error_message

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

def monte_carlo_simulation(initial_investment, years, num_simulations, mean_return, volatility, risk_free_rate=0.03):
    """Run Monte Carlo simulation for investment forecasting"""
    try:
        # Daily parameters
        daily_mean = mean_return / 252
        daily_vol = volatility / np.sqrt(252)
        
        # Generate simulations
        simulation_results = []
        final_values = []
        
        for sim in range(num_simulations):
            # Generate daily returns
            daily_returns = np.random.normal(daily_mean, daily_vol, years * 252)
            
            # Calculate cumulative returns
            cumulative_returns = (1 + daily_returns).cumprod()
            portfolio_values = initial_investment * cumulative_returns
            
            simulation_results.append(portfolio_values)
            final_values.append(portfolio_values[-1])
        
        # Calculate statistics
        final_values = np.array(final_values)
        
        # Percentiles
        percentiles = {
            '5th': np.percentile(final_values, 5),
            '25th': np.percentile(final_values, 25),
            '50th': np.percentile(final_values, 50),
            '75th': np.percentile(final_values, 75),
            '95th': np.percentile(final_values, 95)
        }
        
        # Risk metrics
        total_return = (final_values - initial_investment) / initial_investment
        expected_return = np.mean(total_return)
        volatility_actual = np.std(total_return)
        
        # Sharpe ratio
        excess_returns = total_return - (risk_free_rate * years)
        sharpe_ratio = np.mean(excess_returns) / np.std(excess_returns) if np.std(excess_returns) > 0 else 0
        
        # Maximum drawdown simulation
        max_drawdowns = []
        for sim_result in simulation_results:
            peak = np.maximum.accumulate(sim_result)
            drawdown = (sim_result - peak) / peak
            max_drawdowns.append(np.min(drawdown))
        
        avg_max_drawdown = np.mean(max_drawdowns)
        
        return {
            'simulation_data': simulation_results,
            'final_values': final_values.tolist(),
            'percentiles': percentiles,
            'expected_return': expected_return,
            'volatility': volatility_actual,
            'sharpe_ratio': sharpe_ratio,
            'avg_max_drawdown': avg_max_drawdown,
            'success_rate': np.mean(final_values > initial_investment)
        }
        
    except Exception as e:
        return None

def calculate_advanced_metrics(df, risk_free_rate=0.03):
    """Calculate advanced financial metrics"""
    if df.empty or 'Close' not in df.columns or len(df) < 2:
        return {}
    
    try:
        returns = df['Close'].pct_change().dropna()
        
        if len(returns) < 2:
            return {}
        
        # Basic metrics
        total_return = (df['Close'].iloc[-1] / df['Close'].iloc[0]) - 1
        annualized_return = ((1 + total_return) ** (252 / len(returns))) - 1
        volatility = returns.std() * np.sqrt(252)
        
        # Risk-adjusted metrics
        excess_returns = returns - (risk_free_rate / 252)
        sharpe_ratio = (excess_returns.mean() / returns.std()) * np.sqrt(252) if returns.std() > 0 else 0
        
        # Sortino ratio (downside deviation)
        downside_returns = returns[returns < 0]
        downside_deviation = downside_returns.std() * np.sqrt(252) if len(downside_returns) > 0 else 0
        sortino_ratio = (excess_returns.mean() / downside_deviation) * np.sqrt(252) if downside_deviation > 0 else 0
        
        # Maximum drawdown
        cumulative_returns = (1 + returns).cumprod()
        running_max = cumulative_returns.expanding().max()
        drawdown = (cumulative_returns - running_max) / running_max
        max_drawdown = drawdown.min()
        
        # Value at Risk (95% confidence)
        var_95 = np.percentile(returns, 5)
        
        # Calmar ratio
        calmar_ratio = annualized_return / abs(max_drawdown) if max_drawdown != 0 else 0
        
        return {
            'total_return': total_return,
            'annualized_return': annualized_return,
            'volatility': volatility,
            'sharpe_ratio': sharpe_ratio,
            'sortino_ratio': sortino_ratio,
            'max_drawdown': max_drawdown,
            'var_95': var_95,
            'calmar_ratio': calmar_ratio,
            'skewness': returns.skew(),
            'kurtosis': returns.kurtosis()
        }
        
    except Exception as e:
        return {}

def get_watchlist_data(watchlist_symbols):
    """Get data for watchlist symbols"""
    watchlist_data = []
    
    for symbol in watchlist_symbols:
        try:
            stock_info = get_stock_info(symbol)
            if stock_info:
                watchlist_data.append({
                    'symbol': symbol,
                    'name': stock_info.get('name', symbol),
                    'price': stock_info.get('price'),
                    'change': stock_info.get('change'),
                    'changePercent': stock_info.get('changePercent'),
                    'volume': stock_info.get('volume'),
                    'marketCap': stock_info.get('marketCap')
                })
        except:
            continue
    
    return watchlist_data

def screen_stocks(criteria):
    """Screen stocks based on criteria"""
    try:
        # This would typically query a database or use a stock screening API
        # For now, return a sample of stocks that meet basic criteria
        sample_stocks = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA', 'NFLX']
        screened_results = []
        
        for symbol in sample_stocks:
            try:
                stock_info = get_stock_info(symbol)
                if stock_info:
                    # Apply screening criteria
                    if (stock_info.get('marketCap', 0) >= criteria.get('min_market_cap', 0) and
                        stock_info.get('trailingPE', float('inf')) <= criteria.get('max_pe', float('inf')) and
                        stock_info.get('dividendYield', 0) * 100 >= criteria.get('min_dividend_yield', 0)):
                        
                        screened_results.append({
                            'symbol': symbol,
                            'name': stock_info.get('name', symbol),
                            'price': stock_info.get('price'),
                            'marketCap': stock_info.get('marketCap'),
                            'pe': stock_info.get('pe'),
                            'dividendYield': stock_info.get('dividend'),
                            'beta': stock_info.get('beta'),
                            'volume': stock_info.get('volume')
                        })
            except:
                continue
        
        return screened_results
        
    except Exception as e:
        return []

def check_alert_conditions(alert, stock_data):
    """Check if an alert condition is met"""
    try:
        if alert['type'] == 'Price':
            current_price = stock_data.get('price', 0)
            target_price = alert.get('price', 0)
            condition = alert.get('condition', '')
            
            if condition == 'Above' and current_price > target_price:
                return True, f"Price {current_price} is above {target_price}"
            elif condition == 'Below' and current_price < target_price:
                return True, f"Price {current_price} is below {target_price}"
                
        elif alert['type'] == 'Technical':
            # This would require historical data and technical indicators
            # For now, return False
            return False, "Technical alerts not yet implemented"
            
        elif alert['type'] == 'News':
            # This would require news sentiment analysis
            # For now, return False
            return False, "News alerts not yet implemented"
            
        return False, "Alert condition not met"
        
    except Exception as e:
        return False, f"Error checking alert: {str(e)}"

def get_enhanced_technical_indicators(df):
    """Get enhanced technical indicators including more advanced ones"""
    if df.empty or 'Close' not in df.columns:
        return pd.DataFrame()
    
    df_ta = df.copy()
    
    # Basic moving averages
    if len(df_ta) > 20:
        df_ta['SMA_20'] = ta.trend.sma_indicator(df_ta['Close'], window=20)
        df_ta['EMA_20'] = ta.trend.ema_indicator(df_ta['Close'], window=20)
    if len(df_ta) > 50:
        df_ta['SMA_50'] = ta.trend.sma_indicator(df_ta['Close'], window=50)
        df_ta['EMA_50'] = ta.trend.ema_indicator(df_ta['Close'], window=50)
    if len(df_ta) > 200:
        df_ta['SMA_200'] = ta.trend.sma_indicator(df_ta['Close'], window=200)
        df_ta['EMA_200'] = ta.trend.ema_indicator(df_ta['Close'], window=200)
    
    # Bollinger Bands
    if len(df_ta) > 20:
        bb_indicator = ta.volatility.BollingerBands(close=df_ta['Close'], window=20, window_dev=2)
        df_ta['BB_High'] = bb_indicator.bollinger_hband()
        df_ta['BB_Mid'] = bb_indicator.bollinger_mavg()
        df_ta['BB_Low'] = bb_indicator.bollinger_lband()
        df_ta['BB_Width'] = (df_ta['BB_High'] - df_ta['BB_Low']) / df_ta['BB_Mid']
        df_ta['BB_Position'] = (df_ta['Close'] - df_ta['BB_Low']) / (df_ta['BB_High'] - df_ta['BB_Low'])
    
    # RSI
    if len(df_ta) > 14:
        df_ta['RSI'] = ta.momentum.rsi(df_ta['Close'], window=14)
        df_ta['RSI_MA'] = ta.trend.sma_indicator(df_ta['RSI'], window=14)
    
    # MACD
    if len(df_ta) > 34:
        df_ta['MACD_line'] = ta.trend.macd(df_ta['Close'])
        df_ta['MACD_signal'] = ta.trend.macd_signal(df_ta['Close'])
        df_ta['MACD_hist'] = ta.trend.macd_diff(df_ta['Close'])
    
    # Stochastic Oscillator
    if len(df_ta) > 14:
        stoch = ta.momentum.StochasticOscillator(high=df_ta['High'], low=df_ta['Low'], close=df_ta['Close'])
        df_ta['Stoch_K'] = stoch.stoch()
        df_ta['Stoch_D'] = stoch.stoch_signal()
    
    # Williams %R
    if len(df_ta) > 14:
        df_ta['Williams_R'] = ta.momentum.williams_r(high=df_ta['High'], low=df_ta['Low'], close=df_ta['Close'])
    
    # Commodity Channel Index
    if len(df_ta) > 20:
        df_ta['CCI'] = ta.trend.cci(high=df_ta['High'], low=df_ta['Low'], close=df_ta['Close'])
    
    # Average True Range (ATR)
    if len(df_ta) > 14:
        df_ta['ATR'] = ta.volatility.average_true_range(high=df_ta['High'], low=df_ta['Low'], close=df_ta['Close'])
    
    # On Balance Volume (OBV)
    if len(df_ta) > 1:
        df_ta['OBV'] = ta.volume.on_balance_volume(close=df_ta['Close'], volume=df_ta['Volume'])
    
    # Money Flow Index
    if len(df_ta) > 14:
        df_ta['MFI'] = ta.volume.money_flow_index(high=df_ta['High'], low=df_ta['Low'], close=df_ta['Close'], volume=df_ta['Volume'])
    
    return df_ta

def generate_enhanced_signal(df, news_sentiment=0.0, company_name="the company"):
    """Generate enhanced trading signal with more indicators"""
    if df.empty or len(df) < 50:
        return "N/A", "Insufficient data for enhanced analysis"
    
    try:
        latest = df.iloc[-1]
        previous = df.iloc[-2] if len(df) >= 2 else latest
        
        # Initialize scores
        buy_score = 0
        sell_score = 0
        reasons = []
        
        # Price vs Moving Averages
        if pd.notna(latest.get('Close')) and pd.notna(latest.get('SMA_20')):
            if latest['Close'] > latest['SMA_20']:
                buy_score += 1
                reasons.append("Price above 20-day SMA (bullish)")
            else:
                sell_score += 1
                reasons.append("Price below 20-day SMA (bearish)")
        
        if pd.notna(latest.get('Close')) and pd.notna(latest.get('SMA_50')):
            if latest['Close'] > latest['SMA_50']:
                buy_score += 1
                reasons.append("Price above 50-day SMA (bullish)")
            else:
                sell_score += 1
                reasons.append("Price below 50-day SMA (bearish)")
        
        # RSI Analysis
        rsi = latest.get('RSI')
        if pd.notna(rsi):
            if rsi < 30:
                buy_score += 2
                reasons.append(f"RSI oversold ({rsi:.1f})")
            elif rsi < 40:
                buy_score += 1
                reasons.append(f"RSI approaching oversold ({rsi:.1f})")
            elif rsi > 70:
                sell_score += 2
                reasons.append(f"RSI overbought ({rsi:.1f})")
            elif rsi > 60:
                sell_score += 1
                reasons.append(f"RSI approaching overbought ({rsi:.1f})")
        
        # MACD Analysis
        if all(pd.notna(latest.get(col)) for col in ['MACD_line', 'MACD_signal']):
            if latest['MACD_line'] > latest['MACD_signal']:
                buy_score += 1
                reasons.append("MACD line above signal line")
            else:
                sell_score += 1
                reasons.append("MACD line below signal line")
        
        # Bollinger Bands Analysis
        bb_position = latest.get('BB_Position')
        if pd.notna(bb_position):
            if bb_position < 0.2:
                buy_score += 1
                reasons.append("Price near lower Bollinger Band")
            elif bb_position > 0.8:
                sell_score += 1
                reasons.append("Price near upper Bollinger Band")
        
        # Stochastic Analysis
        stoch_k = latest.get('Stoch_K')
        if pd.notna(stoch_k):
            if stoch_k < 20:
                buy_score += 1
                reasons.append("Stochastic oversold")
            elif stoch_k > 80:
                sell_score += 1
                reasons.append("Stochastic overbought")
        
        # Volume Analysis
        if pd.notna(latest.get('OBV')):
            if len(df) >= 2:
                obv_change = latest['OBV'] - previous['OBV']
                if obv_change > 0:
                    buy_score += 0.5
                    reasons.append("OBV increasing (bullish volume)")
                else:
                    sell_score += 0.5
                    reasons.append("OBV decreasing (bearish volume)")
        
        # News Sentiment Impact
        if abs(news_sentiment) > 0.1:
            if news_sentiment > 0:
                buy_score += 1
                reasons.append(f"Positive news sentiment ({news_sentiment:.2f})")
            else:
                sell_score += 1
                reasons.append(f"Negative news sentiment ({news_sentiment:.2f})")
        
        # Generate final signal
        signal_diff = buy_score - sell_score
        
        if signal_diff >= 3:
            final_signal = "STRONG BUY"
        elif signal_diff >= 1:
            final_signal = "BUY"
        elif signal_diff <= -3:
            final_signal = "STRONG SELL"
        elif signal_diff <= -1:
            final_signal = "SELL"
        else:
            final_signal = "HOLD"
        
        return final_signal, " | ".join(reasons) if reasons else "Neutral signals"
        
    except Exception as e:
        return "N/A", f"Error in enhanced signal generation: {str(e)}"

def scrape_google_news(query_term):
    """Scrape Google News for stock-related articles"""
    news_items, error_message = [], None
    safe_query = quote_plus(query_term + " stock news")
    search_url = f"https://news.google.com/search?q={safe_query}&hl=en-US&gl=US&ceid=US%3Aen"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    try:
        response = requests.get(search_url, headers=headers, timeout=15)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        articles_tags = soup.find_all('article', limit=15)
        processed_urls = set()
        
        for article_tag in articles_tags:
            link_tag = article_tag.find('a', href=True)
            if link_tag and link_tag['href'].startswith('./articles/'):
                title_text = link_tag.get_text(strip=True) or (article_tag.find(['h3', 'h4']) and article_tag.find(['h3', 'h4']).get_text(strip=True)) or article_tag.get_text(separator=' ', strip=True).split(' temporally ')[0]
                full_link = "https://news.google.com" + link_tag['href'][1:]
                
                # Try to get image from article
                image_url = None
                try:
                    article_response = requests.get(full_link, headers=headers, timeout=5)
                    if article_response.status_code == 200:
                        article_soup = BeautifulSoup(article_response.text, 'html.parser')
                        # Try to find the first valid image
                        for img in article_soup.find_all('img'):
                            if img.get('src') and img['src'].startswith('http'):
                                image_url = img['src']
                                break
                except:
                    pass
                
                if full_link not in processed_urls and len(title_text) > 15:
                    news_items.append({
                        'title': title_text,
                        'link': full_link,
                        'source': 'Google News (Scraped)',
                        'publisher': 'Google News Aggregated',
                        'image_url': image_url
                    })
                    processed_urls.add(full_link)
                    
            if len(news_items) >= 7:
                break
                
        if not news_items:
            potential_links = soup.find_all('a', href=lambda href: href and href.startswith('./articles/'), limit=50)
            for link_tag in potential_links:
                title_text = link_tag.get_text(strip=True) or (link_tag.find(['h3','h4','div'], recursive=False) and link_tag.find(['h3','h4','div'], recursive=False).get_text(strip=True)) or (link_tag.img and link_tag.img.get('alt'))
                full_link = "https://news.google.com" + link_tag['href'][1:]
                
                # Try to get image from article
                image_url = None
                try:
                    article_response = requests.get(full_link, headers=headers, timeout=5)
                    if article_response.status_code == 200:
                        article_soup = BeautifulSoup(article_response.text, 'html.parser')
                        # Try to find the first valid image
                        for img in article_soup.find_all('img'):
                            if img.get('src') and img['src'].startswith('http'):
                                image_url = img['src']
                                break
                except:
                    pass
                
                if full_link not in processed_urls and title_text and len(title_text) > 20 and (query_term.split()[0].lower() in title_text.lower() or query_term.lower() in title_text.lower()):
                    news_items.append({
                        'title': title_text,
                        'link': full_link,
                        'source': 'Google News (Scraped)',
                        'publisher': 'Google News Aggregated',
                        'image_url': image_url
                    })
                    processed_urls.add(full_link)
                    
                if len(news_items) >= 7:
                    break
                    
        if not news_items:
            error_message = f"Google News: No articles for '{query_term}'."
            
    except requests.exceptions.Timeout:
        error_message = f"Google News: Timeout for '{query_term}'."
    except requests.exceptions.RequestException as e:
        error_message = f"Google News Error for '{query_term}': {str(e)}"
    except Exception as e:
        error_message = f"Google News Unexpected Error for '{query_term}': {str(e)}"
    
    return news_items[:7], error_message

def scrape_yahoo_finance_news(ticker_symbol):
    """Scrape Yahoo Finance news for a specific ticker"""
    news_items, error_message = [], None
    search_url = f"https://finance.yahoo.com/quote/{ticker_symbol}/news"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    try:
        response = requests.get(search_url, headers=headers, timeout=15)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        article_containers = soup.find_all('li', class_=lambda x: x and 'stream-item' in x.lower(), limit=15)
        
        if not article_containers:
            article_containers = soup.select('div.Cf div.js-stream-content > div', limit=15)
            
        processed_urls = set()
        
        for item_container in article_containers:
            link_tag = item_container.find('a', href=True)
            title_tag = item_container.find(['h3', 'h2'])
            
            if link_tag and title_tag and link_tag['href']:
                raw_link = link_tag['href']
                title_text = title_tag.get_text(strip=True)
                full_link = ""
                
                if raw_link.startswith('/news/'):
                    full_link = "https://finance.yahoo.com" + raw_link
                elif raw_link.startswith(('http://', 'https://')) and 'yahoo.com' in raw_link:
                    full_link = raw_link
                else:
                    continue
                
                # Try to get image from article
                image_url = None
                try:
                    article_response = requests.get(full_link, headers=headers, timeout=5)
                    if article_response.status_code == 200:
                        article_soup = BeautifulSoup(article_response.text, 'html.parser')
                        # Try to find the first valid image
                        for img in article_soup.find_all('img'):
                            if img.get('src') and img['src'].startswith('http'):
                                image_url = img['src']
                                break
                except:
                    pass
                
                if full_link not in processed_urls and title_text and len(title_text) > 15:
                    news_items.append({
                        'title': title_text,
                        'link': full_link,
                        'source': 'Yahoo Finance',
                        'publisher': 'Yahoo Finance',
                        'image_url': image_url
                    })
                    processed_urls.add(full_link)
                    
                if len(news_items) >= 10:
                    break
                    
        if not news_items:
            error_message = f"Yahoo Finance: No articles for '{ticker_symbol}'."
            
    except requests.exceptions.Timeout:
        error_message = f"Yahoo Finance: Timeout for '{ticker_symbol}'."
    except requests.exceptions.RequestException as e:
        error_message = f"Yahoo Finance Error for '{ticker_symbol}': {str(e)}"
    except Exception as e:
        error_message = f"Yahoo Finance Unexpected Error for '{ticker_symbol}': {str(e)}"
    
    return news_items[:10], error_message

def get_chatbot_response(user_query, stock_data_bundle_local, current_ticker_symbol, stock_currency_sym):
    """Generate a response to a user's query about a stock"""
    query = user_query.lower().strip()
    s_info_chat = stock_data_bundle_local.get('s_info_full', {})
    df_ta_chat = stock_data_bundle_local.get('df_ta')
    current_price_chat = stock_data_bundle_local.get('current_price')
    news_items_chat = stock_data_bundle_local.get('processed_news', [])
    overall_news_sentiment_chat = stock_data_bundle_local.get('overall_news_sentiment_stats', {})
    ticker_name_chat = s_info_chat.get('shortName', current_ticker_symbol)
    signal = stock_data_bundle_local.get('signal', 'N/A')
    signal_reason = stock_data_bundle_local.get('signal_reason', 'N/A')
    
    if not s_info_chat and (df_ta_chat is None or df_ta_chat.empty):
        return "Please ensure a stock ticker is loaded in the sidebar to ask questions about it."
    
    # General Greetings
    if any(greet in query for greet in ["hello", "hi", "hey"]):
        return f"Hello! I'm StockSeer, your AI assistant for {ticker_name_chat}. What would you like to know?"
    
    # Current Price & Basic Info
    if "price" in query:
        response = f"The current price of {ticker_name_chat} is **{stock_currency_sym}{current_price_chat:.2f}**." if current_price_chat else "Current price data not available."
    elif "52-week high" in query:
        high = s_info_chat.get('fiftyTwoWeekHigh')
        response = f"The 52-week high for {ticker_name_chat} is **{stock_currency_sym}{high:.2f}**." if high else "52-week high not available."
    elif "52-week low" in query:
        low = s_info_chat.get('fiftyTwoWeekLow')
        response = f"The 52-week low for {ticker_name_chat} is **{stock_currency_sym}{low:.2f}**." if low else "52-week low not available."
    elif "market cap" in query:
        mcap = s_info_chat.get('marketCap')
        response = f"The market capitalization for {ticker_name_chat} is **{stock_currency_sym}{mcap:,.0f}**." if mcap else "Market Cap is not available."
    elif any(q in query for q in ["about", "summary", "tell me about"]):
        summary = s_info_chat.get('longBusinessSummary')
        response = f"**About {ticker_name_chat}:**\n\n{summary}" if summary else "A business summary is not available for this stock."
    
    # Technical Indicators
    elif "rsi" in query:
        rsi_val = df_ta_chat['RSI'].iloc[-1] if df_ta_chat is not None and not df_ta_chat.empty and 'RSI' in df_ta_chat.columns and pd.notna(df_ta_chat['RSI'].iloc[-1]) else None
        if rsi_val is not None:
            status = "oversold (< 30)" if rsi_val < 30 else "overbought (> 70)" if rsi_val > 70 else "neutral"
            response = f"The latest RSI for {ticker_name_chat} is **{rsi_val:.2f}**, which is in the **{status}** zone."
        else:
            response = "RSI data is not available."
    elif "macd" in query:
        macd_val = df_ta_chat['MACD_hist'].iloc[-1] if df_ta_chat is not None and not df_ta_chat.empty and 'MACD_hist' in df_ta_chat.columns and pd.notna(df_ta_chat['MACD_hist'].iloc[-1]) else None
        if macd_val is not None:
            status = "positive (bullish momentum)" if macd_val > 0 else "negative (bearish momentum)"
            response = f"The latest MACD Histogram value for {ticker_name_chat} is **{macd_val:.2f}**, indicating **{status}**."
        else:
            response = "MACD data is not available."
    elif any(q in query for q in ["technical signal", "buy or sell", "recommendation"]):
        response = f"The current AI-generated signal for {ticker_name_chat} is **{signal}**.\n\n*Reasoning: {signal_reason}*\n\n**Disclaimer:** This is an automated analysis and not financial advice."
    
    # Fundamental Analysis
    elif "p/e" in query or "price to earnings" in query:
        pe = s_info_chat.get('trailingPE')
        response = f"The trailing Price-to-Earnings (P/E) ratio for {ticker_name_chat} is **{pe:.2f}**." if pe else "P/E ratio is not available."
    elif "eps" in query or "earnings per share" in query:
        eps = s_info_chat.get('trailingEps')
        response = f"The trailing Earnings Per Share (EPS) for {ticker_name_chat} is **{stock_currency_sym}{eps:.2f}**." if eps else "EPS data is not available."
    elif "dividend" in query:
        div_yield = s_info_chat.get('dividendYield')
        response = f"The dividend yield for {ticker_name_chat} is **{div_yield*100:.2f}%**." if div_yield else f"{ticker_name_chat} does not currently pay a dividend."
    elif "sector" in query:
        sec_chat = s_info_chat.get('sector')
        response = f"{ticker_name_chat} belongs to the **{sec_chat}** sector." if sec_chat and sec_chat != 'N/A' else "Sector data is not available."
    elif "industry" in query:
        ind_chat = s_info_chat.get('industry')
        response = f"{ticker_name_chat} is in the **{ind_chat}** industry." if ind_chat and ind_chat != 'N/A' else "Industry data is not available."
    
    # News & Sentiment
    elif "news sentiment" in query:
        if overall_news_sentiment_chat and overall_news_sentiment_chat.get('total_articles', 0) > 0:
            sent_label = overall_news_sentiment_chat.get('label', 'Neutral').lower()
            sent_score = overall_news_sentiment_chat.get('score', 0.0)
            source_used = overall_news_sentiment_chat.get('source', 'available sources')
            response = f"Overall news sentiment for {ticker_name_chat} (from {source_used}) is **{sent_label}** with a score of **{sent_score:.2f}**."
        else:
            response = f"Overall news sentiment data for {ticker_name_chat} is unavailable."
    elif "news" in query:
        if news_items_chat:
            response = f"Here are the top 3 recent news headlines for {ticker_name_chat}:\n\n"
            for i, item in enumerate(news_items_chat[:3]):
                response += f"**{i+1}. {item.get('title','N/A')}**\n\n   *Source: {item.get('publisher', item.get('source', 'N/A'))}*\n\n"
            if overall_news_sentiment_chat and overall_news_sentiment_chat.get('total_articles', 0) > 0:
                response += f"*Overall news sentiment is **{overall_news_sentiment_chat.get('label', 'Neutral').lower()}**.*"
        else:
            response = f"No recent news could be found for {ticker_name_chat}."
    
    # Fallback response
    else:
        response = "I'm not sure how to answer that. You can ask me about the current price, P/E ratio, RSI, MACD, the latest news, or the technical signal. Try one of the prompts below!"
    
    return response

def get_stock_news_from_newsapi(ticker_symbol_or_company_name):
    """Get stock news from NewsAPI with enhanced image handling"""
    news_items, error_message = [], None
    if not os.getenv("NEWS_API_KEY"): 
        return news_items, "NEWS_API_KEY not configured."
    
    query_term = ticker_symbol_or_company_name
    try:
        stock_info_temp = yf.Ticker(ticker_symbol_or_company_name).info
        if stock_info_temp and stock_info_temp.get('shortName'):
            company_name_for_search = stock_info_temp['shortName'].replace(" Inc.", "").replace(" Corp.", "").replace(" Ltd.", "")
            if len(company_name_for_search) > 3: 
                query_term = company_name_for_search
    except: 
        pass
    
    to_date = datetime.now().strftime('%Y-%m-%d')
    from_date = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
    url = f"https://newsapi.org/v2/everything?q={query_term}&from={from_date}&to={to_date}&language=en&sortBy=relevancy&pageSize=15&apiKey={os.getenv('NEWS_API_KEY')}"
    
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        articles_data = response.json().get("articles", [])
        
        if not articles_data: 
            error_message = f"No recent news for '{query_term}' via NewsAPI."
        else:
            for item in articles_data:
                publish_time_readable = pd.to_datetime(item['publishedAt']).strftime('%Y-%m-%d %H:%M') if item.get('publishedAt') else "N/A"
                
                # Enhanced image URL handling
                image_url = item.get('urlToImage')
                if not image_url or not image_url.startswith('http'):
                    # Try to get image from article URL
                    try:
                        article_response = requests.get(item.get('url', ''), timeout=5)
                        if article_response.status_code == 200:
                            soup = BeautifulSoup(article_response.text, 'html.parser')
                            # Try to find the first valid image
                            for img in soup.find_all('img'):
                                if img.get('src') and img['src'].startswith('http'):
                                    image_url = img['src']
                                    break
                    except:
                        pass
                
                news_items.append({
                    'title': item.get('title', 'N/A'), 
                    'description': item.get('description'), 
                    'link': item.get('url', '#'), 
                    'published': publish_time_readable, 
                    'publisher': item.get('source', {}).get('name', 'N/A'), 
                    'source_api': 'NewsAPI',
                    'image_url': image_url
                })
            news_items = news_items[:10] 
    except requests.exceptions.RequestException as e:
        error_message = f"NewsAPI Error for '{query_term}': {str(e)}"
        if hasattr(e, 'response') and e.response is not None:
            if e.response.status_code == 401: 
                error_message += " (Invalid Key?)"
            elif e.response.status_code == 429: 
                error_message += " (Rate Limit?)"
    except Exception as e: 
        error_message = f"NewsAPI Unexpected Error for '{query_term}': {str(e)}"
    
    return news_items, error_message

def analyze_news_item_sentiment_vader(text):
    """Analyze sentiment using VADER sentiment analyzer"""
    try:
        analyzer = SentimentIntensityAnalyzer()
        sentiment_scores = analyzer.polarity_scores(text)
        return sentiment_scores['compound']
    except Exception as e:
        return 0.0

def analyze_sentiment_text_hf(text):
    """Analyze sentiment using Hugging Face transformers"""
    try:
        # This would require the transformers library and a sentiment model
        # For now, return a neutral sentiment
        return 0.0
    except Exception as e:
        return 0.0

def load_lottiefile(filepath: str):
    """Load Lottie animation file"""
    try:
        with open(filepath, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Lottie/Asset file not found: {filepath}")
        return None
    except json.JSONDecodeError:
        print(f"Error decoding Lottie JSON: {filepath}")
        return None

def load_hf_sentiment_model():
    """Load Hugging Face sentiment model"""
    try:
        # This would require the transformers library
        # For now, return None
        return None
    except Exception as e:
        print(f"Error loading HF model: {e}")
        return None

def load_vader_sentiment_analyzer():
    """Load VADER sentiment analyzer"""
    try:
        return SentimentIntensityAnalyzer()
    except Exception as e:
        print(f"Error loading VADER analyzer: {e}")
        return None

def _render_metric_box(content):
    """Render metric box for UI"""
    return f"""
        <div class="metric-box">
            {content}
        </div>
    """

def _render_tag(tag_text, sentiment_class=""):
    """Render tag with sentiment class"""
    return f"""
        <span class="tag {sentiment_class}">
            {tag_text}
        </span>
    """

# --- API ENDPOINTS ---

@app.get("/test")
async def test_endpoint():
    """Simple test endpoint to verify API is working"""
    return {
        "message": "StockSeer API is running successfully!",
        "timestamp": datetime.now().isoformat(),
        "status": "healthy"
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "StockSeer API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": [
            # Stock Data
            "/stocks/{symbol}",
            "/stocks/{symbol}/chart",
            "/stocks/{symbol}/technical",
            "/stocks/{symbol}/enhanced-technical",
            "/stocks/{symbol}/news",
            "/stocks/{symbol}/prediction",
            "/stocks/{symbol}/advanced-metrics",
            "/stocks/{symbol}/financials",
            "/stocks/{symbol}/analysts",
            "/stocks/{symbol}/holders",
            "/stocks/search",
            
            # Portfolio & Watchlist
            "/portfolio",
            "/portfolio/{symbol}",
            "/watchlist",
            "/watchlist/{symbol}",
            
            # Analysis & Simulation
            "/simulation/monte-carlo",
            "/screener/run",
            "/market/simulation",
            
            # Alerts
            "/alerts",
            "/alerts/check/{symbol}",
            "/alerts/triggered",
            
            # News & Media
            "/chatbot/query",
            "/images/company/{query}",
            "/news/scrape/google",
            "/news/scrape/yahoo/{symbol}",
            
            # System
            "/health"
        ]
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy", 
        "timestamp": datetime.now().isoformat(),
        "rate_limiter": {
            "current_requests": len(rate_limiter.requests),
            "max_requests": rate_limiter.max_requests,
            "time_window": rate_limiter.time_window
        }
    }

@app.get("/stocks/{symbol}", response_model=StockData)
async def get_stock_data(symbol: str):
    """Get current stock data for a symbol"""
    try:
        # Apply rate limiting
        rate_limiter.acquire()
        return get_stock_info(symbol.upper())
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/stocks/{symbol}/chart")
async def get_stock_chart(symbol: str, period: str = "1y", interval: str = "1d"):
    """Get historical chart data for a stock"""
    try:
        # Handle different period formats and intervals
        period_mapping = {
            '1D': ('1d', '5m'),  # 1 day with 5-minute intervals
            '1W': ('5d', '1h'),  # 5 days with 1-hour intervals
            '1M': ('1mo', '1d'), # 1 month with daily intervals
            '3M': ('3mo', '1d'), # 3 months with daily intervals
            '1Y': ('1y', '1d')   # 1 year with daily intervals
        }
        
        # Map frontend period to yfinance period and interval
        if period in period_mapping:
            yf_period, yf_interval = period_mapping[period]
        else:
            yf_period, yf_interval = period, interval
        
        print(f"Fetching chart data for {symbol} with period={yf_period}, interval={yf_interval}")
        df = fetch_stock_data(symbol.upper(), yf_period, yf_interval)
        
        if df.empty:
            print(f"No data available for {symbol}")
            raise HTTPException(
                status_code=404, 
                detail=f"No chart data available for symbol '{symbol}'. The symbol may be invalid, delisted, or not supported."
            )
        
        chart_data = []
        for index, row in df.iterrows():
            # Format date based on interval
            if yf_interval in ['5m', '15m', '30m', '1h']:
                date_format = '%Y-%m-%d %H:%M'
            else:
                date_format = '%Y-%m-%d'
            
            chart_data.append(StockChartData(
                date=index.strftime(date_format),
                open=float(row['Open']),
                high=float(row['High']),
                low=float(row['Low']),
                close=float(row['Close']),
                volume=int(row['Volume'])
            ))
        
        print(f"Successfully fetched {len(chart_data)} data points for {symbol}")
        return {
            "symbol": symbol.upper(),
            "period": period,
            "interval": yf_interval,
            "data": chart_data
        }
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        print(f"Unexpected error fetching chart data for {symbol}: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Internal server error while fetching chart data for {symbol}: {str(e)}"
        )

@app.get("/stocks/{symbol}/technical")
async def get_technical_indicators(symbol: str, period: str = "1y"):
    """Get technical indicators for a stock"""
    try:
        df = fetch_stock_data(symbol.upper(), period)
        
        if df.empty:
            raise HTTPException(status_code=404, detail=f"No data available for {symbol}")
        
        df_ta = add_technical_indicators(df)
        
        if df_ta.empty:
            raise HTTPException(status_code=500, detail="Failed to calculate technical indicators")
        
        latest = df_ta.iloc[-1]
        
        # Generate trading signal
        signal, reason = generate_signal(df_ta)
        
        return {
            "symbol": symbol.upper(),
            "signal": signal,
            "reason": reason,
            "indicators": {
                "sma_20": float(latest.get('SMA_20', 0)),
                "sma_50": float(latest.get('SMA_50', 0)),
                "rsi": float(latest.get('RSI', 0)),
                "macd_line": float(latest.get('MACD_line', 0)),
                "macd_signal": float(latest.get('MACD_signal', 0)),
                "macd_histogram": float(latest.get('MACD_hist', 0)),
                "bb_high": float(latest.get('BB_High', 0)),
                "bb_mid": float(latest.get('BB_Mid', 0)),
                "bb_low": float(latest.get('BB_Low', 0))
            },
            "current_price": float(latest.get('Close', 0)),
            "volume": int(latest.get('Volume', 0))
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stocks/{symbol}/news")
async def get_stock_news_endpoint(symbol: str, max_articles: int = 8):
    """Get comprehensive news for a stock from multiple sources with sentiment analysis"""
    try:
        ticker = symbol.upper()
        
        # Get news from multiple sources
        news_by_source = {}
        error_messages = {}
        
        # 1. NewsAPI
        if os.getenv("NEWS_API_KEY"):
            try:
                news_items_api, error_message_api = get_stock_news_from_newsapi(ticker)
                if news_items_api:
                    news_by_source['NewsAPI'] = news_items_api
                if error_message_api:
                    error_messages['NewsAPI'] = error_message_api
            except Exception as e:
                error_messages['NewsAPI'] = f"NewsAPI error: {str(e)}"
        
        # 2. Yahoo Finance
        try:
            scraped_yfinance_items, yfinance_error = scrape_yahoo_finance_news(ticker)
            if scraped_yfinance_items:
                news_by_source['Yahoo Finance'] = scraped_yfinance_items
            if yfinance_error:
                error_messages['Yahoo Finance'] = yfinance_error
        except Exception as e:
            error_messages['Yahoo Finance'] = f"Yahoo Finance error: {str(e)}"
        
        # 3. Google News
        try:
            scraped_gnews_items, gnews_error = scrape_google_news(ticker)
            if scraped_gnews_items:
                news_by_source['Google News'] = scraped_gnews_items
            if gnews_error:
                error_messages['Google News'] = gnews_error
        except Exception as e:
            error_messages['Google News'] = f"Google News error: {str(e)}"
        
        # Calculate overall sentiment
        overall_sentiment_score = 0.0
        total_articles = 0
        
        for source, articles in news_by_source.items():
            for article in articles:
                sentiment = article.get('vader_sentiment', {})
                sentiment_score = sentiment.get('compound', 0)
                overall_sentiment_score += sentiment_score
                total_articles += 1
        
        if total_articles > 0:
            overall_sentiment_score = overall_sentiment_score / total_articles
        
        # Get fallback news if no sources worked
        if not news_by_source:
            fallback_news = get_stock_news(ticker, max_articles)
            news_by_source['Fallback'] = fallback_news
        
        # Add sentiment scores to each article
        for source, articles in news_by_source.items():
            for article in articles:
                sentiment = article.get('vader_sentiment', {})
                sentiment_score = sentiment.get('compound', 0)
                article['sentiment_score'] = round(sentiment_score, 3)
                article['sentiment_label'] = "positive" if sentiment_score > 0.05 else "negative" if sentiment_score < -0.05 else "neutral"
        
        return {
            "symbol": ticker,
            "news_by_source": news_by_source,
            "overall_sentiment_score": round(overall_sentiment_score, 3),
            "overall_sentiment_label": "positive" if overall_sentiment_score > 0.05 else "negative" if overall_sentiment_score < -0.05 else "neutral",
            "total_articles": sum(len(articles) for articles in news_by_source.values()),
            "error_messages": error_messages,
            "sources_available": list(news_by_source.keys()),
            "sentiment_summary": {
                "score": round(overall_sentiment_score, 3),
                "label": "positive" if overall_sentiment_score > 0.05 else "negative" if overall_sentiment_score < -0.05 else "neutral",
                "strength": "strong" if abs(overall_sentiment_score) > 0.5 else "moderate" if abs(overall_sentiment_score) > 0.1 else "weak"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stocks/search", response_model=List[StockSearchResult])
async def search_stocks_simple(q: str):
    """Search for stocks by symbol or name"""
    try:
        if len(q) < 2:
            return []
        
        # Clean the query
        q = q.strip().upper()
        
        # Comprehensive stock database to avoid API calls
        stock_database = {
            # US Stocks
            'AAPL': {'name': 'Apple Inc.', 'sector': 'Technology'},
            'GOOGL': {'name': 'Alphabet Inc.', 'sector': 'Technology'},
            'MSFT': {'name': 'Microsoft Corporation', 'sector': 'Technology'},
            'TSLA': {'name': 'Tesla Inc.', 'sector': 'Automotive'},
            'AMZN': {'name': 'Amazon.com Inc.', 'sector': 'Consumer Discretionary'},
            'META': {'name': 'Meta Platforms Inc.', 'sector': 'Technology'},
            'NVDA': {'name': 'NVIDIA Corporation', 'sector': 'Technology'},
            'NFLX': {'name': 'Netflix Inc.', 'sector': 'Communication Services'},
            'JPM': {'name': 'JPMorgan Chase & Co.', 'sector': 'Financial Services'},
            'JNJ': {'name': 'Johnson & Johnson', 'sector': 'Healthcare'},
            'V': {'name': 'Visa Inc.', 'sector': 'Financial Services'},
            'PG': {'name': 'Procter & Gamble Co.', 'sector': 'Consumer Staples'},
            'UNH': {'name': 'UnitedHealth Group Inc.', 'sector': 'Healthcare'},
            'HD': {'name': 'Home Depot Inc.', 'sector': 'Consumer Discretionary'},
            'MA': {'name': 'Mastercard Inc.', 'sector': 'Financial Services'},
            'DIS': {'name': 'Walt Disney Co.', 'sector': 'Communication Services'},
            'PYPL': {'name': 'PayPal Holdings Inc.', 'sector': 'Financial Services'},
            'ADBE': {'name': 'Adobe Inc.', 'sector': 'Technology'},
            'CRM': {'name': 'Salesforce Inc.', 'sector': 'Technology'},
            'INTC': {'name': 'Intel Corporation', 'sector': 'Technology'},
            'PFE': {'name': 'Pfizer Inc.', 'sector': 'Healthcare'},
            'KO': {'name': 'Coca-Cola Co.', 'sector': 'Consumer Staples'},
            'PEP': {'name': 'PepsiCo Inc.', 'sector': 'Consumer Staples'},
            'ABT': {'name': 'Abbott Laboratories', 'sector': 'Healthcare'},
            'TMO': {'name': 'Thermo Fisher Scientific Inc.', 'sector': 'Healthcare'},
            'COST': {'name': 'Costco Wholesale Corp.', 'sector': 'Consumer Staples'},
            'AVGO': {'name': 'Broadcom Inc.', 'sector': 'Technology'},
            'ACN': {'name': 'Accenture PLC', 'sector': 'Technology'},
            'DHR': {'name': 'Danaher Corp.', 'sector': 'Healthcare'},
            'NEE': {'name': 'NextEra Energy Inc.', 'sector': 'Utilities'},
            'LLY': {'name': 'Eli Lilly and Co.', 'sector': 'Healthcare'},
            'TXN': {'name': 'Texas Instruments Inc.', 'sector': 'Technology'},
            'HON': {'name': 'Honeywell International Inc.', 'sector': 'Industrials'},
            'UNP': {'name': 'Union Pacific Corp.', 'sector': 'Industrials'},
            'IBM': {'name': 'International Business Machines Corp.', 'sector': 'Technology'},
            'CAT': {'name': 'Caterpillar Inc.', 'sector': 'Industrials'},
            'SPGI': {'name': 'S&P Global Inc.', 'sector': 'Financial Services'},
            'RTX': {'name': 'Raytheon Technologies Corp.', 'sector': 'Industrials'},
            'QCOM': {'name': 'Qualcomm Inc.', 'sector': 'Technology'},
            'AMAT': {'name': 'Applied Materials Inc.', 'sector': 'Technology'},
            'T': {'name': 'AT&T Inc.', 'sector': 'Communication Services'},
            'VZ': {'name': 'Verizon Communications Inc.', 'sector': 'Communication Services'},
            'CMCSA': {'name': 'Comcast Corp.', 'sector': 'Communication Services'},
            'CSCO': {'name': 'Cisco Systems Inc.', 'sector': 'Technology'},
            'ORCL': {'name': 'Oracle Corp.', 'sector': 'Technology'},
            'BA': {'name': 'Boeing Co.', 'sector': 'Industrials'},
            'GS': {'name': 'Goldman Sachs Group Inc.', 'sector': 'Financial Services'},
            'MS': {'name': 'Morgan Stanley', 'sector': 'Financial Services'},
            'BLK': {'name': 'BlackRock Inc.', 'sector': 'Financial Services'},
            'AXP': {'name': 'American Express Co.', 'sector': 'Financial Services'},
            'WMT': {'name': 'Walmart Inc.', 'sector': 'Consumer Staples'},
            'TGT': {'name': 'Target Corp.', 'sector': 'Consumer Discretionary'},
            'LOW': {'name': 'Lowe\'s Companies Inc.', 'sector': 'Consumer Discretionary'},
            'SBUX': {'name': 'Starbucks Corp.', 'sector': 'Consumer Discretionary'},
            'MCD': {'name': 'McDonald\'s Corp.', 'sector': 'Consumer Discretionary'},
            'NKE': {'name': 'Nike Inc.', 'sector': 'Consumer Discretionary'},
            'BKNG': {'name': 'Booking Holdings Inc.', 'sector': 'Consumer Discretionary'},
            'MAR': {'name': 'Marriott International Inc.', 'sector': 'Consumer Discretionary'},
            'HLT': {'name': 'Hilton Worldwide Holdings Inc.', 'sector': 'Consumer Discretionary'},
            'AAL': {'name': 'American Airlines Group Inc.', 'sector': 'Industrials'},
            'UAL': {'name': 'United Airlines Holdings Inc.', 'sector': 'Industrials'},
            'DAL': {'name': 'Delta Air Lines Inc.', 'sector': 'Industrials'},
            'LUV': {'name': 'Southwest Airlines Co.', 'sector': 'Industrials'},
            'XOM': {'name': 'Exxon Mobil Corp.', 'sector': 'Energy'},
            'CVX': {'name': 'Chevron Corp.', 'sector': 'Energy'},
            'COP': {'name': 'ConocoPhillips', 'sector': 'Energy'},
            'EOG': {'name': 'EOG Resources Inc.', 'sector': 'Energy'},
            'SLB': {'name': 'Schlumberger Ltd.', 'sector': 'Energy'},
            'KMI': {'name': 'Kinder Morgan Inc.', 'sector': 'Energy'},
            'PSX': {'name': 'Phillips 66', 'sector': 'Energy'},
            'MPC': {'name': 'Marathon Petroleum Corp.', 'sector': 'Energy'},
            'VLO': {'name': 'Valero Energy Corp.', 'sector': 'Energy'},
            'OXY': {'name': 'Occidental Petroleum Corp.', 'sector': 'Energy'},
            
            # Indian Stocks (NSE)
            'RELIANCE': {'name': 'Reliance Industries Ltd.', 'sector': 'Oil & Gas'},
            'RELIANCE.NS': {'name': 'Reliance Industries Ltd.', 'sector': 'Oil & Gas'},
            'TCS': {'name': 'Tata Consultancy Services Ltd.', 'sector': 'Technology'},
            'TCS.NS': {'name': 'Tata Consultancy Services Ltd.', 'sector': 'Technology'},
            'HDFCBANK': {'name': 'HDFC Bank Ltd.', 'sector': 'Banking'},
            'HDFCBANK.NS': {'name': 'HDFC Bank Ltd.', 'sector': 'Banking'},
            'INFY': {'name': 'Infosys Ltd.', 'sector': 'Technology'},
            'INFY.NS': {'name': 'Infosys Ltd.', 'sector': 'Technology'},
            'ICICIBANK': {'name': 'ICICI Bank Ltd.', 'sector': 'Banking'},
            'ICICIBANK.NS': {'name': 'ICICI Bank Ltd.', 'sector': 'Banking'},
            'HINDUNILVR': {'name': 'Hindustan Unilever Ltd.', 'sector': 'Consumer Goods'},
            'HINDUNILVR.NS': {'name': 'Hindustan Unilever Ltd.', 'sector': 'Consumer Goods'},
            'ITC': {'name': 'ITC Ltd.', 'sector': 'Consumer Goods'},
            'ITC.NS': {'name': 'ITC Ltd.', 'sector': 'Consumer Goods'},
            'SBIN': {'name': 'State Bank of India', 'sector': 'Banking'},
            'SBIN.NS': {'name': 'State Bank of India', 'sector': 'Banking'},
            'BHARTIARTL': {'name': 'Bharti Airtel Ltd.', 'sector': 'Telecommunications'},
            'BHARTIARTL.NS': {'name': 'Bharti Airtel Ltd.', 'sector': 'Telecommunications'},
            'AXISBANK': {'name': 'Axis Bank Ltd.', 'sector': 'Banking'},
            'AXISBANK.NS': {'name': 'Axis Bank Ltd.', 'sector': 'Banking'},
            'KOTAKBANK': {'name': 'Kotak Mahindra Bank Ltd.', 'sector': 'Banking'},
            'KOTAKBANK.NS': {'name': 'Kotak Mahindra Bank Ltd.', 'sector': 'Banking'},
            'ASIANPAINT': {'name': 'Asian Paints Ltd.', 'sector': 'Consumer Goods'},
            'ASIANPAINT.NS': {'name': 'Asian Paints Ltd.', 'sector': 'Consumer Goods'},
            'MARUTI': {'name': 'Maruti Suzuki India Ltd.', 'sector': 'Automotive'},
            'MARUTI.NS': {'name': 'Maruti Suzuki India Ltd.', 'sector': 'Automotive'},
            'WIPRO': {'name': 'Wipro Ltd.', 'sector': 'Technology'},
            'WIPRO.NS': {'name': 'Wipro Ltd.', 'sector': 'Technology'},
            'ULTRACEMCO': {'name': 'UltraTech Cement Ltd.', 'sector': 'Construction'},
            'ULTRACEMCO.NS': {'name': 'UltraTech Cement Ltd.', 'sector': 'Construction'},
            'SUNPHARMA': {'name': 'Sun Pharmaceutical Industries Ltd.', 'sector': 'Healthcare'},
            'SUNPHARMA.NS': {'name': 'Sun Pharmaceutical Industries Ltd.', 'sector': 'Healthcare'},
            'TATAMOTORS': {'name': 'Tata Motors Ltd.', 'sector': 'Automotive'},
            'TATAMOTORS.NS': {'name': 'Tata Motors Ltd.', 'sector': 'Automotive'},
            'NESTLEIND': {'name': 'Nestle India Ltd.', 'sector': 'Consumer Goods'},
            'NESTLEIND.NS': {'name': 'Nestle India Ltd.', 'sector': 'Consumer Goods'},
            'POWERGRID': {'name': 'Power Grid Corporation of India Ltd.', 'sector': 'Utilities'},
            'POWERGRID.NS': {'name': 'Power Grid Corporation of India Ltd.', 'sector': 'Utilities'},
            'BPCL': {'name': 'Bharat Petroleum Corporation Ltd.', 'sector': 'Oil & Gas'},
            'BPCL.NS': {'name': 'Bharat Petroleum Corporation Ltd.', 'sector': 'Oil & Gas'},
            'ONGC': {'name': 'Oil & Natural Gas Corporation Ltd.', 'sector': 'Oil & Gas'},
            'ONGC.NS': {'name': 'Oil & Natural Gas Corporation Ltd.', 'sector': 'Oil & Gas'},
            'TATACONSUM': {'name': 'Tata Consumer Products Ltd.', 'sector': 'Consumer Goods'},
            'TATACONSUM.NS': {'name': 'Tata Consumer Products Ltd.', 'sector': 'Consumer Goods'},
            'HCLTECH': {'name': 'HCL Technologies Ltd.', 'sector': 'Technology'},
            'HCLTECH.NS': {'name': 'HCL Technologies Ltd.', 'sector': 'Technology'},
            'BAJFINANCE': {'name': 'Bajaj Finance Ltd.', 'sector': 'Financial Services'},
            'BAJFINANCE.NS': {'name': 'Bajaj Finance Ltd.', 'sector': 'Financial Services'},
            'ADANIENT': {'name': 'Adani Enterprises Ltd.', 'sector': 'Conglomerate'},
            'ADANIENT.NS': {'name': 'Adani Enterprises Ltd.', 'sector': 'Conglomerate'},
            'ADANIPORTS': {'name': 'Adani Ports & Special Economic Zone Ltd.', 'sector': 'Infrastructure'},
            'ADANIPORTS.NS': {'name': 'Adani Ports & Special Economic Zone Ltd.', 'sector': 'Infrastructure'},
            'JSWSTEEL': {'name': 'JSW Steel Ltd.', 'sector': 'Metals'},
            'JSWSTEEL.NS': {'name': 'JSW Steel Ltd.', 'sector': 'Metrials'},
            'TITAN': {'name': 'Titan Company Ltd.', 'sector': 'Consumer Goods'},
            'TITAN.NS': {'name': 'Titan Company Ltd.', 'sector': 'Consumer Goods'},
            'BAJAJFINSV': {'name': 'Bajaj Finserv Ltd.', 'sector': 'Financial Services'},
            'BAJAJFINSV.NS': {'name': 'Bajaj Finserv Ltd.', 'sector': 'Financial Services'},
            'COALINDIA': {'name': 'Coal India Ltd.', 'sector': 'Mining'},
            'COALINDIA.NS': {'name': 'Coal India Ltd.', 'sector': 'Mining'},
            'INDUSINDBK': {'name': 'IndusInd Bank Ltd.', 'sector': 'Banking'},
            'INDUSINDBK.NS': {'name': 'IndusInd Bank Ltd.', 'sector': 'Banking'},
            'DRREDDY': {'name': 'Dr. Reddy\'s Laboratories Ltd.', 'sector': 'Healthcare'},
            'DRREDDY.NS': {'name': 'Dr. Reddy\'s Laboratories Ltd.', 'sector': 'Healthcare'},
            'SHREECEM': {'name': 'Shree Cement Ltd.', 'sector': 'Construction'},
            'SHREECEM.NS': {'name': 'Shree Cement Ltd.', 'sector': 'Consumer Goods'},
            'CIPLA': {'name': 'Cipla Ltd.', 'sector': 'Healthcare'},
            'CIPLA.NS': {'name': 'Cipla Ltd.', 'sector': 'Healthcare'},
            'DIVISLAB': {'name': 'Divi\'s Laboratories Ltd.', 'sector': 'Healthcare'},
            'DIVISLAB.NS': {'name': 'Divi\'s Laboratories Ltd.', 'sector': 'Healthcare'},
            'EICHERMOT': {'name': 'Eicher Motors Ltd.', 'sector': 'Automotive'},
            'EICHERMOT.NS': {'name': 'Eicher Motors Ltd.', 'sector': 'Automotive'},
            'HEROMOTOCO': {'name': 'Hero MotoCorp Ltd.', 'sector': 'Automotive'},
            'HEROMOTOCO.NS': {'name': 'Hero MotoCorp Ltd.', 'sector': 'Automotive'},
            'BRITANNIA': {'name': 'Britannia Industries Ltd.', 'sector': 'Consumer Goods'},
            'BRITANNIA.NS': {'name': 'Britannia Industries Ltd.', 'sector': 'Consumer Goods'},
            'GRASIM': {'name': 'Grasim Industries Ltd.', 'sector': 'Construction'},
            'GRASIM.NS': {'name': 'Grasim Industries Ltd.', 'sector': 'Construction'},
            'TECHM': {'name': 'Tech Mahindra Ltd.', 'sector': 'Technology'},
            'TECHM.NS': {'name': 'Tech Mahindra Ltd.', 'sector': 'Technology'},
            'VEDL': {'name': 'Vedanta Ltd.', 'sector': 'Mining'},
            'VEDL.NS': {'name': 'Vedanta Ltd.', 'sector': 'Mining'},
            'HINDALCO': {'name': 'Hindalco Industries Ltd.', 'sector': 'Metals'},
            'HINDALCO.NS': {'name': 'Hindalco Industries Ltd.', 'sector': 'Metals'},
            'SBILIFE': {'name': 'SBI Life Insurance Company Ltd.', 'sector': 'Insurance'},
            'SBILIFE.NS': {'name': 'SBI Life Insurance Company Ltd.', 'sector': 'Insurance'},
            'ICICIPRULI': {'name': 'ICICI Prudential Life Insurance Company Ltd.', 'sector': 'Insurance'},
            'ICICIPRULI.NS': {'name': 'ICICI Prudential Life Insurance Company Ltd.', 'sector': 'Insurance'},
            'HDFCLIFE': {'name': 'HDFC Life Insurance Company Ltd.', 'sector': 'Insurance'},
            'HDFCLIFE.NS': {'name': 'HDFC Life Insurance Company Ltd.', 'sector': 'Insurance'},
            'APOLLOHOSP': {'name': 'Apollo Hospitals Enterprise Ltd.', 'sector': 'Healthcare'},
            'APOLLOHOSP.NS': {'name': 'Apollo Hospitals Enterprise Ltd.', 'sector': 'Healthcare'},
            'BAJAJ-AUTO': {'name': 'Bajaj Auto Ltd.', 'sector': 'Automotive'},
            'BAJAJ-AUTO.NS': {'name': 'Bajaj Auto Ltd.', 'sector': 'Automotive'},
            'M&M': {'name': 'Mahindra & Mahindra Ltd.', 'sector': 'Automotive'},
            'M&M.NS': {'name': 'Mahindra & Mahindra Ltd.', 'sector': 'Automotive'},
            'LT': {'name': 'Larsen & Toubro Ltd.', 'sector': 'Construction'},
            'LT.NS': {'name': 'Larsen & Toubro Ltd.', 'sector': 'Construction'},
            'ITC': {'name': 'ITC Ltd.', 'sector': 'Consumer Goods'},
            'ITC.NS': {'name': 'ITC Ltd.', 'sector': 'Consumer Goods'},
            
            # Additional popular Indian stocks
            'HINDALCO': {'name': 'Hindalco Industries Ltd.', 'sector': 'Metals'},
            'HINDALCO.NS': {'name': 'Hindalco Industries Ltd.', 'sector': 'Metals'},
            'TATACONSUM': {'name': 'Tata Consumer Products Ltd.', 'sector': 'Consumer Goods'},
            'TATACONSUM.NS': {'name': 'Tata Consumer Products Ltd.', 'sector': 'Consumer Goods'},
            'HCLTECH': {'name': 'HCL Technologies Ltd.', 'sector': 'Technology'},
            'HCLTECH.NS': {'name': 'HCL Technologies Ltd.', 'sector': 'Technology'},
            'BAJFINANCE': {'name': 'Bajaj Finance Ltd.', 'sector': 'Financial Services'},
            'BAJFINANCE.NS': {'name': 'Bajaj Finance Ltd.', 'sector': 'Financial Services'},
            'ADANIENT': {'name': 'Adani Enterprises Ltd.', 'sector': 'Conglomerate'},
            'ADANIENT.NS': {'name': 'Adani Enterprises Ltd.', 'sector': 'Conglomerate'},
            'ADANIPORTS': {'name': 'Adani Ports & Special Economic Zone Ltd.', 'sector': 'Infrastructure'},
            'ADANIPORTS.NS': {'name': 'Adani Ports & Special Economic Zone Ltd.', 'sector': 'Infrastructure'},
            'JSWSTEEL': {'name': 'JSW Steel Ltd.', 'sector': 'Metals'},
            'JSWSTEEL.NS': {'name': 'JSW Steel Ltd.', 'sector': 'Metals'},
            'TITAN': {'name': 'Titan Company Ltd.', 'sector': 'Consumer Goods'},
            'TITAN.NS': {'name': 'Titan Company Ltd.', 'sector': 'Consumer Goods'},
            'BAJAJFINSV': {'name': 'Bajaj Finserv Ltd.', 'sector': 'Financial Services'},
            'BAJAJFINSV.NS': {'name': 'Bajaj Finserv Ltd.', 'sector': 'Financial Services'},
            'COALINDIA': {'name': 'Coal India Ltd.', 'sector': 'Mining'},
            'COALINDIA.NS': {'name': 'Coal India Ltd.', 'sector': 'Mining'},
            'INDUSINDBK': {'name': 'IndusInd Bank Ltd.', 'sector': 'Banking'},
            'INDUSINDBK.NS': {'name': 'IndusInd Bank Ltd.', 'sector': 'Banking'},
            'DRREDDY': {'name': 'Dr. Reddy\'s Laboratories Ltd.', 'sector': 'Healthcare'},
            'DRREDDY.NS': {'name': 'Dr. Reddy\'s Laboratories Ltd.', 'sector': 'Healthcare'},
            'SHREECEM': {'name': 'Shree Cement Ltd.', 'sector': 'Construction'},
            'SHREECEM.NS': {'name': 'Shree Cement Ltd.', 'sector': 'Construction'},
            'CIPLA': {'name': 'Cipla Ltd.', 'sector': 'Healthcare'},
            'CIPLA.NS': {'name': 'Cipla Ltd.', 'sector': 'Healthcare'},
            'DIVISLAB': {'name': 'Divi\'s Laboratories Ltd.', 'sector': 'Healthcare'},
            'DIVISLAB.NS': {'name': 'Divi\'s Laboratories Ltd.', 'sector': 'Healthcare'},
            'EICHERMOT': {'name': 'Eicher Motors Ltd.', 'sector': 'Automotive'},
            'EICHERMOT.NS': {'name': 'Eicher Motors Ltd.', 'sector': 'Automotive'},
            'HEROMOTOCO': {'name': 'Hero MotoCorp Ltd.', 'sector': 'Automotive'},
            'HEROMOTOCO.NS': {'name': 'Hero MotoCorp Ltd.', 'sector': 'Automotive'},
            'BRITANNIA': {'name': 'Britannia Industries Ltd.', 'sector': 'Consumer Goods'},
            'BRITANNIA.NS': {'name': 'Britannia Industries Ltd.', 'sector': 'Consumer Goods'},
            'GRASIM': {'name': 'Grasim Industries Ltd.', 'sector': 'Construction'},
            'GRASIM.NS': {'name': 'Grasim Industries Ltd.', 'sector': 'Construction'},
            'TECHM': {'name': 'Tech Mahindra Ltd.', 'sector': 'Technology'},
            'TECHM.NS': {'name': 'Tech Mahindra Ltd.', 'sector': 'Technology'},
            'VEDL': {'name': 'Vedanta Ltd.', 'sector': 'Mining'},
            'VEDL.NS': {'name': 'Vedanta Ltd.', 'sector': 'Mining'},
            'HINDALCO': {'name': 'Hindalco Industries Ltd.', 'sector': 'Metals'},
            'HINDALCO.NS': {'name': 'Hindalco Industries Ltd.', 'sector': 'Metals'},
            'SBILIFE': {'name': 'SBI Life Insurance Company Ltd.', 'sector': 'Insurance'},
            'SBILIFE.NS': {'name': 'SBI Life Insurance Company Ltd.', 'sector': 'Insurance'},
            'ICICIPRULI': {'name': 'ICICI Prudential Life Insurance Company Ltd.', 'sector': 'Insurance'},
            'ICICIPRULI.NS': {'name': 'ICICI Prudential Life Insurance Company Ltd.', 'sector': 'Insurance'},
            'HDFCLIFE': {'name': 'HDFC Life Insurance Company Ltd.', 'sector': 'Insurance'},
            'HDFCLIFE.NS': {'name': 'HDFC Life Insurance Company Ltd.', 'sector': 'Insurance'},
            'APOLLOHOSP': {'name': 'Apollo Hospitals Enterprise Ltd.', 'sector': 'Healthcare'},
            'APOLLOHOSP.NS': {'name': 'Apollo Hospitals Enterprise Ltd.', 'sector': 'Healthcare'},
            'BAJAJ-AUTO': {'name': 'Bajaj Auto Ltd.', 'sector': 'Automotive'},
            'BAJAJ-AUTO.NS': {'name': 'Bajaj Auto Ltd.', 'sector': 'Automotive'},
            'M&M': {'name': 'Mahindra & Mahindra Ltd.', 'sector': 'Automotive'},
            'M&M.NS': {'name': 'Mahindra & Mahindra Ltd.', 'sector': 'Automotive'},
            'LT': {'name': 'Larsen & Toubro Ltd.', 'sector': 'Construction'},
            'LT.NS': {'name': 'Larsen & Toubro Ltd.', 'sector': 'Construction'}
        }
        
        search_results = []
        query_upper = q.upper()
        query_lower = q.lower()
        
        # Search through the database
        for symbol, info in stock_database.items():
            # Check if symbol or name matches the query
            if (query_upper in symbol or 
                query_lower in info['name'].lower() or
                query_lower in symbol.lower()):
                
                # Calculate relevance score for sorting
                relevance_score = 0
                if symbol == query_upper:
                    relevance_score = 100  # Exact symbol match
                elif symbol.startswith(query_upper):
                    relevance_score = 95   # Starts with query
                elif query_upper in symbol:
                    relevance_score = 85   # Contains query
                elif query_lower in info['name'].lower():
                    relevance_score = 75   # Name match
                
                # Boost relevance for international stocks if query suggests it
                if '.NS' in symbol and any(indicator in query_upper for indicator in ['NS', 'NSE', 'INDIA', 'INDIAN']):
                    relevance_score += 10
                elif '.BO' in symbol and any(indicator in query_upper for indicator in ['BO', 'BSE', 'BOMBAY']):
                    relevance_score += 10
                
                search_results.append({
                    'symbol': symbol,
                    'name': info['name'],
                    'sector': info['sector'],
                    'relevance': relevance_score,
                    'price': None,  # We'll add live prices later if possible
                    'change': None
                })
        
        # Sort by relevance score
        search_results.sort(key=lambda x: x['relevance'], reverse=True)
        
        # Try to get live prices for top results (limited to avoid rate limiting)
        live_data_results = []
        max_live_requests = 3  # Limit live API calls
        
        for i, result in enumerate(search_results[:max_live_requests]):
            try:
                # Check cache first
                cache_key = f"price_{result['symbol']}"
                if cache_key in stock_cache:
                    cache_time, cache_data = stock_cache[cache_key]
                    if (datetime.now() - cache_time).seconds < cache_ttl:
                        if cache_data and 'regularMarketPrice' in cache_data and cache_data['regularMarketPrice']:
                            live_data_results.append(StockSearchResult(
                                symbol=result['symbol'],
                                name=result['name'],
                                price=cache_data.get('regularMarketPrice'),
                                change=cache_data.get('regularMarketChangePercent', 0),
                                sector=result.get('sector'),
                                relevance=result.get('relevance')
                            ))
                            continue
                
                # Try to get live data with rate limiting
                try:
                    rate_limiter.acquire()
                    ticker = yf.Ticker(result['symbol'])
                    info = ticker.info
                    
                    # Cache the result
                    stock_cache[cache_key] = (datetime.now(), info)
                    
                    if info and 'regularMarketPrice' in info and info['regularMarketPrice']:
                        live_data_results.append(StockSearchResult(
                            symbol=result['symbol'],
                            name=result['name'],
                            price=info.get('regularMarketPrice'),
                            change=info.get('regularMarketChangePercent', 0),
                            sector=result.get('sector'),
                            relevance=result.get('relevance')
                        ))
                    else:
                        # Add without live data
                        live_data_results.append(StockSearchResult(
                            symbol=result['symbol'],
                            name=result['name'],
                            price=None,
                            change=None,
                            sector=result.get('sector'),
                            relevance=result.get('relevance')
                        ))
                        
                except Exception as api_error:
                    # If API call fails, add without live data
                    live_data_results.append(StockSearchResult(
                        symbol=result['symbol'],
                        name=result['name'],
                        price=None,
                        change=None,
                        sector=result.get('sector'),
                        relevance=result.get('relevance')
                    ))
                    
            except Exception as e:
                # Add without live data if any error occurs
                live_data_results.append(StockSearchResult(
                    symbol=result['symbol'],
                    name=result['name'],
                    price=None,
                    change=None,
                    sector=result.get('sector'),
                    relevance=result.get('relevance')
                ))
        
        # Add remaining results without live data
        for result in search_results[max_live_requests:10]:  # Limit to 10 total results
            live_data_results.append(StockSearchResult(
                symbol=result['symbol'],
                name=result['name'],
                price=None,
                change=None,
                sector=result.get('sector'),
                relevance=result.get('relevance')
            ))
        
        return live_data_results
        
    except Exception as e:
        # Log the error for debugging
        print(f"Error in stock search for query '{q}': {str(e)}")
        
        # If everything fails, return basic fallback data
        fallback_results = []
        basic_stocks = {
            'AAPL': 'Apple Inc.',
            'GOOGL': 'Alphabet Inc.',
            'MSFT': 'Microsoft Corporation',
            'TSLA': 'Tesla Inc.',
            'AMZN': 'Amazon.com Inc.'
        }
        
        try:
            for symbol, name in basic_stocks.items():
                if (q.upper() in symbol or 
                    q.lower() in name.lower() or 
                    q.lower() in symbol.lower()):
                    fallback_results.append(StockSearchResult(
                        symbol=symbol,
                        name=name,
                        price=None,
                        change=None,
                        sector=None,
                        relevance=50
                    ))
        except Exception as fallback_error:
            print(f"Error in fallback search: {str(fallback_error)}")
        
        return fallback_results[:5]

@app.get("/stocks/search-simple", response_model=List[StockSearchResult])
async def search_stocks_simple(q: str):
    """Simple search for stocks by symbol or name (without live data)"""
    try:
        if len(q) < 2:
            return []
        
        # Clean the query
        q = q.strip().upper()
        
        # Simple stock database
        stock_database = {
            'AAPL': {'name': 'Apple Inc.', 'sector': 'Technology'},
            'GOOGL': {'name': 'Alphabet Inc.', 'sector': 'Technology'},
            'MSFT': {'name': 'Microsoft Corporation', 'sector': 'Technology'},
            'TSLA': {'name': 'Tesla Inc.', 'sector': 'Automotive'},
            'AMZN': {'name': 'Amazon.com Inc.', 'sector': 'Consumer Discretionary'},
            'META': {'name': 'Meta Platforms Inc.', 'sector': 'Technology'},
            'NVDA': {'name': 'NVIDIA Corporation', 'sector': 'Technology'},
            'NFLX': {'name': 'Netflix Inc.', 'sector': 'Communication Services'},
            'JPM': {'name': 'JPMorgan Chase & Co.', 'sector': 'Financial Services'},
            'JNJ': {'name': 'Johnson & Johnson', 'sector': 'Healthcare'},
            'V': {'name': 'Visa Inc.', 'sector': 'Financial Services'},
            'PG': {'name': 'Procter & Gamble Co.', 'sector': 'Consumer Staples'},
            'UNH': {'name': 'UnitedHealth Group Inc.', 'sector': 'Healthcare'},
            'HD': {'name': 'Home Depot Inc.', 'sector': 'Consumer Discretionary'},
            'MA': {'name': 'Mastercard Inc.', 'sector': 'Financial Services'},
            'DIS': {'name': 'Walt Disney Co.', 'sector': 'Communication Services'},
            'PYPL': {'name': 'PayPal Holdings Inc.', 'sector': 'Financial Services'},
            'ADBE': {'name': 'Adobe Inc.', 'sector': 'Technology'},
            'CRM': {'name': 'Salesforce Inc.', 'sector': 'Technology'},
            'INTC': {'name': 'Intel Corporation', 'sector': 'Technology'},
            'PFE': {'name': 'Pfizer Inc.', 'sector': 'Healthcare'},
            'RELIANCE.NS': {'name': 'Reliance Industries Ltd.', 'sector': 'Energy'},
            'TCS.NS': {'name': 'Tata Consultancy Services Ltd.', 'sector': 'Technology'},
            'INFY.NS': {'name': 'Infosys Ltd.', 'sector': 'Technology'},
            'HDFCBANK.NS': {'name': 'HDFC Bank Ltd.', 'sector': 'Financial Services'},
            'ICICIBANK.NS': {'name': 'ICICI Bank Ltd.', 'sector': 'Financial Services'},
            'KOTAKBANK.NS': {'name': 'Kotak Mahindra Bank Ltd.', 'sector': 'Financial Services'},
            'BHARTIARTL.NS': {'name': 'Bharti Airtel Ltd.', 'sector': 'Telecommunications'},
            'ITC.NS': {'name': 'ITC Ltd.', 'sector': 'Consumer Goods'},
            'SBIN.NS': {'name': 'State Bank of India', 'sector': 'Financial Services'},
            'ASIANPAINT.NS': {'name': 'Asian Paints Ltd.', 'sector': 'Consumer Goods'},
            'MARUTI.NS': {'name': 'Maruti Suzuki India Ltd.', 'sector': 'Automotive'},
            'NESTLEIND.NS': {'name': 'Nestle India Ltd.', 'sector': 'Consumer Goods'},
            'ULTRACEMCO.NS': {'name': 'UltraTech Cement Ltd.', 'sector': 'Construction'},
            'SUNPHARMA.NS': {'name': 'Sun Pharmaceutical Industries Ltd.', 'sector': 'Healthcare'},
            'WIPRO.NS': {'name': 'Wipro Ltd.', 'sector': 'Technology'},
            'HINDUNILVR.NS': {'name': 'Hindustan Unilever Ltd.', 'sector': 'Consumer Goods'},
            'AXISBANK.NS': {'name': 'Axis Bank Ltd.', 'sector': 'Financial Services'},
            'POWERGRID.NS': {'name': 'Power Grid Corporation of India Ltd.', 'sector': 'Utilities'},
            'NTPC.NS': {'name': 'NTPC Ltd.', 'sector': 'Utilities'},
            'ONGC.NS': {'name': 'Oil and Natural Gas Corporation Ltd.', 'sector': 'Energy'},
            'COALINDIA.NS': {'name': 'Coal India Ltd.', 'sector': 'Energy'},
            'TITAN.NS': {'name': 'Titan Company Ltd.', 'sector': 'Consumer Goods'},
            'BAJFINANCE.NS': {'name': 'Bajaj Finance Ltd.', 'sector': 'Financial Services'},
            'M&M.NS': {'name': 'Mahindra & Mahindra Ltd.', 'sector': 'Automotive'},
            'LT.NS': {'name': 'Larsen & Toubro Ltd.', 'sector': 'Construction'}
        }
        
        search_results = []
        query_upper = q.upper()
        query_lower = q.lower()
        
        # Search through the database
        for symbol, info in stock_database.items():
            # Check if symbol or name matches the query
            if (query_upper in symbol or 
                query_lower in info['name'].lower() or
                query_lower in symbol.lower()):
                
                # Calculate relevance score for sorting
                relevance_score = 0
                if symbol == query_upper:
                    relevance_score = 100  # Exact symbol match
                elif symbol.startswith(query_upper):
                    relevance_score = 95   # Starts with query
                elif query_upper in symbol:
                    relevance_score = 85   # Contains query
                elif query_lower in info['name'].lower():
                    relevance_score = 75   # Name match
                
                search_results.append({
                    'symbol': symbol,
                    'name': info['name'],
                    'sector': info['sector'],
                    'relevance': relevance_score,
                    'price': None,
                    'change': None
                })
        
        # Sort by relevance score
        search_results.sort(key=lambda x: x['relevance'], reverse=True)
        
        # Return results without live data
        result_objects = []
        for result in search_results[:10]:  # Limit to 10 results
            result_objects.append(StockSearchResult(
                symbol=result['symbol'],
                name=result['name'],
                price=None,
                change=None,
                sector=result.get('sector'),
                relevance=result.get('relevance')
            ))
        
        return result_objects
        
    except Exception as e:
        print(f"Error in simple stock search for query '{q}': {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/predictions/{symbol}", response_model=StockPrediction)
async def get_stock_prediction(symbol: str):
    """Get prediction for a specific stock"""
    try:
        stock_data = fetch_stock_data(symbol, period='3mo', interval='1d')
        
        if stock_data.empty:
            raise HTTPException(status_code=404, detail=f"Data for {symbol} not found")
        
        stock_data_with_indicators = add_technical_indicators(stock_data)
        latest = stock_data_with_indicators.iloc[-1]
        current_price = latest['Close']
        
        # Generate prediction using existing signal logic
        signal, reason = generate_signal(stock_data_with_indicators)
        
        # Simple prediction logic
        if latest['RSI'] < 30:
            predicted_price = current_price * 1.05
            confidence = 0.7
            reasoning = "RSI indicates oversold conditions, potential bounce expected"
        elif latest['RSI'] > 70:
            predicted_price = current_price * 0.95
            confidence = 0.6
            reasoning = "RSI indicates overbought conditions, potential pullback expected"
        else:
            predicted_price = current_price * 1.02
            confidence = 0.5
            reasoning = "Neutral technical conditions, slight upward bias"
        
        return StockPrediction(
            symbol=symbol.upper(),
            predictedPrice=round(predicted_price, 2),
            confidence=confidence,
            timeframe="1 week",
            reasoning=reasoning,
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/portfolio")
async def get_portfolio():
    """Get all portfolio holdings"""
    metrics = calculate_portfolio_metrics(portfolio_holdings)
    return {
        "holdings": list(portfolio_holdings.values()),
        "metrics": metrics
    }

@app.post("/portfolio/{symbol}")
async def add_portfolio_holding(symbol: str, shares: int, avg_price: float):
    """Add or update a portfolio holding"""
    try:
        # Get current price
        stock_info = get_stock_info(symbol.upper())
        current_price = stock_info['price']
        
        # Calculate values
        total_value = shares * current_price
        gain_loss = total_value - (shares * avg_price)
        gain_loss_percent = (gain_loss / (shares * avg_price)) * 100 if avg_price > 0 else 0
        
        holding = PortfolioHolding(
            symbol=symbol.upper(),
            shares=shares,
            avgPrice=avg_price,
            currentPrice=current_price,
            totalValue=total_value,
            gainLoss=gain_loss,
            gainLossPercent=gain_loss_percent
        )
        
        portfolio_holdings[symbol.upper()] = holding
        
        return {
            "message": f"Added {shares} shares of {symbol.upper()} to portfolio",
            "holding": holding
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/portfolio/{symbol}")
async def remove_portfolio_holding(symbol: str):
    """Remove a portfolio holding"""
    if symbol.upper() not in portfolio_holdings:
        raise HTTPException(status_code=404, detail=f"Holding for {symbol} not found in portfolio")
    
    removed_holding = portfolio_holdings.pop(symbol.upper())
    return {"message": f"Portfolio holding for {symbol} removed successfully"}

@app.post("/chatbot/query")
async def chatbot_query(query: str, symbol: str):
    """Get chatbot response for a stock-related query"""
    try:
        # Create a minimal stock data bundle for the chatbot
        stock_data_bundle = {
            's_info_full': get_about_stock_info(symbol.upper())[4],  # Get info_dict
            'df_ta': add_technical_indicators(fetch_stock_data(symbol.upper(), period='3mo')),
            'current_price': get_stock_info(symbol.upper()).price,
            'processed_news': [],
            'overall_news_sentiment_stats': {},
            'signal': 'N/A',
            'signal_reason': 'N/A'
        }
        
        response = get_chatbot_response(query, stock_data_bundle, symbol.upper(), "$")
        return {"response": response, "symbol": symbol.upper()}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/images/company/{query}")
async def get_company_images(query: str, max_images: int = 9):
    """Get company images for a search query"""
    try:
        image_urls, error_message = scrape_company_images(query, max_images)
        return {
            "query": query,
            "images": image_urls,
            "error": error_message,
            "count": len(image_urls)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/news/scrape/google")
async def scrape_google_news_endpoint(query: str):
    """Scrape Google News for a query"""
    try:
        news_items, error_message = scrape_google_news(query)
        return {
            "query": query,
            "news": news_items,
            "error": error_message,
            "count": len(news_items)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/news/scrape/yahoo/{symbol}")
async def scrape_yahoo_news_endpoint(symbol: str):
    """Scrape Yahoo Finance news for a symbol"""
    try:
        news_items, error_message = scrape_yahoo_finance_news(symbol)
        return {
            "symbol": symbol,
            "news": news_items,
            "error": error_message,
            "count": len(news_items)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stocks/{symbol}/news/enhanced")
async def get_enhanced_stock_news(symbol: str, max_articles: int = 8):
    """Get enhanced news for a stock with rich formatting and sentiment analysis (similar to main app.py)"""
    try:
        ticker = symbol.upper()
        
        # Get news from multiple sources
        news_by_source = {}
        error_messages = {}
        
        # 1. NewsAPI
        news_items_api = []
        news_error_message_api = None
        if os.getenv("NEWS_API_KEY"):
            try:
                news_items_api, news_error_message_api = get_stock_news_from_newsapi(ticker)
                if news_items_api:
                    news_by_source['NewsAPI'] = news_items_api
                if news_error_message_api:
                    error_messages['NewsAPI'] = news_error_message_api
            except Exception as e:
                error_messages['NewsAPI'] = f"NewsAPI error: {str(e)}"
        
        # 2. Yahoo Finance
        scraped_yfinance_items = []
        scraped_yfinance_error = None
        try:
            scraped_yfinance_items, scraped_yfinance_error = scrape_yahoo_finance_news(ticker)
            if scraped_yfinance_items:
                news_by_source['Yahoo Finance'] = scraped_yfinance_items
            if scraped_yfinance_error:
                error_messages['Yahoo Finance'] = scraped_yfinance_error
        except Exception as e:
            error_messages['Yahoo Finance'] = f"Yahoo Finance error: {str(e)}"
        
        # 3. Google News
        scraped_gnews_items = []
        scraped_gnews_error = None
        try:
            scraped_gnews_items, scraped_gnews_error = scrape_google_news(ticker)
            if scraped_gnews_items:
                news_by_source['Google News'] = scraped_gnews_items
            if scraped_gnews_error:
                error_messages['Google News'] = scraped_gnews_error
        except Exception as e:
            error_messages['Google News'] = f"Google News error: {str(e)}"
        
        # Filter out empty sources
        news_sources_with_content = {k: v for k, v in news_by_source.items() if v}
        
        # Calculate overall sentiment
        overall_sentiment_score = 0.0
        total_articles = 0
        
        for source, articles in news_sources_with_content.items():
            for article in articles:
                sentiment = article.get('vader_sentiment', {})
                sentiment_score = sentiment.get('compound', 0)
                overall_sentiment_score += sentiment_score
                total_articles += 1
        
        if total_articles > 0:
            overall_sentiment_score = overall_sentiment_score / total_articles
        
        # Enhanced response structure similar to main app.py
        response = {
            "symbol": ticker,
            "news_by_source": news_sources_with_content,
            "overall_sentiment_score": overall_sentiment_score,
            "total_articles": sum(len(articles) for articles in news_sources_with_content.values()),
            "error_messages": error_messages,
            "sources_available": list(news_sources_with_content.keys()),
            "has_news": len(news_sources_with_content) > 0,
            "sentiment_analysis": {
                "overall_score": overall_sentiment_score,
                "sentiment_label": "positive" if overall_sentiment_score > 0.05 else "negative" if overall_sentiment_score < -0.05 else "neutral",
                "confidence": abs(overall_sentiment_score)
            }
        }
        
        # Add individual article sentiment analysis with detailed scores
        for source, articles in news_sources_with_content.items():
            for article in articles:
                sentiment = article.get('vader_sentiment', {})
                sentiment_score = sentiment.get('compound', 0)
                positive_score = sentiment.get('pos', 0)
                negative_score = sentiment.get('neg', 0)
                neutral_score = sentiment.get('neu', 0)
                
                article['sentiment_analysis'] = {
                    "compound_score": round(sentiment_score, 3),
                    "positive_score": round(positive_score, 3),
                    "negative_score": round(negative_score, 3),
                    "neutral_score": round(neutral_score, 3),
                    "label": "positive" if sentiment_score > 0.05 else "negative" if sentiment_score < -0.05 else "neutral",
                    "confidence": round(abs(sentiment_score), 3),
                    "strength": "strong" if abs(sentiment_score) > 0.5 else "moderate" if abs(sentiment_score) > 0.1 else "weak"
                }
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stocks/{symbol}/news/sentiment")
async def get_news_sentiment_for_trading(symbol: str):
    """Get news sentiment analysis specifically for trading signal generation (similar to main app.py)"""
    try:
        ticker = symbol.upper()
        
        # Get news from multiple sources
        news_by_source = {}
        error_messages = {}
        
        # 1. NewsAPI
        if os.getenv("NEWS_API_KEY"):
            try:
                news_items_api, error_message_api = get_stock_news_from_newsapi(ticker)
                if news_items_api:
                    news_by_source['NewsAPI'] = news_items_api
                if error_message_api:
                    error_messages['NewsAPI'] = error_message_api
            except Exception as e:
                error_messages['NewsAPI'] = f"NewsAPI error: {str(e)}"
        
        # 2. Yahoo Finance
        try:
            scraped_yfinance_items, yfinance_error = scrape_yahoo_finance_news(ticker)
            if scraped_yfinance_items:
                news_by_source['Yahoo Finance'] = scraped_yfinance_items
            if yfinance_error:
                error_messages['Yahoo Finance'] = yfinance_error
        except Exception as e:
            error_messages['Yahoo Finance'] = f"Yahoo Finance error: {str(e)}"
        
        # 3. Google News
        try:
            scraped_gnews_items, gnews_error = scrape_google_news(ticker)
            if scraped_gnews_items:
                news_by_source['Google News'] = scraped_gnews_items
            if gnews_error:
                error_messages['Google News'] = gnews_error
        except Exception as e:
            error_messages['Google News'] = f"Google News error: {str(e)}"
        
        # Calculate overall sentiment score for trading signals
        overall_sentiment_score = 0.0
        total_articles = 0
        sentiment_breakdown = {
            'positive': 0,
            'negative': 0,
            'neutral': 0
        }
        
        for source, articles in news_by_source.items():
            for article in articles:
                sentiment = article.get('vader_sentiment', {})
                sentiment_score = sentiment.get('compound', 0)
                overall_sentiment_score += sentiment_score
                total_articles += 1
                
                # Categorize sentiment
                if sentiment_score > 0.05:
                    sentiment_breakdown['positive'] += 1
                elif sentiment_score < -0.05:
                    sentiment_breakdown['negative'] += 1
                else:
                    sentiment_breakdown['neutral'] += 1
        
        if total_articles > 0:
            overall_sentiment_score = overall_sentiment_score / total_articles
        
        # Get company name for signal generation
        company_name = ticker
        try:
            stock = yf.Ticker(ticker)
            info = stock.info
            if info and info.get('shortName'):
                company_name = info.get('shortName', ticker)
        except:
            pass
        
        # Generate sentiment-based trading insights (similar to main app.py)
        sentiment_insights = []
        if overall_sentiment_score > 0.2:
            sentiment_insights.append(f"News for {company_name} strongly positive ({overall_sentiment_score:.2f}).")
        elif overall_sentiment_score > 0.05:
            sentiment_insights.append(f"News for {company_name} mildly positive ({overall_sentiment_score:.2f}).")
        elif overall_sentiment_score < -0.2:
            sentiment_insights.append(f"News for {company_name} strongly negative ({overall_sentiment_score:.2f}).")
        elif overall_sentiment_score < -0.05:
            sentiment_insights.append(f"News for {company_name} mildly negative ({overall_sentiment_score:.2f}).")
        else:
            sentiment_insights.append(f"News for {company_name} neutral ({overall_sentiment_score:.2f}).")
        
        # Add detailed sentiment scores to each article
        for source, articles in news_by_source.items():
            for article in articles:
                sentiment = article.get('vader_sentiment', {})
                sentiment_score = sentiment.get('compound', 0)
                positive_score = sentiment.get('pos', 0)
                negative_score = sentiment.get('neg', 0)
                neutral_score = sentiment.get('neu', 0)
                
                article['sentiment_scores'] = {
                    "compound": round(sentiment_score, 3),
                    "positive": round(positive_score, 3),
                    "negative": round(negative_score, 3),
                    "neutral": round(neutral_score, 3)
                }
                article['sentiment_label'] = "positive" if sentiment_score > 0.05 else "negative" if sentiment_score < -0.05 else "neutral"
        
        return {
            "symbol": ticker,
            "company_name": company_name,
            "overall_sentiment_score": round(overall_sentiment_score, 3),
            "overall_sentiment_label": "positive" if overall_sentiment_score > 0.05 else "negative" if overall_sentiment_score < -0.05 else "neutral",
            "sentiment_breakdown": sentiment_breakdown,
            "sentiment_percentages": {
                "positive": round((sentiment_breakdown['positive'] / total_articles * 100), 1) if total_articles > 0 else 0,
                "negative": round((sentiment_breakdown['negative'] / total_articles * 100), 1) if total_articles > 0 else 0,
                "neutral": round((sentiment_breakdown['neutral'] / total_articles * 100), 1) if total_articles > 0 else 0
            },
            "total_articles": total_articles,
            "sentiment_insights": sentiment_insights,
            "news_sources": list(news_by_source.keys()),
            "error_messages": error_messages,
            "trading_signal_impact": {
                "buy_score_boost": 1.5 if overall_sentiment_score > 0.2 else 0.5 if overall_sentiment_score > 0.05 else 0,
                "sell_score_boost": 1.5 if overall_sentiment_score < -0.2 else 0.5 if overall_sentiment_score < -0.05 else 0,
                "sentiment_strength": "strong" if abs(overall_sentiment_score) > 0.2 else "mild" if abs(overall_sentiment_score) > 0.05 else "neutral"
            },
            "news_by_source": news_by_source
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stocks/{symbol}/news/sentiment/scores")
async def get_news_sentiment_scores(symbol: str):
    """Get detailed sentiment scores for news articles in a clear, readable format"""
    try:
        ticker = symbol.upper()
        
        # Get news from multiple sources
        news_by_source = {}
        error_messages = {}
        
        # 1. NewsAPI
        if os.getenv("NEWS_API_KEY"):
            try:
                news_items_api, error_message_api = get_stock_news_from_newsapi(ticker)
                if news_items_api:
                    news_by_source['NewsAPI'] = news_items_api
                if error_message_api:
                    error_messages['NewsAPI'] = error_message_api
            except Exception as e:
                error_messages['NewsAPI'] = f"NewsAPI error: {str(e)}"
        
        # 2. Yahoo Finance
        try:
            scraped_yfinance_items, yfinance_error = scrape_yahoo_finance_news(ticker)
            if scraped_yfinance_items:
                news_by_source['Yahoo Finance'] = scraped_yfinance_items
            if yfinance_error:
                error_messages['Yahoo Finance'] = yfinance_error
        except Exception as e:
            error_messages['Yahoo Finance'] = f"Yahoo Finance error: {str(e)}"
        
        # 3. Google News
        try:
            scraped_gnews_items, gnews_error = scrape_google_news(ticker)
            if scraped_gnews_items:
                news_by_source['Google News'] = scraped_gnews_items
            if gnews_error:
                error_messages['Google News'] = gnews_error
        except Exception as e:
            error_messages['Google News'] = f"Google News error: {str(e)}"
        
        # Calculate overall sentiment and detailed breakdown
        overall_sentiment_score = 0.0
        total_articles = 0
        sentiment_breakdown = {
            'positive': 0,
            'negative': 0,
            'neutral': 0
        }
        
        # Process each article and add detailed sentiment scores
        processed_articles = []
        
        for source, articles in news_by_source.items():
            for article in articles:
                sentiment = article.get('vader_sentiment', {})
                sentiment_score = sentiment.get('compound', 0)
                positive_score = sentiment.get('pos', 0)
                negative_score = sentiment.get('neg', 0)
                neutral_score = sentiment.get('neu', 0)
                
                overall_sentiment_score += sentiment_score
                total_articles += 1
                
                # Categorize sentiment
                if sentiment_score > 0.05:
                    sentiment_breakdown['positive'] += 1
                elif sentiment_score < -0.05:
                    sentiment_breakdown['negative'] += 1
                else:
                    sentiment_breakdown['neutral'] += 1
                
                # Create detailed article with sentiment scores
                processed_article = {
                    "title": article.get('title', 'N/A'),
                    "source": source,
                    "url": article.get('url') or article.get('link', '#'),
                    "published": article.get('publishedAt') or article.get('published', 'N/A'),
                    "sentiment_scores": {
                        "compound": round(sentiment_score, 3),
                        "positive": round(positive_score, 3),
                        "negative": round(negative_score, 3),
                        "neutral": round(neutral_score, 3)
                    },
                    "sentiment_label": "positive" if sentiment_score > 0.05 else "negative" if sentiment_score < -0.05 else "neutral",
                    "sentiment_strength": "strong" if abs(sentiment_score) > 0.5 else "moderate" if abs(sentiment_score) > 0.1 else "weak",
                    "confidence": round(abs(sentiment_score), 3)
                }
                processed_articles.append(processed_article)
        
        if total_articles > 0:
            overall_sentiment_score = overall_sentiment_score / total_articles
        
        # Sort articles by sentiment score (most positive first)
        processed_articles.sort(key=lambda x: x['sentiment_scores']['compound'], reverse=True)
        
        return {
            "symbol": ticker,
            "overall_sentiment": {
                "score": round(overall_sentiment_score, 3),
                "label": "positive" if overall_sentiment_score > 0.05 else "negative" if overall_sentiment_score < -0.05 else "neutral",
                "strength": "strong" if abs(overall_sentiment_score) > 0.5 else "moderate" if abs(overall_sentiment_score) > 0.1 else "weak"
            },
            "sentiment_breakdown": sentiment_breakdown,
            "sentiment_percentages": {
                "positive": round((sentiment_breakdown['positive'] / total_articles * 100), 1) if total_articles > 0 else 0,
                "negative": round((sentiment_breakdown['negative'] / total_articles * 100), 1) if total_articles > 0 else 0,
                "neutral": round((sentiment_breakdown['neutral'] / total_articles * 100), 1) if total_articles > 0 else 0
            },
            "total_articles": total_articles,
            "articles_with_scores": processed_articles,
            "sources_used": list(news_by_source.keys()),
            "error_messages": error_messages
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/market/simulation")
async def get_market_simulation(years: int = 5, initial_value: float = 10000, volatility: float = 0.15, growth_rate: float = 0.08):
    """Generate market simulation data"""
    try:
        simulation_data = generate_market_simulation(years, initial_value, volatility, growth_rate)
        
        # Convert to list of data points
        data_points = []
        for date, price in simulation_data.items():
            data_points.append({
                "date": date.strftime('%Y-%m-%d'),
                "price": float(price)
            })
        
        return {
            "years": years,
            "initial_value": initial_value,
            "volatility": volatility,
            "growth_rate": growth_rate,
            "data": data_points
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/simulation/monte-carlo")
async def run_monte_carlo_simulation(
    initial_investment: float,
    years: int = 5,
    num_simulations: int = 1000,
    mean_return: float = 0.08,
    volatility: float = 0.15,
    risk_free_rate: float = 0.03
):
    """Run Monte Carlo simulation for investment forecasting"""
    try:
        if initial_investment <= 0 or years <= 0 or num_simulations <= 0:
            raise HTTPException(status_code=400, detail="Invalid parameters")
        
        if num_simulations > 10000:
            raise HTTPException(status_code=400, detail="Too many simulations requested")
        
        result = monte_carlo_simulation(
            initial_investment, years, num_simulations, 
            mean_return, volatility, risk_free_rate
        )
        
        if result is None:
            raise HTTPException(status_code=500, detail="Simulation failed")
        
        return {
            "initial_investment": initial_investment,
            "years": years,
            "num_simulations": num_simulations,
            "parameters": {
                "mean_return": mean_return,
                "volatility": volatility,
                "risk_free_rate": risk_free_rate
            },
            "results": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stocks/{symbol}/advanced-metrics")
async def get_advanced_metrics(symbol: str, period: str = "1y", risk_free_rate: float = 0.03):
    """Get advanced financial metrics for a stock"""
    try:
        df = fetch_stock_data(symbol.upper(), period)
        
        if df.empty:
            raise HTTPException(status_code=404, detail=f"No data available for {symbol}")
        
        metrics = calculate_advanced_metrics(df, risk_free_rate)
        
        if not metrics:
            raise HTTPException(status_code=500, detail="Failed to calculate advanced metrics")
        
        return {
            "symbol": symbol.upper(),
            "period": period,
            "risk_free_rate": risk_free_rate,
            "metrics": metrics
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stocks/{symbol}/dividend-debug")
async def get_dividend_debug(symbol: str):
    """Debug endpoint to check dividend yield data"""
    try:
        import yfinance as yf
        ticker = yf.Ticker(symbol.upper())
        info = ticker.info
        
        dividend_debug = {
            "symbol": symbol.upper(),
            "dividendYield": info.get('dividendYield'),
            "trailingAnnualDividendYield": info.get('trailingAnnualDividendYield'),
            "forwardDividendYield": info.get('forwardDividendYield'),
            "dividendRate": info.get('dividendRate'),
            "trailingAnnualDividendRate": info.get('trailingAnnualDividendRate'),
            "forwardAnnualDividendRate": info.get('forwardAnnualDividendRate'),
            "currentPrice": info.get('regularMarketPrice') or info.get('currentPrice'),
            "calculated_yield": get_dividend_yield(info)
        }
        
        return dividend_debug
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/watchlist")
async def get_watchlist():
    """Get watchlist data"""
    try:
        # In a real app, this would come from user's session/database
        # For now, return a sample watchlist
        sample_watchlist = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN']
        watchlist_data = get_watchlist_data(sample_watchlist)
        
        return {
            "watchlist": watchlist_data,
            "count": len(watchlist_data)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/watchlist/{symbol}")
async def add_to_watchlist(symbol: str):
    """Add a stock to watchlist"""
    try:
        # In a real app, this would save to user's watchlist
        stock_info = get_stock_info(symbol.upper())
        
        return {
            "message": f"Added {symbol.upper()} to watchlist",
            "stock": stock_info
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/watchlist/{symbol}")
async def remove_from_watchlist(symbol: str):
    """Remove a stock from watchlist"""
    try:
        # In a real app, this would remove from user's watchlist
        return {
            "message": f"Removed {symbol.upper()} from watchlist"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/screener/run")
async def run_stock_screener(
    min_market_cap: float = 1000.0,
    max_pe: float = 50.0,
    min_dividend_yield: float = 0.0,
    max_beta: float = 2.0,
    min_volume: float = 1.0,
    sector: str = "All"
):
    """Run stock screener with specified criteria"""
    try:
        criteria = {
            'min_market_cap': min_market_cap * 1e6,  # Convert to actual market cap
            'max_pe': max_pe,
            'min_dividend_yield': min_dividend_yield,
            'max_beta': max_beta,
            'min_volume': min_volume * 1e6,  # Convert to actual volume
            'sector': sector
        }
        
        screened_results = screen_stocks(criteria)
        
        return {
            "criteria": criteria,
            "results": screened_results,
            "count": len(screened_results)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stocks/{symbol}/financials")
async def get_stock_financials(symbol: str):
    """Get financial statements for a stock"""
    try:
        stock = yf.Ticker(symbol.upper())
        info = stock.info
        
        if not info:
            raise HTTPException(status_code=404, detail=f"Financial data not found for {symbol}")
        
        # Get financial statements data
        financials_quarterly = {}
        financials_annual = {}
        earnings_quarterly = {}
        earnings_annual = {}
        balance_sheet_quarterly = {}
        balance_sheet_annual = {}
        cashflow_quarterly = {}
        cashflow_annual = {}
        
        try:
            print(f"Fetching financial data for {symbol}...")
            
            # Get quarterly financials
            quarterly_financials = stock.quarterly_financials
            print(f"Quarterly financials shape: {quarterly_financials.shape}")
            if not quarterly_financials.empty:
                # Convert to dict format expected by frontend
                for col in quarterly_financials.columns:
                    date_str = col.strftime('%Y-%m-%d')
                    financials_quarterly[date_str] = {}
                    for idx, row in quarterly_financials.iterrows():
                        if pd.notna(row[col]):
                            financials_quarterly[date_str][idx] = float(row[col])
                print(f"Processed {len(financials_quarterly)} quarterly financial periods")
            
            # Get annual financials
            annual_financials = stock.financials
            print(f"Annual financials shape: {annual_financials.shape}")
            if not annual_financials.empty:
                for col in annual_financials.columns:
                    date_str = col.strftime('%Y-%m-%d')
                    financials_annual[date_str] = {}
                    for idx, row in annual_financials.iterrows():
                        if pd.notna(row[col]):
                            financials_annual[date_str][idx] = float(row[col])
                print(f"Processed {len(financials_annual)} annual financial periods")
            
            # Get earnings data
            earnings = stock.earnings
            print(f"Earnings shape: {earnings.shape}")
            if not earnings.empty:
                for idx, row in earnings.iterrows():
                    date_str = idx.strftime('%Y-%m-%d')
                    earnings_quarterly[date_str] = {
                        'Earnings': float(row['Earnings']) if pd.notna(row['Earnings']) else 0
                    }
                print(f"Processed {len(earnings_quarterly)} earnings periods")
            
            # Get quarterly earnings
            quarterly_earnings = stock.quarterly_earnings
            print(f"Quarterly earnings shape: {quarterly_earnings.shape}")
            if not quarterly_earnings.empty:
                for idx, row in quarterly_earnings.iterrows():
                    date_str = idx.strftime('%Y-%m-%d')
                    earnings_quarterly[date_str] = {
                        'Earnings': float(row['Earnings']) if pd.notna(row['Earnings']) else 0
                    }
                print(f"Processed {len(earnings_quarterly)} quarterly earnings periods")
            
            # Get balance sheet data
            balance_sheet = stock.quarterly_balance_sheet
            print(f"Balance sheet shape: {balance_sheet.shape}")
            if not balance_sheet.empty:
                for col in balance_sheet.columns:
                    date_str = col.strftime('%Y-%m-%d')
                    balance_sheet_quarterly[date_str] = {}
                    for idx, row in balance_sheet.iterrows():
                        if pd.notna(row[col]):
                            balance_sheet_quarterly[date_str][idx] = float(row[col])
                print(f"Processed {len(balance_sheet_quarterly)} balance sheet periods")
            
            # Get cashflow data
            cashflow = stock.quarterly_cashflow
            print(f"Cashflow shape: {cashflow.shape}")
            if not cashflow.empty:
                for col in cashflow.columns:
                    date_str = col.strftime('%Y-%m-%d')
                    cashflow_quarterly[date_str] = {}
                    for idx, row in cashflow.iterrows():
                        if pd.notna(row[col]):
                            cashflow_quarterly[date_str][idx] = float(row[col])
                print(f"Processed {len(cashflow_quarterly)} cashflow periods")
                            
        except Exception as e:
            print(f"Warning: Could not fetch detailed financial data for {symbol}: {e}")
            import traceback
            traceback.print_exc()
        
        # If no real data was fetched, generate realistic mock data
        if not financials_quarterly and not earnings_quarterly:
            print(f"Generating mock financial data for {symbol}")
            import random
            from datetime import datetime, timedelta
            
            # Generate 8 quarters of mock data
            base_date = datetime.now()
            for i in range(8):
                quarter_date = base_date - timedelta(days=90*i)
                date_str = quarter_date.strftime('%Y-%m-%d')
                
                # Mock quarterly financials
                base_revenue = 80000000000 + random.randint(-10000000000, 20000000000)
                financials_quarterly[date_str] = {
                    'Total Revenue': base_revenue,
                    'Cost Of Revenue': base_revenue * 0.6,
                    'Gross Profit': base_revenue * 0.4,
                    'Operating Income': base_revenue * 0.25,
                    'Net Income': base_revenue * 0.2
                }
                
                # Mock quarterly earnings
                earnings_quarterly[date_str] = {
                    'Earnings': base_revenue * 0.2 / 15000000000  # EPS calculation
                }
                
                # Mock balance sheet
                balance_sheet_quarterly[date_str] = {
                    'Total Assets': base_revenue * 2.5,
                    'Total Liabilities': base_revenue * 1.5,
                    'Total Stockholder Equity': base_revenue * 1.0
                }
                
                # Mock cashflow
                cashflow_quarterly[date_str] = {
                    'Operating Cash Flow': base_revenue * 0.3,
                    'Free Cash Flow': base_revenue * 0.25,
                    'Net Income': base_revenue * 0.2
                }
            
            print(f"Generated mock data: {len(financials_quarterly)} financial periods, {len(earnings_quarterly)} earnings periods")
        
        # Return comprehensive financial data
        return {
            "symbol": symbol.upper(),
            "info": {
                # Profitability metrics from stock.info (same as main app.py)
                "returnOnEquity": info.get("returnOnEquity"),
                "returnOnAssets": info.get("returnOnAssets"),
                "profitMargins": info.get("profitMargins"),
                "grossMargins": info.get("grossMargins"),
                "operatingMargins": info.get("operatingMargins"),
                "beta": info.get("beta"),
                "debtToEquity": info.get("debtToEquity"),
                "currentRatio": info.get("currentRatio"),
                "quickRatio": info.get("quickRatio"),
                "dividendRate": info.get("dividendRate"),
                "dividendYield": info.get("dividendYield"),
                "payoutRatio": info.get("payoutRatio"),
                "enterpriseValue": info.get("enterpriseValue"),
                "enterpriseToRevenue": info.get("enterpriseToRevenue"),
                "enterpriseToEbitda": info.get("enterpriseToEbitda"),
                "priceToBook": info.get("priceToBook"),
                "priceToSalesTrailing12Months": info.get("priceToSalesTrailing12Months"),
                "trailingPE": info.get("trailingPE"),
                "forwardPE": info.get("forwardPE"),
                "trailingEps": info.get("trailingEps"),
                "forwardEps": info.get("forwardEps"),
                "totalCash": info.get("totalCash"),
                "totalDebt": info.get("totalDebt"),
                "totalRevenue": info.get("totalRevenue"),
                "netIncomeToCommon": info.get("netIncomeToCommon"),
                "freeCashflow": info.get("freeCashflow"),
                "operatingCashflow": info.get("operatingCashflow")
            },
            "financials": {
                "annual": financials_annual,
                "quarterly": financials_quarterly
            },
            "earnings": {
                "annual": earnings_annual,
                "quarterly": earnings_quarterly
            },
            "balance_sheet": {
                "annual": balance_sheet_annual,
                "quarterly": balance_sheet_quarterly
            },
            "cashflow": {
                "annual": cashflow_annual,
                "quarterly": cashflow_quarterly
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def extract_products_from_description(description):
    """Extract products and services from business description"""
    if not description:
        return []
    
    products = []
    description_lower = description.lower()
    
    # Common product/service keywords to look for
    product_keywords = [
        'paints', 'coatings', 'wall coverings', 'waterproofing', 'adhesives',
        'bath fittings', 'sanitaryware', 'kitchens', 'wardrobes', 'fabric',
        'furnishings', 'rugs', 'lightings', 'windows', 'doors', 'textures',
        'tools', 'enamels', 'undercoats', 'thinners', 'varnishers',
        'interior design', 'painting', 'color consultancy', 'wood solutions',
        'finishes', 'brands', 'products', 'services'
    ]
    
    # Extract sentences that mention products/services
    sentences = description.split('.')
    for sentence in sentences:
        sentence = sentence.strip()
        if any(keyword in sentence.lower() for keyword in product_keywords):
            # Clean up the sentence
            sentence = sentence.replace('The company offers', '').replace('It also provides', '').strip()
            if len(sentence) > 10 and len(sentence) < 100:  # Reasonable length
                products.append(sentence)
    
    # Remove duplicates and limit to 6 products
    unique_products = list(dict.fromkeys(products))[:6]
    return unique_products

def extract_company_history(description, info_dict):
    """Extract company history and milestones from business description"""
    if not description:
        return []
    
    history = []
    description_lower = description.lower()
    
    # Extract founded year
    founded_year = info_dict.get('founded', '')
    if not founded_year and 'founded in' in description_lower:
        import re
        founded_match = re.search(r'founded in (\d{4})', description_lower)
        if founded_match:
            founded_year = founded_match.group(1)
    
    if founded_year:
        history.append({
            "year": founded_year,
            "event": "Company Founded",
            "description": f"Company was established and began operations"
        })
    
    # Look for other historical milestones
    milestones = [
        ("ipo", "went public", "IPO"),
        ("acquisition", "acquired", "Major Acquisition"),
        ("expansion", "expanded", "Business Expansion"),
        ("merger", "merged", "Company Merger"),
        ("partnership", "partnership", "Strategic Partnership"),
        ("innovation", "innovated", "Key Innovation"),
        ("award", "awarded", "Industry Recognition")
    ]
    
    for keyword, phrase, event_type in milestones:
        if keyword in description_lower or phrase in description_lower:
            # Try to extract year if mentioned
            import re
            year_match = re.search(r'(\d{4})', description)
            if year_match:
                year = year_match.group(1)
                if year != founded_year:  # Don't duplicate founded year
                    history.append({
                        "year": year,
                        "event": event_type,
                        "description": f"Significant milestone in company development"
                    })
    
    # Add current status
    history.append({
        "year": "Present",
        "event": "Current Operations",
        "description": f"Operating as a leading company in the {info_dict.get('industry', 'industry')} sector"
    })
    
    return history[:5]  # Limit to 5 history items

@app.get("/stocks/{symbol}/info")
async def get_company_info(symbol: str):
    """Get comprehensive company information (similar to main app.py)"""
    try:
        # Apply rate limiting
        rate_limiter.acquire()
        
        # Get comprehensive company information using the same function as main app.py
        description, sector, industry, market_cap, exchange, info_dict, financials_df, earnings_df, analyst_recs_df, analyst_price_target_dict, company_officers_list = get_about_stock_info(symbol.upper())
        
        return {
            "symbol": symbol.upper(),
            "name": info_dict.get('shortName', info_dict.get('longName', symbol.upper())),
            "longName": info_dict.get('longName', ''),
            "shortName": info_dict.get('shortName', ''),
            "description": description,
            "longBusinessSummary": info_dict.get('longBusinessSummary', description),
            "sector": sector,
            "industry": industry,
            "marketCap": market_cap,
            "exchange": exchange,
            "currency": info_dict.get('currency', 'USD'),
            "currency_symbol": info_dict.get('currency_symbol', '$'),
            "logo_url": info_dict.get('logo_url', ''),
            "website": info_dict.get('website', ''),
            "city": info_dict.get('city', ''),
            "state": info_dict.get('state', ''),
            "country": info_dict.get('country', ''),
            "employees": info_dict.get('fullTimeEmployees', info_dict.get('employees', 0)),
            "founded": info_dict.get('founded', '') or (info_dict.get('longBusinessSummary', '').split('founded in ')[1].split(' ')[0] if 'founded in ' in info_dict.get('longBusinessSummary', '') else ''),
            "ceo": info_dict.get('ceo', ''),
            "companyOfficers": company_officers_list,
            "trailingPE": info_dict.get('trailingPE'),
            "forwardPE": info_dict.get('forwardPE'),
            "dividendYield": info_dict.get('dividendYield'),
            "dividendRate": info_dict.get('dividendRate'),
            "payoutRatio": info_dict.get('payoutRatio'),
            "beta": info_dict.get('beta'),
            "debtToEquity": info_dict.get('debtToEquity'),
            "returnOnEquity": info_dict.get('returnOnEquity'),
            "returnOnAssets": info_dict.get('returnOnAssets'),
            "profitMargins": info_dict.get('profitMargins'),
            "grossMargins": info_dict.get('grossMargins'),
            "operatingMargins": info_dict.get('operatingMargins'),
            "currentRatio": info_dict.get('currentRatio'),
            "quickRatio": info_dict.get('quickRatio'),
            "totalRevenue": info_dict.get('totalRevenue'),
            "netIncomeToCommon": info_dict.get('netIncomeToCommon'),
            "freeCashflow": info_dict.get('freeCashflow'),
            "operatingCashflow": info_dict.get('operatingCashflow'),
            "totalCash": info_dict.get('totalCash'),
            "totalDebt": info_dict.get('totalDebt'),
            "enterpriseValue": info_dict.get('enterpriseValue'),
            "priceToBook": info_dict.get('priceToBook'),
            "priceToSalesTrailing12Months": info_dict.get('priceToSalesTrailing12Months'),
            "fiftyTwoWeekHigh": info_dict.get('fiftyTwoWeekHigh'),
            "fiftyTwoWeekLow": info_dict.get('fiftyTwoWeekLow'),
            "averageVolume": info_dict.get('averageVolume'),
            "regularMarketPrice": info_dict.get('regularMarketPrice'),
            "regularMarketChange": info_dict.get('regularMarketChange'),
            "regularMarketChangePercent": info_dict.get('regularMarketChangePercent'),
            "regularMarketVolume": info_dict.get('regularMarketVolume'),
            "regularMarketDayHigh": info_dict.get('regularMarketDayHigh'),
            "regularMarketDayLow": info_dict.get('regularMarketDayLow'),
            "regularMarketOpen": info_dict.get('regularMarketOpen'),
            "regularMarketPreviousClose": info_dict.get('regularMarketPreviousClose'),
            "trailingEps": info_dict.get('trailingEps'),
            "forwardEps": info_dict.get('forwardEps'),
            "full_info": info_dict,  # Include the full info dict for any additional fields
            "products": extract_products_from_description(description),  # Extract products from business description
            "company_history": extract_company_history(description, info_dict)  # Extract company history and milestones
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stocks/{symbol}/analysts")
async def get_analyst_recommendations(symbol: str):
    """Get analyst recommendations and price targets"""
    try:
        stock = yf.Ticker(symbol.upper())
        
        # Get analyst data
        recommendations = stock.recommendations
        analyst_price_target = stock.analyst_price_target
        earnings_dates = stock.earnings_dates
        
        return {
            "symbol": symbol.upper(),
            "recommendations": recommendations.to_dict() if not recommendations.empty else {},
            "price_targets": analyst_price_target.to_dict() if not analyst_price_target.empty else {},
            "earnings_dates": earnings_dates.to_dict() if not earnings_dates.empty else {}
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stocks/{symbol}/holders")
async def get_stock_holders(symbol: str):
    """Get institutional and major holders"""
    try:
        stock = yf.Ticker(symbol.upper())
        
        # Get holder data
        institutional_holders = stock.institutional_holders
        major_holders = stock.major_holders
        insider_transactions = stock.insider_transactions
        insider_transactions_summary = stock.insider_transactions_summary
        
        return {
            "symbol": symbol.upper(),
            "institutional_holders": institutional_holders.to_dict() if not institutional_holders.empty else {},
            "major_holders": major_holders.to_dict() if not major_holders.empty else {},
            "insider_transactions": insider_transactions.to_dict() if not insider_transactions.empty else {},
            "insider_transactions_summary": insider_transactions_summary.to_dict() if not insider_transactions_summary.empty else {}
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stocks/{symbol}/enhanced-technical")
async def get_enhanced_technical_analysis(symbol: str, period: str = "1y"):
    """Get enhanced technical analysis with more indicators"""
    try:
        df = fetch_stock_data(symbol.upper(), period)
        
        if df.empty:
            raise HTTPException(status_code=404, detail=f"No data available for {symbol}")
        
        df_enhanced = get_enhanced_technical_indicators(df)
        
        if df_enhanced.empty:
            raise HTTPException(status_code=500, detail="Failed to calculate enhanced technical indicators")
        
        latest = df_enhanced.iloc[-1]
        
        # Generate enhanced signal
        signal, reason = generate_enhanced_signal(df_enhanced)
        
        return {
            "symbol": symbol.upper(),
            "period": period,
            "signal": signal,
            "reason": reason,
            "indicators": {
                "price": float(latest.get('Close', 0)),
                "volume": int(latest.get('Volume', 0)),
                "sma_20": float(latest.get('SMA_20', 0)),
                "sma_50": float(latest.get('SMA_50', 0)),
                "sma_200": float(latest.get('SMA_200', 0)),
                "ema_20": float(latest.get('EMA_20', 0)),
                "ema_50": float(latest.get('EMA_50', 0)),
                "rsi": float(latest.get('RSI', 0)),
                "rsi_ma": float(latest.get('RSI_MA', 0)),
                "macd_line": float(latest.get('MACD_line', 0)),
                "macd_signal": float(latest.get('MACD_signal', 0)),
                "macd_histogram": float(latest.get('MACD_hist', 0)),
                "bb_high": float(latest.get('BB_High', 0)),
                "bb_mid": float(latest.get('BB_Mid', 0)),
                "bb_low": float(latest.get('BB_Low', 0)),
                "bb_width": float(latest.get('BB_Width', 0)),
                "bb_position": float(latest.get('BB_Position', 0)),
                "stoch_k": float(latest.get('Stoch_K', 0)),
                "stoch_d": float(latest.get('Stoch_D', 0)),
                "williams_r": float(latest.get('Williams_R', 0)),
                "cci": float(latest.get('CCI', 0)),
                "atr": float(latest.get('ATR', 0)),
                "obv": float(latest.get('OBV', 0)),
                "mfi": float(latest.get('MFI', 0))
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Alert Management System
alerts_storage = {}  # In-memory storage for alerts (replace with database in production)

# Life Planner Goals Storage
life_planner_goals = []  # In-memory storage for life planner goals (replace with database in production)

# Notes Storage
notes_storage = []  # In-memory storage for notes (replace with database in production)

@app.get("/alerts")
async def get_alerts():
    """Get all active alerts"""
    try:
        return {
            "alerts": list(alerts_storage.values()),
            "count": len(alerts_storage)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/alerts")
async def create_alert(
    symbol: str,
    alert_type: str,
    condition: str,
    price: Optional[float] = None,
    technical_indicator: Optional[str] = None,
    news_type: Optional[str] = None,
    active: bool = True
):
    """Create a new alert"""
    try:
        alert_id = f"{symbol}_{alert_type}_{int(time.time())}"
        
        alert = {
            "id": alert_id,
            "symbol": symbol.upper(),
            "type": alert_type,
            "condition": condition,
            "price": price,
            "technical_indicator": technical_indicator,
            "news_type": news_type,
            "active": active,
            "created_at": datetime.now().isoformat(),
            "triggered": False,
            "triggered_at": None,
            "trigger_message": None
        }
        
        alerts_storage[alert_id] = alert
        
        return {
            "message": f"Alert created successfully for {symbol.upper()}",
            "alert": alert
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/alerts/{alert_id}")
async def update_alert(alert_id: str, active: bool):
    """Update alert status"""
    try:
        if alert_id not in alerts_storage:
            raise HTTPException(status_code=404, detail="Alert not found")
        
        alerts_storage[alert_id]["active"] = active
        
        return {
            "message": f"Alert {alert_id} updated successfully",
            "alert": alerts_storage[alert_id]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/alerts/{alert_id}")
async def delete_alert(alert_id: str):
    """Delete an alert"""
    try:
        if alert_id not in alerts_storage:
            raise HTTPException(status_code=404, detail="Alert not found")
        
        deleted_alert = alerts_storage.pop(alert_id)
        
        return {
            "message": f"Alert {alert_id} deleted successfully",
            "deleted_alert": deleted_alert
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/alerts/check/{symbol}")
async def check_alerts_for_symbol(symbol: str):
    """Check all alerts for a specific symbol"""
    try:
        # Get current stock data
        stock_data = get_stock_info(symbol.upper())
        
        triggered_alerts = []
        
        # Check all alerts for this symbol
        for alert_id, alert in alerts_storage.items():
            if alert["symbol"] == symbol.upper() and alert["active"] and not alert["triggered"]:
                is_triggered, message = check_alert_conditions(alert, stock_data)
                
                if is_triggered:
                    # Update alert
                    alert["triggered"] = True
                    alert["triggered_at"] = datetime.now().isoformat()
                    alert["trigger_message"] = message
                    
                    triggered_alerts.append({
                        "alert_id": alert_id,
                        "symbol": symbol.upper(),
                        "type": alert["type"],
                        "condition": alert["condition"],
                        "message": message,
                        "triggered_at": alert["triggered_at"]
                    })
        
        return {
            "symbol": symbol.upper(),
            "checked_alerts": len([a for a in alerts_storage.values() if a["symbol"] == symbol.upper()]),
            "triggered_alerts": triggered_alerts,
            "count": len(triggered_alerts)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/alerts/triggered")
async def get_triggered_alerts():
    """Get all triggered alerts"""
    try:
        triggered = [alert for alert in alerts_storage.values() if alert["triggered"]]
        
        return {
            "triggered_alerts": triggered,
            "count": len(triggered)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Life Planner Goals Management
class LifePlannerGoal(BaseModel):
    id: str
    name: str
    target_amount: float
    current_amount: float
    target_date: str
    monthly_contribution: float
    risk_tolerance: str  # 'Low', 'Medium', 'High'
    investment_strategy: str

class CreateGoalRequest(BaseModel):
    name: str
    target_amount: float
    current_amount: float = 0
    target_date: str
    monthly_contribution: float = 0
    risk_tolerance: str = 'Medium'
    investment_strategy: str = 'Diversified'

@app.get("/life-planner/goals")
async def get_life_planner_goals():
    """Get all life planner goals"""
    try:
        return {
            "goals": life_planner_goals,
            "count": len(life_planner_goals)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/life-planner/goals")
async def create_life_planner_goal(goal_data: CreateGoalRequest):
    """Create a new life planner goal"""
    try:
        goal_id = str(len(life_planner_goals) + 1)
        new_goal = LifePlannerGoal(
            id=goal_id,
            name=goal_data.name,
            target_amount=goal_data.target_amount,
            current_amount=goal_data.current_amount,
            target_date=goal_data.target_date,
            monthly_contribution=goal_data.monthly_contribution,
            risk_tolerance=goal_data.risk_tolerance,
            investment_strategy=goal_data.investment_strategy
        )
        life_planner_goals.append(new_goal)
        return {
            "message": "Goal created successfully",
            "goal": new_goal
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/life-planner/goals/{goal_id}")
async def update_life_planner_goal(goal_id: str, goal_data: CreateGoalRequest):
    """Update an existing life planner goal"""
    try:
        goal_index = None
        for i, goal in enumerate(life_planner_goals):
            if goal.id == goal_id:
                goal_index = i
                break
        
        if goal_index is None:
            raise HTTPException(status_code=404, detail="Goal not found")
        
        updated_goal = LifePlannerGoal(
            id=goal_id,
            name=goal_data.name,
            target_amount=goal_data.target_amount,
            current_amount=goal_data.current_amount,
            target_date=goal_data.target_date,
            monthly_contribution=goal_data.monthly_contribution,
            risk_tolerance=goal_data.risk_tolerance,
            investment_strategy=goal_data.investment_strategy
        )
        life_planner_goals[goal_index] = updated_goal
        return {
            "message": "Goal updated successfully",
            "goal": updated_goal
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/life-planner/goals/{goal_id}")
async def delete_life_planner_goal(goal_id: str):
    """Delete a life planner goal"""
    try:
        goal_index = None
        for i, goal in enumerate(life_planner_goals):
            if goal.id == goal_id:
                goal_index = i
                break
        
        if goal_index is None:
            raise HTTPException(status_code=404, detail="Goal not found")
        
        deleted_goal = life_planner_goals.pop(goal_index)
        return {
            "message": "Goal deleted successfully",
            "goal": deleted_goal
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Notes Management
class Note(BaseModel):
    id: str
    title: str
    content: str
    tags: List[str]
    created_at: str
    updated_at: str
    related_stocks: List[str]

class CreateNoteRequest(BaseModel):
    title: str
    content: str
    tags: str = ""
    related_stocks: str = ""

@app.get("/notes")
async def get_notes():
    """Get all notes"""
    try:
        return {
            "notes": notes_storage,
            "count": len(notes_storage)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/notes")
async def create_note(note_data: CreateNoteRequest):
    """Create a new note"""
    try:
        note_id = str(len(notes_storage) + 1)
        current_time = datetime.now().isoformat().split('T')[0]
        
        new_note = Note(
            id=note_id,
            title=note_data.title,
            content=note_data.content,
            tags=[tag.strip() for tag in note_data.tags.split(',') if tag.strip()] if note_data.tags else [],
            created_at=current_time,
            updated_at=current_time,
            related_stocks=[stock.strip().upper() for stock in note_data.related_stocks.split(',') if stock.strip()] if note_data.related_stocks else []
        )
        notes_storage.append(new_note)
        return {
            "message": "Note created successfully",
            "note": new_note
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/notes/{note_id}")
async def update_note(note_id: str, note_data: CreateNoteRequest):
    """Update an existing note"""
    try:
        note_index = None
        for i, note in enumerate(notes_storage):
            if note.id == note_id:
                note_index = i
                break
        
        if note_index is None:
            raise HTTPException(status_code=404, detail="Note not found")
        
        current_time = datetime.now().isoformat().split('T')[0]
        updated_note = Note(
            id=note_id,
            title=note_data.title,
            content=note_data.content,
            tags=[tag.strip() for tag in note_data.tags.split(',') if tag.strip()] if note_data.tags else [],
            created_at=notes_storage[note_index].created_at,  # Keep original creation date
            updated_at=current_time,
            related_stocks=[stock.strip().upper() for stock in note_data.related_stocks.split(',') if stock.strip()] if note_data.related_stocks else []
        )
        notes_storage[note_index] = updated_note
        return {
            "message": "Note updated successfully",
            "note": updated_note
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/notes/{note_id}")
async def delete_note(note_id: str):
    """Delete a note"""
    try:
        note_index = None
        for i, note in enumerate(notes_storage):
            if note.id == note_id:
                note_index = i
                break
        
        if note_index is None:
            raise HTTPException(status_code=404, detail="Note not found")
        
        deleted_note = notes_storage.pop(note_index)
        return {
            "message": "Note deleted successfully",
            "note": deleted_note
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
