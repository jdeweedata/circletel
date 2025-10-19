# Memory Management Quick Reference

> **One-page cheat sheet for CircleTel memory issues**

---

## 🚨 Emergency Fixes

### Memory Error Right Now?

```bash
# 1. Kill all Node processes
taskkill /F /IM node.exe

# 2. Clear cache
Remove-Item -Recurse -Force .next

# 3. Restart with memory
npm run dev:memory
```

---

## 📋 Daily Commands

| Task | Standard Command | Memory-Safe Command |
|------|-----------------|---------------------|
| **Development** | `npm run dev` | `npm run dev:memory` ⭐ |
| **Build** | `npm run build` | `npm run build:memory` ⭐ |
| **Type Check** | `npm run type-check` | `npm run type-check:memory` |
| **Low RAM (8GB)** | - | `npm run dev:low` |
| **CI/CD** | - | `npm run build:ci` |

**⭐ = Recommended for CircleTel**

---

## 🔍 Diagnostics

### Check Memory Status

```bash
npm run memory:check
```

**Output shows:**
- Node.js process memory usage
- System RAM availability
- Recommended commands
- Next.js cache size

---

## 🛠️ Utility Commands

```bash
# Check memory before starting
npm run memory:check

# Clean cache (if build is slow)
npm run clean

# Analyze bundle size
npm run analyze
```

---

## 🎯 When to Use Each Script

### `dev:memory` (8GB allocation)
- ✅ After `git pull` (full recompilation)
- ✅ Daily development (safest)
- ✅ Adding new dependencies
- ✅ Large TypeScript changes

### `dev:low` (4GB allocation)
- ✅ Systems with 8-16GB RAM
- ✅ Other applications open
- ✅ Hot reload (already compiled)

### `dev` (default ~2GB)
- ⚠️ Only if you have 32GB+ RAM
- ⚠️ Quick hot reloads only
- ❌ **NOT recommended for CircleTel**

---

## ⚡ Pre-Commit Checklist

**Required before EVERY commit:**

```bash
# 1. Type check (with memory if needed)
npm run type-check:memory

# 2. Fix errors
# (fix any TypeScript errors shown)

# 3. Verify
npm run type-check

# 4. Commit
git add .
git commit -m "your message"
```

**Why?** Prevents Vercel build failures.

---

## 🔧 Troubleshooting Matrix

| Symptom | Solution | Command |
|---------|----------|---------|
| "heap out of memory" | Use memory scripts | `npm run dev:memory` |
| Build crashes mid-way | Clear cache + rebuild | `npm run clean && npm run build:memory` |
| TypeScript slow (5+ min) | Use incremental mode | `npm run type-check:memory` |
| System freezes | Close apps, check RAM | `npm run memory:check` |
| Vercel build fails | Run local build first | `npm run build:memory` |

---

## 📊 Memory Requirements

| System RAM | Recommended Script | Max Concurrent Tasks |
|------------|-------------------|----------------------|
| 8 GB | `dev:low` | 1 (dev OR type-check) |
| 16 GB | `dev:memory` | 2 (dev + type-check) |
| 32 GB+ | `dev:memory` | Unlimited |

**CircleTel needs 4-8GB for builds** → Most developers should use `:memory` scripts.

---

## 🎓 Environment Variables

### Set Globally (Applies to ALL npm commands)

**Windows PowerShell:**
```powershell
$env:NODE_OPTIONS="--max-old-space-size=8192"
npm run dev  # Now uses 8GB
```

**Linux/Mac:**
```bash
export NODE_OPTIONS="--max-old-space-size=8192"
npm run dev  # Now uses 8GB
```

**Reset:**
```powershell
Remove-Item Env:\NODE_OPTIONS
```

---

## 🚀 Performance Targets

| Task | Expected Time | Expected Memory |
|------|---------------|-----------------|
| `dev:memory` (cold) | < 30s | 2-4GB |
| `dev:memory` (hot reload) | < 5s | 1-2GB |
| `build:memory` | < 3min | 4-6GB |
| `type-check` | < 1min | 1-2GB |

**Slower than this?** Run `npm run memory:check` to diagnose.

---

## 📖 Full Documentation

**See:** `docs/guides/MEMORY_MANAGEMENT_GUIDE.md`

**Includes:**
- Dependency optimization strategies
- Code splitting configuration
- TypeScript performance tuning
- Automated monitoring setup

---

## 🔗 Quick Links

| Topic | File |
|-------|------|
| Memory guide | `docs/guides/MEMORY_MANAGEMENT_GUIDE.md` |
| Package scripts | `package.json:5-18` |
| Next.js config | `next.config.js` |
| TypeScript config | `tsconfig.json` |
| Memory monitor | `scripts/check-memory.ps1` |

---

**Last Updated**: 2025-10-19
**Version**: 1.0
**For**: CircleTel Next.js Platform
