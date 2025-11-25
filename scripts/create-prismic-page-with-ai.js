/**
 * Create a Prismic page using Gemini AI for content generation
 * Usage: node scripts/create-prismic-page-with-ai.js service small-business
 */

// Load environment variables from .env.local (development) or .env (production)
require('dotenv').config({ path: '.env.local' });
require('dotenv').config(); // Fallback to .env if .env.local doesn't exist

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

const PRISMIC_REPOSITORY = process.env.PRISMIC_REPOSITORY_NAME || 'circletel';
const PRISMIC_WRITE_TOKEN = process.env.PRISMIC_WRITE_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MIGRATION_API_URL = 'https://migration.prismic.io';

if (!PRISMIC_WRITE_TOKEN) {
  console.error('❌ PRISMIC_WRITE_TOKEN not found in environment variables');
  process.exit(1);
}

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in environment variables');
  console.log('\n💡 Add to .env.local:');
  console.log('GEMINI_API_KEY=your_gemini_api_key_here\n');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Generate content using Gemini AI
 */
async function generateContentWithGemini(prompt, options = {}) {
  console.log('🤖 Generating content with Gemini 3 Pro (Advanced Reasoning)...');

  // Gemini 3 Pro with enhanced reasoning capabilities
  // Documentation: https://ai.google.dev/gemini-api/docs/gemini-3
  const model = genAI.getGenerativeModel({
    model: 'gemini-3-pro-preview',
    generationConfig: {
      // CRITICAL: Keep temperature at 1.0 for Gemini 3 (prevents looping/degraded performance)
      temperature: 1.0,
      // thinking_level: 'high' is default - maximizes reasoning depth for quality content
      // Can be set to 'low' for faster generation if needed via options.thinkingLevel
      ...(options.thinkingLevel && { thinking_level: options.thinkingLevel })
    }
  });

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  return text;
}

/**
 * Generate an image using Gemini 3 Pro Image Preview
 * Documentation: https://ai.google.dev/gemini-api/docs/image-generation
 */
async function generateImageWithGemini(prompt, options = {}) {
  console.log(`   🎨 Generating image: ${prompt.substring(0, 60)}...`);

  const imageModel = genAI.getGenerativeModel({
    model: 'gemini-3-pro-image-preview'
  });

  const imageConfig = {
    aspectRatio: options.aspectRatio || '16:9',
    imageSize: options.imageSize || '2K'  // '2K' or '4K'
  };

  const result = await imageModel.generateContent({
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 1.0,
      imageConfig: imageConfig
    }
  });

  const response = await result.response;

  // Extract image data from response
  const candidate = response.candidates?.[0];
  if (!candidate?.content?.parts) {
    console.log('   ⚠️  No image generated');
    return null;
  }

  // Find inline data (base64 image)
  for (const part of candidate.content.parts) {
    if (part.inlineData && part.inlineData.data) {
      console.log('   ✅ Image generated');
      return {
        data: part.inlineData.data,
        mimeType: part.inlineData.mimeType || 'image/png'
      };
    }
  }

  console.log('   ⚠️  No image data found');
  return null;
}

/**
 * Parse Gemini response into structured page data
 */
function parseGeminiResponse(text) {
  try {
    // Try to parse as JSON first
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }

    // If not JSON, try to parse the text directly
    return JSON.parse(text);
  } catch (error) {
    console.error('❌ Failed to parse Gemini response as JSON');
    console.log('Response:', text.substring(0, 500));
    throw error;
  }
}

/**
 * Create a page document in Prismic
 */
async function createPrismicPage(pageData) {
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
 * Generate a service page
 */
async function generateServicePage(businessType = 'small-business') {
  const prompt = `
You are a professional content writer for CircleTel, a South African ISP and IT services company.

Create a complete service page for ${businessType} businesses with the following structure.
Return ONLY valid JSON in this exact format (no additional text):

{
  "type": "service_page",
  "uid": "${businessType}-ai-generated",
  "lang": "en-za",
  "title": "Service Page Title",
  "data": {
    "meta_title": "SEO-optimized title (max 60 chars)",
    "meta_description": "SEO-optimized description (max 160 chars)",
    "slices": [
      {
        "slice_type": "hero_section",
        "variation": "default",
        "slice_label": null,
        "primary": {
          "headline": [{"type": "heading1", "text": "Compelling headline", "spans": []}],
          "subheadline": [{"type": "paragraph", "text": "Engaging subheadline", "spans": []}],
          "cta_button_text": "Get Started",
          "cta_button_link": {"link_type": "Web", "url": "/contact"}
        }
      },
      {
        "slice_type": "feature_grid",
        "variation": "default",
        "slice_label": null,
        "primary": {
          "section_title": [{"type": "heading2", "text": "Why Choose CircleTel?", "spans": []}],
          "features": [
            {
              "title": "Feature 1 Title",
              "description": [{"type": "paragraph", "text": "Feature description", "spans": []}]
            },
            {
              "title": "Feature 2 Title",
              "description": [{"type": "paragraph", "text": "Feature description", "spans": []}]
            },
            {
              "title": "Feature 3 Title",
              "description": [{"type": "paragraph", "text": "Feature description", "spans": []}]
            }
          ]
        }
      },
      {
        "slice_type": "recipe",
        "variation": "default",
        "slice_label": null,
        "primary": {
          "badge_text": "Most Popular",
          "badge_color": "blue",
          "title": "Basic IT Recipe",
          "description": [{"type": "paragraph", "text": "Description of the basic package", "spans": []}],
          "ingredients_title": "What's Included:",
          "ingredients": [
            {"type": "list-item", "text": "Service 1", "spans": []},
            {"type": "list-item", "text": "Service 2", "spans": []},
            {"type": "list-item", "text": "Service 3", "spans": []},
            {"type": "list-item", "text": "Service 4", "spans": []}
          ],
          "price": "R3,500/mo",
          "cta_text": "Get Started",
          "cta_link": {"link_type": "Web", "url": "/contact"},
          "testimonial_quote": [{"type": "paragraph", "text": "Realistic customer testimonial", "spans": []}],
          "testimonial_author": "Customer Name",
          "testimonial_company": "Company Name",
          "testimonial_initials": "CN",
          "background_color": "white"
        }
      },
      {
        "slice_type": "recipe",
        "variation": "default",
        "slice_label": null,
        "primary": {
          "badge_text": "Best for Growth",
          "badge_color": "purple",
          "title": "Growth IT Recipe",
          "description": [{"type": "paragraph", "text": "Description of the growth package", "spans": []}],
          "ingredients_title": "What's Included:",
          "ingredients": [
            {"type": "list-item", "text": "Service 1", "spans": []},
            {"type": "list-item", "text": "Service 2", "spans": []},
            {"type": "list-item", "text": "Service 3", "spans": []},
            {"type": "list-item", "text": "Service 4", "spans": []},
            {"type": "list-item", "text": "Service 5", "spans": []}
          ],
          "price": "R6,500/mo",
          "cta_text": "Start Free Trial",
          "cta_link": {"link_type": "Web", "url": "/contact"},
          "testimonial_quote": [{"type": "paragraph", "text": "Realistic customer testimonial", "spans": []}],
          "testimonial_author": "Customer Name",
          "testimonial_company": "Company Name",
          "testimonial_initials": "CN",
          "background_color": "light-gray"
        }
      },
      {
        "slice_type": "faq",
        "variation": "default",
        "slice_label": null,
        "primary": {
          "section_title": [{"type": "heading2", "text": "Frequently Asked Questions", "spans": []}],
          "section_description": [{"type": "paragraph", "text": "Get answers to common questions", "spans": []}]
        },
        "items": [
          {
            "question": "Question 1?",
            "answer": [{"type": "paragraph", "text": "Detailed answer 1", "spans": []}]
          },
          {
            "question": "Question 2?",
            "answer": [{"type": "paragraph", "text": "Detailed answer 2", "spans": []}]
          },
          {
            "question": "Question 3?",
            "answer": [{"type": "paragraph", "text": "Detailed answer 3", "spans": []}]
          }
        ]
      }
    ]
  }
}

Guidelines:
- Use South African English (colours, centres, etc.)
- Prices in South African Rands (R)
- Make testimonials realistic with South African names and companies
- Focus on CircleTel's IT services (help desk, security, cloud, backup)
- Be professional but approachable
- Include real business pain points and solutions
`;

  const content = await generateContentWithGemini(prompt);
  const pageData = parseGeminiResponse(content);

  return pageData;
}

/**
 * Generate a resource page
 */
async function generateResourcePage(topic = 'connectivity-guide') {
  const prompt = `
You are a professional content writer for CircleTel, a South African ISP and IT services company.

Create a complete resource page about "${topic}" with the following structure.
Return ONLY valid JSON in this exact format (no additional text):

{
  "type": "resource_page",
  "uid": "${topic}-ai-generated",
  "lang": "en-za",
  "title": "Resource Page Title",
  "data": {
    "meta_title": "SEO-optimized title (max 60 chars)",
    "meta_description": "SEO-optimized description (max 160 chars)",
    "slices": [
      {
        "slice_type": "hero_section",
        "variation": "default",
        "slice_label": null,
        "primary": {
          "headline": [{"type": "heading1", "text": "Guide headline", "spans": []}],
          "subheadline": [{"type": "paragraph", "text": "Guide introduction", "spans": []}],
          "cta_button_text": "Download Guide",
          "cta_button_link": {"link_type": "Web", "url": "/contact"}
        }
      },
      {
        "slice_type": "comparison_table",
        "variation": "default",
        "slice_label": null,
        "primary": {
          "section_title": [{"type": "heading2", "text": "Comparison Title", "spans": []}],
          "section_description": [{"type": "paragraph", "text": "Comparison intro", "spans": []}],
          "column_1_header": "Option 1",
          "column_2_header": "Option 2",
          "column_3_header": "Option 3",
          "column_4_header": "Option 4",
          "footer_note": "Optional footnote"
        },
        "items": [
          {
            "row_label": "Feature 1",
            "column_1_value": "Value 1",
            "column_2_value": "Value 2",
            "column_3_value": "Value 3",
            "column_4_value": "Value 4",
            "highlight_row": false
          },
          {
            "row_label": "Feature 2",
            "column_1_value": "Value 1",
            "column_2_value": "Value 2",
            "column_3_value": "Value 3",
            "column_4_value": "Value 4",
            "highlight_row": true
          },
          {
            "row_label": "Feature 3",
            "column_1_value": "Value 1",
            "column_2_value": "Value 2",
            "column_3_value": "Value 3",
            "column_4_value": "Value 4",
            "highlight_row": false
          }
        ]
      },
      {
        "slice_type": "case_study",
        "variation": "default",
        "slice_label": null,
        "primary": {
          "title": "Success Story Title",
          "quote": [{"type": "paragraph", "text": "Compelling customer quote", "spans": []}],
          "author": "Customer Name",
          "company": "Company Name, Location",
          "background_color": "orange-border"
        }
      },
      {
        "slice_type": "faq",
        "variation": "default",
        "slice_label": null,
        "primary": {
          "section_title": [{"type": "heading2", "text": "Common Questions", "spans": []}],
          "section_description": [{"type": "paragraph", "text": "", "spans": []}]
        },
        "items": [
          {
            "question": "Question 1?",
            "answer": [{"type": "paragraph", "text": "Detailed answer", "spans": []}]
          },
          {
            "question": "Question 2?",
            "answer": [{"type": "paragraph", "text": "Detailed answer", "spans": []}]
          },
          {
            "question": "Question 3?",
            "answer": [{"type": "paragraph", "text": "Detailed answer", "spans": []}]
          }
        ]
      }
    ]
  }
}

Guidelines:
- Use South African English and context (mention Johannesburg, Cape Town, etc.)
- Include realistic performance metrics and comparisons
- Make case studies believable with South African companies
- Focus on business connectivity solutions
- Be informative and educational
- Include technical details but keep it accessible
`;

  const content = await generateContentWithGemini(prompt);
  const pageData = parseGeminiResponse(content);

  return pageData;
}

/**
 * Save image to disk
 */
function saveImage(imageData, filename, outputDir = 'public/generated-images') {
  const fullPath = path.join(__dirname, '..', outputDir);

  // Create directory if it doesn't exist
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }

  const buffer = Buffer.from(imageData.data, 'base64');
  const extension = imageData.mimeType.split('/')[1] || 'jpeg';
  const filepath = path.join(fullPath, `${filename}.${extension}`);

  fs.writeFileSync(filepath, buffer);

  const publicPath = `/generated-images/${filename}.${extension}`;
  console.log(`   💾 Saved: ${publicPath}`);

  return {
    localPath: filepath,
    publicUrl: `https://www.circletel.co.za${publicPath}`,
    fileName: `${filename}.${extension}`
  };
}

/**
 * Generate images for a service page
 */
async function generateServicePageImages(businessType) {
  console.log('\n🎨 Generating images for service page...\n');

  const images = {
    hero: null,
    featureIcon: null,
    recipeBackground: null
  };

  try {
    // 1. Hero image
    const heroPrompt = `Create a professional hero image for a South African ${businessType} IT services company. Show a diverse team of IT professionals in a modern office helping clients with technology. Include computers, monitors, and friendly collaboration. Vibrant, welcoming, professional photography style. South African business context with recognizable landmarks if possible.`;

    const heroImage = await generateImageWithGemini(heroPrompt, {
      aspectRatio: '16:9',
      imageSize: '2K'
    });

    if (heroImage) {
      images.hero = saveImage(heroImage, `${businessType}-hero`);
    }

    // 2. Feature/Security icon
    const iconPrompt = `Create a modern icon illustration for IT security and support services. Show a shield protecting connected devices (laptop, mobile, server, cloud). Use orange accent color #F5831F. Clean, minimal, professional icon style. Dark background.`;

    const iconImage = await generateImageWithGemini(iconPrompt, {
      aspectRatio: '1:1',
      imageSize: '2K'
    });

    if (iconImage) {
      images.featureIcon = saveImage(iconImage, `${businessType}-security-icon`);
    }

    // 3. Testimonial/Recipe background
    const bgPrompt = `Create a subtle background pattern for business service cards. Abstract geometric shapes with soft orange (#F5831F) and light gray tones. Professional, clean, modern. Should work well as a background without being too busy.`;

    const bgImage = await generateImageWithGemini(bgPrompt, {
      aspectRatio: '4:3',
      imageSize: '2K'
    });

    if (bgImage) {
      images.recipeBackground = saveImage(bgImage, `${businessType}-background`);
    }

    console.log('\n✅ Image generation complete!\n');

  } catch (error) {
    console.error('⚠️  Some images failed to generate:', error.message);
    console.log('   Continuing with text-only page...\n');
  }

  return images;
}

/**
 * Generate images for a resource page
 */
async function generateResourcePageImages(topic) {
  console.log('\n🎨 Generating images for resource page...\n');

  const images = {
    hero: null,
    infographic: null,
    diagram: null
  };

  try {
    // 1. Hero image
    const heroPrompt = `Create a professional header image for a business connectivity guide about ${topic}. Show modern network infrastructure, fiber optic cables, wireless routers, or data centers. Professional, technical, South African business context. Clean, modern photography style.`;

    const heroImage = await generateImageWithGemini(heroPrompt, {
      aspectRatio: '16:9',
      imageSize: '2K'
    });

    if (heroImage) {
      images.hero = saveImage(heroImage, `${topic}-hero`);
    }

    // 2. Comparison infographic
    const infoPrompt = `Create an infographic comparing different connectivity options (Fibre, 5G, LTE). Show speed bars, coverage maps, and cost indicators. Clean, professional data visualization with orange accents #F5831F. Modern business infographic style.`;

    const infoImage = await generateImageWithGemini(infoPrompt, {
      aspectRatio: '16:9',
      imageSize: '2K'
    });

    if (infoImage) {
      images.infographic = saveImage(infoImage, `${topic}-comparison`);
    }

    // 3. Technical diagram
    const diagramPrompt = `Create a simple technical diagram showing business network connectivity. Show office building connected to internet via fiber/wireless. Include router, firewall, cloud services. Clean, minimal, professional diagram style with orange accents #F5831F.`;

    const diagramImage = await generateImageWithGemini(diagramPrompt, {
      aspectRatio: '4:3',
      imageSize: '2K'
    });

    if (diagramImage) {
      images.diagram = saveImage(diagramImage, `${topic}-diagram`);
    }

    console.log('\n✅ Image generation complete!\n');

  } catch (error) {
    console.error('⚠️  Some images failed to generate:', error.message);
    console.log('   Continuing with text-only page...\n');
  }

  return images;
}

/**
 * Display Prismic upload instructions
 */
function displayPrismicUploadInstructions(images) {
  console.log('\n' + '='.repeat(70));
  console.log('📤 NEXT STEP: Upload Images to Prismic');
  console.log('='.repeat(70));
  console.log('\n1️⃣  Go to Prismic Media Library:');
  console.log('   https://circletel.prismic.io/media\n');
  console.log('2️⃣  Click "Upload" button\n');
  console.log('3️⃣  Select these generated images:\n');

  const imageFiles = Object.values(images)
    .filter(img => img !== null)
    .map(img => img.fileName);

  imageFiles.forEach((file, index) => {
    console.log(`   ${index + 1}. ${file}`);
  });

  console.log('\n4️⃣  Tag them: "ai-generated", "gemini-3-pro"\n');
  console.log('5️⃣  In your Prismic page editor:');
  console.log('   - Click image fields (hero, features, etc.)');
  console.log('   - Select your uploaded images from Media Library\n');
  console.log('6️⃣  Click "Publish" when ready!\n');
  console.log('='.repeat(70) + '\n');
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 CircleTel AI Page Generator\n');
  console.log('Using: Gemini 3 Pro Preview (Jan 2025 Knowledge) + Prismic Migration API\n');

  // Get page type from command line or use default
  const args = process.argv.slice(2);
  const pageType = args[0] || 'service';
  const topic = args[1] || 'small-business';
  const withImages = args.includes('--with-images') || args.includes('-i');

  try {
    let pageData;
    let generatedImages = null;

    // Generate images if requested
    if (withImages) {
      console.log('🎨 Image generation enabled!\n');

      if (pageType === 'service') {
        generatedImages = await generateServicePageImages(topic);
      } else if (pageType === 'resource') {
        generatedImages = await generateResourcePageImages(topic);
      }
    }

    // Generate page content
    if (pageType === 'service') {
      console.log(`📄 Generating service page for: ${topic}\n`);
      pageData = await generateServicePage(topic);
    } else if (pageType === 'resource') {
      console.log(`📚 Generating resource page for: ${topic}\n`);
      pageData = await generateResourcePage(topic);
    } else {
      console.error('❌ Invalid page type. Use "service" or "resource"');
      process.exit(1);
    }

    console.log('✅ Content generated successfully!\n');
    console.log('📝 Preview:\n');
    console.log(`   Type: ${pageData.type}`);
    console.log(`   UID: ${pageData.uid}`);
    console.log(`   Title: ${pageData.title}`);
    console.log(`   Slices: ${pageData.data.slices.length}`);

    if (withImages && generatedImages) {
      const imageCount = Object.values(generatedImages).filter(img => img !== null).length;
      console.log(`   Images: ${imageCount} generated`);
    }

    console.log('');

    // Create page in Prismic
    console.log('📤 Creating page in Prismic...');
    const result = await createPrismicPage(pageData);

    console.log('✅ Page created successfully!');
    console.log(`   ID: ${result.id}`);

    if (pageType === 'service') {
      console.log(`   URL: https://www.circletel.co.za/services/${pageData.uid}`);
    } else {
      console.log(`   URL: https://www.circletel.co.za/resources/${pageData.uid}`);
    }

    console.log('\n✨ Page creation complete!');
    console.log(`   Dashboard: https://circletel.prismic.io/documents`);

    // Display image upload instructions if images were generated
    if (withImages && generatedImages) {
      displayPrismicUploadInstructions(generatedImages);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { generateServicePage, generateResourcePage, createPrismicPage };
