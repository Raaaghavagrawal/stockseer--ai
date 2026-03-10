import pandas as pd
import ta

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Engineers technical features for ML modeling."""
    df = df.copy()
    
    # Handle multi-index columns from yfinance (if applicable)
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.droplevel(1)
        
    df.columns = [str(c).title() for c in df.columns]
    
    # Technical Indicators (ta library)
    df['RSI'] = ta.momentum.RSIIndicator(df['Close'], window=14).rsi()
    macd = ta.trend.MACD(df['Close'])
    df['MACD_line'] = macd.macd()
    df['MACD_signal'] = macd.macd_signal()
    df['MACD_diff'] = macd.macd_diff()
    
    bb = ta.volatility.BollingerBands(df['Close'], window=20, window_dev=2)
    df['BB_high'] = bb.bollinger_hband()
    df['BB_low'] = bb.bollinger_lband()
    df['BB_width'] = bb.bollinger_wband()
    
    df['ATR'] = ta.volatility.AverageTrueRange(df['High'], df['Low'], df['Close'], window=14).average_true_range()
    
    # Moving Averages & Crossovers
    df['SMA_20'] = ta.trend.sma_indicator(df['Close'], window=20)
    df['SMA_50'] = ta.trend.sma_indicator(df['Close'], window=50)
    df['Crossover_20_50'] = (df['SMA_20'] > df['SMA_50']).astype(int)
    
    # Market Features (Returns & Volatility)
    df['Daily_Return'] = df['Close'].pct_change()
    df['Return_Vol_5d'] = df['Daily_Return'].rolling(5).std()
    df['Volume_Change'] = df['Volume'].pct_change()
    
    df.dropna(inplace=True)
    return df
