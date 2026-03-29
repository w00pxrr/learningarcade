#!/usr/bin/env python3
"""Downscale all .webp images in a directory to a maximum width, preserving aspect ratio.

Usage:
    python downscale_webp.py <directory> [--max-width 560]
"""

import argparse
import os
import sys
import time
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow is required. Install it with:  pip install Pillow")


def main() -> None:
    parser = argparse.ArgumentParser(description="Downscale WebP images to max width.")
    parser.add_argument("directory", type=Path, help="Root directory to scan")
    parser.add_argument(
        "--max-width",
        type=int,
        default=560,
        metavar="PX",
        help="Maximum width in pixels (default: 560)",
    )
    args = parser.parse_args()

    root = args.directory.resolve()
    if not root.is_dir():
        sys.exit(f"Error: {root} is not a directory")

    files = sorted(p for p in root.rglob("*.webp"))
    total = len(files)
    if total == 0:
        print("No .webp files found.")
        return

    print(f"Found {total} image(s) in {root}  —  max width {args.max_width}px\n")

    resized = 0
    skipped = 0
    failed = 0
    saved_bytes = 0
    start = time.monotonic()

    for i, path in enumerate(files, 1):
        rel = path.relative_to(root)
        tag = f"[{i}/{total}]"

        try:
            img = Image.open(path)
            w, h = img.size
        except Exception as exc:
            failed += 1
            print(f"{tag} FAIL  {rel}  — {exc}")
            continue

        if w <= args.max_width:
            skipped += 1
            print(f"{tag} SKIP  {rel}  {w}x{h}  (already within limit)")
            continue

        new_w = args.max_width
        new_h = round(h * new_w / w)

        try:
            resized_img = img.resize((new_w, new_h), Image.LANCZOS)
            before = path.stat().st_size
            resized_img.save(path, "WEBP", quality=80, method=6)
            after = path.stat().st_size
            saved = before - after
            saved_bytes += saved
            resized += 1
            print(
                f"{tag} OK    {rel}  {w}x{h} → {new_w}x{new_h}  "
                f"{before:>10,} → {after:>10,} bytes  ({saved / before * 100:+.1f}%)"
            )
        except Exception as exc:
            failed += 1
            print(f"{tag} FAIL  {rel}  — {exc}")

    elapsed = time.monotonic() - start
    print(
        f"\nDone in {elapsed:.1f}s — "
        f"{resized} resized, {skipped} skipped, {failed} failed, "
        f"{saved_bytes:,} bytes saved"
    )


if __name__ == "__main__":
    main()
