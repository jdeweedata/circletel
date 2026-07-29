Rule: icon-system
Loaded by: CLAUDE.md and AGENTS.md
Scope: UI icons, brand logos, service logos, and Iconify usage

---

## Icon Architecture

CircleTel uses two icon sources with separate responsibilities:

| Source | Purpose | Default usage |
|--------|---------|---------------|
| Phosphor through `react-icons/pi` | Navigation, actions, status, controls, and general interface symbols | Import the required icon directly in the component; prefer the existing bold variants |
| Iconify through `@iconify/react` | Approved brand, provider, service, and technology logos that Phosphor does not provide | Use only after checking the source icon set's licence and the brand's trademark rules |

Do not replace an existing Phosphor interface icon with a branded or stylistically unrelated Iconify icon. Do not register either library in `globals.css`; icons are imported or referenced by the component that renders them.

## Local Hosting Is Required for Production-Critical Icons

An Iconify name such as `<Icon icon="selfhst:netflix" />` retrieves icon data from Iconify's public API at runtime. This is acceptable for prototypes or explicitly approved non-critical interfaces, but it is not the production default.

For customer-facing pages, checkout, navigation, product cards, integration listings, or any icon whose absence would degrade the experience:

1. Copy Iconify's optimized **SVG as JSX** output into a reusable component under `components/icons/`, or store a static SVG under `public/icons/` when an image asset is more appropriate.
2. Import and render that local asset so it is bundled or served by CircleTel without a runtime request to Iconify.
3. Preserve the official logo geometry and colours unless the brand's published guidance explicitly permits changes.
4. Record the Iconify identifier, source URL, icon-set licence, and any required attribution in a source comment next to the local asset. Put user-visible attribution in the appropriate legal or credits surface when the licence requires it.

Do not download or bundle an entire Iconify collection when only a few logos are required. Keep only the approved icons used by the product.

## Licensing and Trademark Checks

Iconify's software licence does not govern every icon. Before adding an icon:

- Check the licence shown for that specific Iconify collection.
- Do not use non-commercially licensed assets in CircleTel's commercial product.
- Satisfy attribution requirements such as CC BY before release.
- Remember that an open-source icon licence does not grant trademark permission. Use third-party logos only to truthfully identify a supported service, provider, or integration, and never imply an unauthorised partnership or endorsement.

If the licence, attribution, or trademark status is unclear, stop and request approval before shipping the logo.

## Accessibility

- Decorative icons: add `aria-hidden="true"` and ensure adjacent text communicates the meaning.
- Standalone meaningful icons or logos: provide an accessible name with `aria-label`, visible text, or an equivalent labelled container.
- Do not rely on an icon or colour alone to communicate status.

## Examples

```tsx
// General interface icon: keep using Phosphor.
import { PiWifiHighBold } from 'react-icons/pi'

<PiWifiHighBold className="size-5" aria-hidden="true" />
```

```tsx
// Local component pattern: import the project-owned asset, not a runtime URL.
import { RandIconBold } from '@/components/icons/RandIcon'

<RandIconBold className="size-5" aria-label="South African rand" />
```

```tsx
// Runtime Iconify lookup: prototype or explicitly approved non-critical UI only.
'use client'

import { Icon } from '@iconify/react'

<Icon icon="selfhst:netflix" className="h-8 w-auto" aria-label="Netflix" />
```
