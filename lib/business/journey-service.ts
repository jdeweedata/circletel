/**
 * B2B Business Journey Service
 *
 * Manages business customer journey progression through the 6-step onboarding process.
 * This service handles all journey-related database operations.
 *
 * @module lib/business/journey-service
 */

import { createClient } from '@/lib/supabase/server';
import {
  JourneyStageId,
  JourneyStageStatus,
  JourneyProgress,
  StageProgress,
  B2B_JOURNEY_STAGES,
  getStageById,
  calculateProgress,
} from './journey-config';

// ============================================================================
// Types
// ============================================================================

export interface BusinessCustomer {
  id: string;
  auth_user_id: string | null;
  company_name: string;
  trading_name: string | null;
  registration_number: string | null;
  vat_number: string | null;
  company_type: string;
  primary_contact_name: string;
  primary_contact_email: string;
  primary_contact_phone: string | null;
  account_number: string;
  account_status: string;
  kyc_status: string;
  created_at: string;
  updated_at: string;
}

export interface JourneyStageRecord {
  id: string;
  business_customer_id: string;
  quote_id: string | null;
  stage: JourneyStageId;
  status: JourneyStageStatus;
  step_number: number;
  started_at: string | null;
  completed_at: string | null;
  due_date: string | null;
  notes: string | null;
  blocked_reason: string | null;
  completed_by: string | null;
  required_documents: string[];
  submitted_documents: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface NextAction {
  stageId: JourneyStageId;
  stageName: string;
  action: string;
  actionUrl: string;
  requiredDocuments: string[];
  isBlocked: boolean;
  blockedReason?: string;
}

// ============================================================================
// Journey Service Class
// ============================================================================

export class BusinessJourneyService {
  /**
   * Get the complete journey status for a business customer
   */
  static async getJourneyStatus(customerId: string): Promise<JourneyProgress | null> {
    const supabase = await createClient();

    // Get all journey stages for this customer
    const { data: stages, error } = await supabase
      .from('business_journey_stages')
      .select('*')
      .eq('business_customer_id', customerId)
      .order('step_number', { ascending: true });

    if (error) {
      console.error('Error fetching journey stages:', error);
      throw new Error(`Failed to fetch journey status: ${error.message}`);
    }

    if (!stages || stages.length === 0) {
      return null;
    }

    // Find current stage (first non-completed)
    const currentStageRecord = stages.find(
      (s) => s.status === 'in_progress' || s.status === 'pending' || s.status === 'blocked'
    );

    // Find blocked stage if any
    const blockedStageRecord = stages.find((s) => s.status === 'blocked');

    // Get completed stages
    const completedStages = stages
      .filter((s) => s.status === 'completed')
      .map((s) => s.stage as JourneyStageId);

    // Build stage progress array
    const stageProgress: StageProgress[] = stages.map((s) => ({
      stageId: s.stage as JourneyStageId,
      status: s.status as JourneyStageStatus,
      startedAt: s.started_at,
      completedAt: s.completed_at,
      notes: s.notes,
      blockedReason: s.blocked_reason,
    }));

    // Get journey timing
    const firstStage = stages.find((s) => s.started_at);
    const lastCompletedStage = stages
      .filter((s) => s.status === 'completed')
      .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())[0];

    // Check if journey is complete
    const isComplete = completedStages.length === 6;

    return {
      customerId,
      quoteId: stages[0]?.quote_id,
      currentStage: currentStageRecord?.stage as JourneyStageId || 'go_live',
      currentStep: currentStageRecord?.step_number || 6,
      completedStages,
      blockedStage: blockedStageRecord?.stage as JourneyStageId | undefined,
      blockedReason: blockedStageRecord?.blocked_reason || undefined,
      progressPercentage: calculateProgress(completedStages),
      stages: stageProgress,
      journeyStartedAt: firstStage?.started_at || undefined,
      journeyCompletedAt: isComplete ? lastCompletedStage?.completed_at : undefined,
    };
  }

  /**
   * Initialize journey stages for a new business customer
   */
  static async initializeJourney(
    customerId: string,
    quoteId?: string
  ): Promise<JourneyProgress> {
    const supabase = await createClient();

    // Call the database function to initialize all 6 stages
    const { error } = await supabase.rpc('initialize_business_journey', {
      p_business_customer_id: customerId,
      p_quote_id: quoteId || null,
    });

    if (error) {
      console.error('Error initializing journey:', error);
      throw new Error(`Failed to initialize journey: ${error.message}`);
    }

    // Return the newly created journey status
    const status = await this.getJourneyStatus(customerId);
    if (!status) {
      throw new Error('Journey initialization failed - no stages created');
    }

    return status;
  }

  /**
   * Update the status of a specific stage
   */
  static async updateStage(
    customerId: string,
    stageId: JourneyStageId,
    status: JourneyStageStatus,
    options?: {
      notes?: string;
      blockedReason?: string;
      completedBy?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    const supabase = await createClient();

    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    // Set timing based on status
    if (status === 'in_progress' && !options?.blockedReason) {
      updateData.started_at = new Date().toISOString();
    } else if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
      if (options?.completedBy) {
        updateData.completed_by = options.completedBy;
      }
    } else if (status === 'blocked') {
      updateData.blocked_reason = options?.blockedReason || 'Unknown reason';
    }

    // Add optional fields
    if (options?.notes) updateData.notes = options.notes;
    if (options?.metadata) updateData.metadata = options.metadata;

    const { error } = await supabase
      .from('business_journey_stages')
      .update(updateData)
      .eq('business_customer_id', customerId)
      .eq('stage', stageId);

    if (error) {
      console.error('Error updating stage:', error);
      throw new Error(`Failed to update stage: ${error.message}`);
    }
  }

  /**
   * Complete a stage and advance to the next one
   */
  static async completeStage(
    customerId: string,
    stageId: JourneyStageId,
    completedBy?: string
  ): Promise<{ success: boolean; nextStage?: JourneyStageId; message: string }> {
    const supabase = await createClient();

    // Use database function for atomic operation
    const { data, error } = await supabase.rpc('advance_business_journey', {
      p_business_customer_id: customerId,
      p_current_stage: stageId,
      p_completed_by: completedBy || null,
    });

    if (error) {
      console.error('Error completing stage:', error);
      throw new Error(`Failed to complete stage: ${error.message}`);
    }

    const result = data?.[0];
    return {
      success: result?.success || false,
      nextStage: result?.next_stage as JourneyStageId | undefined,
      message: result?.message || 'Unknown result',
    };
  }

  /**
   * Block a stage with a reason
   */
  static async blockStage(
    customerId: string,
    stageId: JourneyStageId,
    reason: string
  ): Promise<void> {
    await this.updateStage(customerId, stageId, 'blocked', {
      blockedReason: reason,
    });
  }

  /**
   * Unblock a stage and set it back to in_progress
   */
  static async unblockStage(
    customerId: string,
    stageId: JourneyStageId,
    notes?: string
  ): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from('business_journey_stages')
      .update({
        status: 'in_progress',
        blocked_reason: null,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('business_customer_id', customerId)
      .eq('stage', stageId);

    if (error) {
      console.error('Error unblocking stage:', error);
      throw new Error(`Failed to unblock stage: ${error.message}`);
    }
  }

  /**
   * Get the next action required for the customer
   */
  static async getNextAction(customerId: string): Promise<NextAction | null> {
    const progress = await this.getJourneyStatus(customerId);
    if (!progress) return null;

    // If journey is complete, no next action
    if (progress.progressPercentage === 100) {
      return null;
    }

    const currentStage = getStageById(progress.currentStage);
    if (!currentStage) return null;

    // Build action URL based on stage
    const actionUrls: Record<JourneyStageId, string> = {
      quote_request: '/business/dashboard/quotes',
      business_verification: '/business/dashboard/verification',
      site_details: '/business/dashboard/site-details',
      contract: '/business/dashboard/contracts',
      installation: '/business/dashboard/journey',
      go_live: '/business/dashboard',
    };

    return {
      stageId: progress.currentStage,
      stageName: currentStage.title,
      action: currentStage.nextAction,
      actionUrl: actionUrls[progress.currentStage],
      requiredDocuments: currentStage.requiredDocuments
        .filter((d) => d.required)
        .map((d) => d.name),
      isBlocked: !!progress.blockedStage,
      blockedReason: progress.blockedReason,
    };
  }

  /**
   * Add submitted document to a stage
   */
  static async addSubmittedDocument(
    customerId: string,
    stageId: JourneyStageId,
    documentId: string
  ): Promise<void> {
    const supabase = await createClient();

    // Get current submitted documents
    const { data: stage, error: fetchError } = await supabase
      .from('business_journey_stages')
      .select('submitted_documents')
      .eq('business_customer_id', customerId)
      .eq('stage', stageId)
      .single();

    if (fetchError) {
      console.error('Error fetching stage:', fetchError);
      throw new Error(`Failed to fetch stage: ${fetchError.message}`);
    }

    const currentDocs = stage?.submitted_documents || [];
    if (!currentDocs.includes(documentId)) {
      currentDocs.push(documentId);
    }

    // Update with new document
    const { error: updateError } = await supabase
      .from('business_journey_stages')
      .update({
        submitted_documents: currentDocs,
        updated_at: new Date().toISOString(),
      })
      .eq('business_customer_id', customerId)
      .eq('stage', stageId);

    if (updateError) {
      console.error('Error updating documents:', updateError);
      throw new Error(`Failed to update documents: ${updateError.message}`);
    }
  }

  /**
   * Get all business customers with their journey status (for admin)
   */
  static async getAllCustomersWithJourney(options?: {
    status?: string;
    kycStatus?: string;
    stage?: JourneyStageId;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    customers: (BusinessCustomer & { journey: JourneyProgress | null })[];
    total: number;
  }> {
    const supabase = await createClient();

    let query = supabase
      .from('business_customers')
      .select('*', { count: 'exact' });

    // Apply filters
    if (options?.status) {
      query = query.eq('account_status', options.status);
    }
    if (options?.kycStatus) {
      query = query.eq('kyc_status', options.kycStatus);
    }
    if (options?.search) {
      query = query.or(
        `company_name.ilike.%${options.search}%,account_number.ilike.%${options.search}%,primary_contact_email.ilike.%${options.search}%`
      );
    }

    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options?.limit || 20) - 1);
    }

    // Order by created_at
    query = query.order('created_at', { ascending: false });

    const { data: customers, error, count } = await query;

    if (error) {
      console.error('Error fetching customers:', error);
      throw new Error(`Failed to fetch customers: ${error.message}`);
    }

    // Fetch journey status for each customer
    const customersWithJourney = await Promise.all(
      (customers || []).map(async (customer) => {
        const journey = await this.getJourneyStatus(customer.id);
        return { ...customer, journey };
      })
    );

    // Filter by stage if specified
    let filteredCustomers = customersWithJourney;
    if (options?.stage) {
      filteredCustomers = customersWithJourney.filter(
        (c) => c.journey?.currentStage === options.stage
      );
    }

    return {
      customers: filteredCustomers,
      total: count || 0,
    };
  }

  /**
   * Get customers stuck at a specific stage (SLA breach candidates)
   */
  static async getStuckCustomers(
    stageId: JourneyStageId,
    hoursThreshold: number = 72
  ): Promise<BusinessCustomer[]> {
    const supabase = await createClient();

    const thresholdDate = new Date();
    thresholdDate.setHours(thresholdDate.getHours() - hoursThreshold);

    const { data, error } = await supabase
      .from('business_journey_stages')
      .select(
        `
        business_customer_id,
        business_customers (*)
      `
      )
      .eq('stage', stageId)
      .eq('status', 'in_progress')
      .lt('started_at', thresholdDate.toISOString());

    if (error) {
      console.error('Error fetching stuck customers:', error);
      throw new Error(`Failed to fetch stuck customers: ${error.message}`);
    }

    return (data || [])
      .map((d) => d.business_customers as unknown as BusinessCustomer)
      .filter(Boolean);
  }
}

// ============================================================================
// Export singleton instance for convenience
// ============================================================================

export const journeyService = BusinessJourneyService;
