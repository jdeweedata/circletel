# Prismic CMS Setup Guide for CircleTel

## ✅ Phase 1: Initial Configuration (COMPLETE)

The following has been completed:

### Dependencies Installed
- ✅ `@prismicio/client` (v7.21.0)
- ✅ `@prismicio/next` (v2.0.2)
- ✅ `@prismicio/react` (v3.2.2)
- ✅ `@slicemachine/adapter-next`
- ✅ `slice-machine-ui`

### Configuration Files Created
- ✅ `prismicio.ts` - Main Prismic configuration
- ✅ `slicemachine.config.json` - Slice Machine configuration
- ✅ `lib/prismic/client.ts` - Prismic client with link resolver
- ✅ `app/slice-simulator/page.tsx` - Slice preview page
- ✅ `app/api/preview/route.ts` - Preview mode handler
- ✅ `app/api/exit-preview/route.ts` - Exit preview handler
- ✅ `slices/index.ts` - Slice components index

### Package.json Scripts Added
```bash
npm run slicemachine        # Start Slice Machine UI
npm run prismic:setup       # Initialize Prismic (if needed)
```

---

## 📋 Phase 2: Prismic Account Setup (REQUIRED)

### Step 1: Create Prismic Account

1. Go to https://prismic.io
2. Click "Start for free"
3. Sign up with email or GitHub
4. Create new repository:
   - **Repository name**: `circletel-cms`
   - **Region**: Choose closest to South Africa (EU or US recommended)
   - **Plan**: Free tier (100k API calls/month)

### Step 2: Get API Credentials

After creating your repository:

1. Go to **Settings** → **API & Security**
2. Copy the **Repository Name** (should be `circletel-cms`)
3. Generate a **Permanent Access Token**:
   - Click "Generate Access Token"
   - Name it: "CircleTel Next.js App"
   - Copy the token (keep it secret!)

### Step 3: Configure Environment Variables

Create or update your `.env.local` file:

```env
# Prismic CMS Configuration
NEXT_PUBLIC_PRISMIC_REPOSITORY=circletel-cms
NEXT_PUBLIC_PRISMIC_ENVIRONMENT=circletel-cms
PRISMIC_ACCESS_TOKEN=your_permanent_access_token_here
PRISMIC_WEBHOOK_SECRET=your_webhook_secret_here
```

Generate webhook secret:
```bash
openssl rand -hex 32
```

### Step 4: Configure Prismic Preview

1. In Prismic Dashboard, go to **Settings** → **Previews**
2. Add new preview:
   - **Site Name**: CircleTel Production
   - **Domain**: `https://www.circletel.co.za`
   - **Preview Route**: `/api/preview`
3. Add staging preview:
   - **Site Name**: CircleTel Staging
   - **Domain**: `https://circletel-staging.vercel.app`
   - **Preview Route**: `/api/preview`

---

## 🎨 Phase 3: Content Modeling (NEXT STEP)

### Custom Types to Create in Prismic

#### 1. Page (Repeatable)

**Use Case**: Landing pages, About Us, Contact, etc.

**Fields**:
```json
{
  "uid": { "type": "UID", "label": "URL Slug" },
  "title": { "type": "Text", "label": "Page Title" },
  "meta_title": { "type": "Text", "label": "SEO Title" },
  "meta_description": { "type": "Text", "label": "SEO Description" },
  "og_image": { "type": "Image", "label": "Social Share Image" },
  "body": { "type": "Slices", "label": "Page Content" }
}
```

**Slices Available**:
- Hero
- Features
- Content
- CTA
- Stats

#### 2. BlogPost (Repeatable)

**Use Case**: Blog articles, news, announcements

**Fields**:
```json
{
  "uid": { "type": "UID", "label": "URL Slug" },
  "title": { "type": "Text", "label": "Title" },
  "excerpt": { "type": "Text", "label": "Excerpt" },
  "featured_image": { "type": "Image", "label": "Featured Image" },
  "author": { "type": "Content Relationship", "customtypes": ["author"] },
  "categories": { "type": "Content Relationship", "customtypes": ["category"], "multiple": true },
  "publish_date": { "type": "Date", "label": "Publish Date" },
  "content": { "type": "Rich Text", "label": "Article Content" },
  "seo_title": { "type": "Text", "label": "SEO Title" },
  "seo_description": { "type": "Text", "label": "SEO Description" }
}
```

#### 3. Product (Repeatable)

**Use Case**: Fibre packages, VoIP plans, hosting services

**Fields**:
```json
{
  "uid": { "type": "UID", "label": "URL Slug" },
  "name": { "type": "Text", "label": "Product Name" },
  "description": { "type": "Rich Text", "label": "Description" },
  "price": { "type": "Number", "label": "Monthly Price (ZAR)" },
  "setup_fee": { "type": "Number", "label": "Setup Fee (ZAR)" },
  "speed_down": { "type": "Number", "label": "Download Speed (Mbps)" },
  "speed_up": { "type": "Number", "label": "Upload Speed (Mbps)" },
  "data_cap_gb": { "type": "Number", "label": "Data Cap (GB, 0 = Unlimited)" },
  "features": {
    "type": "Group",
    "label": "Features",
    "fields": {
      "feature_text": { "type": "Text" },
      "feature_icon": { "type": "Select", "options": ["check", "star", "zap", "shield"] }
    }
  },
  "category": { "type": "Content Relationship", "customtypes": ["category"] },
  "provider_logo": { "type": "Image", "label": "Provider Logo" },
  "is_active": { "type": "Boolean", "label": "Active" },
  "is_featured": { "type": "Boolean", "label": "Featured" }
}
```

#### 4. MarketingPage (Repeatable)

**Use Case**: Campaign landing pages, promotions

**Fields**:
```json
{
  "uid": { "type": "UID", "label": "URL Slug" },
  "title": { "type": "Text", "label": "Page Title" },
  "hero": { "type": "Slices", "label": "Hero Section" },
  "sections": { "type": "Slices", "label": "Page Sections" },
  "promotions": { "type": "Content Relationship", "customtypes": ["promotion"], "multiple": true }
}
```

#### 5. Promotion (Repeatable)

**Fields**:
```json
{
  "uid": { "type": "UID" },
  "title": { "type": "Text" },
  "description": { "type": "Rich Text" },
  "discount_percentage": { "type": "Number" },
  "featured_image": { "type": "Image" },
  "start_date": { "type": "Date" },
  "end_date": { "type": "Date" },
  "cta_text": { "type": "Text" },
  "cta_link": { "type": "Link" }
}
```

#### 6. Campaign (Repeatable)

**Fields**:
```json
{
  "uid": { "type": "UID" },
  "campaign_name": { "type": "Text" },
  "campaign_type": { "type": "Select", "options": ["email", "social", "web", "partner"] },
  "target_audience": { "type": "Text" },
  "products": { "type": "Content Relationship", "customtypes": ["product"], "multiple": true },
  "is_active": { "type": "Boolean" }
}
```

#### 7. Author (Repeatable)

**Fields**:
```json
{
  "uid": { "type": "UID" },
  "name": { "type": "Text" },
  "bio": { "type": "Rich Text" },
  "avatar": { "type": "Image" },
  "email": { "type": "Text" }
}
```

#### 8. Category (Repeatable)

**Fields**:
```json
{
  "uid": { "type": "UID" },
  "name": { "type": "Text" },
  "description": { "type": "Text" },
  "color": { "type": "Select", "options": ["orange", "blue", "green", "purple", "red"] }
}
```

---

## 🧩 Phase 4: Creating Slices with Slice Machine

### Start Slice Machine

```bash
npm run slicemachine
```

This opens http://localhost:9999

### Create Hero Slice

1. Click "Create Slice"
2. Name: **Hero**
3. Add fields:
   - **heading** (Rich Text)
   - **subheading** (Rich Text)
   - **background_image** (Image)
   - **cta_text** (Text)
   - **cta_link** (Link)

4. Add Variations:
   - **Default**: Standard hero with image background
   - **Video**: Hero with video background
   - **Gradient**: Hero with gradient background

5. Click "Save"

### Create Features Slice

1. Name: **Features**
2. Add fields:
   - **section_title** (Text)
   - **section_description** (Text)
3. Add Group field: **features**
   - **icon** (Image)
   - **title** (Text)
   - **description** (Text)

### Create Pricing Table Slice

1. Name: **PricingTable**
2. Add Group field: **packages**
   - **package_name** (Text)
   - **price** (Number)
   - **features** (Rich Text)
   - **cta_text** (Text)
   - **cta_link** (Link)
   - **is_featured** (Boolean)

### Create Testimonials Slice

1. Name: **Testimonials**
2. Add Group field: **testimonials**
   - **customer_name** (Text)
   - **company** (Text)
   - **quote** (Text)
   - **avatar** (Image)

### Create CTA Slice

1. Name: **CTA**
2. Add fields:
   - **heading** (Rich Text)
   - **description** (Text)
   - **button_text** (Text)
   - **button_link** (Link)
   - **background_color** (Select: orange, blue, gradient)

### Create Content Slice

1. Name: **Content**
2. Add fields:
   - **content** (Rich Text)
   - **image** (Image)
   - **layout** (Select: text-left, text-right, centered)

---

## 🔧 Phase 5: Generate TypeScript Types

After creating slices in Slice Machine:

```bash
# This generates prismicio-types.ts
npx @slicemachine/init --generate-types
```

This creates full TypeScript types for all your custom types and slices!

---

## 🚀 Phase 6: Start Development

### Run Both Servers

**Terminal 1**: Next.js dev server
```bash
npm run dev:memory
```

**Terminal 2**: Slice Machine
```bash
npm run slicemachine
```

### Access Points

- **Next.js App**: http://localhost:3000
- **Slice Machine**: http://localhost:9999
- **Prismic Dashboard**: https://circletel-cms.prismic.io/

---

## 📝 Phase 7: Create Sample Content

### In Prismic Dashboard:

1. **Create Authors**:
   - Go to "Documents" → "Create new" → "Author"
   - Add team members

2. **Create Categories**:
   - "Fibre Internet"
   - "VoIP Services"
   - "Cloud Hosting"

3. **Create Products**:
   - MTN 100Mbps Fibre
   - VoIP Business Line
   - Cloud VPS Hosting

4. **Create Blog Posts**:
   - Select author (relationship)
   - Select categories (relationship)
   - Write content

5. **Create Marketing Pages**:
   - Use Hero slice for top section
   - Add Features slices
   - Add Pricing Table
   - Add CTA slice

---

## 🔗 Phase 8: Configure Webhooks

### In Prismic Dashboard:

1. Go to **Settings** → **Webhooks**
2. Click "Create a webhook"
3. Configure:
   - **Name**: CircleTel Production Webhook
   - **URL**: `https://www.circletel.co.za/api/prismic/webhook`
   - **Secret**: (use the `PRISMIC_WEBHOOK_SECRET` from .env.local)
   - **Triggers**: Select all events

4. Save

### Create Webhook Handler

This will be created in Phase 2 (content migration).

---

## 📚 Next Steps

After completing setup:

1. ✅ **Create Custom Types** in Prismic Dashboard (Phase 3)
2. ✅ **Design Slices** in Slice Machine (Phase 4)
3. ✅ **Generate TypeScript Types** (Phase 5)
4. ✅ **Create React Hooks** for content fetching
5. ✅ **Build Slice Components** (React components for each slice)
6. ✅ **Migrate Existing Content** from Strapi/Sanity
7. ✅ **Update Pages** to use Prismic
8. ✅ **Configure Webhooks** for auto-revalidation

---

## 🎯 Benefits After Migration

### For Marketing Team:
- ✅ Visual drag-and-drop page builder (Slice Machine)
- ✅ Live preview before publishing
- ✅ Schedule content releases
- ✅ No developer needed for content updates

### For Developers:
- ✅ Full TypeScript type safety
- ✅ Reusable slice components
- ✅ Built-in CDN (Fastly)
- ✅ GraphQL + REST APIs
- ✅ Excellent Next.js 15 integration

### For CircleTel:
- ✅ Single CMS (no more Strapi + Sanity confusion)
- ✅ Free tier: 100k API calls/month
- ✅ Faster page loads (CDN-powered)
- ✅ Better content management workflow

---

## 🆘 Troubleshooting

### Issue: Slice Machine won't start

**Solution**:
```bash
npm install --save-dev @slicemachine/adapter-next slice-machine-ui --force
npm run slicemachine
```

### Issue: Types not generating

**Solution**:
```bash
npx @slicemachine/init --generate-types --force
```

### Issue: Preview mode not working

**Check**:
1. `PRISMIC_ACCESS_TOKEN` is set in .env.local
2. Preview route is configured in Prismic Dashboard
3. `app/api/preview/route.ts` exists

---

## 📖 Documentation Links

- **Prismic Documentation**: https://prismic.io/docs
- **Slice Machine Guide**: https://prismic.io/docs/slice-machine
- **Next.js Integration**: https://prismic.io/docs/nextjs
- **GROQ Queries**: https://prismic.io/docs/query-content

---

**Last Updated**: 2025-11-08
**Status**: Phase 1 Complete - Ready for Account Setup
**Next Action**: Create Prismic account and configure environment variables
