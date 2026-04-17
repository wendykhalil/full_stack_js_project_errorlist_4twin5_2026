# ML Service — Multi-Model Prediction Service

A Flask microservice with three ML models:

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
