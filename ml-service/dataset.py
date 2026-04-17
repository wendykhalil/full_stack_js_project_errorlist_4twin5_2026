"""
dataset.py — Generates a training dataset for product performance classification.

Labels:
  BEST_SELLER     — high orders, good rating, healthy stock
  RESTOCK         — high demand but critically low stock
  UNDERPERFORMING — low orders, poor rating or excess stock
  NORMAL          — everything else

Run standalone:
  python dataset.py
"""

import numpy as np
import pandas as pd

SEED = 42
rng  = np.random.default_rng(SEED)

N_PER_CLASS = 350   # samples per class → 1400 total, perfectly balanced


# ── Deterministic labelling rules ────────────────────────────────────────────

def _label(price, stock, orders, rating):
    """
    Priority order matters — first match wins.
    Rules are intentionally clear-cut so the RF has clean signal.
    """
    if orders > 80 and rating > 4.0:
        return "BEST_SELLER"
    if stock < 10 and orders > 30:
        return "RESTOCK"
    if orders < 10:
        return "UNDERPERFORMING"
    return "NORMAL"


# ── Per-class generators ──────────────────────────────────────────────────────

def _gen_best_seller(n):
    """High orders (>80), high rating (>4), moderate-to-high stock."""
    rows = []
    for _ in range(n):
        price  = round(float(rng.uniform(10, 400)), 2)
        stock  = int(rng.integers(15, 120))
        orders = int(rng.integers(81, 200))
        rating = round(float(rng.uniform(4.01, 5.0)), 1)
        rows.append(dict(price=price, stock=stock, orders=orders, rating=rating, label="BEST_SELLER"))
    return rows


def _gen_restock(n):
    """Low stock (<10), high orders (>30) — demand outstrips supply."""
    rows = []
    for _ in range(n):
        price  = round(float(rng.uniform(5, 500)), 2)
        stock  = int(rng.integers(0, 10))
        orders = int(rng.integers(31, 150))
        rating = round(float(rng.uniform(2.0, 5.0)), 1)
        rows.append(dict(price=price, stock=stock, orders=orders, rating=rating, label="RESTOCK"))
    return rows


def _gen_underperforming(n):
    """Low orders (<10) — slow movers."""
    rows = []
    for _ in range(n):
        price  = round(float(rng.uniform(5, 500)), 2)
        stock  = int(rng.integers(0, 120))
        orders = int(rng.integers(0, 10))
        rating = round(float(rng.uniform(1.0, 5.0)), 1)
        rows.append(dict(price=price, stock=stock, orders=orders, rating=rating, label="UNDERPERFORMING"))
    return rows


def _gen_normal(n):
    """Moderate orders (10-80), varied stock and rating."""
    rows = []
    for _ in range(n):
        price  = round(float(rng.uniform(5, 500)), 2)
        stock  = int(rng.integers(10, 120))
        orders = int(rng.integers(10, 81))
        rating = round(float(rng.uniform(1.0, 5.0)), 1)
        rows.append(dict(price=price, stock=stock, orders=orders, rating=rating, label="NORMAL"))
    return rows


# ── Public API ────────────────────────────────────────────────────────────────

def generate(n_per_class=N_PER_CLASS):
    """
    Build a perfectly balanced dataset by generating each class separately.
    This guarantees the 'label' column is always present and balanced.
    """
    rows = (
        _gen_best_seller(n_per_class)
        + _gen_restock(n_per_class)
        + _gen_underperforming(n_per_class)
        + _gen_normal(n_per_class)
    )

    df = pd.DataFrame(rows)

    # Shuffle so classes are interleaved
    df = df.sample(frac=1, random_state=SEED).reset_index(drop=True)

    # Explicit column order
    df = df[["price", "stock", "orders", "rating", "label"]]

    return df


# ── Standalone entry point ────────────────────────────────────────────────────

if __name__ == "__main__":
    df = generate()
    df.to_csv("data.csv", index=False)

    print(f"\n✅ Generated {len(df)} rows → data.csv")
    print(f"\nColumns : {list(df.columns)}")
    print(f"\nClass distribution:\n{df['label'].value_counts()}")
    print(f"\nSample rows:\n{df.head(8).to_string(index=False)}")
