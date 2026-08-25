/**
 * AUTO-GENERATED from live Supabase project agyjovdugmtopasyvlng.
 * Do not edit by hand. Regenerate with: npm run types:generate
 *
 * Public re-export: lib/types/database.types.ts
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      account_number_counter: {
        Row: {
          counter: number
          created_at: string
          updated_at: string
          year: number
        }
        Insert: {
          counter?: number
          created_at?: string
          updated_at?: string
          year: number
        }
        Update: {
          counter?: number
          created_at?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      admin_activity_log: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_activity_log_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_activity_log_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_activity_log_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_logs: {
        Row: {
          action: string
          action_category: string
          admin_user_id: string | null
          created_at: string | null
          error_message: string | null
          id: string
          ip_address: string | null
          is_suspicious: boolean | null
          metadata: Json | null
          request_method: string | null
          request_path: string | null
          severity: string | null
          status: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          action_category: string
          admin_user_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          is_suspicious?: boolean | null
          metadata?: Json | null
          request_method?: string | null
          request_path?: string | null
          severity?: string | null
          status?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          action_category?: string
          admin_user_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          is_suspicious?: boolean | null
          metadata?: Json | null
          request_method?: string | null
          request_path?: string | null
          severity?: string | null
          status?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_audit_logs_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_audit_logs_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_product_addons: {
        Row: {
          applicable_categories:
            | Database["public"]["Enums"]["admin_product_category"][]
            | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_monthly: boolean | null
          name: string
          price: number
        }
        Insert: {
          applicable_categories?:
            | Database["public"]["Enums"]["admin_product_category"][]
            | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_monthly?: boolean | null
          name: string
          price: number
        }
        Update: {
          applicable_categories?:
            | Database["public"]["Enums"]["admin_product_category"][]
            | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_monthly?: boolean | null
          name?: string
          price?: number
        }
        Relationships: []
      }
      admin_product_changes: {
        Row: {
          change_type: Database["public"]["Enums"]["change_type"]
          field_name: string | null
          id: string
          metadata: Json | null
          new_value: Json | null
          old_value: Json | null
          product_id: string | null
          reason: string | null
          requested_at: string | null
          requested_by: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["approval_status"] | null
        }
        Insert: {
          change_type: Database["public"]["Enums"]["change_type"]
          field_name?: string | null
          id?: string
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          product_id?: string | null
          reason?: string | null
          requested_at?: string | null
          requested_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["approval_status"] | null
        }
        Update: {
          change_type?: Database["public"]["Enums"]["change_type"]
          field_name?: string | null
          id?: string
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          product_id?: string | null
          reason?: string | null
          requested_at?: string | null
          requested_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["approval_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_product_changes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "admin_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_product_changes_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_product_changes_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_product_changes_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_product_changes_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_product_changes_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_product_changes_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_product_features: {
        Row: {
          created_at: string | null
          feature_category: string | null
          feature_name: string
          feature_value: string | null
          id: string
          is_highlighted: boolean | null
          product_id: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          feature_category?: string | null
          feature_name: string
          feature_value?: string | null
          id?: string
          is_highlighted?: boolean | null
          product_id: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          feature_category?: string | null
          feature_name?: string
          feature_value?: string | null
          id?: string
          is_highlighted?: boolean | null
          product_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_product_features_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "admin_products"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_product_hardware: {
        Row: {
          created_at: string | null
          dealer_cost: number | null
          hardware_model: string
          hardware_type: string
          id: string
          is_included: boolean | null
          product_id: string
          retail_value: number | null
          specifications: Json | null
        }
        Insert: {
          created_at?: string | null
          dealer_cost?: number | null
          hardware_model: string
          hardware_type: string
          id?: string
          is_included?: boolean | null
          product_id: string
          retail_value?: number | null
          specifications?: Json | null
        }
        Update: {
          created_at?: string | null
          dealer_cost?: number | null
          hardware_model?: string
          hardware_type?: string
          id?: string
          is_included?: boolean | null
          product_id?: string
          retail_value?: number | null
          specifications?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_product_hardware_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "admin_products"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_product_pricing: {
        Row: {
          approval_status: Database["public"]["Enums"]["approval_status"] | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          effective_from: string | null
          effective_to: string | null
          hardware_contribution: number | null
          id: string
          installation_fee: number | null
          is_promotional: boolean | null
          price_promo: number | null
          price_regular: number
          product_id: string
          promo_end_date: string | null
          promo_start_date: string | null
          router_rental: number | null
          updated_at: string | null
        }
        Insert: {
          approval_status?:
            | Database["public"]["Enums"]["approval_status"]
            | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          effective_from?: string | null
          effective_to?: string | null
          hardware_contribution?: number | null
          id?: string
          installation_fee?: number | null
          is_promotional?: boolean | null
          price_promo?: number | null
          price_regular: number
          product_id: string
          promo_end_date?: string | null
          promo_start_date?: string | null
          router_rental?: number | null
          updated_at?: string | null
        }
        Update: {
          approval_status?:
            | Database["public"]["Enums"]["approval_status"]
            | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          effective_from?: string | null
          effective_to?: string | null
          hardware_contribution?: number | null
          id?: string
          installation_fee?: number | null
          is_promotional?: boolean | null
          price_promo?: number | null
          price_regular?: number
          product_id?: string
          promo_end_date?: string | null
          promo_start_date?: string | null
          router_rental?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_product_pricing_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_product_pricing_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_product_pricing_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_product_pricing_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "admin_products"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_products: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          category: Database["public"]["Enums"]["admin_product_category"]
          contract_terms: number[] | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_current: boolean | null
          is_featured: boolean | null
          is_symmetrical: boolean | null
          long_description: string | null
          name: string
          service_type: string
          slug: string
          sort_order: number | null
          speed_down: number
          speed_up: number
          status: Database["public"]["Enums"]["admin_product_status"] | null
          updated_at: string | null
          updated_by: string | null
          version: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          category: Database["public"]["Enums"]["admin_product_category"]
          contract_terms?: number[] | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_current?: boolean | null
          is_featured?: boolean | null
          is_symmetrical?: boolean | null
          long_description?: string | null
          name: string
          service_type: string
          slug: string
          sort_order?: number | null
          speed_down: number
          speed_up: number
          status?: Database["public"]["Enums"]["admin_product_status"] | null
          updated_at?: string | null
          updated_by?: string | null
          version?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          category?: Database["public"]["Enums"]["admin_product_category"]
          contract_terms?: number[] | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_current?: boolean | null
          is_featured?: boolean | null
          is_symmetrical?: boolean | null
          long_description?: string | null
          name?: string
          service_type?: string
          slug?: string
          sort_order?: number | null
          speed_down?: number
          speed_up?: number
          status?: Database["public"]["Enums"]["admin_product_status"] | null
          updated_at?: string | null
          updated_by?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_products_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_products_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_products_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_products_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_products_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_products_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_products_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_products_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_products_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          created_at: string | null
          custom_permissions: Json | null
          department: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          job_title: string | null
          last_login: string | null
          permissions: Json | null
          role: string
          role_template_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custom_permissions?: Json | null
          department?: string | null
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          job_title?: string | null
          last_login?: string | null
          permissions?: Json | null
          role: string
          role_template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custom_permissions?: Json | null
          department?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          job_title?: string | null
          last_login?: string | null
          permissions?: Json | null
          role?: string
          role_template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_users_role_template_id_fkey"
            columns: ["role_template_id"]
            isOneToOne: false
            referencedRelation: "role_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_quote_links: {
        Row: {
          active: boolean | null
          agent_id: string
          created_at: string
          expires_at: string | null
          id: string
          max_uses: number | null
          token: string
          use_count: number | null
        }
        Insert: {
          active?: boolean | null
          agent_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          token?: string
          use_count?: number | null
        }
        Update: {
          active?: boolean | null
          agent_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          token?: string
          use_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_quote_links_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "sales_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_logs: {
        Row: {
          content_type: string | null
          created_at: string
          error_message: string | null
          estimated_cost_cents: number | null
          id: string
          input_tokens: number | null
          model_used: string
          output_tokens: number | null
          page_id: string | null
          prompt_length: number | null
          request_type: string
          response_time_ms: number | null
          success: boolean
          total_tokens: number | null
          user_id: string
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          error_message?: string | null
          estimated_cost_cents?: number | null
          id?: string
          input_tokens?: number | null
          model_used: string
          output_tokens?: number | null
          page_id?: string | null
          prompt_length?: number | null
          request_type: string
          response_time_ms?: number | null
          success?: boolean
          total_tokens?: number | null
          user_id: string
        }
        Update: {
          content_type?: string | null
          created_at?: string
          error_message?: string | null
          estimated_cost_cents?: number | null
          id?: string
          input_tokens?: number | null
          model_used?: string
          output_tokens?: number | null
          page_id?: string | null
          prompt_length?: number | null
          request_type?: string
          response_time_ms?: number | null
          success?: boolean
          total_tokens?: number | null
          user_id?: string
        }
        Relationships: []
      }
      ambassador_codes: {
        Row: {
          ambassador_id: string
          code: string
          created_at: string
          destination_url: string | null
          discount_type: string | null
          discount_value: number | null
          expires_at: string | null
          id: string
          is_active: boolean
          label: string | null
          total_clicks: number
          total_conversions: number
          total_revenue: number
          unique_clicks: number
        }
        Insert: {
          ambassador_id: string
          code: string
          created_at?: string
          destination_url?: string | null
          discount_type?: string | null
          discount_value?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          label?: string | null
          total_clicks?: number
          total_conversions?: number
          total_revenue?: number
          unique_clicks?: number
        }
        Update: {
          ambassador_id?: string
          code?: string
          created_at?: string
          destination_url?: string | null
          discount_type?: string | null
          discount_value?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          label?: string | null
          total_clicks?: number
          total_conversions?: number
          total_revenue?: number
          unique_clicks?: number
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_codes_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "ambassadors"
            referencedColumns: ["id"]
          },
        ]
      }
      ambassador_earnings: {
        Row: {
          adjustments: number | null
          ambassador_id: string
          approved_at: string | null
          approved_by: string | null
          calculated_at: string
          clicks: number
          commission_rate: number
          conversions: number
          gross_earnings: number
          gross_revenue: number
          id: string
          net_earnings: number
          paid_at: string | null
          payment_method: string | null
          payment_reference: string | null
          period_end: string
          period_start: string
          status: string
        }
        Insert: {
          adjustments?: number | null
          ambassador_id: string
          approved_at?: string | null
          approved_by?: string | null
          calculated_at?: string
          clicks?: number
          commission_rate: number
          conversions?: number
          gross_earnings?: number
          gross_revenue?: number
          id?: string
          net_earnings?: number
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          period_end: string
          period_start: string
          status?: string
        }
        Update: {
          adjustments?: number | null
          ambassador_id?: string
          approved_at?: string | null
          approved_by?: string | null
          calculated_at?: string
          clicks?: number
          commission_rate?: number
          conversions?: number
          gross_earnings?: number
          gross_revenue?: number
          id?: string
          net_earnings?: number
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          period_end?: string
          period_start?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_earnings_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "ambassadors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambassador_earnings_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambassador_earnings_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambassador_earnings_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      ambassadors: {
        Row: {
          ambassador_number: string | null
          approved_at: string | null
          approved_by: string | null
          audience_size: number | null
          commission_rate: number
          created_at: string
          email: string
          full_name: string
          id: string
          pending_earnings: number
          phone: string | null
          social_handle: string | null
          social_platform: string | null
          status: string
          tier: string
          total_clicks: number
          total_conversions: number
          total_earnings: number
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          ambassador_number?: string | null
          approved_at?: string | null
          approved_by?: string | null
          audience_size?: number | null
          commission_rate?: number
          created_at?: string
          email: string
          full_name: string
          id?: string
          pending_earnings?: number
          phone?: string | null
          social_handle?: string | null
          social_platform?: string | null
          status?: string
          tier?: string
          total_clicks?: number
          total_conversions?: number
          total_earnings?: number
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          ambassador_number?: string | null
          approved_at?: string | null
          approved_by?: string | null
          audience_size?: number | null
          commission_rate?: number
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          pending_earnings?: number
          phone?: string | null
          social_handle?: string | null
          social_platform?: string | null
          status?: string
          tier?: string
          total_clicks?: number
          total_conversions?: number
          total_earnings?: number
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ambassadors_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambassadors_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambassadors_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      approvals: {
        Row: {
          approved_at: string | null
          approver_id: string
          comments: string | null
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          status: string
        }
        Insert: {
          approved_at?: string | null
          approver_id: string
          comments?: string | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          status?: string
        }
        Update: {
          approved_at?: string | null
          approver_id?: string
          comments?: string | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "approvals_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ar_aging_snapshots: {
        Row: {
          average_days_delinquent: number | null
          collection_effectiveness_index: number | null
          created_at: string | null
          current_amount: number | null
          current_count: number | null
          dso_best_possible: number | null
          dso_current: number | null
          email_sent_count: number | null
          id: string
          overdue_1_30_amount: number | null
          overdue_1_30_count: number | null
          overdue_31_60_amount: number | null
          overdue_31_60_count: number | null
          overdue_61_90_amount: number | null
          overdue_61_90_count: number | null
          overdue_90_plus_amount: number | null
          overdue_90_plus_count: number | null
          payments_received_amount: number | null
          payments_received_count: number | null
          sms_sent_count: number | null
          snapshot_date: string
          total_invoices: number
          total_notifications: number | null
          total_outstanding: number
        }
        Insert: {
          average_days_delinquent?: number | null
          collection_effectiveness_index?: number | null
          created_at?: string | null
          current_amount?: number | null
          current_count?: number | null
          dso_best_possible?: number | null
          dso_current?: number | null
          email_sent_count?: number | null
          id?: string
          overdue_1_30_amount?: number | null
          overdue_1_30_count?: number | null
          overdue_31_60_amount?: number | null
          overdue_31_60_count?: number | null
          overdue_61_90_amount?: number | null
          overdue_61_90_count?: number | null
          overdue_90_plus_amount?: number | null
          overdue_90_plus_count?: number | null
          payments_received_amount?: number | null
          payments_received_count?: number | null
          sms_sent_count?: number | null
          snapshot_date: string
          total_invoices?: number
          total_notifications?: number | null
          total_outstanding?: number
        }
        Update: {
          average_days_delinquent?: number | null
          collection_effectiveness_index?: number | null
          created_at?: string | null
          current_amount?: number | null
          current_count?: number | null
          dso_best_possible?: number | null
          dso_current?: number | null
          email_sent_count?: number | null
          id?: string
          overdue_1_30_amount?: number | null
          overdue_1_30_count?: number | null
          overdue_31_60_amount?: number | null
          overdue_31_60_count?: number | null
          overdue_61_90_amount?: number | null
          overdue_61_90_count?: number | null
          overdue_90_plus_amount?: number | null
          overdue_90_plus_count?: number | null
          payments_received_amount?: number | null
          payments_received_count?: number | null
          sms_sent_count?: number | null
          snapshot_date?: string
          total_invoices?: number
          total_notifications?: number | null
          total_outstanding?: number
        }
        Relationships: []
      }
      attribution_logs: {
        Row: {
          commission_amount: number | null
          commission_status: string | null
          created_at: string
          customer_id: string | null
          event_type: string
          id: string
          ip_address: unknown
          order_id: string | null
          order_type: string | null
          order_value: number | null
          referrer_url: string | null
          session_id: string | null
          source_id: string | null
          source_type: string
          tracking_code: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          commission_amount?: number | null
          commission_status?: string | null
          created_at?: string
          customer_id?: string | null
          event_type: string
          id?: string
          ip_address?: unknown
          order_id?: string | null
          order_type?: string | null
          order_value?: number | null
          referrer_url?: string | null
          session_id?: string | null
          source_id?: string | null
          source_type: string
          tracking_code?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          commission_amount?: number | null
          commission_status?: string | null
          created_at?: string
          customer_id?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown
          order_id?: string | null
          order_type?: string | null
          order_value?: number | null
          referrer_url?: string | null
          session_id?: string | null
          source_id?: string | null
          source_type?: string
          tracking_code?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attribution_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_dashboard_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "attribution_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attribution_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_notification_engagement"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id: string
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string
          table_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      b2b_coverage_checks: {
        Row: {
          address: string
          clinic_name: string | null
          created_at: string
          created_by: string
          id: string
          latitude: number
          longitude: number
          organisation_id: string
          results: Json
        }
        Insert: {
          address: string
          clinic_name?: string | null
          created_at?: string
          created_by: string
          id?: string
          latitude: number
          longitude: number
          organisation_id: string
          results?: Json
        }
        Update: {
          address?: string
          clinic_name?: string | null
          created_at?: string
          created_by?: string
          id?: string
          latitude?: number
          longitude?: number
          organisation_id?: string
          results?: Json
        }
        Relationships: [
          {
            foreignKeyName: "b2b_coverage_checks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "b2b_portal_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "b2b_coverage_checks_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "corporate_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      b2b_portal_users: {
        Row: {
          auth_user_id: string
          created_at: string | null
          created_by: string | null
          display_name: string
          email: string
          id: string
          is_internal: boolean
          organisation_id: string
          role: string
          site_id: string | null
          updated_at: string | null
        }
        Insert: {
          auth_user_id: string
          created_at?: string | null
          created_by?: string | null
          display_name: string
          email: string
          id?: string
          is_internal?: boolean
          organisation_id: string
          role: string
          site_id?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string
          created_at?: string | null
          created_by?: string | null
          display_name?: string
          email?: string
          id?: string
          is_internal?: boolean
          organisation_id?: string
          role?: string
          site_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "b2b_portal_users_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "corporate_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "b2b_portal_users_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "corporate_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      b2b_support_tickets: {
        Row: {
          created_at: string
          description: string
          desk_status_synced_at: string | null
          id: string
          organisation_id: string
          priority: string
          resolved_at: string | null
          site_id: string | null
          status: string
          subject: string
          submitted_by: string
          ticket_type: Database["public"]["Enums"]["support_ticket_type"]
          updated_at: string
          zoho_ticket_id: string | null
          zoho_ticket_number: string | null
        }
        Insert: {
          created_at?: string
          description: string
          desk_status_synced_at?: string | null
          id?: string
          organisation_id: string
          priority?: string
          resolved_at?: string | null
          site_id?: string | null
          status?: string
          subject: string
          submitted_by: string
          ticket_type?: Database["public"]["Enums"]["support_ticket_type"]
          updated_at?: string
          zoho_ticket_id?: string | null
          zoho_ticket_number?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          desk_status_synced_at?: string | null
          id?: string
          organisation_id?: string
          priority?: string
          resolved_at?: string | null
          site_id?: string | null
          status?: string
          subject?: string
          submitted_by?: string
          ticket_type?: Database["public"]["Enums"]["support_ticket_type"]
          updated_at?: string
          zoho_ticket_id?: string | null
          zoho_ticket_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "b2b_support_tickets_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "corporate_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "b2b_support_tickets_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "corporate_sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "b2b_support_tickets_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "b2b_portal_users"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_cron_logs: {
        Row: {
          created_at: string | null
          cron_type: string
          details: Json | null
          dry_run: boolean | null
          emails_sent: number | null
          failed: number | null
          id: string
          invoices_created: number | null
          run_date: string
          services_processed: number | null
          skipped: number | null
          sms_sent: number | null
          zoho_synced: number | null
        }
        Insert: {
          created_at?: string | null
          cron_type: string
          details?: Json | null
          dry_run?: boolean | null
          emails_sent?: number | null
          failed?: number | null
          id?: string
          invoices_created?: number | null
          run_date?: string
          services_processed?: number | null
          skipped?: number | null
          sms_sent?: number | null
          zoho_synced?: number | null
        }
        Update: {
          created_at?: string | null
          cron_type?: string
          details?: Json | null
          dry_run?: boolean | null
          emails_sent?: number | null
          failed?: number | null
          id?: string
          invoices_created?: number | null
          run_date?: string
          services_processed?: number | null
          skipped?: number | null
          sms_sent?: number | null
          zoho_synced?: number | null
        }
        Relationships: []
      }
      billing_cycle_exceptions: {
        Row: {
          audit_events: Json
          created_at: string
          customer_id: string
          cycles_affected: number
          diagnosis: string
          display_code: string
          field_diff: Json
          id: string
          kind: string
          leak_type: string | null
          match_id: string
          pattern_key: string | null
          recoverable: number
          resolved_at: string | null
          resolved_by: string | null
          run_id: string
          service_id: string
          status: string
          variance: number
        }
        Insert: {
          audit_events?: Json
          created_at?: string
          customer_id: string
          cycles_affected?: number
          diagnosis: string
          display_code: string
          field_diff?: Json
          id?: string
          kind: string
          leak_type?: string | null
          match_id: string
          pattern_key?: string | null
          recoverable?: number
          resolved_at?: string | null
          resolved_by?: string | null
          run_id: string
          service_id: string
          status?: string
          variance?: number
        }
        Update: {
          audit_events?: Json
          created_at?: string
          customer_id?: string
          cycles_affected?: number
          diagnosis?: string
          display_code?: string
          field_diff?: Json
          id?: string
          kind?: string
          leak_type?: string | null
          match_id?: string
          pattern_key?: string | null
          recoverable?: number
          resolved_at?: string | null
          resolved_by?: string | null
          run_id?: string
          service_id?: string
          status?: string
          variance?: number
        }
        Relationships: [
          {
            foreignKeyName: "billing_cycle_exceptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_dashboard_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "billing_cycle_exceptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_cycle_exceptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_notification_engagement"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "billing_cycle_exceptions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "billing_cycle_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_cycle_exceptions_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "cycle_match_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_cycle_exceptions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "customer_services"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_cycle_matches: {
        Row: {
          created_at: string
          customer_id: string
          diagnosis: string | null
          exposure: number
          field_diff: Json
          id: string
          leak_type: string | null
          match_state: string
          netcash_amount: number | null
          netcash_ref: string | null
          pairwise: Json
          pattern_key: string | null
          platform_amount_ex_vat: number | null
          platform_amount_incl_vat: number | null
          platform_record_id: string | null
          recommended_action: string | null
          run_id: string
          service_id: string
          variance: number
          zoho_amount_ex_vat: number | null
          zoho_amount_incl_vat: number | null
          zoho_books_invoice_id: string | null
          zoho_invoice_id: string | null
          zoho_invoice_number: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          diagnosis?: string | null
          exposure?: number
          field_diff?: Json
          id?: string
          leak_type?: string | null
          match_state: string
          netcash_amount?: number | null
          netcash_ref?: string | null
          pairwise?: Json
          pattern_key?: string | null
          platform_amount_ex_vat?: number | null
          platform_amount_incl_vat?: number | null
          platform_record_id?: string | null
          recommended_action?: string | null
          run_id: string
          service_id: string
          variance?: number
          zoho_amount_ex_vat?: number | null
          zoho_amount_incl_vat?: number | null
          zoho_books_invoice_id?: string | null
          zoho_invoice_id?: string | null
          zoho_invoice_number?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          diagnosis?: string | null
          exposure?: number
          field_diff?: Json
          id?: string
          leak_type?: string | null
          match_state?: string
          netcash_amount?: number | null
          netcash_ref?: string | null
          pairwise?: Json
          pattern_key?: string | null
          platform_amount_ex_vat?: number | null
          platform_amount_incl_vat?: number | null
          platform_record_id?: string | null
          recommended_action?: string | null
          run_id?: string
          service_id?: string
          variance?: number
          zoho_amount_ex_vat?: number | null
          zoho_amount_incl_vat?: number | null
          zoho_books_invoice_id?: string | null
          zoho_invoice_id?: string | null
          zoho_invoice_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_cycle_matches_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_dashboard_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "billing_cycle_matches_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_cycle_matches_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_notification_engagement"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "billing_cycle_matches_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "cycle_match_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_cycle_matches_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "customer_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_cycle_matches_zoho_invoice_id_fkey"
            columns: ["zoho_invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_cycles: {
        Row: {
          contract_id: string
          created_at: string | null
          cycle_number: number
          id: string
          invoice_id: string | null
          period_end: string
          period_start: string
          status: string
        }
        Insert: {
          contract_id: string
          created_at?: string | null
          cycle_number: number
          id?: string
          invoice_id?: string | null
          period_end: string
          period_start: string
          status?: string
        }
        Update: {
          contract_id?: string
          created_at?: string | null
          cycle_number?: number
          id?: string
          invoice_id?: string | null
          period_end?: string
          period_start?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_cycles_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_cycles_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_run_log: {
        Row: {
          billing_day: number
          completed_at: string | null
          customers_processed: number | null
          duration_ms: number | null
          error_details: Json | null
          id: string
          invoice_ids: string[] | null
          invoices_failed: number | null
          invoices_generated: number | null
          run_date: string
          run_type: string
          started_at: string
          status: string
          total_amount_billed: number | null
          triggered_by: string | null
          triggered_by_system: boolean | null
        }
        Insert: {
          billing_day: number
          completed_at?: string | null
          customers_processed?: number | null
          duration_ms?: number | null
          error_details?: Json | null
          id?: string
          invoice_ids?: string[] | null
          invoices_failed?: number | null
          invoices_generated?: number | null
          run_date: string
          run_type: string
          started_at?: string
          status?: string
          total_amount_billed?: number | null
          triggered_by?: string | null
          triggered_by_system?: boolean | null
        }
        Update: {
          billing_day?: number
          completed_at?: string | null
          customers_processed?: number | null
          duration_ms?: number | null
          error_details?: Json | null
          id?: string
          invoice_ids?: string[] | null
          invoices_failed?: number | null
          invoices_generated?: number | null
          run_date?: string
          run_type?: string
          started_at?: string
          status?: string
          total_amount_billed?: number | null
          triggered_by?: string | null
          triggered_by_system?: boolean | null
        }
        Relationships: []
      }
      billing_settings: {
        Row: {
          category: string | null
          created_at: string | null
          customer_type: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          customer_type?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          customer_type?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_items: {
        Row: {
          actual_amount_zar: number | null
          budget_id: string
          category: string
          created_at: string | null
          description: string
          id: string
          justification: string | null
          planned_amount_zar: number
          priority: string | null
          subcategory: string | null
          updated_at: string | null
          variance_zar: number | null
        }
        Insert: {
          actual_amount_zar?: number | null
          budget_id: string
          category: string
          created_at?: string | null
          description: string
          id?: string
          justification?: string | null
          planned_amount_zar: number
          priority?: string | null
          subcategory?: string | null
          updated_at?: string | null
          variance_zar?: number | null
        }
        Update: {
          actual_amount_zar?: number | null
          budget_id?: string
          category?: string
          created_at?: string | null
          description?: string
          id?: string
          justification?: string | null
          planned_amount_zar?: number
          priority?: string | null
          subcategory?: string | null
          updated_at?: string | null
          variance_zar?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          allocated_budget_zar: number | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          created_by: string
          department_id: string
          financial_period_id: string
          id: string
          name: string
          spent_budget_zar: number | null
          status: string | null
          total_budget_zar: number
          updated_at: string | null
        }
        Insert: {
          allocated_budget_zar?: number | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by: string
          department_id: string
          financial_period_id: string
          id?: string
          name: string
          spent_budget_zar?: number | null
          status?: string | null
          total_budget_zar?: number
          updated_at?: string | null
        }
        Update: {
          allocated_budget_zar?: number | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string
          department_id?: string
          financial_period_id?: string
          id?: string
          name?: string
          spent_budget_zar?: number | null
          status?: string | null
          total_budget_zar?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budgets_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_financial_period_id_fkey"
            columns: ["financial_period_id"]
            isOneToOne: false
            referencedRelation: "financial_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      business_customers: {
        Row: {
          account_number: string | null
          account_status:
            | Database["public"]["Enums"]["business_account_status"]
            | null
          annual_revenue: string | null
          auth_user_id: string | null
          billing_contact_email: string | null
          billing_contact_name: string | null
          billing_contact_phone: string | null
          company_name: string
          company_type: Database["public"]["Enums"]["company_type"] | null
          created_at: string | null
          credit_limit: number | null
          employee_count: string | null
          id: string
          industry: string | null
          kyc_status: Database["public"]["Enums"]["business_kyc_status"] | null
          last_login_at: string | null
          lead_source: string | null
          partner_id: string | null
          payment_terms: number | null
          physical_address: Json | null
          postal_address: Json | null
          primary_contact_email: string
          primary_contact_name: string
          primary_contact_phone: string | null
          primary_contact_position: string | null
          referred_by: string | null
          registration_number: string | null
          technical_contact_email: string | null
          technical_contact_name: string | null
          technical_contact_phone: string | null
          trading_name: string | null
          updated_at: string | null
          vat_number: string | null
          verified_at: string | null
        }
        Insert: {
          account_number?: string | null
          account_status?:
            | Database["public"]["Enums"]["business_account_status"]
            | null
          annual_revenue?: string | null
          auth_user_id?: string | null
          billing_contact_email?: string | null
          billing_contact_name?: string | null
          billing_contact_phone?: string | null
          company_name: string
          company_type?: Database["public"]["Enums"]["company_type"] | null
          created_at?: string | null
          credit_limit?: number | null
          employee_count?: string | null
          id?: string
          industry?: string | null
          kyc_status?: Database["public"]["Enums"]["business_kyc_status"] | null
          last_login_at?: string | null
          lead_source?: string | null
          partner_id?: string | null
          payment_terms?: number | null
          physical_address?: Json | null
          postal_address?: Json | null
          primary_contact_email: string
          primary_contact_name: string
          primary_contact_phone?: string | null
          primary_contact_position?: string | null
          referred_by?: string | null
          registration_number?: string | null
          technical_contact_email?: string | null
          technical_contact_name?: string | null
          technical_contact_phone?: string | null
          trading_name?: string | null
          updated_at?: string | null
          vat_number?: string | null
          verified_at?: string | null
        }
        Update: {
          account_number?: string | null
          account_status?:
            | Database["public"]["Enums"]["business_account_status"]
            | null
          annual_revenue?: string | null
          auth_user_id?: string | null
          billing_contact_email?: string | null
          billing_contact_name?: string | null
          billing_contact_phone?: string | null
          company_name?: string
          company_type?: Database["public"]["Enums"]["company_type"] | null
          created_at?: string | null
          credit_limit?: number | null
          employee_count?: string | null
          id?: string
          industry?: string | null
          kyc_status?: Database["public"]["Enums"]["business_kyc_status"] | null
          last_login_at?: string | null
          lead_source?: string | null
          partner_id?: string | null
          payment_terms?: number | null
          physical_address?: Json | null
          postal_address?: Json | null
          primary_contact_email?: string
          primary_contact_name?: string
          primary_contact_phone?: string | null
          primary_contact_position?: string | null
          referred_by?: string | null
          registration_number?: string | null
          technical_contact_email?: string | null
          technical_contact_name?: string | null
          technical_contact_phone?: string | null
          trading_name?: string | null
          updated_at?: string | null
          vat_number?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_customers_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "business_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_customers_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "business_journey_summary"
            referencedColumns: ["business_customer_id"]
          },
        ]
      }
      business_journey_stages: {
        Row: {
          blocked_reason: string | null
          business_customer_id: string
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          due_date: string | null
          id: string
          metadata: Json | null
          notes: string | null
          quote_id: string | null
          required_documents: Json | null
          stage: Database["public"]["Enums"]["business_journey_stage"]
          started_at: string | null
          status: Database["public"]["Enums"]["journey_stage_status"] | null
          step_number: number
          submitted_documents: Json | null
          updated_at: string | null
        }
        Insert: {
          blocked_reason?: string | null
          business_customer_id: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          quote_id?: string | null
          required_documents?: Json | null
          stage: Database["public"]["Enums"]["business_journey_stage"]
          started_at?: string | null
          status?: Database["public"]["Enums"]["journey_stage_status"] | null
          step_number: number
          submitted_documents?: Json | null
          updated_at?: string | null
        }
        Update: {
          blocked_reason?: string | null
          business_customer_id?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          quote_id?: string | null
          required_documents?: Json | null
          stage?: Database["public"]["Enums"]["business_journey_stage"]
          started_at?: string | null
          status?: Database["public"]["Enums"]["journey_stage_status"] | null
          step_number?: number
          submitted_documents?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_journey_stages_business_customer_id_fkey"
            columns: ["business_customer_id"]
            isOneToOne: false
            referencedRelation: "business_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_journey_stages_business_customer_id_fkey"
            columns: ["business_customer_id"]
            isOneToOne: false
            referencedRelation: "business_journey_summary"
            referencedColumns: ["business_customer_id"]
          },
          {
            foreignKeyName: "business_journey_stages_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "business_quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_journey_stages_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quote_analytics"
            referencedColumns: ["quote_id"]
          },
        ]
      }
      business_quote_items: {
        Row: {
          benefits_snapshot: Json | null
          created_at: string | null
          custom_pricing: boolean | null
          data_cap_gb: number | null
          display_order: number
          id: string
          installation_price: number
          item_type: Database["public"]["Enums"]["quote_item_type"]
          monthly_price: number
          notes: string | null
          package_id: string
          product_category: string
          quantity: number
          quote_id: string
          service_name: string
          service_type: string
          speed_down: number | null
          speed_up: number | null
          updated_at: string | null
        }
        Insert: {
          benefits_snapshot?: Json | null
          created_at?: string | null
          custom_pricing?: boolean | null
          data_cap_gb?: number | null
          display_order?: number
          id?: string
          installation_price?: number
          item_type?: Database["public"]["Enums"]["quote_item_type"]
          monthly_price: number
          notes?: string | null
          package_id: string
          product_category: string
          quantity?: number
          quote_id: string
          service_name: string
          service_type: string
          speed_down?: number | null
          speed_up?: number | null
          updated_at?: string | null
        }
        Update: {
          benefits_snapshot?: Json | null
          created_at?: string | null
          custom_pricing?: boolean | null
          data_cap_gb?: number | null
          display_order?: number
          id?: string
          installation_price?: number
          item_type?: Database["public"]["Enums"]["quote_item_type"]
          monthly_price?: number
          notes?: string | null
          package_id?: string
          product_category?: string
          quantity?: number
          quote_id?: string
          service_name?: string
          service_type?: string
          speed_down?: number | null
          speed_up?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_quote_items_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "service_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_quote_items_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "sme_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_quote_items_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "v_active_service_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_quote_items_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "v_products_with_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "business_quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quote_analytics"
            referencedColumns: ["quote_id"]
          },
        ]
      }
      business_quote_signatures: {
        Row: {
          cipc_documents_confirmed: boolean | null
          fica_documents_confirmed: boolean | null
          id: string
          ip_address: string | null
          quote_id: string
          signature_data: string
          signature_type: string
          signed_at: string | null
          signer_email: string
          signer_id_number: string
          signer_name: string
          signer_position: string | null
          terms_accepted: boolean
          user_agent: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          cipc_documents_confirmed?: boolean | null
          fica_documents_confirmed?: boolean | null
          id?: string
          ip_address?: string | null
          quote_id: string
          signature_data: string
          signature_type: string
          signed_at?: string | null
          signer_email: string
          signer_id_number: string
          signer_name: string
          signer_position?: string | null
          terms_accepted?: boolean
          user_agent?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          cipc_documents_confirmed?: boolean | null
          fica_documents_confirmed?: boolean | null
          id?: string
          ip_address?: string | null
          quote_id?: string
          signature_data?: string
          signature_type?: string
          signed_at?: string | null
          signer_email?: string
          signer_id_number?: string
          signer_name?: string
          signer_position?: string | null
          terms_accepted?: boolean
          user_agent?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_quote_signatures_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: true
            referencedRelation: "business_quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_quote_signatures_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: true
            referencedRelation: "quote_analytics"
            referencedColumns: ["quote_id"]
          },
          {
            foreignKeyName: "business_quote_signatures_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_quote_signatures_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_quote_signatures_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      business_quote_terms: {
        Row: {
          active: boolean | null
          contract_term: number | null
          created_at: string | null
          created_by: string | null
          display_order: number | null
          id: string
          service_type: string
          terms_text: string
          title: string
          updated_at: string | null
          version: number
        }
        Insert: {
          active?: boolean | null
          contract_term?: number | null
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          id?: string
          service_type: string
          terms_text: string
          title: string
          updated_at?: string | null
          version?: number
        }
        Update: {
          active?: boolean | null
          contract_term?: number | null
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          id?: string
          service_type?: string
          terms_text?: string
          title?: string
          updated_at?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_quote_terms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_quote_terms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_quote_terms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      business_quote_versions: {
        Row: {
          change_summary: string | null
          changed_by: string | null
          created_at: string | null
          id: string
          quote_data: Json
          quote_id: string
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          quote_data: Json
          quote_id: string
          version_number: number
        }
        Update: {
          change_summary?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          quote_data?: Json
          quote_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_quote_versions_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_quote_versions_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_quote_versions_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_quote_versions_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "business_quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_quote_versions_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quote_analytics"
            referencedColumns: ["quote_id"]
          },
        ]
      }
      business_quotes: {
        Row: {
          acceptance_token: string | null
          accepted_at: string | null
          admin_notes: string | null
          agent_id: string | null
          approved_at: string | null
          approved_by: string | null
          client_acceptance_ip: unknown
          client_acceptance_user_agent: string | null
          company_name: string
          contact_email: string
          contact_name: string
          contact_phone: string
          contract_term: number
          coordinates: Json | null
          created_at: string | null
          created_by: string | null
          custom_discount_amount: number | null
          custom_discount_percent: number | null
          custom_discount_reason: string | null
          customer_id: string | null
          customer_notes: string | null
          customer_type: string
          expired_at: string | null
          id: string
          lead_id: string | null
          quote_number: string
          registration_number: string | null
          rejected_at: string | null
          rejected_by: string | null
          sent_at: string | null
          service_address: string
          share_enabled: boolean | null
          share_expires_at: string | null
          share_token: string | null
          status: Database["public"]["Enums"]["quote_status"]
          subtotal_installation: number
          subtotal_monthly: number
          total_installation: number
          total_monthly: number
          updated_at: string | null
          updated_by: string | null
          valid_until: string
          vat_amount_installation: number
          vat_amount_monthly: number
          vat_number: string | null
          viewed_at: string | null
        }
        Insert: {
          acceptance_token?: string | null
          accepted_at?: string | null
          admin_notes?: string | null
          agent_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          client_acceptance_ip?: unknown
          client_acceptance_user_agent?: string | null
          company_name: string
          contact_email: string
          contact_name: string
          contact_phone: string
          contract_term: number
          coordinates?: Json | null
          created_at?: string | null
          created_by?: string | null
          custom_discount_amount?: number | null
          custom_discount_percent?: number | null
          custom_discount_reason?: string | null
          customer_id?: string | null
          customer_notes?: string | null
          customer_type: string
          expired_at?: string | null
          id?: string
          lead_id?: string | null
          quote_number: string
          registration_number?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          sent_at?: string | null
          service_address: string
          share_enabled?: boolean | null
          share_expires_at?: string | null
          share_token?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          subtotal_installation?: number
          subtotal_monthly?: number
          total_installation?: number
          total_monthly?: number
          updated_at?: string | null
          updated_by?: string | null
          valid_until?: string
          vat_amount_installation?: number
          vat_amount_monthly?: number
          vat_number?: string | null
          viewed_at?: string | null
        }
        Update: {
          acceptance_token?: string | null
          accepted_at?: string | null
          admin_notes?: string | null
          agent_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          client_acceptance_ip?: unknown
          client_acceptance_user_agent?: string | null
          company_name?: string
          contact_email?: string
          contact_name?: string
          contact_phone?: string
          contract_term?: number
          coordinates?: Json | null
          created_at?: string | null
          created_by?: string | null
          custom_discount_amount?: number | null
          custom_discount_percent?: number | null
          custom_discount_reason?: string | null
          customer_id?: string | null
          customer_notes?: string | null
          customer_type?: string
          expired_at?: string | null
          id?: string
          lead_id?: string | null
          quote_number?: string
          registration_number?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          sent_at?: string | null
          service_address?: string
          share_enabled?: boolean | null
          share_expires_at?: string | null
          share_token?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          subtotal_installation?: number
          subtotal_monthly?: number
          total_installation?: number
          total_monthly?: number
          updated_at?: string | null
          updated_by?: string | null
          valid_until?: string
          vat_amount_installation?: number
          vat_amount_monthly?: number
          vat_number?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_quotes_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "sales_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_quotes_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_quotes_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_quotes_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_quotes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_quotes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_quotes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_quotes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_dashboard_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "business_quotes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_quotes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_notification_engagement"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "business_quotes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "coverage_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_quotes_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_quotes_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_quotes_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_quotes_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_quotes_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_quotes_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      business_site_details: {
        Row: {
          access_instructions: string | null
          access_type: Database["public"]["Enums"]["site_access_type"]
          admin_notes: string | null
          building_access_form_url: string | null
          building_manager_email: string | null
          building_manager_name: string | null
          building_manager_phone: string | null
          building_name: string | null
          business_customer_id: string
          cable_entry_point: string | null
          created_at: string | null
          equipment_location: Database["public"]["Enums"]["equipment_location"]
          floor_level: string | null
          has_ac_power: boolean
          has_access_control: boolean
          has_air_conditioning: boolean
          has_rack_facility: boolean
          id: string
          installation_address: Json | null
          journey_stage_id: string | null
          landlord_consent_signed: boolean | null
          landlord_consent_signed_at: string | null
          landlord_consent_url: string | null
          landlord_contact: string | null
          landlord_name: string | null
          premises_ownership: Database["public"]["Enums"]["premises_ownership"]
          property_type: Database["public"]["Enums"]["property_type"]
          quote_id: string | null
          rejection_reason: string | null
          rfi_notes: string | null
          rfi_status: Database["public"]["Enums"]["rfi_status_type"] | null
          room_name: string
          site_photos: Json | null
          status: string | null
          submitted_at: string | null
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          access_instructions?: string | null
          access_type: Database["public"]["Enums"]["site_access_type"]
          admin_notes?: string | null
          building_access_form_url?: string | null
          building_manager_email?: string | null
          building_manager_name?: string | null
          building_manager_phone?: string | null
          building_name?: string | null
          business_customer_id: string
          cable_entry_point?: string | null
          created_at?: string | null
          equipment_location: Database["public"]["Enums"]["equipment_location"]
          floor_level?: string | null
          has_ac_power?: boolean
          has_access_control?: boolean
          has_air_conditioning?: boolean
          has_rack_facility?: boolean
          id?: string
          installation_address?: Json | null
          journey_stage_id?: string | null
          landlord_consent_signed?: boolean | null
          landlord_consent_signed_at?: string | null
          landlord_consent_url?: string | null
          landlord_contact?: string | null
          landlord_name?: string | null
          premises_ownership: Database["public"]["Enums"]["premises_ownership"]
          property_type: Database["public"]["Enums"]["property_type"]
          quote_id?: string | null
          rejection_reason?: string | null
          rfi_notes?: string | null
          rfi_status?: Database["public"]["Enums"]["rfi_status_type"] | null
          room_name: string
          site_photos?: Json | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          access_instructions?: string | null
          access_type?: Database["public"]["Enums"]["site_access_type"]
          admin_notes?: string | null
          building_access_form_url?: string | null
          building_manager_email?: string | null
          building_manager_name?: string | null
          building_manager_phone?: string | null
          building_name?: string | null
          business_customer_id?: string
          cable_entry_point?: string | null
          created_at?: string | null
          equipment_location?: Database["public"]["Enums"]["equipment_location"]
          floor_level?: string | null
          has_ac_power?: boolean
          has_access_control?: boolean
          has_air_conditioning?: boolean
          has_rack_facility?: boolean
          id?: string
          installation_address?: Json | null
          journey_stage_id?: string | null
          landlord_consent_signed?: boolean | null
          landlord_consent_signed_at?: string | null
          landlord_consent_url?: string | null
          landlord_contact?: string | null
          landlord_name?: string | null
          premises_ownership?: Database["public"]["Enums"]["premises_ownership"]
          property_type?: Database["public"]["Enums"]["property_type"]
          quote_id?: string | null
          rejection_reason?: string | null
          rfi_notes?: string | null
          rfi_status?: Database["public"]["Enums"]["rfi_status_type"] | null
          room_name?: string
          site_photos?: Json | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_site_details_business_customer_id_fkey"
            columns: ["business_customer_id"]
            isOneToOne: false
            referencedRelation: "business_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_site_details_business_customer_id_fkey"
            columns: ["business_customer_id"]
            isOneToOne: false
            referencedRelation: "business_journey_summary"
            referencedColumns: ["business_customer_id"]
          },
          {
            foreignKeyName: "business_site_details_journey_stage_id_fkey"
            columns: ["journey_stage_id"]
            isOneToOne: false
            referencedRelation: "business_journey_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_site_details_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "business_quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_site_details_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quote_analytics"
            referencedColumns: ["quote_id"]
          },
        ]
      }
      campaign_report_snapshots: {
        Row: {
          agent_breakdown: Json
          avg_first_response_ms: number | null
          closed_tickets: number
          conversion_rate: number
          conversions_today: number
          cumulative_leads: number
          generated_at: string
          id: string
          new_leads_today: number
          open_tickets: number
          pipeline_breakdown: Json
          raw_snapshot: Json | null
          report_date: string
          unassigned_tickets: number
        }
        Insert: {
          agent_breakdown?: Json
          avg_first_response_ms?: number | null
          closed_tickets?: number
          conversion_rate?: number
          conversions_today?: number
          cumulative_leads?: number
          generated_at?: string
          id?: string
          new_leads_today?: number
          open_tickets?: number
          pipeline_breakdown?: Json
          raw_snapshot?: Json | null
          report_date: string
          unassigned_tickets?: number
        }
        Update: {
          agent_breakdown?: Json
          avg_first_response_ms?: number | null
          closed_tickets?: number
          conversion_rate?: number
          conversions_today?: number
          cumulative_leads?: number
          generated_at?: string
          id?: string
          new_leads_today?: number
          open_tickets?: number
          pipeline_breakdown?: Json
          raw_snapshot?: Json | null
          report_date?: string
          unassigned_tickets?: number
        }
        Relationships: []
      }
      campaign_ticket_snapshots: {
        Row: {
          assigned_agent: string | null
          closed_at: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          conversation_count: number
          conversations: Json
          first_response_at: string | null
          id: string
          insight_status: string
          insight_updated_at: string | null
          is_signed_up: boolean
          last_synced_at: string
          lead_address: string | null
          lead_email: string | null
          lead_name: string | null
          lead_phone: string | null
          order_id: string | null
          status: string | null
          subject: string | null
          tags: string[]
          ticket_id: string
          ticket_number: string | null
          zoho_created_at: string | null
        }
        Insert: {
          assigned_agent?: string | null
          closed_at?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          conversation_count?: number
          conversations?: Json
          first_response_at?: string | null
          id?: string
          insight_status?: string
          insight_updated_at?: string | null
          is_signed_up?: boolean
          last_synced_at?: string
          lead_address?: string | null
          lead_email?: string | null
          lead_name?: string | null
          lead_phone?: string | null
          order_id?: string | null
          status?: string | null
          subject?: string | null
          tags?: string[]
          ticket_id: string
          ticket_number?: string | null
          zoho_created_at?: string | null
        }
        Update: {
          assigned_agent?: string | null
          closed_at?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          conversation_count?: number
          conversations?: Json
          first_response_at?: string | null
          id?: string
          insight_status?: string
          insight_updated_at?: string | null
          is_signed_up?: boolean
          last_synced_at?: string
          lead_address?: string | null
          lead_email?: string | null
          lead_name?: string | null
          lead_phone?: string | null
          order_id?: string | null
          status?: string | null
          subject?: string | null
          tags?: string[]
          ticket_id?: string
          ticket_number?: string | null
          zoho_created_at?: string | null
        }
        Relationships: []
      }
      capital_transactions: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          description: string
          id: string
          related_milestone: number | null
          running_balance: number | null
          transaction_date: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          description: string
          id?: string
          related_milestone?: number | null
          running_balance?: number | null
          transaction_date?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          description?: string
          id?: string
          related_milestone?: number | null
          running_balance?: number | null
          transaction_date?: string
        }
        Relationships: []
      }
      circletel_hardware_products: {
        Row: {
          category: string | null
          cost_price: number | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          markup_percentage: number | null
          metadata: Json | null
          name: string
          primary_supplier_code: string | null
          published_at: string | null
          retail_price: number
          slug: string
          sort_order: number | null
          specifications: Json | null
          status: string | null
          updated_at: string | null
          warranty_description: string | null
          warranty_months: number | null
        }
        Insert: {
          category?: string | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          markup_percentage?: number | null
          metadata?: Json | null
          name: string
          primary_supplier_code?: string | null
          published_at?: string | null
          retail_price?: number
          slug: string
          sort_order?: number | null
          specifications?: Json | null
          status?: string | null
          updated_at?: string | null
          warranty_description?: string | null
          warranty_months?: number | null
        }
        Update: {
          category?: string | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          markup_percentage?: number | null
          metadata?: Json | null
          name?: string
          primary_supplier_code?: string | null
          published_at?: string | null
          retail_price?: number
          slug?: string
          sort_order?: number | null
          specifications?: Json | null
          status?: string | null
          updated_at?: string | null
          warranty_description?: string | null
          warranty_months?: number | null
        }
        Relationships: []
      }
      cms_ai_usage: {
        Row: {
          cost_estimate: number | null
          created_at: string | null
          generation_type: string
          id: string
          tokens_used: number | null
          user_id: string | null
        }
        Insert: {
          cost_estimate?: number | null
          created_at?: string | null
          generation_type: string
          id?: string
          tokens_used?: number | null
          user_id?: string | null
        }
        Update: {
          cost_estimate?: number | null
          created_at?: string | null
          generation_type?: string
          id?: string
          tokens_used?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          parent_comment_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          parent_comment_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          parent_comment_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_properties: {
        Row: {
          address: string | null
          center_lat: number | null
          center_lng: number | null
          city: string | null
          created_at: string | null
          gla_sqm: number | null
          grade: string | null
          id: string
          name: string
          property_type: string | null
          province: string | null
          scraped_at: string | null
          sector: string | null
          source: string
          source_url: string | null
          suburb: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          center_lat?: number | null
          center_lng?: number | null
          city?: string | null
          created_at?: string | null
          gla_sqm?: number | null
          grade?: string | null
          id?: string
          name: string
          property_type?: string | null
          province?: string | null
          scraped_at?: string | null
          sector?: string | null
          source: string
          source_url?: string | null
          suburb?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          center_lat?: number | null
          center_lng?: number | null
          city?: string | null
          created_at?: string | null
          gla_sqm?: number | null
          grade?: string | null
          id?: string
          name?: string
          property_type?: string | null
          province?: string | null
          scraped_at?: string | null
          sector?: string | null
          source?: string
          source_url?: string | null
          suburb?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      commission_tier_config: {
        Row: {
          base_commission_rate: number
          created_at: string | null
          description: string | null
          effective_from: string
          effective_rate: number
          effective_to: string | null
          id: string
          is_active: boolean | null
          max_monthly_value: number | null
          min_monthly_value: number
          partner_share_rate: number
          tier_name: string
          tier_order: number
          updated_at: string | null
        }
        Insert: {
          base_commission_rate: number
          created_at?: string | null
          description?: string | null
          effective_from?: string
          effective_rate: number
          effective_to?: string | null
          id?: string
          is_active?: boolean | null
          max_monthly_value?: number | null
          min_monthly_value: number
          partner_share_rate?: number
          tier_name: string
          tier_order: number
          updated_at?: string | null
        }
        Update: {
          base_commission_rate?: number
          created_at?: string | null
          description?: string | null
          effective_from?: string
          effective_rate?: number
          effective_to?: string | null
          id?: string
          is_active?: boolean | null
          max_monthly_value?: number | null
          min_monthly_value?: number
          partner_share_rate?: number
          tier_name?: string
          tier_order?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      competitor_price_history: {
        Row: {
          competitor_product_id: string
          id: string
          monthly_price: number | null
          once_off_price: number | null
          recorded_at: string | null
        }
        Insert: {
          competitor_product_id: string
          id?: string
          monthly_price?: number | null
          once_off_price?: number | null
          recorded_at?: string | null
        }
        Update: {
          competitor_product_id?: string
          id?: string
          monthly_price?: number | null
          once_off_price?: number | null
          recorded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitor_price_history_competitor_product_id_fkey"
            columns: ["competitor_product_id"]
            isOneToOne: false
            referencedRelation: "competitor_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitor_price_history_competitor_product_id_fkey"
            columns: ["competitor_product_id"]
            isOneToOne: false
            referencedRelation: "v_competitor_price_comparison"
            referencedColumns: ["competitor_product_id"]
          },
        ]
      }
      competitor_products: {
        Row: {
          contract_term: number | null
          created_at: string | null
          data_bundle: string | null
          data_gb: number | null
          device_name: string | null
          external_id: string | null
          id: string
          is_current: boolean | null
          monthly_price: number | null
          once_off_price: number | null
          price_includes_vat: boolean | null
          product_name: string
          product_type: string | null
          provider_id: string
          raw_data: Json | null
          scraped_at: string | null
          source_url: string | null
          speed_mbps: number | null
          technology: string | null
          updated_at: string | null
        }
        Insert: {
          contract_term?: number | null
          created_at?: string | null
          data_bundle?: string | null
          data_gb?: number | null
          device_name?: string | null
          external_id?: string | null
          id?: string
          is_current?: boolean | null
          monthly_price?: number | null
          once_off_price?: number | null
          price_includes_vat?: boolean | null
          product_name: string
          product_type?: string | null
          provider_id: string
          raw_data?: Json | null
          scraped_at?: string | null
          source_url?: string | null
          speed_mbps?: number | null
          technology?: string | null
          updated_at?: string | null
        }
        Update: {
          contract_term?: number | null
          created_at?: string | null
          data_bundle?: string | null
          data_gb?: number | null
          device_name?: string | null
          external_id?: string | null
          id?: string
          is_current?: boolean | null
          monthly_price?: number | null
          once_off_price?: number | null
          price_includes_vat?: boolean | null
          product_name?: string
          product_type?: string | null
          provider_id?: string
          raw_data?: Json | null
          scraped_at?: string | null
          source_url?: string | null
          speed_mbps?: number | null
          technology?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitor_products_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "competitor_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitor_products_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "v_competitor_provider_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_providers: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          last_scraped_at: string | null
          logo_url: string | null
          name: string
          provider_type: string
          scrape_config: Json | null
          scrape_frequency: string | null
          scrape_urls: Json | null
          slug: string
          updated_at: string | null
          website: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_scraped_at?: string | null
          logo_url?: string | null
          name: string
          provider_type: string
          scrape_config?: Json | null
          scrape_frequency?: string | null
          scrape_urls?: Json | null
          slug: string
          updated_at?: string | null
          website: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_scraped_at?: string | null
          logo_url?: string | null
          name?: string
          provider_type?: string
          scrape_config?: Json | null
          scrape_frequency?: string | null
          scrape_urls?: Json | null
          slug?: string
          updated_at?: string | null
          website?: string
        }
        Relationships: []
      }
      competitor_scrape_logs: {
        Row: {
          completed_at: string | null
          error_message: string | null
          firecrawl_credits_used: number | null
          id: string
          products_found: number | null
          products_new: number | null
          products_updated: number | null
          provider_id: string
          started_at: string | null
          status: string
          trigger_type: string | null
          triggered_by: string | null
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          firecrawl_credits_used?: number | null
          id?: string
          products_found?: number | null
          products_new?: number | null
          products_updated?: number | null
          provider_id: string
          started_at?: string | null
          status: string
          trigger_type?: string | null
          triggered_by?: string | null
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          firecrawl_credits_used?: number | null
          id?: string
          products_found?: number | null
          products_new?: number | null
          products_updated?: number | null
          provider_id?: string
          started_at?: string | null
          status?: string
          trigger_type?: string | null
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitor_scrape_logs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "competitor_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitor_scrape_logs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "v_competitor_provider_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_zone_coverage: {
        Row: {
          competitor_name: string
          confidence: string | null
          coverage_type: string | null
          created_at: string | null
          has_coverage: boolean | null
          id: string
          scraped_at: string | null
          source: string | null
          zone_id: string
        }
        Insert: {
          competitor_name: string
          confidence?: string | null
          coverage_type?: string | null
          created_at?: string | null
          has_coverage?: boolean | null
          id?: string
          scraped_at?: string | null
          source?: string | null
          zone_id: string
        }
        Update: {
          competitor_name?: string
          confidence?: string | null
          coverage_type?: string | null
          created_at?: string | null
          has_coverage?: boolean | null
          id?: string
          scraped_at?: string | null
          source?: string | null
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitor_zone_coverage_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "sales_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_documents: {
        Row: {
          category: string
          created_at: string
          customer_id: string | null
          document_type: string
          file_name: string
          file_path: string
          file_size: number
          file_url: string | null
          id: string
          metadata: Json | null
          mime_type: string
          order_id: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          uploaded_at: string
        }
        Insert: {
          category: string
          created_at?: string
          customer_id?: string | null
          document_type: string
          file_name: string
          file_path: string
          file_size: number
          file_url?: string | null
          id?: string
          metadata?: Json | null
          mime_type: string
          order_id?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          uploaded_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          customer_id?: string | null
          document_type?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_url?: string | null
          id?: string
          metadata?: Json | null
          mime_type?: string
          order_id?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_documents_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "consumer_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_documents_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_order_compliance_summary"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "compliance_documents_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_order_notifications"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "compliance_documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      consumer_orders: {
        Row: {
          account_number: string | null
          activated_at: string | null
          activation_date: string | null
          alternate_phone: string | null
          auth_user_id: string | null
          billing_activated_at: string | null
          billing_active: boolean | null
          billing_address: string | null
          billing_city: string | null
          billing_cycle_day: number | null
          billing_postal_code: string | null
          billing_province: string | null
          billing_same_as_installation: boolean | null
          billing_start_date: string | null
          billing_suburb: string | null
          city: string | null
          connection_id: string | null
          contact_preference: string | null
          contract_id: string | null
          coordinates: Json | null
          coverage_check_id: string | null
          coverage_lead_id: string | null
          created_at: string | null
          customer_id: string | null
          email: string
          first_name: string
          id: string
          installation_address: string
          installation_completed_at: string | null
          installation_completed_date: string | null
          installation_document_name: string | null
          installation_document_uploaded_at: string | null
          installation_document_url: string | null
          installation_fee: number
          installation_scheduled_date: string | null
          installation_time_slot: string | null
          internal_notes: string | null
          kyc_address_verified: boolean | null
          kyc_address_verified_at: string | null
          last_name: string
          lead_source: Database["public"]["Enums"]["lead_source"]
          marketing_opt_in: boolean | null
          metadata: Json | null
          next_billing_date: string | null
          order_number: string
          package_name: string
          package_price: number
          package_speed: string
          payment_amount: number | null
          payment_date: string | null
          payment_method: string | null
          payment_reference: string | null
          payment_status: string | null
          phone: string
          postal_code: string | null
          preferred_installation_date: string | null
          prorata_amount: number | null
          prorata_days: number | null
          province: string | null
          referral_code: string | null
          referred_by: string | null
          residential_address: string | null
          residential_city: string | null
          residential_postal_code: string | null
          residential_province: string | null
          residential_suburb: string | null
          router_fee: number | null
          router_included: boolean | null
          router_model: string | null
          router_rental_fee: number | null
          router_serial: string | null
          service_package_id: string | null
          service_start_date: string | null
          sim_serial: string | null
          source_campaign: string | null
          special_instructions: string | null
          status: Database["public"]["Enums"]["order_status"]
          suburb: string | null
          technician_notes: string | null
          terms_accepted: boolean
          terms_accepted_at: string | null
          terms_accepted_ip: string | null
          terms_version: string | null
          total_paid: number | null
          updated_at: string | null
          whatsapp_opt_in: boolean | null
          zoho_billing_subscription_id: string | null
          zoho_books_customer_id: string | null
          zoho_books_invoice_id: string | null
          zoho_crm_contact_id: string | null
        }
        Insert: {
          account_number?: string | null
          activated_at?: string | null
          activation_date?: string | null
          alternate_phone?: string | null
          auth_user_id?: string | null
          billing_activated_at?: string | null
          billing_active?: boolean | null
          billing_address?: string | null
          billing_city?: string | null
          billing_cycle_day?: number | null
          billing_postal_code?: string | null
          billing_province?: string | null
          billing_same_as_installation?: boolean | null
          billing_start_date?: string | null
          billing_suburb?: string | null
          city?: string | null
          connection_id?: string | null
          contact_preference?: string | null
          contract_id?: string | null
          coordinates?: Json | null
          coverage_check_id?: string | null
          coverage_lead_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          email: string
          first_name: string
          id?: string
          installation_address: string
          installation_completed_at?: string | null
          installation_completed_date?: string | null
          installation_document_name?: string | null
          installation_document_uploaded_at?: string | null
          installation_document_url?: string | null
          installation_fee: number
          installation_scheduled_date?: string | null
          installation_time_slot?: string | null
          internal_notes?: string | null
          kyc_address_verified?: boolean | null
          kyc_address_verified_at?: string | null
          last_name: string
          lead_source?: Database["public"]["Enums"]["lead_source"]
          marketing_opt_in?: boolean | null
          metadata?: Json | null
          next_billing_date?: string | null
          order_number: string
          package_name: string
          package_price: number
          package_speed: string
          payment_amount?: number | null
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          phone: string
          postal_code?: string | null
          preferred_installation_date?: string | null
          prorata_amount?: number | null
          prorata_days?: number | null
          province?: string | null
          referral_code?: string | null
          referred_by?: string | null
          residential_address?: string | null
          residential_city?: string | null
          residential_postal_code?: string | null
          residential_province?: string | null
          residential_suburb?: string | null
          router_fee?: number | null
          router_included?: boolean | null
          router_model?: string | null
          router_rental_fee?: number | null
          router_serial?: string | null
          service_package_id?: string | null
          service_start_date?: string | null
          sim_serial?: string | null
          source_campaign?: string | null
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          suburb?: string | null
          technician_notes?: string | null
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          terms_accepted_ip?: string | null
          terms_version?: string | null
          total_paid?: number | null
          updated_at?: string | null
          whatsapp_opt_in?: boolean | null
          zoho_billing_subscription_id?: string | null
          zoho_books_customer_id?: string | null
          zoho_books_invoice_id?: string | null
          zoho_crm_contact_id?: string | null
        }
        Update: {
          account_number?: string | null
          activated_at?: string | null
          activation_date?: string | null
          alternate_phone?: string | null
          auth_user_id?: string | null
          billing_activated_at?: string | null
          billing_active?: boolean | null
          billing_address?: string | null
          billing_city?: string | null
          billing_cycle_day?: number | null
          billing_postal_code?: string | null
          billing_province?: string | null
          billing_same_as_installation?: boolean | null
          billing_start_date?: string | null
          billing_suburb?: string | null
          city?: string | null
          connection_id?: string | null
          contact_preference?: string | null
          contract_id?: string | null
          coordinates?: Json | null
          coverage_check_id?: string | null
          coverage_lead_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          email?: string
          first_name?: string
          id?: string
          installation_address?: string
          installation_completed_at?: string | null
          installation_completed_date?: string | null
          installation_document_name?: string | null
          installation_document_uploaded_at?: string | null
          installation_document_url?: string | null
          installation_fee?: number
          installation_scheduled_date?: string | null
          installation_time_slot?: string | null
          internal_notes?: string | null
          kyc_address_verified?: boolean | null
          kyc_address_verified_at?: string | null
          last_name?: string
          lead_source?: Database["public"]["Enums"]["lead_source"]
          marketing_opt_in?: boolean | null
          metadata?: Json | null
          next_billing_date?: string | null
          order_number?: string
          package_name?: string
          package_price?: number
          package_speed?: string
          payment_amount?: number | null
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          phone?: string
          postal_code?: string | null
          preferred_installation_date?: string | null
          prorata_amount?: number | null
          prorata_days?: number | null
          province?: string | null
          referral_code?: string | null
          referred_by?: string | null
          residential_address?: string | null
          residential_city?: string | null
          residential_postal_code?: string | null
          residential_province?: string | null
          residential_suburb?: string | null
          router_fee?: number | null
          router_included?: boolean | null
          router_model?: string | null
          router_rental_fee?: number | null
          router_serial?: string | null
          service_package_id?: string | null
          service_start_date?: string | null
          sim_serial?: string | null
          source_campaign?: string | null
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          suburb?: string | null
          technician_notes?: string | null
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          terms_accepted_ip?: string | null
          terms_version?: string | null
          total_paid?: number | null
          updated_at?: string | null
          whatsapp_opt_in?: boolean | null
          zoho_billing_subscription_id?: string | null
          zoho_books_customer_id?: string | null
          zoho_books_invoice_id?: string | null
          zoho_crm_contact_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consumer_orders_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumer_orders_coverage_lead_id_fkey"
            columns: ["coverage_lead_id"]
            isOneToOne: false
            referencedRelation: "coverage_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumer_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_dashboard_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "consumer_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumer_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_notification_engagement"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      contracts: {
        Row: {
          circletel_signature_date: string | null
          contract_number: string
          contract_term_months: number
          contract_type: string
          created_at: string | null
          customer_id: string | null
          customer_signature_date: string | null
          end_date: string | null
          fully_signed_date: string | null
          id: string
          installation_fee: number | null
          kyc_session_id: string | null
          last_synced_at: string | null
          monthly_recurring: number
          once_off_fee: number | null
          quote_id: string
          signed_pdf_url: string | null
          start_date: string | null
          status: string
          total_contract_value: number
          updated_at: string | null
          zoho_deal_id: string | null
          zoho_sign_request_id: string | null
        }
        Insert: {
          circletel_signature_date?: string | null
          contract_number: string
          contract_term_months: number
          contract_type: string
          created_at?: string | null
          customer_id?: string | null
          customer_signature_date?: string | null
          end_date?: string | null
          fully_signed_date?: string | null
          id?: string
          installation_fee?: number | null
          kyc_session_id?: string | null
          last_synced_at?: string | null
          monthly_recurring: number
          once_off_fee?: number | null
          quote_id: string
          signed_pdf_url?: string | null
          start_date?: string | null
          status?: string
          total_contract_value: number
          updated_at?: string | null
          zoho_deal_id?: string | null
          zoho_sign_request_id?: string | null
        }
        Update: {
          circletel_signature_date?: string | null
          contract_number?: string
          contract_term_months?: number
          contract_type?: string
          created_at?: string | null
          customer_id?: string | null
          customer_signature_date?: string | null
          end_date?: string | null
          fully_signed_date?: string | null
          id?: string
          installation_fee?: number | null
          kyc_session_id?: string | null
          last_synced_at?: string | null
          monthly_recurring?: number
          once_off_fee?: number | null
          quote_id?: string
          signed_pdf_url?: string | null
          start_date?: string | null
          status?: string
          total_contract_value?: number
          updated_at?: string | null
          zoho_deal_id?: string | null
          zoho_sign_request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_dashboard_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "contracts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_notification_engagement"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "contracts_kyc_session_id_fkey"
            columns: ["kyc_session_id"]
            isOneToOne: false
            referencedRelation: "kyc_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "business_quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quote_analytics"
            referencedColumns: ["quote_id"]
          },
        ]
      }
      contribution_margins: {
        Row: {
          contribution_margin_zar: number | null
          created_at: string | null
          financial_period_id: string
          id: string
          margin_percentage: number | null
          product_id: string
          revenue_zar: number
          variable_costs_zar: number
        }
        Insert: {
          contribution_margin_zar?: number | null
          created_at?: string | null
          financial_period_id: string
          id?: string
          margin_percentage?: number | null
          product_id: string
          revenue_zar: number
          variable_costs_zar: number
        }
        Update: {
          contribution_margin_zar?: number | null
          created_at?: string | null
          financial_period_id?: string
          id?: string
          margin_percentage?: number | null
          product_id?: string
          revenue_zar?: number
          variable_costs_zar?: number
        }
        Relationships: [
          {
            foreignKeyName: "contribution_margins_financial_period_id_fkey"
            columns: ["financial_period_id"]
            isOneToOne: false
            referencedRelation: "financial_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contribution_margins_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      corporate_accounts: {
        Row: {
          account_status:
            | Database["public"]["Enums"]["corporate_account_status"]
            | null
          active_sites: number | null
          billing_contact_email: string | null
          billing_contact_name: string | null
          billing_contact_phone: string | null
          billing_cycle: string | null
          company_name: string
          contract_end_date: string | null
          contract_start_date: string | null
          contract_value: number | null
          corporate_code: string
          created_at: string | null
          created_by: string | null
          credit_limit: number | null
          expected_sites: number | null
          id: string
          industry: string | null
          notes: string | null
          payment_terms: number | null
          pending_sites: number | null
          physical_address: Json | null
          postal_address: Json | null
          primary_contact_email: string
          primary_contact_name: string
          primary_contact_phone: string | null
          primary_contact_position: string | null
          registration_number: string | null
          technical_contact_email: string | null
          technical_contact_name: string | null
          technical_contact_phone: string | null
          total_sites: number | null
          trading_name: string | null
          updated_at: string | null
          vat_number: string | null
        }
        Insert: {
          account_status?:
            | Database["public"]["Enums"]["corporate_account_status"]
            | null
          active_sites?: number | null
          billing_contact_email?: string | null
          billing_contact_name?: string | null
          billing_contact_phone?: string | null
          billing_cycle?: string | null
          company_name: string
          contract_end_date?: string | null
          contract_start_date?: string | null
          contract_value?: number | null
          corporate_code: string
          created_at?: string | null
          created_by?: string | null
          credit_limit?: number | null
          expected_sites?: number | null
          id?: string
          industry?: string | null
          notes?: string | null
          payment_terms?: number | null
          pending_sites?: number | null
          physical_address?: Json | null
          postal_address?: Json | null
          primary_contact_email: string
          primary_contact_name: string
          primary_contact_phone?: string | null
          primary_contact_position?: string | null
          registration_number?: string | null
          technical_contact_email?: string | null
          technical_contact_name?: string | null
          technical_contact_phone?: string | null
          total_sites?: number | null
          trading_name?: string | null
          updated_at?: string | null
          vat_number?: string | null
        }
        Update: {
          account_status?:
            | Database["public"]["Enums"]["corporate_account_status"]
            | null
          active_sites?: number | null
          billing_contact_email?: string | null
          billing_contact_name?: string | null
          billing_contact_phone?: string | null
          billing_cycle?: string | null
          company_name?: string
          contract_end_date?: string | null
          contract_start_date?: string | null
          contract_value?: number | null
          corporate_code?: string
          created_at?: string | null
          created_by?: string | null
          credit_limit?: number | null
          expected_sites?: number | null
          id?: string
          industry?: string | null
          notes?: string | null
          payment_terms?: number | null
          pending_sites?: number | null
          physical_address?: Json | null
          postal_address?: Json | null
          primary_contact_email?: string
          primary_contact_name?: string
          primary_contact_phone?: string | null
          primary_contact_position?: string | null
          registration_number?: string | null
          technical_contact_email?: string | null
          technical_contact_name?: string | null
          technical_contact_phone?: string | null
          total_sites?: number | null
          trading_name?: string | null
          updated_at?: string | null
          vat_number?: string | null
        }
        Relationships: []
      }
      corporate_site_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          new_value: Json | null
          notes: string | null
          old_value: Json | null
          performed_by: string | null
          site_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          new_value?: Json | null
          notes?: string | null
          old_value?: Json | null
          performed_by?: string | null
          site_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          new_value?: Json | null
          notes?: string | null
          old_value?: Json | null
          performed_by?: string | null
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "corporate_site_events_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "corporate_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      corporate_sites: {
        Row: {
          access_instructions: string | null
          access_type: string | null
          account_number: string | null
          commission_speedtest_path: string | null
          contract_end_at: string | null
          contract_term_months: number | null
          coordinates: Json | null
          coordinates_source: string | null
          coordinates_updated_at: string | null
          corporate_id: string
          created_at: string | null
          equipment_owner: string | null
          has_ac_power: boolean | null
          has_access_control: boolean | null
          has_air_conditioning: boolean | null
          has_rack_facility: boolean | null
          id: string
          installation_address: Json
          installed_at: string | null
          installed_by: string | null
          interstellio_status: string | null
          interstellio_subscriber_id: string | null
          job_card_approved_at: string | null
          job_card_approved_by: string | null
          job_card_number: string | null
          job_card_path: string | null
          job_card_uploaded_at: string | null
          landlord_consent_url: string | null
          lat: number | null
          lng: number | null
          mikrotik_serial: string | null
          monthly_fee: number | null
          mtn_msisdn: string | null
          mtn_router_imei: string | null
          mtn_router_mac: string | null
          mtn_sim_number: string | null
          mtn_static_ip: unknown
          network_path: Database["public"]["Enums"]["network_path_type"] | null
          package_id: string | null
          pppoe_credential_id: string | null
          pppoe_username: string | null
          province: string | null
          rfi_notes: string | null
          rfi_status: string | null
          rfs_certificate_path: string | null
          rfs_issued_at: string | null
          router_model: string | null
          router_serial: string | null
          ruijie_ap_model: string | null
          ruijie_ap_serial: string | null
          ruijie_device_sn: string | null
          ruijie_egress_ip: unknown
          service_id: string | null
          site_code: string | null
          site_contact_email: string | null
          site_contact_name: string | null
          site_contact_phone: string | null
          site_name: string
          site_number: number
          status: Database["public"]["Enums"]["corporate_site_status"] | null
          survey_speedtest_path: string | null
          tarana_rn_serial: string | null
          technology: Database["public"]["Enums"]["site_technology_type"] | null
          updated_at: string | null
          wholesale_order_ref: string | null
        }
        Insert: {
          access_instructions?: string | null
          access_type?: string | null
          account_number?: string | null
          commission_speedtest_path?: string | null
          contract_end_at?: string | null
          contract_term_months?: number | null
          coordinates?: Json | null
          coordinates_source?: string | null
          coordinates_updated_at?: string | null
          corporate_id: string
          created_at?: string | null
          equipment_owner?: string | null
          has_ac_power?: boolean | null
          has_access_control?: boolean | null
          has_air_conditioning?: boolean | null
          has_rack_facility?: boolean | null
          id?: string
          installation_address: Json
          installed_at?: string | null
          installed_by?: string | null
          interstellio_status?: string | null
          interstellio_subscriber_id?: string | null
          job_card_approved_at?: string | null
          job_card_approved_by?: string | null
          job_card_number?: string | null
          job_card_path?: string | null
          job_card_uploaded_at?: string | null
          landlord_consent_url?: string | null
          lat?: number | null
          lng?: number | null
          mikrotik_serial?: string | null
          monthly_fee?: number | null
          mtn_msisdn?: string | null
          mtn_router_imei?: string | null
          mtn_router_mac?: string | null
          mtn_sim_number?: string | null
          mtn_static_ip?: unknown
          network_path?: Database["public"]["Enums"]["network_path_type"] | null
          package_id?: string | null
          pppoe_credential_id?: string | null
          pppoe_username?: string | null
          province?: string | null
          rfi_notes?: string | null
          rfi_status?: string | null
          rfs_certificate_path?: string | null
          rfs_issued_at?: string | null
          router_model?: string | null
          router_serial?: string | null
          ruijie_ap_model?: string | null
          ruijie_ap_serial?: string | null
          ruijie_device_sn?: string | null
          ruijie_egress_ip?: unknown
          service_id?: string | null
          site_code?: string | null
          site_contact_email?: string | null
          site_contact_name?: string | null
          site_contact_phone?: string | null
          site_name: string
          site_number: number
          status?: Database["public"]["Enums"]["corporate_site_status"] | null
          survey_speedtest_path?: string | null
          tarana_rn_serial?: string | null
          technology?:
            | Database["public"]["Enums"]["site_technology_type"]
            | null
          updated_at?: string | null
          wholesale_order_ref?: string | null
        }
        Update: {
          access_instructions?: string | null
          access_type?: string | null
          account_number?: string | null
          commission_speedtest_path?: string | null
          contract_end_at?: string | null
          contract_term_months?: number | null
          coordinates?: Json | null
          coordinates_source?: string | null
          coordinates_updated_at?: string | null
          corporate_id?: string
          created_at?: string | null
          equipment_owner?: string | null
          has_ac_power?: boolean | null
          has_access_control?: boolean | null
          has_air_conditioning?: boolean | null
          has_rack_facility?: boolean | null
          id?: string
          installation_address?: Json
          installed_at?: string | null
          installed_by?: string | null
          interstellio_status?: string | null
          interstellio_subscriber_id?: string | null
          job_card_approved_at?: string | null
          job_card_approved_by?: string | null
          job_card_number?: string | null
          job_card_path?: string | null
          job_card_uploaded_at?: string | null
          landlord_consent_url?: string | null
          lat?: number | null
          lng?: number | null
          mikrotik_serial?: string | null
          monthly_fee?: number | null
          mtn_msisdn?: string | null
          mtn_router_imei?: string | null
          mtn_router_mac?: string | null
          mtn_sim_number?: string | null
          mtn_static_ip?: unknown
          network_path?: Database["public"]["Enums"]["network_path_type"] | null
          package_id?: string | null
          pppoe_credential_id?: string | null
          pppoe_username?: string | null
          province?: string | null
          rfi_notes?: string | null
          rfi_status?: string | null
          rfs_certificate_path?: string | null
          rfs_issued_at?: string | null
          router_model?: string | null
          router_serial?: string | null
          ruijie_ap_model?: string | null
          ruijie_ap_serial?: string | null
          ruijie_device_sn?: string | null
          ruijie_egress_ip?: unknown
          service_id?: string | null
          site_code?: string | null
          site_contact_email?: string | null
          site_contact_name?: string | null
          site_contact_phone?: string | null
          site_name?: string
          site_number?: number
          status?: Database["public"]["Enums"]["corporate_site_status"] | null
          survey_speedtest_path?: string | null
          tarana_rn_serial?: string | null
          technology?:
            | Database["public"]["Enums"]["site_technology_type"]
            | null
          updated_at?: string | null
          wholesale_order_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "corporate_sites_corporate_id_fkey"
            columns: ["corporate_id"]
            isOneToOne: false
            referencedRelation: "corporate_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_corporate_sites_pppoe_credential"
            columns: ["pppoe_credential_id"]
            isOneToOne: false
            referencedRelation: "pppoe_credentials"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_allocations: {
        Row: {
          allocated_amount_zar: number
          allocation_basis: string
          cost_center: string
          created_at: string | null
          department_id: string
          financial_period_id: string
          id: string
        }
        Insert: {
          allocated_amount_zar: number
          allocation_basis: string
          cost_center: string
          created_at?: string | null
          department_id: string
          financial_period_id: string
          id?: string
        }
        Update: {
          allocated_amount_zar?: number
          allocation_basis?: string
          cost_center?: string
          created_at?: string | null
          department_id?: string
          financial_period_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cost_allocations_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_allocations_financial_period_id_fkey"
            columns: ["financial_period_id"]
            isOneToOne: false
            referencedRelation: "financial_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_component_templates: {
        Row: {
          components: Json
          created_at: string | null
          customer_type: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          product_category: string | null
          service_type: string | null
          updated_at: string | null
        }
        Insert: {
          components?: Json
          created_at?: string | null
          customer_type?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          product_category?: string | null
          service_type?: string | null
          updated_at?: string | null
        }
        Update: {
          components?: Json
          created_at?: string | null
          customer_type?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          product_category?: string | null
          service_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      coverage_areas: {
        Row: {
          activation_days: number | null
          area_name: string
          available_speeds: Json
          city: string | null
          coverage_name: string | null
          coverage_quality: string | null
          created_at: string | null
          id: string
          polygon: Json
          province: string | null
          service_type: string
          status: string
          updated_at: string | null
        }
        Insert: {
          activation_days?: number | null
          area_name: string
          available_speeds?: Json
          city?: string | null
          coverage_name?: string | null
          coverage_quality?: string | null
          created_at?: string | null
          id?: string
          polygon: Json
          province?: string | null
          service_type: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          activation_days?: number | null
          area_name?: string
          available_speeds?: Json
          city?: string | null
          coverage_name?: string | null
          coverage_quality?: string | null
          created_at?: string | null
          id?: string
          polygon?: Json
          province?: string | null
          service_type?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      coverage_check_logs: {
        Row: {
          address: string | null
          city: string | null
          coverage_status: string | null
          coverage_type: string | null
          created_at: string | null
          endpoint: string
          error_code: string | null
          error_message: string | null
          error_type: string | null
          has_coverage: boolean | null
          id: string
          ip_address: unknown
          latitude: number | null
          lead_id: string | null
          longitude: number | null
          method: string
          packages_found: number | null
          provider_code: string | null
          provider_name: string | null
          province: string | null
          request_id: string | null
          response_time_ms: number
          session_id: string | null
          status_code: number
          success: boolean
          user_agent: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          coverage_status?: string | null
          coverage_type?: string | null
          created_at?: string | null
          endpoint: string
          error_code?: string | null
          error_message?: string | null
          error_type?: string | null
          has_coverage?: boolean | null
          id?: string
          ip_address?: unknown
          latitude?: number | null
          lead_id?: string | null
          longitude?: number | null
          method?: string
          packages_found?: number | null
          provider_code?: string | null
          provider_name?: string | null
          province?: string | null
          request_id?: string | null
          response_time_ms: number
          session_id?: string | null
          status_code: number
          success?: boolean
          user_agent?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          coverage_status?: string | null
          coverage_type?: string | null
          created_at?: string | null
          endpoint?: string
          error_code?: string | null
          error_message?: string | null
          error_type?: string | null
          has_coverage?: boolean | null
          id?: string
          ip_address?: unknown
          latitude?: number | null
          lead_id?: string | null
          longitude?: number | null
          method?: string
          packages_found?: number | null
          provider_code?: string | null
          provider_name?: string | null
          province?: string | null
          request_id?: string | null
          response_time_ms?: number
          session_id?: string | null
          status_code?: number
          success?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      coverage_demand_signals: {
        Row: {
          check_count: number | null
          checks_no_coverage: number | null
          checks_with_coverage: number | null
          created_at: string | null
          demand_score: number | null
          id: string
          unique_sessions: number | null
          ward_code: string
          week_start: string
        }
        Insert: {
          check_count?: number | null
          checks_no_coverage?: number | null
          checks_with_coverage?: number | null
          created_at?: string | null
          demand_score?: number | null
          id?: string
          unique_sessions?: number | null
          ward_code: string
          week_start: string
        }
        Update: {
          check_count?: number | null
          checks_no_coverage?: number | null
          checks_with_coverage?: number | null
          created_at?: string | null
          demand_score?: number | null
          id?: string
          unique_sessions?: number | null
          ward_code?: string
          week_start?: string
        }
        Relationships: []
      }
      coverage_files: {
        Row: {
          coverage_areas: string[]
          created_at: string
          error_message: string | null
          file_path: string
          file_size: number
          filename: string
          id: string
          metadata: Json | null
          original_name: string
          provider_id: string
          service_types: string[]
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          coverage_areas?: string[]
          created_at?: string
          error_message?: string | null
          file_path: string
          file_size: number
          filename: string
          id?: string
          metadata?: Json | null
          original_name: string
          provider_id: string
          service_types?: string[]
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          coverage_areas?: string[]
          created_at?: string
          error_message?: string | null
          file_path?: string
          file_size?: number
          filename?: string
          id?: string
          metadata?: Json | null
          original_name?: string
          provider_id?: string
          service_types?: string[]
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coverage_files_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "network_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      coverage_leads: {
        Row: {
          address: string
          assigned_admin_id: string | null
          assigned_partner_id: string | null
          available_services: Json | null
          best_contact_time: string | null
          budget_range: string | null
          checked_at: string | null
          city: string | null
          company_name: string | null
          contact_preference: string | null
          converted_to_order_id: string | null
          coordinates: Json | null
          coverage_available: boolean | null
          coverage_check_id: string | null
          coverage_check_status: string | null
          coverage_results: Json | null
          created_at: string | null
          customer_type: Database["public"]["Enums"]["customer_type"]
          email: string
          first_name: string
          first_responded_at: string | null
          first_response_due_at: string | null
          follow_up_count: number | null
          follow_up_notes: string | null
          id: string
          last_contacted_at: string | null
          last_name: string
          lead_score: number | null
          lead_source: Database["public"]["Enums"]["lead_source"]
          location_type:
            | Database["public"]["Enums"]["location_type_enum"]
            | null
          metadata: Json | null
          next_follow_up_at: string | null
          partner_assigned_at: string | null
          partner_last_contact: string | null
          partner_notes: string | null
          phone: string
          postal_code: string | null
          province: string | null
          referral_code: string | null
          requested_service_type: string | null
          requested_speed: string | null
          requirements: Json | null
          source_campaign: string | null
          status: string
          suburb: string | null
          updated_at: string | null
          zoho_lead_id: string | null
          zoho_sync_error: string | null
          zoho_sync_status: string | null
          zoho_synced_at: string | null
          zone_id: string | null
        }
        Insert: {
          address: string
          assigned_admin_id?: string | null
          assigned_partner_id?: string | null
          available_services?: Json | null
          best_contact_time?: string | null
          budget_range?: string | null
          checked_at?: string | null
          city?: string | null
          company_name?: string | null
          contact_preference?: string | null
          converted_to_order_id?: string | null
          coordinates?: Json | null
          coverage_available?: boolean | null
          coverage_check_id?: string | null
          coverage_check_status?: string | null
          coverage_results?: Json | null
          created_at?: string | null
          customer_type?: Database["public"]["Enums"]["customer_type"]
          email: string
          first_name: string
          first_responded_at?: string | null
          first_response_due_at?: string | null
          follow_up_count?: number | null
          follow_up_notes?: string | null
          id?: string
          last_contacted_at?: string | null
          last_name: string
          lead_score?: number | null
          lead_source?: Database["public"]["Enums"]["lead_source"]
          location_type?:
            | Database["public"]["Enums"]["location_type_enum"]
            | null
          metadata?: Json | null
          next_follow_up_at?: string | null
          partner_assigned_at?: string | null
          partner_last_contact?: string | null
          partner_notes?: string | null
          phone: string
          postal_code?: string | null
          province?: string | null
          referral_code?: string | null
          requested_service_type?: string | null
          requested_speed?: string | null
          requirements?: Json | null
          source_campaign?: string | null
          status?: string
          suburb?: string | null
          updated_at?: string | null
          zoho_lead_id?: string | null
          zoho_sync_error?: string | null
          zoho_sync_status?: string | null
          zoho_synced_at?: string | null
          zone_id?: string | null
        }
        Update: {
          address?: string
          assigned_admin_id?: string | null
          assigned_partner_id?: string | null
          available_services?: Json | null
          best_contact_time?: string | null
          budget_range?: string | null
          checked_at?: string | null
          city?: string | null
          company_name?: string | null
          contact_preference?: string | null
          converted_to_order_id?: string | null
          coordinates?: Json | null
          coverage_available?: boolean | null
          coverage_check_id?: string | null
          coverage_check_status?: string | null
          coverage_results?: Json | null
          created_at?: string | null
          customer_type?: Database["public"]["Enums"]["customer_type"]
          email?: string
          first_name?: string
          first_responded_at?: string | null
          first_response_due_at?: string | null
          follow_up_count?: number | null
          follow_up_notes?: string | null
          id?: string
          last_contacted_at?: string | null
          last_name?: string
          lead_score?: number | null
          lead_source?: Database["public"]["Enums"]["lead_source"]
          location_type?:
            | Database["public"]["Enums"]["location_type_enum"]
            | null
          metadata?: Json | null
          next_follow_up_at?: string | null
          partner_assigned_at?: string | null
          partner_last_contact?: string | null
          partner_notes?: string | null
          phone?: string
          postal_code?: string | null
          province?: string | null
          referral_code?: string | null
          requested_service_type?: string | null
          requested_speed?: string | null
          requirements?: Json | null
          source_campaign?: string | null
          status?: string
          suburb?: string | null
          updated_at?: string | null
          zoho_lead_id?: string | null
          zoho_sync_error?: string | null
          zoho_sync_status?: string | null
          zoho_synced_at?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coverage_leads_assigned_admin_id_fkey"
            columns: ["assigned_admin_id"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coverage_leads_assigned_admin_id_fkey"
            columns: ["assigned_admin_id"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coverage_leads_assigned_admin_id_fkey"
            columns: ["assigned_admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coverage_leads_assigned_partner_id_fkey"
            columns: ["assigned_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coverage_leads_assigned_partner_id_fkey"
            columns: ["assigned_partner_id"]
            isOneToOne: false
            referencedRelation: "v_partner_commission_tier_analysis"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "coverage_leads_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "sales_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      coverage_maps: {
        Row: {
          bounds: Json | null
          coverage_area: string
          created_at: string | null
          features_count: number | null
          file_path: string
          file_size: number
          file_type: string
          id: string
          metadata: Json | null
          name: string
          provider: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          bounds?: Json | null
          coverage_area: string
          created_at?: string | null
          features_count?: number | null
          file_path: string
          file_size: number
          file_type: string
          id?: string
          metadata?: Json | null
          name: string
          provider: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          bounds?: Json | null
          coverage_area?: string
          created_at?: string | null
          features_count?: number | null
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          metadata?: Json | null
          name?: string
          provider?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cpq_analytics: {
        Row: {
          ai_interactions: number | null
          ai_recommendations_accepted: number | null
          ai_recommendations_shown: number | null
          approval_required: boolean | null
          created_at: string | null
          final_discount_percent: number | null
          final_quote_value: number | null
          id: string
          session_id: string
          step_completed: boolean | null
          step_entered: number
          time_on_step_seconds: number | null
        }
        Insert: {
          ai_interactions?: number | null
          ai_recommendations_accepted?: number | null
          ai_recommendations_shown?: number | null
          approval_required?: boolean | null
          created_at?: string | null
          final_discount_percent?: number | null
          final_quote_value?: number | null
          id?: string
          session_id: string
          step_completed?: boolean | null
          step_entered: number
          time_on_step_seconds?: number | null
        }
        Update: {
          ai_interactions?: number | null
          ai_recommendations_accepted?: number | null
          ai_recommendations_shown?: number | null
          approval_required?: boolean | null
          created_at?: string | null
          final_discount_percent?: number | null
          final_quote_value?: number | null
          id?: string
          session_id?: string
          step_completed?: boolean | null
          step_entered?: number
          time_on_step_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cpq_analytics_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cpq_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      cpq_approval_requests: {
        Row: {
          assigned_approver_id: string | null
          created_at: string | null
          id: string
          justification: string | null
          requested_discount_percent: number
          requester_id: string
          requester_type: string
          responded_at: string | null
          responded_by: string | null
          response_notes: string | null
          session_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          assigned_approver_id?: string | null
          created_at?: string | null
          id?: string
          justification?: string | null
          requested_discount_percent: number
          requester_id: string
          requester_type: string
          responded_at?: string | null
          responded_by?: string | null
          response_notes?: string | null
          session_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          assigned_approver_id?: string | null
          created_at?: string | null
          id?: string
          justification?: string | null
          requested_discount_percent?: number
          requester_id?: string
          requester_type?: string
          responded_at?: string | null
          responded_by?: string | null
          response_notes?: string | null
          session_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cpq_approval_requests_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cpq_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      cpq_discount_limits: {
        Row: {
          approval_threshold_percent: number
          can_approve_discounts: boolean | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          max_approvable_discount: number | null
          max_discount_percent: number
          role_name: string
          role_type: string
          updated_at: string | null
        }
        Insert: {
          approval_threshold_percent?: number
          can_approve_discounts?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_approvable_discount?: number | null
          max_discount_percent?: number
          role_name: string
          role_type: string
          updated_at?: string | null
        }
        Update: {
          approval_threshold_percent?: number
          can_approve_discounts?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_approvable_discount?: number | null
          max_discount_percent?: number
          role_name?: string
          role_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cpq_pricing_rules: {
        Row: {
          adjustment_type: string
          adjustment_value: number
          applies_to_customer_types: string[] | null
          applies_to_partner_tiers: string[] | null
          applies_to_product_ids: string[] | null
          can_stack: boolean | null
          conditions: Json
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          rule_type: string
          stack_priority: number | null
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          adjustment_type: string
          adjustment_value: number
          applies_to_customer_types?: string[] | null
          applies_to_partner_tiers?: string[] | null
          applies_to_product_ids?: string[] | null
          can_stack?: boolean | null
          conditions?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          rule_type: string
          stack_priority?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          adjustment_type?: string
          adjustment_value?: number
          applies_to_customer_types?: string[] | null
          applies_to_partner_tiers?: string[] | null
          applies_to_product_ids?: string[] | null
          can_stack?: boolean | null
          conditions?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          rule_type?: string
          stack_priority?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      cpq_product_eligibility: {
        Row: {
          allowed_regions: string[] | null
          coverage_types: string[]
          created_at: string | null
          customer_types: string[] | null
          excluded_regions: string[] | null
          id: string
          is_active: boolean | null
          max_quantity: number | null
          min_quantity: number | null
          partner_tiers: string[] | null
          product_id: string
          updated_at: string | null
        }
        Insert: {
          allowed_regions?: string[] | null
          coverage_types?: string[]
          created_at?: string | null
          customer_types?: string[] | null
          excluded_regions?: string[] | null
          id?: string
          is_active?: boolean | null
          max_quantity?: number | null
          min_quantity?: number | null
          partner_tiers?: string[] | null
          product_id: string
          updated_at?: string | null
        }
        Update: {
          allowed_regions?: string[] | null
          coverage_types?: string[]
          created_at?: string | null
          customer_types?: string[] | null
          excluded_regions?: string[] | null
          id?: string
          is_active?: boolean | null
          max_quantity?: number | null
          min_quantity?: number | null
          partner_tiers?: string[] | null
          product_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cpq_sessions: {
        Row: {
          ai_chat_history: Json | null
          ai_recommendations: Json | null
          converted_at: string | null
          converted_quote_id: string | null
          created_at: string | null
          current_step: number
          discount_approved: boolean | null
          discount_approved_at: string | null
          discount_approved_by: string | null
          expires_at: string | null
          id: string
          owner_id: string
          owner_type: string
          status: string
          step_data: Json
          total_discount_percent: number | null
          updated_at: string | null
        }
        Insert: {
          ai_chat_history?: Json | null
          ai_recommendations?: Json | null
          converted_at?: string | null
          converted_quote_id?: string | null
          created_at?: string | null
          current_step?: number
          discount_approved?: boolean | null
          discount_approved_at?: string | null
          discount_approved_by?: string | null
          expires_at?: string | null
          id?: string
          owner_id: string
          owner_type: string
          status?: string
          step_data?: Json
          total_discount_percent?: number | null
          updated_at?: string | null
        }
        Update: {
          ai_chat_history?: Json | null
          ai_recommendations?: Json | null
          converted_at?: string | null
          converted_quote_id?: string | null
          created_at?: string | null
          current_step?: number
          discount_approved?: boolean | null
          discount_approved_at?: string | null
          discount_approved_by?: string | null
          expires_at?: string | null
          id?: string
          owner_id?: string
          owner_type?: string
          status?: string
          step_data?: Json
          total_discount_percent?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      credit_notes: {
        Row: {
          applied_at: string | null
          created_at: string
          created_by: string | null
          credit_note_date: string
          credit_note_number: string
          customer_id: string
          id: string
          line_items: Json
          notes: string | null
          original_invoice_id: string
          pdf_generated_at: string | null
          pdf_url: string | null
          reason: string
          reason_category: string
          status: string
          subtotal: number
          total_amount: number
          updated_at: string
          vat_amount: number
          vat_rate: number
        }
        Insert: {
          applied_at?: string | null
          created_at?: string
          created_by?: string | null
          credit_note_date?: string
          credit_note_number: string
          customer_id: string
          id?: string
          line_items?: Json
          notes?: string | null
          original_invoice_id: string
          pdf_generated_at?: string | null
          pdf_url?: string | null
          reason: string
          reason_category: string
          status?: string
          subtotal: number
          total_amount: number
          updated_at?: string
          vat_amount: number
          vat_rate?: number
        }
        Update: {
          applied_at?: string | null
          created_at?: string
          created_by?: string | null
          credit_note_date?: string
          credit_note_number?: string
          customer_id?: string
          id?: string
          line_items?: Json
          notes?: string | null
          original_invoice_id?: string
          pdf_generated_at?: string | null
          pdf_url?: string | null
          reason?: string
          reason_category?: string
          status?: string
          subtotal?: number
          total_amount?: number
          updated_at?: string
          vat_amount?: number
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "credit_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_dashboard_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "credit_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_notification_engagement"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "credit_notes_original_invoice_id_fkey"
            columns: ["original_invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      cron_execution_log: {
        Row: {
          created_at: string
          duration_seconds: number | null
          environment: string | null
          error_details: Json | null
          error_message: string | null
          execution_details: Json | null
          execution_end: string | null
          execution_start: string
          id: string
          job_name: string
          records_failed: number | null
          records_processed: number | null
          records_skipped: number | null
          status: string
          trigger_source: string | null
          triggered_by: string | null
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          environment?: string | null
          error_details?: Json | null
          error_message?: string | null
          execution_details?: Json | null
          execution_end?: string | null
          execution_start?: string
          id?: string
          job_name: string
          records_failed?: number | null
          records_processed?: number | null
          records_skipped?: number | null
          status?: string
          trigger_source?: string | null
          triggered_by?: string | null
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          environment?: string | null
          error_details?: Json | null
          error_message?: string | null
          execution_details?: Json | null
          execution_end?: string | null
          execution_start?: string
          id?: string
          job_name?: string
          records_failed?: number | null
          records_processed?: number | null
          records_skipped?: number | null
          status?: string
          trigger_source?: string | null
          triggered_by?: string | null
        }
        Relationships: []
      }
      customer_billing: {
        Row: {
          account_balance: number | null
          billing_day: number | null
          created_at: string | null
          credit_limit: number | null
          customer_id: string
          days_overdue: number | null
          id: string
          last_billing_date: string | null
          next_billing_date: string | null
          payment_method: string | null
          payment_method_details: Json | null
          payment_status: string | null
          updated_at: string | null
          zoho_customer_id: string | null
          zoho_subscription_id: string | null
        }
        Insert: {
          account_balance?: number | null
          billing_day?: number | null
          created_at?: string | null
          credit_limit?: number | null
          customer_id: string
          days_overdue?: number | null
          id?: string
          last_billing_date?: string | null
          next_billing_date?: string | null
          payment_method?: string | null
          payment_method_details?: Json | null
          payment_status?: string | null
          updated_at?: string | null
          zoho_customer_id?: string | null
          zoho_subscription_id?: string | null
        }
        Update: {
          account_balance?: number | null
          billing_day?: number | null
          created_at?: string | null
          credit_limit?: number | null
          customer_id?: string
          days_overdue?: number | null
          id?: string
          last_billing_date?: string | null
          next_billing_date?: string | null
          payment_method?: string | null
          payment_method_details?: Json | null
          payment_status?: string | null
          updated_at?: string | null
          zoho_customer_id?: string | null
          zoho_subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_billing_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customer_dashboard_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_billing_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_billing_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "v_customer_notification_engagement"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      customer_connection_logs: {
        Row: {
          created_at: string
          customer_id: string
          customer_service_id: string | null
          event_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          nas_ip_address: unknown
          session_duration_seconds: number | null
          session_id: string | null
          source: string | null
          terminate_cause: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          customer_service_id?: string | null
          event_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          nas_ip_address?: unknown
          session_duration_seconds?: number | null
          session_id?: string | null
          source?: string | null
          terminate_cause?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          customer_service_id?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          nas_ip_address?: unknown
          session_duration_seconds?: number | null
          session_id?: string | null
          source?: string | null
          terminate_cause?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_connection_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_dashboard_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_connection_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_connection_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_notification_engagement"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_connection_logs_customer_service_id_fkey"
            columns: ["customer_service_id"]
            isOneToOne: false
            referencedRelation: "customer_services"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_invoices: {
        Row: {
          amount_due: number
          amount_paid: number | null
          corporate_account_id: string | null
          corporate_site_id: string | null
          created_at: string | null
          customer_id: string
          debit_order_failed_at: string | null
          debit_order_failure_reason: string | null
          due_date: string
          email_attempts: number | null
          emailed_at: string | null
          id: string
          invoice_date: string
          invoice_number: string
          invoice_type: string | null
          is_locked: boolean | null
          line_items: Json | null
          locked_at: string | null
          locked_reason: string | null
          notes: string | null
          paid_at: string | null
          payment_collection_method: string | null
          paynow_sent_at: string | null
          paynow_sent_via: string[] | null
          paynow_transaction_ref: string | null
          paynow_url: string | null
          period_end: string | null
          period_start: string | null
          queried_at: string | null
          queried_by: string | null
          query_note: string | null
          query_status: string | null
          reminder_count: number | null
          reminder_error: string | null
          reminder_sent_at: string | null
          service_id: string | null
          status: string
          subtotal: number
          tax_amount: number | null
          total_amount: number
          updated_at: string | null
          vat_rate: number | null
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
          whatsapp_message_id: string | null
          whatsapp_sent_at: string | null
          zoho_billing_invoice_id: string | null
          zoho_books_invoice_id: string | null
          zoho_books_next_retry_at: string | null
          zoho_books_retry_count: number | null
          zoho_invoice_id: string | null
          zoho_last_sync_error: string | null
          zoho_last_synced_at: string | null
          zoho_pdf_url: string | null
          zoho_sync_status: string | null
        }
        Insert: {
          amount_due: number
          amount_paid?: number | null
          corporate_account_id?: string | null
          corporate_site_id?: string | null
          created_at?: string | null
          customer_id: string
          debit_order_failed_at?: string | null
          debit_order_failure_reason?: string | null
          due_date: string
          email_attempts?: number | null
          emailed_at?: string | null
          id?: string
          invoice_date: string
          invoice_number: string
          invoice_type?: string | null
          is_locked?: boolean | null
          line_items?: Json | null
          locked_at?: string | null
          locked_reason?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_collection_method?: string | null
          paynow_sent_at?: string | null
          paynow_sent_via?: string[] | null
          paynow_transaction_ref?: string | null
          paynow_url?: string | null
          period_end?: string | null
          period_start?: string | null
          queried_at?: string | null
          queried_by?: string | null
          query_note?: string | null
          query_status?: string | null
          reminder_count?: number | null
          reminder_error?: string | null
          reminder_sent_at?: string | null
          service_id?: string | null
          status?: string
          subtotal: number
          tax_amount?: number | null
          total_amount: number
          updated_at?: string | null
          vat_rate?: number | null
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
          whatsapp_message_id?: string | null
          whatsapp_sent_at?: string | null
          zoho_billing_invoice_id?: string | null
          zoho_books_invoice_id?: string | null
          zoho_books_next_retry_at?: string | null
          zoho_books_retry_count?: number | null
          zoho_invoice_id?: string | null
          zoho_last_sync_error?: string | null
          zoho_last_synced_at?: string | null
          zoho_pdf_url?: string | null
          zoho_sync_status?: string | null
        }
        Update: {
          amount_due?: number
          amount_paid?: number | null
          corporate_account_id?: string | null
          corporate_site_id?: string | null
          created_at?: string | null
          customer_id?: string
          debit_order_failed_at?: string | null
          debit_order_failure_reason?: string | null
          due_date?: string
          email_attempts?: number | null
          emailed_at?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          invoice_type?: string | null
          is_locked?: boolean | null
          line_items?: Json | null
          locked_at?: string | null
          locked_reason?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_collection_method?: string | null
          paynow_sent_at?: string | null
          paynow_sent_via?: string[] | null
          paynow_transaction_ref?: string | null
          paynow_url?: string | null
          period_end?: string | null
          period_start?: string | null
          queried_at?: string | null
          queried_by?: string | null
          query_note?: string | null
          query_status?: string | null
          reminder_count?: number | null
          reminder_error?: string | null
          reminder_sent_at?: string | null
          service_id?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string | null
          vat_rate?: number | null
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
          whatsapp_message_id?: string | null
          whatsapp_sent_at?: string | null
          zoho_billing_invoice_id?: string | null
          zoho_books_invoice_id?: string | null
          zoho_books_next_retry_at?: string | null
          zoho_books_retry_count?: number | null
          zoho_invoice_id?: string | null
          zoho_last_sync_error?: string | null
          zoho_last_synced_at?: string | null
          zoho_pdf_url?: string | null
          zoho_sync_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_invoices_corporate_account_id_fkey"
            columns: ["corporate_account_id"]
            isOneToOne: false
            referencedRelation: "corporate_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_invoices_corporate_site_id_fkey"
            columns: ["corporate_site_id"]
            isOneToOne: false
            referencedRelation: "corporate_sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_dashboard_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_notification_engagement"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      customer_payment_methods: {
        Row: {
          card_expiry_month: number | null
          card_expiry_year: number | null
          card_holder_name: string | null
          card_masked_number: string | null
          card_token: string | null
          card_type: string | null
          created_at: string
          customer_id: string
          deactivated_at: string | null
          display_name: string
          encrypted_details: Json | null
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          last_four: string | null
          mandate_approved_at: string | null
          mandate_created_at: string | null
          mandate_id: string | null
          mandate_status: string | null
          max_debit_amount: number | null
          method_type: string
          onboarding_submission_id: string | null
          token_created_at: string | null
          token_last_used_at: string | null
          token_status: string | null
          token_verified_at: string | null
          updated_at: string
        }
        Insert: {
          card_expiry_month?: number | null
          card_expiry_year?: number | null
          card_holder_name?: string | null
          card_masked_number?: string | null
          card_token?: string | null
          card_type?: string | null
          created_at?: string
          customer_id: string
          deactivated_at?: string | null
          display_name: string
          encrypted_details?: Json | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          last_four?: string | null
          mandate_approved_at?: string | null
          mandate_created_at?: string | null
          mandate_id?: string | null
          mandate_status?: string | null
          max_debit_amount?: number | null
          method_type: string
          onboarding_submission_id?: string | null
          token_created_at?: string | null
          token_last_used_at?: string | null
          token_status?: string | null
          token_verified_at?: string | null
          updated_at?: string
        }
        Update: {
          card_expiry_month?: number | null
          card_expiry_year?: number | null
          card_holder_name?: string | null
          card_masked_number?: string | null
          card_token?: string | null
          card_type?: string | null
          created_at?: string
          customer_id?: string
          deactivated_at?: string | null
          display_name?: string
          encrypted_details?: Json | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          last_four?: string | null
          mandate_approved_at?: string | null
          mandate_created_at?: string | null
          mandate_id?: string | null
          mandate_status?: string | null
          max_debit_amount?: number | null
          method_type?: string
          onboarding_submission_id?: string | null
          token_created_at?: string | null
          token_last_used_at?: string | null
          token_status?: string | null
          token_verified_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_payment_methods_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_dashboard_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_payment_methods_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_payment_methods_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_notification_engagement"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_payment_methods_onboarding_submission_id_fkey"
            columns: ["onboarding_submission_id"]
            isOneToOne: false
            referencedRelation: "onboarding_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_services: {
        Row: {
          activation_date: string | null
          active: boolean | null
          billing_day: number | null
          billing_start_date: string | null
          cancelled_at: string | null
          connection_id: string | null
          contract_end_date: string | null
          contract_months: number | null
          contract_start_date: string | null
          created_at: string | null
          customer_id: string
          data_cap_gb: number | null
          id: string
          installation_address: string | null
          installation_date: string | null
          last_invoice_date: string | null
          monthly_price: number
          package_id: string | null
          package_name: string
          product_category: string | null
          provider_code: string | null
          provider_name: string | null
          service_type: string
          setup_fee: number | null
          speed_down: number | null
          speed_up: number | null
          status: string
          updated_at: string | null
          zoho_last_sync_error: string | null
          zoho_last_synced_at: string | null
          zoho_subscription_id: string | null
          zoho_sync_status: string | null
        }
        Insert: {
          activation_date?: string | null
          active?: boolean | null
          billing_day?: number | null
          billing_start_date?: string | null
          cancelled_at?: string | null
          connection_id?: string | null
          contract_end_date?: string | null
          contract_months?: number | null
          contract_start_date?: string | null
          created_at?: string | null
          customer_id: string
          data_cap_gb?: number | null
          id?: string
          installation_address?: string | null
          installation_date?: string | null
          last_invoice_date?: string | null
          monthly_price: number
          package_id?: string | null
          package_name: string
          product_category?: string | null
          provider_code?: string | null
          provider_name?: string | null
          service_type: string
          setup_fee?: number | null
          speed_down?: number | null
          speed_up?: number | null
          status?: string
          updated_at?: string | null
          zoho_last_sync_error?: string | null
          zoho_last_synced_at?: string | null
          zoho_subscription_id?: string | null
          zoho_sync_status?: string | null
        }
        Update: {
          activation_date?: string | null
          active?: boolean | null
          billing_day?: number | null
          billing_start_date?: string | null
          cancelled_at?: string | null
          connection_id?: string | null
          contract_end_date?: string | null
          contract_months?: number | null
          contract_start_date?: string | null
          created_at?: string | null
          customer_id?: string
          data_cap_gb?: number | null
          id?: string
          installation_address?: string | null
          installation_date?: string | null
          last_invoice_date?: string | null
          monthly_price?: number
          package_id?: string | null
          package_name?: string
          product_category?: string | null
          provider_code?: string | null
          provider_name?: string | null
          service_type?: string
          setup_fee?: number | null
          speed_down?: number | null
          speed_up?: number | null
          status?: string
          updated_at?: string | null
          zoho_last_sync_error?: string | null
          zoho_last_synced_at?: string | null
          zoho_subscription_id?: string | null
          zoho_sync_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_services_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_dashboard_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_services_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_services_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_notification_engagement"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_services_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "service_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_services_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "sme_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_services_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "v_active_service_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_services_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "v_products_with_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_stats_snapshots: {
        Row: {
          account_balance: number
          active_services: number
          created_at: string | null
          customer_id: string
          id: string
          overdue_invoices: number
          pending_orders: number
          snapshot_date: string
          total_invoiced_mtd: number | null
          total_orders: number
          total_paid_mtd: number | null
        }
        Insert: {
          account_balance?: number
          active_services?: number
          created_at?: string | null
          customer_id: string
          id?: string
          overdue_invoices?: number
          pending_orders?: number
          snapshot_date: string
          total_invoiced_mtd?: number | null
          total_orders?: number
          total_paid_mtd?: number | null
        }
        Update: {
          account_balance?: number
          active_services?: number
          created_at?: string | null
          customer_id?: string
          id?: string
          overdue_invoices?: number
          pending_orders?: number
          snapshot_date?: string
          total_invoiced_mtd?: number | null
          total_orders?: number
          total_paid_mtd?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_stats_snapshots_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_dashboard_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_stats_snapshots_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_stats_snapshots_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_notification_engagement"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      customer_usage: {
        Row: {
          created_at: string | null
          customer_id: string
          data_limit_gb: number | null
          data_used_gb: number | null
          id: string
          month: number
          off_peak_usage_gb: number | null
          peak_usage_gb: number | null
          service_id: string
          updated_at: string | null
          year: number
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          data_limit_gb?: number | null
          data_used_gb?: number | null
          id?: string
          month: number
          off_peak_usage_gb?: number | null
          peak_usage_gb?: number | null
          service_id: string
          updated_at?: string | null
          year: number
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          data_limit_gb?: number | null
          data_used_gb?: number | null
          id?: string
          month?: number
          off_peak_usage_gb?: number | null
          peak_usage_gb?: number | null
          service_id?: string
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "customer_usage_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_dashboard_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_usage_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_usage_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_notification_engagement"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_usage_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "customer_services"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          account_number: string | null
          account_status: string | null
          account_type: string
          auth_user_id: string | null
          business_name: string | null
          business_registration: string | null
          clinic_details: Json | null
          corporate_site_id: string | null
          created_at: string | null
          email: string
          email_verified: boolean | null
          first_name: string
          id: string
          id_number: string | null
          last_login: string | null
          last_name: string
          location_type:
            | Database["public"]["Enums"]["location_type_enum"]
            | null
          onboarding_completed_at: string | null
          onboarding_status: string | null
          password_reset_expires_at: string | null
          password_reset_token: string | null
          phone: string
          phone_verified_at: string | null
          status: string | null
          tax_number: string | null
          updated_at: string | null
          whatsapp_consent: boolean | null
          whatsapp_consent_at: string | null
          whatsapp_consent_source: string | null
          zoho_billing_customer_id: string | null
          zoho_books_contact_id: string | null
          zoho_books_next_retry_at: string | null
          zoho_books_retry_count: number | null
          zoho_last_sync_error: string | null
          zoho_last_synced_at: string | null
          zoho_sync_status: string | null
        }
        Insert: {
          account_number?: string | null
          account_status?: string | null
          account_type?: string
          auth_user_id?: string | null
          business_name?: string | null
          business_registration?: string | null
          clinic_details?: Json | null
          corporate_site_id?: string | null
          created_at?: string | null
          email: string
          email_verified?: boolean | null
          first_name: string
          id?: string
          id_number?: string | null
          last_login?: string | null
          last_name: string
          location_type?:
            | Database["public"]["Enums"]["location_type_enum"]
            | null
          onboarding_completed_at?: string | null
          onboarding_status?: string | null
          password_reset_expires_at?: string | null
          password_reset_token?: string | null
          phone: string
          phone_verified_at?: string | null
          status?: string | null
          tax_number?: string | null
          updated_at?: string | null
          whatsapp_consent?: boolean | null
          whatsapp_consent_at?: string | null
          whatsapp_consent_source?: string | null
          zoho_billing_customer_id?: string | null
          zoho_books_contact_id?: string | null
          zoho_books_next_retry_at?: string | null
          zoho_books_retry_count?: number | null
          zoho_last_sync_error?: string | null
          zoho_last_synced_at?: string | null
          zoho_sync_status?: string | null
        }
        Update: {
          account_number?: string | null
          account_status?: string | null
          account_type?: string
          auth_user_id?: string | null
          business_name?: string | null
          business_registration?: string | null
          clinic_details?: Json | null
          corporate_site_id?: string | null
          created_at?: string | null
          email?: string
          email_verified?: boolean | null
          first_name?: string
          id?: string
          id_number?: string | null
          last_login?: string | null
          last_name?: string
          location_type?:
            | Database["public"]["Enums"]["location_type_enum"]
            | null
          onboarding_completed_at?: string | null
          onboarding_status?: string | null
          password_reset_expires_at?: string | null
          password_reset_token?: string | null
          phone?: string
          phone_verified_at?: string | null
          status?: string | null
          tax_number?: string | null
          updated_at?: string | null
          whatsapp_consent?: boolean | null
          whatsapp_consent_at?: string | null
          whatsapp_consent_source?: string | null
          zoho_billing_customer_id?: string | null
          zoho_books_contact_id?: string | null
          zoho_books_next_retry_at?: string | null
          zoho_books_retry_count?: number | null
          zoho_last_sync_error?: string | null
          zoho_last_synced_at?: string | null
          zoho_sync_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_corporate_site_id_fkey"
            columns: ["corporate_site_id"]
            isOneToOne: false
            referencedRelation: "corporate_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      cycle_match_runs: {
        Row: {
          created_at: string
          error_message: string | null
          finished_at: string | null
          id: string
          period_month: string
          services_checked: number
          started_at: string
          status: string
          triggered_by: string
          triggered_by_user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          period_month: string
          services_checked?: number
          started_at?: string
          status?: string
          triggered_by?: string
          triggered_by_user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          period_month?: string
          services_checked?: number
          started_at?: string
          status?: string
          triggered_by?: string
          triggered_by_user_id?: string | null
        }
        Relationships: []
      }
      debit_order_batch_items: {
        Row: {
          account_reference: string
          action_date: string
          amount: number
          batch_id: string
          created_at: string
          customer_id: string | null
          id: string
          invoice_id: string | null
          order_id: string | null
          processed_at: string | null
          status: string
          transaction_code: string | null
          unpaid_code: string | null
          unpaid_reason: string | null
          updated_at: string
        }
        Insert: {
          account_reference: string
          action_date: string
          amount: number
          batch_id: string
          created_at?: string
          customer_id?: string | null
          id?: string
          invoice_id?: string | null
          order_id?: string | null
          processed_at?: string | null
          status?: string
          transaction_code?: string | null
          unpaid_code?: string | null
          unpaid_reason?: string | null
          updated_at?: string
        }
        Update: {
          account_reference?: string
          action_date?: string
          amount?: number
          batch_id?: string
          created_at?: string
          customer_id?: string | null
          id?: string
          invoice_id?: string | null
          order_id?: string | null
          processed_at?: string | null
          status?: string
          transaction_code?: string | null
          unpaid_code?: string | null
          unpaid_reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "debit_order_batch_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "debit_order_batches"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "debit_order_batch_items_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_dashboard_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "debit_order_batch_items_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debit_order_batch_items_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_notification_engagement"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      debit_order_batches: {
        Row: {
          authorised_at: string | null
          batch_id: string
          batch_name: string
          created_at: string
          error_message: string | null
          failed_count: number | null
          id: string
          item_count: number
          processed_at: string | null
          status: string
          submitted_at: string | null
          successful_count: number | null
          total_amount: number
          total_collected: number | null
          updated_at: string
        }
        Insert: {
          authorised_at?: string | null
          batch_id: string
          batch_name: string
          created_at?: string
          error_message?: string | null
          failed_count?: number | null
          id?: string
          item_count?: number
          processed_at?: string | null
          status?: string
          submitted_at?: string | null
          successful_count?: number | null
          total_amount?: number
          total_collected?: number | null
          updated_at?: string
        }
        Update: {
          authorised_at?: string | null
          batch_id?: string
          batch_name?: string
          created_at?: string
          error_message?: string | null
          failed_count?: number | null
          id?: string
          item_count?: number
          processed_at?: string | null
          status?: string
          submitted_at?: string | null
          successful_count?: number | null
          total_amount?: number
          total_collected?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      departments: {
        Row: {
          budget_allocation_zar: number | null
          code: string
          created_at: string | null
          id: string
          manager_id: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          budget_allocation_zar?: number | null
          code: string
          created_at?: string | null
          id?: string
          manager_id?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          budget_allocation_zar?: number | null
          code?: string
          created_at?: string | null
          id?: string
          manager_id?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_departments_manager"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      device_health_snapshots: {
        Row: {
          anomaly_detected: boolean | null
          anomaly_type: string | null
          captured_at: string
          cpu_usage: number | null
          device_sn: string
          health_score: number | null
          id: string
          memory_usage: number | null
          online_clients: number | null
          status: string | null
        }
        Insert: {
          anomaly_detected?: boolean | null
          anomaly_type?: string | null
          captured_at?: string
          cpu_usage?: number | null
          device_sn: string
          health_score?: number | null
          id?: string
          memory_usage?: number | null
          online_clients?: number | null
          status?: string | null
        }
        Update: {
          anomaly_detected?: boolean | null
          anomaly_type?: string | null
          captured_at?: string
          cpu_usage?: number | null
          device_sn?: string
          health_score?: number | null
          id?: string
          memory_usage?: number | null
          online_clients?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "device_health_snapshots_device_sn_fkey"
            columns: ["device_sn"]
            isOneToOne: false
            referencedRelation: "ruijie_device_cache"
            referencedColumns: ["sn"]
          },
        ]
      }
      dfa_buildings: {
        Row: {
          broadband: string | null
          building_id: string | null
          building_name: string | null
          coverage_type: string
          created_at: string | null
          ftth: string | null
          id: string
          last_synced_at: string | null
          latitude: number
          location: unknown
          longitude: number
          object_id: number
          precinct: string | null
          promotion: string | null
          property_owner: string | null
          street_address: string | null
        }
        Insert: {
          broadband?: string | null
          building_id?: string | null
          building_name?: string | null
          coverage_type: string
          created_at?: string | null
          ftth?: string | null
          id?: string
          last_synced_at?: string | null
          latitude: number
          location?: unknown
          longitude: number
          object_id: number
          precinct?: string | null
          promotion?: string | null
          property_owner?: string | null
          street_address?: string | null
        }
        Update: {
          broadband?: string | null
          building_id?: string | null
          building_name?: string | null
          coverage_type?: string
          created_at?: string | null
          ftth?: string | null
          id?: string
          last_synced_at?: string | null
          latitude?: number
          location?: unknown
          longitude?: number
          object_id?: number
          precinct?: string | null
          promotion?: string | null
          property_owner?: string | null
          street_address?: string | null
        }
        Relationships: []
      }
      dfa_sync_logs: {
        Row: {
          completed_at: string | null
          connected_count: number | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          metadata: Json | null
          near_net_count: number | null
          records_deleted: number | null
          records_fetched: number | null
          records_inserted: number | null
          records_updated: number | null
          started_at: string | null
          status: string
          triggered_by: string | null
          triggered_by_user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          connected_count?: number | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          near_net_count?: number | null
          records_deleted?: number | null
          records_fetched?: number | null
          records_inserted?: number | null
          records_updated?: number | null
          started_at?: string | null
          status: string
          triggered_by?: string | null
          triggered_by_user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          connected_count?: number | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          near_net_count?: number | null
          records_deleted?: number | null
          records_fetched?: number | null
          records_inserted?: number | null
          records_updated?: number | null
          started_at?: string | null
          status?: string
          triggered_by?: string | null
          triggered_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dfa_sync_logs_triggered_by_user_id_fkey"
            columns: ["triggered_by_user_id"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dfa_sync_logs_triggered_by_user_id_fkey"
            columns: ["triggered_by_user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dfa_sync_logs_triggered_by_user_id_fkey"
            columns: ["triggered_by_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      elevation_cache: {
        Row: {
          elevation_m: number
          fetched_at: string
          id: string
          lat: number
          lng: number
          source: string
        }
        Insert: {
          elevation_m: number
          fetched_at?: string
          id?: string
          lat: number
          lng: number
          source?: string
        }
        Update: {
          elevation_m?: number
          fetched_at?: string
          id?: string
          lat?: number
          lng?: number
          source?: string
        }
        Relationships: []
      }
      email_template_versions: {
        Row: {
          bounce_count: number | null
          click_count: number | null
          click_rate: number | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          is_winner: boolean | null
          open_count: number | null
          open_rate: number | null
          sent_count: number | null
          slice_composition: Json
          subject_template: string
          template_id: string
          test_end_date: string | null
          test_start_date: string | null
          traffic_percentage: number | null
          unsubscribe_count: number | null
          updated_at: string | null
          version_name: string
        }
        Insert: {
          bounce_count?: number | null
          click_count?: number | null
          click_rate?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_winner?: boolean | null
          open_count?: number | null
          open_rate?: number | null
          sent_count?: number | null
          slice_composition?: Json
          subject_template: string
          template_id: string
          test_end_date?: string | null
          test_start_date?: string | null
          traffic_percentage?: number | null
          unsubscribe_count?: number | null
          updated_at?: string | null
          version_name: string
        }
        Update: {
          bounce_count?: number | null
          click_count?: number | null
          click_rate?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_winner?: boolean | null
          open_count?: number | null
          open_rate?: number | null
          sent_count?: number | null
          slice_composition?: Json
          subject_template?: string
          template_id?: string
          test_end_date?: string | null
          test_start_date?: string | null
          traffic_percentage?: number | null
          unsubscribe_count?: number | null
          updated_at?: string | null
          version_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_template_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_template_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_template_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_template_versions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["template_id"]
          },
          {
            foreignKeyName: "email_template_versions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "v_email_template_performance"
            referencedColumns: ["template_id"]
          },
        ]
      }
      email_templates: {
        Row: {
          active: boolean | null
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          last_sent_at: string | null
          name: string
          send_count: number | null
          slice_composition: Json
          subject_template: string
          template_id: string
          updated_at: string | null
          updated_by: string | null
          variables: Json
        }
        Insert: {
          active?: boolean | null
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          last_sent_at?: string | null
          name: string
          send_count?: number | null
          slice_composition?: Json
          subject_template: string
          template_id: string
          updated_at?: string | null
          updated_by?: string | null
          variables?: Json
        }
        Update: {
          active?: boolean | null
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          last_sent_at?: string | null
          name?: string
          send_count?: number | null
          slice_composition?: Json
          subject_template?: string
          template_id?: string
          updated_at?: string | null
          updated_by?: string | null
          variables?: Json
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_templates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_templates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_templates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      emandate_requests: {
        Row: {
          created_at: string | null
          created_by: string | null
          customer_id: string
          email_sent_at: string | null
          expires_at: string | null
          id: string
          ip_address: unknown
          last_resent_at: string | null
          netcash_account_reference: string | null
          netcash_error_messages: string[] | null
          netcash_mandate_url: string | null
          netcash_response_code: string | null
          netcash_service_key: string | null
          netcash_short_url: string | null
          netcash_warnings: string[] | null
          notes: string | null
          notification_email: string | null
          notification_phone: string | null
          order_id: string | null
          payment_method_id: string | null
          postback_data: Json | null
          postback_mandate_pdf_link: string | null
          postback_mandate_successful: boolean | null
          postback_reason_for_decline: string | null
          postback_received_at: string | null
          request_payload: Json | null
          request_type: string
          resend_count: number | null
          signed_at: string | null
          sms_delivered_at: string | null
          sms_delivery_status: string | null
          sms_error: string | null
          sms_message_id: string | null
          sms_provider: string | null
          sms_sent_at: string | null
          status: string
          updated_at: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          customer_id: string
          email_sent_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          last_resent_at?: string | null
          netcash_account_reference?: string | null
          netcash_error_messages?: string[] | null
          netcash_mandate_url?: string | null
          netcash_response_code?: string | null
          netcash_service_key?: string | null
          netcash_short_url?: string | null
          netcash_warnings?: string[] | null
          notes?: string | null
          notification_email?: string | null
          notification_phone?: string | null
          order_id?: string | null
          payment_method_id?: string | null
          postback_data?: Json | null
          postback_mandate_pdf_link?: string | null
          postback_mandate_successful?: boolean | null
          postback_reason_for_decline?: string | null
          postback_received_at?: string | null
          request_payload?: Json | null
          request_type?: string
          resend_count?: number | null
          signed_at?: string | null
          sms_delivered_at?: string | null
          sms_delivery_status?: string | null
          sms_error?: string | null
          sms_message_id?: string | null
          sms_provider?: string | null
          sms_sent_at?: string | null
          status?: string
          updated_at?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          customer_id?: string
          email_sent_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          last_resent_at?: string | null
          netcash_account_reference?: string | null
          netcash_error_messages?: string[] | null
          netcash_mandate_url?: string | null
          netcash_response_code?: string | null
          netcash_service_key?: string | null
          netcash_short_url?: string | null
          netcash_warnings?: string[] | null
          notes?: string | null
          notification_email?: string | null
          notification_phone?: string | null
          order_id?: string | null
          payment_method_id?: string | null
          postback_data?: Json | null
          postback_mandate_pdf_link?: string | null
          postback_mandate_successful?: boolean | null
          postback_reason_for_decline?: string | null
          postback_received_at?: string | null
          request_payload?: Json | null
          request_type?: string
          resend_count?: number | null
          signed_at?: string | null
          sms_delivered_at?: string | null
          sms_delivery_status?: string | null
          sms_error?: string | null
          sms_message_id?: string | null
          sms_provider?: string | null
          sms_sent_at?: string | null
          status?: string
          updated_at?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emandate_requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emandate_requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emandate_requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emandate_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_dashboard_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "emandate_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emandate_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_notification_engagement"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "emandate_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "consumer_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emandate_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_order_compliance_summary"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "emandate_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_order_notifications"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "emandate_requests_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string | null
          department_id: string
          email: string | null
          employee_number: string
          first_name: string
          hire_date: string
          id: string
          is_active: boolean | null
          last_name: string
          position: string
          salary_zar: number
          tax_number: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department_id: string
          email?: string | null
          employee_number: string
          first_name: string
          hire_date: string
          id?: string
          is_active?: boolean | null
          last_name: string
          position: string
          salary_zar: number
          tax_number?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department_id?: string
          email?: string | null
          employee_number?: string
          first_name?: string
          hire_date?: string
          id?: string
          is_active?: boolean | null
          last_name?: string
          position?: string
          salary_zar?: number
          tax_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_costs: {
        Row: {
          created_at: string | null
          equipment_name: string
          equipment_type: string
          id: string
          project_id: string
          purchase_date: string | null
          quantity: number
          supplier: string | null
          total_cost_zar: number | null
          unit_cost_zar: number
        }
        Insert: {
          created_at?: string | null
          equipment_name: string
          equipment_type: string
          id?: string
          project_id: string
          purchase_date?: string | null
          quantity?: number
          supplier?: string | null
          total_cost_zar?: number | null
          unit_cost_zar: number
        }
        Update: {
          created_at?: string | null
          equipment_name?: string
          equipment_type?: string
          id?: string
          project_id?: string
          purchase_date?: string | null
          quantity?: number
          supplier?: string | null
          total_cost_zar?: number | null
          unit_cost_zar?: number
        }
        Relationships: [
          {
            foreignKeyName: "equipment_costs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "installation_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      execution_milestones: {
        Row: {
          actual_arlan_deals: number | null
          actual_arlan_mrr: number | null
          actual_customers: number
          actual_mrr: number
          actual_tarana_customers: number | null
          actual_tarana_mrr: number | null
          capital_budget_remaining: number | null
          capital_budget_used: number | null
          created_at: string
          hiring_trigger: string | null
          id: string
          label: string
          month_number: number
          msc_commitment: number
          notes: string | null
          period_end: string
          period_start: string
          phase: string
          status: string
          target_arlan_deals: number | null
          target_arlan_mrr: number | null
          target_customers: number
          target_mrr: number
          target_products: string[]
          target_tarana_customers: number | null
          target_tarana_mrr: number | null
          updated_at: string
        }
        Insert: {
          actual_arlan_deals?: number | null
          actual_arlan_mrr?: number | null
          actual_customers?: number
          actual_mrr?: number
          actual_tarana_customers?: number | null
          actual_tarana_mrr?: number | null
          capital_budget_remaining?: number | null
          capital_budget_used?: number | null
          created_at?: string
          hiring_trigger?: string | null
          id?: string
          label: string
          month_number: number
          msc_commitment?: number
          notes?: string | null
          period_end: string
          period_start: string
          phase: string
          status?: string
          target_arlan_deals?: number | null
          target_arlan_mrr?: number | null
          target_customers?: number
          target_mrr?: number
          target_products?: string[]
          target_tarana_customers?: number | null
          target_tarana_mrr?: number | null
          updated_at?: string
        }
        Update: {
          actual_arlan_deals?: number | null
          actual_arlan_mrr?: number | null
          actual_customers?: number
          actual_mrr?: number
          actual_tarana_customers?: number | null
          actual_tarana_mrr?: number | null
          capital_budget_remaining?: number | null
          capital_budget_used?: number | null
          created_at?: string
          hiring_trigger?: string | null
          id?: string
          label?: string
          month_number?: number
          msc_commitment?: number
          notes?: string | null
          period_end?: string
          period_start?: string
          phase?: string
          status?: string
          target_arlan_deals?: number | null
          target_arlan_mrr?: number | null
          target_customers?: number
          target_mrr?: number
          target_products?: string[]
          target_tarana_customers?: number | null
          target_tarana_mrr?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      field_job_status_history: {
        Row: {
          changed_by: string | null
          changed_by_technician_id: string | null
          created_at: string | null
          id: string
          job_id: string
          latitude: number | null
          longitude: number | null
          new_status: string
          notes: string | null
          previous_status: string | null
        }
        Insert: {
          changed_by?: string | null
          changed_by_technician_id?: string | null
          created_at?: string | null
          id?: string
          job_id: string
          latitude?: number | null
          longitude?: number | null
          new_status: string
          notes?: string | null
          previous_status?: string | null
        }
        Update: {
          changed_by?: string | null
          changed_by_technician_id?: string | null
          created_at?: string | null
          id?: string
          job_id?: string
          latitude?: number | null
          longitude?: number | null
          new_status?: string
          notes?: string | null
          previous_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "field_job_status_history_changed_by_technician_id_fkey"
            columns: ["changed_by_technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_job_status_history_changed_by_technician_id_fkey"
            columns: ["changed_by_technician_id"]
            isOneToOne: false
            referencedRelation: "v_technician_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_job_status_history_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "field_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_job_status_history_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_technician_status"
            referencedColumns: ["current_job_id"]
          },
          {
            foreignKeyName: "field_job_status_history_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_todays_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      field_jobs: {
        Row: {
          address: string
          address_notes: string | null
          assigned_at: string | null
          assigned_by: string | null
          assigned_technician_id: string | null
          completed_at: string | null
          completion_notes: string | null
          completion_photos: string[] | null
          created_at: string | null
          created_by: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_signature_url: string | null
          description: string | null
          estimated_duration_minutes: number | null
          id: string
          job_number: string
          job_type: string
          latitude: number | null
          longitude: number | null
          order_id: string | null
          priority: string | null
          scheduled_date: string | null
          scheduled_time_end: string | null
          scheduled_time_start: string | null
          started_at: string | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          address: string
          address_notes?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_technician_id?: string | null
          completed_at?: string | null
          completion_notes?: string | null
          completion_photos?: string[] | null
          created_at?: string | null
          created_by?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_signature_url?: string | null
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          job_number: string
          job_type: string
          latitude?: number | null
          longitude?: number | null
          order_id?: string | null
          priority?: string | null
          scheduled_date?: string | null
          scheduled_time_end?: string | null
          scheduled_time_start?: string | null
          started_at?: string | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          address?: string
          address_notes?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_technician_id?: string | null
          completed_at?: string | null
          completion_notes?: string | null
          completion_photos?: string[] | null
          created_at?: string | null
          created_by?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_signature_url?: string | null
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          job_number?: string
          job_type?: string
          latitude?: number | null
          longitude?: number | null
          order_id?: string | null
          priority?: string | null
          scheduled_date?: string | null
          scheduled_time_end?: string | null
          scheduled_time_start?: string | null
          started_at?: string | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "field_jobs_assigned_technician_id_fkey"
            columns: ["assigned_technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_jobs_assigned_technician_id_fkey"
            columns: ["assigned_technician_id"]
            isOneToOne: false
            referencedRelation: "v_technician_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_dashboard_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "field_jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_notification_engagement"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "field_jobs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "consumer_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_jobs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_order_compliance_summary"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "field_jobs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_order_notifications"
            referencedColumns: ["order_id"]
          },
        ]
      }
      financial_periods: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          is_current: boolean | null
          name: string
          start_date: string
          tax_year: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          is_current?: boolean | null
          name: string
          start_date: string
          tax_year: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          is_current?: boolean | null
          name?: string
          start_date?: string
          tax_year?: string
        }
        Relationships: []
      }
      fttb_coverage_areas: {
        Row: {
          active: boolean | null
          address: string
          building_id: string | null
          building_name: string | null
          connection_type: string
          created_at: string | null
          estimated_activation_days: number | null
          geolocation: unknown
          id: string
          is_promotion: boolean | null
          last_verified: string | null
          latitude: number
          longitude: number
          max_speed_down: number | null
          max_speed_up: number | null
          precinct: string | null
          provider_id: string
          requires_third_party: boolean | null
          technology: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          address: string
          building_id?: string | null
          building_name?: string | null
          connection_type: string
          created_at?: string | null
          estimated_activation_days?: number | null
          geolocation?: unknown
          id?: string
          is_promotion?: boolean | null
          last_verified?: string | null
          latitude: number
          longitude: number
          max_speed_down?: number | null
          max_speed_up?: number | null
          precinct?: string | null
          provider_id: string
          requires_third_party?: boolean | null
          technology?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          address?: string
          building_id?: string | null
          building_name?: string | null
          connection_type?: string
          created_at?: string | null
          estimated_activation_days?: number | null
          geolocation?: unknown
          id?: string
          is_promotion?: boolean | null
          last_verified?: string | null
          latitude?: number
          longitude?: number
          max_speed_down?: number | null
          max_speed_up?: number | null
          precinct?: string | null
          provider_id?: string
          requires_third_party?: boolean | null
          technology?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fttb_coverage_areas_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "fttb_network_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fttb_coverage_areas_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "v_active_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fttb_coverage_areas_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "v_providers_with_logos"
            referencedColumns: ["id"]
          },
        ]
      }
      fttb_network_providers: {
        Row: {
          active: boolean | null
          api_credentials: Json | null
          api_documentation_url: string | null
          api_version: string | null
          average_activation_days: number | null
          avg_response_time_24h: number | null
          coverage_api_type: string | null
          coverage_api_url: string | null
          coverage_source: string | null
          created_at: string | null
          display_name: string
          health_status: string | null
          id: string
          last_coverage_update: string | null
          last_health_check: string | null
          last_successful_check: string | null
          logo_aspect_ratio: number | null
          logo_dark_url: string | null
          logo_format: string | null
          logo_light_url: string | null
          logo_url: string | null
          name: string
          priority: number | null
          provider_code: string | null
          provider_type: string
          sales_contact: string | null
          service_areas: string[] | null
          service_offerings: Json | null
          sla_uptime_percentage: number | null
          sso_config: Json | null
          success_rate_24h: number | null
          support_contact: string | null
          support_phone: string | null
          technology: string
          total_buildings: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          api_credentials?: Json | null
          api_documentation_url?: string | null
          api_version?: string | null
          average_activation_days?: number | null
          avg_response_time_24h?: number | null
          coverage_api_type?: string | null
          coverage_api_url?: string | null
          coverage_source?: string | null
          created_at?: string | null
          display_name: string
          health_status?: string | null
          id?: string
          last_coverage_update?: string | null
          last_health_check?: string | null
          last_successful_check?: string | null
          logo_aspect_ratio?: number | null
          logo_dark_url?: string | null
          logo_format?: string | null
          logo_light_url?: string | null
          logo_url?: string | null
          name: string
          priority?: number | null
          provider_code?: string | null
          provider_type: string
          sales_contact?: string | null
          service_areas?: string[] | null
          service_offerings?: Json | null
          sla_uptime_percentage?: number | null
          sso_config?: Json | null
          success_rate_24h?: number | null
          support_contact?: string | null
          support_phone?: string | null
          technology: string
          total_buildings?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          api_credentials?: Json | null
          api_documentation_url?: string | null
          api_version?: string | null
          average_activation_days?: number | null
          avg_response_time_24h?: number | null
          coverage_api_type?: string | null
          coverage_api_url?: string | null
          coverage_source?: string | null
          created_at?: string | null
          display_name?: string
          health_status?: string | null
          id?: string
          last_coverage_update?: string | null
          last_health_check?: string | null
          last_successful_check?: string | null
          logo_aspect_ratio?: number | null
          logo_dark_url?: string | null
          logo_format?: string | null
          logo_light_url?: string | null
          logo_url?: string | null
          name?: string
          priority?: number | null
          provider_code?: string | null
          provider_type?: string
          sales_contact?: string | null
          service_areas?: string[] | null
          service_offerings?: Json | null
          sla_uptime_percentage?: number | null
          sso_config?: Json | null
          success_rate_24h?: number | null
          support_contact?: string | null
          support_phone?: string | null
          technology?: string
          total_buildings?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      hardware_product_suppliers: {
        Row: {
          cost_updated_at: string | null
          created_at: string | null
          hardware_product_id: string
          id: string
          is_preferred: boolean | null
          last_synced_cost: number | null
          supplier_cost: number
          supplier_product_id: string
          updated_at: string | null
        }
        Insert: {
          cost_updated_at?: string | null
          created_at?: string | null
          hardware_product_id: string
          id?: string
          is_preferred?: boolean | null
          last_synced_cost?: number | null
          supplier_cost: number
          supplier_product_id: string
          updated_at?: string | null
        }
        Update: {
          cost_updated_at?: string | null
          created_at?: string | null
          hardware_product_id?: string
          id?: string
          is_preferred?: boolean | null
          last_synced_cost?: number | null
          supplier_cost?: number
          supplier_product_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hardware_product_suppliers_hardware_product_id_fkey"
            columns: ["hardware_product_id"]
            isOneToOne: false
            referencedRelation: "circletel_hardware_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hardware_product_suppliers_hardware_product_id_fkey"
            columns: ["hardware_product_id"]
            isOneToOne: false
            referencedRelation: "v_hardware_product_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hardware_product_suppliers_supplier_product_id_fkey"
            columns: ["supplier_product_id"]
            isOneToOne: false
            referencedRelation: "supplier_products"
            referencedColumns: ["id"]
          },
        ]
      }
      hardware_product_terms: {
        Row: {
          created_at: string | null
          delivery_estimate: string | null
          effective_from: string | null
          hardware_product_id: string
          id: string
          is_back_to_back: boolean | null
          refund_policy: string | null
          return_policy: string | null
          source_supplier_code: string | null
          source_supplier_warranty_months: number | null
          updated_at: string | null
          warranty_notes: string | null
          warranty_period: string | null
        }
        Insert: {
          created_at?: string | null
          delivery_estimate?: string | null
          effective_from?: string | null
          hardware_product_id: string
          id?: string
          is_back_to_back?: boolean | null
          refund_policy?: string | null
          return_policy?: string | null
          source_supplier_code?: string | null
          source_supplier_warranty_months?: number | null
          updated_at?: string | null
          warranty_notes?: string | null
          warranty_period?: string | null
        }
        Update: {
          created_at?: string | null
          delivery_estimate?: string | null
          effective_from?: string | null
          hardware_product_id?: string
          id?: string
          is_back_to_back?: boolean | null
          refund_policy?: string | null
          return_policy?: string | null
          source_supplier_code?: string | null
          source_supplier_warranty_months?: number | null
          updated_at?: string | null
          warranty_notes?: string | null
          warranty_period?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hardware_product_terms_hardware_product_id_fkey"
            columns: ["hardware_product_id"]
            isOneToOne: false
            referencedRelation: "circletel_hardware_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hardware_product_terms_hardware_product_id_fkey"
            columns: ["hardware_product_id"]
            isOneToOne: false
            referencedRelation: "v_hardware_product_detail"
            referencedColumns: ["id"]
          },
        ]
      }
      hardware_product_terms_history: {
        Row: {
          change_description: string | null
          changed_by: string | null
          created_at: string | null
          delivery_estimate: string | null
          effective_from: string | null
          hardware_product_id: string
          id: string
          is_back_to_back: boolean | null
          refund_policy: string | null
          return_policy: string | null
          source_supplier_code: string | null
          source_supplier_warranty_months: number | null
          version: number
          warranty_notes: string | null
          warranty_period: string | null
        }
        Insert: {
          change_description?: string | null
          changed_by?: string | null
          created_at?: string | null
          delivery_estimate?: string | null
          effective_from?: string | null
          hardware_product_id: string
          id?: string
          is_back_to_back?: boolean | null
          refund_policy?: string | null
          return_policy?: string | null
          source_supplier_code?: string | null
          source_supplier_warranty_months?: number | null
          version?: number
          warranty_notes?: string | null
          warranty_period?: string | null
        }
        Update: {
          change_description?: string | null
          changed_by?: string | null
          created_at?: string | null
          delivery_estimate?: string | null
          effective_from?: string | null
          hardware_product_id?: string
          id?: string
          is_back_to_back?: boolean | null
          refund_policy?: string | null
          return_policy?: string | null
          source_supplier_code?: string | null
          source_supplier_warranty_months?: number | null
          version?: number
          warranty_notes?: string | null
          warranty_period?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hardware_product_terms_history_hardware_product_id_fkey"
            columns: ["hardware_product_id"]
            isOneToOne: false
            referencedRelation: "circletel_hardware_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hardware_product_terms_history_hardware_product_id_fkey"
            columns: ["hardware_product_id"]
            isOneToOne: false
            referencedRelation: "v_hardware_product_detail"
            referencedColumns: ["id"]
          },
        ]
      }
      hardware_service_links: {
        Row: {
          created_at: string | null
          hardware_product_id: string
          id: string
          relationship_type: string | null
          service_package_id: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          hardware_product_id: string
          id?: string
          relationship_type?: string | null
          service_package_id: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          hardware_product_id?: string
          id?: string
          relationship_type?: string | null
          service_package_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hardware_service_links_hardware_product_id_fkey"
            columns: ["hardware_product_id"]
            isOneToOne: false
            referencedRelation: "circletel_hardware_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hardware_service_links_hardware_product_id_fkey"
            columns: ["hardware_product_id"]
            isOneToOne: false
            referencedRelation: "v_hardware_product_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hardware_service_links_service_package_id_fkey"
            columns: ["service_package_id"]
            isOneToOne: false
            referencedRelation: "service_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hardware_service_links_service_package_id_fkey"
            columns: ["service_package_id"]
            isOneToOne: false
            referencedRelation: "sme_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hardware_service_links_service_package_id_fkey"
            columns: ["service_package_id"]
            isOneToOne: false
            referencedRelation: "v_active_service_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hardware_service_links_service_package_id_fkey"
            columns: ["service_package_id"]
            isOneToOne: false
            referencedRelation: "v_products_with_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      installation_projects: {
        Row: {
          actual_cost_zar: number | null
          client_name: string
          completion_date: string | null
          created_at: string | null
          created_by: string
          department_id: string
          estimated_cost_zar: number
          id: string
          project_name: string
          project_type: string
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          actual_cost_zar?: number | null
          client_name: string
          completion_date?: string | null
          created_at?: string | null
          created_by: string
          department_id: string
          estimated_cost_zar: number
          id?: string
          project_name: string
          project_type: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_cost_zar?: number | null
          client_name?: string
          completion_date?: string | null
          created_at?: string | null
          created_by?: string
          department_id?: string
          estimated_cost_zar?: number
          id?: string
          project_name?: string
          project_type?: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "installation_projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installation_projects_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      installation_requirements: {
        Row: {
          created_at: string | null
          description: string
          id: string
          project_id: string
          quantity: number
          requirement_type: string
          supplier: string | null
          total_cost_zar: number | null
          unit_cost_zar: number
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          project_id: string
          quantity?: number
          requirement_type: string
          supplier?: string | null
          total_cost_zar?: number | null
          unit_cost_zar: number
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          project_id?: string
          quantity?: number
          requirement_type?: string
          supplier?: string | null
          total_cost_zar?: number | null
          unit_cost_zar?: number
        }
        Relationships: [
          {
            foreignKeyName: "installation_requirements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "installation_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      installation_schedules: {
        Row: {
          completed_at: string | null
          completion_notes: string | null
          contract_id: string | null
          created_at: string | null
          id: string
          order_id: string
          scheduled_date: string
          scheduled_time_slot: string | null
          status: string
          technician_id: string | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          completion_notes?: string | null
          contract_id?: string | null
          created_at?: string | null
          id?: string
          order_id: string
          scheduled_date: string
          scheduled_time_slot?: string | null
          status?: string
          technician_id?: string | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          completion_notes?: string | null
          contract_id?: string | null
          created_at?: string | null
          id?: string
          order_id?: string
          scheduled_date?: string
          scheduled_time_slot?: string | null
          status?: string
          technician_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "installation_schedules_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installation_schedules_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "consumer_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installation_schedules_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_order_compliance_summary"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "installation_schedules_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_order_notifications"
            referencedColumns: ["order_id"]
          },
        ]
      }
      installation_tasks: {
        Row: {
          actual_duration_minutes: number | null
          completed_at: string | null
          completion_photos: string[] | null
          created_at: string
          created_by: string | null
          customer_contact_email: string | null
          customer_contact_name: string | null
          customer_contact_phone: string | null
          customer_feedback: string | null
          customer_rating: number | null
          customer_signature_url: string | null
          equipment_installed: Json | null
          estimated_duration_minutes: number | null
          id: string
          installation_address: Json | null
          issues_encountered: string | null
          order_id: string
          resolution_notes: string | null
          router_mac_address: string | null
          router_model: string | null
          router_serial: string | null
          scheduled_date: string
          scheduled_time_slot: string | null
          started_at: string | null
          status: string | null
          technician_id: string | null
          technician_notes: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          actual_duration_minutes?: number | null
          completed_at?: string | null
          completion_photos?: string[] | null
          created_at?: string
          created_by?: string | null
          customer_contact_email?: string | null
          customer_contact_name?: string | null
          customer_contact_phone?: string | null
          customer_feedback?: string | null
          customer_rating?: number | null
          customer_signature_url?: string | null
          equipment_installed?: Json | null
          estimated_duration_minutes?: number | null
          id?: string
          installation_address?: Json | null
          issues_encountered?: string | null
          order_id: string
          resolution_notes?: string | null
          router_mac_address?: string | null
          router_model?: string | null
          router_serial?: string | null
          scheduled_date: string
          scheduled_time_slot?: string | null
          started_at?: string | null
          status?: string | null
          technician_id?: string | null
          technician_notes?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          actual_duration_minutes?: number | null
          completed_at?: string | null
          completion_photos?: string[] | null
          created_at?: string
          created_by?: string | null
          customer_contact_email?: string | null
          customer_contact_name?: string | null
          customer_contact_phone?: string | null
          customer_feedback?: string | null
          customer_rating?: number | null
          customer_signature_url?: string | null
          equipment_installed?: Json | null
          estimated_duration_minutes?: number | null
          id?: string
          installation_address?: Json | null
          issues_encountered?: string | null
          order_id?: string
          resolution_notes?: string | null
          router_mac_address?: string | null
          router_model?: string | null
          router_serial?: string | null
          scheduled_date?: string
          scheduled_time_slot?: string | null
          started_at?: string | null
          status?: string | null
          technician_id?: string | null
          technician_notes?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "installation_tasks_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "consumer_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installation_tasks_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_order_compliance_summary"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "installation_tasks_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_order_notifications"
            referencedColumns: ["order_id"]
          },
        ]
      }
      integration_activity_log: {
        Row: {
          action_description: string | null
          action_result: string | null
          action_type: string
          after_state: Json | null
          before_state: Json | null
          created_at: string | null
          error_message: string | null
          id: string
          integration_slug: string | null
          ip_address: string | null
          performed_by: string | null
          performed_by_email: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          user_agent: string | null
        }
        Insert: {
          action_description?: string | null
          action_result?: string | null
          action_type: string
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          integration_slug?: string | null
          ip_address?: string | null
          performed_by?: string | null
          performed_by_email?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action_description?: string | null
          action_result?: string | null
          action_type?: string
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          integration_slug?: string | null
          ip_address?: string | null
          performed_by?: string | null
          performed_by_email?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_activity_log_integration_slug_fkey"
            columns: ["integration_slug"]
            isOneToOne: false
            referencedRelation: "integration_registry"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "integration_activity_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_activity_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_activity_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_api_metrics: {
        Row: {
          avg_response_time_ms: number | null
          created_at: string | null
          failed_requests: number | null
          id: string
          integration_slug: string
          max_response_time_ms: number | null
          metric_date: string
          metric_hour: number | null
          min_response_time_ms: number | null
          p95_response_time_ms: number | null
          rate_limit_hits: number | null
          rate_limit_quota: number | null
          rate_limit_remaining: number | null
          rate_limit_reset_at: string | null
          status_2xx: number | null
          status_4xx: number | null
          status_5xx: number | null
          successful_requests: number | null
          top_errors: Json | null
          total_requests: number | null
          updated_at: string | null
        }
        Insert: {
          avg_response_time_ms?: number | null
          created_at?: string | null
          failed_requests?: number | null
          id?: string
          integration_slug: string
          max_response_time_ms?: number | null
          metric_date: string
          metric_hour?: number | null
          min_response_time_ms?: number | null
          p95_response_time_ms?: number | null
          rate_limit_hits?: number | null
          rate_limit_quota?: number | null
          rate_limit_remaining?: number | null
          rate_limit_reset_at?: string | null
          status_2xx?: number | null
          status_4xx?: number | null
          status_5xx?: number | null
          successful_requests?: number | null
          top_errors?: Json | null
          total_requests?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_response_time_ms?: number | null
          created_at?: string | null
          failed_requests?: number | null
          id?: string
          integration_slug?: string
          max_response_time_ms?: number | null
          metric_date?: string
          metric_hour?: number | null
          min_response_time_ms?: number | null
          p95_response_time_ms?: number | null
          rate_limit_hits?: number | null
          rate_limit_quota?: number | null
          rate_limit_remaining?: number | null
          rate_limit_reset_at?: string | null
          status_2xx?: number | null
          status_4xx?: number | null
          status_5xx?: number | null
          successful_requests?: number | null
          top_errors?: Json | null
          total_requests?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_api_metrics_integration_slug_fkey"
            columns: ["integration_slug"]
            isOneToOne: false
            referencedRelation: "integration_registry"
            referencedColumns: ["slug"]
          },
        ]
      }
      integration_cron_jobs: {
        Row: {
          avg_duration_ms: number | null
          consecutive_failures: number | null
          created_at: string | null
          created_by: string | null
          cron_schedule: string
          cron_timezone: string | null
          endpoint_path: string
          failed_runs: number | null
          http_method: string | null
          id: string
          integration_slug: string | null
          is_enabled: boolean | null
          job_description: string | null
          job_name: string
          last_run_at: string | null
          last_run_duration_ms: number | null
          last_run_error: string | null
          last_run_status: string | null
          max_consecutive_failures: number | null
          request_body: Json | null
          request_headers: Json | null
          successful_runs: number | null
          timeout_seconds: number | null
          total_runs: number | null
          updated_at: string | null
        }
        Insert: {
          avg_duration_ms?: number | null
          consecutive_failures?: number | null
          created_at?: string | null
          created_by?: string | null
          cron_schedule: string
          cron_timezone?: string | null
          endpoint_path: string
          failed_runs?: number | null
          http_method?: string | null
          id?: string
          integration_slug?: string | null
          is_enabled?: boolean | null
          job_description?: string | null
          job_name: string
          last_run_at?: string | null
          last_run_duration_ms?: number | null
          last_run_error?: string | null
          last_run_status?: string | null
          max_consecutive_failures?: number | null
          request_body?: Json | null
          request_headers?: Json | null
          successful_runs?: number | null
          timeout_seconds?: number | null
          total_runs?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_duration_ms?: number | null
          consecutive_failures?: number | null
          created_at?: string | null
          created_by?: string | null
          cron_schedule?: string
          cron_timezone?: string | null
          endpoint_path?: string
          failed_runs?: number | null
          http_method?: string | null
          id?: string
          integration_slug?: string | null
          is_enabled?: boolean | null
          job_description?: string | null
          job_name?: string
          last_run_at?: string | null
          last_run_duration_ms?: number | null
          last_run_error?: string | null
          last_run_status?: string | null
          max_consecutive_failures?: number | null
          request_body?: Json | null
          request_headers?: Json | null
          successful_runs?: number | null
          timeout_seconds?: number | null
          total_runs?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_cron_jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_cron_jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_cron_jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_cron_jobs_integration_slug_fkey"
            columns: ["integration_slug"]
            isOneToOne: false
            referencedRelation: "integration_registry"
            referencedColumns: ["slug"]
          },
        ]
      }
      integration_oauth_tokens: {
        Row: {
          access_token: string | null
          auth_url: string | null
          client_id: string
          client_secret: string | null
          consecutive_failures: number | null
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          integration_slug: string
          is_active: boolean | null
          last_error: string | null
          last_error_at: string | null
          last_refreshed_at: string | null
          oauth_code_verifier: string | null
          oauth_state: string | null
          rate_limit_cooldown_until: string | null
          rate_limit_hits: Json | null
          redirect_uri: string | null
          refresh_count: number | null
          refresh_token: string | null
          scopes: string[] | null
          token_type: string | null
          token_url: string | null
          updated_at: string | null
        }
        Insert: {
          access_token?: string | null
          auth_url?: string | null
          client_id: string
          client_secret?: string | null
          consecutive_failures?: number | null
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          integration_slug: string
          is_active?: boolean | null
          last_error?: string | null
          last_error_at?: string | null
          last_refreshed_at?: string | null
          oauth_code_verifier?: string | null
          oauth_state?: string | null
          rate_limit_cooldown_until?: string | null
          rate_limit_hits?: Json | null
          redirect_uri?: string | null
          refresh_count?: number | null
          refresh_token?: string | null
          scopes?: string[] | null
          token_type?: string | null
          token_url?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string | null
          auth_url?: string | null
          client_id?: string
          client_secret?: string | null
          consecutive_failures?: number | null
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          integration_slug?: string
          is_active?: boolean | null
          last_error?: string | null
          last_error_at?: string | null
          last_refreshed_at?: string | null
          oauth_code_verifier?: string | null
          oauth_state?: string | null
          rate_limit_cooldown_until?: string | null
          rate_limit_hits?: Json | null
          redirect_uri?: string | null
          refresh_count?: number | null
          refresh_token?: string | null
          scopes?: string[] | null
          token_type?: string | null
          token_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_oauth_tokens_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_oauth_tokens_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_oauth_tokens_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_oauth_tokens_integration_slug_fkey"
            columns: ["integration_slug"]
            isOneToOne: false
            referencedRelation: "integration_registry"
            referencedColumns: ["slug"]
          },
        ]
      }
      integration_registry: {
        Row: {
          avg_response_time_ms: number | null
          base_url: string | null
          consecutive_failures: number
          created_at: string | null
          created_by: string | null
          description: string | null
          documentation_url: string | null
          failed_requests_30d: number | null
          health_check_enabled: boolean | null
          health_check_interval_minutes: number
          health_source: string | null
          health_status: string
          icon_url: string | null
          id: string
          integration_type: string
          is_active: boolean | null
          is_production_ready: boolean | null
          last_alert_sent_at: string | null
          last_health_check_at: string | null
          name: string
          slug: string
          total_requests_30d: number | null
          updated_at: string | null
          updated_by: string | null
          uptime_percentage: number | null
        }
        Insert: {
          avg_response_time_ms?: number | null
          base_url?: string | null
          consecutive_failures?: number
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          documentation_url?: string | null
          failed_requests_30d?: number | null
          health_check_enabled?: boolean | null
          health_check_interval_minutes?: number
          health_source?: string | null
          health_status?: string
          icon_url?: string | null
          id?: string
          integration_type: string
          is_active?: boolean | null
          is_production_ready?: boolean | null
          last_alert_sent_at?: string | null
          last_health_check_at?: string | null
          name: string
          slug: string
          total_requests_30d?: number | null
          updated_at?: string | null
          updated_by?: string | null
          uptime_percentage?: number | null
        }
        Update: {
          avg_response_time_ms?: number | null
          base_url?: string | null
          consecutive_failures?: number
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          documentation_url?: string | null
          failed_requests_30d?: number | null
          health_check_enabled?: boolean | null
          health_check_interval_minutes?: number
          health_source?: string | null
          health_status?: string
          icon_url?: string | null
          id?: string
          integration_type?: string
          is_active?: boolean | null
          is_production_ready?: boolean | null
          last_alert_sent_at?: string | null
          last_health_check_at?: string | null
          name?: string
          slug?: string
          total_requests_30d?: number | null
          updated_at?: string | null
          updated_by?: string | null
          uptime_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_registry_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_registry_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_registry_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_registry_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_registry_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_registry_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_webhook_logs: {
        Row: {
          http_method: string | null
          id: string
          idempotency_key: string | null
          integration_slug: string
          processed_at: string | null
          processing_error: string | null
          processing_status: string
          received_at: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          request_body: Json | null
          request_headers: Json | null
          request_ip: string | null
          response_body: Json | null
          response_status: number | null
          response_time_ms: number | null
          retry_count: number | null
          signature_header_value: string | null
          signature_valid: boolean | null
          webhook_id: string | null
        }
        Insert: {
          http_method?: string | null
          id?: string
          idempotency_key?: string | null
          integration_slug: string
          processed_at?: string | null
          processing_error?: string | null
          processing_status: string
          received_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          request_body?: Json | null
          request_headers?: Json | null
          request_ip?: string | null
          response_body?: Json | null
          response_status?: number | null
          response_time_ms?: number | null
          retry_count?: number | null
          signature_header_value?: string | null
          signature_valid?: boolean | null
          webhook_id?: string | null
        }
        Update: {
          http_method?: string | null
          id?: string
          idempotency_key?: string | null
          integration_slug?: string
          processed_at?: string | null
          processing_error?: string | null
          processing_status?: string
          received_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          request_body?: Json | null
          request_headers?: Json | null
          request_ip?: string | null
          response_body?: Json | null
          response_status?: number | null
          response_time_ms?: number | null
          retry_count?: number | null
          signature_header_value?: string | null
          signature_valid?: boolean | null
          webhook_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_webhook_logs_integration_slug_fkey"
            columns: ["integration_slug"]
            isOneToOne: false
            referencedRelation: "integration_registry"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "integration_webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "integration_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_webhooks: {
        Row: {
          created_at: string | null
          created_by: string | null
          expected_content_type: string | null
          http_method: string | null
          id: string
          integration_slug: string
          is_enabled: boolean | null
          last_received_at: string | null
          max_retries: number | null
          retry_enabled: boolean | null
          signature_algorithm: string | null
          signature_header: string | null
          success_rate: number | null
          timeout_seconds: number | null
          total_failed: number | null
          total_received: number | null
          updated_at: string | null
          webhook_name: string
          webhook_secret: string | null
          webhook_url: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          expected_content_type?: string | null
          http_method?: string | null
          id?: string
          integration_slug: string
          is_enabled?: boolean | null
          last_received_at?: string | null
          max_retries?: number | null
          retry_enabled?: boolean | null
          signature_algorithm?: string | null
          signature_header?: string | null
          success_rate?: number | null
          timeout_seconds?: number | null
          total_failed?: number | null
          total_received?: number | null
          updated_at?: string | null
          webhook_name: string
          webhook_secret?: string | null
          webhook_url: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          expected_content_type?: string | null
          http_method?: string | null
          id?: string
          integration_slug?: string
          is_enabled?: boolean | null
          last_received_at?: string | null
          max_retries?: number | null
          retry_enabled?: boolean | null
          signature_algorithm?: string | null
          signature_header?: string | null
          success_rate?: number | null
          timeout_seconds?: number | null
          total_failed?: number | null
          total_received?: number | null
          updated_at?: string | null
          webhook_name?: string
          webhook_secret?: string | null
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_webhooks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_webhooks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_webhooks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_webhooks_integration_slug_fkey"
            columns: ["integration_slug"]
            isOneToOne: false
            referencedRelation: "integration_registry"
            referencedColumns: ["slug"]
          },
        ]
      }
      interstellio_subscriber_cache: {
        Row: {
          created_at: string
          domain: string | null
          enabled: boolean
          expire: string | null
          id: string
          last_seen: string | null
          name: string | null
          profile: string | null
          raw_json: Json | null
          service: string | null
          static_ip4: string | null
          synced_at: string
          tenant_id: string | null
          uncapped_data: boolean | null
          updated_at: string
          username: string | null
          virtual: string | null
        }
        Insert: {
          created_at?: string
          domain?: string | null
          enabled?: boolean
          expire?: string | null
          id: string
          last_seen?: string | null
          name?: string | null
          profile?: string | null
          raw_json?: Json | null
          service?: string | null
          static_ip4?: string | null
          synced_at?: string
          tenant_id?: string | null
          uncapped_data?: boolean | null
          updated_at?: string
          username?: string | null
          virtual?: string | null
        }
        Update: {
          created_at?: string
          domain?: string | null
          enabled?: boolean
          expire?: string | null
          id?: string
          last_seen?: string | null
          name?: string | null
          profile?: string | null
          raw_json?: Json | null
          service?: string | null
          static_ip4?: string | null
          synced_at?: string
          tenant_id?: string | null
          uncapped_data?: boolean | null
          updated_at?: string
          username?: string | null
          virtual?: string | null
        }
        Relationships: []
      }
      invoice_audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          invoice_id: string
          ip_address: unknown
          new_data: Json | null
          new_status: string | null
          performed_by: string | null
          performed_by_email: string | null
          performed_by_role: string | null
          previous_data: Json | null
          previous_status: string | null
          reason: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          invoice_id: string
          ip_address?: unknown
          new_data?: Json | null
          new_status?: string | null
          performed_by?: string | null
          performed_by_email?: string | null
          performed_by_role?: string | null
          previous_data?: Json | null
          previous_status?: string | null
          reason?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          invoice_id?: string
          ip_address?: unknown
          new_data?: Json | null
          new_status?: string | null
          performed_by?: string | null
          performed_by_email?: string | null
          performed_by_role?: string | null
          previous_data?: Json | null
          previous_status?: string | null
          reason?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_audit_log_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_collection_activity: {
        Row: {
          call_count: number | null
          collection_status: string | null
          created_at: string | null
          customer_responded: boolean | null
          days_to_payment: number | null
          email_count: number | null
          escalated_at: string | null
          escalation_level: number | null
          first_contact_date: string | null
          id: string
          invoice_id: string
          last_contact_date: string | null
          next_scheduled_contact: string | null
          promised_amount: number | null
          promised_payment_date: string | null
          response_date: string | null
          response_notes: string | null
          sms_count: number | null
          total_contact_attempts: number | null
          updated_at: string | null
        }
        Insert: {
          call_count?: number | null
          collection_status?: string | null
          created_at?: string | null
          customer_responded?: boolean | null
          days_to_payment?: number | null
          email_count?: number | null
          escalated_at?: string | null
          escalation_level?: number | null
          first_contact_date?: string | null
          id?: string
          invoice_id: string
          last_contact_date?: string | null
          next_scheduled_contact?: string | null
          promised_amount?: number | null
          promised_payment_date?: string | null
          response_date?: string | null
          response_notes?: string | null
          sms_count?: number | null
          total_contact_attempts?: number | null
          updated_at?: string | null
        }
        Update: {
          call_count?: number | null
          collection_status?: string | null
          created_at?: string | null
          customer_responded?: boolean | null
          days_to_payment?: number | null
          email_count?: number | null
          escalated_at?: string | null
          escalation_level?: number | null
          first_contact_date?: string | null
          id?: string
          invoice_id?: string
          last_contact_date?: string | null
          next_scheduled_contact?: string | null
          promised_amount?: number | null
          promised_payment_date?: string | null
          response_date?: string | null
          response_notes?: string | null
          sms_count?: number | null
          total_contact_attempts?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_collection_activity_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: true
            referencedRelation: "customer_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_notification_log: {
        Row: {
          amount_due: number
          clicked_at: string | null
          created_at: string | null
          customer_id: string | null
          days_overdue: number
          delivered_at: string | null
          error_message: string | null
          id: string
          invoice_id: string
          invoice_number: string
          message_content: string | null
          metadata: Json | null
          notification_template: string | null
          notification_type: string
          opened_at: string | null
          provider: string | null
          provider_message_id: string | null
          recipient: string
          retry_count: number | null
          sent_at: string | null
          status: string
        }
        Insert: {
          amount_due: number
          clicked_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          days_overdue: number
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          invoice_id: string
          invoice_number: string
          message_content?: string | null
          metadata?: Json | null
          notification_template?: string | null
          notification_type: string
          opened_at?: string | null
          provider?: string | null
          provider_message_id?: string | null
          recipient: string
          retry_count?: number | null
          sent_at?: string | null
          status?: string
        }
        Update: {
          amount_due?: number
          clicked_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          days_overdue?: number
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          invoice_id?: string
          invoice_number?: string
          message_content?: string | null
          metadata?: Json | null
          notification_template?: string | null
          notification_type?: string
          opened_at?: string | null
          provider?: string | null
          provider_message_id?: string | null
          recipient?: string
          retry_count?: number | null
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_notification_log_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_dashboard_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "invoice_notification_log_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_notification_log_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_notification_engagement"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "invoice_notification_log_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_due: number
          amount_paid: number | null
          contract_id: string
          created_at: string | null
          customer_id: string | null
          due_date: string | null
          id: string
          invoice_number: string
          invoice_type: string
          paid_at: string | null
          sent_at: string | null
          status: string
          subtotal: number
          total: number
          updated_at: string | null
          vat_amount: number
          vat_rate: number | null
        }
        Insert: {
          amount_due: number
          amount_paid?: number | null
          contract_id: string
          created_at?: string | null
          customer_id?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          invoice_type: string
          paid_at?: string | null
          sent_at?: string | null
          status?: string
          subtotal: number
          total: number
          updated_at?: string | null
          vat_amount: number
          vat_rate?: number | null
        }
        Update: {
          amount_due?: number
          amount_paid?: number | null
          contract_id?: string
          created_at?: string | null
          customer_id?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          invoice_type?: string
          paid_at?: string | null
          sent_at?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string | null
          vat_amount?: number
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_dashboard_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_notification_engagement"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      kyb_subjects: {
        Row: {
          created_at: string | null
          didit_session_id: string | null
          email: string | null
          full_name: string
          id: string
          id_number: string | null
          kyc_status: string | null
          ownership_percentage: number | null
          phone: string | null
          quote_id: string | null
          risk_tier: string | null
          role: string | null
          subject_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          didit_session_id?: string | null
          email?: string | null
          full_name: string
          id?: string
          id_number?: string | null
          kyc_status?: string | null
          ownership_percentage?: number | null
          phone?: string | null
          quote_id?: string | null
          risk_tier?: string | null
          role?: string | null
          subject_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          didit_session_id?: string | null
          email?: string | null
          full_name?: string
          id?: string
          id_number?: string | null
          kyc_status?: string | null
          ownership_percentage?: number | null
          phone?: string | null
          quote_id?: string | null
          risk_tier?: string | null
          role?: string | null
          subject_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kyb_subjects_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "business_quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kyb_subjects_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quote_analytics"
            referencedColumns: ["quote_id"]
          },
        ]
      }
      kyc_document_ocr_results: {
        Row: {
          blocks: Json | null
          confidence: Json | null
          created_at: string
          error_message: string | null
          id: string
          kyc_document_id: string
          markdown: string | null
          model: string | null
          pages: Json | null
          processed_at: string | null
          status: string
          updated_at: string
          usage_info: Json | null
        }
        Insert: {
          blocks?: Json | null
          confidence?: Json | null
          created_at?: string
          error_message?: string | null
          id?: string
          kyc_document_id: string
          markdown?: string | null
          model?: string | null
          pages?: Json | null
          processed_at?: string | null
          status?: string
          updated_at?: string
          usage_info?: Json | null
        }
        Update: {
          blocks?: Json | null
          confidence?: Json | null
          created_at?: string
          error_message?: string | null
          id?: string
          kyc_document_id?: string
          markdown?: string | null
          model?: string | null
          pages?: Json | null
          processed_at?: string | null
          status?: string
          updated_at?: string
          usage_info?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "kyc_document_ocr_results_kyc_document_id_fkey"
            columns: ["kyc_document_id"]
            isOneToOne: true
            referencedRelation: "kyc_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_documents: {
        Row: {
          access_log: Json | null
          business_quote_id: string | null
          company_name: string | null
          consumer_order_id: string | null
          created_at: string | null
          customer_email: string
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          customer_type: Database["public"]["Enums"]["customer_type"]
          document_number: string | null
          document_title: string
          document_type: Database["public"]["Enums"]["kyc_document_type"]
          encrypted: boolean | null
          expiry_date: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          is_sensitive: boolean | null
          issue_date: string | null
          metadata: Json | null
          onboarding_submission_id: string | null
          rejection_reason: string | null
          updated_at: string | null
          uploaded_at: string | null
          verification_notes: string | null
          verification_status: Database["public"]["Enums"]["kyc_verification_status"]
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          access_log?: Json | null
          business_quote_id?: string | null
          company_name?: string | null
          consumer_order_id?: string | null
          created_at?: string | null
          customer_email: string
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          customer_type: Database["public"]["Enums"]["customer_type"]
          document_number?: string | null
          document_title: string
          document_type: Database["public"]["Enums"]["kyc_document_type"]
          encrypted?: boolean | null
          expiry_date?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          is_sensitive?: boolean | null
          issue_date?: string | null
          metadata?: Json | null
          onboarding_submission_id?: string | null
          rejection_reason?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          verification_notes?: string | null
          verification_status?: Database["public"]["Enums"]["kyc_verification_status"]
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          access_log?: Json | null
          business_quote_id?: string | null
          company_name?: string | null
          consumer_order_id?: string | null
          created_at?: string | null
          customer_email?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          customer_type?: Database["public"]["Enums"]["customer_type"]
          document_number?: string | null
          document_title?: string
          document_type?: Database["public"]["Enums"]["kyc_document_type"]
          encrypted?: boolean | null
          expiry_date?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          is_sensitive?: boolean | null
          issue_date?: string | null
          metadata?: Json | null
          onboarding_submission_id?: string | null
          rejection_reason?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          verification_notes?: string | null
          verification_status?: Database["public"]["Enums"]["kyc_verification_status"]
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kyc_documents_consumer_order_id_fkey"
            columns: ["consumer_order_id"]
            isOneToOne: false
            referencedRelation: "consumer_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kyc_documents_consumer_order_id_fkey"
            columns: ["consumer_order_id"]
            isOneToOne: false
            referencedRelation: "v_order_compliance_summary"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "kyc_documents_consumer_order_id_fkey"
            columns: ["consumer_order_id"]
            isOneToOne: false
            referencedRelation: "v_order_notifications"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "kyc_documents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_dashboard_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "kyc_documents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kyc_documents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_notification_engagement"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "kyc_documents_onboarding_submission_id_fkey"
            columns: ["onboarding_submission_id"]
            isOneToOne: false
            referencedRelation: "onboarding_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_sessions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          customer_id: string | null
          didit_session_id: string
          extracted_data: Json | null
          flow_type: string | null
          id: string
          quote_id: string | null
          raw_webhook_payload: Json | null
          risk_tier: string | null
          status: string | null
          user_type: string | null
          verification_result: string | null
          verification_url: string | null
          webhook_received_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          didit_session_id: string
          extracted_data?: Json | null
          flow_type?: string | null
          id?: string
          quote_id?: string | null
          raw_webhook_payload?: Json | null
          risk_tier?: string | null
          status?: string | null
          user_type?: string | null
          verification_result?: string | null
          verification_url?: string | null
          webhook_received_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          didit_session_id?: string
          extracted_data?: Json | null
          flow_type?: string | null
          id?: string
          quote_id?: string | null
          raw_webhook_payload?: Json | null
          risk_tier?: string | null
          status?: string | null
          user_type?: string | null
          verification_result?: string | null
          verification_url?: string | null
          webhook_received_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kyc_sessions_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "business_quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kyc_sessions_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quote_analytics"
            referencedColumns: ["quote_id"]
          },
        ]
      }
      labor_tracking: {
        Row: {
          created_at: string | null
          description: string | null
          employee_id: string
          hourly_rate_zar: number
          hours_worked: number
          id: string
          project_id: string
          total_cost_zar: number | null
          work_date: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          employee_id: string
          hourly_rate_zar: number
          hours_worked: number
          id?: string
          project_id: string
          total_cost_zar?: number | null
          work_date: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          employee_id?: string
          hourly_rate_zar?: number
          hours_worked?: number
          id?: string
          project_id?: string
          total_cost_zar?: number | null
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "labor_tracking_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "labor_tracking_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "installation_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_scores: {
        Row: {
          competitive_vuln_score: number | null
          competitor_identified: string | null
          composite_score: number | null
          conversion_speed_score: number | null
          coverage_lead_id: string | null
          coverage_product_eligible: string[] | null
          created_at: string | null
          dfa_coverage_type: string | null
          estimated_mrr: number | null
          id: string
          nearest_base_station_km: number | null
          nearest_dfa_building_km: number | null
          product_fit_score: number | null
          recommended_product: string | null
          recommended_track: string | null
          revenue_potential_score: number | null
          scored_by: string | null
          scoring_date: string | null
          skyfibre_confidence: string | null
          updated_at: string | null
          zone_id: string | null
        }
        Insert: {
          competitive_vuln_score?: number | null
          competitor_identified?: string | null
          composite_score?: number | null
          conversion_speed_score?: number | null
          coverage_lead_id?: string | null
          coverage_product_eligible?: string[] | null
          created_at?: string | null
          dfa_coverage_type?: string | null
          estimated_mrr?: number | null
          id?: string
          nearest_base_station_km?: number | null
          nearest_dfa_building_km?: number | null
          product_fit_score?: number | null
          recommended_product?: string | null
          recommended_track?: string | null
          revenue_potential_score?: number | null
          scored_by?: string | null
          scoring_date?: string | null
          skyfibre_confidence?: string | null
          updated_at?: string | null
          zone_id?: string | null
        }
        Update: {
          competitive_vuln_score?: number | null
          competitor_identified?: string | null
          composite_score?: number | null
          conversion_speed_score?: number | null
          coverage_lead_id?: string | null
          coverage_product_eligible?: string[] | null
          created_at?: string | null
          dfa_coverage_type?: string | null
          estimated_mrr?: number | null
          id?: string
          nearest_base_station_km?: number | null
          nearest_dfa_building_km?: number | null
          product_fit_score?: number | null
          recommended_product?: string | null
          recommended_track?: string | null
          revenue_potential_score?: number | null
          scored_by?: string | null
          scoring_date?: string | null
          skyfibre_confidence?: string | null
          updated_at?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_scores_coverage_lead_id_fkey"
            columns: ["coverage_lead_id"]
            isOneToOne: false
            referencedRelation: "coverage_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_scores_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "sales_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address: string
          coordinates: Json | null
          created_at: string | null
          email: string
          id: string
          metadata: Json | null
          phone: string | null
          requested_service: string | null
          source: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          address: string
          coordinates?: Json | null
          created_at?: string | null
          email: string
          id?: string
          metadata?: Json | null
          phone?: string | null
          requested_service?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string
          coordinates?: Json | null
          created_at?: string | null
          email?: string
          id?: string
          metadata?: Json | null
          phone?: string | null
          requested_service?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      market_indicators: {
        Row: {
          access_type: string | null
          category: string
          geography: string | null
          id: string
          imported_at: string | null
          indicator: string
          notes: string | null
          period: string | null
          provider: string | null
          source: string | null
          source_url: string | null
          subcategory: string
          unit: string | null
          value: string | null
        }
        Insert: {
          access_type?: string | null
          category: string
          geography?: string | null
          id: string
          imported_at?: string | null
          indicator: string
          notes?: string | null
          period?: string | null
          provider?: string | null
          source?: string | null
          source_url?: string | null
          subcategory: string
          unit?: string | null
          value?: string | null
        }
        Update: {
          access_type?: string | null
          category?: string
          geography?: string | null
          id?: string
          imported_at?: string | null
          indicator?: string
          notes?: string | null
          period?: string | null
          provider?: string | null
          source?: string | null
          source_url?: string | null
          subcategory?: string
          unit?: string | null
          value?: string | null
        }
        Relationships: []
      }
      marketing_announcements: {
        Row: {
          bg_color: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          link_text: string | null
          link_url: string | null
          message: string
          priority: number | null
          text_color: string | null
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          bg_color?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          link_text?: string | null
          link_url?: string | null
          message: string
          priority?: number | null
          text_color?: string | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          bg_color?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          link_text?: string | null
          link_url?: string | null
          message?: string
          priority?: number | null
          text_color?: string | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_assets: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          download_count: number
          duration: number | null
          file_name: string
          file_size: number | null
          file_url: string
          height: number | null
          id: string
          is_active: boolean
          last_downloaded_at: string | null
          metadata: Json | null
          mime_type: string | null
          requires_approval: boolean | null
          subcategory: string | null
          tags: string[] | null
          title: string
          updated_at: string
          variations: Json | null
          visibility: string
          width: number | null
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          download_count?: number
          duration?: number | null
          file_name: string
          file_size?: number | null
          file_url: string
          height?: number | null
          id?: string
          is_active?: boolean
          last_downloaded_at?: string | null
          metadata?: Json | null
          mime_type?: string | null
          requires_approval?: boolean | null
          subcategory?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          variations?: Json | null
          visibility?: string
          width?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          download_count?: number
          duration?: number | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          height?: number | null
          id?: string
          is_active?: boolean
          last_downloaded_at?: string | null
          metadata?: Json | null
          mime_type?: string | null
          requires_approval?: boolean | null
          subcategory?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          variations?: Json | null
          visibility?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_assets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_assets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_assets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_email_preferences: {
        Row: {
          created_at: string | null
          customer_id: string | null
          email: string
          id: string
          newsletter_emails: boolean | null
          partner_offers: boolean | null
          product_updates: boolean | null
          promotional_emails: boolean | null
          unsubscribe_reason: string | null
          unsubscribe_token: string | null
          unsubscribed_all: boolean | null
          unsubscribed_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          email: string
          id?: string
          newsletter_emails?: boolean | null
          partner_offers?: boolean | null
          product_updates?: boolean | null
          promotional_emails?: boolean | null
          unsubscribe_reason?: string | null
          unsubscribe_token?: string | null
          unsubscribed_all?: boolean | null
          unsubscribed_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          email?: string
          id?: string
          newsletter_emails?: boolean | null
          partner_offers?: boolean | null
          product_updates?: boolean | null
          promotional_emails?: boolean | null
          unsubscribe_reason?: string | null
          unsubscribe_token?: string | null
          unsubscribed_all?: boolean | null
          unsubscribed_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_email_preferences_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_dashboard_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "marketing_email_preferences_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_email_preferences_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_notification_engagement"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      media_library: {
        Row: {
          alt_text: string | null
          created_at: string | null
          file_type: string | null
          filename: string
          height: number | null
          id: string
          public_url: string
          size_bytes: number | null
          storage_path: string
          tags: string[] | null
          uploaded_by: string | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          file_type?: string | null
          filename: string
          height?: number | null
          id?: string
          public_url: string
          size_bytes?: number | null
          storage_path: string
          tags?: string[] | null
          uploaded_by?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          file_type?: string | null
          filename?: string
          height?: number | null
          id?: string
          public_url?: string
          size_bytes?: number | null
          storage_path?: string
          tags?: string[] | null
          uploaded_by?: string | null
          width?: number | null
        }
        Relationships: []
      }
      mikrotik_audit_log: {
        Row: {
          action: string
          action_detail: Json | null
          admin_user_id: string | null
          created_at: string
          error_message: string | null
          id: string
          ip_address: unknown
          router_id: string | null
          status: string | null
        }
        Insert: {
          action: string
          action_detail?: Json | null
          admin_user_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: unknown
          router_id?: string | null
          status?: string | null
        }
        Update: {
          action?: string
          action_detail?: Json | null
          admin_user_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: unknown
          router_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mikrotik_audit_log_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mikrotik_audit_log_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mikrotik_audit_log_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mikrotik_audit_log_router_id_fkey"
            columns: ["router_id"]
            isOneToOne: false
            referencedRelation: "mikrotik_routers"
            referencedColumns: ["id"]
          },
        ]
      }
      mikrotik_routers: {
        Row: {
          clinic_audit_id: string | null
          clinic_name: string | null
          config_backup_at: string | null
          config_backup_url: string | null
          cpu_usage: number | null
          created_at: string
          created_by: string | null
          firmware_version: string | null
          id: string
          identity: string
          last_seen_at: string | null
          mac_address: string
          management_ip: unknown
          memory_usage: number | null
          model: string | null
          notes: string | null
          pppoe_password_auth_tag: string
          pppoe_password_encrypted: string
          pppoe_password_iv: string
          pppoe_username: string
          province: string | null
          router_password_auth_tag: string
          router_password_encrypted: string
          router_password_iv: string
          router_username: string | null
          serial_number: string | null
          status: string | null
          synced_at: string | null
          updated_at: string
          updated_by: string | null
          uptime_seconds: number | null
          wifi_password_staff_auth_tag: string | null
          wifi_password_staff_encrypted: string | null
          wifi_password_staff_iv: string | null
          wifi_ssid_hotspot: string | null
          wifi_ssid_staff: string | null
        }
        Insert: {
          clinic_audit_id?: string | null
          clinic_name?: string | null
          config_backup_at?: string | null
          config_backup_url?: string | null
          cpu_usage?: number | null
          created_at?: string
          created_by?: string | null
          firmware_version?: string | null
          id?: string
          identity: string
          last_seen_at?: string | null
          mac_address: string
          management_ip: unknown
          memory_usage?: number | null
          model?: string | null
          notes?: string | null
          pppoe_password_auth_tag: string
          pppoe_password_encrypted: string
          pppoe_password_iv: string
          pppoe_username: string
          province?: string | null
          router_password_auth_tag: string
          router_password_encrypted: string
          router_password_iv: string
          router_username?: string | null
          serial_number?: string | null
          status?: string | null
          synced_at?: string | null
          updated_at?: string
          updated_by?: string | null
          uptime_seconds?: number | null
          wifi_password_staff_auth_tag?: string | null
          wifi_password_staff_encrypted?: string | null
          wifi_password_staff_iv?: string | null
          wifi_ssid_hotspot?: string | null
          wifi_ssid_staff?: string | null
        }
        Update: {
          clinic_audit_id?: string | null
          clinic_name?: string | null
          config_backup_at?: string | null
          config_backup_url?: string | null
          cpu_usage?: number | null
          created_at?: string
          created_by?: string | null
          firmware_version?: string | null
          id?: string
          identity?: string
          last_seen_at?: string | null
          mac_address?: string
          management_ip?: unknown
          memory_usage?: number | null
          model?: string | null
          notes?: string | null
          pppoe_password_auth_tag?: string
          pppoe_password_encrypted?: string
          pppoe_password_iv?: string
          pppoe_username?: string
          province?: string | null
          router_password_auth_tag?: string
          router_password_encrypted?: string
          router_password_iv?: string
          router_username?: string | null
          serial_number?: string | null
          status?: string | null
          synced_at?: string | null
          updated_at?: string
          updated_by?: string | null
          uptime_seconds?: number | null
          wifi_password_staff_auth_tag?: string | null
          wifi_password_staff_encrypted?: string | null
          wifi_password_staff_iv?: string | null
          wifi_ssid_hotspot?: string | null
          wifi_ssid_staff?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mikrotik_routers_clinic_audit_id_fkey"
            columns: ["clinic_audit_id"]
            isOneToOne: false
            referencedRelation: "unjani_contract_audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mikrotik_routers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mikrotik_routers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mikrotik_routers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mikrotik_routers_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mikrotik_routers_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mikrotik_routers_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      mikrotik_sync_logs: {
        Row: {
          admin_user_id: string | null
          completed_at: string | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          id: string
          routers_checked: number | null
          routers_failed: number | null
          routers_offline: number | null
          routers_online: number | null
          started_at: string
          triggered_by: string | null
        }
        Insert: {
          admin_user_id?: string | null
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          routers_checked?: number | null
          routers_failed?: number | null
          routers_offline?: number | null
          routers_online?: number | null
          started_at?: string
          triggered_by?: string | null
        }
        Update: {
          admin_user_id?: string | null
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          routers_checked?: number | null
          routers_failed?: number | null
          routers_offline?: number | null
          routers_online?: number | null
          started_at?: string
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mikrotik_sync_logs_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mikrotik_sync_logs_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mikrotik_sync_logs_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      msc_tracking: {
        Row: {
          actual_rns: number | null
          actual_spend: number | null
          created_at: string | null
          id: string
          msc_amount: number
          period_end: string
          period_label: string
          period_start: string
          required_rns: number
          status: string | null
          updated_at: string | null
        }
        Insert: {
          actual_rns?: number | null
          actual_spend?: number | null
          created_at?: string | null
          id?: string
          msc_amount: number
          period_end: string
          period_label: string
          period_start: string
          required_rns: number
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_rns?: number | null
          actual_spend?: number | null
          created_at?: string | null
          id?: string
          msc_amount?: number
          period_end?: string
          period_label?: string
          period_start?: string
          required_rns?: number
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      mtn_business_deals: {
        Row: {
          active: boolean | null
          anytime_minute_bundle: string | null
          available_helios: boolean | null
          available_ilula: boolean | null
          bundle_description: string | null
          channel_visibility: string | null
          contract_term: number
          created_at: string | null
          data_bundle: string | null
          deal_id: string
          deal_name: string
          device_category: string | null
          device_name: string | null
          device_payment_incl_vat: number | null
          device_range_applicability: string | null
          device_status: string | null
          free_cli: boolean | null
          free_itb: boolean | null
          free_sim: boolean | null
          freebie_devices: string | null
          freebie_priceplan: string | null
          id: string
          inclusive_data: string | null
          inclusive_ingroup_calling: string | null
          inclusive_minutes: string | null
          inclusive_onnet_minutes: string | null
          inclusive_sms: string | null
          inventory_status_freebie: string | null
          inventory_status_main: string | null
          is_visible_on_frontend: boolean
          metadata: Json | null
          monthly_price_ex_vat: number
          monthly_price_incl_vat: number
          onnet_minute_bundle: string | null
          package_code: string | null
          package_description: string | null
          price_plan: string
          promo_end_date: string | null
          promo_start_date: string | null
          service_package_id: string | null
          sms_bundle: string | null
          tariff_code: string | null
          tariff_description: string | null
          total_data: string | null
          total_minutes: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          anytime_minute_bundle?: string | null
          available_helios?: boolean | null
          available_ilula?: boolean | null
          bundle_description?: string | null
          channel_visibility?: string | null
          contract_term: number
          created_at?: string | null
          data_bundle?: string | null
          deal_id: string
          deal_name: string
          device_category?: string | null
          device_name?: string | null
          device_payment_incl_vat?: number | null
          device_range_applicability?: string | null
          device_status?: string | null
          free_cli?: boolean | null
          free_itb?: boolean | null
          free_sim?: boolean | null
          freebie_devices?: string | null
          freebie_priceplan?: string | null
          id?: string
          inclusive_data?: string | null
          inclusive_ingroup_calling?: string | null
          inclusive_minutes?: string | null
          inclusive_onnet_minutes?: string | null
          inclusive_sms?: string | null
          inventory_status_freebie?: string | null
          inventory_status_main?: string | null
          is_visible_on_frontend?: boolean
          metadata?: Json | null
          monthly_price_ex_vat: number
          monthly_price_incl_vat: number
          onnet_minute_bundle?: string | null
          package_code?: string | null
          package_description?: string | null
          price_plan: string
          promo_end_date?: string | null
          promo_start_date?: string | null
          service_package_id?: string | null
          sms_bundle?: string | null
          tariff_code?: string | null
          tariff_description?: string | null
          total_data?: string | null
          total_minutes?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          anytime_minute_bundle?: string | null
          available_helios?: boolean | null
          available_ilula?: boolean | null
          bundle_description?: string | null
          channel_visibility?: string | null
          contract_term?: number
          created_at?: string | null
          data_bundle?: string | null
          deal_id?: string
          deal_name?: string
          device_category?: string | null
          device_name?: string | null
          device_payment_incl_vat?: number | null
          device_range_applicability?: string | null
          device_status?: string | null
          free_cli?: boolean | null
          free_itb?: boolean | null
          free_sim?: boolean | null
          freebie_devices?: string | null
          freebie_priceplan?: string | null
          id?: string
          inclusive_data?: string | null
          inclusive_ingroup_calling?: string | null
          inclusive_minutes?: string | null
          inclusive_onnet_minutes?: string | null
          inclusive_sms?: string | null
          inventory_status_freebie?: string | null
          inventory_status_main?: string | null
          is_visible_on_frontend?: boolean
          metadata?: Json | null
          monthly_price_ex_vat?: number
          monthly_price_incl_vat?: number
          onnet_minute_bundle?: string | null
          package_code?: string | null
          package_description?: string | null
          price_plan?: string
          promo_end_date?: string | null
          promo_start_date?: string | null
          service_package_id?: string | null
          sms_bundle?: string | null
          tariff_code?: string | null
          tariff_description?: string | null
          total_data?: string | null
          total_minutes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mtn_business_deals_service_package_id_fkey"
            columns: ["service_package_id"]
            isOneToOne: false
            referencedRelation: "service_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mtn_business_deals_service_package_id_fkey"
            columns: ["service_package_id"]
            isOneToOne: false
            referencedRelation: "sme_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mtn_business_deals_service_package_id_fkey"
            columns: ["service_package_id"]
            isOneToOne: false
            referencedRelation: "v_active_service_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mtn_business_deals_service_package_id_fkey"
            columns: ["service_package_id"]
            isOneToOne: false
            referencedRelation: "v_products_with_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      mtn_dealer_import_batches: {
        Row: {
          batch_id: string
          completed_at: string | null
          error_records: number | null
          errors: Json | null
          id: string
          import_date: string | null
          imported_by: string | null
          imported_records: number | null
          skipped_records: number | null
          source_file: string
          status: string | null
          total_records: number | null
        }
        Insert: {
          batch_id: string
          completed_at?: string | null
          error_records?: number | null
          errors?: Json | null
          id?: string
          import_date?: string | null
          imported_by?: string | null
          imported_records?: number | null
          skipped_records?: number | null
          source_file: string
          status?: string | null
          total_records?: number | null
        }
        Update: {
          batch_id?: string
          completed_at?: string | null
          error_records?: number | null
          errors?: Json | null
          id?: string
          import_date?: string | null
          imported_by?: string | null
          imported_records?: number | null
          skipped_records?: number | null
          source_file?: string
          status?: string | null
          total_records?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mtn_dealer_import_batches_imported_by_fkey"
            columns: ["imported_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mtn_dealer_import_batches_imported_by_fkey"
            columns: ["imported_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mtn_dealer_import_batches_imported_by_fkey"
            columns: ["imported_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      mtn_dealer_product_audit_log: {
        Row: {
          action: string
          changes: Json | null
          deal_id: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          performed_at: string | null
          performed_by: string | null
          product_id: string | null
          reason: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          deal_id?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          performed_at?: string | null
          performed_by?: string | null
          product_id?: string | null
          reason?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          deal_id?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          performed_at?: string | null
          performed_by?: string | null
          product_id?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mtn_dealer_product_audit_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mtn_dealer_product_audit_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mtn_dealer_product_audit_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mtn_dealer_product_audit_log_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "mtn_dealer_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mtn_dealer_product_audit_log_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_mtn_curated_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mtn_dealer_product_audit_log_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_mtn_dealer_commission_calculator"
            referencedColumns: ["id"]
          },
        ]
      }
      mtn_dealer_products: {
        Row: {
          anytime_minutes: string | null
          anytime_minutes_value: number | null
          auto_curated: boolean
          available_on_helios: boolean | null
          available_on_ilula: boolean | null
          business_use_case: string | null
          channel: string | null
          circletel_commission_share: number | null
          commission_tier: string | null
          contract_term: number
          contract_term_label: string | null
          created_at: string | null
          created_by: string | null
          curation_status: string
          data_bundle: string | null
          data_bundle_gb: number | null
          deal_id: string
          device_name: string | null
          device_status: string | null
          eppix_package: string | null
          eppix_tariff: string | null
          free_cli: boolean | null
          free_itb: boolean | null
          free_sim: boolean | null
          freebie_inventory_status: string | null
          freebies_device: string | null
          freebies_priceplan: string | null
          has_device: boolean
          id: string
          import_batch_id: string | null
          inclusive_data: string | null
          inclusive_in_group_calling: string | null
          inclusive_minutes: string | null
          inclusive_on_net_minutes: string | null
          inclusive_sms: string | null
          inventory_status: string | null
          is_visible_on_frontend: boolean
          markup_type: string | null
          markup_value: number | null
          metadata: Json | null
          mtn_commission_rate: number | null
          mtn_price_excl_vat: number
          mtn_price_incl_vat: number
          on_net_minutes: string | null
          on_net_minutes_value: number | null
          once_off_pay_in_incl_vat: number | null
          package_description: string | null
          price_plan: string
          promo_end_date: string | null
          promo_start_date: string | null
          selling_price_excl_vat: number | null
          selling_price_incl_vat: number | null
          sms_bundle: string | null
          sms_bundle_value: number | null
          source_file: string | null
          status: string
          tariff_description: string | null
          technology: string
          total_data: string | null
          total_minutes: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          anytime_minutes?: string | null
          anytime_minutes_value?: number | null
          auto_curated?: boolean
          available_on_helios?: boolean | null
          available_on_ilula?: boolean | null
          business_use_case?: string | null
          channel?: string | null
          circletel_commission_share?: number | null
          commission_tier?: string | null
          contract_term: number
          contract_term_label?: string | null
          created_at?: string | null
          created_by?: string | null
          curation_status?: string
          data_bundle?: string | null
          data_bundle_gb?: number | null
          deal_id: string
          device_name?: string | null
          device_status?: string | null
          eppix_package?: string | null
          eppix_tariff?: string | null
          free_cli?: boolean | null
          free_itb?: boolean | null
          free_sim?: boolean | null
          freebie_inventory_status?: string | null
          freebies_device?: string | null
          freebies_priceplan?: string | null
          has_device?: boolean
          id?: string
          import_batch_id?: string | null
          inclusive_data?: string | null
          inclusive_in_group_calling?: string | null
          inclusive_minutes?: string | null
          inclusive_on_net_minutes?: string | null
          inclusive_sms?: string | null
          inventory_status?: string | null
          is_visible_on_frontend?: boolean
          markup_type?: string | null
          markup_value?: number | null
          metadata?: Json | null
          mtn_commission_rate?: number | null
          mtn_price_excl_vat: number
          mtn_price_incl_vat: number
          on_net_minutes?: string | null
          on_net_minutes_value?: number | null
          once_off_pay_in_incl_vat?: number | null
          package_description?: string | null
          price_plan: string
          promo_end_date?: string | null
          promo_start_date?: string | null
          selling_price_excl_vat?: number | null
          selling_price_incl_vat?: number | null
          sms_bundle?: string | null
          sms_bundle_value?: number | null
          source_file?: string | null
          status?: string
          tariff_description?: string | null
          technology: string
          total_data?: string | null
          total_minutes?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          anytime_minutes?: string | null
          anytime_minutes_value?: number | null
          auto_curated?: boolean
          available_on_helios?: boolean | null
          available_on_ilula?: boolean | null
          business_use_case?: string | null
          channel?: string | null
          circletel_commission_share?: number | null
          commission_tier?: string | null
          contract_term?: number
          contract_term_label?: string | null
          created_at?: string | null
          created_by?: string | null
          curation_status?: string
          data_bundle?: string | null
          data_bundle_gb?: number | null
          deal_id?: string
          device_name?: string | null
          device_status?: string | null
          eppix_package?: string | null
          eppix_tariff?: string | null
          free_cli?: boolean | null
          free_itb?: boolean | null
          free_sim?: boolean | null
          freebie_inventory_status?: string | null
          freebies_device?: string | null
          freebies_priceplan?: string | null
          has_device?: boolean
          id?: string
          import_batch_id?: string | null
          inclusive_data?: string | null
          inclusive_in_group_calling?: string | null
          inclusive_minutes?: string | null
          inclusive_on_net_minutes?: string | null
          inclusive_sms?: string | null
          inventory_status?: string | null
          is_visible_on_frontend?: boolean
          markup_type?: string | null
          markup_value?: number | null
          metadata?: Json | null
          mtn_commission_rate?: number | null
          mtn_price_excl_vat?: number
          mtn_price_incl_vat?: number
          on_net_minutes?: string | null
          on_net_minutes_value?: number | null
          once_off_pay_in_incl_vat?: number | null
          package_description?: string | null
          price_plan?: string
          promo_end_date?: string | null
          promo_start_date?: string | null
          selling_price_excl_vat?: number | null
          selling_price_incl_vat?: number | null
          sms_bundle?: string | null
          sms_bundle_value?: number | null
          source_file?: string | null
          status?: string
          tariff_description?: string | null
          technology?: string
          total_data?: string | null
          total_minutes?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mtn_dealer_products_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mtn_dealer_products_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mtn_dealer_products_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mtn_dealer_products_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mtn_dealer_products_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mtn_dealer_products_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      network_devices: {
        Row: {
          area: string | null
          channel: string | null
          consumer_order_id: string | null
          corporate_site_id: string | null
          created_at: string | null
          deployed_at: string | null
          device_name: string
          device_type: string
          id: string
          interstellio_subscriber_id: string | null
          ip_address: string | null
          mac_address: string | null
          model: string | null
          monthly_cost: number | null
          mtn_reference: string | null
          pppoe_username: string | null
          province: string | null
          ruijie_device_sn: string | null
          serial_number: string
          signal_notes: string | null
          sim_number: string | null
          site_name: string | null
          status: string
          technology: string | null
          updated_at: string | null
        }
        Insert: {
          area?: string | null
          channel?: string | null
          consumer_order_id?: string | null
          corporate_site_id?: string | null
          created_at?: string | null
          deployed_at?: string | null
          device_name: string
          device_type: string
          id?: string
          interstellio_subscriber_id?: string | null
          ip_address?: string | null
          mac_address?: string | null
          model?: string | null
          monthly_cost?: number | null
          mtn_reference?: string | null
          pppoe_username?: string | null
          province?: string | null
          ruijie_device_sn?: string | null
          serial_number: string
          signal_notes?: string | null
          sim_number?: string | null
          site_name?: string | null
          status?: string
          technology?: string | null
          updated_at?: string | null
        }
        Update: {
          area?: string | null
          channel?: string | null
          consumer_order_id?: string | null
          corporate_site_id?: string | null
          created_at?: string | null
          deployed_at?: string | null
          device_name?: string
          device_type?: string
          id?: string
          interstellio_subscriber_id?: string | null
          ip_address?: string | null
          mac_address?: string | null
          model?: string | null
          monthly_cost?: number | null
          mtn_reference?: string | null
          pppoe_username?: string | null
          province?: string | null
          ruijie_device_sn?: string | null
          serial_number?: string
          signal_notes?: string | null
          sim_number?: string | null
          site_name?: string | null
          status?: string
          technology?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "network_devices_consumer_order_id_fkey"
            columns: ["consumer_order_id"]
            isOneToOne: false
            referencedRelation: "consumer_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_devices_consumer_order_id_fkey"
            columns: ["consumer_order_id"]
            isOneToOne: false
            referencedRelation: "v_order_compliance_summary"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "network_devices_consumer_order_id_fkey"
            columns: ["consumer_order_id"]
            isOneToOne: false
            referencedRelation: "v_order_notifications"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "network_devices_corporate_site_id_fkey"
            columns: ["corporate_site_id"]
            isOneToOne: false
            referencedRelation: "corporate_sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_devices_ruijie_device_sn_fkey"
            columns: ["ruijie_device_sn"]
            isOneToOne: false
            referencedRelation: "ruijie_device_cache"
            referencedColumns: ["sn"]
          },
        ]
      }
      network_health_alerts: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          created_at: string
          device_sn: string
          id: string
          message: string
          metadata: Json | null
          severity: string
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          created_at?: string
          device_sn: string
          id?: string
          message: string
          metadata?: Json | null
          severity?: string
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          created_at?: string
          device_sn?: string
          id?: string
          message?: string
          metadata?: Json | null
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "network_health_alerts_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_health_alerts_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_health_alerts_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_health_alerts_device_sn_fkey"
            columns: ["device_sn"]
            isOneToOne: false
            referencedRelation: "ruijie_device_cache"
            referencedColumns: ["sn"]
          },
        ]
      }
      network_health_checks: {
        Row: {
          check_type: string
          checked_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          response_time_ms: number | null
          status: string
          status_code: number | null
          target: string
        }
        Insert: {
          check_type: string
          checked_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          response_time_ms?: number | null
          status: string
          status_code?: number | null
          target: string
        }
        Update: {
          check_type?: string
          checked_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          response_time_ms?: number | null
          status?: string
          status_code?: number | null
          target?: string
        }
        Relationships: []
      }
      network_providers: {
        Row: {
          api_config: Json | null
          created_at: string
          description: string | null
          display_name: string
          enabled: boolean
          id: string
          logo_id: string | null
          name: string
          priority: number
          service_types: string[]
          static_config: Json | null
          support_contact: string | null
          type: string
          updated_at: string
          website: string | null
        }
        Insert: {
          api_config?: Json | null
          created_at?: string
          description?: string | null
          display_name: string
          enabled?: boolean
          id?: string
          logo_id?: string | null
          name: string
          priority?: number
          service_types?: string[]
          static_config?: Json | null
          support_contact?: string | null
          type: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          api_config?: Json | null
          created_at?: string
          description?: string | null
          display_name?: string
          enabled?: boolean
          id?: string
          logo_id?: string | null
          name?: string
          priority?: number
          service_types?: string[]
          static_config?: Json | null
          support_contact?: string | null
          type?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "network_providers_logo_id_fkey"
            columns: ["logo_id"]
            isOneToOne: false
            referencedRelation: "provider_logos"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_tracking: {
        Row: {
          created_at: string | null
          customer_id: string | null
          email: string | null
          event_type: string
          id: string
          message_id: string
          metadata: Json | null
          notification_type: string
          order_id: string | null
          phone: string | null
          timestamp: string
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          email?: string | null
          event_type: string
          id?: string
          message_id: string
          metadata?: Json | null
          notification_type: string
          order_id?: string | null
          phone?: string | null
          timestamp?: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          email?: string | null
          event_type?: string
          id?: string
          message_id?: string
          metadata?: Json | null
          notification_type?: string
          order_id?: string | null
          phone?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_tracking_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_dashboard_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "notification_tracking_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_tracking_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_notification_engagement"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "notification_tracking_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "consumer_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_tracking_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_order_compliance_summary"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "notification_tracking_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_order_notifications"
            referencedColumns: ["order_id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          dismissed_at: string | null
          icon: string | null
          id: string
          is_dismissed: boolean
          is_read: boolean
          link_url: string | null
          message: string
          metadata: Json | null
          priority: Database["public"]["Enums"]["notification_priority"]
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          dismissed_at?: string | null
          icon?: string | null
          id?: string
          is_dismissed?: boolean
          is_read?: boolean
          link_url?: string | null
          message: string
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["notification_priority"]
          read_at?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          dismissed_at?: string | null
          icon?: string | null
          id?: string
          is_dismissed?: boolean
          is_read?: boolean
          link_url?: string | null
          message?: string
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["notification_priority"]
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      oauth_tokens: {
        Row: {
          access_token: string | null
          expires_at: string | null
          id: string
          provider: string
          refresh_token: string
          updated_at: string | null
        }
        Insert: {
          access_token?: string | null
          expires_at?: string | null
          id?: string
          provider: string
          refresh_token: string
          updated_at?: string | null
        }
        Update: {
          access_token?: string | null
          expires_at?: string | null
          id?: string
          provider?: string
          refresh_token?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      offer_components: {
        Row: {
          created_at: string | null
          id: string
          label: string
          offer_id: string
          position: number | null
          qty: number
          role: string
          source_id: string
          source_type: string
          unit_cost: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          label: string
          offer_id: string
          position?: number | null
          qty?: number
          role?: string
          source_id: string
          source_type: string
          unit_cost?: number
          unit_price?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          label?: string
          offer_id?: string
          position?: number | null
          qty?: number
          role?: string
          source_id?: string
          source_type?: string
          unit_cost?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "offer_components_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_pricing_snapshot: {
        Row: {
          computed_at: string
          cost_buildup: Json
          guardrail_status: string
          margin_pct: number
          offer_id: string
          resolved_price: number
          total_cost: number
        }
        Insert: {
          computed_at?: string
          cost_buildup?: Json
          guardrail_status?: string
          margin_pct?: number
          offer_id: string
          resolved_price: number
          total_cost?: number
        }
        Update: {
          computed_at?: string
          cost_buildup?: Json
          guardrail_status?: string
          margin_pct?: number
          offer_id?: string
          resolved_price?: number
          total_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "offer_pricing_snapshot_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: true
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          base_price: number
          channel_visibility: Json
          created_at: string | null
          customer_type: string
          id: string
          lifecycle_state: string
          media: Json | null
          slug: string
          source_uid: string | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          base_price?: number
          channel_visibility?: Json
          created_at?: string | null
          customer_type?: string
          id?: string
          lifecycle_state?: string
          media?: Json | null
          slug: string
          source_uid?: string | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          base_price?: number
          channel_visibility?: Json
          created_at?: string | null
          customer_type?: string
          id?: string
          lifecycle_state?: string
          media?: Json | null
          slug?: string
          source_uid?: string | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      onboarding_submissions: {
        Row: {
          admin_notes: string | null
          admin_reviewed_at: string | null
          admin_reviewed_by: string | null
          customer_id: string
          document_vetting_status: string
          id: string
          netcash_file_token: string | null
          rejection_reason: string | null
          segment: string
          service_order_issued_at: string | null
          service_order_pdf_path: string | null
          status: string
          submission_data: Json
          submitted_at: string | null
          vetting_due_date: string | null
        }
        Insert: {
          admin_notes?: string | null
          admin_reviewed_at?: string | null
          admin_reviewed_by?: string | null
          customer_id: string
          document_vetting_status?: string
          id?: string
          netcash_file_token?: string | null
          rejection_reason?: string | null
          segment?: string
          service_order_issued_at?: string | null
          service_order_pdf_path?: string | null
          status?: string
          submission_data?: Json
          submitted_at?: string | null
          vetting_due_date?: string | null
        }
        Update: {
          admin_notes?: string | null
          admin_reviewed_at?: string | null
          admin_reviewed_by?: string | null
          customer_id?: string
          document_vetting_status?: string
          id?: string
          netcash_file_token?: string | null
          rejection_reason?: string | null
          segment?: string
          service_order_issued_at?: string | null
          service_order_pdf_path?: string | null
          status?: string
          submission_data?: Json
          submitted_at?: string | null
          vetting_due_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_submissions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_dashboard_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "onboarding_submissions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_submissions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_notification_engagement"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      onboarding_tokens: {
        Row: {
          created_at: string | null
          customer_id: string
          expires_at: string
          id: string
          metadata: Json
          onboarding_submission_id: string | null
          purpose: string
          sent_at: string | null
          sent_via: string | null
          token_hash: string
          used_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          expires_at: string
          id?: string
          metadata?: Json
          onboarding_submission_id?: string | null
          purpose?: string
          sent_at?: string | null
          sent_via?: string | null
          token_hash: string
          used_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          expires_at?: string
          id?: string
          metadata?: Json
          onboarding_submission_id?: string | null
          purpose?: string
          sent_at?: string | null
          sent_via?: string | null
          token_hash?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_tokens_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_dashboard_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "onboarding_tokens_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_tokens_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_notification_engagement"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "onboarding_tokens_onboarding_submission_id_fkey"
            columns: ["onboarding_submission_id"]
            isOneToOne: false
            referencedRelation: "onboarding_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      order_addons: {
        Row: {
          addon_id: string
          created_at: string | null
          id: string
          order_id: string
          price_at_purchase: number
          quantity: number | null
        }
        Insert: {
          addon_id: string
          created_at?: string | null
          id?: string
          order_id: string
          price_at_purchase: number
          quantity?: number | null
        }
        Update: {
          addon_id?: string
          created_at?: string | null
          id?: string
          order_id?: string
          price_at_purchase?: number
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_addons_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "product_addons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_addons_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "consumer_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_addons_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_order_compliance_summary"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_addons_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_order_notifications"
            referencedColumns: ["order_id"]
          },
        ]
      }
      order_communications: {
        Row: {
          channel: string
          clicked_at: string | null
          cost_amount: number | null
          created_at: string
          delivered_at: string | null
          external_id: string | null
          external_status: string | null
          failed_at: string | null
          failure_reason: string | null
          id: string
          message: string
          opened_at: string | null
          order_id: string
          order_type: string | null
          recipient_email: string | null
          recipient_name: string | null
          recipient_phone: string | null
          sent_at: string | null
          status: string | null
          subject: string | null
          template_data: Json | null
          template_name: string | null
          triggered_by_status: string | null
          triggered_by_user: string | null
          type: string
          updated_at: string
        }
        Insert: {
          channel: string
          clicked_at?: string | null
          cost_amount?: number | null
          created_at?: string
          delivered_at?: string | null
          external_id?: string | null
          external_status?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          message: string
          opened_at?: string | null
          order_id: string
          order_type?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          template_data?: Json | null
          template_name?: string | null
          triggered_by_status?: string | null
          triggered_by_user?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          channel?: string
          clicked_at?: string | null
          cost_amount?: number | null
          created_at?: string
          delivered_at?: string | null
          external_id?: string | null
          external_status?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          message?: string
          opened_at?: string | null
          order_id?: string
          order_type?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          template_data?: Json | null
          template_name?: string | null
          triggered_by_status?: string | null
          triggered_by_user?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_communications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "consumer_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_communications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_order_compliance_summary"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_communications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_order_notifications"
            referencedColumns: ["order_id"]
          },
        ]
      }
      order_notification_preferences: {
        Row: {
          created_at: string
          customer_email: string
          email_notifications: boolean | null
          id: string
          notify_delivered: boolean | null
          notify_installation_scheduled: boolean | null
          notify_order_confirmed: boolean | null
          notify_service_activated: boolean | null
          notify_shipped: boolean | null
          notify_survey_scheduled: boolean | null
          sms_notifications: boolean | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_email: string
          email_notifications?: boolean | null
          id?: string
          notify_delivered?: boolean | null
          notify_installation_scheduled?: boolean | null
          notify_order_confirmed?: boolean | null
          notify_service_activated?: boolean | null
          notify_shipped?: boolean | null
          notify_survey_scheduled?: boolean | null
          sms_notifications?: boolean | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_email?: string
          email_notifications?: boolean | null
          id?: string
          notify_delivered?: boolean | null
          notify_installation_scheduled?: boolean | null
          notify_order_confirmed?: boolean | null
          notify_service_activated?: boolean | null
          notify_shipped?: boolean | null
          notify_survey_scheduled?: boolean | null
          sms_notifications?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      order_status_history: {
        Row: {
          automated: boolean | null
          change_reason: string | null
          changed_by: string | null
          created_at: string | null
          customer_notified: boolean | null
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          new_status: string
          notes: string | null
          notification_method: string | null
          notification_sent_at: string | null
          old_status: string | null
          status_changed_at: string | null
        }
        Insert: {
          automated?: boolean | null
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string | null
          customer_notified?: boolean | null
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          new_status: string
          notes?: string | null
          notification_method?: string | null
          notification_sent_at?: string | null
          old_status?: string | null
          status_changed_at?: string | null
        }
        Update: {
          automated?: boolean | null
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string | null
          customer_notified?: boolean | null
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          new_status?: string
          notes?: string | null
          notification_method?: string | null
          notification_sent_at?: string | null
          old_status?: string | null
          status_changed_at?: string | null
        }
        Relationships: []
      }
      order_tracking_events: {
        Row: {
          completed_date: string | null
          created_at: string
          created_by: string | null
          event_data: Json | null
          event_description: string | null
          event_status: string
          event_title: string
          event_type: string
          id: string
          order_id: string
          scheduled_date: string | null
          updated_at: string
          visible_to_customer: boolean | null
        }
        Insert: {
          completed_date?: string | null
          created_at?: string
          created_by?: string | null
          event_data?: Json | null
          event_description?: string | null
          event_status: string
          event_title: string
          event_type: string
          id?: string
          order_id: string
          scheduled_date?: string | null
          updated_at?: string
          visible_to_customer?: boolean | null
        }
        Update: {
          completed_date?: string | null
          created_at?: string
          created_by?: string | null
          event_data?: Json | null
          event_description?: string | null
          event_status?: string
          event_title?: string
          event_type?: string
          id?: string
          order_id?: string
          scheduled_date?: string | null
          updated_at?: string
          visible_to_customer?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "order_tracking_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          activation_date: string | null
          base_price: number | null
          billing_start_date: string | null
          coordinates: Json | null
          created_at: string | null
          crm_lead_id: string | null
          crm_synced: boolean | null
          crm_synced_at: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          customer_notes: string | null
          customer_phone: string | null
          delivery_carrier: string | null
          delivery_date: string | null
          delivery_status: string | null
          delivery_tracking_number: string | null
          expected_completion_date: string | null
          fulfillment_status: string | null
          id: string
          installation_address: string | null
          installation_completed_date: string | null
          installation_date: string | null
          installation_fee: number | null
          installation_location_type:
            | Database["public"]["Enums"]["location_type_enum"]
            | null
          installation_notes: string | null
          installation_scheduled_date: string | null
          installation_technician: string | null
          internal_notes: string | null
          lead_id: string | null
          netcash_transaction_id: string | null
          notes: string | null
          order_status: string | null
          order_type: string | null
          package_id: string
          payment_date: string | null
          payment_method: string | null
          payment_reference: string | null
          payment_status: string | null
          promotional_months: number | null
          promotional_price: number | null
          service_type: string | null
          site_survey_completed_date: string | null
          site_survey_notes: string | null
          site_survey_scheduled_date: string | null
          site_survey_status: string | null
          speed_down: number | null
          speed_up: number | null
          status: string | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          activation_date?: string | null
          base_price?: number | null
          billing_start_date?: string | null
          coordinates?: Json | null
          created_at?: string | null
          crm_lead_id?: string | null
          crm_synced?: boolean | null
          crm_synced_at?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_notes?: string | null
          customer_phone?: string | null
          delivery_carrier?: string | null
          delivery_date?: string | null
          delivery_status?: string | null
          delivery_tracking_number?: string | null
          expected_completion_date?: string | null
          fulfillment_status?: string | null
          id?: string
          installation_address?: string | null
          installation_completed_date?: string | null
          installation_date?: string | null
          installation_fee?: number | null
          installation_location_type?:
            | Database["public"]["Enums"]["location_type_enum"]
            | null
          installation_notes?: string | null
          installation_scheduled_date?: string | null
          installation_technician?: string | null
          internal_notes?: string | null
          lead_id?: string | null
          netcash_transaction_id?: string | null
          notes?: string | null
          order_status?: string | null
          order_type?: string | null
          package_id: string
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          promotional_months?: number | null
          promotional_price?: number | null
          service_type?: string | null
          site_survey_completed_date?: string | null
          site_survey_notes?: string | null
          site_survey_scheduled_date?: string | null
          site_survey_status?: string | null
          speed_down?: number | null
          speed_up?: number | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          activation_date?: string | null
          base_price?: number | null
          billing_start_date?: string | null
          coordinates?: Json | null
          created_at?: string | null
          crm_lead_id?: string | null
          crm_synced?: boolean | null
          crm_synced_at?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_notes?: string | null
          customer_phone?: string | null
          delivery_carrier?: string | null
          delivery_date?: string | null
          delivery_status?: string | null
          delivery_tracking_number?: string | null
          expected_completion_date?: string | null
          fulfillment_status?: string | null
          id?: string
          installation_address?: string | null
          installation_completed_date?: string | null
          installation_date?: string | null
          installation_fee?: number | null
          installation_location_type?:
            | Database["public"]["Enums"]["location_type_enum"]
            | null
          installation_notes?: string | null
          installation_scheduled_date?: string | null
          installation_technician?: string | null
          internal_notes?: string | null
          lead_id?: string | null
          netcash_transaction_id?: string | null
          notes?: string | null
          order_status?: string | null
          order_type?: string | null
          package_id?: string
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          promotional_months?: number | null
          promotional_price?: number | null
          service_type?: string | null
          site_survey_completed_date?: string | null
          site_survey_notes?: string | null
          site_survey_scheduled_date?: string | null
          site_survey_status?: string | null
          speed_down?: number | null
          speed_up?: number | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_dashboard_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_notification_engagement"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      otp_verifications: {
        Row: {
          attempts: number
          created_at: string | null
          email: string
          expires_at: string
          id: string
          otp: string
          type: string | null
          updated_at: string | null
          verified: boolean | null
          verified_at: string | null
        }
        Insert: {
          attempts?: number
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          otp: string
          type?: string | null
          updated_at?: string | null
          verified?: boolean | null
          verified_at?: string | null
        }
        Update: {
          attempts?: number
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          otp?: string
          type?: string | null
          updated_at?: string | null
          verified?: boolean | null
          verified_at?: string | null
        }
        Relationships: []
      }
      outage_incidents: {
        Row: {
          affected_customer_count: number | null
          affected_providers: string[] | null
          affected_regions: string[] | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          identified_at: string | null
          incident_number: string | null
          resolution_notes: string | null
          resolved_at: string | null
          root_cause: string | null
          severity: string
          started_at: string
          status: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          affected_customer_count?: number | null
          affected_providers?: string[] | null
          affected_regions?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          identified_at?: string | null
          incident_number?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          root_cause?: string | null
          severity: string
          started_at: string
          status?: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          affected_customer_count?: number | null
          affected_providers?: string[] | null
          affected_regions?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          identified_at?: string | null
          incident_number?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          root_cause?: string | null
          severity?: string
          started_at?: string
          status?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outage_incidents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outage_incidents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outage_incidents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outage_incidents_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outage_incidents_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outage_incidents_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      outage_updates: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          incident_id: string
          is_public: boolean | null
          message: string
          status: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          incident_id: string
          is_public?: boolean | null
          message: string
          status: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          incident_id?: string
          is_public?: boolean | null
          message?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "outage_updates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outage_updates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outage_updates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outage_updates_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "outage_incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          author_id: string | null
          content: Json
          content_history: Json | null
          content_type: string
          contextual_retrieval_mode: string | null
          corpus_generation: string | null
          created_at: string | null
          deleted_at: string | null
          effective_date: string | null
          effective_date_source: string | null
          emotional_weight: number
          featured_image: string | null
          generation: number
          id: string
          import_filename: string | null
          ingested_at: string | null
          ingested_via: string | null
          last_retrieved_at: string | null
          published_at: string | null
          salience_touched_at: string | null
          scheduled_at: string | null
          seo_metadata: Json | null
          slug: string
          source_id: string
          source_kind: string | null
          source_uri: string | null
          status: string | null
          thought_signature: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          content: Json
          content_history?: Json | null
          content_type: string
          contextual_retrieval_mode?: string | null
          corpus_generation?: string | null
          created_at?: string | null
          deleted_at?: string | null
          effective_date?: string | null
          effective_date_source?: string | null
          emotional_weight?: number
          featured_image?: string | null
          generation?: number
          id?: string
          import_filename?: string | null
          ingested_at?: string | null
          ingested_via?: string | null
          last_retrieved_at?: string | null
          published_at?: string | null
          salience_touched_at?: string | null
          scheduled_at?: string | null
          seo_metadata?: Json | null
          slug: string
          source_id?: string
          source_kind?: string | null
          source_uri?: string | null
          status?: string | null
          thought_signature?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          content?: Json
          content_history?: Json | null
          content_type?: string
          contextual_retrieval_mode?: string | null
          corpus_generation?: string | null
          created_at?: string | null
          deleted_at?: string | null
          effective_date?: string | null
          effective_date_source?: string | null
          emotional_weight?: number
          featured_image?: string | null
          generation?: number
          id?: string
          import_filename?: string | null
          ingested_at?: string | null
          ingested_via?: string | null
          last_retrieved_at?: string | null
          published_at?: string | null
          salience_touched_at?: string | null
          scheduled_at?: string | null
          seo_metadata?: Json | null
          slug?: string
          source_id?: string
          source_kind?: string | null
          source_uri?: string | null
          status?: string | null
          thought_signature?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pages_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_ai_usage: {
        Row: {
          created_at: string | null
          id: string
          input_tokens: number | null
          model_used: string
          output_tokens: number | null
          partner_id: string
          request_id: string | null
          request_type: string
          response_time_ms: number | null
          success: boolean | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          input_tokens?: number | null
          model_used: string
          output_tokens?: number | null
          partner_id: string
          request_id?: string | null
          request_type: string
          response_time_ms?: number | null
          success?: boolean | null
        }
        Update: {
          created_at?: string | null
          id?: string
          input_tokens?: number | null
          model_used?: string
          output_tokens?: number | null
          partner_id?: string
          request_id?: string | null
          request_type?: string
          response_time_ms?: number | null
          success?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_ai_usage_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_ai_usage_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "v_partner_commission_tier_analysis"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "partner_ai_usage_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "partner_feasibility_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_commission_transactions: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          base_commission_rate: number | null
          commission_model: string | null
          commission_rate: number | null
          commission_tier_id: string | null
          contract_term_months: number | null
          created_at: string | null
          currency: string
          description: string | null
          effective_commission_rate: number | null
          id: string
          lead_id: string | null
          metadata: Json | null
          monthly_subscription_value: number | null
          notes: string | null
          order_id: string | null
          paid_at: string | null
          partner_id: string
          payment_method: string | null
          payment_reference: string | null
          product_commission_config_id: string | null
          product_sku: string | null
          status: string
          total_contract_value: number | null
          transaction_type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          base_commission_rate?: number | null
          commission_model?: string | null
          commission_rate?: number | null
          commission_tier_id?: string | null
          contract_term_months?: number | null
          created_at?: string | null
          currency?: string
          description?: string | null
          effective_commission_rate?: number | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          monthly_subscription_value?: number | null
          notes?: string | null
          order_id?: string | null
          paid_at?: string | null
          partner_id: string
          payment_method?: string | null
          payment_reference?: string | null
          product_commission_config_id?: string | null
          product_sku?: string | null
          status?: string
          total_contract_value?: number | null
          transaction_type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          base_commission_rate?: number | null
          commission_model?: string | null
          commission_rate?: number | null
          commission_tier_id?: string | null
          contract_term_months?: number | null
          created_at?: string | null
          currency?: string
          description?: string | null
          effective_commission_rate?: number | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          monthly_subscription_value?: number | null
          notes?: string | null
          order_id?: string | null
          paid_at?: string | null
          partner_id?: string
          payment_method?: string | null
          payment_reference?: string | null
          product_commission_config_id?: string | null
          product_sku?: string | null
          status?: string
          total_contract_value?: number | null
          transaction_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_commission_transactio_product_commission_config_id_fkey"
            columns: ["product_commission_config_id"]
            isOneToOne: false
            referencedRelation: "product_commission_config"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_commission_transactions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_commission_transactions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_commission_transactions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_commission_transactions_commission_tier_id_fkey"
            columns: ["commission_tier_id"]
            isOneToOne: false
            referencedRelation: "commission_tier_config"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_commission_transactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "coverage_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_commission_transactions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_commission_transactions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "v_partner_commission_tier_analysis"
            referencedColumns: ["partner_id"]
          },
        ]
      }
      partner_compliance_documents: {
        Row: {
          document_category: string
          document_name: string
          document_number: string | null
          document_type: string
          expires_at: string | null
          expiry_date: string | null
          file_path: string
          file_size: number | null
          id: string
          is_required: boolean
          is_sensitive: boolean
          issue_date: string | null
          mime_type: string | null
          partner_id: string
          rejection_reason: string | null
          updated_at: string
          uploaded_at: string
          verification_status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          document_category: string
          document_name: string
          document_number?: string | null
          document_type?: string
          expires_at?: string | null
          expiry_date?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          is_required?: boolean
          is_sensitive?: boolean
          issue_date?: string | null
          mime_type?: string | null
          partner_id: string
          rejection_reason?: string | null
          updated_at?: string
          uploaded_at?: string
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          document_category?: string
          document_name?: string
          document_number?: string | null
          document_type?: string
          expires_at?: string | null
          expiry_date?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          is_required?: boolean
          is_sensitive?: boolean
          issue_date?: string | null
          mime_type?: string | null
          partner_id?: string
          rejection_reason?: string | null
          updated_at?: string
          uploaded_at?: string
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_kyc_documents_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_kyc_documents_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "v_partner_commission_tier_analysis"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "partner_kyc_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_kyc_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_kyc_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_feasibility_requests: {
        Row: {
          bandwidth_required: number | null
          chat_history: Json | null
          client_company_name: string
          client_contact_name: string | null
          client_email: string | null
          client_phone: string | null
          contention: string | null
          contract_term: number | null
          created_at: string | null
          failover_required: boolean | null
          id: string
          partner_id: string
          sla_level: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          bandwidth_required?: number | null
          chat_history?: Json | null
          client_company_name: string
          client_contact_name?: string | null
          client_email?: string | null
          client_phone?: string | null
          contention?: string | null
          contract_term?: number | null
          created_at?: string | null
          failover_required?: boolean | null
          id?: string
          partner_id: string
          sla_level?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          bandwidth_required?: number | null
          chat_history?: Json | null
          client_company_name?: string
          client_contact_name?: string | null
          client_email?: string | null
          client_phone?: string | null
          contention?: string | null
          contract_term?: number | null
          created_at?: string | null
          failover_required?: boolean | null
          id?: string
          partner_id?: string
          sla_level?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_feasibility_requests_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_feasibility_requests_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "v_partner_commission_tier_analysis"
            referencedColumns: ["partner_id"]
          },
        ]
      }
      partner_feasibility_sites: {
        Row: {
          address: string
          coverage_lead_id: string | null
          coverage_results: Json | null
          coverage_status: string | null
          created_at: string | null
          id: string
          latitude: number | null
          longitude: number | null
          request_id: string
          selected_packages: Json | null
        }
        Insert: {
          address: string
          coverage_lead_id?: string | null
          coverage_results?: Json | null
          coverage_status?: string | null
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          request_id: string
          selected_packages?: Json | null
        }
        Update: {
          address?: string
          coverage_lead_id?: string | null
          coverage_results?: Json | null
          coverage_status?: string | null
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          request_id?: string
          selected_packages?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_feasibility_sites_coverage_lead_id_fkey"
            columns: ["coverage_lead_id"]
            isOneToOne: false
            referencedRelation: "coverage_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_feasibility_sites_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "partner_feasibility_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_lead_activities: {
        Row: {
          activity_type: string
          created_at: string
          description: string | null
          id: string
          lead_id: string
          next_action: string | null
          next_action_date: string | null
          outcome: string | null
          partner_id: string
          subject: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string
          description?: string | null
          id?: string
          lead_id: string
          next_action?: string | null
          next_action_date?: string | null
          outcome?: string | null
          partner_id: string
          subject?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string | null
          id?: string
          lead_id?: string
          next_action?: string | null
          next_action_date?: string | null
          outcome?: string | null
          partner_id?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "coverage_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_lead_activities_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_lead_activities_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "v_partner_commission_tier_analysis"
            referencedColumns: ["partner_id"]
          },
        ]
      }
      partners: {
        Row: {
          account_holder: string | null
          account_number: string | null
          account_type: string | null
          alternative_phone: string | null
          approval_notes: string | null
          approved_at: string | null
          approved_by: string | null
          bank_name: string | null
          branch_code: string | null
          business_name: string
          business_type: string
          city: string
          commission_rate: number
          compliance_notes: string | null
          compliance_status: string
          compliance_verified_at: string | null
          contact_person: string
          converted_leads: number
          created_at: string
          email: string
          id: string
          partner_number: string | null
          pending_commission: number
          phone: string
          postal_code: string
          province: string
          registration_number: string | null
          rejected_at: string | null
          status: string
          street_address: string
          suburb: string | null
          tier: string
          total_commission_earned: number
          total_leads: number
          updated_at: string
          user_id: string
          vat_number: string | null
        }
        Insert: {
          account_holder?: string | null
          account_number?: string | null
          account_type?: string | null
          alternative_phone?: string | null
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bank_name?: string | null
          branch_code?: string | null
          business_name: string
          business_type: string
          city: string
          commission_rate?: number
          compliance_notes?: string | null
          compliance_status?: string
          compliance_verified_at?: string | null
          contact_person: string
          converted_leads?: number
          created_at?: string
          email: string
          id?: string
          partner_number?: string | null
          pending_commission?: number
          phone: string
          postal_code: string
          province: string
          registration_number?: string | null
          rejected_at?: string | null
          status?: string
          street_address: string
          suburb?: string | null
          tier?: string
          total_commission_earned?: number
          total_leads?: number
          updated_at?: string
          user_id: string
          vat_number?: string | null
        }
        Update: {
          account_holder?: string | null
          account_number?: string | null
          account_type?: string | null
          alternative_phone?: string | null
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bank_name?: string | null
          branch_code?: string | null
          business_name?: string
          business_type?: string
          city?: string
          commission_rate?: number
          compliance_notes?: string | null
          compliance_status?: string
          compliance_verified_at?: string | null
          contact_person?: string
          converted_leads?: number
          created_at?: string
          email?: string
          id?: string
          partner_number?: string | null
          pending_commission?: number
          phone?: string
          postal_code?: string
          province?: string
          registration_number?: string | null
          rejected_at?: string | null
          status?: string
          street_address?: string
          suburb?: string | null
          tier?: string
          total_commission_earned?: number
          total_leads?: number
          updated_at?: string
          user_id?: string
          vat_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partners_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partners_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partners_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_audit_logs: {
        Row: {
          created_at: string
          event_type: string
          id: string
          ip_address: string | null
          netcash_response: Json | null
          order_id: string
          request_body: string | null
          request_headers: Json | null
          signature_valid: boolean | null
          status: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          ip_address?: string | null
          netcash_response?: Json | null
          order_id: string
          request_body?: string | null
          request_headers?: Json | null
          signature_valid?: boolean | null
          status: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          netcash_response?: Json | null
          order_id?: string
          request_body?: string | null
          request_headers?: Json | null
          signature_valid?: boolean | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_audit_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_consents: {
        Row: {
          additional_metadata: Json | null
          business_verification_consent: boolean | null
          consent_timestamp: string
          consent_type: string | null
          created_at: string | null
          customer_email: string
          customer_id: string | null
          data_processing_consent: boolean | null
          id: string
          ip_address: string | null
          marketing_consent: boolean | null
          order_id: string | null
          payment_terms_accepted: boolean
          payment_terms_version: string
          payment_transaction_id: string | null
          privacy_accepted: boolean
          privacy_version: string
          quote_id: string | null
          recurring_payment_authorized: boolean | null
          refund_policy_acknowledged: boolean
          refund_policy_version: string
          terms_accepted: boolean
          terms_version: string
          third_party_disclosure_consent: boolean | null
          updated_at: string | null
          user_agent: string | null
        }
        Insert: {
          additional_metadata?: Json | null
          business_verification_consent?: boolean | null
          consent_timestamp?: string
          consent_type?: string | null
          created_at?: string | null
          customer_email: string
          customer_id?: string | null
          data_processing_consent?: boolean | null
          id?: string
          ip_address?: string | null
          marketing_consent?: boolean | null
          order_id?: string | null
          payment_terms_accepted?: boolean
          payment_terms_version: string
          payment_transaction_id?: string | null
          privacy_accepted?: boolean
          privacy_version: string
          quote_id?: string | null
          recurring_payment_authorized?: boolean | null
          refund_policy_acknowledged?: boolean
          refund_policy_version: string
          terms_accepted?: boolean
          terms_version: string
          third_party_disclosure_consent?: boolean | null
          updated_at?: string | null
          user_agent?: string | null
        }
        Update: {
          additional_metadata?: Json | null
          business_verification_consent?: boolean | null
          consent_timestamp?: string
          consent_type?: string | null
          created_at?: string | null
          customer_email?: string
          customer_id?: string | null
          data_processing_consent?: boolean | null
          id?: string
          ip_address?: string | null
          marketing_consent?: boolean | null
          order_id?: string | null
          payment_terms_accepted?: boolean
          payment_terms_version?: string
          payment_transaction_id?: string | null
          privacy_accepted?: boolean
          privacy_version?: string
          quote_id?: string | null
          recurring_payment_authorized?: boolean | null
          refund_policy_acknowledged?: boolean
          refund_policy_version?: string
          terms_accepted?: boolean
          terms_version?: string
          third_party_disclosure_consent?: boolean | null
          updated_at?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_consents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_dashboard_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "payment_consents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_consents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_notification_engagement"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "payment_consents_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "consumer_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_consents_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_order_compliance_summary"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "payment_consents_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_order_notifications"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "payment_consents_payment_transaction_id_fkey"
            columns: ["payment_transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_consents_payment_transaction_id_fkey"
            columns: ["payment_transaction_id"]
            isOneToOne: false
            referencedRelation: "v_recent_payment_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_consents_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "business_quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_consents_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quote_analytics"
            referencedColumns: ["quote_id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          activated_at: string | null
          bank_account_name: string | null
          bank_account_number_masked: string | null
          bank_account_type: string | null
          bank_name: string | null
          branch_code: string | null
          cancelled_at: string | null
          card_expiry_month: number | null
          card_expiry_year: number | null
          card_holder_name: string | null
          card_number_masked: string | null
          card_type: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          id: string
          is_primary: boolean | null
          is_verified: boolean | null
          mandate_active: boolean | null
          mandate_agreement_date: string | null
          mandate_amount: number | null
          mandate_debit_day: number | null
          mandate_frequency: string | null
          mandate_signed_at: string | null
          metadata: Json | null
          method_type: string
          netcash_account_reference: string | null
          netcash_mandate_pdf_link: string | null
          netcash_mandate_reference: string | null
          netcash_mandate_url: string | null
          netcash_token: string | null
          order_id: string | null
          status: string
          suspended_at: string | null
          updated_at: string | null
          verification_method: string | null
        }
        Insert: {
          activated_at?: string | null
          bank_account_name?: string | null
          bank_account_number_masked?: string | null
          bank_account_type?: string | null
          bank_name?: string | null
          branch_code?: string | null
          cancelled_at?: string | null
          card_expiry_month?: number | null
          card_expiry_year?: number | null
          card_holder_name?: string | null
          card_number_masked?: string | null
          card_type?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          id?: string
          is_primary?: boolean | null
          is_verified?: boolean | null
          mandate_active?: boolean | null
          mandate_agreement_date?: string | null
          mandate_amount?: number | null
          mandate_debit_day?: number | null
          mandate_frequency?: string | null
          mandate_signed_at?: string | null
          metadata?: Json | null
          method_type: string
          netcash_account_reference?: string | null
          netcash_mandate_pdf_link?: string | null
          netcash_mandate_reference?: string | null
          netcash_mandate_url?: string | null
          netcash_token?: string | null
          order_id?: string | null
          status?: string
          suspended_at?: string | null
          updated_at?: string | null
          verification_method?: string | null
        }
        Update: {
          activated_at?: string | null
          bank_account_name?: string | null
          bank_account_number_masked?: string | null
          bank_account_type?: string | null
          bank_name?: string | null
          branch_code?: string | null
          cancelled_at?: string | null
          card_expiry_month?: number | null
          card_expiry_year?: number | null
          card_holder_name?: string | null
          card_number_masked?: string | null
          card_type?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          id?: string
          is_primary?: boolean | null
          is_verified?: boolean | null
          mandate_active?: boolean | null
          mandate_agreement_date?: string | null
          mandate_amount?: number | null
          mandate_debit_day?: number | null
          mandate_frequency?: string | null
          mandate_signed_at?: string | null
          metadata?: Json | null
          method_type?: string
          netcash_account_reference?: string | null
          netcash_mandate_pdf_link?: string | null
          netcash_mandate_reference?: string | null
          netcash_mandate_url?: string | null
          netcash_token?: string | null
          order_id?: string | null
          status?: string
          suspended_at?: string | null
          updated_at?: string | null
          verification_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_methods_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_methods_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_methods_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_dashboard_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "payment_methods_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_methods_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_notification_engagement"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "payment_methods_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "consumer_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_methods_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_order_compliance_summary"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "payment_methods_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_order_notifications"
            referencedColumns: ["order_id"]
          },
        ]
      }
      payment_provider_settings: {
        Row: {
          capabilities_override: Json | null
          created_at: string
          created_by: string | null
          credentials: Json | null
          daily_limit: number | null
          enabled: boolean
          id: string
          max_amount: number | null
          metadata: Json | null
          min_amount: number | null
          priority: number
          provider: string
          settings: Json | null
          test_credentials: Json | null
          test_mode: boolean
          updated_at: string
          updated_by: string | null
          webhook_events: string[] | null
          webhook_secret: string | null
          webhook_url: string | null
        }
        Insert: {
          capabilities_override?: Json | null
          created_at?: string
          created_by?: string | null
          credentials?: Json | null
          daily_limit?: number | null
          enabled?: boolean
          id?: string
          max_amount?: number | null
          metadata?: Json | null
          min_amount?: number | null
          priority?: number
          provider: string
          settings?: Json | null
          test_credentials?: Json | null
          test_mode?: boolean
          updated_at?: string
          updated_by?: string | null
          webhook_events?: string[] | null
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Update: {
          capabilities_override?: Json | null
          created_at?: string
          created_by?: string | null
          credentials?: Json | null
          daily_limit?: number | null
          enabled?: boolean
          id?: string
          max_amount?: number | null
          metadata?: Json | null
          min_amount?: number | null
          priority?: number
          provider?: string
          settings?: Json | null
          test_credentials?: Json | null
          test_mode?: boolean
          updated_at?: string
          updated_by?: string | null
          webhook_events?: string[] | null
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string
          created_by: string | null
          currency: string
          customer_email: string | null
          customer_id: string | null
          customer_invoice_id: string | null
          customer_name: string | null
          error_code: string | null
          error_message: string | null
          expires_at: string | null
          failure_reason: string | null
          id: string
          initiated_at: string
          invoice_id: string | null
          metadata: Json | null
          order_id: string | null
          payment_method: string | null
          payment_method_details: Json | null
          provider: string
          provider_reference: string | null
          provider_response: Json | null
          reconciliation_queue_id: string | null
          reconciliation_source: string | null
          reference: string
          status: string
          transaction_id: string
          updated_at: string
          zoho_books_next_retry_at: string | null
          zoho_books_payment_id: string | null
          zoho_books_retry_count: number | null
          zoho_last_sync_error: string | null
          zoho_last_synced_at: string | null
          zoho_payment_id: string | null
          zoho_sync_status: string | null
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_invoice_id?: string | null
          customer_name?: string | null
          error_code?: string | null
          error_message?: string | null
          expires_at?: string | null
          failure_reason?: string | null
          id?: string
          initiated_at?: string
          invoice_id?: string | null
          metadata?: Json | null
          order_id?: string | null
          payment_method?: string | null
          payment_method_details?: Json | null
          provider: string
          provider_reference?: string | null
          provider_response?: Json | null
          reconciliation_queue_id?: string | null
          reconciliation_source?: string | null
          reference: string
          status?: string
          transaction_id: string
          updated_at?: string
          zoho_books_next_retry_at?: string | null
          zoho_books_payment_id?: string | null
          zoho_books_retry_count?: number | null
          zoho_last_sync_error?: string | null
          zoho_last_synced_at?: string | null
          zoho_payment_id?: string | null
          zoho_sync_status?: string | null
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_invoice_id?: string | null
          customer_name?: string | null
          error_code?: string | null
          error_message?: string | null
          expires_at?: string | null
          failure_reason?: string | null
          id?: string
          initiated_at?: string
          invoice_id?: string | null
          metadata?: Json | null
          order_id?: string | null
          payment_method?: string | null
          payment_method_details?: Json | null
          provider?: string
          provider_reference?: string | null
          provider_response?: Json | null
          reconciliation_queue_id?: string | null
          reconciliation_source?: string | null
          reference?: string
          status?: string
          transaction_id?: string
          updated_at?: string
          zoho_books_next_retry_at?: string | null
          zoho_books_payment_id?: string | null
          zoho_books_retry_count?: number | null
          zoho_last_sync_error?: string | null
          zoho_last_synced_at?: string | null
          zoho_payment_id?: string | null
          zoho_sync_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_customer_invoice_id_fkey"
            columns: ["customer_invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_reconciliation_queue_id_fkey"
            columns: ["reconciliation_queue_id"]
            isOneToOne: false
            referencedRelation: "reconciliation_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_webhook_logs: {
        Row: {
          actions_taken: Json | null
          body: string
          body_parsed: Json | null
          created_at: string
          error_message: string | null
          error_stack: string | null
          event_type: string
          headers: Json
          http_method: string
          id: string
          last_retry_at: string | null
          max_retries: number
          metadata: Json | null
          next_retry_at: string | null
          processing_completed_at: string | null
          processing_duration_ms: number | null
          processing_started_at: string | null
          provider: string
          query_params: Json | null
          received_at: string
          reference: string | null
          response_body: Json | null
          response_status_code: number | null
          retry_count: number
          signature: string | null
          signature_algorithm: string | null
          signature_verified: boolean
          source_ip: string | null
          status: string
          success: boolean | null
          transaction_id: string | null
          updated_at: string
          user_agent: string | null
          webhook_id: string
        }
        Insert: {
          actions_taken?: Json | null
          body: string
          body_parsed?: Json | null
          created_at?: string
          error_message?: string | null
          error_stack?: string | null
          event_type: string
          headers: Json
          http_method?: string
          id?: string
          last_retry_at?: string | null
          max_retries?: number
          metadata?: Json | null
          next_retry_at?: string | null
          processing_completed_at?: string | null
          processing_duration_ms?: number | null
          processing_started_at?: string | null
          provider: string
          query_params?: Json | null
          received_at?: string
          reference?: string | null
          response_body?: Json | null
          response_status_code?: number | null
          retry_count?: number
          signature?: string | null
          signature_algorithm?: string | null
          signature_verified?: boolean
          source_ip?: string | null
          status?: string
          success?: boolean | null
          transaction_id?: string | null
          updated_at?: string
          user_agent?: string | null
          webhook_id?: string
        }
        Update: {
          actions_taken?: Json | null
          body?: string
          body_parsed?: Json | null
          created_at?: string
          error_message?: string | null
          error_stack?: string | null
          event_type?: string
          headers?: Json
          http_method?: string
          id?: string
          last_retry_at?: string | null
          max_retries?: number
          metadata?: Json | null
          next_retry_at?: string | null
          processing_completed_at?: string | null
          processing_duration_ms?: number | null
          processing_started_at?: string | null
          provider?: string
          query_params?: Json | null
          received_at?: string
          reference?: string | null
          response_body?: Json | null
          response_status_code?: number | null
          retry_count?: number
          signature?: string | null
          signature_algorithm?: string | null
          signature_verified?: boolean
          source_ip?: string | null
          status?: string
          success?: boolean | null
          transaction_id?: string | null
          updated_at?: string
          user_agent?: string | null
          webhook_id?: string
        }
        Relationships: []
      }
      payment_webhooks: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          transaction_id: string
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          payload: Json
          processed_at?: string | null
          transaction_id: string
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          transaction_id?: string
        }
        Relationships: []
      }
      payroll_records: {
        Row: {
          allowances_zar: number | null
          basic_salary_zar: number
          created_at: string | null
          employee_id: string
          financial_period_id: string
          gross_salary_zar: number
          id: string
          net_salary_zar: number
          overtime_zar: number | null
          pay_date: string
          paye_zar: number
          sdl_zar: number
          total_deductions_zar: number
          uif_zar: number
        }
        Insert: {
          allowances_zar?: number | null
          basic_salary_zar: number
          created_at?: string | null
          employee_id: string
          financial_period_id: string
          gross_salary_zar: number
          id?: string
          net_salary_zar: number
          overtime_zar?: number | null
          pay_date: string
          paye_zar: number
          sdl_zar: number
          total_deductions_zar: number
          uif_zar: number
        }
        Update: {
          allowances_zar?: number | null
          basic_salary_zar?: number
          created_at?: string | null
          employee_id?: string
          financial_period_id?: string
          gross_salary_zar?: number
          id?: string
          net_salary_zar?: number
          overtime_zar?: number | null
          pay_date?: string
          paye_zar?: number
          sdl_zar?: number
          total_deductions_zar?: number
          uif_zar?: number
        }
        Relationships: [
          {
            foreignKeyName: "payroll_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_records_financial_period_id_fkey"
            columns: ["financial_period_id"]
            isOneToOne: false
            referencedRelation: "financial_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      pb_ai_usage: {
        Row: {
          created_at: string | null
          error_message: string | null
          estimated_cost_cents: number | null
          id: string
          input_tokens: number | null
          model_used: string
          output_tokens: number | null
          prompt_summary: string | null
          request_type: string
          response_time_ms: number | null
          success: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          estimated_cost_cents?: number | null
          id?: string
          input_tokens?: number | null
          model_used: string
          output_tokens?: number | null
          prompt_summary?: string | null
          request_type: string
          response_time_ms?: number | null
          success?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          estimated_cost_cents?: number | null
          id?: string
          input_tokens?: number | null
          model_used?: string
          output_tokens?: number | null
          prompt_summary?: string | null
          request_type?: string
          response_time_ms?: number | null
          success?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pb_ai_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pb_ai_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pb_ai_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      pb_media: {
        Row: {
          alt_text: string | null
          caption: string | null
          created_at: string | null
          file_size: number
          filename: string
          folder: string | null
          height: number | null
          id: string
          metadata: Json | null
          mime_type: string
          original_filename: string
          public_url: string
          storage_path: string
          uploaded_by: string | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string | null
          file_size: number
          filename: string
          folder?: string | null
          height?: number | null
          id?: string
          metadata?: Json | null
          mime_type: string
          original_filename: string
          public_url: string
          storage_path: string
          uploaded_by?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string | null
          file_size?: number
          filename?: string
          folder?: string | null
          height?: number | null
          id?: string
          metadata?: Json | null
          mime_type?: string
          original_filename?: string
          public_url?: string
          storage_path?: string
          uploaded_by?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pb_media_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pb_media_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pb_media_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      pb_page_versions: {
        Row: {
          change_summary: string | null
          content: Json
          created_at: string | null
          created_by: string | null
          id: string
          page_id: string
          seo_metadata: Json | null
          version: number
        }
        Insert: {
          change_summary?: string | null
          content: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          page_id: string
          seo_metadata?: Json | null
          version: number
        }
        Update: {
          change_summary?: string | null
          content?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          page_id?: string
          seo_metadata?: Json | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "pb_page_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pb_page_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pb_page_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pb_page_versions_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pb_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pb_pages: {
        Row: {
          author_id: string | null
          content: Json
          content_type: string
          created_at: string | null
          id: string
          published_at: string | null
          scheduled_at: string | null
          seo_metadata: Json | null
          slug: string
          status: string
          theme: string | null
          title: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          author_id?: string | null
          content?: Json
          content_type: string
          created_at?: string | null
          id?: string
          published_at?: string | null
          scheduled_at?: string | null
          seo_metadata?: Json | null
          slug: string
          status?: string
          theme?: string | null
          title: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          author_id?: string | null
          content?: Json
          content_type?: string
          created_at?: string | null
          id?: string
          published_at?: string | null
          scheduled_at?: string | null
          seo_metadata?: Json | null
          slug?: string
          status?: string
          theme?: string | null
          title?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pb_pages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pb_pages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pb_pages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      pb_templates: {
        Row: {
          category: string
          content: Json
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          sort_order: number | null
          thumbnail_url: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          content?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          sort_order?: number | null
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          content?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          sort_order?: number | null
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pb_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pb_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pb_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_admin_users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          reason: string | null
          rejection_reason: string | null
          requested_role: string
          requested_role_template_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          reason?: string | null
          rejection_reason?: string | null
          requested_role: string
          requested_role_template_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          reason?: string | null
          rejection_reason?: string | null
          requested_role?: string
          requested_role_template_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pending_admin_users_requested_role_template_fkey"
            columns: ["requested_role_template_id"]
            isOneToOne: false
            referencedRelation: "role_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_admin_users_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_admin_users_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_admin_users_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      pppoe_audit_log: {
        Row: {
          action: string
          created_at: string | null
          credential_id: string | null
          customer_id: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          performed_by: string | null
          performed_by_type: string | null
          service_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          credential_id?: string | null
          customer_id?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          performed_by?: string | null
          performed_by_type?: string | null
          service_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          credential_id?: string | null
          customer_id?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          performed_by?: string | null
          performed_by_type?: string | null
          service_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pppoe_audit_log_credential_id_fkey"
            columns: ["credential_id"]
            isOneToOne: false
            referencedRelation: "pppoe_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pppoe_audit_log_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_dashboard_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "pppoe_audit_log_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pppoe_audit_log_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_notification_engagement"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "pppoe_audit_log_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "customer_services"
            referencedColumns: ["id"]
          },
        ]
      }
      pppoe_credentials: {
        Row: {
          created_at: string | null
          created_by: string | null
          credentials_sent_at: string | null
          credentials_sent_via: Json | null
          customer_id: string
          id: string
          interstellio_subscriber_id: string | null
          password_auth_tag: string
          password_iv: string
          pppoe_password_encrypted: string
          pppoe_username: string
          provisioned_at: string | null
          provisioning_error: string | null
          provisioning_status: string | null
          service_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          credentials_sent_at?: string | null
          credentials_sent_via?: Json | null
          customer_id: string
          id?: string
          interstellio_subscriber_id?: string | null
          password_auth_tag: string
          password_iv: string
          pppoe_password_encrypted: string
          pppoe_username: string
          provisioned_at?: string | null
          provisioning_error?: string | null
          provisioning_status?: string | null
          service_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          credentials_sent_at?: string | null
          credentials_sent_via?: Json | null
          customer_id?: string
          id?: string
          interstellio_subscriber_id?: string | null
          password_auth_tag?: string
          password_iv?: string
          pppoe_password_encrypted?: string
          pppoe_username?: string
          provisioned_at?: string | null
          provisioning_error?: string | null
          provisioning_status?: string | null
          service_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pppoe_credentials_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pppoe_credentials_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pppoe_credentials_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pppoe_credentials_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_dashboard_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "pppoe_credentials_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pppoe_credentials_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_notification_engagement"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "pppoe_credentials_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: true
            referencedRelation: "customer_services"
            referencedColumns: ["id"]
          },
        ]
      }
      price_changes: {
        Row: {
          admin_notes: string | null
          affected_customers_count: number | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          customer_message: string | null
          effective_date: string
          id: string
          new_customers_count: number | null
          new_price: number
          notice_sent_at: string | null
          old_price: number
          percentage_change: number | null
          price_difference: number | null
          published_at: string | null
          reason: string | null
          reminder_1month_sent_at: string | null
          reminder_1week_sent_at: string | null
          service_package_id: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          affected_customers_count?: number | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          customer_message?: string | null
          effective_date: string
          id?: string
          new_customers_count?: number | null
          new_price: number
          notice_sent_at?: string | null
          old_price: number
          percentage_change?: number | null
          price_difference?: number | null
          published_at?: string | null
          reason?: string | null
          reminder_1month_sent_at?: string | null
          reminder_1week_sent_at?: string | null
          service_package_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          affected_customers_count?: number | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          customer_message?: string | null
          effective_date?: string
          id?: string
          new_customers_count?: number | null
          new_price?: number
          notice_sent_at?: string | null
          old_price?: number
          percentage_change?: number | null
          price_difference?: number | null
          published_at?: string | null
          reason?: string | null
          reminder_1month_sent_at?: string | null
          reminder_1week_sent_at?: string | null
          service_package_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_changes_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_changes_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_changes_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_changes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_changes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_changes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_changes_service_package_id_fkey"
            columns: ["service_package_id"]
            isOneToOne: false
            referencedRelation: "service_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_changes_service_package_id_fkey"
            columns: ["service_package_id"]
            isOneToOne: false
            referencedRelation: "sme_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_changes_service_package_id_fkey"
            columns: ["service_package_id"]
            isOneToOne: false
            referencedRelation: "v_active_service_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_changes_service_package_id_fkey"
            columns: ["service_package_id"]
            isOneToOne: false
            referencedRelation: "v_products_with_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_tiers: {
        Row: {
          created_at: string | null
          discount_percentage: number | null
          id: string
          max_quantity: number | null
          min_quantity: number
          price_zar: number
          product_id: string
          tier_name: string
        }
        Insert: {
          created_at?: string | null
          discount_percentage?: number | null
          id?: string
          max_quantity?: number | null
          min_quantity?: number
          price_zar: number
          product_id: string
          tier_name: string
        }
        Update: {
          created_at?: string | null
          discount_percentage?: number | null
          id?: string
          max_quantity?: number | null
          min_quantity?: number
          price_zar?: number
          product_id?: string
          tier_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_tiers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_addons: {
        Row: {
          active: boolean | null
          compatible_product_categories: string[] | null
          compatible_service_types: string[] | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          price: number
          price_type: string | null
          short_description: string | null
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          compatible_product_categories?: string[] | null
          compatible_service_types?: string[] | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          price: number
          price_type?: string | null
          short_description?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          compatible_product_categories?: string[] | null
          compatible_service_types?: string[] | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          price?: number
          price_type?: string | null
          short_description?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      product_approval_activity_log: {
        Row: {
          action: string
          approval_queue_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          import_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          approval_queue_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          import_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          approval_queue_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          import_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_approval_activity_log_approval_queue_id_fkey"
            columns: ["approval_queue_id"]
            isOneToOne: false
            referencedRelation: "product_approval_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_approval_activity_log_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "product_imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_approval_activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_approval_activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_approval_activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      product_approval_queue: {
        Row: {
          approval_deadline: string | null
          approval_notes: string | null
          assigned_to: string | null
          created_at: string | null
          id: string
          import_id: string | null
          priority: string | null
          product_data: Json
          product_name: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          service_package_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          approval_deadline?: string | null
          approval_notes?: string | null
          assigned_to?: string | null
          created_at?: string | null
          id?: string
          import_id?: string | null
          priority?: string | null
          product_data: Json
          product_name: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_package_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          approval_deadline?: string | null
          approval_notes?: string | null
          assigned_to?: string | null
          created_at?: string | null
          id?: string
          import_id?: string | null
          priority?: string | null
          product_data?: Json
          product_name?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_package_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_approval_queue_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_approval_queue_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_approval_queue_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_approval_queue_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "product_imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_approval_queue_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_approval_queue_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_approval_queue_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_approval_queue_service_package_id_fkey"
            columns: ["service_package_id"]
            isOneToOne: false
            referencedRelation: "service_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_approval_queue_service_package_id_fkey"
            columns: ["service_package_id"]
            isOneToOne: false
            referencedRelation: "sme_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_approval_queue_service_package_id_fkey"
            columns: ["service_package_id"]
            isOneToOne: false
            referencedRelation: "v_active_service_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_approval_queue_service_package_id_fkey"
            columns: ["service_package_id"]
            isOneToOne: false
            referencedRelation: "v_products_with_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_audit_logs: {
        Row: {
          action: string
          change_reason: string | null
          changed_at: string | null
          changed_by: string | null
          changed_by_email: string | null
          changed_by_name: string | null
          changed_fields: string[] | null
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          product_id: string | null
          table_name: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          change_reason?: string | null
          changed_at?: string | null
          changed_by?: string | null
          changed_by_email?: string | null
          changed_by_name?: string | null
          changed_fields?: string[] | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          product_id?: string | null
          table_name?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          change_reason?: string | null
          changed_at?: string | null
          changed_by?: string | null
          changed_by_email?: string | null
          changed_by_name?: string | null
          changed_fields?: string[] | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          product_id?: string | null
          table_name?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_audit_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_bundle_components: {
        Row: {
          amortise_months: number | null
          component_config: Json
          component_role: string
          default_cost_excl: number | null
          default_monthly_excl: number | null
          helios_includes_cpe: boolean
          id: string
          name: string
          package_sku: string | null
          product_line_id: string
          sort_order: number
          source: string
        }
        Insert: {
          amortise_months?: number | null
          component_config?: Json
          component_role: string
          default_cost_excl?: number | null
          default_monthly_excl?: number | null
          helios_includes_cpe?: boolean
          id?: string
          name: string
          package_sku?: string | null
          product_line_id: string
          sort_order?: number
          source: string
        }
        Update: {
          amortise_months?: number | null
          component_config?: Json
          component_role?: string
          default_cost_excl?: number | null
          default_monthly_excl?: number | null
          helios_includes_cpe?: boolean
          id?: string
          name?: string
          package_sku?: string | null
          product_line_id?: string
          sort_order?: number
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_bundle_components_product_line_id_fkey"
            columns: ["product_line_id"]
            isOneToOne: false
            referencedRelation: "product_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      product_commission_config: {
        Row: {
          base_rate: number | null
          commission_model: string
          created_at: string | null
          description: string | null
          effective_from: string | null
          effective_to: string | null
          flat_commission_rate: number | null
          id: string
          is_active: boolean | null
          margin_bonus_rate: number | null
          margin_percentage: number | null
          margin_share_rate: number | null
          monthly_cost: number | null
          monthly_margin: number | null
          monthly_price: number | null
          product_line: string
          product_name: string
          product_sku: string | null
          sort_order: number | null
          updated_at: string | null
          use_tier_config: boolean | null
        }
        Insert: {
          base_rate?: number | null
          commission_model: string
          created_at?: string | null
          description?: string | null
          effective_from?: string | null
          effective_to?: string | null
          flat_commission_rate?: number | null
          id?: string
          is_active?: boolean | null
          margin_bonus_rate?: number | null
          margin_percentage?: number | null
          margin_share_rate?: number | null
          monthly_cost?: number | null
          monthly_margin?: number | null
          monthly_price?: number | null
          product_line: string
          product_name: string
          product_sku?: string | null
          sort_order?: number | null
          updated_at?: string | null
          use_tier_config?: boolean | null
        }
        Update: {
          base_rate?: number | null
          commission_model?: string
          created_at?: string | null
          description?: string | null
          effective_from?: string | null
          effective_to?: string | null
          flat_commission_rate?: number | null
          id?: string
          is_active?: boolean | null
          margin_bonus_rate?: number | null
          margin_percentage?: number | null
          margin_share_rate?: number | null
          monthly_cost?: number | null
          monthly_margin?: number | null
          monthly_price?: number | null
          product_line?: string
          product_name?: string
          product_sku?: string | null
          sort_order?: number | null
          updated_at?: string | null
          use_tier_config?: boolean | null
        }
        Relationships: []
      }
      product_competitor_matches: {
        Row: {
          competitor_product_id: string
          created_at: string | null
          id: string
          match_confidence: number | null
          match_method: string | null
          matched_by: string | null
          notes: string | null
          product_id: string
          product_type: string
          updated_at: string | null
        }
        Insert: {
          competitor_product_id: string
          created_at?: string | null
          id?: string
          match_confidence?: number | null
          match_method?: string | null
          matched_by?: string | null
          notes?: string | null
          product_id: string
          product_type: string
          updated_at?: string | null
        }
        Update: {
          competitor_product_id?: string
          created_at?: string | null
          id?: string
          match_confidence?: number | null
          match_method?: string | null
          matched_by?: string | null
          notes?: string | null
          product_id?: string
          product_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_competitor_matches_competitor_product_id_fkey"
            columns: ["competitor_product_id"]
            isOneToOne: false
            referencedRelation: "competitor_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_competitor_matches_competitor_product_id_fkey"
            columns: ["competitor_product_id"]
            isOneToOne: false
            referencedRelation: "v_competitor_price_comparison"
            referencedColumns: ["competitor_product_id"]
          },
        ]
      }
      product_cost_components: {
        Row: {
          amortisation_months: number | null
          amortised_monthly_cost: number | null
          category: Database["public"]["Enums"]["cost_component_category"]
          cost_amount: number
          created_at: string | null
          description: string | null
          hardware_dealer_cost: number | null
          hardware_model: string | null
          hardware_retail_value: number | null
          id: string
          is_optional: boolean | null
          is_visible_to_customer: boolean | null
          metadata: Json | null
          name: string
          notes: string | null
          package_id: string
          recurrence: Database["public"]["Enums"]["cost_recurrence_type"]
          sort_order: number | null
          supplier_name: string | null
          supplier_product_id: string | null
          supplier_reference: string | null
          unit_count: number | null
          updated_at: string | null
        }
        Insert: {
          amortisation_months?: number | null
          amortised_monthly_cost?: number | null
          category?: Database["public"]["Enums"]["cost_component_category"]
          cost_amount?: number
          created_at?: string | null
          description?: string | null
          hardware_dealer_cost?: number | null
          hardware_model?: string | null
          hardware_retail_value?: number | null
          id?: string
          is_optional?: boolean | null
          is_visible_to_customer?: boolean | null
          metadata?: Json | null
          name: string
          notes?: string | null
          package_id: string
          recurrence?: Database["public"]["Enums"]["cost_recurrence_type"]
          sort_order?: number | null
          supplier_name?: string | null
          supplier_product_id?: string | null
          supplier_reference?: string | null
          unit_count?: number | null
          updated_at?: string | null
        }
        Update: {
          amortisation_months?: number | null
          amortised_monthly_cost?: number | null
          category?: Database["public"]["Enums"]["cost_component_category"]
          cost_amount?: number
          created_at?: string | null
          description?: string | null
          hardware_dealer_cost?: number | null
          hardware_model?: string | null
          hardware_retail_value?: number | null
          id?: string
          is_optional?: boolean | null
          is_visible_to_customer?: boolean | null
          metadata?: Json | null
          name?: string
          notes?: string | null
          package_id?: string
          recurrence?: Database["public"]["Enums"]["cost_recurrence_type"]
          sort_order?: number | null
          supplier_name?: string | null
          supplier_product_id?: string | null
          supplier_reference?: string | null
          unit_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_cost_components_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "service_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_cost_components_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "sme_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_cost_components_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "v_active_service_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_cost_components_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "v_products_with_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_cost_components_supplier_product_id_fkey"
            columns: ["supplier_product_id"]
            isOneToOne: false
            referencedRelation: "supplier_products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_direct_costs: {
        Row: {
          cost_amount_zar: number
          cost_percentage: number | null
          cost_type: string
          created_at: string | null
          effective_date: string
          id: string
          product_id: string
        }
        Insert: {
          cost_amount_zar: number
          cost_percentage?: number | null
          cost_type: string
          created_at?: string | null
          effective_date: string
          id?: string
          product_id: string
        }
        Update: {
          cost_amount_zar?: number
          cost_percentage?: number | null
          cost_type?: string
          created_at?: string | null
          effective_date?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_direct_costs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_imports: {
        Row: {
          created_at: string | null
          id: string
          import_date: string | null
          imported_by: string | null
          metadata: Json | null
          notes: string | null
          product_category: string
          source_file: string
          status: string
          total_products: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          import_date?: string | null
          imported_by?: string | null
          metadata?: Json | null
          notes?: string | null
          product_category: string
          source_file: string
          status?: string
          total_products?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          import_date?: string | null
          imported_by?: string | null
          metadata?: Json | null
          notes?: string | null
          product_category?: string
          source_file?: string
          status?: string
          total_products?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_imports_imported_by_fkey"
            columns: ["imported_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_imports_imported_by_fkey"
            columns: ["imported_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_imports_imported_by_fkey"
            columns: ["imported_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      product_integrations: {
        Row: {
          admin_product_id: string | null
          created_at: string | null
          id: string
          last_rate_limit_at: string | null
          last_retry_at: string | null
          last_sync_error: string | null
          last_synced_at: string | null
          next_retry_at: string | null
          rate_limit_hits: Json | null
          retry_count: number
          service_package_id: string
          sync_error_details: Json | null
          sync_status: string
          updated_at: string | null
          zoho_billing_hardware_item_id: string | null
          zoho_billing_item_id: string | null
          zoho_billing_last_sync_error: string | null
          zoho_billing_last_synced_at: string | null
          zoho_billing_plan_id: string | null
          zoho_billing_sync_status: string | null
          zoho_crm_last_sync_error: string | null
          zoho_crm_last_synced_at: string | null
          zoho_crm_product_id: string | null
          zoho_crm_sync_status: string | null
        }
        Insert: {
          admin_product_id?: string | null
          created_at?: string | null
          id?: string
          last_rate_limit_at?: string | null
          last_retry_at?: string | null
          last_sync_error?: string | null
          last_synced_at?: string | null
          next_retry_at?: string | null
          rate_limit_hits?: Json | null
          retry_count?: number
          service_package_id: string
          sync_error_details?: Json | null
          sync_status?: string
          updated_at?: string | null
          zoho_billing_hardware_item_id?: string | null
          zoho_billing_item_id?: string | null
          zoho_billing_last_sync_error?: string | null
          zoho_billing_last_synced_at?: string | null
          zoho_billing_plan_id?: string | null
          zoho_billing_sync_status?: string | null
          zoho_crm_last_sync_error?: string | null
          zoho_crm_last_synced_at?: string | null
          zoho_crm_product_id?: string | null
          zoho_crm_sync_status?: string | null
        }
        Update: {
          admin_product_id?: string | null
          created_at?: string | null
          id?: string
          last_rate_limit_at?: string | null
          last_retry_at?: string | null
          last_sync_error?: string | null
          last_synced_at?: string | null
          next_retry_at?: string | null
          rate_limit_hits?: Json | null
          retry_count?: number
          service_package_id?: string
          sync_error_details?: Json | null
          sync_status?: string
          updated_at?: string | null
          zoho_billing_hardware_item_id?: string | null
          zoho_billing_item_id?: string | null
          zoho_billing_last_sync_error?: string | null
          zoho_billing_last_synced_at?: string | null
          zoho_billing_plan_id?: string | null
          zoho_billing_sync_status?: string | null
          zoho_crm_last_sync_error?: string | null
          zoho_crm_last_synced_at?: string | null
          zoho_crm_product_id?: string | null
          zoho_crm_sync_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_integrations_admin_product_id_fkey"
            columns: ["admin_product_id"]
            isOneToOne: false
            referencedRelation: "admin_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_integrations_service_package_id_fkey"
            columns: ["service_package_id"]
            isOneToOne: true
            referencedRelation: "service_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_integrations_service_package_id_fkey"
            columns: ["service_package_id"]
            isOneToOne: true
            referencedRelation: "sme_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_integrations_service_package_id_fkey"
            columns: ["service_package_id"]
            isOneToOne: true
            referencedRelation: "v_active_service_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_integrations_service_package_id_fkey"
            columns: ["service_package_id"]
            isOneToOne: true
            referencedRelation: "v_products_with_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_line_skus: {
        Row: {
          id: string
          product_line_id: string
          sku: string | null
          source_id: string
          source_table: string
        }
        Insert: {
          id?: string
          product_line_id: string
          sku?: string | null
          source_id: string
          source_table: string
        }
        Update: {
          id?: string
          product_line_id?: string
          sku?: string | null
          source_id?: string
          source_table?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_line_skus_product_line_id_fkey"
            columns: ["product_line_id"]
            isOneToOne: false
            referencedRelation: "product_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      product_lines: {
        Row: {
          billed_incl_vat_zar: number | null
          brd_path: string | null
          brd_required: boolean
          brd_status: string
          brd_version: string | null
          channel: string
          code: string
          cps_path: string | null
          cps_status: string
          cps_version: string | null
          created_at: string
          default_connectivity_cost_excl: number | null
          default_helios_includes_cpe: boolean
          default_m365_seats: number
          default_term_months: number
          finance_approval_notes: string | null
          finance_approved_at: string | null
          finance_approved_by: string | null
          fsd_path: string | null
          fsd_required: boolean
          fsd_status: string
          fsd_version: string | null
          gate1_eligible: boolean
          id: string
          lifecycle_stage: string
          list_arpu_incl_vat_zar: number | null
          list_arpu_zar: number | null
          live_mrr_match: string | null
          min_margin_pct: number
          msc_flag: boolean
          name: string
          notes: string | null
          price_drift_notes: string | null
          published_defaults: Json | null
          published_package_id: string | null
          revenue_model: string
          sales_blurb: string | null
          sellability: string
          submitted_for_approval_at: string | null
          submitted_for_approval_by: string | null
          target_market: string | null
          updated_at: string
        }
        Insert: {
          billed_incl_vat_zar?: number | null
          brd_path?: string | null
          brd_required?: boolean
          brd_status?: string
          brd_version?: string | null
          channel?: string
          code: string
          cps_path?: string | null
          cps_status?: string
          cps_version?: string | null
          created_at?: string
          default_connectivity_cost_excl?: number | null
          default_helios_includes_cpe?: boolean
          default_m365_seats?: number
          default_term_months?: number
          finance_approval_notes?: string | null
          finance_approved_at?: string | null
          finance_approved_by?: string | null
          fsd_path?: string | null
          fsd_required?: boolean
          fsd_status?: string
          fsd_version?: string | null
          gate1_eligible?: boolean
          id?: string
          lifecycle_stage?: string
          list_arpu_incl_vat_zar?: number | null
          list_arpu_zar?: number | null
          live_mrr_match?: string | null
          min_margin_pct?: number
          msc_flag?: boolean
          name: string
          notes?: string | null
          price_drift_notes?: string | null
          published_defaults?: Json | null
          published_package_id?: string | null
          revenue_model?: string
          sales_blurb?: string | null
          sellability?: string
          submitted_for_approval_at?: string | null
          submitted_for_approval_by?: string | null
          target_market?: string | null
          updated_at?: string
        }
        Update: {
          billed_incl_vat_zar?: number | null
          brd_path?: string | null
          brd_required?: boolean
          brd_status?: string
          brd_version?: string | null
          channel?: string
          code?: string
          cps_path?: string | null
          cps_status?: string
          cps_version?: string | null
          created_at?: string
          default_connectivity_cost_excl?: number | null
          default_helios_includes_cpe?: boolean
          default_m365_seats?: number
          default_term_months?: number
          finance_approval_notes?: string | null
          finance_approved_at?: string | null
          finance_approved_by?: string | null
          fsd_path?: string | null
          fsd_required?: boolean
          fsd_status?: string
          fsd_version?: string | null
          gate1_eligible?: boolean
          id?: string
          lifecycle_stage?: string
          list_arpu_incl_vat_zar?: number | null
          list_arpu_zar?: number | null
          live_mrr_match?: string | null
          min_margin_pct?: number
          msc_flag?: boolean
          name?: string
          notes?: string | null
          price_drift_notes?: string | null
          published_defaults?: Json | null
          published_package_id?: string | null
          revenue_model?: string
          sales_blurb?: string | null
          sellability?: string
          submitted_for_approval_at?: string | null
          submitted_for_approval_by?: string | null
          target_market?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_lines_published_package_id_fkey"
            columns: ["published_package_id"]
            isOneToOne: false
            referencedRelation: "service_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_lines_published_package_id_fkey"
            columns: ["published_package_id"]
            isOneToOne: false
            referencedRelation: "sme_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_lines_published_package_id_fkey"
            columns: ["published_package_id"]
            isOneToOne: false
            referencedRelation: "v_active_service_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_lines_published_package_id_fkey"
            columns: ["published_package_id"]
            isOneToOne: false
            referencedRelation: "v_products_with_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_relationships: {
        Row: {
          created_at: string | null
          id: string
          is_mandatory: boolean | null
          max_quantity: number | null
          min_quantity: number | null
          price_modifier: number | null
          relationship_type: Database["public"]["Enums"]["product_relationship_type"]
          sort_order: number | null
          source_product_id: string
          target_product_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_mandatory?: boolean | null
          max_quantity?: number | null
          min_quantity?: number | null
          price_modifier?: number | null
          relationship_type: Database["public"]["Enums"]["product_relationship_type"]
          sort_order?: number | null
          source_product_id: string
          target_product_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_mandatory?: boolean | null
          max_quantity?: number | null
          min_quantity?: number | null
          price_modifier?: number | null
          relationship_type?: Database["public"]["Enums"]["product_relationship_type"]
          sort_order?: number | null
          source_product_id?: string
          target_product_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_relationships_source_product_id_fkey"
            columns: ["source_product_id"]
            isOneToOne: false
            referencedRelation: "admin_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_relationships_target_product_id_fkey"
            columns: ["target_product_id"]
            isOneToOne: false
            referencedRelation: "admin_products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_rules_config: {
        Row: {
          config: Json
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          config?: Json
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          config?: Json
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_rules_config_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_rules_config_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_rules_config_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      product_wholesale_costs: {
        Row: {
          created_at: string
          effective_date: string
          gross_margin_pct: number | null
          id: string
          notes: string | null
          product_name: string
          retail_price: number
          service_package_id: string | null
          updated_at: string
          wholesale_mrc: number
          wholesale_nrc: number | null
          wholesale_provider: string
        }
        Insert: {
          created_at?: string
          effective_date?: string
          gross_margin_pct?: number | null
          id?: string
          notes?: string | null
          product_name: string
          retail_price: number
          service_package_id?: string | null
          updated_at?: string
          wholesale_mrc: number
          wholesale_nrc?: number | null
          wholesale_provider: string
        }
        Update: {
          created_at?: string
          effective_date?: string
          gross_margin_pct?: number | null
          id?: string
          notes?: string | null
          product_name?: string
          retail_price?: number
          service_package_id?: string | null
          updated_at?: string
          wholesale_mrc?: number
          wholesale_nrc?: number | null
          wholesale_provider?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          base_price_zar: number
          bundle_components: string[] | null
          category: string
          cost_price_zar: number
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          is_popular: boolean | null
          metadata: Json | null
          name: string
          pricing: Json | null
          service_type: string | null
          sku: string
          slug: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          base_price_zar: number
          bundle_components?: string[] | null
          category: string
          cost_price_zar: number
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_popular?: boolean | null
          metadata?: Json | null
          name: string
          pricing?: Json | null
          service_type?: string | null
          sku: string
          slug?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          base_price_zar?: number
          bundle_components?: string[] | null
          category?: string
          cost_price_zar?: number
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_popular?: boolean | null
          metadata?: Json | null
          name?: string
          pricing?: Json | null
          service_type?: string | null
          sku?: string
          slug?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_costs: {
        Row: {
          actual_amount_zar: number | null
          budgeted_amount_zar: number
          cost_category: string
          cost_date: string
          created_at: string | null
          description: string
          id: string
          project_id: string
          variance_zar: number | null
        }
        Insert: {
          actual_amount_zar?: number | null
          budgeted_amount_zar: number
          cost_category: string
          cost_date: string
          created_at?: string | null
          description: string
          id?: string
          project_id: string
          variance_zar?: number | null
        }
        Update: {
          actual_amount_zar?: number | null
          budgeted_amount_zar?: number
          cost_category?: string
          cost_date?: string
          created_at?: string | null
          description?: string
          id?: string
          project_id?: string
          variance_zar?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_costs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "installation_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      promotion_usage: {
        Row: {
          ambassador_code: string | null
          customer_id: string | null
          discount_amount: number | null
          final_amount: number | null
          id: string
          order_id: string | null
          order_type: string | null
          original_amount: number | null
          partner_id: string | null
          promotion_id: string
          source: string | null
          used_at: string | null
        }
        Insert: {
          ambassador_code?: string | null
          customer_id?: string | null
          discount_amount?: number | null
          final_amount?: number | null
          id?: string
          order_id?: string | null
          order_type?: string | null
          original_amount?: number | null
          partner_id?: string | null
          promotion_id: string
          source?: string | null
          used_at?: string | null
        }
        Update: {
          ambassador_code?: string | null
          customer_id?: string | null
          discount_amount?: number | null
          final_amount?: number | null
          id?: string
          order_id?: string | null
          order_type?: string | null
          original_amount?: number | null
          partner_id?: string | null
          promotion_id?: string
          source?: string | null
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promotion_usage_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_dashboard_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "promotion_usage_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_usage_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_notification_engagement"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "promotion_usage_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_usage_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "v_partner_commission_tier_analysis"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "promotion_usage_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          banner_image_url: string | null
          category: string | null
          created_at: string | null
          created_by: string | null
          customer_type: string | null
          description: string | null
          discount_type: string
          discount_value: number
          display_on_homepage: boolean | null
          display_on_product: boolean | null
          id: string
          image_url: string | null
          max_per_customer: number | null
          max_usage: number | null
          name: string
          product_category: string | null
          product_id: string | null
          promo_code: string | null
          status: string
          updated_at: string | null
          usage_count: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          banner_image_url?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_type?: string | null
          description?: string | null
          discount_type: string
          discount_value?: number
          display_on_homepage?: boolean | null
          display_on_product?: boolean | null
          id?: string
          image_url?: string | null
          max_per_customer?: number | null
          max_usage?: number | null
          name: string
          product_category?: string | null
          product_id?: string | null
          promo_code?: string | null
          status?: string
          updated_at?: string | null
          usage_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          banner_image_url?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_type?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          display_on_homepage?: boolean | null
          display_on_product?: boolean | null
          id?: string
          image_url?: string | null
          max_per_customer?: number | null
          max_usage?: number | null
          name?: string
          product_category?: string | null
          product_id?: string | null
          promo_code?: string | null
          status?: string
          updated_at?: string | null
          usage_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promotions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_api_calls: {
        Row: {
          cache_hit: boolean
          created_at: string
          duration_ms: number
          error_code: string | null
          id: string
          integration_slug: string
          operation: string
          province: string | null
          success: boolean
        }
        Insert: {
          cache_hit?: boolean
          created_at?: string
          duration_ms: number
          error_code?: string | null
          id?: string
          integration_slug: string
          operation: string
          province?: string | null
          success: boolean
        }
        Update: {
          cache_hit?: boolean
          created_at?: string
          duration_ms?: number
          error_code?: string | null
          id?: string
          integration_slug?: string
          operation?: string
          province?: string | null
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "provider_api_calls_integration_slug_fkey"
            columns: ["integration_slug"]
            isOneToOne: false
            referencedRelation: "integration_registry"
            referencedColumns: ["slug"]
          },
        ]
      }
      provider_api_logs: {
        Row: {
          address: string | null
          coordinates: unknown
          created_at: string | null
          endpoint_type: string | null
          error_code: string | null
          error_message: string | null
          id: string
          provider_id: string | null
          request_body: Json | null
          request_headers: Json | null
          request_method: string | null
          request_url: string
          response_body: Json | null
          response_status: number | null
          response_time_ms: number | null
          success: boolean
        }
        Insert: {
          address?: string | null
          coordinates?: unknown
          created_at?: string | null
          endpoint_type?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          provider_id?: string | null
          request_body?: Json | null
          request_headers?: Json | null
          request_method?: string | null
          request_url: string
          response_body?: Json | null
          response_status?: number | null
          response_time_ms?: number | null
          success: boolean
        }
        Update: {
          address?: string | null
          coordinates?: unknown
          created_at?: string | null
          endpoint_type?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          provider_id?: string | null
          request_body?: Json | null
          request_headers?: Json | null
          request_method?: string | null
          request_url?: string
          response_body?: Json | null
          response_status?: number | null
          response_time_ms?: number | null
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "provider_api_logs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "fttb_network_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_api_logs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "v_active_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_api_logs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "v_providers_with_logos"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_configuration: {
        Row: {
          config_key: string
          config_value: Json
          created_at: string
          description: string | null
          id: string
          updated_at: string
        }
        Insert: {
          config_key: string
          config_value: Json
          created_at?: string
          description?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          config_key?: string
          config_value?: Json
          created_at?: string
          description?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      provider_health_metrics: {
        Row: {
          avg_response_time_ms: number | null
          coverage_found: number | null
          coverage_not_found: number | null
          created_at: string | null
          error_count: number | null
          failed_requests: number | null
          id: string
          max_response_time_ms: number | null
          min_response_time_ms: number | null
          p50_response_time_ms: number | null
          p95_response_time_ms: number | null
          p99_response_time_ms: number | null
          period_end: string
          period_start: string
          period_type: string
          provider_code: string
          success_rate: number | null
          successful_requests: number | null
          total_requests: number | null
          unique_error_types: number | null
          updated_at: string | null
        }
        Insert: {
          avg_response_time_ms?: number | null
          coverage_found?: number | null
          coverage_not_found?: number | null
          created_at?: string | null
          error_count?: number | null
          failed_requests?: number | null
          id?: string
          max_response_time_ms?: number | null
          min_response_time_ms?: number | null
          p50_response_time_ms?: number | null
          p95_response_time_ms?: number | null
          p99_response_time_ms?: number | null
          period_end: string
          period_start: string
          period_type: string
          provider_code: string
          success_rate?: number | null
          successful_requests?: number | null
          total_requests?: number | null
          unique_error_types?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_response_time_ms?: number | null
          coverage_found?: number | null
          coverage_not_found?: number | null
          created_at?: string | null
          error_count?: number | null
          failed_requests?: number | null
          id?: string
          max_response_time_ms?: number | null
          min_response_time_ms?: number | null
          p50_response_time_ms?: number | null
          p95_response_time_ms?: number | null
          p99_response_time_ms?: number | null
          period_end?: string
          period_start?: string
          period_type?: string
          provider_code?: string
          success_rate?: number | null
          successful_requests?: number | null
          total_requests?: number | null
          unique_error_types?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      provider_logos: {
        Row: {
          created_at: string
          dimensions: Json | null
          file_path: string
          file_size: number
          filename: string
          id: string
          mime_type: string
          original_name: string
          provider_id: string
        }
        Insert: {
          created_at?: string
          dimensions?: Json | null
          file_path: string
          file_size: number
          filename: string
          id?: string
          mime_type: string
          original_name: string
          provider_id: string
        }
        Update: {
          created_at?: string
          dimensions?: Json | null
          file_path?: string
          file_size?: number
          filename?: string
          id?: string
          mime_type?: string
          original_name?: string
          provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_logos_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "network_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_product_mappings: {
        Row: {
          active: boolean | null
          circletel_product_id: string | null
          created_at: string | null
          id: string
          mapping_config: Json | null
          priority: number | null
          provider_code: string
          provider_service_type: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          circletel_product_id?: string | null
          created_at?: string | null
          id?: string
          mapping_config?: Json | null
          priority?: number | null
          provider_code: string
          provider_service_type: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          circletel_product_id?: string | null
          created_at?: string | null
          id?: string
          mapping_config?: Json | null
          priority?: number | null
          provider_code?: string
          provider_service_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      provider_status_logs: {
        Row: {
          check_source: string | null
          checked_at: string
          created_at: string
          details: Json | null
          id: string
          latency_ms: number | null
          packet_loss_percent: number | null
          provider_name: string
          status: string
        }
        Insert: {
          check_source?: string | null
          checked_at?: string
          created_at?: string
          details?: Json | null
          id?: string
          latency_ms?: number | null
          packet_loss_percent?: number | null
          provider_name: string
          status: string
        }
        Update: {
          check_source?: string | null
          checked_at?: string
          created_at?: string
          details?: Json | null
          id?: string
          latency_ms?: number | null
          packet_loss_percent?: number | null
          provider_name?: string
          status?: string
        }
        Relationships: []
      }
      quote_acceptance_links: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          quote_id: string
          token: string
          view_count: number | null
          viewed_at: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          quote_id: string
          token?: string
          view_count?: number | null
          viewed_at?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          quote_id?: string
          token?: string
          view_count?: number | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_acceptance_links_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "business_quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_acceptance_links_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quote_analytics"
            referencedColumns: ["quote_id"]
          },
        ]
      }
      quote_notification_log: {
        Row: {
          agent_id: string | null
          body: string
          created_at: string
          delivered_at: string | null
          delivery_type: Database["public"]["Enums"]["notification_delivery_type"]
          error_message: string | null
          event: Database["public"]["Enums"]["quote_notification_event"]
          id: string
          quote_id: string | null
          recipient_email: string | null
          recipient_phone: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_delivery_status"]
          subject: string | null
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          body: string
          created_at?: string
          delivered_at?: string | null
          delivery_type: Database["public"]["Enums"]["notification_delivery_type"]
          error_message?: string | null
          event: Database["public"]["Enums"]["quote_notification_event"]
          id?: string
          quote_id?: string | null
          recipient_email?: string | null
          recipient_phone?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_delivery_status"]
          subject?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          body?: string
          created_at?: string
          delivered_at?: string | null
          delivery_type?: Database["public"]["Enums"]["notification_delivery_type"]
          error_message?: string | null
          event?: Database["public"]["Enums"]["quote_notification_event"]
          id?: string
          quote_id?: string | null
          recipient_email?: string | null
          recipient_phone?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_delivery_status"]
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_notification_log_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "sales_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_notification_log_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "business_quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_notification_log_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quote_analytics"
            referencedColumns: ["quote_id"]
          },
        ]
      }
      quote_notification_preferences: {
        Row: {
          created_at: string
          email_enabled: boolean | null
          event: Database["public"]["Enums"]["quote_notification_event"]
          id: string
          push_enabled: boolean | null
          sms_enabled: boolean | null
          updated_at: string
          user_id: string
          user_type: string
        }
        Insert: {
          created_at?: string
          email_enabled?: boolean | null
          event: Database["public"]["Enums"]["quote_notification_event"]
          id?: string
          push_enabled?: boolean | null
          sms_enabled?: boolean | null
          updated_at?: string
          user_id: string
          user_type: string
        }
        Update: {
          created_at?: string
          email_enabled?: boolean | null
          event?: Database["public"]["Enums"]["quote_notification_event"]
          id?: string
          push_enabled?: boolean | null
          sms_enabled?: boolean | null
          updated_at?: string
          user_id?: string
          user_type?: string
        }
        Relationships: []
      }
      quote_notification_templates: {
        Row: {
          body: string
          created_at: string
          delivery_type: Database["public"]["Enums"]["notification_delivery_type"]
          enabled: boolean | null
          event: Database["public"]["Enums"]["quote_notification_event"]
          id: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          delivery_type: Database["public"]["Enums"]["notification_delivery_type"]
          enabled?: boolean | null
          event: Database["public"]["Enums"]["quote_notification_event"]
          id?: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          delivery_type?: Database["public"]["Enums"]["notification_delivery_type"]
          enabled?: boolean | null
          event?: Database["public"]["Enums"]["quote_notification_event"]
          id?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      quote_tracking: {
        Row: {
          admin_user_id: string | null
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          quote_id: string
          referrer: string | null
          session_id: string | null
          time_spent_seconds: number | null
          updated_at: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          viewer_email: string | null
          viewer_ip: string | null
          viewer_location: Json | null
          viewer_name: string | null
          viewer_user_agent: string | null
        }
        Insert: {
          admin_user_id?: string | null
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          quote_id: string
          referrer?: string | null
          session_id?: string | null
          time_spent_seconds?: number | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          viewer_email?: string | null
          viewer_ip?: string | null
          viewer_location?: Json | null
          viewer_name?: string | null
          viewer_user_agent?: string | null
        }
        Update: {
          admin_user_id?: string | null
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          quote_id?: string
          referrer?: string | null
          session_id?: string | null
          time_spent_seconds?: number | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          viewer_email?: string | null
          viewer_ip?: string | null
          viewer_location?: Json | null
          viewer_name?: string | null
          viewer_user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_tracking_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_tracking_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_tracking_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_tracking_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "business_quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_tracking_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quote_analytics"
            referencedColumns: ["quote_id"]
          },
        ]
      }
      reconciliation_queue: {
        Row: {
          amount: number
          created_at: string
          currency: string
          final_customer_id: string | null
          final_invoice_id: string | null
          id: string
          match_confidence: number | null
          match_method: string | null
          payer_email: string | null
          payer_name: string | null
          payer_reference: string | null
          payment_method: string | null
          payment_transaction_id: string | null
          raw_data: Json | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          source: string
          source_date: string | null
          source_reference: string
          status: string
          suggested_customer_id: string | null
          suggested_invoice_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          final_customer_id?: string | null
          final_invoice_id?: string | null
          id?: string
          match_confidence?: number | null
          match_method?: string | null
          payer_email?: string | null
          payer_name?: string | null
          payer_reference?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          raw_data?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          source: string
          source_date?: string | null
          source_reference: string
          status?: string
          suggested_customer_id?: string | null
          suggested_invoice_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          final_customer_id?: string | null
          final_invoice_id?: string | null
          id?: string
          match_confidence?: number | null
          match_method?: string | null
          payer_email?: string | null
          payer_name?: string | null
          payer_reference?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          raw_data?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          source?: string
          source_date?: string | null
          source_reference?: string
          status?: string
          suggested_customer_id?: string | null
          suggested_invoice_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reconciliation_queue_final_customer_id_fkey"
            columns: ["final_customer_id"]
            isOneToOne: false
            referencedRelation: "customer_dashboard_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "reconciliation_queue_final_customer_id_fkey"
            columns: ["final_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_queue_final_customer_id_fkey"
            columns: ["final_customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_notification_engagement"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "reconciliation_queue_final_invoice_id_fkey"
            columns: ["final_invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_queue_payment_transaction_id_fkey"
            columns: ["payment_transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_queue_payment_transaction_id_fkey"
            columns: ["payment_transaction_id"]
            isOneToOne: false
            referencedRelation: "v_recent_payment_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_queue_suggested_customer_id_fkey"
            columns: ["suggested_customer_id"]
            isOneToOne: false
            referencedRelation: "customer_dashboard_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "reconciliation_queue_suggested_customer_id_fkey"
            columns: ["suggested_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_queue_suggested_customer_id_fkey"
            columns: ["suggested_customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_notification_engagement"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "reconciliation_queue_suggested_invoice_id_fkey"
            columns: ["suggested_invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string
          id: string
          notification_sent: boolean | null
          notification_sent_at: string | null
          notify_email: boolean | null
          notify_in_app: boolean | null
          recurrence_pattern: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          reminder_type: string
          snoozed_until: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date: string
          id?: string
          notification_sent?: boolean | null
          notification_sent_at?: string | null
          notify_email?: boolean | null
          notify_in_app?: boolean | null
          recurrence_pattern?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          reminder_type: string
          snoozed_until?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string
          id?: string
          notification_sent?: boolean | null
          notification_sent_at?: string | null
          notify_email?: boolean | null
          notify_in_app?: boolean | null
          recurrence_pattern?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          reminder_type?: string
          snoozed_until?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      rica_submissions: {
        Row: {
          approved_at: string | null
          created_at: string | null
          icasa_response: Json | null
          icasa_tracking_id: string | null
          iccid: string[] | null
          id: string
          kyc_session_id: string | null
          order_id: string | null
          status: string | null
          submitted_at: string | null
          submitted_data: Json | null
        }
        Insert: {
          approved_at?: string | null
          created_at?: string | null
          icasa_response?: Json | null
          icasa_tracking_id?: string | null
          iccid?: string[] | null
          id?: string
          kyc_session_id?: string | null
          order_id?: string | null
          status?: string | null
          submitted_at?: string | null
          submitted_data?: Json | null
        }
        Update: {
          approved_at?: string | null
          created_at?: string | null
          icasa_response?: Json | null
          icasa_tracking_id?: string | null
          iccid?: string[] | null
          id?: string
          kyc_session_id?: string | null
          order_id?: string | null
          status?: string | null
          submitted_at?: string | null
          submitted_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "rica_submissions_kyc_session_id_fkey"
            columns: ["kyc_session_id"]
            isOneToOne: false
            referencedRelation: "kyc_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rica_submissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "consumer_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rica_submissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_order_compliance_summary"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "rica_submissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_order_notifications"
            referencedColumns: ["order_id"]
          },
        ]
      }
      role_templates: {
        Row: {
          color: string | null
          created_at: string | null
          department: string
          description: string
          icon: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          level: string
          name: string
          permissions: Json
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          department: string
          description: string
          icon?: string | null
          id: string
          is_active?: boolean | null
          is_default?: boolean | null
          level: string
          name: string
          permissions?: Json
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          department?: string
          description?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          level?: string
          name?: string
          permissions?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      ruijie_audit_log: {
        Row: {
          action: string
          action_detail: Json | null
          admin_user_id: string | null
          created_at: string | null
          device_sn: string | null
          error_message: string | null
          id: string
          ip_address: string | null
          status: string | null
        }
        Insert: {
          action: string
          action_detail?: Json | null
          admin_user_id?: string | null
          created_at?: string | null
          device_sn?: string | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          status?: string | null
        }
        Update: {
          action?: string
          action_detail?: Json | null
          admin_user_id?: string | null
          created_at?: string | null
          device_sn?: string | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ruijie_audit_log_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ruijie_audit_log_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ruijie_audit_log_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      ruijie_device_cache: {
        Row: {
          config_status: string | null
          corporate_site_id: string | null
          cpu_usage: number | null
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          customer_order_id: string | null
          customer_phone: string | null
          device_name: string
          egress_ip: string | null
          firmware_version: string | null
          group_id: string | null
          group_name: string | null
          last_seen_at: string | null
          mac_address: string | null
          management_ip: string | null
          memory_usage: number | null
          mock_data: boolean | null
          model: string | null
          online_clients: number | null
          project_id: string | null
          radio_2g_channel: number | null
          radio_2g_utilization: number | null
          radio_5g_channel: number | null
          radio_5g_utilization: number | null
          raw_json: Json | null
          sn: string
          status: string | null
          support_notes: string | null
          support_notes_updated_at: string | null
          support_notes_updated_by: string | null
          synced_at: string | null
          updated_at: string | null
          uptime_seconds: number | null
          wan_ip: string | null
        }
        Insert: {
          config_status?: string | null
          corporate_site_id?: string | null
          cpu_usage?: number | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_order_id?: string | null
          customer_phone?: string | null
          device_name: string
          egress_ip?: string | null
          firmware_version?: string | null
          group_id?: string | null
          group_name?: string | null
          last_seen_at?: string | null
          mac_address?: string | null
          management_ip?: string | null
          memory_usage?: number | null
          mock_data?: boolean | null
          model?: string | null
          online_clients?: number | null
          project_id?: string | null
          radio_2g_channel?: number | null
          radio_2g_utilization?: number | null
          radio_5g_channel?: number | null
          radio_5g_utilization?: number | null
          raw_json?: Json | null
          sn: string
          status?: string | null
          support_notes?: string | null
          support_notes_updated_at?: string | null
          support_notes_updated_by?: string | null
          synced_at?: string | null
          updated_at?: string | null
          uptime_seconds?: number | null
          wan_ip?: string | null
        }
        Update: {
          config_status?: string | null
          corporate_site_id?: string | null
          cpu_usage?: number | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_order_id?: string | null
          customer_phone?: string | null
          device_name?: string
          egress_ip?: string | null
          firmware_version?: string | null
          group_id?: string | null
          group_name?: string | null
          last_seen_at?: string | null
          mac_address?: string | null
          management_ip?: string | null
          memory_usage?: number | null
          mock_data?: boolean | null
          model?: string | null
          online_clients?: number | null
          project_id?: string | null
          radio_2g_channel?: number | null
          radio_2g_utilization?: number | null
          radio_5g_channel?: number | null
          radio_5g_utilization?: number | null
          raw_json?: Json | null
          sn?: string
          status?: string | null
          support_notes?: string | null
          support_notes_updated_at?: string | null
          support_notes_updated_by?: string | null
          synced_at?: string | null
          updated_at?: string | null
          uptime_seconds?: number | null
          wan_ip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ruijie_device_cache_corporate_site_id_fkey"
            columns: ["corporate_site_id"]
            isOneToOne: false
            referencedRelation: "corporate_sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ruijie_device_cache_customer_order_id_fkey"
            columns: ["customer_order_id"]
            isOneToOne: false
            referencedRelation: "consumer_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ruijie_device_cache_customer_order_id_fkey"
            columns: ["customer_order_id"]
            isOneToOne: false
            referencedRelation: "v_order_compliance_summary"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "ruijie_device_cache_customer_order_id_fkey"
            columns: ["customer_order_id"]
            isOneToOne: false
            referencedRelation: "v_order_notifications"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "ruijie_device_cache_support_notes_updated_by_fkey"
            columns: ["support_notes_updated_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ruijie_device_cache_support_notes_updated_by_fkey"
            columns: ["support_notes_updated_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ruijie_device_cache_support_notes_updated_by_fkey"
            columns: ["support_notes_updated_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      ruijie_ssid_sta_sample_state: {
        Row: {
          created_at: string
          device_sn: string
          last_wifi_down: number
          last_wifi_up: number
          mac: string
          sampled_at: string
          ssid: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          device_sn: string
          last_wifi_down?: number
          last_wifi_up?: number
          mac: string
          sampled_at: string
          ssid: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          device_sn?: string
          last_wifi_down?: number
          last_wifi_up?: number
          mac?: string
          sampled_at?: string
          ssid?: string
          updated_at?: string
        }
        Relationships: []
      }
      ruijie_ssid_sta_traffic_rollups: {
        Row: {
          band: string | null
          corporate_site_id: string | null
          created_at: string
          device_sn: string
          hostname: string | null
          hour_bucket: string
          hours_window: number
          id: string
          mac: string
          manufacture: string | null
          rx_bytes: number
          ssid: string
          tx_bytes: number
          updated_at: string
        }
        Insert: {
          band?: string | null
          corporate_site_id?: string | null
          created_at?: string
          device_sn: string
          hostname?: string | null
          hour_bucket: string
          hours_window?: number
          id?: string
          mac: string
          manufacture?: string | null
          rx_bytes?: number
          ssid: string
          tx_bytes?: number
          updated_at?: string
        }
        Update: {
          band?: string | null
          corporate_site_id?: string | null
          created_at?: string
          device_sn?: string
          hostname?: string | null
          hour_bucket?: string
          hours_window?: number
          id?: string
          mac?: string
          manufacture?: string | null
          rx_bytes?: number
          ssid?: string
          tx_bytes?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ruijie_ssid_sta_traffic_rollups_corporate_site_id_fkey"
            columns: ["corporate_site_id"]
            isOneToOne: false
            referencedRelation: "corporate_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      ruijie_ssid_traffic_rollups: {
        Row: {
          corporate_site_id: string | null
          created_at: string
          device_sn: string
          hour_bucket: string
          hours_window: number
          id: string
          rx_bytes: number
          ssid: string
          tx_bytes: number
          updated_at: string
        }
        Insert: {
          corporate_site_id?: string | null
          created_at?: string
          device_sn: string
          hour_bucket: string
          hours_window?: number
          id?: string
          rx_bytes?: number
          ssid: string
          tx_bytes?: number
          updated_at?: string
        }
        Update: {
          corporate_site_id?: string | null
          created_at?: string
          device_sn?: string
          hour_bucket?: string
          hours_window?: number
          id?: string
          rx_bytes?: number
          ssid?: string
          tx_bytes?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ruijie_ssid_traffic_rollups_corporate_site_id_fkey"
            columns: ["corporate_site_id"]
            isOneToOne: false
            referencedRelation: "corporate_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      ruijie_sync_logs: {
        Row: {
          completed_at: string | null
          devices_added: number | null
          devices_fetched: number | null
          devices_updated: number | null
          duration_ms: number | null
          error_message: string | null
          errors: string[] | null
          id: string
          started_at: string | null
          status: string
          triggered_by: string | null
          triggered_by_user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          devices_added?: number | null
          devices_fetched?: number | null
          devices_updated?: number | null
          duration_ms?: number | null
          error_message?: string | null
          errors?: string[] | null
          id?: string
          started_at?: string | null
          status: string
          triggered_by?: string | null
          triggered_by_user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          devices_added?: number | null
          devices_fetched?: number | null
          devices_updated?: number | null
          duration_ms?: number | null
          error_message?: string | null
          errors?: string[] | null
          id?: string
          started_at?: string | null
          status?: string
          triggered_by?: string | null
          triggered_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ruijie_sync_logs_triggered_by_user_id_fkey"
            columns: ["triggered_by_user_id"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ruijie_sync_logs_triggered_by_user_id_fkey"
            columns: ["triggered_by_user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ruijie_sync_logs_triggered_by_user_id_fkey"
            columns: ["triggered_by_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      ruijie_traffic_rollups: {
        Row: {
          avg_rx_bps: number
          avg_tx_bps: number
          captured_at: string
          created_at: string
          device_sn: string
          group_id: string
          group_name: string | null
          hours_window: number
          id: string
          peak_rx_bps: number
          peak_tx_bps: number
          raw_summary: Json | null
          total_rx_bytes: number
          total_tx_bytes: number
        }
        Insert: {
          avg_rx_bps?: number
          avg_tx_bps?: number
          captured_at?: string
          created_at?: string
          device_sn: string
          group_id: string
          group_name?: string | null
          hours_window?: number
          id?: string
          peak_rx_bps?: number
          peak_tx_bps?: number
          raw_summary?: Json | null
          total_rx_bytes?: number
          total_tx_bytes?: number
        }
        Update: {
          avg_rx_bps?: number
          avg_tx_bps?: number
          captured_at?: string
          created_at?: string
          device_sn?: string
          group_id?: string
          group_name?: string | null
          hours_window?: number
          id?: string
          peak_rx_bps?: number
          peak_tx_bps?: number
          raw_summary?: Json | null
          total_rx_bytes?: number
          total_tx_bytes?: number
        }
        Relationships: []
      }
      ruijie_tunnels: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          created_at: string | null
          created_by: string | null
          device_sn: string
          expires_at: string
          id: string
          open_domain_url: string | null
          open_ip_url: string | null
          status: string | null
          tunnel_type: string | null
          tunnel_url: string | null
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          device_sn: string
          expires_at: string
          id?: string
          open_domain_url?: string | null
          open_ip_url?: string | null
          status?: string | null
          tunnel_type?: string | null
          tunnel_url?: string | null
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          device_sn?: string
          expires_at?: string
          id?: string
          open_domain_url?: string | null
          open_ip_url?: string | null
          status?: string | null
          tunnel_type?: string | null
          tunnel_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ruijie_tunnels_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ruijie_tunnels_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ruijie_tunnels_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ruijie_tunnels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ruijie_tunnels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ruijie_tunnels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ruijie_tunnels_device_sn_fkey"
            columns: ["device_sn"]
            isOneToOne: false
            referencedRelation: "ruijie_device_cache"
            referencedColumns: ["sn"]
          },
        ]
      }
      sales_agents: {
        Row: {
          agent_type: Database["public"]["Enums"]["agent_type"]
          commission_rate: number | null
          company: string | null
          created_at: string
          created_by: string | null
          email: string
          full_name: string
          id: string
          password_hash: string | null
          phone: string | null
          status: Database["public"]["Enums"]["agent_status"]
          total_quotes_accepted: number | null
          total_quotes_created: number | null
          total_revenue_generated: number | null
          unique_link_token: string
          updated_at: string
        }
        Insert: {
          agent_type?: Database["public"]["Enums"]["agent_type"]
          commission_rate?: number | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          email: string
          full_name: string
          id?: string
          password_hash?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["agent_status"]
          total_quotes_accepted?: number | null
          total_quotes_created?: number | null
          total_revenue_generated?: number | null
          unique_link_token?: string
          updated_at?: string
        }
        Update: {
          agent_type?: Database["public"]["Enums"]["agent_type"]
          commission_rate?: number | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          email?: string
          full_name?: string
          id?: string
          password_hash?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["agent_status"]
          total_quotes_accepted?: number | null
          total_quotes_created?: number | null
          total_revenue_generated?: number | null
          unique_link_token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_agents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_agents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_agents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_engine_config: {
        Row: {
          config_key: string
          config_value: Json
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          config_key: string
          config_value: Json
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          config_key?: string
          config_value?: Json
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      sales_followup_flags: {
        Row: {
          created_at: string
          customer_id: string
          desk_ticket_id: string | null
          desk_ticket_number: string | null
          flagged_at: string
          id: string
          journey_snapshot: Json | null
          reason: string
          sales_alerted_at: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          desk_ticket_id?: string | null
          desk_ticket_number?: string | null
          flagged_at?: string
          id?: string
          journey_snapshot?: Json | null
          reason?: string
          sales_alerted_at?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          desk_ticket_id?: string | null
          desk_ticket_number?: string | null
          flagged_at?: string
          id?: string
          journey_snapshot?: Json | null
          reason?: string
          sales_alerted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_followup_flags_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_dashboard_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "sales_followup_flags_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_followup_flags_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_notification_engagement"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      sales_pipeline_stages: {
        Row: {
          contact_method: string | null
          contract_type: string | null
          coverage_lead_id: string | null
          created_at: string | null
          day_target: number | null
          decision_maker_confirmed: boolean | null
          id: string
          lead_score_id: string | null
          loss_competitor: string | null
          loss_reason: string | null
          objection_category: string | null
          outcome: string | null
          product_tier: string | null
          quote_mrr: number | null
          revenue_source: string | null
          stage: string
          stage_entered_at: string | null
          updated_at: string | null
          zoho_deal_id: string | null
          zoho_synced: boolean | null
          zone_id: string | null
        }
        Insert: {
          contact_method?: string | null
          contract_type?: string | null
          coverage_lead_id?: string | null
          created_at?: string | null
          day_target?: number | null
          decision_maker_confirmed?: boolean | null
          id?: string
          lead_score_id?: string | null
          loss_competitor?: string | null
          loss_reason?: string | null
          objection_category?: string | null
          outcome?: string | null
          product_tier?: string | null
          quote_mrr?: number | null
          revenue_source?: string | null
          stage?: string
          stage_entered_at?: string | null
          updated_at?: string | null
          zoho_deal_id?: string | null
          zoho_synced?: boolean | null
          zone_id?: string | null
        }
        Update: {
          contact_method?: string | null
          contract_type?: string | null
          coverage_lead_id?: string | null
          created_at?: string | null
          day_target?: number | null
          decision_maker_confirmed?: boolean | null
          id?: string
          lead_score_id?: string | null
          loss_competitor?: string | null
          loss_reason?: string | null
          objection_category?: string | null
          outcome?: string | null
          product_tier?: string | null
          quote_mrr?: number | null
          revenue_source?: string | null
          stage?: string
          stage_entered_at?: string | null
          updated_at?: string | null
          zoho_deal_id?: string | null
          zoho_synced?: boolean | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_pipeline_stages_coverage_lead_id_fkey"
            columns: ["coverage_lead_id"]
            isOneToOne: false
            referencedRelation: "coverage_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_pipeline_stages_lead_score_id_fkey"
            columns: ["lead_score_id"]
            isOneToOne: false
            referencedRelation: "lead_scores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_pipeline_stages_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "sales_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_zones: {
        Row: {
          active_customers: number | null
          arlan_routing: string | null
          base_station_connections: number | null
          base_station_count: number | null
          boundary: unknown
          business_poi_density: number | null
          campaign_tag: string | null
          campaign_tagged_at: string | null
          center_lat: number
          center_lng: number
          center_location: unknown
          commercial_property_count: number
          competitor_weakness_score: number | null
          coverage_confidence: string | null
          coverage_enriched_at: string | null
          coverage_score: number | null
          created_at: string | null
          demand_signal_count: number
          demographic_enriched_at: string | null
          demographic_fit_score: number | null
          description: string | null
          dfa_connected_count: number | null
          dfa_near_net_count: number | null
          enriched_zone_score: number | null
          id: string
          market_adjusted_propensity: number | null
          name: string
          notes: string | null
          pct_income_target: number | null
          pct_no_internet: number | null
          penetration_rate: number | null
          priority: string | null
          propensity_score: number | null
          province: string | null
          radius_km: number | null
          seo_slug: string | null
          serviceable_addresses: number | null
          sme_density_score: number | null
          status: string
          suburb: string | null
          updated_at: string | null
          vertical_composition: Json | null
          zone_score: number | null
          zone_type: string
        }
        Insert: {
          active_customers?: number | null
          arlan_routing?: string | null
          base_station_connections?: number | null
          base_station_count?: number | null
          boundary?: unknown
          business_poi_density?: number | null
          campaign_tag?: string | null
          campaign_tagged_at?: string | null
          center_lat: number
          center_lng: number
          center_location?: unknown
          commercial_property_count?: number
          competitor_weakness_score?: number | null
          coverage_confidence?: string | null
          coverage_enriched_at?: string | null
          coverage_score?: number | null
          created_at?: string | null
          demand_signal_count?: number
          demographic_enriched_at?: string | null
          demographic_fit_score?: number | null
          description?: string | null
          dfa_connected_count?: number | null
          dfa_near_net_count?: number | null
          enriched_zone_score?: number | null
          id?: string
          market_adjusted_propensity?: number | null
          name: string
          notes?: string | null
          pct_income_target?: number | null
          pct_no_internet?: number | null
          penetration_rate?: number | null
          priority?: string | null
          propensity_score?: number | null
          province?: string | null
          radius_km?: number | null
          seo_slug?: string | null
          serviceable_addresses?: number | null
          sme_density_score?: number | null
          status?: string
          suburb?: string | null
          updated_at?: string | null
          vertical_composition?: Json | null
          zone_score?: number | null
          zone_type: string
        }
        Update: {
          active_customers?: number | null
          arlan_routing?: string | null
          base_station_connections?: number | null
          base_station_count?: number | null
          boundary?: unknown
          business_poi_density?: number | null
          campaign_tag?: string | null
          campaign_tagged_at?: string | null
          center_lat?: number
          center_lng?: number
          center_location?: unknown
          commercial_property_count?: number
          competitor_weakness_score?: number | null
          coverage_confidence?: string | null
          coverage_enriched_at?: string | null
          coverage_score?: number | null
          created_at?: string | null
          demand_signal_count?: number
          demographic_enriched_at?: string | null
          demographic_fit_score?: number | null
          description?: string | null
          dfa_connected_count?: number | null
          dfa_near_net_count?: number | null
          enriched_zone_score?: number | null
          id?: string
          market_adjusted_propensity?: number | null
          name?: string
          notes?: string | null
          pct_income_target?: number | null
          pct_no_internet?: number | null
          penetration_rate?: number | null
          priority?: string | null
          propensity_score?: number | null
          province?: string | null
          radius_km?: number | null
          seo_slug?: string | null
          serviceable_addresses?: number | null
          sme_density_score?: number | null
          status?: string
          suburb?: string | null
          updated_at?: string | null
          vertical_composition?: Json | null
          zone_score?: number | null
          zone_type?: string
        }
        Relationships: []
      }
      service_action_log: {
        Row: {
          action_type: string
          admin_user_id: string | null
          created_at: string
          customer_id: string
          id: string
          new_data: Json | null
          new_status: string | null
          notes: string | null
          previous_data: Json | null
          previous_status: string | null
          reason: string
          service_id: string
        }
        Insert: {
          action_type: string
          admin_user_id?: string | null
          created_at?: string
          customer_id: string
          id?: string
          new_data?: Json | null
          new_status?: string | null
          notes?: string | null
          previous_data?: Json | null
          previous_status?: string | null
          reason: string
          service_id: string
        }
        Update: {
          action_type?: string
          admin_user_id?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          new_data?: Json | null
          new_status?: string | null
          notes?: string | null
          previous_data?: Json | null
          previous_status?: string | null
          reason?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_action_log_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_dashboard_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "service_action_log_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_action_log_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_notification_engagement"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "service_action_log_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "customer_services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_network_identifiers: {
        Row: {
          created_at: string
          id: string
          identifier_type: string
          identifier_value: string
          service_id: string
          source: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          identifier_type: string
          identifier_value: string
          service_id: string
          source?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          identifier_type?: string
          identifier_value?: string
          service_id?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_network_identifiers_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "customer_services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_order_terms_versions: {
        Row: {
          content_hash: string
          created_at: string
          id: string
          is_current: boolean
          msa_reference: string
          note: string | null
          superseded_on: string | null
          terms: Json
          title: string
          version: string
        }
        Insert: {
          content_hash: string
          created_at?: string
          id?: string
          is_current?: boolean
          msa_reference: string
          note?: string | null
          superseded_on?: string | null
          terms: Json
          title: string
          version: string
        }
        Update: {
          content_hash?: string
          created_at?: string
          id?: string
          is_current?: boolean
          msa_reference?: string
          note?: string | null
          superseded_on?: string | null
          terms?: Json
          title?: string
          version?: string
        }
        Relationships: []
      }
      service_packages: {
        Row: {
          active: boolean | null
          base_price_zar: number | null
          bundle_components: Json | null
          compatible_providers: string[] | null
          cost_price_zar: number | null
          created_at: string | null
          customer_friendly_features: Json | null
          customer_type: string | null
          description: string | null
          features: string[] | null
          id: string
          is_featured: boolean | null
          is_popular: boolean | null
          logical_key: string | null
          market_segment: string | null
          marketing_copy: string | null
          metadata: Json | null
          name: string
          network_provider_id: string | null
          price: number
          price_history: Json | null
          pricing: Json | null
          product_category: string | null
          promotion_months: number | null
          promotion_price: number | null
          provider: string | null
          provider_priority: number | null
          provider_specific_config: Json | null
          requires_fttb_coverage: boolean | null
          service_type: string
          sku: string | null
          slug: string | null
          sort_order: number | null
          source_admin_product_id: string | null
          speed_down: number
          speed_up: number
          status: string | null
          updated_at: string | null
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          active?: boolean | null
          base_price_zar?: number | null
          bundle_components?: Json | null
          compatible_providers?: string[] | null
          cost_price_zar?: number | null
          created_at?: string | null
          customer_friendly_features?: Json | null
          customer_type?: string | null
          description?: string | null
          features?: string[] | null
          id?: string
          is_featured?: boolean | null
          is_popular?: boolean | null
          logical_key?: string | null
          market_segment?: string | null
          marketing_copy?: string | null
          metadata?: Json | null
          name: string
          network_provider_id?: string | null
          price: number
          price_history?: Json | null
          pricing?: Json | null
          product_category?: string | null
          promotion_months?: number | null
          promotion_price?: number | null
          provider?: string | null
          provider_priority?: number | null
          provider_specific_config?: Json | null
          requires_fttb_coverage?: boolean | null
          service_type: string
          sku?: string | null
          slug?: string | null
          sort_order?: number | null
          source_admin_product_id?: string | null
          speed_down: number
          speed_up: number
          status?: string | null
          updated_at?: string | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          active?: boolean | null
          base_price_zar?: number | null
          bundle_components?: Json | null
          compatible_providers?: string[] | null
          cost_price_zar?: number | null
          created_at?: string | null
          customer_friendly_features?: Json | null
          customer_type?: string | null
          description?: string | null
          features?: string[] | null
          id?: string
          is_featured?: boolean | null
          is_popular?: boolean | null
          logical_key?: string | null
          market_segment?: string | null
          marketing_copy?: string | null
          metadata?: Json | null
          name?: string
          network_provider_id?: string | null
          price?: number
          price_history?: Json | null
          pricing?: Json | null
          product_category?: string | null
          promotion_months?: number | null
          promotion_price?: number | null
          provider?: string | null
          provider_priority?: number | null
          provider_specific_config?: Json | null
          requires_fttb_coverage?: boolean | null
          service_type?: string
          sku?: string | null
          slug?: string | null
          sort_order?: number | null
          source_admin_product_id?: string | null
          speed_down?: number
          speed_up?: number
          status?: string | null
          updated_at?: string | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_packages_network_provider_id_fkey"
            columns: ["network_provider_id"]
            isOneToOne: false
            referencedRelation: "fttb_network_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_packages_network_provider_id_fkey"
            columns: ["network_provider_id"]
            isOneToOne: false
            referencedRelation: "v_active_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_packages_network_provider_id_fkey"
            columns: ["network_provider_id"]
            isOneToOne: false
            referencedRelation: "v_providers_with_logos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_packages_source_admin_product_id_fkey"
            columns: ["source_admin_product_id"]
            isOneToOne: false
            referencedRelation: "admin_products"
            referencedColumns: ["id"]
          },
        ]
      }
      service_packages_audit_log: {
        Row: {
          action: string
          changed_by: string
          changed_by_email: string
          changes: Json
          created_at: string | null
          id: string
          ip_address: string | null
          package_id: string
          previous_values: Json | null
          user_agent: string | null
        }
        Insert: {
          action: string
          changed_by: string
          changed_by_email: string
          changes: Json
          created_at?: string | null
          id?: string
          ip_address?: string | null
          package_id: string
          previous_values?: Json | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          changed_by?: string
          changed_by_email?: string
          changes?: Json
          created_at?: string | null
          id?: string
          ip_address?: string | null
          package_id?: string
          previous_values?: Json | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_packages_audit_log_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "service_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_packages_audit_log_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "sme_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_packages_audit_log_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "v_active_service_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_packages_audit_log_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "v_products_with_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      service_packages_audit_logs: {
        Row: {
          action: string
          change_reason: string | null
          changed_at: string | null
          changed_by_email: string | null
          changed_by_name: string | null
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          package_id: string
          user_agent: string | null
        }
        Insert: {
          action: string
          change_reason?: string | null
          changed_at?: string | null
          changed_by_email?: string | null
          changed_by_name?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          package_id: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          change_reason?: string | null
          changed_at?: string | null
          changed_by_email?: string | null
          changed_by_name?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          package_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_packages_audit_logs_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "service_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_packages_audit_logs_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "sme_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_packages_audit_logs_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "v_active_service_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_packages_audit_logs_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "v_products_with_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      service_suspensions: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          notes: string | null
          reactivated_at: string | null
          reactivated_by: string | null
          reason: string
          service_id: string
          skip_billing: boolean | null
          suspended_at: string
          suspended_by: string | null
          suspension_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          notes?: string | null
          reactivated_at?: string | null
          reactivated_by?: string | null
          reason: string
          service_id: string
          skip_billing?: boolean | null
          suspended_at?: string
          suspended_by?: string | null
          suspension_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          notes?: string | null
          reactivated_at?: string | null
          reactivated_by?: string | null
          reason?: string
          service_id?: string
          skip_billing?: boolean | null
          suspended_at?: string
          suspended_by?: string | null
          suspension_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_suspensions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_dashboard_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "service_suspensions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_suspensions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_notification_engagement"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "service_suspensions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "customer_services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_type_mapping: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          notes: string | null
          priority: number | null
          product_category: string
          product_name: string | null
          provider: string
          technical_type: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          notes?: string | null
          priority?: number | null
          product_category: string
          product_name?: string | null
          provider: string
          technical_type: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          notes?: string | null
          priority?: number | null
          product_category?: string
          product_name?: string | null
          provider?: string
          technical_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      site_usage_report_jobs: {
        Row: {
          byte_size: number | null
          content_type: string | null
          created_at: string
          created_by: string
          error_message: string | null
          expires_at: string | null
          id: string
          include_csv: boolean
          include_provisioned: boolean
          inngest_run_id: string | null
          outcome: Json | null
          patient_csv_path: string | null
          period_end: string
          period_preset: string
          period_start: string
          primary_sources: Json
          site_ids: string[]
          status: string
          storage_path: string | null
          unjani_only: boolean
          updated_at: string
        }
        Insert: {
          byte_size?: number | null
          content_type?: string | null
          created_at?: string
          created_by: string
          error_message?: string | null
          expires_at?: string | null
          id?: string
          include_csv?: boolean
          include_provisioned?: boolean
          inngest_run_id?: string | null
          outcome?: Json | null
          patient_csv_path?: string | null
          period_end: string
          period_preset: string
          period_start: string
          primary_sources?: Json
          site_ids: string[]
          status: string
          storage_path?: string | null
          unjani_only?: boolean
          updated_at?: string
        }
        Update: {
          byte_size?: number | null
          content_type?: string | null
          created_at?: string
          created_by?: string
          error_message?: string | null
          expires_at?: string | null
          id?: string
          include_csv?: boolean
          include_provisioned?: boolean
          inngest_run_id?: string | null
          outcome?: Json | null
          patient_csv_path?: string | null
          period_end?: string
          period_preset?: string
          period_start?: string
          primary_sources?: Json
          site_ids?: string[]
          status?: string
          storage_path?: string | null
          unjani_only?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      sla_definitions: {
        Row: {
          applies_to_package_types: string[] | null
          created_at: string
          credit_rate_per_percent: number
          description: string | null
          exclusions: string[] | null
          id: string
          is_active: boolean | null
          max_credit_percent: number | null
          measurement_period: string | null
          name: string
          updated_at: string
          uptime_target: number
        }
        Insert: {
          applies_to_package_types?: string[] | null
          created_at?: string
          credit_rate_per_percent?: number
          description?: string | null
          exclusions?: string[] | null
          id?: string
          is_active?: boolean | null
          max_credit_percent?: number | null
          measurement_period?: string | null
          name: string
          updated_at?: string
          uptime_target: number
        }
        Update: {
          applies_to_package_types?: string[] | null
          created_at?: string
          credit_rate_per_percent?: number
          description?: string | null
          exclusions?: string[] | null
          id?: string
          is_active?: boolean | null
          max_credit_percent?: number | null
          measurement_period?: string | null
          name?: string
          updated_at?: string
          uptime_target?: number
        }
        Relationships: []
      }
      sla_violations: {
        Row: {
          created_at: string
          credit_amount: number | null
          credit_applied: boolean | null
          credit_applied_at: string | null
          credit_note_id: string | null
          credit_percent: number | null
          customer_id: string
          customer_service_id: string | null
          downtime_incidents: number | null
          downtime_minutes: number
          id: string
          notes: string | null
          period_end: string
          period_start: string
          sla_id: string
          updated_at: string
          uptime_achieved: number
          uptime_target: number
        }
        Insert: {
          created_at?: string
          credit_amount?: number | null
          credit_applied?: boolean | null
          credit_applied_at?: string | null
          credit_note_id?: string | null
          credit_percent?: number | null
          customer_id: string
          customer_service_id?: string | null
          downtime_incidents?: number | null
          downtime_minutes: number
          id?: string
          notes?: string | null
          period_end: string
          period_start: string
          sla_id: string
          updated_at?: string
          uptime_achieved: number
          uptime_target: number
        }
        Update: {
          created_at?: string
          credit_amount?: number | null
          credit_applied?: boolean | null
          credit_applied_at?: string | null
          credit_note_id?: string | null
          credit_percent?: number | null
          customer_id?: string
          customer_service_id?: string | null
          downtime_incidents?: number | null
          downtime_minutes?: number
          id?: string
          notes?: string | null
          period_end?: string
          period_start?: string
          sla_id?: string
          updated_at?: string
          uptime_achieved?: number
          uptime_target?: number
        }
        Relationships: [
          {
            foreignKeyName: "sla_violations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_dashboard_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "sla_violations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sla_violations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_notification_engagement"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "sla_violations_customer_service_id_fkey"
            columns: ["customer_service_id"]
            isOneToOne: false
            referencedRelation: "customer_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sla_violations_sla_id_fkey"
            columns: ["sla_id"]
            isOneToOne: false
            referencedRelation: "sla_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      smb_product_cost_components: {
        Row: {
          amortisation_period_months: number | null
          component_category: string
          component_name: string
          cost_amount_zar: number
          created_at: string | null
          description: string | null
          id: string
          is_amortised: boolean | null
          original_amount_zar: number | null
          provider: string | null
          smb_product_id: string
        }
        Insert: {
          amortisation_period_months?: number | null
          component_category: string
          component_name: string
          cost_amount_zar: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_amortised?: boolean | null
          original_amount_zar?: number | null
          provider?: string | null
          smb_product_id: string
        }
        Update: {
          amortisation_period_months?: number | null
          component_category?: string
          component_name?: string
          cost_amount_zar?: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_amortised?: boolean | null
          original_amount_zar?: number | null
          provider?: string | null
          smb_product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "smb_product_cost_components_smb_product_id_fkey"
            columns: ["smb_product_id"]
            isOneToOne: false
            referencedRelation: "smb_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smb_product_cost_components_smb_product_id_fkey"
            columns: ["smb_product_id"]
            isOneToOne: false
            referencedRelation: "smb_products_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      smb_product_features: {
        Row: {
          additional_cost_zar: number | null
          created_at: string | null
          description: string | null
          feature_category: string
          feature_name: string
          feature_value: string | null
          id: string
          is_included: boolean | null
          smb_product_id: string
        }
        Insert: {
          additional_cost_zar?: number | null
          created_at?: string | null
          description?: string | null
          feature_category: string
          feature_name: string
          feature_value?: string | null
          id?: string
          is_included?: boolean | null
          smb_product_id: string
        }
        Update: {
          additional_cost_zar?: number | null
          created_at?: string | null
          description?: string | null
          feature_category?: string
          feature_name?: string
          feature_value?: string | null
          id?: string
          is_included?: boolean | null
          smb_product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "smb_product_features_smb_product_id_fkey"
            columns: ["smb_product_id"]
            isOneToOne: false
            referencedRelation: "smb_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smb_product_features_smb_product_id_fkey"
            columns: ["smb_product_id"]
            isOneToOne: false
            referencedRelation: "smb_products_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      smb_products: {
        Row: {
          created_at: string | null
          effective_date: string
          gross_margin_percentage: number
          gross_profit_zar: number
          id: string
          installation_fee_zar: number
          is_active: boolean | null
          package_code: string
          package_name: string
          product_category: string | null
          promo_price_zar: number
          regular_price_zar: number
          router_amortised_monthly_zar: number
          router_concurrent_users: number | null
          router_dealer_price_excl_vat_zar: number
          router_features: Json | null
          router_model: string
          router_ports: number | null
          router_retail_price_incl_vat_zar: number
          router_throughput_mbps: number | null
          router_wifi_standard: string | null
          selling_price_excl_vat_zar: number
          selling_price_incl_vat_zar: number
          speed_mbps: number
          total_cost_zar: number
          total_first_month_promo_zar: number
          total_first_month_regular_zar: number
          updated_at: string | null
          version: string
        }
        Insert: {
          created_at?: string | null
          effective_date?: string
          gross_margin_percentage: number
          gross_profit_zar: number
          id?: string
          installation_fee_zar: number
          is_active?: boolean | null
          package_code: string
          package_name: string
          product_category?: string | null
          promo_price_zar: number
          regular_price_zar: number
          router_amortised_monthly_zar: number
          router_concurrent_users?: number | null
          router_dealer_price_excl_vat_zar: number
          router_features?: Json | null
          router_model: string
          router_ports?: number | null
          router_retail_price_incl_vat_zar: number
          router_throughput_mbps?: number | null
          router_wifi_standard?: string | null
          selling_price_excl_vat_zar: number
          selling_price_incl_vat_zar: number
          speed_mbps: number
          total_cost_zar: number
          total_first_month_promo_zar: number
          total_first_month_regular_zar: number
          updated_at?: string | null
          version?: string
        }
        Update: {
          created_at?: string | null
          effective_date?: string
          gross_margin_percentage?: number
          gross_profit_zar?: number
          id?: string
          installation_fee_zar?: number
          is_active?: boolean | null
          package_code?: string
          package_name?: string
          product_category?: string | null
          promo_price_zar?: number
          regular_price_zar?: number
          router_amortised_monthly_zar?: number
          router_concurrent_users?: number | null
          router_dealer_price_excl_vat_zar?: number
          router_features?: Json | null
          router_model?: string
          router_ports?: number | null
          router_retail_price_incl_vat_zar?: number
          router_throughput_mbps?: number | null
          router_wifi_standard?: string | null
          selling_price_excl_vat_zar?: number
          selling_price_incl_vat_zar?: number
          speed_mbps?: number
          total_cost_zar?: number
          total_first_month_promo_zar?: number
          total_first_month_regular_zar?: number
          updated_at?: string | null
          version?: string
        }
        Relationships: []
      }
      sources: {
        Row: {
          archive_expires_at: string | null
          archived: boolean
          archived_at: string | null
          config: Json
          contextual_retrieval_mode: string | null
          created_at: string
          id: string
          last_commit: string | null
          last_sync_at: string | null
          local_path: string | null
          name: string
          trust_frontmatter_overrides: boolean
        }
        Insert: {
          archive_expires_at?: string | null
          archived?: boolean
          archived_at?: string | null
          config?: Json
          contextual_retrieval_mode?: string | null
          created_at?: string
          id: string
          last_commit?: string | null
          last_sync_at?: string | null
          local_path?: string | null
          name: string
          trust_frontmatter_overrides?: boolean
        }
        Update: {
          archive_expires_at?: string | null
          archived?: boolean
          archived_at?: string | null
          config?: Json
          contextual_retrieval_mode?: string | null
          created_at?: string
          id?: string
          last_commit?: string | null
          last_sync_at?: string | null
          local_path?: string | null
          name?: string
          trust_frontmatter_overrides?: boolean
        }
        Relationships: []
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      submissions: {
        Row: {
          challenge: string
          created_at: string | null
          description: string
          email: string
          id: string
          name: string
          submission_url: string
          submitted_at: string | null
          time_spent: string
        }
        Insert: {
          challenge: string
          created_at?: string | null
          description: string
          email: string
          id?: string
          name: string
          submission_url: string
          submitted_at?: string | null
          time_spent: string
        }
        Update: {
          challenge?: string
          created_at?: string | null
          description?: string
          email?: string
          id?: string
          name?: string
          submission_url?: string
          submitted_at?: string | null
          time_spent?: string
        }
        Relationships: []
      }
      subscriber_diagnostics: {
        Row: {
          avg_session_duration_seconds: number | null
          created_at: string
          current_session_ip: string | null
          customer_service_id: string
          health_score: number | null
          health_status: string
          id: string
          interstellio_subscriber_id: string | null
          is_session_active: boolean | null
          last_check_at: string | null
          last_disconnect_time: string | null
          last_event_at: string | null
          last_session_duration_seconds: number | null
          last_session_start: string | null
          last_terminate_cause: string | null
          lost_carrier_count_7days: number | null
          lost_carrier_count_today: number | null
          metrics_updated_at: string | null
          nas_ip_address: string | null
          session_timeout_count_today: number | null
          total_online_seconds_7days: number | null
          total_sessions_7days: number | null
          total_sessions_today: number | null
          updated_at: string
          user_request_count_today: number | null
        }
        Insert: {
          avg_session_duration_seconds?: number | null
          created_at?: string
          current_session_ip?: string | null
          customer_service_id: string
          health_score?: number | null
          health_status?: string
          id?: string
          interstellio_subscriber_id?: string | null
          is_session_active?: boolean | null
          last_check_at?: string | null
          last_disconnect_time?: string | null
          last_event_at?: string | null
          last_session_duration_seconds?: number | null
          last_session_start?: string | null
          last_terminate_cause?: string | null
          lost_carrier_count_7days?: number | null
          lost_carrier_count_today?: number | null
          metrics_updated_at?: string | null
          nas_ip_address?: string | null
          session_timeout_count_today?: number | null
          total_online_seconds_7days?: number | null
          total_sessions_7days?: number | null
          total_sessions_today?: number | null
          updated_at?: string
          user_request_count_today?: number | null
        }
        Update: {
          avg_session_duration_seconds?: number | null
          created_at?: string
          current_session_ip?: string | null
          customer_service_id?: string
          health_score?: number | null
          health_status?: string
          id?: string
          interstellio_subscriber_id?: string | null
          is_session_active?: boolean | null
          last_check_at?: string | null
          last_disconnect_time?: string | null
          last_event_at?: string | null
          last_session_duration_seconds?: number | null
          last_session_start?: string | null
          last_terminate_cause?: string | null
          lost_carrier_count_7days?: number | null
          lost_carrier_count_today?: number | null
          metrics_updated_at?: string | null
          nas_ip_address?: string | null
          session_timeout_count_today?: number | null
          total_online_seconds_7days?: number | null
          total_sessions_7days?: number | null
          total_sessions_today?: number | null
          updated_at?: string
          user_request_count_today?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriber_diagnostics_customer_service_id_fkey"
            columns: ["customer_service_id"]
            isOneToOne: true
            referencedRelation: "customer_services"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriber_events: {
        Row: {
          action_taken: string | null
          created_at: string
          customer_service_id: string
          diagnostics_id: string | null
          event_data: Json | null
          event_source: string
          event_type: string
          health_impact: number | null
          id: string
          interstellio_subscriber_id: string
          nas_ip: string | null
          requires_action: boolean | null
          session_active: boolean | null
          session_duration_seconds: number | null
          session_ip: string | null
          severity: string | null
          terminate_cause: string | null
          ticket_id: string | null
          webhook_payload: Json | null
          webhook_received_at: string | null
        }
        Insert: {
          action_taken?: string | null
          created_at?: string
          customer_service_id: string
          diagnostics_id?: string | null
          event_data?: Json | null
          event_source: string
          event_type: string
          health_impact?: number | null
          id?: string
          interstellio_subscriber_id: string
          nas_ip?: string | null
          requires_action?: boolean | null
          session_active?: boolean | null
          session_duration_seconds?: number | null
          session_ip?: string | null
          severity?: string | null
          terminate_cause?: string | null
          ticket_id?: string | null
          webhook_payload?: Json | null
          webhook_received_at?: string | null
        }
        Update: {
          action_taken?: string | null
          created_at?: string
          customer_service_id?: string
          diagnostics_id?: string | null
          event_data?: Json | null
          event_source?: string
          event_type?: string
          health_impact?: number | null
          id?: string
          interstellio_subscriber_id?: string
          nas_ip?: string | null
          requires_action?: boolean | null
          session_active?: boolean | null
          session_duration_seconds?: number | null
          session_ip?: string | null
          severity?: string | null
          terminate_cause?: string | null
          ticket_id?: string | null
          webhook_payload?: Json | null
          webhook_received_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriber_events_customer_service_id_fkey"
            columns: ["customer_service_id"]
            isOneToOne: false
            referencedRelation: "customer_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriber_events_diagnostics_id_fkey"
            columns: ["diagnostics_id"]
            isOneToOne: false
            referencedRelation: "subscriber_diagnostics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriber_events_diagnostics_id_fkey"
            columns: ["diagnostics_id"]
            isOneToOne: false
            referencedRelation: "v_subscriber_diagnostics_summary"
            referencedColumns: ["diagnostics_id"]
          },
          {
            foreignKeyName: "subscriber_events_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_default_terms: {
        Row: {
          created_at: string | null
          default_delivery_estimate: string | null
          default_refund_policy: string | null
          default_return_policy: string | null
          default_warranty_period: string | null
          extracted_at: string | null
          id: string
          legal_disclaimer: string | null
          source_document: string | null
          stock_note: string | null
          supplier_id: string
          updated_at: string | null
          vat_note: string | null
        }
        Insert: {
          created_at?: string | null
          default_delivery_estimate?: string | null
          default_refund_policy?: string | null
          default_return_policy?: string | null
          default_warranty_period?: string | null
          extracted_at?: string | null
          id?: string
          legal_disclaimer?: string | null
          source_document?: string | null
          stock_note?: string | null
          supplier_id: string
          updated_at?: string | null
          vat_note?: string | null
        }
        Update: {
          created_at?: string | null
          default_delivery_estimate?: string | null
          default_refund_policy?: string | null
          default_return_policy?: string | null
          default_warranty_period?: string | null
          extracted_at?: string | null
          id?: string
          legal_disclaimer?: string | null
          source_document?: string | null
          stock_note?: string | null
          supplier_id?: string
          updated_at?: string | null
          vat_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_default_terms_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: true
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_default_terms_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: true
            referencedRelation: "v_supplier_stock_by_branch"
            referencedColumns: ["supplier_id"]
          },
          {
            foreignKeyName: "supplier_default_terms_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: true
            referencedRelation: "v_supplier_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_products: {
        Row: {
          cached_image_path: string | null
          category: string | null
          cost_price: number | null
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          in_stock: boolean | null
          is_active: boolean | null
          is_discontinued: boolean | null
          last_synced_at: string | null
          manufacturer: string | null
          metadata: Json | null
          name: string
          previous_cost_price: number | null
          previous_stock_total: number | null
          product_url: string | null
          retail_price: number | null
          sku: string
          source_image_url: string | null
          specifications: Json | null
          stock_cpt: number | null
          stock_dbn: number | null
          stock_jhb: number | null
          stock_total: number | null
          subcategory: string | null
          supplier_id: string
          updated_at: string | null
        }
        Insert: {
          cached_image_path?: string | null
          category?: string | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          in_stock?: boolean | null
          is_active?: boolean | null
          is_discontinued?: boolean | null
          last_synced_at?: string | null
          manufacturer?: string | null
          metadata?: Json | null
          name: string
          previous_cost_price?: number | null
          previous_stock_total?: number | null
          product_url?: string | null
          retail_price?: number | null
          sku: string
          source_image_url?: string | null
          specifications?: Json | null
          stock_cpt?: number | null
          stock_dbn?: number | null
          stock_jhb?: number | null
          stock_total?: number | null
          subcategory?: string | null
          supplier_id: string
          updated_at?: string | null
        }
        Update: {
          cached_image_path?: string | null
          category?: string | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          in_stock?: boolean | null
          is_active?: boolean | null
          is_discontinued?: boolean | null
          last_synced_at?: string | null
          manufacturer?: string | null
          metadata?: Json | null
          name?: string
          previous_cost_price?: number | null
          previous_stock_total?: number | null
          product_url?: string | null
          retail_price?: number | null
          sku?: string
          source_image_url?: string | null
          specifications?: Json | null
          stock_cpt?: number | null
          stock_dbn?: number | null
          stock_jhb?: number | null
          stock_total?: number | null
          subcategory?: string | null
          supplier_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "v_supplier_stock_by_branch"
            referencedColumns: ["supplier_id"]
          },
          {
            foreignKeyName: "supplier_products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "v_supplier_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_sync_logs: {
        Row: {
          completed_at: string | null
          duration_ms: number | null
          error_details: Json | null
          error_message: string | null
          id: string
          images_cached: number | null
          products_created: number | null
          products_deactivated: number | null
          products_found: number | null
          products_unchanged: number | null
          products_updated: number | null
          started_at: string | null
          status: string
          supplier_id: string
          triggered_by: string | null
          triggered_by_user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          duration_ms?: number | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          images_cached?: number | null
          products_created?: number | null
          products_deactivated?: number | null
          products_found?: number | null
          products_unchanged?: number | null
          products_updated?: number | null
          started_at?: string | null
          status: string
          supplier_id: string
          triggered_by?: string | null
          triggered_by_user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          duration_ms?: number | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          images_cached?: number | null
          products_created?: number | null
          products_deactivated?: number | null
          products_found?: number | null
          products_unchanged?: number | null
          products_updated?: number | null
          started_at?: string | null
          status?: string
          supplier_id?: string
          triggered_by?: string | null
          triggered_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_sync_logs_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_sync_logs_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "v_supplier_stock_by_branch"
            referencedColumns: ["supplier_id"]
          },
          {
            foreignKeyName: "supplier_sync_logs_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "v_supplier_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          account_number: string | null
          code: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          feed_credentials: Json | null
          feed_type: string | null
          feed_url: string | null
          id: string
          is_active: boolean | null
          last_synced_at: string | null
          metadata: Json | null
          name: string
          notes: string | null
          payment_terms: string | null
          sync_error: string | null
          sync_status: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          account_number?: string | null
          code: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          feed_credentials?: Json | null
          feed_type?: string | null
          feed_url?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          metadata?: Json | null
          name: string
          notes?: string | null
          payment_terms?: string | null
          sync_error?: string | null
          sync_status?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          account_number?: string | null
          code?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          feed_credentials?: Json | null
          feed_type?: string | null
          feed_url?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          metadata?: Json | null
          name?: string
          notes?: string | null
          payment_terms?: string | null
          sync_error?: string | null
          sync_status?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      support_email_log: {
        Row: {
          bcc_recipients: string[] | null
          cc_recipients: string[] | null
          created_at: string
          customer_id: string | null
          id: string
          order_id: string | null
          recipients: string[]
          resend_message_id: string | null
          sent_at: string
          sent_by_admin_id: string | null
          subject: string
          ticket_id: string | null
        }
        Insert: {
          bcc_recipients?: string[] | null
          cc_recipients?: string[] | null
          created_at?: string
          customer_id?: string | null
          id?: string
          order_id?: string | null
          recipients: string[]
          resend_message_id?: string | null
          sent_at?: string
          sent_by_admin_id?: string | null
          subject: string
          ticket_id?: string | null
        }
        Update: {
          bcc_recipients?: string[] | null
          cc_recipients?: string[] | null
          created_at?: string
          customer_id?: string | null
          id?: string
          order_id?: string | null
          recipients?: string[]
          resend_message_id?: string | null
          sent_at?: string
          sent_by_admin_id?: string | null
          subject?: string
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_email_log_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_dashboard_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "support_email_log_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_email_log_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_notification_engagement"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "support_email_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "consumer_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_email_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_order_compliance_summary"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "support_email_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_order_notifications"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "support_email_log_sent_by_admin_id_fkey"
            columns: ["sent_by_admin_id"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_email_log_sent_by_admin_id_fkey"
            columns: ["sent_by_admin_id"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_email_log_sent_by_admin_id_fkey"
            columns: ["sent_by_admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_agent_id: string | null
          attachments: Json | null
          category: string | null
          created_at: string | null
          customer_id: string
          description: string | null
          id: string
          priority: string | null
          status: string | null
          subject: string
          ticket_number: string
          updated_at: string | null
        }
        Insert: {
          assigned_agent_id?: string | null
          attachments?: Json | null
          category?: string | null
          created_at?: string | null
          customer_id: string
          description?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          subject: string
          ticket_number: string
          updated_at?: string | null
        }
        Update: {
          assigned_agent_id?: string | null
          attachments?: Json | null
          category?: string | null
          created_at?: string | null
          customer_id?: string
          description?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          subject?: string
          ticket_number?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_dashboard_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "support_tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_notification_engagement"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      tarana_base_stations: {
        Row: {
          active_connections: number | null
          azimuth_deg: number | null
          band: string | null
          bandwidth_mhz: number | null
          cell_id: number | null
          cell_name: string | null
          created_at: string | null
          device_status: number | null
          height_m: number | null
          hostname: string
          id: string
          last_updated: string | null
          lat: number
          lng: number
          location: unknown
          market: string | null
          market_id: number | null
          network_profile_id: number | null
          region: string | null
          region_id: number | null
          sector_id: number | null
          sector_name: string | null
          serial_number: string
          site_id: number | null
          site_name: string
        }
        Insert: {
          active_connections?: number | null
          azimuth_deg?: number | null
          band?: string | null
          bandwidth_mhz?: number | null
          cell_id?: number | null
          cell_name?: string | null
          created_at?: string | null
          device_status?: number | null
          height_m?: number | null
          hostname: string
          id?: string
          last_updated?: string | null
          lat: number
          lng: number
          location?: unknown
          market?: string | null
          market_id?: number | null
          network_profile_id?: number | null
          region?: string | null
          region_id?: number | null
          sector_id?: number | null
          sector_name?: string | null
          serial_number: string
          site_id?: number | null
          site_name: string
        }
        Update: {
          active_connections?: number | null
          azimuth_deg?: number | null
          band?: string | null
          bandwidth_mhz?: number | null
          cell_id?: number | null
          cell_name?: string | null
          created_at?: string | null
          device_status?: number | null
          height_m?: number | null
          hostname?: string
          id?: string
          last_updated?: string | null
          lat?: number
          lng?: number
          location?: unknown
          market?: string | null
          market_id?: number | null
          network_profile_id?: number | null
          region?: string | null
          region_id?: number | null
          sector_id?: number | null
          sector_name?: string | null
          serial_number?: string
          site_id?: number | null
          site_name?: string
        }
        Relationships: []
      }
      tarana_device_counts: {
        Row: {
          bn_connected: number
          bn_disconnected: number
          bn_new_installs_30d: number
          bn_spectrum_unassigned: number
          bn_total: number
          created_at: string | null
          fetched_at: string | null
          id: string
          rn_connected: number
          rn_disconnected: number
          rn_new_installs_30d: number
          rn_spectrum_unassigned: number
          rn_total: number
          sync_log_id: string | null
        }
        Insert: {
          bn_connected?: number
          bn_disconnected?: number
          bn_new_installs_30d?: number
          bn_spectrum_unassigned?: number
          bn_total?: number
          created_at?: string | null
          fetched_at?: string | null
          id?: string
          rn_connected?: number
          rn_disconnected?: number
          rn_new_installs_30d?: number
          rn_spectrum_unassigned?: number
          rn_total?: number
          sync_log_id?: string | null
        }
        Update: {
          bn_connected?: number
          bn_disconnected?: number
          bn_new_installs_30d?: number
          bn_spectrum_unassigned?: number
          bn_total?: number
          created_at?: string | null
          fetched_at?: string | null
          id?: string
          rn_connected?: number
          rn_disconnected?: number
          rn_new_installs_30d?: number
          rn_spectrum_unassigned?: number
          rn_total?: number
          sync_log_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tarana_device_counts_sync_log_id_fkey"
            columns: ["sync_log_id"]
            isOneToOne: false
            referencedRelation: "tarana_sync_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      tarana_link_metrics: {
        Row: {
          bn_height_m: number | null
          bn_lat: number | null
          bn_lng: number | null
          bn_serial_number: string | null
          captured_at: string
          created_at: string | null
          distance_m: number | null
          dl_peak_rate_mbps: number | null
          dl_per_pct: number | null
          id: string
          inr_carrier_0_db: number | null
          inr_carrier_1_db: number | null
          link_status: string | null
          mcs_dl: number | null
          mcs_ul: number | null
          noise_floor_dbm: number | null
          path_loss_db: number | null
          raw_fields: Json | null
          rf_distance_m: number | null
          rn_height_m: number | null
          rn_lat: number | null
          rn_lng: number | null
          rn_serial_number: string
          rssi_dbm: number | null
          rx_power_dbm: number | null
          sensitivity_loss_0_db: number | null
          sensitivity_loss_1_db: number | null
          sinr_db: number | null
          throughput_dl_mbps: number | null
          throughput_ul_mbps: number | null
          tx_power_dbm: number | null
          ul_peak_rate_mbps: number | null
          ul_per_pct: number | null
          uptime_seconds: number | null
        }
        Insert: {
          bn_height_m?: number | null
          bn_lat?: number | null
          bn_lng?: number | null
          bn_serial_number?: string | null
          captured_at?: string
          created_at?: string | null
          distance_m?: number | null
          dl_peak_rate_mbps?: number | null
          dl_per_pct?: number | null
          id?: string
          inr_carrier_0_db?: number | null
          inr_carrier_1_db?: number | null
          link_status?: string | null
          mcs_dl?: number | null
          mcs_ul?: number | null
          noise_floor_dbm?: number | null
          path_loss_db?: number | null
          raw_fields?: Json | null
          rf_distance_m?: number | null
          rn_height_m?: number | null
          rn_lat?: number | null
          rn_lng?: number | null
          rn_serial_number: string
          rssi_dbm?: number | null
          rx_power_dbm?: number | null
          sensitivity_loss_0_db?: number | null
          sensitivity_loss_1_db?: number | null
          sinr_db?: number | null
          throughput_dl_mbps?: number | null
          throughput_ul_mbps?: number | null
          tx_power_dbm?: number | null
          ul_peak_rate_mbps?: number | null
          ul_per_pct?: number | null
          uptime_seconds?: number | null
        }
        Update: {
          bn_height_m?: number | null
          bn_lat?: number | null
          bn_lng?: number | null
          bn_serial_number?: string | null
          captured_at?: string
          created_at?: string | null
          distance_m?: number | null
          dl_peak_rate_mbps?: number | null
          dl_per_pct?: number | null
          id?: string
          inr_carrier_0_db?: number | null
          inr_carrier_1_db?: number | null
          link_status?: string | null
          mcs_dl?: number | null
          mcs_ul?: number | null
          noise_floor_dbm?: number | null
          path_loss_db?: number | null
          raw_fields?: Json | null
          rf_distance_m?: number | null
          rn_height_m?: number | null
          rn_lat?: number | null
          rn_lng?: number | null
          rn_serial_number?: string
          rssi_dbm?: number | null
          rx_power_dbm?: number | null
          sensitivity_loss_0_db?: number | null
          sensitivity_loss_1_db?: number | null
          sinr_db?: number | null
          throughput_dl_mbps?: number | null
          throughput_ul_mbps?: number | null
          tx_power_dbm?: number | null
          ul_peak_rate_mbps?: number | null
          ul_per_pct?: number | null
          uptime_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tarana_link_metrics_bn_serial_number_fkey"
            columns: ["bn_serial_number"]
            isOneToOne: false
            referencedRelation: "tarana_base_stations"
            referencedColumns: ["serial_number"]
          },
        ]
      }
      tarana_sync_logs: {
        Row: {
          attempt: number | null
          completed_at: string | null
          created_at: string | null
          deleted: number | null
          duration_ms: number | null
          errors: Json | null
          id: string
          inserted: number | null
          started_at: string | null
          stations_fetched: number | null
          status: string
          trigger_type: string
          triggered_by: string | null
          updated: number | null
        }
        Insert: {
          attempt?: number | null
          completed_at?: string | null
          created_at?: string | null
          deleted?: number | null
          duration_ms?: number | null
          errors?: Json | null
          id?: string
          inserted?: number | null
          started_at?: string | null
          stations_fetched?: number | null
          status?: string
          trigger_type?: string
          triggered_by?: string | null
          updated?: number | null
        }
        Update: {
          attempt?: number | null
          completed_at?: string | null
          created_at?: string | null
          deleted?: number | null
          duration_ms?: number | null
          errors?: Json | null
          id?: string
          inserted?: number | null
          started_at?: string | null
          stations_fetched?: number | null
          status?: string
          trigger_type?: string
          triggered_by?: string | null
          updated?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tarana_sync_logs_triggered_by_fkey"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarana_sync_logs_triggered_by_fkey"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarana_sync_logs_triggered_by_fkey"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      technician_location_logs: {
        Row: {
          accuracy: number | null
          altitude: number | null
          battery_level: number | null
          event_type: string
          heading: number | null
          id: string
          is_charging: boolean | null
          job_id: string | null
          latitude: number
          longitude: number
          network_type: string | null
          recorded_at: string | null
          speed: number | null
          technician_id: string
        }
        Insert: {
          accuracy?: number | null
          altitude?: number | null
          battery_level?: number | null
          event_type: string
          heading?: number | null
          id?: string
          is_charging?: boolean | null
          job_id?: string | null
          latitude: number
          longitude: number
          network_type?: string | null
          recorded_at?: string | null
          speed?: number | null
          technician_id: string
        }
        Update: {
          accuracy?: number | null
          altitude?: number | null
          battery_level?: number | null
          event_type?: string
          heading?: number | null
          id?: string
          is_charging?: boolean | null
          job_id?: string | null
          latitude?: number
          longitude?: number
          network_type?: string | null
          recorded_at?: string | null
          speed?: number | null
          technician_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "technician_location_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "field_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_location_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_technician_status"
            referencedColumns: ["current_job_id"]
          },
          {
            foreignKeyName: "technician_location_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_todays_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_location_logs_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_location_logs_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "v_technician_status"
            referencedColumns: ["id"]
          },
        ]
      }
      technicians: {
        Row: {
          created_at: string | null
          current_latitude: number | null
          current_location_accuracy: number | null
          current_longitude: number | null
          device_id: string | null
          email: string | null
          employee_id: string | null
          first_name: string
          id: string
          is_active: boolean | null
          last_name: string
          location_updated_at: string | null
          phone: string
          skills: string[] | null
          status: string
          team: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_latitude?: number | null
          current_location_accuracy?: number | null
          current_longitude?: number | null
          device_id?: string | null
          email?: string | null
          employee_id?: string | null
          first_name: string
          id?: string
          is_active?: boolean | null
          last_name: string
          location_updated_at?: string | null
          phone: string
          skills?: string[] | null
          status?: string
          team?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_latitude?: number | null
          current_location_accuracy?: number | null
          current_longitude?: number | null
          device_id?: string | null
          email?: string | null
          employee_id?: string | null
          first_name?: string
          id?: string
          is_active?: boolean | null
          last_name?: string
          location_updated_at?: string | null
          phone?: string
          skills?: string[] | null
          status?: string
          team?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      unjani_contract_audits: {
        Row: {
          audit_date: string
          clinic_code: string | null
          clinic_name: string
          connection_type: string
          contract_end: string | null
          contract_start: string
          contract_status: string
          contract_type: string
          created_at: string | null
          current_provider: string
          current_speed: number | null
          id: string
          migration_priority: string | null
          monthly_fee: number
          priority_reason: string | null
          province: string
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          audit_date: string
          clinic_code?: string | null
          clinic_name: string
          connection_type: string
          contract_end?: string | null
          contract_start: string
          contract_status: string
          contract_type: string
          created_at?: string | null
          current_provider: string
          current_speed?: number | null
          id?: string
          migration_priority?: string | null
          monthly_fee: number
          priority_reason?: string | null
          province: string
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          audit_date?: string
          clinic_code?: string | null
          clinic_name?: string
          connection_type?: string
          contract_end?: string | null
          contract_start?: string
          contract_status?: string
          contract_type?: string
          created_at?: string | null
          current_provider?: string
          current_speed?: number | null
          id?: string
          migration_priority?: string | null
          monthly_fee?: number
          priority_reason?: string | null
          province?: string
          submitted_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      unjani_install_orders: {
        Row: {
          address: string | null
          clinic_name: string | null
          commission_speedtest_path: string | null
          commission_speedtest_uploaded_at: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          corporate_site_id: string | null
          coverage_check_id: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          field_job_id: string | null
          fulfil_by_max: string
          fulfil_by_min: string
          id: string
          job_card_approved_at: string | null
          job_card_path: string | null
          kit_issued_at: string | null
          latitude: number | null
          longitude: number | null
          notes: string | null
          ordered_at: string
          organisation_id: string
          status: string
          stock_status: string
          survey_speedtest_path: string | null
          survey_speedtest_uploaded_at: string | null
          technician_id: string | null
          updated_at: string
          visit_date: string | null
        }
        Insert: {
          address?: string | null
          clinic_name?: string | null
          commission_speedtest_path?: string | null
          commission_speedtest_uploaded_at?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          corporate_site_id?: string | null
          coverage_check_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          field_job_id?: string | null
          fulfil_by_max: string
          fulfil_by_min: string
          id?: string
          job_card_approved_at?: string | null
          job_card_path?: string | null
          kit_issued_at?: string | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          ordered_at?: string
          organisation_id: string
          status?: string
          stock_status?: string
          survey_speedtest_path?: string | null
          survey_speedtest_uploaded_at?: string | null
          technician_id?: string | null
          updated_at?: string
          visit_date?: string | null
        }
        Update: {
          address?: string | null
          clinic_name?: string | null
          commission_speedtest_path?: string | null
          commission_speedtest_uploaded_at?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          corporate_site_id?: string | null
          coverage_check_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          field_job_id?: string | null
          fulfil_by_max?: string
          fulfil_by_min?: string
          id?: string
          job_card_approved_at?: string | null
          job_card_path?: string | null
          kit_issued_at?: string | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          ordered_at?: string
          organisation_id?: string
          status?: string
          stock_status?: string
          survey_speedtest_path?: string | null
          survey_speedtest_uploaded_at?: string | null
          technician_id?: string | null
          updated_at?: string
          visit_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unjani_install_orders_corporate_site_id_fkey"
            columns: ["corporate_site_id"]
            isOneToOne: false
            referencedRelation: "corporate_sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unjani_install_orders_coverage_check_id_fkey"
            columns: ["coverage_check_id"]
            isOneToOne: false
            referencedRelation: "b2b_coverage_checks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unjani_install_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_dashboard_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "unjani_install_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unjani_install_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_notification_engagement"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "unjani_install_orders_field_job_id_fkey"
            columns: ["field_job_id"]
            isOneToOne: false
            referencedRelation: "field_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unjani_install_orders_field_job_id_fkey"
            columns: ["field_job_id"]
            isOneToOne: false
            referencedRelation: "v_technician_status"
            referencedColumns: ["current_job_id"]
          },
          {
            foreignKeyName: "unjani_install_orders_field_job_id_fkey"
            columns: ["field_job_id"]
            isOneToOne: false
            referencedRelation: "v_todays_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unjani_install_orders_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unjani_install_orders_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "v_technician_status"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_history: {
        Row: {
          billing_cycle_end: string | null
          billing_cycle_start: string | null
          created_at: string
          customer_id: string
          date: string
          download_mb: number | null
          id: string
          service_id: string
          source: string
          synced_at: string | null
          total_mb: number | null
          updated_at: string
          upload_mb: number | null
        }
        Insert: {
          billing_cycle_end?: string | null
          billing_cycle_start?: string | null
          created_at?: string
          customer_id: string
          date: string
          download_mb?: number | null
          id?: string
          service_id: string
          source?: string
          synced_at?: string | null
          total_mb?: number | null
          updated_at?: string
          upload_mb?: number | null
        }
        Update: {
          billing_cycle_end?: string | null
          billing_cycle_start?: string | null
          created_at?: string
          customer_id?: string
          date?: string
          download_mb?: number | null
          id?: string
          service_id?: string
          source?: string
          synced_at?: string | null
          total_mb?: number | null
          updated_at?: string
          upload_mb?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_history_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_dashboard_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "usage_history_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_history_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_notification_engagement"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "usage_history_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "customer_services"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          department_id: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department_id?: string | null
          email: string
          full_name: string
          id: string
          is_active?: boolean | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department_id?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          role?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_users_department"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      validation_errors: {
        Row: {
          created_at: string
          error_message: string
          error_type: string
          id: string
          record_details: Json | null
          record_id: string
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          suggested_fix: string | null
          table_name: string
        }
        Insert: {
          created_at?: string
          error_message: string
          error_type: string
          id?: string
          record_details?: Json | null
          record_id: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          suggested_fix?: string | null
          table_name: string
        }
        Update: {
          created_at?: string
          error_message?: string
          error_type?: string
          id?: string
          record_details?: Json | null
          record_id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          suggested_fix?: string | null
          table_name?: string
        }
        Relationships: []
      }
      ward_demographics: {
        Row: {
          boundary: unknown
          business_poi_count: number | null
          centroid_lat: number | null
          centroid_lng: number | null
          centroid_location: unknown
          data_source: string | null
          demographic_fit_score: number | null
          fleet_logistics_poi_count: number
          healthcare_poi_count: number | null
          hospitality_poi_count: number
          id: string
          imported_at: string | null
          industrial_poi_count: number
          municipality: string | null
          office_poi_count: number | null
          pct_cellphone_internet: number | null
          pct_employed: number | null
          pct_fixed_internet: number | null
          pct_formal_dwelling: number | null
          pct_income_above_r12800: number | null
          pct_income_r6400_12800: number | null
          pct_no_internet: number | null
          province: string
          retail_chain_poi_count: number
          security_poi_count: number
          total_households: number | null
          total_population: number | null
          updated_at: string | null
          ward_code: string
          ward_name: string | null
        }
        Insert: {
          boundary?: unknown
          business_poi_count?: number | null
          centroid_lat?: number | null
          centroid_lng?: number | null
          centroid_location?: unknown
          data_source?: string | null
          demographic_fit_score?: number | null
          fleet_logistics_poi_count?: number
          healthcare_poi_count?: number | null
          hospitality_poi_count?: number
          id?: string
          imported_at?: string | null
          industrial_poi_count?: number
          municipality?: string | null
          office_poi_count?: number | null
          pct_cellphone_internet?: number | null
          pct_employed?: number | null
          pct_fixed_internet?: number | null
          pct_formal_dwelling?: number | null
          pct_income_above_r12800?: number | null
          pct_income_r6400_12800?: number | null
          pct_no_internet?: number | null
          province: string
          retail_chain_poi_count?: number
          security_poi_count?: number
          total_households?: number | null
          total_population?: number | null
          updated_at?: string | null
          ward_code: string
          ward_name?: string | null
        }
        Update: {
          boundary?: unknown
          business_poi_count?: number | null
          centroid_lat?: number | null
          centroid_lng?: number | null
          centroid_location?: unknown
          data_source?: string | null
          demographic_fit_score?: number | null
          fleet_logistics_poi_count?: number
          healthcare_poi_count?: number | null
          hospitality_poi_count?: number
          id?: string
          imported_at?: string | null
          industrial_poi_count?: number
          municipality?: string | null
          office_poi_count?: number | null
          pct_cellphone_internet?: number | null
          pct_employed?: number | null
          pct_fixed_internet?: number | null
          pct_formal_dwelling?: number | null
          pct_income_above_r12800?: number | null
          pct_income_r6400_12800?: number | null
          pct_no_internet?: number | null
          province?: string
          retail_chain_poi_count?: number
          security_poi_count?: number
          total_households?: number | null
          total_population?: number | null
          updated_at?: string | null
          ward_code?: string
          ward_name?: string | null
        }
        Relationships: []
      }
      warehouse_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          install_order_id: string | null
          movement_type: string
          notes: string | null
          qty: number
          replenishment_id: string | null
          sku: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          install_order_id?: string | null
          movement_type: string
          notes?: string | null
          qty: number
          replenishment_id?: string | null
          sku: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          install_order_id?: string | null
          movement_type?: string
          notes?: string | null
          qty?: number
          replenishment_id?: string | null
          sku?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_movements_install_order_id_fkey"
            columns: ["install_order_id"]
            isOneToOne: false
            referencedRelation: "unjani_install_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_movements_replenishment_id_fkey"
            columns: ["replenishment_id"]
            isOneToOne: false
            referencedRelation: "warehouse_replenishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_movements_sku_fkey"
            columns: ["sku"]
            isOneToOne: false
            referencedRelation: "warehouse_skus"
            referencedColumns: ["sku"]
          },
        ]
      }
      warehouse_replenishments: {
        Row: {
          created_at: string
          due_at: string
          id: string
          install_order_id: string | null
          ordered_at: string
          qty: number
          received_at: string | null
          sku: string
        }
        Insert: {
          created_at?: string
          due_at: string
          id?: string
          install_order_id?: string | null
          ordered_at?: string
          qty: number
          received_at?: string | null
          sku: string
        }
        Update: {
          created_at?: string
          due_at?: string
          id?: string
          install_order_id?: string | null
          ordered_at?: string
          qty?: number
          received_at?: string | null
          sku?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_replenishments_install_order_id_fkey"
            columns: ["install_order_id"]
            isOneToOne: false
            referencedRelation: "unjani_install_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_replenishments_sku_fkey"
            columns: ["sku"]
            isOneToOne: false
            referencedRelation: "warehouse_skus"
            referencedColumns: ["sku"]
          },
        ]
      }
      warehouse_skus: {
        Row: {
          created_at: string
          description: string | null
          kit_role: string | null
          name: string
          sku: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          kit_role?: string | null
          name: string
          sku: string
        }
        Update: {
          created_at?: string
          description?: string | null
          kit_role?: string | null
          name?: string
          sku?: string
        }
        Relationships: []
      }
      warehouse_stock: {
        Row: {
          qty_on_hand: number
          qty_reserved: number
          sku: string
          updated_at: string
        }
        Insert: {
          qty_on_hand?: number
          qty_reserved?: number
          sku: string
          updated_at?: string
        }
        Update: {
          qty_on_hand?: number
          qty_reserved?: number
          sku?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_stock_sku_fkey"
            columns: ["sku"]
            isOneToOne: true
            referencedRelation: "warehouse_skus"
            referencedColumns: ["sku"]
          },
        ]
      }
      whatsapp_consent_audit: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          customer_count: number | null
          customer_id: string | null
          id: string
          ip_address: string | null
          reason: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          customer_count?: number | null
          customer_id?: string | null
          id?: string
          ip_address?: string | null
          reason?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          customer_count?: number | null
          customer_id?: string | null
          id?: string
          ip_address?: string | null
          reason?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_consent_audit_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "active_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_consent_audit_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_consent_audit_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_consent_audit_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_dashboard_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "whatsapp_consent_audit_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_consent_audit_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_notification_engagement"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      whatsapp_desk_threads: {
        Row: {
          contact_name: string | null
          created_at: string
          desk_ticket_id: string
          desk_ticket_number: string | null
          id: string
          last_inbound_wa_message_id: string | null
          last_synced_comment_id: string | null
          status: string
          updated_at: string
          wa_from: string
        }
        Insert: {
          contact_name?: string | null
          created_at?: string
          desk_ticket_id: string
          desk_ticket_number?: string | null
          id?: string
          last_inbound_wa_message_id?: string | null
          last_synced_comment_id?: string | null
          status?: string
          updated_at?: string
          wa_from: string
        }
        Update: {
          contact_name?: string | null
          created_at?: string
          desk_ticket_id?: string
          desk_ticket_number?: string | null
          id?: string
          last_inbound_wa_message_id?: string | null
          last_synced_comment_id?: string | null
          status?: string
          updated_at?: string
          wa_from?: string
        }
        Relationships: []
      }
      whatsapp_flow_sessions: {
        Row: {
          completed_at: string | null
          coverage_lead_id: string | null
          created_at: string
          entry_source: string
          flow_id: string
          flow_name: string
          flow_token: string
          id: string
          phone: string
          raw_webhook: Json | null
          response_payload: Json | null
          source_campaign: string | null
          status: string
          updated_at: string
          whatsapp_message_id: string | null
        }
        Insert: {
          completed_at?: string | null
          coverage_lead_id?: string | null
          created_at?: string
          entry_source: string
          flow_id: string
          flow_name: string
          flow_token: string
          id?: string
          phone: string
          raw_webhook?: Json | null
          response_payload?: Json | null
          source_campaign?: string | null
          status?: string
          updated_at?: string
          whatsapp_message_id?: string | null
        }
        Update: {
          completed_at?: string | null
          coverage_lead_id?: string | null
          created_at?: string
          entry_source?: string
          flow_id?: string
          flow_name?: string
          flow_token?: string
          id?: string
          phone?: string
          raw_webhook?: Json | null
          response_payload?: Json | null
          source_campaign?: string | null
          status?: string
          updated_at?: string
          whatsapp_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_flow_sessions_coverage_lead_id_fkey"
            columns: ["coverage_lead_id"]
            isOneToOne: false
            referencedRelation: "coverage_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_message_log: {
        Row: {
          billable: boolean | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          error_code: number | null
          error_message: string | null
          id: string
          invoice_id: string | null
          message_id: string | null
          phone: string
          pricing_category: string | null
          status: string
          status_updated_at: string | null
          template_name: string
          wa_id: string | null
        }
        Insert: {
          billable?: boolean | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          error_code?: number | null
          error_message?: string | null
          id?: string
          invoice_id?: string | null
          message_id?: string | null
          phone: string
          pricing_category?: string | null
          status?: string
          status_updated_at?: string | null
          template_name: string
          wa_id?: string | null
        }
        Update: {
          billable?: boolean | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          error_code?: number | null
          error_message?: string | null
          id?: string
          invoice_id?: string | null
          message_id?: string | null
          phone?: string
          pricing_category?: string | null
          status?: string
          status_updated_at?: string | null
          template_name?: string
          wa_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_message_log_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_dashboard_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "whatsapp_message_log_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_message_log_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_notification_engagement"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "whatsapp_message_log_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_optin_tokens: {
        Row: {
          created_at: string
          customer_id: string
          expires_at: string
          id: string
          phone: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          expires_at?: string
          id?: string
          phone: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          expires_at?: string
          id?: string
          phone?: string
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_optin_tokens_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_dashboard_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "whatsapp_optin_tokens_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_optin_tokens_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_notification_engagement"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      zoho_entity_mappings: {
        Row: {
          circletel_id: string
          circletel_type: string
          created_at: string | null
          id: string
          last_synced_at: string | null
          zoho_id: string
          zoho_type: string
        }
        Insert: {
          circletel_id: string
          circletel_type: string
          created_at?: string | null
          id?: string
          last_synced_at?: string | null
          zoho_id: string
          zoho_type: string
        }
        Update: {
          circletel_id?: string
          circletel_type?: string
          created_at?: string | null
          id?: string
          last_synced_at?: string | null
          zoho_id?: string
          zoho_type?: string
        }
        Relationships: []
      }
      zoho_sync_logs: {
        Row: {
          attempt_number: number | null
          created_at: string | null
          entity_id: string
          entity_type: string
          error_message: string | null
          id: string
          request_payload: Json | null
          response_payload: Json | null
          status: string
          zoho_entity_id: string | null
          zoho_entity_type: string | null
        }
        Insert: {
          attempt_number?: number | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          error_message?: string | null
          id?: string
          request_payload?: Json | null
          response_payload?: Json | null
          status?: string
          zoho_entity_id?: string | null
          zoho_entity_type?: string | null
        }
        Update: {
          attempt_number?: number | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          error_message?: string | null
          id?: string
          request_payload?: Json | null
          response_payload?: Json | null
          status?: string
          zoho_entity_id?: string | null
          zoho_entity_type?: string | null
        }
        Relationships: []
      }
      zoho_tokens: {
        Row: {
          access_token: string
          created_at: string | null
          expires_at: string
          id: string
          refresh_token: string
          scope: string | null
          token_type: string | null
          updated_at: string | null
        }
        Insert: {
          access_token: string
          created_at?: string | null
          expires_at: string
          id?: string
          refresh_token: string
          scope?: string | null
          token_type?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          refresh_token?: string
          scope?: string | null
          token_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      zone_discovery_candidates: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          arlan_only_zone: boolean
          arlan_upsell_use_cases: string[] | null
          auto_decided_at: string | null
          auto_decision: string | null
          base_station_connections: number | null
          base_station_count: number | null
          business_poi_count: number | null
          campaign_tag: string | null
          center_lat: number
          center_lng: number
          composite_score: number | null
          coverage_score: number | null
          created_at: string
          created_zone_id: string | null
          demographic_fit_score: number | null
          dfa_connected_count: number | null
          dfa_near_net_count: number | null
          discovery_batch_id: string
          eligible_products: string[]
          estimated_arlan_mrr: number | null
          healthcare_poi_count: number | null
          id: string
          market_opportunity_score: number | null
          milestone_month: number | null
          milestone_target_products: string[] | null
          municipality: string | null
          office_poi_count: number | null
          pct_income_above_r12800: number | null
          pct_no_internet: number | null
          product_alignment_score: number | null
          province: string
          rejection_reason: string | null
          status: string
          suggested_zone_name: string
          suggested_zone_type: string
          total_households: number | null
          total_population: number | null
          updated_at: string
          ward_code: string
          ward_name: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          arlan_only_zone?: boolean
          arlan_upsell_use_cases?: string[] | null
          auto_decided_at?: string | null
          auto_decision?: string | null
          base_station_connections?: number | null
          base_station_count?: number | null
          business_poi_count?: number | null
          campaign_tag?: string | null
          center_lat: number
          center_lng: number
          composite_score?: number | null
          coverage_score?: number | null
          created_at?: string
          created_zone_id?: string | null
          demographic_fit_score?: number | null
          dfa_connected_count?: number | null
          dfa_near_net_count?: number | null
          discovery_batch_id: string
          eligible_products?: string[]
          estimated_arlan_mrr?: number | null
          healthcare_poi_count?: number | null
          id?: string
          market_opportunity_score?: number | null
          milestone_month?: number | null
          milestone_target_products?: string[] | null
          municipality?: string | null
          office_poi_count?: number | null
          pct_income_above_r12800?: number | null
          pct_no_internet?: number | null
          product_alignment_score?: number | null
          province: string
          rejection_reason?: string | null
          status?: string
          suggested_zone_name: string
          suggested_zone_type: string
          total_households?: number | null
          total_population?: number | null
          updated_at?: string
          ward_code: string
          ward_name?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          arlan_only_zone?: boolean
          arlan_upsell_use_cases?: string[] | null
          auto_decided_at?: string | null
          auto_decision?: string | null
          base_station_connections?: number | null
          base_station_count?: number | null
          business_poi_count?: number | null
          campaign_tag?: string | null
          center_lat?: number
          center_lng?: number
          composite_score?: number | null
          coverage_score?: number | null
          created_at?: string
          created_zone_id?: string | null
          demographic_fit_score?: number | null
          dfa_connected_count?: number | null
          dfa_near_net_count?: number | null
          discovery_batch_id?: string
          eligible_products?: string[]
          estimated_arlan_mrr?: number | null
          healthcare_poi_count?: number | null
          id?: string
          market_opportunity_score?: number | null
          milestone_month?: number | null
          milestone_target_products?: string[] | null
          municipality?: string | null
          office_poi_count?: number | null
          pct_income_above_r12800?: number | null
          pct_no_internet?: number | null
          product_alignment_score?: number | null
          province?: string
          rejection_reason?: string | null
          status?: string
          suggested_zone_name?: string
          suggested_zone_type?: string
          total_households?: number | null
          total_population?: number | null
          updated_at?: string
          ward_code?: string
          ward_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "zone_discovery_candidates_created_zone_id_fkey"
            columns: ["created_zone_id"]
            isOneToOne: false
            referencedRelation: "sales_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_metrics: {
        Row: {
          active_customers: number | null
          active_rns: number | null
          addresses_canvassed: number | null
          avg_arpu: number | null
          closed_deals: number | null
          conversion_rate_trend: string | null
          cost_per_activation: number | null
          coverage_to_lead_rate: number | null
          created_at: string | null
          id: string
          lead_to_close_rate: number | null
          leads_generated: number | null
          linkedin_contacts: number | null
          new_mrr_added: number | null
          penetration_rate: number | null
          qualified_leads: number | null
          recommended_action: string | null
          referrals_generated: number | null
          serviceable_addresses: number | null
          total_zone_mrr: number | null
          walk_ins: number | null
          week_start: string
          whatsapp_contacts: number | null
          zone_id: string
        }
        Insert: {
          active_customers?: number | null
          active_rns?: number | null
          addresses_canvassed?: number | null
          avg_arpu?: number | null
          closed_deals?: number | null
          conversion_rate_trend?: string | null
          cost_per_activation?: number | null
          coverage_to_lead_rate?: number | null
          created_at?: string | null
          id?: string
          lead_to_close_rate?: number | null
          leads_generated?: number | null
          linkedin_contacts?: number | null
          new_mrr_added?: number | null
          penetration_rate?: number | null
          qualified_leads?: number | null
          recommended_action?: string | null
          referrals_generated?: number | null
          serviceable_addresses?: number | null
          total_zone_mrr?: number | null
          walk_ins?: number | null
          week_start: string
          whatsapp_contacts?: number | null
          zone_id: string
        }
        Update: {
          active_customers?: number | null
          active_rns?: number | null
          addresses_canvassed?: number | null
          avg_arpu?: number | null
          closed_deals?: number | null
          conversion_rate_trend?: string | null
          cost_per_activation?: number | null
          coverage_to_lead_rate?: number | null
          created_at?: string | null
          id?: string
          lead_to_close_rate?: number | null
          leads_generated?: number | null
          linkedin_contacts?: number | null
          new_mrr_added?: number | null
          penetration_rate?: number | null
          qualified_leads?: number | null
          recommended_action?: string | null
          referrals_generated?: number | null
          serviceable_addresses?: number | null
          total_zone_mrr?: number | null
          walk_ins?: number | null
          week_start?: string
          whatsapp_contacts?: number | null
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_metrics_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "sales_zones"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      active_admin_users: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          last_login: string | null
          permissions: Json | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          last_login?: string | null
          permissions?: Json | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          last_login?: string | null
          permissions?: Json | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_user_permissions: {
        Row: {
          custom_permissions: Json | null
          department: string | null
          effective_permissions: Json | null
          email: string | null
          full_name: string | null
          id: string | null
          job_title: string | null
          role: string | null
          role_template_id: string | null
          role_template_name: string | null
          template_permissions: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_users_role_template_id_fkey"
            columns: ["role_template_id"]
            isOneToOne: false
            referencedRelation: "role_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      business_journey_summary: {
        Row: {
          account_number: string | null
          account_status:
            | Database["public"]["Enums"]["business_account_status"]
            | null
          blocked_stage:
            | Database["public"]["Enums"]["business_journey_stage"]
            | null
          business_customer_id: string | null
          company_name: string | null
          completed_stages: number | null
          created_at: string | null
          current_stage:
            | Database["public"]["Enums"]["business_journey_stage"]
            | null
          current_step: number | null
          is_blocked: boolean | null
          journey_completed_at: string | null
          journey_started_at: string | null
          kyc_status: Database["public"]["Enums"]["business_kyc_status"] | null
          progress_percentage: number | null
          quote_id: string | null
          total_stages: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_journey_stages_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "business_quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_journey_stages_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quote_analytics"
            referencedColumns: ["quote_id"]
          },
        ]
      }
      cms_blog_posts: {
        Row: {
          author_name: string | null
          categories: string[] | null
          content_html: string | null
          created_at: string | null
          excerpt: string | null
          featured_image_alt: string | null
          featured_image_hero_url: string | null
          featured_image_thumb_url: string | null
          featured_image_url: string | null
          id: number | null
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          slug: string | null
          title: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      customer_dashboard_summary: {
        Row: {
          active_services_count: number | null
          billing_info: Json | null
          customer_id: string | null
          customer_since: string | null
          email: string | null
          first_name: string | null
          last_name: string | null
          overdue_invoices: number | null
          pending_orders: number | null
          phone: string | null
          primary_service: Json | null
          total_orders: number | null
        }
        Insert: {
          active_services_count?: never
          billing_info?: never
          customer_id?: string | null
          customer_since?: string | null
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          overdue_invoices?: never
          pending_orders?: never
          phone?: string | null
          primary_service?: never
          total_orders?: never
        }
        Update: {
          active_services_count?: never
          billing_info?: never
          customer_id?: string | null
          customer_since?: string | null
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          overdue_invoices?: never
          pending_orders?: never
          phone?: string | null
          primary_service?: never
          total_orders?: never
        }
        Relationships: []
      }
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
      product_price_changes: {
        Row: {
          action: string | null
          change_reason: string | null
          changed_at: string | null
          changed_by_email: string | null
          changed_by_name: string | null
          id: string | null
          new_monthly_price: number | null
          new_setup_fee: number | null
          old_monthly_price: number | null
          old_setup_fee: number | null
          price_trend: string | null
          product_id: string | null
          product_name: string | null
          product_slug: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_audit_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_health_current: {
        Row: {
          checked_at: string | null
          health_level: string | null
          latency_ms: number | null
          packet_loss_percent: number | null
          provider_name: string | null
          status: string | null
        }
        Relationships: []
      }
      quote_analytics: {
        Row: {
          company_name: string | null
          contact_email: string | null
          downloads: number | null
          emails_sent: number | null
          last_viewed_at: string | null
          quote_created_at: string | null
          quote_id: string | null
          quote_number: string | null
          shares: number | null
          status: Database["public"]["Enums"]["quote_status"] | null
          total_time_spent_seconds: number | null
          total_views: number | null
          unique_views: number | null
        }
        Relationships: []
      }
      smb_products_complete: {
        Row: {
          cost_components: Json | null
          created_at: string | null
          effective_date: string | null
          features: Json | null
          gross_margin_percentage: number | null
          gross_profit_zar: number | null
          id: string | null
          installation_fee_zar: number | null
          is_active: boolean | null
          package_code: string | null
          package_name: string | null
          product_category: string | null
          promo_price_zar: number | null
          regular_price_zar: number | null
          router_amortised_monthly_zar: number | null
          router_concurrent_users: number | null
          router_dealer_price_excl_vat_zar: number | null
          router_features: Json | null
          router_model: string | null
          router_ports: number | null
          router_retail_price_incl_vat_zar: number | null
          router_throughput_mbps: number | null
          router_wifi_standard: string | null
          selling_price_excl_vat_zar: number | null
          selling_price_incl_vat_zar: number | null
          speed_mbps: number | null
          total_cost_zar: number | null
          total_first_month_promo_zar: number | null
          total_first_month_regular_zar: number | null
          updated_at: string | null
          version: string | null
        }
        Relationships: []
      }
      sme_packages: {
        Row: {
          active: boolean | null
          created_at: string | null
          customer_type: string | null
          description: string | null
          features: string[] | null
          id: string | null
          name: string | null
          price: number | null
          product_category: string | null
          promotion_price: number | null
          service_type: string | null
          speed_down: number | null
          speed_up: number | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          customer_type?: string | null
          description?: string | null
          features?: string[] | null
          id?: string | null
          name?: string | null
          price?: number | null
          product_category?: string | null
          promotion_price?: number | null
          service_type?: string | null
          speed_down?: number | null
          speed_up?: number | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          customer_type?: string | null
          description?: string | null
          features?: string[] | null
          id?: string | null
          name?: string | null
          price?: number | null
          product_category?: string | null
          promotion_price?: number | null
          service_type?: string | null
          speed_down?: number | null
          speed_up?: number | null
        }
        Relationships: []
      }
      v_active_providers: {
        Row: {
          active: boolean | null
          coverage_source: string | null
          display_name: string | null
          id: string | null
          name: string | null
          priority: number | null
          provider_code: string | null
          provider_type: string | null
          service_offerings: Json | null
          support_contact: string | null
        }
        Insert: {
          active?: boolean | null
          coverage_source?: string | null
          display_name?: string | null
          id?: string | null
          name?: string | null
          priority?: number | null
          provider_code?: string | null
          provider_type?: string | null
          service_offerings?: Json | null
          support_contact?: string | null
        }
        Update: {
          active?: boolean | null
          coverage_source?: string | null
          display_name?: string | null
          id?: string | null
          name?: string | null
          priority?: number | null
          provider_code?: string | null
          provider_type?: string | null
          service_offerings?: Json | null
          support_contact?: string | null
        }
        Relationships: []
      }
      v_active_service_packages: {
        Row: {
          base_price_zar: number | null
          compatible_providers: string[] | null
          cost_price_zar: number | null
          created_at: string | null
          customer_type: string | null
          description: string | null
          features: string[] | null
          id: string | null
          is_featured: boolean | null
          is_popular: boolean | null
          metadata: Json | null
          name: string | null
          network_provider_id: string | null
          price: number | null
          pricing: Json | null
          product_category: string | null
          promotion_months: number | null
          promotion_price: number | null
          service_type: string | null
          sku: string | null
          slug: string | null
          speed_down: number | null
          speed_up: number | null
          updated_at: string | null
        }
        Insert: {
          base_price_zar?: number | null
          compatible_providers?: string[] | null
          cost_price_zar?: number | null
          created_at?: string | null
          customer_type?: string | null
          description?: string | null
          features?: string[] | null
          id?: string | null
          is_featured?: boolean | null
          is_popular?: boolean | null
          metadata?: Json | null
          name?: string | null
          network_provider_id?: string | null
          price?: number | null
          pricing?: Json | null
          product_category?: string | null
          promotion_months?: number | null
          promotion_price?: number | null
          service_type?: string | null
          sku?: string | null
          slug?: string | null
          speed_down?: number | null
          speed_up?: number | null
          updated_at?: string | null
        }
        Update: {
          base_price_zar?: number | null
          compatible_providers?: string[] | null
          cost_price_zar?: number | null
          created_at?: string | null
          customer_type?: string | null
          description?: string | null
          features?: string[] | null
          id?: string | null
          is_featured?: boolean | null
          is_popular?: boolean | null
          metadata?: Json | null
          name?: string | null
          network_provider_id?: string | null
          price?: number | null
          pricing?: Json | null
          product_category?: string | null
          promotion_months?: number | null
          promotion_price?: number | null
          service_type?: string | null
          sku?: string | null
          slug?: string | null
          speed_down?: number | null
          speed_up?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_packages_network_provider_id_fkey"
            columns: ["network_provider_id"]
            isOneToOne: false
            referencedRelation: "fttb_network_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_packages_network_provider_id_fkey"
            columns: ["network_provider_id"]
            isOneToOne: false
            referencedRelation: "v_active_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_packages_network_provider_id_fkey"
            columns: ["network_provider_id"]
            isOneToOne: false
            referencedRelation: "v_providers_with_logos"
            referencedColumns: ["id"]
          },
        ]
      }
      v_admin_audit_logs_recent: {
        Row: {
          action: string | null
          action_category: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          ip_address: string | null
          is_suspicious: boolean | null
          metadata: Json | null
          severity: string | null
          status: string | null
          user_email: string | null
        }
        Relationships: []
      }
      v_ar_dashboard_summary: {
        Row: {
          avg_days_overdue: number | null
          current_amount: number | null
          current_count: number | null
          overdue_1_30_amount: number | null
          overdue_1_30_count: number | null
          overdue_31_60_amount: number | null
          overdue_31_60_count: number | null
          overdue_61_90_amount: number | null
          overdue_61_90_count: number | null
          overdue_90_plus_amount: number | null
          overdue_90_plus_count: number | null
          total_outstanding_amount: number | null
          total_outstanding_invoices: number | null
        }
        Relationships: []
      }
      v_competitor_price_comparison: {
        Row: {
          competitor_data: string | null
          competitor_data_gb: number | null
          competitor_device: string | null
          competitor_logo: string | null
          competitor_name: string | null
          competitor_once_off: number | null
          competitor_price: number | null
          competitor_product: string | null
          competitor_product_id: string | null
          competitor_slug: string | null
          competitor_technology: string | null
          competitor_term: number | null
          match_confidence: number | null
          match_id: string | null
          match_method: string | null
          product_id: string | null
          product_type: string | null
          provider_id: string | null
          scraped_at: string | null
          source_url: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitor_products_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "competitor_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitor_products_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "v_competitor_provider_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      v_competitor_provider_stats: {
        Row: {
          avg_monthly_price: number | null
          current_products: number | null
          id: string | null
          is_active: boolean | null
          last_scraped_at: string | null
          logo_url: string | null
          matched_products: number | null
          max_monthly_price: number | null
          min_monthly_price: number | null
          name: string | null
          provider_type: string | null
          scrape_frequency: string | null
          slug: string | null
          total_products: number | null
          website: string | null
        }
        Relationships: []
      }
      v_customer_notification_engagement: {
        Row: {
          customer_id: string | null
          email: string | null
          email_opens: number | null
          engagement_score: number | null
          last_clicked_link: string | null
          last_notification: string | null
          last_opened_email: string | null
          link_clicks: number | null
          phone: string | null
          total_emails: number | null
          total_notifications: number | null
          total_sms: number | null
        }
        Relationships: []
      }
      v_email_template_performance: {
        Row: {
          active_versions: number | null
          avg_click_rate: number | null
          avg_open_rate: number | null
          category: string | null
          last_sent_at: string | null
          name: string | null
          template_id: string | null
          total_sent: number | null
          version_count: number | null
        }
        Relationships: []
      }
      v_hardware_installations: {
        Row: {
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          hardware_id: string | null
          hardware_label: string | null
          hardware_model: string | null
          hardware_source: string | null
          hardware_status: string | null
          last_seen_at: string | null
          lat: number | null
          link_method: string | null
          lng: number | null
          location_address: string | null
          location_id: string | null
          location_name: string | null
          location_type: string | null
          package_name: string | null
          province: string | null
          service_active: boolean | null
          service_id: string | null
          service_status: string | null
        }
        Relationships: []
      }
      v_hardware_product_detail: {
        Row: {
          best_supplier_cost: number | null
          category: string | null
          cost_price: number | null
          description: string | null
          id: string | null
          image_url: string | null
          is_featured: boolean | null
          markup_percentage: number | null
          name: string | null
          primary_supplier_code: string | null
          published_at: string | null
          retail_price: number | null
          slug: string | null
          sort_order: number | null
          specifications: Json | null
          status: string | null
          stock_cpt: number | null
          stock_dbn: number | null
          stock_jhb: number | null
          supplier_count: number | null
          terms_back_to_back: boolean | null
          terms_return: string | null
          terms_warranty: string | null
          total_stock: number | null
          warranty_description: string | null
          warranty_months: number | null
        }
        Relationships: []
      }
      v_marketing_email_status: {
        Row: {
          can_receive_any_marketing: boolean | null
          can_receive_newsletter: boolean | null
          can_receive_partner_offers: boolean | null
          can_receive_product_updates: boolean | null
          can_receive_promotional: boolean | null
          customer_id: string | null
          email: string | null
          unsubscribed_at: string | null
          updated_at: string | null
        }
        Insert: {
          can_receive_any_marketing?: never
          can_receive_newsletter?: never
          can_receive_partner_offers?: never
          can_receive_product_updates?: never
          can_receive_promotional?: never
          customer_id?: string | null
          email?: string | null
          unsubscribed_at?: string | null
          updated_at?: string | null
        }
        Update: {
          can_receive_any_marketing?: never
          can_receive_newsletter?: never
          can_receive_partner_offers?: never
          can_receive_product_updates?: never
          can_receive_promotional?: never
          customer_id?: string | null
          email?: string | null
          unsubscribed_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_email_preferences_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_dashboard_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "marketing_email_preferences_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_email_preferences_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_notification_engagement"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      v_mtn_curated_deals: {
        Row: {
          anytime_minutes: string | null
          anytime_minutes_value: number | null
          auto_curated: boolean | null
          available_on_helios: boolean | null
          available_on_ilula: boolean | null
          business_use_case: string | null
          channel: string | null
          circletel_commission: number | null
          circletel_commission_share: number | null
          commission_tier: string | null
          contract_term: number | null
          contract_term_label: string | null
          curation_status: string | null
          data_bundle: string | null
          data_bundle_gb: number | null
          deal_id: string | null
          device_name: string | null
          device_status: string | null
          effective_commission_rate: number | null
          free_cli: boolean | null
          free_itb: boolean | null
          free_sim: boolean | null
          freebies_device: string | null
          freebies_priceplan: string | null
          has_device: boolean | null
          id: string | null
          inventory_status: string | null
          is_current_deal: boolean | null
          is_visible_on_frontend: boolean | null
          markup_type: string | null
          markup_value: number | null
          monthly_markup_revenue: number | null
          mtn_commission_rate: number | null
          mtn_commission_to_arlan: number | null
          mtn_price_excl_vat: number | null
          mtn_price_incl_vat: number | null
          on_net_minutes: string | null
          once_off_pay_in_incl_vat: number | null
          package_description: string | null
          price_plan: string | null
          promo_end_date: string | null
          promo_start_date: string | null
          selling_price_excl_vat: number | null
          selling_price_incl_vat: number | null
          sms_bundle: string | null
          status: string | null
          tariff_description: string | null
          technology: string | null
          total_data: string | null
          total_minutes: string | null
        }
        Insert: {
          anytime_minutes?: string | null
          anytime_minutes_value?: number | null
          auto_curated?: boolean | null
          available_on_helios?: boolean | null
          available_on_ilula?: boolean | null
          business_use_case?: string | null
          channel?: string | null
          circletel_commission?: never
          circletel_commission_share?: number | null
          commission_tier?: string | null
          contract_term?: number | null
          contract_term_label?: string | null
          curation_status?: string | null
          data_bundle?: string | null
          data_bundle_gb?: number | null
          deal_id?: string | null
          device_name?: string | null
          device_status?: string | null
          effective_commission_rate?: never
          free_cli?: boolean | null
          free_itb?: boolean | null
          free_sim?: boolean | null
          freebies_device?: string | null
          freebies_priceplan?: string | null
          has_device?: boolean | null
          id?: string | null
          inventory_status?: string | null
          is_current_deal?: never
          is_visible_on_frontend?: boolean | null
          markup_type?: string | null
          markup_value?: number | null
          monthly_markup_revenue?: never
          mtn_commission_rate?: number | null
          mtn_commission_to_arlan?: never
          mtn_price_excl_vat?: number | null
          mtn_price_incl_vat?: number | null
          on_net_minutes?: string | null
          once_off_pay_in_incl_vat?: number | null
          package_description?: string | null
          price_plan?: string | null
          promo_end_date?: string | null
          promo_start_date?: string | null
          selling_price_excl_vat?: number | null
          selling_price_incl_vat?: number | null
          sms_bundle?: string | null
          status?: string | null
          tariff_description?: string | null
          technology?: string | null
          total_data?: string | null
          total_minutes?: string | null
        }
        Update: {
          anytime_minutes?: string | null
          anytime_minutes_value?: number | null
          auto_curated?: boolean | null
          available_on_helios?: boolean | null
          available_on_ilula?: boolean | null
          business_use_case?: string | null
          channel?: string | null
          circletel_commission?: never
          circletel_commission_share?: number | null
          commission_tier?: string | null
          contract_term?: number | null
          contract_term_label?: string | null
          curation_status?: string | null
          data_bundle?: string | null
          data_bundle_gb?: number | null
          deal_id?: string | null
          device_name?: string | null
          device_status?: string | null
          effective_commission_rate?: never
          free_cli?: boolean | null
          free_itb?: boolean | null
          free_sim?: boolean | null
          freebies_device?: string | null
          freebies_priceplan?: string | null
          has_device?: boolean | null
          id?: string | null
          inventory_status?: string | null
          is_current_deal?: never
          is_visible_on_frontend?: boolean | null
          markup_type?: string | null
          markup_value?: number | null
          monthly_markup_revenue?: never
          mtn_commission_rate?: number | null
          mtn_commission_to_arlan?: never
          mtn_price_excl_vat?: number | null
          mtn_price_incl_vat?: number | null
          on_net_minutes?: string | null
          once_off_pay_in_incl_vat?: number | null
          package_description?: string | null
          price_plan?: string | null
          promo_end_date?: string | null
          promo_start_date?: string | null
          selling_price_excl_vat?: number | null
          selling_price_incl_vat?: number | null
          sms_bundle?: string | null
          status?: string | null
          tariff_description?: string | null
          technology?: string | null
          total_data?: string | null
          total_minutes?: string | null
        }
        Relationships: []
      }
      v_mtn_dealer_commission_calculator: {
        Row: {
          anytime_minutes: string | null
          circletel_commission: number | null
          circletel_commission_incl_vat: number | null
          circletel_commission_share: number | null
          commission_tier: string | null
          contract_term: number | null
          contract_term_label: string | null
          data_bundle: string | null
          deal_id: string | null
          device_name: string | null
          effective_commission_rate: number | null
          has_device: boolean | null
          id: string | null
          is_current_deal: boolean | null
          markup_type: string | null
          markup_value: number | null
          mtn_commission_rate: number | null
          mtn_commission_to_arlan: number | null
          mtn_price_excl_vat: number | null
          mtn_price_incl_vat: number | null
          price_plan: string | null
          promo_end_date: string | null
          promo_start_date: string | null
          selling_price_excl_vat: number | null
          selling_price_incl_vat: number | null
          sms_bundle: string | null
          status: string | null
          technology: string | null
          total_contract_value: number | null
        }
        Insert: {
          anytime_minutes?: string | null
          circletel_commission?: never
          circletel_commission_incl_vat?: never
          circletel_commission_share?: number | null
          commission_tier?: string | null
          contract_term?: number | null
          contract_term_label?: string | null
          data_bundle?: string | null
          deal_id?: string | null
          device_name?: string | null
          effective_commission_rate?: never
          has_device?: boolean | null
          id?: string | null
          is_current_deal?: never
          markup_type?: string | null
          markup_value?: number | null
          mtn_commission_rate?: number | null
          mtn_commission_to_arlan?: never
          mtn_price_excl_vat?: number | null
          mtn_price_incl_vat?: number | null
          price_plan?: string | null
          promo_end_date?: string | null
          promo_start_date?: string | null
          selling_price_excl_vat?: number | null
          selling_price_incl_vat?: number | null
          sms_bundle?: string | null
          status?: string | null
          technology?: string | null
          total_contract_value?: never
        }
        Update: {
          anytime_minutes?: string | null
          circletel_commission?: never
          circletel_commission_incl_vat?: never
          circletel_commission_share?: number | null
          commission_tier?: string | null
          contract_term?: number | null
          contract_term_label?: string | null
          data_bundle?: string | null
          deal_id?: string | null
          device_name?: string | null
          effective_commission_rate?: never
          has_device?: boolean | null
          id?: string | null
          is_current_deal?: never
          markup_type?: string | null
          markup_value?: number | null
          mtn_commission_rate?: number | null
          mtn_commission_to_arlan?: never
          mtn_price_excl_vat?: number | null
          mtn_price_incl_vat?: number | null
          price_plan?: string | null
          promo_end_date?: string | null
          promo_start_date?: string | null
          selling_price_excl_vat?: number | null
          selling_price_incl_vat?: number | null
          sms_bundle?: string | null
          status?: string | null
          technology?: string | null
          total_contract_value?: never
        }
        Relationships: []
      }
      v_mtn_dealer_deal_periods: {
        Row: {
          active_deals: number | null
          deal_count: number | null
          deals_with_device: number | null
          max_price: number | null
          min_price: number | null
          promo_end_date: string | null
          promo_start_date: string | null
          sim_only_deals: number | null
        }
        Relationships: []
      }
      v_mtn_dealer_product_categories: {
        Row: {
          avg_price: number | null
          commission_tier: string | null
          contract_term: number | null
          contract_term_label: string | null
          device_category: string | null
          has_device: boolean | null
          max_price: number | null
          min_price: number | null
          product_count: number | null
          technology: string | null
        }
        Relationships: []
      }
      v_notification_analytics: {
        Row: {
          avg_days_overdue: number | null
          clicked: number | null
          date: string | null
          delivered: number | null
          failed: number | null
          notification_type: string | null
          opened: number | null
          total_amount_notified: number | null
          total_sent: number | null
        }
        Relationships: []
      }
      v_order_compliance_summary: {
        Row: {
          compliance_status: string | null
          customer_name: string | null
          email: string | null
          fica_approved: number | null
          fica_pending: number | null
          fica_rejected: number | null
          first_upload: string | null
          last_review: string | null
          order_id: string | null
          order_number: string | null
          rica_approved: number | null
          rica_pending: number | null
          rica_rejected: number | null
        }
        Relationships: []
      }
      v_order_notifications: {
        Row: {
          customer_name: string | null
          email: string | null
          email_click_rate: number | null
          email_open_rate: number | null
          emails_bounced: number | null
          emails_clicked: number | null
          emails_delivered: number | null
          emails_opened: number | null
          emails_sent: number | null
          last_email_opened: string | null
          last_email_sent: string | null
          last_link_clicked: string | null
          last_notification_event: string | null
          order_id: string | null
          order_number: string | null
          phone: string | null
          sms_delivered: number | null
          sms_failed: number | null
          sms_sent: number | null
        }
        Relationships: []
      }
      v_partner_commission_tier_analysis: {
        Row: {
          avg_commission_per_deal: number | null
          avg_monthly_subscription: number | null
          business_name: string | null
          partner_default_rate: number | null
          partner_id: string | null
          partner_tier: string | null
          tier1_commission: number | null
          tier1_transactions: number | null
          tier2_commission: number | null
          tier2_transactions: number | null
          tier3_commission: number | null
          tier3_transactions: number | null
          tier4_commission: number | null
          tier4_transactions: number | null
          tier5_commission: number | null
          tier5_transactions: number | null
          tier6_commission: number | null
          tier6_transactions: number | null
          tier7_commission: number | null
          tier7_transactions: number | null
          total_commission: number | null
          total_transactions: number | null
        }
        Relationships: []
      }
      v_payment_provider_health: {
        Row: {
          avg_completion_time_seconds: number | null
          completed_transactions: number | null
          enabled: boolean | null
          failed_transactions: number | null
          priority: number | null
          provider: string | null
          test_mode: boolean | null
          total_amount: number | null
          total_transactions: number | null
        }
        Relationships: []
      }
      v_pending_compliance_reviews: {
        Row: {
          category: string | null
          customer_name: string | null
          document_type: string | null
          email: string | null
          file_name: string | null
          file_url: string | null
          hours_pending: number | null
          id: string | null
          order_id: string | null
          order_number: string | null
          uploaded_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_documents_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "consumer_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_documents_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_order_compliance_summary"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "compliance_documents_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_order_notifications"
            referencedColumns: ["order_id"]
          },
        ]
      }
      v_product_commission_comparison: {
        Row: {
          commission_24_months: number | null
          commission_model: string | null
          commission_per_month: number | null
          commission_rate: number | null
          is_active: boolean | null
          margin_percentage: number | null
          monthly_cost: number | null
          monthly_margin: number | null
          monthly_price: number | null
          product_line: string | null
          product_name: string | null
          sort_order: number | null
        }
        Insert: {
          commission_24_months?: never
          commission_model?: string | null
          commission_per_month?: never
          commission_rate?: never
          is_active?: boolean | null
          margin_percentage?: number | null
          monthly_cost?: number | null
          monthly_margin?: number | null
          monthly_price?: number | null
          product_line?: string | null
          product_name?: string | null
          sort_order?: number | null
        }
        Update: {
          commission_24_months?: never
          commission_model?: string | null
          commission_per_month?: never
          commission_rate?: never
          is_active?: boolean | null
          margin_percentage?: number | null
          monthly_cost?: number | null
          monthly_margin?: number | null
          monthly_price?: number | null
          product_line?: string | null
          product_name?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      v_product_cost_summary: {
        Row: {
          addon_service_cost: number | null
          amortised_monthly_cost: number | null
          annual_monthly_cost: number | null
          component_count: number | null
          direct_monthly_cost: number | null
          hardware_cost: number | null
          infrastructure_cost: number | null
          installation_cost: number | null
          package_id: string | null
          platform_cost: number | null
          provider_cost: number | null
          support_cost: number | null
          total_hardware_dealer: number | null
          total_hardware_retail: number | null
          total_monthly_cost: number | null
          total_once_off_cost: number | null
          unit_monthly_cost: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_cost_components_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "service_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_cost_components_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "sme_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_cost_components_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "v_active_service_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_cost_components_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "v_products_with_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      v_products_with_providers: {
        Row: {
          active: boolean | null
          compatible_providers: string[] | null
          customer_type: string | null
          id: string | null
          name: string | null
          price: number | null
          product_category: string | null
          provider_details: Json | null
          service_type: string | null
          speed_down: number | null
          speed_up: number | null
        }
        Insert: {
          active?: boolean | null
          compatible_providers?: string[] | null
          customer_type?: string | null
          id?: string | null
          name?: string | null
          price?: number | null
          product_category?: string | null
          provider_details?: never
          service_type?: string | null
          speed_down?: number | null
          speed_up?: number | null
        }
        Update: {
          active?: boolean | null
          compatible_providers?: string[] | null
          customer_type?: string | null
          id?: string | null
          name?: string | null
          price?: number | null
          product_category?: string | null
          provider_details?: never
          service_type?: string | null
          speed_down?: number | null
          speed_up?: number | null
        }
        Relationships: []
      }
      v_providers_with_logos: {
        Row: {
          active: boolean | null
          coverage_source: string | null
          display_name: string | null
          id: string | null
          logo_aspect_ratio: number | null
          logo_dark_url: string | null
          logo_format: string | null
          logo_light_url: string | null
          logo_url: string | null
          name: string | null
          priority: number | null
          provider_code: string | null
          provider_type: string | null
          service_offerings: Json | null
        }
        Insert: {
          active?: boolean | null
          coverage_source?: string | null
          display_name?: string | null
          id?: string | null
          logo_aspect_ratio?: number | null
          logo_dark_url?: string | null
          logo_format?: string | null
          logo_light_url?: string | null
          logo_url?: string | null
          name?: string | null
          priority?: number | null
          provider_code?: string | null
          provider_type?: string | null
          service_offerings?: Json | null
        }
        Update: {
          active?: boolean | null
          coverage_source?: string | null
          display_name?: string | null
          id?: string | null
          logo_aspect_ratio?: number | null
          logo_dark_url?: string | null
          logo_format?: string | null
          logo_light_url?: string | null
          logo_url?: string | null
          name?: string | null
          priority?: number | null
          provider_code?: string | null
          provider_type?: string | null
          service_offerings?: Json | null
        }
        Relationships: []
      }
      v_recent_payment_transactions: {
        Row: {
          amount: number | null
          completed_at: string | null
          created_at: string | null
          currency: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          id: string | null
          initiated_at: string | null
          payment_method: string | null
          provider: string | null
          reference: string | null
          status: string | null
          transaction_id: string | null
        }
        Relationships: []
      }
      v_subscriber_diagnostics_summary: {
        Row: {
          avg_session_duration_seconds: number | null
          critical_events_24h: number | null
          current_session_ip: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_service_id: string | null
          diagnostics_id: string | null
          events_24h: number | null
          health_score: number | null
          health_status: string | null
          installation_address: string | null
          interstellio_subscriber_id: string | null
          is_session_active: boolean | null
          last_check_at: string | null
          last_disconnect_time: string | null
          last_event_at: string | null
          last_session_duration_seconds: number | null
          last_session_start: string | null
          last_terminate_cause: string | null
          lost_carrier_count_7days: number | null
          lost_carrier_count_today: number | null
          package_name: string | null
          service_status: string | null
          total_online_seconds_7days: number | null
          total_sessions_7days: number | null
          total_sessions_today: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_services_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_dashboard_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_services_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_services_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_notification_engagement"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "subscriber_diagnostics_customer_service_id_fkey"
            columns: ["customer_service_id"]
            isOneToOne: true
            referencedRelation: "customer_services"
            referencedColumns: ["id"]
          },
        ]
      }
      v_supplier_stock_by_branch: {
        Row: {
          products_in_cpt: number | null
          products_in_dbn: number | null
          products_in_jhb: number | null
          stock_cpt: number | null
          stock_dbn: number | null
          stock_jhb: number | null
          stock_total: number | null
          supplier_code: string | null
          supplier_id: string | null
          supplier_name: string | null
        }
        Relationships: []
      }
      v_supplier_summary: {
        Row: {
          active_products: number | null
          code: string | null
          id: string | null
          in_stock_products: number | null
          is_active: boolean | null
          last_synced_at: string | null
          max_price: number | null
          min_price: number | null
          name: string | null
          sync_error: string | null
          sync_status: string | null
          total_products: number | null
          total_stock_units: number | null
          website_url: string | null
        }
        Relationships: []
      }
      v_technician_status: {
        Row: {
          current_job_address: string | null
          current_job_id: string | null
          current_job_number: string | null
          current_job_status: string | null
          current_job_title: string | null
          current_latitude: number | null
          current_longitude: number | null
          employee_id: string | null
          first_name: string | null
          full_name: string | null
          id: string | null
          is_active: boolean | null
          jobs_completed_today: number | null
          last_name: string | null
          location_updated_at: string | null
          pending_jobs: number | null
          phone: string | null
          status: string | null
          team: string | null
        }
        Relationships: []
      }
      v_todays_jobs: {
        Row: {
          address: string | null
          address_notes: string | null
          assigned_at: string | null
          assigned_by: string | null
          assigned_technician_id: string | null
          completed_at: string | null
          completion_notes: string | null
          completion_photos: string[] | null
          created_at: string | null
          created_by: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_signature_url: string | null
          description: string | null
          estimated_duration_minutes: number | null
          id: string | null
          job_number: string | null
          job_type: string | null
          latitude: number | null
          longitude: number | null
          order_id: string | null
          priority: string | null
          scheduled_date: string | null
          scheduled_time_end: string | null
          scheduled_time_start: string | null
          started_at: string | null
          status: string | null
          technician_latitude: number | null
          technician_longitude: number | null
          technician_name: string | null
          technician_phone: string | null
          title: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "field_jobs_assigned_technician_id_fkey"
            columns: ["assigned_technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_jobs_assigned_technician_id_fkey"
            columns: ["assigned_technician_id"]
            isOneToOne: false
            referencedRelation: "v_technician_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_dashboard_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "field_jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_notification_engagement"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "field_jobs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "consumer_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_jobs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_order_compliance_summary"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "field_jobs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_order_notifications"
            referencedColumns: ["order_id"]
          },
        ]
      }
      v_webhook_log_summary: {
        Row: {
          avg_processing_time_ms: number | null
          event_type: string | null
          failure_count: number | null
          last_received_at: string | null
          provider: string | null
          status: string | null
          success_count: number | null
          total_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      add_order_tracking_event: {
        Args: {
          p_event_data?: Json
          p_event_description?: string
          p_event_status: string
          p_event_title: string
          p_event_type: string
          p_order_id: string
          p_scheduled_date?: string
          p_visible_to_customer?: boolean
        }
        Returns: string
      }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      advance_business_journey: {
        Args: {
          p_business_customer_id: string
          p_completed_by?: string
          p_current_stage: Database["public"]["Enums"]["business_journey_stage"]
        }
        Returns: {
          message: string
          next_stage: Database["public"]["Enums"]["business_journey_stage"]
          success: boolean
        }[]
      }
      aggregate_demand_by_ward: {
        Args: { p_days?: number }
        Returns: {
          check_count: number
          checks_no_coverage: number
          checks_with_coverage: number
          unique_sessions: number
          ward_code: string
        }[]
      }
      approve_admin_access_request: {
        Args: { p_password: string; p_request_id: string }
        Returns: Json
      }
      calculate_margin_commission: {
        Args: {
          p_contract_term_months?: number
          p_margin_share_rate?: number
          p_monthly_cost: number
          p_monthly_revenue: number
        }
        Returns: {
          contract_term: number
          margin_percentage: number
          margin_share_rate: number
          monthly_commission: number
          monthly_cost: number
          monthly_margin: number
          monthly_revenue: number
          total_commission: number
          total_commission_incl_vat: number
          total_contract_revenue: number
        }[]
      }
      calculate_mtn_dealer_commission: {
        Args: { p_deal_id: string; p_quantity?: number }
        Returns: {
          circletel_commission: number
          circletel_commission_incl_vat: number
          circletel_share_rate: number
          contract_term: number
          deal_id: string
          monthly_subscription: number
          mtn_commission_rate: number
          mtn_commission_to_arlan: number
          price_plan: string
          quantity: number
          total_circletel_commission: number
          total_contract_value: number
        }[]
      }
      calculate_product_commission: {
        Args: { p_contract_term_months?: number; p_product_sku: string }
        Returns: {
          commission_model: string
          commission_rate: number
          margin_percentage: number
          monthly_commission: number
          monthly_cost: number
          monthly_margin: number
          monthly_revenue: number
          product_name: string
          total_commission: number
          total_commission_incl_vat: number
        }[]
      }
      calculate_provider_avg_response_time_24h: {
        Args: { p_provider_id: string }
        Returns: number
      }
      calculate_provider_success_rate_24h: {
        Args: { p_provider_id: string }
        Returns: number
      }
      calculate_tiered_commission: {
        Args: {
          p_contract_term_months?: number
          p_monthly_subscription: number
          p_transaction_date?: string
        }
        Returns: {
          base_commission: number
          base_rate: number
          contract_term: number
          effective_rate: number
          monthly_value: number
          partner_commission: number
          partner_commission_incl_vat: number
          partner_share_rate: number
          tier_id: string
          tier_name: string
          tier_order: number
          total_contract_value: number
        }[]
      }
      calculate_zoho_books_next_retry: {
        Args: { retry_count: number }
        Returns: string
      }
      check_ai_rate_limit: {
        Args: {
          daily_limit?: number
          hourly_limit?: number
          target_user_id?: string
        }
        Returns: {
          daily_count: number
          daily_remaining: number
          hourly_count: number
          hourly_remaining: number
          within_limits: boolean
        }[]
      }
      check_coverage_at_point: {
        Args: { lat: number; lng: number }
        Returns: {
          activation_days: number
          coverage_name: string
          coverage_quality: string
          service_type: string
          speed_tier: string
        }[]
      }
      check_pb_rate_limit: {
        Args: { hourly_limit?: number; target_user_id: string }
        Returns: {
          hourly_count: number
          remaining: number
          within_limits: boolean
        }[]
      }
      complete_reminder: {
        Args: { p_reminder_id: string; p_user_id: string }
        Returns: boolean
      }
      compute_competitor_weakness_score: {
        Args: { p_zone_id: string }
        Returns: number
      }
      count_base_stations_in_radius: {
        Args: { p_lat: number; p_lng: number; p_radius_km: number }
        Returns: {
          station_count: number
          total_connections: number
        }[]
      }
      count_dfa_buildings_in_radius: {
        Args: { p_lat: number; p_lng: number; p_radius_km: number }
        Returns: {
          connected_count: number
          near_net_count: number
        }[]
      }
      create_coverage_lead: {
        Args: {
          p_address: string
          p_company_name?: string
          p_company_size?: string
          p_customer_type?: string
          p_latitude?: number
          p_longitude?: number
          p_phone_number?: string
          p_property_type?: string
          p_referrer_url?: string
          p_session_id?: string
          p_source?: string
          p_status?: string
          p_utm_campaign?: string
          p_utm_medium?: string
          p_utm_source?: string
        }
        Returns: {
          id: string
          session_id: string
        }[]
      }
      create_lead_conversion_commission: {
        Args: {
          p_amount: number
          p_commission_rate: number
          p_description: string
          p_lead_id: string
          p_order_id: string
          p_partner_id: string
        }
        Returns: string
      }
      create_margin_commission: {
        Args: {
          p_contract_term_months: number
          p_description: string
          p_lead_id: string
          p_order_id: string
          p_partner_id: string
          p_product_sku: string
        }
        Returns: string
      }
      create_tiered_commission: {
        Args: {
          p_contract_term_months: number
          p_description: string
          p_lead_id: string
          p_monthly_subscription: number
          p_order_id: string
          p_partner_id: string
        }
        Returns: string
      }
      disablelongtransactions: { Args: never; Returns: string }
      discover_zone_candidates: {
        Args: {
          p_limit?: number
          p_max_existing_zone_distance_km?: number
          p_min_fit_score?: number
          p_province?: string
        }
        Returns: {
          business_poi_count: number
          centroid_lat: number
          centroid_lng: number
          demographic_fit_score: number
          healthcare_poi_count: number
          municipality: string
          nearby_base_connections: number
          nearby_base_stations: number
          nearby_dfa_connected: number
          nearby_dfa_near_net: number
          office_poi_count: number
          pct_employed: number
          pct_income_above_r12800: number
          pct_no_internet: number
          province: string
          total_households: number
          total_population: number
          ward_code: string
          ward_name: string
        }[]
      }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      find_customer_service_by_interstellio_id: {
        Args: { p_interstellio_id: string }
        Returns: {
          customer_email: string
          customer_id: string
          customer_name: string
          customer_service_id: string
          package_name: string
          service_status: string
        }[]
      }
      find_nearest_dfa_building: {
        Args: { p_lat: number; p_limit?: number; p_lng: number }
        Returns: {
          building_id: string
          building_name: string
          coverage_type: string
          distance_km: number
          ftth: string
          id: string
          latitude: number
          longitude: number
          precinct: string
          street_address: string
        }[]
      }
      find_nearest_tarana_base_station: {
        Args: { p_lat: number; p_limit?: number; p_lng: number }
        Returns: {
          active_connections: number
          distance_km: number
          hostname: string
          id: string
          lat: number
          lng: number
          market: string
          serial_number: string
          site_name: string
        }[]
      }
      format_zar: { Args: { amount: number }; Returns: string }
      generate_account_number: { Args: never; Returns: string }
      generate_contract_number: { Args: never; Returns: string }
      generate_credit_note_number: { Args: never; Returns: string }
      generate_invoice_number: { Args: never; Returns: string }
      generate_job_number: { Args: never; Returns: string }
      generate_order_number: { Args: never; Returns: string }
      generate_quote_number: { Args: never; Returns: string }
      generate_quote_share_token: {
        Args: { quote_uuid: string }
        Returns: string
      }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      get_ai_usage_by_type: {
        Args: {
          end_date?: string
          start_date?: string
          target_user_id?: string
        }
        Returns: {
          request_count: number
          request_type: string
          success_rate: number
          total_cost_cents: number
          total_tokens: number
        }[]
      }
      get_allowed_next_statuses: {
        Args: { current_status: string }
        Returns: string[]
      }
      get_billing_setting: {
        Args: { p_customer_type?: string; p_key: string }
        Returns: Json
      }
      get_billing_setting_bool: {
        Args: { p_customer_type?: string; p_default?: boolean; p_key: string }
        Returns: boolean
      }
      get_billing_setting_int: {
        Args: { p_customer_type?: string; p_default?: number; p_key: string }
        Returns: number
      }
      get_billing_setting_numeric: {
        Args: { p_customer_type?: string; p_default?: number; p_key: string }
        Returns: number
      }
      get_circletel_id: {
        Args: { p_zoho_id: string; p_zoho_type: string }
        Returns: string
      }
      get_coverage_time_series: {
        Args: { p_end_time: string; p_interval?: string; p_start_time: string }
        Returns: {
          avg_response_time: number
          error_count: number
          failed_requests: number
          max_response_time: number
          min_response_time: number
          success_rate: number
          successful_requests: number
          time_bucket: string
          total_requests: number
        }[]
      }
      get_current_financial_period: { Args: never; Returns: string }
      get_current_price_for_customer: {
        Args: { p_customer_signup_date?: string; p_service_package_id: string }
        Returns: number
      }
      get_demographics_in_radius: {
        Args: { p_lat: number; p_lng: number; p_radius_km?: number }
        Returns: {
          avg_demographic_fit_score: number
          avg_pct_cellphone_internet: number
          avg_pct_employed: number
          avg_pct_fixed_internet: number
          avg_pct_formal_dwelling: number
          avg_pct_income_above_r12800: number
          avg_pct_income_r6400_12800: number
          avg_pct_no_internet: number
          total_business_pois: number
          total_healthcare_pois: number
          total_households: number
          total_office_pois: number
          total_population: number
          ward_count: number
        }[]
      }
      get_error_distribution: {
        Args: { p_end_time: string; p_start_time: string }
        Returns: {
          error_count: number
          error_type: string
          percentage: number
          sample_message: string
        }[]
      }
      get_integration_oauth_token: {
        Args: { p_integration_slug: string }
        Returns: {
          access_token: string
          expires_at: string
          id: string
          integration_slug: string
          is_active: boolean
          refresh_token: string
        }[]
      }
      get_order_compliance_status: {
        Args: { p_order_id: string }
        Returns: {
          fica_complete: boolean
          overall_complete: boolean
          pending_count: number
          rejected_count: number
          rica_complete: boolean
        }[]
      }
      get_order_notification_timeline: {
        Args: { p_order_id: string }
        Returns: {
          details: string
          event_time: string
          event_type: string
          notification_type: string
        }[]
      }
      get_pending_approvals_count: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_primary_payment_method: {
        Args: { p_customer_id: string }
        Returns: {
          bank_account_name: string
          bank_account_number_masked: string
          bank_name: string
          card_number_masked: string
          card_type: string
          id: string
          is_active: boolean
          mandate_amount: number
          mandate_frequency: string
          method_type: string
          status: string
        }[]
      }
      get_product_categories_from_services: {
        Args: { provider_name?: string; service_types: string[] }
        Returns: {
          priority: number
          product_category: string
          provider: string
          technical_type: string
        }[]
      }
      get_provider_performance: {
        Args: { p_end_time: string; p_start_time: string }
        Returns: {
          avg_response_time: number
          coverage_rate: number
          p95_response_time: number
          provider_code: string
          provider_name: string
          success_rate: number
          total_requests: number
        }[]
      }
      get_province_statistics: {
        Args: { p_end_time: string; p_start_time: string }
        Returns: {
          avg_response_time: number
          coverage_found: number
          province: string
          success_rate: number
          successful_requests: number
          total_requests: number
        }[]
      }
      get_sync_candidates: {
        Args: { max_limit?: number }
        Returns: {
          id: string
          last_synced_at: string
          name: string
          sku: string
          status: string
          sync_status: string
          zoho_billing_item_id: string
          zoho_billing_last_synced_at: string
          zoho_billing_plan_id: string
          zoho_billing_sync_status: string
          zoho_crm_last_synced_at: string
          zoho_crm_product_id: string
          zoho_crm_sync_status: string
        }[]
      }
      get_unread_notifications_count: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_user_daily_ai_usage: {
        Args: { target_user_id?: string }
        Returns: {
          last_request: string
          request_count: number
          total_cost_cents: number
          total_tokens: number
        }[]
      }
      get_user_monthly_ai_usage: {
        Args: { target_user_id?: string }
        Returns: {
          avg_response_time_ms: number
          request_count: number
          total_cost_cents: number
          total_tokens: number
        }[]
      }
      get_user_permissions: { Args: { user_id: string }; Returns: Json }
      get_whatsapp_eligible_customers: {
        Args: { p_invoice_ids: string[] }
        Returns: {
          customer_id: string
          customer_name: string
          due_date: string
          invoice_id: string
          invoice_number: string
          phone: string
          total_amount: number
        }[]
      }
      get_zoho_id: {
        Args: { p_circletel_id: string; p_circletel_type: string }
        Returns: string
      }
      gettransactionid: { Args: never; Returns: unknown }
      has_required_compliance_documents: {
        Args: { p_order_id: string }
        Returns: boolean
      }
      increment_asset_downloads: {
        Args: { asset_id: string }
        Returns: undefined
      }
      increment_email_template_send_count: {
        Args: { p_template_id: string }
        Returns: undefined
      }
      initialize_business_journey: {
        Args: { p_business_customer_id: string; p_quote_id?: string }
        Returns: undefined
      }
      is_admin_user: { Args: never; Returns: boolean }
      is_customer_engaged: { Args: { p_customer_id: string }; Returns: boolean }
      is_entity_synced: {
        Args: { p_entity_id: string; p_entity_type: string }
        Returns: boolean
      }
      is_super_admin: { Args: never; Returns: boolean }
      is_super_admin_safe: { Args: never; Returns: boolean }
      is_technician_available: {
        Args: { p_date: string; p_technician_id: string; p_time_slot?: string }
        Returns: boolean
      }
      log_admin_action: {
        Args: {
          p_action: string
          p_action_category: string
          p_ip_address?: string
          p_metadata?: Json
          p_severity?: string
          p_status?: string
          p_user_agent?: string
          p_user_email: string
          p_user_id: string
        }
        Returns: string
      }
      log_admin_activity: {
        Args: {
          p_action: string
          p_details?: Json
          p_ip_address?: unknown
          p_resource_id?: string
          p_resource_type?: string
          p_user_agent?: string
        }
        Returns: string
      }
      log_integration_activity: {
        Args: {
          p_action_description: string
          p_action_result?: string
          p_action_type: string
          p_error_message?: string
          p_integration_slug: string
          p_performed_by: string
        }
        Returns: string
      }
      log_whatsapp_message: {
        Args: {
          p_created_by?: string
          p_customer_id?: string
          p_invoice_id?: string
          p_message_id: string
          p_phone: string
          p_template_name: string
          p_wa_id: string
        }
        Returns: string
      }
      longtransactionsenabled: { Args: never; Returns: boolean }
      mark_notification_read: {
        Args: { p_notification_id: string; p_user_id: string }
        Returns: boolean
      }
      parse_bundle_value: { Args: { bundle_text: string }; Returns: number }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      record_email_version_metrics: {
        Args: { p_count?: number; p_metric_type: string; p_version_id: string }
        Returns: undefined
      }
      record_oauth_failure: {
        Args: { p_error_message: string; p_integration_slug: string }
        Returns: boolean
      }
      record_oauth_rate_limit: {
        Args: { p_cooldown_duration?: string; p_integration_slug: string }
        Returns: boolean
      }
      record_rate_limit_hit: {
        Args: {
          p_api_type: string
          p_error_message?: string
          p_service_package_id: string
        }
        Returns: undefined
      }
      reject_admin_access_request: {
        Args: { p_reason: string; p_request_id: string }
        Returns: Json
      }
      rollup_provider_api_metrics: {
        Args: { p_retention_days?: number }
        Returns: {
          hours_rolled: number
          rows_pruned: number
        }[]
      }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      suggest_zones_from_demographics: {
        Args: {
          p_limit?: number
          p_min_fit_score?: number
          p_province?: string
        }
        Returns: {
          business_poi_count: number
          centroid_lat: number
          centroid_lng: number
          demographic_fit_score: number
          municipality: string
          nearby_base_stations: number
          pct_income_above_r12800: number
          pct_no_internet: number
          province: string
          total_households: number
          total_population: number
          ward_code: string
          ward_name: string
        }[]
      }
      unlockrows: { Args: { "": string }; Returns: number }
      update_oauth_access_token: {
        Args: {
          p_access_token: string
          p_expires_at: string
          p_integration_slug: string
        }
        Returns: boolean
      }
      update_order_fulfillment_status: {
        Args: {
          p_event_description?: string
          p_event_title: string
          p_fulfillment_status: string
          p_order_id: string
        }
        Returns: undefined
      }
      update_provider_health_metrics: {
        Args: { p_provider_id: string }
        Returns: undefined
      }
      update_whatsapp_message_status: {
        Args: {
          p_billable?: boolean
          p_error_code?: number
          p_error_message?: string
          p_message_id: string
          p_pricing_category?: string
          p_status: string
        }
        Returns: boolean
      }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
      user_has_permission: {
        Args: { permission: string; user_id: string }
        Returns: boolean
      }
      user_is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      admin_product_category:
        | "business_fibre"
        | "fixed_wireless_business"
        | "fixed_wireless_residential"
        | "bundle"
        | "waas"
        | "soho"
      admin_product_status: "draft" | "pending" | "approved" | "archived"
      agent_status: "active" | "inactive" | "suspended"
      agent_type: "internal" | "external" | "partner"
      approval_status: "pending" | "approved" | "rejected"
      business_account_status:
        | "pending_verification"
        | "verification_in_progress"
        | "active"
        | "suspended"
        | "cancelled"
        | "dormant"
      business_journey_stage:
        | "quote_request"
        | "business_verification"
        | "site_details"
        | "contract"
        | "installation"
        | "go_live"
      business_kyc_status:
        | "not_started"
        | "documents_pending"
        | "under_review"
        | "approved"
        | "rejected"
        | "expired"
      change_type: "create" | "update" | "delete" | "pricing" | "features"
      company_type:
        | "pty_ltd"
        | "cc"
        | "sole_prop"
        | "npc"
        | "partnership"
        | "trust"
        | "other"
      corporate_account_status: "active" | "suspended" | "pending" | "archived"
      corporate_site_status:
        | "pending"
        | "ready"
        | "provisioned"
        | "active"
        | "suspended"
        | "decommissioned"
      cost_component_category:
        | "provider"
        | "infrastructure"
        | "platform"
        | "hardware"
        | "addon_service"
        | "support"
        | "installation"
        | "licensing"
        | "other"
      cost_recurrence_type:
        | "monthly"
        | "once_off"
        | "amortised"
        | "annual"
        | "per_user"
        | "per_device"
      customer_type: "consumer" | "smme" | "enterprise"
      equipment_location:
        | "rack_mounted"
        | "wall_mounted"
        | "floor_standing"
        | "other"
      journey_stage_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "blocked"
        | "skipped"
      kyc_document_type:
        | "id_document"
        | "proof_of_address"
        | "bank_statement"
        | "company_registration"
        | "tax_certificate"
        | "vat_certificate"
        | "director_id"
        | "shareholder_agreement"
        | "other"
      kyc_verification_status:
        | "pending"
        | "under_review"
        | "approved"
        | "rejected"
        | "expired"
        | "requires_update"
      lead_source:
        | "coverage_checker"
        | "business_inquiry"
        | "website_form"
        | "referral"
        | "marketing_campaign"
        | "social_media"
        | "direct_sales"
        | "other"
        | "whatsapp_flow"
      location_type_enum:
        | "freestanding_home"
        | "complex"
        | "business_office"
        | "school_campus"
        | "estate"
        | "apartment"
      network_path_type: "circletel_bng" | "mtn_breakout"
      notification_delivery_status:
        | "pending"
        | "sent"
        | "delivered"
        | "failed"
        | "bounced"
      notification_delivery_type: "email" | "sms" | "push"
      notification_priority: "low" | "medium" | "high" | "critical"
      notification_type:
        | "product_approval"
        | "price_change"
        | "system_update"
        | "user_activity"
        | "error_alert"
        | "performance_warning"
      order_status:
        | "pending"
        | "payment_pending"
        | "payment_received"
        | "kyc_pending"
        | "kyc_approved"
        | "payment_method_pending"
        | "payment_method_registered"
        | "kyc_rejected"
        | "credit_check_pending"
        | "credit_check_approved"
        | "credit_check_rejected"
        | "installation_scheduled"
        | "installation_in_progress"
        | "installation_completed"
        | "active"
        | "suspended"
        | "on_hold"
        | "cancelled"
        | "failed"
      premises_ownership: "owned" | "leased"
      product_relationship_type:
        | "addon"
        | "requires"
        | "excludes"
        | "alternative"
        | "includes"
      property_type:
        | "office"
        | "retail"
        | "warehouse"
        | "industrial"
        | "data_center"
        | "mixed_use"
        | "other"
      quote_item_type: "primary" | "secondary" | "additional"
      quote_notification_event:
        | "quote_created"
        | "quote_approved"
        | "quote_sent"
        | "quote_viewed"
        | "quote_accepted"
        | "quote_rejected"
        | "quote_expired"
      quote_status:
        | "draft"
        | "pending_approval"
        | "approved"
        | "sent"
        | "viewed"
        | "accepted"
        | "rejected"
        | "expired"
      rfi_status_type: "ready" | "pending" | "not_ready"
      site_access_type: "24_7" | "business_hours" | "appointment_only"
      site_technology_type: "tarana_fwb" | "lte_5g" | "ftth" | "fwa"
      support_ticket_type:
        | "support"
        | "fault_report"
        | "activation_request"
        | "change_request"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      admin_product_category: [
        "business_fibre",
        "fixed_wireless_business",
        "fixed_wireless_residential",
        "bundle",
        "waas",
        "soho",
      ],
      admin_product_status: ["draft", "pending", "approved", "archived"],
      agent_status: ["active", "inactive", "suspended"],
      agent_type: ["internal", "external", "partner"],
      approval_status: ["pending", "approved", "rejected"],
      business_account_status: [
        "pending_verification",
        "verification_in_progress",
        "active",
        "suspended",
        "cancelled",
        "dormant",
      ],
      business_journey_stage: [
        "quote_request",
        "business_verification",
        "site_details",
        "contract",
        "installation",
        "go_live",
      ],
      business_kyc_status: [
        "not_started",
        "documents_pending",
        "under_review",
        "approved",
        "rejected",
        "expired",
      ],
      change_type: ["create", "update", "delete", "pricing", "features"],
      company_type: [
        "pty_ltd",
        "cc",
        "sole_prop",
        "npc",
        "partnership",
        "trust",
        "other",
      ],
      corporate_account_status: ["active", "suspended", "pending", "archived"],
      corporate_site_status: [
        "pending",
        "ready",
        "provisioned",
        "active",
        "suspended",
        "decommissioned",
      ],
      cost_component_category: [
        "provider",
        "infrastructure",
        "platform",
        "hardware",
        "addon_service",
        "support",
        "installation",
        "licensing",
        "other",
      ],
      cost_recurrence_type: [
        "monthly",
        "once_off",
        "amortised",
        "annual",
        "per_user",
        "per_device",
      ],
      customer_type: ["consumer", "smme", "enterprise"],
      equipment_location: [
        "rack_mounted",
        "wall_mounted",
        "floor_standing",
        "other",
      ],
      journey_stage_status: [
        "pending",
        "in_progress",
        "completed",
        "blocked",
        "skipped",
      ],
      kyc_document_type: [
        "id_document",
        "proof_of_address",
        "bank_statement",
        "company_registration",
        "tax_certificate",
        "vat_certificate",
        "director_id",
        "shareholder_agreement",
        "other",
      ],
      kyc_verification_status: [
        "pending",
        "under_review",
        "approved",
        "rejected",
        "expired",
        "requires_update",
      ],
      lead_source: [
        "coverage_checker",
        "business_inquiry",
        "website_form",
        "referral",
        "marketing_campaign",
        "social_media",
        "direct_sales",
        "other",
        "whatsapp_flow",
      ],
      location_type_enum: [
        "freestanding_home",
        "complex",
        "business_office",
        "school_campus",
        "estate",
        "apartment",
      ],
      network_path_type: ["circletel_bng", "mtn_breakout"],
      notification_delivery_status: [
        "pending",
        "sent",
        "delivered",
        "failed",
        "bounced",
      ],
      notification_delivery_type: ["email", "sms", "push"],
      notification_priority: ["low", "medium", "high", "critical"],
      notification_type: [
        "product_approval",
        "price_change",
        "system_update",
        "user_activity",
        "error_alert",
        "performance_warning",
      ],
      order_status: [
        "pending",
        "payment_pending",
        "payment_received",
        "kyc_pending",
        "kyc_approved",
        "payment_method_pending",
        "payment_method_registered",
        "kyc_rejected",
        "credit_check_pending",
        "credit_check_approved",
        "credit_check_rejected",
        "installation_scheduled",
        "installation_in_progress",
        "installation_completed",
        "active",
        "suspended",
        "on_hold",
        "cancelled",
        "failed",
      ],
      premises_ownership: ["owned", "leased"],
      product_relationship_type: [
        "addon",
        "requires",
        "excludes",
        "alternative",
        "includes",
      ],
      property_type: [
        "office",
        "retail",
        "warehouse",
        "industrial",
        "data_center",
        "mixed_use",
        "other",
      ],
      quote_item_type: ["primary", "secondary", "additional"],
      quote_notification_event: [
        "quote_created",
        "quote_approved",
        "quote_sent",
        "quote_viewed",
        "quote_accepted",
        "quote_rejected",
        "quote_expired",
      ],
      quote_status: [
        "draft",
        "pending_approval",
        "approved",
        "sent",
        "viewed",
        "accepted",
        "rejected",
        "expired",
      ],
      rfi_status_type: ["ready", "pending", "not_ready"],
      site_access_type: ["24_7", "business_hours", "appointment_only"],
      site_technology_type: ["tarana_fwb", "lte_5g", "ftth", "fwa"],
      support_ticket_type: [
        "support",
        "fault_report",
        "activation_request",
        "change_request",
      ],
    },
  },
} as const
