#!/usr/bin/env python3
"""Recursively convert .jpg/.jpeg files to .webp with maximum compression.

Usage:
    python jpg_to_webp.py <directory> [--delete] [--quality 100]

Requires: pip install Pillow
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


def convert_file(src: Path, dst: Path, quality: int) -> None:
    """Convert a single image file to WebP, raising on failure."""
    img = Image.open(src)
    if img.mode in ("RGBA", "LA", "PA"):
        # Preserve transparency as-is
        pass
    elif img.mode != "RGB":
        img = img.convert("RGB")
    dst.parent.mkdir(parents=True, exist_ok=True)
    img.save(dst, "WEBP", quality=quality, method=6)  # method 6 = slowest/best compression


def main() -> None:
    parser = argparse.ArgumentParser(description="Batch-convert JPG images to WebP.")
    parser.add_argument("directory", type=Path, help="Root directory to scan")
    parser.add_argument(
        "--delete",
        action="store_true",
        help="Delete original .jpg files after a successful conversion",
    )
    parser.add_argument(
        "--quality",
        type=int,
        default=80,
        metavar="Q",
        help="WebP quality 1-100 (default: 80)",
    )
    args = parser.parse_args()

    root = args.directory.resolve()
    if not root.is_dir():
        sys.exit(f"Error: {root} is not a directory")

    files = sorted(
        p for p in root.rglob("*") if p.suffix.lower() in (".jpg", ".jpeg")
    )
    total = len(files)
    if total == 0:
        print("No .jpg/.jpeg files found.")
        return

    print(f"Found {total} image(s) in {root}\n")

    converted = 0
    failed = 0
    deleted = 0
    start = time.monotonic()

    for i, src in enumerate(files, 1):
        rel = src.relative_to(root)
        dst = src.with_suffix(".webp")
        tag = f"[{i}/{total}]"

        try:
            convert_file(src, dst, args.quality)
        except Exception as exc:
            failed += 1
            print(f"{tag} FAIL  {rel}  — {exc}")
            # Clean up partial output
            if dst.exists():
                dst.unlink()
            continue

        converted += 1
        size_before = src.stat().st_size
        size_after = dst.stat().st_size
        pct = (1 - size_after / size_before) * 100 if size_before else 0

        if args.delete:
            try:
                src.unlink()
                deleted += 1
                action = "deleted"
            except OSError as exc:
                action = f"kept (delete failed: {exc})"
        else:
            action = "kept"

        print(
            f"{tag} OK    {rel}  "
            f"{size_before:>10,} → {size_after:>10,} bytes  ({pct:+.1f}%)  [{action}]"
        )

    elapsed = time.monotonic() - start
    print(
        f"\nDone in {elapsed:.1f}s — "
        f"{converted} converted, {failed} failed"
        + (f", {deleted} deleted" if args.delete else "")
    )


if __name__ == "__main__":
    main()
