/**
 * Verify Barcelona + Alexandra Reyee AP inventory from Ruijie Cloud.
 * Usage: npx tsx scripts/ruijie-check-sites.ts
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';

function loadEnvLocal() {
  const path = resolve(process.cwd(), '.env.local');
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    let v = m[2];
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}

function classifyFormFactor(model: string | undefined, name: string): string {
  const hay = `${model || ''} ${name}`.toLowerCase();
  if (/od|outdoor|-od|out\b/.test(hay)) return 'outdoor';
  if (/indoor|in\b|rap2200|rap2260|eap/.test(hay)) return 'indoor-likely';
  return 'unknown';
}

async function main() {
  loadEnvLocal();
  process.env.RUIJIE_MOCK_MODE = 'false';

  const { getAllDevices } = await import('../lib/ruijie');
  const { createClient } = await import('../lib/supabase/server');

  const all = await getAllDevices();
  const patterns = [
    { site: 'Barcelona', re: /barc|barcelona/i },
    { site: 'Alexandra', re: /alex|alexandra/i },
  ];

  console.log(`API total devices: ${all.length}\n`);

  for (const { site, re } of patterns) {
    const matches = all.filter(
      (d) => re.test(d.device_name) || re.test(d.group_name || '') || re.test(d.sn)
    );
    console.log(`=== ${site} (API matches: ${matches.length}) ===`);
    if (matches.length === 0) {
      console.log('  (none)\n');
      continue;
    }
    for (const d of matches.sort((a, b) => a.device_name.localeCompare(b.device_name))) {
      const form = classifyFormFactor(d.model, d.device_name);
      console.log(
        JSON.stringify({
          sn: d.sn,
          name: d.device_name,
          model: d.model,
          formFactorHint: form,
          status: d.status,
          group: d.group_name,
          last_seen: d.last_seen_at,
          ip: d.management_ip,
        })
      );
    }
    console.log('');
  }

  // Also dump any RAP62-OD (outdoor) + nearby naming for context
  const outdoors = all.filter((d) => /od|outdoor|rap62/i.test(`${d.model} ${d.device_name}`));
  console.log(`=== Outdoor-ish models in fleet (${outdoors.length}) ===`);
  for (const d of outdoors.sort((a, b) => a.device_name.localeCompare(b.device_name))) {
    console.log(
      `  ${d.device_name} | ${d.model} | ${d.status} | ${d.group_name} | ${d.sn}`
    );
  }

  const supabase = await createClient();
  const { data: cached } = await supabase
    .from('ruijie_device_cache')
    .select('sn, device_name, model, status, group_name, last_seen_at')
    .or(
      'device_name.ilike.%barc%,device_name.ilike.%barcelona%,device_name.ilike.%alex%,device_name.ilike.%alexandra%'
    )
    .order('device_name');

  console.log(`\n=== Cache (Barcelona/Alex) count=${cached?.length || 0} ===`);
  for (const row of cached || []) {
    console.log(
      `  ${row.device_name} | ${row.model} | ${row.status} | ${row.group_name} | ${row.sn}`
    );
  }

  // Full name list for Unjani to spot misnamed second APs
  console.log('\n=== All Unjani / Newgen device names ===');
  for (const d of all.sort((a, b) => a.device_name.localeCompare(b.device_name))) {
    console.log(`  ${d.device_name} | ${d.model} | ${d.status} | ${d.group_name}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
