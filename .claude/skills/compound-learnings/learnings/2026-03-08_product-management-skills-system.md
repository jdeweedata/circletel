# Product Management Skills System Implementation

**Date**: 2026-03-08
**Duration**: ~45 minutes
**Files Created**: 11 files (~2,500 lines)

---

## What Was Built

Complete agentic product management skill system for CircleTel:

| Skill | Command | Purpose |
|-------|---------|---------|
| Master Router | `/product` | Menu and routing |
| Browse Suppliers | `/product-browse` | Filter Scoop, MiRO, Nology catalogues |
| Market-Fit | `/product-analyze` | Competitor comparison, go/no-go |
| Doc Generation | `/product-docs` | Create CPS, BRD, FSD |
| Lifecycle | `/product-lifecycle` | Track Draft→Active→Archived |

**Location**: `.claude/skills/product-management/`

---

## Reusable Patterns

### 1. Master + Sub-Skills Architecture

```
skill-name/
├── SKILL.md                    # Master router (shows menu)
├── references/                 # Extracted data for context
│   └── *.md
├── sub-skill-1/SKILL.md        # Sub-command
├── sub-skill-2/SKILL.md        # Sub-command
└── templates/                  # Reusable output templates
    └── *.md
```

**When to Use**: Multi-command skill systems with shared context

**Benefits**:
- Clean `/skill-name` menu command
- `/skill-name/sub-skill` for specific functions
- Shared references reduce context
- Templates ensure consistent output

### 2. Reference Extraction

**Problem**: Large source docs (100+ pages) waste context window

**Solution**: Extract key tables/data into `references/*.md`

**Example**:
- Source: `products/research/SA_ISP_Competitive_Landscape_Analysis_2025.md` (180 lines key data)
- Extracted: `references/competitor-benchmarks.md` (~200 lines)
- Content: Pricing tables, FNO footprint, margin targets

**Time Saved**: ~5 min per skill invocation (no need to read full doc)

### 3. Template from Production Docs

**Problem**: Documentation inconsistency across products

**Solution**: Abstract existing high-quality docs into templates

**Process**:
1. Read existing docs (e.g., SkyFibre CPS v2.0)
2. Identify common sections and structure
3. Replace specific content with `[placeholders]`
4. Add inline guidance comments

**Result**: 4 templates ready for any new product

### 4. Admin Integration Pattern

**Problem**: Skills might duplicate existing UI functionality

**Solution**: Skills should reference and extend admin, not replace

**Checklist before building skills**:
- [ ] Check `/admin/[domain]` for existing pages
- [ ] Read existing components in `components/admin/[domain]/`
- [ ] Use same status codes/states as database
- [ ] Link to admin URLs in skill output

**Example**: Lifecycle skill uses Draft/Active/Inactive/Archived (not custom states)

---

## Friction Points & Solutions

### Lifecycle State Mismatch

**Issue**: Planned IDEA→DEVELOPMENT→SIGNED→ACTIVE→SUNSET states

**Reality**: Admin already uses Draft→Active→Inactive→Archived

**Solution**: Aligned skill to existing states, mapped IDEA to pre-system stage

**Prevention**: Always `Grep` for existing state enums/types before designing

```bash
Grep with pattern="status.*enum" path="lib/types/"
```

### Large Competitive Analysis

**Issue**: 180 lines of dense competitive data

**Solution**: Created focused `competitor-benchmarks.md` with:
- Key pricing tables (not all)
- SA-specific benchmarks
- CircleTel positioning reference

**Lesson**: Not all source data needs to be in skills—extract what's actionable

---

## Integration Points

Skills integrate with existing infrastructure:

| System | Location | Integration |
|--------|----------|-------------|
| Admin Products | `/admin/products` | View/edit products |
| Portfolio Dashboard | `/admin/products` → Portfolio | Margin health, lifecycle |
| Lifecycle Stepper | `components/admin/products/ProductLifecycleStepper.tsx` | Visual status |
| Product Types | `lib/types/products.ts` | Status enum |
| Supplier Sync | `lib/suppliers/` | Product data source |
| AI Enrichment | `lib/suppliers/ai-enrichment.ts` | Gemini integration |

---

## File Manifest

```
.claude/skills/product-management/
├── SKILL.md                           # Master router
├── references/
│   ├── competitor-benchmarks.md       # SA ISP pricing data
│   └── doc-templates.md               # Structure patterns
├── browse-suppliers/SKILL.md          # Supplier catalogue filter
├── market-fit/SKILL.md                # Go/no-go analysis
├── generate-docs/SKILL.md             # Documentation generator
├── product-lifecycle/SKILL.md         # Lifecycle management
└── templates/
    ├── commercial-spec.md             # CPS template
    ├── business-rules.md              # BRD template
    ├── functional-spec.md             # FSD template
    └── pricing-matrix.md              # Quick pricing ref
```

---

## Metrics

| Metric | Value |
|--------|-------|
| Files created | 11 |
| Lines written | ~2,500 |
| Session time | ~45 min |
| Time per file | ~4 min |
| Future time saved | ~30 min/new product (docs + analysis) |

---

## Tags

`#skills` `#product-management` `#templates` `#multi-command` `#admin-integration`
