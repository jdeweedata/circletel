/**
 * Seed script: populate blocks[] for the business-mobile productPage in Sanity.
 * Run: node scripts/seed-business-mobile-blocks.mjs
 */

const PROJECT_ID = '7iqq2t7l';
const DATASET = 'production';
const API_VERSION = '2024-01-01';
const TOKEN = 'skmTjS4Xwibmg4TzILRb3qvV2Q4fi6j07JnxWjllo3BNn9lQ5PxNFCDVG1qMH0RZku4yHzpKjKSYkPQbiZvaXPAjXJgvcuga8ZPsYwsPY0RJsfuLgtsYud80OTneFTf3PE5tzMvTAEkszduVofyq04OIT94I86xAsRO8e50C5JjZumEuiByJ';
const DOC_ID = 'business-mobile-plans';

const blocks = [
  // 1. Bundle Grid — pricing cards
  {
    _key: 'bm-bundle-grid',
    _type: 'bundleGridBlock',
    eyebrow: 'Business Mobile Plans',
    headline: 'Choose Your Plan',
    description: 'Scalable solutions designed around the real pain points of South African SMEs.',
    columns: 4,
    bundles: [
      {
        _key: 'bm-businessmobile',
        name: 'BusinessMobile',
        tagline: 'Device upgrades for your team — we handle the contracts, you hand out the phones.',
        badge: 'DEVICE PLANS',
        badgeColor: 'primary',
        icon: 'smartphone',
        priceFrom: 'From R455',
        priceSuffix: '/mo',
        features: ['Latest devices on business plans', 'We handle all the paperwork', 'One CircleTel invoice per month'],
        ctaLabel: 'Choose a Device',
        ctaUrl: '/business/mobile/businessmobile',
        featured: false,
      },
      {
        _key: 'bm-officeconnect',
        name: 'OfficeConnect',
        tagline: 'High-speed internet, a free 5G router, and voice lines — one bill, one account.',
        badge: 'MOST POPULAR',
        badgeColor: 'primary',
        icon: 'corporate_fare',
        priceFrom: 'From R1,269',
        priceSuffix: '/mo',
        features: ['Free 5G router included', 'Uncapped high-speed internet', '3 business voice lines'],
        ctaLabel: 'Connect My Office',
        ctaUrl: '/business/mobile/officeconnect',
        featured: true,
      },
      {
        _key: 'bm-workconnect',
        name: 'WorkConnect Mobile',
        tagline: 'Your fixed wireless broadband bundled with a business mobile plan — one account.',
        badge: 'BROADBAND + MOBILE',
        badgeColor: 'secondary',
        icon: 'home_work',
        priceFrom: 'R1,800–R2,500',
        priceSuffix: '/mo',
        features: ['Fixed wireless broadband access', 'Business mobile add-on', 'Dedicated support line'],
        ctaLabel: 'Bundle My Plans',
        ctaUrl: '/business/mobile/workconnect-mobile',
        featured: false,
      },
      {
        _key: 'bm-fleetconnect',
        name: 'FleetConnect',
        tagline: 'IoT SIM cards for vehicle tracking — 5, 10, or 20 lines, one invoice.',
        badge: 'FLEET & IoT',
        badgeColor: 'purple',
        icon: 'local_shipping',
        priceFrom: 'From R375',
        priceSuffix: '/mo',
        features: ['Industrial IoT SIM cards', 'Real-time fleet visibility', 'Nationwide 4G/5G coverage'],
        ctaLabel: 'Connect My Fleet',
        ctaUrl: '/business/mobile/fleetconnect',
        featured: false,
      },
    ],
  },

  // 2. Trust Strip — badges
  {
    _key: 'bm-trust-strip',
    _type: 'trustStripBlock',
    badges: [
      { _key: 'tb1', icon: 'signal_cellular_alt', text: '4G/5G Nationwide Coverage' },
      { _key: 'tb2', icon: 'verified', text: 'ICASA Licensed' },
      { _key: 'tb3', icon: 'bolt', text: 'Zero CAPEX' },
      { _key: 'tb4', icon: 'receipt_long', text: 'One Invoice' },
      { _key: 'tb5', icon: 'support_agent', text: 'Mon–Fri Support' },
    ],
  },

  // 3. Feature Grid — product overview (existing, kept)
  {
    _key: 'b1',
    _type: 'featureGridBlock',
    heading: 'Everything handled. Nothing to manage.',
    subheading: 'From contract paperwork to device delivery — CircleTel takes care of the entire process.',
    features: [
      { _key: 'bg1', icon: 'smartphone', title: 'BusinessMobile', description: 'Team phone upgrades without the store queue. Devices delivered, contracts managed.' },
      { _key: 'bg2', icon: 'business_center', title: 'OfficeConnect', description: 'Internet + voice + mobile on a single bill. One contact for all support.' },
      { _key: 'bg3', icon: 'wifi', title: 'WorkConnect Mobile', description: 'Fixed wireless and mobile managed together — one account, one invoice.' },
      { _key: 'bg4', icon: 'local_shipping', title: 'FleetConnect', description: 'Vehicle tracking SIMs and fleet connectivity consolidated into one plan.' },
    ],
  },

  // 4. Dual List — managed vs DIY comparison
  {
    _key: 'bm-dual-list',
    _type: 'dualListBlock',
    headline: 'Managed for you. Delivered to your door. One invoice.',
    description: 'Skip the telecom queue entirely. We handle contracts, paperwork, and delivery — you just use the product.',
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

  // 5. WhatsApp Quote — lead capture form
  {
    _key: 'bm-whatsapp-quote',
    _type: 'whatsappQuoteBlock',
    eyebrow: 'Get a Quote in 2 Minutes',
    headline: 'Tell us what your business needs',
    description: "We'll reply on WhatsApp within 1 business hour.",
    bundleOptions: [
      'BusinessMobile',
      'OfficeConnect',
      'WorkConnect Mobile',
      'FleetConnect',
      'Not sure yet — help me choose',
    ],
  },

  // 6. FAQ — existing, kept
  {
    _key: 'b2',
    _type: 'faqBlock',
    heading: 'Common questions',
    faqs: [
      { _key: 'fq1', question: 'Do I need to go to a store to sign up?', answer: 'No. Your CircleTel account manager handles all paperwork remotely. Devices and SIMs are delivered to your office.' },
      { _key: 'fq2', question: 'Is the pricing the same as going direct?', answer: 'Yes — you pay the same market rate. CircleTel earns a service fee from the network, not a markup from you.' },
      { _key: 'fq3', question: 'How many lines do I need to qualify?', answer: 'There is no minimum. We manage from 1 line upwards.' },
      { _key: 'fq4', question: 'What happens when a staff member leaves?', answer: 'WhatsApp us and your account manager will handle the transfer or cancellation — no store visit needed.' },
      { _key: 'fq5', question: 'Can I mix different plans for different staff?', answer: 'Yes. You can have a mix of BusinessMobile, OfficeConnect and FleetConnect lines on a single invoice.' },
    ],
  },
];

const mutation = {
  mutations: [
    {
      patch: {
        id: DOC_ID,
        set: { blocks },
      },
    },
  ],
};

const url = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/mutate/${DATASET}`;

const res = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${TOKEN}`,
  },
  body: JSON.stringify(mutation),
});

const result = await res.json();

if (result.error) {
  console.error('Error:', JSON.stringify(result.error, null, 2));
  process.exit(1);
}

console.log('✅ Blocks seeded successfully');
console.log('Transaction ID:', result.transactionId);
console.log('Results:', result.results?.map(r => `${r.id} → ${r.operation}`).join(', '));
