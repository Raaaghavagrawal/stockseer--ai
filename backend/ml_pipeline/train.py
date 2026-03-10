import os
import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import TimeSeriesSplit, RandomizedSearchCV
from sklearn.metrics import accuracy_score, precision_score, recall_score, confusion_matrix, classification_report
try:
    from xgboost import XGBClassifier
    from lightgbm import LGBMClassifier
except ImportError:
    pass
import warnings
warnings.filterwarnings('ignore')

from data_collection import fetch_data
from features import engineer_features

def generate_target(df: pd.DataFrame) -> pd.DataFrame:
    """Target Label Generation (1 = Up next day, 0 = Down)"""
    df['Target'] = (df['Close'].shift(-1) > df['Close']).astype(int)
    df.dropna(inplace=True)
    return df

def feature_selection(model, X_train, y_train, features, threshold=0.01):
    """Selects features based on importance to prevent overfitting and curse of dimensionality."""
    model.fit(X_train, y_train)
    importances = model.feature_importances_
    
    selected_features = []
    print("\nFeature Importances:")
    for f, imp in sorted(zip(features, importances), key=lambda x: x[1], reverse=True):
        print(f"{f}: {imp:.4f}")
        if imp >= threshold:
            selected_features.append(f)
            
    print(f"\nSelected {len(selected_features)} features out of {len(features)} (threshold > {threshold})")
    return selected_features

def optimize_hyperparameters(X_train, y_train, model_type="xgboost"):
    """Performs TimeSeriesSplit cross-validation and hyperparameter tuning."""
    tscv = TimeSeriesSplit(n_splits=5)
    
    if model_type == "xgboost":
        model = XGBClassifier(random_state=42, eval_metric='logloss')
        param_grid = {
            'n_estimators': [50, 100, 200],
            'max_depth': [3, 4, 5],
            'learning_rate': [0.01, 0.05, 0.1],
            'subsample': [0.7, 0.8, 1.0],
            'colsample_bytree': [0.7, 0.8, 1.0]
        }
    elif model_type == "random_forest":
        model = RandomForestClassifier(random_state=42, class_weight='balanced')
        param_grid = {
            'n_estimators': [100, 200, 300],
            'max_depth': [3, 5, 10],
            'min_samples_split': [2, 5, 10],
            'min_samples_leaf': [1, 2, 4]
        }
    else:
        raise ValueError("Unsupported model type for tuning")

    print(f"\nStarting RandomizedSearchCV for {model_type}...")
    search = RandomizedSearchCV(
        estimator=model,
        param_distributions=param_grid,
        n_iter=10,  # Limits search space for speed, increase for better results
        scoring='accuracy',
        cv=tscv,
        random_state=42,
        n_jobs=-1
    )
    
    search.fit(X_train, y_train)
    print(f"Best parameters found: {search.best_params_}")
    print(f"Best CV accuracy: {search.best_score_:.4f}")
    
    return search.best_estimator_

def train_and_evaluate(df: pd.DataFrame, symbol: str):
    """Complete Pipeline: Split, Feature Selection, Tuning, Evaluation"""
    features = ['RSI', 'MACD_line', 'MACD_signal', 'MACD_diff', 'BB_width', 
                'ATR', 'Crossover_20_50', 'Daily_Return', 'Return_Vol_5d', 'Volume_Change']
    
    X = df[features]
    y = df['Target']
    
    # 1. Time-Series Split (Sequential, no shuffling)
    split_idx = int(len(df) * 0.8)
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]
    
    print(f"Training on {len(X_train)} samples, Testing on {len(X_test)} samples.")
    
    # 2. Base Model for Feature Selection
    try:
        base_model = XGBClassifier(n_estimators=100, max_depth=3, random_state=42)
        model_type = "xgboost"
    except ImportError:
        base_model = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)
        model_type = "random_forest"
        
    # 3. Feature Selection
    print("\n--- Performing Feature Selection ---")
    selected_features = feature_selection(base_model, X_train, y_train, features)
    
    # Update datasets with selected features
    X_train_sel = X_train[selected_features]
    X_test_sel = X_test[selected_features]
    
    # 4. Hyperparameter Tuning with TimeSeries Cross Validation
    print("\n--- Performing Hyperparameter Tuning ---")
    best_model = optimize_hyperparameters(X_train_sel, y_train, model_type=model_type)
    
    # 5. Final Evaluation on Test Set
    print("\n--- Final Model Evaluation on Unseen Test Data ---")
    preds = best_model.predict(X_test_sel)
    acc = accuracy_score(y_test, preds)
    
    print(f"Accuracy: {acc:.4f}")
    print(f"Precision: {precision_score(y_test, preds, zero_division=0):.4f}")
    print(f"Recall: {recall_score(y_test, preds, zero_division=0):.4f}")
    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, preds))
    print("\nClassification Report:")
    print(classification_report(y_test, preds, zero_division=0))
    
    # 6. Serialization
    os.makedirs('saved_models', exist_ok=True)
    model_path = f"saved_models/{symbol}_best_model.joblib"
    
    # Save a dictionary containing both the model AND the exact features it expects
    model_data = {
        'model': best_model,
        'features': selected_features
    }
    joblib.dump(model_data, model_path)
    print(f"\nModel and feature schema saved to {model_path}")
    
    return best_model, X_test, y_test, selected_features

def backtest_strategy(model, X_test_sel, df_test):
    """Simple Backtesting Simulation"""
    print("\n--- Running Backtest ---")
    preds = model.predict(X_test_sel)
    
    capital = 10000.0
    shares = 0
    
    for i in range(len(preds)):
        signal = preds[i]
        price = df_test['Close'].iloc[i]
        
        # Simple strategy: If 1 (Buy expected), put all capital in. If 0 (Drop expected), sell all.
        if signal == 1 and capital > 0:
            shares = capital / price
            capital = 0
        elif signal == 0 and shares > 0:
            capital = shares * price
            shares = 0
            
    final_value = capital + (shares * df_test['Close'].iloc[-1])
    buy_hold_value = (10000.0 / df_test['Close'].iloc[0]) * df_test['Close'].iloc[-1]
    
    print(f"Initial Capital: $10000.00 | Strategy Final Value: ${final_value:.2f}")
    print(f"Buy & Hold Final Value: ${buy_hold_value:.2f}")
    
    if final_value > buy_hold_value:
        print("Result: Strategy OUTPERFORMED Buy & Hold! 🚀")
    else:
        print("Result: Strategy UNDERPERFORMED Buy & Hold.")


if __name__ == "__main__":
    symbol = "TSLA"  # Example stock
    print(f"=== Starting Advanced ML Pipeline for {symbol} ===")
    
    df = fetch_data(symbol)
    df = engineer_features(df)
    df = generate_target(df)
    
    model, X_test, y_test, selected_features = train_and_evaluate(df, symbol)
    
    # Pass equivalent test dataframe for pricing (alignment happens by index)
    X_test_sel = X_test[selected_features]
    df_test = df.loc[X_test.index]
    backtest_strategy(model, X_test_sel, df_test)
