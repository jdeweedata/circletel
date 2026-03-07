// scripts/migrate-enterprise-it.mjs
// Run with: node scripts/migrate-enterprise-it.mjs

import { createClient } from '@sanity/client'

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '7iqq2t7l',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
})

// Enterprise Managed IT Services data (from Prismic export)
const enterpriseIT = {
  _type: 'servicePage',
  name: 'Enterprise Managed IT Services',
  slug: { _type: 'slug', current: 'enterprise-managed-it-services' },
  category: 'managed',
  tagline: 'Enterprise-Grade IT Infrastructure Without the Complexity',

  benefits: [
    {
      _key: 'b1',
      title: 'Load Shedding Proof Connectivity',
      description: 'Our data centres run on redundant power systems. We help you architect failover solutions so your operations stay online, even when the grid goes down.',
      icon: 'zap',
    },
    {
      _key: 'b2',
      title: 'POPIA Compliant Security',
      description: 'Data sovereignty matters. Our local cloud storage and security protocols are designed to ensure your business remains fully compliant with the Protection of Personal Information Act.',
      icon: 'shield',
    },
    {
      _key: 'b3',
      title: 'Local 24/7 Support Centre',
      description: 'Speak to local engineers who understand your context. No automated loops—just direct access to certified technicians ready to resolve issues remotely or on-site.',
      icon: 'headset',
    },
  ],

  seo: {
    metaTitle: 'Enterprise Managed IT Services | CircleTel South Africa',
    metaDescription: 'Reliable managed IT support, cloud security, and 24/7 help desk for SA enterprises. Keep your business connected and compliant with POPIA.',
  },

  blocks: [
    // Hero Block
    {
      _type: 'heroBlock',
      _key: 'hero1',
      headline: 'Enterprise-Grade IT Infrastructure Without the Complexity',
      subheadline: 'From Cape Town to Johannesburg, we provide South African businesses with proactive IT support, robust cybersecurity, and seamless cloud integration designed for scale.',
      variant: 'fullWidth',
      primaryCta: {
        text: 'Schedule a Consultation',
        url: '/contact-enterprise',
        style: 'primary',
      },
    },

    // Feature Grid Block - Why CircleTel
    {
      _type: 'featureGridBlock',
      _key: 'features1',
      eyebrow: 'Why CircleTel',
      headline: 'Why Leading SA Companies Partner with CircleTel',
      features: [
        {
          _key: 'feat1',
          title: 'Load Shedding Proof Connectivity',
          description: 'Our data centres run on redundant power systems. We help you architect failover solutions so your operations stay online, even when the grid goes down.',
          icon: 'zap',
        },
        {
          _key: 'feat2',
          title: 'POPIA Compliant Security',
          description: 'Data sovereignty matters. Our local cloud storage and security protocols are designed to ensure your business remains fully compliant with the Protection of Personal Information Act.',
          icon: 'shield',
        },
        {
          _key: 'feat3',
          title: 'Local 24/7 Support Centre',
          description: 'Speak to local engineers who understand your context. No automated loops—just direct access to certified technicians ready to resolve issues remotely or on-site.',
          icon: 'headset',
        },
      ],
      columns: 3,
    },

    // Pricing Block - The Stability Recipe
    {
      _type: 'pricingBlock',
      _key: 'pricing1',
      eyebrow: 'Our Packages',
      headline: 'Managed IT Solutions',
      description: 'Choose the package that fits your business needs.',
      plans: [
        {
          _key: 'plan1',
          name: 'The Stability Recipe',
          price: 8500,
          description: 'Ideal for medium-sized enterprises needing reliable daily operations and foundational security.',
          features: [
            'Remote Help Desk (8am - 5pm)',
            'Microsoft 365 Management',
            'Managed Endpoint Antivirus',
            'Daily Off-Site Cloud Backups',
          ],
          isPopular: false,
          ctaLabel: 'Get a Quote',
          ctaUrl: '/contact',
        },
        {
          _key: 'plan2',
          name: 'The Growth Recipe',
          price: 18500,
          description: 'A comprehensive solution for high-demand environments requiring maximum uptime and advanced threat protection.',
          features: [
            '24/7 Priority Support & Monitoring',
            'Advanced Threat Detection (EDR)',
            'Disaster Recovery Planning',
            'Dedicated Account Manager',
            'Monthly Strategic IT Review',
          ],
          isPopular: true,
          ctaLabel: 'Book Assessment',
          ctaUrl: '/contact',
        },
      ],
      showComparison: false,
      footnote: 'Prices are indicative and depend on number of users and complexity. Contact us for a custom quote.',
    },

    // Testimonial Block
    {
      _type: 'testimonialBlock',
      _key: 'testimonials1',
      eyebrow: 'What Our Clients Say',
      headline: 'Trusted by SA Enterprises',
      variant: 'grid',
      showRatings: false,
      // Note: Testimonials need to be created as separate documents and referenced
      // For now, using inline content via a text block workaround
    },

    // Text Block - Testimonial quotes (inline since testimonial docs don't exist yet)
    {
      _type: 'textBlock',
      _key: 'quotes1',
      eyebrow: 'Client Success Stories',
      title: 'What Our Clients Say',
      alignment: 'center',
      maxWidth: 'wide',
      content: [
        {
          _type: 'block',
          _key: 'quote1',
          style: 'blockquote',
          markDefs: [],
          children: [
            {
              _type: 'span',
              _key: 'q1s1',
              text: '"CircleTel migrated our email systems over a weekend with zero downtime. Their team is professional, responsive, and truly understands local business needs." — Thabo Mokoena, Mokoena Logistics',
              marks: [],
            },
          ],
        },
        {
          _type: 'block',
          _key: 'quote2',
          style: 'blockquote',
          markDefs: [],
          children: [
            {
              _type: 'span',
              _key: 'q2s1',
              text: '"Since moving to the Growth package, our cybersecurity worries have vanished. The quarterly strategy sessions have also helped us reduce our hardware costs significantly." — Sarah van der Merwe, Cape FinTech Solutions',
              marks: [],
            },
          ],
        },
      ],
    },

    // FAQ Block
    {
      _type: 'faqBlock',
      _key: 'faq1',
      eyebrow: 'Got Questions?',
      headline: 'Frequently Asked Questions',
      description: 'Common queries about our enterprise IT services.',
      questions: [
        {
          _key: 'q1',
          question: 'What are your response times for critical issues?',
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
                  text: 'For our Growth Recipe clients, we guarantee a 1-hour response time for critical outages, though our average response is typically under 15 minutes. We define clear SLAs to ensure your business continuity.',
                  marks: [],
                },
              ],
            },
          ],
          category: 'support',
        },
        {
          _key: 'q2',
          question: 'Is my data stored in South Africa?',
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
                  text: 'Yes. To ensure speed and POPIA compliance, we utilise Tier 3 data centres located in Johannesburg and Cape Town. We also offer geo-redundancy options for disaster recovery.',
                  marks: [],
                },
              ],
            },
          ],
          category: 'technical',
        },
        {
          _key: 'q3',
          question: 'Can you take over from our current IT provider?',
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
                  text: 'Absolutely. We have a structured onboarding process to ensure a smooth transition. We will audit your current setup, obtain necessary credentials, and document your network to prevent any service gaps.',
                  marks: [],
                },
              ],
            },
          ],
          category: 'general',
        },
      ],
      showCategories: false,
      cta: {
        text: 'Still have questions? Contact us',
        url: '/contact-enterprise',
        style: 'secondary',
      },
    },

    // CTA Block
    {
      _type: 'ctaBlock',
      _key: 'cta1',
      headline: 'Ready to transform your IT infrastructure?',
      description: 'Schedule a free consultation with our enterprise solutions team.',
      variant: 'banner',
      primaryButton: {
        text: 'Schedule Consultation',
        url: '/contact-enterprise',
        style: 'primary',
      },
      secondaryButton: {
        text: 'Download Service Guide',
        url: '/resources/enterprise-it-guide',
        style: 'secondary',
      },
      textColor: 'light',
    },
  ],
}

async function migrate() {
  console.log('\n🚀 Migrating Enterprise Managed IT Services to Sanity...\n')

  if (!process.env.SANITY_API_WRITE_TOKEN) {
    console.error('❌ SANITY_API_WRITE_TOKEN environment variable required')
    console.log('\nRun: SANITY_API_WRITE_TOKEN=<token> node scripts/migrate-enterprise-it.mjs')
    process.exit(1)
  }

  try {
    // Check if document already exists
    const existing = await client.fetch(
      `*[_type == "servicePage" && slug.current == "enterprise-managed-it-services"][0]._id`
    )

    if (existing) {
      console.log(`⚠️  Document already exists with ID: ${existing}`)
      console.log('   Updating existing document...')

      const result = await client
        .patch(existing)
        .set(enterpriseIT)
        .commit()

      console.log(`✅ Updated: ${result._id}`)
    } else {
      const result = await client.create(enterpriseIT)
      console.log(`✅ Created: ${result._id}`)
    }

    console.log('\n📄 Document details:')
    console.log(`   Name: ${enterpriseIT.name}`)
    console.log(`   Slug: ${enterpriseIT.slug.current}`)
    console.log(`   Category: ${enterpriseIT.category}`)
    console.log(`   Benefits: ${enterpriseIT.benefits.length}`)
    console.log(`   Blocks: ${enterpriseIT.blocks.length} (hero, features, pricing, quotes, faq, cta)`)

    console.log('\n🔗 View in Studio: http://localhost:3000/studio/desk/servicePage')

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    if (error.details) {
      console.error('   Details:', JSON.stringify(error.details, null, 2))
    }
    process.exit(1)
  }
}

migrate()
