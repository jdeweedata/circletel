import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@/lib/supabase/server';
import { createClient as createSSRClient } from '@/integrations/supabase/server';

// Types for the chat request
interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

interface ChatRequest {
  message: string;
  history: ChatMessage[];
}

interface Integration {
  id: string;
  name: string;
  slug: string;
  category: string;
  health_status: 'healthy' | 'degraded' | 'down' | 'unknown';
  description: string;
  is_enabled: boolean;
  consecutive_failures: number;
  health_last_checked_at: string | null;
}

interface HealthSummary {
  total: number;
  healthy: number;
  degraded: number;
  down: number;
  unknown: number;
}

// Fetch real integration data from the database
async function fetchIntegrationData(): Promise<{
  integrations: Integration[];
  summary: HealthSummary;
}> {
  try {
    const supabase = await createServiceClient();

    const { data: rawIntegrations, error } = await supabase
      .from('integration_registry')
      .select(`
        id,
        slug,
        name,
        description,
        integration_type,
        health_status,
        last_health_check_at,
        consecutive_failures,
        is_active
      `)
      .order('name');

    if (error) {
      console.error('Error fetching integrations:', error);
      return { integrations: [], summary: { total: 0, healthy: 0, degraded: 0, down: 0, unknown: 0 } };
    }

    // Map to the expected format
    const integrations: Integration[] = (rawIntegrations || []).map(i => ({
      id: i.id,
      name: i.name,
      slug: i.slug,
      category: i.integration_type,
      health_status: i.health_status || 'unknown',
      description: i.description || '',
      is_enabled: i.is_active,
      consecutive_failures: i.consecutive_failures || 0,
      health_last_checked_at: i.last_health_check_at,
    }));

    const summary: HealthSummary = {
      total: integrations.length,
      healthy: integrations.filter(i => i.health_status === 'healthy').length,
      degraded: integrations.filter(i => i.health_status === 'degraded').length,
      down: integrations.filter(i => i.health_status === 'down').length,
      unknown: integrations.filter(i => i.health_status === 'unknown').length,
    };

    return { integrations, summary };
  } catch (err) {
    console.error('Error in fetchIntegrationData:', err);
    return { integrations: [], summary: { total: 0, healthy: 0, degraded: 0, down: 0, unknown: 0 } };
  }
}

// Build the system prompt with real integration data
function buildSystemPrompt(integrations: Integration[], summary: HealthSummary): string {
  const downIntegrations = integrations.filter(i => i.health_status === 'down');
  const degradedIntegrations = integrations.filter(i => i.health_status === 'degraded');
  const highFailureIntegrations = integrations.filter(i => i.consecutive_failures >= 3);

  return `You are the CircleTel Integration Assistant, an AI helper embedded in the admin dashboard for CircleTel, a B2B/B2C ISP in South Africa.

CURRENT DASHBOARD STATUS:
- Total Integrations: ${summary.total}
- Healthy: ${summary.healthy}
- Degraded: ${summary.degraded}
- Down: ${summary.down}
- Unknown: ${summary.unknown}

${downIntegrations.length > 0 ? `
CRITICAL - INTEGRATIONS DOWN:
${downIntegrations.map(i => `- ${i.name}: ${i.consecutive_failures} consecutive failures. ${i.description}`).join('\n')}
` : ''}

${degradedIntegrations.length > 0 ? `
WARNING - DEGRADED INTEGRATIONS:
${degradedIntegrations.map(i => `- ${i.name}: ${i.description}`).join('\n')}
` : ''}

${highFailureIntegrations.length > 0 ? `
ATTENTION - HIGH FAILURE COUNT:
${highFailureIntegrations.map(i => `- ${i.name}: ${i.consecutive_failures} consecutive failures`).join('\n')}
` : ''}

ALL INTEGRATIONS:
${integrations.map(i => `- ${i.name} (${i.category}): ${i.health_status}${i.consecutive_failures > 0 ? ` - ${i.consecutive_failures} failures` : ''}`).join('\n')}

INTEGRATION CATEGORIES:
- api_key: API Key based integrations (Clickatell SMS, Resend Email, Google Maps, MTN Coverage)
- oauth: OAuth-based integrations (Zoho Billing, Zoho CRM, Zoho Sign)
- webhook_only: Webhook-only integrations (Didit KYC)

YOUR CAPABILITIES:
1. Explain integration health status and what it means
2. Suggest troubleshooting steps for down/degraded integrations
3. Answer questions about integration configuration
4. Provide guidance on OAuth re-authentication
5. Explain webhook delivery and retry mechanisms
6. Help diagnose Zoho sync issues

TROUBLESHOOTING GUIDANCE:
- For OAuth integrations (Zoho): Suggest re-authenticating if token expired, check Zoho API console
- For API Key integrations: Verify key is valid, check rate limits, test endpoint manually
- For Webhook integrations: Check webhook URL accessibility, verify signature validation
- For consecutive failures: Check logs, verify credentials, test connectivity

RESPONSE STYLE:
- Be concise and professional
- Use bullet points for multiple items
- Provide actionable next steps
- Reference specific integration names
- If unsure, acknowledge limitations`;
}

export async function POST(request: NextRequest) {
  try {
    // =========================================================================
    // Authentication
    // =========================================================================
    const supabaseSSR = await createSSRClient();
    const {
      data: { user },
      error: authError,
    } = await supabaseSSR.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check for Gemini API key
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'AI Assistant not configured',
          message: 'Please add GEMINI_API_KEY to your environment variables.'
        },
        { status: 503 }
      );
    }

    // Parse the request body
    const body: ChatRequest = await request.json();
    const { message, history = [] } = body;

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Fetch real integration data
    const { integrations, summary } = await fetchIntegrationData();

    // Build the system prompt with real data
    const systemPrompt = buildSystemPrompt(integrations, summary);

    // Build the conversation history for Gemini
    const contents = [
      // Add history if present
      ...history.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      })),
      // Add current message
      {
        role: 'user',
        parts: [{ text: message }]
      }
    ];

    // Call Gemini API with streaming
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          ],
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', geminiResponse.status, errorText);

      return NextResponse.json(
        {
          error: 'AI service error',
          message: 'Failed to get response from AI. Please try again.'
        },
        { status: 502 }
      );
    }

    // Create a streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = geminiResponse.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Split by newlines and process complete JSON objects
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed === '[' || trimmed === ']' || trimmed === ',') continue;

              // Remove leading comma if present
              const jsonStr = trimmed.startsWith(',') ? trimmed.slice(1) : trimmed;

              try {
                const parsed = JSON.parse(jsonStr);
                const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                }
              } catch {
                // Not a complete JSON object yet, continue
              }
            }
          }

          // Process any remaining buffer
          if (buffer.trim()) {
            const jsonStr = buffer.trim().startsWith(',') ? buffer.trim().slice(1) : buffer.trim();
            try {
              const parsed = JSON.parse(jsonStr);
              const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
              }
            } catch {
              // Ignore incomplete JSON
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (err) {
          console.error('Stream processing error:', err);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream processing error' })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('AI Assistant error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred. Please try again.'
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  const hasApiKey = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY);

  return NextResponse.json({
    status: hasApiKey ? 'available' : 'not_configured',
    message: hasApiKey
      ? 'AI Assistant is ready'
      : 'GEMINI_API_KEY not configured',
  });
}
