interface CoverageRequest {
  latitude: number;
  longitude: number;
  address?: string;
}

interface CoverageResult {
  hasCoverage: boolean;
  connectionType: 'FTTB' | 'Third Party' | 'None';
  buildingId?: string;
  buildingName?: string;
  isPromotion?: boolean;
  thirdPartyRequired?: boolean;
  nearestBuilding?: {
    distance: number;
    buildingName: string;
    address: string;
  };
  message: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

class CoverageApiService {
  private baseUrl: string;

  constructor() {
    // Use environment variable for Supabase URL or fallback to development
    this.baseUrl = import.meta.env.VITE_SUPABASE_URL
      ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
      : 'http://localhost:54321/functions/v1'; // Local Supabase dev server
  }

  async checkFTTBCoverage(request: CoverageRequest): Promise<CoverageResult> {
    try {
      console.log('Checking FTTB coverage for:', request);

      // Try Supabase function first
      try {
        const response = await fetch(`${this.baseUrl}/check-fttb-coverage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify(request),
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Supabase function response:', result);
          return result;
        } else {
          console.warn('Supabase function failed, falling back to direct API');
        }
      } catch (supabaseError) {
        console.warn('Supabase function error, falling back to direct API:', supabaseError);
      }

      // Fallback to direct DFA API method
      return await this.checkCoverageDirect(request);
    } catch (error) {
      console.error('Coverage API error:', error);

      // Return a fallback error result
      return {
        hasCoverage: false,
        connectionType: 'None',
        message: 'Unable to check coverage at this time. Please try again later or contact us directly.',
        coordinates: {
          latitude: request.latitude,
          longitude: request.longitude,
        },
      };
    }
  }

  // Development/testing function using direct DFA API (for development only)
  async checkCoverageDirect(request: CoverageRequest): Promise<CoverageResult> {
    try {
      // Direct call to DFA API (for development/testing)
      const params = new URLSearchParams({
        where: "1=1",  // Get all buildings, filter in JavaScript
        geometry: `${request.longitude},${request.latitude}`,
        geometryType: 'esriGeometryPoint',
        distance: '1000',
        units: 'esriSRUnit_Meter',
        outFields: '*',
        returnGeometry: 'true',
        f: 'json'
      });

      const response = await fetch(
        `https://gisportal.dfafrica.co.za/server/rest/services/API/DFA_Connected_Buildings/MapServer/0/query?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error('DFA API request failed');
      }

      const data = await response.json();

      // Filter buildings for DFA connected with broadband
      const connectedBuildings = data.features?.filter((feature: Record<string, unknown>) => {
        const attrs = feature.attributes;
        // Since DFA_Connected field is undefined, check for buildings with Broadband
        // This indicates they are DFA connected buildings in the area
        const isConnected = attrs.Broadband === 'Broadband';
        return isConnected;
      }) || [];

      const hasBuildings = connectedBuildings.length > 0;

      // Check for third party requirements
      const requiresThirdParty = connectedBuildings.some((feature: Record<string, unknown>) =>
        feature.attributes.Third_Party_Dependant_For_Connection_Access === 'Yes'
      );

      // Check for promotions
      const hasPromotion = connectedBuildings.some((feature: Record<string, unknown>) =>
        feature.attributes.Promotion && feature.attributes.Promotion !== 'null'
      );

      return {
        hasCoverage: hasBuildings,
        connectionType: hasBuildings ? (requiresThirdParty ? 'Third Party' : 'FTTB') : 'None',
        thirdPartyRequired: requiresThirdParty,
        isPromotion: hasPromotion,
        message: hasBuildings
          ? 'FTTB coverage detected in your area. Contact us for details.'
          : 'No FTTB coverage found. Contact us for alternative solutions.',
        coordinates: {
          latitude: request.latitude,
          longitude: request.longitude,
        },
      };
    } catch (error) {
      console.error('Direct coverage check failed:', error);

      return {
        hasCoverage: false,
        connectionType: 'None',
        message: 'Coverage check unavailable. Please contact us directly for assistance.',
        coordinates: {
          latitude: request.latitude,
          longitude: request.longitude,
        },
      };
    }
  }
}

// Export singleton instance
export const coverageApiService = new CoverageApiService();
export type { CoverageRequest, CoverageResult };