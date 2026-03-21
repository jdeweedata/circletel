import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createZohoCRMService } from '@/lib/integrations/zoho/crm-service';

// Lazy-initialize Gemini SDK to avoid build-time crash when env var is missing
let _ai: GoogleGenAI | null = null;
function getAI() {
  if (!_ai) _ai = new GoogleGenAI({});
  return _ai;
}
const zohoService = createZohoCRMService();

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, phone, company, employees, message } = body;

        if (!name || !email || !company) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Call Gemini 3 Flash to score the lead
        const prompt = `
    Analyze the following inbound lead for an MSP (Managed IT Services Provider):
    Company: ${company}
    Employees: ${employees}
    Message: ${message}

    Return a JSON object with:
    - "leadScore": number from 1-100. Higher score for larger companies (e.g. 50+ employees) and high intent (requesting specific services like M365 migration or security audits).
    - "intent": string ('High', 'Medium', 'Low').
    - "category": string (e.g., 'IT Support', 'Infrastructure Migration', 'Cybersecurity', 'General Inquiry').
    - "summary": string (1 sentence summary of their primary need).
    `;

        let aiResult = { leadScore: 50, intent: 'Medium', category: 'General Inquiry', summary: 'Failed to generate summary' };

        try {
            const response = await getAI().models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                }
            });

            if (response.text) {
                aiResult = JSON.parse(response.text);
            }
        } catch (aiError) {
            console.error('Gemini API Error:', aiError);
            // Fallback behavior: continue to create the lead even if AI scoring fails
        }

        // Parse Name
        const nameParts = name.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '[No Last Name]';

        // Push to Zoho CRM
        const zohoId = await zohoService.createLead({
            First_Name: firstName,
            Last_Name: lastName,
            Email: email,
            Phone: phone,
            Company: company,
            No_of_Employees: employees,
            Description: `[AI Summary: ${aiResult.summary}] Original Message: ${message}`,
            Lead_Source: 'Website Consultation Form',
            Lead_Status: 'Not Contacted',
            Lead_Score: aiResult.leadScore,
            Lead_Intent: aiResult.intent,
            Product_Category: aiResult.category,
        });

        return NextResponse.json({ success: true, zohoId, aiResult });
    } catch (error) {
        console.error('Lead Generation Route Error:', error);
        return NextResponse.json({ error: 'Failed to process lead' }, { status: 500 });
    }
}
