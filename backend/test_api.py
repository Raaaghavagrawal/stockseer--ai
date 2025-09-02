#!/usr/bin/env python3
"""
Simple test script for StockSeer API
"""

import requests
import json
import time

# API base URL
BASE_URL = "http://localhost:8000"

def test_endpoint(endpoint, method="GET", data=None):
    """Test a specific API endpoint"""
    url = f"{BASE_URL}{endpoint}"
    
    try:
        if method == "GET":
            response = requests.get(url, timeout=10)
        elif method == "POST":
            response = requests.post(url, json=data, timeout=10)
        else:
            print(f"❌ Unsupported method: {method}")
            return False
        
        if response.status_code == 200:
            print(f"✅ {method} {endpoint} - Success")
            try:
                result = response.json()
                if isinstance(result, list):
                    print(f"   📊 Returned {len(result)} items")
                elif isinstance(result, dict):
                    print(f"   📊 Response keys: {list(result.keys())}")
                return True
            except:
                print(f"   📊 Response: {response.text[:100]}...")
                return True
        else:
            print(f"❌ {method} {endpoint} - Failed (Status: {response.status_code})")
            print(f"   Error: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"❌ {method} {endpoint} - Connection Error (Is the API running?)")
        return False
    except Exception as e:
        print(f"❌ {method} {endpoint} - Error: {str(e)}")
        return False

def main():
    """Run all API tests"""
    print("🚀 Testing StockSeer API Endpoints")
    print("=" * 50)
    
    # Test basic endpoints
    print("\n📋 Testing Basic Endpoints:")
    test_endpoint("/test")
    test_endpoint("/health")
    test_endpoint("/")
    
    # Test stock search
    print("\n🔍 Testing Stock Search:")
    test_endpoint("/stocks/search?q=AAPL")
    test_endpoint("/stocks/search?q=BPCL")
    test_endpoint("/stocks/search?q=RELIANCE")
    
    # Test stock data
    print("\n📊 Testing Stock Data:")
    test_endpoint("/stocks/AAPL")
    test_endpoint("/stocks/RELIANCE.NS")
    
    # Test technical analysis
    print("\n📈 Testing Technical Analysis:")
    test_endpoint("/stocks/AAPL/technical")
    test_endpoint("/stocks/AAPL/enhanced-technical")
    
    # Test portfolio
    print("\n💼 Testing Portfolio:")
    test_endpoint("/portfolio")
    
    # Test watchlist
    print("\n👀 Testing Watchlist:")
    test_endpoint("/watchlist")
    
    # Test alerts
    print("\n⚡ Testing Alerts:")
    test_endpoint("/alerts")
    
    # Test simulation
    print("\n🎲 Testing Simulation:")
    test_endpoint("/market/simulation")
    
    print("\n" + "=" * 50)
    print("✅ API testing completed!")

if __name__ == "__main__":
    main()
