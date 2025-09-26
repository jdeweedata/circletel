import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

interface CoverageRequest {
  latitude: number;
  longitude: number;
  address?: string;
}

interface DFACoverageResponse {
  features: Array<{
    attributes: {
      OBJECTID: number;
      Building_ID: string;
      Longitude: number;
      Latitude: number;
      DFA_Connected: string;
      Third_Party_Dependant_For_Connection_Access: string;
      Broadband: string;
      FTTH: string;
      Precinct: string;
      Promotion: string;
      Building_Name?: string;
    };
    geometry: {
      x: number;
      y: number;
    };
  }>;
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

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c * 1000; // Return distance in meters
}

// Query DFA ArcGIS REST API for coverage
async function queryDFACoverage(latitude: number, longitude: number): Promise<DFACoverageResponse> {
  const baseUrl = 'https://gisportal.dfafrica.co.za/server/rest/services/API/DFA_Connected_Buildings/MapServer/0/query';

  // Query for buildings within 1km radius
  const params = new URLSearchParams({
    where: "DFA_Connected='Yes' AND Broadband='Yes'", // FTTB only
    geometry: `${longitude},${latitude}`,
    geometryType: 'esriGeometryPoint',
    distance: '1000', // 1km radius
    units: 'esriSRUnit_Meter',
    outFields: 'OBJECTID,Building_ID,Longitude,Latitude,DFA_Connected,Third_Party_Dependant_For_Connection_Access,Broadband,FTTH,Precinct,Promotion',
    returnGeometry: 'true',
    f: 'json'
  });

  const response = await fetch(`${baseUrl}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`DFA API error: ${response.status}`);
  }

  return await response.json();
}

// Check if location has direct FTTB coverage
function analyzeCoverage(
  latitude: number,
  longitude: number,
  dfaResponse: DFACoverageResponse
): CoverageResult {
  const features = dfaResponse.features || [];

  if (features.length === 0) {
    return {
      hasCoverage: false,
      connectionType: 'None',
      message: 'No FTTB coverage available in this area. Contact us to register interest for future expansion.',
      coordinates: { latitude, longitude }
    };
  }

  // Find the nearest building with FTTB coverage
  let nearestBuilding = null;
  let minDistance = Infinity;

  for (const feature of features) {
    const building = feature.attributes;
    const distance = calculateDistance(
      latitude,
      longitude,
      building.Latitude,
      building.Longitude
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearestBuilding = { building, distance };
    }
  }

  if (!nearestBuilding) {
    return {
      hasCoverage: false,
      connectionType: 'None',
      message: 'No FTTB coverage found nearby.',
      coordinates: { latitude, longitude }
    };
  }

  const { building, distance } = nearestBuilding;

  // Check if building is within acceptable range (100m for direct connection)
  const hasDirectCoverage = distance <= 100;
  const thirdPartyRequired = building.Third_Party_Dependant_For_Connection_Access === 'Yes';
  const isPromotion = building.Promotion === 'Yes';

  if (hasDirectCoverage) {
    return {
      hasCoverage: true,
      connectionType: thirdPartyRequired ? 'Third Party' : 'FTTB',
      buildingId: building.Building_ID,
      buildingName: building.Building_Name,
      isPromotion,
      thirdPartyRequired,
      message: thirdPartyRequired
        ? 'FTTB available through third-party provider. Additional setup may be required.'
        : 'FTTB coverage available! High-speed business fiber ready for installation.',
      coordinates: { latitude, longitude }
    };
  } else {
    // Nearby coverage available
    return {
      hasCoverage: false,
      connectionType: 'None',
      buildingId: building.Building_ID,
      buildingName: building.Building_Name,
      nearestBuilding: {
        distance: Math.round(distance),
        buildingName: building.Building_Name || `Building ${building.Building_ID}`,
        address: `${building.Latitude.toFixed(4)}, ${building.Longitude.toFixed(4)}`
      },
      message: `Nearest FTTB coverage is ${Math.round(distance)}m away. Contact us to discuss connection options.`,
      coordinates: { latitude, longitude }
    };
  }
}

serve(async (req) => {
  // Handle CORS for browser requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }

  try {
    const { latitude, longitude, address }: CoverageRequest = await req.json();

    // Validate input
    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({
          error: 'Missing required parameters: latitude and longitude'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    // Validate coordinates are within South Africa bounds
    if (latitude < -35 || latitude > -22 || longitude < 16 || longitude > 33) {
      return new Response(
        JSON.stringify({
          hasCoverage: false,
          connectionType: 'None',
          message: 'FTTB coverage checking is only available within South Africa.',
          coordinates: { latitude, longitude }
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    console.log(`Checking FTTB coverage for: ${latitude}, ${longitude}`);

    // Query DFA coverage API
    const dfaResponse = await queryDFACoverage(latitude, longitude);

    // Analyze coverage
    const result = analyzeCoverage(latitude, longitude, dfaResponse);

    console.log(`Coverage result:`, result);

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );

  } catch (error) {
    console.error('Coverage check error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to check coverage',
        message: 'Unable to check FTTB coverage at this time. Please try again later.',
        hasCoverage: false,
        connectionType: 'None'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
})