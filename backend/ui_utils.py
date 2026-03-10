import pandas as pd
import requests
from bs4 import BeautifulSoup
from urllib.parse import quote_plus, urlparse
import os
import json
import re
from datetime import datetime, timedelta

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
        try:
            search_url = f"https://www.google.com/search?q={quote_plus(search_query)}&tbm=isch"
            response = requests.get(search_url, headers=headers, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            img_tags = soup.find_all('img')
            
            for img in img_tags[:max_images]:
                src = img.get('src')
                if src and src.startswith('http') and src not in image_urls:
                    image_urls.append(src)
                    if len(image_urls) >= max_images:
                        break
                        
            if len(image_urls) >= max_images:
                break
                
        except Exception as e:
            error_message = f"Error scraping images: {str(e)}"
            continue
    
    return image_urls, error_message

def format_currency(value, currency_code='USD'):
    """Format currency values."""
    if value is None:
        return "N/A"
    
    try:
        value = float(value)
        currency_symbols = {
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'JPY': '¥',
            'INR': '₹'
        }
        symbol = currency_symbols.get(currency_code, currency_code)
        
        if abs(value) >= 1e12:
            return f"{symbol}{value/1e12:.2f}T"
        elif abs(value) >= 1e9:
            return f"{symbol}{value/1e9:.2f}B"
        elif abs(value) >= 1e6:
            return f"{symbol}{value/1e6:.2f}M"
        elif abs(value) >= 1e3:
            return f"{symbol}{value/1e3:.2f}K"
        else:
            return f"{symbol}{value:.2f}"
    except:
        return "N/A"

def format_percentage(value):
    """Format percentage values."""
    if value is None:
        return "N/A"
    
    try:
        value = float(value)
        return f"{value:.2f}%"
    except:
        return "N/A"

def extract_founded_year(business_summary):
    """Extract founded year from business summary."""
    if not business_summary:
        return None
    
    # Common patterns for founding year
    patterns = [
        r'founded in (\d{4})',
        r'established in (\d{4})',
        r'incorporated in (\d{4})',
        r'since (\d{4})',
        r'(\d{4}) founded'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, business_summary.lower())
        if match:
            year = int(match.group(1))
            # Reasonable year range
            if 1800 <= year <= datetime.now().year:
                return year
    
    return None

def extract_products_services(business_summary):
    """Extract products and services from business summary."""
    if not business_summary:
        return []
    
    # Common product/service keywords
    keywords = [
        'products', 'services', 'solutions', 'offerings', 'businesses',
        'divisions', 'segments', 'operations', 'activities'
    ]
    
    sentences = business_summary.split('.')
    relevant_sentences = []
    
    for sentence in sentences:
        sentence = sentence.strip()
        if any(keyword in sentence.lower() for keyword in keywords):
            if len(sentence) > 20:  # Filter out very short sentences
                relevant_sentences.append(sentence)
    
    return relevant_sentences[:5]  # Return top 5 relevant sentences

def get_company_history(ticker_symbol):
    """Get company history information."""
    try:
        # This would typically involve scraping or API calls
        # For now, return a placeholder
        return {
            "founded": None,
            "headquarters": None,
            "employees": None,
            "history": "Company history information not available through current data sources."
        }
    except Exception as e:
        return {
            "founded": None,
            "headquarters": None,
            "employees": None,
            "history": f"Error retrieving company history: {str(e)}"
        }
