/**
 * Seed Site Settings to Sanity
 *
 * Run: SANITY_API_WRITE_TOKEN=<token> npx tsx scripts/seed-site-settings.ts
 */

import { createClient } from '@sanity/client'

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '7iqq2t7l',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
})

const SITE_SETTINGS_ID = 'siteSettings'

const siteSettingsData = {
  _id: SITE_SETTINGS_ID,
  _type: 'siteSettings',
  siteName: 'CircleTel',
  tagline: 'Connecting Today. Creating Tomorrow',
  defaultSeo: {
    metaTitle: 'CircleTel | Fast, Reliable Internet for Home & Business',
    metaDescription:
      'CircleTel delivers fast fixed wireless and fibre internet across South Africa. Connect today with flexible home and business packages.',
  },
  contactInfo: {
    phone: '082 487 3900',
    email: 'contactus@circletel.co.za',
    address: 'Imagine House, 2 Mellis Road, Rivonia, Sandton, 2191',
    supportHours: 'Mon–Fri 8am–5pm SAST',
  },
  socialLinks: {
    facebook: 'https://web.facebook.com/circletelsa/',
    linkedin: 'https://www.linkedin.com/company/circle-tel-sa',
    twitter: 'https://twitter.com/circletel',
    instagram: '',
    youtube: '',
  },
  footerCta: {
    headline: 'Ready to connect?',
    description: 'Get fast, reliable internet from CircleTel today.',
    cta: {
      label: 'View Packages',
      url: '/packages',
      style: 'primary',
      openInNewTab: false,
    },
  },
}

async function seed() {
  console.log('\n🌱 Seeding Site Settings to Sanity...\n')

  if (!process.env.SANITY_API_WRITE_TOKEN) {
    console.error('❌ SANITY_API_WRITE_TOKEN environment variable required')
    console.log('\nRun: SANITY_API_WRITE_TOKEN=<token> npx tsx scripts/seed-site-settings.ts')
    process.exit(1)
  }

  try {
    // Create/update draft first
    const draftId = `drafts.${SITE_SETTINGS_ID}`
    console.log(`📝 Creating draft: ${draftId}`)

    await client.createOrReplace({
      ...siteSettingsData,
      _id: draftId,
    })
    console.log('   ✅ Draft created')

    // Publish by creating the published document
    console.log(`📤 Publishing: ${SITE_SETTINGS_ID}`)

    await client.createOrReplace(siteSettingsData)
    console.log('   ✅ Published')

    console.log('\n✅ Site Settings seeded successfully!\n')
    console.log('📄 Document details:')
    console.log(`   Site Name: ${siteSettingsData.siteName}`)
    console.log(`   Tagline: ${siteSettingsData.tagline}`)
    console.log(`   Contact: ${siteSettingsData.contactInfo.email}`)
    console.log(`   Support: ${siteSettingsData.contactInfo.supportHours}`)
    console.log('\n🔗 View in Studio: https://www.circletel.co.za/studio/desk/siteSettings')
  } catch (error) {
    console.error('❌ Seeding failed:', (error as Error).message)
    if ((error as { details?: unknown }).details) {
      console.error('   Details:', JSON.stringify((error as { details: unknown }).details, null, 2))
    }
    process.exit(1)
  }
}

seed()
