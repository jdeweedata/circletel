# 🔑 Google Gemini API - Quick Reference

**Status**: ✅ Configured and Verified
**Date**: 2025-11-23

---

## ✅ What's Configured

```env
API Key: AIzaSyB2ioUlQNgZ3FXkHjEOSPzegmGYC5SUkLQ
Project: 269593533640
Model:   gemini-3-pro-preview (CMS)
Test:    gemini-2.0-flash (verified working ✅)
```

---

## 📁 Files Updated

1. ✅ `.env.local` - API key added (DO NOT commit to git!)
2. ✅ `scripts/test-gemini-api.js` - Test script created
3. ✅ All CMS configuration in place

---

## 🧪 Test Your API Key

```bash
cd C:\Projects\circletel-nextjs
node scripts/test-gemini-api.js
```

**Expected Output**:
```
✅ API Key Valid!
💬 Response: "Hello from CircleTel CMS."
📈 Token Usage: 13 input, 7 output
```

---

## 🚀 Next Steps (In Order)

### 1. Apply Database Migrations
```bash
npx supabase db push
```
Creates: CMS tables, storage bucket, RLS policies

### 2. Start Development
```bash
npm run dev:memory
```
Access: http://localhost:3001/admin/cms

### 3. Verify Setup
- Navigate to `/admin/cms`
- Should require login ✅
- Dashboard loads (currently static)

---

## ⚠️ Important Notes

### Temperature Setting
```typescript
temperature: 1.0  // MUST be 1.0 for Gemini 3 (DO NOT CHANGE!)
```
Lower values cause infinite loops and poor performance.

### API Version
```typescript
apiVersion: 'v1alpha'  // Required for media_resolution
```

### Thought Signatures
Store these in database for multi-turn conversations:
```typescript
// After generation
await db.pages.update({
  thought_signature: response.thoughtSignature
});
```

---

## 💰 Cost Estimates

| Task | Model | Tokens | Cost (Est.) |
|------|-------|--------|-------------|
| Landing Page | gemini-3-pro-preview | ~2,000 | $0.004 |
| Blog Post | gemini-3-pro-preview | ~4,000 | $0.008 |
| Simple Edit | gemini-2.0-flash | ~100 | $0.0002 |

**Monthly Budget (20 gen/hour/user)**:
- 10 users × 20 gen/day × 30 days = 6,000 generations
- Estimated cost: **~$30-50/month**

---

## 📚 Documentation

**Implementation Guides**:
- `lib/cms/GEMINI3_BEST_PRACTICES.md` - Complete guide
- `docs/features/2025-11-23_cms_no_code/GEMINI3_UPDATES.md` - All changes
- `docs/features/2025-11-23_cms_no_code/API_CONFIGURATION_COMPLETE.md` - This setup

**Official Docs**:
- https://ai.google.dev/gemini-api/docs/gemini-3
- https://ai.google.dev/gemini-api/docs/thought-signatures

---

## 🔍 Troubleshooting

### API Key Not Working?
```bash
# Test directly
node scripts/test-gemini-api.js

# Check environment
grep GOOGLE_AI .env.local
```

### Wrong Model Response?
- Gemini 3 Pro may not be available in all regions
- Fallback to gemini-2.0-flash works fine
- Update `CMS_MODEL_ID` in `.env.local` if needed

### Rate Limiting?
```env
CMS_MAX_GENERATIONS_PER_HOUR=20  # Adjust as needed
```

---

## ✅ Configuration Checklist

- [x] API key in `.env.local`
- [x] API key verified
- [x] Project ID configured
- [x] Gemini 3 settings applied
- [x] Test script working
- [ ] Database migrations applied (run `npx supabase db push`)
- [ ] Dev server started
- [ ] CMS dashboard accessible

---

**Quick Help**: Run `node scripts/test-gemini-api.js` anytime to verify configuration

**Status**: ✅ Ready for Phase 2 Implementation
