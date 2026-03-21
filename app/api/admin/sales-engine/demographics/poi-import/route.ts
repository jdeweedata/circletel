import { NextRequest, NextResponse } from 'next/server';
import { apiLogger } from '@/lib/logging/logger';
import { importOsmPois } from '@/lib/sales-engine/osm-poi-service';

export const runtime = 'nodejs';
export const maxDuration = 120;

/**
 * POST /api/admin/sales-engine/demographics/poi-import
 * Upload OSM GeoJSON to aggregate business POI counts per ward.
 * Accepts multipart form data with a 'file' field or JSON body with GeoJSON.
 */
export async function POST(request: NextRequest) {
  try {
    let geojson: { type: string; features: unknown[] };

    const contentType = request.headers.get('content-type') ?? '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json(
          { error: 'No file uploaded. Provide a GeoJSON file in the "file" field.', success: false },
          { status: 400 }
        );
      }
      const text = await file.text();
      geojson = JSON.parse(text);
    } else {
      geojson = await request.json();
    }

    if (geojson.type !== 'FeatureCollection' || !Array.isArray(geojson.features)) {
      return NextResponse.json(
        { error: 'Invalid GeoJSON: must be a FeatureCollection', success: false },
        { status: 400 }
      );
    }

    const result = await importOsmPois(geojson as Parameters<typeof importOsmPois>[0]);

    if (result.error) {
      apiLogger.error('[OSM POI] Import failed', { error: result.error });
      return NextResponse.json({ error: result.error, success: false }, { status: 500 });
    }

    apiLogger.info('[OSM POI] Import completed', {
      total_pois: result.data?.total_pois,
      wards_updated: result.data?.wards_updated,
    });

    return NextResponse.json({ data: result.data, success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    apiLogger.error('[OSM POI] Import error', { error: message });
    return NextResponse.json({ error: message, success: false }, { status: 500 });
  }
}
