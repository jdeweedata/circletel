<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Feature Specification: AI-Powered No-Code CMS

## Next.js + Supabase + Gemini 3 Pro + Nano Banana Pro


***

## 1. Executive Summary

**Project Name:** AI Content Studio
**Objective:** Build a custom, AI-powered content management system that allows non-technical marketing and sales teams to generate and publish professional blogs, landing pages, and marketing materials without writing code.

**Key Differentiator:** Unlike traditional CMSs where users *write* content, this system uses AI to *generate* content based on simple prompts, then allows easy editing and publishing.

**Tech Stack:**

- **Frontend \& Backend:** Next.js 15 (App Router)
- **Database:** Supabase PostgreSQL (JSONB storage)
- **Media Storage:** Supabase Storage
- **AI Engine:** Google Gemini 3 Pro (text) + Nano Banana Pro (images)
- **Deployment:** Vercel
- **Authentication:** Supabase Auth

**Target Users:**

- Marketing managers (create campaign landing pages)
- Sales teams (create product showcase pages)
- Content writers (create blog posts with AI assistance)

***

## 2. User Roles \& Permissions

### 2.1 Role Definitions

| Role | Permissions | Use Case |
| :-- | :-- | :-- |
| **Admin** | Full access: Generate, Edit, Publish, Delete, Manage Users | Marketing Director, Web Manager |
| **Editor** | Generate, Edit, Publish (own content) | Marketing Specialists, Sales Reps |
| **Viewer** | Read-only access to drafts | Stakeholders, Reviewers |

### 2.2 Authentication Requirements

- Implement Supabase Auth with email/password
- Optional: Google OAuth for quick login
- Role-based access control (RBAC) via Supabase RLS policies

***

## 3. Core Features

### 3.1 Content Generation Engine

#### 3.1.1 AI-Powered Page Creator

**User Flow:**

1. User clicks "Create New Page" button
2. Selects content type from dropdown:
    - Landing Page
    - Blog Post
    - Product Showcase
    - Case Study
    - Announcement
3. Fills out a simple form:
    - **Topic/Title** (required): "Launch of Premium Coffee Service"
    - **Target Audience**: B2B / B2C / Internal
    - **Tone**: Professional / Casual / Enthusiastic
    - **Key Points** (optional): Bullet points for AI to emphasize
4. Clicks "Generate with AI"
5. System returns fully structured page with:
    - Hero section with headline and AI-generated image
    - Body sections (features, benefits, testimonials)
    - Call-to-action buttons
    - SEO metadata

**Technical Implementation:**

- Vercel Server Action calls Gemini 3 Pro API
- Structured prompt engineering to return valid JSON schema
- Nano Banana Pro generates contextual hero image
- Content saved as JSONB in `pages` table
- Image uploaded to Supabase Storage bucket


#### 3.1.2 Blog Post Generator

**User Flow:**

1. User clicks "Create Blog Post"
2. Enters:
    - **Blog Topic**: "How AI is Transforming Marketing"
    - **Word Count Target**: 800 / 1500 / 2500 words
    - **Include Sections**: Introduction, Main Points, Conclusion
    - **SEO Keywords** (optional): List of keywords to include
3. Clicks "Generate Draft"
4. AI creates:
    - Structured article with H2/H3 headings
    - Featured image
    - Meta description for SEO
    - Suggested internal links (if blog archive exists)

**Technical Implementation:**

- Separate `blog_posts` table with JSONB content field
- Rich text stored as Portable Text or HTML
- Automatic slug generation from title
- Category/tag system for organization

***

### 3.2 Visual Content Editor (Post-Generation)

**Requirement:** After AI generation, users must be able to edit content without touching code.

#### 3.2.1 Inline Text Editor

- **Component:** Implement Tiptap or Lexical rich text editor
- **Features:**
    - Bold, Italic, Underline formatting
    - Heading levels (H1-H6)
    - Bullet and numbered lists
    - Hyperlink insertion
    - Image upload/replace
    - Undo/Redo


#### 3.2.2 Block-Level Editing

- **Drag-and-Drop Reordering:** Users can drag sections up/down
- **Add/Remove Blocks:** Click "+" icon between sections to add:
    - Text block
    - Image block
    - Video embed (YouTube/Vimeo)
    - Quote/Testimonial
    - CTA Button
    - Feature grid (3-column layout)


#### 3.2.3 Live Preview Mode

- Split-screen view: Editor on left, live preview on right
- Changes reflect in real-time (debounced updates)
- Mobile/Desktop preview toggle

***

### 3.3 Media Management

#### 3.3.1 AI Image Generation

**User Flow:**

1. In editor, user clicks "Generate Image"
2. Enters prompt: "Modern office workspace with laptop"
3. Selects style: Photorealistic / Illustration / Abstract
4. Nano Banana Pro generates 4 variations
5. User selects favorite, system auto-crops and optimizes
6. Image saved to Supabase Storage with CDN URL

#### 3.3.2 Image Library

- Centralized media browser showing all uploaded/generated images
- Search by filename, tags, or upload date
- Bulk actions: Delete, Download, Tag
- Image metadata: Size, dimensions, alt text editing


#### 3.3.3 Image Optimization

- Automatic conversion to WebP format
- Responsive image variants (thumbnail, medium, full)
- Lazy loading on frontend

***

### 3.4 Publishing Workflow

#### 3.4.1 Draft → Review → Publish Pipeline

**States:**

- **Draft** (default): Only visible to creator and admins
- **In Review**: Flagged for approval (optional workflow)
- **Scheduled**: Set future publish date/time
- **Published**: Live on website
- **Archived**: Removed from public but kept in database

**UI Requirements:**

- Status badge visible on all content cards
- "Publish" button with confirmation modal
- "Schedule" option with date/time picker
- "Request Review" button (sends notification to admin)


#### 3.4.2 SEO Optimization Panel

**Automatic Features:**

- AI-generated meta title (60 chars max)
- AI-generated meta description (155 chars max)
- Automatic Open Graph image (uses hero image)
- Schema.org JSON-LD markup for blog posts

**Manual Override:**

- All fields editable by user
- Character count indicators
- SEO score preview (basic checks: title length, keyword density)

***

### 3.5 Content Dashboard (Main Interface)

#### 3.5.1 Overview Screen

**Layout:**

- Top Stats Cards:
    - Total Pages: XX
    - Published: XX
    - Drafts: XX
    - This Month's Views: XX (future feature with analytics)
- **Content Table:**
    - Columns: Title | Type | Status | Last Modified | Actions
    - Filters: Status (All/Draft/Published), Type (All/Blog/Landing), Date Range
    - Search bar: Real-time search by title or content
    - Sort: By date, title, status


#### 3.5.2 Quick Actions

- Bulk operations: Publish selected, Delete selected
- Clone/Duplicate page (creates editable copy)
- Export as PDF (for review/approval workflows)

***

### 3.6 Template System (Phase 2 Feature)

**User Flow:**

1. Admin creates a "Template" from successful landing page
2. Template saved with placeholder variables: `{{company_name}}`, `{{product_feature}}`
3. Regular users select template, fill in 5-field form
4. System generates page using template structure + AI-enhanced content

**Benefits:**

- Maintains brand consistency
- Speeds up page creation for common use cases
- Reduces AI API costs (structure predefined)

***

## 4. Database Schema (Supabase)

### 4.1 Tables

#### `pages` Table

```sql
create table pages (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  title text not null,
  content_type text not null, -- 'landing', 'blog', 'product'
  status text default 'draft', -- 'draft', 'in_review', 'published', 'archived'
  content jsonb not null,
  seo_metadata jsonb,
  featured_image text, -- Supabase Storage URL
  author_id uuid references auth.users(id),
  published_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Indexes
create index pages_status_idx on pages(status);
create index pages_author_idx on pages(author_id);
create index pages_slug_idx on pages(slug);
```


#### `media_library` Table

```sql
create table media_library (
  id uuid default gen_random_uuid() primary key,
  filename text not null,
  storage_path text not null,
  public_url text not null,
  file_type text, -- 'image/png', 'image/jpeg'
  size_bytes integer,
  alt_text text,
  tags text[],
  uploaded_by uuid references auth.users(id),
  created_at timestamp with time zone default now()
);
```


#### `user_roles` Table

```sql
create table user_roles (
  user_id uuid references auth.users(id) primary key,
  role text not null, -- 'admin', 'editor', 'viewer'
  created_at timestamp with time zone default now()
);
```


### 4.2 Row Level Security (RLS) Policies

```sql
-- Editors can only see their own drafts + all published
create policy "Users can view own drafts"
  on pages for select
  using (
    auth.uid() = author_id 
    or status = 'published'
    or exists (
      select 1 from user_roles 
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- Only admins can delete
create policy "Only admins can delete"
  on pages for delete
  using (
    exists (
      select 1 from user_roles 
      where user_id = auth.uid() and role = 'admin'
    )
  );
```


***

## 5. AI Integration Specifications

### 5.1 Gemini 3 Pro (Text Generation)

**API Configuration:**

- Model: `gemini-3-pro`
- Temperature: 0.7 (balanced creativity)
- Max Tokens: 2048 for landing pages, 4096 for blogs
- Safety Settings: Block only high-risk harmful content

**Prompt Engineering Template:**

```typescript
const prompt = `
You are a professional copywriter for ${targetAudience} audiences.

Task: Create a ${contentType} about "${topic}".
Tone: ${tone}
Key Points to Emphasize: ${keyPoints.join(', ')}

Return ONLY valid JSON with this structure:
{
  "hero": {
    "headline": "Compelling headline under 60 chars",
    "subheadline": "Supporting text 120-150 chars",
    "cta_primary": "Button text",
    "cta_secondary": "Secondary button text"
  },
  "sections": [
    {
      "type": "features",
      "heading": "Section heading",
      "items": [
        {"title": "Feature 1", "description": "..."}
      ]
    }
  ],
  "seo": {
    "meta_title": "...",
    "meta_description": "..."
  }
}

Ensure all text is persuasive, benefit-focused, and ${tone} in tone.
`;
```


### 5.2 Nano Banana Pro (Image Generation)

**API Configuration:**

- Model: `gemini-3-pro-image`
- Resolution: `MEDIA_RESOLUTION_4K` for hero images
- Aspect Ratio: 16:9 for landing pages, 3:2 for blog featured images
- Style Modifiers: Photorealistic, Studio Lighting, Professional

**Prompt Template:**

```typescript
const imagePrompt = `
Professional marketing photograph for ${topic}.
Style: ${style}
Requirements:
- High-end commercial quality
- ${aspectRatio} aspect ratio
- Bright, inviting atmosphere
- No text overlays
- Suitable for ${targetAudience} audience
`;
```


### 5.3 Error Handling \& Fallbacks

**AI Generation Failures:**

- Retry logic: 3 attempts with exponential backoff
- Fallback: Generic template content if AI fails
- User notification: "AI generation unavailable. Using template."

**Rate Limiting:**

- Implement queue system for concurrent requests
- User limit: 20 generations per hour per user
- Admin override available

***

## 6. Frontend Implementation

### 6.1 Admin Panel Routes

| Route | Purpose | Access |
| :-- | :-- | :-- |
| `/admin` | Dashboard overview | Authenticated users |
| `/admin/create` | AI generation form | Editor, Admin |
| `/admin/edit/[id]` | Content editor | Owner, Admin |
| `/admin/media` | Media library | Editor, Admin |
| `/admin/settings` | Site settings, user management | Admin only |

### 6.2 Component Architecture

**Key Components:**

```
/components
  /admin
    - ContentTable.tsx (data table with filters)
    - AIGenerationForm.tsx (topic input form)
    - RichTextEditor.tsx (Tiptap wrapper)
    - BlockEditor.tsx (drag-drop section manager)
    - MediaPicker.tsx (image browser modal)
    - PublishPanel.tsx (status/SEO controls)
  /blocks
    - HeroBlock.tsx
    - FeaturesBlock.tsx
    - TestimonialBlock.tsx
    - CTABlock.tsx
  /public
    - PageRenderer.tsx (renders JSONB content)
```


### 6.3 State Management

- **Server State:** React Query for Supabase data fetching
- **Form State:** React Hook Form for generation forms
- **Editor State:** Zustand for editor UI state (preview mode, selected block)

***

## 7. User Experience Requirements

### 7.1 Onboarding Flow (First-Time User)

**Step 1:** Welcome modal explaining the system
**Step 2:** Interactive tutorial:

- "Click here to create your first page"
- "Enter a topic and watch AI generate content"
- "Edit any text by clicking on it"
- "Publish when ready"
**Step 3:** Pre-loaded example page (editable sandbox)


### 7.2 Performance Standards

- **Page Load:** < 2 seconds for admin dashboard
- **AI Generation:** < 15 seconds for landing page, < 30 seconds for blog
- **Editor Responsiveness:** < 100ms input lag
- **Image Optimization:** All images < 500KB after compression


### 7.3 Mobile Responsiveness

**Admin Panel:**

- Fully responsive down to 375px width (iPhone SE)
- Collapsible sidebar menu
- Stacked table columns on mobile
- Touch-optimized buttons (44px minimum)

***

## 8. Security \& Compliance

### 8.1 Data Protection

- All API keys stored as Vercel environment variables
- Supabase RLS enforced on all tables
- User content isolated per author_id
- Automatic SQL injection protection (Supabase client)


### 8.2 Content Moderation

- AI safety filters enabled on Gemini API
- Manual approval workflow option for sensitive industries
- Profanity filter on published content (optional config)


### 8.3 Backup \& Recovery

- Supabase automatic daily backups (7-day retention)
- "Restore Version" feature (stores content_history JSONB array)
- Export all data to JSON (admin function)

***

## 9. Success Metrics (KPIs)

### 9.1 User Adoption

- **Target:** 80% of marketing team uses system within 30 days
- **Metric:** Active users per week


### 9.2 Content Velocity

- **Target:** 3x increase in published pages per month
- **Metric:** Compare pages published pre/post implementation


### 9.3 AI Efficiency

- **Target:** 70% of AI-generated content published with <20% edits
- **Metric:** Track edit operations per generated page


### 9.4 Cost Efficiency

- **Target:** <\$100/month in AI API costs for team of 10 users
- **Metric:** Monitor Gemini API usage via Google Cloud Console

***

## 10. Implementation Timeline

### Phase 1: Foundation (Week 1-2)

- [ ] Supabase database schema setup
- [ ] Authentication system with role-based access
- [ ] Basic admin dashboard UI (empty state)
- [ ] Next.js routing structure


### Phase 2: AI Integration (Week 3-4)

- [ ] Gemini 3 Pro API integration
- [ ] Nano Banana Pro image generation
- [ ] Server Actions for content generation
- [ ] Basic generation form UI


### Phase 3: Editor (Week 5-6)

- [ ] Rich text editor implementation (Tiptap)
- [ ] Block-based editing system
- [ ] Live preview mode
- [ ] Media upload to Supabase Storage


### Phase 4: Publishing (Week 7)

- [ ] Publish/draft workflow
- [ ] SEO metadata panel
- [ ] Public page rendering from JSONB
- [ ] Slug-based routing


### Phase 5: Polish \& Launch (Week 8)

- [ ] User onboarding tutorial
- [ ] Mobile responsive admin panel
- [ ] Performance optimization
- [ ] User acceptance testing
- [ ] Production deployment to Vercel

***

## 11. Risks \& Mitigation

| Risk | Impact | Mitigation |
| :-- | :-- | :-- |
| **AI generates inappropriate content** | High | Implement content moderation API, manual review for published content |
| **High AI API costs** | Medium | Rate limiting per user, cache common generations, use templates |
| **Users find editor too complex** | High | Conduct user testing, simplify UI, provide video tutorials |
| **Slow page generation** | Medium | Show progress indicator, allow background generation with notifications |
| **Vendor lock-in (Google AI)** | Low | Abstract AI calls behind service layer for easy provider swap |


***

## 12. Future Enhancements (Roadmap)

### Phase 2 Features (Post-Launch)

- [ ] A/B testing (serve variant pages to different audiences)
- [ ] Analytics dashboard (page views, conversion tracking)
- [ ] Multi-language support (AI translation)
- [ ] Custom domain per campaign (subdomain routing)
- [ ] Zapier integration (trigger page generation from CRM)


### Phase 3 Features (Advanced)

- [ ] Voice-to-page (speak topic, generate page)
- [ ] Competitor analysis AI (analyze competitor page, generate better version)
- [ ] Brand voice training (fine-tune AI on your past content)
- [ ] Collaborative editing (real-time multi-user)

***

## 13. Acceptance Criteria

**The system is ready for launch when:**

✅ **User Story 1:** Marketing manager can generate a landing page in <2 minutes without developer help
✅ **User Story 2:** Sales rep can edit generated content and publish immediately
✅ **User Story 3:** All published pages load in <3 seconds on mobile
✅ **User Story 4:** 95% of AI generations produce usable content (minimal edits needed)
✅ **User Story 5:** System handles 50 concurrent users without performance degradation

***

## 14. Support \& Training

### 14.1 Documentation

- Admin user guide (PDF + video walkthrough)
- Developer documentation (API endpoints, schema)
- Troubleshooting FAQ


### 14.2 Training Sessions

- **Week 1:** Live demo for marketing team (1 hour)
- **Week 2:** Hands-on workshop with sample projects
- **Ongoing:** Office hours every Friday for Q\&A

***

**Document Version:** 1.0
**Last Updated:** November 23, 2025
**Owner:** Jeffrey DeWee
**Review Date:** December 23, 2025

