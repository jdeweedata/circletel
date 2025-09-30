# Marketing CMS Setup Guide

Complete setup instructions for the CircleTel Marketing Content Management System.

## Prerequisites

- Node.js 18 or higher
- npm 6 or higher
- Strapi CMS installed (in `/strapi-cms` directory)

## Quick Setup

### Option 1: Automated Setup (Recommended)

Run the setup script from project root:

```bash
chmod +x scripts/setup-strapi-marketing.sh
./scripts/setup-strapi-marketing.sh
```

### Option 2: Manual Setup

#### Step 1: Start Strapi

```bash
cd strapi-cms
npm install
npm run develop
```

Strapi will start at `http://localhost:1337`

#### Step 2: Create First Admin User

1. Open `http://localhost:1337/admin`
2. Fill in the registration form:
   - First name
   - Last name
   - Email
   - Password (strong password required)
3. Click "Let's start"

#### Step 3: Verify Content Types

Content types are already created! You should see:

**Content Manager → Collection Types:**
- ✅ Promotion
- ✅ Marketing Page
- ✅ Campaign

**Components:**
- ✅ sections.hero
- ✅ sections.promo-grid
- ✅ sections.feature-list
- ✅ sections.text-content
- ✅ sections.cta-banner
- ✅ sections.image-text
- ✅ elements.feature-item

#### Step 4: Create Marketing Manager Role

1. Go to **Settings → Roles** (under USERS & PERMISSIONS PLUGIN)
2. Click **"Add new role"**
3. Name: **Marketing Manager**
4. Description: **Manage promotions, marketing pages, and campaigns**

**Set Permissions:**

For **Promotion**:
- [x] find
- [x] findOne
- [x] create
- [x] update
- [x] delete
- [x] publish
- [x] unpublish

For **Marketing-page**:
- [x] find
- [x] findOne
- [x] create
- [x] update
- [x] delete
- [x] publish
- [x] unpublish

For **Campaign**:
- [x] find
- [x] findOne
- [x] create
- [x] update
- [x] delete
- [x] publish
- [x] unpublish

For **Upload** (Media Library):
- [x] upload
- [x] find
- [x] findOne
- [x] destroy

Click **"Save"**

#### Step 5: Create Marketing Team Users

1. Go to **Settings → Users**
2. Click **"Add new user"**
3. Fill in user details:
   - Firstname
   - Lastname
   - Email
   - Password
4. Select Role: **Marketing Manager**
5. Active: **Yes**
6. Click **"Save"**

Repeat for each marketing team member.

#### Step 6: Configure Frontend Environment

Add to your `.env.local` file:

```env
# Strapi CMS
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your-api-token-here
```

**To get API token:**
1. In Strapi: Settings → API Tokens → Create new API Token
2. Name: "Next.js Frontend"
3. Token type: Read-only
4. Token duration: Unlimited
5. Copy the token (shown only once!)

#### Step 7: Test the Setup

**In Strapi:**
1. Create a test promotion:
   - Title: "Test Promotion"
   - Short Description: "This is a test"
   - Category: Fibre
2. Publish it

**In Next.js:**
1. Start dev server: `npm run dev`
2. Navigate to: `http://localhost:3006/promotions`
3. You should see your test promotion!

## Production Setup

### 1. Deploy Strapi

**Option A: Strapi Cloud**
```bash
cd strapi-cms
npm run deploy
```

**Option B: Custom Server**
- Use PostgreSQL or MySQL for production database
- Configure environment variables
- Set up SSL/HTTPS
- Enable security features

### 2. Update Next.js Environment

```env
# Production Strapi
NEXT_PUBLIC_STRAPI_URL=https://cms.circletel.co.za
STRAPI_API_TOKEN=your-production-token
```

### 3. Configure CORS

In `strapi-cms/config/middlewares.js`:

```javascript
module.exports = [
  // ...
  {
    name: 'strapi::cors',
    config: {
      origin: [
        'https://circletel.co.za',
        'https://www.circletel.co.za'
      ]
    }
  }
]
```

### 4. Set Up Webhooks (Optional)

To rebuild Next.js when content changes:

1. In Strapi: Settings → Webhooks
2. Click "Create new webhook"
3. Name: "Rebuild Next.js"
4. URL: Your Vercel webhook URL
5. Events:
   - entry.create
   - entry.update
   - entry.delete
   - entry.publish
   - entry.unpublish

## Troubleshooting

### Content Types Not Showing

1. Stop Strapi (`Ctrl+C`)
2. Delete `.cache` folder in strapi-cms
3. Restart: `npm run develop`

### Permission Denied Errors

1. Check user role has correct permissions
2. Verify user is Active
3. Try logging out and back in

### Images Not Loading on Frontend

1. Check `NEXT_PUBLIC_STRAPI_URL` is set correctly
2. Ensure URL doesn't end with `/`
3. Check CORS configuration
4. Verify images are published

### Can't Connect to Strapi from Next.js

1. Verify Strapi is running
2. Check API token is valid
3. Test connection:
```bash
curl http://localhost:1337/api/promotions
```

### Database Errors

SQLite is used for development. For production:
1. Use PostgreSQL or MySQL
2. Update `strapi-cms/config/database.js`
3. Run migrations

## Next Steps

After setup is complete:

1. 📖 Read the [Quick Start Guide](./quick-start-guide.md)
2. 📚 Review the [Full Documentation](./README.md)
3. 🎨 Create your first promotion
4. 🚀 Build a marketing page
5. 📊 Monitor performance

## Support

**Setup Issues:**
- Check [Strapi Documentation](https://docs.strapi.io)
- Contact dev@circletel.co.za

**Usage Questions:**
- See [FAQ in README.md](./README.md#faq)
- Contact your marketing manager

**Access Problems:**
- Contact IT support
- Email: support@circletel.co.za

---

**Last Updated:** 2025-01-30
**Version:** 1.0