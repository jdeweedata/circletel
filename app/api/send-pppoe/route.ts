import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const resendKey = process.env.RESEND_API_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Missing Supabase config' }, { status: 500 });
    }

    if (!resendKey) {
      return NextResponse.json({ error: 'Missing Resend API key' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: sites, error } = await supabase
      .from('corporate_sites')
      .select('site_number, account_number, site_name, province, pppoe_username, installation_address')
      .eq('corporate_id', '9b6b601f-9b51-42e7-8b97-af7ae9d3486e')
      .order('site_number');

    if (error) {
      return NextResponse.json({ error: 'DB error', details: error.message }, { status: 500 });
    }

    const tableRows = sites?.map(site => {
      const tech = site.installation_address?.technology || '-';
      return `<tr>
        <td style="padding:8px;border:1px solid #E5E7EB">${site.site_number}</td>
        <td style="padding:8px;border:1px solid #E5E7EB">${site.account_number || '-'}</td>
        <td style="padding:8px;border:1px solid #E5E7EB">${site.site_name || '-'}</td>
        <td style="padding:8px;border:1px solid #E5E7EB">${site.province || '-'}</td>
        <td style="padding:8px;border:1px solid #E5E7EB;font-family:monospace;background:#F9FAFB"><strong>${site.pppoe_username || '-'}</strong></td>
        <td style="padding:8px;border:1px solid #E5E7EB">${tech}</td>
      </tr>`;
    }).join('') || '';

    const html = `<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;color:#1F2937}.header{background:linear-gradient(135deg,#F5841E,#D76026);padding:20px;color:white}table{border-collapse:collapse;width:100%;margin:20px 0}th{background:#1F2937;color:white;padding:12px 8px;text-align:left}tr:nth-child(even){background:#F9FAFB}.footer{background:#F3F4F6;padding:15px;font-size:12px;color:#6B7280}</style></head><body><div class="header"><h1 style="margin:0">CircleTel - Unjani Clinics PPPoE Credentials</h1></div><div style="padding:20px"><p>Hi Jarryd,</p><p>Please find below the PPPoE usernames for all <strong>${sites?.length || 0} Unjani Clinic sites</strong> that need to be created on Interstellio.</p><p><strong>Action Required:</strong> Create these PPPoE credentials on the Interstellio portal with a secure password for each site.</p><table><thead><tr><th>#</th><th>Account Number</th><th>Site Name</th><th>Province</th><th>PPPoE Username</th><th>Technology</th></tr></thead><tbody>${tableRows}</tbody></table><h3>Summary by Province:</h3><ul><li><strong>Gauteng:</strong> 14 sites</li><li><strong>KwaZulu-Natal:</strong> 6 sites</li><li><strong>Western Cape:</strong> 2 sites</li><li><strong>Limpopo:</strong> 1 site</li><li><strong>North West:</strong> 1 site</li><li><strong>Free State:</strong> 1 site</li></ul><p>Please confirm once the credentials have been created.</p><p>Best regards,<br><strong>CircleTel Operations</strong></p></div><div class="footer"><p>Automated message from CircleTel</p></div></body></html>`;

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'CircleTel Billing <billing@notify.circletel.co.za>',
        to: 'jarrydj@intelliview.co.za',
        cc: ['jeffrey.de.wee@circletel.co.za'],
        subject: `Unjani Clinics - PPPoE Credentials for Interstellio (${sites?.length || 0} Sites)`,
        html,
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      return NextResponse.json({ error: 'Email failed', details: errText }, { status: 500 });
    }

    const result = await emailRes.json();
    return NextResponse.json({
      success: true,
      messageId: result.id,
      to: 'jarrydj@intelliview.co.za',
      cc: 'jeffrey.de.wee@circletel.co.za',
      sites: sites?.length || 0
    });
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}
