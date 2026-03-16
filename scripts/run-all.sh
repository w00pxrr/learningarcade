#!/usr/bin/env bash
set -euo pipefail
npm install
npm audit
npm run prebuild
npm run typecheck
npm run build
npm run dev
