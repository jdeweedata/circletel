# ADR-001: CMS Migration from Custom Gemini-Powered to Prismic

**Status:** Accepted
**Date:** 2025-11-24
**Decision Makers:** Development Team

## Context

CircleTel had a custom CMS implementation featuring:
- Google Gemini 3 Pro AI text generation
- TipTap rich text editor
- Media library with Supabase Storage
- Content versioning and workflow (Draft/Review/Published/Archived)
- Rate-limited AI generation (20/hour)
- RBAC integration with admin system

The system worked but required developer involvement for any page changes, creating a bottleneck for the marketing team.

## Decision

Migrate to Prismic Slice Machine for content management.

## Rationale

1. **No-Code Visual Builder** - Marketing team can build and modify pages without developer assistance
2. **Slice Machine** - Component library approach enables reusable, consistent page sections
3. **Built-in CDN** - Better performance for media assets vs Supabase Storage
4. **Multi-language Support** - Future-proofing for potential international expansion
5. **Reduced Maintenance** - SaaS platform eliminates custom CMS maintenance burden
6. **Industry Standard** - Easier onboarding for new team members familiar with headless CMS

## Consequences

### Positive
- Marketing team autonomy for content updates
- Faster time-to-publish for landing pages
- Professional content preview and scheduling
- Reduced developer workload on content tasks

### Negative
- Monthly SaaS cost (Prismic subscription)
- Migration effort for existing content
- Team training on new platform
- Less customization flexibility than custom solution

### Technical Debt Addressed
- Removed 57 files (636KB) of custom CMS code
- Eliminated unmaintained Gemini integration
- Reduced codebase complexity

## Implementation

1. **Archived Code:** `archive/old-cms/` (removed 2026-02-08)
2. **New Implementation:** `docs/features/2025-11-23_cms_no_code/`
3. **Database Tables:** Kept for historical reference (`pages`, `media_library`, `cms_ai_usage`)
4. **AI Copywriting:** Preserved in `/admin/ai-copy` as standalone tool

## Related Documents

- Original archive README: Removed with archive folder
- Feature spec: `docs/features/2025-11-23_cms_no_code/`
- Migrations: `supabase/migrations/20251123*.sql`

---

**Archive Removal Date:** 2026-02-08
**Removal Reason:** No active imports, 3 months into 6-month retention period, tech debt cleanup
