// MTN Configuration API Endpoint
import { NextRequest, NextResponse } from 'next/server';
import { MTN_CONFIGS, SERVICE_TYPE_MAPPING } from '@/lib/coverage/mtn/types';
import { apiLogger } from '@/lib/logging';

interface ConfigResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<ConfigResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const configId = searchParams.get('configId');

    if (configId) {
      // Return specific configuration
      const config = MTN_CONFIGS[configId as keyof typeof MTN_CONFIGS];
      if (!config) {
        return NextResponse.json({
          success: false,
          error: `Configuration '${configId}' not found`
        }, { status: 404 });
      }

      // Add layer information with service types
      const layersWithInfo = Object.entries(config.layers).map(([serviceType, layerName]) => ({
        serviceType,
        layerName,
        displayName: SERVICE_TYPE_MAPPING[serviceType as keyof typeof SERVICE_TYPE_MAPPING]?.name || serviceType,
        description: SERVICE_TYPE_MAPPING[serviceType as keyof typeof SERVICE_TYPE_MAPPING]?.description,
        category: SERVICE_TYPE_MAPPING[serviceType as keyof typeof SERVICE_TYPE_MAPPING]?.category,
        color: SERVICE_TYPE_MAPPING[serviceType as keyof typeof SERVICE_TYPE_MAPPING]?.color,
        priority: SERVICE_TYPE_MAPPING[serviceType as keyof typeof SERVICE_TYPE_MAPPING]?.priority
      }));

      return NextResponse.json({
        success: true,
        data: {
          ...config,
          layersWithInfo,
          totalLayers: layersWithInfo.length
        }
      });
    }

    // Return all configurations
    const allConfigs = Object.entries(MTN_CONFIGS).map(([key, config]) => {
      const layersWithInfo = Object.entries(config.layers).map(([serviceType, layerName]) => ({
        serviceType,
        layerName,
        displayName: SERVICE_TYPE_MAPPING[serviceType as keyof typeof SERVICE_TYPE_MAPPING]?.name || serviceType,
        category: SERVICE_TYPE_MAPPING[serviceType as keyof typeof SERVICE_TYPE_MAPPING]?.category,
        color: SERVICE_TYPE_MAPPING[serviceType as keyof typeof SERVICE_TYPE_MAPPING]?.color
      }));

      return {
        key,
        ...config,
        layersWithInfo,
        totalLayers: layersWithInfo.length
      };
    });

    const response = {
      success: true,
      data: {
        configs: allConfigs,
        serviceTypes: SERVICE_TYPE_MAPPING,
        summary: {
          totalConfigs: allConfigs.length,
          businessLayers: allConfigs.find(c => c.type === 'business')?.totalLayers || 0,
          consumerLayers: allConfigs.find(c => c.type === 'consumer')?.totalLayers || 0
        }
      }
    };

    // Add caching headers
    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=7200'); // 1 hour cache
    headers.set('Content-Type', 'application/json');

    return NextResponse.json(response, { headers });

  } catch (error) {
    apiLogger.error('MTN configs API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Test connectivity to MTN WMS service
export async function POST(request: NextRequest): Promise<NextResponse<ConfigResponse>> {
  try {
    const body = await request.json();
    const { configId, testConnectivity } = body;

    if (!testConnectivity) {
      return NextResponse.json({
        success: false,
        error: 'This endpoint is for connectivity testing. Set testConnectivity: true'
      }, { status: 400 });
    }

    const config = configId ?
      MTN_CONFIGS[configId as keyof typeof MTN_CONFIGS] :
      MTN_CONFIGS.business;

    if (!config) {
      return NextResponse.json({
        success: false,
        error: `Configuration '${configId}' not found`
      }, { status: 404 });
    }

    // Test WMS GetCapabilities
    const capabilitiesUrl = `${config.wmsEndpoint}/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities`;

    try {
      const response = await fetch(capabilitiesUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'CircleTel-Coverage-Test/1.0'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      const isAccessible = response.ok;
      let serverInfo = null;

      if (isAccessible) {
        // Try to parse some basic info from capabilities
        const capabilities = await response.text();
        const titleMatch = capabilities.match(/<Title>(.*?)<\/Title>/i);
        const versionMatch = capabilities.match(/version="([^"]+)"/i);

        serverInfo = {
          title: titleMatch ? titleMatch[1] : 'Unknown',
          version: versionMatch ? versionMatch[1] : 'Unknown',
          responseTime: Date.now()
        };
      }

      return NextResponse.json({
        success: true,
        data: {
          configId: config.configId,
          configName: config.name,
          endpoint: config.wmsEndpoint,
          accessible: isAccessible,
          serverInfo,
          testedAt: new Date().toISOString()
        }
      });

    } catch (connectivityError) {
      return NextResponse.json({
        success: true,
        data: {
          configId: config.configId,
          configName: config.name,
          endpoint: config.wmsEndpoint,
          accessible: false,
          error: connectivityError instanceof Error ? connectivityError.message : 'Connection failed',
          testedAt: new Date().toISOString()
        }
      });
    }

  } catch (error) {
    apiLogger.error('MTN connectivity test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}