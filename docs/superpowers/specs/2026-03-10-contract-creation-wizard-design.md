# Contract Creation Wizard Design

**Date**: 2026-03-10
**Status**: Approved
**Phase**: Phase 4 of Admin Contracts Management UI

## Overview

Multi-step wizard for creating contracts either from scratch (with coverage check) or by converting existing quotes. Follows the CPQ-Style pattern established in the codebase.

## Entry Points

1. **From Scratch**: Admin enters address → coverage check → select package → fill details
2. **From Quote**: Admin selects existing quote → pre-fills all fields → review/edit → generate

## File Structure

```
app/admin/contracts/new/
└── page.tsx                         # Orchestrator page

components/admin/contracts/wizard/
├── ContractWizardProvider.tsx       # Context + state management
├── ContractWizardStepper.tsx        # Progress indicator
├── steps/
│   ├── EntryMethodStep.tsx          # Choose: scratch vs from quote
│   ├── QuoteSelectStep.tsx          # Pick existing quote (if from quote)
│   ├── CoverageStep.tsx             # Address lookup (if from scratch)
│   ├── ProductStep.tsx              # Select package from coverage results
│   ├── CustomerStep.tsx             # Business details form
│   ├── TermsStep.tsx                # Contract terms, SLA, pricing
│   └── ReviewStep.tsx               # Preview + generate actions
├── hooks/
│   └── useContractWizard.ts         # Wizard state hook
└── index.ts                         # Barrel export
```

## Step Flow

```
┌─────────────────┐
│ 1. Entry Method │ ─── "From Quote" ───┐
│   (scratch/quote)│                     │
└────────┬────────┘                     ▼
         │                    ┌─────────────────┐
    "From Scratch"            │ 2a. Quote Select│
         │                    │   (search/pick) │
         ▼                    └────────┬────────┘
┌─────────────────┐                    │
│ 2b. Coverage    │◄───────────────────┘
│   (address check)│        (pre-fills from quote)
└────────┬────────┘
         ▼
┌─────────────────┐
│ 3. Product      │
│   (select pkg)  │
└────────┬────────┘
         ▼
┌─────────────────┐
│ 4. Customer     │
│   (company info)│
└────────┬────────┘
         ▼
┌─────────────────┐
│ 5. Terms        │  ◄── "Edit terms" toggle for exceptions
│   (SLA, pricing)│
└────────┬────────┘
         ▼
┌─────────────────┐
│ 6. Review       │ ─── [Save Draft] OR [Save & Send for Signature]
│   (preview PDF) │
└─────────────────┘
```

## State Shape

```typescript
interface ContractWizardState {
  // Entry method
  entryMethod: 'scratch' | 'from_quote' | null;
  selectedQuoteId: string | null;

  // Coverage (reused from consumer flow)
  coverageAddress: string;
  coverageResult: CoverageResult | null;

  // Product selection
  selectedPackage: ServicePackage | null;

  // Customer details (ManagedServiceContractInput.customer)
  customer: {
    companyName: string;
    registrationNumber?: string;
    vatNumber?: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
  };

  // Terms (editable, with defaults from package)
  terms: {
    contractTerm: 12 | 24 | 36;
    commencementDate: string;
    noticePeriod: number;
    editMode: boolean;  // Toggle for exceptions
  };

  // SLA overrides (when editMode is true)
  slaOverrides?: {
    uptimeGuarantee?: string;
    faultResponse?: string;
    faultResolution?: string;
    creditCap?: string;
  };

  // Pricing overrides (when editMode is true)
  pricingOverrides?: {
    monthlyFee?: number;
    installationFee?: number;
  };
}
```

## Component Details

### 1. EntryMethodStep
- Two card options: "Start Fresh" vs "Convert Quote"
- Radio selection with icons
- Immediate progression on click

### 2. QuoteSelectStep (conditional)
- Only shown if `entryMethod === 'from_quote'`
- Searchable dropdown of pending/accepted quotes
- Displays: Quote #, Company, Package, Monthly Value
- On select: pre-fills customer, product, and terms

### 3. CoverageStep
- Reuses existing `components/coverage/CoverageChecker.tsx`
- Passes `onCoverageResult` callback to wizard context
- Shows available providers and packages

### 4. ProductStep
- Card grid for each available package
- Shows: Speed (down/up), Monthly Price, Provider, Data Policy
- Single selection with visual highlight

### 5. CustomerStep
- Form fields matching `ManagedServiceContractInput.customer`:
  - Company Name (required)
  - Registration Number (optional)
  - VAT Number (optional)
  - Contact Person (required)
  - Email (required)
  - Phone (required)
  - Address (required, pre-filled from coverage)
- Validation via Zod schema
- Pre-filled if converting from quote

### 6. TermsStep
- Contract term selector: 12 / 24 / 36 months (radio buttons)
- Commencement date picker (defaults to today + 7 days)
- Notice period display (read-only, from package)
- **"Edit terms" toggle**:
  - OFF (default): Shows SLA and pricing as read-only from package
  - ON: Enables editable fields for SLA (uptime, response, resolution, credit cap) and pricing (monthly fee, installation fee)

### 7. ReviewStep
- Summary cards organized by section:
  - Customer Details
  - Service Package
  - Contract Terms
  - Pricing Summary
- Edit buttons to jump back to specific steps
- Two action buttons:
  - `[Save as Draft]` → POST to API, redirect to `/admin/contracts/[id]`
  - `[Save & Send for Signature]` → POST with `sendForSignature: true`, triggers Zoho Sign

## API Endpoint

### POST /api/admin/contracts/wizard

**Request Body:**
```typescript
{
  ...ContractWizardState,
  sendForSignature: boolean
}
```

**Response:**
```typescript
{
  success: true,
  contractId: string,
  contractNumber: string,  // CT-YYYY-NNN format
  pdfUrl: string,
  zohoSignRequestId?: string  // If sendForSignature was true
}
```

**Flow:**
1. Validate wizard state
2. Transform to `ManagedServiceContractInput`
3. Call `/api/contracts/generate-managed` for PDF
4. Insert into `contracts` table
5. If `sendForSignature`: call Zoho Sign service
6. Return contract details

## Reused Components

| Component | Source | Purpose |
|-----------|--------|---------|
| CoverageChecker | `components/coverage/` | Address lookup and coverage results |
| WorkflowStepper | `components/cpq/` | Step progress indicator |
| SectionCard | `components/admin/shared/` | Content sections in review |
| Button, Input, Select | `components/ui/` | Form elements |

## Validation

Each step validates before progression:

| Step | Validation |
|------|------------|
| EntryMethod | `entryMethod` must be selected |
| QuoteSelect | `selectedQuoteId` must exist |
| Coverage | `coverageResult` must have packages |
| Product | `selectedPackage` must be selected |
| Customer | All required fields, valid email/phone |
| Terms | `contractTerm` and `commencementDate` required |
| Review | All previous validations pass |

## Design Decisions

1. **CPQ-Style Architecture**: Follows proven pattern in codebase with separated step components and context provider
2. **Quote Pre-fill with Edit Mode**: Quotes pre-fill everything but "Edit terms" toggle allows exceptions without breaking the happy path
3. **Reuse CoverageChecker**: Maintains consistency with consumer flow, no duplicate coverage logic
4. **Dual Save Actions**: Admin chooses between draft (for review) or immediate signature request

## Success Criteria

- [ ] Wizard completes full flow from scratch
- [ ] Wizard pre-fills correctly from quote
- [ ] "Edit terms" toggle enables SLA/pricing overrides
- [ ] PDF generates with correct contract number
- [ ] Contract saves to database
- [ ] Zoho Sign integration works on "Send for Signature"
- [ ] Redirects to detail page after creation
