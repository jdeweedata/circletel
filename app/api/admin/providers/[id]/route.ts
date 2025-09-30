// Individual Provider Management API
import { NextRequest, NextResponse } from 'next/server';
import { mtnWMSClient } from '@/lib/coverage/mtn/wms-client';

// Get individual provider details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const params = await context.params;
    const { id } = params;

    const { data, error } = await mtnWMSClient.supabase
      .from('network_providers')
      .select(`
        *,
        provider_logos (
          id,
          filename,
          original_name,
          file_path,
          file_size,
          dimensions,
          created_at
        ),
        coverage_files (
          id,
          filename,
          original_name,
          type,
          file_size,
          coverage_areas,
          service_types,
          status,
          error_message,
          created_at
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          error: 'Provider not found',
          code: 'NOT_FOUND'
        }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error fetching provider:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch provider details',
      code: 'FETCH_ERROR'
    }, { status: 500 });
  }
}

// Test provider API connection
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const params = await context.params;
    const { id } = params;
    const { action } = await request.json();

    if (action === 'test_connection') {
      // Get provider details
      const { data: provider, error } = await mtnWMSClient.supabase
        .from('network_providers')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !provider) {
        return NextResponse.json({
          success: false,
          error: 'Provider not found',
          code: 'NOT_FOUND'
        }, { status: 404 });
      }

      if (provider.type !== 'api' || !provider.api_config) {
        return NextResponse.json({
          success: false,
          error: 'Provider is not configured for API testing',
          code: 'NO_API_CONFIG'
        }, { status: 400 });
      }

      // Test API connection
      const startTime = Date.now();
      try {
        const apiConfig = provider.api_config;
        const testUrl = new URL(apiConfig.endpoints?.coverage || '/test', apiConfig.baseUrl);

        const response = await fetch(testUrl.toString(), {
          method: 'GET',
          signal: AbortSignal.timeout(apiConfig.timeoutMs || 30000),
          headers: {
            'User-Agent': 'CircleTel-Coverage-Checker/1.0',
            ...(apiConfig.customHeaders || {}),
            ...(apiConfig.apiKey && { 'Authorization': `Bearer ${apiConfig.apiKey}` })
          }
        });

        const responseTime = Date.now() - startTime;

        return NextResponse.json({
          success: true,
          data: {
            status: response.ok ? 'success' : 'error',
            statusCode: response.status,
            responseTime,
            message: response.ok
              ? 'API connection successful'
              : `API returned ${response.status} ${response.statusText}`
          }
        });

      } catch (error) {
        const responseTime = Date.now() - startTime;
        return NextResponse.json({
          success: true,
          data: {
            status: 'error',
            responseTime,
            message: error instanceof Error ? error.message : 'Connection failed'
          }
        });
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action',
      code: 'INVALID_ACTION'
    }, { status: 400 });

  } catch (error) {
    console.error('Error testing provider:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to test provider',
      code: 'TEST_ERROR'
    }, { status: 500 });
  }
}