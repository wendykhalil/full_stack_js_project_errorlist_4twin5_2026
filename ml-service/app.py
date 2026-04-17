"""
app.py — Flask ML microservice for multiple predictions.

Endpoints:
  POST /predict-product-performance   — predict a single product
  POST /predict-batch                 — predict a list of products
  POST /predict-duration              — predict project duration
  POST /predict-pricing               — predict project cost
  GET  /health                        — liveness check
  POST /retrain                       — retrain on live supplier data (from Node.js)

Start:
  python app.py
"""

import json
import os
import traceback
from datetime import datetime, timezone

import joblib
import numpy as np
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

MODEL_PATH    = os.path.join(os.path.dirname(__file__), "model.joblib")
CLASSES_PATH  = os.path.join(os.path.dirname(__file__), "classes.json")
META_PATH     = os.path.join(os.path.dirname(__file__), "model_meta.json")

# New model paths
DURATION_MODEL_PATH = os.path.join(os.path.dirname(__file__), "duration_model.joblib")
PRICING_MODEL_PATH = os.path.join(os.path.dirname(__file__), "pricing_model.joblib")

# ── Load model at startup ─────────────────────────────────────────────────────

def load_model():
    if not os.path.exists(MODEL_PATH):
        print("[ML] model.joblib not found — training now …")
        from train import train
        train(regen=True)
    pipeline = joblib.load(MODEL_PATH)
    with open(CLASSES_PATH) as f:
        classes = json.load(f)
    print(f"[ML] Model loaded. Classes: {classes}")
    return pipeline, classes


pipeline, CLASSES = load_model()

# Load duration and pricing models
def load_duration_model():
    if not os.path.exists(DURATION_MODEL_PATH):
        print("[ML] duration_model.joblib not found — training now...")
        from train_duration import train_duration_model
        train_duration_model(regen=True)
    return joblib.load(DURATION_MODEL_PATH)

def load_pricing_model():
    if not os.path.exists(PRICING_MODEL_PATH):
        print("[ML] pricing_model.joblib not found — training now...")
        from train_pricing import train_pricing_model
        train_pricing_model(regen=True)
    return joblib.load(PRICING_MODEL_PATH)

duration_pipeline = load_duration_model()
pricing_pipeline = load_pricing_model()

# ── Recommendation messages ───────────────────────────────────────────────────

RECOMMENDATIONS = {
    "BEST_SELLER":      "Ce produit est très demandé. Maintenez le stock et envisagez d'augmenter le prix légèrement.",
    "RESTOCK":          "Stock critique face à la demande. Réapprovisionnez immédiatement pour éviter les ruptures.",
    "UNDERPERFORMING":  "Ce produit se vend peu. Envisagez une promotion, une meilleure description ou un retrait du catalogue.",
    "NORMAL":           "Performance stable. Surveillez les tendances et optimisez si nécessaire.",
}

# ── Labelling function (mirrors dataset.py) ───────────────────────────────────

def _auto_label(price, stock, orders, rating):
    if orders > 80 and rating > 4.0:
        return "BEST_SELLER"
    if stock < 10 and orders > 30:
        return "RESTOCK"
    if orders < 10:
        return "UNDERPERFORMING"
    return "NORMAL"

# ── Helpers ───────────────────────────────────────────────────────────────────

def _validate_duration_features(data: dict):
    """Validate duration prediction input."""
    errors, values = [], []
    
    # Project type mapping
    project_type_map = {'house': 0, 'renovation': 1, 'commercial': 2, 'landscaping': 3}
    
    project_type = data.get("project_type", "").lower()
    if project_type not in project_type_map:
        errors.append(f"project_type must be one of: {list(project_type_map.keys())}")
    else:
        values.append(project_type_map[project_type])
    
    for field in ("size_sqm", "num_workers"):
        raw = data.get(field)
        if raw is None:
            errors.append(f"Missing field: {field}")
            continue
        try:
            v = float(raw)
        except (TypeError, ValueError):
            errors.append(f"Field '{field}' must be numeric, got: {raw!r}")
            continue
        values.append(v)
    
    # Location mapping
    location_map = {'rural': 0, 'suburban': 1, 'urban': 2}
    location = data.get("location", "").lower()
    if location not in location_map:
        errors.append(f"location must be one of: {list(location_map.keys())}")
    else:
        values.append(location_map[location])
    
    # Materials mapping
    materials_map = {'basic': 0, 'standard': 1, 'premium': 2}
    materials = data.get("materials", "").lower()
    if materials not in materials_map:
        errors.append(f"materials must be one of: {list(materials_map.keys())}")
    else:
        values.append(materials_map[materials])
    
    # Complexity
    complexity = data.get("complexity")
    if complexity is None:
        errors.append("Missing field: complexity")
    else:
        try:
            complexity = float(complexity)
            values.append(complexity)
        except (TypeError, ValueError):
            errors.append(f"complexity must be numeric, got: {complexity!r}")
    
    if errors:
        return None, "; ".join(errors)
    
    project_type_encoded, size_sqm, num_workers, location_encoded, materials_encoded, complexity = values
    if size_sqm <= 0: errors.append("size_sqm must be > 0")
    if num_workers <= 0: errors.append("num_workers must be > 0")
    if not (1 <= complexity <= 5): errors.append("complexity must be between 1 and 5")
    
    if errors:
        return None, "; ".join(errors)
    
    return np.array([[project_type_encoded, size_sqm, num_workers, location_encoded, materials_encoded, complexity]], dtype=float), None

def _validate_pricing_features(data: dict):
    """Validate pricing prediction input."""
    errors, values = [], []
    
    # Mappings
    project_type_map = {'house': 0, 'renovation': 1, 'commercial': 2, 'landscaping': 3}
    materials_map = {'basic': 0, 'standard': 1, 'premium': 2}
    location_map = {'rural': 0, 'suburban': 1, 'urban': 2}
    
    project_type = data.get("project_type", "").lower()
    if project_type not in project_type_map:
        errors.append(f"project_type must be one of: {list(project_type_map.keys())}")
    else:
        values.append(project_type_map[project_type])
    
    surface_area = data.get("surface_area")
    if surface_area is None:
        errors.append("Missing field: surface_area")
    else:
        try:
            surface_area = float(surface_area)
            values.append(surface_area)
        except (TypeError, ValueError):
            errors.append(f"surface_area must be numeric, got: {surface_area!r}")
    
    materials = data.get("materials", "").lower()
    if materials not in materials_map:
        errors.append(f"materials must be one of: {list(materials_map.keys())}")
    else:
        values.append(materials_map[materials])
    
    location = data.get("location", "").lower()
    if location not in location_map:
        errors.append(f"location must be one of: {list(location_map.keys())}")
    else:
        values.append(location_map[location])
    
    complexity = data.get("complexity")
    if complexity is None:
        errors.append("Missing field: complexity")
    else:
        try:
            complexity = float(complexity)
            values.append(complexity)
        except (TypeError, ValueError):
            errors.append(f"complexity must be numeric, got: {complexity!r}")
    
    if errors:
        return None, "; ".join(errors)
    
    project_type_encoded, surface_area, materials_encoded, location_encoded, complexity = values
    if surface_area <= 0: errors.append("surface_area must be > 0")
    if not (1 <= complexity <= 5): errors.append("complexity must be between 1 and 5")
    
    if errors:
        return None, "; ".join(errors)
    
    return np.array([[project_type_encoded, surface_area, materials_encoded, location_encoded, complexity]], dtype=float), None

def _validate_features(data: dict):
    errors, values = [], []
    for field in ("price", "stock", "orders", "rating"):
        raw = data.get(field)
        if raw is None:
            errors.append(f"Missing field: {field}")
            continue
        try:
            v = float(raw)
        except (TypeError, ValueError):
            errors.append(f"Field '{field}' must be numeric, got: {raw!r}")
            continue
        values.append(v)

    if errors:
        return None, "; ".join(errors)

    price, stock, orders, rating = values
    if price < 0:    errors.append("price must be >= 0")
    if stock < 0:    errors.append("stock must be >= 0")
    if orders < 0:   errors.append("orders must be >= 0")
    if not (0 <= rating <= 5): errors.append("rating must be between 0 and 5")

    if errors:
        return None, "; ".join(errors)

    return np.array([[price, stock, orders, rating]], dtype=float), None


def _predict_one(features_array):
    label      = pipeline.predict(features_array)[0]
    proba      = pipeline.predict_proba(features_array)[0]
    confidence = float(round(proba.max(), 4))
    proba_dict = {cls: float(round(p, 4)) for cls, p in zip(CLASSES, proba)}
    recommendation = RECOMMENDATIONS.get(label, "Analysez ce produit manuellement.")
    return label, confidence, proba_dict, recommendation


def _save_meta(samples_used: int, accuracy: float):
    meta = {
        "lastTrainedAt": datetime.now(timezone.utc).isoformat(),
        "samplesUsed":   samples_used,
        "accuracy":      round(accuracy, 4),
    }
    with open(META_PATH, "w") as f:
        json.dump(meta, f)
    return meta


def _load_meta():
    if not os.path.exists(META_PATH):
        return None
    try:
        with open(META_PATH) as f:
            return json.load(f)
    except Exception:
        return None


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    meta = _load_meta()
    return jsonify({
        "status":  "ok",
        "model":   "loaded",
        "classes": CLASSES,
        "meta":    meta,
    })


@app.route("/predict-product-performance", methods=["POST"])
def predict_single():
    body = request.get_json(silent=True) or {}
    features, err = _validate_features(body)
    if err:
        return jsonify({"error": err}), 400
    try:
        label, confidence, proba_dict, recommendation = _predict_one(features)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

    return jsonify({
        "productName":    body.get("productName", ""),
        "label":          label,
        "confidence":     confidence,
        "probabilities":  proba_dict,
        "recommendation": recommendation,
    })


@app.route("/predict-batch", methods=["POST"])
def predict_batch():
    body     = request.get_json(silent=True) or {}
    products = body.get("products")

    if not isinstance(products, list) or len(products) == 0:
        return jsonify({"error": "Expected non-empty 'products' array"}), 400

    results = []
    for item in products:
        features, err = _validate_features(item)
        if err:
            results.append({"productName": item.get("productName", ""), "error": err})
            continue
        try:
            label, confidence, proba_dict, recommendation = _predict_one(features)
            results.append({
                "productName":    item.get("productName", ""),
                "productId":      item.get("productId", ""),
                "label":          label,
                "confidence":     confidence,
                "probabilities":  proba_dict,
                "recommendation": recommendation,
            })
        except Exception as e:
            results.append({"productName": item.get("productName", ""), "error": str(e)})

    return jsonify({"results": results})


@app.route("/retrain", methods=["POST"])
def retrain():
    """
    Retrain the model.

    Two modes:
      1. Live data mode (from Node.js):
         Body: { "products": [ { price, stock, orders, rating } ] }
         Labels are auto-generated using the same deterministic rules as dataset.py.
         If >= 20 live samples → merge with base dataset and retrain.

      2. Regen mode (dev/admin):
         Body: { "regen": true }
         Regenerates data.csv from scratch and retrains.
    """
    global pipeline, CLASSES

    body     = request.get_json(silent=True) or {}
    products = body.get("products")   # live supplier data
    regen    = bool(body.get("regen", False))

    try:
        # ── Path A: live product data from Node.js ────────────────────────────
        if isinstance(products, list) and len(products) >= 1:
            print(f"[ML /retrain] Received {len(products)} live product(s) from Node.js")

            live_rows = []
            for p in products:
                try:
                    price  = float(p.get("price",  0))
                    stock  = int(float(p.get("stock",  0)))
                    orders = int(float(p.get("orders", 0)))
                    rating = float(p.get("rating", 0))
                    label  = _auto_label(price, stock, orders, rating)
                    live_rows.append(dict(price=price, stock=stock, orders=orders, rating=rating, label=label))
                except (TypeError, ValueError):
                    continue  # skip malformed rows

            if not live_rows:
                return jsonify({"error": "No valid product rows after parsing"}), 400

            live_df = pd.DataFrame(live_rows)
            print(f"[ML /retrain] Live label distribution:\n{live_df['label'].value_counts().to_dict()}")

            # Load base dataset and merge (live data takes priority via concat)
            data_path = os.path.join(os.path.dirname(__file__), "data.csv")
            if os.path.exists(data_path):
                base_df = pd.read_csv(data_path)
                # Validate base dataset has required columns
                if not {"price", "stock", "orders", "rating", "label"}.issubset(base_df.columns):
                    from dataset import generate
                    base_df = generate()
                combined_df = pd.concat([base_df, live_df], ignore_index=True)
            else:
                # No base dataset — generate one and merge
                from dataset import generate
                base_df     = generate()
                combined_df = pd.concat([base_df, live_df], ignore_index=True)

            df = combined_df.sample(frac=1, random_state=42).reset_index(drop=True)
            print(f"[ML /retrain] Total training rows: {len(df)}")

        # ── Path B: regen mode ────────────────────────────────────────────────
        else:
            print("[ML /retrain] Regen mode — regenerating dataset …")
            from train import train
            pipeline = train(regen=True)
            with open(CLASSES_PATH) as f:
                CLASSES = json.load(f)
            meta = _save_meta(samples_used=0, accuracy=1.0)
            return jsonify({
                "status":       "ok",
                "message":      "Model retrained from generated dataset",
                "samples_used": meta["samplesUsed"],
                "accuracy":     meta["accuracy"],
                "lastTrainedAt": meta["lastTrainedAt"],
                "classes":      CLASSES,
            })

        # ── Train on combined df ──────────────────────────────────────────────
        X = df[["price", "stock", "orders", "rating"]].values
        y = df["label"].values

        # Need at least 2 samples per class for stratified split
        class_counts = pd.Series(y).value_counts()
        can_stratify = (class_counts >= 2).all()

        if len(df) >= 10 and can_stratify:
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.15, random_state=42, stratify=y
            )
        else:
            X_train, X_test, y_train, y_test = X, X, y, y  # tiny dataset — train=test

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

        y_pred   = new_pipeline.predict(X_test)
        accuracy = float(accuracy_score(y_test, y_pred))

        # Persist
        joblib.dump(new_pipeline, MODEL_PATH)
        new_classes = list(new_pipeline.classes_)
        with open(CLASSES_PATH, "w") as f:
            json.dump(new_classes, f)

        # Hot-swap in-process model
        pipeline = new_pipeline
        CLASSES  = new_classes

        meta = _save_meta(samples_used=len(df), accuracy=accuracy)

        print(f"[ML /retrain] ✅ Done. Accuracy={accuracy:.4f}  Classes={CLASSES}")

        return jsonify({
            "status":        "ok",
            "message":       "Model retrained successfully with live data",
            "samples_used":  len(df),
            "live_samples":  len(live_rows),
            "accuracy":      round(accuracy, 4),
            "lastTrainedAt": meta["lastTrainedAt"],
            "classes":       CLASSES,
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/predict-duration", methods=["POST"])
def predict_duration():
    """Predict project duration in days."""
    body = request.get_json(silent=True) or {}
    features, err = _validate_duration_features(body)
    if err:
        return jsonify({"error": err}), 400
    
    try:
        duration_days = duration_pipeline.predict(features)[0]
        duration_days = max(1, round(duration_days))  # minimum 1 day
        
        return jsonify({
            "project_type": body.get("project_type", ""),
            "size_sqm": body.get("size_sqm"),
            "num_workers": body.get("num_workers"),
            "location": body.get("location", ""),
            "materials": body.get("materials", ""),
            "complexity": body.get("complexity"),
            "estimated_duration_days": duration_days,
            "message": f"Estimated project duration: {duration_days} days"
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/predict-pricing", methods=["POST"])
def predict_pricing():
    """Predict project cost in euros."""
    body = request.get_json(silent=True) or {}
    features, err = _validate_pricing_features(body)
    if err:
        return jsonify({"error": err}), 400
    
    try:
        estimated_cost = pricing_pipeline.predict(features)[0]
        estimated_cost = max(1000, round(estimated_cost))  # minimum €1000
        
        return jsonify({
            "project_type": body.get("project_type", ""),
            "surface_area": body.get("surface_area"),
            "materials": body.get("materials", ""),
            "location": body.get("location", ""),
            "complexity": body.get("complexity"),
            "estimated_cost_euros": estimated_cost,
            "message": f"Estimated project cost: €{estimated_cost:,}"
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/meta", methods=["GET"])
def get_meta():
    """Return last training metadata."""
    meta = _load_meta()
    if not meta:
        return jsonify({"meta": None})
    return jsonify({"meta": meta})


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.environ.get("ML_PORT", 5001))
    print(f"[ML] Starting on port {port}")
    app.run(host="0.0.0.0", port=port, debug=False)

