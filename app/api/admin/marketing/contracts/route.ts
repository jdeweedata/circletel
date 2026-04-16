import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export interface ContractRecord {
  account_number: string;
  package_name: string;
  monthly_fee: string;
  physical_address: string;
  source_filename: string;
  lat: number;
  lng: number;
  tier: 'under-300' | '300-500' | '500-800' | '800-plus' | 'unknown';
  province: string | null;
}

interface RawContract {
  account_number: string;
  package_name: string;
  monthly_fee: string;
  physical_address: string;
  source_filename: string;
  drive_file_id: string;
}

const PROVINCE_KEYWORDS: [string, string][] = [
  ['Cape Town', 'Western Cape'],
  ['Stellenbosch', 'Western Cape'],
  ['Paarl', 'Western Cape'],
  ['George', 'Western Cape'],
  ['Klawer', 'Western Cape'],
  ['Lambertsbay', 'Western Cape'],
  ['Clanwilliam', 'Western Cape'],
  ['Vredendal', 'Western Cape'],
  ['Mossel Bay', 'Western Cape'],
  ['Knysna', 'Western Cape'],
  ['Oudtshoorn', 'Western Cape'],
  ['Paternoster', 'Western Cape'],
  ['Langebaan', 'Western Cape'],
  ['Saldanha', 'Western Cape'],
  ['Hermanus', 'Western Cape'],
  ['Johannesburg', 'Gauteng'],
  ['Sandton', 'Gauteng'],
  ['Pretoria', 'Gauteng'],
  ['Centurion', 'Gauteng'],
  ['Midrand', 'Gauteng'],
  ['Durban', 'KwaZulu-Natal'],
  ['Pietermaritzburg', 'KwaZulu-Natal'],
  ['Port Elizabeth', 'Eastern Cape'],
  ['Gqeberha', 'Eastern Cape'],
  ['East London', 'Eastern Cape'],
  ['Bloemfontein', 'Free State'],
  ['Kimberley', 'Northern Cape'],
  ['Upington', 'Northern Cape'],
  ['Polokwane', 'Limpopo'],
  ['Nelspruit', 'Mpumalanga'],
  ['Mbombela', 'Mpumalanga'],
  ['Rustenburg', 'North West'],
  ['Mahikeng', 'North West'],
  ['Richards Bay', 'KwaZulu-Natal'],
];

export function tierFor(fee: string | undefined): ContractRecord['tier'] {
  if (!fee) return 'unknown';
  const m = fee.replace(/\s/g, '').match(/[\d,]+\.?\d*/);
  if (!m) return 'unknown';
  const val = parseFloat(m[0].replace(',', ''));
  if (isNaN(val)) return 'unknown';
  if (val < 300) return 'under-300';
  if (val < 500) return '300-500';
  if (val < 800) return '500-800';
  return '800-plus';
}

export function provinceFor(address: string): string | null {
  const upper = address.toUpperCase();
  for (const [keyword, province] of PROVINCE_KEYWORDS) {
    if (upper.includes(keyword.toUpperCase())) return province;
  }
  return null;
}

export function mergeContracts(
  contracts: RawContract[],
  geocache: Record<string, [number, number] | null>
): ContractRecord[] {
  const result: ContractRecord[] = [];
  for (const rec of contracts) {
    const addr = (rec.physical_address || '').trim();
    if (!/\d/.test(addr)) continue;
    const coords = geocache[addr];
    if (!coords) continue;
    result.push({
      account_number: rec.account_number,
      package_name: rec.package_name,
      monthly_fee: rec.monthly_fee,
      physical_address: addr,
      source_filename: rec.source_filename,
      lat: coords[0],
      lng: coords[1],
      tier: tierFor(rec.monthly_fee),
      province: provinceFor(addr),
    });
  }
  return result;
}

const CONTRACTS_PATH = path.join('/home/circletel', 'contracts_extracted.json');
const GEOCACHE_PATH = path.join('/home/circletel', 'contracts_geocode_cache.json');

export async function GET() {
  try {
    const contracts: RawContract[] = JSON.parse(fs.readFileSync(CONTRACTS_PATH, 'utf-8'));
    const geocache: Record<string, [number, number] | null> = JSON.parse(
      fs.readFileSync(GEOCACHE_PATH, 'utf-8')
    );
    const data = mergeContracts(contracts, geocache);
    return NextResponse.json(
      { success: true, data, total: data.length },
      { headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate' } }
    );
  } catch (err) {
    console.error('[contracts route] Failed to load data files:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to load contract data' },
      { status: 500 }
    );
  }
}
