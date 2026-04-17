"""
train_pricing.py — Train project pricing prediction model.

Usage:
  python train_pricing.py              # use pricing_data.csv (auto-generate if missing)
  python train_pricing.py --regen      # force-regenerate pricing_data.csv then train

Outputs:
  pricing_model.joblib   — trained sklearn Pipeline (StandardScaler + RandomForest)
"""

import argparse
import os
import joblib
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

# Constants
FEATURES = ["project_type_encoded", "surface_area", "materials_encoded", "location_encoded", "complexity"]
TARGET = "estimated_cost"
MODEL_PATH = os.path.join(os.path.dirname(__file__), "pricing_model.joblib")
DATA_PATH = os.path.join(os.path.dirname(__file__), "pricing_data.csv")

def _regenerate():
    """Generate fresh pricing_data.csv and return DataFrame."""
    print("[train_pricing] Generating dataset...")
    from pricing_dataset import generate_pricing_data
    df = generate_pricing_data()
    df.to_csv(DATA_PATH, index=False)
    print(f"[train_pricing] ✅ {len(df)} rows written to pricing_data.csv")
    return df

def load_or_generate_data(regen=False):
    """Load pricing_data.csv or generate if missing/invalid."""
    if regen:
        return _regenerate()
    
    if not os.path.exists(DATA_PATH):
        print("[train_pricing] pricing_data.csv not found — generating...")
        return _regenerate()
    
    try:
        df = pd.read_csv(DATA_PATH)
        print(f"[train_pricing] Loaded {len(df)} rows from pricing_data.csv")
        
        # Validate required columns
        required_cols = set(FEATURES + [TARGET])
        if not required_cols.issubset(df.columns):
            print(f"[train_pricing] Missing columns — regenerating...")
            return _regenerate()
        
        return df
    except Exception as e:
        print(f"[train_pricing] Error reading file ({e}) — regenerating...")
        return _regenerate()

def train_pricing_model(regen=False):
    """Train the pricing prediction model."""
    df = load_or_generate_data(regen)
    
    X = df[FEATURES].values
    y = df[TARGET].values
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    print(f"[train_pricing] Training on {len(X_train)} samples...")
    
    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("regressor", RandomForestRegressor(
            n_estimators=200,
            max_depth=15,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        ))
    ])
    
    pipeline.fit(X_train, y_train)
    
    # Evaluate
    y_pred = pipeline.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    print(f"[train_pricing] MAE: €{mae:,.0f}")
    print(f"[train_pricing] R²: {r2:.3f}")
    
    # Save model
    joblib.dump(pipeline, MODEL_PATH)
    print(f"[train_pricing] ✅ Model saved to {MODEL_PATH}")
    
    return pipeline

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train pricing prediction model")
    parser.add_argument("--regen", action="store_true", help="Force-regenerate data")
    args = parser.parse_args()
    train_pricing_model(regen=args.regen)