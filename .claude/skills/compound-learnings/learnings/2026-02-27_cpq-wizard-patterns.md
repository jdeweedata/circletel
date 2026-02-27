# CPQ Wizard Implementation Patterns

**Date**: 2026-02-27
**Context**: Implementing Phase 3 of CPQ system - Guided Wizard UI

## Wizard Hooks Architecture

### useCPQSession
```typescript
const {
  session,
  stepData,
  isLoading,
  isSaving,
  error,
  createSession,
  loadSession,
  updateSession,
  updateStepData,
  setCurrentStep,
  cancelSession,
  refreshSession,
} = useCPQSession({ sessionId, autoLoad: true });
```

**Key features**:
- Optimistic updates with rollback on error
- Auto-load on mount if sessionId provided
- Type-safe step data updates via generic `updateStepData<K>(step, data)`

### useAutoSave
```typescript
const { isSaving, lastSaved, error, save, saveNow, cancel } = useAutoSave({
  sessionId,
  enabled: true,
  debounceMs: 1500,
  onSaveError: (err) => toast.error(err),
});
```

**Key features**:
- Debounced saves with configurable delay
- `saveNow()` for immediate save (bypasses debounce)
- AbortController for canceling in-flight requests
- Pending data merging (multiple saves collapse into one)

### useCPQNavigation
```typescript
const {
  currentStep,
  canGoNext,
  canGoPrev,
  goNext,
  goPrev,
  goToStep,
  validateStep,
  getStepStatus,
  completedSteps,
} = useCPQNavigation({ session, stepData, onValidationError });
```

**Key features**:
- Per-step validators with errors + warnings
- Backward navigation always allowed
- Forward navigation requires validation
- Step status: 'completed' | 'active' | 'pending'

## AI-Form Hybrid Pattern

Best practice for AI-assisted forms:

```tsx
// 1. AI parses input
const result = await fetch('/api/cpq/ai/parse', { body: { text: nlInput } });

// 2. Display parsed result with confidence
{data.ai_parsed && (
  <Badge>{data.ai_confidence}% confidence</Badge>
)}

// 3. Show editable form for override
<Input
  value={data.bandwidth_mbps || ''}
  onChange={(e) => handleFieldUpdate('bandwidth_mbps', e.target.value)}
/>

// 4. Allow re-parse
<Button onClick={handleParse}>
  <RefreshCw /> Re-parse
</Button>
```

**Rule**: Never lock users into AI-parsed values.

## JSONB Step Data Pattern

Store wizard state in a single JSONB column:

```typescript
// Database: cpq_sessions.step_data (JSONB)
interface CPQStepData {
  needs_assessment?: NeedsAssessmentData;
  location_coverage?: LocationCoverageData;
  package_selection?: PackageSelectionData;
  // ... etc
}

// Update merges, doesn't replace
const updateStepData = (step, data) => {
  return {
    ...existingStepData,
    [step]: { ...existingStepData[step], ...data }
  };
};
```

**Benefits**:
- Single API call to persist state
- Atomic updates
- Easy to add new steps without migrations

## Common Pitfalls

### 1. Set Iteration in TypeScript
```typescript
// ❌ BAD - TypeScript error without downlevelIteration
new Set([...prev, newItem])

// ✅ GOOD - Works without config changes
new Set([...Array.from(prev), newItem])
```

### 2. Optional JSONB Fields
```typescript
// ❌ BAD - pricing is possibly undefined
{pricing.total_discount_percent > 0 && ...}

// ✅ GOOD - nullish coalescing
{(pricing?.total_discount_percent ?? 0) > 0 && ...}
```

### 3. Google Maps Type Declarations
```typescript
// ❌ BAD - conflicts with @types/google.maps
declare global {
  interface Window { google?: typeof google; }
}

// ✅ GOOD - types already declared
// Note: Google Maps types are already declared globally via @types/google.maps
```

## File Structure Reference

```
lib/cpq/hooks/
├── useCPQSession.ts      # Session CRUD
├── useAutoSave.ts        # Debounced persistence
├── useCPQNavigation.ts   # Step navigation + validation
└── index.ts              # Exports

components/cpq/
├── CPQWizard.tsx         # Main container
└── steps/
    ├── NeedsAssessmentStep.tsx
    ├── LocationCoverageStep.tsx
    ├── PackageSelectionStep.tsx
    ├── ConfigureStep.tsx
    ├── PricingDiscountsStep.tsx
    ├── CustomerDetailsStep.tsx
    ├── ReviewSubmitStep.tsx
    └── index.ts

app/admin/cpq/
├── page.tsx              # Dashboard
├── new/page.tsx          # Create session
└── [id]/page.tsx         # Wizard UI
```

## Reusable for Future Wizards

These hooks can be adapted for any multi-step form:
1. Copy hooks, rename types
2. Define step validators
3. Create step components
4. Wrap in container with AnimatePresence

Estimated time savings: **~2 hours per wizard**.

## Future: Generic Wizard Library Extraction

The hooks are designed for extraction into a reusable library:

### Candidate Hooks for `lib/wizard/`

```typescript
// useWizardSession<TSession, TStepData>
// Generic session management with type parameters

// useAutoSave<T>
// Debounced persistence for any data shape

// useWizardNavigation<TStepData>
// Step navigation with pluggable validators
```

### Extraction Steps (When Needed)

1. Create `lib/wizard/hooks/` directory
2. Extract hooks with generic type parameters:
   - `useWizardSession<S, D>` - session shape, step data shape
   - `useAutoSave<T>` - any saveable entity
   - `useWizardNavigation<D>` - step data with validators
3. Create `lib/wizard/types.ts` for base interfaces
4. Update `lib/cpq/hooks/` to re-export with CPQ-specific types
5. Add `lib/wizard/components/WizardContainer.tsx` for common UI

### Complexity vs Benefit

| Use Case | Recommendation |
|----------|----------------|
| 2nd wizard needed | Copy and adapt (faster) |
| 3+ wizards | Extract to shared library |
| External package | Consider npm package |

**Current state**: CPQ-specific implementation works well. Extract when a second use case emerges (YAGNI principle).
