// ZOHO CRM Service
// Handles ZOHO CRM operations (Estimates, Deals, Contacts, Invoices)
// Includes KYC custom fields for CircleTel compliance workflow

import { createZohoAuthService } from './auth-service';
import type {
  ZohoEstimateData,
  ZohoDealData,
  ZohoContactData,
  ZohoInvoiceData,
  ZohoCreateResponse,
  ZohoUpdateResponse,
  QuoteDataForSync,
  ContractDataForSync,
} from './types';

/**
 * ZohoCRMService
 * Provides methods to create and update CRM records with KYC fields
 *
 * IMPORTANT: Custom fields must be created manually in ZOHO CRM first:
 * - KYC_Status (Picklist: Not Started, In Progress, Completed, Declined)
 * - KYC_Verified_Date (Date)
 * - Risk_Tier (Picklist: Low, Medium, High)
 * - RICA_Status (Picklist: Pending, Submitted, Approved, Rejected)
 * - Contract_Number (Text)
 * - Contract_Signed_Date (Date)
 */
export class ZohoCRMService {
  private auth = createZohoAuthService();
  private baseUrl = 'https://www.zohoapis.com/crm/v2';

  /**
   * Create Estimate (Quote) in ZOHO CRM
   * Maps CircleTel quote to ZOHO Estimates module
   */
  async createEstimate(quoteData: QuoteDataForSync): Promise<string> {
    try {
      const accessToken = await this.auth.getAccessToken();

      // Map CircleTel quote to ZOHO Estimate
      const estimateData: ZohoEstimateData = {
        Subject: `Quote ${quoteData.quote_number}`,
        Account_Name: { name: quoteData.company_name },
        Grand_Total: quoteData.total_amount,
        Quote_Stage: this.mapQuoteStage(quoteData.status),
        Valid_Till: quoteData.valid_until,
        KYC_Status: this.mapKYCStatus(quoteData.kyc_status),
        Description: `CircleTel Quote - ${quoteData.quote_number}`,
      };

      // Add billing address if available
      if (quoteData.billing_address) {
        const address = this.parseAddress(quoteData.billing_address);
        Object.assign(estimateData, {
          Billing_Street: address.street,
          Billing_City: address.city,
          Billing_State: address.state,
          Billing_Code: address.postalCode,
          Billing_Country: 'South Africa',
        });
      }

      console.log('[ZohoCRM] Creating Estimate:', estimateData.Subject);

      const response = await fetch(`${this.baseUrl}/Quotes`, {
        method: 'POST',
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: [estimateData] }),
      });

      if (!response.ok) {
        throw new Error(`ZOHO API error: ${response.status} ${response.statusText}`);
      }

      const result: ZohoCreateResponse = await response.json();

      if (result.data[0].code === 'SUCCESS') {
        const zohoId = result.data[0].details.id;
        console.log('[ZohoCRM] Estimate created successfully:', zohoId);
        return zohoId;
      } else {
        throw new Error(`ZOHO API error: ${result.data[0].message}`);
      }
    } catch (error) {
      console.error('[ZohoCRM] Failed to create Estimate:', error);
      throw error;
    }
  }

  /**
   * Create Deal (Contract) in ZOHO CRM
   * Maps CircleTel contract to ZOHO Deals module with full KYC fields
   */
  async createDeal(contractData: ContractDataForSync): Promise<string> {
    try {
      const accessToken = await this.auth.getAccessToken();

      // Map CircleTel contract to ZOHO Deal
      const dealData: ZohoDealData = {
        Deal_Name: `Contract ${contractData.contract_number}`,
        Account_Name: { name: contractData.customer_name },
        Amount: contractData.total_contract_value,
        Stage: this.mapContractStage(contractData.status),
        Closing_Date: contractData.signed_date || contractData.start_date,
        Type: 'New Business',
        Description: `CircleTel Contract - ${contractData.contract_number}`,
        Lead_Source: 'Website',

        // KYC Custom Fields
        KYC_Status: this.mapKYCStatusToDeal(contractData.kyc_status),
        KYC_Verified_Date: contractData.kyc_verified_date,
        Risk_Tier: this.mapRiskTier(contractData.risk_tier),
        RICA_Status: this.mapRICAStatus(contractData.rica_status),
        Contract_Number: contractData.contract_number,
        Contract_Signed_Date: contractData.signed_date,
      };

      console.log('[ZohoCRM] Creating Deal:', dealData.Deal_Name);

      const response = await fetch(`${this.baseUrl}/Deals`, {
        method: 'POST',
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: [dealData] }),
      });

      if (!response.ok) {
        throw new Error(`ZOHO API error: ${response.status} ${response.statusText}`);
      }

      const result: ZohoCreateResponse = await response.json();

      if (result.data[0].code === 'SUCCESS') {
        const zohoId = result.data[0].details.id;
        console.log('[ZohoCRM] Deal created successfully:', zohoId);
        return zohoId;
      } else {
        throw new Error(`ZOHO API error: ${result.data[0].message}`);
      }
    } catch (error) {
      console.error('[ZohoCRM] Failed to create Deal:', error);
      throw error;
    }
  }

  /**
   * Update Deal with new data (e.g., KYC completion, contract signing)
   */
  async updateDeal(dealId: string, data: Partial<ZohoDealData>): Promise<void> {
    try {
      const accessToken = await this.auth.getAccessToken();

      console.log('[ZohoCRM] Updating Deal:', dealId);

      const response = await fetch(`${this.baseUrl}/Deals/${dealId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: [data] }),
      });

      if (!response.ok) {
        throw new Error(`ZOHO API error: ${response.status} ${response.statusText}`);
      }

      const result: ZohoUpdateResponse = await response.json();

      if (result.data[0].code !== 'SUCCESS') {
        throw new Error(`ZOHO API error: ${result.data[0].message}`);
      }

      console.log('[ZohoCRM] Deal updated successfully');
    } catch (error) {
      console.error('[ZohoCRM] Failed to update Deal:', error);
      throw error;
    }
  }

  /**
   * Create Contact in ZOHO CRM
   */
  async createContact(contactData: ZohoContactData): Promise<string> {
    try {
      const accessToken = await this.auth.getAccessToken();

      console.log('[ZohoCRM] Creating Contact:', contactData.Email);

      const response = await fetch(`${this.baseUrl}/Contacts`, {
        method: 'POST',
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: [contactData] }),
      });

      if (!response.ok) {
        throw new Error(`ZOHO API error: ${response.status} ${response.statusText}`);
      }

      const result: ZohoCreateResponse = await response.json();

      if (result.data[0].code === 'SUCCESS') {
        const zohoId = result.data[0].details.id;
        console.log('[ZohoCRM] Contact created successfully:', zohoId);
        return zohoId;
      } else {
        throw new Error(`ZOHO API error: ${result.data[0].message}`);
      }
    } catch (error) {
      console.error('[ZohoCRM] Failed to create Contact:', error);
      throw error;
    }
  }

  /**
   * Search for existing record by field
   */
  async searchRecord(module: string, field: string, value: string): Promise<string | null> {
    try {
      const accessToken = await this.auth.getAccessToken();
      const criteria = `(${field}:equals:${value})`;

      const response = await fetch(
        `${this.baseUrl}/${module}/search?criteria=${encodeURIComponent(criteria)}`,
        {
          headers: {
            'Authorization': `Zoho-oauthtoken ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      const result = await response.json();

      if (result.data && result.data.length > 0) {
        return result.data[0].id;
      }

      return null;
    } catch (error) {
      console.error('[ZohoCRM] Search failed:', error);
      return null;
    }
  }

  // ============================================================================
  // Helper Methods - Field Mapping
  // ============================================================================

  private mapKYCStatus(status?: string): 'Not Started' | 'In Progress' | 'Completed' | 'Declined' {
    if (!status) return 'Not Started';

    const normalized = status.toLowerCase();
    if (normalized.includes('complete') || normalized === 'verified') return 'Completed';
    if (normalized.includes('progress') || normalized === 'pending') return 'In Progress';
    if (normalized.includes('decline') || normalized === 'rejected') return 'Declined';

    return 'Not Started';
  }

  private mapKYCStatusToDeal(status?: string): 'Not Started' | 'In Progress' | 'Completed' | 'Declined' {
    // For contracts, KYC should typically be completed
    if (!status) return 'Completed'; // Default for contracts
    return this.mapKYCStatus(status);
  }

  private mapRiskTier(tier?: string): 'Low' | 'Medium' | 'High' {
    if (!tier) return 'Low';

    const normalized = tier.toLowerCase();
    if (normalized === 'high') return 'High';
    if (normalized === 'medium') return 'Medium';

    return 'Low';
  }

  private mapRICAStatus(status?: string): 'Pending' | 'Submitted' | 'Approved' | 'Rejected' {
    if (!status) return 'Pending';

    const normalized = status.toLowerCase();
    if (normalized === 'approved' || normalized === 'complete') return 'Approved';
    if (normalized === 'submitted' || normalized === 'in progress') return 'Submitted';
    if (normalized === 'rejected' || normalized === 'declined') return 'Rejected';

    return 'Pending';
  }

  private mapQuoteStage(status?: string): string {
    if (!status) return 'Draft';

    const normalized = status.toLowerCase();
    if (normalized === 'sent' || normalized === 'submitted') return 'Delivered';
    if (normalized === 'accepted' || normalized === 'approved') return 'Accepted';
    if (normalized === 'rejected' || normalized === 'declined') return 'Declined';
    if (normalized === 'expired') return 'Closed Lost';

    return 'Draft';
  }

  private mapContractStage(status?: string): string {
    if (!status) return 'Proposal/Price Quote';

    const normalized = status.toLowerCase();
    if (normalized === 'sent' || normalized === 'pending') return 'Proposal/Price Quote';
    if (normalized === 'signed' || normalized === 'active') return 'Closed Won';
    if (normalized === 'cancelled' || normalized === 'rejected') return 'Closed Lost';

    return 'Negotiation/Review';
  }

  private parseAddress(address: string): {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  } {
    // Basic address parsing (can be enhanced)
    const parts = address.split(',').map((p) => p.trim());

    return {
      street: parts[0] || '',
      city: parts[1] || '',
      state: parts[2] || '',
      postalCode: parts[3] || '',
    };
  }
}

/**
 * Create singleton instance
 */
export function createZohoCRMService(): ZohoCRMService {
  return new ZohoCRMService();
}
