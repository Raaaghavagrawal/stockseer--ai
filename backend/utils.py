import yfinance as yf
from datetime import datetime, timedelta
import json
import pandas as pd
from typing import Optional

def get_currency_symbol(currency_code):
    """Get currency symbol from currency code."""
    currency_symbols = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'JPY': '¥',
        'INR': '₹',
        'CNY': '¥',
        'HKD': 'HK$',
        'SGD': 'S$',
        'AUD': 'A$',
        'CAD': 'C$',
        'KRW': '₩',
        'BRL': 'R$',
        'MXN': 'MX$',
        'CHF': 'Fr',
        'SEK': 'kr',
        'NOK': 'kr',
        'DKK': 'kr',
        'NZD': 'NZ$',
        'ZAR': 'R',
        'TRY': '₺',
        'ILS': '₪',
        'THB': '฿',
        'MYR': 'RM',
        'IDR': 'Rp',
        'PHP': '₱',
        'VND': '₫',
    }
    return currency_symbols.get(currency_code, currency_code)


# ---------------------------------------------------------------------------
# Symbol-suffix -> ISO 4217 currency code mapping
# ---------------------------------------------------------------------------
_SUFFIX_CURRENCY_MAP = {
    '.NS': 'INR',   # NSE India
    '.BO': 'INR',   # BSE India
    '.L':  'GBP',   # London Stock Exchange (prices in GBp; divide by 100 handled elsewhere)
    '.T':  'JPY',   # Tokyo
    '.HK': 'HKD',   # Hong Kong
    '.TO': 'CAD',   # Toronto
    '.V':  'CAD',   # TSX Venture
    '.AX': 'AUD',   # Australia
    '.DE': 'EUR',   # Frankfurt XETRA
    '.PA': 'EUR',   # Euronext Paris
    '.AS': 'EUR',   # Euronext Amsterdam
    '.MI': 'EUR',   # Milan
    '.MC': 'EUR',   # Madrid
    '.BR': 'EUR',   # Brussels
    '.SI': 'SGD',   # Singapore
    '.SS': 'CNY',   # Shanghai
    '.SZ': 'CNY',   # Shenzhen
    '.KS': 'KRW',   # Korea
    '.SA': 'BRL',   # Brazil
    '.MX': 'MXN',   # Mexico
    '.ME': 'RUB',   # Moscow
    '.IS': 'TRY',   # Istanbul
    '.JO': 'ZAR',   # Johannesburg
    '.TA': 'ILS',   # Tel Aviv
    '.BK': 'THB',   # Bangkok
    '.KL': 'MYR',   # Kuala Lumpur
    '.JK': 'IDR',   # Jakarta
    '.PS': 'PHP',   # Manila
    '.VN': 'VND',   # Vietnam
    '.SW': 'CHF',   # Switzerland
}

# In-memory cache: symbol -> (currency_code, expiry_datetime)
_currency_cache: dict = {}
_CURRENCY_CACHE_TTL_HOURS = 6


def _get_currency_from_suffix(symbol: str) -> str:
    """Derive ISO 4217 currency code from the exchange suffix of *symbol*."""
    upper = symbol.upper()
    for suffix, code in _SUFFIX_CURRENCY_MAP.items():
        if upper.endswith(suffix):
            return code
    return 'USD'  # US/unknown default


def get_currency_for_symbol(symbol: str) -> str:
    """Return the ISO 4217 currency code for *symbol*.

    Resolution order:
    1. In-memory cache (valid for _CURRENCY_CACHE_TTL_HOURS hours).
    2. yfinance fast_info['currency']  (authoritative, avoids suffix edge-cases).
    3. Suffix-based mapping from _SUFFIX_CURRENCY_MAP.
    4. Default: 'USD'.

    LSE stocks often quote in pence ('GBp') – we normalise those to 'GBP'.
    """
    key = symbol.upper()

    # 1. Check cache
    cached = _currency_cache.get(key)
    if cached:
        code, expiry = cached
        if datetime.now() < expiry:
            return code

    # 2. Try yfinance
    try:
        ticker = yf.Ticker(symbol)
        fast = ticker.fast_info
        raw = None
        if fast is not None and hasattr(fast, 'get'):
            raw = fast.get('currency') or fast.get('Currency')
        if not raw:
            info = ticker.info
            raw = (info or {}).get('currency')
        if raw:
            # Normalise pence -> GBP
            currency = 'GBP' if raw.upper() == 'GBP' or raw == 'GBp' else raw.upper()
            _currency_cache[key] = (currency, datetime.now() + timedelta(hours=_CURRENCY_CACHE_TTL_HOURS))
            return currency
    except Exception:
        pass  # Fall through to suffix lookup

    # 3. Suffix mapping
    currency = _get_currency_from_suffix(symbol)
    _currency_cache[key] = (currency, datetime.now() + timedelta(hours=_CURRENCY_CACHE_TTL_HOURS))
    return currency

def format_large_number(number):
    """Format large numbers into K, M, B, T format."""
    if number is None:
        return "N/A"
    
    try:
        number = float(number)
        if number < 1000:
            return str(number)
        
        for unit in ['', 'K', 'M', 'B', 'T']:
            if abs(number) < 1000:
                return f"{number:.1f}{unit}"
            number /= 1000
            
        return f"{number:.1f}T"
    except:
        return "N/A"

def get_about_stock_info(ticker_symbol):
    """Get comprehensive information about a stock."""
    try:
        stock = yf.Ticker(ticker_symbol)
        info = stock.info
        
        if not info:
            return ("Info not available.", "N/A", "N/A", None, "N/A", {}, 
                   pd.DataFrame(), pd.DataFrame(), None, None, pd.DataFrame())
        
        # Basic Info
        about = info.get('longBusinessSummary', "No summary available.")
        sector = info.get('sector', 'N/A')
        industry = info.get('industry', 'N/A')
        market_cap = info.get('marketCap')
        exchange = info.get('exchange', 'N/A')
        
        # Financial Data
        try:
            financials = stock.quarterly_financials
            if financials.empty:
                financials = stock.financials
        except:
            financials = pd.DataFrame()
            
        # Earnings Data
        try:
            earnings = stock.quarterly_earnings
            if earnings.empty:
                earnings = stock.earnings
        except:
            earnings = pd.DataFrame()
            
        # Analyst Data
        try:
            analyst_recommendations = stock.recommendations
        except:
            analyst_recommendations = None
            
        try:
            price_target = stock.analyst_price_target
        except:
            price_target = None
            
        # Company Officers
        company_officers = info.get('companyOfficers', [])
        
        return (about, sector, industry, market_cap, exchange, info, 
                financials, earnings, analyst_recommendations, 
                price_target, company_officers)
                
    except Exception as e:
        return (f"Error retrieving info: {e}", "N/A", "N/A", None, "N/A", {}, 
                pd.DataFrame(), pd.DataFrame(), None, None, [])
def format_fundamentals(value, format_type, currency_symbol="$"):
    """Format fundamental values for display."""
    if value is None or pd.isna(value) or not isinstance(value, (int, float, pd.Series)):
        return "N/A"
    
    try:
        if format_type == "b":  # Billions
            return f"{currency_symbol}{value/1e9:.2f}B"
        elif format_type == "m":  # Millions
            return f"{currency_symbol}{value/1e6:.2f}M"
        elif format_type == "%":  # Percentage
            return f"{value*100:.2f}%"
        elif format_type == "r":  # Ratio
            return f"{value:.2f}"
        elif format_type == "$":  # Currency
            return f"{currency_symbol}{value:.2f}"
        elif format_type == "i":  # Integer
            return f"{value:,.0f}"
        else:
            return str(value)
    except:
        return "N/A"

def calculate_percentage_change(current, previous):
    """Calculate percentage change between two values."""
    try:
        if previous is None or previous == 0:
            return 0
        return ((current - previous) / previous) * 100
    except:
        return 0

def format_percentage_change(percentage):
    """Format percentage change with appropriate sign and color."""
    if percentage is None or pd.isna(percentage):
        return "N/A"
    
    try:
        if percentage > 0:
            return f"+{percentage:.2f}%"
        elif percentage < 0:
            return f"{percentage:.2f}%"
        else:
            return "0.00%"
    except:
        return "N/A"

def clean_ticker(ticker):
    """Clean and sanitize ticker symbol."""
    if not ticker:
        return ""
    
    # Trim whitespace and convert to uppercase
    cleaned = str(ticker).strip().upper()
    
    # Remove trailing dots (e.g., "ITC." -> "ITC")
    while cleaned.endswith('.'):
        cleaned = cleaned[:-1]
        
    # Prevent duplicate suffixes (e.g., "ITC.NS.NS" -> "ITC.NS")
    # Common suffixes in Yahoo Finance
    suffixes = ['.NS', '.BO', '.T', '.TO', '.V', '.L', '.PA', '.DE', '.AS', '.BR', '.MI', '.MC', '.AX', '.HK', '.SI', '.SW', '.KS', '.SA', '.MX', '.ME', '.SS', '.SZ', '.IS', '.JO', '.TA', '.BK', '.KL', '.JK', '.PS', '.VN']
    
    for suffix in suffixes:
        if cleaned.endswith(suffix + suffix):
            cleaned = cleaned.replace(suffix + suffix, suffix)
            
    return cleaned

def validate_ticker_symbol(ticker):
    """Validate ticker symbol format."""
    if not ticker:
        return False
    
    # Clean first
    cleaned = clean_ticker(ticker)
    if not cleaned:
        return False
        
    # Basic validation: alphanumeric characters and common symbols
    import re
    pattern = r'^[A-Za-z0-9.-]+$'
    return bool(re.match(pattern, cleaned))

def get_market_status():
    """Get current market status (open/closed)."""
    try:
        # Check if US market is open (simplified logic)
        now = datetime.now()
        weekday = now.weekday()
        hour = now.hour
        
        # US market hours: Monday-Friday, 9:30 AM - 4:00 PM EST
        # This is a simplified check - in production you'd want to account for holidays
        if weekday < 5:  # Monday = 0, Friday = 4
            if 9 <= hour < 16:  # 9 AM to 4 PM
                return "OPEN"
            else:
                return "CLOSED"
        else:
            return "CLOSED"
    except:
        return "UNKNOWN"

def calculate_risk_metrics(returns):
    """Calculate basic risk metrics from return series."""
    try:
        if returns.empty or len(returns) < 2:
            return {}
        
        # Convert to numeric if needed
        returns_numeric = pd.to_numeric(returns, errors='coerce').dropna()
        
        if len(returns_numeric) < 2:
            return {}
        
        metrics = {}
        
        # Mean return
        metrics['mean_return'] = returns_numeric.mean()
        
        # Volatility (standard deviation)
        metrics['volatility'] = returns_numeric.std()
        
        # Sharpe ratio (assuming risk-free rate of 0 for simplicity)
        if metrics['volatility'] > 0:
            metrics['sharpe_ratio'] = metrics['mean_return'] / metrics['volatility']
        else:
            metrics['sharpe_ratio'] = 0
        
        # Maximum drawdown
        cumulative = (1 + returns_numeric).cumprod()
        running_max = cumulative.expanding().max()
        drawdown = (cumulative - running_max) / running_max
        metrics['max_drawdown'] = drawdown.min()
        
        # Value at Risk (95% confidence)
        metrics['var_95'] = returns_numeric.quantile(0.05)
        
        return metrics
        
    except Exception as e:
        print(f"Error calculating risk metrics: {str(e)}")
        return {}

def format_timestamp(timestamp):
    """Format timestamp for display."""
    try:
        if isinstance(timestamp, str):
            timestamp = pd.to_datetime(timestamp)
        
        if pd.isna(timestamp):
            return "N/A"
        
        # Format as relative time if recent, otherwise as date
        now = pd.Timestamp.now()
        diff = now - timestamp
        
        if diff.days == 0:
            if diff.seconds < 3600:  # Less than 1 hour
                minutes = diff.seconds // 60
                return f"{minutes} minutes ago"
            else:
                hours = diff.seconds // 3600
                return f"{hours} hours ago"
        elif diff.days == 1:
            return "Yesterday"
        elif diff.days < 7:
            return f"{diff.days} days ago"
        else:
            return timestamp.strftime("%Y-%m-%d")
            
    except:
        return "N/A"

def sanitize_text(text):
    """Sanitize text for safe display."""
    if not text:
        return ""
    
    try:
        # Remove HTML tags
        import re
        clean_text = re.sub(r'<[^>]+>', '', str(text))
        
        # Limit length
        if len(clean_text) > 500:
            clean_text = clean_text[:500] + "..."
        
        return clean_text.strip()
    except:
        return str(text)[:500] if len(str(text)) > 500 else str(text)

