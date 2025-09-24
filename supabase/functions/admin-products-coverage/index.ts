/**
 * Admin Products Coverage Edge Function
 *
 * Fetches admin products filtered by technology type and transforms them
 * to ServicePackage format for the coverage checking system.
 *
 * @see specs/001-admin-products-integration/contracts/admin-products-coverage-api.yaml
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ServicePackage type definition (inline for Edge Function)
interface ServicePackage {
  id: string;
  name: string;
  technology: string;
  provider: string;
  speed: string;
  price: number;
  originalPrice?: number;
  installation: number;
  originalInstallation?: number;
  router: number;
  originalRouter?: number;
  contract: number;
  features: string[];
  available: boolean;
  isRecommended: boolean;
  metadata?: Record<string, unknown>;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

// =============================================================================
// Environment Configuration
// =============================================================================

/**
 * Validate required environment variables
 */
function validateEnvironment(): { supabaseUrl: string; supabaseKey: string } {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SECRET_KEY');

  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL environment variable is required');
  }

  if (!supabaseKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY environment variable is required');
  }

  return { supabaseUrl, supabaseKey };
}

// =============================================================================
// Error Response Helpers
// =============================================================================

/**
 * Standard error response structure
 */
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Create standardized error response
 */
function createErrorResponse(
  code: string,
  message: string,
  details?: Record<string, unknown>
): Response {
  const errorResponse: ErrorResponse = {
    success: false,
    error: { code, message, details }
  };

  const statusCode = getStatusCodeForError(code);

  return new Response(JSON.stringify(errorResponse), {
    status: statusCode,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * Map error codes to HTTP status codes
 */
function getStatusCodeForError(code: string): number {
  const statusMap: Record<string, number> = {
    'INVALID_REQUEST': 400,
    'INVALID_TECHNOLOGY': 400,
    'MISSING_PARAMETERS': 400,
    'VALIDATION_ERROR': 400,
    'DATABASE_ERROR': 500,
    'INTERNAL_ERROR': 500,
    'TRANSFORMATION_ERROR': 500
  };

  return statusMap[code] || 500;
}

// =============================================================================
// Request Validation
// =============================================================================

/**
 * Valid technology types that can be requested
 */
const VALID_TECHNOLOGIES = ['FIBRE', 'FIXED_WIRELESS', 'LTE'] as const;

/**
 * Validate and parse request parameters
 */
function validateRequest(url: URL): { technologies: string[]; coverageArea?: string } {
  const technologiesParam = url.searchParams.get('technologies');

  if (!technologiesParam) {
    throw new Error('MISSING_PARAMETERS:technologies parameter is required');
  }

  const technologies = technologiesParam.split(',').map(t => t.trim());

  // Validate each technology type
  for (const tech of technologies) {
    if (!VALID_TECHNOLOGIES.includes(tech as typeof VALID_TECHNOLOGIES[number])) {
      throw new Error(`INVALID_TECHNOLOGY:Invalid technology type '${tech}'. Valid types: ${VALID_TECHNOLOGIES.join(', ')}`);
    }
  }

  const coverageArea = url.searchParams.get('coverageArea') || undefined;

  return { technologies, coverageArea };
}

// =============================================================================
// Database Query Logic (T007)
// =============================================================================

/**
 * Database query result types (updated for existing smb_products table)
 */
interface ProductQueryResult {
  id: string;
  package_name: string;
  package_code: string;
  speed_mbps: number;
  product_category: string; // 'SMB', 'Enterprise', 'Residential'
  regular_price_zar: number;
  promo_price_zar: number;
  installation_fee_zar: number;
  router_model: string;
  router_features: Record<string, unknown>;
  is_active: boolean;
}

/**
 * Category mapping for technology filtering
 * For now, we'll map SMB products to FIXED_WIRELESS since they're wireless business products
 */
const CATEGORY_TO_TECHNOLOGY: Record<string, string> = {
  'SMB': 'FIXED_WIRELESS',
  'Enterprise': 'FIXED_WIRELESS',
  'Residential': 'FIXED_WIRELESS'
};

/**
 * Fetch products with optimized query for existing smb_products table
 */
async function fetchAdminProducts(
  supabase: unknown,
  technologies: string[],
  coverageArea?: string
): Promise<ProductQueryResult[]> {
  try {
    // Map requested technologies to database categories
    const validCategories = Object.entries(CATEGORY_TO_TECHNOLOGY)
      .filter(([_, tech]) => technologies.includes(tech))
      .map(([category, _]) => category);

    if (validCategories.length === 0) {
      console.log('No valid categories found for technologies:', technologies);
      return [];
    }

    console.log('Fetching products for categories:', validCategories);

    // Query the existing smb_products table
    const { data: products, error: queryError } = await supabase
      .from('smb_products')
      .select('*')
      .eq('is_active', true)
      .in('product_category', validCategories)
      .order('regular_price_zar', { ascending: true }); // Order by price

    if (queryError) {
      console.error('Database query error:', queryError);
      throw new Error(`DATABASE_ERROR:Failed to fetch products: ${queryError.message}`);
    }

    if (!products || products.length === 0) {
      console.log('No products found for categories:', validCategories);
      return [];
    }

    console.log(`Found ${products.length} products`);

    // Transform database records to our interface
    const result: ProductQueryResult[] = products.map(product => ({
      id: product.id,
      package_name: product.package_name,
      package_code: product.package_code,
      speed_mbps: product.speed_mbps || 0,
      product_category: product.product_category,
      regular_price_zar: Number(product.regular_price_zar) || 0,
      promo_price_zar: Number(product.promo_price_zar) || 0,
      installation_fee_zar: Number(product.installation_fee_zar) || 0,
      router_model: product.router_model,
      router_features: product.router_features || {},
      is_active: product.is_active
    }));

    console.log(`Returning ${result.length} complete products`);
    return result;

  } catch (error) {
    console.error('Error in fetchAdminProducts:', error);
    if (error instanceof Error && error.message.includes(':')) {
      throw error; // Re-throw structured errors
    }
    throw new Error(`DATABASE_ERROR:Unexpected error fetching products: ${error}`);
  }
}

// =============================================================================
// ServicePackage Transformation Logic (T008)
// =============================================================================

/**
 * Transform products to ServicePackage format
 */
async function transformToServicePackages(
  products: ProductQueryResult[]
): Promise<ServicePackage[]> {
  try {
    console.log(`Transforming ${products.length} products to ServicePackage format`);

    const servicePackages = products.map(product => {
      // Map category to technology type
      const technology = CATEGORY_TO_TECHNOLOGY[product.product_category] || 'FIXED_WIRELESS';

      // Check for promotional pricing
      const hasPromotion = product.promo_price_zar > 0 && product.promo_price_zar < product.regular_price_zar;
      const displayPrice = hasPromotion ? product.promo_price_zar : product.regular_price_zar;
      const originalPrice = hasPromotion ? product.regular_price_zar : undefined;

      // Installation cost
      const installationCost = product.installation_fee_zar;

      // Router cost (typically included for SMB products, so set to 0)
      const routerCost = 0;

      // Format speed display (assume symmetrical for business products)
      const speedDisplay = `${product.speed_mbps}Mbps`;

      // Extract features from router_features or create basic feature list
      const features = [];
      if (product.router_features) {
        // Extract some key features if available
        if (product.router_model) {
          features.push(`Router: ${product.router_model}`);
        }
        features.push('Business Grade Service');
        features.push('24/7 Support');
        features.push('Professional Installation');
      } else {
        features.push('Business Internet');
        features.push('Professional Support');
      }

      // Default contract term for SMB products
      const defaultContract = 12; // SMB products typically have 12-month contracts

      const servicePackage = {
        id: product.id,
        name: product.package_name,
        technology: technology,
        provider: 'CircleTel',
        speed: speedDisplay,
        price: displayPrice,
        originalPrice,
        installation: installationCost,
        originalInstallation: undefined,
        router: routerCost,
        originalRouter: undefined,
        contract: defaultContract,
        features,
        available: product.is_active,
        isRecommended: product.product_category === 'SMB', // Mark SMB products as recommended
        // Additional metadata
        metadata: {
          package_code: product.package_code,
          product_category: product.product_category,
          router_model: product.router_model,
          router_features: product.router_features,
          hasPromotion
        }
      };

      return servicePackage;
    });

    console.log(`Successfully transformed ${servicePackages.length} ServicePackages`);
    return servicePackages;

  } catch (error) {
    console.error('Error in transformToServicePackages:', error);
    throw new Error(`TRANSFORMATION_ERROR:Failed to transform products: ${error}`);
  }
}

/**
 * Technology mapping for response (ServicePackage format)
 */
function mapTechnologyForResponse(dbTechnology: string): string {
  const mapping: Record<string, string> = {
    'fibre': 'FIBRE',
    'fixed_wireless': 'FIXED_WIRELESS',
    'lte': 'LTE'
  };
  return mapping[dbTechnology] || dbTechnology.toUpperCase();
}

// =============================================================================
// Health Check Handler
// =============================================================================

/**
 * Basic health check endpoint
 */
function handleHealthCheck(): Response {
  const healthResponse = {
    success: true,
    service: 'admin-products-coverage',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: {
      supabaseConfigured: !!Deno.env.get('SUPABASE_URL'),
      serviceKeyConfigured: !!(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SECRET_KEY'))
    }
  };

  return new Response(JSON.stringify(healthResponse), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// =============================================================================
// Main Request Handler
// =============================================================================

/**
 * Main Edge Function handler
 */
serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate environment variables
    const { supabaseUrl, supabaseKey } = validateEnvironment();

    // Initialize Supabase client with service role key for admin access
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);

    // Handle health check
    if (url.pathname.includes('/health')) {
      return handleHealthCheck();
    }

    // Only allow GET requests for the main endpoint
    if (req.method !== 'GET') {
      return createErrorResponse(
        'INVALID_REQUEST',
        `Method ${req.method} not allowed. Use GET.`
      );
    }

    // Validate request parameters
    const { technologies, coverageArea } = validateRequest(url);

    // Log request for debugging (in development)
    console.log('Admin Products Coverage Request:', {
      technologies,
      coverageArea,
      timestamp: new Date().toISOString()
    });

    // Fetch admin products with pricing and features
    const products = await fetchAdminProducts(supabase, technologies, coverageArea);

    // Transform to ServicePackage format
    const servicePackages = await transformToServicePackages(products);

    const successResponse = {
      success: true,
      data: servicePackages,
      meta: {
        count: servicePackages.length,
        technologies
      }
    };

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        // Cache for 5 minutes as per research.md
        'Cache-Control': 'public, max-age=300'
      }
    });

  } catch (error) {
    console.error('Admin Products Coverage Error:', error);

    // Parse structured errors
    if (error instanceof Error && error.message.includes(':')) {
      const [code, message] = error.message.split(':', 2);
      return createErrorResponse(code, message.trim());
    }

    // Generic internal error
    return createErrorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred',
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
});

// =============================================================================
// Edge Function Metadata
// =============================================================================

/**
 * Edge Function configuration and metadata
 * This comment block is used by Supabase for function discovery and configuration
 */

/*
Function: admin-products-coverage
Description: Fetches admin products filtered by technology type
Runtime: Deno
Methods: GET, OPTIONS
Environment Variables Required:
  - SUPABASE_URL: Supabase project URL
  - SUPABASE_SERVICE_ROLE_KEY: Service role key for admin table access
  - Alternative: SUPABASE_SECRET_KEY (fallback)
Parameters:
  - technologies (required): Comma-separated technology types (FIBRE,FIXED_WIRELESS,LTE)
  - coverageArea (optional): Coverage area identifier for future geo-filtering
Response: ServicePackage[] formatted admin products with promotional pricing
Cache: 5 minutes
CORS: Enabled for all origins
*/