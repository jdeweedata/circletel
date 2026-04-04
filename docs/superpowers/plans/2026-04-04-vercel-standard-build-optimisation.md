# Vercel Standard Build Machine Optimisation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the immediate OOM/SIGABRT crash and reduce build memory + time after switching from Enhanced (16 GB) to Standard (4 vCPU / 8 GB) Vercel build machine.

**Architecture:** Three config files need exact-value changes (no logic changes); one rules doc needs its ✅/❌ examples flipped. Changes are independent and can be applied in any order, but Task 1 is highest priority — it unblocks every deployment.

**Tech Stack:** Next.js 15.1.9, Vercel, GitHub Actions, Node.js

**Spec:** `docs/superpowers/specs/2026-04-04-vercel-standard-build-optimisation-design.md`

---

## File Map

| File | Change |
|---|---|
| `vercel.json` | Heap: 12288 → 6144 in `buildCommand` |
| `next.config.js` | Expand `serverExternalPackages` (1 → 11), `optimizePackageImports` (9 → 13), update comment |
| `.github/workflows/pr-checks.yml` | Comment text only (no logic) |
| `.claude/rules/coding-standards.md` | Flip ✅/❌ heap examples, update machine reference paragraph |

---

## Task 1: Fix the OOM — Lower Heap in `vercel.json`

**Files:**
- Modify: `vercel.json:3`

- [ ] **Step 1: Verify the current value**

```bash
grep -o 'max-old-space-size=[0-9]*' vercel.json
```

Expected output: `max-old-space-size=12288`

- [ ] **Step 2: Apply the change**

In `vercel.json`, line 3, replace:
```json
"buildCommand": "NODE_OPTIONS='--max-old-space-size=12288' next build",
```
with:
```json
"buildCommand": "NODE_OPTIONS='--max-old-space-size=6144' next build",
```

- [ ] **Step 3: Verify the CI gate will pass**

```bash
HEAP=$(grep -o 'max-old-space-size=[0-9]*' vercel.json | grep -o '[0-9]*')
echo "Heap: ${HEAP}MB"
[ "$HEAP" -ge 6144 ] && echo "✅ CI gate passes" || echo "❌ CI gate fails"
```

Expected output:
```
Heap: 6144MB
✅ CI gate passes
```

- [ ] **Step 4: Commit**

```bash
git add vercel.json
git commit -m "fix(build): lower heap 12288→6144MB for Standard build machine (8GB)

Was tuned for Enhanced Build Machine (16GB). Standard machine has 8GB
total RAM — 12GB heap caused immediate SIGABRT on every deployment."
```

---

## Task 2: Reduce Webpack Bundle — Update `next.config.js`

**Files:**
- Modify: `next.config.js:88` (serverExternalPackages)
- Modify: `next.config.js:90-100` (optimizePackageImports)
- Modify: `next.config.js:103` (comment)

### Step 2a — Expand `serverExternalPackages`

- [ ] **Step 1: Verify no package will appear in both lists (conflict check)**

```bash
node -e "
const ext = ['sanity','puppeteer-core','@sparticuz/chromium-min','cheerio','xml2js','adm-zip','resend','@react-email/components','@react-email/render','@mendable/firecrawl-js','@modelcontextprotocol/sdk'];
const opt = ['@radix-ui/react-icons','react-icons','lucide-react','@phosphor-icons/react','date-fns','@tanstack/react-table','recharts','zod','@hookform/resolvers','@tabler/icons-react','framer-motion','motion','@tanstack/react-query'];
const conflict = ext.filter(p => opt.includes(p));
conflict.length ? console.log('❌ Conflicts:', conflict) : console.log('✅ No conflicts');
"
```

Expected output: `✅ No conflicts`

- [ ] **Step 2: Replace `serverExternalPackages` in `next.config.js`**

Find this line:
```js
  serverExternalPackages: ['sanity'],
```

Replace with:
```js
  serverExternalPackages: [
    'sanity',
    'puppeteer-core',
    '@sparticuz/chromium-min',
    'cheerio',
    'xml2js',
    'adm-zip',
    'resend',
    '@react-email/components',
    '@react-email/render',
    '@mendable/firecrawl-js',
    '@modelcontextprotocol/sdk',
  ],
```

### Step 2b — Expand `optimizePackageImports`

- [ ] **Step 3: Replace the `optimizePackageImports` array**

Find this block:
```js
    optimizePackageImports: [
      '@radix-ui/react-icons',
      'react-icons',
      'lucide-react',
      '@phosphor-icons/react',
      'date-fns',
      '@tanstack/react-table',
      'recharts',
      'zod',
      '@hookform/resolvers'
    ],
```

Replace with:
```js
    optimizePackageImports: [
      '@radix-ui/react-icons',
      'react-icons',
      'lucide-react',
      '@phosphor-icons/react',
      '@tabler/icons-react',
      'date-fns',
      '@tanstack/react-table',
      'recharts',
      'zod',
      '@hookform/resolvers',
      'framer-motion',
      'motion',
      '@tanstack/react-query',
    ],
```

### Step 2c — Update stale comment

- [ ] **Step 4: Update the `cpus` comment**

Find this line:
```js
    // Use 1 core with 12GB heap (Enhanced Build Machine: 16GB total, leaves 3GB for worker + OS)
```

Replace with:
```js
    // Use 1 core with 6GB heap (Standard Build Machine: 8GB total, leaves ~2GB for worker + OS)
```

### Step 2d — Verify and commit

- [ ] **Step 5: Verify the file is valid JS**

```bash
node -e "require('./next.config.js')" && echo "✅ next.config.js parses OK" || echo "❌ Syntax error"
```

Expected output: `✅ next.config.js parses OK`

- [ ] **Step 6: Commit**

```bash
git add next.config.js
git commit -m "perf(build): expand serverExternalPackages and optimizePackageImports

serverExternalPackages: 1→11 (skip webpack bundling of heavy server-only
packages: puppeteer-core, chromium, cheerio, xml2js, adm-zip, resend,
react-email, firecrawl, mcp-sdk)

optimizePackageImports: 9→13 (add @tabler/icons-react, framer-motion,
motion, @tanstack/react-query for better tree-shaking)

Updates cpus comment to reference Standard 8GB machine."
```

---

## Task 3: Update CI Comment in `pr-checks.yml`

**Files:**
- Modify: `.github/workflows/pr-checks.yml:22`

- [ ] **Step 1: Find the line**

```bash
grep -n "Enhanced Build Machine" .github/workflows/pr-checks.yml
```

Expected output: `22:    # BLOCKING: these settings prevent Vercel OOM crashes (Enhanced Build Machine: 16GB)`

- [ ] **Step 2: Replace the comment**

Find:
```yaml
    # BLOCKING: these settings prevent Vercel OOM crashes (Enhanced Build Machine: 16GB)
```

Replace with:
```yaml
    # BLOCKING: these settings prevent Vercel OOM crashes (Standard Build Machine: 8GB)
```

- [ ] **Step 3: Verify no logic was changed**

```bash
grep -A5 "validate-build-config" .github/workflows/pr-checks.yml | grep -E "6144|cpus"
```

Expected output confirms the 6144 minimum and cpus check are still present and unchanged.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/pr-checks.yml
git commit -m "docs(ci): update build machine reference to Standard 8GB"
```

---

## Task 4: Update `coding-standards.md` — Flip Heap Examples

**Files:**
- Modify: `.claude/rules/coding-standards.md:148-165`

- [ ] **Step 1: Replace the ✅/❌ heap code block**

Find this block (lines 148–156):
```markdown
```json
// vercel.json
// ✅ CORRECT: 12GB heap + cpus:1 (Enhanced Build Machine: 16GB)
"buildCommand": "NODE_OPTIONS='--max-old-space-size=12288' next build"

// ❌ WRONG: 6GB — OOMs on large builds (was correct on old 8GB standard machines)
"buildCommand": "NODE_OPTIONS='--max-old-space-size=6144' next build"

// ❌ WRONG: gc-interval is NOT allowed in NODE_OPTIONS
"buildCommand": "NODE_OPTIONS='--max-old-space-size=12288 --gc-interval=100' next build"
```
```

Replace with:
```markdown
```json
// vercel.json
// ✅ CORRECT: 6GB heap + cpus:1 (Standard Build Machine: 8GB total, ~2GB left for worker + OS)
"buildCommand": "NODE_OPTIONS='--max-old-space-size=6144' next build"

// ❌ WRONG: 12GB — exceeds Standard machine RAM (8GB), causes immediate SIGABRT
"buildCommand": "NODE_OPTIONS='--max-old-space-size=12288' next build"

// ❌ WRONG: gc-interval is NOT allowed in NODE_OPTIONS
"buildCommand": "NODE_OPTIONS='--max-old-space-size=6144 --gc-interval=100' next build"
```
```

- [ ] **Step 2: Replace the explanation paragraph**

Find this block (lines 158–165):
```markdown
**Why 12288 + cpus:1 (Enhanced Build Machine):**
Vercel Enhanced Build Machine has 16GB total RAM. Memory budget:
- Main Node process: up to 12288MB
- 1 webpack worker (cpus:1): ~1.5GB
- OS overhead: ~0.5GB
- Total: ~14GB ✅ (2GB headroom)

With cpus:2, two workers add ~3GB → total ~15.5GB — too tight, risk SIGABRT.
```

Replace with:
```markdown
**Why 6144 + cpus:1 (Standard Build Machine):**
Vercel Standard Build Machine has 8GB total RAM. Memory budget:
- Main Node process: up to 6144MB
- 1 webpack worker (cpus:1): ~1.5GB
- OS overhead: ~0.5GB
- Total: ~8GB ✅ (tight but fits)

With cpus:2, two workers add ~3GB → total ~10GB — exceeds machine RAM, SIGABRT.
```

- [ ] **Step 3: Commit**

```bash
git add .claude/rules/coding-standards.md
git commit -m "docs(rules): update Vercel build config for Standard 8GB machine

Flip ✅/❌ heap examples — 6144MB is now correct, 12288MB causes OOM."
```

---

## Task 5: Validate All Changes and Trigger Deployment

- [ ] **Step 1: Run the full CI validation locally**

```bash
# Heap gate
HEAP=$(grep -o 'max-old-space-size=[0-9]*' vercel.json | grep -o '[0-9]*')
[ "$HEAP" -ge 6144 ] && echo "✅ Heap gate: ${HEAP}MB" || echo "❌ Heap gate FAIL: ${HEAP}MB"

# cpus gate
CPUS=$(grep -E '^\s*cpus:' next.config.js | grep -o '[0-9]*')
[ "$CPUS" -le 1 ] && echo "✅ cpus gate: ${CPUS}" || echo "❌ cpus gate FAIL: ${CPUS}"

# No conflict between serverExternalPackages and optimizePackageImports
node -e "
const config = require('./next.config.js');
console.log('serverExternalPackages count:', config.serverExternalPackages?.length ?? 'N/A');
console.log('optimizePackageImports count:', config.experimental?.optimizePackageImports?.length ?? 'N/A');
"
```

Expected output:
```
✅ Heap gate: 6144MB
✅ cpus gate: 1
serverExternalPackages count: 11
optimizePackageImports count: 13
```

- [ ] **Step 2: Check git log — confirm all 4 commits are present**

```bash
git log --oneline -5
```

Expected: four commits from this session visible.

- [ ] **Step 3: Push and trigger Vercel deployment**

```bash
git push origin main
```

Then monitor the deployment (substitute `$VERCEL_TOKEN` — should be in env):

```bash
sleep 15
curl -s "https://api.vercel.com/v6/deployments?projectId=prj_5ayAVGSieKH0XHTa5gqS3jujEPtp&limit=1" \
  -H "Authorization: Bearer $VERCEL_TOKEN" | python3 -c "
import sys, json
d = json.load(sys.stdin)['deployments'][0]
print('State:', d['state'])
print('Commit:', d.get('meta', {}).get('githubCommitSha','?')[:8])
"
```

Expected: `State: BUILDING` (then eventually `READY`).

- [ ] **Step 4: If Vercel does not pick up the push automatically, trigger manually**

```bash
SHA=$(git rev-parse HEAD)
curl -s -X POST "https://api.vercel.com/v13/deployments" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"circletel\",
    \"project\": \"prj_5ayAVGSieKH0XHTa5gqS3jujEPtp\",
    \"gitSource\": {
      \"type\": \"github\",
      \"repoId\": \"978274630\",
      \"ref\": \"main\",
      \"sha\": \"${SHA}\"
    },
    \"target\": \"production\"
  }" | python3 -c "
import sys, json; d = json.load(sys.stdin)
print('Deployment ID:', d.get('id'))
print('State:', d.get('readyState', d.get('status')))
"
```

- [ ] **Step 5: Confirm build succeeds — check logs for OOM absence**

Once state is `READY`, confirm no SIGABRT:
```bash
DEPLOY_ID="<id from step 4>"
curl -s "https://api.vercel.com/v2/deployments/$DEPLOY_ID/events" \
  -H "Authorization: Bearer $VERCEL_TOKEN" | python3 -c "
import sys, json
for line in sys.stdin:
    line = line.strip()
    if not line: continue
    try:
        e = json.loads(line)
        text = e.get('text','') or e.get('payload',{}).get('text','')
        if text and any(k in text.lower() for k in ['sigabrt','oom','heap','error','fatal']):
            print(text)
    except: pass
" || echo "No OOM/SIGABRT lines found ✅"
```

---

## Rollback

If the build still fails after these changes, check the error type:

| Error | Cause | Fix |
|---|---|---|
| `SIGABRT` / `heap out of memory` | App has grown beyond 6144MB webpack peak | See rollback note below |
| Module not found for externalized package | Package used in client component | Remove that package from `serverExternalPackages` |
| Build error unrelated to memory | Pre-existing issue masked by OOM | Fix the underlying error |

**Rollback for persistent OOM:** The only option on Standard 8 GB is to switch back to Enhanced in the Vercel dashboard. 6144 MB is the maximum safe heap for 8 GB — there is no higher value that fits.
