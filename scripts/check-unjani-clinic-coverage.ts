/**
 * Coverage / feasibility check for the 4 new Unjani clinics Ruth/Darryl flagged.
 *
 * Geocoding note: Google geocoding is IP/referrer-restricted (blocked off-domain)
 * and MTN NAD could not resolve the village street addresses, so coordinates below
 * are SUBURB/AREA-LEVEL centroids resolved via OpenStreetMap Nominatim. They are
 * good enough for an INDICATIVE coverage read but are NOT the exact clinic doorstep
 * — exact GPS must be captured on site before install.
 *
 * Checks (all local, no reCAPTCHA / no MTN_SESSION):
 *   1. MTN FWB feasibility (Fixed Wireless Broadband — the clinic product)
 *   2. MTN LTE / 5G mobile coverage
 *
 * Run: set -a && source .env.local && set +a && npx tsx scripts/check-unjani-clinic-coverage.ts
 */

import { mtnCspClient } from '../lib/coverage/skyfibre/csp-client';
import { MTNConsumerClient } from '../lib/coverage/mtn/consumer-client';

interface Clinic {
  name: string;
  account: string;
  address: string;
  lat: number;
  lng: number;
  geoConfidence: 'suburb-centroid' | 'town-centroid';
}

const CLINICS: Clinic[] = [
  {
    name: 'Stinkwater',
    account: 'CT-2026-00034',
    address: '3176 Thintha St, Mokone Block, Stinkwater, Hammanskraal, GP',
    lat: -25.3866667,
    lng: 28.1586111,
    geoConfidence: 'suburb-centroid',
  },
  {
    name: 'Suurman',
    account: 'CT-2026-00035',
    address: '915A Joseph Molefe Makinta St, Suurman Village, Hammanskraal, GP',
    lat: -25.3811111,
    lng: 28.2152778,
    geoConfidence: 'suburb-centroid',
  },
  {
    name: 'Bridge City (KwaMashu)',
    account: 'CT-2026-00036',
    address: 'Bridge City Shopping Centre, Nogwaja Rd, KwaMashu, KZN',
    lat: -29.7260111,
    lng: 30.9890645,
    geoConfidence: 'suburb-centroid',
  },
  {
    name: 'uMzimkhulu',
    account: 'CT-2026-00038',
    address: 'Stand 656, 726 Main Rd, uMzimkhulu, KZN',
    lat: -30.2746899,
    lng: 29.7231073,
    geoConfidence: 'town-centroid',
  },
];

async function run() {
  const summary: string[] = [];

  for (const clinic of CLINICS) {
    console.log('\n' + '='.repeat(78));
    console.log(`📍 ${clinic.name}  (${clinic.account})`);
    console.log(`   ${clinic.address}`);
    console.log(`   coords: ${clinic.lat}, ${clinic.lng}  [${clinic.geoConfidence}]`);
    console.log('='.repeat(78));

    // 1. MTN FWB feasibility (Fixed Wireless Broadband)
    let fwbLine = 'FWB: error';
    try {
      const fwb = await mtnCspClient.checkFwbFeasibility({
        latitude: clinic.lat,
        longitude: clinic.lng,
        capacityMbps: 100,
      });
      console.log(
        `📡 FWB feasibility: ${fwb.feasible ? '✅ FEASIBLE' : '❌ NOT feasible'}` +
          `${fwb.medium ? `  medium=${fwb.medium}` : ''}` +
          `${fwb.region ? `  region=${fwb.region}` : ''}` +
          `${fwb.capacityMbps != null ? `  cap=${fwb.capacityMbps}Mbps` : ''}` +
          `${fwb.reference ? `  ref=${fwb.reference}` : ''}`
      );
      fwbLine = `FWB ${fwb.feasible ? 'FEASIBLE' : 'NOT feasible'}${fwb.medium ? ` (${fwb.medium})` : ''}`;
    } catch (e) {
      console.log(`📡 FWB feasibility: ⚠️ error — ${e instanceof Error ? e.message : String(e)}`);
    }

    // 2. MTN LTE / 5G mobile coverage
    let mobileLine = 'LTE/5G: error';
    try {
      const mobile = await MTNConsumerClient.checkMobileCoverage(
        { lat: clinic.lat, lng: clinic.lng },
        ['lte', '5g']
      );
      const parts = mobile.services.map((s) => `${s.technology}=${s.available ? '✅' : '❌'}`);
      console.log(`📶 Mobile coverage: ${parts.join('  ')}`);
      const lte = mobile.services.find((s) => s.type === 'lte')?.available;
      const fiveg = mobile.services.find((s) => s.type === '5g')?.available;
      mobileLine = `LTE=${lte ? 'yes' : 'no'} 5G=${fiveg ? 'yes' : 'no'}`;
    } catch (e) {
      console.log(`📶 Mobile coverage: ⚠️ error — ${e instanceof Error ? e.message : String(e)}`);
    }

    summary.push(`${clinic.name} [${clinic.geoConfidence}]: ${fwbLine} | ${mobileLine}`);

    await new Promise((r) => setTimeout(r, 300));
  }

  console.log('\n\n' + '#'.repeat(78));
  console.log('SUMMARY (indicative — suburb/town-level coords, confirm exact GPS on site)');
  console.log('#'.repeat(78));
  for (const line of summary) console.log(' • ' + line);
  console.log('');
}

run().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
