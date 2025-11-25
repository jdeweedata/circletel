import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GenerationParams, PageContent } from "../types";

// Ensure API Key is available
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const pageSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    hero: {
      type: Type.OBJECT,
      properties: {
        headline: { type: Type.STRING },
        subheadline: { type: Type.STRING },
        cta: { type: Type.STRING },
      },
      required: ["headline", "subheadline", "cta"],
    },
    sections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          heading: { type: Type.STRING },
          content: { type: Type.STRING, description: "HTML content for the section body (p, ul, li tags only)" },
        },
        required: ["heading", "content"],
      },
    },
    seo: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
      },
      required: ["title", "description"],
    },
    image_prompt: { type: Type.STRING, description: "A detailed visual description for an AI image generator to create a hero background image." },
  },
  required: ["hero", "sections", "seo", "image_prompt"],
};

const improvementSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    refinedTopic: { type: Type.STRING, description: "A more descriptive, engaging, and professional version of the user's topic." },
    targetAudience: { type: Type.STRING, description: "A specific target audience suitable for this topic." },
    keywords: { type: Type.STRING, description: "5 comma-separated high-value keywords relevant to the topic." },
  },
  required: ["refinedTopic", "targetAudience", "keywords"],
};

export const improvePrompt = async (currentTopic: string, type: string): Promise<{ refinedTopic: string; targetAudience: string; keywords: string }> => {
  if (!apiKey) throw new Error("API Key is missing.");
  const model = "gemini-2.5-flash";

  const prompt = `
    You are an expert content strategist. 
    The user wants to create a ${type} about: "${currentTopic}".
    
    1. Improve the 'topic' to be more specific, descriptive, and compelling.
    2. Identify a clear 'targetAudience'.
    3. Suggest 5 relevant 'keywords'.
    
    Return strict JSON matching the schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: improvementSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No improvement generated");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Improvement Error:", error);
    throw error;
  }
};

export const generatePageContent = async (params: GenerationParams): Promise<PageContent> => {
  if (!apiKey) throw new Error("API Key is missing. Please set process.env.API_KEY.");

  const model = "gemini-2.5-flash";
  
  let prompt = `Act as an expert content creator. Create a high-quality ${params.type} about "${params.topic}".\nTone: ${params.tone}.`;

  if (params.targetAudience?.trim()) {
    prompt += `\nTarget Audience: ${params.targetAudience}.`;
  }

  if (params.keywords?.trim()) {
    prompt += `\nKeywords to include: ${params.keywords}.`;
  }

  if (params.imageStyle?.trim()) {
    prompt += `\nPreferred Visual Style for images: ${params.imageStyle}. Ensure the 'image_prompt' reflects this style description significantly.`;
  }

  prompt += `\n\nEnsure the content is engaging, well-structured, and suitable for a modern website. Follow the JSON schema strictly.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: pageSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No content generated");
    
    return JSON.parse(text) as PageContent;
  } catch (error) {
    console.error("Gemini Content Generation Error:", error);
    throw error;
  }
};

export const generateImage = async (prompt: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing.");

  // Using gemini-3-pro-image-preview for high-quality image generation
  const model = "gemini-3-pro-image-preview";

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        { text: prompt }
      ],
      config: {
        imageConfig: {
          imageSize: "2K",
          aspectRatio: "16:9"
        }
      }
    });

    // Check for inlineData (base64)
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
           return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    
    // Fallback if no image generated (or model refused)
    return `https://picsum.photos/1200/800?random=${Math.floor(Math.random() * 1000)}`;

  } catch (error) {
    console.error("Gemini Image Generation Error:", error);
    // Fallback on error
    return `https://picsum.photos/1200/800?random=${Math.floor(Math.random() * 1000)}`;
  }
};