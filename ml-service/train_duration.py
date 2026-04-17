"""
train_duration.py — Train project duration prediction model.

Usage:
  python train_duration.py              # use duration_data.csv (auto-generate if missing)
  python train_duration.py --regen      # force-regenerate duration_data.csv then train

Outputs:
  duration_model.joblib   — trained sklearn Pipeline (StandardScaler + RandomForest)
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
FEATURES = ["project_type_encoded", "size_sqm", "num_workers", "location_encoded", "materials_encoded", "complexity"]
TARGET = "duration_days"
MODEL_PATH = os.path.join(os.path.dirname(__file__), "duration_model.joblib")
DATA_PATH = os.path.join(os.path.dirname(__file__), "duration_data.csv")

def _regenerate():
    """Generate fresh duration_data.csv and return DataFrame."""
    print("[train_duration] Generating dataset...")
    from duration_dataset import generate_duration_data
    df = generate_duration_data()
    df.to_csv(DATA_PATH, index=False)
    print(f"[train_duration] ✅ {len(df)} rows written to duration_data.csv")
    return df

def load_or_generate_data(regen=False):
    """Load duration_data.csv or generate if missing/invalid."""
    if regen:
        return _regenerate()
    
    if not os.path.exists(DATA_PATH):
        print("[train_duration] duration_data.csv not found — generating...")
        return _regenerate()
    
    try:
        df = pd.read_csv(DATA_PATH)
        print(f"[train_duration] Loaded {len(df)} rows from duration_data.csv")
        
        # Validate required columns
        required_cols = set(FEATURES + [TARGET])
        if not required_cols.issubset(df.columns):
            print(f"[train_duration] Missing columns — regenerating...")
            return _regenerate()
        
        return df
    except Exception as e:
        print(f"[train_duration] Error reading file ({e}) — regenerating...")
        return _regenerate()

def train_duration_model(regen=False):
    """Train the duration prediction model."""
    df = load_or_generate_data(regen)
    
    X = df[FEATURES].values
    y = df[TARGET].values
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    print(f"[train_duration] Training on {len(X_train)} samples...")
    
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
    
    print(f"[train_duration] MAE: {mae:.2f} days")
    print(f"[train_duration] R²: {r2:.3f}")
    
    # Save model
    joblib.dump(pipeline, MODEL_PATH)
    print(f"[train_duration] ✅ Model saved to {MODEL_PATH}")
    
    return pipeline

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train duration prediction model")
    parser.add_argument("--regen", action="store_true", help="Force-regenerate data")
    args = parser.parse_args()
    train_duration_model(regen=args.regen)