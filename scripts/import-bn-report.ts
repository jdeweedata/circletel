/**
 * Import BN-Report Excel Data into Supabase
 *
 * This script imports Tarana base station data from the BN-Report Excel file
 * into the tarana_base_stations table for SkyFibre coverage validation.
 *
 * Usage:
 *   npx tsx scripts/import-bn-report.ts
 *
 * Prerequisites:
 *   1. Run the migration: supabase/migrations/20251209_create_tarana_base_stations.sql
 *   2. Ensure SUPABASE_SERVICE_ROLE_KEY is set in .env.local
 */

import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface BNReportRow {
  'Serial Number': string;
  'Hostname': string;
  'Site': string;
  'Active Connections': number;
  'Market': string;
  'Location': string;
  'Region': string;
}

interface BaseStation {
  serial_number: string;
  hostname: string;
  site_name: string;
  active_connections: number;
  market: string;
  lat: number;
  lng: number;
  region: string;
}

function parseLocation(location: string): { lat: number; lng: number } | null {
  if (!location || typeof location !== 'string') return null;

  // Remove quotes and whitespace
  const cleaned = location.replace(/"/g, '').trim();

  if (!cleaned.includes(',')) return null;

  const parts = cleaned.split(',');
  if (parts.length !== 2) return null;

  const lat = parseFloat(parts[0].trim());
  const lng = parseFloat(parts[1].trim());

  if (isNaN(lat) || isNaN(lng)) return null;

  // Validate South African coordinates (roughly)
  if (lat < -35 || lat > -22 || lng < 16 || lng > 33) {
    console.warn(`Warning: Coordinates outside South Africa bounds: ${lat}, ${lng}`);
  }

  return { lat, lng };
}

async function importBNReport() {
  console.log('='.repeat(60));
  console.log('BN-Report Import Script');
  console.log('='.repeat(60));

  const excelPath = path.join(process.cwd(), 'docs/coverage/BN-Report@10-Oct-13-08.xlsx');

  console.log(`\nReading Excel file: ${excelPath}`);

  // Read Excel file
  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data: BNReportRow[] = XLSX.utils.sheet_to_json(sheet);

  console.log(`Found ${data.length} rows in Excel file`);

  // Parse and validate data
  const baseStations: BaseStation[] = [];
  let skipped = 0;

  for (const row of data) {
    const coords = parseLocation(row.Location);

    if (!coords) {
      skipped++;
      continue;
    }

    if (!row['Serial Number'] || !row.Hostname || !row.Site) {
      skipped++;
      continue;
    }

    baseStations.push({
      serial_number: String(row['Serial Number']).trim(),
      hostname: String(row.Hostname).trim(),
      site_name: String(row.Site).trim(),
      active_connections: Number(row['Active Connections']) || 0,
      market: String(row.Market || '').trim(),
      lat: coords.lat,
      lng: coords.lng,
      region: String(row.Region || 'South Africa').trim()
    });
  }

  console.log(`\nParsed ${baseStations.length} valid base stations`);
  console.log(`Skipped ${skipped} rows (missing coordinates or required fields)`);

  if (baseStations.length === 0) {
    console.error('No valid base stations to import!');
    process.exit(1);
  }

  // Clear existing data
  console.log('\nClearing existing base station data...');
  const { error: deleteError } = await supabase
    .from('tarana_base_stations')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

  if (deleteError) {
    console.error('Error clearing existing data:', deleteError.message);
    // Continue anyway - table might be empty
  }

  // Insert in batches of 100
  const batchSize = 100;
  let inserted = 0;
  let errors = 0;

  console.log(`\nInserting ${baseStations.length} base stations in batches of ${batchSize}...`);

  for (let i = 0; i < baseStations.length; i += batchSize) {
    const batch = baseStations.slice(i, i + batchSize);

    const { error } = await supabase
      .from('tarana_base_stations')
      .upsert(batch, {
        onConflict: 'serial_number',
        ignoreDuplicates: false
      });

    if (error) {
      console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message);
      errors += batch.length;
    } else {
      inserted += batch.length;
      process.stdout.write(`\rProgress: ${inserted}/${baseStations.length} base stations inserted`);
    }
  }

  console.log('\n');

  // Verify import
  const { count, error: countError } = await supabase
    .from('tarana_base_stations')
    .select('*', { count: 'exact', head: true });

  console.log('='.repeat(60));
  console.log('Import Summary');
  console.log('='.repeat(60));
  console.log(`Total rows in Excel: ${data.length}`);
  console.log(`Valid base stations: ${baseStations.length}`);
  console.log(`Skipped rows: ${skipped}`);
  console.log(`Successfully inserted: ${inserted}`);
  console.log(`Errors: ${errors}`);
  console.log(`Database count: ${count || 'unknown'}`);
  console.log('='.repeat(60));

  // Test the proximity function
  console.log('\nTesting proximity function with Jet Park coordinates...');
  const { data: nearest, error: nearestError } = await supabase
    .rpc('find_nearest_tarana_base_station', {
      p_lat: -26.1612637,
      p_lng: 28.2165293,
      p_limit: 3
    });

  if (nearestError) {
    console.error('Error testing proximity function:', nearestError.message);
  } else if (nearest && nearest.length > 0) {
    console.log('\nNearest base stations to Jet Park:');
    nearest.forEach((station: any, index: number) => {
      console.log(`  ${index + 1}. ${station.site_name} (${station.hostname})`);
      console.log(`     Distance: ${station.distance_km}km, Connections: ${station.active_connections}`);
    });
  }

  console.log('\nImport complete!');
}

// Run the import
importBNReport().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
