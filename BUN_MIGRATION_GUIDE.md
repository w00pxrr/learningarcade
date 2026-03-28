# Bun Migration Guide for LearningArcade

This guide provides step-by-step instructions for migrating this Next.js project from Node.js with pnpm to the Bun runtime.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Install Bun](#step-1-install-bun)
3. [Step 2: Migrate package.json](#step-2-migrate-packagejson)
4. [Step 3: Install Dependencies](#step-3-install-dependencies)
5. [Step 4: Update Scripts](#step-4-update-scripts)
6. [Step 5: Handle Environment Variables](#step-5-handle-environment-variables)
7. [Step 6: Test the Application](#step-6-test-the-application)
8. [Step 7: Update CI/CD](#step-7-update-cicd)
9. [Common Issues and Solutions](#common-issues-and-solutions)
10. [Performance Comparison](#performance-comparison)
11. [Rollback Plan](#rollback-plan)

---

## Prerequisites

- Current setup: Node.js 18+, pnpm 10.32.1
- Next.js 16.2.1 with React 19.2.4
- Playwright for testing
- CJS scripts in `scripts/` directory

---

## Step 1: Install Bun

### macOS and Linux

```bash
curl -fsSL https://bun.sh/install | bash
```

### Windows (via PowerShell)

```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

### Verify Installation

```bash
bun --version
```

Expected output: `bun 1.x.x` (or later)

### Add to PATH (if needed)

The installer automatically adds Bun to your PATH. If you need to manually add it:

```bash
# Add to ~/.bashrc, ~/.zshrc, or ~/.profile
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
```

---

## Step 2: Migrate package.json

### 2.1 Remove pnpm-specific Configuration

The `packageManager` field is pnpm-specific and should be removed or updated:

```json
{
  "name": "learningarcade",
  "private": true,
  // Remove or update this line:
  // "packageManager": "pnpm@10.32.1",
  "scripts": {
    // ... existing scripts
  }
}
```

### 2.2 Update package.json

```bash
# Remove the packageManager field
bun run -e "
const pkg = require('./package.json');
delete pkg.packageManager;
require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log('Updated package.json');
"
```

Or manually edit `package.json` and remove line 4 (`"packageManager": "pnpm@10.32.1",`).

---

## Step 3: Install Dependencies

### 3.1 Remove Existing node_modules and Lock Files

```bash
# Remove pnpm lock file and node_modules
rm -rf node_modules pnpm-lock.yaml

# Optional: Remove pnpm workspace config if not needed
# rm pnpm-workspace.yaml
```

### 3.2 Install Dependencies with Bun

```bash
bun install
```

This will:
- Create a `bun.lockb` file (binary lockfile, faster than JSON-based lockfiles)
- Install all dependencies from `package.json`
- Use Bun's native package installer (significantly faster than pnpm)

### 3.3 Verify Installation

```bash
# Check that key dependencies are installed
ls node_modules/next
ls node_modules/react
ls node_modules/@playwright/test
```

---

## Step 4: Update Scripts

### 4.1 Update package.json Scripts

The current scripts use `node` directly. Update them to use `bun`:

```json
{
  "scripts": {
    "prebuild": "bun -e \"require('fs').rmSync('public/vendor', { recursive: true, force: true });\" && mkdir -p public/vendor public/vendor/axios public/vendor/fontawesome-6 public/vendor/material-symbols && cp -R node_modules/@ruffle-rs/ruffle public/vendor/ruffle && cp node_modules/axios/dist/axios.min.js public/vendor/axios/axios.min.js && cp -R node_modules/@fortawesome/fontawesome-free public/vendor/fontawesome-6 && cp -R node_modules/material-symbols public/vendor/material-symbols",
    "detect-leaderboards": "bun scripts/detect-leaderboards.cjs",
    "compress-games": "bun scripts/compress-games.cjs",
    "dev": "bun run --bun next dev",
    "build": "bun run --bun next build",
    "start": "bun run --bun next start",
    "typecheck": "bun run --bun tsc --noEmit",
    "test": "bun run --bun playwright test"
  }
}
```

**Key Changes:**
- Replace `node` with `bun` for script execution
- Add `--bun` flag to `next` commands to ensure Bun runtime is used
- Keep shell commands (mkdir, cp, rm) as-is (they work in Bun's shell)

### 4.2 Alternative: Use Bun's Native Shell

Bun has a built-in shell that can replace some shell commands. For the `prebuild` script, you could use:

```json
{
  "scripts": {
    "prebuild": "bun -e \"require('fs').rmSync('public/vendor', { recursive: true, force: true });\" && bun -e \"const fs = require('fs'); const path = require('path'); const dirs = ['public/vendor', 'public/vendor/axios', 'public/vendor/fontawesome-6', 'public/vendor/material-symbols']; dirs.forEach(d => fs.mkdirSync(d, { recursive: true })); fs.cpSync('node_modules/@ruffle-rs/ruffle', 'public/vendor/ruffle', { recursive: true }); fs.copyFileSync('node_modules/axios/dist/axios.min.js', 'public/vendor/axios/axios.min.js'); fs.cpSync('node_modules/@fortawesome/fontawesome-free', 'public/vendor/fontawesome-6', { recursive: true }); fs.cpSync('node_modules/material-symbols', 'public/vendor/material-symbols', { recursive: true });\""
  }
}
```

However, the original shell commands work fine with Bun, so the simpler approach is recommended.

---

## Step 5: Handle Environment Variables

### 5.1 Verify .env.local Compatibility

Bun automatically loads `.env.local` files, just like Next.js. No changes needed for:

```bash
# Your existing .env.local file will work as-is
cat .env.local
```

### 5.2 Environment Variable Differences

Bun's environment variable handling is compatible with Node.js, but there are some nuances:

**Supported:**
- `.env`, `.env.local`, `.env.development`, `.env.production`, `.env.test`
- `process.env.VARIABLE_NAME`
- `NEXT_PUBLIC_*` prefixed variables

**No changes needed** - your existing `.env.local` will work.

### 5.3 Verify Environment Variables Load

```bash
# Test that environment variables are loaded
bun -e "console.log('NODE_ENV:', process.env.NODE_ENV)"
```

---

## Step 6: Test the Application

### 6.1 Run Development Server

```bash
bun run dev
```

Expected output:
```
▲ Next.js 16.2.1
- Local:        http://localhost:3000
- Network:      http://0.0.0.0:3000
```

### 6.2 Test Build Process

```bash
bun run build
```

This will:
1. Run `prebuild` script to copy vendor files
2. Run Next.js build
3. Generate optimized production build

### 6.3 Test Production Start

```bash
bun run start
```

### 6.4 Run Playwright Tests

```bash
bun run test
```

**Note:** Playwright tests should work without modification. The `--bun` flag ensures tests run under Bun runtime.

### 6.5 Test Custom Scripts

```bash
# Test game compression script
bun run compress-games

# Test leaderboard detection
bun run detect-leaderboards
```

---

## Step 7: Update CI/CD

### 7.1 GitHub Actions Example

If using GitHub Actions, update your workflow:

```yaml
name: CI

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      
      - name: Install dependencies
        run: bun install
      
      - name: Build
        run: bun run build
      
      - name: Run tests
        run: bun run test
```

### 7.2 Vercel Deployment

Vercel supports Bun natively. Update your `vercel.json` or project settings:

```json
{
  "buildCommand": "bun run build",
  "devCommand": "bun run dev",
  "installCommand": "bun install"
}
```

Or set in Vercel dashboard:
- **Build Command:** `bun run build`
- **Dev Command:** `bun run dev`
- **Install Command:** `bun install`

---

## Common Issues and Solutions

### Issue 1: Native Modules

**Problem:** Some npm packages with native bindings may not work with Bun.

**Solution:**
```bash
# Check if a package has native bindings
ls node_modules/<package-name>/binding.gyp

# If issues occur, try rebuilding
bun install --force
```

**Packages in this project:**
- `bcryptjs` - Pure JavaScript, no native bindings ✅
- `@neondatabase/serverless` - Pure JavaScript ✅
- `@playwright/test` - Has native bindings, but Bun supports it ✅

### Issue 2: CJS Scripts with require()

**Problem:** Your CJS scripts use `require()` which Bun supports natively.

**Solution:** No changes needed. Bun supports both ESM and CJS out of the box.

```javascript
// These work in Bun without modification
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
```

### Issue 3: Node.js Built-in APIs

**Problem:** Some Node.js APIs may have slight differences in Bun.

**APIs used in this project:**
- `fs` - ✅ Fully compatible
- `path` - ✅ Fully compatible
- `zlib` - ✅ Fully compatible
- `util` - ✅ Fully compatible

**No issues expected** with your current scripts.

### Issue 4: Playwright Browser Installation

**Problem:** Playwright may need browser binaries installed.

**Solution:**
```bash
# Install Playwright browsers
bun run playwright install

# Or install specific browsers
bun run playwright install chromium
```

### Issue 5: Next.js Edge Runtime

**Problem:** Next.js Edge Runtime features may behave differently.

**Solution:** Bun supports Edge Runtime. If issues occur:

```javascript
// In next.config.mjs, you can specify runtime
const nextConfig = {
  experimental: {
    runtime: 'nodejs', // or 'edge'
  },
};
```

### Issue 6: TypeScript Configuration

**Problem:** TypeScript may need minor adjustments.

**Solution:** Your `tsconfig.json` should work as-is. Bun uses the same TypeScript compiler.

### Issue 7: PostCSS/Tailwind CSS

**Problem:** PostCSS config uses `.cjs` extension.

**Solution:** This works fine with Bun. The `.cjs` extension ensures CommonJS loading.

---

## Performance Comparison

### Expected Improvements

| Operation | pnpm | Bun | Improvement |
|-----------|------|-----|-------------|
| Install dependencies | ~30-60s | ~5-10s | 3-6x faster |
| Dev server startup | ~3-5s | ~1-2s | 2-3x faster |
| Build time | ~60-120s | ~30-60s | 2x faster |
| Script execution | Baseline | 2-3x faster | Significant |

### Real-world Benefits

1. **Faster installs:** Bun's native package installer is significantly faster
2. **Faster builds:** Next.js builds benefit from Bun's faster JavaScript execution
3. **Faster scripts:** Your CJS scripts will execute faster
4. **Lower memory usage:** Bun typically uses less memory than Node.js

---

## Rollback Plan

If you need to revert to Node.js/pnpm:

### 1. Restore package.json

```bash
# Re-add packageManager field
bun -e "
const pkg = require('./package.json');
pkg.packageManager = 'pnpm@10.32.1';
require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2) + '\n');
"
```

### 2. Restore Scripts

```bash
# Revert script commands from 'bun' to 'node'
# Edit package.json and replace:
# - 'bun scripts/' with 'node scripts/'
# - 'bun run --bun next' with 'next'
# - 'bun run --bun tsc' with 'tsc'
# - 'bun run --bun playwright' with 'playwright'
```

### 3. Reinstall with pnpm

```bash
rm -rf node_modules bun.lockb
pnpm install
```

---

## Post-Migration Checklist

- [ ] Bun installed and verified (`bun --version`)
- [ ] `packageManager` field removed from `package.json`
- [ ] Dependencies installed with `bun install`
- [ ] `bun.lockb` lockfile created
- [ ] All scripts updated to use `bun`
- [ ] Development server starts (`bun run dev`)
- [ ] Build completes successfully (`bun run build`)
- [ ] Production server starts (`bun run start`)
- [ ] Playwright tests pass (`bun run test`)
- [ ] Custom scripts work (`bun run compress-games`, `bun run detect-leaderboards`)
- [ ] Environment variables load correctly
- [ ] CI/CD updated (if applicable)
- [ ] Vercel deployment settings updated (if applicable)

---

## Additional Resources

- [Bun Documentation](https://bun.sh/docs)
- [Bun vs Node.js Compatibility](https://bun.sh/docs/runtime/nodejs-apis)
- [Next.js on Bun](https://bun.sh/guides/ecosystem/nextjs)
- [Bun GitHub Issues](https://github.com/oven-sh/bun/issues)

---

## Support

If you encounter issues not covered in this guide:

1. Check [Bun's compatibility table](https://bun.sh/docs/runtime/nodejs-apis)
2. Search [Bun GitHub issues](https://github.com/oven-sh/bun/issues)
3. Join [Bun Discord](https://bun.sh/discord)

---

**Migration completed by:** [Your Name]
**Date:** 2026-03-28
**Bun Version:** 1.x.x
**Previous Setup:** Node.js 18+, pnpm 10.32.1
