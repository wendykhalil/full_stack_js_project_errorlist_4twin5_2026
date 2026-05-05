"""
train_from_mongo.py — Train the product-performance classifier using REAL MongoDB data.

Connects directly to the same MongoDB Atlas cluster used by the Node.js backend.
Reads the `products` and `orders` collections, builds a labelled dataset from live
business data, trains a RandomForestClassifier pipeline, and overwrites model.joblib
+ classes.json in-place.

Usage (standalone):
    python train_from_mongo.py

Called programmatically from app.py /retrain endpoint:
    from train_from_mongo import train_from_mongo
    result = train_from_mongo()

Environment variable (optional — falls back to the hard-coded Atlas URI):
    MONGO_URI=mongodb+srv://...
"""

import json
import os
import sys
from datetime import datetime, timezone

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

# ── pymongo import (added to requirements.txt) ────────────────────────────────
try:
    from pymongo import MongoClient
    from bson import ObjectId
except ImportError as exc:
    raise ImportError(
        "pymongo is required for MongoDB training. "
        "Run: pip install pymongo"
    ) from exc

# ── Paths ─────────────────────────────────────────────────────────────────────
_DIR         = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH   = os.path.join(_DIR, "model.joblib")
CLASSES_PATH = os.path.join(_DIR, "classes.json")
META_PATH    = os.path.join(_DIR, "model_meta.json")

# ── MongoDB connection ────────────────────────────────────────────────────────
# Priority: MONGO_URI env var → hard-coded Atlas URI from backend/.env
_DEFAULT_MONGO_URI = (
    "mongodb+srv://aminegraja589_db_user:Pibmp123"
    "@cluster0.t0u8mth.mongodb.net/bmp?appName=Cluster0"
)
MONGO_URI = os.environ.get("MONGO_URI", _DEFAULT_MONGO_URI)
DB_NAME   = "bmp"          # database name in the Atlas URI


# ── Business labelling logic ──────────────────────────────────────────────────
# These thresholds are intentionally stricter than the synthetic dataset rules
# so that the model learns from real purchase behaviour.

def _label(orders_count: int, stock: int, rating: float) -> str:
    """
    Assign a performance label based on REAL order counts and stock levels.

    Priority order (first match wins):
      BEST_SELLER   — orders_count > 100  AND  rating >= 4.0
      RESTOCK       — stock < 10          AND  orders_count > 30
      UNDERPERFORMING — orders_count < 10
      NORMAL        — everything else
    """
    if orders_count > 100 and rating >= 4.0:
        return "BEST_SELLER"
    if stock < 10 and orders_count > 30:
        return "RESTOCK"
    if orders_count < 10:
        return "UNDERPERFORMING"
    return "NORMAL"


# ── MongoDB data extraction ───────────────────────────────────────────────────

def _fetch_dataset(client: MongoClient) -> pd.DataFrame:
    """
    Build a training DataFrame by joining products + orders from MongoDB.

    Returns a DataFrame with columns:
        price, stock, orders_count, rating, label
    """
    db = client[DB_NAME]

    # ── 1. Aggregate orders: sum quantity per productId ───────────────────────
    print("[train_from_mongo] Aggregating orders collection …")
    pipeline_agg = [
        {
            "$group": {
                "_id":          "$productId",
                "orders_count": {"$sum": "$quantity"},   # sum quantity field
            }
        }
    ]
    order_cursor = db["orders"].aggregate(pipeline_agg)
    order_map: dict[str, int] = {}
    total_orders_processed = 0
    for doc in order_cursor:
        pid = str(doc["_id"])
        qty = int(doc.get("orders_count", 0))
        order_map[pid] = qty
        total_orders_processed += qty

    print(
        f"[train_from_mongo] Orders aggregated: "
        f"{len(order_map)} distinct products, "
        f"{total_orders_processed} total units ordered"
    )

    # ── 2. Fetch all products ─────────────────────────────────────────────────
    print("[train_from_mongo] Fetching products collection …")
    product_cursor = db["products"].find(
        {},  # all products (approved and pending — we want full picture)
        {
            "_id":    1,
            "price":  1,
            "stock":  1,
            "rating": 1,
            "name":   1,
        }
    )

    rows = []
    skipped = 0
    for doc in product_cursor:
        pid = str(doc["_id"])
        try:
            price  = float(doc.get("price",  0) or 0)
            stock  = int(float(doc.get("stock",  0) or 0))
            rating = float(doc.get("rating", 0) or 0)
        except (TypeError, ValueError):
            skipped += 1
            continue

        # Clamp rating to [0, 5]
        rating = max(0.0, min(5.0, rating))

        orders_count = order_map.get(pid, 0)

        label = _label(orders_count, stock, rating)

        rows.append({
            "price":        price,
            "stock":        stock,
            "orders":       orders_count,   # feature name kept as "orders" to match model
            "rating":       rating,
            "label":        label,
            # metadata (not used for training)
            "_product_id":  pid,
            "_name":        doc.get("name", ""),
        })

    if skipped:
        print(f"[train_from_mongo] ⚠  Skipped {skipped} products with invalid numeric fields")

    df = pd.DataFrame(rows)
    return df


# ── Training ──────────────────────────────────────────────────────────────────

def train_from_mongo(min_samples: int = 5) -> dict:
    """
    Connect to MongoDB, build a real dataset, train the classifier, and
    overwrite model.joblib + classes.json.

    Args:
        min_samples: minimum number of products required to proceed with
                     MongoDB-only training. If fewer products exist, the
                     function falls back to augmenting with synthetic data.

    Returns:
        dict with keys: status, message, products_used, orders_processed,
                        class_distribution, accuracy, classes, lastTrainedAt
    """
    print(f"\n{'='*60}")
    print("[train_from_mongo] Starting MongoDB-driven training …")
    print(f"[train_from_mongo] Connecting to: {MONGO_URI[:50]}…")

    # ── Connect ───────────────────────────────────────────────────────────────
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=10_000)
        client.admin.command("ping")   # verify connection
        print("[train_from_mongo] ✅ MongoDB connection established")
    except Exception as exc:
        raise ConnectionError(
            f"[train_from_mongo] ❌ Cannot connect to MongoDB: {exc}"
        ) from exc

    try:
        df = _fetch_dataset(client)
    finally:
        client.close()

    n_products = len(df)
    print(f"\n[train_from_mongo] Products fetched: {n_products}")

    if n_products == 0:
        raise ValueError(
            "[train_from_mongo] No products found in MongoDB. "
            "Make sure the 'products' collection is not empty."
        )

    # ── Log class distribution ────────────────────────────────────────────────
    class_dist = df["label"].value_counts().to_dict()
    print(f"[train_from_mongo] Class distribution (real data):")
    for lbl, cnt in sorted(class_dist.items()):
        pct = cnt / n_products * 100
        print(f"  {lbl:<20} {cnt:>4} samples  ({pct:.1f}%)")

    # ── Augment with synthetic data if real dataset is too small ──────────────
    augmented = False
    if n_products < min_samples:
        print(
            f"\n[train_from_mongo] ⚠  Only {n_products} real products — "
            f"augmenting with synthetic data (min_samples={min_samples})"
        )
        from dataset import generate
        synth_df = generate()
        # Keep only the 5 shared columns
        synth_df = synth_df[["price", "stock", "orders", "rating", "label"]]
        real_df  = df[["price", "stock", "orders", "rating", "label"]]
        df       = pd.concat([real_df, synth_df], ignore_index=True).sample(
            frac=1, random_state=42
        ).reset_index(drop=True)
        augmented = True
        print(f"[train_from_mongo] Combined dataset: {len(df)} rows (real + synthetic)")
    else:
        df = df[["price", "stock", "orders", "rating", "label"]]

    # ── Features / target ─────────────────────────────────────────────────────
    FEATURES = ["price", "stock", "orders", "rating"]
    X = df[FEATURES].values
    y = df["label"].values

    # ── Train / test split ────────────────────────────────────────────────────
    class_counts = pd.Series(y).value_counts()
    can_stratify = (class_counts >= 2).all() and len(df) >= 10

    if can_stratify:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.20, random_state=42, stratify=y
        )
    else:
        # Too few samples for a proper split — train on everything
        X_train, X_test, y_train, y_test = X, X, y, y
        print("[train_from_mongo] ⚠  Dataset too small for stratified split — using full set for train & test")

    print(
        f"\n[train_from_mongo] Training on {len(X_train)} samples, "
        f"testing on {len(X_test)} samples …"
    )

    # ── Build and fit pipeline ────────────────────────────────────────────────
    new_pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("clf", RandomForestClassifier(
            n_estimators=200,
            max_depth=12,
            min_samples_leaf=2,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1,
        )),
    ])
    new_pipeline.fit(X_train, y_train)

    # ── Evaluate ──────────────────────────────────────────────────────────────
    y_pred   = new_pipeline.predict(X_test)
    accuracy = float(accuracy_score(y_test, y_pred))

    print(f"\n[train_from_mongo] ── Classification Report ──────────────────")
    print(classification_report(y_test, y_pred, zero_division=0))
    print(f"[train_from_mongo] Accuracy: {accuracy:.4f}")

    # ── Persist model ─────────────────────────────────────────────────────────
    joblib.dump(new_pipeline, MODEL_PATH)
    new_classes = list(new_pipeline.classes_)
    with open(CLASSES_PATH, "w") as f:
        json.dump(new_classes, f)

    # ── Save metadata ─────────────────────────────────────────────────────────
    now_iso = datetime.now(timezone.utc).isoformat()
    meta = {
        "lastTrainedAt":    now_iso,
        "samplesUsed":      len(df),
        "accuracy":         round(accuracy, 4),
        "trainingSource":   "mongodb",
        "productsFromDB":   n_products,
        "augmented":        augmented,
        "classDistribution": class_dist,
    }
    with open(META_PATH, "w") as f:
        json.dump(meta, f, indent=2)

    print(f"\n[train_from_mongo] ✅ model.joblib saved  → {MODEL_PATH}")
    print(f"[train_from_mongo] ✅ classes.json saved  → {CLASSES_PATH}")
    print(f"[train_from_mongo] ✅ model_meta.json saved → {META_PATH}")
    print(f"{'='*60}\n")

    return {
        "status":             "ok",
        "message":            "Model retrained from real MongoDB data",
        "products_used":      n_products,
        "orders_processed":   int(df["orders"].sum()),
        "class_distribution": class_dist,
        "accuracy":           round(accuracy, 4),
        "classes":            new_classes,
        "lastTrainedAt":      now_iso,
        "augmented":          augmented,
        "samples_used":       len(df),   # kept for backward-compat with Node.js client
    }


# ── Standalone entry point ────────────────────────────────────────────────────

if __name__ == "__main__":
    try:
        result = train_from_mongo()
        print("Training complete:")
        for k, v in result.items():
            print(f"  {k}: {v}")
        sys.exit(0)
    except Exception as exc:
        print(f"\n❌ Training failed: {exc}", file=sys.stderr)
        sys.exit(1)
