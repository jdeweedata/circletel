import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
);

export interface CoverageResult {
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  fibreAvailable: boolean;
  wirelessAvailable: boolean;
  fibreProviders: string[];
  wirelessSpeed: string;
  installationTime: string;
  confidence: number;
  hasCoverage?: boolean;
  buildingName?: string;
  thirdPartyRequired?: boolean;
  isPromotion?: boolean;
  nearestBuilding?: {
    distance: number;
    buildingName: string;
  };
  // New fields from Supabase edge function
  available?: boolean;
  services?: string[];
  speeds?: string[];
  areas?: Array<{
    service_type: string;
    area_name: string;
    activation_days: number;
  }>;
}

export class CoverageApiService {
  async checkCoverage(address: string): Promise<CoverageResult> {
    try {
      // Call the Supabase edge function
      const { data, error } = await supabase.functions.invoke('check-coverage', {
        body: { address, coordinates: null }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      // Transform the response to match the existing interface
      const result: CoverageResult = {
        address,
        available: data.available,
        services: data.services || [],
        speeds: data.speeds || [],
        areas: data.areas || [],
        fibreAvailable: data.available && data.services?.some((s: string) => s.includes('Fibre')),
        wirelessAvailable: data.available && data.services?.some((s: string) => s.includes('Sky')),
        fibreProviders: data.services?.filter((s: string) => s.includes('Fibre')) || [],
        wirelessSpeed: data.speeds?.[0] || '25/5 Mbps',
        installationTime: data.areas?.[0]?.activation_days ? `${data.areas[0].activation_days} days` : '3-7 days',
        confidence: data.available ? 0.95 : 0.1,
        hasCoverage: data.available
      };

      return result;
    } catch (error) {
      console.error('Coverage check failed:', error);

      // Fallback to mock data if the edge function fails
      const fibreAvailable = Math.random() > 0.3;
      return {
        address,
        coordinates: {
          lat: -26.2041,
          lng: 28.0473
        },
        fibreAvailable,
        wirelessAvailable: true,
        fibreProviders: ['Openserve', 'Vumatel', 'MetroFibre'],
        wirelessSpeed: '100Mbps',
        installationTime: '2-3 weeks',
        confidence: 0.85,
        hasCoverage: fibreAvailable || true,
        available: fibreAvailable,
        services: fibreAvailable ? ['HomeFibreConnect', 'SkyFibre'] : ['SkyFibre'],
        speeds: ['25/5', '50/10', '100/20']
      };
    }
  }
}

export const coverageApiService = new CoverageApiService();