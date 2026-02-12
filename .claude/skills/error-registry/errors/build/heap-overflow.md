# Error: Heap Overflow

**ID**: ERR-005
**Category**: build
**Severity**: high
**Occurrences**: 4
**Last Seen**: 2026-02-12

## Signature

```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
FATAL ERROR: Ineffective mark-compacts near heap limit
npm run build fails with memory error
TypeScript compilation runs out of memory
```

## Root Cause

Default Node.js heap size (512MB-2GB) is too small for CircleTel's large TypeScript codebase:
- 300+ React components
- 150+ API routes
- 200+ TypeScript files
- Large Supabase type definitions

## Solution

Use memory-optimized scripts with increased heap limit:

```json
// package.json
{
  "scripts": {
    "dev": "next dev",
    "dev:memory": "NODE_OPTIONS='--max-old-space-size=8192' next dev",
    "build": "next build",
    "build:memory": "NODE_OPTIONS='--max-old-space-size=8192' next build",
    "type-check": "tsc --noEmit",
    "type-check:memory": "NODE_OPTIONS='--max-old-space-size=4096' tsc --noEmit"
  }
}
```

### Memory Settings Guide

| Command | Heap Size | Use Case |
|---------|-----------|----------|
| `dev:memory` | 8GB | Development server |
| `build:memory` | 8GB | Production build |
| `type-check:memory` | 4GB | Type checking |
| `build:ci` | 6GB | CI/CD (limited resources) |

## Prevention

1. **Always use `:memory` variants** of commands for CircleTel
2. **Add to CLAUDE.md** so new developers know
3. **Update CI/CD** to use memory-optimized commands

### Vercel Configuration

```json
// vercel.json
{
  "buildCommand": "npm run build:memory"
}
```

### GitHub Actions

```yaml
- name: Build
  run: npm run build:memory
  env:
    NODE_OPTIONS: '--max-old-space-size=6144'
```

## Quick Fix

```bash
# Instead of:
npm run build

# Use:
npm run build:memory

# Or inline:
NODE_OPTIONS='--max-old-space-size=8192' npm run build
```

## Validation Checklist

- [ ] Build succeeds with `npm run build:memory`
- [ ] CI/CD uses memory-optimized command
- [ ] Vercel deployment successful
- [ ] Development uses `dev:memory`

## Related

- **File**: `package.json` scripts section
- **Documentation**: CLAUDE.md Essential Commands
- **Pattern**: Memory management for large TypeScript projects

## Occurrences Log

| Date | Command | Resolution Time |
|------|---------|-----------------|
| 2026-02-12 | npm run build | 2min |
| 2026-02-10 | npm run type-check | 2min |
| 2026-02-08 | npm run dev | 2min |
