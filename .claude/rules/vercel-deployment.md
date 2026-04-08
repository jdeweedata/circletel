---
paths:
  - "vercel.json"
  - ".github/**"
  - "next.config.*"
---

# Vercel Deployment Patterns

**Trigger**: Checking deployment status, triggering builds, debugging missing deployments
**Source**: 1 session (2026-03-31) — multiple pushes didn't trigger deployments; blocked production

---

## Rule: Rapid Successive Pushes May Not All Trigger Deployments

When multiple commits are pushed to `main` in quick succession (within minutes), Vercel may only queue a deployment for the first push. Subsequent pushes are silently skipped.

**Symptom**: Vercel dashboard shows the old commit; new commits are on `origin/main` but no build triggered.

**Diagnosis:**
```bash
# Check latest Vercel deployment commit vs git HEAD
curl -s "https://api.vercel.com/v6/deployments?projectId=PROJECT_ID&limit=1" \
  -H "Authorization: Bearer $VERCEL_TOKEN" | python3 -c "
import sys, json
d = json.load(sys.stdin)['deployments'][0]
print('Vercel building:', d.get('meta', {}).get('githubCommitSha','?')[:8])
print('State:', d['state'])
"
git log --oneline -1  # Compare to this
```

**Fix: Manually trigger from latest commit:**
```bash
# Step 1: Get GitHub repo ID from an existing deployment
curl -s "https://api.vercel.com/v13/deployments/DEPLOY_ID" \
  -H "Authorization: Bearer $VERCEL_TOKEN" | python3 -c "
import sys, json; d = json.load(sys.stdin)
print(d['meta'].get('githubRepoId'))
"

# Step 2: Trigger new production deployment
curl -s -X POST "https://api.vercel.com/v13/deployments" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "circletel",
    "project": "PROJECT_ID",
    "gitSource": {
      "type": "github",
      "repoId": "REPO_ID",
      "ref": "main",
      "sha": "FULL_COMMIT_SHA"
    },
    "target": "production"
  }' | python3 -c "
import sys, json; d = json.load(sys.stdin)
print('Deployment ID:', d.get('id'))
print('URL:', d.get('url'))
print('State:', d.get('readyState', d.get('status')))
"
```

---

## CircleTel Project Reference

| Field | Value |
|-------|-------|
| Project ID | `prj_5ayAVGSieKH0XHTa5gqS3jujEPtp` |
| GitHub Repo ID | `978274630` |
| Production URL | https://www.circletel.co.za |
| Staging URL | https://circletel-staging.vercel.app |

---

## Monitor Deployment Progress

```bash
# Poll until READY or ERROR
DEPLOY_ID="dpl_xxx"
for i in $(seq 1 30); do
  STATE=$(curl -s "https://api.vercel.com/v13/deployments/$DEPLOY_ID" \
    -H "Authorization: Bearer $VERCEL_TOKEN" | python3 -c "
import sys,json; d=json.load(sys.stdin); print(d.get('readyState', d.get('status','?')))")
  echo "$(date +%H:%M:%S) — $STATE"
  [[ "$STATE" == "READY" || "$STATE" == "ERROR" || "$STATE" == "CANCELED" ]] && break
  sleep 30
done
```

---

## Get Build Error Logs

```bash
curl -s "https://api.vercel.com/v2/deployments/$DEPLOY_ID/events" \
  -H "Authorization: Bearer $VERCEL_TOKEN" | python3 -c "
import sys, json
for line in sys.stdin:
    line = line.strip()
    if not line: continue
    try:
        e = json.loads(line)
        text = e.get('text','') or e.get('payload',{}).get('text','')
        if text and any(k in text.lower() for k in ['error','fatal','sigabrt','oom','heap','failed','exit']):
            print(text)
    except: pass
"
```

---

## Common Build Failures

| Error | Cause | Fix |
|-------|-------|-----|
| `SIGABRT` + `heap out of memory` | Heap limit too low for machine RAM | Increase `--max-old-space-size` in `vercel.json` |
| `incorrect_git_source_info` | Wrong `repoId` in trigger payload | Get `repoId` from existing deployment meta, not repo slug |
| `State: ERROR` immediately | Build command failed at startup | Check `vercel.json` buildCommand syntax |

---

## DO

- Check `VERCEL_TOKEN` is set before querying: `echo $VERCEL_TOKEN`
- Use `repoId` (numeric, e.g. `978274630`) not repo slug in deployment trigger
- Use full commit SHA (40 chars) in `gitSource.sha`
- Set `"target": "production"` to promote to production domain

## DON'T

- Assume all pushes to main trigger Vercel builds
- Use repo slug as `repoId` — it must be the numeric GitHub repo ID
