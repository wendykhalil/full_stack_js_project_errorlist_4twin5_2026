#!/usr/bin/env python3
"""
fix_encoding_v2.py — Fix double-encoded UTF-8 (mojibake) in all source files.

Strategy: targeted string replacement of each known mojibake sequence.
This handles files that have a MIX of already-correct Unicode chars and
corrupted sequences — the naive full-file latin-1 re-encode breaks those.

Usage:
    python fix_encoding_v2.py          # dry-run
    python fix_encoding_v2.py --fix    # apply fixes
"""

import os
import sys

# Complete mojibake -> correct character mapping
# Each entry is (corrupted_sequence, correct_char)
# Order matters: longer sequences first to avoid partial matches
REPLACEMENTS = [
    # Punctuation / typography (multi-byte sequences — do these FIRST)
    ("\u00e2\u0080\u0099", "\u2019"),   # â€™ -> right single quote '
    ("\u00e2\u0080\u0098", "\u2018"),   # â€˜ -> left single quote '
    ("\u00e2\u0080\u009c", "\u201c"),   # â€œ -> left double quote "
    ("\u00e2\u0080\u009d", "\u201d"),   # â€  -> right double quote "
    ("\u00e2\u0080\u00a6", "\u2026"),   # â€¦ -> ellipsis …
    ("\u00e2\u0080\u0093", "\u2013"),   # â€" -> en dash –
    ("\u00e2\u0080\u0094", "\u2014"),   # â€" -> em dash —
    ("\u00e2\u0080\u00a2", "\u2022"),   # â€¢ -> bullet •
    ("\u00e2\u0082\u00ac", "\u20ac"),   # â‚¬ -> euro sign €
    # French lowercase accented
    ("\u00c3\u00a9", "\u00e9"),   # Ã© -> é
    ("\u00c3\u00a8", "\u00e8"),   # Ã¨ -> è
    ("\u00c3\u00aa", "\u00ea"),   # Ãª -> ê
    ("\u00c3\u00ab", "\u00eb"),   # Ã« -> ë
    ("\u00c3\u00a0", "\u00e0"),   # Ã  -> à
    ("\u00c3\u00a2", "\u00e2"),   # Ã¢ -> â
    ("\u00c3\u00a4", "\u00e4"),   # Ã¤ -> ä
    ("\u00c3\u00ae", "\u00ee"),   # Ã® -> î
    ("\u00c3\u00af", "\u00ef"),   # Ã¯ -> ï
    ("\u00c3\u00b4", "\u00f4"),   # Ã´ -> ô
    ("\u00c3\u00b6", "\u00f6"),   # Ã¶ -> ö
    ("\u00c3\u00b9", "\u00f9"),   # Ã¹ -> ù
    ("\u00c3\u00bb", "\u00fb"),   # Ã» -> û
    ("\u00c3\u00bc", "\u00fc"),   # Ã¼ -> ü
    ("\u00c3\u00a7", "\u00e7"),   # Ã§ -> ç
    ("\u00c3\u00b1", "\u00f1"),   # Ã± -> ñ
    # French uppercase accented
    ("\u00c3\u0089", "\u00c9"),   # Ã‰ -> É
    ("\u00c3\u0087", "\u00c7"),   # Ã‡ -> Ç
    ("\u00c3\u0080", "\u00c0"),   # Ã€ -> À
    ("\u00c3\u0082", "\u00c2"),   # Ã‚ -> Â
    ("\u00c3\u008b", "\u00cb"),   # Ã‹ -> Ë
    ("\u00c3\u008e", "\u00ce"),   # ÃŽ -> Î
    ("\u00c3\u0093", "\u00d3"),   # Ã" -> Ó
    ("\u00c3\u0094", "\u00d4"),   # Ã" -> Ô
    ("\u00c3\u0099", "\u00d9"),   # Ã™ -> Ù
    ("\u00c3\u009b", "\u00db"),   # Ã› -> Û
    # Misc
    ("\u00c2\u00ab", "\u00ab"),   # Â« -> «
    ("\u00c2\u00bb", "\u00bb"),   # Â» -> »
    ("\u00c2\u00b0", "\u00b0"),   # Â° -> °
    ("\u00c2\u00b7", "\u00b7"),   # Â· -> ·
    ("\u00c2\u00a0", "\u00a0"),   # Â  -> non-breaking space
    ("\u00c2\u00a9", "\u00a9"),   # Â© -> ©
    ("\u00c2\u00ae", "\u00ae"),   # Â® -> ®
]

DIRS = [
    os.path.join("frontend", "src"),
    os.path.join("backend", "src"),
]
EXTS = {".jsx", ".js", ".ts", ".tsx"}
MARKERS = [r[0] for r in REPLACEMENTS]


def fix_file(path, dry_run=True):
    try:
        raw = open(path, "rb").read()
        if raw.startswith(b"\xef\xbb\xbf"):
            raw = raw[3:]
        try:
            text = raw.decode("utf-8")
        except UnicodeDecodeError:
            # File is raw Latin-1 bytes (not yet UTF-8 encoded)
            text = raw.decode("latin-1")

        if not any(m in text for m in MARKERS):
            return 0

        new_text = text
        count = 0
        for bad, good in REPLACEMENTS:
            n = new_text.count(bad)
            if n > 0:
                new_text = new_text.replace(bad, good)
                count += n

        if new_text == text or count == 0:
            return 0

        if not dry_run:
            with open(path, "w", encoding="utf-8", newline="") as f:
                f.write(new_text)

        return count
    except Exception as e:
        print(f"  ERROR: {path}: {e}")
        return -1


def main():
    dry_run = "--fix" not in sys.argv
    mode = "DRY RUN" if dry_run else "APPLYING FIXES"

    print(f"\n{'='*60}")
    print(f"UTF-8 Mojibake Fix v2 — {mode}")
    print(f"{'='*60}\n")

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
                count = fix_file(path, dry_run=dry_run)
                if count > 0:
                    action = "WOULD FIX" if dry_run else "FIXED"
                    print(f"  {action} ({count} replacements): {path}")
                    fixed_files += 1
                    total_replacements += count

    print(f"\n{'='*60}")
    if dry_run:
        print(f"Dry run: {fixed_files} files would be fixed ({total_replacements} replacements)")
        print("Run with --fix to apply.")
    else:
        print(f"Done: {fixed_files} files fixed, {total_replacements} total replacements")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
