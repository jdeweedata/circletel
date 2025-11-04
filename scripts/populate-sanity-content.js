const { createClient } = require('@sanity/client');

// Sanity configuration
const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '7iqq2t7l',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN || 'skkCZK50Ud2KKc31wZpVtGA9nK0WAAtFX0ldf4pxIpUKXK1AqJKtlGh7yOn5DYxs94UxYNX450ZWdYMHonXmK4lGMjSBqq863BXAJvr4WHOAlnqmgtMyY1QiHRnzbpfgTbaoRlP8IBYQNQtCfTnBEqeieI78BKHbEmYN4Ujn4nVyLhzd9FhF',
  useCdn: false
});

async function populateContent() {
  console.log('🚀 Populating Sanity with CircleTel Sample Content');
  console.log('================================================\n');

  try {
    // Get categories that were created
    const categories = await sanityClient.fetch('*[_type == "category"]');
    console.log(`Found ${categories.length} categories\n`);

    // Create an author
    console.log('👥 Creating Authors...');
    const author = await sanityClient.create({
      _type: 'author',
      name: 'Jeffrey De Wee',
      slug: {
        _type: 'slug',
        current: 'jeffrey-de-wee'
      },
      bio: 'CEO and Founder of CircleTel, passionate about bringing reliable connectivity to South Africa.',
      email: 'jeffrey.de.wee@circletel.co.za',
      social: {
        linkedin: 'https://linkedin.com/in/jeffreydewee'
      }
    });
    console.log(`✅ Created author: ${author.name}\n`);

    // Create Pages
    console.log('📄 Creating Pages...');
    
    const pages = [
      {
        title: 'Cloud Hosting Solutions',
        slug: 'cloud-hosting',
        excerpt: 'Enterprise-grade cloud hosting with local data centers in South Africa',
        content: [
          {
            _type: 'block',
            children: [
              {
                _type: 'span',
                text: 'CircleTel offers premium cloud hosting solutions designed for South African businesses.',
                marks: ['strong']
              }
            ]
          },
          {
            _type: 'block',
            children: [
              {
                _type: 'span',
                text: 'Our cloud infrastructure features:'
              }
            ]
          },
          {
            _type: 'block',
            children: [
              {
                _type: 'span',
                text: '• Local data centers in Johannesburg and Cape Town'
              }
            ]
          },
          {
            _type: 'block',
            children: [
              {
                _type: 'span',
                text: '• 99.9% uptime guarantee with redundant connectivity'
              }
            ]
          },
          {
            _type: 'block',
            children: [
              {
                _type: 'span',
                text: '• 24/7 local support from our technical team'
              }
            ]
          }
        ],
        seo: {
          title: 'Cloud Hosting Solutions | CircleTel South Africa',
          description: 'Enterprise cloud hosting with local data centers, 99.9% uptime, and 24/7 support. Perfect for South African businesses.',
          keywords: ['cloud hosting', 'VPS', 'South Africa', 'data centers', 'business hosting']
        }
      },
      {
        title: 'About CircleTel',
        slug: 'about-us',
        excerpt: 'Leading ISP providing innovative connectivity solutions across South Africa',
        content: [
          {
            _type: 'block',
            children: [
              {
                _type: 'span',
                text: 'CircleTel is South Africa\'s fastest-growing ISP, dedicated to providing reliable and affordable connectivity solutions.'
              }
            ]
          },
          {
            _type: 'block',
            children: [
              {
                _type: 'span',
                text: 'Founded in 2020, we\'ve grown to serve over 50,000 customers across the country with fiber, wireless, and cloud services.'
              }
            ]
          }
        ],
        seo: {
          title: 'About CircleTel | Leading South African ISP',
          description: 'Learn about CircleTel, South Africa\'s innovative ISP providing fiber, wireless, and cloud solutions.',
          keywords: ['CircleTel', 'ISP', 'South Africa', 'internet provider', 'about us']
        }
      }
    ];

    for (const page of pages) {
      const result = await sanityClient.create({ _type: 'page', ...page });
      console.log(`✅ Created page: ${page.title}`);
    }

    // Create Products
    console.log('\n📦 Creating Products...');
    
    const fibreCategory = categories.find(c => c.slug.current === 'fibre-internet');
    const wirelessCategory = categories.find(c => c.slug.current === 'wireless-solutions');
    const cloudCategory = categories.find(c => c.slug.current === 'cloud-services');

    const products = [
      {
        name: 'Home Fibre 100Mbps',
        slug: { _type: 'slug', current: 'home-fibre-100' },
        description: [
          {
            _type: 'block',
            children: [
              { _type: 'span', text: 'Perfect fiber internet for streaming, gaming, and working from home.' }
            ]
          }
        ],
        price: 799,
        setupFee: 0,
        category: fibreCategory ? { _type: 'reference', _ref: fibreCategory._id } : null,
        features: [
          { _key: 'f1', feature: '100Mbps download speed', included: true },
          { _key: 'f2', feature: '50Mbps upload speed', included: true },
          { _key: 'f3', feature: 'Unlimited data', included: true },
          { _key: 'f4', feature: 'Free router included', included: true },
          { _key: 'f5', feature: '24/7 support', included: true }
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
        name: 'Business Fibre 500Mbps',
        slug: { _type: 'slug', current: 'business-fibre-500' },
        description: [
          {
            _type: 'block',
            children: [
              { _type: 'span', text: 'Enterprise-grade fiber with SLA and priority support.' }
            ]
          }
        ],
        price: 2999,
        setupFee: 1500,
        category: fibreCategory ? { _type: 'reference', _ref: fibreCategory._id } : null,
        features: [
          { _key: 'f1', feature: '500Mbps symmetrical speed', included: true },
          { _key: 'f2', feature: '99.9% uptime SLA', included: true },
          { _key: 'f3', feature: 'Unlimited data', included: true },
          { _key: 'f4', feature: 'Static IP address', included: true },
          { _key: 'f5', feature: 'Priority business support', included: true }
        ],
        specifications: {
          speed: '500/500 Mbps',
          dataLimit: 'Unlimited',
          technology: 'Dedicated Fibre',
          coverage: 'Business districts nationwide'
        },
        isActive: true,
        isFeatured: true
      },
      {
        name: 'LTE Unlimited',
        slug: { _type: 'slug', current: 'lte-unlimited' },
        description: [
          {
            _type: 'block',
            children: [
              { _type: 'span', text: 'Wireless internet solution for areas without fiber coverage.' }
            ]
          }
        ],
        price: 599,
        setupFee: 999,
        category: wirelessCategory ? { _type: 'reference', _ref: wirelessCategory._id } : null,
        features: [
          { _key: 'f1', feature: 'Unlimited data', included: true },
          { _key: 'f2', feature: 'LTE router included', included: true },
          { _key: 'f3', feature: 'No installation required', included: true },
          { _key: 'f4', feature: 'Portable solution', included: true }
        ],
        specifications: {
          speed: 'Up to 50 Mbps',
          dataLimit: 'Unlimited (FUP applies)',
          technology: 'LTE/4G',
          coverage: '98% of South Africa'
        },
        isActive: true,
        isFeatured: false
      },
      {
        name: 'Cloud VPS Starter',
        slug: { _type: 'slug', current: 'cloud-vps-starter' },
        description: [
          {
            _type: 'block',
            children: [
              { _type: 'span', text: 'Entry-level VPS perfect for small applications and websites.' }
            ]
          }
        ],
        price: 299,
        setupFee: 0,
        category: cloudCategory ? { _type: 'reference', _ref: cloudCategory._id } : null,
        features: [
          { _key: 'f1', feature: '2 vCPU cores', included: true },
          { _key: 'f2', feature: '4GB RAM', included: true },
          { _key: 'f3', feature: '40GB SSD storage', included: true },
          { _key: 'f4', feature: '1TB bandwidth', included: true },
          { _key: 'f5', feature: 'Ubuntu/CentOS/Windows', included: true }
        ],
        specifications: {
          speed: '1Gbps port',
          dataLimit: '1TB/month',
          technology: 'KVM Virtualization',
          coverage: 'Johannesburg data center'
        },
        isActive: true,
        isFeatured: false
      }
    ];

    for (const product of products) {
      const result = await sanityClient.create({ _type: 'product', ...product });
      console.log(`✅ Created product: ${product.name}`);
    }

    // Create Blog Posts
    console.log('\n📝 Creating Blog Posts...');
    
    const posts = [
      {
        title: 'CircleTel Launches New 1Gbps Fibre Packages',
        slug: { _type: 'slug', current: 'new-1gbps-fibre-launch' },
        excerpt: 'Experience lightning-fast internet with our new gigabit fiber packages now available in major cities.',
        content: [
          {
            _type: 'block',
            children: [
              {
                _type: 'span',
                text: 'We are excited to announce the launch of our new 1Gbps fiber packages!',
                marks: ['strong']
              }
            ]
          },
          {
            _type: 'block',
            children: [
              {
                _type: 'span',
                text: 'Starting from just R1,299 per month, businesses and power users can now enjoy gigabit speeds with our premium fiber network.'
              }
            ]
          },
          {
            _type: 'block',
            children: [
              {
                _type: 'span',
                text: 'The new packages include:'
              }
            ]
          },
          {
            _type: 'block',
            children: [
              {
                _type: 'span',
                text: '• 1000/500 Mbps for home users at R1,299/month'
              }
            ]
          },
          {
            _type: 'block',
            children: [
              {
                _type: 'span',
                text: '• 1000/1000 Mbps symmetrical for businesses at R2,999/month'
              }
            ]
          }
        ],
        author: { _type: 'reference', _ref: author._id },
        publishedAt: new Date().toISOString(),
        isPublished: true,
        seo: {
          title: 'New 1Gbps Fibre Packages | CircleTel News',
          description: 'CircleTel launches gigabit fiber packages starting from R1,299. Experience the fastest internet in South Africa.',
          keywords: ['1gbps', 'gigabit fiber', 'fast internet', 'CircleTel news']
        }
      },
      {
        title: '5 Tips for Choosing the Right Internet Package',
        slug: { _type: 'slug', current: 'choosing-right-internet-package' },
        excerpt: 'Not sure which internet package is right for you? Our guide helps you make the best choice.',
        content: [
          {
            _type: 'block',
            children: [
              {
                _type: 'span',
                text: 'Choosing the right internet package can be overwhelming. Here are our top tips:'
              }
            ]
          },
          {
            _type: 'block',
            children: [
              {
                _type: 'span',
                text: '1. Assess your usage: Streaming needs 25Mbps+, gaming needs low latency'
              }
            ]
          },
          {
            _type: 'block',
            children: [
              {
                _type: 'span',
                text: '2. Count your devices: More devices need more bandwidth'
              }
            ]
          },
          {
            _type: 'block',
            children: [
              {
                _type: 'span',
                text: '3. Check coverage: Fiber is best, but LTE works everywhere'
              }
            ]
          },
          {
            _type: 'block',
            children: [
              {
                _type: 'span',
                text: '4. Consider your budget: Balance speed with affordability'
              }
            ]
          },
          {
            _type: 'block',
            children: [
              {
                _type: 'span',
                text: '5. Think about the future: Choose a package you can grow into'
              }
            ]
          }
        ],
        author: { _type: 'reference', _ref: author._id },
        publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        isPublished: true,
        seo: {
          title: 'How to Choose Internet Package | CircleTel Guide',
          description: 'Expert tips for selecting the perfect internet package for your needs. Compare fiber, LTE, and business options.',
          keywords: ['internet guide', 'choosing internet', 'fiber vs lte', 'internet tips']
        }
      }
    ];

    for (const post of posts) {
      const result = await sanityClient.create({ _type: 'post', ...post });
      console.log(`✅ Created blog post: ${post.title}`);
    }

    console.log('\n================================================');
    console.log('✅ Content Population Complete!');
    console.log('\nCreated:');
    console.log('- 1 Author');
    console.log('- 2 Pages');
    console.log('- 4 Products');
    console.log('- 2 Blog Posts');
    console.log('- 4 Categories (previously created)');
    console.log('\n🎉 Your Sanity CMS now has sample CircleTel content!');
    console.log('Visit http://localhost:3333 to view and edit content');
    
  } catch (error) {
    console.error('\n❌ Population failed:', error.message);
    console.error('\nMake sure:');
    console.error('1. Sanity Studio is accessible');
    console.error('2. You have accepted the invitation email');
    console.error('3. API credentials are correct');
  }
}

// Run the population
populateContent();