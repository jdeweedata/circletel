# Memory Management Guide - CircleTel Next.js

> **Purpose**: Prevent and resolve "JavaScript heap out of memory" errors in the CircleTel platform.

---

## Table of Contents
1. [Understanding the Problem](#understanding-the-problem)
2. [Quick Fixes](#quick-fixes)
3. [Long-Term Solutions](#long-term-solutions)
4. [Monitoring & Prevention](#monitoring--prevention)
5. [Troubleshooting](#troubleshooting)

---

## Understanding the Problem

### Why Memory Errors Occur

CircleTel is a **large-scale enterprise application** with:
- **87 npm dependencies** (Radix UI, React Query, Supabase, PWA, Charts, etc.)
- **50+ TypeScript files** with complex type definitions
- **Multiple integrations** (Strapi CMS, Zoho, MTN APIs, Google Maps)
- **PWA service worker** with extensive runtime caching
- **Admin RBAC system** with 100+ permissions

**Default Node.js heap limits:**
- 32-bit systems: ~512MB
- 64-bit systems: ~1.4-2GB
- CircleTel needs: **4-8GB** during build/compilation

### When Errors Happen

❌ **Common scenarios:**
1. Running `npm run dev` after fresh `git pull` (full recompilation)
2. Running `npm run build` without memory flags
3. TypeScript compilation with large type definitions
4. Webpack bundling all dependencies simultaneously
5. Multiple concurrent processes (dev server + type-check + lint)

---

## Quick Fixes

### 1. Use Memory-Optimized Commands (Recommended)

**Always use these instead of standard commands:**

```bash
# Development
npm run dev:memory          # Instead of: npm run dev

# Production build
npm run build:memory        # Instead of: npm run build

# Type checking (if memory issues occur)
node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit
```

**How it works:**
- `--max-old-space-size=8192` allocates **8GB** of heap memory
- Sufficient for all CircleTel compilation tasks
- Safe on systems with 16GB+ RAM

### 2. Emergency Fix (If Server Crashes Mid-Development)

```bash
# 1. Stop all Node processes
taskkill /F /IM node.exe

# 2. Clear Next.js cache
Remove-Item -Recurse -Force .next

# 3. Restart with memory allocation
npm run dev:memory
```

### 3. Vercel Deployment (No Changes Needed)

Vercel automatically allocates sufficient memory for builds:
- **Hobby Plan**: 3GB max
- **Pro Plan**: 6GB max
- **Enterprise**: Unlimited

CircleTel uses **Pro Plan** → no memory issues in production.

---

## Long-Term Solutions

### Solution 1: Optimize Dependencies (High Impact)

**Current dependencies: 87 packages, ~500MB node_modules**

#### Audit Unused Dependencies

```bash
# Check for unused packages
npm run build:memory -- --analyze

# Review bundle analyzer output
# Look for: duplicate packages, large libraries, unused code
```

#### Potential Optimizations

| Package | Size | Alternative | Savings |
|---------|------|-------------|---------|
| `recharts` | ~2MB | `chart.js` (lighter) | 1.5MB |
| Multiple `@radix-ui/*` | ~5MB | Use only required components | 2-3MB |
| `framer-motion` + `motion` | ~1MB | Keep only one (duplicate!) | 500KB |
| `@tabler/icons-react` | ~3MB | Tree-shake or use SVG imports | 2MB |

**Action items:**
1. Remove duplicate `motion` package (keep `framer-motion`)
2. Audit `@radix-ui/*` usage (currently 30+ packages)
3. Consider lazy-loading `recharts` for admin dashboard only

### Solution 2: Code Splitting (Medium Impact)

**Current config already implements Google Maps code splitting** ✅

Extend to other heavy modules:

```js
// next.config.js - Add to webpack config
splitChunks: {
  cacheGroups: {
    // Admin panel (lazy load)
    admin: {
      test: /[\\/]app[\\/]admin/,
      priority: 25,
      chunks: 'async',
      reuseExistingChunk: true
    },
    // Charts (lazy load)
    charts: {
      test: /[\\/]node_modules[\\/](recharts|d3-.*)/,
      priority: 20,
      chunks: 'async',
      name: 'charts'
    },
    // Strapi CMS
    strapi: {
      test: /[\\/]node_modules[\\/]@strapi/,
      priority: 20,
      chunks: 'async',
      name: 'strapi'
    }
  }
}
```

### Solution 3: TypeScript Optimization (Medium Impact)

**Current issue: `ignoreBuildErrors: true` masks type issues** ⚠️

```typescript
// tsconfig.json - Add these optimizations
{
  "compilerOptions": {
    // Reduce memory usage
    "incremental": true,           // Cache compilation results
    "tsBuildInfoFile": ".tsbuildinfo",

    // Skip lib checking (saves ~200MB)
    "skipLibCheck": true,          // Already enabled ✅

    // Parallel type checking
    "assumeChangesOnlyAffectDirectDependencies": true
  }
}
```

### Solution 4: Environment-Specific Limits

**Create `.nvmrc` for consistent Node version:**

```bash
# .nvmrc
v22.14.0
```

**Update `package.json` with flexible memory allocation:**

```json
{
  "scripts": {
    "dev": "next dev",
    "dev:memory": "node --max-old-space-size=8192 ./node_modules/next/dist/bin/next dev",
    "dev:low": "node --max-old-space-size=4096 ./node_modules/next/dist/bin/next dev",
    "build": "next build",
    "build:memory": "node --max-old-space-size=8192 ./node_modules/next/dist/bin/next build",
    "build:ci": "node --max-old-space-size=6144 ./node_modules/next/dist/bin/next build",
    "type-check": "tsc --noEmit",
    "type-check:memory": "node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit"
  }
}
```

---

## Monitoring & Prevention

### 1. Pre-Commit Memory Check (Automated)

**Create `.husky/pre-commit` hook:**

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "Running type check with memory allocation..."
node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit

if [ $? -ne 0 ]; then
  echo "❌ Type check failed. Fix errors before committing."
  exit 1
fi

echo "✅ Type check passed!"
```

### 2. Memory Usage Dashboard (PowerShell Script)

**Create `scripts/check-memory.ps1`:**

```powershell
# Check current Node.js processes and memory usage
Write-Host "=== CircleTel Memory Monitor ===" -ForegroundColor Cyan

# Node processes
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "`nRunning Node.js processes:" -ForegroundColor Yellow
    $nodeProcesses | Select-Object Id, @{Name='MemoryMB';Expression={[math]::Round($_.WorkingSet64/1MB, 2)}}, StartTime | Format-Table

    $totalMemory = ($nodeProcesses | Measure-Object -Property WorkingSet64 -Sum).Sum / 1MB
    Write-Host "Total Node.js memory usage: $([math]::Round($totalMemory, 2)) MB" -ForegroundColor Green
} else {
    Write-Host "`nNo Node.js processes running." -ForegroundColor Gray
}

# System memory
$os = Get-CimInstance Win32_OperatingSystem
$totalRAM = [math]::Round($os.TotalVisibleMemorySize/1MB, 2)
$freeRAM = [math]::Round($os.FreePhysicalMemory/1MB, 2)
$usedRAM = $totalRAM - $freeRAM

Write-Host "`nSystem Memory:" -ForegroundColor Yellow
Write-Host "  Total: $totalRAM GB"
Write-Host "  Used: $usedRAM GB"
Write-Host "  Free: $freeRAM GB"

# Recommendations
if ($freeRAM -lt 4) {
    Write-Host "`n⚠️  WARNING: Low system memory! Close other applications." -ForegroundColor Red
} elseif ($freeRAM -lt 8) {
    Write-Host "`n⚠️  CAUTION: Limited memory available. Use :memory scripts." -ForegroundColor Yellow
} else {
    Write-Host "`n✅ Sufficient memory available." -ForegroundColor Green
}
```

**Usage:**
```bash
powershell -File scripts/check-memory.ps1
```

### 3. Build-Time Warnings

**Update `next.config.js` to warn about memory:**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... existing config

  // Add build-time memory warning
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      const memUsage = process.memoryUsage();
      const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);

      console.log(`\n📊 Memory Usage: ${heapUsedMB}MB / ${heapTotalMB}MB`);

      if (heapUsedMB > heapTotalMB * 0.9) {
        console.warn('⚠️  WARNING: High memory usage detected!');
        console.warn('   Consider using: npm run build:memory');
      }
    }

    // ... existing webpack config
    return config;
  }
};
```

---

## Troubleshooting

### Error: "FATAL ERROR: Reached heap limit Allocation failed"

**Symptoms:**
- Build/dev server crashes mid-compilation
- Error message shows `JavaScript heap out of memory`

**Solutions (in order of preference):**

1. **Use memory-optimized scripts:**
   ```bash
   npm run dev:memory
   npm run build:memory
   ```

2. **Increase memory manually:**
   ```bash
   # Windows PowerShell
   $env:NODE_OPTIONS="--max-old-space-size=8192"
   npm run dev

   # Linux/Mac
   export NODE_OPTIONS="--max-old-space-size=8192"
   npm run dev
   ```

3. **Clear cache and rebuild:**
   ```bash
   Remove-Item -Recurse -Force .next
   Remove-Item -Recurse -Force node_modules/.cache
   npm run dev:memory
   ```

4. **Check for memory leaks:**
   ```bash
   node --expose-gc --inspect ./node_modules/next/dist/bin/next dev
   # Open chrome://inspect in Chrome
   # Take heap snapshots to identify leaks
   ```

### Error: "npm ERR! code ELIFECYCLE"

**Cause:** Build script failed, possibly due to memory

**Solution:**
```bash
# Clean install
Remove-Item -Recurse -Force node_modules
npm install
npm run build:memory
```

### Slow TypeScript Compilation

**Symptoms:**
- `tsc --noEmit` takes 5+ minutes
- Editor (VS Code) becomes unresponsive

**Solutions:**

1. **Use project references (advanced):**
   ```json
   // tsconfig.json
   {
     "references": [
       { "path": "./tsconfig.app.json" },
       { "path": "./tsconfig.node.json" }
     ]
   }
   ```

2. **Disable unused type checks:**
   ```json
   {
     "compilerOptions": {
       "skipLibCheck": true,  // Skip node_modules type checking
       "noUnusedLocals": false,  // Disable during development
       "noUnusedParameters": false
     }
   }
   ```

3. **Incremental compilation:**
   ```bash
   # First run (slow)
   npm run type-check

   # Subsequent runs (fast, uses .tsbuildinfo cache)
   npm run type-check
   ```

---

## Best Practices

### Development Workflow

✅ **DO:**
- Use `npm run dev:memory` for daily development
- Run `npm run type-check` before committing (automated in pre-commit hook)
- Close unused applications when building (free up RAM)
- Use incremental builds (don't delete `.next` unless necessary)

❌ **DON'T:**
- Use `npm run dev` after fresh `git pull` (use `:memory` variant)
- Run multiple builds simultaneously (dev + build)
- Ignore memory warnings in console
- Skip pre-commit type checking

### Team Guidelines

**For developers with limited RAM (8GB systems):**
```bash
# Use lower memory allocation (4GB)
npm run dev:low

# Or set environment variable
$env:NODE_OPTIONS="--max-old-space-size=4096"
npm run dev
```

**For CI/CD pipelines:**
```yaml
# .github/workflows/deploy.yml
- name: Build Next.js
  run: npm run build:ci
  env:
    NODE_OPTIONS: --max-old-space-size=6144
```

**For production deployments:**
- Vercel handles memory automatically ✅
- No configuration needed

---

## Performance Metrics

### Target Benchmarks

| Task | Time | Memory |
|------|------|--------|
| `npm run dev:memory` (cold start) | < 30s | 2-4GB |
| `npm run dev:memory` (hot reload) | < 5s | 1-2GB |
| `npm run build:memory` | < 3min | 4-6GB |
| `npm run type-check` | < 1min | 1-2GB |

### Monitoring Commands

```bash
# Check build performance
npm run build:memory -- --profile

# Analyze bundle size
npm run build:memory -- --analyze

# Memory usage during build
powershell -File scripts/check-memory.ps1
```

---

## Related Documentation

- **Pre-Commit Checklist**: `/CLAUDE.md#development-workflow`
- **Deployment Guide**: `/docs/deployment/DEPLOYMENT_GUIDE.md`
- **TypeScript Config**: `/tsconfig.json`
- **Next.js Config**: `/next.config.js`

---

**Last Updated**: 2025-10-19
**Maintained By**: Development Team
**Version**: 1.0
