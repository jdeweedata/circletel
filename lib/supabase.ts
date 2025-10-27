import { createClient } from '@supabase/supabase-js';

// Lazy initialization to avoid build-time errors
let _typedSupabase: ReturnType<typeof createClient<Database>> | null = null;

function getSupabaseClient() {
  if (_typedSupabase) return _typedSupabase;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  _typedSupabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        'x-application-name': 'circletel-nextjs',
      },
    },
  });

  return _typedSupabase;
}

// Export as a getter to maintain singleton pattern but with lazy initialization
export const typedSupabase = new Proxy({} as ReturnType<typeof createClient<Database>>, {
  get(_, prop) {
    return getSupabaseClient()[prop as keyof ReturnType<typeof createClient<Database>>];
  }
});

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

// Typed Supabase client
export type TypedSupabaseClient = ReturnType<typeof createClient<Database>>;

// Backwards-compatible alias
export const supabase = typedSupabase;

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