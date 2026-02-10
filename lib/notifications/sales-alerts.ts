/**
 * Sales Team Alerts Service
 * Sends notifications to sales team and creates Zoho CRM leads for new coverage inquiries
 */

import { ZohoAPIClient } from '@/lib/zoho-api-client';
import { EmailNotificationService } from '@/lib/notifications/notification-service';
import { SmsChannel } from '@/lib/notifications/channels/sms-channel';
import { createClient } from '@/lib/supabase/server';
import { notificationLogger } from '@/lib/logging';

// Helper to get Supabase client (lazy initialization)
async function getSupabase() {
  return await createClient();
}

// Sales team configuration from environment variables
const SALES_TEAM_EMAIL = process.env.SALES_TEAM_EMAIL || 'sales@circletel.co.za';
const SALES_TEAM_PHONE = process.env.SALES_TEAM_PHONE || '+27824873900';
const SLACK_WEBHOOK_URL = process.env.SLACK_SALES_WEBHOOK_URL;
const ENABLE_SALES_ALERTS = process.env.ENABLE_SALES_ALERTS !== 'false'; // Enabled by default
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

export interface CoverageLeadData {
  id: string;
  customer_type: 'consumer' | 'smme' | 'enterprise' | 'wholesale';
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company_name?: string;
  address: string;
  suburb?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  requested_service_type?: string;
  requested_speed?: string;
  budget_range?: string;
  coordinates?: { lat: number; lng: number };
  coverage_available?: boolean;
  lead_source?: string;
  source_campaign?: string;
}

export interface BusinessQuoteData {
  lead_id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  requested_service: string;
  number_of_users?: number;
  budget?: string;
  urgency?: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface SalesAlertResult {
  success: boolean;
  emailSent?: boolean;
  smsSent?: boolean;
  slackSent?: boolean;
  zohoLeadId?: string;
  errors?: string[];
}

/**
 * Send coverage lead alert to sales team
 * Creates Zoho CRM lead and sends email/SMS notifications
 */
export async function sendCoverageLeadAlert(
  leadData: CoverageLeadData
): Promise<SalesAlertResult> {
  // Skip in development unless explicitly enabled
  if (IS_DEVELOPMENT && !ENABLE_SALES_ALERTS) {
    notificationLogger.debug('DEV MODE: Sales alert skipped', { email: leadData.email });
    return {
      success: true,
      emailSent: false,
      smsSent: false,
      zohoLeadId: undefined,
    };
  }

  const result: SalesAlertResult = {
    success: false,
    errors: [],
  };

  try {
    // Step 1: Create Zoho CRM Lead
    const zohoResult = await createZohoCRMLead(leadData);
    result.zohoLeadId = zohoResult.leadId;

    if (zohoResult.success) {
      // Update coverage_leads table with Zoho ID
      const supabase = await getSupabase();
      await supabase
        .from('coverage_leads')
        .update({
          zoho_lead_id: zohoResult.leadId,
          zoho_synced_at: new Date().toISOString(),
          zoho_sync_status: 'success',
          zoho_sync_error: null,
        })
        .eq('id', leadData.id);
    } else {
      // Log Zoho sync failure but continue with alerts
      const supabase = await getSupabase();
      await supabase
        .from('coverage_leads')
        .update({
          zoho_sync_status: 'failed',
          zoho_sync_error: zohoResult.error || 'Unknown error',
        })
        .eq('id', leadData.id);

      result.errors?.push(`Zoho CRM sync failed: ${zohoResult.error}`);
    }

    // Step 2: Send Email Alert to Sales Team
    try {
      const emailResult = await EmailNotificationService.sendEmail({
        to: SALES_TEAM_EMAIL,
        subject: `🔔 New ${getCustomerTypeLabel(leadData.customer_type)} Lead: ${leadData.first_name} ${leadData.last_name}`,
        template: 'sales_coverage_lead_alert',
        data: {
          lead_id: leadData.id,
          customer_type: getCustomerTypeLabel(leadData.customer_type),
          customer_name: `${leadData.first_name} ${leadData.last_name}`,
          company_name: leadData.company_name,
          email: leadData.email,
          phone: leadData.phone,
          address: leadData.address,
          suburb: leadData.suburb,
          city: leadData.city,
          province: leadData.province,
          postal_code: leadData.postal_code,
          requested_service: leadData.requested_service_type || 'Not specified',
          requested_speed: leadData.requested_speed || 'Not specified',
          budget_range: leadData.budget_range || 'Not specified',
          coverage_available: leadData.coverage_available ? 'Yes' : 'No',
          lead_source: leadData.lead_source || 'Website',
          source_campaign: leadData.source_campaign,
          zoho_lead_id: result.zohoLeadId,
          zoho_lead_url: result.zohoLeadId
            ? `https://crm.zoho.com/crm/org123/tab/Leads/${result.zohoLeadId}`
            : undefined,
        },
      });

      result.emailSent = emailResult.success;

      if (!emailResult.success) {
        result.errors?.push(`Email failed: ${emailResult.error}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      notificationLogger.error('Email alert error', { error: errorMessage });
      result.errors?.push(`Email exception: ${errorMessage}`);
    }

    // Step 3: Send SMS Alert (if configured)
    if (SALES_TEAM_PHONE && SALES_TEAM_PHONE !== '+27123456789') {
      try {
        const customerTypeLabel = getCustomerTypeLabel(leadData.customer_type);
        const message = `CircleTel: New ${customerTypeLabel} lead - ${leadData.first_name} ${leadData.last_name} (${leadData.phone}). Coverage: ${leadData.coverage_available ? 'Yes' : 'No'}. Check email for details.`;

        const smsResult = await SmsChannel.send({
          to: SALES_TEAM_PHONE,
          message,
        });

        result.smsSent = smsResult.success;

        if (!smsResult.success) {
          notificationLogger.warn('SMS alert failed', { error: smsResult.error, phone: SALES_TEAM_PHONE });
          result.errors?.push(`SMS failed: ${smsResult.error}`);
        } else {
          notificationLogger.info('SMS alert sent', { phone: SALES_TEAM_PHONE });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        notificationLogger.error('SMS alert exception', { error: errorMessage });
        result.errors?.push(`SMS exception: ${errorMessage}`);
      }
    }

    // Step 4: Send Slack Notification (if configured)
    if (SLACK_WEBHOOK_URL) {
      try {
        await sendSlackNotification({
          leadId: leadData.id,
          customerName: `${leadData.first_name} ${leadData.last_name}`,
          customerType: leadData.customer_type,
          email: leadData.email,
          phone: leadData.phone,
          address: leadData.address,
          requestedService: leadData.requested_service_type,
          budgetRange: leadData.budget_range,
          coverageAvailable: leadData.coverage_available,
          zohoLeadUrl: result.zohoLeadId
            ? `https://crm.zoho.com/crm/org123/tab/Leads/${result.zohoLeadId}`
            : undefined,
        });
        result.slackSent = true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        notificationLogger.error('Slack notification error', { error: errorMessage });
        result.errors?.push(`Slack exception: ${errorMessage}`);
      }
    }

    // Consider success if at least email was sent OR Zoho lead was created
    result.success = result.emailSent || !!result.zohoLeadId;

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    notificationLogger.error('Sales alert error', { error: errorMessage });
    return {
      success: false,
      errors: [`Fatal error: ${errorMessage}`],
    };
  }
}

/**
 * Send business quote alert to sales team
 * For larger enterprise/wholesale deals
 */
export async function sendBusinessQuoteAlert(
  quoteData: BusinessQuoteData
): Promise<SalesAlertResult> {
  // Skip in development unless explicitly enabled
  if (IS_DEVELOPMENT && !ENABLE_SALES_ALERTS) {
    notificationLogger.debug('DEV MODE: Business quote alert skipped', { email: quoteData.email });
    return {
      success: true,
      emailSent: false,
      smsSent: false,
    };
  }

  const result: SalesAlertResult = {
    success: false,
    errors: [],
  };

  try {
    // Send high-priority email to sales team
    const emailResult = await EmailNotificationService.sendEmail({
      to: SALES_TEAM_EMAIL,
      subject: `🚨 NEW BUSINESS QUOTE REQUEST: ${quoteData.company_name} (${quoteData.urgency?.toUpperCase() || 'MEDIUM'} Priority)`,
      template: 'sales_business_quote_alert',
      data: {
        lead_id: quoteData.lead_id,
        company_name: quoteData.company_name,
        contact_name: quoteData.contact_name,
        email: quoteData.email,
        phone: quoteData.phone,
        requested_service: quoteData.requested_service,
        number_of_users: quoteData.number_of_users,
        budget: quoteData.budget || 'Not specified',
        urgency: quoteData.urgency || 'medium',
        urgency_color: getUrgencyColor(quoteData.urgency),
        notes: quoteData.notes,
      },
    });

    result.emailSent = emailResult.success;

    if (!emailResult.success) {
      result.errors?.push(`Email failed: ${emailResult.error}`);
    }

    // Send urgent SMS for high-priority quotes
    if (quoteData.urgency === 'high' && SALES_TEAM_PHONE && SALES_TEAM_PHONE !== '+27123456789') {
      try {
        const message = `CircleTel URGENT: Business quote from ${quoteData.company_name} (${quoteData.contact_name}). Budget: ${quoteData.budget || 'TBD'}. Call ${quoteData.phone} NOW!`;

        const smsResult = await SmsChannel.send({
          to: SALES_TEAM_PHONE,
          message,
        });

        result.smsSent = smsResult.success;

        if (!smsResult.success) {
          notificationLogger.warn('Urgent SMS alert failed', { error: smsResult.error });
          result.errors?.push(`SMS failed: ${smsResult.error}`);
        } else {
          notificationLogger.info('Urgent SMS alert sent', { company: quoteData.company_name });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        notificationLogger.error('Urgent SMS alert exception', { error: errorMessage });
        result.errors?.push(`SMS exception: ${errorMessage}`);
      }
    }

    result.success = result.emailSent;
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    notificationLogger.error('Business quote alert error', { error: errorMessage });
    return {
      success: false,
      errors: [`Fatal error: ${errorMessage}`],
    };
  }
}

/**
 * Create Zoho CRM Lead from coverage lead data
 */
async function createZohoCRMLead(
  leadData: CoverageLeadData
): Promise<{ success: boolean; leadId?: string; error?: string }> {
  try {
    // Initialize Zoho client (uses ZohoMockClient in dev if credentials not set)
    const { zohoClient } = await import('@/lib/zoho-api-client');

    const leadPayload = {
      Last_Name: leadData.last_name,
      First_Name: leadData.first_name,
      Email: leadData.email,
      Phone: leadData.phone,
      Company: leadData.company_name || `${leadData.first_name} ${leadData.last_name}`,
      Street: leadData.address,
      City: leadData.city,
      State: leadData.province,
      Zip_Code: leadData.postal_code,
      Lead_Status: 'Not Contacted',
      Lead_Source: leadData.lead_source || 'Website - Coverage Checker',

      // Custom fields
      Customer_Type: getCustomerTypeLabel(leadData.customer_type),
      Requested_Service: leadData.requested_service_type || 'Not specified',
      Requested_Speed: leadData.requested_speed || 'Not specified',
      Budget_Range: leadData.budget_range || 'Not specified',
      Coverage_Available: leadData.coverage_available ? 'Yes' : 'No',
      Coverage_Check_ID: leadData.id,

      // Coordinates (if available)
      ...(leadData.coordinates && {
        Latitude: leadData.coordinates.lat,
        Longitude: leadData.coordinates.lng,
      }),

      // Campaign tracking
      ...(leadData.source_campaign && {
        Campaign_Source: leadData.source_campaign,
      }),

      // Description with all details
      Description: `
Coverage Lead from CircleTel Website

Customer Type: ${getCustomerTypeLabel(leadData.customer_type)}
${leadData.company_name ? `Company: ${leadData.company_name}\n` : ''}
Requested Service: ${leadData.requested_service_type || 'Not specified'}
Requested Speed: ${leadData.requested_speed || 'Not specified'}
Budget Range: ${leadData.budget_range || 'Not specified'}
Coverage Available: ${leadData.coverage_available ? 'Yes ✓' : 'No ✗'}

Address: ${leadData.address}${leadData.suburb ? `, ${leadData.suburb}` : ''}${leadData.city ? `, ${leadData.city}` : ''}${leadData.province ? `, ${leadData.province}` : ''}${leadData.postal_code ? ` ${leadData.postal_code}` : ''}

Lead Source: ${leadData.lead_source || 'Website - Coverage Checker'}
${leadData.source_campaign ? `Campaign: ${leadData.source_campaign}\n` : ''}
Coverage Check ID: ${leadData.id}
      `.trim(),
    };

    const response = await zohoClient.createLead(leadPayload);

    if (response.success && response.data) {
      // Extract lead ID from response
      const leadId = Array.isArray(response.data)
        ? response.data[0]?.details?.id
        : response.data?.id;

      return {
        success: true,
        leadId: leadId || undefined,
      };
    }

    return {
      success: false,
      error: response.error || 'Failed to create lead',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    notificationLogger.error('Zoho CRM lead creation error', { error: errorMessage });
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send Slack notification to sales channel
 */
async function sendSlackNotification(data: {
  leadId: string;
  customerName: string;
  customerType: string;
  email: string;
  phone: string;
  address: string;
  requestedService?: string;
  budgetRange?: string;
  coverageAvailable?: boolean;
  zohoLeadUrl?: string;
}): Promise<void> {
  if (!SLACK_WEBHOOK_URL) return;

  const coverageEmoji = data.coverageAvailable ? '✅' : '❌';
  const typeEmoji = data.customerType === 'enterprise' ? '🏢' : data.customerType === 'smme' ? '🏪' : '👤';

  const slackPayload = {
    text: `${typeEmoji} New Lead: ${data.customerName}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${typeEmoji} New ${data.customerType.toUpperCase()} Lead`,
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Customer:*\n${data.customerName}`,
          },
          {
            type: 'mrkdwn',
            text: `*Email:*\n${data.email}`,
          },
          {
            type: 'mrkdwn',
            text: `*Phone:*\n${data.phone}`,
          },
          {
            type: 'mrkdwn',
            text: `*Coverage:*\n${coverageEmoji} ${data.coverageAvailable ? 'Available' : 'Not Available'}`,
          },
        ],
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Service:*\n${data.requestedService || 'Not specified'}`,
          },
          {
            type: 'mrkdwn',
            text: `*Budget:*\n${data.budgetRange || 'Not specified'}`,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Address:*\n${data.address}`,
        },
      },
      {
        type: 'actions',
        elements: [
          ...(data.zohoLeadUrl
            ? [
                {
                  type: 'button',
                  text: {
                    type: 'plain_text',
                    text: 'Open in Zoho CRM',
                    emoji: true,
                  },
                  url: data.zohoLeadUrl,
                  style: 'primary',
                },
              ]
            : []),
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Lead Details',
              emoji: true,
            },
            url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/leads/${data.leadId}`,
          },
        ],
      },
    ],
  };

  await fetch(SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(slackPayload),
  });
}

/**
 * Helper: Get customer type label
 */
function getCustomerTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    consumer: 'Consumer',
    smme: 'SMME/Small Business',
    enterprise: 'Enterprise',
    wholesale: 'Wholesale',
  };
  return labels[type] || type;
}

/**
 * Helper: Get urgency color for email styling
 */
function getUrgencyColor(urgency?: string): string {
  const colors: Record<string, string> = {
    low: '#4CAF50',
    medium: '#FF9800',
    high: '#F44336',
  };
  return colors[urgency || 'medium'] || colors.medium;
}
