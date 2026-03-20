#!/usr/bin/env bash
set -euo pipefail
pnpm install
pnpm run prebuild
pnpm run typecheck
pnpm run build
pnpm run dev
