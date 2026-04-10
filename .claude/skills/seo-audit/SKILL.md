---
name: seo-audit
version: 1.0.0
description: "Audit, review, or diagnose SEO issues on CircleTel's website. Triggers: 'SEO audit', 'technical SEO', 'not ranking', 'SEO issues', 'on-page SEO', 'meta tags', 'SEO health check', 'traffic dropped', 'lost rankings', 'not showing in Google', 'page speed', 'core web vitals', 'crawl errors', 'indexing issues'."
dependencies: [product-marketing-context]
attribution: "Adapted from coreyhaines31/marketingskills (MIT License) for CircleTel SA market"
---

# CircleTel SEO Audit

Identify SEO issues and provide actionable recommendations to improve organic search performance for CircleTel's web properties.

## When This Skill Activates

This skill automatically activates when you:
- Audit or review SEO health of circletel.co.za or staging
- Diagnose ranking drops or indexing issues
- Review technical SEO (speed, crawlability, Core Web Vitals)
- Optimize on-page SEO for product or landing pages
- Review meta tags, schema markup, or site architecture

**Keywords**: SEO audit, technical SEO, not ranking, SEO issues, on-page SEO, meta tags, SEO health check, traffic dropped, lost rankings, not showing in Google, page speed, core web vitals, crawl errors, indexing issues, sitemap, robots.txt, schema markup

---

## CircleTel Context

**Read first**: `.claude/product-marketing-context.md` for brand voice, personas, and messaging before auditing any copy.

**Site type**: ISP product/service site (B2B + B2C)
**Tech stack**: Next.js 15, Sanity CMS, Vercel
**Production**: https://www.circletel.co.za
**Staging**: https://circletel-staging.vercel.app
**SEO schema**: `lib/sanity/schemas/objects/seo.ts`, `sanity-studio/schemas/objects/seo.ts`

### SA-Specific SEO Considerations

| Factor | CircleTel Approach |
|--------|-------------------|
| **Local search** | Target "fibre in [suburb]", "internet in [area]", "ISP [city]" |
| **Language** | English primary, consider Afrikaans meta for Afrikaans-speaking areas |
| **Competitors** | Rain, Afrihost, WiruLink, Vumatel, Openserve — monitor their SERP positions |
| **Local directories** | Hellopeter, Google Business Profile, Yellow Pages SA |
| **Mobile-first** | High mobile usage in SA — mobile experience is critical |
| **Load-shedding keywords** | "internet during load-shedding", "backup power internet" |

---

## Audit Framework

### Priority Order
1. **Crawlability & Indexation** (can Google find and index it?)
2. **Technical Foundations** (is the site fast and functional?)
3. **On-Page Optimization** (is content optimized for SA keywords?)
4. **Content Quality** (does it deserve to rank?)
5. **Local SEO** (are we visible in SA local search?)

---

## Technical SEO Audit

### Crawlability

**Robots.txt**
- Check for unintentional blocks (common with Next.js dynamic routes)
- Verify important pages allowed
- Check sitemap reference

**XML Sitemap**
- Exists and accessible at `/sitemap.xml`
- Contains only canonical, indexable URLs
- Updated regularly (Next.js generates automatically if configured)
- Submitted to Google Search Console

**Site Architecture**
- Important pages within 3 clicks of homepage
- Logical hierarchy: Home > Products > [Product] > Coverage Check
- Internal linking between related products
- No orphan pages (common with Sanity CMS dynamic pages)

### Indexation

**Index Status**
- `site:circletel.co.za` check
- Search Console coverage report
- Compare indexed vs. expected page count

**Common Next.js Issues**
- Dynamic routes generating duplicate content
- Client-side rendering preventing indexation
- Sanity preview pages accidentally indexed
- Staging site indexed (should be noindex)

**Canonicalization**
- All pages have canonical tags
- HTTP to HTTPS redirects
- www vs. non-www consistency
- Trailing slash consistency (Next.js default: no trailing slash)

### Core Web Vitals

| Metric | Target | CircleTel Focus |
|--------|--------|-----------------|
| LCP (Largest Contentful Paint) | < 2.5s | Hero images, product page images |
| INP (Interaction to Next Paint) | < 200ms | Coverage check form, package selector |
| CLS (Cumulative Layout Shift) | < 0.1 | Dynamic pricing, promotional banners |

**Speed Factors for Next.js**
- Image optimization (next/image with WebP)
- JavaScript bundle size (check with `@next/bundle-analyzer`)
- Server response time (Vercel Edge)
- Font loading (next/font)
- Third-party scripts (Google Maps, analytics)

### Schema Markup Detection Limitation

**`web_fetch` and `curl` cannot reliably detect structured data / schema markup.**

Many CMS plugins inject JSON-LD via client-side JavaScript. To accurately check:
1. **Browser tool** — render and run: `document.querySelectorAll('script[type="application/ld+json"]')`
2. **Google Rich Results Test** — https://search.google.com/test/rich-results
3. Check `lib/sanity/schemas/objects/seo.ts` for implemented schema types

### Mobile-Friendliness

- Responsive design verified across breakpoints
- Tap target sizes (coverage check buttons, plan selection)
- No horizontal scroll on product pages
- Same content as desktop (Next.js SSR ensures this)

---

## On-Page SEO Audit

### Title Tags

**Check for:**
- Unique titles per page (product pages, area pages)
- Primary keyword near beginning
- 50-60 characters
- Include area/location for local pages

**CircleTel patterns:**
- Product: "[Product Name] — Fast [Type] Internet | CircleTel"
- Area: "Fibre Internet in [Suburb], [City] | CircleTel"
- Blog: "[Topic] — CircleTel Internet Guide"

### Meta Descriptions

- 150-160 characters
- Include primary keyword + SA context
- Clear value proposition (no contracts, free installation)
- Call to action ("Check coverage", "Compare plans")

### Heading Structure

- One H1 per page matching primary keyword
- Logical H2/H3 hierarchy
- Product pages: H1 (product), H2 (features, pricing, coverage), H3 (details)

### Content Optimization

**Product pages should include:**
- Speed and pricing specifics (not "up to" — real speeds)
- Coverage area information
- Comparison with competitors (where appropriate)
- Customer testimonials from the target area
- FAQ section (structured data opportunity)

### Image Optimization

- Descriptive file names (not `IMG_001.jpg`)
- Alt text on all images (accessibility + SEO)
- WebP format via next/image
- Lazy loading for below-fold images

---

## Local SEO (SA-Specific)

### Google Business Profile
- Verified and complete
- Consistent NAP (Name, Address, Phone) across all listings
- Regular posts with offers and updates
- Review management (respond to all Hellopeter + Google reviews)

### Local Keywords Strategy

| Keyword Pattern | Example | Search Intent |
|-----------------|---------|---------------|
| "[service] in [area]" | "fibre internet in Sandton" | High intent, location-specific |
| "[provider] vs [competitor]" | "CircleTel vs Rain" | Comparison shopping |
| "[problem] [area]" | "slow internet Midrand" | Problem-aware |
| "best ISP [city]" | "best ISP Johannesburg" | Ready to buy |
| "[technology] coverage [area]" | "fibre coverage Centurion" | Coverage checking |

### Local Schema Markup

Implement for CircleTel:
- `LocalBusiness` schema with SA address
- `Product` schema for each service package
- `FAQPage` schema on product pages
- `Review` / `AggregateRating` schema
- `BreadcrumbList` for navigation

---

## Content Quality (E-E-A-T)

### ISP-Specific E-E-A-T

**Experience**: Real customer stories, installation photos, speed test results
**Expertise**: Technical content about fibre, FWA, LTE technologies
**Authoritativeness**: ICASA compliance, industry memberships, partnerships
**Trustworthiness**: Transparent pricing, no-contract policy, real support contact

---

## Output Format

### Audit Report Structure

**Executive Summary**
- Overall health assessment (1-10 score)
- Top 3-5 priority issues
- Quick wins identified
- SA-specific opportunities

**For each finding:**
- **Issue**: What's wrong
- **Impact**: High / Medium / Low
- **Evidence**: How found (URL, screenshot, tool output)
- **Fix**: Specific recommendation with file paths
- **Priority**: 1 (critical) to 5 (nice-to-have)

**Prioritized Action Plan**
1. Critical fixes (blocking indexation/ranking)
2. High-impact SA local SEO improvements
3. Quick wins (meta tags, schema, internal links)
4. Long-term content strategy

---

## Tools Referenced

**Free Tools**
- Google Search Console (essential)
- Google PageSpeed Insights
- Rich Results Test (schema validation — renders JavaScript)
- Mobile-Friendly Test

**SA-Specific**
- Hellopeter (review monitoring)
- Google Business Profile Manager

**Paid Tools** (if available)
- Screaming Frog, Ahrefs, Semrush, Sitebulb

---

## Related Skills

- **promotional-campaigns**: For promotional landing page SEO
- **brand-design**: For image assets that need alt text optimization
- **product-page-builder**: For building SEO-optimized product pages with Sanity

---

## Related Files

- `lib/sanity/schemas/objects/seo.ts` — SEO schema definition
- `sanity-studio/schemas/objects/seo.ts` — Studio-side SEO schema
- `.claude/product-marketing-context.md` — Brand voice and keyword angles
- `app/sitemap.ts` — Next.js sitemap generation (if exists)
- `public/robots.txt` — Robots configuration (if exists)

---

**Version**: 1.0.0
**Last Updated**: 2026-04-10
**Attribution**: Adapted from [marketingskills](https://github.com/coreyhaines31/marketingskills) (MIT) for CircleTel SA market
