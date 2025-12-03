---
type: specification
domain: [cms, ai, admin]
tags: [page-builder, ai-generation, theme, layout, seo, wix-like]
status: planning
created: 2025-12-03
priority: high
story_points: 55
estimated_duration: 3-4 weeks
---

# CMS AI Builder Enhancements - Technical Specification

**Spec ID**: `20251203-cms-ai-builder-enhancements`
**Version**: 1.0
**Created**: 2025-12-03
**Last Updated**: 2025-12-03

---

## Table of Contents

1. [Overview](#overview)
2. [Goals & Non-Goals](#goals--non-goals)
3. [Success Criteria](#success-criteria)
4. [User Stories](#user-stories)
5. [Technical Specification](#technical-specification)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)
8. [Service Layer](#service-layer)
9. [Frontend Components](#frontend-components)
10. [Architecture](#architecture)
11. [Testing Strategy](#testing-strategy)
12. [Risk Assessment](#risk-assessment)

---

## Overview

### Description

Enhance the CircleTel CMS Page Builder with Wix-like AI features to provide a more intuitive, AI-powered website building experience. This includes theme shuffle/generation, layout variations, per-field AI text generation, site brief editing, SEO scoring, and optional chat-based onboarding.

### Business Value

- **Reduced Time-to-Launch**: AI-powered features speed up page creation by 60-70%
- **Improved Quality**: Consistent branding and SEO-optimized content
- **Lower Skill Barrier**: Non-designers can create professional pages
- **Competitive Parity**: Match Wix/Squarespace AI capabilities
- **Content Consistency**: AI ensures brand voice across pages

### Key Metrics

- Average page creation time (target: < 10 minutes)
- AI feature usage rate (target: > 50% of pages)
- SEO score improvement (target: +20 points average)
- User satisfaction with AI suggestions (target: > 4/5)

---

## Goals & Non-Goals

### Goals

- [x] Theme shuffle: Swap primary/secondary colors with one click
- [x] Theme generation: AI creates new color palettes based on industry/mood
- [x] Layout variations: Generate alternative layouts for same content
- [x] Per-field AI buttons: Add AI generation to every text field
- [x] Site brief editor: Edit site profile, structure, theme, layout settings
- [x] SEO scoring: Real-time page SEO score with recommendations
- [x] Section toggles: Enable/disable page sections with checkboxes
- [x] AI Tools Panel: Redesigned panel with all AI features grouped

### Non-Goals

- [ ] Full chat-based site generation from scratch (phase 2)
- [ ] Multi-page site generation in one step (phase 2)
- [ ] eCommerce block types (separate spec)
- [ ] Social media sharing integration (phase 2)
- [ ] A/B testing for layouts (phase 3)
- [ ] AI-powered analytics insights (phase 3)

---

## Success Criteria

### Functional Requirements

- [ ] Users can shuffle theme colors with one click
- [ ] Users can generate new AI themes with industry/mood prompts
- [ ] Users can generate layout variations for any page
- [ ] Every text field has an AI generation button
- [ ] Site brief editor allows modifying all page metadata
- [ ] SEO score displays in header with color-coded status
- [ ] Section toggles show/hide blocks without deleting
- [ ] AI Tools Panel provides unified access to all AI features

### Technical Requirements

- [ ] Theme generation uses Gemini 3 Pro for color theory
- [ ] Layout variations preserve content, change structure
- [ ] AI text fields support streaming responses
- [ ] SEO scoring algorithm matches industry standards
- [ ] All new tables have RLS policies
- [ ] API response times < 3 seconds for AI operations
- [ ] Mobile-responsive UI for all new components

### User Experience Requirements

- [ ] One-click theme shuffle with instant preview
- [ ] Loading states for all AI operations
- [ ] Undo/redo works with AI-generated changes
- [ ] Clear feedback on AI operation success/failure
- [ ] SEO score updates in real-time as content changes

---

## User Stories

### US-1: Theme Shuffle

**As a** CMS user
**I want to** quickly swap my theme colors
**So that** I can explore different color combinations without manual editing

**Acceptance Criteria**:
- Button labeled "Shuffle Colors" in theme controls
- Clicking swaps primary and secondary colors
- Preview updates instantly
- Undo reverts to previous colors
- Works with custom and preset themes

**Story Points**: 2

---

### US-2: AI Theme Generation

**As a** CMS user
**I want to** generate a new color theme using AI
**So that** I get professional color combinations for my industry

**Acceptance Criteria**:
- Button labeled "Generate Theme" opens prompt modal
- User can specify: industry, mood, base color (optional)
- AI generates 5-color palette (primary, secondary, accent, background, text)
- Preview shows theme applied to current page
- "Apply" confirms, "Regenerate" gets new palette
- Generated themes saved to presets for reuse

**Story Points**: 5

---

### US-3: Layout Variations

**As a** CMS user
**I want to** see alternative layouts for my page
**So that** I can choose the best arrangement without rebuilding

**Acceptance Criteria**:
- Button labeled "Generate Layout" in layout controls
- AI suggests 3 layout variations
- Variations preserve all content, change structure
- Thumbnail previews show each option
- Clicking applies layout with animation
- Original layout saved for comparison

**Story Points**: 8

---

### US-4: Per-Field AI Text Generation

**As a** CMS user
**I want to** generate text for any field using AI
**So that** I can quickly fill content with relevant copy

**Acceptance Criteria**:
- Sparkle icon (✨) appears on hover for text fields
- Clicking opens AI prompt with field context
- Options: "Write new", "Improve", "Shorten", "Expand"
- Streaming response shows text appearing
- Accept/Reject buttons for generated content
- Field type context (headline, description, CTA) passed to AI

**Story Points**: 5

---

### US-5: Site Brief Editor

**As a** CMS user
**I want to** edit my site's overall configuration
**So that** AI features have accurate context for generation

**Acceptance Criteria**:
- "Edit Site Brief" accessible from header menu
- Sections: Profile, Description, Structure, Theme, Layout
- Profile: Business name, industry, target audience
- Description: Value proposition, key messages
- Structure: Checkboxes to toggle sections/pages
- Theme: Color preferences, font style, mood
- Layout: Preferred alignment, spacing, density
- Changes saved and used by all AI features

**Story Points**: 8

---

### US-6: SEO Scoring

**As a** CMS user
**I want to** see my page's SEO score in real-time
**So that** I can optimize content before publishing

**Acceptance Criteria**:
- SEO score badge (0-100) in builder header
- Color: Red (<50), Yellow (50-79), Green (80+)
- Clicking opens detailed SEO panel
- Checks: Title length, meta description, headings, alt text, keywords
- Each check shows pass/fail with recommendation
- "Fix with AI" button for failing checks
- Score updates as content changes

**Story Points**: 8

---

### US-7: Section Toggle Controls

**As a** CMS user
**I want to** toggle sections on/off without deleting them
**So that** I can experiment with page structure safely

**Acceptance Criteria**:
- Eye icon on each block for visibility toggle
- Hidden blocks show as grayed out in builder
- Hidden blocks not rendered in preview/publish
- Bulk toggle in site brief structure section
- Toggle state persists across sessions

**Story Points**: 3

---

### US-8: AI Tools Panel Redesign

**As a** CMS user
**I want to** access all AI features from one organized panel
**So that** I can discover and use AI capabilities efficiently

**Acceptance Criteria**:
- AI Tools icon in left sidebar
- Panel sections: Generate, Enhance, SEO, Theme
- Generate: Full page, section, block content
- Enhance: Rewrite, expand, translate, tone shift
- SEO: Score, title, description, alt text
- Theme: Generate, shuffle, presets
- Usage stats and rate limit display
- Quick actions for common operations

**Story Points**: 5

---

## Technical Specification

### File Structure

```
lib/cms/
├── theme-service.ts          # Theme shuffle, generation, presets
├── layout-service.ts         # Layout variation generation
├── seo-scoring.ts            # SEO algorithm and checks
├── site-brief.ts             # Site brief types and validation
├── onboarding-service.ts     # Chat onboarding (phase 2)
├── store.ts                  # (modify) Add new actions
├── types.ts                  # (modify) Add new types
└── ai-service.ts             # (modify) Add theme/layout prompts

components/admin/cms/
├── ThemeControls.tsx         # Theme shuffle and generation UI
├── LayoutVariations.tsx      # Layout options display
├── AITextField.tsx           # Per-field AI generation button
├── SiteBriefEditor.tsx       # Site brief editing modal
├── SEOScorePanel.tsx         # SEO score display and details
├── SectionToggle.tsx         # Block visibility toggle
├── AIToolsPanel.tsx          # Redesigned AI tools sidebar
├── BuilderCanvas.tsx         # (modify) Integrate toggles
├── BuilderHeader.tsx         # (modify) Add SEO badge
├── PropertiesPanel.tsx       # (modify) Use AITextField
└── AIGeneratorPanel.tsx      # (modify) Enhance features

app/api/admin/cms/
├── theme/
│   └── route.ts              # POST: generate, shuffle theme
├── layout/
│   └── route.ts              # POST: generate layout variations
├── seo-score/
│   └── route.ts              # POST: calculate SEO score
├── brief/
│   └── route.ts              # GET/PUT: site brief CRUD
└── generate/
    └── route.ts              # (modify) Add theme/layout types
```

---

## Database Schema

### New Tables

```sql
-- Theme presets (pre-defined and user-generated)
CREATE TABLE cms_theme_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  colors JSONB NOT NULL,
  -- { primary, secondary, accent, background, text }
  fonts JSONB,
  -- { heading, body, accent }
  industry VARCHAR(50),
  mood VARCHAR(50),
  is_system BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site briefs for AI context
CREATE TABLE cms_site_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES cms_pages(id) ON DELETE CASCADE,
  business_name VARCHAR(200),
  industry VARCHAR(100),
  target_audience TEXT,
  value_proposition TEXT,
  key_messages TEXT[],
  tone VARCHAR(50), -- professional, casual, friendly, formal
  theme_preferences JSONB,
  layout_preferences JSONB,
  section_visibility JSONB, -- { hero: true, features: false, ... }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(page_id)
);

-- SEO score history
CREATE TABLE cms_seo_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES cms_pages(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  checks JSONB NOT NULL,
  -- { title: { pass: true, value: "..." }, ... }
  recommendations TEXT[],
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Layout variation templates
CREATE TABLE cms_layout_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  block_types TEXT[] NOT NULL, -- ['hero', 'features', 'cta']
  structure JSONB NOT NULL,
  -- { columns: 2, alignment: 'center', spacing: 'lg' }
  thumbnail_url TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Modified Tables

```sql
-- Add to cms_pages
ALTER TABLE cms_pages ADD COLUMN IF NOT EXISTS
  seo_score INTEGER DEFAULT 0,
  theme_preset_id UUID REFERENCES cms_theme_presets(id),
  site_brief_id UUID REFERENCES cms_site_briefs(id);
```

### RLS Policies

```sql
-- Theme presets: public read, admin write
ALTER TABLE cms_theme_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view system presets" ON cms_theme_presets
  FOR SELECT USING (is_system = true);

CREATE POLICY "Users can view own presets" ON cms_theme_presets
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Admins can manage presets" ON cms_theme_presets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
    )
  );

-- Site briefs: page owner access
ALTER TABLE cms_site_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own briefs" ON cms_site_briefs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM cms_pages
      WHERE id = page_id AND author_id = auth.uid()
    )
  );

-- SEO scores: page owner access
ALTER TABLE cms_seo_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scores" ON cms_seo_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cms_pages
      WHERE id = page_id AND author_id = auth.uid()
    )
  );
```

---

## API Endpoints

### POST /api/admin/cms/theme

Generate or shuffle theme colors.

**Request**:
```typescript
interface ThemeRequest {
  action: 'generate' | 'shuffle';
  // For generate:
  industry?: string;
  mood?: string;
  baseColor?: string;
  // For shuffle:
  currentTheme?: ThemeColors;
}
```

**Response**:
```typescript
interface ThemeResponse {
  success: boolean;
  theme: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts?: {
    heading: string;
    body: string;
  };
  presetId?: string; // If saved as preset
}
```

---

### POST /api/admin/cms/layout

Generate layout variations.

**Request**:
```typescript
interface LayoutRequest {
  blocks: Block[];
  preferences?: {
    alignment?: 'left' | 'center' | 'right';
    density?: 'compact' | 'normal' | 'spacious';
    style?: 'modern' | 'classic' | 'minimal';
  };
}
```

**Response**:
```typescript
interface LayoutResponse {
  success: boolean;
  variations: Array<{
    id: string;
    name: string;
    description: string;
    blocks: Block[];
    thumbnail?: string;
  }>;
}
```

---

### POST /api/admin/cms/seo-score

Calculate SEO score for a page.

**Request**:
```typescript
interface SEOScoreRequest {
  pageId: string;
  title: string;
  content: {
    blocks: Block[];
  };
  seoMetadata: SEOMetadata;
}
```

**Response**:
```typescript
interface SEOScoreResponse {
  success: boolean;
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  checks: {
    title: { pass: boolean; value: string; recommendation?: string };
    metaDescription: { pass: boolean; value: string; recommendation?: string };
    headings: { pass: boolean; count: number; recommendation?: string };
    images: { pass: boolean; withAlt: number; total: number; recommendation?: string };
    content: { pass: boolean; wordCount: number; recommendation?: string };
    keywords: { pass: boolean; found: string[]; recommendation?: string };
  };
  recommendations: string[];
}
```

---

### GET/PUT /api/admin/cms/brief/[pageId]

Get or update site brief for a page.

**GET Response**:
```typescript
interface SiteBrief {
  id: string;
  pageId: string;
  businessName: string;
  industry: string;
  targetAudience: string;
  valueProposition: string;
  keyMessages: string[];
  tone: 'professional' | 'casual' | 'friendly' | 'formal';
  themePreferences: {
    colors?: string[];
    mood?: string;
    style?: string;
  };
  layoutPreferences: {
    alignment?: string;
    density?: string;
  };
  sectionVisibility: Record<string, boolean>;
}
```

---

## Service Layer

### theme-service.ts

```typescript
/**
 * Theme Service
 *
 * Handles theme generation, shuffling, and preset management.
 */

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export async function generateTheme(
  industry: string,
  mood: string,
  baseColor?: string
): Promise<ThemeColors> {
  // Use Gemini to generate color palette
  const prompt = buildThemePrompt(industry, mood, baseColor);
  const result = await generateWithAI(prompt);
  return parseThemeResponse(result);
}

export function shuffleTheme(theme: ThemeColors): ThemeColors {
  return {
    ...theme,
    primary: theme.secondary,
    secondary: theme.primary,
  };
}

export async function saveThemePreset(
  theme: ThemeColors,
  name: string,
  userId: string
): Promise<string> {
  // Save to cms_theme_presets table
}
```

### seo-scoring.ts

```typescript
/**
 * SEO Scoring Service
 *
 * Calculates SEO score based on industry standards.
 */

interface SEOCheck {
  pass: boolean;
  value: string | number;
  weight: number;
  recommendation?: string;
}

export function calculateSEOScore(page: CMSPage): SEOScoreResult {
  const checks = {
    title: checkTitle(page.title, page.seo_metadata?.title),
    metaDescription: checkMetaDescription(page.seo_metadata?.description),
    headings: checkHeadings(page.content.blocks),
    images: checkImageAlt(page.content.blocks),
    content: checkContentLength(page.content.blocks),
    keywords: checkKeywords(page.content.blocks, page.seo_metadata?.keywords),
  };

  const score = calculateWeightedScore(checks);
  const grade = scoreToGrade(score);
  const recommendations = generateRecommendations(checks);

  return { score, grade, checks, recommendations };
}

function checkTitle(pageTitle: string, seoTitle?: string): SEOCheck {
  const title = seoTitle || pageTitle;
  const length = title.length;
  const pass = length >= 30 && length <= 60;

  return {
    pass,
    value: title,
    weight: 15,
    recommendation: pass ? undefined :
      length < 30 ? 'Title is too short. Aim for 30-60 characters.' :
      'Title is too long. Keep it under 60 characters.',
  };
}
```

---

## Frontend Components

### AITextField.tsx

```typescript
'use client';

import { useState } from 'react';
import { Sparkles, Loader2, Check, X } from 'lucide-react';

interface AITextFieldProps {
  value: string;
  onChange: (value: string) => void;
  context: 'headline' | 'description' | 'cta' | 'body';
  placeholder?: string;
  multiline?: boolean;
}

export function AITextField({
  value,
  onChange,
  context,
  placeholder,
  multiline = false,
}: AITextFieldProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const generateText = async (action: 'write' | 'improve' | 'shorten' | 'expand') => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/admin/cms/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'enhance',
          content: value,
          instruction: buildInstruction(action, context),
        }),
      });
      const data = await response.json();
      setPreview(data.content);
    } finally {
      setIsGenerating(false);
    }
  };

  const acceptPreview = () => {
    if (preview) {
      onChange(preview);
      setPreview(null);
    }
  };

  const rejectPreview = () => setPreview(null);

  return (
    <div className="relative group">
      {multiline ? (
        <textarea
          value={preview || value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={preview ? 'bg-orange-50 border-orange-300' : ''}
        />
      ) : (
        <input
          value={preview || value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={preview ? 'bg-orange-50 border-orange-300' : ''}
        />
      )}

      {/* AI Button */}
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {isGenerating ? (
          <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
        ) : preview ? (
          <div className="flex gap-1">
            <button onClick={acceptPreview} className="p-1 bg-green-100 rounded">
              <Check className="w-3 h-3 text-green-600" />
            </button>
            <button onClick={rejectPreview} className="p-1 bg-red-100 rounded">
              <X className="w-3 h-3 text-red-600" />
            </button>
          </div>
        ) : (
          <AITextMenu onSelect={generateText} />
        )}
      </div>
    </div>
  );
}
```

### ThemeControls.tsx

```typescript
'use client';

import { useState } from 'react';
import { Shuffle, Wand2, Palette } from 'lucide-react';
import { usePageBuilderStore } from '@/lib/cms/store';

export function ThemeControls() {
  const [isGenerating, setIsGenerating] = useState(false);
  const theme = usePageBuilderStore((s) => s.currentPage?.theme_settings);
  const setTheme = usePageBuilderStore((s) => s.setTheme);

  const shuffleColors = () => {
    if (!theme) return;
    setTheme({
      ...theme,
      primaryColor: theme.secondaryColor,
      secondaryColor: theme.primaryColor,
    });
  };

  const generateTheme = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/admin/cms/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          industry: 'telecom',
          mood: 'professional',
        }),
      });
      const data = await response.json();
      if (data.success) {
        setTheme(data.theme);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-4 border-b">
      <h3 className="text-sm font-medium mb-3">Theme Controls</h3>
      <div className="flex gap-2">
        <button
          onClick={shuffleColors}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          <Shuffle className="w-4 h-4" />
          Shuffle Colors
        </button>
        <button
          onClick={generateTheme}
          disabled={isGenerating}
          className="flex items-center gap-2 px-3 py-2 bg-orange-100 rounded-lg hover:bg-orange-200"
        >
          <Wand2 className="w-4 h-4" />
          {isGenerating ? 'Generating...' : 'Generate Theme'}
        </button>
      </div>
    </div>
  );
}
```

---

## Architecture

See `architecture.md` for detailed diagrams.

---

## Testing Strategy

### Unit Tests

- Theme shuffle function
- SEO scoring algorithm
- Layout variation generation
- Site brief validation

### Integration Tests

- Theme API endpoints
- Layout API endpoints
- SEO score API
- Site brief CRUD

### E2E Tests

- Theme shuffle workflow
- AI text generation in fields
- SEO score display and updates
- Site brief editor modal

---

## Risk Assessment

### Risk Level: Medium

### Risk Factors

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| AI response quality | Medium | Medium | Prompt engineering, fallbacks |
| Rate limiting | Low | High | Usage tracking, user quotas |
| Performance impact | Medium | Medium | Caching, async operations |
| Theme accessibility | Low | High | WCAG contrast checking |
| Layout breaks | Medium | Medium | Validation, previews |

### Mitigations

1. **AI Quality**: Extensive prompt testing, regenerate options
2. **Rate Limits**: Display usage, warn before limits
3. **Performance**: Cache theme presets, debounce SEO scoring
4. **Accessibility**: Auto-check contrast ratios, warn on issues
5. **Layout Safety**: Preview before apply, undo support

---

## Implementation Notes

### Dependencies

- Existing CMS system is stable and tested
- Gemini 3 Pro API is working (text and image)
- Zustand store supports new actions
- Supabase migrations ready

### Phasing

**Phase 1** (This spec):
- Theme shuffle and generation
- Per-field AI text
- SEO scoring
- Section toggles

**Phase 2** (Future):
- Chat-based onboarding
- Full page generation
- Social sharing
- Multi-page sites

### Performance Budget

- Theme operations: < 2s
- Layout generation: < 5s
- SEO scoring: < 500ms
- AI text generation: < 3s (streaming)
