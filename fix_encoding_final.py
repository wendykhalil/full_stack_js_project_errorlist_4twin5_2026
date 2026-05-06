#!/usr/bin/env python3
"""
fix_encoding_final.py — Definitive mojibake fix for Windows-1252 + Latin-1 corruption.

Root cause analysis:
  Files were saved in Windows-1252 (cp1252), not Latin-1. The difference matters
  for bytes 0x80-0x9F: cp1252 maps them to Unicode chars like € ‰ ' " – — etc.
  When these files were re-encoded as UTF-8, the cp1252 chars got double-encoded.

  Example: É (U+00C9)
    UTF-8 bytes: C3 89
    Read as cp1252: Ã (C3=0xC3->U+00C3) + ‰ (89=0x89->U+2030 in cp1252)
    Displayed as: Ã‰ (where ‰ is U+2030, not the control char \x89)

  The fix: for each U+00C3 followed by a cp1252-mapped char, recover the
  original byte and reconstruct the correct Unicode character.

Usage:
    python fix_encoding_final.py          # dry-run
    python fix_encoding_final.py --fix    # apply fixes
"""

import os
import sys
import re

# Windows-1252 byte -> Unicode codepoint for the 0x80-0x9F range
# (Latin-1 maps these to control chars; cp1252 maps them to printable chars)
CP1252_MAP = {
    0x80: 0x20AC,  # €
    0x82: 0x201A,  # ‚
    0x83: 0x0192,  # ƒ
    0x84: 0x201E,  # „
    0x85: 0x2026,  # …
    0x86: 0x2020,  # †
    0x87: 0x2021,  # ‡
    0x88: 0x02C6,  # ˆ
    0x89: 0x2030,  # ‰
    0x8A: 0x0160,  # Š
    0x8B: 0x2039,  # ‹
    0x8C: 0x0152,  # Œ
    0x8E: 0x017D,  # Ž
    0x91: 0x2018,  # '
    0x92: 0x2019,  # '
    0x93: 0x201C,  # "
    0x94: 0x201D,  # "
    0x95: 0x2022,  # •
    0x96: 0x2013,  # –
    0x97: 0x2014,  # —
    0x98: 0x02DC,  # ˜
    0x99: 0x2122,  # ™
    0x9A: 0x0161,  # š
    0x9B: 0x203A,  # ›
    0x9C: 0x0153,  # œ
    0x9E: 0x017E,  # ž
    0x9F: 0x0178,  # Ÿ
}
CP1252_REVERSE = {v: k for k, v in CP1252_MAP.items()}

# Build replacement table: corrupted_sequence -> correct_char
# Part 1: U+00C3 + cp1252-mapped char -> correct Latin-1 char
# The original byte was 0x80-0x9F, so the correct char is U+00C0 | (byte & 0x3F)
# But wait — 0x80-0x9F & 0x3F = 0x00-0x1F, so U+00C0|0x00=À ... U+00C0|0x1F=ß
# Let's compute each one explicitly:
REPLACEMENTS_CP1252 = []
for cp1252_byte, unicode_cp in CP1252_MAP.items():
    corrupted = chr(0x00C3) + chr(unicode_cp)
    # The original Latin-1 char: C3 xx in UTF-8 means U+00C0 + (xx - 0x80)
    # where xx = cp1252_byte
    correct_cp = 0x00C0 | (cp1252_byte & 0x3F)
    correct_char = chr(correct_cp)
    REPLACEMENTS_CP1252.append((corrupted, correct_char))

# Part 2: Standard Latin-1 mojibake (U+00C3 + U+00A0..U+00BF -> correct char)
# These are the 0xA0-0xFF range chars (already handled by v3 but include for completeness)
REPLACEMENTS_LATIN1 = []
for codepoint in range(0x00C0, 0x0100):
    byte2 = 0x80 | (codepoint & 0x3F)
    corrupted = chr(0x00C3) + chr(byte2)
    REPLACEMENTS_LATIN1.append((corrupted, chr(codepoint)))

for codepoint in range(0x0080, 0x00C0):
    byte2 = codepoint
    corrupted = chr(0x00C2) + chr(byte2)
    REPLACEMENTS_LATIN1.append((corrupted, chr(codepoint)))

# Part 3: Typography (3-byte UTF-8 sequences misread as cp1252)
REPLACEMENTS_TYPOGRAPHY = [
    (chr(0x00E2) + chr(0x20AC) + chr(0x2122), "\u2122"),  # â€™ -> ™ (if ™ was cp1252 0x99)
    (chr(0x00E2) + chr(0x20AC) + chr(0x2019), "\u2019"),  # â€™ -> '
    (chr(0x00E2) + chr(0x20AC) + chr(0x201C), "\u201c"),  # â€œ -> "
    (chr(0x00E2) + chr(0x20AC) + chr(0x201D), "\u201d"),  # â€  -> "
    (chr(0x00E2) + chr(0x20AC) + chr(0x2026), "\u2026"),  # â€¦ -> …
    (chr(0x00E2) + chr(0x20AC) + chr(0x2013), "\u2013"),  # â€" -> –
    (chr(0x00E2) + chr(0x20AC) + chr(0x2014), "\u2014"),  # â€" -> —
    (chr(0x00E2) + chr(0x20AC) + chr(0x2022), "\u2022"),  # â€¢ -> •
    (chr(0x00E2) + chr(0x201A) + chr(0x00AC), "\u20ac"),  # â‚¬ -> €
    (chr(0x00E2) + chr(0x20AC) + chr(0x2018), "\u2018"),  # â€˜ -> '
    (chr(0x00E2) + chr(0x20AC) + chr(0x201E), "\u201e"),  # â€ž -> „
    (chr(0x00E2) + chr(0x20AC) + chr(0x201A), "\u201a"),  # â€š -> ‚
    (chr(0x00E2) + chr(0x20AC) + chr(0x2030), "\u2030"),  # â€° -> ‰
    (chr(0x00E2) + chr(0x20AC) + chr(0x2039), "\u2039"),  # â€¹ -> ‹
    (chr(0x00E2) + chr(0x20AC) + chr(0x203A), "\u203a"),  # â€º -> ›
]

# Combine all replacements, longest first to avoid partial matches
ALL_REPLACEMENTS = REPLACEMENTS_TYPOGRAPHY + REPLACEMENTS_CP1252 + REPLACEMENTS_LATIN1
ALL_REPLACEMENTS.sort(key=lambda x: -len(x[0]))

# Deduplicate
seen = set()
FINAL_REPLACEMENTS = []
for bad, good in ALL_REPLACEMENTS:
    if bad not in seen:
        seen.add(bad)
        FINAL_REPLACEMENTS.append((bad, good))

MARKERS = [r[0] for r in FINAL_REPLACEMENTS]

DIRS = ["frontend/src", "backend/src"]
EXTS = {".jsx", ".js", ".ts", ".tsx"}


def fix_file(path, dry_run=True):
    try:
        raw = open(path, "rb").read()
        if raw.startswith(b"\xef\xbb\xbf"):
            raw = raw[3:]
        try:
            text = raw.decode("utf-8")
        except UnicodeDecodeError:
            text = raw.decode("cp1252")

        if not any(m in text for m in MARKERS):
            return 0, []

        new_text = text
        count = 0
        fixed_pairs = []
        for bad, good in FINAL_REPLACEMENTS:
            n = new_text.count(bad)
            if n > 0:
                new_text = new_text.replace(bad, good)
                count += n
                fixed_pairs.append((bad, good, n))

        if new_text == text or count == 0:
            return 0, []

        if not dry_run:
            with open(path, "w", encoding="utf-8", newline="") as f:
                f.write(new_text)

        return count, fixed_pairs
    except Exception as e:
        print(f"  ERROR: {path}: {e}")
        return -1, []


def main():
    dry_run = "--fix" not in sys.argv
    mode = "DRY RUN" if dry_run else "APPLYING FIXES"

    print(f"\n{'='*65}")
    print(f"UTF-8 Mojibake Fix FINAL (cp1252 + Latin-1) — {mode}")
    print(f"{'='*65}\n")

    fixed_files = 0
    total_replacements = 0

    for d in DIRS:
        if not os.path.exists(d):
            print(f"  SKIP (not found): {d}")
            continue
        for root, dirs, files in os.walk(d):
            dirs[:] = [x for x in dirs if x != "node_modules"]
            for fname in files:
                if not any(fname.endswith(e) for e in EXTS):
                    continue
                path = os.path.join(root, fname)
                count, pairs = fix_file(path, dry_run=dry_run)
                if count > 0:
                    action = "WOULD FIX" if dry_run else "FIXED"
                    print(f"  {action} ({count} replacements): {path}")
                    for bad, good, n in pairs[:6]:
                        print(f"    {bad!r} -> {good!r}  x{n}")
                    fixed_files += 1
                    total_replacements += count

    print(f"\n{'='*65}")
    if dry_run:
        print(f"Dry run: {fixed_files} files would be fixed ({total_replacements} replacements)")
        print("Run with --fix to apply.")
    else:
        print(f"Done: {fixed_files} files fixed, {total_replacements} total replacements")
    print(f"{'='*65}\n")


if __name__ == "__main__":
    main()
