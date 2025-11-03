/**
 * ZOHO Sign Service
 * Task Group 7: ZOHO Sign Integration
 *
 * Handles digital signature requests for contracts via ZOHO Sign API
 */

import axios from 'axios';
import { createClient } from '@/lib/supabase/server';
import { ZohoAPIClient } from '@/lib/zoho-api-client';

// =============================================================================
// CONSTANTS
// =============================================================================

const ZOHO_SIGN_BASE_URL = 'https://sign.zoho.com/api/v1';
const CIRCLETEL_SIGNATORY_EMAIL = 'contracts@circletel.co.za';
const CIRCLETEL_SIGNATORY_NAME = 'CircleTel Legal';

// =============================================================================
// TYPES
// =============================================================================

export interface SignatureRequestResponse {
  requestId: string;
  customerSigningUrl: string;
}

interface ZohoSignRequest {
  requests: {
    request_name: string;
    expiration_days: number;
    is_sequential: boolean;
    actions: Array<{
      recipient_email: string;
      recipient_name: string;
      action_type: 'SIGN';
      signing_order: number;
      verify_recipient?: boolean;
      verification_type?: 'email';
    }>;
    reminders: {
      reminder_period: number;
    };
  };
}

interface ZohoSignResponse {
  requests: {
    request_id: string;
    actions: Array<{
      action_id: string;
      signing_url: string;
    }>;
  };
}

// =============================================================================
// ZOHO SIGN SERVICE
// =============================================================================

/**
 * Send contract for digital signature via ZOHO Sign
 *
 * @param contractId - Contract UUID
 * @returns ZOHO Sign request ID and customer signing URL
 */
export async function sendContractForSignature(
  contractId: string
): Promise<SignatureRequestResponse> {
  const supabase = await createClient();

  try {
    // 1. Fetch contract and PDF from Supabase
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('id, contract_number, pdf_url, customer_id, status')
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      throw new Error(`Contract not found: ${contractId}`);
    }

    if (!contract.pdf_url) {
      throw new Error('Contract PDF not generated yet');
    }

    // 2. Fetch customer details
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, email, first_name, last_name')
      .eq('id', contract.customer_id)
      .single();

    if (customerError || !customer) {
      throw new Error(`Customer not found: ${contract.customer_id}`);
    }

    const customerName = `${customer.first_name} ${customer.last_name}`;

    // 3. Get ZOHO OAuth access token
    const accessToken = await getZohoAccessToken();

    // 4. Upload PDF to ZOHO Sign
    // Note: ZOHO Sign requires PDF as base64 or multipart upload
    // For simplicity, we'll use the public URL approach if supported,
    // otherwise download and upload as base64
    const pdfBase64 = await downloadPdfAsBase64(contract.pdf_url);

    // 5. Create signature request
    const signatureRequest: ZohoSignRequest = {
      requests: {
        request_name: `CircleTel Service Contract - ${contract.contract_number}`,
        expiration_days: 30,
        is_sequential: true,
        actions: [
          {
            recipient_email: customer.email,
            recipient_name: customerName,
            action_type: 'SIGN',
            signing_order: 1,
            verify_recipient: true,
            verification_type: 'email',
          },
          {
            recipient_email: CIRCLETEL_SIGNATORY_EMAIL,
            recipient_name: CIRCLETEL_SIGNATORY_NAME,
            action_type: 'SIGN',
            signing_order: 2,
          },
        ],
        reminders: {
          reminder_period: 3, // Remind every 3 days
        },
      },
    };

    // 6. Send request to ZOHO Sign API
    const response = await axios.post<ZohoSignResponse>(
      `${ZOHO_SIGN_BASE_URL}/requests`,
      {
        ...signatureRequest,
        templates: {
          file_data: pdfBase64,
          file_name: `${contract.contract_number}.pdf`,
        },
      },
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 seconds
      }
    );

    const zohoRequestId = response.data.requests.request_id;
    const customerSigningUrl = response.data.requests.actions.find(
      (action) => action.signing_url
    )?.signing_url;

    if (!customerSigningUrl) {
      throw new Error('No signing URL returned from ZOHO Sign');
    }

    // 7. Update contract with zoho_sign_request_id
    const { error: updateError } = await supabase
      .from('contracts')
      .update({ zoho_sign_request_id: zohoRequestId })
      .eq('id', contractId);

    if (updateError) {
      console.error('Failed to update contract with ZOHO Sign request ID:', updateError);
      // Don't throw - request was successful, just log the error
    }

    // 8. Return signature request details
    return {
      requestId: zohoRequestId,
      customerSigningUrl,
    };
  } catch (error: any) {
    console.error('[ZOHO Sign Service Error]', error);
    throw new Error(`Failed to send contract for signature: ${error.message}`);
  }
}

/**
 * Get ZOHO OAuth access token
 * Reuses existing ZohoAPIClient for token management
 */
async function getZohoAccessToken(): Promise<string> {
  if (!process.env.ZOHO_CLIENT_ID || !process.env.ZOHO_CLIENT_SECRET || !process.env.ZOHO_REFRESH_TOKEN) {
    throw new Error('ZOHO credentials not configured. Set ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, and ZOHO_REFRESH_TOKEN.');
  }

  const zohoClient = new ZohoAPIClient({
    clientId: process.env.ZOHO_CLIENT_ID,
    clientSecret: process.env.ZOHO_CLIENT_SECRET,
    refreshToken: process.env.ZOHO_REFRESH_TOKEN,
    orgId: process.env.ZOHO_ORG_ID,
    region: (process.env.ZOHO_REGION as 'US' | 'EU' | 'IN' | 'AU' | 'CN') || 'US',
  });

  // Get access token using existing Zoho client
  // @ts-ignore - accessing private method for token refresh
  const token = await zohoClient.getAccessToken();
  return token;
}

/**
 * Download PDF from Supabase Storage and convert to base64
 *
 * @param pdfUrl - Public URL of PDF in Supabase Storage
 * @returns Base64-encoded PDF string
 */
async function downloadPdfAsBase64(pdfUrl: string): Promise<string> {
  try {
    const response = await axios.get(pdfUrl, {
      responseType: 'arraybuffer',
      timeout: 15000, // 15 seconds
    });

    const buffer = Buffer.from(response.data);
    return buffer.toString('base64');
  } catch (error: any) {
    console.error('Failed to download PDF for ZOHO Sign:', error);
    throw new Error('Failed to download contract PDF');
  }
}

/**
 * Process ZOHO Sign webhook event
 *
 * @param eventType - ZOHO Sign event type
 * @param requestId - ZOHO Sign request ID
 * @param payload - Full webhook payload
 */
export async function processZohoSignWebhook(
  eventType: string,
  requestId: string,
  payload: any
): Promise<void> {
  const supabase = await createClient();

  try {
    // Find contract by ZOHO Sign request ID
    const { data: contract, error: findError } = await supabase
      .from('contracts')
      .select('id, status')
      .eq('zoho_sign_request_id', requestId)
      .single();

    if (findError || !contract) {
      console.error(`Contract not found for ZOHO Sign request ${requestId}`);
      return;
    }

    // Process event based on type
    switch (eventType) {
      case 'request.completed':
        // Both signers have signed
        await supabase
          .from('contracts')
          .update({
            status: 'fully_signed',
            fully_signed_date: new Date().toISOString(),
          })
          .eq('id', contract.id);

        console.log(`Contract ${contract.id} fully signed`);

        // TODO: Trigger invoice generation (Task Group 10)
        // await triggerInvoiceGeneration(contract.id);
        break;

      case 'request.signed':
        // One signer has signed (partial signature)
        await supabase
          .from('contracts')
          .update({ status: 'partially_signed' })
          .eq('id', contract.id);

        console.log(`Contract ${contract.id} partially signed`);
        break;

      case 'request.declined':
        // Signature declined - revert to draft
        await supabase
          .from('contracts')
          .update({ status: 'draft' })
          .eq('id', contract.id);

        console.log(`Contract ${contract.id} signature declined`);
        break;

      case 'request.expired':
        // Signature request expired
        await supabase
          .from('contracts')
          .update({ status: 'draft' })
          .eq('id', contract.id);

        console.log(`Contract ${contract.id} signature request expired`);
        break;

      default:
        console.log(`[ZOHO Sign Webhook] Unknown event type: ${eventType}`);
    }
  } catch (error: any) {
    console.error('[ZOHO Sign Webhook Processing Error]', error);
    throw error;
  }
}
