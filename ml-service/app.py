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

from fraud_detection import FraudDetectionEngine

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize fraud detection engine
fraud_engine = FraudDetectionEngine()

MODEL_PATH    = os.path.join(os.path.dirname(__file__), "model.joblib")
CLASSES_PATH  = os.path.join(os.path.dirname(__file__), "classes.json")
META_PATH     = os.path.join(os.path.dirname(__file__), "model_meta.json")

# New model paths
DURATION_MODEL_PATH = os.path.join(os.path.dirname(__file__), "duration_model.joblib")
PRICING_MODEL_PATH = os.path.join(os.path.dirname(__file__), "pricing_model.joblib")
DELAY_MODEL_PATH = os.path.join(os.path.dirname(__file__), "delay_model.joblib")

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

def load_delay_model():
    if not os.path.exists(DELAY_MODEL_PATH):
        print("[ML] delay_model.joblib not found — using fallback delay risk assessment")
        return None  # Return None to indicate fallback mode
    try:
        return joblib.load(DELAY_MODEL_PATH)
    except Exception as e:
        print(f"[ML] Error loading delay model: {e} — using fallback")
        return None

duration_pipeline = load_duration_model()
pricing_pipeline = load_pricing_model()
delay_pipeline = load_delay_model()  # Can be None

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
    
    # Mappings - must match the order used in training: project_type_encoded, surface_area, materials_encoded, location_encoded, complexity
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
    
    # Return features in the exact order expected by the model: [project_type_encoded, surface_area, materials_encoded, location_encoded, complexity]
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

def _validate_delay_features(data: dict):
    """Validate delay risk prediction input."""
    errors, values = [], []
    
    # Mappings
    project_type_map = {'house': 0, 'renovation': 1, 'commercial': 2, 'landscaping': 3}
    location_map = {'rural': 0, 'suburban': 1, 'urban': 2}
    materials_map = {'basic': 0, 'standard': 1, 'premium': 2}
    season_map = {'winter': 0, 'spring': 1, 'summer': 2, 'autumn': 3}
    
    # Project type
    project_type = data.get("project_type", "").lower()
    if project_type not in project_type_map:
        errors.append(f"project_type must be one of: {list(project_type_map.keys())}")
    else:
        values.append(project_type_map[project_type])
    
    # Numeric fields
    for field in ("size_sqm", "num_workers", "budget_tnd", "requested_duration", "artisan_experience"):
        raw = data.get(field)
        if raw is None:
            errors.append(f"Missing field: {field}")
            continue
        try:
            v = float(raw)
            values.append(v)
        except (TypeError, ValueError):
            errors.append(f"Field '{field}' must be numeric, got: {raw!r}")
            continue
    
    # Location
    location = data.get("location", "").lower()
    if location not in location_map:
        errors.append(f"location must be one of: {list(location_map.keys())}")
    else:
        values.append(location_map[location])
    
    # Materials
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
    
    # Season (optional, default to summer)
    season = data.get("season", "summer").lower()
    if season not in season_map:
        season = "summer"  # default
    values.append(season_map[season])
    
    # Weather risk (optional, calculated from season)
    weather_risk = 0.8 if season == "winter" else 0.3 if season == "autumn" else 0.1
    values.append(weather_risk)
    
    if errors:
        return None, "; ".join(errors)
    
    # Validate ranges
    project_type_encoded, size_sqm, num_workers, budget_tnd, requested_duration, artisan_experience, location_encoded, materials_encoded, complexity, season_encoded, weather_risk = values
    
    if size_sqm <= 0: errors.append("size_sqm must be > 0")
    if num_workers <= 0: errors.append("num_workers must be > 0")
    if budget_tnd <= 0: errors.append("budget_tnd must be > 0")
    if requested_duration <= 0: errors.append("requested_duration must be > 0")
    if artisan_experience < 0: errors.append("artisan_experience must be >= 0")
    if not (1 <= complexity <= 5): errors.append("complexity must be between 1 and 5")
    
    if errors:
        return None, "; ".join(errors)
    
    # Return features in the exact order expected by the model
    return np.array([[
        project_type_encoded, size_sqm, num_workers, location_encoded, 
        materials_encoded, complexity, budget_tnd, requested_duration, 
        artisan_experience, season_encoded, weather_risk
    ]], dtype=float), None


def _fallback_delay_risk_assessment(data: dict):
    """Enhanced delay risk assessment with improved accuracy and more factors."""
    
    # Extract key parameters
    requested_duration = float(data.get("requested_duration", 30))
    size_sqm = float(data.get("size_sqm", 100))
    complexity = float(data.get("complexity", 3))
    artisan_experience = float(data.get("artisan_experience", 3))
    num_workers = int(data.get("num_workers", 3))
    season = data.get("season", "summer")
    budget_tnd = float(data.get("budget_tnd", 50000))
    project_type = data.get("project_type", "house")
    location = data.get("location", "suburban")
    materials = data.get("materials", "standard")
    
    # Enhanced realistic duration calculation with project-specific factors
    import math
    
    # Base duration calculation per project type (days per sqm)
    base_rates = {
        'house': 0.35,      # New construction is complex
        'renovation': 0.25,  # Renovation can be faster but unpredictable
        'commercial': 0.45,  # Commercial projects are more complex
        'landscaping': 0.15  # Outdoor work is generally faster
    }
    
    base_duration = size_sqm * base_rates.get(project_type, 0.3)
    
    # Complexity multiplier (non-linear scaling)
    complexity_multiplier = 0.6 + (complexity ** 1.5) / 10
    base_duration *= complexity_multiplier
    
    # Materials impact on duration
    material_factors = {
        'basic': 0.85,     # Basic materials are faster to work with
        'standard': 1.0,   # Standard baseline
        'premium': 1.25    # Premium materials need more care/time
    }
    base_duration *= material_factors.get(materials, 1.0)
    
    # Location impact (logistics, access, regulations)
    location_factors = {
        'rural': 1.15,     # Harder access, fewer suppliers
        'suburban': 1.0,   # Baseline
        'urban': 0.95      # Better access but more regulations
    }
    base_duration *= location_factors.get(location, 1.0)
    
    # Team size efficiency (with diminishing returns and coordination overhead)
    if num_workers <= 2:
        team_efficiency = 1.0
    elif num_workers <= 4:
        team_efficiency = 0.75  # Good team size
    elif num_workers <= 6:
        team_efficiency = 0.65  # Still efficient
    else:
        team_efficiency = 0.7   # Coordination overhead kicks in
    
    base_duration *= team_efficiency
    
    # Experience factor (exponential improvement with experience)
    experience_factor = max(0.6, 1.3 - (artisan_experience ** 0.7) / 8)
    base_duration *= experience_factor
    
    # Seasonal adjustments
    seasonal_factors = {
        'winter': 1.2,   # Weather delays, shorter days
        'autumn': 1.1,   # Some weather issues
        'spring': 0.95,  # Good working conditions
        'summer': 1.0    # Baseline but can be hot
    }
    base_duration *= seasonal_factors.get(season, 1.0)
    
    realistic_duration = max(3, int(base_duration))
    
    # Advanced risk scoring with weighted factors
    risk_score = 0
    risk_factors = []
    confidence_adjustments = []
    
    # 1. Timeline Pressure Analysis (35% weight)
    timeline_ratio = requested_duration / realistic_duration
    if timeline_ratio < 0.6:
        risk_score += 0.45
        risk_factors.append("Extremely tight deadline - project needs 67% more time")
        confidence_adjustments.append(0.15)
    elif timeline_ratio < 0.75:
        risk_score += 0.35
        risk_factors.append("Very tight deadline - project needs 33% more time")
        confidence_adjustments.append(0.1)
    elif timeline_ratio < 0.9:
        risk_score += 0.2
        risk_factors.append("Tight deadline - limited buffer for issues")
        confidence_adjustments.append(0.05)
    elif timeline_ratio > 1.5:
        risk_score -= 0.1  # Generous timeline reduces risk
        confidence_adjustments.append(0.05)
    
    # 2. Experience & Skill Analysis (25% weight)
    if artisan_experience < 1:
        risk_score += 0.3
        risk_factors.append("Novice artisan - high learning curve risk")
        confidence_adjustments.append(0.1)
    elif artisan_experience < 2:
        risk_score += 0.2
        risk_factors.append("Limited experience - may face unexpected challenges")
        confidence_adjustments.append(0.05)
    elif artisan_experience < 5:
        risk_score += 0.1
        risk_factors.append("Moderate experience - some risk of delays")
    elif artisan_experience > 10:
        risk_score -= 0.05  # Very experienced reduces risk
        confidence_adjustments.append(0.05)
    
    # 3. Project Complexity Analysis (20% weight)
    if complexity >= 4.5:
        risk_score += 0.25
        risk_factors.append("Very high complexity - many potential complications")
        confidence_adjustments.append(0.1)
    elif complexity >= 3.5:
        risk_score += 0.15
        risk_factors.append("High complexity - requires careful planning")
        confidence_adjustments.append(0.05)
    elif complexity <= 1.5:
        risk_score -= 0.05  # Simple projects have lower risk
    
    # 4. Resource & Team Analysis (15% weight)
    optimal_team_size = max(2, min(6, int(size_sqm / 50)))  # Rough optimal team calculation
    team_size_ratio = num_workers / optimal_team_size
    
    if team_size_ratio < 0.6:
        risk_score += 0.2
        risk_factors.append("Understaffed team - workload may cause delays")
        confidence_adjustments.append(0.05)
    elif team_size_ratio > 2:
        risk_score += 0.1
        risk_factors.append("Oversized team - coordination challenges possible")
    
    # 5. Environmental & External Factors (15% weight)
    if season == "winter":
        risk_score += 0.15
        risk_factors.append("Winter season - weather delays likely")
        confidence_adjustments.append(0.05)
    elif season == "autumn":
        risk_score += 0.08
        risk_factors.append("Autumn season - some weather risk")
    
    if location == "rural":
        risk_score += 0.08
        risk_factors.append("Rural location - supply chain and access challenges")
    
    # 6. Budget Pressure Analysis (10% weight)
    # Enhanced cost estimation based on Tunisian market rates
    cost_per_sqm_base = {
        'house': 400,        # TND per sqm for house construction
        'renovation': 250,   # TND per sqm for renovation
        'commercial': 500,   # TND per sqm for commercial
        'landscaping': 150   # TND per sqm for landscaping
    }
    
    base_cost = size_sqm * cost_per_sqm_base.get(project_type, 350)
    
    # Adjust for complexity and materials
    complexity_cost_multiplier = 0.7 + (complexity / 5) * 0.8
    material_cost_multipliers = {'basic': 0.8, 'standard': 1.0, 'premium': 1.4}
    
    estimated_cost = base_cost * complexity_cost_multiplier * material_cost_multipliers.get(materials, 1.0)
    
    budget_ratio = budget_tnd / estimated_cost
    
    if budget_ratio < 0.7:
        risk_score += 0.2
        risk_factors.append("Severely underfunded - quality/speed compromises likely")
        confidence_adjustments.append(0.1)
    elif budget_ratio < 0.85:
        risk_score += 0.12
        risk_factors.append("Tight budget - may affect material quality or workforce")
        confidence_adjustments.append(0.05)
    elif budget_ratio < 0.95:
        risk_score += 0.05
        risk_factors.append("Limited budget buffer - little room for cost overruns")
    
    # 7. Project Type Specific Risks
    type_specific_risks = {
        'renovation': 0.1,   # Hidden issues often discovered
        'commercial': 0.08,  # More regulations and inspections
        'house': 0.05,      # Generally predictable
        'landscaping': 0.03  # Weather dependent but simpler
    }
    risk_score += type_specific_risks.get(project_type, 0.05)
    
    if project_type == 'renovation':
        risk_factors.append("Renovation project - hidden issues may be discovered")
    elif project_type == 'commercial':
        risk_factors.append("Commercial project - additional regulations and inspections")
    
    # 8. Size-based risk adjustments
    if size_sqm > 300:
        risk_score += 0.08
        risk_factors.append("Large project - coordination and logistics complexity")
    elif size_sqm < 50:
        risk_score += 0.05
        risk_factors.append("Small project - efficiency challenges")
    
    # Normalize risk score
    risk_score = max(0, min(1, risk_score))
    
    # Determine risk level with improved thresholds
    if risk_score > 0.65:
        delay_risk = "HIGH"
        base_confidence = 0.82
    elif risk_score > 0.4:
        delay_risk = "MEDIUM"
        base_confidence = 0.78
    else:
        delay_risk = "LOW"
        base_confidence = 0.75
    
    # Adjust confidence based on data quality and risk factors
    confidence_adjustment = sum(confidence_adjustments) / len(confidence_adjustments) if confidence_adjustments else 0
    final_confidence = min(0.95, base_confidence + confidence_adjustment)
    
    # Create more nuanced probability distribution
    if delay_risk == "HIGH":
        probabilities = {
            "LOW": max(0.05, 0.15 - risk_score * 0.1),
            "MEDIUM": max(0.15, 0.35 - risk_score * 0.2),
            "HIGH": min(0.8, 0.5 + risk_score * 0.3)
        }
    elif delay_risk == "MEDIUM":
        probabilities = {
            "LOW": max(0.1, 0.4 - risk_score * 0.3),
            "MEDIUM": min(0.7, 0.4 + risk_score * 0.3),
            "HIGH": max(0.1, risk_score * 0.4)
        }
    else:
        probabilities = {
            "LOW": min(0.8, 0.6 + (1 - risk_score) * 0.2),
            "MEDIUM": max(0.15, risk_score * 0.5),
            "HIGH": max(0.05, risk_score * 0.2)
        }
    
    # Normalize probabilities to sum to 1
    total_prob = sum(probabilities.values())
    probabilities = {k: round(v / total_prob, 3) for k, v in probabilities.items()}
    
    # Add insights about the realistic timeline
    if realistic_duration != requested_duration:
        if realistic_duration > requested_duration:
            days_diff = realistic_duration - requested_duration
            risk_factors.append(f"Realistic timeline: {realistic_duration} days (+{days_diff} days needed)")
        else:
            days_diff = requested_duration - realistic_duration
            risk_factors.append(f"Timeline has {days_diff} days buffer - good planning")
    
    return delay_risk, final_confidence, probabilities, risk_factors


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
    Retrain the product-performance classifier.

    Three modes (checked in priority order):

      1. MongoDB mode  — default / { "mongo": true }
         Connects to the real MongoDB Atlas cluster, reads the `products` and
         `orders` collections, builds a labelled dataset from live business data,
         and retrains the model entirely from real data.
         This is the PRIMARY mode and the one called by the "Retrain AI" button.

      2. Live-products mode  — { "products": [ { price, stock, orders, rating } ] }
         Backward-compatible path kept for Node.js clients that send pre-fetched
         product arrays. Labels are auto-generated and the live rows are merged
         with the base synthetic dataset before retraining.

      3. Regen mode  — { "regen": true }
         Regenerates data.csv from scratch and retrains on synthetic data only.
         Useful for development / resetting the model.
    """
    global pipeline, CLASSES

    body    = request.get_json(silent=True) or {}
    regen   = bool(body.get("regen",   False))
    use_mongo = bool(body.get("mongo", True))   # default: MongoDB mode
    products  = body.get("products")            # optional pre-fetched array

    try:
        # ── Path A: MongoDB mode (PRIMARY — real data) ────────────────────────
        if use_mongo and not regen and not isinstance(products, list):
            print("[ML /retrain] ── MongoDB mode: training from real data ──")
            from train_from_mongo import train_from_mongo

            result = train_from_mongo()

            # Hot-swap the in-process model without restarting Flask
            pipeline = joblib.load(MODEL_PATH)
            with open(CLASSES_PATH) as f:
                CLASSES = json.load(f)

            print(
                f"[ML /retrain] ✅ Model hot-swapped. "
                f"Products={result['products_used']}  "
                f"Accuracy={result['accuracy']:.4f}  "
                f"Classes={CLASSES}"
            )

            return jsonify({
                "status":             "ok",
                "message":            result["message"],
                "training_source":    "mongodb",
                "products_used":      result["products_used"],
                "orders_processed":   result["orders_processed"],
                "class_distribution": result["class_distribution"],
                "samples_used":       result["samples_used"],
                "accuracy":           result["accuracy"],
                "lastTrainedAt":      result["lastTrainedAt"],
                "classes":            CLASSES,
                "augmented":          result.get("augmented", False),
            })

        # ── Path B: live product data from Node.js (backward compat) ─────────
        if isinstance(products, list) and len(products) >= 1:
            print(f"[ML /retrain] ── Live-products mode: {len(products)} product(s) from Node.js ──")

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
                    continue

            if not live_rows:
                return jsonify({"error": "No valid product rows after parsing"}), 400

            live_df = pd.DataFrame(live_rows)
            print(f"[ML /retrain] Live label distribution: {live_df['label'].value_counts().to_dict()}")

            # Merge with base synthetic dataset
            data_path = os.path.join(os.path.dirname(__file__), "data.csv")
            if os.path.exists(data_path):
                base_df = pd.read_csv(data_path)
                if not {"price", "stock", "orders", "rating", "label"}.issubset(base_df.columns):
                    from dataset import generate
                    base_df = generate()
                combined_df = pd.concat([base_df, live_df], ignore_index=True)
            else:
                from dataset import generate
                base_df     = generate()
                combined_df = pd.concat([base_df, live_df], ignore_index=True)

            df = combined_df.sample(frac=1, random_state=42).reset_index(drop=True)
            print(f"[ML /retrain] Total training rows (live + synthetic): {len(df)}")

        # ── Path C: regen mode (synthetic CSV only) ───────────────────────────
        else:
            print("[ML /retrain] ── Regen mode: regenerating synthetic dataset ──")
            from train import train
            pipeline = train(regen=True)
            with open(CLASSES_PATH) as f:
                CLASSES = json.load(f)
            meta = _save_meta(samples_used=0, accuracy=1.0)
            return jsonify({
                "status":          "ok",
                "message":         "Model retrained from generated synthetic dataset",
                "training_source": "synthetic_csv",
                "samples_used":    meta["samplesUsed"],
                "accuracy":        meta["accuracy"],
                "lastTrainedAt":   meta["lastTrainedAt"],
                "classes":         CLASSES,
            })

        # ── Shared training block (Path B only reaches here) ─────────────────
        X = df[["price", "stock", "orders", "rating"]].values
        y = df["label"].values

        class_counts = pd.Series(y).value_counts()
        can_stratify = (class_counts >= 2).all()

        if len(df) >= 10 and can_stratify:
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.15, random_state=42, stratify=y
            )
        else:
            X_train, X_test, y_train, y_test = X, X, y, y

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
            "status":          "ok",
            "message":         "Model retrained with live product data (merged with synthetic)",
            "training_source": "live_products_merged",
            "samples_used":    len(df),
            "live_samples":    len(live_rows),
            "accuracy":        round(accuracy, 4),
            "lastTrainedAt":   meta["lastTrainedAt"],
            "classes":         CLASSES,
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


@app.route("/predict-delay-risk", methods=["POST"])
def predict_delay_risk():
    """Predict project delay risk."""
    body = request.get_json(silent=True) or {}
    features, err = _validate_delay_features(body)
    if err:
        return jsonify({"error": err}), 400
    
    try:
        # Use ML model if available, otherwise use fallback
        if delay_pipeline is not None:
            delay_risk = delay_pipeline.predict(features)[0]
            delay_proba = delay_pipeline.predict_proba(features)[0]
            
            # Get class probabilities
            classes = delay_pipeline.classes_
            proba_dict = {cls: float(round(p, 3)) for cls, p in zip(classes, delay_proba)}
            confidence = float(round(delay_proba.max(), 3))
            
            # Generate risk explanation using ML model results
            risk_factors = []
            
            # Analyze key risk factors from input
            requested_duration = body.get("requested_duration", 0)
            budget_tnd = body.get("budget_tnd", 0)
            size_sqm = body.get("size_sqm", 0)
            artisan_experience = body.get("artisan_experience", 0)
            complexity = body.get("complexity", 1)
            num_workers = body.get("num_workers", 1)
            
            # Estimate realistic duration for comparison
            estimated_realistic = size_sqm * 0.3 * (complexity / 3.0)
            if requested_duration < estimated_realistic * 0.8:
                risk_factors.append("Deadline too short for project size")
            
            if artisan_experience < 2:
                risk_factors.append("Limited artisan experience")
            
            if complexity > 4:
                risk_factors.append("High project complexity")
            
            if num_workers < 2:
                risk_factors.append("Small team size")
            
            season = body.get("season", "summer")
            if season in ["winter", "autumn"]:
                risk_factors.append("Weather conditions may cause delays")
        else:
            # Use fallback assessment
            delay_risk, confidence, proba_dict, risk_factors = _fallback_delay_risk_assessment(body)
        
        # Generate recommendation
        recommendations = {
            "HIGH": "Consider extending deadline, adding more workers, or simplifying scope",
            "MEDIUM": "Monitor progress closely and have contingency plans ready", 
            "LOW": "Project timeline appears realistic with current parameters"
        }
        
        return jsonify({
            "project_type": body.get("project_type", ""),
            "size_sqm": body.get("size_sqm"),
            "num_workers": body.get("num_workers"),
            "budget_tnd": body.get("budget_tnd"),
            "requested_duration": body.get("requested_duration"),
            "artisan_experience": body.get("artisan_experience"),
            "complexity": body.get("complexity"),
            "delay_risk": delay_risk,
            "confidence": confidence,
            "probabilities": proba_dict,
            "risk_factors": risk_factors,
            "recommendation": recommendations.get(delay_risk, "Monitor project progress"),
            "message": f"Delay risk assessment: {delay_risk} ({confidence*100:.1f}% confidence)"
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/predict-complete", methods=["POST"])
def predict_complete():
    """Complete project prediction: duration, cost, and delay risk."""
    body = request.get_json(silent=True) or {}
    
    try:
        # Validate common fields
        project_type = body.get("project_type", "").lower()
        size_sqm = body.get("size_sqm")
        complexity = body.get("complexity")
        materials = body.get("materials", "").lower()
        location = body.get("location", "").lower()
        
        if not all([project_type, size_sqm, complexity, materials, location]):
            return jsonify({"error": "Missing required fields: project_type, size_sqm, complexity, materials, location"}), 400
        
        results = {}
        
        # Duration prediction
        duration_data = {
            "project_type": project_type,
            "size_sqm": size_sqm,
            "num_workers": body.get("num_workers", 3),
            "location": location,
            "materials": materials,
            "complexity": complexity
        }
        duration_features, err = _validate_duration_features(duration_data)
        if not err:
            duration_days = duration_pipeline.predict(duration_features)[0]
            results["duration"] = {
                "estimated_days": max(1, round(duration_days)),
                "message": f"Estimated duration: {max(1, round(duration_days))} days"
            }
        
        # Pricing prediction
        pricing_data = {
            "project_type": project_type,
            "surface_area": size_sqm,
            "materials": materials,
            "location": location,
            "complexity": complexity
        }
        pricing_features, err = _validate_pricing_features(pricing_data)
        if not err:
            estimated_cost = pricing_pipeline.predict(pricing_features)[0]
            results["pricing"] = {
                "estimated_cost_tnd": max(1000, round(estimated_cost * 3.3)),  # Convert EUR to TND
                "estimated_cost_eur": max(1000, round(estimated_cost)),
                "message": f"Estimated cost: {max(1000, round(estimated_cost * 3.3)):,} TND"
            }
        
        # Delay risk prediction
        delay_data = {
            "project_type": project_type,
            "size_sqm": size_sqm,
            "num_workers": body.get("num_workers", 3),
            "location": location,
            "materials": materials,
            "complexity": complexity,
            "budget_tnd": body.get("budget_tnd", results.get("pricing", {}).get("estimated_cost_tnd", 50000)),
            "requested_duration": body.get("requested_duration", results.get("duration", {}).get("estimated_days", 30)),
            "artisan_experience": body.get("artisan_experience", 3),
            "season": body.get("season", "summer")
        }
        delay_features, err = _validate_delay_features(delay_data)
        if not err:
            delay_risk = delay_pipeline.predict(delay_features)[0]
            delay_proba = delay_pipeline.predict_proba(delay_features)[0]
            confidence = float(round(delay_proba.max(), 3))
            
            results["delay_risk"] = {
                "risk_level": delay_risk,
                "confidence": confidence,
                "message": f"Delay risk: {delay_risk} ({confidence*100:.1f}% confidence)"
            }
        
        return jsonify({
            "project_summary": {
                "project_type": project_type,
                "size_sqm": size_sqm,
                "complexity": complexity,
                "materials": materials,
                "location": location
            },
            "predictions": results,
            "message": "Complete project analysis completed successfully"
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


@app.route("/detect-fraud-artisan", methods=["POST"])
def detect_fraud_artisan():
    """Detect potentially fake artisan profiles."""
    body = request.get_json(silent=True) or {}
    
    try:
        result = fraud_engine.detect_fake_artisan(body)
        return jsonify({
            "artisan_id": body.get("artisan_id", ""),
            "fraud_analysis": result,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/detect-fraud-project", methods=["POST"])
def detect_fraud_project():
    """Detect spam or fake project postings."""
    body = request.get_json(silent=True) or {}
    
    try:
        result = fraud_engine.detect_spam_project(body)
        return jsonify({
            "project_id": body.get("project_id", ""),
            "fraud_analysis": result,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/detect-fraud-pricing", methods=["POST"])
def detect_fraud_pricing():
    """Detect unrealistic or manipulated pricing."""
    body = request.get_json(silent=True) or {}
    
    try:
        result = fraud_engine.detect_price_manipulation(body)
        return jsonify({
            "quote_id": body.get("quote_id", ""),
            "fraud_analysis": result,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/detect-fraud-behavior", methods=["POST"])
def detect_fraud_behavior():
    """Detect suspicious user behavior patterns."""
    body = request.get_json(silent=True) or {}
    
    try:
        result = fraud_engine.detect_suspicious_behavior(body)
        return jsonify({
            "user_id": body.get("user_id", ""),
            "fraud_analysis": result,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/fraud-batch-scan", methods=["POST"])
def fraud_batch_scan():
    """Batch fraud detection for multiple entities."""
    body = request.get_json(silent=True) or {}
    scan_type = body.get("scan_type")  # 'artisans', 'projects', 'pricing', 'behavior'
    entities = body.get("entities", [])
    
    if not scan_type or not entities:
        return jsonify({"error": "Missing scan_type or entities"}), 400
    
    try:
        results = []
        
        for entity in entities:
            if scan_type == "artisans":
                fraud_result = fraud_engine.detect_fake_artisan(entity)
            elif scan_type == "projects":
                fraud_result = fraud_engine.detect_spam_project(entity)
            elif scan_type == "pricing":
                fraud_result = fraud_engine.detect_price_manipulation(entity)
            elif scan_type == "behavior":
                fraud_result = fraud_engine.detect_suspicious_behavior(entity)
            else:
                fraud_result = {"error": f"Unknown scan_type: {scan_type}"}
            
            results.append({
                "entity_id": entity.get("id", ""),
                "fraud_analysis": fraud_result
            })
        
        # Summary statistics
        fraud_levels = [r["fraud_analysis"].get("fraud_level", "UNKNOWN") for r in results if "fraud_analysis" in r]
        summary = {
            "total_scanned": len(results),
            "high_risk": fraud_levels.count("HIGH"),
            "medium_risk": fraud_levels.count("MEDIUM"),
            "low_risk": fraud_levels.count("LOW"),
            "scan_type": scan_type,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        return jsonify({
            "summary": summary,
            "results": results
        })
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.environ.get("ML_PORT", 5001))
    print(f"[ML] Starting on port {port}")
    print(f"[ML] Fraud Detection Engine initialized")
    app.run(host="0.0.0.0", port=port, debug=False)


# ── Fraud Detection Routes ────────────────────────────────────────────────────

@app.route("/detect-fraud-artisan", methods=["POST"])
def detect_fraud_artisan():
    """Detect fraud in artisan profiles using ML analysis."""
    try:
        data = request.get_json(silent=True) or {}
        
        # Use the fraud detection engine
        result = fraud_engine.detect_artisan_fraud(data)
        
        return jsonify({
            "fraud_analysis": result,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/detect-fraud-project", methods=["POST"])
def detect_fraud_project():
    """Detect fraud in project listings using ML analysis."""
    try:
        data = request.get_json(silent=True) or {}
        
        # Use the fraud detection engine
        result = fraud_engine.detect_project_fraud(data)
        
        return jsonify({
            "fraud_analysis": result,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/fraud-batch-scan", methods=["POST"])
def fraud_batch_scan():
    """Perform batch fraud detection on multiple entities."""
    try:
        data = request.get_json(silent=True) or {}
        scan_type = data.get("scan_type")
        entities = data.get("entities", [])
        
        if not scan_type or not entities:
            return jsonify({"error": "Missing scan_type or entities"}), 400
        
        results = []
        
        if scan_type == "artisans":
            for artisan in entities:
                fraud_result = fraud_engine.detect_artisan_fraud(artisan)
                results.append({
                    "entity_id": artisan.get("id"),
                    "entity_type": "ARTISAN",
                    "name": f"{artisan.get('firstName', '')} {artisan.get('lastName', '')}".strip(),
                    "fraud_analysis": fraud_result
                })
        elif scan_type == "projects":
            for project in entities:
                fraud_result = fraud_engine.detect_project_fraud(project)
                results.append({
                    "entity_id": project.get("id"),
                    "entity_type": "PROJECT",
                    "title": project.get("title", ""),
                    "fraud_analysis": fraud_result
                })
        
        # Calculate summary statistics
        high_risk_count = len([r for r in results if r["fraud_analysis"]["risk_level"] == "HIGH"])
        medium_risk_count = len([r for r in results if r["fraud_analysis"]["risk_level"] == "MEDIUM"])
        low_risk_count = len([r for r in results if r["fraud_analysis"]["risk_level"] == "LOW"])
        
        return jsonify({
            "scan_type": scan_type,
            "total_scanned": len(results),
            "summary": {
                "high_risk": high_risk_count,
                "medium_risk": medium_risk_count,
                "low_risk": low_risk_count,
                "fraud_rate": round((high_risk_count / max(len(results), 1)) * 100, 1)
            },
            "results": results,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# ── Smart Analytics Routes ─────────────────────────────────────────────────────

@app.route("/smart-analytics", methods=["POST"])
def smart_analytics():
    """Generate comprehensive smart analytics for admin dashboard."""
    try:
        from smart_analytics import SmartAnalyticsEngine
        
        data = request.get_json(silent=True) or {}
        projects_data = data.get("projects", [])
        artisans_data = data.get("artisans", [])
        reviews_data = data.get("reviews", [])
        period_days = data.get("period_days", 30)
        
        analytics_engine = SmartAnalyticsEngine()
        
        # Generate comprehensive analytics
        demand_analysis = analytics_engine.analyze_service_demand(projects_data, period_days)
        pricing_analysis = analytics_engine.analyze_pricing_trends(projects_data)
        performance_analysis = analytics_engine.analyze_artisan_performance(artisans_data, projects_data, reviews_data)
        
        return jsonify({
            "demand_analysis": demand_analysis,
            "pricing_analysis": pricing_analysis,
            "performance_analysis": performance_analysis,
            "period_days": period_days,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/demand-forecast", methods=["POST"])
def demand_forecast():
    """Generate service demand forecasts."""
    try:
        from smart_analytics import SmartAnalyticsEngine
        
        data = request.get_json(silent=True) or {}
        projects_data = data.get("projects", [])
        service_filter = data.get("service_filter")
        forecast_days = data.get("forecast_days", 30)
        
        analytics_engine = SmartAnalyticsEngine()
        result = analytics_engine.analyze_service_demand(projects_data, forecast_days)
        
        # Filter by service if specified
        if service_filter:
            result["demand_trends"] = [
                trend for trend in result["demand_trends"] 
                if trend["service"] == service_filter
            ]
        
        return jsonify(result)
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/pricing-trends", methods=["POST"])
def pricing_trends():
    """Analyze pricing trends across services and regions."""
    try:
        from smart_analytics import SmartAnalyticsEngine
        
        data = request.get_json(silent=True) or {}
        projects_data = data.get("projects", [])
        
        analytics_engine = SmartAnalyticsEngine()
        result = analytics_engine.analyze_pricing_trends(projects_data)
        
        return jsonify(result)
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/artisan-clustering", methods=["POST"])
def artisan_clustering():
    """Perform artisan performance clustering analysis."""
    try:
        from smart_analytics import SmartAnalyticsEngine
        
        data = request.get_json(silent=True) or {}
        artisans_data = data.get("artisans", [])
        artisan_profiles = data.get("artisan_profiles", [])
        projects_data = data.get("projects", [])
        reviews_data = data.get("reviews", [])
        
        analytics_engine = SmartAnalyticsEngine()
        result = analytics_engine.analyze_artisan_performance(artisans_data, projects_data, reviews_data)
        
        return jsonify(result)
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/regional-analysis", methods=["POST"])
def regional_analysis():
    """Analyze regional market performance and trends."""
    try:
        from smart_analytics import SmartAnalyticsEngine
        
        data = request.get_json(silent=True) or {}
        projects_data = data.get("projects", [])
        artisan_profiles = data.get("artisan_profiles", [])
        
        analytics_engine = SmartAnalyticsEngine()
        
        # Create a simplified regional analysis
        regional_stats = {}
        tunisian_regions = [
            'Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Nabeul', 'Zaghouan',
            'Bizerte', 'Béja', 'Jendouba', 'Kef', 'Siliana', 'Kairouan',
            'Kasserine', 'Sidi Bouzid', 'Sousse', 'Monastir', 'Mahdia',
            'Sfax', 'Gafsa', 'Tozeur', 'Kebili', 'Gabès', 'Medenine', 'Tataouine'
        ]
        
        for region in tunisian_regions:
            region_projects = [p for p in projects_data if region.lower() in str(p.get('region', '')).lower()]
            region_artisans = [a for a in artisan_profiles if region.lower() in str(a.get('region', '')).lower()]
            
            if region_projects or region_artisans:
                avg_budget = sum(p.get('budgetTND', 0) for p in region_projects) / max(len(region_projects), 1)
                
                regional_stats[region] = {
                    "total_projects": len(region_projects),
                    "total_artisans": len(region_artisans),
                    "avg_project_budget": round(avg_budget, 0),
                    "market_activity": "HIGH" if len(region_projects) > 10 else "MEDIUM" if len(region_projects) > 3 else "LOW"
                }
        
        return jsonify({
            "regional_stats": regional_stats,
            "top_regions": sorted(regional_stats.items(), key=lambda x: x[1]["total_projects"], reverse=True)[:10],
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/market-insights", methods=["POST"])
def market_insights():
    """Generate market insights and predictions."""
    try:
        from smart_analytics import SmartAnalyticsEngine
        
        data = request.get_json(silent=True) or {}
        projects_data = data.get("projects", [])
        artisans_data = data.get("artisans", [])
        timeframe = data.get("timeframe", "monthly")
        
        analytics_engine = SmartAnalyticsEngine()
        
        # Generate market insights
        total_projects = len(projects_data)
        total_artisans = len(artisans_data)
        
        # Calculate growth trends (simplified)
        current_month_projects = len([p for p in projects_data if 
            datetime.fromisoformat(p['createdAt'].replace('Z', '+00:00')).month == datetime.now().month])
        
        # Market insights
        insights = {
            "market_size": {
                "total_projects": total_projects,
                "total_artisans": total_artisans,
                "monthly_projects": current_month_projects,
                "market_growth": "GROWING" if current_month_projects > total_projects * 0.1 else "STABLE"
            },
            "top_services": [],
            "price_trends": {},
            "predictions": {
                "next_month_demand": round(current_month_projects * 1.1, 0),
                "growth_rate": "8-12%",
                "hot_services": ["Plombier", "Électricien", "Peintre"]
            }
        }
        
        # Calculate top services
        service_counts = {}
        for project in projects_data:
            service = project.get('category', 'Autre')
            service_counts[service] = service_counts.get(service, 0) + 1
        
        insights["top_services"] = sorted(service_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        
        return jsonify({
            "market_insights": insights,
            "timeframe": timeframe,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500