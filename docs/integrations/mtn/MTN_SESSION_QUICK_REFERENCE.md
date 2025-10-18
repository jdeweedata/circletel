# MTN Session Management - Quick Reference

**Last Updated**: 2025-10-17
**Approach**: Validation-Only Monitoring

---

## 🚀 Quick Commands

### Check Session Status
```bash
npx tsx scripts/validate-mtn-session.ts
```

### Manual Re-Authentication (When Expired)
```bash
# 1. Authenticate (solves reCAPTCHA)
npx tsx scripts/test-mtn-sso-auth.ts --manual

# 2. Export to base64
npx tsx scripts/export-session-env.ts --output-only

# 3. Update GitHub Secret
gh secret set MTN_SESSION --body "<paste-base64-here>"
```

---

## 📊 Session Information

| Property | Value |
|----------|-------|
| **Tracked Expiry** | ~60 minutes (estimate) |
| **Actual Duration** | >2 hours (observed) |
| **Validation Frequency** | Every 4 hours |
| **Manual Re-Auth** | When session expires (unknown frequency) |

---

## 🔍 Monitoring

### GitHub Actions
- **Workflow**: `.github/workflows/validate-mtn-session.yml`
- **URL**: `https://github.com/YOUR_ORG/circletel-nextjs/actions`
- **Schedule**: Every 4 hours
- **On Failure**: Creates GitHub issue with re-auth instructions

### Manual Check
```bash
# Pretty output
npx tsx scripts/validate-mtn-session.ts

# JSON output (for scripts)
npx tsx scripts/validate-mtn-session.ts --json
```

---

## 📝 Key Files

| File | Purpose |
|------|---------|
| `scripts/validate-mtn-session.ts` | Validation script (no browser) |
| `scripts/test-mtn-sso-auth.ts` | Manual authentication |
| `scripts/export-session-env.ts` | Export to base64 |
| `.github/workflows/validate-mtn-session.yml` | Validation workflow |
| `docs/integrations/MTN_SESSION_MANAGEMENT.md` | Full documentation |
| `docs/integrations/mtn/MTN_SESSION_LIFESPAN_FINDINGS.md` | Research findings |

---

## ⚠️ When Session Expires

**GitHub will create an issue automatically:**

1. Check email for GitHub notification
2. Go to issue for re-auth instructions
3. Run 3-step re-auth process (above)
4. Close issue (next validation auto-closes)

---

## 🔐 GitHub Secret

**Name**: `MTN_SESSION`
**Value**: Base64-encoded session JSON
**Location**: `https://github.com/YOUR_ORG/circletel-nextjs/settings/secrets/actions`

---

## 🎯 Exit Codes (validate-mtn-session.ts)

| Code | Meaning |
|------|---------|
| 0 | Session valid |
| 1 | Session invalid/expired |
| 2 | Validation error |

---

## 📞 Troubleshooting

### Session shows expired but still works
**Normal** - Our tracked expiry is conservative, actual server timeout is longer

### Validation script fails
```bash
# Check if session exists
ls -la .cache/mtn-session.json

# Check GitHub Secret
gh secret list | grep MTN_SESSION

# Re-authenticate
npx tsx scripts/test-mtn-sso-auth.ts --manual
```

### GitHub Actions workflow not running
- Check GitHub → Settings → Actions → Enable workflows
- Check workflow file exists: `.github/workflows/validate-mtn-session.yml`
- Manually trigger: GitHub → Actions → Validate MTN Session → Run workflow

---

**For full documentation**: `docs/integrations/MTN_SESSION_MANAGEMENT.md`
