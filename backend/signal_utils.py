import pandas as pd
import numpy as np
import ta

def generate_signal(df_ta, news_sentiment_score=0, company_name=""):
    """Generate trading signal based on technical indicators and sentiment.
    
    Args:
        df_ta (pd.DataFrame): DataFrame with technical indicators
        news_sentiment_score (float): Sentiment score from news analysis
        company_name (str): Company name for reference
        
    Returns:
        tuple: (signal, reason)
    """
    if df_ta.empty or not all(k in df_ta.columns for k in ['RSI', 'MACD', 'SMA_20', 'Close']):
        return "HOLD", "Insufficient data for signal generation"
    
    latest = df_ta.iloc[-1]
    signals = []
    reasons = []
    
    # RSI Analysis
    if latest['RSI'] < 30:
        signals.append(1)  # Bullish
        reasons.append(f"RSI is oversold ({latest['RSI']:.2f})")
    elif latest['RSI'] > 70:
        signals.append(-1)  # Bearish
        reasons.append(f"RSI is overbought ({latest['RSI']:.2f})")
    
    # MACD Analysis
    if 'MACD_line' in df_ta.columns and 'MACD_signal' in df_ta.columns:
        if latest['MACD'] > 0 and latest['MACD_line'] > latest['MACD_signal']:
            signals.append(1)
            reasons.append("MACD shows bullish momentum")
        elif latest['MACD'] < 0 and latest['MACD_line'] < latest['MACD_signal']:
            signals.append(-1)
            reasons.append("MACD shows bearish momentum")
    
    # Price vs SMA
    if latest['Close'] > latest['SMA_20']:
        signals.append(1)
        reasons.append("Price is above 20-day SMA")
    else:
        signals.append(-1)
        reasons.append("Price is below 20-day SMA")
    
    # News Sentiment Impact
    if news_sentiment_score > 0.2:
        signals.append(1)
        reasons.append(f"Positive news sentiment for {company_name}")
    elif news_sentiment_score < -0.2:
        signals.append(-1)
        reasons.append(f"Negative news sentiment for {company_name}")
    
    # Final Signal
    avg_signal = sum(signals) / len(signals) if signals else 0
    if avg_signal > 0.3:
        return "BUY", " | ".join(reasons)
    elif avg_signal < -0.3:
        return "SELL", " | ".join(reasons)
    else:
        return "HOLD", "Mixed signals: " + " | ".join(reasons)
