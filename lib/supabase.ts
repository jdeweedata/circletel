/**
 * Supabase Client - Unified Export
 *
 * IMPORTANT: This file re-exports from lib/supabase/client.ts to ensure
 * a single GoTrueClient instance across the entire application.
 *
 * All imports should ultimately resolve to the same singleton client.
 */

// Re-export the singleton client from lib/supabase/client.ts
import { supabase as singletonClient } from './supabase/client';

// Export with both names for backwards compatibility
export const typedSupabase = singletonClient;
export const supabase = singletonClient;

// Database Types
export interface Database {
  public: {
    Tables: {
      unjani_contract_audits: {
        Row: {
          id: string;
          clinic_name: string;
          clinical_lead_name: string;
          clinical_lead_contact: string;
          clinic_contact: string;
          clinic_email: string;
          business_registration_number?: string;
          vat_number?: string;
          head_office_address: string;
          clinic_address: string;
          number_of_healthcare_practitioners: number;
          services_offered: string[];
          average_monthly_patient_volume: number;
          compliance_level: number;
          healthcare_regulations: Record<string, unknown>;
          it_assessment: Record<string, unknown>;
          operational_requirements: Record<string, unknown>;
          technology_readiness: Record<string, unknown>;
          areas_for_improvement: string[];
          recommendations: string[];
          risk_score: number;
          overall_score: number;
          migration_priority?: string;
          priority_reason?: string;
          submitted_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Insert: Omit<Database['public']['Tables']['unjani_contract_audits']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['unjani_contract_audits']['Insert']>;
      };
      admin_product_catalogue: {
        Row: {
          id: string;
          name: string;
          category: string;
          type: string;
          status: string;
          price: string;
          setup_fee?: string;
          description: string;
          features: string[];
          speed_down?: string;
          speed_up?: string;
          data_limit?: string;
          target_market: string;
          contract_term?: string;
          availability: string;
          created_at?: string;
          updated_at?: string;
          created_by?: string;
          last_modified_by?: string;
        };
        Insert: Omit<Database['public']['Tables']['admin_product_catalogue']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['admin_product_catalogue']['Insert']>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Typed Supabase client - use SupabaseClient type from the package
import type { SupabaseClient } from '@supabase/supabase-js';
export type TypedSupabaseClient = SupabaseClient<Database>;

// Form submission types and functions
export interface FormSubmissionResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    clinicName: string;
    submittedAt: string;
  };
  error?: string;
  details?: string;
}