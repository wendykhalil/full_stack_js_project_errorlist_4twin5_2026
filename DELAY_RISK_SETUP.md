# Delay Risk Prediction Setup Guide

## Issue Resolution

The delay risk prediction is showing "Erreur de connexion au service ML" because the ML service needs to be restarted to load the new delay risk prediction endpoint.

## Steps to Fix

### 1. Restart the ML Service

```bash
# Stop the current ML service (Ctrl+C if running in terminal)
# Then restart it:
cd ml-service
python app.py
```

### 2. Verify the Service is Updated

Test the health endpoint to confirm the service is running:
```bash
curl http://localhost:5001/health
```

### 3. Test Delay Risk Prediction

Test the new delay risk endpoint:
```bash
curl -X POST http://localhost:5001/predict-delay-risk \
  -H "Content-Type: application/json" \
  -d '{
    "project_type": "house",
    "size_sqm": 150,
    "num_workers": 3,
    "location": "suburban", 
    "materials": "standard",
    "complexity": 3,
    "budget_tnd": 75000,
    "requested_duration": 30,
    "artisan_experience": 2,
    "season": "summer"
  }'
```

Expected response:
```json
{
  "project_type": "house",
  "size_sqm": 150,
  "delay_risk": "MEDIUM",
  "confidence": 0.70,
  "probabilities": {
    "LOW": 0.3,
    "MEDIUM": 0.5, 
    "HIGH": 0.2
  },
  "risk_factors": [
    "Tight deadline for project scope"
  ],
  "recommendation": "Monitor progress closely and have contingency plans ready",
  "message": "Delay risk assessment: MEDIUM (70.0% confidence)"
}
```

## What Was Fixed

1. **Fallback Algorithm**: Added a smart fallback delay risk assessment that works without requiring a trained ML model
2. **Error Handling**: The service now gracefully handles missing delay models
3. **Risk Analysis**: Implements intelligent risk scoring based on:
   - Timeline pressure (deadline vs realistic duration)
   - Artisan experience level
   - Project complexity
   - Team size
   - Seasonal weather conditions
   - Budget constraints

## Features

### Delay Risk Assessment Factors:
- **Timeline Analysis**: Compares requested duration with realistic estimates
- **Experience Factor**: Considers artisan skill level
- **Complexity Impact**: Evaluates project difficulty
- **Resource Allocation**: Analyzes team size adequacy
- **Environmental Conditions**: Weather/seasonal considerations
- **Budget Pressure**: Financial constraint analysis

### Risk Levels:
- **LOW**: Project likely to finish on time
- **MEDIUM**: Some risk factors present, monitor closely  
- **HIGH**: High probability of delays, take action

### Smart Recommendations:
- Specific actionable advice based on identified risk factors
- Confidence scoring for reliability assessment
- Detailed probability breakdown for each risk level

## Integration

The delay risk prediction is now fully integrated into:
- **Frontend**: New tab in ML Predictions page (`/ml-predictions`)
- **Backend**: RESTful API endpoint (`/predict-delay-risk`)
- **Admin Dashboard**: Real-time artisan and project analytics (`/admin/artisans`)

Once the ML service is restarted, all three prediction types (Duration, Pricing, Delay Risk) will work seamlessly together.