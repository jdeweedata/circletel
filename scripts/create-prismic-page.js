/**
 * Create a Prismic page document using the Migration API
 * Usage: node scripts/create-prismic-page.js
 */

require('dotenv/config');

const PRISMIC_REPOSITORY = process.env.PRISMIC_REPOSITORY_NAME || 'circletel';
const PRISMIC_WRITE_TOKEN = process.env.PRISMIC_WRITE_TOKEN;
const MIGRATION_API_URL = 'https://migration.prismic.io';

if (!PRISMIC_WRITE_TOKEN) {
  console.error('❌ PRISMIC_WRITE_TOKEN not found in environment variables');
  process.exit(1);
}

/**
 * Create a page document with slices
 */
async function createPage(pageData) {
  const url = `${MIGRATION_API_URL}/documents`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PRISMIC_WRITE_TOKEN}`,
      'Content-Type': 'application/json',
      'repository': PRISMIC_REPOSITORY,
    },
    body: JSON.stringify(pageData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create page: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Sample page: Pricing page with all three slices
 */
const pricingPageData = {
  type: 'page',
  uid: 'pricing',
  lang: 'en-za',
  title: 'Pricing - CircleTel',
  data: {
    meta_title: 'CircleTel Pricing - Affordable Fibre & LTE Packages',
    meta_description: 'Compare CircleTel\'s affordable internet packages. Fast fibre and LTE connectivity for homes and businesses across South Africa.',
    slices: [
      // Hero Section
      {
        slice_type: 'hero_section',
        variation: 'default',
        slice_label: null,
        primary: {
          headline: [
            {
              type: 'heading1',
              text: 'Choose Your Perfect Plan',
              spans: [],
            },
          ],
          subheadline: [
            {
              type: 'paragraph',
              text: 'Fast, reliable internet connectivity for homes and businesses across South Africa.',
              spans: [],
            },
          ],
          cta_button_text: 'View Packages',
          cta_button_link: {
            link_type: 'Web',
            url: '#pricing',
          },
        },
      },
      // Feature Grid
      {
        slice_type: 'feature_grid',
        variation: 'default',
        slice_label: null,
        primary: {
          section_title: [
            {
              type: 'heading2',
              text: 'Why Choose CircleTel?',
              spans: [],
            },
          ],
          features: [
            {
              title: 'Lightning Fast Speeds',
              description: [
                {
                  type: 'paragraph',
                  text: 'Experience blazing-fast internet with speeds up to 1Gbps on fibre.',
                  spans: [],
                },
              ],
            },
            {
              title: 'No Throttling',
              description: [
                {
                  type: 'paragraph',
                  text: 'Unlimited data with no speed throttling during peak hours.',
                  spans: [],
                },
              ],
            },
            {
              title: '24/7 Support',
              description: [
                {
                  type: 'paragraph',
                  text: 'Round-the-clock customer support to keep you connected.',
                  spans: [],
                },
              ],
            },
            {
              title: 'Free Installation',
              description: [
                {
                  type: 'paragraph',
                  text: 'Professional installation included with all packages.',
                  spans: [],
                },
              ],
            },
          ],
        },
      },
      // Pricing Table
      {
        slice_type: 'pricing_table',
        variation: 'default',
        slice_label: null,
        primary: {
          title: [
            {
              type: 'heading2',
              text: 'Our Packages',
              spans: [],
            },
          ],
          subtitle: [
            {
              type: 'paragraph',
              text: 'Flexible pricing for individuals and businesses. All plans include 24/7 support.',
              spans: [],
            },
          ],
        },
        items: [
          {
            tier_name: 'Starter',
            price: 'R499/month',
            description: 'Perfect for small businesses getting started',
            features: [
              {
                type: 'list-item',
                text: '50GB Data per month',
                spans: [],
              },
              {
                type: 'list-item',
                text: '10Mbps download speed',
                spans: [],
              },
              {
                type: 'list-item',
                text: 'Free installation',
                spans: [],
              },
              {
                type: 'list-item',
                text: '24/7 customer support',
                spans: [],
              },
            ],
            cta_button_text: 'Get Started',
            cta_button_link: {
              link_type: 'Web',
              url: '/order',
            },
            is_featured: false,
          },
          {
            tier_name: 'Business',
            price: 'R999/month',
            description: 'Most popular for growing businesses',
            features: [
              {
                type: 'list-item',
                text: 'Unlimited Data',
                spans: [],
              },
              {
                type: 'list-item',
                text: '50Mbps download speed',
                spans: [],
              },
              {
                type: 'list-item',
                text: 'Free installation',
                spans: [],
              },
              {
                type: 'list-item',
                text: 'Priority 24/7 support',
                spans: [],
              },
              {
                type: 'list-item',
                text: 'Static IP address',
                spans: [],
              },
              {
                type: 'list-item',
                text: 'Free router upgrade',
                spans: [],
              },
            ],
            cta_button_text: 'Start Free Trial',
            cta_button_link: {
              link_type: 'Web',
              url: '/order',
            },
            is_featured: true,
          },
          {
            tier_name: 'Enterprise',
            price: 'R1,999/month',
            description: 'Advanced features for large organizations',
            features: [
              {
                type: 'list-item',
                text: 'Unlimited Data',
                spans: [],
              },
              {
                type: 'list-item',
                text: '100Mbps+ download speed',
                spans: [],
              },
              {
                type: 'list-item',
                text: 'Free installation & setup',
                spans: [],
              },
              {
                type: 'list-item',
                text: 'Dedicated account manager',
                spans: [],
              },
              {
                type: 'list-item',
                text: 'Multiple static IPs',
                spans: [],
              },
              {
                type: 'list-item',
                text: 'Premium router & backup',
                spans: [],
              },
              {
                type: 'list-item',
                text: 'SLA guarantee',
                spans: [],
              },
            ],
            cta_button_text: 'Contact Sales',
            cta_button_link: {
              link_type: 'Web',
              url: '/contact',
            },
            is_featured: false,
          },
        ],
      },
    ],
  },
};

/**
 * Sample page: Home page with hero and features
 */
const homePageData = {
  type: 'page',
  uid: 'home-prismic',
  lang: 'en-za',
  title: 'Welcome to CircleTel',
  data: {
    meta_title: 'CircleTel - Fast & Affordable Internet in South Africa',
    meta_description: 'South Africa\'s leading ISP providing fast, reliable fibre and LTE internet connectivity.',
    slices: [
      {
        slice_type: 'hero_section',
        variation: 'default',
        slice_label: null,
        primary: {
          headline: [
            {
              type: 'heading1',
              text: 'Fast Internet, Delivered',
              spans: [],
            },
          ],
          subheadline: [
            {
              type: 'paragraph',
              text: 'Experience lightning-fast connectivity with CircleTel. Fibre and LTE packages available nationwide.',
              spans: [],
            },
          ],
          cta_button_text: 'Check Coverage',
          cta_button_link: {
            link_type: 'Web',
            url: '/packages',
          },
        },
      },
      {
        slice_type: 'feature_grid',
        variation: 'default',
        slice_label: null,
        primary: {
          section_title: [
            {
              type: 'heading2',
              text: 'What We Offer',
              spans: [],
            },
          ],
          features: [
            {
              title: 'Fibre to the Home',
              description: [
                {
                  type: 'paragraph',
                  text: 'Ultra-fast fibre connectivity with speeds up to 1Gbps.',
                  spans: [],
                },
              ],
            },
            {
              title: 'LTE & 5G',
              description: [
                {
                  type: 'paragraph',
                  text: 'Mobile internet solutions for areas without fibre.',
                  spans: [],
                },
              ],
            },
            {
              title: 'Business Solutions',
              description: [
                {
                  type: 'paragraph',
                  text: 'Dedicated support and SLAs for enterprise clients.',
                  spans: [],
                },
              ],
            },
          ],
        },
      },
    ],
  },
};

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Creating Prismic pages...\n');

  try {
    // Create pricing page
    console.log('📄 Creating pricing page...');
    const pricingResult = await createPage(pricingPageData);
    console.log('✅ Pricing page created successfully!');
    console.log(`   ID: ${pricingResult.id}`);
    console.log(`   URL: https://www.circletel.co.za/pricing\n`);

    // Create home page
    console.log('📄 Creating home page...');
    const homeResult = await createPage(homePageData);
    console.log('✅ Home page created successfully!');
    console.log(`   ID: ${homeResult.id}`);
    console.log(`   URL: https://www.circletel.co.za/home-prismic\n`);

    console.log('✨ All pages created! Go to your Prismic dashboard to publish them.');
    console.log(`   Dashboard: https://circletel.prismic.io/documents`);
  } catch (error) {
    console.error('❌ Error creating pages:', error.message);
    process.exit(1);
  }
}

main();
