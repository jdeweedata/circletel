import type { ProductData, ContentSection } from './types'

// Helper function to extract plain text from portable text format
function extractTextFromPortableText(
  portableText: unknown
): string | undefined {
  if (!portableText) return undefined
  if (typeof portableText === 'string') return portableText
  if (!Array.isArray(portableText)) return undefined

  const textParts: string[] = []
  for (const block of portableText) {
    if (
      typeof block === 'object' &&
      block !== null &&
      '_type' in block &&
      block._type === 'block' &&
      'children' in block &&
      Array.isArray(block.children)
    ) {
      for (const child of block.children) {
        if (
          typeof child === 'object' &&
          child !== null &&
          '_type' in child &&
          child._type === 'span' &&
          'text' in child &&
          typeof child.text === 'string'
        ) {
          textParts.push(child.text)
        }
      }
    }
  }

  return textParts.length > 0 ? textParts.join(' ') : undefined
}

export const products: ProductData[] = [
  {
    _id: 'productPage-bizfibreconnect',
    name: 'BizFibreConnect',
    slug: 'bizfibreconnect',
    category: 'business',
    tagline: 'Dedicated dark fibre for businesses that demand reliability',
    description: undefined,
    heroImage: null,
    pricing: {
      startingPrice: 1899,
      priceNote: 'per month',
      showContactForPricing: false,
    },
    keyFeatures: [
      {
        _key: 'symmetric',
        title: 'Symmetric Speeds',
        description:
          'Upload equals download on every tier — no throttling, no surprises.',
        icon: 'arrow-up',
      },
      {
        _key: 'sla',
        title: '99.9% SLA Guarantee',
        description:
          'Guaranteed uptime backed by DFA infrastructure and a binding SLA.',
        icon: 'shield',
      },
      {
        _key: 'dedicated',
        title: 'Dedicated Fibre',
        description:
          'Your own fibre connection via DFA — not shared with neighbours.',
        icon: 'globe',
      },
      {
        _key: 'support',
        title: 'Business-Grade Support',
        description:
          'Priority NOC monitoring, static IP included, and a dedicated account manager.',
        icon: 'phone',
      },
    ],
    specifications: [
      {
        _key: 'tech',
        label: 'Technology',
        value: 'DFA Dark Fibre',
      },
      {
        _key: 'tiers',
        label: 'Speed Tiers',
        value: '25/25 · 50/50 · 100/100 · 200/200 Mbps',
      },
      {
        _key: 'type',
        label: 'Speed Type',
        value: 'Symmetric (equal upload & download)',
      },
      {
        _key: 'sla',
        label: 'Uptime SLA',
        value: '99.9%',
      },
      {
        _key: 'ip',
        label: 'IP Addressing',
        value: 'Static IP included',
      },
      {
        _key: 'contract',
        label: 'Contract Terms',
        value: '12 or 24 months',
      },
    ],
    seo: {
      metaTitle: 'BizFibreConnect — Dedicated Dark Fibre for Business | CircleTel',
      metaDescription:
        'Symmetric dark fibre connectivity via DFA infrastructure. 99.9% SLA, static IP, 25–200 Mbps tiers from R1,899/mo.',
    },
    blocks: [
      {
        _key: 'trust-strip',
        _type: 'trustStripBlock',
        badges: [
          {
            _key: 'b1',
            icon: 'verified',
            text: '99.9% Uptime SLA',
          },
          {
            _key: 'b2',
            icon: 'speed',
            text: '<10ms Latency',
          },
          {
            _key: 'b3',
            icon: 'support_agent',
            text: '24/7 NOC Monitoring',
          },
          {
            _key: 'b4',
            icon: 'swap_vert',
            text: 'Symmetric Speeds',
          },
        ],
      },
      {
        _key: 'pricing-grid',
        _type: 'pricingBlock',
        description: 'Symmetric dark fibre at every speed tier. All prices exclude VAT.',
        footnote: 'All prices exclude VAT. Installation included on 24-month contracts.',
        headline: 'Choose Your BizFibreConnect Plan',
        plans: [
          {
            _key: 'biz25',
            name: 'BizFibre 25',
            price: 1899,
            speed: '25/25 Mbps',
            description: 'Ideal for small offices and light cloud workloads.',
            features: [
              '25 Mbps upload & download',
              'Static IP included',
              '99.9% uptime SLA',
              'Priority support',
              'No throttling',
            ],
            ctaLabel: 'Get Started',
            ctaUrl: '/',
          },
          {
            _key: 'biz50',
            name: 'BizFibre 50',
            price: 2499,
            speed: '50/50 Mbps',
            description: 'Handles multiple video calls and large file transfers.',
            features: [
              '50 Mbps upload & download',
              'Static IP included',
              '99.9% uptime SLA',
              'Priority support',
              'No throttling',
            ],
            ctaLabel: 'Get Started',
            ctaUrl: '/',
          },
          {
            _key: 'biz100',
            name: 'BizFibre 100',
            price: 2999,
            speed: '100/100 Mbps',
            description:
              'The sweet spot for growing businesses and remote teams.',
            features: [
              '100 Mbps upload & download',
              'Static IP included',
              '99.9% uptime SLA',
              'Priority support',
              'No throttling',
            ],
            badge: 'Most Popular',
            isPopular: true,
            ctaLabel: 'Get Started',
            ctaUrl: '/',
          },
          {
            _key: 'biz200',
            name: 'BizFibre 200',
            price: 4499,
            speed: '200/200 Mbps',
            description: 'High-bandwidth operations, multi-site connectivity.',
            features: [
              '200 Mbps upload & download',
              'Static IP included',
              '99.9% uptime SLA',
              'Dedicated account manager',
              'No throttling',
            ],
            ctaLabel: 'Get Started',
            ctaUrl: '/',
          },
          {
            _key: 'biz-enterprise',
            name: 'Enterprise',
            price: 7999,
            speed: '1Gbps+',
            description:
              'Custom 1Gbps+ solutions for enterprise and multi-site deployments. Pricing from R7,999/mo — contact us for a tailored quote.',
            features: [
              '1Gbps+ symmetric speeds',
              'Multiple static IPs',
              '99.99% uptime SLA',
              'Dedicated NOC engineer',
              'Custom SLA terms',
            ],
            isEnterprise: true,
            ctaLabel: 'Contact Sales',
            ctaUrl: 'https://wa.me/27824873900',
          },
        ],
      },
      {
        _key: 'whatsapp-quote',
        _type: 'whatsappQuoteBlock',
        eyebrow: 'Get a Quote in 2 Minutes',
        headline: 'Need a Custom Enterprise Solution?',
        description:
          'Our business team will tailor a BizFibreConnect plan for your requirements. We\'ll reply within 1 business hour.',
        bundleOptions: [
          'BizFibre 25 — 25/25 Mbps (R1,899/mo)',
          'BizFibre 50 — 50/50 Mbps (R2,499/mo)',
          'BizFibre 100 — 100/100 Mbps (R2,999/mo)',
          'BizFibre 200 — 200/200 Mbps (R4,499/mo)',
          'Enterprise — 1Gbps+ (custom pricing)',
        ],
      },
    ] as ContentSection[],
  },
  {
    _id: 'product-business-complete',
    name: 'Business Complete',
    slug: 'business-complete',
    category: 'business',
    tagline: 'Zero downtime. Zero excuses.',
    description: extractTextFromPortableText([
      {
        _key: 'intro',
        _type: 'block',
        children: [
          {
            _key: 'span1',
            _type: 'span',
            marks: [],
            text: 'Zero downtime. Zero excuses. Business Complete bundles CircleTel connectivity with MTN mobile services for reliable, hassle-free connectivity.',
          },
        ],
        markDefs: [],
        style: 'normal',
      },
    ]),
    heroImage:
      'https://cdn.sanity.io/images/7iqq2t7l/production/a2fc2f55d24a940036901476eb1e88d57cecaaae-2752x1536.png',
    pricing: {
      startingPrice: 1798,
      priceNote: 'per month excl. VAT',
      showContactForPricing: false,
    },
    keyFeatures: [
      {
        _key: 'feature-0',
        title: 'Automatic Failover',
        description:
          'When your primary connection drops, 5G backup kicks in within 30 seconds. Your clients won\'t notice.',
        icon: 'shield',
      },
      {
        _key: 'feature-1',
        title: 'Business Voice',
        description:
          'MTN business voice line included with unlimited local calls. One bill, one vendor.',
        icon: 'phone',
      },
      {
        _key: 'feature-2',
        title: 'Static IP Included',
        description:
          'Remote access, VPN, and hosted services work seamlessly with your dedicated IP address.',
        icon: 'globe',
      },
      {
        _key: 'feature-3',
        title: 'WhatsApp Support',
        description:
          'Skip the call centre queue. Message us directly on WhatsApp for instant assistance.',
        icon: 'message-circle',
      },
    ],
    specifications: [
      {
        _key: 'spec-0',
        label: 'Primary Connection',
        value: 'SkyFibre Fixed Wireless (4:1)',
      },
      {
        _key: 'spec-1',
        label: 'Backup Connection',
        value: 'MTN 5G (500GB-Uncapped)',
      },
      {
        _key: 'spec-2',
        label: 'Speed Tiers',
        value: '50 / 100 / 200 Mbps',
      },
      {
        _key: 'spec-3',
        label: 'Contract',
        value: '24 months (MTM +10%)',
      },
      {
        _key: 'spec-4',
        label: 'Installation',
        value: 'Free on 24-month contract',
      },
      {
        _key: 'spec-5',
        label: 'Support',
        value: 'Mon-Fri 8am-5pm + WhatsApp',
      },
    ],
    seo: {
      metaTitle: 'Business Complete - SME Connectivity Bundle | CircleTel',
      metaDescription:
        'Enterprise-grade connectivity for growing businesses. SkyFibre fixed wireless with automatic 5G failover, business voice, and WhatsApp support. From R1,798/month.',
    },
    blocks: [] as ContentSection[],
  },
  {
    _id: 'business-mobile-plans',
    name: 'Business Mobile Plans',
    slug: 'business-mobile',
    category: 'business',
    tagline:
      'Business mobile plans your team actually wants — managed entirely by us, delivered to your door.',
    description: extractTextFromPortableText([
      {
        _key: 'desc1',
        _type: 'block',
        children: [
          {
            _key: 's1',
            _type: 'span',
            text: 'CircleTel manages your business mobile contracts end-to-end. No queuing, no paperwork, no separate invoices. Choose from four purpose-built plans and get devices delivered to your office within 2–5 days.',
          },
        ],
        style: 'normal',
      },
    ]),
    heroImage:
      'https://cdn.sanity.io/images/7iqq2t7l/production/1d9d598d4fc4cda667353d46eaa7c2fb33f3d81f-1376x768.jpg',
    pricing: {
      startingPrice: 87,
      priceNote: 'per line / month',
      showContactForPricing: false,
    },
    keyFeatures: [
      {
        _key: 'f1',
        title: 'Zero CAPEX',
        description:
          'No upfront costs. Pay monthly per line — scale up or down as your team changes.',
        icon: 'payments',
      },
      {
        _key: 'f2',
        title: 'Delivered to Your Door',
        description:
          'Devices and SIMs shipped directly to your office within 2–5 business days.',
        icon: 'local_shipping',
      },
      {
        _key: 'f3',
        title: 'Single Monthly Invoice',
        description:
          'All your lines, contracts and devices on one CircleTel invoice. No more juggling supplier accounts.',
        icon: 'receipt_long',
      },
      {
        _key: 'f4',
        title: '4G/5G Nationwide Coverage',
        description:
          'Your team stays connected wherever they work — backed by South Africa\'s best networks.',
        icon: 'signal_cellular_alt',
      },
      {
        _key: 'f5',
        title: 'WhatsApp Support',
        description:
          'Mon–Fri support via WhatsApp. No call-centre queues, no ticket systems.',
        icon: 'chat',
      },
      {
        _key: 'f6',
        title: 'Fully Managed Contracts',
        description:
          'Your account manager handles all paperwork and renewals — you just use the product.',
        icon: 'manage_accounts',
      },
    ],
    specifications: [
      {
        _key: 'sp1',
        label: 'Coverage',
        value: '4G/5G Nationwide',
      },
      {
        _key: 'sp2',
        label: 'Contract Term',
        value: '24 months',
      },
      {
        _key: 'sp3',
        label: 'Billing Cycle',
        value: 'Monthly — single invoice',
      },
      {
        _key: 'sp4',
        label: 'Device Delivery',
        value: '2–5 business days',
      },
      {
        _key: 'sp5',
        label: 'Support Hours',
        value: 'Mon–Fri, 8am–5pm',
      },
      {
        _key: 'sp6',
        label: 'Min. Lines',
        value: '1 line',
      },
      {
        _key: 'sp7',
        label: 'Starting Price',
        value: 'From R87/line/month',
      },
    ],
    seo: {
      metaTitle:
        'Business Mobile Plans | CircleTel — One Invoice. All Your Connectivity.',
      metaDescription:
        'Business mobile plans managed entirely by CircleTel. Zero CAPEX, one invoice, delivered to your office. BusinessMobile, OfficeConnect, WorkConnect Mobile, FleetConnect.',
    },
    blocks: [
      {
        _key: 'bm-bundle-grid',
        _type: 'bundleGridBlock',
        eyebrow: 'Business Mobile Plans',
        headline: 'Choose Your Plan',
        description:
          'Scalable solutions designed around the real pain points of South African SMEs.',
        columns: 4,
        bundles: [
          {
            _key: 'bm-businessmobile',
            name: 'BusinessMobile',
            icon: 'smartphone',
            badge: 'DEVICE PLANS',
            badgeColor: 'primary',
            featured: false,
            priceFrom: 'From R455',
            priceSuffix: '/mo',
            tagline:
              'Device upgrades for your team — we handle the contracts, you hand out the phones.',
            features: [
              'Latest devices on business plans',
              'We handle all the paperwork',
              'One CircleTel invoice per month',
            ],
            ctaLabel: 'Choose a Device',
            ctaUrl: '/business/mobile/businessmobile',
          },
          {
            _key: 'bm-officeconnect',
            name: 'OfficeConnect',
            icon: 'corporate_fare',
            badge: 'MOST POPULAR',
            badgeColor: 'primary',
            featured: true,
            priceFrom: 'From R1,269',
            priceSuffix: '/mo',
            tagline:
              'High-speed internet, a free 5G router, and voice lines — one bill, one account.',
            features: [
              'Free 5G router included',
              'Uncapped high-speed internet',
              '3 business voice lines',
            ],
            ctaLabel: 'Connect My Office',
            ctaUrl: '/business/mobile/officeconnect',
          },
          {
            _key: 'bm-workconnect',
            name: 'WorkConnect Mobile',
            icon: 'home_work',
            badge: 'BROADBAND + MOBILE',
            badgeColor: 'secondary',
            featured: false,
            priceFrom: 'R1,800–R2,500',
            priceSuffix: '/mo',
            tagline:
              'Your fixed wireless broadband bundled with a business mobile plan — one account.',
            features: [
              'Fixed wireless broadband access',
              'Business mobile add-on',
              'Dedicated support line',
            ],
            ctaLabel: 'Bundle My Plans',
            ctaUrl: '/business/mobile/workconnect-mobile',
          },
          {
            _key: 'bm-fleetconnect',
            name: 'FleetConnect',
            icon: 'local_shipping',
            badge: 'FLEET & IoT',
            badgeColor: 'purple',
            featured: false,
            priceFrom: 'From R375',
            priceSuffix: '/mo',
            tagline:
              'IoT SIM cards for vehicle tracking — 5, 10, or 20 lines, one invoice.',
            features: [
              'Industrial IoT SIM cards',
              'Real-time fleet visibility',
              'Nationwide 4G/5G coverage',
            ],
            ctaLabel: 'Connect My Fleet',
            ctaUrl: '/business/mobile/fleetconnect',
          },
        ],
      },
      {
        _key: 'bm-trust-strip',
        _type: 'trustStripBlock',
        badges: [
          {
            _key: 'tb1',
            icon: 'signal_cellular_alt',
            text: '4G/5G Nationwide Coverage',
          },
          {
            _key: 'tb2',
            icon: 'verified',
            text: 'ICASA Licensed',
          },
          {
            _key: 'tb3',
            icon: 'bolt',
            text: 'Zero CAPEX',
          },
          {
            _key: 'tb4',
            icon: 'receipt_long',
            text: 'One Invoice',
          },
          {
            _key: 'tb5',
            icon: 'support_agent',
            text: 'Mon–Fri Support',
          },
        ],
      },
      {
        _key: 'b1',
        _type: 'featureGridBlock',
        heading: 'Everything handled. Nothing to manage.',
        subheading:
          'From contract paperwork to device delivery — CircleTel takes care of the entire process.',
        features: [
          {
            _key: 'bg1',
            title: 'BusinessMobile',
            icon: 'smartphone',
            description:
              'Team phone upgrades without the store queue. Devices delivered, contracts managed.',
          },
          {
            _key: 'bg2',
            title: 'OfficeConnect',
            icon: 'business_center',
            description:
              'Internet + voice + mobile on a single bill. One contact for all support.',
          },
          {
            _key: 'bg3',
            title: 'WorkConnect Mobile',
            icon: 'wifi',
            description:
              'Fixed wireless and mobile managed together — one account, one invoice.',
          },
          {
            _key: 'bg4',
            title: 'FleetConnect',
            icon: 'local_shipping',
            description:
              'Vehicle tracking SIMs and fleet connectivity consolidated into one plan.',
          },
        ],
      },
      {
        _key: 'bm-dual-list',
        _type: 'dualListBlock',
        headline: 'Managed for you. Delivered to your door. One invoice.',
        description:
          'Skip the telecom queue entirely. We handle contracts, paperwork, and delivery — you just use the product.',
        leftColumn: {
          label: 'CircleTel-Managed',
          badgeLabel: 'CircleTel Advantage',
          items: [
            'Same market pricing — you pay no premium',
            'Your account manager submits all paperwork',
            'Devices delivered to your office in 2–5 days',
            'Mon–Fri WhatsApp support line',
            'Single monthly CircleTel invoice',
            'Zero CAPEX — no upfront cost',
          ],
        },
        rightColumn: {
          label: 'DIY / Self-Managed',
          badgeLabel: 'Managing It Yourself',
          items: [
            '45-minute telecom store queue',
            'You fill in all forms yourself',
            'Collect devices in-store during business hours',
            'Call centre queue for any support issue',
            'Separate invoices per contract',
            'Same monthly cost — more of your time',
          ],
        },
      },
      {
        _key: 'bm-whatsapp-quote',
        _type: 'whatsappQuoteBlock',
        eyebrow: 'Get a Quote in 2 Minutes',
        headline: 'Tell us what your business needs',
        description: 'We\'ll reply on WhatsApp within 1 business hour.',
        bundleOptions: [
          'BusinessMobile',
          'OfficeConnect',
          'WorkConnect Mobile',
          'FleetConnect',
          'Not sure yet — help me choose',
        ],
      },
      {
        _key: 'b2',
        _type: 'faqBlock',
        heading: 'Common questions',
        faqs: [
          {
            _key: 'fq1',
            question: 'Do I need to go to a store to sign up?',
            answer:
              'No. Your CircleTel account manager handles all paperwork remotely. Devices and SIMs are delivered to your office.',
          },
          {
            _key: 'fq2',
            question: 'Is the pricing the same as going direct?',
            answer:
              'Yes — you pay the same market rate. CircleTel earns a service fee from the network, not a markup from you.',
          },
          {
            _key: 'fq3',
            question: 'How many lines do I need to qualify?',
            answer: 'There is no minimum. We manage from 1 line upwards.',
          },
          {
            _key: 'fq4',
            question: 'What happens when a staff member leaves?',
            answer:
              'WhatsApp us and your account manager will handle the transfer or cancellation — no store visit needed.',
          },
          {
            _key: 'fq5',
            question: 'Can I mix different plans for different staff?',
            answer:
              'Yes. You can have a mix of BusinessMobile, OfficeConnect and FleetConnect lines on a single invoice.',
          },
        ],
      },
    ] as ContentSection[],
  },
  {
    _id: 'productPage-managed-it-services',
    name: 'Managed IT Services',
    slug: 'managed-it-services',
    category: 'business',
    tagline: 'Connectivity + IT Services. Single Provider. Single Bill.',
    description: undefined,
    heroImage:
      'https://cdn.sanity.io/images/7iqq2t7l/production/573fd660d872d1ca685719ba9d311bff0f86fd67-1024x1024.png',
    pricing: {
      startingPrice: 2999,
      priceNote: '/mo',
      showContactForPricing: false,
    },
    keyFeatures: [
      {
        _key: 'feature-1',
        title: 'Single Provider Solution',
        description:
          'Connectivity and IT services from one trusted partner. One bill, one point of contact.',
        icon: 'globe',
      },
      {
        _key: 'feature-2',
        title: '30-40% Cost Savings',
        description:
          'Bundled pricing beats engaging separate providers. See the comparison below.',
        icon: 'receipt',
      },
      {
        _key: 'feature-3',
        title: 'Microsoft Certified Team',
        description:
          'AZ-104 Azure Administrator and AZ-140 Azure Virtual Desktop certified experts.',
        icon: 'shield',
      },
      {
        _key: 'feature-4',
        title: 'Direct WhatsApp Support',
        description:
          'No call centre queues. Message our technicians directly for faster resolution.',
        icon: 'message-circle',
      },
    ],
    specifications: [
      {
        _key: 'spec-1',
        label: 'Activation',
        value: '3 business days',
      },
      {
        _key: 'spec-2',
        label: 'Contracts',
        value: 'Month-to-month (no lock-in)',
      },
      {
        _key: 'spec-3',
        label: 'SLA',
        value: '99.5% uptime guarantee',
      },
      {
        _key: 'spec-4',
        label: 'Support',
        value: '24/7 helpdesk available',
      },
      {
        _key: 'spec-5',
        label: 'On-site Response',
        value: '4-hour SLA (Premium+)',
      },
      {
        _key: 'spec-6',
        label: 'Microsoft 365',
        value: 'Full ecosystem management',
      },
    ],
    seo: {
      metaTitle: 'Managed IT Services - Connectivity + IT Support | CircleTel',
      metaDescription:
        'Complete IT solutions from R2,999/mo. Connectivity, Microsoft 365, security, backup, and 24/7 support in one bundle. 30-40% savings vs separate providers. No lock-in contracts.',
    },
    blocks: [
      {
        _key: 'pricing-tiers',
        _type: 'pricingBlock',
        headline: 'Choose Your IT Recipe',
        description:
          'All plans include business-grade connectivity, IT support, and Microsoft 365 management. Additional users available at per-seat pricing.',
        footnote:
          'All prices exclude VAT. Each tier includes a set number of Microsoft 365 licences — additional users charged per seat. Custom solutions available for 100+ employees.',
        plans: [
          {
            _key: 'tier-essential',
            name: 'Essential',
            price: 2999,
            speed: '50Mbps SkyFibre',
            description: 'SOHO & Startups (1-10 employees)',
            features: [
              '50Mbps business internet + static IP',
              'Helpdesk support (Mon-Fri 8-5)',
              '5 Microsoft 365 Business Basic licences',
              'Email security included',
              'Monthly health check',
              'Additional users: R179/mo each',
            ],
            isPopular: false,
            ctaLabel: 'Get Started',
            ctaUrl: '/order/coverage?product=managed-it-services&tier=essential',
          },
          {
            _key: 'tier-professional',
            name: 'Professional',
            price: 5999,
            speed: '100Mbps + Failover',
            description: 'Small Business (10-25 employees)',
            features: [
              '100Mbps internet + LTE failover',
              'Extended support (Mon-Sat 7am-7pm)',
              '10 Microsoft 365 Business Standard licences',
              'Managed firewall + cloud backup (500GB)',
              'Quarterly on-site visit',
              'Additional users: R329/mo each',
            ],
            isPopular: true,
            ctaLabel: 'Get Started',
            ctaUrl: '/order/coverage?product=managed-it-services&tier=professional',
          },
          {
            _key: 'tier-premium',
            name: 'Premium',
            price: 12999,
            speed: '200Mbps + LTE Backup',
            description: 'Growing SME (25-50 employees)',
            features: [
              '200Mbps internet + automatic LTE backup',
              '24/7 support with 4-hour SLA',
              '15 Microsoft 365 Business Premium licences',
              'Complete security suite + 1TB backup',
              'Monthly on-site visit + security training',
              'Additional users: R549/mo each',
            ],
            isPopular: false,
            ctaLabel: 'Get Started',
            ctaUrl: '/order/coverage?product=managed-it-services&tier=premium',
          },
          {
            _key: 'tier-enterprise',
            name: 'Enterprise',
            price: 35000,
            speed: '500Mbps+ Dedicated',
            description: 'Mid-Market (50-100+ employees)',
            features: [
              'Dedicated connectivity (500Mbps+)',
              '24/7 priority support (2-hour SLA)',
              '20+ Microsoft 365 E3 licences',
              'Enterprise security + unlimited backup',
              'Dedicated account manager + weekly presence',
              'Custom pricing based on requirements',
            ],
            isPopular: false,
            ctaLabel: 'Contact Sales',
            ctaUrl: 'https://wa.me/27824873900?text=Hi%2C%20I%27m%20interested%20in%20the%20Enterprise%20Managed%20IT%20package%20for%20my%20business',
          },
        ],
      },
      {
        _key: 'cost-comparison',
        _type: 'comparisonBlock',
        eyebrow: 'Cost Comparison',
        headline: 'Save 34% vs Separate Providers',
        description: 'Example for a 25-user SME business',
      },
    ] as ContentSection[],
  },
  {
    _id: 'product-remote-plus',
    name: 'Remote+',
    slug: 'remote-plus',
    category: 'soho',
    tagline: 'Never drop a client call again.',
    description: extractTextFromPortableText([
      {
        _key: 'intro',
        _type: 'block',
        children: [
          {
            _key: 'span1',
            _type: 'span',
            marks: [],
            text: 'Never drop a client call again. Remote+ bundles CircleTel connectivity with MTN mobile services for reliable, hassle-free connectivity.',
          },
        ],
        markDefs: [],
        style: 'normal',
      },
    ]),
    heroImage:
      'https://cdn.sanity.io/images/7iqq2t7l/production/1a9d2e6fac004bd4731410d7640be384a62d31d4-2752x1536.png',
    pricing: {
      startingPrice: 968,
      priceNote: 'per month excl. VAT',
      showContactForPricing: false,
    },
    keyFeatures: [
      {
        _key: 'feature-0',
        title: 'Automatic Backup',
        description:
          'Your Zoom stays connected even when your main internet fails. 5G/LTE failover happens automatically.',
        icon: 'wifi',
      },
      {
        _key: 'feature-1',
        title: 'Business-Grade WiFi',
        description:
          'WiFi 6 router included - not consumer junk. Handles video calls and family streaming simultaneously.',
        icon: 'router',
      },
      {
        _key: 'feature-2',
        title: 'One Simple Bill',
        description:
          'Stop managing multiple vendors. Primary connection, backup SIM, and support in one package.',
        icon: 'receipt',
      },
      {
        _key: 'feature-3',
        title: 'Pro Upgrade Path',
        description:
          'Need a business voice line? Upgrade to Pro tier with MTN voice included.',
        icon: 'arrow-up',
      },
    ],
    specifications: [
      {
        _key: 'spec-0',
        label: 'Primary Connection',
        value: 'WorkConnect FTTH/FWB',
      },
      {
        _key: 'spec-1',
        label: 'Backup Connection',
        value: 'LTE (15GB) or 5G (500GB)',
      },
      {
        _key: 'spec-2',
        label: 'Speed Tiers',
        value: '50 / 100 / 200 Mbps',
      },
      {
        _key: 'spec-3',
        label: 'Router',
        value: 'WiFi 6 included',
      },
      {
        _key: 'spec-4',
        label: 'Contract',
        value: '24 months (MTM +10%)',
      },
      {
        _key: 'spec-5',
        label: 'Installation',
        value: 'Free on 24-month contract',
      },
    ],
    seo: {
      metaTitle: 'Remote+ - Work From Home Bundle | CircleTel',
      metaDescription:
        'Professional home office connectivity with automatic 5G failover. Never lose a client call to "connection issues" again. From R968/month.',
    },
    blocks: [] as ContentSection[],
  },
  {
    _id: '6IiSiOfgwqd8qIUjl3eeaw',
    name: 'SkyFibre Home',
    slug: 'skyfibre-home',
    category: 'consumer',
    tagline: 'Fast, Reliable Home Internet for South African Families',
    description: undefined,
    heroImage: null,
    pricing: {
      startingPrice: 799,
      priceNote: 'per month',
      showContactForPricing: false,
    },
    keyFeatures: [
      {
        _key: 'f1',
        title: 'Truly Uncapped',
        description:
          'No throttling, no fair usage policies. Your speed is your speed.',
        icon: 'infinity',
      },
      {
        _key: 'f2',
        title: 'Professional Installation',
        description:
          'Free installation during launch period (normally R750). Done in 30-45 minutes.',
        icon: 'wrench',
      },
      {
        _key: 'f3',
        title: 'Local Support',
        description:
          'Mon-Fri support team based in South Africa. No call centre runaround.',
        icon: 'headset',
      },
      {
        _key: 'f4',
        title: 'MTN Tarana Network',
        description:
          'Same reliable Tarana G1 technology with 4:1 download-to-upload ratio.',
        icon: 'signal',
      },
    ],
    specifications: [
      {
        _key: 's1',
        label: 'Technology',
        value: 'MTN Tarana G1 Fixed Wireless',
      },
      {
        _key: 's2',
        label: 'Contention Ratio',
        value: '4:1 (Download:Upload)',
      },
      {
        _key: 's3',
        label: 'Data Cap',
        value: 'Truly Uncapped',
      },
      {
        _key: 's4',
        label: 'Installation',
        value: 'Professional (included)',
      },
      {
        _key: 's5',
        label: 'Contract',
        value: 'Month-to-month',
      },
    ],
    seo: {
      metaTitle: 'SkyFibre Home | Fast Home Internet | CircleTel',
      metaDescription:
        'Get reliable home internet from R799/month. Professional installation, truly uncapped, local support.',
    },
    blocks: [
      {
        _key: 'pricing1',
        _type: 'pricingBlock',
        eyebrow: 'Choose Your Speed',
        headline: 'Simple, Transparent Pricing',
        description:
          'All plans include professional installation, truly uncapped data, and local support.',
        footnote:
          'All prices exclude VAT. Month-to-month contract with 30-day notice period.',
        plans: [
          {
            _key: 'p1',
            name: 'SkyFibre Home Plus',
            price: 799,
            speed: '50/12.5 Mbps',
            description: 'Perfect for everyday browsing and streaming',
            features: [
              '50 Mbps Download / 12.5 Mbps Upload',
              'Truly Uncapped Data',
              'Professional Installation Included',
              'Mon-Fri Support (8am-5pm)',
            ],
            isPopular: false,
            ctaLabel: 'Get Started',
            ctaUrl: '/coverage-check?plan=plus',
          },
          {
            _key: 'p2',
            name: 'SkyFibre Home Max',
            price: 999,
            speed: '100/25 Mbps',
            description: 'Ideal for work-from-home and families',
            features: [
              '100 Mbps Download / 25 Mbps Upload',
              'Truly Uncapped Data',
              'Professional Installation Included',
              'Perfect for Video Calls & Streaming',
              'Mon-Fri Support (8am-5pm)',
            ],
            isPopular: true,
            ctaLabel: 'Get Started',
            ctaUrl: '/coverage-check?plan=max',
          },
          {
            _key: 'p3',
            name: 'SkyFibre Home Ultra',
            price: 1299,
            speed: '200/50 Mbps',
            description: 'Maximum speed for large households',
            features: [
              '200 Mbps Download / 50 Mbps Upload',
              'Truly Uncapped Data',
              'Professional Installation Included',
              'Connect 10+ Devices Smoothly',
              'Mon-Fri Support (8am-5pm)',
            ],
            isPopular: false,
            ctaLabel: 'Get Started',
            ctaUrl: '/coverage-check?plan=ultra',
          },
        ],
        showComparison: false,
      },
      {
        _key: 'faq1',
        _type: 'faqBlock',
        eyebrow: 'Got Questions?',
        headline: 'Frequently Asked Questions',
        description: 'Everything you need to know about SkyFibre Home.',
        showCategories: true,
        questions: [
          {
            _key: 'q1',
            category: 'technical',
            question: 'What speeds can I expect?',
            answer: [
              {
                _key: 'a1',
                _type: 'block',
                children: [
                  {
                    _key: 'a1s1',
                    _type: 'span',
                    marks: [],
                    text: 'SkyFibre Home uses MTN\'s Tarana G1 technology with a 4:1 download-to-upload ratio. Your advertised speed is what you\'ll consistently get - we don\'t throttle or apply fair usage policies.',
                  },
                ],
                markDefs: [],
                style: 'normal',
              },
            ],
          },
          {
            _key: 'q2',
            category: 'installation',
            question: 'Is installation included?',
            answer: [
              {
                _key: 'a2',
                _type: 'block',
                children: [
                  {
                    _key: 'a2s1',
                    _type: 'span',
                    marks: [],
                    text: 'Yes! Professional installation is included free during our launch period (normally R750). Our technician will mount the outdoor unit, run cabling, and set up your WiFi - typically within 30-45 minutes.',
                  },
                ],
                markDefs: [],
                style: 'normal',
              },
            ],
          },
          {
            _key: 'q3',
            category: 'technical',
            question: 'What about load shedding?',
            answer: [
              {
                _key: 'a3',
                _type: 'block',
                children: [
                  {
                    _key: 'a3s1',
                    _type: 'span',
                    marks: [],
                    text: 'The outdoor Tarana unit is PoE-powered from inside your home. If you have a UPS or inverter powering your router, your internet will stay connected during load shedding.',
                  },
                ],
                markDefs: [],
                style: 'normal',
              },
            ],
          },
          {
            _key: 'q4',
            category: 'general',
            question: 'How does this compare to MTN AirFibre?',
            answer: [
              {
                _key: 'a4',
                _type: 'block',
                children: [
                  {
                    _key: 'a4s1',
                    _type: 'span',
                    marks: [],
                    text: 'We use the same MTN Tarana network, but offer professional installation (vs DIY), local support team (vs call centre), static IP options, and truly uncapped data without throttling.',
                  },
                ],
                markDefs: [],
                style: 'normal',
              },
            ],
          },
          {
            _key: 'q5',
            category: 'pricing',
            question: 'What contract options are available?',
            answer: [
              {
                _key: 'a5',
                _type: 'block',
                children: [
                  {
                    _key: 'a5s1',
                    _type: 'span',
                    marks: [],
                    text: 'We offer month-to-month contracts with no long-term commitment. Simply give us 30 days notice if you ever need to cancel.',
                  },
                ],
                markDefs: [],
                style: 'normal',
              },
            ],
          },
        ],
      },
      {
        _key: 'cta1',
        _type: 'ctaBlock',
        headline: 'Ready to get started?',
        description: 'Check if SkyFibre Home is available in your area.',
        variant: 'banner',
        textColor: 'light',
        primaryButton: {
          text: 'Check Coverage',
          url: '/coverage-check',
          style: 'primary',
        },
        secondaryButton: {
          text: 'Contact Sales',
          url: '/contact',
          style: 'secondary',
        },
      },
    ] as ContentSection[],
  },
  {
    _id: 'productPage-skyfibre-smb',
    name: 'SkyFibre SMB',
    slug: 'skyfibre-smb',
    category: 'business',
    tagline: 'Business-grade wireless broadband that works as hard as you do',
    description: undefined,
    heroImage:
      'https://cdn.sanity.io/images/7iqq2t7l/production/214631ea57071d1d65a145cd572c9b9a29074ac0-2752x1536.png',
    pricing: {
      startingPrice: 1299,
      priceNote: '/mo',
      showContactForPricing: false,
    },
    keyFeatures: [
      {
        _key: 'feature-1',
        title: 'Truly Uncapped',
        description:
          'No fair usage throttling. Use as much as you need without speed reductions.',
        icon: 'wifi',
      },
      {
        _key: 'feature-2',
        title: 'Static IP Included',
        description:
          'Public static IP for remote access, VPNs, and hosted services.',
        icon: 'globe',
      },
      {
        _key: 'feature-3',
        title: 'No Lock-in',
        description: 'Month-to-month flexibility. No 24-month contracts required.',
        icon: 'receipt',
      },
      {
        _key: 'feature-4',
        title: 'Business SLA',
        description:
          'Named account manager and guaranteed response times.',
        icon: 'shield',
      },
    ],
    specifications: [
      {
        _key: 'spec-1',
        label: 'Technology',
        value: 'MTN Tarana G1 Fixed Wireless',
      },
      {
        _key: 'spec-2',
        label: 'Spectrum',
        value: 'Licensed (MTN managed)',
      },
      {
        _key: 'spec-3',
        label: 'Latency',
        value: '< 5 ms typical',
      },
      {
        _key: 'spec-4',
        label: 'Speed Ratio',
        value: '4:1 download to upload',
      },
      {
        _key: 'spec-5',
        label: 'Coverage',
        value: '6 million+ homes nationally',
      },
      {
        _key: 'spec-6',
        label: 'Contention',
        value: '8:1 (business grade)',
      },
    ],
    seo: {
      metaTitle: 'SkyFibre SMB - Business Wireless Broadband | CircleTel',
      metaDescription:
        'Business-grade fixed wireless broadband from R1,299/mo. Truly uncapped, static IP included, no lock-in contracts. Powered by MTN Tarana G1.',
    },
    blocks: [
      {
        _key: 'pricing-tiers',
        _type: 'pricingBlock',
        headline: 'Choose Your Speed',
        description:
          'All plans include static IP, truly uncapped data, and business support.',
        footnote:
          'All prices exclude VAT. Installation included on 12+ month terms.',
        plans: [
          {
            _key: 'tier-50',
            name: 'Business 50',
            price: 1299,
            speed: '50/12.5 Mbps',
            features: [
              'Static IP included',
              'Truly uncapped (no FUP)',
              'Basic business support',
              'Month-to-month',
            ],
            isPopular: false,
            ctaLabel: 'Get Started',
            ctaUrl: '/order/coverage?product=skyfibre-smb&tier=50',
          },
          {
            _key: 'tier-100',
            name: 'Business 100',
            price: 1499,
            speed: '100/25 Mbps',
            features: [
              'Static IP included',
              'Truly uncapped (no FUP)',
              'Basic business support',
              'Month-to-month',
            ],
            isPopular: true,
            ctaLabel: 'Get Started',
            ctaUrl: '/order/coverage?product=skyfibre-smb&tier=100',
          },
          {
            _key: 'tier-200',
            name: 'Business 200',
            price: 1899,
            speed: '200/50 Mbps',
            features: [
              'Static IP included',
              'Truly uncapped (no FUP)',
              'Basic business support',
              'Month-to-month',
            ],
            isPopular: false,
            ctaLabel: 'Get Started',
            ctaUrl: '/order/coverage?product=skyfibre-smb&tier=200',
          },
        ],
      },
    ] as ContentSection[],
  },
  {
    _id: 'product-venue-plus',
    name: 'Venue+',
    slug: 'venue-plus',
    category: 'business',
    tagline: 'One vendor for your venue.',
    description: extractTextFromPortableText([
      {
        _key: 'intro',
        _type: 'block',
        children: [
          {
            _key: 'span1',
            _type: 'span',
            marks: [],
            text: 'One vendor for your venue. Venue+ bundles CircleTel connectivity with MTN mobile services for reliable, hassle-free connectivity.',
          },
        ],
        markDefs: [],
        style: 'normal',
      },
    ]),
    heroImage:
      'https://cdn.sanity.io/images/7iqq2t7l/production/d347959ff1e4ad703c9a2b2ee9efcd59be93d91e-2752x1536.png',
    pricing: {
      startingPrice: 1999,
      priceNote: 'per month excl. VAT',
      showContactForPricing: false,
    },
    keyFeatures: [
      {
        _key: 'feature-0',
        title: 'Managed WiFi',
        description:
          'We own the hardware, manage the network, and you get one number to call when anything needs fixing.',
        icon: 'wifi',
      },
      {
        _key: 'feature-1',
        title: 'IoT SIMs Included',
        description:
          'Your card machines, kitchen displays, and sensors stay connected with included MTN IoT SIMs.',
        icon: 'sim-card',
      },
      {
        _key: 'feature-2',
        title: 'Custom Captive Portal',
        description:
          'Guest WiFi with your branding. Collect emails, show promotions, monetise with ads.',
        icon: 'layout',
      },
      {
        _key: 'feature-3',
        title: 'Guest Analytics',
        description:
          'Understand foot traffic, dwell time, and return visitors. Data-driven venue management.',
        icon: 'chart',
      },
    ],
    specifications: [
      {
        _key: 'spec-0',
        label: 'Coverage',
        value: '< 300m² to 2,000m²',
      },
      {
        _key: 'spec-1',
        label: 'Access Points',
        value: '1-12 Reyee WiFi 6',
      },
      {
        _key: 'spec-2',
        label: 'IoT SIMs',
        value: '5-25 MTN IoT SIMs',
      },
      {
        _key: 'spec-3',
        label: 'Management',
        value: 'Ruijie Cloud',
      },
      {
        _key: 'spec-4',
        label: 'Installation',
        value: 'R2,500-R12,500 (50% launch discount)',
      },
      {
        _key: 'spec-5',
        label: 'Support',
        value: 'WhatsApp + On-site',
      },
    ],
    seo: {
      metaTitle: 'Venue+ - Commercial WiFi & IoT Bundle | CircleTel',
      metaDescription:
        'Managed WiFi-as-a-Service with IoT SIMs for POS, sensors, and devices. One vendor, one bill, zero headaches. From R1,999/month.',
    },
    blocks: [] as ContentSection[],
  },
  {
    _id: 'workconnect-plus',
    name: 'WorkConnect Plus',
    slug: 'workconnect-plus',
    category: 'soho',
    tagline: 'Power Your Productivity',
    description: undefined,
    heroImage:
      'https://cdn.sanity.io/images/7iqq2t7l/production/d284e3e1a29dec2ff8eac188f56e0c3f3a965384-2752x1536.jpg',
    pricing: {
      startingPrice: 1099,
      priceNote: 'per month',
      showContactForPricing: false,
    },
    keyFeatures: [
      {
        _key: 'speed',
        title: '100 Mbps Speed',
        description: 'Handle multiple video calls and large file transfers.',
        icon: 'Zap',
      },
      {
        _key: 'voip',
        title: 'VoIP QoS',
        description: 'Crystal-clear voice calls with traffic prioritization.',
        icon: 'Phone',
      },
      {
        _key: 'backup',
        title: '50GB Cloud Backup',
        description: 'Your files, safe and accessible from anywhere.',
        icon: 'Cloud',
      },
      {
        _key: 'email',
        title: '5 Email Accounts',
        description: 'Professional @yourdomain.co.za email addresses.',
        icon: 'Mail',
      },
      {
        _key: 'vpn',
        title: '3 VPN Tunnels',
        description: 'Secure connections to your office network.',
        icon: 'Shield',
      },
      {
        _key: 'support',
        title: 'Extended Support',
        description: 'Mon-Sat 07:00-19:00, 8-hour response time.',
        icon: 'Headphones',
      },
    ],
    specifications: [
      {
        _key: 'download',
        label: 'Download Speed',
        value: '100 Mbps',
      },
      {
        _key: 'upload-ftth',
        label: 'Upload (FTTH)',
        value: '100 Mbps*',
      },
      {
        _key: 'upload-fwb',
        label: 'Upload (FWB)',
        value: '25 Mbps',
      },
      {
        _key: 'data',
        label: 'Data Cap',
        value: 'Uncapped',
      },
      {
        _key: 'cloud',
        label: 'Cloud Backup',
        value: '50 GB',
      },
      {
        _key: 'email',
        label: 'Email Accounts',
        value: '5',
      },
      {
        _key: 'vpn',
        label: 'VPN Tunnels',
        value: '3',
      },
      {
        _key: 'static-ip',
        label: 'Static IP',
        value: 'Add-on R99/mo',
      },
      {
        _key: 'support',
        label: 'Support Hours',
        value: 'Mon-Sat 07:00-19:00',
      },
      {
        _key: 'response',
        label: 'Response Time',
        value: '8 hours',
      },
    ],
    seo: {
      metaTitle: 'WorkConnect Plus - R1,099/mo | CircleTel',
      metaDescription:
        'Power your productivity with 100 Mbps internet, 50GB cloud backup, and 3 VPN tunnels. Perfect for remote workers and micro-businesses. R1,099/month.',
    },
    blocks: [] as ContentSection[],
  },
  {
    _id: 'workconnect-pro',
    name: 'WorkConnect Pro',
    slug: 'workconnect-pro',
    category: 'soho',
    tagline: 'Built for Ambition',
    description: undefined,
    heroImage:
      'https://cdn.sanity.io/images/7iqq2t7l/production/481324bac7fc1d58287d2e16f622ee82926b26b6-2752x1536.jpg',
    pricing: {
      startingPrice: 1499,
      priceNote: 'per month',
      showContactForPricing: false,
    },
    keyFeatures: [
      {
        _key: 'speed',
        title: '200 Mbps Speed',
        description:
          'Blazing fast for content creation and multi-user households.',
        icon: 'Zap',
      },
      {
        _key: 'static',
        title: 'Static IP Included',
        description:
          'Host servers, access your network remotely, no extra cost.',
        icon: 'Globe',
      },
      {
        _key: 'backup',
        title: '100GB Cloud Backup',
        description: 'Your files, safe and accessible from anywhere.',
        icon: 'Cloud',
      },
      {
        _key: 'email',
        title: '10 Email Accounts',
        description: 'Professional @yourdomain.co.za email addresses.',
        icon: 'Mail',
      },
      {
        _key: 'vpn',
        title: '5 VPN Tunnels',
        description: 'Secure connections for your entire team.',
        icon: 'Shield',
      },
      {
        _key: 'support',
        title: 'Priority Support',
        description: '4-hour response, WhatsApp priority access.',
        icon: 'Headphones',
      },
    ],
    specifications: [
      {
        _key: 'download',
        label: 'Download Speed',
        value: '200 Mbps',
      },
      {
        _key: 'upload-ftth',
        label: 'Upload (FTTH)',
        value: '200 Mbps',
      },
      {
        _key: 'upload-fwb',
        label: 'Upload (FWB)',
        value: '50 Mbps',
      },
      {
        _key: 'data',
        label: 'Data Cap',
        value: 'Uncapped',
      },
      {
        _key: 'cloud',
        label: 'Cloud Backup',
        value: '100 GB',
      },
      {
        _key: 'email',
        label: 'Email Accounts',
        value: '10',
      },
      {
        _key: 'vpn',
        label: 'VPN Tunnels',
        value: '5',
      },
      {
        _key: 'static-ip',
        label: 'Static IP',
        value: 'Included',
      },
      {
        _key: 'support',
        label: 'Support Hours',
        value: 'Mon-Sat 07:00-19:00',
      },
      {
        _key: 'response',
        label: 'Response Time',
        value: '4 hours',
      },
      {
        _key: 'whatsapp',
        label: 'WhatsApp Priority',
        value: 'Yes',
      },
    ],
    seo: {
      metaTitle: 'WorkConnect Pro - R1,499/mo | CircleTel',
      metaDescription:
        'Built for ambition. 200 Mbps internet, static IP included, 100GB cloud backup, WhatsApp priority support. Perfect for content creators and power users. R1,499/month.',
    },
    blocks: [] as ContentSection[],
  },
  {
    _id: 'productPage-workconnect-soho',
    name: 'WorkConnect SOHO',
    slug: 'workconnect-soho',
    category: 'soho',
    tagline:
      'Professional-grade internet for freelancers, remote workers, and micro-businesses',
    description: undefined,
    heroImage: null,
    pricing: {
      startingPrice: 799,
      priceNote: '/mo',
      showContactForPricing: false,
    },
    keyFeatures: [
      {
        _key: 'feature-1',
        title: 'VoIP QoS Included',
        description:
          'Voice and video traffic is prioritised so your calls never break up — even during peak hours.',
        icon: 'phone',
      },
      {
        _key: 'feature-2',
        title: 'Cloud Backup Available',
        description:
          '25 GB included on Pro. Add 50–250 GB cloud backup to any plan from R79/mo.',
        icon: 'shield',
      },
      {
        _key: 'feature-3',
        title: 'Technology-Agnostic',
        description:
          'We deliver via the best available technology at your address — FWB, fibre, or 5G/LTE.',
        icon: 'wifi',
      },
      {
        _key: 'feature-4',
        title: 'Extended Support Hours',
        description:
          'Reach us Mon–Sat, 07:00–19:00. No call centre queues — direct WhatsApp support.',
        icon: 'message-circle',
      },
    ],
    specifications: [
      {
        _key: 'spec-1',
        label: 'Technology',
        value: 'FWB (Tarana G1) / FTTH (GPON) / 5G/LTE — best available at your address',
      },
      {
        _key: 'spec-2',
        label: 'Latency',
        value: '< 5 ms to major SA exchanges',
      },
      {
        _key: 'spec-3',
        label: 'Data',
        value: 'Uncapped, no FUP throttling',
      },
      {
        _key: 'spec-4',
        label: 'VoIP QoS',
        value: 'Traffic prioritisation on all plans',
      },
      {
        _key: 'spec-5',
        label: 'Support Hours',
        value: 'Mon–Sat, 07:00–19:00 SAST',
      },
      {
        _key: 'spec-6',
        label: 'Installation',
        value: 'Professional — from R900 once-off (Free on Pro 24-month)',
      },
      {
        _key: 'spec-7',
        label: 'Contract',
        value: 'Month-to-month, 12-month, or 24-month available',
      },
    ],
    seo: {
      metaTitle:
        'WorkConnect SOHO — Home Office Internet from R799/mo | CircleTel',
      metaDescription:
        'Professional internet for freelancers, remote workers, and micro-businesses. VoIP QoS and extended support included on all plans. Cloud backup add-on from R79/mo. Truly uncapped, no FUP. From R799/mo.',
    },
    blocks: [
      {
        _key: 'pricing-tiers',
        _type: 'pricingBlock',
        headline: 'Choose Your WorkConnect Plan',
        description:
          'All plans include VoIP QoS and extended Mon–Sat support. Uncapped, no FUP. Cloud backup available as add-on from R79/mo.',
        footnote:
          'All prices exclude VAT. Upload speeds: FWB = 4:1 asymmetric (e.g. 100/25 Mbps); FTTH = symmetrical; 5G/LTE = variable. Technology determined by your address coverage.',
        plans: [
          {
            _key: 'tier-starter',
            name: 'WorkConnect Starter',
            price: 799,
            period: 'mo',
            speed: '50/12.5 Mbps',
            description: undefined,
            features: [
              'Uncapped data — no FUP throttling',
              'VoIP QoS (voice & video prioritised)',
              '2 business email accounts',
              'Mon–Sat support, 07:00–19:00',
              'Month-to-month available',
              'Static IP available (+ R99/mo)',
              'Cloud backup add-on from R79/mo',
            ],
            isPopular: false,
            ctaLabel: 'Check Coverage',
            ctaUrl: '/order/coverage?product=workconnect-soho&tier=starter',
          },
          {
            _key: 'tier-plus',
            name: 'WorkConnect Plus',
            price: 1099,
            period: 'mo',
            speed: '100/25 Mbps',
            badge: 'Most Popular',
            description: undefined,
            features: [
              'Uncapped data — no FUP throttling',
              'VoIP QoS (voice & video prioritised)',
              '5 business email accounts',
              'VPN support (3 concurrent tunnels)',
              'Mon–Sat support, 07:00–19:00',
              'Month-to-month available',
              'Static IP available (+ R99/mo)',
              'Cloud backup add-on from R79/mo',
            ],
            isPopular: true,
            ctaLabel: 'Check Coverage',
            ctaUrl: '/order/coverage?product=workconnect-soho&tier=plus',
          },
          {
            _key: 'tier-pro',
            name: 'WorkConnect Pro',
            price: 1499,
            period: 'mo',
            speed: '200/50 Mbps',
            badge: 'Best Value',
            description: undefined,
            features: [
              'Uncapped data — no FUP throttling',
              'VoIP QoS with full traffic shaping',
              '25 GB cloud backup included',
              '10 business email accounts',
              'Static IP included (no add-on)',
              'VPN support (5 concurrent tunnels)',
              'RDP/Citrix optimised QoS',
              'Free installation (24-month, valued R1,500)',
              '4-hour response time SLA',
            ],
            isPopular: false,
            ctaLabel: 'Check Coverage',
            ctaUrl: '/order/coverage?product=workconnect-soho&tier=pro',
          },
        ],
      },
      {
        _key: 'faq-section',
        _type: 'faqBlock',
        headline: 'Frequently Asked Questions',
        faqs: [
          {
            _key: 'faq-1',
            question:
              'What technology will I receive at my address?',
            answer:
              'WorkConnect is technology-agnostic — we deliver via the best available technology at your specific address. This could be MTN Tarana G1 Fixed Wireless Broadband (FWB), MTN FTTH fibre, or 5G/LTE. Run a coverage check and we\'ll tell you exactly what\'s available at your address before you commit.',
          },
          {
            _key: 'faq-2',
            question:
              'What does "upload speed" mean for the different technologies?',
            answer:
              'Upload speed depends on delivery technology. MTN Tarana FWB operates at a 4:1 download-to-upload ratio (e.g. 100 Mbps down / 25 Mbps up). MTN FTTH offers symmetrical speeds (100/100 Mbps). 5G/LTE upload speeds are variable. If you require guaranteed symmetrical upload speeds, we\'d recommend checking availability for BizFibreConnect (DFA fibre) instead.',
          },
          {
            _key: 'faq-3',
            question: 'Is there a data cap or fair usage policy?',
            answer:
              'No. All WorkConnect plans are truly uncapped with no Fair Usage Policy (FUP). Your speed will not be throttled during peak hours or after reaching any data threshold. Use as much as you need.',
          },
          {
            _key: 'faq-4',
            question: 'Do I need to sign a long-term contract?',
            answer:
              'No lock-in required. All WorkConnect plans are available month-to-month. You can also choose 12-month or 24-month terms for better pricing. WorkConnect Pro on a 24-month term includes free installation (valued at R1,500).',
          },
          {
            _key: 'faq-5',
            question: 'What is VoIP QoS and why does it matter?',
            answer:
              'VoIP QoS (Quality of Service) prioritises your voice and video call traffic on the network. This means Zoom, Teams, Google Meet, and traditional VoIP calls remain clear and stable even when other devices on your network are uploading large files or streaming. All WorkConnect plans include this at no extra cost.',
          },
          {
            _key: 'faq-6',
            question: 'Is cloud backup included?',
            answer:
              'WorkConnect Pro includes 25 GB cloud backup at no extra cost. Starter and Plus customers can add cloud backup as an optional add-on — 50 GB for R79/mo, 100 GB for R99/mo, or 250 GB for R179/mo. All backup plans automatically back up your selected folders in the background and allow restores from any device.',
          },
          {
            _key: 'faq-7',
            question: 'Can I upgrade from WorkConnect to SkyFibre SMB later?',
            answer:
              'Yes. WorkConnect is designed for solo operators and micro-businesses. As your team grows, you can upgrade to SkyFibre SMB (business-grade FWB with static IP and SLA modules) or BizFibreConnect (dedicated dark fibre). We\'ll help you transition with no installation fee on like-for-like technology upgrades.',
          },
        ],
      },
    ] as ContentSection[],
  },
  {
    _id: 'workconnect-starter',
    name: 'WorkConnect Starter',
    slug: 'workconnect-starter',
    category: 'soho',
    tagline: 'Start Working Smarter',
    description: undefined,
    heroImage:
      'https://cdn.sanity.io/images/7iqq2t7l/production/550101d38e7b7141ee915a42440ddbb33a73aab1-2752x1536.jpg',
    pricing: {
      startingPrice: 799,
      priceNote: 'per month',
      showContactForPricing: false,
    },
    keyFeatures: [
      {
        _key: 'speed',
        title: '50 Mbps Speed',
        description: 'Fast enough for video calls, cloud apps, and streaming.',
        icon: 'Zap',
      },
      {
        _key: 'voip',
        title: 'VoIP QoS',
        description: 'Crystal-clear voice calls with traffic prioritization.',
        icon: 'Phone',
      },
      {
        _key: 'backup',
        title: '25GB Cloud Backup',
        description: 'Your files, safe and accessible from anywhere.',
        icon: 'Cloud',
      },
      {
        _key: 'email',
        title: '2 Email Accounts',
        description: 'Professional @yourdomain.co.za email addresses.',
        icon: 'Mail',
      },
      {
        _key: 'support',
        title: 'Business Hours Support',
        description: 'Mon-Sat 07:00-19:00, 12-hour response time.',
        icon: 'Headphones',
      },
      {
        _key: 'uncapped',
        title: 'Uncapped Data',
        description: 'No limits, no throttling, work without worry.',
        icon: 'Infinity',
      },
    ],
    specifications: [
      {
        _key: 'download',
        label: 'Download Speed',
        value: '50 Mbps',
      },
      {
        _key: 'upload-ftth',
        label: 'Upload (FTTH)',
        value: '50 Mbps',
      },
      {
        _key: 'upload-fwb',
        label: 'Upload (FWB)',
        value: '12.5 Mbps',
      },
      {
        _key: 'data',
        label: 'Data Cap',
        value: 'Uncapped',
      },
      {
        _key: 'cloud',
        label: 'Cloud Backup',
        value: '25 GB',
      },
      {
        _key: 'email',
        label: 'Email Accounts',
        value: '2',
      },
      {
        _key: 'vpn',
        label: 'VPN Tunnels',
        value: '-',
      },
      {
        _key: 'static-ip',
        label: 'Static IP',
        value: 'Add-on R99/mo',
      },
      {
        _key: 'support',
        label: 'Support Hours',
        value: 'Mon-Sat 07:00-19:00',
      },
      {
        _key: 'response',
        label: 'Response Time',
        value: '12 hours',
      },
    ],
    seo: {
      metaTitle: 'WorkConnect Starter - R799/mo | CircleTel',
      metaDescription:
        'Start working smarter with 50 Mbps internet, VoIP QoS, and 25GB cloud backup. Perfect for freelancers and entry-level work from home. R799/month.',
    },
    blocks: [] as ContentSection[],
  },
]
