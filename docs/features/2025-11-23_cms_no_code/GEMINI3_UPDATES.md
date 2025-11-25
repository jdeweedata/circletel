# Gemini 3 Integration Updates

**Date**: 2025-11-23
**Purpose**: Document all Gemini 3-specific additions to the CMS implementation

---

## 📋 Summary of Changes

Based on the official Gemini 3 documentation, we've added **critical configuration and types** to ensure proper integration with Gemini 3 Pro's advanced reasoning capabilities.

---

## ✅ Files Updated

### 1. `.env.example` - Environment Configuration
**File**: `C:\Projects\circletel-nextjs\.env.example`
**Lines**: 56-74

**Added Variables**:
```env
# Model Configuration
CMS_MODEL_ID=gemini-3-pro-preview
CMS_API_VERSION=v1alpha  # Required for media_resolution

# Gemini 3 Specific Settings
CMS_DEFAULT_TEMPERATURE=1.0  # CRITICAL: Must be 1.0
CMS_THINKING_LEVEL=high  # "low" or "high"
CMS_MEDIA_RESOLUTION=media_resolution_high  # Image quality
```

**⚠️ CRITICAL**: Temperature MUST stay at 1.0 for Gemini 3
- Lower values cause infinite loops
- Degrades performance on complex reasoning tasks
- Gemini 3 is optimized specifically for temperature=1.0

### 2. `lib/cms/types.ts` - TypeScript Definitions
**File**: `C:\Projects\circletel-nextjs\lib\cms\types.ts`
**Lines**: 35-95, 267-285

**Added Types**:

#### Thinking Level
```typescript
export type ThinkingLevel = 'low' | 'high';
```
- `low`: Fast responses, lower cost
- `high`: Maximum reasoning quality (default)

#### Media Resolution
```typescript
export type MediaResolutionLevel =
  | 'media_resolution_low'     // 280 tokens (images), 70 tokens (video)
  | 'media_resolution_medium'  // 560 tokens (images), 70 tokens (video)
  | 'media_resolution_high';   // 1120 tokens (images), 280 tokens (video)
```

#### Thought Signatures
```typescript
export interface ThoughtSignature {
  signature: string;
}
```
**Purpose**: Encrypted representation of Gemini 3's reasoning context
**Usage**: MUST be returned in follow-up requests to maintain reasoning chain

#### Gemini 3 Config
```typescript
export interface Gemini3Config {
  model: 'gemini-3-pro-preview';
  thinking_level?: ThinkingLevel;
  temperature?: 1.0; // MUST be 1.0
  media_resolution?: MediaResolutionLevel;
  max_output_tokens?: number;
  response_mime_type?: 'text/plain' | 'application/json';
  response_json_schema?: Record<string, unknown>;
}
```

#### Updated Request Types
```typescript
export interface AIGenerationRequest {
  // ... existing fields ...
  thinking_level?: ThinkingLevel;
  previous_thought_signature?: string; // For multi-turn conversations
}

export interface AIImageRequest {
  // ... existing fields ...
  media_resolution?: MediaResolutionLevel;
}
```

#### Updated Response Types
```typescript
export interface AIContentGenerationResponse {
  // ... existing fields ...
  thought_signature?: string; // MUST be stored in database
  thinking_level_used?: ThinkingLevel;
}

export interface AIImageGenerationResponse {
  // ... existing fields ...
  thought_signature?: string;
  media_resolution_used?: MediaResolutionLevel;
}
```

### 3. Database Migration - Thought Signature Storage
**File**: `supabase/migrations/20251123000000_create_cms_tables.sql`
**Line**: 19

**Added Column**:
```sql
thought_signature text, -- Gemini 3 reasoning context (CRITICAL for follow-up edits)
```

**Purpose**: Store thought signatures to enable:
- Multi-turn editing sessions
- Consistent reasoning across edits
- Follow-up content refinements

### 4. Best Practices Guide
**File**: `lib/cms/GEMINI3_BEST_PRACTICES.md` (NEW)
**Lines**: 1-540

**Comprehensive Guide Including**:
- ✅ Critical configuration rules
- ✅ Thought signature implementation patterns
- ✅ Prompting best practices
- ✅ Structured outputs with tools
- ✅ Cost optimization strategies
- ✅ Common mistakes to avoid
- ✅ Implementation checklist

---

## 🎯 Critical Implementation Requirements

### 1. Temperature Configuration
```typescript
// ✅ ALWAYS use this
const config = {
  temperature: 1.0  // DO NOT CHANGE
};

// ❌ NEVER use lower values
const config = {
  temperature: 0.7  // Will break reasoning!
};
```

### 2. API Version for Media Features
```typescript
// ✅ REQUIRED for media_resolution
import { GoogleGenAI } from "@google/genai";

const client = new GoogleGenAI({
  apiVersion: 'v1alpha'  // Must use v1alpha
});
```

### 3. Thought Signature Handling
```typescript
// Step 1: Generate content
const response = await generateContent({
  model: 'gemini-3-pro-preview',
  contents: 'Write a blog post...'
});

// Step 2: Store thought signature
await db.pages.update({
  id: pageId,
  thought_signature: response.thoughtSignature
});

// Step 3: Use in follow-up requests
const editResponse = await generateContent({
  model: 'gemini-3-pro-preview',
  contents: [
    {
      role: 'model',
      parts: [{
        text: response.text,
        thoughtSignature: storedSignature  // CRITICAL!
      }]
    },
    {
      role: 'user',
      parts: [{ text: 'Make this shorter' }]
    }
  ]
});
```

**⚠️ Consequences of Missing Signatures**:
- **Function Calling**: 400 error (strict validation)
- **Text/Chat**: Degraded reasoning quality, context loss

### 4. Thinking Level Selection
```typescript
// For content generation (quality matters)
const config = {
  thinking_level: 'high'  // Best for landing pages, blogs
};

// For simple tasks (speed matters)
const config = {
  thinking_level: 'low'  // Best for drafts, summaries
};
```

**Note**: `medium` is not supported at launch

### 5. Media Resolution Strategy

**Recommendations**:
| Content Type | Resolution | Tokens | Rationale |
|--------------|-----------|--------|-----------|
| Marketing images | `high` | 1120 | Maximum quality for hero images |
| PDF documents | `medium` | 560 | Optimal for OCR |
| Video (general) | `low` | 70/frame | Sufficient for action recognition |
| Video (text-heavy) | `high` | 280/frame | Required for reading text in frames |

---

## 📊 Token Usage Impact

### Before (Generic Config)
```typescript
// Assuming default settings
const response = await generateContent({
  model: 'gemini-pro',  // Old model
  temperature: 0.7,
  contents: prompt
});
// Token usage: Variable, no control
```

### After (Gemini 3 Optimized)
```typescript
// With explicit controls
const response = await generateContent({
  model: 'gemini-3-pro-preview',
  temperature: 1.0,  // Required
  thinking_level: 'low',  // For faster responses
  media_resolution: 'media_resolution_medium',  // Balanced
  contents: prompt
});
// Token usage: 30-50% reduction for images/video with medium resolution
```

**Cost Savings**:
- **Images**: `high` (1120 tokens) → `medium` (560 tokens) = **50% reduction**
- **Video**: `high` (280/frame) → `low` (70/frame) = **75% reduction**

---

## 🔄 Migration from Gemini 2.5

If you have existing code using Gemini 2.5, update as follows:

### Temperature
```typescript
// Old (Gemini 2.5)
temperature: 0.7  // Common practice

// New (Gemini 3)
temperature: 1.0  // REQUIRED
```

### Model ID
```typescript
// Old
model: 'gemini-2.5-pro'

// New
model: 'gemini-3-pro-preview'
```

### API Version
```typescript
// Old (implicit v1beta)
const client = new GoogleGenAI();

// New (explicit v1alpha for media)
const client = new GoogleGenAI({ apiVersion: 'v1alpha' });
```

### Prompting
```typescript
// Old (chain-of-thought)
const prompt = `Let's think step-by-step:
1. First, analyze...
2. Then, consider...
3. Finally, synthesize...`;

// New (direct instruction)
const prompt = `Analyze the data and provide recommendations.`;
```

---

## 🚨 Common Pitfalls

### 1. Ignoring Thought Signatures
**Problem**: Follow-up edits produce inconsistent results
**Solution**: Always store and return thought signatures

### 2. Using Low Temperature
**Problem**: Infinite loops, poor reasoning quality
**Solution**: Keep temperature at 1.0

### 3. Wrong API Version
**Problem**: `media_resolution` parameter not recognized
**Solution**: Use `apiVersion: 'v1alpha'`

### 4. Over-Engineering Prompts
**Problem**: Verbose prompts confuse Gemini 3
**Solution**: Keep prompts concise and direct

---

## ✅ Implementation Checklist

When building the AI service layer (`lib/cms/ai-service.ts`):

- [ ] Set `model: 'gemini-3-pro-preview'`
- [ ] Set `temperature: 1.0` (never change)
- [ ] Use `apiVersion: 'v1alpha'` in client initialization
- [ ] Implement thought signature storage in database
- [ ] Return thought signatures in follow-up requests
- [ ] Use `thinking_level: 'high'` for content generation
- [ ] Use `media_resolution_high` for marketing images
- [ ] Keep prompts concise and direct
- [ ] Place data before questions in prompts
- [ ] Implement token usage tracking
- [ ] Set up rate limiting (20 gen/hour/user)
- [ ] Add cost estimation logic
- [ ] Enable Context Caching for product catalog

---

## 📚 References

**Official Documentation**:
- Gemini 3 Overview: https://ai.google.dev/gemini-api/docs/gemini-3
- Thought Signatures: https://ai.google.dev/gemini-api/docs/thought-signatures
- Media Resolution: https://ai.google.dev/gemini-api/docs/media-resolution
- Prompting Strategies: https://ai.google.dev/gemini-api/docs/prompting-strategies
- Context Caching: https://ai.google.dev/gemini-api/docs/caching

**Internal Documentation**:
- Best Practices: `lib/cms/GEMINI3_BEST_PRACTICES.md`
- Type Definitions: `lib/cms/types.ts`
- Feature Spec: `docs/features/2025-11-23_cms_no_code/Feature Specification_ AI-Powered No-Code CMS.md`

---

## 🎯 Next Steps

1. **Apply database migration** to add `thought_signature` column
2. **Configure `.env.local`** with your `GOOGLE_AI_API_KEY`
3. **Implement AI service layer** following Gemini 3 patterns
4. **Test thought signature** round-trip (generate → store → edit)
5. **Verify temperature** stays at 1.0 in all requests
6. **Monitor token usage** and costs

---

**Status**: Configuration complete, ready for Phase 2 implementation
**Last Updated**: 2025-11-23
**Maintained By**: CircleTel Development Team
