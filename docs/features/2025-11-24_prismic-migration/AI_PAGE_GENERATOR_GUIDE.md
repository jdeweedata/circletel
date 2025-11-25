# AI-Powered Page Generator for Prismic 🤖✨

**Generate beautiful, SEO-optimized Prismic pages using Gemini 3 AI from the terminal!**

## Features

✅ **AI Content Generation** - Gemini 3 Pro (Jan 2025 knowledge) writes professional content
✅ **Advanced Reasoning** - Deep thinking mode for high-quality, well-structured content
✅ **Complete Pages** - Hero, features, recipes, FAQs, testimonials all generated
✅ **South African Context** - ZAR pricing, SA locations, local business names
✅ **SEO Optimized** - Meta titles and descriptions included
✅ **Direct to Prismic** - Automatically created via Migration API
✅ **Instant Preview** - Pages ready to publish in Prismic dashboard

## Setup

### 1. Add Gemini API Key

Get your API key from: https://aistudio.google.com/app/apikey

Add to `.env.local`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Verify Installation

The `@google/generative-ai` package is already installed ✅

## Usage

### Generate a Service Page

```bash
# Small business service page
node scripts/create-prismic-page-with-ai.js service small-business

# Mid-size business page
node scripts/create-prismic-page-with-ai.js service mid-size

# Enterprise service page
node scripts/create-prismic-page-with-ai.js service enterprise

# Startup service page
node scripts/create-prismic-page-with-ai.js service startup
```

**What it generates:**
- Hero section with compelling headline
- Feature grid (3 benefits)
- 2 IT Recipe packages with pricing
- FAQ section (3-4 questions)
- South African testimonials
- SEO metadata

**Example output:**
```
🚀 CircleTel AI Page Generator

Using: Gemini 3 Pro Preview (Jan 2025 Knowledge) + Prismic Migration API

📄 Generating service page for: small-business

🤖 Generating content with Gemini 3 Pro (Advanced Reasoning)...
✅ Content generated successfully!

📝 Preview:

   Type: service_page
   UID: small-business-ai-generated
   Title: Small Business IT Services | CircleTel
   Slices: 5

📤 Creating page in Prismic...
✅ Page created successfully!
   ID: aSTFmhIAACkA-_ly
   URL: https://www.circletel.co.za/services/small-business-ai-generated

✨ Done! Go to Prismic dashboard to publish the page.
   Dashboard: https://circletel.prismic.io/documents
```

---

### Generate a Resource Page

```bash
# Connectivity guide
node scripts/create-prismic-page-with-ai.js resource connectivity-guide

# WiFi setup toolkit
node scripts/create-prismic-page-with-ai.js resource wifi-toolkit

# IT assessment guide
node scripts/create-prismic-page-with-ai.js resource it-assessment

# Cybersecurity guide
node scripts/create-prismic-page-with-ai.js resource cybersecurity

# Cloud migration guide
node scripts/create-prismic-page-with-ai.js resource cloud-migration
```

**What it generates:**
- Hero section with guide introduction
- Comparison table (e.g., Fibre vs 5G vs LTE)
- Customer case study with quote
- FAQ section
- SEO metadata

---

## Generated Content Examples

### Service Page Structure

```
├── Hero Section
│   ├── Headline: "Reliable IT Support for Growing South African Businesses"
│   ├── Subheadline: "Comprehensive IT solutions designed for small businesses..."
│   └── CTA: "Get Started"
│
├── Feature Grid
│   ├── "24/7 Local Support"
│   ├── "Affordable Pricing"
│   └── "Scalable Solutions"
│
├── Recipe 1: Basic IT Recipe
│   ├── Badge: "Most Popular" (blue)
│   ├── Price: R3,500/mo
│   ├── Services: Help Desk, Security, Email, Backup
│   └── Testimonial from Johannesburg customer
│
├── Recipe 2: Growth IT Recipe
│   ├── Badge: "Best for Growth" (purple)
│   ├── Price: R6,500/mo
│   ├── Services: Everything + Cloud Migration
│   └── Testimonial from Cape Town customer
│
└── FAQ Section
    ├── "How quickly can you respond?"
    ├── "Can I customize my package?"
    └── "Do I need a long-term contract?"
```

### Resource Page Structure

```
├── Hero Section
│   ├── Headline: "South African Business Connectivity Guide"
│   └── CTA: "Download Guide"
│
├── Comparison Table
│   ├── Headers: Fibre | 5G | Fixed Wireless | LTE
│   ├── Rows: Speed, Availability, Cost, Deployment
│   └── Footer: "*Based on 2024 SA market data"
│
├── Case Study
│   ├── Title: "Sandton Financial Services Success"
│   ├── Quote: Customer testimonial
│   └── Company: Real SA business context
│
└── FAQ Section
    └── Technical connectivity questions
```

---

## Customization

### Modify the AI Prompts

Edit `scripts/create-prismic-page-with-ai.js` and customize the prompts:

**For more recipes:**
```javascript
// Add a third recipe in the prompt
{
  "slice_type": "recipe",
  "variation": "default",
  "slice_label": null,
  "primary": {
    "badge_text": "Enterprise",
    "badge_color": "red",
    "title": "Enterprise IT Recipe",
    // ... more config
  }
}
```

**For different industries:**
```bash
# Edit the prompt to target specific industries
const prompt = `
Create a service page for ${businessType} in the ${industry} industry...
`;
```

**For custom comparisons:**
```javascript
// Modify comparison_table columns
"column_1_header": "Your Column",
"column_2_header": "Another Column",
```

---

## Advanced Features

### Generate Multiple Pages at Once

```bash
# Batch generate service pages
for topic in small-business mid-size enterprise startup; do
  node scripts/create-prismic-page-with-ai.js service $topic
  sleep 5  # Rate limit between requests
done
```

### Generate Custom Topics

```bash
# Healthcare IT services
node scripts/create-prismic-page-with-ai.js service healthcare

# Retail connectivity solutions
node scripts/create-prismic-page-with-ai.js resource retail-connectivity

# Legal practice IT guide
node scripts/create-prismic-page-with-ai.js resource legal-it-guide
```

---

## Workflow Integration

### 1. Generate → 2. Review → 3. Publish

```bash
# Step 1: Generate page
node scripts/create-prismic-page-with-ai.js service small-business

# Step 2: Review in Prismic dashboard
# Visit: https://circletel.prismic.io/documents

# Step 3: Edit if needed (pricing, testimonials, etc.)

# Step 4: Publish to production
# Click "Publish" button in Prismic

# Step 5: View live
# Visit: https://www.circletel.co.za/services/small-business-ai-generated
```

---

## Tips for Best Results

### Content Quality
- ✅ **Be specific**: Use descriptive topic names (e.g., "accounting-firm-it" vs "business")
- ✅ **Review first**: AI-generated content is 90% ready - review before publishing
- ✅ **Update pricing**: Verify prices match current offerings
- ✅ **Check testimonials**: Replace with real customer quotes if available

### SEO Optimization
- ✅ Generated meta titles are 50-60 characters
- ✅ Generated meta descriptions are 150-160 characters
- ✅ Headlines include keywords naturally
- ✅ Content is structured with proper heading hierarchy

### South African Context
- ✅ Prices in South African Rands (R)
- ✅ Mentions major SA cities (Johannesburg, Cape Town, Durban, Pretoria)
- ✅ Uses South African English spelling
- ✅ References local business challenges (load shedding, etc.)

---

## Troubleshooting

### Error: GEMINI_API_KEY not found
**Solution**: Add to `.env.local`:
```env
GEMINI_API_KEY=your_api_key_here
```

### Error: Failed to parse Gemini response
**Solution**: Gemini returned invalid JSON. Try again - AI responses vary.

### Error: Failed to create page in Prismic
**Solution**: Check PRISMIC_WRITE_TOKEN is correct and page UID is unique.

### Page looks incomplete
**Solution**: Edit the prompt to request more specific content.

---

## Cost Estimation

**Gemini API Pricing** (as of 2024):
- Input: $0.00025 per 1K characters
- Output: $0.0005 per 1K characters

**Per Page Generation**:
- Prompt: ~3,000 characters = $0.00075
- Response: ~5,000 characters = $0.0025
- **Total per page: ~$0.003 (R0.05)**

**100 pages = ~$0.30 (R5)**

Extremely affordable compared to hiring content writers!

---

## Examples Gallery

### Service Pages Generated
1. **Small Business IT** - 3 recipes, 4 FAQs
2. **Mid-Size Enterprise** - Security focus, compliance
3. **Startup IT Services** - Cost-effective packages
4. **Healthcare IT** - POPIA compliance focus

### Resource Pages Generated
1. **Connectivity Guide** - Fibre vs 5G comparison
2. **WiFi Setup Toolkit** - Technical guide
3. **Cybersecurity Checklist** - Best practices
4. **Cloud Migration Guide** - Step-by-step process

---

## Next Steps

1. **Generate your first page**:
   ```bash
   node scripts/create-prismic-page-with-ai.js service small-business
   ```

2. **Review in Prismic**: https://circletel.prismic.io/documents

3. **Publish and share**: Get feedback from team

4. **Iterate**: Refine prompts based on results

5. **Scale**: Generate pages for all service offerings

---

## Advanced: Image Generation

Want to add AI-generated images? Here's how:

### Option 1: Gemini Image Description
```javascript
// Generate image prompts for designers
const imagePrompt = `Generate 3 image descriptions for a ${topic} service page`;
```

### Option 2: DALL-E Integration (Future)
```javascript
// Generate images with DALL-E
const image = await openai.images.generate({
  prompt: "Professional IT support team in South African office",
  n: 1,
  size: "1024x1024"
});
```

### Option 3: Unsplash API
```javascript
// Fetch free stock photos
const response = await fetch(`https://api.unsplash.com/search/photos?query=${topic}`);
```

---

## Support

**Issues?**
- Check `.env.local` has both API keys
- Verify Gemini API quota at: https://aistudio.google.com
- Check Prismic dashboard for generated pages

**Need help?**
- Review the script: `scripts/create-prismic-page-with-ai.js`
- Test with simpler topics first
- Increase detail in prompts for better results

---

**Status**: ✅ Ready to Use
**Last Updated**: 2025-11-25
**Gemini Model**: gemini-3-pro-preview
**Model Features**: 1M context, 64k output, Jan 2025 knowledge cutoff, advanced reasoning
**Cost per Page**: ~$2-4 input / $12-18 output per 1M tokens (varies by context size)
