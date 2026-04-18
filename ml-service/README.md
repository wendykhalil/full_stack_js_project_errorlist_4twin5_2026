# ML Service — Multi-Model Prediction Service

A Flask microservice with four ML models:

## 1. Product Performance Classifier
Uses **RandomForestClassifier** to classify supplier products:

| Label | Meaning |
|---|---|
| `BEST_SELLER` | High demand, good rating, healthy stock |
| `RESTOCK` | High demand but critically low stock |
| `UNDERPERFORMING` | Low orders, poor rating |
| `NORMAL` | Stable, no action needed |

## 2. Project Duration Predictor
Uses **RandomForestRegressor** to predict project completion time in days.

## 3. Project Pricing Predictor  
Uses **RandomForestRegressor** to predict project cost in euros.

## 4. Project Delay Risk Classifier
Uses **RandomForestClassifier** to predict project delay risk:

| Risk Level | Meaning |
|---|---|
| `LOW` | Project likely to finish on time |
| `MEDIUM` | Some risk factors present, monitor closely |
| `HIGH` | High probability of delays, take action |

## Setup

```bash
cd ml-service
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
```

## Train the models

```bash
# Product performance classifier
python train.py          # uses existing data.csv or generates it
python train.py --regen  # force-regenerate data.csv then train

# Duration predictor
python train_duration.py          # train duration model
python train_duration.py --regen  # regenerate duration data then train

# Pricing predictor
python train_pricing.py          # train pricing model
python train_pricing.py --regen  # regenerate pricing data then train
```

## Start the service

```bash
python app.py
# Runs on http://localhost:5001
```

## Endpoints

### `GET /health`
```json
{ "status": "ok", "model": "loaded", "classes": ["BEST_SELLER", "NORMAL", "RESTOCK", "UNDERPERFORMING"] }
```

### `POST /predict-product-performance`
```json
// Request
{ "productName": "Ciment Portland", "price": 45.0, "stock": 3, "orders": 28, "rating": 4.2 }

// Response
{
  "productName": "Ciment Portland",
  "label": "RESTOCK",
  "confidence": 0.94,
  "probabilities": { "BEST_SELLER": 0.03, "NORMAL": 0.02, "RESTOCK": 0.94, "UNDERPERFORMING": 0.01 },
  "recommendation": "Stock critique face à la demande. Réapprovisionnez immédiatement."
}
```

### `POST /predict-batch`
```json
// Request
{ "products": [ { "productName": "...", "price": 45, "stock": 3, "orders": 28, "rating": 4.2 } ] }

// Response
{ "results": [ { "productName": "...", "label": "RESTOCK", "confidence": 0.94, ... } ] }
```

### `POST /predict-duration`
```json
// Request
{
  "project_type": "house",
  "size_sqm": 150,
  "num_workers": 4,
  "complexity": 3
}

// Response
{
  "project_type": "house",
  "size_sqm": 150,
  "num_workers": 4,
  "complexity": 3,
  "estimated_duration_days": 45,
  "message": "Estimated project duration: 45 days"
}
```

### `POST /predict-pricing`
```json
// Request
{
  "project_type": "renovation",
  "surface_area": 80,
  "materials": "standard",
  "location": "urban",
  "complexity": 2
}

// Response
{
  "project_type": "renovation",
  "surface_area": 80,
  "materials": "standard",
  "location": "urban",
  "complexity": 2,
  "estimated_cost_euros": 85600,
  "message": "Estimated project cost: €85,600"
}
```

### `POST /predict-delay-risk`
```json
// Request
{
  "project_type": "house",
  "size_sqm": 150,
  "num_workers": 3,
  "location": "suburban",
  "materials": "standard",
  "complexity": 4,
  "budget_tnd": 50000,
  "requested_duration": 30,
  "artisan_experience": 2,
  "season": "winter"
}

// Response
{
  "project_type": "house",
  "delay_risk": "HIGH",
  "confidence": 0.85,
  "probabilities": {
    "LOW": 0.05,
    "MEDIUM": 0.10,
    "HIGH": 0.85
  },
  "risk_factors": [
    "Deadline too short for project size",
    "Limited artisan experience",
    "Weather conditions may cause delays"
  ],
  "recommendation": "Consider extending deadline, adding more workers, or simplifying scope",
  "message": "Delay risk assessment: HIGH (85.0% confidence)"
}
```

### `POST /predict-complete`
```json
// Request
{
  "project_type": "renovation",
  "size_sqm": 100,
  "complexity": 3,
  "materials": "standard",
  "location": "urban",
  "num_workers": 4,
  "budget_tnd": 60000,
  "requested_duration": 25,
  "artisan_experience": 5
}

// Response
{
  "project_summary": {
    "project_type": "renovation",
    "size_sqm": 100,
    "complexity": 3,
    "materials": "standard",
    "location": "urban"
  },
  "predictions": {
    "duration": {
      "estimated_days": 28,
      "message": "Estimated duration: 28 days"
    },
    "pricing": {
      "estimated_cost_tnd": 55000,
      "estimated_cost_eur": 16667,
      "message": "Estimated cost: 55,000 TND"
    },
    "delay_risk": {
      "risk_level": "MEDIUM",
      "confidence": 0.72,
      "message": "Delay risk: MEDIUM (72.0% confidence)"
    }
  },
  "message": "Complete project analysis completed successfully"
}
```

### `POST /retrain`
```json
// Request (optional)
{ "regen": true }   // regenerate training data before retraining

// Response
{ "status": "retrained", "classes": [...] }
```

## Environment variable

| Variable | Default | Description |
|---|---|---|
| `ML_PORT` | `5001` | Port the Flask service listens on |
