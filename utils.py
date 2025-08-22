import streamlit as st
import yfinance as yf
from datetime import datetime
import json
import pandas as pd

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
        'CAD': 'C$'
    }
    return currency_symbols.get(currency_code, currency_code)

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