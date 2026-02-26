import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// Types
// ============================================================================

interface ParsedLocation {
    address: string;
    latitude?: number;
    longitude?: number;
    notes?: string;
}

interface ParsedRequirements {
    bandwidth_mbps?: number;
    budget_max_rands?: number;
    contention?: 'best-effort' | '10:1' | '5:1' | '2:1' | 'dia';
    sla?: 'standard' | 'premium' | 'carrier_grade';
    failover_needed?: boolean;
    failover_bandwidth_mbps?: number;
    special_notes?: string;
}

interface ParsedContact {
    name?: string;
    email?: string;
    company?: string;
    phone?: string;
}

export interface ParseEmailResponse {
    success: boolean;
    data?: {
        locations: ParsedLocation[];
        requirements: ParsedRequirements;
        contact: ParsedContact;
        raw_summary: string;
    };
    error?: string;
}

// ============================================================================
// System Prompt
// ============================================================================

const SYSTEM_PROMPT = `You are a feasibility request parser for CircleTel, a South African ISP.

Extract structured data from feasibility request emails. These emails come from partners or sales agents requesting connectivity assessments for business locations.

IMPORTANT RULES:
- GPS coordinates may appear in various formats: decimal (-33.992024, 18.766900), degrees (-33.992024° 18.766900°), or DMS
- Convert ALL coordinate formats to decimal (lat, lng)
- South African coordinates: latitude is negative (-22 to -35), longitude is positive (16 to 33)
- If the email mentions "degrees" format like "-33.992024° 18.766900°", parse as lat=-33.992024, lng=18.766900
- Addresses should include city/suburb if mentioned
- Budget amounts are in South African Rands (ZAR). Strip "R" prefix and commas
- Contention ratios: map "dedicated" or "DIA" to "dia", "best effort" to "best-effort"
- SLA: map "carrier grade" to "carrier_grade"
- If multiple sites are mentioned, extract ALL of them
- If bandwidth is mentioned as a range (e.g., "100-200Mb"), use the minimum value
- Look for sender name, email, company in the email signature or greeting

Return ONLY valid JSON matching this exact schema:
{
  "locations": [
    {
      "address": "string - full address or GPS as 'lat, lng' string",
      "latitude": number | null,
      "longitude": number | null,
      "notes": "string | null - any site-specific notes"
    }
  ],
  "requirements": {
    "bandwidth_mbps": number | null,
    "budget_max_rands": number | null,
    "contention": "best-effort" | "10:1" | "5:1" | "2:1" | "dia" | null,
    "sla": "standard" | "premium" | "carrier_grade" | null,
    "failover_needed": boolean,
    "failover_bandwidth_mbps": number | null,
    "special_notes": "string | null - any requirements not captured above"
  },
  "contact": {
    "name": "string | null",
    "email": "string | null",
    "company": "string | null",
    "phone": "string | null"
  },
  "raw_summary": "string - 1-2 sentence summary of the request"
}

Return ONLY the JSON object. No markdown, no explanation, no code blocks.`;

// ============================================================================
// API Route - Uses REST API directly (same pattern as AI Assistant route)
// ============================================================================

// Diagnostic GET to check env var availability
export async function GET() {
    const googleKey = process.env.GOOGLE_AI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    const hasGoogleKey = !!googleKey && googleKey !== 'your_gemini_api_key_here';
    const hasGeminiKey = !!geminiKey && geminiKey !== 'your_gemini_api_key_here';

    return NextResponse.json({
        status: hasGoogleKey || hasGeminiKey ? 'configured' : 'not_configured',
        GOOGLE_AI_API_KEY: hasGoogleKey ? `set (${googleKey?.substring(0, 6)}...)` : `missing_or_placeholder`,
        GEMINI_API_KEY: hasGeminiKey ? `set (${geminiKey?.substring(0, 6)}...)` : `missing_or_placeholder`,
        env_keys_containing_AI: Object.keys(process.env).filter(k => k.includes('AI') || k.includes('GEMINI')).join(', '),
    });
}

export async function POST(request: NextRequest): Promise<NextResponse<ParseEmailResponse>> {
    try {
        const body = await request.json();
        const { emailText } = body;

        if (!emailText || typeof emailText !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Email text is required' },
                { status: 400 }
            );
        }

        if (emailText.length > 20000) {
            return NextResponse.json(
                { success: false, error: 'Email text is too long (max 20,000 characters)' },
                { status: 400 }
            );
        }

        // Get API key - check both env var names
        const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;

        // Debug: log which keys are available (will show in Vercel function logs)
        console.log('[parse-email] ENV check:', {
            hasGOOGLE_AI_API_KEY: !!process.env.GOOGLE_AI_API_KEY,
            hasGEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
            keyPrefix: apiKey ? apiKey.substring(0, 8) : 'NONE',
            allAIKeys: Object.keys(process.env).filter(k => k.includes('AI') || k.includes('GEMINI')),
        });

        if (!apiKey) {
            return NextResponse.json(
                { success: false, error: 'AI service not configured. Contact administrator.' },
                { status: 503 }
            );
        }

        // Use REST API directly (same approach as the working AI Assistant route)
        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            role: 'user',
                            parts: [
                                { text: `Parse this feasibility request email:\n\n---\n${emailText}\n---` },
                            ],
                        },
                    ],
                    systemInstruction: {
                        parts: [{ text: SYSTEM_PROMPT }],
                    },
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 2048,
                        responseMimeType: 'application/json',
                    },
                }),
            }
        );

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            console.error('[parse-email] Gemini API error:', geminiResponse.status, errorText);

            let errorMessage = 'Failed to parse email. Please try again.';
            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.error?.message?.includes('API key')) {
                    errorMessage = 'AI service API key is invalid. Contact administrator.';
                } else if (errorJson.error?.message?.includes('quota')) {
                    errorMessage = 'AI service quota exceeded. Try again later.';
                }
            } catch {
                // Keep default error message
            }

            return NextResponse.json(
                { success: false, error: errorMessage },
                { status: 502 }
            );
        }

        const data = await geminiResponse.json();
        const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!responseText) {
            console.error('[parse-email] Empty Gemini response');
            return NextResponse.json(
                { success: false, error: 'AI returned an empty response. Please try again.' },
                { status: 502 }
            );
        }

        // Parse the JSON response
        let parsed;
        try {
            // Strip markdown code blocks if present
            const cleanJson = responseText
                .replace(/^```(?:json)?\s*/i, '')
                .replace(/```\s*$/, '')
                .trim();
            parsed = JSON.parse(cleanJson);
        } catch {
            console.error('[parse-email] Failed to parse Gemini JSON:', responseText);
            return NextResponse.json(
                { success: false, error: 'AI response could not be parsed. Please try again.' },
                { status: 502 }
            );
        }

        // Validate the parsed structure has at minimum a locations array
        if (!parsed.locations || !Array.isArray(parsed.locations)) {
            return NextResponse.json(
                { success: false, error: 'Could not extract locations from the email. Please check the email content.' },
                { status: 422 }
            );
        }

        // Normalize coordinates - ensure lat/lng are valid numbers
        parsed.locations = parsed.locations.map((loc: ParsedLocation) => ({
            ...loc,
            latitude: typeof loc.latitude === 'number' && isFinite(loc.latitude) ? loc.latitude : null,
            longitude: typeof loc.longitude === 'number' && isFinite(loc.longitude) ? loc.longitude : null,
        }));

        return NextResponse.json({
            success: true,
            data: {
                locations: parsed.locations,
                requirements: parsed.requirements || {},
                contact: parsed.contact || {},
                raw_summary: parsed.raw_summary || 'Feasibility request parsed',
            },
        });
    } catch (error) {
        console.error('[parse-email] Error:', error);
        const message = error instanceof Error ? error.message : 'Failed to parse email';

        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}
