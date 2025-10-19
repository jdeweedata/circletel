/**
 * Zoho CRM Lead Capture Service
 * Handles creating and syncing leads from coverage checker to Zoho CRM
 */

import type {
  CoverageLead,
  CreateCoverageLeadInput,
  CustomerType,
  LeadSource,
} from '@/lib/types/customer-journey';

// =============================================================================
// ZOHO LEAD TYPES
// =============================================================================

export interface ZohoLeadInput {
  // Contact Information
  First_Name: string;
  Last_Name: string;
  Email: string;
  Phone: string;
  Mobile?: string;
  Company?: string;

  // Address
  Street?: string;
  City?: string;
  State?: string;
  Zip_Code?: string;
  Country?: string;

  // Lead Details
  Lead_Source?: string;
  Lead_Status?: string;
  Industry?: string;
  Annual_Revenue?: number;
  No_of_Employees?: number;

  // Custom Fields
  Customer_Type?: string; // 'Consumer', 'SMME', 'Enterprise'
  Requested_Service?: string;
  Requested_Speed?: string;
  Budget_Range?: string;
  Coverage_Available?: boolean;

  // Campaign Tracking
  Campaign_Source?: string;
  Referral_Code?: string;

  // Additional
  Description?: string;
  $gclid?: string; // Google Click ID for ad tracking
}

export interface ZohoLeadResponse {
  data: Array<{
    code: string;
    details: {
      id: string;
      Created_Time: string;
      Modified_Time: string;
    };
    message: string;
    status: string;
  }>;
}

export interface SyncLeadToZohoResult {
  success: boolean;
  zoho_lead_id?: string;
  error?: string;
  lead_url?: string;
}

// =============================================================================
// LEAD SOURCE MAPPING
// =============================================================================

/**
 * Map internal lead source to Zoho CRM lead source values
 */
function mapLeadSourceToZoho(source: LeadSource): string {
  const mapping: Record<LeadSource, string> = {
    coverage_checker: 'Website',
    business_inquiry: 'Website',
    website_form: 'Website',
    referral: 'Referral',
    marketing_campaign: 'Advertisement',
    social_media: 'Social Media',
    direct_sales: 'Sales Call',
    other: 'Other',
  };

  return mapping[source] || 'Website';
}

/**
 * Map customer type to Zoho format
 */
function mapCustomerTypeToZoho(type: CustomerType): string {
  const mapping: Record<CustomerType, string> = {
    consumer: 'Consumer',
    smme: 'SMME',
    enterprise: 'Enterprise',
  };

  return mapping[type];
}

/**
 * Determine initial lead status based on coverage availability
 */
function determineLeadStatus(coverageAvailable: boolean): string {
  return coverageAvailable ? 'Qualified' : 'Not Contacted';
}

// =============================================================================
// LEAD CAPTURE FUNCTIONS
// =============================================================================

/**
 * Create a Zoho lead from coverage lead data
 */
export async function createZohoLead(
  lead: CoverageLead | CreateCoverageLeadInput,
  coverageAvailable: boolean = false
): Promise<SyncLeadToZohoResult> {
  try {
    // Prepare Zoho lead data
    const zohoLead: ZohoLeadInput = {
      // Contact Information
      First_Name: lead.first_name,
      Last_Name: lead.last_name,
      Email: lead.email,
      Phone: lead.phone,
      Company: lead.company_name || `${lead.first_name} ${lead.last_name}`,

      // Address
      Street: lead.address,
      City: lead.city || undefined,
      State: lead.province || undefined,
      Zip_Code: lead.postal_code || undefined,
      Country: 'South Africa',

      // Lead Details
      Lead_Source: mapLeadSourceToZoho(lead.lead_source),
      Lead_Status: determineLeadStatus(coverageAvailable),

      // Custom Fields
      Customer_Type: mapCustomerTypeToZoho(lead.customer_type),
      Requested_Service: lead.requested_service_type || undefined,
      Requested_Speed: lead.requested_speed || undefined,
      Budget_Range: lead.budget_range || undefined,
      Coverage_Available: coverageAvailable,

      // Campaign Tracking
      Campaign_Source: lead.source_campaign || undefined,
      Referral_Code: lead.referral_code || undefined,

      // Description
      Description: buildLeadDescription(lead, coverageAvailable),
    };

    // Call Zoho API to create lead
    const response = await fetch('/api/zoho/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [zohoLead],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create Zoho lead');
    }

    const result: ZohoLeadResponse = await response.json();

    // Check if lead was created successfully
    if (result.data && result.data.length > 0) {
      const leadData = result.data[0];

      if (leadData.code === 'SUCCESS') {
        return {
          success: true,
          zoho_lead_id: leadData.details.id,
          lead_url: `https://crm.zoho.com/crm/org123/tab/Leads/${leadData.details.id}`,
        };
      } else {
        return {
          success: false,
          error: leadData.message || 'Unknown error creating lead',
        };
      }
    }

    return {
      success: false,
      error: 'No response data from Zoho',
    };
  } catch (error: any) {
    console.error('Error creating Zoho lead:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Update an existing Zoho lead
 */
export async function updateZohoLead(
  zohoLeadId: string,
  updates: Partial<ZohoLeadInput>
): Promise<SyncLeadToZohoResult> {
  try {
    const response = await fetch(`/api/zoho/leads/${zohoLeadId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [updates],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update Zoho lead');
    }

    const result: ZohoLeadResponse = await response.json();

    if (result.data && result.data.length > 0) {
      const leadData = result.data[0];

      if (leadData.code === 'SUCCESS') {
        return {
          success: true,
          zoho_lead_id: zohoLeadId,
          lead_url: `https://crm.zoho.com/crm/org123/tab/Leads/${zohoLeadId}`,
        };
      } else {
        return {
          success: false,
          error: leadData.message || 'Unknown error updating lead',
        };
      }
    }

    return {
      success: false,
      error: 'No response data from Zoho',
    };
  } catch (error: any) {
    console.error('Error updating Zoho lead:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Convert Zoho lead to contact/deal when order is placed
 */
export async function convertZohoLead(
  zohoLeadId: string,
  options: {
    createContact?: boolean;
    createDeal?: boolean;
    dealAmount?: number;
    dealName?: string;
  } = {}
): Promise<SyncLeadToZohoResult> {
  try {
    const {
      createContact = true,
      createDeal = true,
      dealAmount,
      dealName,
    } = options;

    const response = await fetch(`/api/zoho/leads/${zohoLeadId}/convert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        createContact,
        createDeal,
        dealAmount,
        dealName,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to convert Zoho lead');
    }

    const result = await response.json();

    return {
      success: true,
      zoho_lead_id: zohoLeadId,
    };
  } catch (error: any) {
    console.error('Error converting Zoho lead:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Build a descriptive lead description for Zoho
 */
function buildLeadDescription(
  lead: CoverageLead | CreateCoverageLeadInput,
  coverageAvailable: boolean
): string {
  const parts: string[] = [];

  // Coverage status
  if (coverageAvailable) {
    parts.push('✅ Coverage Available');
  } else {
    parts.push('❌ No Coverage - Lead captured for follow-up');
  }

  // Service requirements
  if (lead.requested_service_type) {
    parts.push(`Service Type: ${lead.requested_service_type}`);
  }

  if (lead.requested_speed) {
    parts.push(`Required Speed: ${lead.requested_speed}`);
  }

  if (lead.budget_range) {
    parts.push(`Budget: ${lead.budget_range}`);
  }

  // Contact preferences
  if ('contact_preference' in lead && lead.contact_preference) {
    parts.push(`Preferred Contact: ${lead.contact_preference}`);
  }

  if ('best_contact_time' in lead && lead.best_contact_time) {
    parts.push(`Best Time to Contact: ${lead.best_contact_time}`);
  }

  // Source tracking
  if (lead.source_campaign) {
    parts.push(`Campaign: ${lead.source_campaign}`);
  }

  if (lead.referral_code) {
    parts.push(`Referral Code: ${lead.referral_code}`);
  }

  // Address
  parts.push(`\nAddress: ${lead.address}`);
  if (lead.suburb) parts.push(`Suburb: ${lead.suburb}`);
  if (lead.city) parts.push(`City: ${lead.city}`);
  if (lead.province) parts.push(`Province: ${lead.province}`);

  return parts.join('\n');
}

/**
 * Sync coverage lead to Zoho and update database
 */
export async function syncCoverageLeadToZoho(
  leadId: string,
  coverageAvailable: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    // Fetch lead from database
    const response = await fetch(`/api/admin/coverage-leads/${leadId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch coverage lead');
    }

    const { lead } = await response.json();

    // Create Zoho lead
    const result = await createZohoLead(lead, coverageAvailable);

    if (!result.success) {
      // Update database with sync error
      await fetch(`/api/admin/coverage-leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zoho_sync_status: 'failed',
          zoho_sync_error: result.error,
        }),
      });

      return {
        success: false,
        error: result.error,
      };
    }

    // Update database with Zoho lead ID
    await fetch(`/api/admin/coverage-leads/${leadId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        zoho_lead_id: result.zoho_lead_id,
        zoho_synced_at: new Date().toISOString(),
        zoho_sync_status: 'synced',
        zoho_sync_error: null,
      }),
    });

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Error syncing coverage lead to Zoho:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Batch sync multiple leads to Zoho
 */
export async function batchSyncLeadsToZoho(
  leadIds: string[]
): Promise<{
  success: boolean;
  synced: number;
  failed: number;
  errors: Array<{ leadId: string; error: string }>;
}> {
  const results = {
    success: true,
    synced: 0,
    failed: 0,
    errors: [] as Array<{ leadId: string; error: string }>,
  };

  for (const leadId of leadIds) {
    const result = await syncCoverageLeadToZoho(leadId);

    if (result.success) {
      results.synced++;
    } else {
      results.failed++;
      results.errors.push({
        leadId,
        error: result.error || 'Unknown error',
      });
    }
  }

  results.success = results.failed === 0;

  return results;
}
