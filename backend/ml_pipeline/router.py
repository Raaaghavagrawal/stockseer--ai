import os
import joblib
import pandas as pd
from fastapi import APIRouter, HTTPException
import yfinance as yf
from ml_pipeline.features import engineer_features

router = APIRouter(prefix="/api/ml", tags=["ml"])

# Global model cache to avoid reloading from disk on every request
MODEL_CACHE = {}

def get_model(symbol: str):
    """Loads a custom ML model for a ticker, falling back to a general model if needed."""
    if symbol in MODEL_CACHE:
        return MODEL_CACHE[symbol]
        
    # Check if we have a model trained specifically for this symbol
    model_path = f"ml_pipeline/saved_models/{symbol}_best_model.joblib"
    
    if not os.path.exists(model_path):
        # Fallback to TSLA model acting as a generic high-beta representation if specified one doesn't exist
        fallback_path = "ml_pipeline/saved_models/TSLA_best_model.joblib"
        if os.path.exists(fallback_path):
            model_path = fallback_path
        else:
            return None
            
    try:
        model = joblib.load(model_path)
        MODEL_CACHE[symbol] = model
        return model
    except Exception as e:
        print(f"Failed to load model {model_path}: {e}")
        return None

@router.get("/predict/{symbol}")
async def predict_stock_movement(symbol: str):
    model = get_model(symbol)
    if not model:
        raise HTTPException(status_code=500, detail="Custom ML Model not loaded and no fallback available. Run train.py first.")
        
    try:
        # 1. Fetch recent data
        df = yf.download(symbol, period="3mo", interval="1d", progress=False)
        if df.empty:
            raise HTTPException(status_code=404, detail=f"Market data not found for symbol {symbol}.")
            
        # 2. Engineer features matching the exact training pipeline
        df = engineer_features(df)
        
        # 3. Extract the exact features the tuned model kept during feature selection
        if isinstance(model, dict) and 'model' in model and 'features' in model:
            actual_model = model['model']
            required_features = model['features']
        else:
            # Fallback for old model format
            actual_model = model
            required_features = ['RSI', 'MACD_line', 'MACD_signal', 'MACD_diff', 'BB_width', 
                        'ATR', 'Crossover_20_50', 'Daily_Return', 'Return_Vol_5d', 'Volume_Change']
        
        latest_features = df[required_features].iloc[-1:]
        
        # 4. Predict
        prediction = actual_model.predict(latest_features)[0] # 1 or 0
        probabilities = actual_model.predict_proba(latest_features)[0] # e.g., [0.4, 0.6]
        
        # Find which index matches our prediction to get the confidence
        class_idx = list(actual_model.classes_).index(prediction)
        confidence = round(float(probabilities[class_idx]) * 100, 2)
        
        signal = "Bullish" if prediction == 1 else "Bearish"
        
        # Derive a heuristic risk level from Return Volatility
        vol_metric = float(latest_features['Return_Vol_5d'].iloc[0])
        if vol_metric > 0.03:
            risk_level = "High"
        elif vol_metric > 0.015:
            risk_level = "Medium"
        else:
            risk_level = "Low"
            
        # Derive a heuristic sentiment label
        macd_diff = float(latest_features['MACD_diff'].iloc[0])
        sentiment = "Positive" if macd_diff > 0 else "Negative"
        
        return {
            "ticker": symbol.upper(),
            "signal": signal,
            "confidence": confidence,
            "sentiment": sentiment,
            "reasoning": f"Custom scikit-learn ensemble predicts {signal} movement with {confidence}% probability based on {len(required_features)} technical indicators including RSI and MACD crossovers.",
            "risk_level": risk_level 
        }
        
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
