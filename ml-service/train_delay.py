"""
train_delay.py — Train project delay risk prediction model.

Usage:
  python train_delay.py              # use delay_data.csv (auto-generate if missing)
  python train_delay.py --regen      # force-regenerate delay_data.csv then train

Outputs:
  delay_model.joblib   — trained sklearn Pipeline (StandardScaler + RandomForest)
"""

import argparse
import os
import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

# Constants
FEATURES = [
    "project_type_encoded", "size_sqm", "num_workers", "location_encoded", 
    "materials_encoded", "complexity", "budget_tnd", "requested_duration", 
    "artisan_experience", "season_encoded", "weather_risk"
]
TARGET = "delay_risk"  # HIGH, MEDIUM, LOW
MODEL_PATH = os.path.join(os.path.dirname(__file__), "delay_model.joblib")
DATA_PATH = os.path.join(os.path.dirname(__file__), "delay_data.csv")

def _regenerate():
    """Generate fresh delay_data.csv and return DataFrame."""
    print("[train_delay] Generating dataset...")
    from delay_dataset import generate_delay_data
    df = generate_delay_data()
    df.to_csv(DATA_PATH, index=False)
    print(f"[train_delay] ✅ {len(df)} rows written to delay_data.csv")
    return df

def load_or_generate_data(regen=False):
    """Load delay_data.csv or generate if missing/invalid."""
    if regen:
        return _regenerate()
    
    if not os.path.exists(DATA_PATH):
        print("[train_delay] delay_data.csv not found — generating...")
        return _regenerate()
    
    try:
        df = pd.read_csv(DATA_PATH)
        print(f"[train_delay] Loaded {len(df)} rows from delay_data.csv")
        
        # Validate required columns
        required_cols = set(FEATURES + [TARGET])
        if not required_cols.issubset(df.columns):
            print(f"[train_delay] Missing columns — regenerating...")
            return _regenerate()
        
        return df
    except Exception as e:
        print(f"[train_delay] Error reading file ({e}) — regenerating...")
        return _regenerate()

def train_delay_model(regen=False):
    """Train the delay risk prediction model."""
    df = load_or_generate_data(regen)
    
    X = df[FEATURES].values
    y = df[TARGET].values
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"[train_delay] Training on {len(X_train)} samples...")
    
    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("classifier", RandomForestClassifier(
            n_estimators=200,
            max_depth=15,
            min_samples_leaf=2,
            class_weight='balanced',
            random_state=42,
            n_jobs=-1
        ))
    ])
    
    pipeline.fit(X_train, y_train)
    
    # Evaluate
    y_pred = pipeline.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    print(f"[train_delay] Accuracy: {accuracy:.3f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    
    # Save model
    joblib.dump(pipeline, MODEL_PATH)
    print(f"[train_delay] ✅ Model saved to {MODEL_PATH}")
    
    return pipeline

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train delay risk prediction model")
    parser.add_argument("--regen", action="store_true", help="Force-regenerate data")
    args = parser.parse_args()
    train_delay_model(regen=args.regen)