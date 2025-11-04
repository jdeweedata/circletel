# Strapi Cloud Hosting Page Setup Guide

## Prerequisites
- Node.js 14.x or 16.x installed
- npm or yarn package manager
- PostgreSQL or SQLite database (SQLite is fine for development)

## Step 1: Install Strapi (If Not Already Installed)

### Option A: Create New Strapi Project
```bash
# Navigate to your desired directory
cd C:\Projects

# Create new Strapi project
npx create-strapi-app@latest circletel-strapi --quickstart

# Or with custom database
npx create-strapi-app@latest circletel-strapi
```

### Option B: Use Existing Strapi Instance
If you already have Strapi running, skip to Step 2.

## Step 2: Start Strapi Development Server

```bash
# Navigate to your Strapi project
cd C:\Projects\circletel-strapi

# Start Strapi
npm run develop
# or
yarn develop
```

Strapi will start at `http://localhost:1337`

## Step 3: Create Admin User (First Time Only)

1. Open browser to `http://localhost:1337/admin`
2. Create your admin account:
   - Email: admin@circletel.co.za
   - Password: (choose a secure password)
   - First name: Admin
   - Last name: CircleTel

## Step 4: Create Content Types via Strapi Admin

Since Strapi doesn't support direct JSON import through the UI, we'll create the content types manually:

### 4.1 Create Cloud Hosting Page (Single Type)

1. Go to **Content-Type Builder** in left sidebar
2. Click **+ Create new single type**
3. Display name: `Cloud Hosting Page`
4. Click **Continue**

### 4.2 Add Components First

Before adding fields to the main type, create the components:

#### Component 1: Cloud Hero (sections.cloud-hero)
1. In Content-Type Builder, click **+ Create new component**
2. Category name: `sections`
3. Component name: `cloud-hero`
4. Component icon: Choose any
5. Add fields:
   - `title` (Text - Short text) - Required
   - `subtitle` (Text - Long text)
   - `backgroundImage` (Media - Single media)

#### Component 2: Feature Item (sections.feature-item)
1. Create new component in `sections` category
2. Name: `feature-item`
3. Fields:
   - `icon` (Text - Short text)
   - `title` (Text - Short text) - Required
   - `description` (Text - Short text)

#### Component 3: Testimonial Stats (sections.testimonial-stats)
1. Create new component in `sections` category
2. Name: `testimonial-stats`
3. Fields:
   - `statNumber` (Text - Short text)
   - `statText` (Text - Short text)
   - `testimonialText` (Text - Long text)
   - `testimonialAuthor` (Text - Short text)
   - `testimonialRole` (Text - Short text)

#### Component 4: Pricing Tier (shared.pricing-tier)
1. Create new component in `shared` category
2. Name: `pricing-tier`
3. Fields:
   - `name` (Text - Short text)
   - `cpu` (Text - Short text)
   - `ram` (Text - Short text)
   - `storage` (Text - Short text)
   - `bandwidth` (Text - Short text)
   - `price` (Number - Decimal)
   - `priceLabel` (Text - Short text)
   - `isPopular` (Boolean) - Default: false

#### Component 5: Pricing Plan (sections.pricing-plan)
1. Create new component in `sections` category
2. Name: `pricing-plan`
3. Fields:
   - `planType` (Enumeration) - Values: `managed`, `self-managed`
   - `title` (Text - Short text) - Required
   - `description` (Text - Long text)
   - `tiers` (Component - Repeatable) - Select `shared.pricing-tier`

#### Component 6: Performance Feature (shared.performance-feature)
1. Create new component in `shared` category
2. Name: `performance-feature`
3. Fields:
   - `title` (Text - Short text)
   - `description` (Text - Long text)

#### Component 7: Performance Section (sections.performance-section)
1. Create new component in `sections` category
2. Name: `performance-section`
3. Fields:
   - `title` (Text - Short text)
   - `subtitle` (Text - Short text)
   - `description` (Text - Long text)
   - `features` (Component - Repeatable) - Select `shared.performance-feature`

#### Component 8: Award Item (sections.award-item)
1. Create new component in `sections` category
2. Name: `award-item`
3. Fields:
   - `title` (Text - Short text)
   - `description` (Text - Short text)
   - `year` (Text - Short text)
   - `icon` (Media - Single media)

### 4.3 Add Fields to Cloud Hosting Page

Now go back to the Cloud Hosting Page single type and add these fields:

1. `hero` (Component - Single) - Select `sections.cloud-hero`
2. `features` (Component - Repeatable) - Select `sections.feature-item`
3. `testimonial` (Component - Single) - Select `sections.testimonial-stats`
4. `pricingPlans` (Component - Repeatable) - Select `sections.pricing-plan`
5. `performance` (Component - Single) - Select `sections.performance-section`
6. `awards` (Component - Repeatable) - Select `sections.award-item`

Click **Save** to save the content type.

## Step 5: Create Content

1. Go to **Content Manager** in left sidebar
2. Click on **Cloud Hosting Page**
3. Click **+ Create new entry**
4. Fill in the content:

### Hero Section
```
Title: Cloud Hosting.
Subtitle: Virtual hosting with more scalability, more redundancy and minimal downtime.
```

### Features (Add 4 items)
1. Icon: `database`, Title: `Top-tier data centres`, Description: `Enterprise-grade infrastructure`
2. Icon: `settings`, Title: `Scalable`, Description: `Grow as you need`
3. Icon: `users`, Title: `Customisable`, Description: `Tailored to your needs`
4. Icon: `clock`, Title: `Malware switches`, Description: `Advanced security`

### Testimonial
```
Stat Number: 58 315
Stat Text: people just like you use ISP in South Africa
Testimonial Text: Managed VPS/Servers! Unrivalled support, availability and consistency! What more could a web agency need! CircleTel has been a cornerstone in our growth and development, and our clients absolutely love them!
Testimonial Author: TechAgent CEO
Testimonial Role: Digital Solutions Provider
```

### Pricing Plans (Add 2 plans with 5 tiers each)

**Plan 1: Self-managed**
- Plan Type: `self-managed`
- Title: `Self-managed`
- Description: `Full control over your cloud infrastructure`
- Tiers:
  1. Name: `Silver Pro`, CPU: `2x2`, RAM: `2 GB`, Storage: `40GB SSD`, Bandwidth: `Unmetered`, Price: `195`, Price Label: `R195 p/m`
  2. Name: `Gold`, CPU: `3x3`, RAM: `3 GB`, Storage: `60GB SSD`, Bandwidth: `Unmetered`, Price: `295`, Price Label: `R295 p/m`, Is Popular: `true`
  3. Name: `Gold Pro`, CPU: `4x4`, RAM: `4 GB`, Storage: `80GB SSD`, Bandwidth: `Unmetered`, Price: `395`, Price Label: `R395 p/m`
  4. Name: `Platinum`, CPU: `6x6`, RAM: `6 GB`, Storage: `120GB SSD`, Bandwidth: `Unmetered`, Price: `595`, Price Label: `R595 p/m`
  5. Name: `Platinum Pro`, CPU: `8x8`, RAM: `8 GB`, Storage: `160GB SSD`, Bandwidth: `Unmetered`, Price: `795`, Price Label: `R795 p/m`

**Plan 2: Managed**
- Plan Type: `managed`
- Title: `Managed`
- Description: `We handle everything for you`
- Tiers:
  1. Name: `Managed 1`, CPU: `2x2`, RAM: `2 GB`, Storage: `40GB SSD`, Bandwidth: `Unmetered`, Price: `495`, Price Label: `R495 p/m`
  2. Name: `Managed 2`, CPU: `3x3`, RAM: `3 GB`, Storage: `60GB SSD`, Bandwidth: `Unmetered`, Price: `695`, Price Label: `R695 p/m`, Is Popular: `true`
  3. Name: `Managed 3`, CPU: `4x4`, RAM: `4 GB`, Storage: `80GB SSD`, Bandwidth: `Unmetered`, Price: `895`, Price Label: `R895 p/m`
  4. Name: `Managed 4`, CPU: `6x6`, RAM: `6 GB`, Storage: `120GB SSD`, Bandwidth: `Unmetered`, Price: `1295`, Price Label: `R1,295 p/m`
  5. Name: `Managed 5`, CPU: `8x8`, RAM: `8 GB`, Storage: `160GB SSD`, Bandwidth: `Unmetered`, Price: `1695`, Price Label: `R1,695 p/m`

### Performance Section
```
Title: Exceptional performance and redundancy.
Subtitle: Built for reliability
Description: Our cloud servers use the very best virtual technology and software to offer you all the benefits of dedicated hosting at a fraction of the cost of traditional physical servers.
```

Features (Add 4):
1. Title: `With over 25 years of experience`, Description: `Serving South African businesses since 1999, we understand local needs and provide solutions that work in our unique environment.`
2. Title: `We fixed-term contracts so we earn your business`, Description: `No lock-in contracts. We believe our service quality should earn your loyalty, not contractual obligations.`
3. Title: `Reliable Infrastructure`, Description: `Multiple data centers across South Africa ensure your services stay online with 99.9% uptime guarantee.`
4. Title: `Local Support Team`, Description: `24/7 support from our South African-based team who understand your business needs.`

### Awards (Add 3)
1. Title: `7x Broadband ISP of the Year`, Description: `Voted best broadband provider`, Year: `2023`
2. Title: `5x ASA Africa Category Winner`, Description: `Excellence in African hosting`, Year: `2023`
3. Title: `3x IT Person of the Year Winner`, Description: `Industry leadership recognition`, Year: `2022`

5. Click **Save** and then **Publish**

## Step 6: Configure API Permissions

1. Go to **Settings** → **Roles** → **Public**
2. Under **Permissions**, find **Cloud-hosting-page**
3. Check the `find` permission
4. Click **Save**

## Step 7: Generate API Token

1. Go to **Settings** → **API Tokens**
2. Click **+ Create new API Token**
3. Name: `CircleTel Frontend`
4. Token duration: `Unlimited`
5. Token type: `Read-only`
6. Select permissions:
   - Cloud-hosting-page: `find`
7. Click **Save**
8. Copy the generated token

## Step 8: Configure Next.js Environment

Add to your `.env.local` file:

```env
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your-generated-token-here
```

## Step 9: Test the Integration

1. Start your Next.js development server:
```bash
npm run dev:memory
```

2. Navigate to `http://localhost:3000/cloud-hosting`

3. The page should now display content from Strapi!

## Troubleshooting

### Issue: Content not showing
- Check Strapi is running on port 1337
- Verify API token is correct in `.env.local`
- Check browser console for errors
- Ensure content is published in Strapi

### Issue: CORS errors
Add to your Strapi `config/middlewares.js`:
```javascript
module.exports = [
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      origin: ['http://localhost:3000', 'http://localhost:3001'],
    },
  },
  'strapi::poweredBy',
  'strapi::logger',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
```

### Issue: API returns 403 Forbidden
- Make sure the Public role has `find` permission for Cloud Hosting Page
- Verify the API token has the correct permissions

## Alternative: Using Strapi CLI (Advanced)

If you're comfortable with the Strapi CLI, you can create content types programmatically:

1. Create content type files in `src/api/cloud-hosting-page/content-types/cloud-hosting-page/`
2. Create component files in `src/components/`
3. Restart Strapi to load the new types

## Next Steps

1. Customize the content in Strapi admin panel
2. Upload images for hero background and awards
3. Adjust pricing and features as needed
4. Consider adding more language variations
5. Set up webhooks for automatic revalidation

## Support

For Strapi documentation: https://docs.strapi.io/
For CircleTel support: Contact your development team