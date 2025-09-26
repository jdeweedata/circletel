import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface EmailNotificationData {
  // Audit details
  clinicName: string;
  province: string;
  contactName: string;
  contactEmail: string;
  migrationPriority: string;
  contractStatus: string;
  auditDate: string;
  submissionId: string;

  // Recipients
  notifyTeam?: boolean;
  notifyClient?: boolean;
  customRecipients?: string[];
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

function generateTeamEmailTemplate(data: EmailNotificationData): EmailTemplate {
  const priorityColor = data.migrationPriority === 'high' ? '#ef4444' :
                       data.migrationPriority === 'medium' ? '#f59e0b' : '#10b981';

  return {
    subject: `🏥 New Unjani Audit: ${data.clinicName} - ${data.migrationPriority.toUpperCase()} Priority`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Unjani Clinic Audit Notification</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

          <!-- Header -->
          <div style="background: linear-gradient(135deg, #F5831F, #ff8c42); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">
              🏥 New Unjani Clinic Audit Submitted
            </h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
              CircleTel & ThinkWiFi Rollout Planning
            </p>
          </div>

          <!-- Priority Alert -->
          <div style="background-color: ${priorityColor}; color: white; padding: 15px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
            <h2 style="margin: 0; font-size: 18px;">
              🚨 ${data.migrationPriority.toUpperCase()} PRIORITY SITE
            </h2>
          </div>

          <!-- Clinic Details -->
          <div style="background-color: #f8fafc; padding: 25px; border-radius: 12px; margin-bottom: 25px;">
            <h3 style="color: #F5831F; margin-top: 0; margin-bottom: 20px; font-size: 18px; border-bottom: 2px solid #F5831F; padding-bottom: 10px;">
              📍 Clinic Information
            </h3>

            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #64748b; width: 40%;">Clinic Name:</td>
                <td style="padding: 8px 0; color: #1e293b;"><strong>${data.clinicName}</strong></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #64748b;">Province:</td>
                <td style="padding: 8px 0; color: #1e293b;">${data.province}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #64748b;">Audit Date:</td>
                <td style="padding: 8px 0; color: #1e293b;">${new Date(data.auditDate).toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #64748b;">Contract Status:</td>
                <td style="padding: 8px 0; color: #1e293b;">${data.contractStatus}</td>
              </tr>
            </table>
          </div>

          <!-- Contact Details -->
          <div style="background-color: #fff; border: 1px solid #e2e8f0; padding: 25px; border-radius: 12px; margin-bottom: 25px;">
            <h3 style="color: #F5831F; margin-top: 0; margin-bottom: 20px; font-size: 18px; border-bottom: 2px solid #F5831F; padding-bottom: 10px;">
              👤 Site Contact
            </h3>

            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #64748b; width: 40%;">Contact Person:</td>
                <td style="padding: 8px 0; color: #1e293b;"><strong>${data.contactName}</strong></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #64748b;">Email:</td>
                <td style="padding: 8px 0; color: #1e293b;">
                  <a href="mailto:${data.contactEmail}" style="color: #F5831F; text-decoration: none;">${data.contactEmail}</a>
                </td>
              </tr>
            </table>
          </div>

          <!-- Action Items -->
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h4 style="color: #92400e; margin-top: 0; margin-bottom: 15px;">⚡ Next Steps</h4>
            <ul style="color: #92400e; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Review full audit details in Supabase dashboard</li>
              <li style="margin-bottom: 8px;">Schedule migration planning session</li>
              <li style="margin-bottom: 8px;">Contact site for technical assessment</li>
              <li>Update rollout timeline and priorities</li>
            </ul>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">
            <p style="margin: 0;">
              <strong>CircleTel Unjani Rollout Team</strong><br>
              Submission ID: <code>${data.submissionId}</code><br>
              <em>This is an automated notification from the Unjani audit system.</em>
            </p>
          </div>

        </body>
      </html>
    `,
    text: `
🏥 NEW UNJANI CLINIC AUDIT SUBMITTED

Priority: ${data.migrationPriority.toUpperCase()}
Clinic: ${data.clinicName}
Province: ${data.province}
Audit Date: ${new Date(data.auditDate).toLocaleDateString()}
Contract Status: ${data.contractStatus}

Contact: ${data.contactName}
Email: ${data.contactEmail}

Next Steps:
- Review full audit details in Supabase dashboard
- Schedule migration planning session
- Contact site for technical assessment
- Update rollout timeline and priorities

Submission ID: ${data.submissionId}
CircleTel Unjani Rollout Team
    `
  };
}

function generateClientConfirmationTemplate(data: EmailNotificationData): EmailTemplate {
  return {
    subject: `Thank you for your Network Assessment - ${data.clinicName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Audit Confirmation</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

          <!-- Header -->
          <div style="background: white; border: 1px solid #e2e8f0; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <img src="https://unjaniclinic.com/wp-content/uploads/2025/03/unjani-logo.png" alt="Unjani Clinic" style="height: 60px; margin-bottom: 20px;" />
            <h1 style="color: #1e293b; margin: 0; font-size: 24px; font-weight: 600;">
              Thank You for Your Network Assessment
            </h1>
            <p style="color: #64748b; margin: 10px 0 0 0; font-size: 16px;">
              ${data.clinicName} - Next Steps Outlined Below
            </p>
          </div>

          <!-- Confirmation Message -->
          <div style="padding: 30px 0; margin-bottom: 30px;">
            <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">
              Network Assessment Successfully Submitted
            </h2>
            <p style="color: #475569; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
              Dear ${data.contactName},
            </p>
            <p style="color: #475569; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
              Thank you for taking the time to complete the network assessment for <strong>${data.clinicName}</strong>.
              Your information has been successfully submitted and is now in our technical review queue.
            </p>
            <p style="color: #475569; margin: 0; font-size: 16px; line-height: 1.6;">
              <strong>What's Next:</strong> Our CircleTel technical team will carefully review your current network setup
              and contact you within <strong>2-3 business days</strong> to discuss your customized migration plan and next steps.
            </p>
          </div>

          <!-- What Happens Next -->
          <div style="padding: 30px 0; margin-bottom: 30px; border-top: 1px solid #e2e8f0;">
            <h3 style="color: #1e293b; margin: 0 0 30px 0; font-size: 18px; font-weight: 600;">
              Your Migration Journey - Next Steps
            </h3>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr>
                <td style="width: 40px; vertical-align: top; padding: 0 20px 25px 0;">
                  <div style="background-color: #1e293b; color: white; border-radius: 50%; width: 30px; height: 30px; text-align: center; line-height: 30px; font-weight: bold; font-size: 14px;">1</div>
                </td>
                <td style="vertical-align: top; padding: 0 0 25px 0;">
                  <h4 style="color: #1e293b; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">Technical Assessment (Days 1-2)</h4>
                  <p style="color: #64748b; margin: 0; font-size: 14px; line-height: 1.5;">Our engineers analyze your current network setup, contract status, and migration requirements</p>
                </td>
              </tr>
              <tr>
                <td style="width: 40px; vertical-align: top; padding: 0 20px 25px 0;">
                  <div style="background-color: #1e293b; color: white; border-radius: 50%; width: 30px; height: 30px; text-align: center; line-height: 30px; font-weight: bold; font-size: 14px;">2</div>
                </td>
                <td style="vertical-align: top; padding: 0 0 25px 0;">
                  <h4 style="color: #1e293b; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">Consultation & Planning (Day 3)</h4>
                  <p style="color: #64748b; margin: 0; font-size: 14px; line-height: 1.5;">We contact you to discuss findings and create a customized network solution for your clinic</p>
                </td>
              </tr>
              <tr>
                <td style="width: 40px; vertical-align: top; padding: 0 20px 0 0;">
                  <div style="background-color: #1e293b; color: white; border-radius: 50%; width: 30px; height: 30px; text-align: center; line-height: 30px; font-weight: bold; font-size: 14px;">3</div>
                </td>
                <td style="vertical-align: top; padding: 0;">
                  <h4 style="color: #1e293b; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">Professional Installation</h4>
                  <p style="color: #64748b; margin: 0; font-size: 14px; line-height: 1.5;">Scheduled installation of your new network with minimal disruption to clinic operations</p>
                </td>
              </tr>
            </table>
          </div>

          <!-- Contact Information -->
          <div style="padding: 30px 0; margin-bottom: 30px; border-top: 1px solid #e2e8f0;">
            <h3 style="color: #1e293b; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">
              Questions or Concerns?
            </h3>
            <p style="color: #475569; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
              Our dedicated Unjani support team is here to help! If you have any questions about your assessment,
              the migration process, or need to update any information, please reach out to us:
            </p>
            <p style="color: #1e293b; margin: 0; font-size: 16px;">
              <strong>CircleTel Unjani Support Team</strong><br>
              Email: <a href="mailto:unjaniclinic@circletel.co.za" style="color: #1e293b; text-decoration: underline;">unjaniclinic@circletel.co.za</a>
            </p>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding: 30px 0; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">
            <p style="margin: 0 0 10px 0;">
              <strong style="color: #1e293b;">CircleTel Partnership</strong>
            </p>
            <p style="margin: 0; color: #94a3b8;">
              Assessment Reference: <strong style="color: #64748b;">${data.submissionId}</strong><br>
              <em>Please save this reference number for your records.</em>
            </p>
          </div>

        </body>
      </html>
    `,
    text: `
THANK YOU FOR YOUR NETWORK ASSESSMENT

Dear ${data.contactName},

Thank you for taking the time to complete the network assessment for ${data.clinicName}.

Your information has been successfully submitted and is now in our technical review queue. Our CircleTel technical team will carefully review your current network setup and contact you within 2-3 business days to discuss your customized migration plan and next steps.

YOUR MIGRATION JOURNEY - NEXT STEPS:

1. Technical Assessment (Days 1-2)
   Our engineers analyze your current network setup, contract status, and migration requirements

2. Consultation & Planning (Day 3)
   We contact you to discuss findings and create a customized network solution for your clinic

3. Professional Installation
   Scheduled installation of your new network with minimal disruption to clinic operations

QUESTIONS OR CONCERNS?
Our dedicated Unjani support team is here to help! If you have any questions about your assessment, the migration process, or need to update any information, please reach out to us:

CircleTel Unjani Support Team
Email: unjaniclinic@circletel.co.za

Assessment Reference: ${data.submissionId}
Please save this reference number for your records.

CircleTel & ThinkWiFi Partnership
    `
  };
}

async function sendEmail(to: string[], template: EmailTemplate) {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const domain = Deno.env.get('CIRCLETEL_DOMAIN') || 'circletelsa.co.za';
  const supportEmail = Deno.env.get('UNJANI_SUPPORT_EMAIL') || 'unjaniclinic@circletel.co.za';

  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `CircleTel Unjani <noreply@${domain}>`,
      reply_to: supportEmail,
      to: to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  return await response.json();
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const emailData: EmailNotificationData = await req.json();

    // Validate required fields
    const requiredFields = ['clinicName', 'contactName', 'contactEmail', 'submissionId'];
    for (const field of requiredFields) {
      if (!emailData[field as keyof EmailNotificationData]) {
        return new Response(
          JSON.stringify({ error: `Missing required field: ${field}` }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    const results = [];

    // Send team notification
    if (emailData.notifyTeam !== false) {
      const teamTemplate = generateTeamEmailTemplate(emailData);
      const teamEmailsEnv = Deno.env.get('UNJANI_TEAM_EMAILS');
      const teamEmails = teamEmailsEnv ? teamEmailsEnv.split(',').map(email => email.trim()) : [
        'unjani-team@circletelsa.co.za',
        'rollout@circletelsa.co.za'
      ];

      try {
        const teamResult = await sendEmail(teamEmails, teamTemplate);
        results.push({ type: 'team', success: true, result: teamResult });
      } catch (error) {
        console.error('Failed to send team notification:', error);
        results.push({ type: 'team', success: false, error: error.message });
      }
    }

    // Send client confirmation
    if (emailData.notifyClient !== false) {
      const clientTemplate = generateClientConfirmationTemplate(emailData);

      try {
        const clientResult = await sendEmail([emailData.contactEmail], clientTemplate);
        results.push({ type: 'client', success: true, result: clientResult });
      } catch (error) {
        console.error('Failed to send client confirmation:', error);
        results.push({ type: 'client', success: false, error: error.message });
      }
    }

    // Send to custom recipients if specified
    if (emailData.customRecipients && emailData.customRecipients.length > 0) {
      const teamTemplate = generateTeamEmailTemplate(emailData);

      try {
        const customResult = await sendEmail(emailData.customRecipients, teamTemplate);
        results.push({ type: 'custom', success: true, result: customResult });
      } catch (error) {
        console.error('Failed to send custom notifications:', error);
        results.push({ type: 'custom', success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    return new Response(
      JSON.stringify({
        success: successCount > 0,
        message: `Email notifications sent successfully (${successCount}/${totalCount})`,
        results: results
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});