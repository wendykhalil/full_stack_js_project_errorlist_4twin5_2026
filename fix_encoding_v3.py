#!/usr/bin/env python3
"""
fix_encoding_v3.py — Complete mojibake fix covering ALL Latin-1 extended chars.

The previous fix missed uppercase accented chars like É (Ã‰), À (Ã€), × (Ã—)
because the replacement table was incomplete. This version covers the full
Latin-1 Supplement block (U+00C0–U+00FF) plus all common typography chars.

Usage:
    python fix_encoding_v3.py          # dry-run
    python fix_encoding_v3.py --fix    # apply fixes
"""

import os
import sys

# Build the COMPLETE mojibake -> correct char mapping for the full Latin-1 range.
# Each corrupted sequence is the UTF-8 encoding of the Latin-1 char,
# misread as two Latin-1 chars, then re-encoded as UTF-8.
#
# For U+00C0–U+00FF: UTF-8 is C3 xx, misread as Ã (C3) + chr(xx)
# We generate the full table programmatically to avoid missing any.

def build_replacements():
    pairs = []

    # Full Latin-1 Supplement: U+00C0 to U+00FF
    for codepoint in range(0x00C0, 0x0100):
        correct_char = chr(codepoint)
        # UTF-8 encoding of this char is two bytes: 0xC3, (0x80 | (codepoint & 0x3F))
        byte1 = 0xC3
        byte2 = 0x80 | (codepoint & 0x3F)
        # When misread as Latin-1: chr(0xC3) + chr(byte2)
        corrupted = chr(0xC3) + chr(byte2)
        pairs.append((corrupted, correct_char))

    # Latin-1 Supplement U+0080–U+00BF (less common but possible)
    for codepoint in range(0x0080, 0x00C0):
        correct_char = chr(codepoint)
        byte1 = 0xC2
        byte2 = codepoint  # 0x80–0xBF
        corrupted = chr(0xC2) + chr(byte2)
        pairs.append((corrupted, correct_char))

    # Common Unicode typography (3-byte UTF-8 sequences misread as Latin-1)
    # These are U+2000–U+27FF range chars encoded as E2 xx xx
    typography = [
        ("\u00e2\u0080\u0099", "\u2019"),   # right single quote '
        ("\u00e2\u0080\u0098", "\u2018"),   # left single quote '
        ("\u00e2\u0080\u009c", "\u201c"),   # left double quote "
        ("\u00e2\u0080\u009d", "\u201d"),   # right double quote "
        ("\u00e2\u0080\u00a6", "\u2026"),   # ellipsis …
        ("\u00e2\u0080\u0093", "\u2013"),   # en dash –
        ("\u00e2\u0080\u0094", "\u2014"),   # em dash —
        ("\u00e2\u0080\u00a2", "\u2022"),   # bullet •
        ("\u00e2\u0080\u00b2", "\u2032"),   # prime ′
        ("\u00e2\u0080\u00b3", "\u2033"),   # double prime ″
        ("\u00e2\u0082\u00ac", "\u20ac"),   # euro sign €
        ("\u00e2\u0084\u00a2", "\u2122"),   # trade mark ™
        ("\u00e2\u0086\u0092", "\u2192"),   # right arrow →
        ("\u00e2\u0086\u0090", "\u2190"),   # left arrow ←
        ("\u00e2\u0088\u0092", "\u2212"),   # minus sign −
        ("\u00e2\u0089\u00a4", "\u2264"),   # less-than or equal ≤
        ("\u00e2\u0089\u00a5", "\u2265"),   # greater-than or equal ≥
        ("\u00e2\u0080\u008b", "\u200b"),   # zero-width space
        ("\u00e2\u0080\u008c", "\u200c"),   # zero-width non-joiner
        ("\u00e2\u0080\u008d", "\u200d"),   # zero-width joiner
        ("\u00e2\u0080\u00af", "\u202f"),   # narrow no-break space
        ("\u00e2\u0080\u009e", "\u201e"),   # double low-9 quotation mark „
        ("\u00e2\u0080\u009a", "\u201a"),   # single low-9 quotation mark ‚
        ("\u00e2\u0080\u00b0", "\u2030"),   # per mille sign ‰
        ("\u00e2\u0080\u00b9", "\u2039"),   # single left angle quotation ‹
        ("\u00e2\u0080\u00ba", "\u203a"),   # single right angle quotation ›
        ("\u00e2\u0080\u00a0", "\u2020"),   # dagger †
        ("\u00e2\u0080\u00a1", "\u2021"),   # double dagger ‡
        ("\u00e2\u0080\u00a3", "\u2023"),   # triangular bullet ‣
        ("\u00e2\u0080\u00a4", "\u2024"),   # one dot leader ․
        ("\u00e2\u0080\u00a5", "\u2025"),   # two dot leader ‥
        ("\u00e2\u0080\u00a7", "\u2027"),   # hyphenation point ‧
        ("\u00e2\u0080\u00a8", "\u2028"),   # line separator
        ("\u00e2\u0080\u00a9", "\u2029"),   # paragraph separator
        ("\u00e2\u0080\u00aa", "\u202a"),   # left-to-right embedding
        ("\u00e2\u0080\u00ab", "\u202b"),   # right-to-left embedding
        ("\u00e2\u0080\u00ac", "\u202c"),   # pop directional formatting
        ("\u00e2\u0080\u00ad", "\u202d"),   # left-to-right override
        ("\u00e2\u0080\u00ae", "\u202e"),   # right-to-left override
    ]
    pairs.extend(typography)

    # Sort by length descending to avoid partial replacements
    pairs.sort(key=lambda x: -len(x[0]))
    return pairs


REPLACEMENTS = build_replacements()
MARKERS = [r[0] for r in REPLACEMENTS]

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
            text = raw.decode("latin-1")

        if not any(m in text for m in MARKERS):
            return 0, []

        new_text = text
        count = 0
        fixed_pairs = []
        for bad, good in REPLACEMENTS:
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
    print(f"UTF-8 Mojibake Fix v3 (complete Latin-1 table) — {mode}")
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
                    for bad, good, n in pairs[:5]:
                        print(f"    {repr(bad)} -> {repr(good)}  x{n}")
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
