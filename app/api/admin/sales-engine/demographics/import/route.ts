import { NextRequest, NextResponse } from 'next/server';
import { apiLogger } from '@/lib/logging/logger';
import {
  parseWardCsv,
  importWardDemographics,
} from '@/lib/sales-engine/demographic-enrichment-service';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST /api/admin/sales-engine/demographics/import
 * Upload Stats SA Census CSV to import ward demographics.
 * Accepts multipart form data with a 'file' field or JSON body with 'csv' text.
 */
export async function POST(request: NextRequest) {
  try {
    let csvText: string;

    const contentType = request.headers.get('content-type') ?? '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json(
          { error: 'No file uploaded. Provide a CSV file in the "file" field.', success: false },
          { status: 400 }
        );
      }
      csvText = await file.text();
    } else {
      const body = await request.json();
      csvText = body.csv;
      if (!csvText) {
        return NextResponse.json(
          { error: 'Provide CSV text in the "csv" field or upload a file.', success: false },
          { status: 400 }
        );
      }
    }

    // Parse CSV
    const { rows, errors: parseErrors } = parseWardCsv(csvText);

    if (rows.length === 0) {
      return NextResponse.json(
        {
          error: 'No valid rows parsed from CSV',
          parse_errors: parseErrors,
          success: false,
        },
        { status: 400 }
      );
    }

    // Import to database
    const result = await importWardDemographics(rows);

    if (result.error) {
      apiLogger.error('[Demographics] Import failed', { error: result.error });
      return NextResponse.json({ error: result.error, success: false }, { status: 500 });
    }

    apiLogger.info('[Demographics] Ward data imported', {
      imported: result.data?.imported,
      parse_errors: parseErrors.length,
    });

    return NextResponse.json({
      data: {
        rows_parsed: rows.length,
        imported: result.data?.imported ?? 0,
        parse_errors: parseErrors,
        import_errors: result.data?.errors ?? [],
      },
      success: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    apiLogger.error('[Demographics] Import error', { error: message });
    return NextResponse.json({ error: message, success: false }, { status: 500 });
  }
}
