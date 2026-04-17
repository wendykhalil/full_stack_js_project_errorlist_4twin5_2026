"""
train.py — Trains a RandomForestClassifier on product performance data.

Usage:
  python train.py              # use data.csv (auto-generate if missing or invalid)
  python train.py --regen      # force-regenerate data.csv then train

Outputs:
  model.joblib   — trained sklearn Pipeline (StandardScaler + RandomForest)
  classes.json   — ordered class label list
"""

import argparse
import json
import os

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

# ── Constants ─────────────────────────────────────────────────────────────────

FEATURES     = ["price", "stock", "orders", "rating"]
TARGET       = "label"
MODEL_PATH   = os.path.join(os.path.dirname(__file__), "model.joblib")
CLASSES_PATH = os.path.join(os.path.dirname(__file__), "classes.json")
DATA_PATH    = os.path.join(os.path.dirname(__file__), "data.csv")

REQUIRED_COLUMNS = set(FEATURES + [TARGET])


# ── Data loading ──────────────────────────────────────────────────────────────

def _regenerate():
    """Generate a fresh data.csv and return the DataFrame."""
    print("[train] Generating dataset …")
    from dataset import generate
    df = generate()
    df.to_csv(DATA_PATH, index=False)
    print(f"[train] ✅ {len(df)} rows written to data.csv")
    return df


def load_or_generate_data(regen=False):
    """
    Load data.csv if it exists and is valid.
    Auto-regenerates if:
      - regen=True
      - file does not exist
      - file is missing required columns (e.g. 'label')
      - file has fewer than 100 rows
    """
    if regen:
        return _regenerate()

    if not os.path.exists(DATA_PATH):
        print("[train] data.csv not found — generating …")
        return _regenerate()

    try:
        df = pd.read_csv(DATA_PATH)
    except Exception as e:
        print(f"[train] ⚠️  Could not read data.csv ({e}) — regenerating …")
        return _regenerate()

    # ── Debug: always show what we loaded ────────────────────────────────────
    print(f"\n[train] Loaded data.csv — {len(df)} rows")
    print(f"[train] Columns : {list(df.columns)}")
    print(f"[train] Head:\n{df.head(5).to_string(index=False)}\n")

    # ── Validate ──────────────────────────────────────────────────────────────
    missing_cols = REQUIRED_COLUMNS - set(df.columns)
    if missing_cols:
        print(f"[train] ⚠️  Missing columns {missing_cols} — regenerating …")
        return _regenerate()

    if len(df) < 100:
        print(f"[train] ⚠️  Only {len(df)} rows — regenerating …")
        return _regenerate()

    if df[TARGET].isnull().any():
        print("[train] ⚠️  NaN values in 'label' column — regenerating …")
        return _regenerate()

    print(f"[train] Class distribution:\n{df[TARGET].value_counts()}\n")
    return df


# ── Training ──────────────────────────────────────────────────────────────────

def train(regen=False):
    df = load_or_generate_data(regen)

    X = df[FEATURES].values
    y = df[TARGET].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    print(f"[train] Training on {len(X_train)} samples, testing on {len(X_test)} …")

    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("clf", RandomForestClassifier(
            n_estimators=200,
            max_depth=12,
            min_samples_leaf=3,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1,
        )),
    ])

    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    print("\n── Classification Report ──────────────────────────────────────")
    print(classification_report(y_test, y_pred))

    # ── Persist ───────────────────────────────────────────────────────────────
    joblib.dump(pipeline, MODEL_PATH)
    classes = list(pipeline.classes_)
    with open(CLASSES_PATH, "w") as f:
        json.dump(classes, f)

    print(f"[train] ✅ Model saved  → {MODEL_PATH}")
    print(f"[train] ✅ Classes saved → {CLASSES_PATH}  {classes}")
    return pipeline


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train product performance classifier")
    parser.add_argument(
        "--regen",
        action="store_true",
        help="Force-regenerate data.csv before training",
    )
    args = parser.parse_args()
    train(regen=args.regen)
