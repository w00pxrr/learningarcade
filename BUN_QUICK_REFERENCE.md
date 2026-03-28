# Bun Migration Quick Reference

## Installation

```bash
# Install Bun (macOS/Linux)
curl -fsSL https://bun.sh/install | bash

# Verify installation
bun --version
```

## Key Command Changes

| Operation | pnpm | Bun |
|-----------|------|-----|
| Install dependencies | `pnpm install` | `bun install` |
| Run dev server | `pnpm dev` | `bun run dev` |
| Build project | `pnpm build` | `bun run build` |
| Start production | `pnpm start` | `bun run start` |
| Run tests | `pnpm test` | `bun run test` |
| Run script | `pnpm run <script>` | `bun run <script>` |
| Execute file | `node script.js` | `bun script.js` |

## Automated Migration

```bash
# Run the automated migration script
./scripts/migrate-to-bun.sh
```

## Manual Migration Steps

### 1. Install Bun
```bash
curl -fsSL https://bun.sh/install | bash
```

### 2. Update package.json
Remove line 4: `"packageManager": "pnpm@10.32.1",`

### 3. Update Scripts in package.json
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

### 4. Remove pnpm Files
```bash
rm -rf node_modules pnpm-lock.yaml
```

### 5. Install Dependencies
```bash
bun install
```

### 6. Install Playwright Browsers
```bash
bun run playwright install
```

## Testing the Migration

```bash
# Test development server
bun run dev

# Test build
bun run build

# Test production server
bun run start

# Test Playwright tests
bun run test

# Test custom scripts
bun run compress-games
bun run detect-leaderboards
```

## Environment Variables

No changes needed! Bun automatically loads:
- `.env`
- `.env.local`
- `.env.development`
- `.env.production`
- `.env.test`

## Compatibility Notes

### ✅ Fully Compatible
- Next.js 16.2.1
- React 19.2.4
- Playwright
- PostCSS / Tailwind CSS
- CJS scripts (`require()`)
- ESM modules (`import`)
- All Node.js built-in APIs used in this project:
  - `fs`
  - `path`
  - `zlib`
  - `util`

### ⚠️ Potential Issues
- Native modules (none in this project)
- Some Node.js APIs with subtle differences (none used here)

## Performance Improvements

| Metric | Expected Improvement |
|--------|---------------------|
| Install time | 3-6x faster |
| Dev server startup | 2-3x faster |
| Build time | 2x faster |
| Script execution | 2-3x faster |

## CI/CD Updates

### GitHub Actions
```yaml
- name: Setup Bun
  uses: oven-sh/setup-bun@v1
  with:
    bun-version: latest

- name: Install dependencies
  run: bun install

- name: Build
  run: bun run build

- name: Test
  run: bun run test
```

### Vercel
Set in project settings:
- **Build Command:** `bun run build`
- **Dev Command:** `bun run dev`
- **Install Command:** `bun install`

## Rollback

If you need to revert:

```bash
# Restore backups
cp package.json.bak package.json
cp pnpm-lock.yaml.bak pnpm-lock.yaml

# Reinstall with pnpm
rm -rf node_modules
pnpm install
```

## Useful Bun Commands

```bash
# Run a one-liner
bun -e "console.log('Hello from Bun')"

# Run a TypeScript file directly
bun run script.ts

# Install a package
bun add <package>

# Install a dev dependency
bun add -d <package>

# Remove a package
bun remove <package>

# Update dependencies
bun update

# Check for outdated packages
bun outdated
```

## Troubleshooting

### Issue: Command not found: bun
**Solution:** Add Bun to your PATH:
```bash
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
```

### Issue: Playwright tests fail
**Solution:** Install browsers:
```bash
bun run playwright install
```

### Issue: Build fails
**Solution:** Clear cache and reinstall:
```bash
rm -rf node_modules bun.lockb
bun install
```

### Issue: Environment variables not loading
**Solution:** Verify `.env.local` exists and has correct format:
```bash
cat .env.local
```

## Resources

- [Bun Documentation](https://bun.sh/docs)
- [Bun vs Node.js](https://bun.sh/docs/runtime/nodejs-apis)
- [Next.js on Bun](https://bun.sh/guides/ecosystem/nextjs)
- [Bun GitHub](https://github.com/oven-sh/bun)

---

**Last Updated:** 2026-03-28
