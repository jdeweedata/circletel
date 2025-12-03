# CMS AI Builder Enhancements - Task Breakdown

**Spec ID**: `20251203-cms-ai-builder-enhancements`
**Total Story Points**: 55
**Estimated Duration**: 3-4 weeks

---

## Task Groups Overview

| Group | Engineer | Tasks | Story Points | Duration |
|-------|----------|-------|--------------|----------|
| Group 1 | Database Engineer | Schema, migrations, RLS | 5 | 2 days |
| Group 2 | Backend Engineer | Services, AI prompts | 13 | 4 days |
| Group 3 | API Engineer | Endpoints, validation | 8 | 3 days |
| Group 4 | Frontend Engineer | UI components | 21 | 6 days |
| Group 5 | Testing Engineer | Tests, QA | 8 | 3 days |
| **TOTAL** | - | **25 tasks** | **55** | **3-4 weeks** |

---

## Dependencies

```
Group 1 (Database) ──┬──> Group 2 (Backend) ──┬──> Group 4 (Frontend)
                     │                        │
                     └──> Group 3 (API) ──────┘
                                              │
                                              └──> Group 5 (Testing)
```

---

## Group 1: Database Engineer

**Responsible**: Database Engineer
**Story Points**: 5
**Duration**: 2 days
**Dependencies**: None (blocking)

### Task 1.1: Create Database Migration

**Story Points**: 3
**Priority**: Critical (blocking)

Create migration file: `supabase/migrations/20251203_cms_ai_builder_enhancements.sql`

**Deliverables**:
- [ ] Create `cms_theme_presets` table
  - `id`, `name`, `slug`, `colors` (JSONB), `fonts` (JSONB)
  - `industry`, `mood`, `is_system`, `created_by`
  - `created_at`, `updated_at`
- [ ] Create `cms_site_briefs` table
  - `id`, `page_id` (FK), `business_name`, `industry`
  - `target_audience`, `value_proposition`, `key_messages`
  - `tone`, `theme_preferences`, `layout_preferences`
  - `section_visibility` (JSONB)
- [ ] Create `cms_seo_scores` table
  - `id`, `page_id` (FK), `score`, `checks` (JSONB)
  - `recommendations`, `calculated_at`
- [ ] Create `cms_layout_variations` table
  - `id`, `name`, `description`, `block_types`
  - `structure` (JSONB), `thumbnail_url`, `is_system`
- [ ] Add columns to `cms_pages`: `seo_score`, `theme_preset_id`, `site_brief_id`
- [ ] Create indexes for foreign keys and common queries
- [ ] Add seed data for system theme presets

**Validation**:
- Migration runs without errors
- All tables created with correct constraints
- Foreign keys cascade properly

---

### Task 1.2: Implement RLS Policies

**Story Points**: 2
**Priority**: Critical

Create Row Level Security policies for new tables.

**Deliverables**:
- [ ] `cms_theme_presets` policies:
  - Public SELECT for `is_system = true`
  - User SELECT for own presets
  - Admin ALL for management
- [ ] `cms_site_briefs` policies:
  - User ALL for own page briefs
  - Admin ALL for management
- [ ] `cms_seo_scores` policies:
  - User SELECT for own page scores
  - System INSERT (service role)
- [ ] `cms_layout_variations` policies:
  - Public SELECT for `is_system = true`
  - Admin ALL for management
- [ ] Test with different auth contexts

**Validation**:
- Users can only access own data
- Admins have full access
- System presets visible to all

---

## Group 2: Backend Engineer

**Responsible**: Backend Engineer
**Story Points**: 13
**Duration**: 4 days
**Dependencies**: Group 1

### Task 2.1: Create Theme Service

**Story Points**: 3
**Priority**: High

Create `lib/cms/theme-service.ts`

**Deliverables**:
- [ ] Define `ThemeColors` interface
- [ ] Implement `generateTheme(industry, mood, baseColor)`:
  - Build AI prompt for color palette generation
  - Parse and validate AI response
  - Return 5-color palette
- [ ] Implement `shuffleTheme(theme)`:
  - Swap primary and secondary colors
  - Return new theme object
- [ ] Implement `getContrastRatio(color1, color2)`:
  - Calculate WCAG contrast ratio
  - Validate accessibility
- [ ] Implement `saveThemePreset(theme, name, userId)`
- [ ] Implement `getThemePresets(userId, includeSystem)`
- [ ] Add CircleTel brand presets as defaults

**Validation**:
- Generated themes have valid hex colors
- Contrast ratios meet WCAG AA (4.5:1)
- Presets save and load correctly

---

### Task 2.2: Create SEO Scoring Service

**Story Points**: 5
**Priority**: High

Create `lib/cms/seo-scoring.ts`

**Deliverables**:
- [ ] Define SEO check interfaces
- [ ] Implement `checkTitle(title)`:
  - Length: 30-60 characters
  - No duplicate words
  - Contains focus keyword
- [ ] Implement `checkMetaDescription(description)`:
  - Length: 120-160 characters
  - Contains call-to-action
- [ ] Implement `checkHeadings(blocks)`:
  - Has H1 (only one)
  - Has H2s for structure
  - Proper hierarchy
- [ ] Implement `checkImageAlt(blocks)`:
  - All images have alt text
  - Alt text is descriptive
- [ ] Implement `checkContentLength(blocks)`:
  - Minimum 300 words
  - Good paragraph structure
- [ ] Implement `checkKeywords(blocks, keywords)`:
  - Keywords appear in content
  - Natural keyword density (1-2%)
- [ ] Implement `calculateSEOScore(page)`:
  - Weighted average of all checks
  - Return score, grade, recommendations
- [ ] Add AI-powered recommendation generation

**Validation**:
- Scores match manual SEO audits
- Recommendations are actionable
- Performance under 500ms

---

### Task 2.3: Create Layout Service

**Story Points**: 3
**Priority**: Medium

Create `lib/cms/layout-service.ts`

**Deliverables**:
- [ ] Define layout variation interfaces
- [ ] Implement `generateLayoutVariations(blocks, preferences)`:
  - Analyze current block structure
  - Generate 3 alternative arrangements
  - Preserve all content
- [ ] Implement variation strategies:
  - Column layout changes (1 → 2, 2 → 1)
  - Alignment shifts (left ↔ center ↔ right)
  - Spacing adjustments (compact ↔ spacious)
  - Block reordering (hero position, CTA placement)
- [ ] Implement `applyLayoutVariation(blocks, variation)`:
  - Transform blocks to new structure
  - Maintain content integrity
- [ ] Add preset layout templates

**Validation**:
- Content preserved in all variations
- Valid block structures generated
- No duplicate blocks created

---

### Task 2.4: Create Site Brief Service

**Story Points**: 2
**Priority**: Medium

Create `lib/cms/site-brief.ts`

**Deliverables**:
- [ ] Define `SiteBrief` interface
- [ ] Implement `createSiteBrief(pageId, data)`
- [ ] Implement `getSiteBrief(pageId)`
- [ ] Implement `updateSiteBrief(pageId, data)`
- [ ] Implement `deleteSiteBrief(pageId)`
- [ ] Add validation for all fields
- [ ] Integrate with AI context building

**Validation**:
- CRUD operations work correctly
- Validation catches invalid data
- Brief used in AI prompts

---

## Group 3: API Engineer

**Responsible**: API Engineer
**Story Points**: 8
**Duration**: 3 days
**Dependencies**: Group 2

### Task 3.1: Create Theme API

**Story Points**: 2
**Priority**: High

Create `app/api/admin/cms/theme/route.ts`

**Deliverables**:
- [ ] POST handler for theme operations:
  - `action: 'generate'`: Call theme service
  - `action: 'shuffle'`: Swap colors
  - `action: 'save'`: Save as preset
- [ ] GET handler for presets:
  - Return user + system presets
  - Include usage count
- [ ] Request validation with Zod
- [ ] Rate limiting (10 generates/hour)
- [ ] Error handling and logging

**Validation**:
- All endpoints return correct responses
- Validation rejects invalid inputs
- Rate limits enforced

---

### Task 3.2: Create SEO Score API

**Story Points**: 2
**Priority**: High

Create `app/api/admin/cms/seo-score/route.ts`

**Deliverables**:
- [ ] POST handler for score calculation:
  - Accept page content and metadata
  - Return score, grade, checks, recommendations
- [ ] GET handler for historical scores:
  - Return last 10 scores for page
  - Include trend data
- [ ] Implement score caching (5 min TTL)
- [ ] Add webhook for score updates
- [ ] Error handling

**Validation**:
- Scores calculated correctly
- Cache prevents redundant calculations
- History tracks changes

---

### Task 3.3: Create Layout API

**Story Points**: 2
**Priority**: Medium

Create `app/api/admin/cms/layout/route.ts`

**Deliverables**:
- [ ] POST handler for variations:
  - Accept current blocks and preferences
  - Return 3 layout variations
- [ ] GET handler for preset layouts:
  - Return system layout templates
  - Filter by block types
- [ ] Request validation
- [ ] Error handling

**Validation**:
- Variations preserve content
- Preset layouts load correctly
- Performance under 5 seconds

---

### Task 3.4: Create Site Brief API

**Story Points**: 2
**Priority**: Medium

Create `app/api/admin/cms/brief/[pageId]/route.ts`

**Deliverables**:
- [ ] GET handler: Return brief for page
- [ ] PUT handler: Update brief for page
- [ ] DELETE handler: Remove brief
- [ ] Authorization checks (page owner)
- [ ] Validation and error handling

**Validation**:
- CRUD operations work
- Only page owner can access
- Proper error responses

---

## Group 4: Frontend Engineer

**Responsible**: Frontend Engineer
**Story Points**: 21
**Duration**: 6 days
**Dependencies**: Group 2, Group 3

### Task 4.1: Create AITextField Component

**Story Points**: 5
**Priority**: High

Create `components/admin/cms/AITextField.tsx`

**Deliverables**:
- [ ] Text input with AI button overlay
- [ ] Sparkle icon (✨) on hover
- [ ] AI menu with options:
  - "Write new" - Generate from scratch
  - "Improve" - Enhance existing text
  - "Shorten" - Make more concise
  - "Expand" - Add more detail
- [ ] Loading state during generation
- [ ] Preview mode for AI text:
  - Highlight background (orange-50)
  - Accept/Reject buttons
- [ ] Streaming text display
- [ ] Context awareness (headline vs body)
- [ ] Multiline variant (textarea)
- [ ] Integration with form libraries

**Validation**:
- AI menu appears on hover
- Text generates correctly
- Accept/Reject workflow works
- Undo restores original

---

### Task 4.2: Create ThemeControls Component

**Story Points**: 3
**Priority**: High

Create `components/admin/cms/ThemeControls.tsx`

**Deliverables**:
- [ ] Shuffle Colors button:
  - Swap primary ↔ secondary
  - Instant preview update
- [ ] Generate Theme button:
  - Opens modal with options
  - Industry dropdown
  - Mood selector (professional, playful, elegant, etc.)
  - Base color picker (optional)
- [ ] Theme preview panel:
  - Color swatches with labels
  - Sample UI elements
- [ ] Save as Preset option
- [ ] Preset selector dropdown
- [ ] Loading states

**Validation**:
- Shuffle works instantly
- Generation returns valid themes
- Presets save and load

---

### Task 4.3: Create SEOScorePanel Component

**Story Points**: 5
**Priority**: High

Create `components/admin/cms/SEOScorePanel.tsx`

**Deliverables**:
- [ ] Score badge in builder header:
  - Circular score display (0-100)
  - Color: Red (<50), Yellow (50-79), Green (80+)
  - Click to expand panel
- [ ] Detailed panel with checks:
  - Title check with status
  - Meta description check
  - Headings structure
  - Image alt text coverage
  - Content length
  - Keyword usage
- [ ] Each check shows:
  - Pass/fail icon
  - Current value
  - Recommendation (if failing)
  - "Fix with AI" button
- [ ] Real-time score updates
- [ ] Score history chart (last 10)

**Validation**:
- Score updates on content change
- Recommendations are helpful
- Fix with AI works

---

### Task 4.4: Create SiteBriefEditor Component

**Story Points**: 5
**Priority**: Medium

Create `components/admin/cms/SiteBriefEditor.tsx`

**Deliverables**:
- [ ] Modal with tabbed sections:
  - **Profile**: Business name, industry, audience
  - **Description**: Value prop, key messages
  - **Structure**: Section toggles (checkboxes)
  - **Theme**: Color preferences, mood
  - **Layout**: Alignment, spacing preferences
- [ ] Form validation for all fields
- [ ] Save/Cancel buttons
- [ ] Loading state during save
- [ ] Integration with page store
- [ ] Auto-populate from existing page

**Validation**:
- All tabs accessible
- Data saves correctly
- Brief used in AI generation

---

### Task 4.5: Create SectionToggle Component

**Story Points**: 3
**Priority**: Medium

Create `components/admin/cms/SectionToggle.tsx`

**Deliverables**:
- [ ] Eye icon on each block header
- [ ] Click toggles visibility:
  - Visible: Full opacity, normal
  - Hidden: 30% opacity, strikethrough label
- [ ] Hidden blocks excluded from:
  - Preview mode
  - Published output
  - SEO calculations
- [ ] Bulk toggle in site brief
- [ ] Keyboard shortcut (H for hide)
- [ ] Persist state in page data

**Validation**:
- Toggle works immediately
- Hidden blocks don't render
- State persists on save

---

### Task 4.6: Integrate into Existing Components

**Story Points**: 5
**Priority**: High

Modify existing CMS components.

**Deliverables**:
- [ ] `BuilderHeader.tsx`:
  - Add SEO score badge
  - Add site brief menu item
- [ ] `BuilderCanvas.tsx`:
  - Add section toggle to blocks
  - Handle hidden block rendering
- [ ] `PropertiesPanel.tsx`:
  - Replace text inputs with AITextField
  - Add context for each field type
- [ ] `AIGeneratorPanel.tsx`:
  - Add theme controls section
  - Add layout variations section
  - Reorganize existing features
- [ ] `store.ts`:
  - Add theme actions (shuffle, generate, set)
  - Add visibility toggle action
  - Add site brief actions

**Validation**:
- All integrations work
- No breaking changes
- Consistent styling

---

## Group 5: Testing Engineer

**Responsible**: Testing Engineer
**Story Points**: 8
**Duration**: 3 days
**Dependencies**: Group 4

### Task 5.1: Unit Tests

**Story Points**: 3
**Priority**: High

Create unit tests for services.

**Deliverables**:
- [ ] `theme-service.test.ts`:
  - Theme generation with various inputs
  - Shuffle function
  - Contrast ratio calculation
  - Preset CRUD
- [ ] `seo-scoring.test.ts`:
  - Each check function
  - Score calculation
  - Edge cases (empty content, very long)
- [ ] `layout-service.test.ts`:
  - Variation generation
  - Content preservation
  - Layout application
- [ ] `site-brief.test.ts`:
  - Validation functions
  - CRUD operations

**Validation**:
- 80%+ code coverage
- All edge cases covered
- Tests run in < 30 seconds

---

### Task 5.2: Integration Tests

**Story Points**: 3
**Priority**: High

Create API integration tests.

**Deliverables**:
- [ ] Theme API tests:
  - Generate theme endpoint
  - Shuffle endpoint
  - Presets endpoint
  - Auth required
- [ ] SEO Score API tests:
  - Calculate score endpoint
  - History endpoint
  - Caching behavior
- [ ] Layout API tests:
  - Variations endpoint
  - Presets endpoint
- [ ] Site Brief API tests:
  - CRUD operations
  - Authorization

**Validation**:
- All endpoints tested
- Error cases covered
- Auth verified

---

### Task 5.3: E2E Tests

**Story Points**: 2
**Priority**: Medium

Create Playwright E2E tests.

**Deliverables**:
- [ ] Theme workflow test:
  - Open builder
  - Shuffle colors
  - Generate new theme
  - Save as preset
- [ ] AI text generation test:
  - Click AI button on field
  - Select "Improve"
  - Accept generated text
  - Verify save
- [ ] SEO score test:
  - View initial score
  - Add content to improve
  - Verify score update
  - Click "Fix with AI"
- [ ] Section toggle test:
  - Hide section
  - Verify preview
  - Unhide section

**Validation**:
- Tests run on CI
- Screenshots on failure
- Under 2 minutes total

---

## Task Checklist Summary

### Group 1: Database (5 pts)
- [ ] Task 1.1: Database migration (3 pts)
- [ ] Task 1.2: RLS policies (2 pts)

### Group 2: Backend (13 pts)
- [ ] Task 2.1: Theme service (3 pts)
- [ ] Task 2.2: SEO scoring service (5 pts)
- [ ] Task 2.3: Layout service (3 pts)
- [ ] Task 2.4: Site brief service (2 pts)

### Group 3: API (8 pts)
- [ ] Task 3.1: Theme API (2 pts)
- [ ] Task 3.2: SEO Score API (2 pts)
- [ ] Task 3.3: Layout API (2 pts)
- [ ] Task 3.4: Site Brief API (2 pts)

### Group 4: Frontend (21 pts)
- [ ] Task 4.1: AITextField component (5 pts)
- [ ] Task 4.2: ThemeControls component (3 pts)
- [ ] Task 4.3: SEOScorePanel component (5 pts)
- [ ] Task 4.4: SiteBriefEditor component (5 pts)
- [ ] Task 4.5: SectionToggle component (3 pts)
- [ ] Task 4.6: Integrate into existing (5 pts)

### Group 5: Testing (8 pts)
- [ ] Task 5.1: Unit tests (3 pts)
- [ ] Task 5.2: Integration tests (3 pts)
- [ ] Task 5.3: E2E tests (2 pts)

---

## Notes

- Start with Group 1 (database) as it blocks all other groups
- Groups 2 and 3 can run in parallel after Group 1
- Group 4 needs Groups 2 and 3 complete
- Group 5 can start E2E tests once Group 4 has key components
- AI features depend on existing Gemini integration
- Use existing CMS patterns for consistency
