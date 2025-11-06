// Using native fetch in Node.js 18+
const fetch = globalThis.fetch || require('node-fetch');
const { createClient } = require('@sanity/client');

// Strapi configuration
const STRAPI_URL = 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || '';

// Sanity configuration
const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '7iqq2t7l',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN || 'skkCZK50Ud2KKc31wZpVtGA9nK0WAAtFX0ldf4pxIpUKXK1AqJKtlGh7yOn5DYxs94UxYNX450ZWdYMHonXmK4lGMjSBqq863BXAJvr4WHOAlnqmgtMyY1QiHRnzbpfgTbaoRlP8IBYQNQtCfTnBEqeieI78BKHbEmYN4Ujn4nVyLhzd9FhF',
  useCdn: false
});

// Helper function to fetch from Strapi
async function fetchFromStrapi(endpoint) {
  const headers = {};
  if (STRAPI_API_TOKEN) {
    headers['Authorization'] = `Bearer ${STRAPI_API_TOKEN}`;
  }
  
  try {
    const response = await fetch(`${STRAPI_URL}/api/${endpoint}?populate=*`, { headers });
    if (!response.ok) {
      console.log(`Note: ${endpoint} returned ${response.status} - may not have content`);
      return null;
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.log(`Note: Could not fetch ${endpoint} - ${error.message}`);
    return null;
  }
}

// Convert Strapi rich text to Sanity portable text
function convertToPortableText(text) {
  if (!text) return [];
  
  // Simple conversion - for production you'd want a proper markdown/HTML to portable text converter
  const lines = text.split('\n').filter(line => line.trim());
  return lines.map(line => ({
    _type: 'block',
    children: [
      {
        _type: 'span',
        text: line
      }
    ]
  }));
}

// Migrate Marketing Pages to Sanity Pages
async function migratePages() {
  console.log('\n📄 Migrating Marketing Pages...');
  
  const pages = await fetchFromStrapi('marketing-pages');
  if (!pages || pages.length === 0) {
    console.log('No marketing pages found in Strapi');
    return;
  }
  
  for (const page of pages) {
    const attrs = page.attributes || page;
    
    const sanityPage = {
      _type: 'page',
      title: attrs.title || attrs.pageName || 'Untitled Page',
      slug: {
        _type: 'slug',
        current: attrs.slug || attrs.pageSlug || `page-${page.id}`
      },
      excerpt: attrs.excerpt || attrs.metaDescription || '',
      content: convertToPortableText(attrs.content || attrs.body || ''),
      seo: {
        title: attrs.metaTitle || attrs.seoTitle || attrs.title,
        description: attrs.metaDescription || attrs.seoDescription || '',
        keywords: attrs.keywords ? attrs.keywords.split(',').map(k => k.trim()) : []
      }
    };
    
    try {
      const result = await sanityClient.create(sanityPage);
      console.log(`✅ Migrated page: ${sanityPage.title} (${result._id})`);
    } catch (error) {
      console.error(`❌ Failed to migrate page ${sanityPage.title}:`, error.message);
    }
  }
}

// Migrate Promotions to Sanity Products
async function migratePromotions() {
  console.log('\n📦 Migrating Promotions to Products...');
  
  const promotions = await fetchFromStrapi('promotions');
  if (!promotions || promotions.length === 0) {
    console.log('No promotions found in Strapi');
    return;
  }
  
  for (const promo of promotions) {
    const attrs = promo.attributes || promo;
    
    const sanityProduct = {
      _type: 'product',
      name: attrs.title || attrs.name || 'Untitled Product',
      slug: {
        _type: 'slug',
        current: attrs.slug || `product-${promo.id}`
      },
      description: convertToPortableText(attrs.description || ''),
      price: parseFloat(attrs.discountedPrice || attrs.price || 0),
      setupFee: parseFloat(attrs.setupFee || 0),
      features: attrs.features ? attrs.features.map((f, i) => ({
        _key: `feature${i}`,
        feature: typeof f === 'string' ? f : f.name || f.feature || '',
        included: true
      })) : [],
      specifications: {
        speed: attrs.speed || '',
        dataLimit: attrs.dataLimit || '',
        technology: attrs.technology || '',
        coverage: attrs.coverage || 'South Africa'
      },
      isActive: attrs.isActive !== false,
      isFeatured: attrs.featured || false
    };
    
    try {
      const result = await sanityClient.create(sanityProduct);
      console.log(`✅ Migrated product: ${sanityProduct.name} (${result._id})`);
    } catch (error) {
      console.error(`❌ Failed to migrate product ${sanityProduct.name}:`, error.message);
    }
  }
}

// Migrate Campaigns to Sanity Blog Posts
async function migrateCampaigns() {
  console.log('\n📝 Migrating Campaigns to Blog Posts...');
  
  const campaigns = await fetchFromStrapi('campaigns');
  if (!campaigns || campaigns.length === 0) {
    console.log('No campaigns found in Strapi');
    return;
  }
  
  // First create a default author
  const defaultAuthor = await sanityClient.create({
    _type: 'author',
    name: 'CircleTel Team',
    slug: {
      _type: 'slug',
      current: 'circletel-team'
    },
    bio: 'The CircleTel marketing and communications team.',
    email: 'marketing@circletel.co.za'
  }).catch(err => {
    console.log('Default author may already exist');
    return { _id: 'circletel-team' };
  });
  
  for (const campaign of campaigns) {
    const attrs = campaign.attributes || campaign;
    
    const sanityPost = {
      _type: 'post',
      title: attrs.name || attrs.title || 'Untitled Campaign',
      slug: {
        _type: 'slug',
        current: attrs.slug || `campaign-${campaign.id}`
      },
      excerpt: attrs.description || attrs.excerpt || '',
      content: convertToPortableText(attrs.content || attrs.description || ''),
      author: {
        _type: 'reference',
        _ref: defaultAuthor._id
      },
      publishedAt: attrs.startDate || attrs.createdAt || new Date().toISOString(),
      isPublished: attrs.status === 'active' || attrs.status === 'completed',
      seo: {
        title: attrs.name || attrs.title,
        description: attrs.description || '',
        keywords: attrs.tags ? attrs.tags.split(',').map(t => t.trim()) : []
      }
    };
    
    try {
      const result = await sanityClient.create(sanityPost);
      console.log(`✅ Migrated campaign as blog post: ${sanityPost.title} (${result._id})`);
    } catch (error) {
      console.error(`❌ Failed to migrate campaign ${sanityPost.title}:`, error.message);
    }
  }
}

// Check for existing content types that might be specific to CircleTel
async function migrateCloudHosting() {
  console.log('\n☁️ Checking for Cloud Hosting content...');
  
  const cloudHosting = await fetchFromStrapi('cloud-hosting-page');
  if (!cloudHosting) {
    console.log('No cloud hosting page found in Strapi');
    return;
  }
  
  const attrs = cloudHosting.attributes || cloudHosting;
  
  // Create as a special page
  const sanityPage = {
    _type: 'page',
    title: 'Cloud Hosting Solutions',
    slug: {
      _type: 'slug',
      current: 'cloud-hosting'
    },
    excerpt: 'Enterprise cloud hosting solutions for South African businesses',
    content: convertToPortableText(attrs.content || ''),
    seo: {
      title: 'Cloud Hosting Solutions | CircleTel',
      description: 'Reliable cloud hosting services with local data centers in South Africa',
      keywords: ['cloud hosting', 'VPS', 'dedicated servers', 'South Africa', 'CircleTel']
    }
  };
  
  try {
    const result = await sanityClient.create(sanityPage);
    console.log(`✅ Migrated cloud hosting page (${result._id})`);
  } catch (error) {
    console.error(`❌ Failed to migrate cloud hosting page:`, error.message);
  }
}

// Create sample categories
async function createCategories() {
  console.log('\n🏷️ Creating Categories...');
  
  const categories = [
    {
      title: 'Fibre Internet',
      slug: 'fibre-internet',
      description: 'High-speed fibre internet packages',
      color: '#F5831F'
    },
    {
      title: 'Wireless Solutions',
      slug: 'wireless-solutions',
      description: 'LTE and 5G wireless connectivity',
      color: '#1E4B85'
    },
    {
      title: 'Business Solutions',
      slug: 'business-solutions',
      description: 'Enterprise and SMME packages',
      color: '#10B981'
    },
    {
      title: 'Cloud Services',
      slug: 'cloud-services',
      description: 'Cloud hosting and VPS solutions',
      color: '#8B5CF6'
    }
  ];
  
  for (const category of categories) {
    try {
      const result = await sanityClient.create({
        _type: 'category',
        title: category.title,
        slug: {
          _type: 'slug',
          current: category.slug
        },
        description: category.description,
        color: category.color
      });
      console.log(`✅ Created category: ${category.title} (${result._id})`);
    } catch (error) {
      console.error(`❌ Failed to create category ${category.title}:`, error.message);
    }
  }
}

// Main migration function
async function migrate() {
  console.log('🚀 Starting Strapi to Sanity Migration');
  console.log('=====================================\n');
  
  try {
    // Check Strapi connection (try /api endpoint)
    const strapiHealth = await fetch(`${STRAPI_URL}/api`);
    // Strapi may return 404 for /api if no content, that's OK
    if (strapiHealth.status === 500 || strapiHealth.status === 502) {
      throw new Error('Strapi is not responding. Make sure it\'s running on port 1337');
    }
    console.log('✅ Connected to Strapi (checking for content...)\n');
    
    // Check Sanity connection
    const testDoc = await sanityClient.fetch('*[_type == "page"][0]');
    console.log('✅ Connected to Sanity\n');
    
    // Run migrations
    await createCategories();
    await migratePages();
    await migratePromotions();
    await migrateCampaigns();
    await migrateCloudHosting();
    
    console.log('\n=====================================');
    console.log('✅ Migration Complete!');
    console.log('\nNext steps:');
    console.log('1. Check your Sanity Studio at http://localhost:3333');
    console.log('2. Review the migrated content');
    console.log('3. Add images and additional content as needed');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure Strapi is running: cd strapi-cms && pnpm run develop');
    console.error('2. Make sure Sanity credentials are correct in .env.local');
    console.error('3. Check if you have accepted the Sanity Studio invitation');
  }
}

// Run the migration
migrate();