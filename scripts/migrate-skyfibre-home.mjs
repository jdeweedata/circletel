// scripts/migrate-skyfibre-home.mjs
// Run with: node scripts/migrate-skyfibre-home.mjs

import { createClient } from '@sanity/client'

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '7iqq2t7l',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
})

// SkyFibre Home product data (from Prismic export)
const skyfibreHome = {
  _type: 'productPage',
  name: 'SkyFibre Home',
  slug: { _type: 'slug', current: 'skyfibre-home' },
  category: 'consumer',
  tagline: 'Fast, Reliable Home Internet for South African Families',

  pricing: {
    startingPrice: 899,
    priceNote: 'per month incl. VAT',
    showContactForPricing: false,
  },

  keyFeatures: [
    {
      _key: 'f1',
      title: 'Truly Uncapped',
      description: 'No throttling, no fair usage policies. Your speed is your speed.',
      icon: 'infinity',
    },
    {
      _key: 'f2',
      title: 'Professional Installation',
      description: 'Free installation during launch period (normally R750). Done in 30-45 minutes.',
      icon: 'wrench',
    },
    {
      _key: 'f3',
      title: 'Local Support',
      description: 'Mon-Fri support team based in South Africa. No call centre runaround.',
      icon: 'headset',
    },
    {
      _key: 'f4',
      title: 'MTN Tarana Network',
      description: 'Same reliable Tarana G1 technology with 4:1 download-to-upload ratio.',
      icon: 'signal',
    },
  ],

  specifications: [
    { _key: 's1', label: 'Technology', value: 'MTN Tarana G1 Fixed Wireless' },
    { _key: 's2', label: 'Contention Ratio', value: '4:1 (Download:Upload)' },
    { _key: 's3', label: 'Data Cap', value: 'Truly Uncapped' },
    { _key: 's4', label: 'Installation', value: 'Professional (included)' },
    { _key: 's5', label: 'Contract', value: 'Month-to-month' },
  ],

  seo: {
    metaTitle: 'SkyFibre Home | Fast Home Internet | CircleTel',
    metaDescription: 'Get reliable home internet from R799/month. Professional installation, truly uncapped, local support.',
  },

  // Blocks for pricing tiers and FAQ
  blocks: [
    // Pricing Block
    {
      _type: 'pricingBlock',
      _key: 'pricing1',
      eyebrow: 'Choose Your Speed',
      headline: 'Simple, Transparent Pricing',
      description: 'All plans include professional installation, truly uncapped data, and local support.',
      plans: [
        {
          _key: 'p1',
          name: 'SkyFibre Home Plus',
          price: 899,
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
      footnote: 'All prices exclude VAT. Month-to-month contract with 30-day notice period.',
    },

    // FAQ Block
    {
      _type: 'faqBlock',
      _key: 'faq1',
      eyebrow: 'Got Questions?',
      headline: 'Frequently Asked Questions',
      description: 'Everything you need to know about SkyFibre Home.',
      questions: [
        {
          _key: 'q1',
          question: 'What speeds can I expect?',
          answer: [
            {
              _type: 'block',
              _key: 'a1',
              style: 'normal',
              markDefs: [],
              children: [
                {
                  _type: 'span',
                  _key: 'a1s1',
                  text: "SkyFibre Home uses MTN's Tarana G1 technology with a 4:1 download-to-upload ratio. Your advertised speed is what you'll consistently get - we don't throttle or apply fair usage policies.",
                  marks: [],
                },
              ],
            },
          ],
          category: 'technical',
        },
        {
          _key: 'q2',
          question: 'Is installation included?',
          answer: [
            {
              _type: 'block',
              _key: 'a2',
              style: 'normal',
              markDefs: [],
              children: [
                {
                  _type: 'span',
                  _key: 'a2s1',
                  text: 'Yes! Professional installation is included free during our launch period (normally R750). Our technician will mount the outdoor unit, run cabling, and set up your WiFi - typically within 30-45 minutes.',
                  marks: [],
                },
              ],
            },
          ],
          category: 'installation',
        },
        {
          _key: 'q3',
          question: 'What about load shedding?',
          answer: [
            {
              _type: 'block',
              _key: 'a3',
              style: 'normal',
              markDefs: [],
              children: [
                {
                  _type: 'span',
                  _key: 'a3s1',
                  text: 'The outdoor Tarana unit is PoE-powered from inside your home. If you have a UPS or inverter powering your router, your internet will stay connected during load shedding.',
                  marks: [],
                },
              ],
            },
          ],
          category: 'technical',
        },
        {
          _key: 'q4',
          question: 'How does this compare to MTN AirFibre?',
          answer: [
            {
              _type: 'block',
              _key: 'a4',
              style: 'normal',
              markDefs: [],
              children: [
                {
                  _type: 'span',
                  _key: 'a4s1',
                  text: 'We use the same MTN Tarana network, but offer professional installation (vs DIY), local support team (vs call centre), static IP options, and truly uncapped data without throttling.',
                  marks: [],
                },
              ],
            },
          ],
          category: 'general',
        },
        {
          _key: 'q5',
          question: 'What contract options are available?',
          answer: [
            {
              _type: 'block',
              _key: 'a5',
              style: 'normal',
              markDefs: [],
              children: [
                {
                  _type: 'span',
                  _key: 'a5s1',
                  text: 'We offer month-to-month contracts with no long-term commitment. Simply give us 30 days notice if you ever need to cancel.',
                  marks: [],
                },
              ],
            },
          ],
          category: 'pricing',
        },
      ],
      showCategories: true,
    },

    // CTA Block
    {
      _type: 'ctaBlock',
      _key: 'cta1',
      headline: 'Ready to get started?',
      description: 'Check if SkyFibre Home is available in your area.',
      variant: 'banner',
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
      textColor: 'light',
    },
  ],
}

async function migrate() {
  console.log('\n🚀 Migrating SkyFibre Home to Sanity...\n')

  if (!process.env.SANITY_API_WRITE_TOKEN) {
    console.error('❌ SANITY_API_WRITE_TOKEN environment variable required')
    console.log('\nTo get a token:')
    console.log('1. Go to https://www.sanity.io/manage')
    console.log('2. Select project 7iqq2t7l')
    console.log('3. Go to API → Tokens → Add API Token')
    console.log('4. Name: "Migration Script", Permissions: "Editor"')
    console.log('5. Run: SANITY_API_WRITE_TOKEN=<token> node scripts/migrate-skyfibre-home.mjs')
    process.exit(1)
  }

  try {
    // Check if document already exists
    const existing = await client.fetch(
      `*[_type == "productPage" && slug.current == "skyfibre-home"][0]._id`
    )

    if (existing) {
      console.log(`⚠️  Document already exists with ID: ${existing}`)
      console.log('   Updating existing document...')

      const result = await client
        .patch(existing)
        .set(skyfibreHome)
        .commit()

      console.log(`✅ Updated: ${result._id}`)
    } else {
      const result = await client.create(skyfibreHome)
      console.log(`✅ Created: ${result._id}`)
    }

    console.log('\n📄 Document details:')
    console.log(`   Name: ${skyfibreHome.name}`)
    console.log(`   Slug: ${skyfibreHome.slug.current}`)
    console.log(`   Category: ${skyfibreHome.category}`)
    console.log(`   Starting Price: R${skyfibreHome.pricing.startingPrice}`)
    console.log(`   Blocks: ${skyfibreHome.blocks.length} (pricing, faq, cta)`)

    console.log('\n🔗 View in Studio: http://localhost:3000/studio/desk/productPage')

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    if (error.statusCode === 401) {
      console.log('\nToken may be invalid or expired. Generate a new one at:')
      console.log('https://www.sanity.io/manage/project/7iqq2t7l/api#tokens')
    }
    process.exit(1)
  }
}

migrate()
