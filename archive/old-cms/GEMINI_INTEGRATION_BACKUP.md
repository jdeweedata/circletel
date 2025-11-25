# Gemini AI Integration - Configuration Backup

**Date:** November 24, 2025
**Purpose:** Backup Gemini AI configuration for migration from custom CMS to `/admin/ai-copy` tool

---

## Environment Variables

### Required Variables (Keep in .env.local)

```bash
# Google Gemini AI Configuration
# Sign up at: https://ai.google.dev/
GOOGLE_AI_API_KEY=your_gemini_api_key_here
GOOGLE_AI_PROJECT_ID=your_gcp_project_id

# AI Content Generation Settings
CMS_MODEL_ID=gemini-3-pro-preview
CMS_DEFAULT_TEMPERATURE=1.0  # CRITICAL: Keep at 1.0 for Gemini 3 (don't change!)

# Feature Flags
ENABLE_AI_IMAGE_GENERATION=false  # Currently not implemented
ENABLE_AI_CONTENT_GENERATION=true  # Enable AI copywriting tool
```

### Optional Variables for AI Copywriter

```bash
# Rate Limiting (reuse existing table)
CMS_MAX_GENERATIONS_PER_HOUR=20  # Default: 20 generations per hour per user

# Cost Tracking
# Gemini 3 Pro pricing (per 1M tokens):
# - Input <200K: $2.00 | Output: $12.00
# - Input >200K: $4.00 | Output: $18.00
```

---

## Gemini 3 Pro Configuration (CRITICAL SETTINGS)

### Model: `gemini-3-pro-preview`

**Key Requirements:**
- ✅ **Temperature MUST be 1.0** (non-negotiable, Gemini 3 requirement)
- ✅ **Use v1alpha API** (required for Gemini 3)
- ✅ **Concise prompts** (anti-pattern: verbose chain-of-thought)
- ✅ **Structured JSON output** with schema validation
- ✅ **Thought signatures** for multi-turn conversations

### Configuration Object

```typescript
// lib/ai-copywriter/ai-service.ts
import { GoogleGenerativeAI } from '@google/genai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

const model = genAI.getGenerativeModel({
  model: 'gemini-3-pro-preview',
  generationConfig: {
    temperature: 1.0,  // MUST BE 1.0
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,  // Up to 64k supported
    responseMimeType: 'application/json',  // For structured output
  },
  systemInstruction: `You are a professional copywriter...`, // See prompt templates
})
```

---

## Thought Signatures (Critical Feature)

**Purpose:** Preserve reasoning context for multi-turn conversations

### How It Works:
1. **First Generation:**
   - User: "Write hero copy for Fiber Internet"
   - Gemini generates content + thought signature (encrypted reasoning)
   - Store thought signature in session or database

2. **Follow-up Edit:**
   - User: "Make it more technical"
   - Send original request + thought signature + refinement request
   - Gemini uses signature to understand context without re-generating from scratch

### Implementation:
```typescript
// First request
const response = await model.generateContent({
  contents: [{ role: 'user', parts: [{ text: prompt }] }],
  generationConfig: {
    ...config,
    thoughtLevel: 'high'  // Include reasoning in response
  }
})

const thoughtSignature = response.thoughtSignature // Save this!

// Follow-up request
const refinementResponse = await model.generateContent({
  contents: [
    { role: 'user', parts: [{ text: originalPrompt }] },
    { role: 'model', parts: [{ text: previousResponse }], thoughtSignature },
    { role: 'user', parts: [{ text: 'Make it more technical' }] }
  ]
})
```

---

## Prompt Templates

### Preserved from `lib/cms/prompt-templates.ts`

```typescript
// Hero Section Copy
export const heroPrompt = (topic: string, tone: string) => `
Generate compelling hero section copy for: "${topic}"

Tone: ${tone}
Brand: CircleTel (South African ISP)
Colors: Orange (#F5831F), Dark Neutral (#1F2937)

Output JSON:
{
  "headline": "6-10 words, action-oriented",
  "subheadline": "20-30 words, benefit-focused",
  "cta_text": "2-4 words, imperative"
}
`

// Feature Section Copy
export const featurePrompt = (topic: string, featureCount: number) => `
Generate ${featureCount} key features for: "${topic}"

Brand: CircleTel (ISP in South Africa)
Focus: Benefits over technical specs

Output JSON:
{
  "features": [
    {
      "title": "3-5 words",
      "description": "15-25 words, benefit-focused"
    }
  ]
}
`

// FAQ Section Copy
export const faqPrompt = (topic: string) => `
Generate 5 frequently asked questions about: "${topic}"

Context: CircleTel ISP, South African market
Style: Conversational but professional

Output JSON:
{
  "faqs": [
    {
      "question": "Direct question format",
      "answer": "2-3 sentences, clear and helpful"
    }
  ]
}
`
```

---

## Rate Limiting Implementation

### Database Table: `cms_ai_usage` → Rename to `ai_copywriter_usage`

```sql
-- Existing table (keep structure)
create table ai_copywriter_usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  generation_type text not null, -- 'hero', 'feature', 'faq', etc.
  tokens_used integer,
  cost_estimate numeric(10, 4),
  created_at timestamp with time zone default now()
);

-- Rate limiting query (20 per hour)
select count(*) from ai_copywriter_usage
where user_id = $1
and created_at > now() - interval '1 hour';
```

### API Route Check:
```typescript
// app/api/ai-copywriter/generate/route.ts
const recentGenerations = await supabase
  .from('ai_copywriter_usage')
  .select('id')
  .eq('user_id', userId)
  .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())

if (recentGenerations.data && recentGenerations.data.length >= 20) {
  return NextResponse.json(
    { error: 'Rate limit exceeded. Max 20 generations per hour.' },
    { status: 429 }
  )
}
```

---

## Cost Tracking

### Token Pricing (as of Jan 2025)

| Context Size | Input Cost | Output Cost |
|--------------|-----------|-------------|
| <200K tokens | $2.00/1M | $12.00/1M |
| >200K tokens | $4.00/1M | $18.00/1M |

### Estimation Formula:
```typescript
function estimateCost(inputTokens: number, outputTokens: number): number {
  const inputCost = inputTokens < 200000
    ? (inputTokens / 1_000_000) * 2.00
    : (inputTokens / 1_000_000) * 4.00

  const outputCost = inputTokens < 200000
    ? (outputTokens / 1_000_000) * 12.00
    : (outputTokens / 1_000_000) * 18.00

  return inputCost + outputCost
}
```

---

## Migration Checklist for AI Copywriter Tool

### Phase 5 Tasks:
- [ ] Rename `lib/cms/` to `lib/ai-copywriter/`
- [ ] Preserve `ai-service.ts` (Gemini client)
- [ ] Preserve `prompt-templates.ts` (all prompt functions)
- [ ] Create `/admin/ai-copy/page.tsx` (new UI)
- [ ] Create `/api/ai-copywriter/generate/route.ts` (new API)
- [ ] Rename table `cms_ai_usage` → `ai_copywriter_usage`
- [ ] Update all references to use new table name
- [ ] Test thought signatures with multi-turn conversations
- [ ] Verify rate limiting (20/hour) still works
- [ ] Add copy-to-clipboard buttons for each field

### Environment Variables to Keep:
```bash
✅ GOOGLE_AI_API_KEY
✅ GOOGLE_AI_PROJECT_ID
✅ CMS_MODEL_ID (keep name, it's just an identifier)
✅ CMS_DEFAULT_TEMPERATURE
✅ ENABLE_AI_CONTENT_GENERATION
✅ CMS_MAX_GENERATIONS_PER_HOUR
```

---

## Testing Scenarios

### Test 1: Single Generation
1. Go to `/admin/ai-copy`
2. Select "Hero Section"
3. Enter topic: "Fiber Internet for Small Businesses"
4. Click "Generate"
5. Verify: Headline, subheadline, CTA text generated
6. Click "Copy" buttons → Paste into Prismic

### Test 2: Multi-Turn Conversation (Thought Signatures)
1. Generate hero copy for "5G Mobile Plans"
2. Click "Refine" → Enter: "Make it more affordable-focused"
3. Verify: Gemini refines previous output (doesn't regenerate from scratch)
4. Check response time: Should be faster than first generation

### Test 3: Rate Limiting
1. Make 20 generation requests within 1 hour
2. 21st request should return 429 error
3. Wait 1 hour → Should work again

### Test 4: Cost Tracking
1. Check `/admin/ai-usage` dashboard
2. Verify: Tokens used and cost estimate displayed
3. Compare with Google AI Studio billing

---

## Troubleshooting

### Error: "Temperature must be 1.0"
✅ **Fix:** Check `CMS_DEFAULT_TEMPERATURE` in .env.local is exactly `1.0`

### Error: "Model not found"
✅ **Fix:** Ensure using `v1alpha` API endpoint, not `v1` or `v1beta`

### Slow Response Times (>10 seconds)
✅ **Fix:**
- Reduce prompt length (Gemini 3 prefers concise prompts)
- Check if using `thoughtLevel: 'low'` instead of `high`

### Thought Signatures Not Working
✅ **Fix:**
- Verify `thoughtSignature` field is being saved
- Check it's passed in `contents` array for follow-up requests
- Ensure same session/user for continuity

---

## Resources

- **Gemini 3 Docs:** https://ai.google.dev/gemini-api/docs
- **Pricing:** https://ai.google.dev/pricing
- **API Reference:** https://ai.google.dev/api/rest/v1alpha
- **CircleTel Brand Guidelines:** See CLAUDE.md

---

**Status:** ✅ Ready for Phase 5 implementation
