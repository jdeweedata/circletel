/**
 * Pull Interstellio subscribers + linked usage into SQLite staging
 */

import type Database from 'better-sqlite3';
import { getInterstellioClient } from '@/lib/interstellio';
import type { InterstellioSubscriber } from '@/lib/interstellio/types';
import { createClient } from '@/lib/supabase/server';

export interface InterstellioPullResult {
  fetched: number;
  subscribers: number;
  usageRows: number;
  errors: string[];
}

function toDateString(isoOrDate: string): string {
  // Usage time may be ISO; normalize to YYYY-MM-DD (UTC date portion)
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoOrDate)) return isoOrDate;
  return isoOrDate.slice(0, 10);
}

/**
 * List all subscribers (paged) into stage, then fetch daily usage for
 * subscribers linked in Supabase (connection_id / pppoe / corporate_sites).
 */
export async function pullInterstellioToStage(
  db: Database.Database,
  options: { usageDays?: number } = {}
): Promise<InterstellioPullResult> {
  const usageDays = options.usageDays ?? 2;
  const errors: string[] = [];
  const client = getInterstellioClient();
  const fetchedAt = new Date().toISOString();

  // Token may be absent/expired on host; fall back to username/password auth
  if (
    !process.env.INTERSTELLIO_API_TOKEN &&
    process.env.INTERSTELLIO_USERNAME &&
    process.env.INTERSTELLIO_PASSWORD
  ) {
    console.log('[VendorCache:Interstellio] Authenticating with username/password…');
    await client.authenticate({
      domain: process.env.INTERSTELLIO_DOMAIN || 'circletel.co.za',
      username: process.env.INTERSTELLIO_USERNAME,
      password: process.env.INTERSTELLIO_PASSWORD,
    });
  }

  console.log('[VendorCache:Interstellio] Listing subscribers…');
  const subscribers: InterstellioSubscriber[] = [];
  let page = 1;
  let pages = 1;

  while (page <= pages) {
    const resp = await client.listSubscribers({ l: 50, p: page });
    const batch = resp.payload || [];
    subscribers.push(...batch);
    pages = resp.metadata?.pages || 1;
    console.log(
      `[VendorCache:Interstellio] page ${page}/${pages} (+${batch.length}, total ${subscribers.length})`
    );
    page += 1;
    if (batch.length === 0) break;
  }

  const replaceSubs = db.transaction((rows: InterstellioSubscriber[]) => {
    db.prepare('DELETE FROM stage_interstellio_subscribers').run();
    const insert = db.prepare(
      `INSERT INTO stage_interstellio_subscribers (id, payload_json, fetched_at, published_at)
       VALUES (?, ?, ?, NULL)`
    );
    for (const sub of rows) {
      if (!sub.id) {
        errors.push('Skipping subscriber with missing id');
        continue;
      }
      // Never persist RADIUS password fields if present on raw payload
      const safe = { ...sub } as Record<string, unknown>;
      delete safe.password;
      insert.run(sub.id, JSON.stringify(safe), fetchedAt);
    }
  });
  replaceSubs(subscribers);

  // Resolve linked Interstellio IDs from Supabase
  const supabase = await createClient();
  const linkedIds = new Set<string>();

  const { data: services } = await supabase
    .from('customer_services')
    .select('connection_id')
    .not('connection_id', 'is', null);
  for (const row of services || []) {
    if (row.connection_id) linkedIds.add(String(row.connection_id));
  }

  const { data: pppoe } = await supabase
    .from('pppoe_credentials')
    .select('interstellio_subscriber_id')
    .not('interstellio_subscriber_id', 'is', null);
  for (const row of pppoe || []) {
    if (row.interstellio_subscriber_id) {
      linkedIds.add(String(row.interstellio_subscriber_id));
    }
  }

  const { data: sites } = await supabase
    .from('corporate_sites')
    .select('interstellio_subscriber_id')
    .not('interstellio_subscriber_id', 'is', null);
  for (const row of sites || []) {
    if (row.interstellio_subscriber_id) {
      linkedIds.add(String(row.interstellio_subscriber_id));
    }
  }

  console.log(
    `[VendorCache:Interstellio] Fetching daily usage for ${linkedIds.size} linked subscribers (${usageDays}d)…`
  );

  const end = new Date();
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - usageDays);
  const query = {
    start: start.toISOString(),
    end: end.toISOString(),
  };

  type UsageRow = {
    subscriber_id: string;
    date: string;
    upload_mb: number;
    download_mb: number;
  };
  const usageRows: UsageRow[] = [];

  for (const subscriberId of linkedIds) {
    try {
      const entries = await client.getSubscriberUsage(subscriberId, 'daily', query);
      for (const entry of entries) {
        const date = toDateString(entry.time);
        usageRows.push({
          subscriber_id: subscriberId,
          date,
          upload_mb: Math.round(((entry.upload_kb || 0) / 1024) * 100) / 100,
          download_mb: Math.round(((entry.download_kb || 0) / 1024) * 100) / 100,
        });
      }
    } catch (err) {
      errors.push(
        `Usage fetch failed for ${subscriberId}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  const replaceUsage = db.transaction((rows: UsageRow[]) => {
    db.prepare('DELETE FROM stage_interstellio_usage').run();
    const insert = db.prepare(
      `INSERT INTO stage_interstellio_usage
         (subscriber_id, date, upload_mb, download_mb, fetched_at, published_at)
       VALUES (?, ?, ?, ?, ?, NULL)`
    );
    for (const row of rows) {
      insert.run(
        row.subscriber_id,
        row.date,
        row.upload_mb,
        row.download_mb,
        fetchedAt
      );
    }
  });
  replaceUsage(usageRows);

  const subCount = (
    db.prepare('SELECT COUNT(*) AS c FROM stage_interstellio_subscribers').get() as {
      c: number;
    }
  ).c;
  const usageCount = (
    db.prepare('SELECT COUNT(*) AS c FROM stage_interstellio_usage').get() as {
      c: number;
    }
  ).c;

  return {
    fetched: subCount + usageCount,
    subscribers: subCount,
    usageRows: usageCount,
    errors,
  };
}
