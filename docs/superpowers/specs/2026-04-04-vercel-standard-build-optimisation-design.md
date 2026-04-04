# Vercel Standard Build Machine Optimisation

**Date**: 2026-04-04
**Status**: Approved
**Goal**: Fix OOM crash and reduce build memory + time after switching from Enhanced (16 GB) to Standard (4 vCPU / 8 GB) build machine.

---

## Context

The project recently switched Vercel build machine from Enhanced (16 GB) to Standard (8 GB) to reduce cost. The current `vercel.json` sets `--max-old-space-size=12288` (12 GB heap), which was tuned for the Enhanced machine. On Standard 8 GB this causes an immediate SIGABRT — the heap limit exceeds total available RAM. Every deployment is currently failing.

---

## Memory Budget (Standard 8 GB)

| Component | MB |
|---|---|
| Node.js heap (proposed) | 6,144 |
| 1 webpack worker (`cpus: 1`) | ~1,024–1,536 |
| OS overhead | ~512 |
| **Total** | **~7,680–8,192 MB** ✓ |

6,144 MB is also the CI-enforced minimum in `pr-checks.yml` (heap must be ≥ 6,144 MB), so this value satisfies both the memory constraint and the gate.

---

## Changes

### 1. `vercel.json` — Heap Reduction (Critical)

**Change**: `--max-old-space-size=12288` → `--max-old-space-size=6144`

```json
"buildCommand": "NODE_OPTIONS='--max-old-space-size=6144' next build"
```

No other changes to `vercel.json`.

---

### 2. `next.config.js` — Webpack Bundle Reduction

#### 2a. Expand `serverExternalPackages`

Tells webpack to skip parsing/bundling these packages entirely. Node.js loads them natively at runtime. Currently only `sanity` is listed.

Add these server-only packages from the project's `dependencies`:

| Package | Reason |
|---|---|
| `puppeteer-core` | PDF generation (~80 MB+), server-only |
| `@sparticuz/chromium-min` | Companion binary to puppeteer-core, server-only |
| `cheerio` | HTML scraping (competitor analysis cron), server-only |
| `xml2js` | XML parsing, server-only |
| `adm-zip` | File operations, server-only |
| `resend` | Email sending SDK, server-only |
| `@react-email/components` | Email template components, server-only |
| `@react-email/render` | Email HTML renderer, server-only |
| `@mendable/firecrawl-js` | Web scraping client, server-only |
| `@modelcontextprotocol/sdk` | MCP SDK, server-only |

**Result**: `serverExternalPackages` grows from 1 to 11 entries. Webpack skips parsing ~200–400 MB of JS source across these packages, reducing peak compilation memory and time.

#### 2b. Expand `optimizePackageImports`

Tree-shakes barrel exports — webpack only bundles what is actually imported rather than the entire package.

Add to the existing list:

| Package | Reason |
|---|---|
| `@tabler/icons-react` | 3,000+ icon exports — same profile as `react-icons` already in list |
| `framer-motion` | Large animation library with many named exports |
| `motion` | Newer companion package to framer-motion, same barrel pattern |
| `@tanstack/react-query` | Large data-fetching library with many exports |

**Result**: `optimizePackageImports` grows from 9 to 13 entries.

#### 2c. Update stale comment

Line 103–104 in `next.config.js` reads:
```js
// Use 1 core with 12GB heap (Enhanced Build Machine: 16GB total, leaves 3GB for worker + OS)
cpus: 1,
```

Update to:
```js
// Use 1 core with 6GB heap (Standard Build Machine: 8GB total, leaves ~2GB for worker + OS)
cpus: 1,
```

---

### 3. `.github/workflows/pr-checks.yml` — Comment Update

Line 22 reads:
```yaml
# BLOCKING: these settings prevent Vercel OOM crashes (Enhanced Build Machine: 16GB)
```

Update to:
```yaml
# BLOCKING: these settings prevent Vercel OOM crashes (Standard Build Machine: 8GB)
```

No logic changes — the heap minimum (≥ 6,144 MB) and cpus maximum (≤ 1) remain correct for Standard 8 GB.

---

### 4. `.claude/rules/coding-standards.md` — Flip Heap Documentation

The `Vercel Build Configuration` section currently marks 6,144 MB as ❌ WRONG. This was correct when the project used Enhanced 16 GB, but is now the correct value for Standard 8 GB.

**Current:**
```
// ✅ CORRECT: 12GB heap + cpus:1 (Enhanced Build Machine: 16GB)
"buildCommand": "NODE_OPTIONS='--max-old-space-size=12288' next build"

// ❌ WRONG: 6GB — OOMs on large builds (was correct on old 8GB standard machines)
"buildCommand": "NODE_OPTIONS='--max-old-space-size=6144' next build"
```

**Updated:**
```
// ✅ CORRECT: 6GB heap + cpus:1 (Standard Build Machine: 8GB total, ~2GB left for worker + OS)
"buildCommand": "NODE_OPTIONS='--max-old-space-size=6144' next build"

// ❌ WRONG: 12GB — exceeds Standard machine RAM, causes immediate SIGABRT
"buildCommand": "NODE_OPTIONS='--max-old-space-size=12288' next build"
```

Also update the explanatory paragraph that follows to reference Standard 8 GB instead of Enhanced 16 GB.

---

## Files Changed

| File | Change Type |
|---|---|
| `vercel.json` | Heap: 12288 → 6144 |
| `next.config.js` | +10 serverExternalPackages, +4 optimizePackageImports, comment update |
| `.github/workflows/pr-checks.yml` | Comment update only |
| `.claude/rules/coding-standards.md` | Flip ✅/❌ heap values, update machine reference |

> 4 files — user confirmation required before implementation (project rule).

---

## Expected Outcome

| Metric | Before | After |
|---|---|---|
| Heap setting | 12,288 MB → SIGABRT on 8 GB | 6,144 MB → fits within 8 GB |
| Packages webpack parses | All dependencies | −10 heavy server-only packages |
| Tree-shaken packages | 9 | 13 |
| Build result | OOM crash | Completes |
| Build time | N/A (crashing) | Estimated 20–40% faster than crashing Enhanced builds |

---

## Out of Scope

- ISR / dynamic route restructuring (Approach C — higher risk, separate initiative)
- `experimental.turbotrace` — not confirmed available in Next.js 15.1.9; excluded to avoid introducing an unsupported config key
- Function memory/timeout changes in `vercel.json`
- Any changes to page routing or rendering strategy
