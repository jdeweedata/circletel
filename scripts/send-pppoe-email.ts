import { createClient } from '@supabase/supabase-js';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function sendEmail() {
  // Get sites from database
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { data: sites, error } = await supabase
    .from('corporate_sites')
    .select('site_number, account_number, site_name, province, pppoe_username, installation_address')
    .eq('corporate_id', '9b6b601f-9b51-42e7-8b97-af7ae9d3486e')
    .order('site_number');

  if (error) {
    console.error('Error fetching sites:', error);
    process.exit(1);
  }

  console.log(`Found ${sites.length} sites`);

  // Build HTML table
  const tableRows = sites.map(site => `
    <tr>
      <td style="padding: 8px; border: 1px solid #E5E7EB;">${site.site_number}</td>
      <td style="padding: 8px; border: 1px solid #E5E7EB;">${site.account_number}</td>
      <td style="padding: 8px; border: 1px solid #E5E7EB;">${site.site_name}</td>
      <td style="padding: 8px; border: 1px solid #E5E7EB;">${site.province}</td>
      <td style="padding: 8px; border: 1px solid #E5E7EB; font-family: monospace; background: #F9FAFB;"><strong>${site.pppoe_username}</strong></td>
      <td style="padding: 8px; border: 1px solid #E5E7EB;">${(site.installation_address as any)?.technology || '-'}</td>
    </tr>
  `).join('');

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #1F2937; }
    .header { background: linear-gradient(135deg, #F5841E, #D76026); padding: 20px; color: white; }
    .content { padding: 20px; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th { background: #1F2937; color: white; padding: 12px 8px; text-align: left; }
    tr:nth-child(even) { background: #F9FAFB; }
    .footer { background: #F3F4F6; padding: 15px; font-size: 12px; color: #6B7280; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0;">CircleTel - Unjani Clinics PPPoE Credentials</h1>
  </div>

  <div class="content">
    <p>Hi Jarryd,</p>

    <p>Please find below the PPPoE usernames for all <strong>25 Unjani Clinic sites</strong> that need to be created on Interstellio.</p>

    <p><strong>Action Required:</strong> Create these PPPoE credentials on the Interstellio portal with a secure password for each site.</p>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Account Number</th>
          <th>Site Name</th>
          <th>Province</th>
          <th>PPPoE Username</th>
          <th>Technology</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>

    <h3>Summary by Province:</h3>
    <ul>
      <li><strong>Gauteng:</strong> 14 sites</li>
      <li><strong>KwaZulu-Natal:</strong> 6 sites</li>
      <li><strong>Western Cape:</strong> 2 sites</li>
      <li><strong>Limpopo:</strong> 1 site</li>
      <li><strong>North West:</strong> 1 site</li>
      <li><strong>Free State:</strong> 1 site</li>
    </ul>

    <p>Please confirm once the credentials have been created, and we can proceed with the installation schedule.</p>

    <p>Best regards,<br>
    <strong>CircleTel Operations</strong></p>
  </div>

  <div class="footer">
    <p>This is an automated message from CircleTel. For questions, contact operations@circletel.co.za</p>
  </div>
</body>
</html>
`;

  // Send email via Resend
  console.log('Sending email...');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'CircleTel Operations <operations@notify.circletel.co.za>',
      to: 'jarrydj@intelliview.co.za',
      cc: ['jeffrey.de.wee@circletel.co.za'],
      subject: 'Unjani Clinics - PPPoE Credentials for Interstellio (25 Sites)',
      html: htmlContent,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Failed to send email:', error);
    process.exit(1);
  }

  const result = await response.json();
  console.log('✅ Email sent successfully!');
  console.log('Message ID:', result.id);
  console.log('To: jarrydj@intelliview.co.za');
  console.log('CC: jeffrey.de.wee@circletel.co.za');
}

sendEmail().catch(console.error);
