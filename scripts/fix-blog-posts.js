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

async function fixBlogPosts() {
  console.log('🔧 Fixing blog post content structure...\n');

  try {
    // Get existing blog posts and author
    const existingPosts = await sanityClient.fetch('*[_type == "post"]');
    const author = await sanityClient.fetch('*[_type == "author"][0]');
    
    console.log(`Found ${existingPosts.length} blog posts to fix\n`);

    // Delete existing posts
    for (const post of existingPosts) {
      await sanityClient.delete(post._id);
      console.log(`🗑️ Deleted existing post: ${post.title}`);
    }

    // Create properly structured blog posts
    const posts = [
      {
        _type: 'post',
        title: 'CircleTel Launches New 1Gbps Fibre Packages',
        slug: {
          _type: 'slug',
          current: 'new-1gbps-fibre-launch'
        },
        excerpt: 'Experience lightning-fast internet with our new gigabit fiber packages now available in major cities across South Africa.',
        content: [
          createPortableTextBlock('We are excited to announce the launch of our new 1Gbps fiber packages!', ['strong']),
          createPortableTextBlock('Starting from just R1,299 per month, businesses and power users can now enjoy gigabit speeds with our premium fiber network. This represents a significant milestone in South Africa\'s connectivity landscape.'),
          createPortableTextBlock('Our new gigabit packages include:', ['strong']),
          createPortableTextBlock('• 1000/500 Mbps for home users at R1,299/month'),
          createPortableTextBlock('• 1000/1000 Mbps symmetrical for businesses at R2,999/month'),
          createPortableTextBlock('• Priority support and guaranteed uptime SLA'),
          createPortableTextBlock('• Free installation for the first 1000 customers'),
          createPortableTextBlock('These packages are now available in Johannesburg, Cape Town, Durban, and Pretoria, with plans to expand to other major cities by the end of 2025.'),
          createPortableTextBlock('Contact our sales team today to upgrade your connection and experience the future of internet in South Africa.')
        ],
        author: author ? { _type: 'reference', _ref: author._id } : null,
        publishedAt: new Date().toISOString(),
        isPublished: true,
        seo: {
          title: 'New 1Gbps Fibre Packages | CircleTel News',
          description: 'CircleTel launches gigabit fiber packages starting from R1,299. Experience the fastest internet in South Africa.',
          keywords: ['1gbps', 'gigabit fiber', 'fast internet', 'CircleTel news', 'fiber launch']
        }
      },
      {
        _type: 'post',
        title: '5 Tips for Choosing the Right Internet Package',
        slug: {
          _type: 'slug',
          current: 'choosing-right-internet-package'
        },
        excerpt: 'Not sure which internet package is right for you? Our comprehensive guide helps you make the best choice for your needs and budget.',
        content: [
          createPortableTextBlock('Choosing the right internet package can be overwhelming with so many options available. Here are our top 5 tips to help you make the best decision:', ['strong']),
          createPortableTextBlock('1. Assess Your Usage Needs', ['strong']),
          createPortableTextBlock('Consider what you do online most often. Streaming 4K content needs 25Mbps+, online gaming requires low latency, and video conferencing works best with symmetrical speeds.'),
          createPortableTextBlock('2. Count Your Connected Devices', ['strong']),
          createPortableTextBlock('More devices mean more bandwidth required. A typical household with smartphones, laptops, smart TVs, and IoT devices should consider at least 100Mbps for smooth performance.'),
          createPortableTextBlock('3. Check Coverage in Your Area', ['strong']),
          createPortableTextBlock('Fiber is the gold standard for speed and reliability, but LTE can work well in areas without fiber coverage. Always verify what\'s available at your specific address.'),
          createPortableTextBlock('4. Balance Speed with Budget', ['strong']),
          createPortableTextBlock('Don\'t overpay for speed you won\'t use, but also don\'t go too low and frustrate yourself. Consider packages that offer room to grow as your needs change.'),
          createPortableTextBlock('5. Think About the Future', ['strong']),
          createPortableTextBlock('Choose a package you can grow into. Work-from-home trends, streaming quality improvements, and new devices all increase bandwidth needs over time.'),
          createPortableTextBlock('Need help choosing? Contact our team for a free consultation and personalized recommendations based on your specific requirements.')
        ],
        author: author ? { _type: 'reference', _ref: author._id } : null,
        publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        isPublished: true,
        seo: {
          title: 'How to Choose Internet Package | CircleTel Guide',
          description: 'Expert tips for selecting the perfect internet package for your needs. Compare fiber, LTE, and business options.',
          keywords: ['internet guide', 'choosing internet', 'fiber vs lte', 'internet tips', 'bandwidth guide']
        }
      }
    ];

    // Create each blog post
    for (const post of posts) {
      const result = await sanityClient.create(post);
      console.log(`✅ Created fixed blog post: ${post.title} (${result._id})`);
    }

    console.log('\n✅ All blog posts fixed successfully!');
    console.log('🎯 Blog posts should now validate properly in Sanity Studio');
    console.log('📍 Visit http://localhost:3333/structure/blogPosts to verify the fixes');

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    console.error(error);
  }
}

fixBlogPosts();