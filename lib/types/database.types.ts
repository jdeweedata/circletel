/**
 * Supabase Database Types
 *
 * This file should contain auto-generated types from Supabase.
 * Generate using: npx supabase gen types typescript --project-id agyjovdugmtopasyvlng
 *
 * Until proper types are generated, use generic types.
 *
 * @see https://supabase.com/docs/guides/api/rest/generating-types
 */

// Placeholder types until Supabase types are generated
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      [key: string]: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
    };
    Views: {
      [key: string]: {
        Row: Record<string, unknown>;
      };
    };
    Functions: {
      [key: string]: {
        Args: Record<string, unknown>;
        Returns: unknown;
      };
    };
    Enums: {
      [key: string]: string;
    };
  };
}

// Common table row types (add as needed)
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];
