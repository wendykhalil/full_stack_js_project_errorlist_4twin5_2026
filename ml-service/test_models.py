"""
test_models.py — Test all three ML models with sample data.

Usage:
  python test_models.py
"""

import requests
import json

BASE_URL = "http://localhost:5001"

def test_product_performance():
    """Test product performance classifier."""
    print("🔍 Testing Product Performance Classifier...")
    
    data = {
        "productName": "Ciment Portland",
        "price": 45.0,
        "stock": 3,
        "orders": 28,
        "rating": 4.2
    }
    
    try:
        response = requests.post(f"{BASE_URL}/predict-product-performance", json=data)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Product: {result['productName']}")
            print(f"   Label: {result['label']} (confidence: {result['confidence']})")
            print(f"   Recommendation: {result['recommendation']}")
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Connection error: {e}")
    print()

def test_duration_prediction():
    """Test project duration predictor."""
    print("⏱️ Testing Project Duration Predictor...")
    
    test_cases = [
        {
            "project_type": "house",
            "size_sqm": 150,
            "num_workers": 4,
            "complexity": 3
        },
        {
            "project_type": "renovation",
            "size_sqm": 80,
            "num_workers": 2,
            "complexity": 2
        },
        {
            "project_type": "landscaping",
            "size_sqm": 300,
            "num_workers": 6,
            "complexity": 1
        }
    ]
    
    for i, data in enumerate(test_cases, 1):
        try:
            response = requests.post(f"{BASE_URL}/predict-duration", json=data)
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Test {i}: {result['project_type']} ({result['size_sqm']}m², {result['num_workers']} workers)")
                print(f"   Duration: {result['estimated_duration_days']} days")
            else:
                print(f"❌ Test {i} Error: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"❌ Test {i} Connection error: {e}")
    print()

def test_pricing_prediction():
    """Test project pricing predictor."""
    print("💰 Testing Project Pricing Predictor...")
    
    test_cases = [
        {
            "project_type": "house",
            "surface_area": 150,
            "materials": "premium",
            "location": "urban",
            "complexity": 4
        },
        {
            "project_type": "renovation",
            "surface_area": 80,
            "materials": "standard",
            "location": "suburban",
            "complexity": 2
        },
        {
            "project_type": "commercial",
            "surface_area": 500,
            "materials": "basic",
            "location": "rural",
            "complexity": 3
        }
    ]
    
    for i, data in enumerate(test_cases, 1):
        try:
            response = requests.post(f"{BASE_URL}/predict-pricing", json=data)
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Test {i}: {result['project_type']} ({result['surface_area']}m², {result['materials']}, {result['location']})")
                print(f"   Cost: €{result['estimated_cost_euros']:,}")
            else:
                print(f"❌ Test {i} Error: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"❌ Test {i} Connection error: {e}")
    print()

def test_health():
    """Test health endpoint."""
    print("🏥 Testing Health Endpoint...")
    
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Status: {result['status']}")
            print(f"   Model: {result['model']}")
            print(f"   Classes: {result['classes']}")
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Connection error: {e}")
    print()

if __name__ == "__main__":
    print("🚀 Testing ML Service - Multi-Model Predictions")
    print("=" * 50)
    
    # Test all endpoints
    test_health()
    test_product_performance()
    test_duration_prediction()
    test_pricing_prediction()
    
    print("✨ Testing complete! Make sure the Flask service is running on port 5001.")