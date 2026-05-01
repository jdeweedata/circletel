# Phase 2 - Manual Steps Required

Phase 2 is **99% complete**! Only 2 manual steps remain that require your interaction with Prismic UI.

## What's Already Done ✅

1. ✅ Slice Machine configuration created (`slicemachine.config.json`)
2. ✅ Environment variables configured (`.env.example` updated)
3. ✅ npm script added (`npm run slicemachine`)
4. ✅ Prismic preview route created (`app/api/preview/route.ts`)
5. ✅ Prismic client created (`lib/prismicio.ts`) with draft mode support

## Manual Steps (5-10 minutes)

### Step 1: Create Prismic Repository

1. Open browser and go to: **https://prismic.io**
2. Sign up or log in
3. Click **"Create Repository"**
4. Enter repository name: **`circletel-marketing`** (must match exactly!)
5. Choose region (closest to your users)
6. Select "Free" plan
7. Click "Create"

### Step 2: Add Environment Variable

1. Create `.env.local` file in project root (if it doesn't exist):
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` and add:
   ```bash
   PRISMIC_REPOSITORY_NAME=circletel-marketing
   ```

3. Save the file

### Step 3: Start Slice Machine

```bash
npm run slicemachine
```

This opens Slice Machine UI at `http://localhost:9999`

### Step 4: Login to Prismic (in Slice Machine)

1. In Slice Machine UI, click **"Sign in to Prismic"**
2. Authorize Slice Machine
3. Select `circletel-marketing` from dropdown

### Step 5: Define Page Custom Type

In Slice Machine UI (localhost:9999):

1. Click **"Create Custom Type"**
2. Choose **"Repeatable Type"** (for multiple pages)
3. Enter name: **`Page`** (capital P)
4. Click "Create"

5. Add fields to Page type (click "+ Add a field"):

   **a) UID Field** (required):
   - Type: **UID**
   - Field name: `uid`
   - Description: "URL slug for this page"
   - Click "Add"

   **b) Title Field**:
   - Type: **Key Text**
   - Field name: `title`
   - Description: "Page title"
   - Click "Add"

   **c) Meta Title** (SEO):
   - Type: **Key Text**
   - Field name: `meta_title`
   - Description: "SEO title (60 chars)"
   - Click "Add"

   **d) Meta Description** (SEO):
   - Type: **Key Text**
   - Field name: `meta_description`
   - Description: "SEO description (160 chars)"
   - Click "Add"

   **e) Meta Image** (SEO):
   - Type: **Image**
   - Field name: `meta_image`
   - Description: "Open Graph image"
   - Click "Add"

   **f) Slice Zone** (MOST IMPORTANT):
   - Type: **Slice Zone**
   - Field name: `slices`
   - Description: "Page content sections"
   - Click "Add"

6. Click **"Save"** (top right)

### Step 6: Push Page Type to Prismic

1. In Slice Machine, click **"Push to Prismic"** button
2. Confirm the push
3. Wait for sync to complete (should take ~5 seconds)

### Step 7: Verify in Prismic Dashboard

1. Open Prismic dashboard: `https://circletel-marketing.prismic.io`
2. Click **"Custom Types"** in sidebar
3. You should see **"Page"** listed
4. Click "Page" → Click **"JSON editor"** to see the structure

Should look like this:
```json
{
  "Main": {
    "uid": { "type": "UID" },
    "title": { "type": "Text" },
    "meta_title": { "type": "Text" },
    "meta_description": { "type": "Text" },
    "meta_image": { "type": "Image" },
    "slices": { "type": "Slices" }
  }
}
```

## Verification

Test that everything works:

```bash
# 1. Slice Machine should be running
npm run slicemachine

# 2. In Prismic dashboard, create a test page:
# - Go to circletel-marketing.prismic.io
# - Click "Create New" → "Page"
# - Fill in UID: "test-page"
# - Fill in title: "Test Page"
# - Click "Save"
```

## Next Steps

Once these manual steps are complete, you're ready for **Phase 3: Building Slices**!

In Phase 3, we'll create the actual visual components (Hero, Features, Pricing, etc.) that marketers will use to build pages.

## Troubleshooting

### "Repository not found" error
- Check `.env.local` has correct `PRISMIC_REPOSITORY_NAME`
- Restart Slice Machine: `npm run slicemachine`

### Can't login to Slice Machine
- Make sure you're logged into Prismic in your browser first
- Try clearing browser cache and logging in again

### "Push to Prismic" button is grayed out
- Make sure you've saved the Page type first (click "Save")
- Check that Slice Machine is connected to your repository (top bar should show "circletel-marketing")

---

**Estimated Time:** 5-10 minutes
**Status:** Ready to execute!
