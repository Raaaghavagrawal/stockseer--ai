import requests
from urllib.parse import urlparse
import os

# Constants
DEFAULT_COMPANY_ICON_PATH = "assets/default_company_icon.png"
CLEARBIT_LOGO_API = "https://logo.clearbit.com"

def is_valid_url(url):
    """Check if a URL is valid."""
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except:
        return False

def extract_domain(website):
    """Extract domain from website URL."""
    try:
        if not website.startswith(('http://', 'https://')):
            website = 'https://' + website
        domain = urlparse(website).netloc
        return domain.replace('www.', '')
    except:
        return None

def get_company_logo_url(ticker, company_name=None, website=None):
    """Get company logo URL from various sources.
    
    Args:
        ticker (str): Stock ticker symbol
        company_name (str, optional): Company name
        website (str, optional): Company website URL
        
    Returns:
        str: URL to company logo or default icon path
    """
    try:
        # Try clearbit if website is provided
        if website:
            domain = extract_domain(website)
            if domain:
                clearbit_url = f"{CLEARBIT_LOGO_API}/{domain}"
                # Check if logo exists
                response = requests.head(clearbit_url)
                if response.status_code == 200:
                    return clearbit_url

        # Try Yahoo Finance logo (as backup)
        yahoo_logo_url = f"https://s.yimg.com/aq/autoc?query={ticker}&region=US&lang=en-US"
        try:
            response = requests.get(yahoo_logo_url, timeout=2)
            if response.status_code == 200:
                data = response.json()
                if data.get('ResultSet', {}).get('Result'):
                    result = data['ResultSet']['Result'][0]
                    if result.get('symbol') == ticker and result.get('logourl'):
                        logo_url = result['logourl']
                        if is_valid_url(logo_url):
                            return logo_url
        except:
            pass

        # Return default icon if no logo found
        return DEFAULT_COMPANY_ICON_PATH

    except Exception as e:
        print(f"Error fetching logo for {ticker}: {str(e)}")
        return DEFAULT_COMPANY_ICON_PATH
