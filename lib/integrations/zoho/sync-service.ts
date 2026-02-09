// ZOHO Sync Service
// Orchestrates syncing CircleTel entities to ZOHO CRM with retry logic

import { createClient } from '@/lib/supabase/server';
import { createZohoCRMService } from './crm-service';
import { zohoLogger } from '@/lib/logging';
import type {
  QuoteDataForSync,
  ContractDataForSync,
  SyncResult,
  SyncOptions,
  RetryConfig,
  CircleTelEntityType,
  ZohoEntityType,
  SyncStatus,
  ZohoDealData,
} from './types';

/**
 * ZohoSyncService
 * Handles syncing CircleTel entities to ZOHO CRM with:
 * - Retry logic (3 attempts with exponential backoff)
 * - Sync logging (zoho_sync_logs table)
 * - Entity mapping (zoho_entity_mappings table)
 * - Error handling and recovery
 */
export class ZohoSyncService {
  private crm = createZohoCRMService();
  private defaultRetryConfig: RetryConfig = {
    maxAttempts: 3,
    backoffMultiplier: 2,
    initialDelayMs: 1000,
  };

  /**
   * Sync quote to ZOHO Estimate with KYC status
   */
  async syncQuoteWithKYC(quoteId: string, options?: SyncOptions): Promise<SyncResult> {
    return this.retry(
      async () => {
        // 1. Fetch quote data
        const quote = await this.fetchQuoteData(quoteId);

        if (!quote) {
          throw new Error(`Quote not found: ${quoteId}`);
        }

        // 2. Check if already synced (unless forceSync)
        if (!options?.forceSync) {
          const existingMapping = await this.getMapping('quote', quoteId);
          if (existingMapping) {
            zohoLogger.debug('[ZohoSync] Quote already synced, skipping');
            return {
              success: true,
              zohoEntityId: existingMapping.zoho_id,
              zohoEntityType: existingMapping.zoho_type as ZohoEntityType,
            };
          }
        }

        // 3. Create Estimate in ZOHO
        const zohoId = await this.crm.createEstimate(quote);

        // 4. Create mapping
        await this.createMapping('quote', quoteId, 'Estimates', zohoId);

        return {
          success: true,
          zohoEntityId: zohoId,
          zohoEntityType: 'Estimates',
        };
      },
      'quote',
      quoteId,
      options?.maxRetries
    );
  }

  /**
   * Sync contract to ZOHO Deal with full KYC/RICA fields
   */
  async syncContractToDeal(contractId: string, options?: SyncOptions): Promise<SyncResult> {
    return this.retry(
      async () => {
        // 1. Fetch contract data (includes KYC session data)
        const contract = await this.fetchContractData(contractId);

        if (!contract) {
          throw new Error(`Contract not found: ${contractId}`);
        }

        // 2. Check if already synced
        if (!options?.forceSync) {
          const existingMapping = await this.getMapping('contract', contractId);
          if (existingMapping) {
            zohoLogger.debug('[ZohoSync] Contract already synced, skipping');
            return {
              success: true,
              zohoEntityId: existingMapping.zoho_id,
              zohoEntityType: existingMapping.zoho_type as ZohoEntityType,
            };
          }
        }

        // 3. Create Deal in ZOHO
        const zohoId = await this.crm.createDeal(contract);

        // 4. Create mapping
        await this.createMapping('contract', contractId, 'Deals', zohoId);

        return {
          success: true,
          zohoEntityId: zohoId,
          zohoEntityType: 'Deals',
        };
      },
      'contract',
      contractId,
      options?.maxRetries
    );
  }

  /**
   * Update ZOHO Deal with KYC completion status
   * Called when KYC session completes (approved/declined)
   */
  async syncKYCStatusToDeal(kycSessionId: string, options?: SyncOptions): Promise<SyncResult> {
    const supabase = await createClient();

    try {
      // 1. Fetch KYC session data with related contract
      const { data: kycSession, error } = await supabase
        .from('kyc_sessions')
        .select(`
          id,
          status,
          verification_result,
          risk_tier,
          completed_at,
          quote_id
        `)
        .eq('id', kycSessionId)
        .single();

      if (error || !kycSession) {
        throw new Error(`KYC session not found: ${kycSessionId}`);
      }

      // 2. Find contract associated with this KYC session
      const { data: contract } = await supabase
        .from('contracts')
        .select('id, zoho_deal_id')
        .eq('kyc_session_id', kycSessionId)
        .single();

      if (!contract) {
        zohoLogger.warn('[ZohoSync] No contract found for KYC session, skipping Deal update');
        return { success: false, error: 'No associated contract found' };
      }

      // 3. Get ZOHO Deal ID from mapping or contract
      let zohoId = contract.zoho_deal_id;
      if (!zohoId) {
        const mapping = await this.getMapping('contract', contract.id);
        zohoId = mapping?.zoho_id || null;
      }

      if (!zohoId) {
        throw new Error('Contract not synced to ZOHO yet');
      }

      // 4. Update Deal with KYC fields
      const updateData: Partial<ZohoDealData> = {
        KYC_Status: this.mapKYCStatus(kycSession.status),
        KYC_Verified_Date: kycSession.completed_at || undefined,
        Risk_Tier: this.mapRiskTier(kycSession.risk_tier),
      };

      await this.crm.updateDeal(zohoId, updateData);

      // 5. Update last_synced_at in mapping
      await this.updateMappingTimestamp('contract', contract.id);

      zohoLogger.info(`[ZohoSync] KYC status synced to Deal ${zohoId}`);

      return {
        success: true,
        zohoEntityId: zohoId,
        zohoEntityType: 'Deals',
      };
    } catch (error) {
      zohoLogger.error('[ZohoSync] Failed to sync KYC status:', error);
      throw error;
    }
  }

  /**
   * Update ZOHO Deal with RICA submission status
   * Called when RICA submission status changes
   */
  async syncRICAStatusToDeal(ricaSubmissionId: string, options?: SyncOptions): Promise<SyncResult> {
    const supabase = await createClient();

    try {
      // 1. Fetch RICA submission data
      const { data: ricaSubmission, error } = await supabase
        .from('rica_submissions')
        .select(`
          id,
          status,
          approved_at,
          kyc_session_id,
          order_id
        `)
        .eq('id', ricaSubmissionId)
        .single();

      if (error || !ricaSubmission) {
        throw new Error(`RICA submission not found: ${ricaSubmissionId}`);
      }

      // 2. Find contract via KYC session or order
      let contractId: string | null = null;

      if (ricaSubmission.kyc_session_id) {
        const { data: contract } = await supabase
          .from('contracts')
          .select('id')
          .eq('kyc_session_id', ricaSubmission.kyc_session_id)
          .single();

        contractId = contract?.id || null;
      }

      if (!contractId) {
        zohoLogger.warn('[ZohoSync] No contract found for RICA submission, skipping Deal update');
        return { success: false, error: 'No associated contract found' };
      }

      // 3. Get ZOHO Deal ID
      const mapping = await this.getMapping('contract', contractId);
      if (!mapping) {
        throw new Error('Contract not synced to ZOHO yet');
      }

      // 4. Update Deal with RICA status
      const updateData: Partial<ZohoDealData> = {
        RICA_Status: this.mapRICAStatus(ricaSubmission.status),
      };

      await this.crm.updateDeal(mapping.zoho_id, updateData);

      // 5. Update last_synced_at
      await this.updateMappingTimestamp('contract', contractId);

      zohoLogger.info(`[ZohoSync] RICA status synced to Deal ${mapping.zoho_id}`);

      return {
        success: true,
        zohoEntityId: mapping.zoho_id,
        zohoEntityType: 'Deals',
      };
    } catch (error) {
      zohoLogger.error('[ZohoSync] Failed to sync RICA status:', error);
      throw error;
    }
  }

  // ============================================================================
  // Retry Logic
  // ============================================================================

  /**
   * Retry operation with exponential backoff
   * Logs all attempts to zoho_sync_logs
   */
  private async retry<T>(
    operation: () => Promise<T>,
    entityType: CircleTelEntityType,
    entityId: string,
    maxRetries?: number
  ): Promise<T & { syncLogId?: string }> {
    const config = {
      ...this.defaultRetryConfig,
      maxAttempts: maxRetries || this.defaultRetryConfig.maxAttempts,
    };

    let lastError: Error | null = null;
    let syncLogId: string | undefined;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        zohoLogger.debug(`[ZohoSync] Attempt ${attempt}/${config.maxAttempts} for ${entityType} ${entityId}`);

        // Log attempt start
        syncLogId = await this.logSyncAttempt(entityType, entityId, attempt, 'pending');

        // Execute operation
        const result = await operation();

        // Log success
        await this.logSyncSuccess(syncLogId, entityType, entityId, attempt, result);

        return { ...result, syncLogId } as T & { syncLogId?: string };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        zohoLogger.error(`[ZohoSync] Attempt ${attempt} failed:`, lastError.message);

        // Log retry or failure
        if (attempt < config.maxAttempts) {
          await this.logSyncRetry(syncLogId!, entityType, entityId, attempt, lastError);

          // Exponential backoff: 1s, 2s, 4s
          const delayMs = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);
          zohoLogger.debug(`[ZohoSync] Retrying in ${delayMs}ms...`);
          await this.sleep(delayMs);
        } else {
          await this.logSyncFailure(syncLogId!, entityType, entityId, attempt, lastError);
        }
      }
    }

    // All attempts failed
    throw new Error(`Sync failed after ${config.maxAttempts} attempts: ${lastError?.message}`);
  }

  // ============================================================================
  // Database Operations
  // ============================================================================

  /**
   * Fetch quote data for sync
   */
  private async fetchQuoteData(quoteId: string): Promise<QuoteDataForSync | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('business_quotes')
      .select(`
        id,
        quote_number,
        company_name,
        total_amount,
        status,
        valid_until,
        customer_email,
        customer_phone,
        billing_address,
        created_at
      `)
      .eq('id', quoteId)
      .single();

    if (error || !data) {
      zohoLogger.error('[ZohoSync] Failed to fetch quote:', error);
      return null;
    }

    // Fetch KYC session data if exists
    const { data: kycData } = await supabase
      .from('kyc_sessions')
      .select('status')
      .eq('quote_id', quoteId)
      .single();

    return {
      ...data,
      kyc_status: kycData?.status,
    } as QuoteDataForSync;
  }

  /**
   * Fetch contract data with KYC information
   */
  private async fetchContractData(contractId: string): Promise<ContractDataForSync | null> {
    const supabase = await createClient();

    // Fetch contract with customer info
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        id,
        contract_number,
        customer_id,
        total_contract_value,
        fully_signed_date,
        start_date,
        end_date,
        status,
        kyc_session_id,
        created_at,
        customers!inner (
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', contractId)
      .single();

    if (error || !data) {
      zohoLogger.error('[ZohoSync] Failed to fetch contract:', error);
      return null;
    }

    // Construct customer name from nested customer data
    const customerData = data.customers as any;
    const customerName = `${customerData.first_name} ${customerData.last_name}`;
    const customerEmail = customerData.email;

    // Fetch KYC data if kyc_session_id exists
    let kycStatus, kycVerifiedDate, riskTier;
    if (data.kyc_session_id) {
      const { data: kycData } = await supabase
        .from('kyc_sessions')
        .select('status, risk_tier, completed_at')
        .eq('id', data.kyc_session_id)
        .single();

      kycStatus = kycData?.status;
      kycVerifiedDate = kycData?.completed_at;
      riskTier = kycData?.risk_tier;
    }

    // Fetch RICA data
    const { data: ricaData } = await supabase
      .from('rica_submissions')
      .select('status')
      .eq('kyc_session_id', data.kyc_session_id)
      .single();

    return {
      id: data.id,
      contract_number: data.contract_number,
      customer_name: customerName,
      customer_email: customerEmail,
      total_contract_value: data.total_contract_value,
      signed_date: data.fully_signed_date,
      start_date: data.start_date,
      end_date: data.end_date,
      status: data.status,
      kyc_status: kycStatus,
      kyc_verified_date: kycVerifiedDate,
      risk_tier: riskTier,
      rica_status: ricaData?.status,
      created_at: data.created_at,
    } as ContractDataForSync;
  }

  /**
   * Create entity mapping
   */
  private async createMapping(
    circletelType: CircleTelEntityType,
    circletelId: string,
    zohoType: ZohoEntityType,
    zohoId: string
  ): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase.from('zoho_entity_mappings').insert({
      circletel_type: circletelType,
      circletel_id: circletelId,
      zoho_type: zohoType,
      zoho_id: zohoId,
    });

    if (error) {
      zohoLogger.error('[ZohoSync] Failed to create mapping:', error);
      throw error;
    }

    zohoLogger.debug(`[ZohoSync] Mapping created: ${circletelType}:${circletelId} → ${zohoType}:${zohoId}`);
  }

  /**
   * Get existing entity mapping
   */
  private async getMapping(
    circletelType: CircleTelEntityType,
    circletelId: string
  ): Promise<{ zoho_type: string; zoho_id: string } | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('zoho_entity_mappings')
      .select('zoho_type, zoho_id')
      .eq('circletel_type', circletelType)
      .eq('circletel_id', circletelId)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  }

  /**
   * Update mapping's last_synced_at timestamp
   */
  private async updateMappingTimestamp(
    circletelType: CircleTelEntityType,
    circletelId: string
  ): Promise<void> {
    const supabase = await createClient();

    await supabase
      .from('zoho_entity_mappings')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('circletel_type', circletelType)
      .eq('circletel_id', circletelId);
  }

  // ============================================================================
  // Sync Logging
  // ============================================================================

  private async logSyncAttempt(
    entityType: CircleTelEntityType,
    entityId: string,
    attemptNumber: number,
    status: SyncStatus
  ): Promise<string> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('zoho_sync_logs')
      .insert({
        entity_type: entityType,
        entity_id: entityId,
        status,
        attempt_number: attemptNumber,
      })
      .select('id')
      .single();

    if (error || !data) {
      zohoLogger.error('[ZohoSync] Failed to log attempt:', error);
      return '';
    }

    return data.id;
  }

  private async logSyncSuccess(
    syncLogId: string,
    entityType: CircleTelEntityType,
    entityId: string,
    attemptNumber: number,
    result: unknown
  ): Promise<void> {
    const supabase = await createClient();

    await supabase
      .from('zoho_sync_logs')
      .update({
        status: 'success',
        response_payload: result as Record<string, unknown>,
      })
      .eq('id', syncLogId);

    zohoLogger.info(`[ZohoSync] Success: ${entityType}:${entityId} (attempt ${attemptNumber})`);
  }

  private async logSyncRetry(
    syncLogId: string,
    entityType: CircleTelEntityType,
    entityId: string,
    attemptNumber: number,
    error: Error
  ): Promise<void> {
    const supabase = await createClient();

    await supabase
      .from('zoho_sync_logs')
      .update({
        status: 'retrying',
        error_message: error.message,
      })
      .eq('id', syncLogId);

    zohoLogger.debug(`[ZohoSync] Retrying: ${entityType}:${entityId} (attempt ${attemptNumber})`);
  }

  private async logSyncFailure(
    syncLogId: string,
    entityType: CircleTelEntityType,
    entityId: string,
    attemptNumber: number,
    error: Error
  ): Promise<void> {
    const supabase = await createClient();

    await supabase
      .from('zoho_sync_logs')
      .update({
        status: 'failed',
        error_message: error.message,
      })
      .eq('id', syncLogId);

    zohoLogger.error(`[ZohoSync] Failed: ${entityType}:${entityId} after ${attemptNumber} attempts`);
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ============================================================================
  // Helper Methods - Field Mapping
  // ============================================================================

  private mapKYCStatus(status?: string): 'Not Started' | 'In Progress' | 'Completed' | 'Declined' {
    if (!status) return 'Not Started';

    const normalized = status.toLowerCase();
    if (normalized.includes('complete') || normalized === 'verified' || normalized === 'approved') return 'Completed';
    if (normalized.includes('progress') || normalized === 'pending') return 'In Progress';
    if (normalized.includes('decline') || normalized === 'rejected') return 'Declined';

    return 'Not Started';
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
}

/**
 * Create singleton instance
 */
export function createZohoSyncService(): ZohoSyncService {
  return new ZohoSyncService();
}
