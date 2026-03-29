#!/usr/bin/env python3
"""Minify all non-minified .js files in a directory using terser.

Usage:
    python minify_js.py <directory> [--dry-run]
"""

import argparse
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path
from concurrent.futures import ProcessPoolExecutor, as_completed


def minify_file(src: Path) -> tuple[Path, int, int, str]:
    """Minify a single file in-place. Returns (path, before, after, status)."""
    before = src.stat().st_size
    tmp = src.with_suffix(".min.tmp.js")

    try:
        result = subprocess.run(
            ["npx", "terser", str(src), "--compress", "passes=2", "--mangle"],
            capture_output=True,
            text=True,
            timeout=60,
        )
        if result.returncode != 0:
            return (src, before, before, f"terser error: {result.stderr[:120]}")

        tmp.write_text(result.stdout)
        after = tmp.stat().st_size

        if after >= before:
            tmp.unlink()
            return (src, before, before, "already minified")

        shutil.move(str(tmp), str(src))
        return (src, before, after, "ok")
    except subprocess.TimeoutExpired:
        if tmp.exists():
            tmp.unlink()
        return (src, before, before, "timeout")
    except Exception as exc:
        if tmp.exists():
            tmp.unlink()
        return (src, before, before, str(exc)[:120])


def main() -> None:
    parser = argparse.ArgumentParser(description="Minify JS files with terser.")
    parser.add_argument("directory", type=Path, help="Root directory to scan")
    parser.add_argument("--dry-run", action="store_true", help="Only report sizes, don't write")
    parser.add_argument("--workers", type=int, default=4, help="Parallel workers (default: 4)")
    args = parser.parse_args()

    root = args.directory.resolve()
    if not root.is_dir():
        sys.exit(f"Error: {root} is not a directory")

    files = sorted(
        p for p in root.rglob("*.js")
        if p.suffix == ".js" and not p.stem.endswith(".min") and ".min." not in p.name
    )
    total = len(files)
    if total == 0:
        print("No .js files found.")
        return

    total_size = sum(f.stat().st_size for f in files)
    print(f"Found {total} JS files ({total_size:,} bytes) in {root}\n")

    if args.dry_run:
        print("Dry run — no files will be modified.")
        for f in sorted(files, key=lambda p: p.stat().st_size, reverse=True)[:20]:
            print(f"  {f.stat().st_size:>12,}  {f.relative_to(root)}")
        print(f"  ... and {total - 20} more")
        return

    minified = 0
    skipped = 0
    failed = 0
    saved_bytes = 0
    start = time.monotonic()

    with ProcessPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(minify_file, f): f for f in files}
        for i, future in enumerate(as_completed(futures), 1):
            path, before, after, status = future.result()
            rel = path.relative_to(root)
            saved = before - after
            tag = f"[{i}/{total}]"

            if status == "ok":
                minified += 1
                saved_bytes += saved
                print(f"{tag} OK    {rel}  {before:>10,} → {after:>10,}  ({saved / before * 100:+.1f}%)")
            elif status == "already minified":
                skipped += 1
                print(f"{tag} SKIP  {rel}  {before:>10,}  (no improvement)")
            else:
                failed += 1
                print(f"{tag} FAIL  {rel}  {status}")

    elapsed = time.monotonic() - start
    print(
        f"\nDone in {elapsed:.1f}s — "
        f"{minified} minified, {skipped} skipped, {failed} failed, "
        f"{saved_bytes:,} bytes saved ({saved_bytes / total_size * 100:.1f}% reduction)"
    )


if __name__ == "__main__":
    main()
