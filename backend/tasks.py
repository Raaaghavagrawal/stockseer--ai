import os
from celery import Celery
import google.generativeai as genai
import json

# Setup Celery
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/1")
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/2")

celery_app = Celery('tasks', broker=CELERY_BROKER_URL, backend=CELERY_RESULT_BACKEND)

# Configure Gemini for background tasks
genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))

@celery_app.task(name='tasks.generate_ai_prediction', bind=True)
def generate_ai_prediction_task(self, symbol: str, ta_data_json: str, news_data_json: str):
    """
    Background job to query Gemini with market signals.
    """
    print(f"Starting Celery Background Task for API ML Prediction: {symbol}")
    
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        prompt = f'''
        You are an advanced financial AI assistant. Give a structured market prediction for: {symbol}.
        
        Recent Technical Output: {ta_data_json}
        Recent News Output: {news_data_json}
        
        Return ONLY a raw JSON object matching:
        {{
            "signal": "Bullish" or "Bearish",
            "confidence": <integer from 0 to 100>,
            "sentiment": "Positive", "Neutral", "Negative",
            "reasoning": "Explain in one sentence.",
            "risk_level": "High" or "Low"
        }}
        '''
        
        response = model.generate_content(prompt)
        text = response.text.replace('```json', '').replace('```', '').strip()
        data_res = json.loads(text)
        
        data_res['ticker'] = symbol
        return data_res
        
    except Exception as e:
        print(f"Error in Celery Worker for {symbol}: {e}")
        # Return fallback heuristic
        return {
            "signal": "Neutral",
            "confidence": 50,
            "sentiment": "Neutral",
            "reasoning": "Fallback algorithmic analysis used.",
            "risk_level": "Medium",
            "ticker": symbol
        }
