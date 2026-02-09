// MTN WMS Proxy for Map Tiles
import { NextRequest, NextResponse } from 'next/server';
import { MTN_CONFIGS } from '@/lib/coverage/mtn/types';
import { apiLogger } from '@/lib/logging';

interface WMSProxyRequest {
  configId: 'business' | 'consumer';
  layer: string;
  bbox: string; // "minX,minY,maxX,maxY"
  width: number;
  height: number;
  format?: string;
  transparent?: boolean;
  opacity?: number;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);

    const configId = searchParams.get('configId') as 'business' | 'consumer';
    const layer = searchParams.get('layer');
    const bbox = searchParams.get('bbox');
    const width = parseInt(searchParams.get('width') || '256');
    const height = parseInt(searchParams.get('height') || '256');
    const format = searchParams.get('format') || 'image/png';
    const transparent = searchParams.get('transparent') !== 'false';

    // Validate required parameters
    if (!configId || !layer || !bbox) {
      return NextResponse.json({
        error: 'Missing required parameters: configId, layer, bbox'
      }, { status: 400 });
    }

    // Validate config ID
    const config = MTN_CONFIGS[configId];
    if (!config) {
      return NextResponse.json({
        error: `Invalid configId: ${configId}. Must be 'business' or 'consumer'`
      }, { status: 400 });
    }

    // Validate layer exists in config
    const layerExists = Object.values(config.layers).includes(layer);
    if (!layerExists) {
      return NextResponse.json({
        error: `Layer '${layer}' not available in ${configId} configuration`
      }, { status: 400 });
    }

    // Validate bbox format
    const bboxParts = bbox.split(',').map(Number);
    if (bboxParts.length !== 4 || bboxParts.some(isNaN)) {
      return NextResponse.json({
        error: 'Invalid bbox format. Expected: "minX,minY,maxX,maxY"'
      }, { status: 400 });
    }

    // Build WMS GetMap request
    const wmsParams = new URLSearchParams({
      SERVICE: 'WMS',
      VERSION: '1.3.0',
      REQUEST: 'GetMap',
      LAYERS: layer,
      STYLES: '',
      CRS: 'CRS:84', // WGS84 longitude/latitude
      BBOX: bbox,
      WIDTH: width.toString(),
      HEIGHT: height.toString(),
      FORMAT: format,
      TRANSPARENT: transparent.toString(),
      EXCEPTIONS: 'application/json'
    });

    const wmsUrl = `${config.wmsEndpoint}/wms?${wmsParams.toString()}`;

    // Fetch from MTN WMS service
    const wmsResponse = await fetch(wmsUrl, {
      headers: {
        'User-Agent': 'CircleTel-Coverage-Map/1.0'
      }
    });

    if (!wmsResponse.ok) {
      apiLogger.error(`WMS request failed: ${wmsResponse.status} ${wmsResponse.statusText}`);
      return NextResponse.json({
        error: `WMS service error: ${wmsResponse.status}`
      }, { status: 502 });
    }

    // Get response content type
    const contentType = wmsResponse.headers.get('content-type') || format;

    // Handle error responses (some WMS servers return XML errors)
    if (contentType.includes('xml') || contentType.includes('json')) {
      const errorText = await wmsResponse.text();
      if (errorText.toLowerCase().includes('error') || errorText.toLowerCase().includes('exception')) {
        apiLogger.error('WMS service returned error:', errorText);
        return NextResponse.json({
          error: 'WMS service returned an error'
        }, { status: 502 });
      }
    }

    // Stream the image response
    const imageBuffer = await wmsResponse.arrayBuffer();

    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Cache-Control', 'public, max-age=1800, stale-while-revalidate=3600'); // 30 min cache
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');

    return new NextResponse(imageBuffer, {
      status: 200,
      headers
    });

  } catch (error) {
    apiLogger.error('WMS proxy error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: WMSProxyRequest = await request.json();

    // Validate request body
    if (!body.configId || !body.layer || !body.bbox) {
      return NextResponse.json({
        error: 'Missing required fields: configId, layer, bbox'
      }, { status: 400 });
    }

    // Convert POST body to GET parameters
    const searchParams = new URLSearchParams({
      configId: body.configId,
      layer: body.layer,
      bbox: body.bbox,
      width: body.width?.toString() || '256',
      height: body.height?.toString() || '256',
      format: body.format || 'image/png',
      transparent: (body.transparent !== false).toString()
    });

    // Create GET request URL
    const getUrl = new URL(request.url);
    getUrl.search = searchParams.toString();

    // Create new request for GET handler
    const getRequest = new NextRequest(getUrl.toString(), {
      method: 'GET',
      headers: request.headers
    });

    return GET(getRequest);

  } catch (error) {
    apiLogger.error('WMS proxy POST error:', error);
    return NextResponse.json({
      error: 'Invalid JSON body'
    }, { status: 400 });
  }
}

export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  // Handle CORS preflight
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  headers.set('Access-Control-Max-Age', '86400'); // 24 hours

  return new NextResponse(null, {
    status: 200,
    headers
  });
}