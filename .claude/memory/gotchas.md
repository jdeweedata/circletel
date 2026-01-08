# Gotchas & Lessons Learned

Things that have caused issues and how to resolve them.

---

## Authentication

### Dashboard 401 Errors
- **Symptom**: API routes return 401 even with valid session
- **Cause**: Only checking cookies, not Authorization header
- **Fix**: Check BOTH header AND cookies in API routes
- **Reference**: Commit `ac642e8`

### Auth Provider Exclusions
- **Symptom**: Admin/partner pages break with customer auth
- **Cause**: CustomerAuthProvider initializing on wrong pages
- **Fix**: Skip initialization for admin/partner paths
```typescript
if (pathname?.startsWith('/admin') || pathname?.startsWith('/partners')) {
  setLoading(false)
  return
}
```

---

## Build & Development

### Heap Memory Errors
- **Symptom**: `JavaScript heap out of memory`
- **Cause**: Default Node memory too low for large codebase
- **Fix**: Use `:memory` variants of commands
- **Prevention**: Always use `npm run dev:memory`, `npm run type-check:memory`

### Vercel Timeouts
- **Symptom**: API routes timeout on Vercel
- **Cause**: Missing `maxDuration` in vercel.json
- **Fix**: Add route to vercel.json with maxDuration
- **Reference**: Commits `df9cf64-c6df5d4`

---

## Database

### Quote Edit Save Fails
- **Symptom**: Saving quote edits doesn't persist
- **Cause**: Using wrong column name (`notes` vs `admin_notes`)
- **Fix**: Use `admin_notes` column
- **Reference**: Commit `88b821b`

---

## External APIs

### MTN API Anti-Bot
- **Symptom**: MTN API returns 403 or blocked responses
- **Cause**: Missing browser-like headers
- **Fix**: Add proper headers:
```typescript
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Referer': 'https://www.mtn.co.za/',
  'Origin': 'https://www.mtn.co.za'
}
```

---

## Add New Gotchas Below

[New issues and solutions will be added here]
