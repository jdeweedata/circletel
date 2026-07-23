# CloudWiFi Product Page Design

**Date**: 2026-07-14  
**Status**: Approved  
**Route**: `/products/cloudwifi`

## Objective

Replace the existing CloudWiFi product page with a responsive, conversion-focused page based on the supplied reference. The page must help a South African venue decision-maker understand the managed Wi-Fi offer, receive an immediate tier recommendation, and submit a complete site-survey request into CircleTel's existing sales workflow.

## Design Brief

- **Users**: Occasional, non-technical venue owners and managers.
- **Primary job**: Estimate the appropriate CloudWiFi tier and request a site survey.
- **Primary action**: Request a site survey.
- **Density**: Low-density marketing UI with 16-18px body text, 24-32px gaps between related groups, and 48-96px between sections.
- **Look**: Existing CircleTel navy/orange palette, Manrope headings, Inter body copy, white elevated cards, and the spacing/radius tokens defined in `DESIGN.md`.
- **Platforms**: Desktop and mobile.
- **Fidelity**: Preserve the supplied page's hierarchy, imagery-led venue presentation, estimator, pricing, education, persistent survey form, and CTA rhythm while using CircleTel's production navigation, footer, components, accessibility standards, and real lead workflow.

## Recommended Architecture

Use a native, componentized Next.js implementation.

- Keep `app/products/cloudwifi/page.tsx` as the server-rendered route entry and metadata owner.
- Place CloudWiFi-specific client UI in `components/cloudwifi/` so the estimator and survey wizard do not turn the route into a monolithic client component.
- Place deterministic tier rules and shared types in `lib/cloudwifi/` so they can be unit tested independently of React.
- Add a CloudWiFi-specific public submission endpoint under `app/api/leads/cloudwifi/` that validates the request and adapts it to the existing `coverage_leads` schema and sales-alert integration.
- Store page imagery under `public/images/cloudwifi/` and serve it locally through `next/image`.
- Reuse the production `Navbar`, `Footer`, shadcn/ui primitives, Phosphor icons, and existing contact constants.

The implementation must not embed or depend on the supplied external reference site. That site is authentication-gated and externally controlled.

## Page Structure

### 1. Navigation

Render CircleTel's existing global `Navbar`. The page must not introduce a second route-specific navigation implementation.

### 2. Hero and Tier Estimator

Use a full-width hospitality image with a navy overlay strong enough to preserve readable white text.

The left column contains:

- Eyebrow: `Tier finder`
- H1: `Find your CloudWiFi tier in minutes.`
- Managed Wi-Fi as a Service summary
- Primary CTA: `Request a site survey`
- Secondary CTA: `Open Wi-Fi toolkit`
- Four compact service assurances: Wi-Fi 6 access points, guest/staff separation, Ruijie Cloud management, and managed support

The right column contains an interactive estimator with:

- Venue type
- Usable floor area
- Expected concurrent users at peak
- Internet backhaul
- Recommended tier result

The result updates immediately after sufficient inputs are supplied. It shows the tier name, starting monthly price, access-point range, and a concise explanation of the limiting factor. It also includes a CTA that transfers the estimator values into the full survey wizard.

### 3. Venue Use Cases

Show six imagery-led venue cards:

1. Hospitality
2. Retail
3. Property
4. Healthcare
5. Education
6. Public venues

Each card contains a Phosphor icon, venue label, locally hosted image, and one sentence describing the outcome. Desktop uses six columns; narrower layouts progressively collapse without horizontal scrolling.

### 4. Pricing Tiers

Show four survey-led tiers. Prices exclude VAT.

| Tier | Guide | AP range | Starting price | Included capacity |
|---|---|---:|---:|---:|
| Essential | Up to 300 sqm | 1-2 | R1,499/mo | Up to 2 APs |
| Professional | 300-800 sqm | 3-5 | R3,499/mo | Up to 5 APs |
| Enterprise | 800-2,000 sqm | 6-12 | R7,999/mo | Up to 12 APs |
| Campus | Large or multi-building sites | 12-30+ | R14,999/mo | Up to 20 APs before custom expansion |

Each card lists the offer's progressively included capabilities. A footnote states that prices exclude VAT, fair-usage terms apply, extra access points cost more, and a survey confirms the final tier and price.

### 5. Pricing Factors

Explain the four main inputs that affect final pricing:

- Floor area
- Walls and building materials
- User density
- Backhaul capacity

The copy must make clear that the estimator is guidance and only the site survey confirms environmental conditions and final pricing.

### 6. Managed Service Detail

Use a restrained comparison surface with four columns:

- Fully managed Wi-Fi, end to end
- Included in every tier
- Powerful add-ons
- Why CircleTel

This section distinguishes standard inclusions from optional items without implying that add-ons are included in the advertised base prices.

### 7. Delivery Process

Show the four-stage process:

1. Site survey
2. Design
3. Installation
4. Manage

Desktop uses a connected horizontal sequence. Mobile uses a vertical sequence with the same order and labels.

### 8. Conversion CTA

End the content with a navy CTA panel:

- Headline: `Let's get your venue's Wi-Fi right.`
- Primary action: `Request a site survey`
- Secondary action: `Talk to an expert`
- Trust markers for local experts, nationwide support, and secure/compliant service

`Talk to an expert` uses the project's existing contact or WhatsApp constants instead of a hard-coded personal number.

### 9. Footer

Render CircleTel's existing global `Footer`.

## Tier Recommendation Rules

The estimator uses deterministic, explainable rules. Area and peak users each produce a minimum tier; the higher result wins. Venue density may raise the minimum by one tier. Backhaul adds guidance but never lowers the Wi-Fi tier.

### Area thresholds

| Floor area | Minimum tier |
|---:|---|
| 1-300 sqm | Essential |
| 301-800 sqm | Professional |
| 801-2,000 sqm | Enterprise |
| Above 2,000 sqm | Campus |

### Peak-user thresholds

| Concurrent users | Minimum tier |
|---:|---|
| 1-50 | Essential |
| 51-150 | Professional |
| 151-400 | Enterprise |
| Above 400 | Campus |

### Venue density

- Healthcare and property use the standard area/user result.
- Hospitality, retail, and education raise the result by one tier when the user count is near the top quarter of the selected tier's range.
- Public venues raise the result by one tier when expected peak users exceed 100 because crowd density and shared-airtime contention are primary design constraints.
- Campus is the maximum tier and cannot be raised further.

### Backhaul guidance

- Fibre or licensed wireless: no warning.
- Fixed wireless or 5G: show a resilience/throughput note.
- LTE or unknown: show a warning that the survey must confirm whether backhaul can support the expected users.

The recommendation explanation names the decisive factor, such as floor area, user density, or the public-venue density adjustment.

## Site-Survey Wizard

The wizard has four steps and retains data when the user moves backward or a submission fails.

### Step 1: Venue

- Venue type
- Usable floor area in square metres
- City
- Expected concurrent users at peak
- Internet backhaul

If opened from the estimator, matching values are prefilled.

### Step 2: Details

- Full site street address
- Postal code (optional)
- Number of floors
- Predominant wall/building material
- Required networks: staff, guest, point-of-sale/operations, or other
- Optional add-ons: captive portal, analytics, content filtering, failover, bandwidth shaping, LAN/Wi-Fi optimisation, multi-site management, or integrations
- Free-text requirements

### Step 3: Contact

- Full name
- Company or venue name
- Email address
- South African phone number
- Preferred contact time
- Consent to be contacted about the survey request

### Step 4: Review

Show all captured information, the current recommendation, and the pricing disclaimer before submission. The user can return to earlier steps to edit values.

### Success state

Show:

- Confirmation that the survey request was received
- The returned lead reference
- Expected response time
- Contact/WhatsApp fallback
- A control to close or reset the wizard

## Desktop and Mobile Behavior

- Desktop: the lower information area uses a content column plus a sticky right-side survey panel, matching the reference hierarchy. Hero CTA clicks scroll to and focus the panel. The estimator-to-survey CTA also prefills the panel.
- Tablet: the survey panel moves below the relevant content when the two-column layout becomes cramped.
- Mobile: the wizard opens as a full-width focused flow. It must not compete with the page's persistent mobile CTA or WhatsApp affordance, and it must not create horizontal overflow.
- All mobile controls have at least 44px touch targets and body copy remains at least 16px.

## Submission Contract

The client submits a JSON payload containing:

- Venue fields
- Technical-detail fields
- Contact fields
- Consent timestamp
- Recommended tier and recommendation reasons
- Page source and optional attribution parameters

The server:

1. Parses and validates the payload.
2. Rejects missing consent, invalid email/phone values, non-positive numeric values, and unsupported enum values.
3. Creates one `coverage_leads` record using existing schema fields:
   - `customer_type`: `smme`
   - `first_name` and `last_name`, derived deterministically from the submitted full name while preserving the full name in metadata
   - `email`
   - `phone`
   - `company_name`
   - `address` or city-level location value supported by the existing schema
   - `city`
   - `lead_source`: `website_form` (an existing PostgreSQL enum value)
   - `requested_service_type`: `cloudwifi`
   - `status`: `new`
   - `follow_up_notes`: concise human-readable survey summary
   - `metadata`: structured venue, network, add-on, tier, consent, and attribution data, including `page_source: cloudwifi_product_page`
4. Triggers the existing sales-alert integration asynchronously.
5. Returns a stable success response containing the lead ID.

No database migration is required. The endpoint must not reuse confirmation copy intended for no-coverage waitlist leads.

## States and Error Handling

- The estimator has an explicit incomplete state that tells the visitor which inputs remain.
- Each wizard step validates on continue and shows specific field-level messages.
- Submission shows a labelled loading state and prevents duplicate requests while in flight.
- A failed request preserves all data and shows what failed plus a retry action.
- Unexpected notification failures do not turn a successfully persisted lead into a failed client response.
- The success state is rendered only after persistence succeeds.

## Accessibility

- Use semantic headings and landmarks in document order.
- Every field has a persistent visible label and associated error text.
- Errors use `role="alert"` or an equivalent live region.
- The progress indicator exposes the current step in text, not color alone.
- Focus moves to the first invalid field, the next-step heading, or the success heading as appropriate.
- All interactive controls have visible keyboard focus states.
- Images have meaningful alt text where informative and empty alt text where decorative.
- Motion respects `prefers-reduced-motion`.
- Text and controls meet WCAG AA contrast requirements against their backgrounds.

## Imagery

Create or source locally owned, brand-appropriate images for the hero and six venue categories. The visual direction is realistic South African commercial spaces with warm natural lighting and no visible third-party logos or legible generated text.

- Hero: busy, premium hospitality venue with room for a navy text overlay.
- Hospitality: restaurant or hotel lounge.
- Retail: contemporary clothing or general retail store.
- Property: modern multi-tenant commercial or residential property.
- Healthcare: clean waiting or reception area without identifiable patients.
- Education: collaborative classroom or campus learning space.
- Public venues: high-capacity event or community venue.

Optimized AVIF/WebP variants should be served where supported, with a safe fallback format.

## Verification

### Unit tests

- Every area boundary.
- Every peak-user boundary.
- Highest-of-area-and-users selection.
- Venue-density promotions.
- Campus maximum.
- Backhaul guidance.
- Recommendation explanation.

### Component tests

- Estimator incomplete and recommended states.
- Survey prefill from estimator.
- Step validation and backward navigation.
- Contact consent requirement.
- Review rendering.
- Submission loading, error, retry, and success states.

### API tests

- Required-field and enum validation.
- Invalid email, phone, and numeric values.
- Correct `coverage_leads` mapping.
- Structured metadata mapping.
- Persistence failure response.
- Successful persistence despite an asynchronous sales-alert failure.

### Repository and browser checks

- Run targeted tests, targeted linting, and `npm run type-check:memory` or the narrowest reliable equivalent if unrelated repository errors block the global check.
- Inspect the page at desktop and 375px mobile widths.
- Complete the estimator and wizard using a mocked submission response.
- Check keyboard focus order, visible errors, success feedback, and browser console output.
- Compare desktop hierarchy, spacing, imagery, pricing, and panel placement with the supplied reference.

## Out of Scope

- Taking payment or creating a customer order from the CloudWiFi page.
- Scheduling a technician directly on a calendar.
- Performing a real RF survey or calculating exact access-point placement.
- Changing global Navbar, Footer, typography, design tokens, or unrelated product pages.
- Replacing `/connectivity/wifi-as-a-service`.
- Adding a CMS or admin editor for the static marketing content.
