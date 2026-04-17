# ML Service — Product Performance Classifier

A Flask microservice that uses a **RandomForestClassifier** (scikit-learn) to classify supplier products into:

| Label | Meaning |
|---|---|
| `BEST_SELLER` | High demand, good rating, healthy stock |
| `RESTOCK` | High demand but critically low stock |
| `UNDERPERFORMING` | Low orders, poor rating |
| `NORMAL` | Stable, no action needed |

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

## Train the model

```bash
python train.py          # uses existing data.csv or generates it
python train.py --regen  # force-regenerate data.csv then train
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
