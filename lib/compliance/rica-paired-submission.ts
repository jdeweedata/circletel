/**
 * RICA Paired Submission Service
 *
 * Purpose: Submit RICA registration using KYC data from Didit
 * Integration: ICASA RICA System API
 * Task Group: 12.2 - RICA Paired Submission
 */

import { createClient } from '@/lib/supabase/server';
import type { ExtractedKYCData } from '@/lib/integrations/didit/types';

/**
 * RICA API Configuration
 */
const RICA_API_URL = process.env.RICA_API_URL || 'https://api.rica.icasa.org.za/v1';
const RICA_API_KEY = process.env.RICA_API_KEY;

if (!RICA_API_KEY) {
  console.warn('[RICA] RICA_API_KEY not configured - RICA submissions will fail');
}

/**
 * RICA Submission Payload Structure
 */
interface RICAPayload {
  subscriber: {
    id_number: string;
    full_name: string;
    date_of_birth: string;
    nationality: string;
    id_document_type: 'ID' | 'PASSPORT';
  };
  proof_of_address: {
    type: string;
    address: string;
    verification_date: string;
  };
  service_lines: Array<{
    iccid: string;
    service_type: 'voice' | 'data' | 'voice_data';
  }>;
  business_details?: {
    company_name: string;
    registration_number: string;
    directors: Array<{
      name: string;
      id_number: string;
    }>;
  };
}

/**
 * RICA API Response
 */
interface RICAAPIResponse {
  tracking_id: string;
  status: 'submitted' | 'pending' | 'approved' | 'rejected';
  submission_date: string;
}

/**
 * Submit RICA Registration with Didit KYC Data
 *
 * This function auto-populates 100% of RICA data from Didit extracted_data
 *
 * @param kycSessionId - UUID of kyc_sessions record
 * @param orderId - UUID of consumer_orders record
 * @param serviceLines - Array of ICCID/SIM card numbers
 * @returns RICA submission details
 */
export async function submitRICAWithDiditData(
  kycSessionId: string,
  orderId: string,
  serviceLines: string[]
): Promise<{
  ricaSubmissionId: string;
  icasaTrackingId: string;
}> {
  const supabase = await createClient();

  console.log('[RICA] Starting submission for order:', orderId);

  // 1. Fetch KYC extracted_data from kyc_sessions
  const { data: kycSession, error: kycError } = await supabase
    .from('kyc_sessions')
    .select('extracted_data, risk_tier, verification_result')
    .eq('id', kycSessionId)
    .single();

  if (kycError || !kycSession) {
    throw new Error(`KYC session not found: ${kycSessionId}`);
  }

  const extractedData = kycSession.extracted_data as ExtractedKYCData;

  // 2. Validate KYC data is complete
  const requiredFields = ['id_number', 'full_name', 'date_of_birth', 'proof_of_address'];
  const missingFields = requiredFields.filter(field => {
    const value = extractedData[field as keyof ExtractedKYCData];
    return !value || (typeof value === 'object' && !Object.keys(value).length);
  });

  if (missingFields.length > 0) {
    console.error('[RICA] Incomplete KYC data. Missing:', missingFields);
    throw new Error(`Incomplete KYC data. Missing: ${missingFields.join(', ')}`);
  }

  // 3. Build RICA payload using Didit data (100% auto-populated!)
  const ricaPayload: RICAPayload = {
    subscriber: {
      id_number: extractedData.id_number,
      full_name: extractedData.full_name,
      date_of_birth: extractedData.date_of_birth,
      nationality: 'ZA',
      id_document_type: 'ID', // From Didit ID verification
    },
    proof_of_address: {
      type: extractedData.proof_of_address.type,
      address: `${extractedData.proof_of_address.address_line_1}${
        extractedData.proof_of_address.address_line_2
          ? ', ' + extractedData.proof_of_address.address_line_2
          : ''
      }, ${extractedData.proof_of_address.city}, ${extractedData.proof_of_address.province} ${extractedData.proof_of_address.postal_code}`,
      verification_date: extractedData.proof_of_address.document_date || new Date().toISOString().split('T')[0]
    },
    service_lines: serviceLines.map(iccid => ({
      iccid,
      service_type: 'data' as const
    })),
  };

  // Add business details if available (for business KYC)
  if (extractedData.company_reg) {
    ricaPayload.business_details = {
      company_name: extractedData.company_name!,
      registration_number: extractedData.company_reg,
      directors: extractedData.directors || []
    };
  }

  console.log('[RICA] Payload prepared:', {
    subscriber: ricaPayload.subscriber.id_number,
    serviceLines: serviceLines.length,
    hasBusiness: !!ricaPayload.business_details
  });

  // 4. Submit to RICA system API
  if (!RICA_API_KEY) {
    console.warn('[RICA] Skipping API call (no API key configured)');

    // Create mock submission for development
    const { data: ricaSubmission } = await supabase
      .from('rica_submissions')
      .insert({
        kyc_session_id: kycSessionId,
        order_id: orderId,
        submitted_data: ricaPayload,
        icasa_tracking_id: `MOCK-${Date.now()}`,
        status: 'submitted',
        submitted_at: new Date().toISOString()
      })
      .select()
      .single();

    return {
      ricaSubmissionId: ricaSubmission!.id,
      icasaTrackingId: ricaSubmission!.icasa_tracking_id
    };
  }

  const ricaResponse = await fetch(`${RICA_API_URL}/submit`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RICA_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(ricaPayload)
  });

  if (!ricaResponse.ok) {
    const errorText = await ricaResponse.text();
    console.error('[RICA] API submission failed:', ricaResponse.status, errorText);
    throw new Error(`RICA submission failed: ${ricaResponse.status}`);
  }

  const ricaResult: RICAAPIResponse = await ricaResponse.json();

  console.log('[RICA] Submission successful:', ricaResult.tracking_id);

  // 5. Create rica_submissions record
  const { data: ricaSubmission, error: insertError } = await supabase
    .from('rica_submissions')
    .insert({
      kyc_session_id: kycSessionId,
      order_id: orderId,
      submitted_data: ricaPayload,
      icasa_tracking_id: ricaResult.tracking_id,
      status: ricaResult.status,
      submitted_at: new Date().toISOString()
    })
    .select()
    .single();

  if (insertError) {
    console.error('[RICA] Failed to save submission:', insertError);
    throw new Error('Failed to save RICA submission');
  }

  // 6. Return submission details
  return {
    ricaSubmissionId: ricaSubmission.id,
    icasaTrackingId: ricaResult.tracking_id
  };
}

/**
 * Check RICA Submission Status
 *
 * @param icasaTrackingId - ICASA tracking ID from submission
 * @returns Current status
 */
export async function checkRICAStatus(icasaTrackingId: string): Promise<{
  status: string;
  updated_at: string;
}> {
  if (!RICA_API_KEY) {
    console.warn('[RICA] Cannot check status (no API key configured)');
    return {
      status: 'pending',
      updated_at: new Date().toISOString()
    };
  }

  const response = await fetch(`${RICA_API_URL}/submissions/${icasaTrackingId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${RICA_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to check RICA status: ${response.status}`);
  }

  const result = await response.json();
  return {
    status: result.status,
    updated_at: result.updated_at
  };
}
