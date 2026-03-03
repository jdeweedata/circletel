# WorkConnect Product Pages Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create WorkConnect Starter, Plus, and Pro product pages with AI-generated hero images, Sanity CMS content, and dynamic Next.js rendering.

**Architecture:** Sanity-first approach where all product content lives in CMS. Dynamic `/workconnect/[slug]` pages fetch from Sanity. SOHO landing page updated to pull products from Sanity instead of hardcoded arrays.

**Tech Stack:** Next.js 15, Sanity CMS, Gemini Image Generation, TypeScript, Tailwind CSS

---

## Task 1: Generate AI Hero Images

**Files:**
- Create: `public/images/workconnect/workconnect-starter-hero.jpg`
- Create: `public/images/workconnect/workconnect-plus-hero.jpg`
- Create: `public/images/workconnect/workconnect-pro-hero.jpg`

**Step 1: Create directory**

```bash
mkdir -p /home/circletel/public/images/workconnect
```

**Step 2: Generate WorkConnect Starter image**

Use skill: `gemini-imagegen`

Prompt:
```
Professional lifestyle photograph of a young South African freelancer working at a clean minimalist home desk. Single laptop open with video call visible on screen. Morning golden hour light streaming through window. Simple potted plant nearby. Person wearing smart casual attire, focused and productive. Warm neutral tones with subtle orange accent (lamp or mug). Clean uncluttered workspace. Authentic remote work atmosphere. No AI-generated text, no logos, no watermarks. 4K quality, photorealistic, 16:9 aspect ratio.
```

Save to: `public/images/workconnect/workconnect-starter-hero.jpg`

**Step 3: Generate WorkConnect Plus image**

Prompt:
```
Professional lifestyle photograph of a small team of two South African professionals in a modern home office setup. Dual monitors on a stylish desk. One person on video call, other working nearby. Afternoon natural light. Professional but comfortable home environment. Smart business casual attire. Warm neutral decor with subtle orange accents (cushion, artwork frame). Multiple devices visible (laptop, tablet). Productive collaborative energy. No AI-generated text, no logos, no watermarks. 4K quality, photorealistic, 16:9 aspect ratio.
```

Save to: `public/images/workconnect/workconnect-plus-hero.jpg`

**Step 4: Generate WorkConnect Pro image**

Prompt:
```
Professional lifestyle photograph of a South African content creator or power user at a premium multi-monitor workstation. Three screens with creative software visible. Professional microphone and ring light in frame. High-end ergonomic chair. Evening ambient lighting with warm orange LED accent strips. Premium home studio aesthetic. Person wearing modern professional attire. Multiple streaming and productivity tools visible. Aspirational but achievable home office setup. No AI-generated text, no logos, no watermarks. 4K quality, photorealistic, 16:9 aspect ratio.
```

Save to: `public/images/workconnect/workconnect-pro-hero.jpg`

**Step 5: Verify images exist**

```bash
ls -la /home/circletel/public/images/workconnect/
```

Expected: 3 image files, each 500KB-2MB

**Step 6: Commit images**

```bash
cd /home/circletel
git add public/images/workconnect/
git commit -m "feat: add AI-generated WorkConnect hero images"
```

---

## Task 2: Add Sanity Queries for WorkConnect

**Files:**
- Modify: `lib/sanity/queries.ts`

**Step 1: Read existing queries file**

```bash
cat /home/circletel/lib/sanity/queries.ts
```

**Step 2: Add WorkConnect queries**

Add to `lib/sanity/queries.ts`:

```typescript
// WorkConnect Product Queries
export const WORKCONNECT_PRODUCT_QUERY = groq`
  *[_type == "productPage" && slug.current == $slug][0] {
    _id,
    name,
    tagline,
    "slug": slug.current,
    category,
    heroImage {
      asset->{
        _id,
        url,
        metadata {
          dimensions
        }
      },
      alt
    },
    description,
    pricing {
      startingPrice,
      priceNote,
      showContactForPricing
    },
    keyFeatures[] {
      title,
      description,
      icon
    },
    specifications[] {
      label,
      value
    },
    seo {
      metaTitle,
      metaDescription,
      ogImage
    },
    relatedProducts[]-> {
      name,
      "slug": slug.current,
      tagline,
      pricing
    }
  }
`;

export const WORKCONNECT_ALL_QUERY = groq`
  *[_type == "productPage" && category == "soho"] | order(pricing.startingPrice asc) {
    _id,
    name,
    tagline,
    "slug": slug.current,
    heroImage {
      asset->{
        _id,
        url
      }
    },
    pricing {
      startingPrice,
      priceNote
    },
    keyFeatures[0...6] {
      title,
      description
    }
  }
`;

export const WORKCONNECT_SLUGS_QUERY = groq`
  *[_type == "productPage" && category == "soho"] {
    "slug": slug.current
  }
`;
```

**Step 3: Verify TypeScript compiles**

```bash
cd /home/circletel && npx tsc --noEmit lib/sanity/queries.ts 2>&1 | head -20
```

Expected: No errors

**Step 4: Commit**

```bash
git add lib/sanity/queries.ts
git commit -m "feat: add Sanity queries for WorkConnect products"
```

---

## Task 3: Create Dynamic WorkConnect Product Page

**Files:**
- Create: `app/workconnect/[slug]/page.tsx`

**Step 1: Create directory**

```bash
mkdir -p /home/circletel/app/workconnect/[slug]
```

**Step 2: Create the dynamic page**

Create `app/workconnect/[slug]/page.tsx`:

```typescript
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { client } from '@/lib/sanity/client';
import { urlFor } from '@/lib/sanity/image';
import { WORKCONNECT_PRODUCT_QUERY, WORKCONNECT_SLUGS_QUERY } from '@/lib/sanity/queries';
import { Button } from '@/components/ui/button';
import { AddressAutocomplete } from '@/components/coverage/AddressAutocomplete';
import {
  CheckCircle2,
  Wifi,
  Cloud,
  Mail,
  Headphones,
  Shield,
  Zap,
  ArrowRight,
  MapPin,
  Info
} from 'lucide-react';

interface WorkConnectProduct {
  _id: string;
  name: string;
  tagline: string;
  slug: string;
  category: string;
  heroImage?: {
    asset: {
      _id: string;
      url: string;
    };
    alt?: string;
  };
  pricing: {
    startingPrice: number;
    priceNote?: string;
  };
  keyFeatures: Array<{
    title: string;
    description: string;
    icon?: string;
  }>;
  specifications: Array<{
    label: string;
    value: string;
  }>;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
  };
  relatedProducts?: Array<{
    name: string;
    slug: string;
    tagline: string;
    pricing: { startingPrice: number };
  }>;
}

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  wifi: Wifi,
  cloud: Cloud,
  mail: Mail,
  headphones: Headphones,
  shield: Shield,
  zap: Zap,
};

export async function generateStaticParams() {
  const products = await client.fetch<Array<{ slug: string }>>(WORKCONNECT_SLUGS_QUERY);
  return products.map((product) => ({
    slug: product.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await client.fetch<WorkConnectProduct>(WORKCONNECT_PRODUCT_QUERY, { slug });

  if (!product) {
    return { title: 'Product Not Found' };
  }

  return {
    title: product.seo?.metaTitle || `${product.name} | CircleTel WorkConnect`,
    description: product.seo?.metaDescription || product.tagline,
  };
}

export default async function WorkConnectProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await client.fetch<WorkConnectProduct>(WORKCONNECT_PRODUCT_QUERY, { slug });

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-circleTel-grey200 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-circleTel-orange/10 rounded-full mb-6">
                <Wifi className="w-4 h-4 text-circleTel-orange" />
                <span className="text-sm font-medium text-circleTel-orange">
                  WorkConnect SOHO
                </span>
              </div>

              <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-circleTel-navy mb-4">
                {product.name}
              </h1>

              <p className="font-body text-xl text-circleTel-orange font-semibold mb-4">
                {product.tagline}
              </p>

              <div className="flex items-baseline gap-2 mb-6">
                <span className="font-heading text-5xl font-bold text-circleTel-navy">
                  R{product.pricing.startingPrice.toLocaleString()}
                </span>
                <span className="text-circleTel-grey600 text-lg">
                  {product.pricing.priceNote || '/month'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button
                  size="lg"
                  className="bg-circleTel-orange hover:bg-circleTel-orange-dark text-white"
                  asChild
                >
                  <Link href="/?segment=wfh">
                    Check Coverage
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-circleTel-navy text-circleTel-navy"
                  asChild
                >
                  <Link href="/workconnect">
                    Compare Plans
                  </Link>
                </Button>
              </div>

              {/* Quick features */}
              <div className="flex flex-wrap gap-4 text-sm text-circleTel-grey600">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  No contracts
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Free installation
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Uncapped data
                </span>
              </div>
            </div>

            {/* Hero Image */}
            {product.heroImage?.asset?.url && (
              <div className="relative h-[300px] md:h-[400px] lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src={urlFor(product.heroImage).width(800).height(500).url()}
                  alt={product.heroImage.alt || product.name}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-circleTel-navy text-center mb-4">
            What&apos;s Included
          </h2>
          <p className="font-body text-circleTel-grey600 text-center mb-12 max-w-2xl mx-auto">
            Everything you need to work productively from home
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {product.keyFeatures.map((feature, idx) => {
              const IconComponent = feature.icon ? iconMap[feature.icon] || Zap : Zap;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow"
                >
                  <div className="w-12 h-12 bg-circleTel-orange/10 rounded-xl flex items-center justify-center mb-4">
                    <IconComponent className="w-6 h-6 text-circleTel-orange" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-circleTel-navy mb-2">
                    {feature.title}
                  </h3>
                  <p className="font-body text-sm text-circleTel-grey600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Technical Specifications */}
      <section className="bg-circleTel-grey200 py-16 md:py-20">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-circleTel-navy text-center mb-12">
            Technical Specifications
          </h2>

          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
            <table className="w-full">
              <tbody>
                {product.specifications.map((spec, idx) => (
                  <tr
                    key={idx}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <td className="px-6 py-4 font-medium text-circleTel-navy">
                      {spec.label}
                    </td>
                    <td className="px-6 py-4 text-circleTel-grey600 text-right">
                      {spec.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Technology Note */}
          <div className="max-w-2xl mx-auto mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Upload Speed Note</p>
                <p>
                  Upload speeds vary by technology: FTTH delivers symmetrical speeds (equal upload/download).
                  Fixed Wireless (FWB) operates at 4:1 ratio (e.g., 100/25 Mbps). 5G/LTE speeds are variable.
                  Your actual speed depends on coverage at your address.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {product.relatedProducts && product.relatedProducts.length > 0 && (
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-circleTel-navy text-center mb-12">
              Other WorkConnect Plans
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {product.relatedProducts.map((related) => (
                <Link
                  key={related.slug}
                  href={`/workconnect/${related.slug}`}
                  className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl hover:border-circleTel-orange transition-all"
                >
                  <h3 className="font-heading text-lg font-semibold text-circleTel-navy mb-1">
                    {related.name}
                  </h3>
                  <p className="text-sm text-circleTel-grey600 mb-3">
                    {related.tagline}
                  </p>
                  <p className="font-heading text-2xl font-bold text-circleTel-orange">
                    R{related.pricing.startingPrice.toLocaleString()}
                    <span className="text-sm font-normal text-circleTel-grey600">/mo</span>
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="bg-circleTel-navy py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to upgrade your home office?
          </h2>
          <p className="font-body text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Check coverage at your address and get connected in as little as 24 hours.
          </p>

          <div className="max-w-xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-circleTel-orange z-10" />
                <input
                  type="text"
                  placeholder="Enter your address"
                  className="w-full pl-12 pr-4 py-4 h-14 text-base rounded-xl border-2 border-gray-600 bg-white/10 text-white placeholder:text-gray-400 focus:border-circleTel-orange focus:outline-none"
                />
              </div>
              <Button
                size="lg"
                className="h-14 px-8 bg-circleTel-orange hover:bg-circleTel-orange-dark text-white font-semibold rounded-xl"
                asChild
              >
                <Link href="/?segment=wfh">
                  Check Coverage
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
```

**Step 3: Verify TypeScript compiles**

```bash
cd /home/circletel && npm run type-check:memory 2>&1 | tail -20
```

Expected: No errors related to workconnect page

**Step 4: Commit**

```bash
git add app/workconnect/
git commit -m "feat: add dynamic WorkConnect product page"
```

---

## Task 4: Create WorkConnect Index Page (Plan Comparison)

**Files:**
- Create: `app/workconnect/page.tsx`

**Step 1: Create the index page**

Create `app/workconnect/page.tsx`:

```typescript
import { Metadata } from 'next';
import Link from 'next/link';
import { client } from '@/lib/sanity/client';
import { WORKCONNECT_ALL_QUERY } from '@/lib/sanity/queries';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Wifi, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'WorkConnect Plans | SOHO Internet | CircleTel',
  description: 'Compare WorkConnect plans for freelancers, remote workers, and small home offices. From R799/month with VoIP QoS and cloud backup included.',
};

interface WorkConnectPlan {
  _id: string;
  name: string;
  tagline: string;
  slug: string;
  pricing: {
    startingPrice: number;
    priceNote?: string;
  };
  keyFeatures: Array<{
    title: string;
    description?: string;
  }>;
}

export const revalidate = 3600; // Revalidate every hour

export default async function WorkConnectPage() {
  const plans = await client.fetch<WorkConnectPlan[]>(WORKCONNECT_ALL_QUERY);

  // Determine which plan is "featured" (Plus)
  const featuredSlug = 'workconnect-plus';

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-circleTel-grey200 py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-circleTel-orange/10 rounded-full mb-6">
            <Wifi className="w-4 h-4 text-circleTel-orange" />
            <span className="text-sm font-medium text-circleTel-orange">
              Built for Remote Work
            </span>
          </div>

          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-circleTel-navy mb-6">
            WorkConnect Plans
          </h1>

          <p className="font-body text-lg md:text-xl text-circleTel-grey600 mb-8 max-w-2xl mx-auto">
            Reliable connectivity for freelancers, remote workers, and small home offices.
            All plans include VoIP QoS, cloud backup, and business email.
          </p>
        </div>
      </section>

      {/* Plans Grid */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => {
              const isFeatured = plan.slug === featuredSlug;
              return (
                <div
                  key={plan._id}
                  className={cn(
                    'relative bg-white rounded-2xl p-6 md:p-8 transition-all duration-300',
                    isFeatured
                      ? 'ring-2 ring-circleTel-orange shadow-xl scale-[1.02] z-10'
                      : 'shadow-lg hover:shadow-xl border border-gray-100'
                  )}
                >
                  {/* Badge */}
                  {isFeatured && (
                    <div className="absolute -top-3 right-4 px-3 py-1 rounded-full text-xs font-semibold bg-circleTel-orange text-white">
                      Most Popular
                    </div>
                  )}

                  {/* Plan Name */}
                  <h2 className="font-heading text-xl font-semibold text-circleTel-navy mb-1">
                    {plan.name}
                  </h2>
                  <p className="font-body text-sm text-circleTel-grey600 mb-4">
                    {plan.tagline}
                  </p>

                  {/* Price */}
                  <div className="mb-4">
                    <span className="font-heading text-4xl font-bold text-circleTel-navy">
                      R{plan.pricing.startingPrice.toLocaleString()}
                    </span>
                    <span className="text-circleTel-grey600">/mo</span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 mb-6 min-h-[180px]">
                    {plan.keyFeatures.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-circleTel-navy">{feature.title}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Button
                    className={cn(
                      'w-full',
                      isFeatured
                        ? 'bg-circleTel-orange hover:bg-circleTel-orange-dark text-white'
                        : 'bg-circleTel-navy hover:bg-circleTel-navy/90 text-white'
                    )}
                    asChild
                  >
                    <Link href={`/workconnect/${plan.slug}`}>
                      Learn More
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Footnote */}
          <p className="text-center text-sm text-circleTel-grey600 mt-8">
            All prices exclude VAT. No contracts required. Free professional installation.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-circleTel-navy py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-white mb-4">
            Not sure which plan is right for you?
          </h2>
          <p className="font-body text-lg text-gray-300 mb-8">
            Check coverage at your address and we&apos;ll recommend the best option.
          </p>
          <Button
            size="lg"
            className="bg-circleTel-orange hover:bg-circleTel-orange-dark text-white px-8"
            asChild
          >
            <Link href="/?segment=wfh">
              Check Coverage
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/workconnect/page.tsx
git commit -m "feat: add WorkConnect plan comparison page"
```

---

## Task 5: Upload Images to Sanity and Create Product Documents

**Files:**
- Sanity Studio content (no code files)

**Step 1: Start Sanity Studio**

```bash
cd /home/circletel/sanity-studio && npm run dev &
```

Open: http://localhost:3333

**Step 2: Upload images via Sanity Studio**

1. Navigate to Products in sidebar
2. Create new Product Page
3. Upload hero image from `public/images/workconnect/`

**Step 3: Create WorkConnect Starter document**

In Sanity Studio, create productPage with:

```yaml
name: WorkConnect Starter
slug: workconnect-starter
category: soho
tagline: Start Working Smarter
heroImage: [upload workconnect-starter-hero.jpg]
pricing:
  startingPrice: 799
  priceNote: per month
keyFeatures:
  - title: 50 Mbps Download
    description: 12.5 Mbps upload (FWB) / 50 Mbps symmetrical (FTTH)
    icon: wifi
  - title: VoIP QoS Included
    description: Crystal-clear video calls with prioritised traffic
    icon: headphones
  - title: 25GB Cloud Backup
    description: Your critical work files, safe and accessible
    icon: cloud
  - title: 2 Business Email Accounts
    description: Professional email at your domain
    icon: mail
  - title: Extended Support Hours
    description: Mon-Sat, 07:00-19:00
    icon: headphones
  - title: Business-Grade Router
    description: Reyee RG-EW1300G with cloud management
    icon: wifi
specifications:
  - label: Download Speed | value: 50 Mbps
  - label: Upload Speed | value: 12.5-50 Mbps*
  - label: Data | value: Uncapped, no FUP
  - label: Latency | value: < 5ms to SA exchanges
  - label: Router | value: Reyee RG-EW1300G
  - label: Static IP | value: R99/month add-on
  - label: Support | value: Mon-Sat, 07:00-19:00
  - label: Response Time | value: 12 business hours
  - label: Installation | value: R900 once-off
seo:
  metaTitle: WorkConnect Starter | R799/mo | CircleTel
  metaDescription: Perfect for solo freelancers. 50 Mbps, VoIP QoS, 25GB cloud backup, 2 business emails. No contracts.
```

**Step 4: Create WorkConnect Plus document**

```yaml
name: WorkConnect Plus
slug: workconnect-plus
category: soho
tagline: Power Your Productivity
heroImage: [upload workconnect-plus-hero.jpg]
pricing:
  startingPrice: 1099
  priceNote: per month
keyFeatures:
  - title: 100 Mbps Download
    description: 25 Mbps upload (FWB) / 100 Mbps symmetrical (FTTH)
    icon: wifi
  - title: VoIP + Video QoS
    description: Voice and video traffic prioritised
    icon: headphones
  - title: 50GB Cloud Backup
    description: Ample storage for all your work files
    icon: cloud
  - title: 5 Business Email Accounts
    description: For you and your team
    icon: mail
  - title: 3 VPN Tunnels
    description: Connect securely to corporate networks
    icon: shield
  - title: Business Gateway Router
    description: Reyee RG-EG105GW with traffic shaping
    icon: wifi
specifications:
  - label: Download Speed | value: 100 Mbps
  - label: Upload Speed | value: 25-100 Mbps*
  - label: Data | value: Uncapped, no FUP
  - label: Latency | value: < 5ms with QoS
  - label: Router | value: Reyee RG-EG105GW
  - label: VPN Support | value: 3 concurrent tunnels
  - label: Static IP | value: R99/month add-on
  - label: Support | value: Mon-Sat, 07:00-19:00
  - label: Response Time | value: 8 business hours
  - label: Installation | value: R900 once-off
seo:
  metaTitle: WorkConnect Plus | R1,099/mo | CircleTel
  metaDescription: For remote workers and micro-businesses. 100 Mbps, VPN support, 50GB backup, 5 emails. Most popular plan.
```

**Step 5: Create WorkConnect Pro document**

```yaml
name: WorkConnect Pro
slug: workconnect-pro
category: soho
tagline: Built for Ambition
heroImage: [upload workconnect-pro-hero.jpg]
pricing:
  startingPrice: 1499
  priceNote: per month
keyFeatures:
  - title: 200 Mbps Download
    description: 50 Mbps upload (FWB) / 200 Mbps symmetrical (FTTH)
    icon: wifi
  - title: Advanced QoS
    description: Full traffic shaping + RDP/Citrix optimisation
    icon: zap
  - title: 100GB Cloud Backup
    description: Enterprise-grade backup for power users
    icon: cloud
  - title: 10 Business Email Accounts
    description: Scale with your growing team
    icon: mail
  - title: Static IP Included
    description: 1 public IPv4 address at no extra cost
    icon: shield
  - title: WhatsApp Priority Support
    description: 4-hour response time guarantee
    icon: headphones
specifications:
  - label: Download Speed | value: 200 Mbps
  - label: Upload Speed | value: 50-200 Mbps*
  - label: Data | value: Uncapped, no FUP
  - label: Latency | value: < 5ms with advanced QoS
  - label: Router | value: Reyee RG-EG105GW
  - label: VPN Support | value: 5 concurrent tunnels
  - label: Static IP | value: 1 included
  - label: Support | value: Mon-Sat + WhatsApp priority
  - label: Response Time | value: 4 business hours
  - label: Uptime Target | value: 99.5% with credits
  - label: Installation | value: FREE (worth R1,500)
seo:
  metaTitle: WorkConnect Pro | R1,499/mo | CircleTel
  metaDescription: For content creators and power users. 200 Mbps, static IP included, 100GB backup, priority support.
```

**Step 6: Link related products**

For each product, set `relatedProducts` to reference the other two WorkConnect products.

**Step 7: Verify via API**

```bash
curl -s "https://7iqq2t7l.api.sanity.io/v2024-01-01/data/query/production?query=*%5B_type%20%3D%3D%20%22productPage%22%20%26%26%20category%20%3D%3D%20%22soho%22%5D%7Bname%2C%22slug%22%3Aslug.current%2Cpricing%7D" | jq
```

Expected: 3 products returned with correct pricing

---

## Task 6: Update SOHO Landing Page to Fetch from Sanity

**Files:**
- Modify: `app/(marketing)/soho/page.tsx`

**Step 1: Read current SOHO page**

Already read in exploration phase.

**Step 2: Update to fetch from Sanity**

Replace the hardcoded `WORKCONNECT_PLANS` with Sanity fetch. Key changes:

1. Remove `WORKCONNECT_PLANS` constant
2. Add Sanity fetch at top of component
3. Update plan card rendering to use Sanity data
4. Fix pricing (Plus: R999 → R1,099)

Create updated `app/(marketing)/soho/page.tsx`:

```typescript
import { client } from '@/lib/sanity/client';
import { WORKCONNECT_ALL_QUERY } from '@/lib/sanity/queries';
// ... rest of imports stay the same

// Remove WORKCONNECT_PLANS constant entirely

// Add revalidation
export const revalidate = 3600;

// Fetch type
interface SanityPlan {
  _id: string;
  name: string;
  tagline: string;
  slug: string;
  pricing: {
    startingPrice: number;
  };
  keyFeatures: Array<{ title: string }>;
}

export default async function SOHOPage() {
  // Fetch plans from Sanity
  const sanityPlans = await client.fetch<SanityPlan[]>(WORKCONNECT_ALL_QUERY);

  // Transform to component format
  const plans = sanityPlans.map((p) => ({
    id: p.slug,
    name: p.name.replace('WorkConnect ', ''),
    price: p.pricing.startingPrice,
    speed: p.keyFeatures[0]?.title || '',
    description: p.tagline,
    features: p.keyFeatures.map((f) => f.title),
    featured: p.slug === 'workconnect-plus',
    badge: p.slug === 'workconnect-plus' ? 'Most Popular' : p.slug === 'workconnect-pro' ? 'Best Value' : undefined,
  }));

  // ... rest of component uses `plans` instead of `WORKCONNECT_PLANS`
}
```

**Step 3: Full file replacement**

See separate file for complete updated SOHO page.

**Step 4: Verify build**

```bash
cd /home/circletel && npm run build:memory 2>&1 | tail -30
```

Expected: Build succeeds

**Step 5: Commit**

```bash
git add app/\(marketing\)/soho/page.tsx
git commit -m "feat: update SOHO page to fetch WorkConnect plans from Sanity

- Remove hardcoded WORKCONNECT_PLANS
- Fetch from Sanity CMS with ISR (1hr revalidate)
- Fix Plus pricing: R999 → R1,099
- Marketing can now edit plans without code changes"
```

---

## Task 7: Final Verification

**Step 1: Start dev server**

```bash
cd /home/circletel && npm run dev:memory
```

**Step 2: Verify pages load**

- [ ] http://localhost:3000/soho - Plans load from Sanity
- [ ] http://localhost:3000/workconnect - Comparison page works
- [ ] http://localhost:3000/workconnect/workconnect-starter - Product page loads
- [ ] http://localhost:3000/workconnect/workconnect-plus - Product page loads
- [ ] http://localhost:3000/workconnect/workconnect-pro - Product page loads

**Step 3: Verify pricing is correct**

- Starter: R799
- Plus: R1,099 (was R999)
- Pro: R1,499

**Step 4: Test coverage check CTA**

Click "Check Coverage" button - should navigate to `/?segment=wfh`

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete WorkConnect product pages integration

- 3 AI-generated hero images
- 3 product documents in Sanity CMS
- Dynamic /workconnect/[slug] pages
- /workconnect comparison page
- /soho landing fetches from Sanity
- Correct pricing throughout"
```

---

## Summary

| Task | Files | Estimated Time |
|------|-------|----------------|
| 1. AI Images | 3 images in public/ | 10 min |
| 2. Sanity Queries | lib/sanity/queries.ts | 5 min |
| 3. Dynamic Product Page | app/workconnect/[slug]/page.tsx | 15 min |
| 4. Comparison Page | app/workconnect/page.tsx | 10 min |
| 5. Sanity Content | 3 documents in Studio | 20 min |
| 6. SOHO Page Update | app/(marketing)/soho/page.tsx | 10 min |
| 7. Verification | Manual testing | 10 min |

**Total: ~80 minutes**
