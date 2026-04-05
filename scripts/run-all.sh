#!/usr/bin/env bash
set -euo pipefail
pnpm audit --fix
pnpm install
pnpm copy-vendor
pnpm typecheck
pnpm lint
pnpm format:check
pnpm build
echo "All checks passed and build completed successfully."