#!/usr/bin/env python3
"""
scan_encoding.py — Deep scan for ALL remaining encoding/text issues.
Finds mojibake, truncated words, broken UI strings, and suspicious patterns.
"""

import os
import re

DIRS = ["frontend/src", "backend/src"]
EXTS = {".jsx", ".js", ".ts", ".tsx"}

# ── 1. Mojibake sequences (double-encoded UTF-8) ──────────────────────────────
MOJIBAKE = [
    "\u00c3\u00a9", "\u00c3\u00a8", "\u00c3\u00aa", "\u00c3\u00ab",
    "\u00c3\u00a0", "\u00c3\u00a2", "\u00c3\u00a4", "\u00c3\u00ae",
    "\u00c3\u00af", "\u00c3\u00b4", "\u00c3\u00b6", "\u00c3\u00b9",
    "\u00c3\u00bb", "\u00c3\u00bc", "\u00c3\u00a7", "\u00c3\u00b1",
    "\u00c3\u0089", "\u00c3\u0087", "\u00c3\u0080", "\u00c3\u0082",
    "\u00c3\u008b", "\u00c3\u008e", "\u00c3\u0099", "\u00c3\u009b",
    "\u00e2\u0080\u0099", "\u00e2\u0080\u0098", "\u00e2\u0080\u009c",
    "\u00e2\u0080\u009d", "\u00e2\u0080\u00a6", "\u00e2\u0080\u0093",
    "\u00e2\u0080\u0094", "\u00e2\u0080\u00a2", "\u00e2\u0082\u00ac",
    "\u00c2\u00ab", "\u00c2\u00bb", "\u00c2\u00b0", "\u00c2\u00b7",
    "\u00c2\u00a0", "\u00c2\u00a9", "\u00c2\u00ae",
]

# ── 2. Truncated / garbage UI strings ─────────────────────────────────────────
# These are partial words that suggest a string was cut off mid-encoding
TRUNCATED_PATTERNS = [
    r"\bPr\u00e9\b",          # Pré (truncated Prénom, Prédictions, etc.)
    r"\bMes r\u00e9\b",       # Mes ré (truncated)
    r"\bDerni\u00e8re\b",     # Dernière (check if context is ok)
    r"[A-Za-z]\u00c3$",       # word ending with Ã (cut off)
    r"\u00c3[^\u00a0-\u00bf]",# Ã followed by non-continuation byte
]

# ── 3. Raw Latin-1 bytes that snuck through (file not valid UTF-8) ────────────
def has_raw_latin1(raw_bytes):
    """Check if file has raw Latin-1 high bytes (not valid UTF-8 sequences)."""
    try:
        raw_bytes.decode("utf-8")
        return False
    except UnicodeDecodeError:
        return True


results = {}

for d in DIRS:
    if not os.path.exists(d):
        continue
    for root, dirs, files in os.walk(d):
        dirs[:] = [x for x in dirs if x != "node_modules"]
        for fname in files:
            if not any(fname.endswith(e) for e in EXTS):
                continue
            path = os.path.join(root, fname)
            issues = []

            raw = open(path, "rb").read()

            # Check for raw Latin-1 bytes
            if has_raw_latin1(raw):
                issues.append("RAW_LATIN1_BYTES")
                text = raw.decode("latin-1")
            else:
                text = raw.decode("utf-8")

            # Check mojibake
            found_moji = [m for m in MOJIBAKE if m in text]
            if found_moji:
                issues.append(f"MOJIBAKE({len(found_moji)} types)")
                # Show samples
                for m in found_moji[:3]:
                    idx = text.find(m)
                    ctx = text[max(0, idx-25):idx+len(m)+25].replace("\n", " ")
                    issues.append(f"  sample: {repr(ctx)}")

            # Check truncated patterns
            for pat in TRUNCATED_PATTERNS:
                matches = list(re.finditer(pat, text))
                if matches:
                    m = matches[0]
                    ctx = text[max(0, m.start()-20):m.end()+20].replace("\n", " ")
                    issues.append(f"TRUNCATED: {repr(ctx)}")

            if issues:
                results[path] = issues

print(f"\n{'='*65}")
print(f"SCAN RESULTS — {len(results)} files with issues")
print(f"{'='*65}\n")

if not results:
    print("  ALL CLEAN — no encoding or text issues found.\n")
else:
    for path, issues in sorted(results.items()):
        print(f"FILE: {path}")
        for issue in issues:
            print(f"  {issue}")
        print()
