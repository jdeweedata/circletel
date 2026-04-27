# Entertainment Bundle Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dedicated `/entertainment` campaign landing page that bundles Mecool Android TV devices with CircleTel internet plans and routes confirmed coverage into the existing order flow.

**Architecture:** Static bundle data in `lib/data/entertainment-bundles.ts`; four new `components/entertainment/` components; a server-component page at `app/entertainment/page.tsx`; additive `?bundle=` param handling in the existing packages page. The coverage check modal reuses `POST /api/coverage/lead` (already used by the homepage hero) and redirects to `/packages/[leadId]?type=residential&bundle=<bundleId>`.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn/ui (Card, Button, Badge, Dialog, Input), `react-icons/pi`, `/api/coverage/lead` route.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `lib/data/entertainment-bundles.ts` | Static bundle definitions + TypeScript types |
| Create | `app/entertainment/page.tsx` | Server component — SEO metadata + layout shell |
| Create | `components/entertainment/EntertainmentHero.tsx` | Full-width navy hero banner |
| Create | `components/entertainment/BundleCard.tsx` | Single device+plan card |
| Create | `components/entertainment/BundleGrid.tsx` | Responsive 3-col grid of BundleCards |
| Create | `components/entertainment/CoverageCheckModal.tsx` | Dialog: address input → coverage check → redirect |
| Modify | `app/packages/[leadId]/page.tsx` | Read `?bundle=` param, show device callout, pre-highlight plan |
| Create | `scripts/generate-entertainment-hero.py` | Gemini image generation for hero |
| Create | `public/images/entertainment/.gitkeep` | Ensure directory is tracked |

---

## Task 1: Static Bundle Data

**Files:**
- Create: `lib/data/entertainment-bundles.ts`

- [ ] **Step 1: Create the bundle data file**

```typescript
// lib/data/entertainment-bundles.ts

export interface EntertainmentBundle {
  id: string
  badge?: string
  device: {
    name: string
    sku: string
    tagline: string
    price_incl_vat: number
    image_path: string
  }
  internet: {
    name: string
    speed_mbps: number
    technology: 'LTE' | '5G' | 'Fibre'
    monthly_incl_vat: number
  }
  bundle_monthly_incl_vat: number
  features: string[]
}

export const ENTERTAINMENT_BUNDLES: EntertainmentBundle[] = [
  {
    id: 'kd3-lte-10',
    device: {
      name: 'Mecool KD3',
      sku: 'MECOOL-KD3',
      tagline: 'Android TV Stick',
      price_incl_vat: 919,
      image_path: '/images/entertainment/mecool-kd3.jpg',
    },
    internet: {
      name: 'CircleTel LTE 10Mbps',
      speed_mbps: 10,
      technology: 'LTE',
      monthly_incl_vat: 399,
    },
    bundle_monthly_incl_vat: 499,
    features: [
      '10Mbps LTE — smooth HD streaming',
      'No lock-in contract',
      'Free delivery on device',
    ],
  },
  {
    id: 'km7plus-lte-25',
    badge: 'Most Popular',
    device: {
      name: 'Mecool KM7 Plus',
      sku: 'MECOOL-KM7PLUS',
      tagline: 'Google TV Box',
      price_incl_vat: 1034,
      image_path: '/images/entertainment/mecool-km7plus.jpg',
    },
    internet: {
      name: 'CircleTel LTE 25Mbps',
      speed_mbps: 25,
      technology: 'LTE',
      monthly_incl_vat: 549,
    },
    bundle_monthly_incl_vat: 699,
    features: [
      '25Mbps LTE — 4K-ready streaming',
      'No lock-in contract',
      'Free delivery on device',
    ],
  },
  {
    id: 'km7plus-lte-50',
    device: {
      name: 'Mecool KM7 Plus',
      sku: 'MECOOL-KM7PLUS',
      tagline: 'Google TV Box',
      price_incl_vat: 1034,
      image_path: '/images/entertainment/mecool-km7plus.jpg',
    },
    internet: {
      name: 'CircleTel LTE 50Mbps',
      speed_mbps: 50,
      technology: 'LTE',
      monthly_incl_vat: 749,
    },
    bundle_monthly_incl_vat: 899,
    features: [
      '50Mbps LTE — multi-device 4K',
      'No lock-in contract',
      'Free delivery on device',
    ],
  },
  {
    id: 'ks3-lte-50',
    device: {
      name: 'Mecool KS3',
      sku: 'MECOOL-KS3',
      tagline: 'OTT Soundbar + Subwoofer',
      price_incl_vat: 6899,
      image_path: '/images/entertainment/mecool-ks3.jpg',
    },
    internet: {
      name: 'CircleTel LTE 50Mbps',
      speed_mbps: 50,
      technology: 'LTE',
      monthly_incl_vat: 749,
    },
    bundle_monthly_incl_vat: 1399,
    features: [
      '50Mbps LTE — cinema-quality audio',
      'No lock-in contract',
      'Free delivery on device',
    ],
  },
  {
    id: 'ks3-km7plus-lte-100',
    badge: 'Ultimate',
    device: {
      name: 'KS3 Soundbar + KM7 Plus',
      sku: 'MECOOL-KS3-KM7PLUS',
      tagline: 'Full Home Entertainment System',
      price_incl_vat: 7933,
      image_path: '/images/entertainment/mecool-ks3-km7plus.jpg',
    },
    internet: {
      name: 'CircleTel LTE 100Mbps',
      speed_mbps: 100,
      technology: 'LTE',
      monthly_incl_vat: 1099,
    },
    bundle_monthly_incl_vat: 1799,
    features: [
      '100Mbps LTE — unlimited 4K on every screen',
      'No lock-in contract',
      'Free delivery on device',
    ],
  },
]
```

- [ ] **Step 2: Type-check**

```bash
cd /home/circletel && npm run type-check:memory 2>&1 | tail -5
```

Expected: no errors related to `lib/data/entertainment-bundles.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/data/entertainment-bundles.ts
git commit -m "feat(entertainment): add static bundle data types and catalogue"
```

---

## Task 2: Hero Image Directory + Generation Script

**Files:**
- Create: `public/images/entertainment/.gitkeep`
- Create: `scripts/generate-entertainment-hero.py`

- [ ] **Step 1: Create image directory**

```bash
mkdir -p /home/circletel/public/images/entertainment
touch /home/circletel/public/images/entertainment/.gitkeep
```

- [ ] **Step 2: Create hero image generation script**

```python
# scripts/generate-entertainment-hero.py
import os
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

PROMPT = """A high-end studio product visual for CircleTel, a South African internet
and entertainment brand, advertising the Mecool Entertainment Bundle.

Concept: two hero Mecool products presented as a matched pair on a deep navy
(#1B2A4A) background — a Mecool KM7 Plus Google TV Box (compact square set-top
box, matte black with subtle ventilation slots) positioned on the right, and a
Mecool KS3 soundbar (slim horizontal bar design with visible speaker grille) in
the foreground-left. Both devices are lit with soft volumetric orange (#F5831F)
light from below, casting a warm glow pool beneath each unit.

Surface: both products rest on a dark glass surface with a soft orange reflection
below each device.

Negative space: the left 40% of the frame transitions to a deep navy gradient —
flat and dark enough for white headline text and an orange price badge overlay.

Colour palette: deep navy (#1B2A4A) background, vibrant orange (#F5831F) light
sources, white/dark-grey product surfaces, soft white highlights on device edges.
No cyan, no blue accents — strictly navy, orange, and white.

Style: cinematic CGI product photography, three-point studio lighting,
ultra-sharp detail, shallow depth of field with subtle bokeh behind devices,
4K render quality. The mood is premium, modern, and inviting — home entertainment
aspirational.

NOT generic tech stock photography.
NOT cold blue lighting — all light sources must be warm orange.
NOT cluttered — only the two hero devices.
No text, logos, UI overlays, or watermarks in the image.

Aspect ratio: 16:9. Resolution: 4K."""

response = client.models.generate_content(
    model="gemini-3-pro-image-preview",
    contents=[PROMPT],
    config=types.GenerateContentConfig(
        response_modalities=["TEXT", "IMAGE"],
        image_config=types.ImageConfig(
            aspect_ratio="16:9",
            image_size="4K"
        ),
    ),
)

for part in response.parts:
    if part.inline_data:
        part.as_image().save("public/images/entertainment/entertainment-hero.jpg")
        print("Saved: public/images/entertainment/entertainment-hero.jpg")
    elif part.text:
        print(part.text)
```

- [ ] **Step 3: Run the hero image generation**

```bash
cd /home/circletel && set -a && source .env.local && set +a && python3 scripts/generate-entertainment-hero.py
```

Expected: `Saved: public/images/entertainment/entertainment-hero.jpg`

If the image generation fails or the image is unsatisfactory, re-run the script. The page will display a navy fallback background if the image is missing.

- [ ] **Step 4: Commit**

```bash
git add public/images/entertainment/.gitkeep scripts/generate-entertainment-hero.py
git add public/images/entertainment/entertainment-hero.jpg 2>/dev/null || true
git commit -m "feat(entertainment): add hero image directory and generation script"
```

---

## Task 3: CoverageCheckModal Component

**Files:**
- Create: `components/entertainment/CoverageCheckModal.tsx`

This modal handles the address input, calls `POST /api/coverage/lead`, and redirects on success. It shows a not-covered state with WhatsApp fallback.

- [ ] **Step 1: Create the modal component**

```tsx
// components/entertainment/CoverageCheckModal.tsx
'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PiSpinnerBold, PiCheckCircleBold, PiWarningBold, PiWhatsappLogoBold } from 'react-icons/pi'
import type { EntertainmentBundle } from '@/lib/data/entertainment-bundles'

interface CoverageCheckModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bundle: EntertainmentBundle
}

type ModalState = 'input' | 'checking' | 'not_covered'

export function CoverageCheckModal({ open, onOpenChange, bundle }: CoverageCheckModalProps) {
  const [address, setAddress] = useState('')
  const [state, setState] = useState<ModalState>('input')
  const [error, setError] = useState<string | null>(null)

  const handleCheck = async () => {
    if (!address.trim()) {
      setError('Please enter your address')
      return
    }
    setError(null)
    setState('checking')

    try {
      const res = await fetch('/api/coverage/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: address.trim(),
          coverageType: 'residential',
        }),
      })

      if (!res.ok) {
        setState('input')
        setError('Coverage check failed — please try again.')
        return
      }

      const data = await res.json()

      if (data.leadId) {
        window.location.href = `/packages/${data.leadId}?type=residential&bundle=${bundle.id}`
      } else {
        setState('not_covered')
      }
    } catch {
      setState('input')
      setError('Coverage check failed — please try again.')
    }
  }

  const handleReset = () => {
    setAddress('')
    setState('input')
    setError(null)
  }

  const waMessage = encodeURIComponent(
    `Hi, I'm interested in the CircleTel Entertainment Bundle — ${bundle.device.name} + ${bundle.internet.name}`
  )

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) handleReset() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Check Your Coverage</DialogTitle>
          <DialogDescription asChild>
            <div className="mt-2">
              <div className="flex items-center gap-2 bg-navy-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700">
                <span className="font-medium">You're getting:</span>
                <span>{bundle.device.name}</span>
                <span className="text-gray-400">+</span>
                <Badge variant="secondary" className="text-xs">
                  {bundle.internet.speed_mbps}Mbps {bundle.internet.technology}
                </Badge>
                <span className="ml-auto font-bold text-[#F5831F]">
                  R{bundle.bundle_monthly_incl_vat.toLocaleString()}/mo
                </span>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        {state === 'input' && (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Input
                placeholder="e.g. 15 Main Street, Sandton, Johannesburg"
                value={address}
                onChange={(e) => { setAddress(e.target.value); setError(null) }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCheck() }}
                autoFocus
              />
              {error && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <PiWarningBold className="h-4 w-4" />
                  {error}
                </p>
              )}
            </div>
            <Button
              className="w-full bg-[#F5831F] hover:bg-orange-600 text-white"
              onClick={handleCheck}
              disabled={!address.trim()}
            >
              Check Coverage
            </Button>
          </div>
        )}

        {state === 'checking' && (
          <div className="flex flex-col items-center gap-3 py-6">
            <PiSpinnerBold className="h-8 w-8 animate-spin text-[#F5831F]" />
            <p className="text-sm text-gray-600">Checking coverage at your address…</p>
          </div>
        )}

        {state === 'not_covered' && (
          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <PiWarningBold className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800 text-sm">We're not in your area yet</p>
                <p className="text-xs text-amber-700 mt-1">
                  We're expanding fast. Join the waitlist and we'll notify you when we arrive.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                className="w-full bg-[#25D366] hover:bg-green-600 text-white gap-2"
                asChild
              >
                <a
                  href={`https://wa.me/27824873900?text=${waMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <PiWhatsappLogoBold className="h-4 w-4" />
                  WhatsApp Us to Join Waitlist
                </a>
              </Button>
              <Button variant="outline" className="w-full" onClick={handleReset}>
                Try a Different Address
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
cd /home/circletel && npm run type-check:memory 2>&1 | grep -E "entertainment|CoverageCheck" | head -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/entertainment/CoverageCheckModal.tsx
git commit -m "feat(entertainment): add CoverageCheckModal with address input and not-covered state"
```

---

## Task 4: BundleCard Component

**Files:**
- Create: `components/entertainment/BundleCard.tsx`

- [ ] **Step 1: Create the card component**

```tsx
// components/entertainment/BundleCard.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PiCheckBold, PiWifiHighBold } from 'react-icons/pi'
import { CoverageCheckModal } from './CoverageCheckModal'
import type { EntertainmentBundle } from '@/lib/data/entertainment-bundles'

interface BundleCardProps {
  bundle: EntertainmentBundle
}

export function BundleCard({ bundle }: BundleCardProps) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <Card className={`relative flex flex-col overflow-hidden transition-shadow hover:shadow-lg ${
        bundle.badge === 'Most Popular' ? 'ring-2 ring-[#F5831F]' : ''
      }`}>
        {bundle.badge && (
          <div className="absolute top-3 right-3 z-10">
            <Badge className="bg-[#F5831F] text-white text-xs font-semibold px-2 py-1">
              {bundle.badge}
            </Badge>
          </div>
        )}

        {/* Device image */}
        <div className="relative h-44 bg-white flex items-center justify-center p-4">
          <Image
            src={bundle.device.image_path}
            alt={bundle.device.name}
            width={180}
            height={150}
            className="object-contain max-h-36"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              target.parentElement!.classList.add('bg-gray-100')
            }}
          />
        </div>

        <CardContent className="flex flex-col flex-1 p-5 gap-4">
          {/* Device info */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
              {bundle.device.tagline}
            </p>
            <h3 className="font-bold text-gray-900 text-lg leading-tight mt-0.5">
              {bundle.device.name}
            </h3>
          </div>

          {/* Internet plan pill */}
          <div className="flex items-center gap-1.5">
            <PiWifiHighBold className="h-4 w-4 text-[#F5831F]" />
            <span className="text-sm font-medium text-gray-700">
              {bundle.internet.speed_mbps}Mbps {bundle.internet.technology}
            </span>
          </div>

          {/* Price */}
          <div>
            <span className="text-3xl font-extrabold text-[#1B2A4A]">
              R{bundle.bundle_monthly_incl_vat.toLocaleString()}
            </span>
            <span className="text-gray-500 text-sm">/mo</span>
          </div>

          {/* Features */}
          <ul className="flex flex-col gap-1.5 flex-1">
            {bundle.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                <PiCheckBold className="h-4 w-4 text-[#F5831F] flex-shrink-0 mt-0.5" />
                {feature}
              </li>
            ))}
          </ul>

          {/* CTA */}
          <Button
            className="w-full bg-[#F5831F] hover:bg-orange-600 text-white font-semibold mt-auto"
            onClick={() => setModalOpen(true)}
          >
            Get This Bundle
          </Button>
        </CardContent>
      </Card>

      <CoverageCheckModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        bundle={bundle}
      />
    </>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
cd /home/circletel && npm run type-check:memory 2>&1 | grep -E "BundleCard|entertainment" | head -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/entertainment/BundleCard.tsx
git commit -m "feat(entertainment): add BundleCard with device image, pricing, and coverage CTA"
```

---

## Task 5: BundleGrid and EntertainmentHero Components

**Files:**
- Create: `components/entertainment/BundleGrid.tsx`
- Create: `components/entertainment/EntertainmentHero.tsx`

- [ ] **Step 1: Create BundleGrid**

```tsx
// components/entertainment/BundleGrid.tsx
import { ENTERTAINMENT_BUNDLES } from '@/lib/data/entertainment-bundles'
import { BundleCard } from './BundleCard'

export function BundleGrid() {
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-bold text-[#1B2A4A]">
          Choose Your Entertainment Bundle
        </h2>
        <p className="text-gray-500 mt-2 text-sm md:text-base">
          Pick a Mecool device + CircleTel internet — delivered to your door.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {ENTERTAINMENT_BUNDLES.map((bundle) => (
          <BundleCard key={bundle.id} bundle={bundle} />
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Create EntertainmentHero**

```tsx
// components/entertainment/EntertainmentHero.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PiSparkle, PiWhatsappLogoBold } from 'react-icons/pi'
import { CoverageCheckModal } from './CoverageCheckModal'
import { ENTERTAINMENT_BUNDLES } from '@/lib/data/entertainment-bundles'

export function EntertainmentHero() {
  const [modalOpen, setModalOpen] = useState(false)
  // Default to Most Popular bundle for hero CTA
  const featuredBundle = ENTERTAINMENT_BUNDLES.find(b => b.badge === 'Most Popular') ?? ENTERTAINMENT_BUNDLES[0]
  const waMessage = encodeURIComponent("Hi, I'm interested in the CircleTel Entertainment Bundle")

  return (
    <>
      <section className="bg-[#1B2A4A] text-white overflow-hidden">
        <div className="container mx-auto px-4 py-14 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            {/* Left: copy */}
            <div className="flex flex-col gap-5">
              <div>
                <Badge className="bg-[#F5831F] text-white text-xs font-semibold px-3 py-1.5 mb-4 inline-flex items-center gap-1.5">
                  <PiSparkle className="h-3.5 w-3.5" />
                  New — Entertainment Bundles
                </Badge>
                <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
                  Stream Everything.<br />Pay Less.
                </h1>
              </div>
              <p className="text-lg text-white/80 max-w-md">
                Bundle a Mecool Android TV device with CircleTel internet from{' '}
                <span className="text-[#F5831F] font-semibold">R499/mo</span>.
                No lock-in contracts. Free delivery.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  size="lg"
                  className="bg-[#F5831F] hover:bg-orange-600 text-white font-semibold px-8"
                  onClick={() => setModalOpen(true)}
                >
                  Check Coverage
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/40 text-white hover:bg-white/10 gap-2"
                  asChild
                >
                  <a
                    href={`https://wa.me/27824873900?text=${waMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <PiWhatsappLogoBold className="h-5 w-5" />
                    WhatsApp Us
                  </a>
                </Button>
              </div>
            </div>

            {/* Right: hero image */}
            <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden">
              <Image
                src="/images/entertainment/entertainment-hero.jpg"
                alt="Mecool KM7 Plus and KS3 Soundbar — CircleTel Entertainment Bundle"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <CoverageCheckModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        bundle={featuredBundle}
      />
    </>
  )
}
```

- [ ] **Step 3: Type-check**

```bash
cd /home/circletel && npm run type-check:memory 2>&1 | grep -E "BundleGrid|EntertainmentHero|entertainment" | head -10
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/entertainment/BundleGrid.tsx components/entertainment/EntertainmentHero.tsx
git commit -m "feat(entertainment): add BundleGrid and EntertainmentHero components"
```

---

## Task 6: Page Shell — `app/entertainment/page.tsx`

**Files:**
- Create: `app/entertainment/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// app/entertainment/page.tsx
import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { EntertainmentHero } from '@/components/entertainment/EntertainmentHero'
import { BundleGrid } from '@/components/entertainment/BundleGrid'
import { PiWhatsappLogoBold } from 'react-icons/pi'

export const metadata: Metadata = {
  title: 'Entertainment Bundles | Stream Everything. Pay Less. | CircleTel',
  description:
    'Bundle a Mecool Android TV device with CircleTel internet from R499/mo. No lock-in contracts. Free delivery. Check coverage today.',
  openGraph: {
    title: 'Stream Everything. Pay Less.',
    description: 'Mecool Android TV + CircleTel internet from R499/mo',
    images: ['/images/entertainment/entertainment-hero.jpg'],
  },
}

export default function EntertainmentPage() {
  const waMessage = encodeURIComponent(
    "Hi, I'm interested in the CircleTel Entertainment Bundle"
  )

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Zone 1: Hero Banner */}
        <EntertainmentHero />

        {/* Zone 2: Promo Strip */}
        <div className="bg-[#F5831F] text-white py-3 px-4 text-center text-sm font-medium">
          Free delivery on all entertainment bundles · No lock-in contracts · Setup in 24 hours
        </div>

        {/* Zone 3: Bundle Grid */}
        <BundleGrid />

        {/* Zone 4: Bottom CTA Strip */}
        <section className="bg-[#F5831F] text-white py-12 px-4">
          <div className="container mx-auto text-center max-w-xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Not sure which bundle suits you?
            </h2>
            <p className="text-white/90 mb-6 text-sm md:text-base">
              Our team can help you choose the right device and plan for your home.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href={`https://wa.me/27824873900?text=${waMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white text-[#F5831F] hover:bg-gray-50 font-semibold px-6 py-3 rounded-md transition-colors"
              >
                <PiWhatsappLogoBold className="h-5 w-5" />
                WhatsApp Us
              </a>
              <a
                href="/products"
                className="inline-flex items-center gap-2 border border-white/60 text-white hover:bg-white/10 font-medium px-6 py-3 rounded-md transition-colors text-sm"
              >
                View all internet plans
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
```

- [ ] **Step 2: Type-check full project**

```bash
cd /home/circletel && npm run type-check:memory 2>&1 | tail -10
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add app/entertainment/page.tsx
git commit -m "feat(entertainment): add /entertainment page with hero, promo strip, grid, and CTA"
```

---

## Task 7: Packages Page — Bundle Param Integration

**Files:**
- Modify: `app/packages/[leadId]/page.tsx`

This is additive only — no existing behaviour is modified. We read the `?bundle=` param and conditionally render a device callout banner and auto-highlight the matching plan.

- [ ] **Step 1: Read the existing searchParams block**

Open `app/packages/[leadId]/page.tsx` and locate the existing `useSearchParams` read (around line 65):

```typescript
const coverageType = searchParams.get('type') || 'residential';
```

- [ ] **Step 2: Add bundle param reading and import**

Add the import for bundle data after the existing imports block (anywhere near the top with other imports):

```typescript
import { ENTERTAINMENT_BUNDLES, type EntertainmentBundle } from '@/lib/data/entertainment-bundles'
```

In `PackagesContent()`, after line `const coverageType = searchParams.get('type') || 'residential';`, add:

```typescript
const bundleId = searchParams.get('bundle')
const activeBundle: EntertainmentBundle | null = bundleId
  ? (ENTERTAINMENT_BUNDLES.find(b => b.id === bundleId) ?? null)
  : null
```

- [ ] **Step 3: Auto-highlight matching plan when bundle param present**

Inside `fetchPackages`, after the existing `setPackages(data.packages || [])` call (around line 100), add this block **before** the existing auto-select logic:

```typescript
// If a bundle param is present, pre-select the matching LTE plan by speed
if (activeBundle && data.packages && data.packages.length > 0) {
  const matchedPkg = data.packages.find((p: Package) => {
    const st = (p.service_type || '').toLowerCase()
    const pc = (p.product_category || '').toLowerCase()
    const isLTE = (st.includes('lte') || pc.includes('lte')) && !st.includes('5g') && !pc.includes('5g')
    return isLTE && p.speed_down === activeBundle.internet.speed_mbps
  })
  if (matchedPkg) {
    setSelectedPackage(matchedPkg)
    setActiveService('lte')
    return // skip default auto-select below
  }
}
```

Note: the `return` here skips the rest of `fetchPackages`'s auto-select block. Place it directly before the existing `if (data.packages && data.packages.length > 0) {` auto-select block so the early return is clean.

- [ ] **Step 4: Add device callout banner**

In the JSX, find the `<Navbar />` component and immediately after it (before the main content div), add the bundle callout:

```tsx
{activeBundle && (
  <div className="bg-[#1B2A4A] text-white py-3 px-4">
    <div className="container mx-auto flex items-center justify-between gap-4 flex-wrap text-sm">
      <div className="flex items-center gap-2">
        <span className="text-[#F5831F] font-semibold">Bundle includes:</span>
        <span>{activeBundle.device.name} — {activeBundle.device.tagline}</span>
      </div>
      <span className="text-white/70">
        R{activeBundle.bundle_monthly_incl_vat.toLocaleString()}/mo total
      </span>
    </div>
  </div>
)}
```

Locate the `<Navbar />` line in the return block. The callout goes immediately after it, before the first `<section>` or content wrapper.

- [ ] **Step 5: Type-check**

```bash
cd /home/circletel && npm run type-check:memory 2>&1 | tail -10
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add app/packages/\[leadId\]/page.tsx
git commit -m "feat(entertainment): add bundle param to packages page — pre-highlight plan + device callout"
```

---

## Task 8: Verification

- [ ] **Step 1: Run full type-check**

```bash
cd /home/circletel && npm run type-check:memory 2>&1 | tail -5
```

Expected: `Found 0 errors.`

- [ ] **Step 2: Start dev server and open the page**

```bash
cd /home/circletel && npm run dev:memory
```

Open `http://localhost:3000/entertainment` and verify:

- [ ] Page renders with navy hero banner, "Stream Everything. Pay Less." heading
- [ ] "New — Entertainment Bundles" badge visible in hero
- [ ] Orange promo strip visible below hero
- [ ] 5 bundle cards render in the grid (KD3, KM7 Plus ×2, KS3, KS3+KM7 Plus)
- [ ] "Most Popular" badge visible on `km7plus-lte-25` card
- [ ] "Ultimate" badge visible on `ks3-km7plus-lte-100` card
- [ ] Clicking "Get This Bundle" opens `CoverageCheckModal` with correct bundle context shown
- [ ] Bundle name + plan + monthly price shown in modal header
- [ ] "Check Coverage" button disabled when address field empty
- [ ] Address entry → Enter key triggers check
- [ ] Bottom CTA strip visible with WhatsApp + "View all internet plans" links
- [ ] Mobile (375px): cards stack to 1-col; hero stacks vertically

- [ ] **Step 3: Verify packages page with bundle param**

Navigate to `http://localhost:3000/packages/test-lead?bundle=km7plus-lte-25` (use any real leadId from your DB if possible).

Expected:
- [ ] Navy banner shows "Bundle includes: Mecool KM7 Plus — Google TV Box · R699/mo total"
- [ ] LTE tab auto-selected
- [ ] 25Mbps package highlighted (if that package exists for the lead)

- [ ] **Step 4: Commit verification checkpoint**

```bash
git add -A
git commit -m "chore(entertainment): verification checkpoint — all 5 bundles render, modal works"
```

---

## Post-Implementation Notes

**Before launch:**
1. Replace placeholder device images in `public/images/entertainment/` with actual Nology/Mecool product images (or generate via `nb-product-hero` skill)
2. Confirm exact bundle pricing with CircleTel plan team (current prices are approximate)
3. Add `/entertainment` to `NavigationData.ts` if it should appear in the nav

**Not in scope (separate tasks):**
- Admin CMS control of bundle content
- Cart/basket — order flows through existing checkout
- Reusable `/promotions/[slug]` template
