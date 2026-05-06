#!/usr/bin/env python3
"""Analyze the exact corruption pattern in flagged files."""
import os, re

files = [
    'frontend/src/pages/AdminAiInsights.jsx',
    'frontend/src/pages/AdminArtisanDashboard.jsx',
    'frontend/src/pages/AdminPromoCodes.jsx',
    'frontend/src/pages/AdminReports.jsx',
    'frontend/src/pages/ArtisanCart.jsx',
    'frontend/src/pages/ArtisanProfileEdit.jsx',
    'frontend/src/pages/FournisseurProduitEdit.jsx',
    'frontend/src/pages/MLPredictions.jsx',
    'backend/src/modules/orders/orders.service.js',
]

# Windows-1252 byte -> Unicode codepoint mapping for 0x80-0x9F range
WIN1252_MAP = {
    0x80: 0x20AC, 0x82: 0x201A, 0x83: 0x0192, 0x84: 0x201E,
    0x85: 0x2026, 0x86: 0x2020, 0x87: 0x2021, 0x88: 0x02C6,
    0x89: 0x2030, 0x8A: 0x0160, 0x8B: 0x2039, 0x8C: 0x0152,
    0x8E: 0x017D, 0x91: 0x2018, 0x92: 0x2019, 0x93: 0x201C,
    0x94: 0x201D, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014,
    0x98: 0x02DC, 0x99: 0x2122, 0x9A: 0x0161, 0x9B: 0x203A,
    0x9C: 0x0153, 0x9E: 0x017E, 0x9F: 0x0178,
}
# Reverse: Unicode codepoint -> original byte
WIN1252_REVERSE = {v: k for k, v in WIN1252_MAP.items()}

for path in files:
    if not os.path.exists(path):
        continue
    text = open(path, encoding='utf-8').read()
    matches = list(re.finditer('\u00c3.', text))
    if not matches:
        continue
    print(f"\nFILE: {path} ({len(matches)} Ã+x sequences)")
    for m in matches[:8]:
        next_char = text[m.start()+1]
        next_cp = ord(next_char)
        ctx = text[max(0, m.start()-15):m.end()+15].replace('\n', ' ')
        orig_byte = WIN1252_REVERSE.get(next_cp)
        if orig_byte is not None:
            correct = chr(0xC0 | (orig_byte & 0x3F))
            print(f"  U+00C3 + U+{next_cp:04X} ({next_char!r}) -> orig_byte=0x{orig_byte:02X} -> correct={correct!r}")
            print(f"    ctx: {ctx!r}")
        else:
            print(f"  U+00C3 + U+{next_cp:04X} ({next_char!r}) | ctx: {ctx!r}")
