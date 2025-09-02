import streamlit as st
import pandas as pd
import plotly.graph_objs as go
from plotly.subplots import make_subplots
import yfinance as yf
import ta
import numpy as np
import numpy_financial as npf  # Added for financial calculations
from transformers import pipeline
import requests
from bs4 import BeautifulSoup # Added for scraping
from urllib.parse import quote_plus, urlparse # Added for scraping URL encoding
import os
from dotenv import load_dotenv
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import time
from datetime import datetime, timedelta
import json # Added for Lottie
from streamlit_lottie import st_lottie # Added for Lottie
import plotly.express as px
from datetime import datetime, timedelta
import random
from about_tab import render_about_tab  # Added for About tab
import streamlit.components.v1 as components # Added for HTML components
import re

# --- HELPER FUNCTIONS ---
@st.cache_data(ttl=86400) # Cache for a day
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

# --- PAGE CONFIG ---
st.set_page_config(page_title="StockSeer.AI", layout="wide", page_icon="📈") 

# --- DARK MODE TOGGLE ---
if 'dark_mode' not in st.session_state:
    st.session_state.dark_mode = True

# --- LOAD ENVIRONMENT VARIABLES (for API Key) ---
load_dotenv()
NEWS_API_KEY = os.getenv("NEWS_API_KEY")

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

# --- SESSION STATE INITIALIZATION ---
if 'selected_market' not in st.session_state: st.session_state.selected_market = "Indian"
if 'chat_history' not in st.session_state: st.session_state.chat_history = []
if 'current_ticker_for_chat' not in st.session_state: st.session_state.current_ticker_for_chat = ""
if 'stock_notes' not in st.session_state: st.session_state.stock_notes = {}
if 'prompt_query' not in st.session_state: st.session_state.prompt_query = None
if 'selected_region' not in st.session_state: st.session_state.selected_region = "All Regions"

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
def load_hf_sentiment_model():
    return pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")
hf_sentiment_analyzer = load_hf_sentiment_model()

@st.cache_resource
def load_vader_sentiment_analyzer():
    return SentimentIntensityAnalyzer()
vader_analyzer = load_vader_sentiment_analyzer()

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

    /* Modern Animations */
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(30px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    @keyframes pulseGlow {
        0% { box-shadow: 0 0 5px rgba(57, 255, 20, 0.1); }
        50% { box-shadow: 0 0 20px rgba(57, 255, 20, 0.2); }
        100% { box-shadow: 0 0 5px rgba(57, 255, 20, 0.1); }
    }

    @keyframes animated-gradient {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
    }

    /* --- Enhanced Tabs UI/UX --- */
    .stTabs {
        position: -webkit-sticky; /* for Safari */
        position: sticky;
        top: 0; /* Makes the tab bar sticky */
        z-index: 999;
        background-color: var(--bg-color);
        padding: 10px 0 0 0;
        margin-top: -10px; /* Adjust for Streamlit's container padding */
        box-shadow: 0 2px 10px rgba(0,0,0,0.3); /* Adds depth */
    }

    .stTabs [data-baseweb="tab-list"] {
        gap: 24px; /* Increases space between tabs */
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding: 0 10px;
    }

    .stTabs [data-baseweb="tab-list"] button {
        border-radius: 6px 6px 0 0;
        padding: 10px 18px;
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); /* Smoother transition */
        border: none;
        background: transparent;
        color: var(--text-color);
        opacity: 0.6;
        font-weight: 500;
        border-bottom: 2px solid transparent; /* Placeholder for active underline */
        position: relative;
        top: 1px;
    }

    .stTabs [data-baseweb="tab-list"] button:hover {
        background: rgba(57, 255, 20, 0.08);
        opacity: 1;
        transform: translateY(-2px); /* Lifts tab on hover */
        animation: none;
        text-shadow: 0 0 8px rgba(57, 255, 20, 0.5);
    }

    .stTabs [data-baseweb="tab-list"] button[aria-selected="true"] {
        background: var(--card-bg);
        color: var(--primary-color);
        font-weight: 600;
        opacity: 1;
        border-bottom: 2px solid var(--primary-color);
        box-shadow: 0 0 15px rgba(57, 255, 20, 0.2); /* Add glow to active tab */
    }

    /* --- Overview Metric Cards --- */
    .overview-metric-card {
        background: linear-gradient(145deg, #1e1e1e, #141414);
        border: 1px solid rgba(57, 255, 20, 0.2);
        border-radius: 12px;
        padding: 16px;
        transition: all 0.3s ease-in-out;
        text-align: center;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }
    .overview-metric-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 25px rgba(57, 255, 20, 0.15);
        border-color: rgba(57, 255, 20, 0.5);
    }
    .overview-metric-label {
        font-size: 0.9em;
        color: #a0a0a0;
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    .overview-metric-value {
        font-size: 1.7em;
        font-weight: 600;
        color: #e0e0e0;
    }
    .overview-metric-delta {
        font-size: 0.9em;
        min-height: 1.2em; /* Reserve space to prevent layout shifts */
        color: #39ff14; /* Default to green */
    }
    .overview-metric-delta.negative {
        color: #ff4444; /* Red for negative */
    }

    /* Enhanced Cards */
    .metric-box {
        background: linear-gradient(145deg, rgba(26,26,26,0.8), rgba(10,10,10,0.9));
        border: 1px solid #39ff14;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 25px;
        box-shadow: 0 6px 20px rgba(0,0,0,0.1);
        transition: all 0.3s ease-in-out;
        animation: fadeInUp 0.4s ease-out forwards;
    }

    .metric-box:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 30px rgba(57, 255, 20, 0.2);
    }

    /* Signal Box in Insights */
    .signal-box {
        padding: 15px;
        border-radius: 10px;
        margin: 10px 0;
        font-size: 1.1rem;
        animation: slideInRight 0.5s ease-out;
        background: linear-gradient(145deg, var(--card-bg), var(--bg-color));
        border-left: 4px solid var(--primary-color);
    }

    /* Tags */
    .tag {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.85rem;
        margin: 4px;
        background: rgba(26,26,26,0.8);
        border: 1px solid #39ff14;
        transition: all 0.3s ease;
        animation: fadeIn 0.3s ease-out;
    }

    .tag:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(57, 255, 20, 0.2);
    }

    /* Company Logo */
    .company-logo {
        max-width: 60px;
        height: auto;
        border-radius: 8px;
        padding: 5px;
        background: var(--card-bg);
        margin-bottom: 10px;
        transition: all 0.3s ease;
    }

    .company-logo:hover {
        transform: scale(1.05);
    }

    /* Metrics and Values */
    .metric-value {
        font-size: 1.8rem;
        font-weight: 700;
        color: var(--primary-color);
        text-shadow: 0 0 10px rgba(57, 255, 20, 0.3);
        animation: fadeInUp 0.5s ease-out;
    }

    .metric-label {
        font-size: 0.9rem;
        color: var(--text-color);
        opacity: 0.8;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
        .metric-box {
            padding: 15px;
        }
        .metric-value {
            font-size: 1.4rem;
        }
        .signal-box {
            font-size: 1rem;
        }
    }

    /* Enhanced Theme */
    :root {
        --primary-glow: #39ff14;
        --secondary-glow: #00bfff;
        --warning-glow: #ffd700;
        --danger-glow: #ff4444;
    }

    /* Animated Cards */
    .animated-card {
        padding: 20px;
        border-radius: 15px;
        border: 2px solid var(--primary-glow);
        margin: 15px 0;
        background: linear-gradient(145deg, rgba(26,26,26,0.9), rgba(10,10,10,0.95));
        transition: all 0.3s ease;
        box-shadow: 0 0 15px rgba(57, 255, 20, 0.1);
    }

    .animated-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 5px 25px rgba(57, 255, 20, 0.2);
    }

    /* Glowing Effects */
    .glow-text {
        color: var(--primary-glow);
        text-shadow: 0 0 10px rgba(57, 255, 20, 0.3);
    }

    .glow-text-blue {
        color: var(--secondary-glow);
        text-shadow: 0 0 10px rgba(0, 191, 255, 0.3);
    }

    /* Custom Buttons */
    .custom-button {
        background: linear-gradient(45deg, #39ff14, #32cd32);
        color: #1a1a1a;
        padding: 10px 20px;
        border-radius: 25px;
        border: none;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .custom-button:hover {
        transform: scale(1.05);
        box-shadow: 0 0 20px rgba(57, 255, 20, 0.4);
    }

    /* Tooltip Styles */
    .tooltip {
        position: relative;
        display: inline-block;
    }

    .tooltip .tooltiptext {
        visibility: hidden;
        width: 200px;
        background-color: rgba(26,26,26,0.95);
        color: #fff;
        text-align: center;
        border-radius: 6px;
        padding: 10px;
        position: absolute;
        z-index: 1;
        bottom: 125%;
        left: 50%;
        margin-left: -100px;
        opacity: 0;
        transition: opacity 0.3s;
        border: 1px solid var(--primary-glow);
    }

    .tooltip:hover .tooltiptext {
        visibility: visible;
        opacity: 1;
    }

    /* Progress Bar Enhancement */
    .stProgress > div > div {
        background-color: var(--primary-glow);
        background-image: linear-gradient(45deg, 
            rgba(57, 255, 20, 0.8) 25%, 
            rgba(57, 255, 20, 0.6) 25%, 
            rgba(57, 255, 20, 0.6) 50%, 
            rgba(57, 255, 20, 0.8) 50%, 
            rgba(57, 255, 20, 0.8) 75%, 
            rgba(57, 255, 20, 0.6) 75%, 
            rgba(57, 255, 20, 0.6));
        background-size: 40px 40px;
        animation: progress-bar-stripes 1s linear infinite;
    }

    @keyframes progress-bar-stripes {
        from { background-position: 40px 0; }
        to { background-position: 0 0; }
    }

    /* Metric Enhancement */
    [data-testid="stMetricValue"] {
        background: linear-gradient(45deg, var(--primary-glow), var(--secondary-glow));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-weight: bold;
    }

    /* Custom Alert Styles */
    .custom-alert {
        padding: 15px;
        border-radius: 10px;
        margin: 10px 0;
        border-left: 5px solid;
        background: rgba(26,26,26,0.9);
    }

    .alert-info {
        border-color: var(--secondary-glow);
    }

    .alert-success {
        border-color: var(--primary-glow);
    }

    .alert-warning {
        border-color: var(--warning-glow);
    }

    .alert-danger {
        border-color: var(--danger-glow);
    }

    /* --- News Card Styling --- */
    .news-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 20px;
        padding-top: 1rem;
    }

    .news-card {
        background: linear-gradient(145deg, #1e1e1e, #141414);
        border-radius: 15px;
        border: 1px solid rgba(57, 255, 20, 0.15);
        overflow: hidden;
        transition: all 0.3s ease;
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    .news-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 30px rgba(57, 255, 20, 0.1);
        border-color: rgba(57, 255, 20, 0.4);
    }

    .news-card-img-container {
        height: 180px;
        overflow: hidden;
        background-color: #2a2a2a;
    }

    .news-card-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.4s ease;
    }

    .news-card:hover .news-card-img {
        transform: scale(1.05);
    }

    .news-card-content {
        padding: 20px;
        display: flex;
        flex-direction: column;
        flex-grow: 1;
    }

    .news-card-title {
        font-size: 1.1em;
        font-weight: 600;
        margin: 0 0 10px 0;
        line-height: 1.4;
        color: var(--text-color);
        flex-grow: 1;
        min-height: 5em; /* Ensure consistent card height */
    }

    .news-card-title a {
        color: inherit;
        text-decoration: none;
    }

    .news-card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.85em;
        color: #a0a0a0;
        margin-top: 15px;
        padding-top: 10px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    .sentiment-bar {
        width: 100%;
        height: 5px;
        border-radius: 5px;
        background-color: #333;
        margin-bottom: 15px;
        overflow: hidden;
    }

    .sentiment-bar-inner {
        height: 100%;
        border-radius: 5px;
        transition: width 0.5s ease;
    }
    </style>
""", unsafe_allow_html=True)

# --- CHATBASE BOT INJECTION ---
components.html("""
    <script>
    (function(){if(!window.chatbase||window.chatbase("getState")!=="initialized"){window.chatbase=(...arguments)=>{if(!window.chatbase.q){window.chatbase.q=[]}window.chatbase.q.push(arguments)};window.chatbase=new Proxy(window.chatbase,{get(target,prop){if(prop==="q"){return target.q}return(...args)=>target(prop,...args)}})}const onLoad=function(){const script=document.createElement("script");script.src="https://www.chatbase.co/embed.min.js";script.id="llg9lQCQWRlELBZckFqwR";script.domain="www.chatbase.co";document.body.appendChild(script)};if(document.readyState==="complete"){onLoad()}else{window.addEventListener("load",onLoad)}})();
    </script>
""", height=0)

# --- HELPER FUNCTIONS ---
def _render_metric_box(content):
    return st.markdown(f"""
        <div class='metric-box animate-fade-in'>
            {content}
        </div>
        <style>
        .metric-box {{
            background: linear-gradient(145deg, rgba(26,26,26,0.8), rgba(10,10,10,0.9));
            border: 1px solid #39ff14;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 25px;
            box-shadow: 0 6px 20px rgba(0,0,0,0.1);
            transition: all 0.3s ease-in-out;
            animation: fadeInUp 0.4s ease-out forwards;
        }}
        .metric-box:hover {{
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(57, 255, 20, 0.2);
        }}
        @keyframes fadeInUp {{
            from {{
                opacity: 0;
                transform: translateY(20px);
            }}
            to {{
                opacity: 1;
                transform: translateY(0);
            }}
        }}
        </style>
    """, unsafe_allow_html=True)

def _render_tag(tag_text, sentiment_class=""):
    return f"""
        <span class='tag {sentiment_class}'>
            {tag_text}
        </span>
        <style>
        .tag {{
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.85rem;
            margin: 4px;
            background: rgba(26,26,26,0.8);
            border: 1px solid #39ff14;
            transition: all 0.3s ease;
            animation: fadeIn 0.3s ease-out;
        }}
        .tag:hover {{
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(57, 255, 20, 0.2);
        }}
        @keyframes fadeIn {{
            from {{ opacity: 0; }}
            to {{ opacity: 1; }}
        }}
        </style>
    """

def get_currency_symbol(currency_code):
    symbols = {
        "USD": "$", "INR": "₹", "EUR": "€", "GBP": "£", "JPY": "¥",
        "CAD": "C$", "AUD": "A$", "CHF": "CHF", "CNY": "¥", 
        "HKD": "HK$", "SGD": "S$", "KRW": "₩", "BRL": "R$", "RUB": "₽",
        "ZAR": "R", "TRY": "₺", "MXN": "Mex$"
    }
    return symbols.get(str(currency_code).upper(), str(currency_code)) 

@st.cache_data(ttl=86400) 
def get_company_logo_url(ticker_symbol, company_name=None, company_website=None):
    hardcoded_logos = {
        "AAPL": "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
        "MSFT": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/1024px-Microsoft_logo.svg.png",
        "GOOGL": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/1200px-Google_2015_logo.svg.png",
        "AMZN": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/1024px-Amazon_logo.svg.png"
    }
    if ticker_symbol in hardcoded_logos:
        return hardcoded_logos[ticker_symbol]
    return None

# --- SIDEBAR ---
with st.sidebar:
    # Filter markets based on search term and selected region
    search_term = st.session_state.get('market_search', '').lower()
    selected_region = st.session_state.selected_region

    filtered_markets = []
    for market in MARKET_CONFIGS.keys():
        # Check if market matches search term
        matches_search = (
            search_term in market.lower() or
            search_term in MARKET_CONFIGS[market]['currency'].lower() or
            search_term in MARKET_CONFIGS[market]['exchange'].lower()
        )
        
        # Check if market is in selected region
        matches_region = (
            selected_region == "All Regions" or
            any(market in markets for markets in market_regions.values())
        )
        
        if matches_search and matches_region:
            filtered_markets.append(market)

    # Market Selection Section with Enhanced UI
    st.markdown("""
        <style>
            .market-selector {
                background: linear-gradient(145deg, #0e1117, #1a1c24);
                border-radius: 20px;
                padding: 25px;
                margin: 20px 0;
                border: 1px solid rgba(57, 255, 20, 0.2);
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                transition: all 0.3s ease;
            }
            .market-selector:hover {
                box-shadow: 0 8px 25px rgba(57, 255, 20, 0.15);
                transform: translateY(-2px);
            }
            .market-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 15px;
                padding: 10px;
            }
            .market-card {
                background: linear-gradient(145deg, #1a1a1a, #2a2a2a);
                border-radius: 15px;
                padding: 20px;
                border: 2px solid rgba(57, 255, 20, 0.1);
                transition: all 0.3s ease;
                cursor: pointer;
                position: relative;
                overflow: hidden;
            }
            .market-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(45deg, transparent, rgba(57, 255, 20, 0.1), transparent);
                transform: translateX(-100%);
                transition: transform 0.6s ease;
            }
            .market-card:hover::before {
                transform: translateX(100%);
            }
            .market-card.selected {
                border-color: #39ff14;
                box-shadow: 0 0 20px rgba(57, 255, 20, 0.2);
                transform: translateY(-2px);
            }
            .market-card:hover {
                transform: translateY(-3px);
                border-color: #39ff14;
                box-shadow: 0 8px 25px rgba(57, 255, 20, 0.2);
            }
            .market-label {
                font-size: 1.2em;
                font-weight: bold;
                color: #39ff14;
                margin-bottom: 10px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .market-info {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
                margin-top: 10px;
                font-size: 0.9em;
                color: #888;
            }
            .market-badge {
                position: absolute;
                top: 10px;
                right: 10px;
                background: rgba(57, 255, 20, 0.1);
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 0.8em;
                color: #39ff14;
            }
            .market-status {
                position: absolute;
                top: 40px;
                right: 10px;
                font-size: 0.8em;
                padding: 3px 8px;
                border-radius: 10px;
                background: rgba(57, 255, 20, 0.1);
            }
            .market-status.active {
                color: #39ff14;
            }
            .market-status.closed {
                color: #ff3939;
            }
            .market-stats {
                margin-top: 10px;
                padding-top: 10px;
                border-top: 1px solid rgba(57, 255, 20, 0.1);
                font-size: 0.85em;
                color: #aaa;
            }
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.02); }
                100% { transform: scale(1); }
            }
            .market-card.trading {
                animation: pulse 2s infinite;
            }
            .search-section {
                background: linear-gradient(145deg, #0e1117, #1a1c24);
                border-radius: 20px;
                padding: 25px;
                margin: 20px 0;
                border: 1px solid rgba(57, 255, 20, 0.2);
            }
            .search-input {
                background: linear-gradient(145deg, #1a1a1a, #2a2a2a);
                border-radius: 10px;
                padding: 10px;
                border: 1px solid rgba(57, 255, 20, 0.2);
                transition: all 0.3s ease;
            }
            .search-input:focus {
                border-color: #39ff14;
                box-shadow: 0 0 15px rgba(57, 255, 20, 0.2);
            }
            .region-filter {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
                margin-top: 15px;
                justify-content: center;
            }
            .region-chip {
                background: rgba(57, 255, 20, 0.1);
                border: 1px solid rgba(57, 255, 20, 0.2);
                border-radius: 20px;
                padding: 5px 15px;
                font-size: 0.9em;
                cursor: pointer;
                transition: all 0.3s ease;
                color: #888;
            }
            .region-chip:hover, .region-chip.active {
                background: rgba(57, 255, 20, 0.2);
                border-color: #39ff14;
                color: #39ff14;
                transform: translateY(-2px);
            }
        </style>
        <div class="market-selector">
            <h3 style="color: #39ff14; text-align: center; margin-bottom: 20px;">
                🌍 Select Your Market
            </h3>
            <div class="market-search-container">
    """, unsafe_allow_html=True)

    # Quick market selection dropdown with enhanced styling
    selected_market = st.selectbox(
        "Quick Market Selection",
        list(MARKET_CONFIGS.keys()),
        index=list(MARKET_CONFIGS.keys()).index(st.session_state.selected_market),
        key="market_quick_select",
        label_visibility="collapsed"
    )

    # Search input with enhanced styling
    search_term = st.text_input(
        "Search markets",
        key="market_search",
        placeholder="Search by name, currency, or region...",
        label_visibility="collapsed"
    )

    # Region filter with enhanced styling
    st.markdown('<div class="region-filter">', unsafe_allow_html=True)
    cols = st.columns(len(market_regions) + 1)
    with cols[0]:
        if st.button("All Regions", use_container_width=True):
            st.session_state.selected_region = "All Regions"
            st.rerun()

    for i, region in enumerate(market_regions.keys(), 1):
        with cols[i]:
            if st.button(region, use_container_width=True):
                st.session_state.selected_region = region
                st.rerun()

    st.markdown('</div>', unsafe_allow_html=True)

    # Market Grid with enhanced cards
    st.markdown('<div class="market-grid">', unsafe_allow_html=True)
    
    for market in filtered_markets:
        info = MARKET_CONFIGS[market]
        selected_class = "selected" if market == st.session_state.selected_market else ""
        market_icon = market_icons.get(market, "🌐")
        exchange = info.get("exchange", "")
        currency = info.get("currency", "")
        currency_symbol = info.get("currency_symbol", "$")
        market_return = info.get("market_return", 0.10) * 100
        risk_free_rate = info.get("risk_free_rate", 0.04) * 100
        
        # Make the market card clickable
        card_key = f"market_card_{market}"
        if st.button(market, key=card_key, use_container_width=True):
            st.session_state.selected_market = market
            st.rerun()
        
        # Determine market status
        is_trading = True  # Placeholder for actual trading hours logic
        status_class = "active" if is_trading else "closed"
        trading_class = "trading" if is_trading else ""
        
        st.markdown(f"""
            <div class="market-card {selected_class} {trading_class}">
                <div class="market-badge">{currency}</div>
                <div class="market-status {status_class}">
                    {"🟢 Trading" if is_trading else "🔴 Closed"}
                </div>
                <div class="market-label">
                    {market_icon} {market}
                </div>
                <div class="market-info">
                    <span>💱 {currency_symbol}</span>
                    <span>📈 {exchange}</span>
                </div>
                <div class="market-stats">
                    <div>Avg. Return: {market_return:.1f}%</div>
                    <div>Risk-free Rate: {risk_free_rate:.1f}%</div>
                </div>
            </div>
        """, unsafe_allow_html=True)

    st.markdown('</div></div>', unsafe_allow_html=True)

    # Continue with the rest of your sidebar code...

    # App Logo and Title with Real-time Clock
    with st.container():
        # Create a two-column layout for title and clock
        title_col, clock_col = st.columns([3, 1])
        
        with title_col:
            if os.path.exists(APP_ICON_SIDEBAR_PATH):
                st.image(APP_ICON_SIDEBAR_PATH, width=100, output_format="PNG")
            else:
                st.image("https://upload.wikimedia.org/wikipedia/commons/4/44/Stock_chart_icon.png", width=100)
            
            st.markdown('<h1 class="title-gradient">StockSeer.AI</h1>', unsafe_allow_html=True)
            st.markdown("""
                <div class="subtitle-card">
                    <h3 style="color: #ffffff; margin: 0;">
                        <span style="color: #39ff14;">📊</span> Analyze 
                        <span style="color: #39ff14;">|</span> 
                        <span style="color: #39ff14;">💹</span> Predict 
                        <span style="color: #39ff14;">|</span> 
                        <span style="color: #39ff14;">📈</span> Grow
                    </h3>
                </div>
            """, unsafe_allow_html=True)
        
        # Real-time Market Clock
        with clock_col:
            # Get market timezone info
            market_info = MARKET_CONFIGS[selected_market]
            market_timezone = market_info["timezone"]
            market_name = selected_market
            
            # Create the real-time clock component
            st.markdown(f"""
                <style>
                    .market-clock-container {{
                        background: linear-gradient(145deg, #0e1117, #1a1c24);
                        border-radius: 15px;
                        padding: 20px;
                        margin: 10px 0;
                        border: 2px solid rgba(57, 255, 20, 0.3);
                        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
                        text-align: center;
                        position: relative;
                        overflow: hidden;
                    }}
                    .market-clock-container::before {{
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: linear-gradient(45deg, transparent, rgba(57, 255, 20, 0.05), transparent);
                        animation: shimmer 3s infinite;
                    }}
                    @keyframes shimmer {{
                        0% {{ transform: translateX(-100%); }}
                        100% {{ transform: translateX(100%); }}
                    }}
                    .clock-time {{
                        font-size: 1.8em;
                        font-weight: bold;
                        color: #39ff14;
                        margin: 10px 0;
                        font-family: 'Courier New', monospace;
                        text-shadow: 0 0 10px rgba(57, 255, 20, 0.5);
                    }}
                    .clock-date {{
                        font-size: 0.9em;
                        color: #888;
                        margin: 5px 0;
                    }}
                    .market-name {{
                        font-size: 1.1em;
                        color: #39ff14;
                        font-weight: bold;
                        margin: 10px 0;
                    }}
                    .timezone-info {{
                        font-size: 0.8em;
                        color: #666;
                        margin: 5px 0;
                    }}
                    .trading-status {{
                        font-size: 0.9em;
                        padding: 5px 10px;
                        border-radius: 10px;
                        margin: 10px 0;
                        font-weight: bold;
                    }}
                    .trading-status.open {{
                        background: rgba(57, 255, 20, 0.2);
                        color: #39ff14;
                        border: 1px solid #39ff14;
                    }}
                    .trading-status.closed {{
                        background: rgba(255, 57, 57, 0.2);
                        color: #ff3939;
                        border: 1px solid #ff3939;
                    }}
                </style>
                <div class="market-clock-container">
                    <div class="market-name">🕐 {market_name}</div>
                    <div class="clock-time" id="market-clock-time">--:--:--</div>
                    <div class="clock-date" id="market-clock-date">--/--/----</div>
                    <div class="timezone-info">{market_timezone}</div>
                    <div class="trading-status" id="trading-status">Checking...</div>
                </div>
                
                <script>
                    function updateMarketClock() {{
                        const now = new Date();
                        const timeString = now.toLocaleTimeString('en-US', {{
                            timeZone: '{market_timezone}',
                            hour12: false,
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                        }});
                        const dateString = now.toLocaleDateString('en-US', {{
                            timeZone: '{market_timezone}',
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                        }});
                        
                        document.getElementById('market-clock-time').textContent = timeString;
                        document.getElementById('market-clock-date').textContent = dateString;
                        
                        // Determine trading status based on market
                        const marketHour = now.toLocaleTimeString('en-US', {{
                            timeZone: '{market_timezone}',
                            hour12: false,
                            hour: '2-digit'
                        }});
                        const dayOfWeek = now.toLocaleDateString('en-US', {{
                            timeZone: '{market_timezone}',
                            weekday: 'long'
                        }});
                        
                        let isTrading = false;
                        let statusText = '';
                        
                        // Market-specific trading hours
                        const marketTradingHours = {{
                            'Indian': {{ start: 9, end: 15, days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] }},
                            'US': {{ start: 9, end: 16, days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] }},
                            'UK': {{ start: 8, end: 16, days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] }},
                            'Japanese': {{ start: 9, end: 15, days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] }},
                            'German': {{ start: 8, end: 20, days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] }},
                            'Australian': {{ start: 10, end: 16, days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] }},
                            'Canadian': {{ start: 9, end: 16, days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] }},
                            'Chinese': {{ start: 9, end: 15, days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] }},
                            'Hong Kong': {{ start: 9, end: 16, days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] }},
                            'Swiss': {{ start: 9, end: 17, days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] }},
                            'South Korean': {{ start: 9, end: 15, days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] }},
                            'Singapore': {{ start: 9, end: 17, days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] }},
                            'New Zealand': {{ start: 10, end: 17, days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] }},
                            'Brazilian': {{ start: 10, end: 17, days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] }},
                            'French': {{ start: 9, end: 17, days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] }},
                            'Italian': {{ start: 9, end: 17, days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] }},
                            'Spanish': {{ start: 9, end: 17, days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] }},
                            'Swedish': {{ start: 9, end: 17, days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] }},
                            'Norwegian': {{ start: 9, end: 16, days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] }},
                            'Danish': {{ start: 9, end: 17, days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] }},
                            'Finnish': {{ start: 9, end: 18, days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] }},
                            'Dutch': {{ start: 9, end: 17, days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] }},
                            'UAE': {{ start: 10, end: 14, days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'] }},
                            'Saudi Arabian': {{ start: 10, end: 15, days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'] }},
                            'Qatari': {{ start: 10, end: 13, days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'] }},
                            'Israeli': {{ start: 9, end: 17, days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'] }},
                            'South African': {{ start: 9, end: 17, days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] }}
                        }};
                        
                        const currentMarket = '{market_name}';
                        const tradingHours = marketTradingHours[currentMarket] || {{ start: 9, end: 17, days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] }};
                        
                        const currentHour = parseInt(marketHour);
                        const isWeekday = tradingHours.days.includes(dayOfWeek);
                        const isWithinHours = currentHour >= tradingHours.start && currentHour < tradingHours.end;
                        
                        isTrading = isWeekday && isWithinHours;
                        
                        const statusElement = document.getElementById('trading-status');
                        if (isTrading) {{
                            statusElement.textContent = '🟢 TRADING';
                            statusElement.className = 'trading-status open';
                        }} else {{
                            statusElement.textContent = '🔴 CLOSED';
                            statusElement.className = 'trading-status closed';
                        }}
                    }}
                    
                    // Update clock immediately and then every second
                    updateMarketClock();
                    setInterval(updateMarketClock, 1000);
                </script>
            """, unsafe_allow_html=True)

    st.markdown('<div class="divider"></div>', unsafe_allow_html=True)

    # Stock Search Section
    st.markdown("""
        <div class="search-section">
            <h3 style="color: #39ff14; text-align: center; margin-bottom: 20px;">
                🔍 Stock Search
            </h3>
    """, unsafe_allow_html=True)

    # Get market-specific settings
    market_info = MARKET_CONFIGS[selected_market]
    stock_currency_code = market_info["currency"]
    stock_currency_symbol = get_currency_symbol(stock_currency_code)
    market_timezone = market_info["timezone"]
    market_index = market_info["index"]
    default_ticker = market_info["default_ticker"]

    # Example ticker display
    st.markdown(f"""
        <div style="text-align: center; margin-bottom: 10px;">
            <span style="color: #888;">Example for {selected_market}: </span>
            <span class="example-ticker">{default_ticker}</span>
        </div>
    """, unsafe_allow_html=True)

    # Stock Search Input
    ticker = st.text_input(
        "Ticker Symbol",
        default_ticker,
        key="ticker_input"
    ).upper()

    # Add suffix if needed
    if not any(suffix in ticker for suffix in [opt["suffix"] for opt in MARKET_CONFIGS.values() if opt["suffix"]]):
        ticker = ticker + market_info["suffix"]

    # Optional Compare Ticker
    st.markdown("""
        <div style="margin-top: 15px; text-align: center;">
            <span style="color: #888;">Compare with another stock (optional)</span>
        </div>
    """, unsafe_allow_html=True)
    
    compare_ticker = st.text_input("", "", key="compare_ticker_input").upper()

    st.markdown('</div>', unsafe_allow_html=True)
    st.markdown('<div class="divider"></div>', unsafe_allow_html=True)

    # Time Period Selection Section
    st.markdown("""
        <style>
            .period-section {
                background: linear-gradient(145deg, #0e1117, #1a1c24);
                border-radius: 20px;
                padding: 25px;
                margin: 20px 0;
                border: 1px solid rgba(57, 255, 20, 0.2);
            }
        </style>
        <div class="period-section">
            <h3 style="color: #39ff14; text-align: center; margin-bottom: 20px;">
                ⏱️ Select Time Period
            </h3>
    """, unsafe_allow_html=True)

    # Period options with enhanced UI
    period_options = {
        "1M": "1mo",
        "3M": "3mo",
        "6M": "6mo",
        "1Y": "1y",
        "3Y": "3y",
        "5Y": "5y",
        "Max": "max"
    }

    # Create columns for period buttons
    cols = st.columns(len(period_options))
    
    # Initialize session state for selected period if not exists
    if 'selected_period_label' not in st.session_state:
        st.session_state.selected_period_label = "1Y"

    # Create styled buttons for each period
    for i, (label, value) in enumerate(period_options.items()):
        with cols[i]:
            button_style = """
                background: linear-gradient(145deg, #1a1a1a, #2a2a2a);
                color: {};
                border: 1px solid {};
                border-radius: 10px;
                padding: 8px 15px;
                width: 100%;
                transition: all 0.3s ease;
                box-shadow: {};
                margin: 2px;
            """.format(
                "#39ff14" if label == st.session_state.selected_period_label else "#888",
                "#39ff14" if label == st.session_state.selected_period_label else "rgba(57, 255, 20, 0.1)",
                "0 0 15px rgba(57, 255, 20, 0.2)" if label == st.session_state.selected_period_label else "none"
            )
            
            if st.button(
                label,
                key=f"period_{label}",
                use_container_width=True,
                type="secondary" if label != st.session_state.selected_period_label else "primary"
            ):
                st.session_state.selected_period_label = label
                st.rerun()

    # Set the selected period based on the selected label
    selected_label = st.session_state.selected_period_label
    selected_period = period_options[selected_label]

    st.markdown('</div>', unsafe_allow_html=True)
    st.markdown('<div class="divider"></div>', unsafe_allow_html=True)

# --- UTILITY FUNCTIONS ---
@st.cache_data(ttl=3600)
def fetch_stock_data(ticker_symbol, period='1y', interval='1d', max_retries=3):
    for attempt in range(max_retries):
        try:
            stock = yf.Ticker(ticker_symbol)
            df = stock.history(period=period, interval=interval)
            df.dropna(inplace=True)
            df.attrs['ticker_symbol'] = ticker_symbol
            return df
        except Exception as e:
            if "rate limit" in str(e).lower() and attempt < max_retries - 1:
                time.sleep(2 ** attempt)  # Exponential backoff
                continue
            if attempt == max_retries - 1:
                st.error(f"Failed to fetch data for {ticker_symbol} after {max_retries} attempts: {e}")
                return pd.DataFrame()
    return pd.DataFrame()

@st.cache_data(ttl=3600)
def add_technical_indicators(df):
    if df.empty or 'Close' not in df.columns: return pd.DataFrame()
    df_ta = df.copy()
    if len(df_ta) > 20:
        df_ta['SMA_20'] = ta.trend.sma_indicator(df_ta['Close'], window=20)
        bb_indicator = ta.volatility.BollingerBands(close=df_ta['Close'], window=20, window_dev=2)
        df_ta['BB_High'] = bb_indicator.bollinger_hband()
        df_ta['BB_Mid'] = bb_indicator.bollinger_mavg()
        df_ta['BB_Low'] = bb_indicator.bollinger_lband()
    else:
        df_ta['SMA_20'], df_ta['BB_High'], df_ta['BB_Mid'], df_ta['BB_Low'] = np.nan, np.nan, np.nan, np.nan
    if len(df_ta) > 50: df_ta['SMA_50'] = ta.trend.sma_indicator(df_ta['Close'], window=50)
    else: df_ta['SMA_50'] = np.nan
    if len(df_ta) > 14: df_ta['RSI'] = ta.momentum.rsi(df_ta['Close'], window=14)
    else: df_ta['RSI'] = np.nan
    if len(df_ta) > 34: 
        df_ta['MACD_line'] = ta.trend.macd(df_ta['Close'])
        df_ta['MACD_signal'] = ta.trend.macd_signal(df_ta['Close'])
        df_ta['MACD_hist'] = ta.trend.macd_diff(df_ta['Close'])
    else:
        df_ta['MACD_line'], df_ta['MACD_signal'], df_ta['MACD_hist'] = np.nan, np.nan, np.nan
    return df_ta

@st.cache_data(ttl=3600)
def generate_signal(df, overall_news_sentiment_score=0.0, company_name="the company"):
    MIN_DATA_POINTS = 35 
    required_cols = ['RSI', 'MACD_hist', 'SMA_20', 'Close', 'MACD_line', 'MACD_signal']
    if df.empty or not all(k in df.columns for k in required_cols) or len(df) < MIN_DATA_POINTS:
        missing_cols = [col for col in required_cols if col not in df.columns]
        reason = f"Insufficient data (need {MIN_DATA_POINTS} days, have {len(df)})."
        if missing_cols: reason += f" Missing TAs: {', '.join(missing_cols)}."
        return "N/A", reason
    latest = df.iloc[-1]; previous = df.iloc[-2 if len(df) >= 2 else -1]
    rsi_val, macd_hist_val, macd_line_val, macd_signal_line_val, sma20, close_price = latest.get('RSI',np.nan), latest.get('MACD_hist',np.nan), latest.get('MACD_line',np.nan), latest.get('MACD_signal',np.nan), latest.get('SMA_20',np.nan), latest.get('Close',np.nan)
    prev_macd_line, prev_macd_signal_line = previous.get('MACD_line',np.nan), previous.get('MACD_signal',np.nan)
    nan_indicators = [n for n,v in {"RSI":rsi_val, "MACD Hist":macd_hist_val, "MACD Line":macd_line_val, "MACD Signal":macd_signal_line_val, "SMA20":sma20, "Close":close_price, "Prev MACD Line":prev_macd_line, "Prev MACD Signal":prev_macd_signal_line}.items() if pd.isna(v)]
    if nan_indicators: return "N/A", f"Indicator NaNs: {', '.join(nan_indicators)}. Short data period?"
    reasons, buy_score, sell_score = [], 0, 0
    if rsi_val < 30: reasons.append(f"RSI ({rsi_val:.2f}) < 30 (Oversold)."); buy_score += 2
    elif rsi_val < 40: reasons.append(f"RSI ({rsi_val:.2f}) < 40 (Nearing Oversold)."); buy_score += 1
    elif rsi_val > 70: reasons.append(f"RSI ({rsi_val:.2f}) > 70 (Overbought)."); sell_score += 2
    elif rsi_val > 60: reasons.append(f"RSI ({rsi_val:.2f}) > 60 (Nearing Overbought)."); sell_score += 1
    else: reasons.append(f"RSI ({rsi_val:.2f}) is neutral.")
    if macd_line_val > macd_signal_line_val and prev_macd_line <= prev_macd_signal_line: reasons.append("MACD Bullish Crossover."); buy_score += 2
    elif macd_line_val < macd_signal_line_val and prev_macd_line >= prev_macd_signal_line: reasons.append("MACD Bearish Crossover."); sell_score += 2
    elif macd_line_val > macd_signal_line_val: reasons.append("MACD Line > Signal (Bullish)."); buy_score +=1
    elif macd_line_val < macd_signal_line_val: reasons.append("MACD Line < Signal (Bearish)."); sell_score +=1
    if macd_hist_val > 0: reasons.append(f"MACD Hist ({macd_hist_val:.2f}) positive."); buy_score += 0.5
    elif macd_hist_val < 0: reasons.append(f"MACD Hist ({macd_hist_val:.2f}) negative."); sell_score += 0.5
    if pd.notna(close_price) and pd.notna(sma20):
        if close_price > sma20: reasons.append(f"Price > SMA20."); buy_score += 1
        elif close_price < sma20: reasons.append(f"Price < SMA20."); sell_score += 1
    else: reasons.append("SMA20 data unavailable for price comparison.")
    if overall_news_sentiment_score > 0.2: reasons.append(f"News for {company_name} strongly positive ({overall_news_sentiment_score:.2f})."); buy_score += 1.5
    elif overall_news_sentiment_score > 0.05: reasons.append(f"News for {company_name} mildly positive ({overall_news_sentiment_score:.2f})."); buy_score += 0.5
    elif overall_news_sentiment_score < -0.2: reasons.append(f"News for {company_name} strongly negative ({overall_news_sentiment_score:.2f})."); sell_score += 1.5
    elif overall_news_sentiment_score < -0.05: reasons.append(f"News for {company_name} mildly negative ({overall_news_sentiment_score:.2f})."); sell_score += 0.5
    else: reasons.append(f"News for {company_name} neutral ({overall_news_sentiment_score:.2f}).")
    final_signal = "HOLD"
    if not reasons and abs(buy_score - sell_score) <=1 : return "HOLD", "Neutral technicals and news sentiment."
    if buy_score > sell_score + 2.5 : final_signal = "STRONG BUY"
    elif sell_score > buy_score + 2.5: final_signal = "STRONG SELL"
    elif buy_score > sell_score + 1: final_signal = "BUY"
    elif sell_score > buy_score + 1: final_signal = "SELL"
    return final_signal, " ".join(reasons) if reasons else "Neutral signals, leaning HOLD."

@st.cache_data(ttl=3600)
def get_about_stock_info(ticker_symbol):
    description, sector, industry, market_cap, exchange = "Info not available.", "N/A", "N/A", None, "N/A"
    info_dict, financials_df, earnings_df, analyst_recs_df, analyst_price_target_dict, company_officers_list = {}, pd.DataFrame(), pd.DataFrame(), None, None, []
    try:
        stock = yf.Ticker(ticker_symbol); info = stock.info
        if info:
            description, sector, industry = info.get('longBusinessSummary', description), info.get('sector', sector), info.get('industry', industry)
            market_cap, exchange, info_dict = info.get('marketCap'), info.get('exchange', exchange), info
            company_officers_list = info.get('companyOfficers', [])
            info_dict['currency_symbol'] = get_currency_symbol(info.get('currency', 'USD')) 
            info_dict['logo_url'] = get_company_logo_url(ticker_symbol, info.get('shortName'), info.get('website'))
        try: financials_df = stock.quarterly_financials if not stock.quarterly_financials.empty else stock.financials
        except: pass
        try: earnings_df = stock.quarterly_earnings if not stock.quarterly_earnings.empty else stock.earnings
        except: pass
        try: analyst_recs_df = stock.recommendations
        except: pass
        try: analyst_price_target_dict = stock.analyst_price_target
        except: pass
    except Exception as e: description = f"Info retrieval failed: {e}"
    return (description, sector, industry, market_cap, exchange, info_dict, financials_df, earnings_df, analyst_recs_df, analyst_price_target_dict, company_officers_list)

@st.cache_data(ttl=1800)
def get_stock_news_from_newsapi(ticker_symbol_or_company_name):
    news_items, error_message = [], None
    if not NEWS_API_KEY: return news_items, "NEWS_API_KEY not configured."
    query_term = ticker_symbol_or_company_name
    try:
        stock_info_temp = yf.Ticker(ticker_symbol_or_company_name).info
        if stock_info_temp and stock_info_temp.get('shortName'):
            company_name_for_search = stock_info_temp['shortName'].replace(" Inc.", "").replace(" Corp.", "").replace(" Ltd.", "")
            if len(company_name_for_search) > 3 : query_term = company_name_for_search
    except: pass
    to_date, from_date = datetime.now().strftime('%Y-%m-%d'), (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
    url = f"https://newsapi.org/v2/everything?q={query_term}&from={from_date}&to={to_date}&language=en&sortBy=relevancy&pageSize=15&apiKey={NEWS_API_KEY}"
    try:
        response = requests.get(url, timeout=10); response.raise_for_status()
        articles_data = response.json().get("articles", [])
        if not articles_data: error_message = f"No recent news for '{query_term}' via NewsAPI."
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
            if e.response.status_code == 401: error_message += " (Invalid Key?)"
            elif e.response.status_code == 429: error_message += " (Rate Limit?)"
    except Exception as e: error_message = f"NewsAPI Unexpected Error for '{query_term}': {str(e)}"
    return news_items, error_message

@st.cache_data(ttl=1800)
def scrape_google_news(query_term):
    news_items, error_message = [], None
    safe_query = quote_plus(query_term + " stock news")
    search_url = f"https://news.google.com/search?q={safe_query}&hl=en-US&gl=US&ceid=US%3Aen"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"}
    try:
        response = requests.get(search_url, headers=headers, timeout=15); response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser'); articles_tags = soup.find_all('article', limit=15)
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
            if len(news_items) >= 7: break
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
                if len(news_items) >= 7: break 
        if not news_items: error_message = f"Google News: No articles for '{query_term}'."
    except requests.exceptions.Timeout: error_message = f"Google News: Timeout for '{query_term}'."
    except requests.exceptions.RequestException as e: error_message = f"Google News Error for '{query_term}': {str(e)}"
    except Exception as e: error_message = f"Google News Unexpected Error for '{query_term}': {str(e)}"
    return news_items[:7], error_message

@st.cache_data(ttl=1800)
def scrape_yahoo_finance_news(ticker_symbol):
    news_items, error_message = [], None
    search_url = f"https://finance.yahoo.com/quote/{ticker_symbol}/news"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"}
    try:
        response = requests.get(search_url, headers=headers, timeout=15); response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        article_containers = soup.find_all('li', class_=lambda x: x and 'stream-item' in x.lower(), limit=15)
        if not article_containers : article_containers = soup.select('div.Cf div.js-stream-content > div', limit=15)
        processed_urls = set()
        for item_container in article_containers:
            link_tag, title_tag = item_container.find('a', href=True), item_container.find(['h3', 'h2'])
            if link_tag and title_tag and link_tag['href']:
                raw_link, title_text, full_link = link_tag['href'], title_tag.get_text(strip=True), ""
                if raw_link.startswith('/news/'): full_link = "https://finance.yahoo.com" + raw_link
                elif raw_link.startswith('https://finance.yahoo.com/news/'): full_link = raw_link
                elif raw_link.startswith(('http://', 'https://')) and 'yahoo.com' in raw_link : full_link = raw_link
                else: continue
                
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
                
                publisher_name = "Yahoo Finance"; publisher_tag_container = item_container.find('div', class_=lambda x: x and ('publisher' in x.lower() or 'provider' in x.lower() or 'c-secondary-text' in x.lower()))
                if publisher_tag_container: publisher_name = (publisher_tag_container.find('span') and publisher_tag_container.find('span').get_text(strip=True)) or publisher_tag_container.get_text(strip=True) or publisher_name
                if full_link not in processed_urls and len(title_text) > 15:
                    news_items.append({
                        'title': title_text, 
                        'link': full_link, 
                        'publisher': publisher_name, 
                        'source': 'Yahoo Finance (Scraped)',
                        'image_url': image_url
                    })
                    processed_urls.add(full_link)
            if len(news_items) >= 7: break 
        if not news_items: error_message = f"Yahoo Finance: No articles for '{ticker_symbol}'."
    except requests.exceptions.Timeout: error_message = f"Yahoo Finance: Timeout for '{ticker_symbol}'."
    except requests.exceptions.RequestException as e: error_message = f"Yahoo Finance Error for '{ticker_symbol}': {str(e)}"
    except Exception as e: error_message = f"Yahoo Finance Unexpected Error for '{ticker_symbol}': {str(e)}"
    return news_items[:7], error_message

@st.cache_data(show_spinner=False)
def analyze_news_item_sentiment_vader(text):
    if not text or not isinstance(text, str) or not text.strip(): return {"label": "NEUTRAL", "score": 0.0, "compound": 0.0}
    vs = vader_analyzer.polarity_scores(text); compound_score = vs['compound']
    label = "POSITIVE" if compound_score >= 0.05 else "NEGATIVE" if compound_score <= -0.05 else "NEUTRAL"
    return {"label": label, "score": compound_score, "compound": compound_score}

@st.cache_data(ttl=3600)
def analyze_sentiment_text_hf(text):
    if not text or not isinstance(text, str): return {"label": "NEUTRAL", "score": 0.0}
    try:
        max_len = hf_sentiment_analyzer.tokenizer.model_max_length
        truncated_text = text[:max_len] if len(text) > max_len else text
        if not truncated_text.strip(): return {"label": "NEUTRAL", "score": 0.0}
        return hf_sentiment_analyzer(truncated_text)[0]
    except Exception: return {"label": "NEUTRAL", "score": 0.0}

@st.cache_data(ttl=3600)
def assess_volatility_and_risk(df, window=60):
    if df.empty or 'Close' not in df.columns or len(df) < window + 1: return None, "N/A", "Not enough data."
    daily_returns = df['Close'].pct_change().dropna()
    if len(daily_returns) < window: return None, "N/A", f"Need {window} returns, have {len(daily_returns)}."
    actual_window = min(window, len(daily_returns))
    if actual_window < 2: return None, "N/A", "Too few points for std dev."
    vol_percent = daily_returns.rolling(window=actual_window).std().iloc[-1] * np.sqrt(252) * 100
    if pd.isna(vol_percent): return None, "N/A", "Volatility NaN."
    if vol_percent < 15: risk_level, risk_explanation = "Low", "Low price swings."
    elif vol_percent < 30: risk_level, risk_explanation = "Moderate", "Moderate price swings."
    elif vol_percent < 50: risk_level, risk_explanation = "High", "Significant price swings."
    else: risk_level, risk_explanation = "Very High", "Extreme price swings."
    return vol_percent, risk_level, risk_explanation

@st.cache_data(ttl=3600)
def get_historical_volatility_data(df, window=30, trading_days=252):
    if df.empty or 'Close' not in df.columns or len(df) < window + 1: return None
    return (df['Close'].pct_change().rolling(window=window).std() * np.sqrt(trading_days) * 100).dropna()

@st.cache_data(ttl=3600)
def get_correlation_data(ticker1_df, ticker2_symbol, main_ticker_symbol, period='1y', interval='1d'):
    try:
        ticker2_df = fetch_stock_data(ticker2_symbol, period=period, interval=interval)
        if ticker1_df.empty or ticker2_df.empty: return None, None, "Not enough data for correlation."
        returns1, returns2 = ticker1_df['Close'].pct_change().rename(main_ticker_symbol), ticker2_df['Close'].pct_change().rename(ticker2_symbol)
        combined_returns = pd.concat([returns1, returns2], axis=1).dropna()
        if len(combined_returns) < 20: return None, None, "Not enough overlapping data for correlation."
        rolling_corr = combined_returns[main_ticker_symbol].rolling(window=30).corr(combined_returns[returns2.name])
        overall_corr = combined_returns[main_ticker_symbol].corr(combined_returns[returns2.name])
        return rolling_corr.dropna(), overall_corr, None
    except Exception as e: return None, None, f"Corr. Error with {ticker2_symbol}: {e}"

@st.cache_data(ttl=3600)
def calculate_historical_performance_and_cagr(df_hist, initial_investment=1000):
    if df_hist.empty or len(df_hist) < 2 or 'Close' not in df_hist.columns: return None, None, None, "Not enough hist. data."
    start_price, end_price = df_hist['Close'].iloc[0], df_hist['Close'].iloc[-1]
    num_years = (df_hist.index[-1] - df_hist.index[0]).days / 365.25
    if num_years < 0.1 : return initial_investment, initial_investment * (end_price/start_price if start_price != 0 else 1), None, "Period too short for CAGR."
    total_return_multiple = end_price / start_price if start_price != 0 else 1
    final_value = initial_investment * total_return_multiple; cagr = None
    if total_return_multiple > 0 and num_years > 0: cagr = ((total_return_multiple) ** (1/num_years)) - 1
    return initial_investment, final_value, cagr * 100 if cagr is not None else None, None

def project_future_value_cagr(initial_investment, cagr_percent, years_to_project):
    if cagr_percent is None or initial_investment is None or years_to_project is None: return None
    return initial_investment * ((1 + (cagr_percent / 100)) ** years_to_project)

@st.cache_data(ttl=3600)
def calculate_max_drawdown(df):
    """Calculates the maximum drawdown of a stock."""
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

@st.cache_data(ttl=3600)
def calculate_sharpe_ratio(returns, risk_free_rate):
    """Calculates the Sharpe ratio."""
    if returns is None or returns.empty or len(returns) < 2:
        return None
    # Ensure returns is a pandas Series
    if not isinstance(returns, pd.Series):
        returns = pd.Series(returns)
        
    excess_returns = returns - risk_free_rate / 252 # Daily risk-free rate
    sharpe_ratio = (excess_returns.mean() / excess_returns.std()) * np.sqrt(252) if excess_returns.std() != 0 else 0
    return sharpe_ratio

@st.cache_data(ttl=3600)
def calculate_sortino_ratio(returns, risk_free_rate):
    """Calculates the Sortino ratio."""
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

@st.cache_data(ttl=3600)
def calculate_beta(stock_returns, index_returns):
    """Calculates the beta of a stock against an index."""
    if stock_returns is None or index_returns is None or len(stock_returns) < 2 or len(index_returns) < 2:
        return None
    
    covariance = stock_returns.cov(index_returns)
    variance = index_returns.var()
    
    if variance == 0 or pd.isna(variance):
        return None
        
    beta = covariance / variance
    return beta

@st.cache_data(ttl=3600)
def calculate_calmar_ratio(cagr, max_drawdown):
    """Calculates the Calmar ratio."""
    if cagr is None or max_drawdown is None or max_drawdown == 0:
        return None
    # Max drawdown is negative, so we use its absolute value
    return cagr / abs(max_drawdown)

def get_chatbot_response(user_query, stock_data_bundle_local, current_ticker_symbol, stock_currency_sym):
    """
    Generates a response to a user's query about a stock.
    """
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

@st.cache_data(ttl=3600)
def calculate_max_drawdown(df):
    """Calculates the maximum drawdown of a stock."""
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

# --- MAIN APP LOGIC ---
if ticker:
    try:
        with st.spinner("🔄 Initializing..."):
            stock_info_main = yf.Ticker(ticker).info
            if not stock_info_main or stock_info_main.get('regularMarketPrice') is None:
                st.error(f"Essential data for **{ticker}** unavailable. Check the ticker or try again later.")
                st.stop()
    except Exception as e:
        error_str = str(e).lower()
        if any(keyword in error_str for keyword in ["could not resolve host", "failed to connect", "curl: (6)", "temporary issue"]):
            st.error(f"**Network Error:** Could not connect to Yahoo Finance for **{ticker}**.")
            st.warning("This is often a temporary problem. Please check your internet connection and try again in a moment.")
            st.info("If the issue persists, the data service may be temporarily down.")
        else:
            st.error(f"Error initializing data for {ticker}: {e}")
        st.stop()

    progress_placeholder = st.empty()
    progress_bar = progress_placeholder.progress(0)
    status_text = st.empty()

    try:
        # Fetch basic info
        status_text.text("📊 Fetching stock information...")
        progress_bar.progress(20)

        stock_currency_code = stock_info_main.get('currency', 'USD') 
        stock_currency_symbol = get_currency_symbol(stock_currency_code)

        # Fetch price data
        status_text.text("📈 Loading price data...")
        progress_bar.progress(40)

        current_price = stock_info_main.get('regularMarketPrice', stock_info_main.get('currentPrice'))
        previous_close = stock_info_main.get('regularMarketPreviousClose', stock_info_main.get('previousClose'))

        # Fetch technical data
        status_text.text("🔍 Calculating technical indicators...")
        progress_bar.progress(60)
        
        df = fetch_stock_data(ticker, selected_period)
        if df.empty:
            progress_placeholder.empty()
            status_text.empty()
            st.error(f"No data available for {ticker}. Please check the ticker symbol.")
            st.stop()
        
        df_ta = add_technical_indicators(df.copy())

        # Fetch fundamental data
        status_text.text("📚 Loading fundamental data...")
        progress_bar.progress(80)
        
        (about_info, sector, industry, mcap_val, exch_val, s_info_full, fin_df, earn_df,
         analyst_recs, analyst_price_target_data, company_officers) = get_about_stock_info(ticker)

        # Complete loading
        progress_bar.progress(100)
        progress_placeholder.empty()
        status_text.empty()

    except Exception as e:
        progress_placeholder.empty()
        status_text.empty()
        error_str = str(e).lower()
        if any(keyword in error_str for keyword in ["could not resolve host", "failed to connect", "curl: (6)", "temporary issue"]):
            st.error(f"**Network Error:** A connection to the data provider failed while loading details for **{ticker}**.")
            st.warning("This can be a temporary issue. Please try reloading the page in a few moments.")
        else:
            st.error(f"An unexpected error occurred while loading data for {ticker}: {e}")
        st.stop()

    fifty_two_week_high = stock_info_main.get('fiftyTwoWeekHigh'); fifty_two_week_low = stock_info_main.get('fiftyTwoWeekLow')
    volume_today = stock_info_main.get('regularMarketVolume', stock_info_main.get('volume'))
    today_change, today_change_percent = (None, None)
    if current_price and previous_close and previous_close != 0:
        today_change = current_price - previous_close
        today_change_percent = (today_change / previous_close) * 100
    
    company_name_for_signal = stock_info_main.get('shortName', ticker)
    company_name_for_news_search = stock_info_main.get('shortName', ticker)

    with st.spinner(f"Summoning insights for {ticker}... This might take a moment."):
        df = fetch_stock_data(ticker, selected_period)
        if df.empty: st.error(f"No historical data for {ticker} ({selected_label})."); st.stop()
        
        df_ta = add_technical_indicators(df.copy()) 

        (about_info, sector, industry, mcap_val, exch_val, s_info_full, fin_df, earn_df,
         analyst_recs, analyst_price_target_data, company_officers) = get_about_stock_info(ticker)
        
        if not s_info_full and stock_info_main: s_info_full = stock_info_main 
        if s_info_full and s_info_full.get('currency') and s_info_full.get('currency') != stock_currency_code : 
            stock_currency_code = s_info_full.get('currency', stock_currency_code)
            stock_currency_symbol = get_currency_symbol(stock_currency_code)
            s_info_full['currency_symbol'] = stock_currency_symbol 
        elif s_info_full: 
             s_info_full['currency_symbol'] = stock_currency_symbol
        if s_info_full and 'logo_url' not in s_info_full:
             s_info_full['logo_url'] = get_company_logo_url(ticker, s_info_full.get('shortName'), s_info_full.get('website'))


        if "failed" in str(about_info).lower() or about_info == "Info not available." or about_info == "No summary available.":
            if s_info_full.get('longBusinessSummary'): about_info = s_info_full.get('longBusinessSummary')
        if sector=='N/A' and s_info_full.get('sector'): sector = s_info_full.get('sector')
        if industry=='N/A' and s_info_full.get('industry'): industry = s_info_full.get('industry')
        if mcap_val is None and s_info_full.get('marketCap'): mcap_val = s_info_full.get('marketCap')
        if exch_val=='N/A' and s_info_full.get('exchange'): exch_val = s_info_full.get('exchange')
        if not company_officers and s_info_full.get('companyOfficers'): company_officers = s_info_full.get('companyOfficers')
        
        if s_info_full and s_info_full.get('shortName') and company_name_for_news_search == ticker :
            company_name_for_news_search = s_info_full.get('shortName', ticker)

        news_items_api, news_error_message_api, scraped_gnews_items, scraped_gnews_error, scraped_yfinance_items, scraped_yfinance_error = [], None, [], None, [], None
        processed_news_for_sentiment = []
        overall_news_sentiment_score = 0.0
        overall_news_sentiment_stats = {"label": "Neutral", "score": 0.0, "positive_count": 0, "negative_count": 0, "neutral_count": 0, "total_articles":0, "source": "N/A"}
        
        if NEWS_API_KEY:
            news_items_api, news_error_message_api = get_stock_news_from_newsapi(company_name_for_news_search)
            if news_items_api: processed_news_for_sentiment.extend(news_items_api); overall_news_sentiment_stats["source"] = "NewsAPI"
        
        if not processed_news_for_sentiment:
            scraped_gnews_items, scraped_gnews_error = scrape_google_news(company_name_for_news_search)
            if scraped_gnews_items: processed_news_for_sentiment.extend(scraped_gnews_items); overall_news_sentiment_stats["source"] = "Google News (Scraped)"
        
        if not processed_news_for_sentiment:
            scraped_yfinance_items, scraped_yfinance_error = scrape_yahoo_finance_news(ticker)
            if scraped_yfinance_items: processed_news_for_sentiment.extend(scraped_yfinance_items); overall_news_sentiment_stats["source"] = "Yahoo Finance (Scraped)"

        if processed_news_for_sentiment:
            compound_scores = []
            for item_idx, item_content in enumerate(processed_news_for_sentiment):
                text_for_sentiment = (item_content.get('title') or "") + " " + (item_content.get('description') or "")
                vader_sentiment_result = analyze_news_item_sentiment_vader(text_for_sentiment.strip())
                processed_news_for_sentiment[item_idx]["vader_sentiment"] = vader_sentiment_result
                compound_scores.append(vader_sentiment_result['compound'])
                if vader_sentiment_result['label'] == "POSITIVE": overall_news_sentiment_stats["positive_count"] += 1
                elif vader_sentiment_result['label'] == "NEGATIVE": overall_news_sentiment_stats["negative_count"] += 1
                else: overall_news_sentiment_stats["neutral_count"] += 1
            overall_news_sentiment_stats["total_articles"] = len(compound_scores)
            if compound_scores:
                overall_news_sentiment_score = sum(compound_scores) / len(compound_scores)
                overall_news_sentiment_stats["score"] = round(overall_news_sentiment_score, 3)
                if overall_news_sentiment_score >= 0.05: overall_news_sentiment_stats["label"] = "Positive"
                elif overall_news_sentiment_score <= -0.05: overall_news_sentiment_stats["label"] = "Negative"
        
        if not NEWS_API_KEY: news_error_message_api = "NewsAPI key not configured. Using web scrapers."

        signal, signal_reason = generate_signal(df_ta.copy(), overall_news_sentiment_score, company_name_for_signal)

        volatility_percent, risk_level, risk_explanation_text = assess_volatility_and_risk(df.copy(), window=60)
        hist_vol_series = get_historical_volatility_data(df.copy(), window=30)
        df_5y_for_calc = df
        if selected_period not in ["5y", "max"] and (not df.empty and (df.index[-1] - df.index[0]).days / 365.25 < 4.9):
            try: df_5y_for_calc_temp = fetch_stock_data(ticker, period="5y"); df_5y_for_calc = df_5y_for_calc_temp if not df_5y_for_calc_temp.empty else df_5y_for_calc
            except: pass
        hist_initial_investment, hist_final_value, hist_cagr, hist_perf_error = calculate_historical_performance_and_cagr(df_5y_for_calc)

    # Scrape images for the company
    company_images, images_error = [], None
    if s_info_full:
        company_images, images_error = scrape_company_images(s_info_full.get('shortName', ticker))

    # --- MAIN PAGE HEADER WITH CLOCK ---
    # Create a header with title and compact clock
    header_col1, header_col2 = st.columns([4, 1])
    
    with header_col1:
        st.markdown("""
            <div style="margin-bottom: 20px;">
                <h1 style="
                    background: linear-gradient(45deg, #39ff14, #00ff88);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    font-size: 2.5em;
                    font-weight: 800;
                    margin-bottom: 0.5rem;
                    text-shadow: 0 2px 10px rgba(57, 255, 20, 0.3);
                ">StockSeer.AI</h1>
                <p style="color: #888; font-size: 1.1em; margin: 0;">
                    <span style="color: #39ff14;">📊</span> Analyze 
                    <span style="color: #39ff14;">|</span> 
                    <span style="color: #39ff14;">💹</span> Predict 
                    <span style="color: #39ff14;">|</span> 
                    <span style="color: #39ff14;">📈</span> Grow
                </p>
            </div>
        """, unsafe_allow_html=True)
    
    with header_col2:
        # Get market timezone info and current time
        market_info = MARKET_CONFIGS[selected_market]
        market_timezone = market_info["timezone"]
        market_name = selected_market
        
        # Get current time in market timezone using Python
        from datetime import datetime
        import pytz
        
        try:
            tz = pytz.timezone(market_timezone)
            now = datetime.now(tz)
            current_time = now.strftime("%H:%M")
            
            # Simple trading check
            is_weekday = now.weekday() < 5  # Monday = 0, Friday = 4
            current_hour = now.hour
            is_trading = is_weekday and 9 <= current_hour < 17
            
            status_emoji = "🟢" if is_trading else "🔴"
            status_color = "#39ff14" if is_trading else "#ff3939"
            
        except:
            current_time = "--:--"
            status_emoji = "--"
            status_color = "#888"
        
        # Create a simple static clock display
        st.markdown(f"""
            <style>
                .mini-clock {{
                    background: rgba(14, 17, 23, 0.8);
                    border: 1px solid rgba(57, 255, 20, 0.3);
                    border-radius: 8px;
                    padding: 8px;
                    text-align: center;
                    font-family: 'Courier New', monospace;
                    font-size: 0.9em;
                    color: #39ff14;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                }}
                .mini-time {{
                    font-weight: bold;
                    font-size: 1.1em;
                    margin: 2px 0;
                }}
                .mini-status {{
                    font-size: 0.7em;
                    margin: 2px 0;
                    color: {status_color};
                }}
            </style>
            <div class="mini-clock">
                <div class="mini-time">{current_time}</div>
                <div class="mini-status">{status_emoji}</div>
            </div>
        """, unsafe_allow_html=True)

    # --- TAB CREATION ---
    tabs = st.tabs([
        "📊 Overview",           # 0
        "💰 Financials",         # 1
        "📰 News",               # 2
        "📈 Performance",        # 3
        "💬 Chat",               # 4
        "🧠 AI, Risk & News",    # 5
        "🎯 Life Planner",       # 6
        "📝 My Notes",           # 7
        "🏢 About Company",      # 8
        "ℹ️ About StockSeer.AI", # 9
        "📚 Tutorial",           # 10
        "👀 Watchlist",          # 11
        "🔍 Market Screener",    # 12
        "⚡ Alerts"               # 13
    ])

    current_currency_symbol = s_info_full.get('currency_symbol', stock_currency_symbol) if s_info_full else stock_currency_symbol

    # --- TAB 0: Overview ---
    with tabs[0]: 
        c1, c2, c3, c4 = st.columns(4)

        with c1:
            price_val = f"{current_currency_symbol}{current_price:.2f}" if current_price is not None else "N/A"
            delta_val = f"{current_currency_symbol}{today_change:.2f} ({today_change_percent:.2f}%)" if today_change is not None and today_change_percent is not None else ""
            delta_class = "negative" if today_change is not None and today_change < 0 else ""
            st.markdown(f"""
                <div class="overview-metric-card">
                    <div class="overview-metric-label">Price</div>
                    <div class="overview-metric-value">{price_val}</div>
                    <div class="overview-metric-delta {delta_class}">{delta_val if delta_val else "&nbsp;"}</div>
                </div>
            """, unsafe_allow_html=True)

        with c2:
            high_val = f"{current_currency_symbol}{fifty_two_week_high:.2f}" if fifty_two_week_high is not None else "N/A"
            st.markdown(f"""
                <div class="overview-metric-card">
                    <div class="overview-metric-label">52W High</div>
                    <div class="overview-metric-value">{high_val}</div>
                    <div class="overview-metric-delta">&nbsp;</div>
                </div>
            """, unsafe_allow_html=True)

        with c3:
            low_val = f"{current_currency_symbol}{fifty_two_week_low:.2f}" if fifty_two_week_low is not None else "N/A"
            st.markdown(f"""
                <div class="overview-metric-card">
                    <div class="overview-metric-label">52W Low</div>
                    <div class="overview-metric-value">{low_val}</div>
                    <div class="overview-metric-delta">&nbsp;</div>
                </div>
            """, unsafe_allow_html=True)

        with c4:
            volume_val = f"{volume_today:,.0f}" if volume_today is not None else "N/A"
            st.markdown(f"""
                <div class="overview-metric-card">
                    <div class="overview-metric-label">Volume</div>
                    <div class="overview-metric-value">{volume_val}</div>
                    <div class="overview-metric-delta">&nbsp;</div>
                </div>
            """, unsafe_allow_html=True)
            
        st.markdown("---"); st.markdown("### 📊 Price Chart & Technicals")
        co_s,co_r,co_m, co_bb_col = st.columns(4)
        show_sma = co_s.checkbox("SMA 20",True,key='sma_chart_cb_reverted'); show_rsi = co_r.checkbox("RSI",False,key='rsi_chart_cb_reverted')
        show_macd = co_m.checkbox("MACD",False,key='macd_chart_cb_reverted'); show_bbands = co_bb_col.checkbox("Bollinger Bands", False, key='bb_chart_cb_reverted')
        show_earnings_dates_cb = st.checkbox("Show Earnings Dates", True, key='earnings_cb_reverted_chart')
        
        # Create figure with volume chart
        fig=go.Figure()
        fig.add_trace(go.Bar(x=df_ta.index, y=df_ta['Volume'], name='Volume', showlegend=False, yaxis='y4', marker_color='rgba(152, 251, 152, 0.4)'))
        fig.add_trace(go.Candlestick(x=df_ta.index,open=df_ta['Open'],high=df_ta['High'],low=df_ta['Low'],close=df_ta['Close'],name='Price',increasing_line_color='#39ff14',decreasing_line_color='#c0392b'))
        
        if show_sma and 'SMA_20' in df_ta.columns and not df_ta['SMA_20'].isnull().all(): fig.add_trace(go.Scatter(x=df_ta.index,y=df_ta['SMA_20'],name='SMA 20',line=dict(color='#87CEEB',dash='dash')))
        if show_bbands and all(col in df_ta.columns for col in ['BB_High', 'BB_Low', 'BB_Mid']) and not df_ta['BB_High'].isnull().all() and not df_ta['BB_Low'].isnull().all():
            fig.add_trace(go.Scatter(x=df_ta.index, y=df_ta['BB_High'], line=dict(color='rgba(152,251,152,0.3)', width=1), name='BB High', legendgroup='bollinger', showlegend=False))
            fig.add_trace(go.Scatter(x=df_ta.index, y=df_ta['BB_Low'], line=dict(color='rgba(152,251,152,0.3)', width=1), name='BB Low', fill='tonexty', fillcolor='rgba(152,251,152,0.1)', legendgroup='bollinger', showlegend=False))
            fig.add_trace(go.Scatter(x=df_ta.index, y=df_ta['BB_Mid'], line=dict(color='rgba(240,230,140,0.7)', width=1.5, dash='dot'), name='BB Mid (20)', legendgroup='bollinger'))
        if show_rsi and 'RSI' in df_ta.columns and not df_ta['RSI'].isnull().all(): fig.add_trace(go.Scatter(x=df_ta.index,y=df_ta['RSI'],name='RSI',line=dict(color='#FFA500'), yaxis="y2"))
        if show_macd and all(k in df_ta for k in ['MACD_line','MACD_signal','MACD_hist']) and not df_ta[['MACD_line','MACD_signal','MACD_hist']].isnull().all(axis=None):
            fig.add_trace(go.Scatter(x=df_ta.index,y=df_ta['MACD_line'],name='MACD Line',line=dict(color='#DA70D6'), yaxis="y3"))
            fig.add_trace(go.Scatter(x=df_ta.index,y=df_ta['MACD_signal'],name='Signal Line',line=dict(color='#FFD700',dash='dot'), yaxis="y3"))
            fig.add_trace(go.Bar(x=df_ta.index,y=df_ta['MACD_hist'],name='MACD Hist.',marker_color=np.where(df_ta['MACD_hist']>0,'#39ff14','#c0392b'), yaxis="y3", opacity=0.6))
        if show_earnings_dates_cb:
            try:
                earnings_data = yf.Ticker(ticker).earnings_dates
                if earnings_data is not None and not earnings_data.empty:
                    min_c_date, max_c_date = df_ta.index.min(), df_ta.index.max()
                    if not isinstance(earnings_data.index, pd.DatetimeIndex): earnings_data.index = pd.to_datetime(earnings_data.index, errors='coerce').dropna()
                    relevant_e_dates = earnings_data[(earnings_data.index >= min_c_date) & (earnings_data.index <= max_c_date)]
                    for date_val in relevant_e_dates.index: fig.add_vline(x=date_val, line_width=1, line_dash="longdash", line_color="rgba(200,200,200,0.6)", annotation_text="E", annotation_position="bottom right", annotation_font_size=10, annotation_font_color="rgba(200,200,200,0.9)")
            except Exception as e: st.sidebar.caption(f"Earnings dates error: {e}")
        if current_price and not df_ta.empty: fig.add_annotation(x=df_ta.index[-1],y=current_price,text=f"Current: {current_currency_symbol}{current_price:.2f}",showarrow=True,arrowhead=2,ax=0,ay=-40,font=dict(color="#FFF",size=12,family="Poppins"),bgcolor="rgba(57,255,20,0.7)",bordercolor="#0a0a0a",borderwidth=1,borderpad=4,opacity=0.9)
        
        fig.update_layout(transition={'duration': 300}) 
        fig.update_layout(
            height=650, template='plotly_dark', plot_bgcolor='#0e0e0e', paper_bgcolor='#0e0e0e',
            hovermode='x unified',
            legend=dict(orientation="h",yanchor="bottom",y=1.02,xanchor="right",x=1),
            xaxis_title='Date',
            xaxis_rangeslider_visible=False,
            xaxis=dict(rangeselector=dict(buttons=[dict(count=1,label="1m",step="month",stepmode="backward"),dict(count=3,label="3m",step="month",stepmode="backward"),dict(count=6,label="6m",step="month",stepmode="backward"),dict(count=1,label="YTD",step="year",stepmode="todate"),dict(count=1,label="1y",step="year",stepmode="backward"),dict(step="all")],font=dict(color="#39ff14",size=10),bgcolor="#1a1a1a",bordercolor="#39ff14",activecolor="#2b2b2b")),
            yaxis=dict(
                domain=[0.25, 1],
                title=f'Price ({stock_currency_code})'
            ),
            yaxis2=dict(title=dict(text='RSI', font=dict(size=10)), overlaying='y', side='right', showgrid=False, range=[0,100], visible=show_rsi, position=0.97, tickfont=dict(size=8)),
            yaxis3=dict(title=dict(text='MACD', font=dict(size=10)), overlaying='y', side='right', showgrid=False, visible=show_macd, position=0.90 if show_rsi else 0.97, tickfont=dict(size=8)),
            yaxis4=dict(
                domain=[0, 0.22],
                title='Volume',
                showgrid=False
            ),
            margin=dict(l=50, r=50, t=80, b=50)
        )
        if show_rsi: fig.add_hline(y=30,line_dash="dash",line_color="green",opacity=0.5,yref="y2",layer="below"); fig.add_hline(y=70,line_dash="dash",line_color="red",opacity=0.5,yref="y2",layer="below")
        if show_macd: fig.add_hline(y=0,line_dash="dash",line_color="#888",opacity=0.5,yref="y3",layer="below")
        st.plotly_chart(fig,use_container_width=True)
        
        st.markdown("#### Last 10 Days Data")
        csv_export = df.to_csv(index=True).encode('utf-8')
        st.download_button(
            label="📥 Download Full Historical Data (CSV)",
            data=csv_export,
            file_name=f'{ticker}_historical_data_{selected_label.replace(" ","_")}.csv',
            mime='text/csv',
            key='download_hist_csv_reverted'
        )
        
        cols_to_show_in_table = ['Open', 'High', 'Low', 'Close', 'Volume', 'SMA_20', 'RSI', 'MACD_hist']
        if 'BB_High' in df_ta:
            cols_to_show_in_table.extend(['BB_High', 'BB_Mid', 'BB_Low'])
        
        existing_cols_in_df_ta = [col for col in cols_to_show_in_table if col in df_ta.columns]
        
        if existing_cols_in_df_ta:
            df_to_display = df_ta[existing_cols_in_df_ta].tail(10).sort_index(ascending=False)
            
            def highlight_row_color(row):
                if 'Open' in row.index and 'Close' in row.index:
                    color = 'rgba(57, 255, 20, 0.1)' if row['Close'] >= row['Open'] else 'rgba(255, 68, 68, 0.1)'
                    return [f'background-color: {color}'] * len(row)
                return [''] * len(row)
            
            styler = df_to_display.style.format(precision=2).apply(highlight_row_color, axis=1)

            if 'Volume' in df_to_display.columns:
                styler.background_gradient(cmap='Greens', subset=['Volume'])
            if 'High' in df_to_display.columns:
                styler.highlight_max(color='rgba(57, 255, 20, 0.4)', subset=['High'])
            if 'Low' in df_to_display.columns:
                styler.highlight_min(color='rgba(255, 68, 68, 0.4)', subset=['Low'])

            st.dataframe(styler, use_container_width=True)
        else:
            st.info("Not enough data or relevant columns to display in the table.")

    # --- TAB 1: Key Fundamentals ---
    with tabs[1]: 
        st.markdown(f"### 📊 Key Fundamentals for {s_info_full.get('shortName', ticker)}")
        # ... (Content from your existing Fundamentals tab, including fig_r, fig_n, fig_e updates with transition)
        def fmt_f_fundamentals(v,t, cur_sym="$"): 
            if v is None or pd.isna(v) or not isinstance(v,(int,float,np.number)): return "N/A"
            if t == "b": return f"{cur_sym}{v/1e9:.2f}B"
            elif t == "m": return f"{cur_sym}{v/1e6:.2f}M"
            elif t == "%": return f"{v*100:.2f}%"
            elif t == "r": return f"{v:.2f}"
            elif t == "$": return f"{cur_sym}{v:.2f}" 
            elif t == "i": return f"{v:,.0f}"
            return str(v) 
        info_fund = s_info_full 
        if not info_fund or not isinstance(info_fund, dict): st.error(f"Fundamental data for **{ticker}** unavailable.")
        else:
            cur_sym_fund = info_fund.get('currency_symbol', current_currency_symbol) 
            try:
                st.markdown("#### 💰 Valuation & Earnings")
                cf1,cf2,cf3=st.columns(3);cf1.metric("Market Cap",fmt_f_fundamentals(info_fund.get("marketCap"),"b", cur_sym_fund));cf2.metric("Ent. Value",fmt_f_fundamentals(info_fund.get("enterpriseValue"),"b", cur_sym_fund));cf3.metric("P/E (Trail)",fmt_f_fundamentals(info_fund.get("trailingPE"),"r"))
                cf4,cf5,cf6=st.columns(3);cf4.metric("P/E (Fwd)",fmt_f_fundamentals(info_fund.get("forwardPE"),"r"));cf5.metric("EPS (Trail)",fmt_f_fundamentals(info_fund.get("trailingEps"),"$", cur_sym_fund));cf6.metric("EPS (Fwd)",fmt_f_fundamentals(info_fund.get("forwardEps"),"$", cur_sym_fund))
                with st.expander("Learn about Valuation & Earnings Metrics"): st.markdown("- **Market Cap:** Total market value...\n- **Enterprise Value (EV):** Company's total value...\n- **P/E Ratio:** Share price relative to earnings...\n- **EPS:** Company's profit per share...")
                st.markdown("---");st.markdown("#### 📈 Profitability & Margins")
                cf7,cf8,cf9=st.columns(3);cf7.metric("ROE",fmt_f_fundamentals(info_fund.get("returnOnEquity"),"%"));cf8.metric("ROA",fmt_f_fundamentals(info_fund.get("returnOnAssets"),"%"));cf9.metric("Profit Margin",fmt_f_fundamentals(info_fund.get("profitMargins"),"%"))
                cf10,cf11,cf12=st.columns(3);cf10.metric("Gross Margin",fmt_f_fundamentals(info_fund.get("grossMargins"),"%"));cf11.metric("Oper. Margin",fmt_f_fundamentals(info_fund.get("operatingMargins"),"%"));cf12.metric("Beta",fmt_f_fundamentals(info_fund.get("beta"),"r"))
                with st.expander("Learn about Profitability & Margins"): st.markdown("- **ROE:** Profitability vs. equity...\n- **ROA:** Profitability vs. assets...\n- **Profit/Gross/Oper. Margin:** Efficiency levels...\n- **Beta:** Volatility vs. market...")
                st.markdown("---");st.markdown("#### 💧 Liquidity & Financial Health")
                cf13,cf14,cf15=st.columns(3);cf13.metric("Debt/Equity",fmt_f_fundamentals(info_fund.get("debtToEquity"),"r"));cf14.metric("Current Ratio",fmt_f_fundamentals(info_fund.get("currentRatio"),"r"));cf15.metric("Quick Ratio",fmt_f_fundamentals(info_fund.get("quickRatio"),"r"))
                with st.expander("Learn about Liquidity & Financial Health"): st.markdown("- **Debt/Equity:** Financial leverage...\n- **Current Ratio:** Short-term obligations...\n- **Quick Ratio:** Stricter short-term liquidity...")
                st.markdown("---");st.markdown("#### 💵 Dividends & Performance Averages")
                cf16,cf17,cf18=st.columns(3);cf16.metric("Div. Yield",fmt_f_fundamentals(info_fund.get("dividendYield"),"%"));cf17.metric("Payout Ratio",fmt_f_fundamentals(info_fund.get("payoutRatio"),"%"));cf18.metric("50-Day Avg",fmt_f_fundamentals(info_fund.get("fiftyDayAverage"),"$", cur_sym_fund))
                st.metric("200-Day Avg Price",fmt_f_fundamentals(info_fund.get("twoHundredDayAverage"),"$", cur_sym_fund))
                with st.expander("Learn about Dividends & Averages"): st.markdown("- **Dividend Yield:** Dividend relative to price...\n- **Payout Ratio:** Earnings paid as dividends...\n- **50/200-Day Avg:** Trend indicators...")
                st.markdown("---");st.markdown("#### 📉 Financial Statements Visualizations")
                if fin_df is not None and not fin_df.empty:
                    st.markdown("##### Quarterly Financials Overview"); fin_p=fin_df.T.sort_index(ascending=True)
                    try:fin_p.index=pd.to_datetime(fin_p.index).strftime('%Y-%m-%d')
                    except:fin_p.index=fin_p.index.astype(str)
                    if 'Total Revenue' in fin_p.columns and not fin_p['Total Revenue'].isnull().all():
                        fig_r=go.Figure(go.Bar(x=fin_p.index,y=fin_p['Total Revenue']/1e6,marker_color='#39ff14',name='Revenue'))
                        fig_r.update_layout(transition={'duration': 300}) 
                        fig_r.update_layout(title=f'Quarterly Revenue (M {cur_sym_fund})',template='plotly_dark',plot_bgcolor='#0e0e0e',paper_bgcolor='#0e0e0e',yaxis_title=f'Amount(M {cur_sym_fund})');st.plotly_chart(fig_r,use_container_width=True)
                    else: st.info("Total Revenue data not available or all NaNs.")
                    if 'Net Income' in fin_p.columns and not fin_p['Net Income'].isnull().all():
                        fig_n=go.Figure(go.Bar(x=fin_p.index,y=fin_p['Net Income']/1e6,marker_color='#87CEEB',name='Net Income'))
                        fig_n.update_layout(transition={'duration': 300}) 
                        fig_n.update_layout(title=f'Quarterly Net Income (M {cur_sym_fund})',template='plotly_dark',plot_bgcolor='#0e0e0e',paper_bgcolor='#0e0e0e',yaxis_title=f'Amount(M {cur_sym_fund})');st.plotly_chart(fig_n,use_container_width=True)
                    else: st.info("Net Income data not available or all NaNs.")
                else:st.info("Quarterly financials unavailable.")
                if earn_df is not None and not earn_df.empty:
                    st.markdown("##### Quarterly EPS"); earn_p=earn_df.T.sort_index(ascending=True);earn_p.index=earn_p.index.astype(str)
                    eps_c='EPS' if 'EPS' in earn_p.columns else 'Diluted EPS' if 'Diluted EPS' in earn_p.columns else 'Earnings' if 'Earnings' in earn_p.columns else None
                    if eps_c and not earn_p[eps_c].isnull().all():
                        fig_e=go.Figure(go.Bar(x=earn_p.index,y=earn_p[eps_c],marker_color='#FFA500',name=eps_c))
                        fig_e.update_layout(transition={'duration': 300}) 
                        fig_e.update_layout(title=f'Quarterly {eps_c.replace("Earnings","Earnings")}',template='plotly_dark',plot_bgcolor='#0e0e0e',paper_bgcolor='#0e0e0e',yaxis_title=f'{eps_c}({cur_sym_fund})' );st.plotly_chart(fig_e,use_container_width=True)
                    else:st.info("EPS data column not found or all NaN.")
                else:st.info("Quarterly earnings unavailable.")
                st.markdown("---");_render_metric_box("<p><b>Fundamental Analysis:</b> ... <i>Always verify with official filings.</i></p>")
            except Exception as e:st.error(f"Error processing fundamentals for {ticker}: {e}")

    # --- TAB 2: News ---
    with tabs[2]: 
        st.markdown("### 📰 News Analysis & Sentiment")

        # Group news by source
        news_by_source = {
            'NewsAPI': news_items_api,
            'Google News': scraped_gnews_items,
            'Yahoo Finance': scraped_yfinance_items
        }
        # Filter out empty sources
        news_sources_with_content = { k: v for k, v in news_by_source.items() if v }

        if not news_sources_with_content:
            st.warning("No news articles could be found for this stock from any source.")
            if news_error_message_api or scraped_gnews_error or scraped_yfinance_error:
                st.caption(f"Debug Info: API='{news_error_message_api}', Google='{scraped_gnews_error}', Yahoo='{scraped_yfinance_error}'")
        else:
            # Create tabs for each news source
            source_tabs = st.tabs(list(news_sources_with_content.keys()))

            for i, (source, articles) in enumerate(news_sources_with_content.items()):
                with source_tabs[i]:
                    st.markdown('<div class="news-grid">', unsafe_allow_html=True)
                    for news_item in articles:
                        sentiment = news_item.get('vader_sentiment', {})
                        sentiment_score = sentiment.get('compound', 0)
                        
                        # Determine sentiment color and width for the bar
                        sent_color = '#39ff14' if sentiment_score >= 0.05 else '#ff4444' if sentiment_score <= -0.05 else '#ffd700'
                        sentiment_width = (abs(sentiment_score) / 1) * 100

                        title = news_item.get('title', 'N/A')
                        link = news_item.get('link', '#')
                        publisher = news_item.get('publisher', 'N/A')
                        published_time = news_item.get('published', 'N/A')
                        
                        # Enhanced image handling with multiple fallbacks
                        image_url = news_item.get('image_url')
                        if not image_url or not image_url.startswith('http'):
                            # Try to get company logo as fallback
                            if s_info_full and s_info_full.get('logo_url'):
                                image_url = s_info_full.get('logo_url')
                            else:
                                # Try to get company logo from Yahoo Finance
                                try:
                                    yahoo_logo_url = f"https://s.yimg.com/aq/autoc?query={ticker}&region=US&lang=en-US"
                                    response = requests.get(yahoo_logo_url, timeout=2)
                                    if response.status_code == 200:
                                        data = response.json()
                                        if data.get('ResultSet', {}).get('Result'):
                                            result = data['ResultSet']['Result'][0]
                                            if result.get('symbol') == ticker and result.get('logourl'):
                                                image_url = result['logourl']
                                except:
                                    pass
                                
                                # Use default company icon as last resort
                                if not image_url or not image_url.startswith('http'):
                                    image_url = DEFAULT_COMPANY_ICON_PATH

                        # Add error handling for image loading with multiple fallbacks
                        st.markdown(f"""
                        <div class="news-card">
                            <div class="news-card-img-container">
                                <a href="{link}" target="_blank">
                                    <img src="{image_url}" 
                                         class="news-card-img" 
                                         onerror="this.onerror=null;this.src='{DEFAULT_COMPANY_ICON_PATH}';"
                                         alt="{title}"
                                         loading="lazy">
                                </a>
                            </div>
                            <div class="news-card-content">
                                <div class="sentiment-bar">
                                    <div class="sentiment-bar-inner" style="width: {sentiment_width}%; background-color: {sent_color};"></div>
                                </div>
                                <h5 class="news-card-title"><a href="{link}" target="_blank">{title}</a></h5>
                                <div class="news-card-footer">
                                    <span>{publisher}</span>
                                    <span>{published_time}</span>
                                </div>
                            </div>
                        </div>
                        """, unsafe_allow_html=True)
                    st.markdown('</div>', unsafe_allow_html=True)
            
    # --- TAB 3: Performance ---
    with tabs[3]:
        st.markdown("### 📈 Performance & Simulation")
        
        # Create tabs within Performance tab
        perf_tabs = st.tabs(["📊 Returns Analysis", "🔬 Monte Carlo Simulator"])
        
        # --- Tab 1: Returns Analysis ---
        with perf_tabs[0]:
            st.markdown(f"#### Performance vs. Market ({market_index})")
            
            # Fetch index data with retries and fallback
            index_df = None
            with st.spinner(f"Loading market index data for {market_index}..."):
                try:
                    index_df = fetch_stock_data(market_index, period=selected_period)
                    if index_df.empty:
                        # Try alternative index symbols
                        alt_indices = {
                            "Indian": ["^NSEI", "NIFTY.NS", "^BSESN"],
                            "US": ["^GSPC", "^DJI", "^IXIC"]
                        }
                        for alt_index in alt_indices.get(market_info.get("market", "US"), []):
                            try:
                                index_df = fetch_stock_data(alt_index, period=selected_period)
                                if not index_df.empty:
                                    st.info(f"Using alternative index {alt_index} for comparison.")
                                    break
                            except:
                                continue
                except Exception as e:
                    st.warning(f"Could not fetch market index data: {str(e)}")

            if df.empty:
                st.warning("Could not load stock data for performance comparison.")
            elif index_df is None or index_df.empty:
                st.warning("Could not load market index data. Showing stock performance only.")
                # Show stock performance without comparison
                stock_returns = df['Close'].pct_change().dropna()
                cagr_stock = hist_cagr
                risk_free_rate = market_info.get("risk_free_rate", 0.03)
                sharpe_stock = calculate_sharpe_ratio(stock_returns, risk_free_rate)
                sortino_stock = calculate_sortino_ratio(stock_returns, risk_free_rate)
                
                # Display metrics
                col1, col2, col3 = st.columns(3)
                with col1:
                    st.metric("CAGR", f"{cagr_stock:.2f}%" if cagr_stock else "N/A")
                with col2:
                    st.metric("Sharpe Ratio", f"{sharpe_stock:.2f}" if sharpe_stock else "N/A")
                with col3:
                    st.metric("Sortino Ratio", f"{sortino_stock:.2f}" if sortino_stock else "N/A")
            else:
                # --- Calculations ---
                stock_returns = df['Close'].pct_change().dropna()
                index_returns = index_df['Close'].pct_change().dropna()
                
                # Align returns data
                combined_returns = pd.concat([stock_returns.rename('stock'), index_returns.rename('index')], axis=1).dropna()
                
                # Metrics
                cagr_stock = hist_cagr
                _, _, cagr_index, _ = calculate_historical_performance_and_cagr(index_df)
                
                risk_free_rate = market_info.get("risk_free_rate", 0.03)
                
                sharpe_stock = calculate_sharpe_ratio(combined_returns['stock'], risk_free_rate)
                sharpe_index = calculate_sharpe_ratio(combined_returns['index'], risk_free_rate)

                sortino_stock = calculate_sortino_ratio(combined_returns['stock'], risk_free_rate)
                sortino_index = calculate_sortino_ratio(combined_returns['index'], risk_free_rate)

                beta_stock = calculate_beta(combined_returns['stock'], combined_returns['index'])
                
                max_drawdown_stock, _, _ = calculate_max_drawdown(df)
                max_drawdown_index, _, _ = calculate_max_drawdown(index_df)

                # Convert CAGR to a decimal for Calmar calculation
                calmar_stock = calculate_calmar_ratio(cagr_stock / 100 if cagr_stock else None, max_drawdown_stock)
                calmar_index = calculate_calmar_ratio(cagr_index / 100 if cagr_index else None, max_drawdown_index)

                # --- Display Metrics ---
                st.markdown("""
                    <div class="animated-card" style="margin-bottom:20px;">
                        <h5 class="glow-text">Key Performance Indicators</h5>
                    </div>
                """, unsafe_allow_html=True)
                
                # Grouped Metrics Display
                st.markdown("<h6>Absolute Returns</h6>", unsafe_allow_html=True)
                perf_col1, perf_col2 = st.columns(2)
                with perf_col1:
                    st.metric("CAGR (Stock)", f"{cagr_stock:.2f}%" if cagr_stock is not None else "N/A", help="Compound Annual Growth Rate: The mean annual growth rate of an investment over a specified period of time longer than one year.")
                with perf_col2:
                    st.metric("CAGR (Index)", f"{cagr_index:.2f}%" if cagr_index is not None else "N/A")
                
                st.markdown("<hr style='margin: 10px 0;'>", unsafe_allow_html=True)
                st.markdown("<h6>Risk-Adjusted Returns</h6>", unsafe_allow_html=True)
                perf_col3, perf_col4 = st.columns(2)
                with perf_col3:
                    st.metric("Sharpe Ratio (Stock)", f"{sharpe_stock:.2f}" if sharpe_stock is not None else "N/A", help="Measures return per unit of total risk. Higher is better.")
                    st.metric("Sortino Ratio (Stock)", f"{sortino_stock:.2f}" if sortino_stock is not None else "N/A", help="Similar to Sharpe, but only considers downside volatility. Higher is better.")
                    st.metric("Calmar Ratio (Stock)", f"{calmar_stock:.2f}" if calmar_stock is not None else "N/A", help="Measures return per unit of max drawdown risk. Higher is better.")
                with perf_col4:
                    st.metric("Sharpe Ratio (Index)", f"{sharpe_index:.2f}" if sharpe_index is not None else "N/A")
                    st.metric("Sortino Ratio (Index)", f"{sortino_index:.2f}" if sortino_index is not None else "N/A")
                    st.metric("Calmar Ratio (Index)", f"{calmar_index:.2f}" if calmar_index is not None else "N/A")

                st.markdown("<hr style='margin: 10px 0;'>", unsafe_allow_html=True)
                st.markdown("<h6>Volatility & Risk</h6>", unsafe_allow_html=True)
                perf_col5, perf_col6 = st.columns(2)
                with perf_col5:
                    st.metric("Volatility (Stock)", f"{volatility_percent:.2f}%" if volatility_percent is not None else "N/A", help="Annualized standard deviation of returns. A measure of price swings.")
                    st.metric("Max Drawdown (Stock)", f"{max_drawdown_stock*100:.2f}%" if max_drawdown_stock is not None else "N/A", help="The largest peak-to-trough decline in investment value.")
                    st.metric("Beta vs. Index", f"{beta_stock:.2f}" if beta_stock is not None else "N/A", help="Measures the stock's volatility relative to the index. >1 is more volatile, <1 is less volatile.")
                with perf_col6:
                    vol_index, _, _ = assess_volatility_and_risk(index_df)
                    st.metric("Volatility (Index)", f"{vol_index:.2f}%" if vol_index is not None else "N/A")
                    st.metric("Max Drawdown (Index)", f"{max_drawdown_index*100:.2f}%" if max_drawdown_index is not None else "N/A")


                # --- Visualizations ---
                st.markdown("""
                    <div class="animated-card" style="margin-top:30px;">
                        <h5 class="glow-text">Growth of Initial Investment</h5>
                    </div>
                """, unsafe_allow_html=True)
                
                growth_df = (1 + combined_returns).cumprod() * 10000
                
                fig_growth = go.Figure()
                fig_growth.add_trace(go.Scatter(x=growth_df.index, y=growth_df['stock'], name=ticker, line=dict(color='#39ff14', width=2)))
                fig_growth.add_trace(go.Scatter(x=growth_df.index, y=growth_df['index'], name=market_index, line=dict(color='#00bfff', width=2, dash='dash')))
                fig_growth.update_layout(
                    title=f"Growth of {current_currency_symbol}10,000 Investment",
                    template='plotly_dark', plot_bgcolor='#0e0e0e', paper_bgcolor='#0e0e0e',
                    yaxis_title="Portfolio Value",
                    legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
                )
                st.plotly_chart(fig_growth, use_container_width=True)
                
                # Drawdown Chart
                st.markdown("""
                    <div class="animated-card" style="margin-top:30px;">
                        <h5 class="glow-text">Underwater Plot (Drawdowns)</h5>
                    </div>
                """, unsafe_allow_html=True)
                
                stock_drawdown = (df['Close'] / df['Close'].cummax() - 1) * 100
                index_drawdown = (index_df['Close'] / index_df['Close'].cummax() - 1) * 100
                
                fig_drawdown = go.Figure()
                fig_drawdown.add_trace(go.Scatter(x=stock_drawdown.index, y=stock_drawdown.values, fill='tozeroy', name=ticker, line=dict(color='#ff4444', width=1), fillcolor='rgba(255, 68, 68, 0.2)'))
                fig_drawdown.add_trace(go.Scatter(x=index_drawdown.index, y=index_drawdown.values, name=market_index, line=dict(color='#FFD700', width=1, dash='dash')))
                
                fig_drawdown.update_layout(
                    title="Historical Drawdowns",
                    template='plotly_dark', plot_bgcolor='#0e0e0e', paper_bgcolor='#0e0e0e',
                    yaxis_title="Drawdown (%)",
                    legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
                )
                st.plotly_chart(fig_drawdown, use_container_width=True)

        # --- Tab 2: Portfolio Simulator ---
        with perf_tabs[1]:
            st.markdown("""
                <div class="animated-card">
                    <h3 class="glow-text">🔬 Monte Carlo Investment Simulator</h3>
                    <p>Forecast potential investment outcomes by running thousands of simulations.</p>
                </div>
            """, unsafe_allow_html=True)
            
            # Investment Parameters
            st.markdown("""
                <div class="animated-card">
                    <h4 class="glow-text">💰 Investment Parameters</h4>
                </div>
            """, unsafe_allow_html=True)
            
            sim_cols1 = st.columns(2)
            with sim_cols1[0]:
                initial_investment_sim = st.number_input(
                    "Initial Investment Amount",
                    min_value=1000.0,
                    max_value=10000000.0,
                    value=10000.0,
                    step=1000.0,
                    format="%.2f",
                    key="sim_initial_inv"
                )
                monthly_contribution = st.number_input(
                    "Monthly Contribution",
                    min_value=0.0,
                    max_value=100000.0,
                    value=500.0,
                    step=100.0,
                    format="%.2f",
                    key="sim_monthly_cont"
                )
            
            with sim_cols1[1]:
                sim_years = st.slider("Simulation Years", 1, 40, 10, key="sim_years")
                reinvest_dividends = st.checkbox("Reinvest Dividends", value=True, key="sim_reinvest")
            
            # Market Parameters
            st.markdown("""
                <div class="animated-card">
                    <h4 class="glow-text">📈 Market Assumptions</h4>
                </div>
            """, unsafe_allow_html=True)
            
            sim_cols2 = st.columns(3)
            with sim_cols2[0]:
                sim_growth = st.slider(
                    "Expected Annual Return (%)", 
                    min_value=2, 
                    max_value=20, 
                    value=int(market_info.get("market_return", 0.10) * 100),
                    help="Average yearly growth rate expected."
                ) / 100
            with sim_cols2[1]:
                sim_volatility = st.slider(
                    "Market Volatility (Std. Dev. %)", 
                    min_value=5, 
                    max_value=40, 
                    value=18,
                    help="Historical standard deviation of returns. Higher values mean more price swings."
                ) / 100
            with sim_cols2[2]:
                dividend_yield = st.slider(
                    "Stock's Dividend Yield (%)", 
                    min_value=0.0, 
                    max_value=10.0, 
                    value=s_info_full.get("dividendYield", 0.0) * 100 if s_info_full.get("dividendYield") else 1.5,
                    step=0.1,
                    help="Annual dividend percentage for the stock."
                ) / 100
            
            # Generate and display simulations
            if st.button("🚀 Run Monte Carlo Simulation", use_container_width=True, key="run_sim_btn"):
                with st.spinner("Running thousands of simulations... this may take a moment."):
                    # Generate multiple scenarios
                    num_simulations = 500
                    scenarios = []
                    for _ in range(num_simulations):
                        dates = pd.date_range(start=pd.Timestamp.now(), periods=sim_years*12, freq='M')
                        values = [initial_investment_sim]
                        current_value = initial_investment_sim
                        
                        for _ in range(1, len(dates)):
                            monthly_growth = np.random.normal(sim_growth/12, sim_volatility/np.sqrt(12))
                            current_value *= (1 + monthly_growth)
                            current_value += monthly_contribution
                            if reinvest_dividends and dividend_yield > 0:
                                current_value *= (1 + dividend_yield/12)
                            values.append(max(0, current_value)) # Ensure value doesn't go below zero
                        scenarios.append(pd.Series(values, index=dates))
                    
                    final_values = [s.iloc[-1] for s in scenarios]
                    
                    # --- Display Simulation Results ---
                    st.markdown("---")
                    st.markdown("### 🔮 Simulation Results")
                    
                    # Plot a few scenarios
                    st.markdown("""
                        <div class="animated-card">
                            <h5 class="glow-text">Portfolio Growth Scenarios</h5>
                        </div>
                    """, unsafe_allow_html=True)
                    fig_sim = go.Figure()
                    colors = px.colors.qualitative.Plotly
                    for i, scenario in enumerate(scenarios[:5]): # Plot first 5 as examples
                        fig_sim.add_trace(go.Scatter(
                            x=scenario.index, y=scenario.values, name=f'Scenario {i+1}',
                            line=dict(color=colors[i], width=1.5, dash='dot'),
                            opacity=0.7
                        ))
                    
                    # Add median and percentile bounds
                    percentile_25 = pd.concat(scenarios, axis=1).quantile(0.25, axis=1)
                    percentile_50 = pd.concat(scenarios, axis=1).quantile(0.50, axis=1) # Median
                    percentile_75 = pd.concat(scenarios, axis=1).quantile(0.75, axis=1)
                    
                    fig_sim.add_trace(go.Scatter(
                        x=percentile_25.index, y=percentile_25.values,
                        fill=None, line=dict(color='rgba(255,255,255,0.3)', width=1, dash='dash'), showlegend=False
                    ))
                    fig_sim.add_trace(go.Scatter(
                        x=percentile_75.index, y=percentile_75.values,
                        fill='tonexty', fillcolor='rgba(0, 191, 255, 0.2)',
                        line=dict(color='rgba(255,255,255,0.3)', width=1, dash='dash'), name='25-75th Percentile'
                    ))
                    fig_sim.add_trace(go.Scatter(
                        x=percentile_50.index, y=percentile_50.values, name='Median Outcome',
                        line=dict(color='#00bfff', width=3)
                    ))

                    fig_sim.update_layout(
                        title='Range of Potential Portfolio Outcomes',
                        template='plotly_dark', plot_bgcolor='#0e0e0e', paper_bgcolor='#0e0e0e',
                        yaxis_title=f"Portfolio Value ({current_currency_symbol})",
                        hovermode='x unified'
                    )
                    st.plotly_chart(fig_sim, use_container_width=True)
                    
                    # Outcome Distribution
                    st.markdown("""
                        <div class="animated-card">
                            <h5 class="glow-text">Distribution of Final Portfolio Values</h5>
                        </div>
                    """, unsafe_allow_html=True)
                    
                    fig_hist = px.histogram(
                        x=final_values, nbins=50, 
                        title=f"Distribution of Outcomes After {sim_years} Years",
                        labels={'x': f'Final Portfolio Value ({current_currency_symbol})'}
                    )
                    fig_hist.update_layout(
                        template='plotly_dark', plot_bgcolor='#0e0e0e', paper_bgcolor='#0e0e0e',
                        yaxis_title="Number of Simulations"
                    )
                    st.plotly_chart(fig_hist, use_container_width=True)
                    
                    # Display statistics
                    st.markdown("""
                        <div class="animated-card">
                            <h5 class="glow-text">Key Outcome Statistics</h5>
                        </div>
                    """, unsafe_allow_html=True)
                    
                    stats_cols = st.columns(4)
                    total_invested_val = initial_investment_sim + monthly_contribution * 12 * sim_years
                    
                    with stats_cols[0]:
                        st.metric("Total Invested", f"{current_currency_symbol}{total_invested_val:,.2f}")
                    with stats_cols[1]:
                        st.metric("Median Final Value", f"{current_currency_symbol}{np.median(final_values):,.2f}")
                    with stats_cols[2]:
                        st.metric("Best Case (95th %)", f"{current_currency_symbol}{np.percentile(final_values, 95):,.2f}")
                    with stats_cols[3]:
                        st.metric("Worst Case (5th %)", f"{current_currency_symbol}{np.percentile(final_values, 5):,.2f}")
                    
                    # Probability Analysis
                        st.markdown("""
                        <div class="animated-card">
                            <h5 class="glow-text">Probability Analysis</h5>
                        </div>
                    """, unsafe_allow_html=True)
                    
                    target_value = st.number_input(
                        f"What is your desired portfolio value ({current_currency_symbol})?",
                        value=np.median(final_values),
                        step=50000.0,
                        format="%.2f"
                    )
                    if target_value > 0:
                        prob_success = (np.array(final_values) >= target_value).mean() * 100
                        st.markdown(
                            f"<h5 style='text-align: center;'>There is a <span class='glow-text'>{prob_success:.1f}%</span> chance of reaching your target of {current_currency_symbol}{target_value:,.2f}.</h5>",
                            unsafe_allow_html=True
                        )

    # --- TAB 4: Chat ---
    with tabs[4]:  # Index 4 for Chat
        st.markdown(f"""
            <div class="animated-card">
                <h3 class="glow-text">💬 Chat with StockSeer about {s_info_full.get('shortName', ticker)}</h3>
                <p>Your AI-powered markets assistant. Ask me anything!</p>
            </div>
        """, unsafe_allow_html=True)
        
        # --- Prompt Library ---
        st.markdown("<h5>Quick Prompts</h5>", unsafe_allow_html=True)
        prompt_cols = st.columns(3)
        prompts = [
            "What is the current technical signal?",
            "Summarize the latest news.",
            "What is the 52-week high and low?",
            "Show me the P/E and EPS.",
            "What's the dividend yield?",
            "Tell me about the company."
        ]
        
        # Function to handle prompt button clicks
        def handle_prompt_click(prompt):
            st.session_state.prompt_query = prompt
            st.session_state.dodo_chat_open = True

        for i, prompt in enumerate(prompts):
            with prompt_cols[i % 3]:
                st.button(prompt, on_click=handle_prompt_click, args=(prompt,), use_container_width=True, key=f"chat_prompt_{i}")

        # --- Chat Interface ---
        # Initialize chat history if it doesn't exist or if ticker changes
        if 'chat_history' not in st.session_state or st.session_state.get('current_ticker_for_chat') != ticker:
            st.session_state.chat_history = [{'role': 'assistant', 'content': f"Hi! I'm ready to answer your questions about {s_info_full.get('shortName', ticker)}. What's on your mind?"}]
            st.session_state.current_ticker_for_chat = ticker
        
        # Display chat history first
        for message in st.session_state.chat_history:
            avatar_icon = "👤" if message['role'] == 'user' else "🤖"
            with st.chat_message(message['role'], avatar=avatar_icon):
                st.markdown(message['content'])

        # Determine the source of the query
        final_user_query = None
        query_from_input = st.chat_input("Ask me about the stock...", key="user_query")
        query_from_prompt = st.session_state.get("prompt_query")

        if query_from_prompt:
            final_user_query = query_from_prompt
            st.session_state.prompt_query = None # Reset prompt
        elif query_from_input:
            final_user_query = query_from_input
        
        # Process the query if it exists
        if final_user_query:
            # Add user message to history
            st.session_state.chat_history.append({'role': 'user', 'content': final_user_query})
            
            # Show "thinking" animation and get response
            with st.spinner("🧠 Thinking..."):
                stock_data_bundle = {
                    's_info_full': s_info_full,
                    'df_ta': df_ta,
                    'current_price': current_price,
                    'processed_news': processed_news_for_sentiment,
                    'overall_news_sentiment_stats': overall_news_sentiment_stats,
                    'signal': signal,
                    'signal_reason': signal_reason
                }
                response = get_chatbot_response(final_user_query, stock_data_bundle, ticker, current_currency_symbol)
            
            # Add bot response to history
            st.session_state.chat_history.append({'role': 'assistant', 'content': response})
            # Rerun to display the new messages immediately
            st.rerun()

        # Clear chat button
        if st.button("Clear Chat History", key="clear_chat", use_container_width=True):
            st.session_state.chat_history = [{'role': 'assistant', 'content': f"Chat history cleared. How can I help you with {s_info_full.get('shortName', ticker)}?"}]
            st.rerun()

    # --- TAB 5: AI, Risk & News ---
    with tabs[5]:
        st.markdown("### 🧠 AI Analysis & Risk Assessment")
        
        # Create two columns for main sections
        risk_col, news_col = st.columns([1, 1])
        
        # Risk Assessment Section
        with risk_col:
            st.markdown("""
                <div class="animated-card">
                    <h4 class="glow-text">📊 Risk Analysis Dashboard</h4>
                </div>
            """, unsafe_allow_html=True)
            
            if volatility_percent is not None and risk_level:
                # Define risk color based on risk level
                risk_color = '#39ff14'  # Default green
                if risk_level == 'Very High':
                    risk_color = '#FF4444'  # Red
                elif risk_level == 'High':
                    risk_color = '#FFA500'  # Orange
                elif risk_level == 'Moderate':
                    risk_color = '#FFD700'  # Yellow
                
                # Risk explanation based on risk level
                risk_explanation_text = "Risk assessment based on historical volatility and market conditions."
                if risk_level == 'Low':
                    risk_explanation_text = "The stock shows stable behavior with minimal volatility."
                elif risk_level == 'Moderate':
                    risk_explanation_text = "Some price fluctuations present but within normal range."
                elif risk_level == 'High':
                    risk_explanation_text = "Significant price swings indicate increased risk."
                elif risk_level == 'Very High':
                    risk_explanation_text = "Extreme volatility suggests high risk - proceed with caution."
                
                # Risk Metrics
                risk_metrics = st.columns(2)
                with risk_metrics[0]:
                    st.metric("Volatility", f"{volatility_percent:.1f}%")
                with risk_metrics[1]:
                    st.metric("Risk Level", risk_level)
                
                # Risk Alert Box
                st.markdown(f"""
                    <div style="
                        padding: 15px;
                        border-radius: 10px;
                        background: linear-gradient(145deg, #1a1a1a, #0a0a0a);
                        border: 2px solid {risk_color};
                        margin: 10px 0;
                    ">
                        <h4 style="color: {risk_color};">Risk Level: {risk_level}</h4>
                        <p style="color: #e0e0e0;">{risk_explanation_text}</p>
                    </div>
                """, unsafe_allow_html=True)
        
        # News Analysis Section
        with news_col:
            st.markdown("""
                <div class="animated-card">
                    <h4 class="glow-text">📰 News Sentiment Analysis</h4>
                </div>
            """, unsafe_allow_html=True)
            
            if processed_news_for_sentiment:
                # Sentiment Timeline
                sentiment_dates = [(news.get('date') or news.get('published') or news.get('publishedAt') or datetime.now().strftime('%Y-%m-%d %H:%M')) for news in processed_news_for_sentiment]
                sentiment_scores = [news['vader_sentiment']['compound'] for news in processed_news_for_sentiment]
                
                fig_sent = go.Figure()
                
                # Add sentiment score line
                fig_sent.add_trace(go.Scatter(
                    x=sentiment_dates,
                    y=sentiment_scores,
                    mode='lines+markers',
                    name='Sentiment Score',
                    line=dict(color='#39ff14', width=2),
                    marker=dict(
                        size=8,
                        color=np.array(sentiment_scores),
                        colorscale=[[0, '#FF4444'], [0.5, '#FFD700'], [1, '#39ff14']],
                        showscale=True
                    )
                ))
                
                # Add zero line
                fig_sent.add_hline(y=0, line_dash="dash", line_color="#888", opacity=0.5)
                
                fig_sent.update_layout(
                    title="News Sentiment Timeline",
                    template='plotly_dark',
                    plot_bgcolor='#0e0e0e',
                    paper_bgcolor='#0e0e0e',
                    height=300,
                    margin=dict(t=30, b=30, l=30, r=30),
                    yaxis_title="Sentiment Score",
                    yaxis=dict(range=[-1, 1]),
                    showlegend=False
                )
                st.plotly_chart(fig_sent, use_container_width=True)
                
                # Recent News with Sentiment
                st.markdown("#### 📰 Latest News & Sentiment")
                for news_item in processed_news_for_sentiment[:5]:
                    sentiment = news_item.get('vader_sentiment', {})
                    sentiment_score = sentiment.get('compound', 0)
                    
                    # Determine sentiment color
                    sent_color = '#39ff14' if sentiment_score > 0.05 else '#FF4444' if sentiment_score < -0.05 else '#FFD700'
                    
                    st.markdown(f"""
                        <div style="
                            padding: 15px;
                            border-radius: 10px;
                            background: linear-gradient(145deg, #1a1a1a, #0a0a0a);
                            border: 1px solid {sent_color};
                            margin: 10px 0;
                        ">
                            <h5 style="color: {sent_color};">{news_item.get('title', 'No Title')}</h5>
                            <p style="color: #e0e0e0; font-size: 0.9em;">{news_item.get('text', 'No content available')[:200]}...</p>
                            <div style="display: flex; justify-content: space-between; margin-top: 10px;">
                                <span style="color: #888;">{news_item.get('date', 'No date')}</span>
                                <span style="color: {sent_color};">Sentiment: {sentiment_score:.2f}</span>
                            </div>
                        </div>
                    """, unsafe_allow_html=True)
            else:
                st.info("No news data available for sentiment analysis.")

    # --- TAB 6: Life Planner ---
    with tabs[6]:  # Index 6 for Life Planner
        st.markdown("### 🎯 Life Planner: Your Path to Financial Goals")
        st.markdown("<p style='color: #a0a0a0; margin-top: -10px;'>A personalized tool to forecast your financial future and plan for your biggest life goals.</p>", unsafe_allow_html=True)
        st.markdown("---")

        # --- Step 1: Goal Definition ---
        with st.expander("Step 1: Define Your Financial Goal", expanded=True):
            st.markdown("""
                <div class="animated-card" style="margin-bottom: 10px; border: none; background: transparent; box-shadow: none;">
                    <h4 class="glow-text">🎯 What are you planning for?</h4>
                </div>
            """, unsafe_allow_html=True)

            goal_type = st.selectbox(
                "Select your primary financial goal",
                ["Retirement", "House Purchase", "Child's Education", "Custom Goal"]
            )

            # Goal-specific inputs
            if goal_type == "Retirement":
                st.markdown("##### Retirement Details")
                g_col1, g_col2 = st.columns(2)
                with g_col1:
                    desired_monthly_expenses = st.number_input("Desired Monthly Expenses (in today's money)", min_value=1000, value=50000, step=5000)
                with g_col2:
                    expected_years_in_retirement = st.slider("Expected years in retirement", 10, 40, 25)
            elif goal_type == "House Purchase":
                st.markdown("##### Dream Home Details")
                g_col1, g_col2 = st.columns(2)
                with g_col1:
                    house_total_cost = st.number_input("Total Cost of the House", min_value=10000, value=1000000, step=50000)
                with g_col2:
                    down_payment_pct = st.slider("Down Payment Percentage (%)", 5, 50, 20)
                    target_amount = house_total_cost * (down_payment_pct / 100)
                    st.info(f"Your down payment target: {current_currency_symbol}{target_amount:,.2f}")
            elif goal_type == "Child's Education":
                st.markdown("##### Education Details")
                g_col1, g_col2 = st.columns(2)
                with g_col1:
                    annual_edu_cost = st.number_input("Annual Education Cost (today's money)", min_value=1000, value=200000, step=10000)
                with g_col2:
                    edu_duration = st.slider("Duration of Education (Years)", 1, 10, 4)
            else: # Custom Goal
                st.markdown("##### Your Custom Goal")
                target_amount = st.number_input(f"Goal Amount ({current_currency_symbol})", min_value=1000, value=1000000, step=10000)

        # --- Step 2: Your Timeline ---
        with st.expander("Step 2: Set Your Timeline"):
            st.markdown("""
                <div class="animated-card" style="margin-bottom: 10px; border: none; background: transparent; box-shadow: none;">
                    <h4 class="glow-text">⏳ When do you want to achieve this?</h4>
                </div>
            """, unsafe_allow_html=True)
            t_col1, t_col2 = st.columns(2)
            with t_col1:
                current_age = st.slider("Your Current Age", 18, 80, 30)
            with t_col2:
                target_age = st.slider("Target Age to Achieve Goal", current_age + 1, 80, 50)
            
            years_to_goal = target_age - current_age
            st.info(f"This gives you **{years_to_goal} years** to save for your goal.")

        # --- Step 3: Financial Inputs ---
        with st.expander("Step 3: Enter Your Financials & Assumptions"):
            st.markdown("""
                <div class="animated-card" style="margin-bottom: 10px; border: none; background: transparent; box-shadow: none;">
                    <h4 class="glow-text">💰 What are your current savings?</h4>
                </div>
            """, unsafe_allow_html=True)
            f_col1, f_col2 = st.columns(2)
            with f_col1:
                current_savings = st.number_input(f"Current Savings for this Goal ({current_currency_symbol})", min_value=0.0, value=50000.0, step=5000.0)
                monthly_investment = st.number_input(f"Monthly Investment Capacity ({current_currency_symbol})", min_value=0.0, value=10000.0, step=1000.0)
            with f_col2:
                market_config = MARKET_CONFIGS[st.session_state.selected_market]
                inflation_rate = st.slider("Expected Annual Inflation (%)", 1.0, 10.0, market_config.get("inflation_rate", 0.03) * 100, 0.1) / 100
                risk_profile = st.select_slider("Select your risk tolerance", ["Conservative", "Moderate", "Aggressive"], value="Moderate", help="Higher risk may lead to higher returns, but also higher potential losses.")
        
        # Generate Forecast Button
        if st.button("🚀 Generate My Financial Forecast", use_container_width=True, type="primary"):
            with st.spinner("Forecasting your financial future..."):
                # (Existing calculation logic remains the same)
                try:
                    market_return = market_config.get("market_return", 0.10)
                    risk_free_rate = market_config.get("risk_free_rate", 0.04)
                    expected_return = {
                        "Conservative": risk_free_rate + 0.02,
                        "Moderate": market_return,
                        "Aggressive": market_return * 1.2
                    }[risk_profile]

                    if goal_type == "Retirement":
                        future_monthly_expenses = npf.fv(inflation_rate, years_to_goal, 0, -desired_monthly_expenses)
                        withdrawal_rate = 0.04 
                        corpus_needed = (future_monthly_expenses * 12) / withdrawal_rate
                        future_target_amount = corpus_needed
                    elif goal_type == "Child's Education":
                        future_costs = [npf.fv(inflation_rate, years_to_goal + i, 0, -annual_edu_cost) for i in range(edu_duration)]
                        future_target_amount = npf.pv(expected_return, edu_duration, -sum(future_costs)/edu_duration, 0, when='begin') if edu_duration > 0 else 0
                    else: # House Purchase or Custom Goal
                        future_target_amount = npf.fv(inflation_rate, years_to_goal, 0, -target_amount)

                    projected_fv_of_current_savings = npf.fv(expected_return, years_to_goal, 0, -current_savings)
                    monthly_rate = expected_return / 12
                    nper_months = years_to_goal * 12
                    projected_fv_of_monthly_inv = npf.fv(monthly_rate, nper_months, -monthly_investment, 0) if nper_months > 0 else 0
                    total_projected_value = projected_fv_of_current_savings + projected_fv_of_monthly_inv
                    
                    shortfall = future_target_amount - total_projected_value
                    required_pmt = -npf.pmt(monthly_rate, nper_months, -current_savings, future_target_amount) if nper_months > 0 else 0

                    st.markdown("---"); st.markdown("### 🔮 Your Financial Forecast")
                    
                    res_col1, res_col2, res_col3 = st.columns(3)
                    res_col1.metric("🎯 Your Goal (Future Value)", f"{current_currency_symbol}{future_target_amount:,.2f}")
                    res_col2.metric("🔮 Projected Savings", f"{current_currency_symbol}{total_projected_value:,.2f}")
                    res_col3.metric("💰 Gap (Shortfall/Surplus)", f"{current_currency_symbol}{shortfall:,.2f}", delta_color=("inverse" if shortfall > 0 else "normal"))

                    # --- Analysis and Recommendations ---
                    st.markdown("#### 💡 Analysis & Next Steps")
                    if shortfall > 0:
                        st.error(f"**You Have a Projected Shortfall of {current_currency_symbol}{shortfall:,.2f}**")
                        st.markdown(f"To get on track, you would need to invest approximately **{current_currency_symbol}{required_pmt:,.2f} per month**, an increase of **{current_currency_symbol}{required_pmt - monthly_investment:,.2f}** from your current plan.")
                    else:
                        st.success(f"**Congratulations! You're on track to exceed your goal by {current_currency_symbol}{-shortfall:,.2f}**")
                        st.markdown("Consider setting a more ambitious goal, taking less risk, or achieving your goal sooner.")
                    
                    # --- Visualizations ---
                    v_col1, v_col2 = st.columns(2)
                    with v_col1:
                        st.markdown("##### Savings Journey")
                        projection_years = list(range(current_age, target_age + 1))
                        savings_projection = [npf.fv(expected_return, i, -monthly_investment*12, -current_savings) for i in range(years_to_goal + 1)]
                        fig_proj = go.Figure()
                        fig_proj.add_trace(go.Scatter(x=projection_years, y=savings_projection, mode='lines', name='Your Projected Savings', line=dict(color='#39ff14', width=3), fill='tozeroy'))
                        fig_proj.add_hline(y=future_target_amount, line_dash="dash", line_color="#ff4444", annotation_text="Your Goal", annotation_position="bottom right")
                        fig_proj.update_layout(height=400, template='plotly_dark', plot_bgcolor='#0e0e0e', paper_bgcolor='#0e0e0e', xaxis_title="Age", yaxis_title=f"Savings ({current_currency_symbol})")
                        st.plotly_chart(fig_proj, use_container_width=True)
                    
                    with v_col2:
                        st.markdown("##### Suggested Asset Allocation")
                        allocations = { "Conservative": {"Equity": 30, "Debt": 60, "Alternatives": 10}, "Moderate": {"Equity": 60, "Debt": 30, "Alternatives": 10}, "Aggressive": {"Equity": 85, "Debt": 10, "Alternatives": 5} }
                        chosen_alloc = allocations[risk_profile]
                        alloc_df = pd.DataFrame(chosen_alloc.items(), columns=['Asset Class', 'Percentage'])
                        fig_alloc = px.pie(alloc_df, values='Percentage', names='Asset Class', title=f'For a "{risk_profile}" Profile', hole=0.4, color_discrete_map={'Equity': '#39ff14', 'Debt': '#00bfff', 'Alternatives': '#ffd700'})
                        fig_alloc.update_traces(textinfo='percent+label', pull=[0.05, 0, 0])
                        fig_alloc.update_layout(height=400, showlegend=False, template='plotly_dark', plot_bgcolor='#0e0e0e', paper_bgcolor='#0e0e0e')
                        st.plotly_chart(fig_alloc, use_container_width=True)

                except Exception as e:
                    st.error(f"An error occurred during calculation: {e}")
                    st.warning("Please check your inputs. A common issue is setting the target age equal to the current age, resulting in zero years to save.")

    # --- TAB 7: My Notes ---
    with tabs[7]:  # Index 7 for My Notes
        st.markdown("""
            <div class="animated-card">
                <h3 class="glow-text">📝 My Notes & Analysis</h3>
                <p>Track your thoughts, analysis, and trading plans</p>
            </div>
        """, unsafe_allow_html=True)
        
        # Initialize notes structure if not exists
        if 'stock_notes' not in st.session_state:
            st.session_state.stock_notes = {}
        if ticker not in st.session_state.stock_notes:
            st.session_state.stock_notes[ticker] = {
                'general': [],
                'technical': [],
                'fundamental': [],
                'trading_plan': [],
                'price_alerts': []
            }
        
        # Note Categories
        note_categories = {
            'general': '📌 General Notes',
            'technical': '📊 Technical Analysis',
            'fundamental': '📈 Fundamental Analysis',
            'trading_plan': '🎯 Trading Plan',
            'price_alerts': '⚠️ Price Alerts'
        }
        
        # Add New Note Section
        st.markdown("""
            <div class="animated-card">
                <h4 class="glow-text">✏️ Add New Note</h4>
            </div>
        """, unsafe_allow_html=True)
        
        col1, col2 = st.columns([3, 1])
        with col1:
            note_category = st.selectbox(
                "Category",
                list(note_categories.keys()),
                format_func=lambda x: note_categories[x]
            )
        
        with col2:
            sentiment = st.select_slider(
                "Sentiment",
                options=['Very Bearish', 'Bearish', 'Neutral', 'Bullish', 'Very Bullish'],
                value='Neutral'
            )
        
        note_text = st.text_area("Note Content", height=100)
        
        if note_category == 'price_alerts':
            alert_cols = st.columns(3)
            with alert_cols[0]:
                alert_price = st.number_input("Alert Price", min_value=0.0, value=float(current_price) if current_price else 0.0)
            with alert_cols[1]:
                alert_condition = st.selectbox("Condition", ["Above", "Below"])
            with alert_cols[2]:
                alert_active = st.checkbox("Active", value=True)
        
        if st.button("Add Note", use_container_width=True):
            if note_text:
                new_note = {
                    'text': note_text,
                    'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    'sentiment': sentiment,
                    'price_at_time': current_price,
                    'category': note_category
                }
                
                if note_category == 'price_alerts':
                    new_note.update({
                        'alert_price': alert_price,
                        'alert_condition': alert_condition,
                        'alert_active': alert_active
                    })
                
                if ticker not in st.session_state.stock_notes:
                    st.session_state.stock_notes[ticker] = {cat: [] for cat in note_categories.keys()}
                
                st.session_state.stock_notes[ticker][note_category].insert(0, new_note)
                st.success("Note added successfully!")
                note_text = ""
        
        # Display Notes Section
        st.markdown("""
            <div class="animated-card">
                <h4 class="glow-text">📚 Your Notes History</h4>
            </div>
        """, unsafe_allow_html=True)
        
        # Filter options
        filter_cols = st.columns([2, 2, 1])
        with filter_cols[0]:
            selected_categories = st.multiselect(
                "Filter by Category",
                list(note_categories.keys()),
                default=list(note_categories.keys()),
                format_func=lambda x: note_categories[x]
            )
        
        with filter_cols[1]:
            selected_sentiment = st.multiselect(
                "Filter by Sentiment",
                ['Very Bearish', 'Bearish', 'Neutral', 'Bullish', 'Very Bullish'],
                default=['Very Bearish', 'Bearish', 'Neutral', 'Bullish', 'Very Bullish']
            )
        
        with filter_cols[2]:
            sort_order = st.selectbox(
                "Sort By",
                ["Newest First", "Oldest First"]
            )
        
        # Display notes for each category
        if ticker in st.session_state.stock_notes:
            for category in selected_categories:
                if st.session_state.stock_notes[ticker][category]:
                    st.markdown(f"#### {note_categories[category]}")
                    
                    # Filter and sort notes
                    filtered_notes = [
                        note for note in st.session_state.stock_notes[ticker][category]
                        if note['sentiment'] in selected_sentiment
                    ]
                    
                    if sort_order == "Oldest First":
                        filtered_notes.reverse()
                    
                    for idx, note in enumerate(filtered_notes):
                        # Create a unique key for each note's container
                        with st.container():
                            # Note header with metadata
                            col1, col2, col3 = st.columns([3, 2, 1])
                            
                            with col1:
                                st.markdown(f"**{note['timestamp']}**")
                            with col2:
                                sentiment_color = {
                                    'Very Bullish': '#39ff14',
                                    'Bullish': '#90EE90',
                                    'Neutral': '#FFD700',
                                    'Bearish': '#FFA07A',
                                    'Very Bearish': '#FF4444'
                                }
                                st.markdown(f"Sentiment: <span style='color: {sentiment_color[note['sentiment']]}'>{note['sentiment']}</span>", unsafe_allow_html=True)
                            with col3:
                                if st.button("🗑️", key=f"delete_{category}_{idx}"):
                                    st.session_state.stock_notes[ticker][category].remove(note)
                                    st.rerun()
                            
                            # Note content
                            st.markdown(f"""
                                <div style="
                                    padding: 15px;
                                    border-radius: 10px;
                                    background: linear-gradient(145deg, #1a1a1a, #0a0a0a);
                                    border: 1px solid #39ff14;
                                    margin: 10px 0;
                                ">
                                    <div style="color: #e0e0e0;">{note['text']}</div>
                                    <div style="color: #888; font-size: 0.8em; margin-top: 10px;">
                                        Stock Price at Time: {current_currency_symbol}{note['price_at_time']:.2f}
                                    </div>
                                </div>
                            """, unsafe_allow_html=True)
                            
                            # Additional info for price alerts
                            if category == 'price_alerts' and 'alert_price' in note:
                                alert_status = "🟢 Active" if note.get('alert_active', True) else "⚫ Inactive"
                                alert_condition = note.get('alert_condition', 'Above')
                                alert_price = note.get('alert_price', 0.0)
                                
                                st.markdown(f"""
                                    <div style="
                                        padding: 10px;
                                        border-radius: 5px;
                                        background: rgba(26,26,26,0.9);
                                        margin: 5px 0;
                                    ">
                                        <span style="color: #e0e0e0;">Alert {alert_status}: {alert_condition} {current_currency_symbol}{alert_price:.2f}</span>
                                    </div>
                                """, unsafe_allow_html=True)

        st.markdown("---")
        
        # Export/Import Section
        st.markdown("""
            <div class="animated-card">
                <h4 class="glow-text">💾 Backup & Restore</h4>
            </div>
        """, unsafe_allow_html=True)
        
        exp_col1, exp_col2 = st.columns(2)
        with exp_col1:
            if st.button("Export Notes"):
                notes_json = json.dumps(st.session_state.stock_notes.get(ticker, {}))
                st.download_button(
                    label="Download Notes",
                    data=notes_json,
                    file_name=f"{ticker}_notes.json",
                    mime="application/json"
                )
        
        with exp_col2:
            uploaded_file = st.file_uploader("Import Notes", type="json")
            if uploaded_file is not None:
                try:
                    imported_notes = json.load(uploaded_file)
                    st.session_state.stock_notes[ticker] = imported_notes
                    st.success("Notes imported successfully!")
                except Exception as e:
                    st.error(f"Error importing notes: {str(e)}")

    # --- TAB 8: About Company ---
    with tabs[8]:  # Index 8 for About Company
        about_info, sector, industry, mcap_val, exch_val, s_info_full, _, _, analyst_recs, analyst_price_target_data, company_officers = get_about_stock_info(ticker)
        
        # Prepare dynamic content for the 'About' tab
        history_and_strategies_html = f"""
            <h5 style='color: #39ff14;'>Company Profile</h5>
            <p>{s_info_full.get('longBusinessSummary', 'No detailed summary available.')}</p>
            <br>
            <p><i>Note: For detailed history and specific business strategies, please refer to the company's official investor relations website. This section provides a general overview from available data.</i></p>
            """
        
        render_about_tab(
            tabs[8], 
            ticker, 
            s_info_full, 
            about_info, 
            sector, 
            industry, 
            mcap_val, 
            exch_val, 
            current_currency_symbol, 
            company_officers, 
            analyst_recs, 
            analyst_price_target_data,
            history_and_strategies=history_and_strategies_html
        )

        st.markdown("---")
        st.markdown("""
            <div class="animated-card" style="margin-bottom: 1rem;">
                <h3 class="glow-text">🏢 Image Gallery</h3>
            </div>
        """, unsafe_allow_html=True)
        
        if images_error:
            st.warning(images_error)
        else:
            # Create columns for the gallery
            cols = st.columns(3)
            
            # Track successfully loaded images
            valid_images = []

            if not valid_images:
                st.info("No valid company images could be loaded.")
            else:
                st.info("No company images were found.")

    # --- TAB 9: About StockSeer.AI ---
    with tabs[9]:  # Index 9 for About StockSeer.AI
        st.markdown("""
            <style>
            .about-hero-bg {
                background: linear-gradient(120deg, #232a2f 0%, #1a1e23 100%);
                border-radius: 32px;
                padding: 3rem 2rem 2rem 2rem;
                margin-bottom: 2.5rem;
                box-shadow: 0 4px 24px rgba(57,255,20,0.04), 0 1.5px 8px rgba(0,0,0,0.08);
                position: relative;
                overflow: hidden;
            }
            .about-hero-logo {
                width: 90px;
                height: 90px;
                border-radius: 20px;
                background: #f7f7f7;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 1.2rem;
                box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            }
            .about-hero-title {
                font-size: 2.6rem;
                font-weight: 700;
                color: #e6e6e6;
                margin-bottom: 0.5rem;
                letter-spacing: -1px;
                text-shadow: 0 2px 8px rgba(57,255,20,0.06);
            }
            .about-hero-mission {
                font-size: 1.2rem;
                color: #b0e6c1;
                font-weight: 500;
                margin-bottom: 0.7rem;
            }
            .about-hero-sub {
                font-size: 1.05rem;
                color: #b0b0b0;
                margin-bottom: 0.5rem;
            }
            .about-section-block {
                background: rgba(26,26,26,0.97);
                border-radius: 18px;
                padding: 2rem 1.5rem;
                margin-bottom: 2rem;
                box-shadow: 0 2px 12px rgba(57,255,20,0.04);
            }
            .about-section-title {
                font-size: 1.5rem;
                font-weight: 700;
                color: #39ff14;
                margin-bottom: 0.7rem;
            }
            .about-section-divider {
                height: 2px;
                background: linear-gradient(90deg, #39ff14 0%, #00bfff 100%);
                border-radius: 2px;
                margin: 2.5rem 0 2rem 0;
                opacity: 0.18;
            }
            .about-values-list {
                display: flex;
                flex-wrap: wrap;
                gap: 1.5rem;
                margin-top: 1.2rem;
            }
            .about-value-card {
                background: rgba(14,17,23,0.92);
                border-radius: 12px;
                padding: 1.2rem 1.1rem;
                min-width: 180px;
                flex: 1 1 180px;
                box-shadow: 0 1px 6px rgba(57,255,20,0.04);
                text-align: center;
            }
            .about-value-icon {
                font-size: 2.1rem;
                margin-bottom: 0.3rem;
            }
            .about-value-title {
                font-weight: 600;
                color: #39ff14;
                margin-bottom: 0.2rem;
            }
            .about-value-desc {
                color: #bbb;
                font-size: 1rem;
            }
            .about-team-section {
                margin-top: 2.5rem;
            }
            .about-team-title {
                font-size: 1.4rem;
                font-weight: 700;
                color: #00bfff;
                margin-bottom: 1.5rem;
                text-align: center;
            }
            .about-team-group {
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                gap: 2rem;
                margin-bottom: 2.5rem;
            }
            .about-team-group.single { justify-content: center; }
            .about-team-card {
                background: linear-gradient(120deg, #181c1f 60%, #232b2f 100%);
                border-radius: 18px;
                padding: 2rem 1.5rem 1.5rem 1.5rem;
                min-width: 260px;
                max-width: 340px;
                box-shadow: 0 2px 12px rgba(57,255,20,0.06);
                text-align: center;
                position: relative;
                border: 2px solid #222;
                transition: box-shadow 0.2s, border 0.2s;
            }
            .about-team-card.ceo {
                border: 2px solid gold;
                box-shadow: 0 4px 24px rgba(255,215,0,0.10);
            }
            .about-team-photo {
                width: 70px;
                height: 70px;
                border-radius: 50%;
                background: linear-gradient(135deg, #39ff14 60%, #00bfff 100%);
                color: #fff;
                font-size: 2.2rem;
                font-weight: 700;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 0.7rem auto;
                box-shadow: 0 2px 8px rgba(57,255,20,0.10);
            }
            .about-team-role {
                color: #39ff14;
                font-weight: 600;
                margin-bottom: 0.2rem;
            }
            .about-team-name {
                font-size: 1.2rem;
                font-weight: 700;
                color: #fff;
                margin-bottom: 0.5rem;
            }
            .about-team-divider {
                height: 2px;
                background: linear-gradient(90deg, #39ff14 0%, #00bfff 100%);
                border-radius: 2px;
                margin: 0.7rem 0 1.1rem 0;
                opacity: 0.12;
            }
            .ceo-quote, .ceo-quote2 {
                color: gold;
                font-style: italic;
                font-size: 1.1rem;
                margin-bottom: 0.7rem;
            }
            .ceo-bio {
                color: #eee;
                font-size: 1.05rem;
                margin-bottom: 0.7rem;
            }
            .about-team-card:hover {
                box-shadow: 0 6px 32px rgba(57,255,20,0.13);
                border: 2px solid #39ff14;
            }
            .about-cta {
                background: linear-gradient(90deg, #39ff14 0%, #00bfff 100%);
                color: #0a0a0a;
                font-weight: 700;
                font-size: 1.2rem;
                border-radius: 16px;
                padding: 1.2rem 2rem;
                text-align: center;
                margin: 2.5rem 0 1.5rem 0;
                box-shadow: 0 2px 12px rgba(57,255,20,0.08);
            }
            .about-stats-block {
                display: flex;
                flex-wrap: wrap;
                gap: 2.5rem;
                justify-content: center;
                margin: 2.5rem 0 1.5rem 0;
            }
            .about-stat-card {
                background: rgba(26,26,26,0.97);
                border-radius: 14px;
                padding: 1.2rem 2rem;
                min-width: 180px;
                text-align: center;
                box-shadow: 0 1px 6px rgba(57,255,20,0.04);
            }
            .about-stat-value {
                font-size: 2.1rem;
                font-weight: 800;
                color: #39ff14;
                margin-bottom: 0.2rem;
            }
            .about-stat-label {
                color: #bbb;
                font-size: 1.1rem;
            }
            @media (max-width: 900px) {
                .about-hero-bg { padding: 2rem 0.5rem 1.5rem 0.5rem; }
                .about-section-block { padding: 1.2rem 0.7rem; }
                .about-team-group { flex-direction: column; gap: 1.5rem; }
                .about-stats-block { flex-direction: column; gap: 1.2rem; }
            }
            .about-timeline {
                margin: 2.5rem 0 2rem 0;
                padding-left: 0.5rem;
                border-left: 4px solid #39ff14;
            }
            .about-timeline-event {
                margin-bottom: 1.5rem;
                position: relative;
                padding-left: 1.2rem;
            }
            .about-timeline-dot {
                position: absolute;
                left: -0.8rem;
                top: 0.2rem;
                width: 1.1rem;
                height: 1.1rem;
                background: linear-gradient(135deg, #39ff14 60%, #00bfff 100%);
                border-radius: 50%;
                border: 2px solid #fff;
                box-shadow: 0 2px 8px rgba(57,255,20,0.10);
            }
            .about-timeline-title {
                font-weight: 700;
                color: #39ff14;
                font-size: 1.1rem;
            }
            .about-timeline-desc {
                color: #bbb;
                font-size: 1rem;
            }
            </style>
            <div class="about-hero-bg">
                <div class="about-hero-logo">
                    <img src="assets/app_icon_main.png" alt="StockSeer.AI Logo" style="width: 70px; height: 70px; border-radius: 16px;"/>
                </div>
                <div class="about-hero-title">StockSeer.AI</div>
                <div class="about-hero-mission">Empowering investors with AI-driven insights, clarity, and confidence.</div>
                <div class="about-hero-sub">Your trusted partner for global stock analysis, risk management, and financial growth.</div>
            </div>
            <div class="about-section-block">
                <div class="about-section-title">Why We Exist</div>
                <p style="font-size:1.15rem; color:#eee;">
                    <b>StockSeer.AI exists to break barriers in investing.</b> We believe that everyone—no matter their background—deserves access to powerful, intuitive, and honest financial tools. Our purpose is to empower you to invest with clarity, confidence, and control, using the best of AI and human insight. <br><br>
                    <i>We're here to help you see further, act smarter, and grow stronger—every step of your financial journey.</i>
                </p>
            </div>
            <div class="about-section-block">
                <div class="about-section-title">Our Values</div>
                <div class="about-values-list">
                    <div class="about-value-card">
                        <div class="about-value-icon">🤝</div>
                        <div class="about-value-title">Integrity</div>
                        <div class="about-value-desc">We put transparency and honesty at the heart of everything we do.</div>
                    </div>
                    <div class="about-value-card">
                        <div class="about-value-icon">🚀</div>
                        <div class="about-value-title">Innovation</div>
                        <div class="about-value-desc">We relentlessly pursue new ideas to deliver the best for our users.</div>
                    </div>
                    <div class="about-value-card">
                        <div class="about-value-icon">🌍</div>
                        <div class="about-value-title">Inclusivity</div>
                        <div class="about-value-desc">We empower investors of all backgrounds and experience levels.</div>
                    </div>
                    <div class="about-value-card">
                        <div class="about-value-icon">📈</div>
                        <div class="about-value-title">Excellence</div>
                        <div class="about-value-desc">We set the highest standards for our technology and our team.</div>
                    </div>
                </div>
            </div>
            <div class="about-section-divider"></div>
            <div class="about-team-section">
                <div class="about-team-title">Meet the Leadership</div>
                <!-- Founder & CEO -->
                <div class="about-team-group single">
                    <div class="about-team-card ceo" style="max-width: 520px; min-width: 320px; padding: 2.7rem 2.2rem 2.2rem 2.2rem; box-shadow: 0 8px 36px rgba(255,215,0,0.13);">
                        <div class="about-team-photo">RS</div>
                        <div class="about-team-role">Founder & CEO</div>
                        <div class="about-team-name">Ranvijay Singh Tomar</div>
                        <div class="about-team-divider"></div>
                        <div class="ceo-quote">"Leading with vision, integrity, and a relentless drive for excellence."</div>
                        <div class="ceo-bio">
                            <b>Why I Started StockSeer.AI:</b> I saw too many people held back by confusing, exclusive, or outdated investing tools. I wanted to build something different—something that puts the power of AI and clear design in everyone's hands.<br><br>
                            <b>What Drives Me:</b> I'm passionate about making finance fair, transparent, and empowering. I believe in listening deeply to our users, learning from every challenge, and building with heart and humility.<br><br>
                            <b>My Promise:</b> I will always put our users first. My goal is to make StockSeer.AI not just a tool, but a trusted companion for your financial journey.<br><br>
                            <span style="color:gold; font-style:italic;">"If you can help someone see further, you can help them achieve more than they ever imagined."</span>
                        </div>
                        <div class="ceo-quote2">"True leadership is about inspiring others to see what's possible—and then helping them achieve it."</div>
                    </div>
                </div>
                <div class="about-team-group-spacer"></div>
                <!-- CTO & CPO -->
                <div class="about-team-group">
                    <div class="about-team-card" style="max-width: 420px; min-width: 260px; padding: 2.2rem 1.5rem 1.5rem 1.5rem;">
                        <div class="about-team-photo">RA</div>
                        <div class="about-team-role">Chief Technology Officer</div>
                        <div class="about-team-name">Raghav Agarwal</div>
                        <div class="about-team-divider"></div>
                        <div class="about-team-bio">
                            <b>Tech Visionary:</b> Raghav is the architect behind StockSeer.AI's robust, scalable, and secure technology. He is passionate about harnessing AI and data science to solve real-world problems for investors.<br><br>
                            <b>Approach:</b> Raghav believes in building technology that is not just powerful, but also accessible and reliable. He leads with a focus on innovation, quality, and user trust.<br><br>
                            <b>Leadership Style:</b> Collaborative, detail-oriented, and always curious. Raghav inspires the team to push boundaries and deliver excellence every day.
                        </div>
                    </div>
                    <div class="about-team-card" style="max-width: 420px; min-width: 260px; padding: 2.2rem 1.5rem 1.5rem 1.5rem;">
                        <div class="about-team-photo">RG</div>
                        <div class="about-team-role">Chief Product Officer</div>
                        <div class="about-team-name">Ravi Gupta</div>
                        <div class="about-team-divider"></div>
                        <div class="about-team-bio">
                            <b>Product Champion:</b> Ravi is the driving force behind StockSeer.AI's user experience and product strategy. He is dedicated to making investing simple, engaging, and effective for everyone.<br><br>
                            <b>Approach:</b> Ravi obsesses over every detail of the user journey, ensuring that every feature is intuitive and impactful. He believes great products are built by listening, iterating, and always putting users first.<br><br>
                            <b>Leadership Style:</b> Empathetic, creative, and relentlessly user-focused. Ravi empowers the team to innovate boldly and deliver real value to our community.
                        </div>
                    </div>
                </div>
                <div class="about-team-group-spacer"></div>
                <!-- Key Advisor -->
                <div class="about-team-group single">
                    <div class="about-team-card" style="max-width: 420px; min-width: 260px; padding: 2.2rem 1.5rem 1.5rem 1.5rem; background: linear-gradient(120deg, #232a2f 60%, #1a1e23 100%); border: 2px solid #2a2a2a;">
                        <div class="about-team-photo">RT</div>
                        <div class="about-team-role">Key Advisor</div>
                        <div class="about-team-name">Randhir Singh Tomar</div>
                        <div class="about-team-divider"></div>
                        <div class="about-team-bio">
                            <b>Strategic Mentor:</b> Randhir brings a wealth of business wisdom and a steady hand to StockSeer.AI. With a background in guiding organizations through growth and transformation, he ensures the team stays focused on long-term value.<br><br>
                            <b>Vision:</b> Randhir believes that true innovation is built on a foundation of trust, ethics, and sustainable growth. He helps shape StockSeer.AI's strategy to serve users for the long run.<br><br>
                            <b>Advisory Philosophy:</b> Thoughtful, principled, and always supportive. Randhir is a sounding board for the leadership team, offering perspective, encouragement, and a focus on what matters most.
                        </div>
                    </div>
                </div>
            </div>
            <div class="about-section-divider"></div>
            <div class="about-stats-block">
                <div class="about-stat-card">
                    <div class="about-stat-value">10,000+</div>
                    <div class="about-stat-label">Stocks Analyzed</div>
                </div>
                <div class="about-stat-card">
                    <div class="about-stat-value">30+</div>
                    <div class="about-stat-label">Global Markets</div>
                </div>
                <div class="about-stat-card">
                    <div class="about-stat-value">1M+</div>
                    <div class="about-stat-label">Data Points Processed Daily</div>
                </div>
                <div class="about-stat-card">
                    <div class="about-stat-value">100%</div>
                    <div class="about-stat-label">User-First Commitment</div>
                </div>
            </div>
            <div class="about-cta">
                Ready to join the future of investing? <a href="mailto:hello@stockseer.ai" style="color:#0a0a0a; text-decoration:underline; font-weight:700;">Contact Us</a> or <a href="https://www.linkedin.com/company/stockseer-ai/" target="_blank" style="color:#0a0a0a; text-decoration:underline; font-weight:700;">Connect on LinkedIn</a>
            </div>
        """, unsafe_allow_html=True)

    # --- TAB 10: Tutorial ---
    with tabs[10]:
        st.markdown("""
            <div class="animated-card">
                <h3 class="glow-text">📚 StockSeer.AI Tutorial</h3>
                <p>Learn how to use all the features of StockSeer.AI</p>
            </div>
        """, unsafe_allow_html=True)

        # Create tutorial sections
        tutorial_sections = st.tabs([
            "🎯 Getting Started",
            "📊 Market Analysis",
            "🤖 AI Features",
            "📈 Performance Tools",
            "💡 Tips & Tricks"
        ])

        # Getting Started Section
        with tutorial_sections[0]:
            st.markdown("""
                <div class="animated-card">
                    <h4 class="glow-text">🎯 Getting Started with StockSeer.AI</h4>
                </div>
            """, unsafe_allow_html=True)
            
            st.markdown("""
                ### 1. Market Selection
                - Choose your preferred market from the sidebar
                - Select from various global markets including US, Indian, UK, and more
                - Each market has its own curated list of stocks

                ### 2. Stock Selection
                - Enter a stock ticker symbol in the search box
                - For Indian stocks, add '.NS' suffix (e.g., 'RELIANCE.NS')
                - Use the quick access buttons for popular stocks

                ### 3. Navigation
                - Use the tabs at the top to access different features
                - Each tab provides specific functionality and analysis
                - The sidebar contains market selection and quick actions
            """)

        # Market Analysis Section
        with tutorial_sections[1]:
            st.markdown("""
                <div class="animated-card">
                    <h4 class="glow-text">📊 Market Analysis Features</h4>
                </div>
            """, unsafe_allow_html=True)
            
            st.markdown("""
                ### 1. Overview Tab
                - View key stock information and metrics
                - Access real-time price data and charts
                - See company summary and key statistics

                ### 2. Financials Tab
                - Analyze key financial ratios
                - View revenue, earnings, and growth metrics
                - Compare with industry averages

                ### 3. News Tab
                - Access latest news from multiple sources
                - View sentiment analysis of news
                - Track market impact of news events
            """)

        # AI Features Section
        with tutorial_sections[2]:
            st.markdown("""
                <div class="animated-card">
                    <h4 class="glow-text">🤖 AI-Powered Features</h4>
                </div>
            """, unsafe_allow_html=True)
            
            st.markdown("""
                ### 1. Chat Assistant
                - Ask questions about any stock
                - Get instant analysis and insights
                - Use quick prompts for common queries

                ### 2. AI Portfolio Advisor
                - Get personalized portfolio recommendations
                - Set investment goals and risk preferences
                - Receive AI-driven stock suggestions

                ### 3. Risk Analysis
                - View AI-powered risk assessment
                - Get volatility predictions
                - Access market sentiment analysis
            """)

        # Performance Tools Section
        with tutorial_sections[3]:
            st.markdown("""
                <div class="animated-card">
                    <h4 class="glow-text">📈 Performance Analysis Tools</h4>
                </div>
            """, unsafe_allow_html=True)
            
            st.markdown("""
                ### 1. Performance Tab
                - Compare stock performance with market indices
                - View historical returns and CAGR
                - Analyze risk-adjusted returns

                ### 2. Monte Carlo Simulator
                - Run investment simulations
                - Project potential returns
                - Assess risk scenarios

                ### 3. Life Planner
                - Plan long-term investment goals
                - Calculate retirement needs
                - Get personalized investment advice
            """)

        # Tips & Tricks Section
        with tutorial_sections[4]:
            st.markdown("""
                <div class="animated-card">
                    <h4 class="glow-text">💡 Tips & Tricks</h4>
                </div>
            """, unsafe_allow_html=True)
            
            st.markdown("""
                ### 1. Efficient Navigation
                - Use keyboard shortcuts (Ctrl/Cmd + K) for quick search
                - Save frequently viewed stocks in My Notes
                - Use the dark/light mode toggle for comfortable viewing

                ### 2. Data Analysis
                - Compare multiple stocks using the comparison feature
                - Export data for external analysis
                - Use technical indicators for trading decisions

                ### 3. Best Practices
                - Regularly check news and sentiment analysis
                - Use the AI Portfolio Advisor for balanced portfolios
                - Keep track of your analysis in My Notes
                - Set up price alerts for important levels
            """)

        # Add a feedback section
        st.markdown("---")
        st.markdown("""
            <div class="animated-card">
                <h4 class="glow-text">📝 Tutorial Feedback</h4>
                <p>Help us improve this tutorial by providing your feedback!</p>
            </div>
        """, unsafe_allow_html=True)
        
        feedback = st.text_area("What could we improve in this tutorial?", height=100)
        if st.button("Submit Feedback"):
            st.success("Thank you for your feedback! We'll use it to improve the tutorial.")

    # --- TAB 11: Watchlist ---
    with tabs[11]:
        st.markdown("""
            <div class="animated-card">
                <h3 class="glow-text">👀 My Watchlist</h3>
                <p>Track your favorite stocks and get real-time updates</p>
            </div>
        """, unsafe_allow_html=True)

        # Initialize watchlist in session state if not exists
        if 'watchlist' not in st.session_state:
            st.session_state.watchlist = []

        # Add stock to watchlist
        col1, col2 = st.columns([3, 1])
        with col1:
            new_stock = st.text_input("Add Stock to Watchlist", placeholder="Enter ticker symbol (e.g., AAPL, RELIANCE.NS)")
        with col2:
            if st.button("Add", use_container_width=True):
                if new_stock and new_stock not in st.session_state.watchlist:
                    st.session_state.watchlist.append(new_stock)
                    st.success(f"Added {new_stock} to watchlist!")

        # Display watchlist
        if st.session_state.watchlist:
            st.markdown("### Your Watchlist")
            for stock in st.session_state.watchlist:
                try:
                    stock_info = yf.Ticker(stock).info
                    current_price = stock_info.get('regularMarketPrice', 'N/A')
                    prev_close = stock_info.get('regularMarketPreviousClose', 'N/A')
                    change = ((current_price - prev_close) / prev_close * 100) if current_price != 'N/A' and prev_close != 'N/A' else 0
                    
                    col1, col2, col3, col4 = st.columns([2, 1, 1, 1])
                    with col1:
                        st.markdown(f"**{stock}** - {stock_info.get('shortName', 'N/A')}")
                    with col2:
                        st.metric("Price", f"${current_price:.2f}" if current_price != 'N/A' else 'N/A')
                    with col3:
                        st.metric("Change", f"{change:.2f}%", delta=f"{change:.2f}%")
                    with col4:
                        if st.button("Remove", key=f"remove_{stock}"):
                            st.session_state.watchlist.remove(stock)
                            st.rerun()
                except:
                    st.error(f"Could not fetch data for {stock}")
        else:
            st.info("Your watchlist is empty. Add some stocks to track!")

    # --- TAB 12: Market Screener ---
    with tabs[12]:
        st.markdown("""
            <div class="animated-card">
                <h3 class="glow-text">🔍 Market Screener</h3>
                <p>Find stocks matching your criteria</p>
            </div>
        """, unsafe_allow_html=True)

        # Screening criteria
        col1, col2 = st.columns(2)
        with col1:
            market_cap_min = st.number_input("Min Market Cap (Millions)", value=1000.0)
            pe_max = st.number_input("Max P/E Ratio", value=50.0)
            dividend_yield_min = st.number_input("Min Dividend Yield (%)", value=0.0)
        with col2:
            beta_max = st.number_input("Max Beta", value=2.0)
            volume_min = st.number_input("Min Volume (Millions)", value=1.0)
            sector = st.selectbox("Sector", ["All", "Technology", "Healthcare", "Finance", "Consumer", "Energy", "Industrial"])

        if st.button("Run Screener", use_container_width=True):
            with st.spinner("Scanning market..."):
                # Get list of stocks to screen
                stocks_to_screen = MARKET_CONFIGS[st.session_state.selected_market]["stocks"]
                results = []

                for stock in stocks_to_screen:
                    try:
                        info = yf.Ticker(stock).info
                        if (info.get('marketCap', 0) >= market_cap_min * 1e6 and
                            info.get('trailingPE', float('inf')) <= pe_max and
                            info.get('dividendYield', 0) * 100 >= dividend_yield_min and
                            info.get('beta', float('inf')) <= beta_max and
                            info.get('averageVolume', 0) >= volume_min * 1e6 and
                            (sector == "All" or info.get('sector', '') == sector)):
                            results.append({
                                'Ticker': stock,
                                'Name': info.get('shortName', 'N/A'),
                                'Price': info.get('regularMarketPrice', 'N/A'),
                                'Market Cap': f"${info.get('marketCap', 0) / 1e6:.2f}M",
                                'P/E': info.get('trailingPE', 'N/A'),
                                'Dividend Yield': f"{info.get('dividendYield', 0) * 100:.2f}%",
                                'Beta': info.get('beta', 'N/A'),
                                'Volume': f"{info.get('averageVolume', 0) / 1e6:.2f}M"
                            })
                    except:
                        continue

                if results:
                    st.dataframe(pd.DataFrame(results), use_container_width=True)
                else:
                    st.info("No stocks found matching your criteria")

    # --- TAB 13: Alerts ---
    with tabs[13]:
        st.markdown("""
            <div class="animated-card">
                <h3 class="glow-text">⚡ Price & News Alerts</h3>
                <p>Set up alerts for price movements and news</p>
            </div>
        """, unsafe_allow_html=True)

        # Initialize alerts in session state if not exists
        if 'alerts' not in st.session_state:
            st.session_state.alerts = []

        # Create new alert
        st.markdown("### Create New Alert")
        alert_cols = st.columns([2, 1, 1, 1])
        with alert_cols[0]:
            alert_stock = st.text_input("Stock Symbol", placeholder="e.g., AAPL, RELIANCE.NS")
        with alert_cols[1]:
            alert_type = st.selectbox("Alert Type", ["Price", "News", "Technical"])
        with alert_cols[2]:
            if alert_type == "Price":
                alert_condition = st.selectbox("Condition", ["Above", "Below"])
                alert_price = st.number_input("Price", min_value=0.0)
            elif alert_type == "Technical":
                alert_condition = st.selectbox("Indicator", ["RSI", "MACD", "Moving Average"])
            else:
                alert_condition = st.selectbox("News Type", ["Company News", "Market News", "All News"])
        with alert_cols[3]:
            if st.button("Add Alert", use_container_width=True):
                if alert_stock:
                    new_alert = {
                        'stock': alert_stock,
                        'type': alert_type,
                        'condition': alert_condition,
                        'price': alert_price if alert_type == "Price" else None,
                        'active': True,
                        'created_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    }
                    st.session_state.alerts.append(new_alert)
                    st.success("Alert created successfully!")

        # Display active alerts
        if st.session_state.alerts:
            st.markdown("### Active Alerts")
            for i, alert in enumerate(st.session_state.alerts):
                col1, col2, col3, col4 = st.columns([2, 2, 2, 1])
                with col1:
                    st.markdown(f"**{alert['stock']}**")
                with col2:
                    st.markdown(f"Type: {alert['type']}")
                with col3:
                    if alert['type'] == "Price":
                        st.markdown(f"Alert when price is {alert['condition']} ${alert['price']:.2f}")
                    else:
                        st.markdown(f"Alert for {alert['condition']}")
                with col4:
                    if st.button("Delete", key=f"delete_alert_{i}"):
                        st.session_state.alerts.pop(i)
                        st.rerun()
        else:
            st.info("No active alerts. Create one to get started!")