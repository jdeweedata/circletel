import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

// MTN Coverage Checker API URLs
const MTN_COVERAGE_API = 'https://mtn-coverage-checker.vercel.app/api';
const DFA_COVERAGE_API = 'https://mtn-coverage-checker.vercel.app/api/dfa-coverage';
const PRODUCTS_API = 'https://mtn-coverage-checker.vercel.app/api/products';

interface CoverageRequest {
  lat: number;
  lng: number;
  address: string;
  technologies?: string[];
}

interface TechnologyResult {
  technology: string;
  available: boolean;
  strength: string;
  provider: string;
  confidence: number;
  features?: any[];
}

interface CoverageResponse {
  address: string;
  coordinates: { lat: number; lng: number };
  timestamp: string;
  overall: {
    hasAnyConcentration: boolean;
    availableTechnologies: string[];
    bestProvider: string;
    confidence: number;
  };
  providers: {
    name: string;
    technologies: string[];
    hasConcentration: boolean;
    confidence: number;
    availablePackages: string[];
    estimatedInstallTime?: number;
    notes?: string;
  }[];
  recommendations: {
    primary: any;
    alternatives: any[];
  };
}

// Check MTN coverage for mobile technologies
async function checkMTNCoverage(lat: number, lng: number, technologies: string[] = ['4G', '5G']): Promise<TechnologyResult[]> {
  try {
    const techParam = technologies.join(',');
    const url = `${MTN_COVERAGE_API}/coverage?lat=${lat}&lng=${lng}&technologies=${techParam}&type=wms`;

    console.log(`Checking MTN coverage: ${url}`);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CircleTel-Coverage-Check/1.0'
      }
    });

    if (!response.ok) {
      console.error(`MTN API error: ${response.status} ${response.statusText}`);
      return technologies.map(tech => ({
        technology: tech,
        available: false,
        strength: 'No Signal',
        provider: 'MTN',
        confidence: 0,
        features: []
      }));
    }

    const data = await response.json();
    console.log('MTN API response:', JSON.stringify(data, null, 2));

    const results: TechnologyResult[] = [];

    if (data.type === 'wms_feature_info_multi' && data.results) {
      // Multi-technology response
      technologies.forEach(tech => {
        const techResult = data.results[tech];
        const features = techResult?.features || [];
        const hasFeatures = features.length > 0;

        results.push({
          technology: tech,
          available: hasFeatures,
          strength: hasFeatures ? 'Good' : 'No Signal',
          provider: 'MTN',
          confidence: hasFeatures ? 80 : 10,
          features
        });
      });
    } else if (data.type === 'wms_feature_info' && data.content) {
      // Single technology response
      const features = data.content.features || [];
      const hasFeatures = features.length > 0;

      results.push({
        technology: data.technology || technologies[0],
        available: hasFeatures,
        strength: hasFeatures ? 'Good' : 'No Signal',
        provider: 'MTN',
        confidence: hasFeatures ? 80 : 10,
        features
      });
    } else {
      // Fallback
      technologies.forEach(tech => {
        results.push({
          technology: tech,
          available: false,
          strength: 'No Signal',
          provider: 'MTN',
          confidence: 0,
          features: []
        });
      });
    }

    return results;
  } catch (error) {
    console.error('MTN coverage check failed:', error);
    return technologies.map(tech => ({
      technology: tech,
      available: false,
      strength: 'No Signal',
      provider: 'MTN',
      confidence: 0,
      features: []
    }));
  }
}

// Check DFA coverage for fibre
async function checkDFACoverage(lat: number, lng: number): Promise<TechnologyResult> {
  try {
    const url = `${DFA_COVERAGE_API}?lat=${lat}&lng=${lng}&buffer=1000`;

    console.log(`Checking DFA coverage: ${url}`);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CircleTel-Coverage-Check/1.0'
      }
    });

    if (!response.ok) {
      console.error(`DFA API error: ${response.status} ${response.statusText}`);
      return {
        technology: 'FIBRE',
        available: false,
        strength: 'No Signal',
        provider: 'DFA',
        confidence: 0
      };
    }

    const data = await response.json();
    console.log('DFA API response:', JSON.stringify(data, null, 2));

    const infrastructure = data.infrastructure;
    const isAvailable = infrastructure?.available || false;

    let strength = 'No Signal';
    let confidence = 0;

    if (isAvailable) {
      switch (infrastructure.buildingType) {
        case 'Connected':
          strength = 'Excellent';
          confidence = 95;
          break;
        case 'Near-Net':
          strength = 'Good';
          confidence = 75;
          break;
        case 'Ductbank':
          strength = 'Fair';
          confidence = 50;
          break;
        default:
          strength = 'Good';
          confidence = 70;
      }
    }

    return {
      technology: 'FIBRE',
      available: isAvailable,
      strength,
      provider: 'DFA',
      confidence,
      features: data.raw?.connected?.features || []
    };
  } catch (error) {
    console.error('DFA coverage check failed:', error);
    return {
      technology: 'FIBRE',
      available: false,
      strength: 'No Signal',
      provider: 'DFA',
      confidence: 0
    };
  }
}

// Get available products based on coverage
async function getAvailableProducts(lat: number, lng: number, technologies: string[]): Promise<any[]> {
  try {
    const techParam = technologies.join(',');
    const url = `${PRODUCTS_API}?lat=${lat}&lng=${lng}&technologies=${techParam}`;

    console.log(`Fetching products: ${url}`);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CircleTel-Coverage-Check/1.0'
      }
    });

    if (!response.ok) {
      console.error(`Products API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    return data.data?.plans || [];
  } catch (error) {
    console.error('Products fetch failed:', error);
    return [];
  }
}

// Simulate CircleTel Wireless coverage (our own network)
function checkCircleTelWireless(lat: number, lng: number): TechnologyResult[] {
  // Major city coverage simulation
  const coverageAreas = [
    { name: 'Johannesburg', lat: -26.2041, lng: 28.0473, radius: 0.15 },
    { name: 'Cape Town', lat: -33.9249, lng: 18.4241, radius: 0.12 },
    { name: 'Durban', lat: -29.8587, lng: 31.0218, radius: 0.10 },
    { name: 'Pretoria', lat: -25.7479, lng: 28.2293, radius: 0.12 },
    { name: 'Port Elizabeth', lat: -33.9608, lng: 25.6022, radius: 0.08 },
  ];

  const nearestCoverage = coverageAreas.find(area => {
    const distance = Math.sqrt(
      Math.pow(lat - area.lat, 2) + Math.pow(lng - area.lng, 2)
    );
    return distance <= area.radius;
  });

  const hasWirelessCoverage = !!nearestCoverage;
  const hasLTECoverage = true; // Assume LTE is available everywhere

  return [
    {
      technology: 'FIXED_WIRELESS',
      available: hasWirelessCoverage,
      strength: hasWirelessCoverage ? 'Excellent' : 'No Signal',
      provider: 'CircleTel Wireless',
      confidence: hasWirelessCoverage ? 95 : 5
    },
    {
      technology: 'LTE',
      available: hasLTECoverage,
      strength: hasLTECoverage ? 'Good' : 'No Signal',
      provider: 'CircleTel Wireless',
      confidence: hasLTECoverage ? 85 : 5
    }
  ];
}

// Main coverage check function
async function checkMultiProviderCoverage(request: CoverageRequest): Promise<CoverageResponse> {
  const { lat, lng, address, technologies = ['FIBRE', 'FIXED_WIRELESS', 'LTE', '4G', '5G'] } = request;

  console.log(`Checking coverage for ${address} at ${lat}, ${lng}`);
  console.log(`Requested technologies: ${technologies.join(', ')}`);

  // Run all coverage checks in parallel
  const coverageChecks = await Promise.allSettled([
    checkDFACoverage(lat, lng),
    checkMTNCoverage(lat, lng, technologies.filter(t => ['4G', '5G', 'LTE'].includes(t))),
    Promise.resolve(checkCircleTelWireless(lat, lng))
  ]);

  // Process results
  const allResults: TechnologyResult[] = [];

  // DFA results
  if (coverageChecks[0].status === 'fulfilled') {
    allResults.push(coverageChecks[0].value);
  }

  // MTN results
  if (coverageChecks[1].status === 'fulfilled') {
    allResults.push(...coverageChecks[1].value);
  }

  // CircleTel results
  if (coverageChecks[2].status === 'fulfilled') {
    allResults.push(...coverageChecks[2].value);
  }

  // Group results by provider
  const providerMap = new Map();

  allResults.forEach(result => {
    if (!providerMap.has(result.provider)) {
      providerMap.set(result.provider, {
        name: result.provider,
        technologies: [],
        hasConcentration: false,
        confidence: 0,
        availablePackages: [],
        estimatedInstallTime: undefined,
        notes: ''
      });
    }

    const provider = providerMap.get(result.provider);

    if (result.available) {
      provider.technologies.push(result.technology);
      provider.hasConcentration = true;
      provider.confidence = Math.max(provider.confidence, result.confidence);

      // Add technology-specific packages
      switch (result.technology) {
        case 'FIBRE':
          provider.availablePackages.push('BizFibreConnect', 'HomeFibreConnect');
          provider.estimatedInstallTime = 3;
          break;
        case 'FIXED_WIRELESS':
          provider.availablePackages.push('SkyFibre 50Mbps', 'SkyFibre 100Mbps');
          provider.estimatedInstallTime = 1;
          break;
        case 'LTE':
        case '4G':
        case '5G':
          provider.availablePackages.push('Mobile LTE', 'Mobile 5G');
          provider.estimatedInstallTime = 0;
          break;
      }
    }
  });

  const providers = Array.from(providerMap.values());
  const providersWithCoverage = providers.filter(p => p.hasConcentration);

  // Get available technologies
  const availableTechnologies = Array.from(
    new Set(allResults.filter(r => r.available).map(r => r.technology))
  );

  // Find best provider (highest priority with coverage)
  const providerPriority = { 'CircleTel Wireless': 10, 'DFA': 8, 'MTN': 6 };
  const bestProvider = providersWithCoverage
    .sort((a, b) => (providerPriority[b.name] || 0) - (providerPriority[a.name] || 0))[0];

  // Calculate overall confidence
  const overallConfidence = providersWithCoverage.length > 0
    ? Math.max(...providersWithCoverage.map(p => p.confidence))
    : 0;

  // Get alternatives
  const alternatives = providersWithCoverage
    .filter(p => p.name !== bestProvider?.name)
    .sort((a, b) => (providerPriority[b.name] || 0) - (providerPriority[a.name] || 0));

  return {
    address,
    coordinates: { lat, lng },
    timestamp: new Date().toISOString(),
    overall: {
      hasAnyConcentration: providersWithCoverage.length > 0,
      availableTechnologies,
      bestProvider: bestProvider?.name || 'None',
      confidence: overallConfidence
    },
    providers,
    recommendations: {
      primary: bestProvider || null,
      alternatives
    }
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { lat, lng, address, technologies } = await req.json();

    if (!lat || !lng || !address) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: lat, lng, address' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Coverage check request: ${address} (${lat}, ${lng})`);

    const result = await checkMultiProviderCoverage({
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      address,
      technologies
    });

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Coverage check error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to check coverage',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});