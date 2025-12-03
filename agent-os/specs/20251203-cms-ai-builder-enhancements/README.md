# CMS AI Builder Enhancements

**Spec ID**: `20251203-cms-ai-builder-enhancements`
**Status**: Planning
**Priority**: High
**Total Story Points**: 55
**Estimated Duration**: 3-4 weeks

---

## Overview

Enhance the CircleTel CMS Page Builder with Wix-like AI features including theme/layout shuffle controls, per-field AI text generation, site brief editor, SEO scoring, and chat-based onboarding flow.

## Key Features

| Feature | Priority | Story Points |
|---------|----------|--------------|
| Theme Shuffle & Generation | High | 8 |
| Layout Variations System | High | 8 |
| Per-Field AI Text Buttons | High | 5 |
| Site Brief Editor | Medium | 8 |
| SEO Scoring System | Medium | 8 |
| Section Toggle Controls | Low | 3 |
| Chat-Based Onboarding | Low | 13 |
| AI Tools Panel Redesign | Medium | 5 |

## Files to Create

```
lib/cms/
├── theme-service.ts          # Theme generation & shuffle logic
├── layout-service.ts         # Layout variations system
├── seo-scoring.ts            # SEO scoring algorithm
├── site-brief.ts             # Site brief data structures
└── onboarding-service.ts     # Chat onboarding flow

components/admin/cms/
├── ThemeControls.tsx         # Theme shuffle UI
├── LayoutVariations.tsx      # Layout variations UI
├── AITextField.tsx           # Per-field AI button
├── SiteBriefEditor.tsx       # Site brief editing modal
├── SEOScorePanel.tsx         # SEO scoring display
├── SectionToggle.tsx         # Section on/off toggles
├── OnboardingChat.tsx        # Chat-based onboarding
└── AIToolsPanel.tsx          # Redesigned AI tools

app/api/admin/cms/
├── theme/route.ts            # Theme generation API
├── layout/route.ts           # Layout variations API
├── seo-score/route.ts        # SEO scoring API
├── brief/route.ts            # Site brief CRUD
└── onboarding/route.ts       # Onboarding chat API
```

## Files to Modify

```
lib/cms/
├── store.ts                  # Add theme/layout actions
├── types.ts                  # Add new type definitions
└── ai-service.ts             # Add theme/layout prompts

components/admin/cms/
├── BuilderCanvas.tsx         # Integrate new controls
├── BuilderHeader.tsx         # Add SEO score indicator
├── PropertiesPanel.tsx       # Add AI text fields
└── AIGeneratorPanel.tsx      # Enhance with new features

app/admin/cms/
├── builder/page.tsx          # Add onboarding flow
└── page.tsx                  # Add site brief access
```

## Database Changes

```sql
-- New tables
cms_site_briefs              # Store site brief data
cms_theme_presets            # Predefined theme palettes
cms_layout_variations        # Layout variation templates
cms_seo_scores               # Historical SEO scores

-- Modified tables
cms_pages                    # Add seo_score, theme_preset_id columns
```

## Quick Start

```bash
# View full specification
cat agent-os/specs/20251203-cms-ai-builder-enhancements/SPEC.md

# View task breakdown
cat agent-os/specs/20251203-cms-ai-builder-enhancements/TASKS.md

# Track progress
cat agent-os/specs/20251203-cms-ai-builder-enhancements/PROGRESS.md
```

## Dependencies

- Existing CMS system (`lib/cms/`, `components/admin/cms/`)
- Gemini 3 Pro API (already integrated)
- Zustand store (already implemented)
- Supabase (already configured)

## Risk Level

**Medium** - Extends existing functionality with new AI-powered features. Main risks are AI response quality and performance impact.

---

**Next Steps**: Review SPEC.md for detailed requirements and TASKS.md for implementation plan.
