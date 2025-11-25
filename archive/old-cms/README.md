# Archived Custom CMS

**Date Archived:** November 24, 2025
**Reason:** Migrating to Prismic Slice Machine for no-code visual page building

## What Was Archived

This folder contains the complete custom CMS implementation that was built with Google Gemini 3 Pro integration.

### Folders Archived:

1. **`lib/cms/`** - AI service, types, prompt templates, Gemini integration
2. **`components/cms/`** - Custom CMS UI components (TipTap editor, media library, etc.)
3. **`app/admin/cms/`** - Admin dashboard for CMS management
4. **`app/api/cms/`** - API routes (generate, pages, media, usage tracking)
5. **`app/admin/studio/`** - Legacy Sanity Studio (if applicable)
6. **`app/cms-blog/`** - Blog rendering routes
7. **`app/cms-pages/`** - Pages rendering routes
8. **`app/cms-products/`** - Products rendering routes

### Database Tables (NOT DROPPED)

The following tables remain in Supabase for historical data:
- `pages` - Content storage with JSONB
- `media_library` - File tracking
- `cms_ai_usage` - AI usage and rate limiting

### Features That Were Implemented

- ✅ Google Gemini 3 Pro text generation
- ✅ TipTap rich text editor
- ✅ Media library with Supabase Storage
- ✅ SEO metadata management
- ✅ Content versioning (via `content_history` JSONB)
- ✅ Thought signatures for multi-turn AI conversations
- ✅ Rate limiting (20 generations/hour)
- ✅ RBAC integration with CircleTel admin system
- ✅ Draft/Review/Published/Archived workflow

### Why We Moved to Prismic

1. **No-Code Visual Builder** - Marketing team can build pages without developer help
2. **Slice Machine** - Component library approach for reusable sections
3. **Built-in CDN** - Better performance for media assets
4. **Multi-language Support** - Future-proofing for international expansion
5. **Reduced Maintenance** - SaaS platform vs custom-built system

### Retention Policy

- **Keep for 6 months** (until May 2026)
- After 6 months, delete if no rollback is needed
- Database tables kept indefinitely for historical reference

### Related Documentation

- Implementation docs: `docs/features/2025-11-23_cms_no_code/`
- Migrations: `supabase/migrations/20251123*.sql`

---

**Note:** The Gemini AI integration will be preserved in `/admin/ai-copy` as a copywriting assistant tool for the marketing team.
