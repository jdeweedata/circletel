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

async function fixContent() {
  console.log('🔧 Fixing Sanity content structure...\n');

  try {
    // Delete existing pages with issues
    const existingPages = await sanityClient.fetch('*[_type == "page"]');
    for (const page of existingPages) {
      await sanityClient.delete(page._id);
      console.log(`🗑️ Deleted existing page: ${page.title}`);
    }

    // Create properly formatted pages
    const pages = [
      {
        _type: 'page',
        title: 'Cloud Hosting Solutions',
        slug: {
          _type: 'slug',
          current: 'cloud-hosting-solutions'
        },
        excerpt: 'Enterprise-grade cloud hosting with local data centers in South Africa',
        content: [
          createPortableTextBlock('CircleTel offers premium cloud hosting solutions designed for South African businesses.', ['strong']),
          createPortableTextBlock('Our cloud infrastructure features:'),
          createPortableTextBlock('• Local data centers in Johannesburg and Cape Town'),
          createPortableTextBlock('• 99.9% uptime guarantee with redundant connectivity'),
          createPortableTextBlock('• 24/7 local support from our technical team'),
          createPortableTextBlock('• Enterprise-grade security and compliance'),
          createPortableTextBlock('• Scalable resources to grow with your business')
        ],
        seo: {
          title: 'Cloud Hosting Solutions | CircleTel South Africa',
          description: 'Enterprise cloud hosting with local data centers, 99.9% uptime, and 24/7 support. Perfect for South African businesses.',
          keywords: ['cloud hosting', 'VPS', 'South Africa', 'data centers', 'business hosting']
        }
      },
      {
        _type: 'page',
        title: 'About CircleTel',
        slug: {
          _type: 'slug',
          current: 'about-circletel'
        },
        excerpt: 'Leading ISP providing innovative connectivity solutions across South Africa',
        content: [
          createPortableTextBlock('CircleTel is South Africa\'s fastest-growing ISP, dedicated to providing reliable and affordable connectivity solutions.'),
          createPortableTextBlock('Founded in 2020, we\'ve grown to serve over 50,000 customers across the country with fiber, wireless, and cloud services.'),
          createPortableTextBlock('Our mission is to bridge the digital divide by making high-speed internet accessible to all South Africans.'),
          createPortableTextBlock('We pride ourselves on:'),
          createPortableTextBlock('• Local customer support with real people'),
          createPortableTextBlock('• Transparent pricing with no hidden fees'),
          createPortableTextBlock('• Cutting-edge technology and infrastructure'),
          createPortableTextBlock('• Community-focused approach to connectivity')
        ],
        seo: {
          title: 'About CircleTel | Leading South African ISP',
          description: 'Learn about CircleTel, South Africa\'s innovative ISP providing fiber, wireless, and cloud solutions.',
          keywords: ['CircleTel', 'ISP', 'South Africa', 'internet provider', 'about us']
        }
      }
    ];

    for (const page of pages) {
      const result = await sanityClient.create(page);
      console.log(`✅ Created fixed page: ${page.title} (${result._id})`);
    }

    // Also fix any existing products with similar issues
    const existingProducts = await sanityClient.fetch('*[_type == "product"]');
    for (const product of existingProducts) {
      if (!product.slug || !product.slug.current) {
        // Fix slug structure
        const updatedProduct = {
          ...product,
          slug: {
            _type: 'slug',
            current: product.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
          }
        };
        
        // Fix description if it's not properly formatted
        if (product.description && Array.isArray(product.description)) {
          updatedProduct.description = product.description.map(block => ({
            ...block,
            _key: block._key || generateKey(),
            children: block.children ? block.children.map(child => ({
              ...child,
              _key: child._key || generateKey()
            })) : []
          }));
        }
        
        await sanityClient.createOrReplace(updatedProduct);
        console.log(`🔧 Fixed product: ${product.name}`);
      }
    }

    console.log('\n✅ Content structure fixed!');
    console.log('🎯 All documents should now validate properly in Sanity Studio');
    console.log('📍 Visit http://localhost:3333 to verify the fixes');

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    console.error(error);
  }
}

fixContent();