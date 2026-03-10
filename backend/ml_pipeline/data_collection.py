import yfinance as yf
import pandas as pd

def fetch_data(symbol: str, years: int = 10) -> pd.DataFrame:
    """Fetches historical price data from yfinance."""
    print(f"Fetching {years} years of data for {symbol}...")
    df = yf.download(symbol, period=f"{years}y", interval="1d")
    df.dropna(inplace=True)
    return df

if __name__ == "__main__":
    df = fetch_data("AAPL")
    print(f"Fetched {len(df)} rows.")
