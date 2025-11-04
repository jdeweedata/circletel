const { createClient } = require('@sanity/client');
const crypto = require('crypto');

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '7iqq2t7l',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN || 'skkCZK50Ud2KKc31wZpVtGA9nK0WAAtFX0ldf4pxIpUKXK1AqJKtlGh7yOn5DYxs94UxYNX450ZWdYMHonXmK4lGMjSBqq863BXAJvr4WHOAlnqmgtMyY1QiHRnzbpfgTbaoRlP8IBYQNQtCfTnBEqeieI78BKHbEmYN4Ujn4nVyLhzd9FhF',
  useCdn: false
});

// Helper to generate unique keys
function generateKey() {
  return crypto.randomBytes(8).toString('hex');
}

// Helper to create proper portable text blocks
function createPortableTextBlock(text, marks = []) {
  return {
    _type: 'block',
    _key: generateKey(),
    style: 'normal',
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: generateKey(),
        text: text,
        marks: marks
      }
    ]
  };
}

async function fixProducts() {
  console.log('🔧 Fixing all product content structure...\n');

  try {
    // Get all existing products
    const existingProducts = await sanityClient.fetch('*[_type == "product"]');
    console.log(`Found ${existingProducts.length} products to fix\n`);

    // Get categories for reference
    const categories = await sanityClient.fetch('*[_type == "category"]');
    const fibreCategory = categories.find(c => c.slug.current === 'fibre-internet');
    const wirelessCategory = categories.find(c => c.slug.current === 'wireless-solutions');
    const cloudCategory = categories.find(c => c.slug.current === 'cloud-services');

    // Delete existing products and recreate with proper structure
    for (const product of existingProducts) {
      await sanityClient.delete(product._id);
      console.log(`🗑️ Deleted existing product: ${product.name}`);
    }

    // Create properly structured products
    const products = [
      {
        _type: 'product',
        name: 'Home Fibre 100Mbps',
        slug: {
          _type: 'slug',
          current: 'home-fibre-100mbps'
        },
        description: [
          createPortableTextBlock('Perfect fiber internet solution for streaming, gaming, and working from home.'),
          createPortableTextBlock('Experience lightning-fast downloads and smooth video calls with our reliable 100Mbps connection.')
        ],
        price: 799,
        setupFee: 0,
        category: fibreCategory ? { _type: 'reference', _ref: fibreCategory._id } : null,
        features: [
          { _key: generateKey(), feature: '100Mbps download speed', included: true },
          { _key: generateKey(), feature: '50Mbps upload speed', included: true },
          { _key: generateKey(), feature: 'Unlimited data usage', included: true },
          { _key: generateKey(), feature: 'Free router included', included: true },
          { _key: generateKey(), feature: '24/7 technical support', included: true }
        ],
        specifications: {
          speed: '100/50 Mbps',
          dataLimit: 'Unlimited',
          technology: 'Fibre to the Home (FTTH)',
          coverage: 'Major cities in South Africa'
        },
        isActive: true,
        isFeatured: true
      },
      {
        _type: 'product',
        name: 'Business Fibre 500Mbps',
        slug: {
          _type: 'slug',
          current: 'business-fibre-500mbps'
        },
        description: [
          createPortableTextBlock('Enterprise-grade fiber connection with SLA guarantees and priority support.'),
          createPortableTextBlock('Designed for businesses that require reliable, high-speed connectivity for critical operations.')
        ],
        price: 2999,
        setupFee: 1500,
        category: fibreCategory ? { _type: 'reference', _ref: fibreCategory._id } : null,
        features: [
          { _key: generateKey(), feature: '500Mbps symmetrical speed', included: true },
          { _key: generateKey(), feature: '99.9% uptime SLA guarantee', included: true },
          { _key: generateKey(), feature: 'Unlimited data usage', included: true },
          { _key: generateKey(), feature: 'Static IP address included', included: true },
          { _key: generateKey(), feature: 'Priority business support', included: true },
          { _key: generateKey(), feature: 'Dedicated account manager', included: true }
        ],
        specifications: {
          speed: '500/500 Mbps',
          dataLimit: 'Unlimited',
          technology: 'Dedicated Fibre Connection',
          coverage: 'Business districts nationwide'
        },
        isActive: true,
        isFeatured: true
      },
      {
        _type: 'product',
        name: 'LTE Unlimited',
        slug: {
          _type: 'slug',
          current: 'lte-unlimited'
        },
        description: [
          createPortableTextBlock('Wireless internet solution perfect for areas without fiber coverage.'),
          createPortableTextBlock('Get connected anywhere in South Africa with our reliable LTE network and unlimited data.')
        ],
        price: 599,
        setupFee: 999,
        category: wirelessCategory ? { _type: 'reference', _ref: wirelessCategory._id } : null,
        features: [
          { _key: generateKey(), feature: 'Unlimited data (FUP applies)', included: true },
          { _key: generateKey(), feature: 'LTE router included', included: true },
          { _key: generateKey(), feature: 'No installation required', included: true },
          { _key: generateKey(), feature: 'Portable solution', included: true },
          { _key: generateKey(), feature: '98% SA coverage', included: true }
        ],
        specifications: {
          speed: 'Up to 50 Mbps',
          dataLimit: 'Unlimited (Fair Usage Policy)',
          technology: 'LTE/4G Wireless',
          coverage: '98% of South Africa'
        },
        isActive: true,
        isFeatured: false
      },
      {
        _type: 'product',
        name: 'Cloud VPS Starter',
        slug: {
          _type: 'slug',
          current: 'cloud-vps-starter'
        },
        description: [
          createPortableTextBlock('Entry-level VPS perfect for small applications, websites, and development projects.'),
          createPortableTextBlock('Hosted in our Johannesburg data center with 1Gbps connectivity and enterprise-grade security.')
        ],
        price: 299,
        setupFee: 0,
        category: cloudCategory ? { _type: 'reference', _ref: cloudCategory._id } : null,
        features: [
          { _key: generateKey(), feature: '2 vCPU cores', included: true },
          { _key: generateKey(), feature: '4GB RAM', included: true },
          { _key: generateKey(), feature: '40GB SSD storage', included: true },
          { _key: generateKey(), feature: '1TB monthly bandwidth', included: true },
          { _key: generateKey(), feature: 'Ubuntu/CentOS/Windows OS', included: true },
          { _key: generateKey(), feature: 'Root/Administrator access', included: true }
        ],
        specifications: {
          speed: '1Gbps network port',
          dataLimit: '1TB per month',
          technology: 'KVM Virtualization',
          coverage: 'Johannesburg data center'
        },
        isActive: true,
        isFeatured: false
      }
    ];

    // Create each product
    for (const product of products) {
      const result = await sanityClient.create(product);
      console.log(`✅ Created fixed product: ${product.name} (${result._id})`);
    }

    console.log('\n✅ All products fixed successfully!');
    console.log('🎯 Products should now validate properly in Sanity Studio');
    console.log('📍 Visit http://localhost:3333 to verify the fixes');

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    console.error(error);
  }
}

fixProducts();