---
description: Perform a quick impact analysis on a feature without generating full spec files
arguments:
  - name: description
    description: Natural language description of the feature to analyze
    required: true
---

# Quick Impact Analysis

You are performing a quick impact analysis for the following feature (no files will be created):

**Feature Description**: $ARGUMENTS.description

## Step 1: Scan Codebase

Quickly scan the codebase to understand:
1. Project structure and key directories
2. Existing patterns that relate to this feature
3. Tech stack (Next.js 15, TypeScript, Supabase, Tailwind)

## Step 2: Identify Affected Systems

Based on the feature description, identify which CircleTel systems are affected:

- [ ] Authentication (consumer/partner/admin)
- [ ] Coverage System (MTN WMS, provider APIs)
- [ ] Orders System (3-stage flow, Zustand store)
- [ ] Payments (NetCash Pay Now)
- [ ] B2B KYC (7-stage workflow)
- [ ] Partner Portal (FICA/CIPC compliance)
- [ ] Customer Dashboard (services, billing, usage)
- [ ] Admin Panel (RBAC, ZOHO sync)
- [ ] CRM Integration (Supabase-first, ZOHO async)

## Step 3: Estimate File Changes

### Files to Create

List new files that would need to be created:
- API routes (`app/api/...`)
- Components (`components/...`)
- Services (`lib/...`)
- Types (`types/...`)
- Migrations (`supabase/migrations/...`)

### Files to Modify

List existing files that would need changes:
- Check for related components
- Check for shared services
- Check for type definitions
- Check for configuration files

## Step 4: Database Impact

Identify database changes:
- **New Tables**: Tables to create
- **Table Modifications**: Columns to add/modify
- **Indexes**: Performance indexes needed
- **RLS Policies**: Row-level security policies
- **Functions/Triggers**: Database functions

## Step 5: API Impact

Identify API changes:
- **New Endpoints**: Routes to create (GET, POST, PUT, DELETE)
- **Modified Endpoints**: Existing routes to update
- **Authentication**: Auth requirements for each endpoint

## Step 6: Risk Assessment

Evaluate risk level based on:
- **Low Risk**: Isolated changes, no core system impact
- **Medium Risk**: Multiple system touchpoints, some complexity
- **High Risk**: Core system changes, new technology, many dependencies

### Risk Factors to Consider

1. Does it touch authentication/authorization?
2. Does it affect payment processing?
3. Does it require new database tables?
4. Does it integrate with external APIs?
5. Does it affect multiple user types (consumer/partner/admin)?
6. Is it introducing new technology/patterns?
7. Does it have real-time requirements?

## Step 7: Quick Estimate

Provide a rough story point estimate:
- Count files to create/modify
- Multiply by complexity factor (1-3)
- Add overhead for testing (20%)
- Add overhead for documentation (10%)

## Output Format

Provide the analysis in this format:

```
QUICK IMPACT ANALYSIS
=====================

Feature: [description]
Risk Level: [low/medium/high]
Estimated Points: [X] points

AFFECTED SYSTEMS
----------------
- [System 1]: [brief impact description]
- [System 2]: [brief impact description]

FILE CHANGES
------------
Files to Create: [X]
  - [path/to/file1.ts]: [description]
  - [path/to/file2.tsx]: [description]

Files to Modify: [Y]
  - [path/to/existing.ts]: [what changes]

DATABASE CHANGES
----------------
Tables: [X] new, [Y] modified
  - [table_name]: [description]

API ENDPOINTS
-------------
New: [X], Modified: [Y]
  - [METHOD] /api/path: [description]

DEPENDENCIES
------------
- [package-name]: [why needed]

RISK FACTORS
------------
- [Risk 1]: [mitigation]
- [Risk 2]: [mitigation]

RECOMMENDATIONS
---------------
1. [First recommendation]
2. [Second recommendation]
3. [Third recommendation]

NOTE: This is a quick analysis. Use /generate-spec for a full specification.
```

## Important Considerations

- This analysis does NOT create any files
- Use for initial scoping before committing to full spec generation
- Consider running `/generate-spec` after review for complete documentation
- Reference `docs/architecture/SYSTEM_OVERVIEW.md` for system context
