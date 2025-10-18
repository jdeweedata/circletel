# Playwright MCP Screenshots

Organized screenshots captured during development and testing using Playwright MCP.

## Folder Structure

### `/admin` (25 screenshots)
Admin panel screenshots including:
- Dashboard views
- Login/authentication flows
- Product management pages
- Coverage management
- Billing dashboard
- Zoho integration
- CMS management
- User management with RBAC

**Naming Convention:** `admin-{page}-{state}.png`

Examples:
- `admin-dashboard-logged-in.png`
- `admin-login-filled.png`
- `admin-coverage-page.png`
- `admin-products-page-initial.png`

---

### `/checkout` (9 screenshots)
Checkout and order completion flows:
- Checkout form states
- Payment pages
- Success confirmations
- SSL/security badges
- Payment provider integration (Netcash)

**Naming Convention:** `checkout-{state}.png`

Examples:
- `checkout-page.png`
- `checkout-form-completed.png`
- `checkout-with-netcash-logos.png`
- `success-page.png`

---

### `/coverage` (28 screenshots)
Coverage checking functionality and maps:
- MTN coverage maps (consumer and business)
- Coverage results for different areas
- Map layers (5G, LTE, fibre)
- Integration testing screenshots
- SkyFibre API responses
- Coverage checker in action

**Naming Convention:** `{provider}-{area}-{layer}.png` or `coverage-{description}.png`

Examples:
- `mtn-coverage-heritage-hill.png`
- `coverage-integration-complete.png`
- `centurion-coverage-check.png`
- `skyfibre-api-consumer-centurion.png`

---

### `/customer-journey` (6 screenshots)
Complete customer flow from start to finish:
- Homepage initial view
- Coverage checker with address entered
- Packages page
- Order form stages
- Menu navigation

**Naming Convention:** `{step}-{description}.png`

Examples:
- `01-homepage-initial.png`
- `02-coverage-checker-address-typed.png`
- `03-packages-page.png`
- `04-order-form.png`

---

### `/homepage` (8 screenshots)
Homepage design iterations and states:
- Hero sections
- Full page layouts
- Different viewport sizes
- Design variations
- CircleTel branding

**Naming Convention:** `homepage-{state}.png` or `circletel-{component}.png`

Examples:
- `homepage-loaded.png`
- `homepage-design.png`
- `home-page-current-state.png`

---

### `/mobile` (8 screenshots)
Mobile and tablet responsive views:
- Mobile package displays
- Tablet layouts
- Responsive navigation
- Mobile-specific features
- Different screen sizes (320px - 1024px)

**Naming Convention:** `{device}-{page}-{state}.png`

Examples:
- `mobile-packages-final.png`
- `tablet-layout-test.png`
- `mobile-with-address.png`

---

### `/packages` (6 screenshots)
Package display and selection:
- Package grids
- Wireless packages
- Promotional pricing displays
- Package filters

**Naming Convention:** `{type}-packages-{state}.png`

Examples:
- `wireless-packages-page.png`
- `packages-display-promotional-pricing.png`

---

### `/product-pages` (14 screenshots)
Individual product page designs:
- TP-Link mesh WiFi pages
- Device cards
- VoIP product pages
- Product specifications
- Hero sections
- Feature sections

**Naming Convention:** `{product}-{section}.png`

Examples:
- `tp-link-product-page-final.png`
- `mesh-wifi-devices-page.png`
- `voip-page.png`
- `device-card-component-success.png`

---

### `/promotions` (11 screenshots)
Promotions and deals pages:
- Promotion grids
- Filtering by category
- Mobile/tablet views
- Full page layouts
- Canva-designed promotion images

**Naming Convention:** `promotions-{filter/state}.png`

Examples:
- `promotions-page-full.png`
- `promotions-fibre-filtered.png`
- `promotions-mobile-filter.png`

---

### `/competitor-research` (17 screenshots)
Competitor analysis screenshots:
- Afrihost (fibre, wireless, deals)
- Supersonic homepage and packages
- Verizon (home internet, business)
- Vox (business wireless, coverage)
- Cell C fibre page

**Naming Convention:** `{competitor}-{page}-{detail}.png`

Examples:
- `afrihost-deals-reference.png`
- `supersonic-packages-page.png`
- `verizon-home-internet-page.png`
- `vox-step1-wireless-business-homepage.png`

---

### `/misc` (40+ screenshots)
Miscellaneous development screenshots:
- Timestamped test screenshots (`page-2025-*.png`)
- Logo variations
- Form validation tests
- Import functionality
- Font testing
- Business page concepts
- One-off tests and experiments

**Naming Convention:** Various (timestamp, test name, feature name)

---

## Screenshot Naming Best Practices

### Format
`{category}-{page/component}-{state/action}.png`

### Categories
- `admin` - Admin panel pages
- `checkout` - Checkout and payment flows
- `coverage` - Coverage checking and maps
- `customer` - Customer-facing pages
- `mobile` - Mobile/responsive views
- `test` - Testing and debugging

### States/Actions
- `initial` - First load
- `loaded` - After data loads
- `filled` - Form filled
- `error` - Error state
- `success` - Success state
- `hover` - Hover interaction
- `clicked` - After click action

### Examples
✅ Good:
- `admin-products-page-initial.png`
- `checkout-form-filled.png`
- `mobile-packages-tablet-view.png`
- `coverage-mtn-5g-centurion.png`

❌ Avoid:
- `page-2025-09-28T17-13-09-008Z.png` (meaningless timestamp)
- `test.png` (too generic)
- `screenshot.png` (no context)

---

## File Count Summary

| Folder | Count | Purpose |
|--------|-------|---------|
| admin | 25 | Admin panel testing |
| checkout | 9 | Order completion flows |
| coverage | 28 | Coverage maps & checking |
| customer-journey | 6 | End-to-end user flows |
| homepage | 8 | Homepage iterations |
| mobile | 8 | Responsive testing |
| packages | 6 | Package displays |
| product-pages | 14 | Individual products |
| promotions | 11 | Deals and offers |
| competitor-research | 17 | Market analysis |
| misc | 40+ | Development tests |
| **TOTAL** | **170+** | |

---

## Maintenance

### When Adding New Screenshots

1. Determine the appropriate category folder
2. Use descriptive naming following the convention
3. Avoid timestamps in filenames (use git for history)
4. Document significant screenshots in this README
5. Remove outdated screenshots regularly

### Cleanup Guidelines

- Delete screenshots older than 3 months unless documenting key features
- Remove duplicate screenshots with similar filenames
- Archive competitor research screenshots annually
- Keep only final versions of UI iterations

### Tools Used

- **Playwright MCP**: Automated browser testing and screenshot capture
- **Browser DevTools**: Manual screenshot capture
- **Claude Code**: Analysis and organization

---

## Related Documentation

- [Customer Journey Analysis](../docs/customer-journey-analysis.md)
- [Admin Panel Documentation](../docs/admin/)
- [Coverage System Documentation](../docs/coverage/)
- [Marketing Content Guide](../docs/marketing/)

---

**Last Updated:** 2025-10-03
**Organized By:** Claude Code