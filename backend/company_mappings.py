TICKER_TO_NAME = {
    # Indian Tickers
    "RELIANCE.NS": "Reliance Industries",
    "TCS.NS": "Tata Consultancy Services",
    "HDFCBANK.NS": "HDFC Bank",
    "INFY.NS": "Infosys",
    "ICICIBANK.NS": "ICICI Bank",
    "BHARTIARTL.NS": "Bharti Airtel",
    "SBIN.NS": "State Bank of India",
    "LICI.NS": "LIC of India",
    "ITC.NS": "ITC Limited",
    "HINDUNILVR.NS": "Hindustan Unilever",
    "LTIM.NS": "LTIMindtree",
    "LT.NS": "Larsen & Toubro",
    "BAJFINANCE.NS": "Bajaj Finance",
    "KOTAKBANK.NS": "Kotak Mahindra Bank",
    "ADANIENT.NS": "Adani Enterprises",
    "MARUTI.NS": "Maruti Suzuki",
    "SUNPHARMA.NS": "Sun Pharma",
    "TITAN.NS": "Titan Company",
    "ULTRACEMCO.NS": "UltraTech Cement",
    "AXISBANK.NS": "Axis Bank",
    "ASIANPAINT.NS": "Asian Paints",
    "NESTLEIND.NS": "Nestle India",
    "WIPRO.NS": "Wipro",
    "M&M.NS": "Mahindra & Mahindra",
    "ONGC.NS": "ONGC",
    "ADANIPORTS.NS": "Adani Ports",
    "JSWSTEEL.NS": "JSW Steel",
    "TATASTEEL.NS": "Tata Steel",
    "NTPC.NS": "NTPC",
    "POWERGRID.NS": "Power Grid",
    "HINDALCO.NS": "Hindalco",
    "GRASIM.NS": "Grasim Industries",
    "BAJAJ-AUTO.NS": "Bajaj Auto",
    "COALINDIA.NS": "Coal India",
    "TATAMOTORS.NS": "Tata Motors",
    "BPCL.NS": "Bharat Petroleum",
    "TECHM.NS": "Tech Mahindra",
    "EICHERMOT.NS": "Eicher Motors",
    "BRITANNIA.NS": "Britannia Industries",
    "APPOLO.NS": "Apollo Hospitals",
    "SHREECEM.NS": "Shree Cement",
    "DIVISLAB.NS": "Divi's Laboratories",
    "HDFCLIFE.NS": "HDFC Life",
    "INDUSINDBK.NS": "IndusInd Bank",
    "DRREDDY.NS": "Dr. Reddy's",
    "CIPLA.NS": "Cipla",
    "UPL.NS": "UPL Limited",
    "HEROMOTOCO.NS": "Hero MotoCorp",
    "SBILIFE.NS": "SBI Life Insurance",
    "TATACONSUM.NS": "Tata Consumer Products",
    "MRF.NS": "MRF Limited",
    "HDFCLIFE.NS": "HDFC Life",
    "IOC.NS": "Indian Oil",
    "GAIL.NS": "GAIL India",
    "BEL.NS": "Bharat Electronics",
    
    # Global Tickers
    "AAPL": "Apple",
    "MSFT": "Microsoft",
    "GOOGL": "Alphabet Google",
    "AMZN": "Amazon",
    "NVDA": "Nvidia",
    "META": "Meta Platforms Facebook",
    "TSLA": "Tesla",
    "BRK-B": "Berkshire Hathaway",
    "V": "Visa",
    "JNJ": "Johnson & Johnson",
    "WMT": "Walmart",
    "PG": "Procter & Gamble",
    "MA": "Mastercard",
    "HD": "Home Depot",
    "CVX": "Chevron",
    "LLY": "Eli Lilly",
    "BAC": "Bank of America",
    "PFE": "Pfizer",
    "KO": "Coca-Cola",
    "PEP": "PepsiCo"
}

def get_company_name(ticker):
    ticker_upper = ticker.upper()
    
    # 1. Check manual mapping
    if ticker_upper in TICKER_TO_NAME:
        return TICKER_TO_NAME[ticker_upper]
    
    # 2. Try to derive from ticker
    base = ticker_upper.split('.')[0]
    if ticker_upper.endswith('.NS') or ticker_upper.endswith('.BO'):
        # For Indian stocks, if not in map, return just the base but capitalized
        return base
        
    return ticker_upper
