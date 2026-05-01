# Prismic Setup Guide

This guide walks you through setting up your Prismic repository for CircleTel marketing content.

## Step 1: Create Prismic Repository

1. Go to [https://prismic.io](https://prismic.io)
2. Sign up or log in with your account
3. Click **"Create Repository"**
4. Enter repository details:
   - **Repository name:** `circletel-marketing`
   - **Region:** Choose closest to your users (e.g., EU for Europe, US for North America)
   - **Plan:** Start with Free plan (10k API calls/month)

5. Once created, note your repository name (should match `slicemachine.config.json`)

## Step 2: Configure Local Environment

1. Copy `.env.example` to `.env.local` (if you haven't already)
2. Add your Prismic repository name:
   ```bash
   PRISMIC_REPOSITORY_NAME=circletel-marketing
   ```

3. Prismic will automatically generate the API endpoint:
   ```
   https://circletel-marketing.cdn.prismic.io/api/v2
   ```

## Step 3: Run Slice Machine

Slice Machine is your local development tool for creating Slices (reusable components).

```bash
npm run slicemachine
```

This will open Slice Machine UI at `http://localhost:9999`

## Step 4: Connect Slice Machine to Your Repository

1. In Slice Machine UI (localhost:9999), you'll see a login prompt
2. Click **"Sign in to Prismic"**
3. Authorize Slice Machine to access your repository
4. Select `circletel-marketing` from the dropdown

## Step 5: Verify Configuration

Check that these files exist and are configured:

- ✅ `slicemachine.config.json` - Slice Machine config
- ✅ `.env.local` - Contains `PRISMIC_REPOSITORY_NAME`
- ✅ `package.json` - Has `"slicemachine"` script

## Step 6: Create Your First Custom Type

In Slice Machine UI:

1. Click **"Create Custom Type"**
2. Select **"Page"** (repeatable type for multiple pages)
3. Add fields:
   - **UID** (required) - URL slug
   - **Title** (Key Text)
   - **Meta Title** (Key Text)
   - **Meta Description** (Rich Text)
   - **Meta Image** (Image)
   - **Slice Zone** (this is where marketers will add Slices)

4. Click **"Save"**
5. Click **"Push to Prismic"** (syncs to your repository)

## Step 7: Verify in Prismic Dashboard

1. Go to your Prismic dashboard: `https://circletel-marketing.prismic.io`
2. Click **"Custom Types"** in sidebar
3. You should see your **"Page"** type listed
4. Click **"Create New" → "Page"** to test creating content

## Next Steps

- **Phase 3:** Build Slices (Hero, Features, Pricing, etc.)
- **Phase 4:** Create dynamic routes in Next.js
- **Phase 5:** Set up AI Copywriter tool for Gemini integration

## Troubleshooting

### Error: "Repository not found"
✅ **Fix:** Check that `PRISMIC_REPOSITORY_NAME` in `.env.local` matches your actual repository name in Prismic.

### Error: "Cannot connect to Slice Machine"
✅ **Fix:** Make sure you're logged into Prismic in your browser, then restart Slice Machine:
```bash
npm run slicemachine
```

### Error: "Module not found: @prismicio/*"
✅ **Fix:** Reinstall Prismic packages:
```bash
npm install @prismicio/client @prismicio/next
npm install --save-dev @slicemachine/adapter-next
```

## Resources

- **Prismic Docs:** https://prismic.io/docs
- **Slice Machine Guide:** https://prismic.io/docs/slice-machine
- **Next.js Integration:** https://prismic.io/docs/technical-reference/prismicio-next
- **CircleTel Brand Guide:** See CLAUDE.md

---

**Status:** Ready for Slice Machine development!
