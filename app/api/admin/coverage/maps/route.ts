// Coverage Maps Management API
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { parseStringPromise } from 'xml2js';
import { supabase } from '@/lib/supabase';

// Force dynamic rendering - don't pre-render at build time
export const dynamic = 'force-dynamic';

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed file types
const ALLOWED_TYPES = ['application/vnd.google-earth.kml+xml', 'application/vnd.google-earth.kmz', 'application/json'];
const ALLOWED_EXTENSIONS = ['.kml', '.kmz', '.geojson'];

interface MapMetadata {
  name: string;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  featureCount: number;
  placemarkCount?: number;
  description?: string;
}

// Extract metadata from KML content
async function extractKMLMetadata(kmlContent: string): Promise<MapMetadata> {
  try {
    const result = await parseStringPromise(kmlContent);

    const kml = result.kml || result.Document;
    const document = kml?.Document?.[0] || kml;

    const name = document.name?.[0] || 'Unnamed Map';
    const description = document.description?.[0] || '';

    // Count features
    const placemarks = document.Placemark || [];
    const folders = document.Folder || [];

    let featureCount = placemarks.length;
    folders.forEach((folder: any) => {
      if (folder.Placemark) {
        featureCount += folder.Placemark.length;
      }
    });

    // Try to extract bounds if LatLonBox is present
    let bounds;
    if (document.LatLonBox?.[0]) {
      const box = document.LatLonBox[0];
      bounds = {
        north: parseFloat(box.north?.[0] || '0'),
        south: parseFloat(box.south?.[0] || '0'),
        east: parseFloat(box.east?.[0] || '0'),
        west: parseFloat(box.west?.[0] || '0')
      };
    }

    return {
      name,
      bounds,
      featureCount,
      placemarkCount: placemarks.length,
      description
    };
  } catch (error) {
    console.error('Error parsing KML:', error);
    return {
      name: 'Unknown',
      featureCount: 0
    };
  }
}

// Extract KML from KMZ file
async function extractKMLFromKMZ(buffer: Buffer): Promise<string> {
  try {
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();

    // Find the main KML file (usually doc.kml or the first .kml file)
    const kmlEntry = zipEntries.find(entry =>
      entry.entryName.toLowerCase() === 'doc.kml' ||
      entry.entryName.toLowerCase().endsWith('.kml')
    );

    if (!kmlEntry) {
      throw new Error('No KML file found in KMZ archive');
    }

    return kmlEntry.getData().toString('utf8');
  } catch (error) {
    console.error('Error extracting KMZ:', error);
    throw new Error('Failed to extract KML from KMZ file');
  }
}

// POST - Upload coverage map file
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const provider = formData.get('provider') as string;
    const coverageArea = formData.get('coverageArea') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!provider) {
      return NextResponse.json(
        { success: false, error: 'Provider is required' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Validate file extension
    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { success: false, error: `File type ${ext} not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}` },
        { status: 400 }
      );
    }

    // Read file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extract metadata based on file type
    let metadata: MapMetadata;
    let kmlContent: string;

    if (ext === '.kmz') {
      kmlContent = await extractKMLFromKMZ(buffer);
      metadata = await extractKMLMetadata(kmlContent);
    } else if (ext === '.kml') {
      kmlContent = buffer.toString('utf8');
      metadata = await extractKMLMetadata(kmlContent);
    } else if (ext === '.geojson') {
      const geoJson = JSON.parse(buffer.toString('utf8'));
      metadata = {
        name: geoJson.name || file.name.replace(ext, ''),
        featureCount: geoJson.features?.length || 0
      };
    } else {
      return NextResponse.json(
        { success: false, error: 'Unsupported file type' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads', 'coverage-maps');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedProvider = provider.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const sanitizedName = file.name.replace(/[^a-z0-9.]/gi, '-').toLowerCase();
    const filename = `${sanitizedProvider}-${timestamp}-${sanitizedName}`;
    const filePath = path.join(uploadsDir, filename);

    // Save file
    await writeFile(filePath, buffer);

    // Save to database
    const relativePath = `/uploads/coverage-maps/${filename}`;

    const { data: dbRecord, error: dbError } = await supabase
      .from('coverage_maps')
      .insert({
        name: metadata.name || file.name,
        provider,
        file_type: ext.replace('.', ''),
        file_path: relativePath,
        file_size: file.size,
        coverage_area: coverageArea || 'Unspecified',
        features_count: metadata.featureCount,
        bounds: metadata.bounds || null,
        status: 'active',
        metadata: {
          description: metadata.description,
          placemarkCount: metadata.placemarkCount,
          originalFilename: file.name
        }
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { success: false, error: 'Failed to save to database', details: dbError.message },
        { status: 500 }
      );
    }

    const response = {
      success: true,
      message: 'Coverage map uploaded successfully',
      data: {
        id: dbRecord.id,
        name: dbRecord.name,
        provider: dbRecord.provider,
        coverageArea: dbRecord.coverage_area,
        type: dbRecord.file_type as 'kml' | 'kmz' | 'geojson',
        fileSize: `${(dbRecord.file_size / 1024).toFixed(1)} KB`,
        uploadedAt: dbRecord.created_at,
        coverage: {
          area: dbRecord.coverage_area,
          features: dbRecord.features_count
        },
        status: dbRecord.status,
        filePath: dbRecord.file_path
      }
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Error uploading coverage map:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload coverage map',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET - List all coverage maps
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {

    const { data: maps, error } = await supabase
      .from('coverage_maps')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch maps from database', details: error.message },
        { status: 500 }
      );
    }

    // Transform database records to frontend format
    const transformedMaps = maps.map(map => ({
      id: map.id,
      name: map.name,
      provider: map.provider,
      type: map.file_type as 'kml' | 'kmz' | 'geojson',
      uploadedAt: new Date(map.created_at).toISOString().split('T')[0],
      fileSize: `${(map.file_size / (1024 * 1024)).toFixed(1)} MB`,
      coverage: {
        area: map.coverage_area,
        features: map.features_count
      },
      status: map.status as 'active' | 'inactive',
      filePath: map.file_path
    }));

    return NextResponse.json({
      success: true,
      data: {
        maps: transformedMaps,
        total: maps.length
      }
    });

  } catch (error) {
    console.error('Error fetching coverage maps:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch coverage maps',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}