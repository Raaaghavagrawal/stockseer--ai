import requests

try:
    response = requests.get("http://localhost:8000/api/ml/predict/AAPL")
    print(response.status_code)
    print(response.json())
except Exception as e:
    print(f"Failed to connect: {e}")
