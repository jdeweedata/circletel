# Gemini 3 Best Practices for CircleTel CMS

**Model**: `gemini-3-pro-preview`
**Knowledge Cutoff**: January 2025
**Context Window**: 1M input / 64k output
**Documentation**: https://ai.google.dev/gemini-api/docs/gemini-3

---

## 🎯 Critical Configuration Rules

### 1. Temperature MUST Stay at 1.0
```typescript
// ✅ CORRECT
const config = {
  model: 'gemini-3-pro-preview',
  temperature: 1.0  // DO NOT CHANGE THIS
};

// ❌ WRONG - Will cause looping and degraded performance
const config = {
  model: 'gemini-3-pro-preview',
  temperature: 0.7  // NEVER use low temperature with Gemini 3
};
```

**Why**: Gemini 3's reasoning is optimized for temperature=1.0. Lowering it causes:
- Infinite loops on complex tasks
- Degraded performance on math/reasoning
- Unexpected behavior

### 2. API Version for Media Resolution
```typescript
// ✅ CORRECT - Use v1alpha for media_resolution
const client = new GoogleGenAI({
  apiVersion: 'v1alpha'  // Required!
});

// ❌ WRONG - media_resolution won't work
const client = new GoogleGenAI(); // Defaults to v1beta
```

### 3. Thinking Level
```typescript
// For content generation (quality matters)
thinking_level: 'high'  // Default, maximizes reasoning

// For simple tasks (speed matters)
thinking_level: 'low'   // Faster, lower cost
```

**Recommendation**:
- **Blog posts, landing pages**: `high` (better writing quality)
- **Simple summaries, drafts**: `low` (faster turnaround)
- **Never use**: `medium` (not supported at launch)

### 4. Media Resolution (Images)
```typescript
// ✅ RECOMMENDED - High quality for marketing images
media_resolution: 'media_resolution_high'  // 1120 tokens

// For PDFs (OCR)
media_resolution: 'media_resolution_medium'  // 560 tokens (optimal)

// For video (general)
media_resolution: 'media_resolution_low'  // 70 tokens per frame
```

**Token Usage**:
| Resolution | Images | Video (per frame) | Use Case |
|------------|--------|-------------------|----------|
| `low` | 280 tokens | 70 tokens | Quick previews |
| `medium` | 560 tokens | 70 tokens | PDFs, documents |
| `high` | 1120 tokens | 280 tokens | Marketing images, detailed analysis |

---

## 🔐 Thought Signatures (CRITICAL)

### What Are They?
Encrypted representations of Gemini 3's reasoning process. **Must** be returned in follow-up requests to maintain context.

### When Required?
1. **Function Calling** (STRICT): Missing signatures → 400 error
2. **Multi-turn Chat** (RECOMMENDED): Omitting degrades quality

### Implementation Pattern
```typescript
// Step 1: Generate content
const response = await client.models.generateContent({
  model: 'gemini-3-pro-preview',
  contents: 'Write a blog about AI...'
});

// Step 2: Extract thought signature
const thoughtSignature = response.thoughtSignature;

// Step 3: Store in database
await db.pages.update({
  thought_signature: thoughtSignature
});

// Step 4: Use in follow-up requests
const followUp = await client.models.generateContent({
  model: 'gemini-3-pro-preview',
  contents: [
    {
      role: 'model',
      parts: [
        {
          text: response.text,
          thoughtSignature: thoughtSignature // REQUIRED!
        }
      ]
    },
    {
      role: 'user',
      parts: [{ text: 'Now make it shorter' }]
    }
  ]
});
```

### Database Storage
```sql
-- Already included in pages table
ALTER TABLE pages ADD COLUMN thought_signature TEXT;

-- Store after generation
UPDATE pages
SET thought_signature = '<signature>'
WHERE id = '<page_id>';
```

### Migration from Other Models
If injecting a custom function call from Gemini 2.5:
```typescript
thoughtSignature: "context_engineering_is_the_way_to_go"  // Bypass validation
```

---

## 📝 Prompting Best Practices

### 1. Be Concise and Direct
```typescript
// ✅ GOOD - Direct instruction
const prompt = `Write a landing page for CircleTel's 5G LTE packages targeting B2B customers.
Emphasize speed, reliability, and business continuity.`;

// ❌ BAD - Over-engineered
const prompt = `You are a professional copywriter with 10 years of experience...
[200 lines of context and examples]
Now, I want you to think step-by-step and create a landing page...`;
```

**Why**: Gemini 3 may over-analyze verbose prompts. Keep it simple.

### 2. Place Instructions at the End
```typescript
// ✅ GOOD - Data first, question last
const prompt = `
<product_data>
${productCatalog}
</product_data>

Based on the information above, create a comparison table of BizFibre packages.
`;

// ❌ BAD - Question first, data later
const prompt = `
Create a comparison table.

Here's the product data:
${productCatalog}
`;
```

### 3. Request Verbosity Explicitly
```typescript
// Gemini 3 is less verbose by default

// For chatty output
const prompt = `Explain CircleTel's coverage areas.
Use a friendly, conversational tone with detailed examples.`;

// For concise output (default)
const prompt = `List CircleTel's coverage areas.`;
```

### 4. Avoid Complex Prompt Engineering
```typescript
// ✅ GOOD - Simple, direct
const prompt = `Generate a blog post about 5G benefits for businesses.
Include 3 use cases and a call-to-action.`;

// ❌ BAD - Chain-of-thought no longer needed
const prompt = `Let's think step-by-step:
1. First, identify 5G benefits
2. Then, brainstorm business use cases
3. Next, evaluate which are most compelling
4. Finally, synthesize into a blog post`;
```

**Why**: Gemini 3 uses internal reasoning. Explicit CoT chains are redundant.

---

## 🏗️ Structured Outputs with Tools

### Combine JSON Schema + Google Search
```typescript
const response = await client.models.generateContent({
  model: 'gemini-3-pro-preview',
  contents: 'What are the latest 5G trends in South Africa?',
  config: {
    tools: [
      { googleSearch: {} }  // Enable real-time search
    ],
    responseMimeType: 'application/json',
    responseJsonSchema: {
      type: 'object',
      properties: {
        trends: {
          type: 'array',
          items: { type: 'string' }
        },
        sources: {
          type: 'array',
          items: { type: 'string' }
        }
      },
      required: ['trends', 'sources']
    }
  }
});

// Response guaranteed to match schema
const data = JSON.parse(response.text);
```

### Supported Tools
- ✅ Google Search (for up-to-date info)
- ✅ Code Execution (for data processing)
- ✅ URL Context (for fetching web content)
- ✅ File Search (for document retrieval)
- ✅ Function Calling (custom tools)
- ❌ Google Maps (not yet supported)
- ❌ Computer Use (not yet supported)

---

## 💰 Cost Optimization

### Pricing (per 1M tokens)
| Context Size | Input | Output |
|--------------|-------|--------|
| < 200k tokens | $2 | $12 |
| > 200k tokens | $4 | $18 |

### Optimization Strategies

1. **Use `thinking_level: 'low'` for Simple Tasks**
```typescript
// Drafts, summaries, simple rewrites
thinking_level: 'low'  // Faster, cheaper
```

2. **Context Caching** (min 2048 tokens)
```typescript
// Cache product catalog for repeated use
const cachedContext = await client.caches.create({
  model: 'gemini-3-pro-preview',
  contents: [
    { text: productCatalog }  // Large, static data
  ]
});

// Reuse cached context
const response = await client.models.generateContent({
  model: 'gemini-3-pro-preview',
  cachedContent: cachedContext.name,
  contents: 'Create a landing page for BizFibre 200'
});
```

3. **Rate Limiting** (already configured)
```typescript
// .env.example
CMS_MAX_GENERATIONS_PER_HOUR=20  // Per user
```

4. **Reduce Media Resolution When Possible**
```typescript
// For thumbnails, previews
media_resolution: 'media_resolution_low'
```

---

## ⚠️ Common Mistakes

### 1. Changing Temperature
```typescript
// ❌ NEVER DO THIS
temperature: 0.5  // Will break reasoning
```

### 2. Using Wrong API Version
```typescript
// ❌ WRONG
const client = new GoogleGenAI();  // Defaults to v1beta

// ✅ CORRECT
const client = new GoogleGenAI({ apiVersion: 'v1alpha' });
```

### 3. Ignoring Thought Signatures
```typescript
// ❌ BAD - Lost reasoning context
const followUp = await generateContent({
  contents: [
    { role: 'model', parts: [{ text: previousResponse }] },  // Missing signature!
    { role: 'user', parts: [{ text: 'Continue...' }] }
  ]
});

// ✅ GOOD - Preserved reasoning
const followUp = await generateContent({
  contents: [
    {
      role: 'model',
      parts: [{
        text: previousResponse,
        thoughtSignature: storedSignature  // Include it!
      }]
    },
    { role: 'user', parts: [{ text: 'Continue...' }] }
  ]
});
```

### 4. Over-Engineering Prompts
```typescript
// ❌ BAD - Gemini 3 doesn't need this
const prompt = `Think step-by-step. First analyze X, then consider Y, then...`;

// ✅ GOOD - Direct instruction
const prompt = `Analyze X and Y. Provide recommendations.`;
```

---

## 🚀 Implementation Checklist

For CircleTel CMS implementation:

- [ ] Set `temperature: 1.0` in all requests
- [ ] Use `apiVersion: 'v1alpha'` for media features
- [ ] Store `thought_signature` in database after generation
- [ ] Return thought signatures in follow-up requests
- [ ] Use `thinking_level: 'high'` for content generation
- [ ] Use `media_resolution_high` for marketing images
- [ ] Keep prompts concise and direct
- [ ] Place data before questions in prompts
- [ ] Implement rate limiting (20 gen/hour/user)
- [ ] Enable Context Caching for product catalog
- [ ] Monitor token usage and costs
- [ ] Use structured outputs for consistent formatting

---

## 📚 References

- **Official Docs**: https://ai.google.dev/gemini-api/docs/gemini-3
- **Thought Signatures**: https://ai.google.dev/gemini-api/docs/thought-signatures
- **Prompting Guide**: https://ai.google.dev/gemini-api/docs/prompting-strategies
- **Context Caching**: https://ai.google.dev/gemini-api/docs/caching
- **Function Calling**: https://ai.google.dev/gemini-api/docs/function-calling
- **Cookbook**: https://colab.research.google.com/github/google-gemini/cookbook/blob/main/quickstarts/Get_started.ipynb

---

**Version**: 1.0
**Last Updated**: 2025-11-23
**For**: CircleTel AI-Powered CMS Implementation
