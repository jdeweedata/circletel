# CloudWiFi Product Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `/products/cloudwifi` with the approved responsive product page, deterministic tier estimator, accessible four-step site-survey wizard, and real `coverage_leads` submission flow.

**Architecture:** Keep the route server-rendered for metadata and marketing content, isolate conversion state in focused client components, and place pricing/recommendation and request-validation rules in pure TypeScript modules. A dedicated API adapter validates requests, maps them to the verified `coverage_leads` schema, and invokes the existing sales-alert integration without allowing notification failures to invalidate persisted leads.

**Tech Stack:** Next.js 15 App Router, React, TypeScript, Tailwind CSS, shadcn/ui, Phosphor icons, Zod, Supabase/PostgreSQL, Jest, React Test Renderer, agent-browser, Sharp.

**Design reference:** `docs/superpowers/specs/2026-07-14-cloudwifi-product-page-design.md`

---

## Scope and File Map

### Create

- `lib/cloudwifi/types.ts` — shared venue, tier, backhaul, and survey types.
- `lib/cloudwifi/tier-recommendation.ts` — deterministic tier catalogue and recommendation function.
- `lib/cloudwifi/survey-schema.ts` — server/client request schema and field-level validation helpers.
- `lib/cloudwifi/lead-payload.ts` — pure mapping from a validated request to `coverage_leads` insert data.
- `app/api/leads/cloudwifi/route.ts` — public CloudWiFi survey submission endpoint.
- `components/cloudwifi/content.ts` — static page copy and presentation data.
- `components/cloudwifi/CloudWifiSurveyProvider.tsx` — shared estimator/wizard draft state and CTA behavior.
- `components/cloudwifi/CloudWifiSurveyCta.tsx` — reusable CTA that opens or focuses the wizard.
- `components/cloudwifi/CloudWifiTierEstimator.tsx` — hero estimator UI.
- `components/cloudwifi/CloudWifiHero.tsx` — hero composition and service assurances.
- `components/cloudwifi/CloudWifiSurveyWizard.tsx` — four-step form, review, submit, error, and success states.
- `components/cloudwifi/CloudWifiPageSections.tsx` — venue, pricing, price drivers, managed-service, process, and final CTA sections.
- `components/cloudwifi/CloudWifiLandingPage.tsx` — server-rendered page composition.
- `scripts/optimize-cloudwifi-images.mjs` — deterministic AVIF/WebP generation from approved source images.
- `__tests__/lib/cloudwifi/tier-recommendation.test.ts` — recommendation boundaries and density rules.
- `__tests__/lib/cloudwifi/survey-schema.test.ts` — request validation and lead mapping.
- `__tests__/api/cloudwifi-lead-route.test.ts` — endpoint validation, persistence, and alert behavior.
- `components/cloudwifi/__tests__/CloudWifiTierEstimator.test.tsx` — estimator rendering and prefill behavior.
- `components/cloudwifi/__tests__/CloudWifiSurveyWizard.test.tsx` — wizard validation, navigation, retry, and success.
- `components/cloudwifi/__tests__/CloudWifiLandingPage.test.tsx` — page-content contract.
- `public/images/cloudwifi/*.{jpg,webp,avif}` — one hero and six venue images.

### Modify

- `app/products/cloudwifi/page.tsx` — replace the current page implementation while retaining route metadata ownership.
- `memory-os/long-term/agent-context.md` — record the completed CloudWiFi route architecture and verification evidence at session end.
- `memory-os/short-term/session-notes.md` — append the session outcome and residual risks.

### Explicitly unchanged

- `components/layout/Navbar.tsx`
- `components/layout/Footer.tsx`
- `DESIGN.md`
- `tailwind.config.*`
- `app/connectivity/wifi-as-a-service/page.tsx`
- Database migrations and the `coverage_leads` schema

---

### Task 1: Create the tier domain model and recommendation engine

**Files:**
- Create: `lib/cloudwifi/types.ts`
- Create: `lib/cloudwifi/tier-recommendation.ts`
- Test: `__tests__/lib/cloudwifi/tier-recommendation.test.ts`

- [ ] **Step 1: Write the failing boundary and density tests**

Create a table-driven Jest suite covering 300/301, 800/801, 2,000/2,001 sqm; 50/51, 150/151, 400/401 users; the higher of area/users; hospitality/retail/education upper-quartile promotions; public-venue promotion above 100 users; Campus maximum; and backhaul guidance.

```ts
import { recommendCloudWifiTier } from '@/lib/cloudwifi/tier-recommendation';

describe('recommendCloudWifiTier', () => {
  it.each([
    [300, 20, 'essential'],
    [301, 20, 'professional'],
    [801, 20, 'enterprise'],
    [2001, 20, 'campus'],
  ] as const)('maps %i sqm and %i users to %s', (floorArea, peakUsers, tier) => {
    expect(recommendCloudWifiTier({
      venueType: 'property',
      floorArea,
      peakUsers,
      backhaul: 'fibre',
    }).tier).toBe(tier);
  });

  it('uses the higher tier required by peak users', () => {
    expect(recommendCloudWifiTier({
      venueType: 'property',
      floorArea: 250,
      peakUsers: 151,
      backhaul: 'fibre',
    }).tier).toBe('enterprise');
  });

  it('promotes a dense hospitality venue near the tier ceiling', () => {
    const result = recommendCloudWifiTier({
      venueType: 'hospitality',
      floorArea: 250,
      peakUsers: 40,
      backhaul: 'fibre',
    });

    expect(result.tier).toBe('professional');
    expect(result.reasons.join(' ')).toMatch(/density/i);
  });

  it('adds an LTE backhaul warning without reducing the tier', () => {
    const result = recommendCloudWifiTier({
      venueType: 'property',
      floorArea: 900,
      peakUsers: 80,
      backhaul: 'lte',
    });

    expect(result.tier).toBe('enterprise');
    expect(result.backhaulGuidance).toMatch(/survey/i);
  });
});
```

- [ ] **Step 2: Run the test and confirm the module is missing**

Run: `npm test -- __tests__/lib/cloudwifi/tier-recommendation.test.ts --runInBand`  
Expected: FAIL because `@/lib/cloudwifi/tier-recommendation` does not exist.

- [ ] **Step 3: Add exact shared types and tier catalogue**

```ts
export const CLOUDWIFI_VENUE_TYPES = [
  'hospitality', 'retail', 'property', 'healthcare', 'education', 'public_venue',
] as const;
export const CLOUDWIFI_BACKHAUL_TYPES = [
  'fibre', 'licensed_wireless', 'fixed_wireless', '5g', 'lte', 'unknown',
] as const;
export const CLOUDWIFI_TIER_IDS = [
  'essential', 'professional', 'enterprise', 'campus',
] as const;

export type CloudWifiVenueType = typeof CLOUDWIFI_VENUE_TYPES[number];
export type CloudWifiBackhaul = typeof CLOUDWIFI_BACKHAUL_TYPES[number];
export type CloudWifiTierId = typeof CLOUDWIFI_TIER_IDS[number];

export interface TierRecommendationInput {
  venueType: CloudWifiVenueType;
  floorArea: number;
  peakUsers: number;
  backhaul: CloudWifiBackhaul;
}

export interface CloudWifiTier {
  id: CloudWifiTierId;
  name: string;
  areaLabel: string;
  apRange: string;
  startingPrice: number;
  includedAccessPoints: number;
}

export interface TierRecommendation extends TierRecommendationInput {
  tier: CloudWifiTierId;
  tierDetails: CloudWifiTier;
  reasons: string[];
  backhaulGuidance: string | null;
}
```

Implement `CLOUDWIFI_TIERS`, `tierForArea`, `tierForUsers`, `promoteTier`, and `recommendCloudWifiTier`. Use indices rather than duplicated condition trees so the higher requirement and one-level promotions remain easy to audit.

- [ ] **Step 4: Run the focused test and confirm it passes**

Run: `npm test -- __tests__/lib/cloudwifi/tier-recommendation.test.ts --runInBand`  
Expected: PASS with all recommendation cases green.

- [ ] **Step 5: Commit the domain engine**

```bash
git add lib/cloudwifi/types.ts lib/cloudwifi/tier-recommendation.ts __tests__/lib/cloudwifi/tier-recommendation.test.ts
git commit -m "feat(cloudwifi): add tier recommendation engine"
```

---

### Task 2: Validate survey requests and map them to the verified schema

**Files:**
- Create: `lib/cloudwifi/survey-schema.ts`
- Create: `lib/cloudwifi/lead-payload.ts`
- Test: `__tests__/lib/cloudwifi/survey-schema.test.ts`

- [ ] **Step 1: Write failing validation and mapping tests**

Cover unsupported enums, zero/negative numbers, invalid email, invalid South African phone, missing consent, a single-token contact name, and the exact database field names verified in `supabase/migrations/20260523000000_baseline_squash.sql`.

```ts
import { cloudWifiSurveySchema } from '@/lib/cloudwifi/survey-schema';
import { buildCloudWifiLeadPayload } from '@/lib/cloudwifi/lead-payload';

const validRequest = {
  venue: {
    venueType: 'hospitality', floorArea: 450, peakUsers: 120,
    city: 'Johannesburg', siteAddress: '10 Main Road, Sandton',
    postalCode: '2196', backhaul: 'fibre',
  },
  details: {
    floors: 2, wallMaterial: 'brick_concrete',
    networks: ['staff', 'guest'], addOns: ['analytics'], requirements: '',
  },
  contact: {
    fullName: 'Naledi Mokoena', companyName: 'Mokoena Hospitality',
    email: 'naledi@example.co.za', phone: '082 123 4567',
    preferredContactTime: 'morning', consent: true,
    consentedAt: '2026-07-14T10:00:00.000Z',
  },
  attribution: { pageSource: 'cloudwifi_product_page' },
};

it('maps only verified coverage_leads columns', () => {
  const parsed = cloudWifiSurveySchema.parse(validRequest);
  const lead = buildCloudWifiLeadPayload(parsed);

  expect(lead).toEqual(expect.objectContaining({
    customer_type: 'smme',
    first_name: 'Naledi',
    last_name: 'Mokoena',
    lead_source: 'website_form',
    requested_service_type: 'cloudwifi',
    follow_up_notes: expect.stringContaining('Professional'),
    metadata: expect.objectContaining({ page_source: 'cloudwifi_product_page' }),
  }));
  expect(lead).not.toHaveProperty('service_interest');
  expect(lead).not.toHaveProperty('notes');
});
```

- [ ] **Step 2: Run the test and confirm both modules are missing**

Run: `npm test -- __tests__/lib/cloudwifi/survey-schema.test.ts --runInBand`  
Expected: FAIL on unresolved CloudWiFi survey modules.

- [ ] **Step 3: Implement the Zod request schema**

Use exported enums from `types.ts`, `z.coerce.number().int().positive()`, an email schema, the existing SA-phone rule `^(0\d{9}|\+27\d{9})$` after removing spaces/dashes, and a `fullName` refinement requiring at least two non-empty tokens. Export `CloudWifiSurveyRequest = z.infer<typeof cloudWifiSurveySchema>` and `formatSurveyErrors(error)` returning `{ field, message }[]` for the endpoint.

- [ ] **Step 4: Implement the pure database mapper**

Recompute the tier on the server with `recommendCloudWifiTier`; never trust a client-submitted tier. Return only real columns:

```ts
return {
  customer_type: 'smme' as const,
  first_name: firstName,
  last_name: remainingNames.join(' '),
  email: request.contact.email.trim().toLowerCase(),
  phone: normalizeSAPhone(request.contact.phone),
  company_name: request.contact.companyName.trim(),
  address: request.venue.siteAddress.trim(),
  city: request.venue.city.trim(),
  postal_code: request.venue.postalCode || null,
  lead_source: 'website_form' as const,
  requested_service_type: 'cloudwifi',
  contact_preference: 'phone',
  best_contact_time: request.contact.preferredContactTime,
  status: 'new',
  follow_up_notes: `CloudWiFi site survey requested. Recommended tier: ${recommendation.tierDetails.name}.`,
  requirements: {
    venue_type: request.venue.venueType,
    floor_area_sqm: request.venue.floorArea,
    peak_users: request.venue.peakUsers,
    backhaul: request.venue.backhaul,
    floors: request.details.floors,
    wall_material: request.details.wallMaterial,
    networks: request.details.networks,
    add_ons: request.details.addOns,
  },
  metadata: {
    page_source: 'cloudwifi_product_page',
    recommended_tier: recommendation.tier,
    recommendation_reasons: recommendation.reasons,
    consented_at: request.contact.consentedAt,
    requirements_text: request.details.requirements || null,
    attribution: request.attribution,
  },
};
```

- [ ] **Step 5: Run the focused schema test**

Run: `npm test -- __tests__/lib/cloudwifi/survey-schema.test.ts --runInBand`  
Expected: PASS.

- [ ] **Step 6: Commit validation and mapping**

```bash
git add lib/cloudwifi/survey-schema.ts lib/cloudwifi/lead-payload.ts __tests__/lib/cloudwifi/survey-schema.test.ts
git commit -m "feat(cloudwifi): validate site survey requests"
```

---

### Task 3: Add the real CloudWiFi lead endpoint

**Files:**
- Create: `app/api/leads/cloudwifi/route.ts`
- Test: `__tests__/api/cloudwifi-lead-route.test.ts`

- [ ] **Step 1: Write failing endpoint tests**

Mock `createClient`, `sendCoverageLeadAlert`, and the logger. Assert: malformed JSON returns 400; validation failures return field errors without database calls; insert failures return 500; successful insertion returns 201 and the lead ID; alert rejection is caught and the response remains 201.

```ts
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
jest.mock('@/lib/notifications/sales-alerts', () => ({ sendCoverageLeadAlert: jest.fn() }));

it('persists a validated CloudWiFi lead', async () => {
  insertSingle.mockResolvedValue({ data: { id: 'lead-cloudwifi-1' }, error: null });
  const response = await POST(request(validRequest));
  const body = await response.json();

  expect(response.status).toBe(201);
  expect(body).toEqual({ success: true, leadId: 'lead-cloudwifi-1' });
  expect(insert).toHaveBeenCalledWith(expect.objectContaining({
    lead_source: 'website_form',
    requested_service_type: 'cloudwifi',
  }));
});

it('keeps a persisted lead successful when the alert fails', async () => {
  insertSingle.mockResolvedValue({ data: { id: 'lead-cloudwifi-2' }, error: null });
  mockSendCoverageLeadAlert.mockRejectedValue(new Error('notification offline'));

  const response = await POST(request(validRequest));
  expect(response.status).toBe(201);
});
```

- [ ] **Step 2: Run the route test and confirm the endpoint is missing**

Run: `npm test -- __tests__/api/cloudwifi-lead-route.test.ts --runInBand`  
Expected: FAIL because `app/api/leads/cloudwifi/route.ts` does not exist.

- [ ] **Step 3: Implement the endpoint**

The route must parse with `cloudWifiSurveySchema.safeParse`, insert exactly one `coverage_leads` row via the server Supabase client, then call `sendCoverageLeadAlert` in a guarded promise chain using the returned row data. Do not send the no-coverage confirmation template.

```ts
const parsed = cloudWifiSurveySchema.safeParse(await request.json());
if (!parsed.success) {
  return NextResponse.json(
    { success: false, error: 'Check the highlighted fields.', fields: formatSurveyErrors(parsed.error) },
    { status: 400 }
  );
}

const leadPayload = buildCloudWifiLeadPayload(parsed.data);
const { data: lead, error } = await supabase
  .from('coverage_leads')
  .insert(leadPayload)
  .select('id, customer_type, first_name, last_name, email, phone, company_name, address, city, postal_code, requested_service_type, lead_source')
  .single();

if (error || !lead) {
  apiLogger.error('Failed to create CloudWiFi site survey lead', { error: error?.message });
  return NextResponse.json({ success: false, error: 'We could not save your request. Please try again.' }, { status: 500 });
}

void sendCoverageLeadAlert({
  id: lead.id,
  customer_type: lead.customer_type,
  first_name: lead.first_name,
  last_name: lead.last_name,
  email: lead.email,
  phone: lead.phone,
  company_name: lead.company_name || undefined,
  address: lead.address,
  city: lead.city || undefined,
  postal_code: lead.postal_code || undefined,
  requested_service_type: lead.requested_service_type || 'cloudwifi',
  lead_source: lead.lead_source,
}).catch((alertError) => apiLogger.error('CloudWiFi sales alert failed', {
  leadId: lead.id,
  error: alertError instanceof Error ? alertError.message : String(alertError),
}));

return NextResponse.json({ success: true, leadId: lead.id }, { status: 201 });
```

- [ ] **Step 4: Run route and schema tests together**

Run: `npm test -- __tests__/api/cloudwifi-lead-route.test.ts __tests__/lib/cloudwifi/survey-schema.test.ts --runInBand`  
Expected: PASS.

- [ ] **Step 5: Commit the endpoint**

```bash
git add app/api/leads/cloudwifi/route.ts __tests__/api/cloudwifi-lead-route.test.ts
git commit -m "feat(cloudwifi): capture site survey leads"
```

---

### Task 4: Build shared conversion state and tier estimator

**Files:**
- Create: `components/cloudwifi/CloudWifiSurveyProvider.tsx`
- Create: `components/cloudwifi/CloudWifiSurveyCta.tsx`
- Create: `components/cloudwifi/CloudWifiTierEstimator.tsx`
- Test: `components/cloudwifi/__tests__/CloudWifiTierEstimator.test.tsx`

- [ ] **Step 1: Write the failing estimator interaction test**

Use React Test Renderer with the provider. Find controls by their `aria-label`/props, call the component callbacks, assert the recommendation text appears, click `Use this recommendation`, and assert the provider draft receives the venue values.

- [ ] **Step 2: Run the test and confirm the components are missing**

Run: `npm test -- components/cloudwifi/__tests__/CloudWifiTierEstimator.test.tsx --runInBand`  
Expected: FAIL on unresolved components.

- [ ] **Step 3: Implement the provider contract**

```ts
interface CloudWifiSurveyContextValue {
  draft: CloudWifiSurveyDraft;
  setDraft: React.Dispatch<React.SetStateAction<CloudWifiSurveyDraft>>;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  requestSurvey: (prefill?: Partial<CloudWifiSurveyDraft['venue']>) => void;
  resetSurvey: () => void;
}
```

`requestSurvey` merges prefill data, opens the mobile sheet when `matchMedia('(max-width: 767px)')` matches, and otherwise calls `document.getElementById('cloudwifi-survey')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' })`. It then focuses the survey heading on the next animation frame.

- [ ] **Step 4: Implement the estimator states**

Render four labelled controls. Until all four are supplied, show `Select your details to see a recommendation`. Once complete, call `recommendCloudWifiTier` and render the tier name, formatted price, AP range, reasons, backhaul guidance, and a `Use this recommendation` button that calls `requestSurvey` with the estimator values.

- [ ] **Step 5: Run the estimator test**

Run: `npm test -- components/cloudwifi/__tests__/CloudWifiTierEstimator.test.tsx --runInBand`  
Expected: PASS.

- [ ] **Step 6: Commit the shared conversion shell**

```bash
git add components/cloudwifi/CloudWifiSurveyProvider.tsx components/cloudwifi/CloudWifiSurveyCta.tsx components/cloudwifi/CloudWifiTierEstimator.tsx components/cloudwifi/__tests__/CloudWifiTierEstimator.test.tsx
git commit -m "feat(cloudwifi): add interactive tier estimator"
```

---

### Task 5: Build the four-step site-survey wizard

**Files:**
- Create: `components/cloudwifi/CloudWifiSurveyWizard.tsx`
- Test: `components/cloudwifi/__tests__/CloudWifiSurveyWizard.test.tsx`

- [ ] **Step 1: Write failing wizard behavior tests**

Cover the initial Venue step, required-field errors, forward/back navigation preserving values, estimator-prefilled venue values, consent blocking submission, review rendering, the submitting label, API error with retry, and lead-reference success state. Mock `global.fetch` per test.

- [ ] **Step 2: Run the test and confirm the wizard is missing**

Run: `npm test -- components/cloudwifi/__tests__/CloudWifiSurveyWizard.test.tsx --runInBand`  
Expected: FAIL on unresolved wizard component.

- [ ] **Step 3: Implement explicit wizard state and validation**

Use `type WizardStep = 1 | 2 | 3 | 4`, keep the draft in `CloudWifiSurveyProvider`, and keep `submitting`, `submitError`, and `leadId` locally. Validation functions return a field-keyed map with actionable messages:

```ts
function validateStep(step: WizardStep, draft: CloudWifiSurveyDraft) {
  const errors: Record<string, string> = {};
  if (step === 1) {
    if (!draft.venue.venueType) errors.venueType = 'Select the type of venue.';
    if (!draft.venue.floorArea || draft.venue.floorArea <= 0) errors.floorArea = 'Enter the usable floor area in square metres.';
    if (!draft.venue.city.trim()) errors.city = 'Enter the city where the venue is located.';
    if (!draft.venue.peakUsers || draft.venue.peakUsers <= 0) errors.peakUsers = 'Enter the expected number of users at peak.';
    if (!draft.venue.backhaul) errors.backhaul = 'Select the venue\'s current internet connection.';
  }
  if (step === 2) {
    if (!draft.venue.siteAddress.trim()) errors.siteAddress = 'Enter the full site address for the survey.';
    if (!draft.details.floors || draft.details.floors <= 0) errors.floors = 'Enter the number of floors.';
    if (!draft.details.wallMaterial) errors.wallMaterial = 'Select the main wall or building material.';
    if (draft.details.networks.length === 0) errors.networks = 'Select at least one network requirement.';
  }
  if (step === 3) {
    if (draft.contact.fullName.trim().split(/\s+/).length < 2) errors.fullName = 'Enter your first and last name.';
    if (!draft.contact.companyName.trim()) errors.companyName = 'Enter the venue or company name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.contact.email)) errors.email = 'Enter a valid email such as name@company.co.za.';
    if (!/^(0\d{9}|\+27\d{9})$/.test(draft.contact.phone.replace(/[\s-]/g, ''))) errors.phone = 'Enter a valid South African phone number.';
    if (!draft.contact.consent) errors.consent = 'Consent is required so CircleTel can arrange the survey.';
  }
  return errors;
}
```

- [ ] **Step 4: Implement accessible step rendering and submission**

Use persistent labels, `aria-invalid`, `aria-describedby`, `role="alert"`, a four-step progress indicator with `aria-current="step"`, and focus refs for the step heading and first invalid field. Submit to `/api/leads/cloudwifi`; preserve the draft on failure; disable only during submission; show `Sending request…`; on success show the returned `leadId`, response-time copy, and WhatsApp fallback from `getWhatsAppLink`.

Use the existing `useIsMobile()` hook to render exactly one form instance, avoiding duplicate IDs and focus targets:

- At 768px and above, an `aside` with `id="cloudwifi-survey"`; it appears below the explanatory content on tablet and becomes sticky at `lg` with `lg:sticky lg:top-24`.
- Below 768px, a controlled shadcn `Sheet` with a scrollable content region and a title/description for Radix accessibility.

- [ ] **Step 5: Run the wizard and related validation tests**

Run: `npm test -- components/cloudwifi/__tests__/CloudWifiSurveyWizard.test.tsx __tests__/lib/cloudwifi/survey-schema.test.ts --runInBand`  
Expected: PASS.

- [ ] **Step 6: Commit the wizard**

```bash
git add components/cloudwifi/CloudWifiSurveyWizard.tsx components/cloudwifi/__tests__/CloudWifiSurveyWizard.test.tsx
git commit -m "feat(cloudwifi): add site survey wizard"
```

---

### Task 6: Create and optimize page imagery

**Files:**
- Create: `public/images/cloudwifi/cloudwifi-hero.jpg`
- Create: `public/images/cloudwifi/venue-hospitality.jpg`
- Create: `public/images/cloudwifi/venue-retail.jpg`
- Create: `public/images/cloudwifi/venue-property.jpg`
- Create: `public/images/cloudwifi/venue-healthcare.jpg`
- Create: `public/images/cloudwifi/venue-education.jpg`
- Create: `public/images/cloudwifi/venue-public.jpg`
- Create: corresponding `.webp` and `.avif` variants
- Create: `scripts/optimize-cloudwifi-images.mjs`

- [ ] **Step 1: Generate the seven source images with the imagegen skill**

Use consistent photographic direction: realistic South African commercial spaces, warm natural light, navy/orange-compatible grading, no logos, no legible text, no identifiable patients or children. Hero prompt must reserve the left third for headline contrast and place venue activity on the right. Venue images use a consistent 4:3 crop.

- [ ] **Step 2: Inspect each source at original detail**

Reject and regenerate images with malformed architecture, unreadable pseudo-signage, visible brand marks, or inappropriate people. Confirm the hero retains usable negative space after a 16:9 crop.

- [ ] **Step 3: Add the optimizer script**

```js
import { readdir, rename } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const directory = path.resolve('public/images/cloudwifi');
const sourceFiles = (await readdir(directory)).filter((file) => file.endsWith('.jpg'));

for (const sourceFile of sourceFiles) {
  const input = path.join(directory, sourceFile);
  const base = input.slice(0, -4);
  const isHero = sourceFile === 'cloudwifi-hero.jpg';
  const pipeline = sharp(input).resize({
    width: isHero ? 1920 : 960,
    height: isHero ? 1080 : 720,
    fit: 'cover',
    position: 'attention',
    withoutEnlargement: true,
  });

  const optimizedJpeg = `${base}.optimized.jpg`;
  await pipeline.clone().jpeg({ quality: 86, mozjpeg: true }).toFile(optimizedJpeg);
  await pipeline.clone().webp({ quality: 82 }).toFile(`${base}.webp`);
  await pipeline.clone().avif({ quality: 58, effort: 5 }).toFile(`${base}.avif`);
  await rename(optimizedJpeg, input);
}
```

- [ ] **Step 4: Run optimization and inspect dimensions/sizes**

Run: `node scripts/optimize-cloudwifi-images.mjs`  
Expected: seven JPG, seven WebP, and seven AVIF assets; hero no larger than 1920×1080; venue images no larger than 960×720.

- [ ] **Step 5: Commit the approved assets**

```bash
git add public/images/cloudwifi scripts/optimize-cloudwifi-images.mjs
git commit -m "assets(cloudwifi): add optimized venue imagery"
```

---

### Task 7: Build the server-rendered product-page sections

**Files:**
- Create: `components/cloudwifi/content.ts`
- Create: `components/cloudwifi/CloudWifiHero.tsx`
- Create: `components/cloudwifi/CloudWifiPageSections.tsx`
- Create: `components/cloudwifi/CloudWifiLandingPage.tsx`
- Modify: `app/products/cloudwifi/page.tsx`
- Test: `components/cloudwifi/__tests__/CloudWifiLandingPage.test.tsx`

- [ ] **Step 1: Write the failing page contract test**

Mock Navbar, Footer, `next/image`, and interactive client components. Assert the new H1, all six venues, all four tiers/prices, pricing-factor heading, managed-service heading, four process steps, and both final CTAs. Assert old copy `CloudWiFi for venues that cannot afford messy guest Wi-Fi` is absent.

- [ ] **Step 2: Run the test and confirm the new composition is missing**

Run: `npm test -- components/cloudwifi/__tests__/CloudWifiLandingPage.test.tsx --runInBand`  
Expected: FAIL because `CloudWifiLandingPage` does not exist.

- [ ] **Step 3: Add typed content data**

Define `venueTypes`, `pricingTiers`, `priceDrivers`, `includedFeatures`, `addOns`, `whyCircleTel`, `processSteps`, and `serviceAssurances` in `content.ts`. Use the exact prices and ranges from the design spec; keep add-ons separate from inclusions.

- [ ] **Step 4: Build the hero**

Use a semantic `<section>` with a `<picture>` background source order of AVIF → WebP → JPG, a navy overlay, one filled orange CTA, the secondary toolkit link, four assurances, and `<CloudWifiTierEstimator />`. H1 responsive classes follow `DESIGN.md`: `text-3xl sm:text-4xl md:text-5xl lg:text-6xl`.

- [ ] **Step 5: Build the remaining sections**

`CloudWifiPageSections` must render:

1. Six image-led venue cards.
2. Four pricing cards and the VAT/fair-usage/survey disclaimer.
3. Price-driver cards.
4. A lower two-column shell: explanatory content on the left and `<CloudWifiSurveyWizard />` on the right.
5. Four-column managed-service detail.
6. Four-step delivery process.
7. Navy final CTA using `<CloudWifiSurveyCta />` and `getWhatsAppLink('Hi CircleTel, I would like to speak to an expert about CloudWiFi.')`.

Desktop grids collapse progressively to one column and no section uses body text below 16px on mobile.

- [ ] **Step 6: Replace the route composition**

Keep metadata in `app/products/cloudwifi/page.tsx` and render:

```tsx
export default function CloudWiFiPage() {
  return (
    <div className="min-h-screen bg-circleTel-lightNeutral text-circleTel-navy">
      <Navbar />
      <CloudWifiSurveyProvider>
        <CloudWifiLandingPage />
      </CloudWifiSurveyProvider>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 7: Run all CloudWiFi tests**

Run: `npm test -- __tests__/lib/cloudwifi __tests__/api/cloudwifi-lead-route.test.ts components/cloudwifi/__tests__ --runInBand`  
Expected: PASS.

- [ ] **Step 8: Commit the page replacement**

```bash
git add app/products/cloudwifi/page.tsx components/cloudwifi
git commit -m "feat(cloudwifi): rebuild product page"
```

---

### Task 8: Run code-quality and accessibility checks

**Files:**
- Modify only files already in scope if checks reveal defects.

- [ ] **Step 1: Format the scoped files**

Run: `npx prettier --write app/products/cloudwifi/page.tsx app/api/leads/cloudwifi/route.ts components/cloudwifi lib/cloudwifi __tests__/lib/cloudwifi __tests__/api/cloudwifi-lead-route.test.ts scripts/optimize-cloudwifi-images.mjs`  
Expected: Prettier exits 0.

- [ ] **Step 2: Run targeted linting**

Run: `npm run lint -- --file app/products/cloudwifi/page.tsx --file app/api/leads/cloudwifi/route.ts --dir components/cloudwifi --dir lib/cloudwifi`  
Expected: exit 0; resolve all new warnings that indicate accessibility, hooks, or Next Image problems.

- [ ] **Step 3: Run targeted and full type checking**

Run: `npm run type-check:memory`  
Expected: exit 0. If unrelated repository errors remain, save full output to `/tmp/cloudwifi-type-check.log`, filter for `app/products/cloudwifi`, `components/cloudwifi`, `lib/cloudwifi`, and `app/api/leads/cloudwifi`, and require zero errors in the scoped files before proceeding.

- [ ] **Step 4: Run the complete focused suite again**

Run: `npm test -- __tests__/lib/cloudwifi __tests__/api/cloudwifi-lead-route.test.ts components/cloudwifi/__tests__ --runInBand`  
Expected: PASS with no open handles or unhandled promise rejections.

- [ ] **Step 5: Run the UI/UX checklist from the loaded skill**

Confirm one dominant hero action, low marketing density, DESIGN.md tokens only, 8pt spacing, WCAG contrast, visible labels/errors, explicit request loading/error/success states, keyboard focus, reduced-motion behavior, 44px mobile targets, 16px mobile body text, and no horizontal scroll.

- [ ] **Step 6: Commit any verification fixes**

```bash
git add app/products/cloudwifi/page.tsx app/api/leads/cloudwifi/route.ts components/cloudwifi lib/cloudwifi __tests__ scripts/optimize-cloudwifi-images.mjs
git commit -m "fix(cloudwifi): address verification findings"
```

Skip this commit if no files changed.

---

### Task 9: Verify the complete browser flow at desktop and mobile widths

**Files:**
- Create temporary screenshots under `/tmp`; do not commit them.

- [ ] **Step 1: Start the memory-aware development server**

Run: `PORT=3012 npm run dev:memory`  
Expected: Next.js reports ready at `http://localhost:3012`.

- [ ] **Step 2: Verify desktop hierarchy**

Use agent-browser at 1440×1000. Capture a full-page screenshot and confirm: correct Navbar/Footer; reference-like hero proportions; estimator visible above fold; six venue cards; four pricing cards; sticky survey rail; managed service and process sections; final CTA; no console errors.

- [ ] **Step 3: Exercise estimator-to-wizard prefill**

Select Hospitality, 450 sqm, 120 users, and Fibre. Confirm Professional or the density-promoted result dictated by the engine, click `Use this recommendation`, and verify the wizard scrolls into view with the same four values.

- [ ] **Step 4: Exercise validation and retry without writing production data**

Intercept `POST /api/leads/cloudwifi` in the browser session. First return a 500 response and confirm the form retains its data and exposes a retry action. Then return `{ "success": true, "leadId": "test-cloudwifi-lead" }` with status 201 and confirm the success reference is rendered.

- [ ] **Step 5: Verify the 375×812 mobile layout**

Confirm one-column venue/pricing layouts, no horizontal scrolling, full-width survey Sheet, usable keyboard order, 44px controls, readable 16px body copy, and no collision with the existing mobile/WhatsApp CTAs. Capture `/tmp/cloudwifi-mobile.png`.

- [ ] **Step 6: Compare against the supplied screenshot**

Check section order, orange/navy balance, image crops, card density, estimator hierarchy, pricing emphasis, sticky panel placement, and final CTA/footer rhythm. Fix material mismatches only; do not restyle global components.

---

### Task 10: Capture project memory and final evidence

**Files:**
- Modify: `memory-os/long-term/agent-context.md`
- Modify: `memory-os/short-term/session-notes.md`

- [ ] **Step 1: Record the reusable architecture**

Append a dated entry describing the pure recommendation engine, `website_form` plus `metadata.page_source` schema mapping, the CloudWiFi API route, shared estimator/wizard provider, image locations, and browser/test commands that passed.

- [ ] **Step 2: Record residual risks honestly**

Include any unrelated type-check failures, unavailable authenticated reference-site inspection, or sales-alert behavior that could not be exercised without production credentials.

- [ ] **Step 3: Review the final diff**

Run:

```bash
git status --short
git diff --check
git diff --stat main...HEAD
git log --oneline main..HEAD
```

Expected: only the CloudWiFi feature, its tests/assets/docs, and required memory updates are present; no whitespace errors.

- [ ] **Step 4: Commit memory updates**

```bash
git add memory-os/long-term/agent-context.md memory-os/short-term/session-notes.md
git commit -m "docs(memory): record CloudWiFi product page"
```

- [ ] **Step 5: Invoke completion gates**

Use `requesting-code-review`, resolve actionable findings, then use `verification-before-completion`. Only after both gates and fresh verification output may the work be described as complete.
