#!/usr/bin/env python3
"""
Test script for delay risk prediction endpoint.
Run this after restarting the ML service to verify delay risk prediction works.
"""

import requests
import json

def test_delay_risk_prediction():
    """Test the delay risk prediction endpoint."""
    
    url = "http://localhost:5001/predict-delay-risk"
    
    # Test cases with different risk scenarios
    test_cases = [
        {
            "name": "Low Risk Project",
            "data": {
                "project_type": "renovation",
                "size_sqm": 80,
                "num_workers": 4,
                "location": "urban",
                "materials": "standard",
                "complexity": 2,
                "budget_tnd": 60000,
                "requested_duration": 25,
                "artisan_experience": 8,
                "season": "summer"
            },
            "expected_risk": "LOW"
        },
        {
            "name": "Medium Risk Project", 
            "data": {
                "project_type": "house",
                "size_sqm": 150,
                "num_workers": 3,
                "location": "suburban",
                "materials": "standard", 
                "complexity": 3,
                "budget_tnd": 75000,
                "requested_duration": 30,
                "artisan_experience": 2,
                "season": "autumn"
            },
            "expected_risk": "MEDIUM"
        },
        {
            "name": "High Risk Project",
            "data": {
                "project_type": "commercial",
                "size_sqm": 300,
                "num_workers": 2,
                "location": "rural",
                "materials": "premium",
                "complexity": 5,
                "budget_tnd": 80000,
                "requested_duration": 20,
                "artisan_experience": 1,
                "season": "winter"
            },
            "expected_risk": "HIGH"
        }
    ]
    
    print("🧪 Testing Delay Risk Prediction Endpoint")
    print("=" * 50)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{i}. {test_case['name']}")
        print("-" * 30)
        
        try:
            response = requests.post(url, json=test_case['data'], timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                
                print(f"✅ Status: SUCCESS")
                print(f"📊 Risk Level: {result.get('delay_risk', 'N/A')}")
                print(f"🎯 Confidence: {result.get('confidence', 0)*100:.1f}%")
                
                if result.get('risk_factors'):
                    print(f"⚠️  Risk Factors:")
                    for factor in result['risk_factors']:
                        print(f"   • {factor}")
                
                if result.get('recommendation'):
                    print(f"💡 Recommendation: {result['recommendation']}")
                
                # Check if prediction matches expected
                actual_risk = result.get('delay_risk')
                expected_risk = test_case['expected_risk']
                
                if actual_risk == expected_risk:
                    print(f"✅ Prediction matches expected: {expected_risk}")
                else:
                    print(f"⚠️  Prediction ({actual_risk}) differs from expected ({expected_risk})")
                    
            else:
                print(f"❌ HTTP Error: {response.status_code}")
                print(f"Response: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print("❌ Connection Error: ML service not running on localhost:5001")
            print("💡 Start the service with: python app.py")
            break
        except requests.exceptions.Timeout:
            print("❌ Timeout Error: Request took too long")
        except Exception as e:
            print(f"❌ Unexpected Error: {e}")
    
    print("\n" + "=" * 50)
    print("🏁 Test Complete")

def test_health_endpoint():
    """Test if the ML service is running and updated."""
    
    try:
        response = requests.get("http://localhost:5001/health", timeout=5)
        
        if response.status_code == 200:
            print("✅ ML Service is running")
            return True
        else:
            print(f"❌ ML Service health check failed: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ ML Service is not running on localhost:5001")
        return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 ML Service Delay Risk Test")
    print("=" * 50)
    
    # First check if service is running
    if test_health_endpoint():
        print()
        test_delay_risk_prediction()
    else:
        print("\n💡 Please start the ML service first:")
        print("   cd ml-service")
        print("   python app.py")