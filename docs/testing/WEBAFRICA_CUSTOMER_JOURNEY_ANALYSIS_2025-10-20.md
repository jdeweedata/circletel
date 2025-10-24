# WebAfrica Customer Journey Analysis - 2025-10-20

## Executive Summary

**Competitor:** WebAfrica (https://www.webafrica.co.za/)
**Test Date:** 2025-10-20
**Test Address:** Fish Eagle Street, Plooysville AH, Midrand, South Africa
**Journey Tested:** Coverage Check → Package Selection
**Status:** ✅ Successful - Smooth customer journey with excellent UX

---

## Journey Overview

### Customer Journey Flow
1. **Homepage** → Address entry with Google Places Autocomplete
2. **Address Selection** → Automatic navigation to package selection
3. **Package Selection Page** → Multiple fibre packages displayed with clear pricing

**Total Steps to View Packages:** 2 clicks (vs CircleTel: 3-4 steps)
**Time to Packages:** ~5 seconds

---

## 1. Homepage Analysis

### Hero Section
**Headline:** "WiFi that can fit your budget"
**Subheadline:** "Get connected today with our Fibre and LTE deals"

**Key Elements:**
- ✅ Large, prominent address search bar in hero section
- ✅ Google Places Autocomplete integration
- ✅ Clear CTA: "Search" button
- ✅ Alternative option: "Click here to use our interactive map"
- ✅ Vibrant pink/magenta brand color (#FF0080 approx)
- ✅ Lifestyle imagery (friends enjoying connectivity)

### Navigation
**Top Bar (Gray):**
- Switch to Webafrica
- EarnMore Network (referral program)
- Help Centre
- Network Status
- Log In

**Main Nav (Pink background):**
- Fibre
- LTE
- Store

### Value Propositions (Below Hero)
**Section:** "WiFi so good, it's your competitive edge"

**Three Service Cards:**
1. **Unlimited Fibre**
   - No landline, no lengthy contracts
   - Up to R4800 free setup costs
   - Speeds up to 1Gbps

2. **Plug and play LTE**
   - Hassle-free, high-speed (up to 150Mbps)
   - No cables, no contracts, no landlord approval

3. **The Webafrica Store**
   - WiFi extenders, streaming devices, security

### Social Proof Section
**"Why Webafrica"** - Carousel with 3 slides:
1. **We are fast in all we do** - Ranked fastest ISP in SA
2. **Easy on your pocket** - Competitive pricing + setup fee coverage
3. **You can count on us** - Reliable service and support

### Contact Section
**Multiple channels prominently displayed:**
- WhatsApp Live Chat: 021 464 9500 (primary CTA)
- Sales: 021 464 9555
- Facebook, Instagram, X (Twitter), YouTube

### App Promotion
- iOS, Android, and Huawei AppGallery links
- Positioned above footer

---

## 2. Coverage Checker Flow

### Address Entry Experience
**Input Field:**
- Placeholder: "Enter your address to get started"
- Google Places Autocomplete enabled
- Clean, rounded input field design
- Search button disabled until input provided

**Test Input:** "10 Fish Eagle Street, Fourways, Johannesburg"

**Autocomplete Results (5 suggestions):**
1. 10 Fish Eagle Street, Matsulu-B, Matsulu, South Africa
2. 10 Fish Eagle Street, Ifafi, Hartbeespoort, South Africa
3. 10 Eagle Street, Horison, Roodepoort, South Africa
4. 10 Fish Eagle Avenue, Cedar Lakes, Randburg, South Africa
5. Fish Eagle Street, Plooysville AH, Midrand, South Africa ✅ Selected

**UX Notes:**
- ✅ Instant autocomplete (fast response)
- ✅ Clear, readable suggestions
- ✅ Automatic navigation on selection (no "Search" button click needed)
- ✅ Smooth transition to results page

---

## 3. Package Selection Page

### Page Layout

**Progress Indicator:**
```
Choose Package (active) → Create Account → Secure Checkout
```

**Header Section:**
- "YOUR SEARCH RESULTS" (small pink text)
- "Here's what's available in your hood" (large blue heading)
- Address displayed with "Check Availability" button
- Option to correct address or use interactive map

**Service Type Toggle:**
- [Fibre] [Fixed LTE] - Toggle buttons

### Package Display Structure

**Two Sections:**
1. **MetroFibre NEXUS Packages** (Recommended badge)
2. **Openserve Packages**

Each section titled: "Choose your ideal Uncapped Fibre package"

### Package Card Design

**Example: MetroFibre NEXUS - R459pm**

**Card Elements:**
- "2-MONTH PROMO" badge (pink)
- "Uncapped" label
- **Price:** R459pm (large, bold)
- Speed tier: R480pm
- Download speed: ⬇ 25Mbps
- Upload speed: ⬆ 25Mbps

**"What you get for free:" section**
- Free set-up worth R1699
- Fully insured, free-to-Use Router

**"What else you should know:" (expandable)**

**CTA:** "Order Now" button (dark blue)

### Package Grid Layout

**MetroFibre NEXUS (6 packages):**
- R459pm - 25/25 Mbps
- R619pm - 40/40 Mbps
- R669pm - 75/75 Mbps
- R1019pm - 250/250 Mbps
- R1149pm - 500/500 Mbps
- R799pm - 100/100 Mbps

**Openserve (9 packages):**
- R399pm - 30/30 Mbps
- R529pm - 50/50 Mbps
- R769pm - 50/50 Mbps
- R829pm - 100/100 Mbps
- R899pm - 100/100 Mbps
- R1009pm - 200/200 Mbps
- R1069pm - 200/200 Mbps
- R1139pm - 100/100 Mbps
- R1259pm - 500/500 Mbps

**Package Card Features:**
- All packages show "2-MONTH PROMO" badge
- Consistent layout across all cards
- Clear speed indicators (download ⬇ upload ⬆)
- Original price + promotional price clearly labeled

### Right Sidebar (Package Detail)

**Selected Package Details (expanded):**
- Provider logo (MetroFibre NEXUS or Openserve)
- Speed tier (e.g., R480pm)
- **Promotional Price:** R459pm (large, bold)
- "First 2 months" label
- Download/Upload speeds with icons
- Included benefits list
- Expandable "What else you should know"
- "Order Now" CTA button (full width)

**Visual Feedback:**
- Support chat icon (bottom right) - "Open Live Chat"
- Clean, minimal footer

---

## 4. UX Patterns & Best Practices Observed

### ✅ Strengths

1. **Immediate Results**
   - No loading states or intermediate pages
   - Direct navigation from homepage to packages
   - Smooth, instant transitions

2. **Clear Visual Hierarchy**
   - Large, readable headlines
   - Consistent card design
   - Color-coded sections (pink promos, blue prices)

3. **Information Architecture**
   - Multiple packages grouped by provider
   - Easy comparison within provider groups
   - Clear differentiation between promotional and regular pricing

4. **Trust Signals**
   - "Secure Checkout" badge in header
   - Free setup value highlighted (R1699, R2199)
   - Free router included messaging
   - Provider logos displayed prominently

5. **Progressive Disclosure**
   - "What else you should know" expandable sections
   - Keeps cards clean while providing detail access

6. **Mobile-Friendly Design**
   - Responsive layout
   - Touch-friendly card sizes
   - Clear tap targets

7. **Multiple Contact Options**
   - WhatsApp Live Chat (primary)
   - Phone numbers
   - Social media links
   - In-page chat widget

8. **Speed Information Display**
   - Icons for download (⬇) and upload (⬆)
   - Consistent Mbps labeling
   - Symmetrical speeds highlighted (25/25, 50/50, etc.)

### ⚠️ Areas for Consideration

1. **Package Overwhelming**
   - 15 total packages displayed (6 + 9)
   - Could benefit from filtering/sorting options
   - No "most popular" or "best value" indicators

2. **Pricing Complexity**
   - "2-MONTH PROMO" on all packages
   - Original price vs promo price requires attention
   - Post-promo pricing not immediately clear

3. **No Package Comparison**
   - No side-by-side comparison tool
   - Users must manually compare across cards

4. **Provider Selection**
   - MetroFibre vs Openserve differences not explained
   - No guidance on which provider to choose
   - Coverage/availability by provider unclear

5. **No Speed Guidance**
   - No recommendations based on usage (streaming, gaming, work from home)
   - Missing "How much speed do I need?" helper

---

## 5. Key Insights for CircleTel

### Quick Wins to Implement

1. **Instant Navigation**
   - Remove intermediate loading/confirmation screens
   - Auto-navigate to packages after address selection
   - Reduce friction in journey

2. **Promotional Badging**
   - Add "2-MONTH PROMO" or similar badges to highlight deals
   - Use color psychology (pink/red for urgency)
   - Make savings immediately visible

3. **Free Setup Value Messaging**
   - Calculate and display "Free set-up worth R[amount]"
   - Highlight router inclusion prominently
   - Use trust-building language ("Fully insured")

4. **Provider Grouping**
   - Group packages by network provider
   - Show multiple providers available at address
   - Allow easy switching between providers

5. **Progress Indicator**
   - Add clear 3-step progress bar: Choose Package → Create Account → Payment
   - Show users where they are in journey
   - Build confidence in checkout process

### Strategic Recommendations

1. **Reduce Package Count**
   - Limit initial display to 4-6 packages
   - Use "View all packages" for full catalog
   - Recommend "Best for you" based on usage

2. **Add Filtering/Sorting**
   - Filter by: Price range, Speed, Provider
   - Sort by: Price (low-high), Speed (fast-slow), Best value
   - Remember user preferences

3. **Speed Guidance Tool**
   - "How much speed do I need?" calculator
   - Usage-based recommendations (1 person, family, work from home)
   - Visual speed tier explanations

4. **Provider Education**
   - Brief explanation of each provider
   - Coverage map comparison
   - Performance ratings/reviews

5. **Comparison Feature**
   - Select 2-3 packages to compare side-by-side
   - Highlight differences
   - "Why upgrade?" messaging

---

## 6. Competitive Advantages

### WebAfrica Strengths vs CircleTel

| Feature | WebAfrica | CircleTel (Current) |
|---------|-----------|---------------------|
| **Steps to Packages** | 2 steps | 3-4 steps |
| **Loading States** | None (instant) | Multiple loading screens |
| **Package Count** | 15 packages | 14 packages (similar) |
| **Provider Grouping** | ✅ Yes (MetroFibre, Openserve) | ❌ No clear grouping |
| **Promotional Badging** | ✅ "2-MONTH PROMO" on all | ⚠️ Limited promo visibility |
| **Free Setup Messaging** | ✅ "Worth R1699" | ⚠️ Not prominently shown |
| **Router Inclusion** | ✅ "Free-to-Use Router" | ✅ Included |
| **Progress Indicator** | ✅ 3-step visual | ❌ No progress bar |
| **Contact Options** | ✅ WhatsApp + Phone + Chat | ✅ Similar |

### CircleTel Strengths vs WebAfrica

| Feature | CircleTel | WebAfrica |
|---------|-----------|-----------|
| **Coverage Providers** | 4+ providers (MTN, Supersonic, etc.) | 2 providers shown |
| **RBAC System** | ✅ Enterprise admin system | ❌ Not visible |
| **B2B Journey** | ✅ Separate business pages | ⚠️ Mixed with consumer |
| **Technical Documentation** | ✅ Comprehensive | ❌ Basic |
| **API Integration** | ✅ Multi-provider API | ⚠️ Unknown |

---

## 7. Screenshots Reference

1. **Homepage Initial:** `.playwright-mcp/webafrica-homepage-initial.png`
2. **Address Autocomplete:** `.playwright-mcp/webafrica-address-autocomplete.png`
3. **Package Selection Page:** `.playwright-mcp/webafrica-package-selection-page.png`

---

## 8. Implementation Priority for CircleTel

### High Priority (Immediate - Week 1)
1. ✅ Remove intermediate loading screens
2. ✅ Add promotional badging to packages
3. ✅ Implement progress indicator (3 steps)
4. ✅ Group packages by provider
5. ✅ Auto-navigate after address selection

### Medium Priority (Sprint 1 - Weeks 2-3)
1. ⚠️ Add "Free setup worth R[X]" messaging
2. ⚠️ Implement package filtering (price, speed)
3. ⚠️ Add "Most Popular" or "Best Value" badges
4. ⚠️ Create speed guidance helper
5. ⚠️ Improve package card design consistency

### Low Priority (Sprint 2 - Month 2)
1. ⏳ Side-by-side package comparison
2. ⏳ Provider education section
3. ⏳ Usage-based recommendations
4. ⏳ Interactive coverage map
5. ⏳ Customer review integration

---

## 9. Technical Notes

### Performance
- ✅ Fast page loads (no observed delays)
- ✅ Smooth transitions
- ✅ Responsive autocomplete

### Accessibility
- ⚠️ Button states (disabled) clearly indicated
- ⚠️ Some small text may need larger sizing
- ⚠️ Color contrast generally good (pink on white)

### Browser Compatibility
- ✅ Tested on Chromium (Playwright)
- ⚠️ Google Maps API warnings present (March 2025 deprecation)

### API Integration
- ✅ Google Places Autocomplete
- ✅ Backend package availability check
- ⚠️ No visible error handling demo

---

## 10. Conclusion

**WebAfrica Verdict:** ⭐⭐⭐⭐½ (4.5/5)

**What They Do Exceptionally Well:**
- Frictionless customer journey (2 steps to packages)
- Clear, attractive package presentation
- Strong promotional messaging
- Multiple provider options grouped logically
- Excellent contact accessibility (WhatsApp priority)

**Where CircleTel Can Compete:**
- More comprehensive provider coverage (4+ vs 2)
- Enterprise-grade admin system
- Stronger B2B differentiation
- Technical depth in integrations

**Key Takeaway:**
WebAfrica excels at **simplicity and speed**. CircleTel should match this user experience velocity while leveraging our technical advantages (multi-provider aggregation, RBAC, B2B features) as differentiators.

**Recommended Next Steps:**
1. Implement quick wins (progress bar, instant navigation, promotional badges)
2. Conduct A/B testing on reduced package count (6 vs 14)
3. User test speed guidance tool
4. Benchmark load times against WebAfrica baseline

---

**Test Conducted By:** Claude Code (AI Development Assistant)
**Date:** 2025-10-20
**Session:** WebAfrica Customer Journey Analysis
**Tools Used:** Playwright MCP, Browser Automation, Screenshot Analysis
