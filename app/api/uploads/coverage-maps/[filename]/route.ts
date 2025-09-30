// API route to serve uploaded coverage map files
import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ filename: string }> }
): Promise<NextResponse> {
  try {
    const { filename } = await context.params;

    // Security: validate filename to prevent directory traversal
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json(
        { success: false, error: 'Invalid filename' },
        { status: 400 }
      );
    }

    // Construct file path
    const uploadsDir = path.join(process.cwd(), 'uploads', 'coverage-maps');
    const filePath = path.join(uploadsDir, filename);

    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    // Read file
    const fileBuffer = await readFile(filePath);

    // Determine content type based on extension
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';

    if (ext === '.kml') {
      contentType = 'application/vnd.google-earth.kml+xml';
    } else if (ext === '.kmz') {
      contentType = 'application/vnd.google-earth.kmz';
    } else if (ext === '.geojson' || ext === '.json') {
      contentType = 'application/json';
    }

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error('Error serving coverage map file:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to serve file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}