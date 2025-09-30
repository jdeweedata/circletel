// Coverage Files (KML/KMZ) Upload API
import { NextRequest, NextResponse } from 'next/server';
import { mtnWMSClient } from '@/lib/coverage/mtn/wms-client';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { parseStringPromise } from 'xml2js';
import AdmZip from 'adm-zip';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = ['application/vnd.google-earth.kml+xml', 'application/vnd.google-earth.kmz', 'text/xml', 'application/xml'];
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'coverage-files');

interface KMLMetadata {
  boundingBox?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  featureCount?: number;
  description?: string;
  author?: string;
  version?: string;
  coverageAreas?: string[];
}

// Upload coverage file (KML/KMZ)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id } = params;

    // Verify provider exists
    const { data: provider, error: providerError } = await mtnWMSClient.supabase
      .from('network_providers')
      .select('id, name')
      .eq('id', id)
      .single();

    if (providerError || !provider) {
      return NextResponse.json({
        success: false,
        error: 'Provider not found',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const serviceTypes = formData.get('serviceTypes') as string;
    const description = formData.get('description') as string;

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided',
        code: 'NO_FILE'
      }, { status: 400 });
    }

    // Validate file type and extension
    const fileExtension = path.extname(file.name).toLowerCase();
    const isKML = fileExtension === '.kml' || file.type.includes('kml');
    const isKMZ = fileExtension === '.kmz' || file.type.includes('kmz');

    if (!isKML && !isKMZ) {
      return NextResponse.json({
        success: false,
        error: 'Invalid file type. Only KML and KMZ files are allowed',
        code: 'INVALID_FILE_TYPE'
      }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        success: false,
        error: 'File too large. Maximum size is 50MB',
        code: 'FILE_TOO_LARGE'
      }, { status: 400 });
    }

    // Create upload directory if it doesn't exist
    await mkdir(UPLOAD_DIR, { recursive: true });

    // Generate filename
    const timestamp = Date.now();
    const sanitizedName = provider.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${sanitizedName}_${timestamp}${fileExtension}`;
    const filePath = path.join(UPLOAD_DIR, filename);
    const relativePath = `/uploads/coverage-files/${filename}`;

    // Save file
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // Parse and extract metadata
    let metadata: KMLMetadata = {};
    let kmlContent = '';

    try {
      if (isKMZ) {
        // Extract KML from KMZ
        const zip = new AdmZip(buffer);
        const zipEntries = zip.getEntries();
        const kmlEntry = zipEntries.find(entry => entry.entryName.endsWith('.kml'));

        if (kmlEntry) {
          kmlContent = kmlEntry.getData().toString('utf8');
        }
      } else {
        kmlContent = buffer.toString('utf8');
      }

      if (kmlContent) {
        const parsed = await parseStringPromise(kmlContent);
        metadata = await extractKMLMetadata(parsed);
      }
    } catch (parseError) {
      console.warn('Failed to parse KML metadata:', parseError);
      // Continue without metadata
    }

    // Parse service types
    const parsedServiceTypes = serviceTypes ? serviceTypes.split(',').map(s => s.trim()) : [];

    // Save coverage file record to database
    const { data: fileRecord, error: fileError } = await mtnWMSClient.supabase
      .from('coverage_files')
      .insert([{
        filename,
        original_name: file.name,
        type: isKML ? 'kml' : 'kmz',
        provider_id: id,
        file_path: relativePath,
        file_size: file.size,
        coverage_areas: metadata.coverageAreas || [],
        service_types: parsedServiceTypes,
        metadata,
        status: 'active'
      }])
      .select()
      .single();

    if (fileError) {
      throw fileError;
    }

    return NextResponse.json({
      success: true,
      data: {
        id: fileRecord.id,
        filename,
        originalName: file.name,
        type: isKML ? 'kml' : 'kmz',
        filePath: relativePath,
        fileSize: file.size,
        coverageAreas: metadata.coverageAreas || [],
        serviceTypes: parsedServiceTypes,
        metadata,
        status: 'active'
      }
    });

  } catch (error) {
    console.error('Error uploading coverage file:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to upload coverage file',
      code: 'UPLOAD_ERROR'
    }, { status: 500 });
  }
}

// Get coverage files for provider
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id } = params;

    const { data, error } = await mtnWMSClient.supabase
      .from('coverage_files')
      .select('*')
      .eq('provider_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('Error fetching coverage files:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch coverage files',
      code: 'FETCH_ERROR'
    }, { status: 500 });
  }
}

// Delete coverage file
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json({
        success: false,
        error: 'File ID is required',
        code: 'MISSING_FILE_ID'
      }, { status: 400 });
    }

    // Get file details before deletion
    const { data: file, error: fetchError } = await mtnWMSClient.supabase
      .from('coverage_files')
      .select('*')
      .eq('id', fileId)
      .eq('provider_id', params.id)
      .single();

    if (fetchError || !file) {
      return NextResponse.json({
        success: false,
        error: 'Coverage file not found',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    // Delete file record
    const { error: deleteError } = await mtnWMSClient.supabase
      .from('coverage_files')
      .delete()
      .eq('id', fileId);

    if (deleteError) {
      throw deleteError;
    }

    // Optionally delete file from filesystem
    // const filePath = path.join(process.cwd(), file.file_path);
    // await unlink(filePath).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Coverage file deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting coverage file:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete coverage file',
      code: 'DELETE_ERROR'
    }, { status: 500 });
  }
}

// Extract metadata from parsed KML
async function extractKMLMetadata(parsedKML: any): Promise<KMLMetadata> {
  const metadata: KMLMetadata = {};

  try {
    const kml = parsedKML.kml || parsedKML;
    const document = kml.Document?.[0] || kml;

    // Extract basic info
    if (document.name?.[0]) {
      metadata.description = document.name[0];
    }

    if (document.description?.[0]) {
      metadata.description = document.description[0];
    }

    // Count features (Placemarks)
    const placemarks = document.Placemark || [];
    metadata.featureCount = Array.isArray(placemarks) ? placemarks.length : (placemarks ? 1 : 0);

    // Extract coverage areas from folder names or placemark names
    const coverageAreas = new Set<string>();

    // Check folders
    if (document.Folder) {
      const folders = Array.isArray(document.Folder) ? document.Folder : [document.Folder];
      folders.forEach((folder: any) => {
        if (folder.name?.[0]) {
          coverageAreas.add(folder.name[0]);
        }
      });
    }

    // Check placemark names for location info
    if (Array.isArray(placemarks)) {
      placemarks.forEach((placemark: any) => {
        if (placemark.name?.[0]) {
          const name = placemark.name[0];
          // Extract province/city names (basic pattern matching)
          const locationPattern = /(gauteng|western cape|eastern cape|northern cape|free state|kwazulu-natal|limpopo|mpumalanga|north west|johannesburg|cape town|durban|pretoria|bloemfontein|port elizabeth|nelspruit|polokwane|kimberley|mafikeng)/i;
          const match = name.match(locationPattern);
          if (match) {
            coverageAreas.add(match[1]);
          }
        }
      });
    }

    metadata.coverageAreas = Array.from(coverageAreas);

    // Calculate bounding box (basic implementation)
    // This would need more sophisticated parsing for accurate bounds
    metadata.boundingBox = {
      north: -22.0,   // Default SA bounds
      south: -35.0,
      east: 33.0,
      west: 16.0
    };

  } catch (error) {
    console.warn('Error extracting KML metadata:', error);
  }

  return metadata;
}