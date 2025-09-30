# Marketing Content Management System

Welcome to the CircleTel Marketing CMS! This guide will help you create and manage promotional content, marketing pages, and sales campaigns.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Content Types](#content-types)
3. [Creating Promotions](#creating-promotions)
4. [Creating Marketing Pages](#creating-marketing-pages)
5. [Managing Campaigns](#managing-campaigns)
6. [Best Practices](#best-practices)
7. [FAQ](#faq)

## Getting Started

### Accessing the CMS

1. Navigate to your Strapi admin panel URL (e.g., `https://cms.circletel.co.za/admin`)
2. Log in with your marketing team credentials
3. You'll see the Content Manager in the left sidebar

### Your Permissions

As a Marketing Manager, you can:
- ✅ Create, edit, and delete Promotions
- ✅ Create, edit, and delete Marketing Pages
- ✅ Create, edit, and delete Campaigns
- ✅ Upload and manage media (images)
- ✅ Publish and unpublish content
- ❌ Cannot access system settings or user management

## Content Types

### Promotions
Individual deals or offers displayed on the website. Examples:
- "Save R5,000 on Fibre Setup"
- "3GB FREE mobile data"
- "Free WiFi router with Pure Fibre"

### Marketing Pages
Complete landing pages with multiple sections. Examples:
- Black Friday deals page
- Back-to-school promotions
- Product launch pages

### Campaigns
Collections of promotions and pages organized by marketing initiative. Examples:
- Summer Sale 2025
- Q1 Fibre Push
- Partner Referral Program

## Creating Promotions

### Step 1: Create New Promotion

1. Go to **Content Manager → Promotion → Create new entry**
2. Fill in the required fields (marked with *)

### Required Fields

**Title*** (e.g., "Save R5,000 on Fibre Setup")
- Keep it short and compelling (under 50 characters)
- This appears as the main heading on the card

**Slug*** (auto-generated from title)
- URL-friendly version of the title
- Can be edited manually if needed

**Short Description*** (max 200 characters)
- Brief description shown on the card
- Focus on key benefits or features

**Category***
- Choose from: Fibre, Wireless, VoIP, Hosting, Devices, Mobile, Other
- Used for filtering on the promotions page

### Optional but Recommended

**Badge** (e.g., "FIBRE", "LIMITED TIME", "NEW")
- Short tag displayed in corner of card
- Keep to 1-2 words, all caps

**Pricing**
- **Price**: Current promotional price (e.g., 999.00)
- **Original Price**: Regular price for showing discount
- **Currency**: Default is ZAR

**CTA (Call to Action)**
- **CTA Text**: Button text (default: "Get this deal")
- **CTA Link**: Where the button goes (e.g., `/order?promo=fibre-setup`)

**Images**
- **Featured Image**: Product/service image (recommended: 800x600px)
- **Background Image**: Decorative background for card

**Colors**
- **Background Color**: Card background (hex code, e.g., #00BCD4)
- **Text Color**: Card text color (ensure good contrast)

**Visibility Settings**
- **Featured**: Show in featured promotions section
- **Priority**: Display order (0-100, higher = shown first)
- **Start Date**: When promotion becomes visible
- **End Date**: When promotion stops showing

### Step 2: Upload Images

1. Click on the image field (Featured Image or Background Image)
2. Click "Add new assets"
3. Drag and drop your image or click to browse
4. Wait for upload to complete
5. Click "Finish"

**Image Guidelines:**
- Format: JPG or PNG
- Size: Under 500KB for best performance
- Featured Image: 800x600px (4:3 ratio)
- Background Image: 1200x800px or larger

### Step 3: Save and Publish

1. Review all fields
2. Click **"Save"** (saves as draft)
3. Click **"Publish"** to make it live on the website

**Draft vs Published:**
- **Draft**: Only visible in CMS, not on website
- **Published**: Live on website, visible to customers

## Creating Marketing Pages

Marketing pages are flexible landing pages built from sections.

### Step 1: Basic Information

1. Go to **Content Manager → Marketing Page → Create new entry**
2. Fill in:
   - **Title**: Page name (e.g., "Black Friday Deals 2025")
   - **Slug**: URL path (e.g., "black-friday-2025")
   - **Meta Title**: SEO title (max 60 characters)
   - **Meta Description**: SEO description (max 160 characters)

### Step 2: Add Hero Section

The hero is the large banner at the top of the page.

1. Click "Add a component" under **Hero**
2. Fill in:
   - **Title**: Main heading
   - **Subtitle**: Supporting text
   - **Background Image**: Large banner image (1920x600px)
   - **Background Color**: Fallback color
   - **Text Color**: For title and subtitle
   - **CTA Text & Link**: Optional button

### Step 3: Add Dynamic Sections

Build your page with these section types:

#### Promo Grid
Displays a grid of promotions with optional filtering.

- **Title**: Section heading (optional)
- **Columns**: 2, 3, or 4 columns
- **Show Filter**: Enable category filtering
- **Filter Categories**: Custom filter options (JSON)

**Note:** Promotions are selected in Step 4.

#### Feature List
List of features or benefits with icons.

- **Title**: Section heading
- **Features**: Add multiple feature items
  - Title
  - Description
  - Icon (emoji or text)

#### Text Content
Rich text content area.

- **Title**: Section heading
- **Content**: Full rich text editor
- **Alignment**: Left, Center, or Right

#### CTA Banner
Full-width call-to-action banner.

- **Title**: Compelling headline
- **Description**: Supporting text
- **CTA Text**: Button text
- **CTA Link**: Button destination
- **Background Color**: Banner color
- **Background Image**: Optional background

#### Image with Text
Image alongside text content.

- **Title**: Section heading
- **Content**: Rich text
- **Image**: Photo or graphic
- **Image Position**: Left or Right
- **CTA Text & Link**: Optional button

### Step 4: Link Promotions

1. Scroll to **Promotions** relation field
2. Click "Add relation"
3. Search and select promotions to include
4. These will appear in Promo Grid sections

### Step 5: Publish

1. Set **Published** to true
2. Click **Save**
3. Click **Publish**

Your page is now live at: `https://circletel.co.za/marketing/[your-slug]`

## Managing Campaigns

Campaigns organize multiple promotions and pages under one initiative.

### Step 1: Create Campaign

1. Go to **Content Manager → Campaign → Create new entry**
2. Fill in basic info:
   - **Name**: Campaign name
   - **Slug**: URL-friendly version
   - **Description**: Campaign overview (rich text)
   - **Type**: Seasonal, Product Launch, Flash Sale, Bundle, Referral, Other

### Step 2: Set Dates and Status

- **Start Date**: Campaign begins
- **End Date**: Campaign ends
- **Status**: Draft, Scheduled, Active, Paused, or Completed

**Status Guide:**
- **Draft**: Planning phase
- **Scheduled**: Ready but not yet started
- **Active**: Currently running
- **Paused**: Temporarily stopped
- **Completed**: Finished

### Step 3: Link Content

- **Promotions**: Select related promotions
- **Marketing Pages**: Select related pages

### Step 4: Optional Fields

- **Budget**: Campaign budget amount
- **Target Audience**: Description of target customers
- **Tracking Code**: UTM or analytics code
- **Analytics**: Performance data (JSON)

## Best Practices

### Promotion Cards

✅ **Do:**
- Use high-quality images (800x600px minimum)
- Keep titles short and punchy
- Show clear pricing and savings
- Use contrasting colors for readability
- Set start and end dates for limited offers
- Use priority to control display order

❌ **Don't:**
- Use images over 500KB (slow loading)
- Create overly long titles
- Forget to add category (needed for filtering)
- Leave end date empty for limited offers
- Use similar colors for background and text

### Marketing Pages

✅ **Do:**
- Start with a strong hero section
- Use 3-5 sections maximum for best UX
- Mix section types for visual variety
- Include clear CTAs throughout
- Optimize meta title and description for SEO
- Test on mobile before publishing

❌ **Don't:**
- Create pages with too many sections (slow loading)
- Use only text sections (visually boring)
- Forget to link relevant promotions
- Publish without setting meta tags
- Use large unoptimized images

### Campaigns

✅ **Do:**
- Set clear start and end dates
- Link all related promotions and pages
- Update status as campaign progresses
- Track performance in analytics field
- Use descriptive names and slugs

❌ **Don't:**
- Leave campaigns in "Active" status after ending
- Create campaigns without linking content
- Forget to update status
- Use generic names like "Campaign 1"

### General Guidelines

**Content Creation Workflow:**
1. Plan your content strategy
2. Prepare and optimize images
3. Create promotions first
4. Build marketing pages linking to promotions
5. Create campaign to group everything
6. Test in draft mode
7. Publish when ready
8. Monitor and update as needed

**Image Optimization:**
- Resize images before uploading
- Use tools like TinyPNG or ImageOptim
- Aim for under 200KB per image
- Use appropriate formats (JPG for photos, PNG for graphics)

**Writing Copy:**
- Focus on benefits, not features
- Use action-oriented language
- Keep it concise and scannable
- Include social proof when available
- Create urgency with limited-time offers

## FAQ

### How do I unpublish a promotion?

1. Open the promotion in Content Manager
2. Click the "Unpublish" button in the top right
3. The promotion will no longer appear on the website

### Can I schedule promotions to auto-publish?

Not automatically, but you can:
1. Set **Start Date** and **End Date**
2. Publish the promotion
3. It will only show during that date range

### How do I reorder promotions?

Use the **Priority** field:
- Higher numbers appear first
- Range: 0-100
- Default: 0

### Can I duplicate a promotion?

Currently not available in the UI. You'll need to manually create a new one with the same content.

### Where do promotion images go?

Uploaded images are stored in Strapi's Media Library. You can:
- View all uploads in **Media Library**
- Organize into folders
- Delete unused images
- See image usage across content

### How do I preview before publishing?

Currently, you need to:
1. Publish the content
2. View it on the website
3. Unpublish if changes are needed

**Coming soon:** Preview mode for draft content

### What if I accidentally delete something?

Contact your system administrator. They may be able to restore from backups.

**Prevention:** Use "Unpublish" instead of "Delete" unless you're sure.

### Can I see who made changes?

Yes! Each content entry shows:
- Created date and time
- Last updated date and time
- Author information (coming soon)

### The website isn't showing my changes

**Troubleshooting:**
1. Ensure content is **Published** (not just saved)
2. Check start/end dates are correct
3. Clear your browser cache (Ctrl+F5)
4. Wait 1-2 minutes for cache to update
5. Check if you're viewing the correct URL

### Can I add videos to marketing pages?

Yes! In rich text areas (Text Content section):
1. Click the embed/media button
2. Paste YouTube or Vimeo URL
3. Save and publish

### How do I add a new category?

Categories are fixed in the system. Contact your developer to add new ones. Current categories:
- Fibre
- Wireless
- VoIP
- Hosting
- Devices
- Mobile
- Other

## Need Help?

**Technical Issues:**
Contact the development team at dev@circletel.co.za

**Content Questions:**
Contact your marketing manager

**Access Issues:**
Contact IT support

---

**Last Updated:** 2025-01-30
**Version:** 1.0