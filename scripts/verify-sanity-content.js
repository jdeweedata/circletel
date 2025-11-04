const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: '7iqq2t7l',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: 'skkCZK50Ud2KKc31wZpVtGA9nK0WAAtFX0ldf4pxIpUKXK1AqJKtlGh7yOn5DYxs94UxYNX450ZWdYMHonXmK4lGMjSBqq863BXAJvr4WHOAlnqmgtMyY1QiHRnzbpfgTbaoRlP8IBYQNQtCfTnBEqeieI78BKHbEmYN4Ujn4nVyLhzd9FhF',
  useCdn: false
});

async function verifyContent() {
  try {
    console.log('🔍 Verifying Sanity Content...\n');
    
    const [authors, pages, products, posts, categories] = await Promise.all([
      client.fetch('*[_type == "author"]'),
      client.fetch('*[_type == "page"]'),
      client.fetch('*[_type == "product"]'),
      client.fetch('*[_type == "post"]'),
      client.fetch('*[_type == "category"]')
    ]);
    
    console.log('📊 Content Summary:');
    console.log(`📝 Authors: ${authors.length}`);
    console.log(`📄 Pages: ${pages.length}`);
    console.log(`📦 Products: ${products.length}`);
    console.log(`✍️ Blog Posts: ${posts.length}`);
    console.log(`🏷️ Categories: ${categories.length}\n`);
    
    // Show sample content
    if (authors.length > 0) {
      console.log('👤 Sample Author:', authors[0].name);
    }
    
    if (products.length > 0) {
      console.log('📦 Sample Product:', products[0].name, `- R${products[0].price}/month`);
    }
    
    if (pages.length > 0) {
      console.log('📄 Sample Page:', pages[0].title);
    }
    
    console.log('\n✅ Content verification complete!');
    console.log('🎯 Access Sanity Studio at: http://localhost:3333');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyContent();