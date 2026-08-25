/**
 * Publish staged Interstellio subscribers + usage to Supabase
 */

import type Database from 'better-sqlite3';
import { createClient } from '@/lib/supabase/server';
import type { InterstellioSubscriber } from '@/lib/interstellio/types';

export interface InterstellioPublishResult {
  published: number;
  subscribersUpserted: number;
  usageUpserted: number;
  usageSkippedUnlinked: number;
  errors: string[];
}

interface ServiceLink {
  service_id: string;
  customer_id: string;
}

async function buildSubscriberServiceMap(
  supabase: Awaited<ReturnType<typeof createClient>>,
  subscriberIds: string[]
): Promise<Map<string, ServiceLink>> {
  const map = new Map<string, ServiceLink>();
  if (subscriberIds.length === 0) return map;

  // customer_services.connection_id
  const { data: services } = await supabase
    .from('customer_services')
    .select('id, customer_id, connection_id')
    .in('connection_id', subscriberIds);

  for (const row of services || []) {
    if (row.connection_id && row.id && row.customer_id) {
      map.set(String(row.connection_id), {
        service_id: row.id,
        customer_id: row.customer_id,
      });
    }
  }

  // pppoe_credentials → customer_services via service linkage when present
  const { data: pppoe } = await supabase
    .from('pppoe_credentials')
    .select('interstellio_subscriber_id, service_id, customer_id')
    .in('interstellio_subscriber_id', subscriberIds);

  for (const row of pppoe || []) {
    const sid = row.interstellio_subscriber_id
      ? String(row.interstellio_subscriber_id)
      : null;
    if (!sid || map.has(sid)) continue;
    if (row.service_id && row.customer_id) {
      map.set(sid, {
        service_id: row.service_id,
        customer_id: row.customer_id,
      });
    }
  }

  // RPC fallback for remaining IDs
  for (const id of subscriberIds) {
    if (map.has(id)) continue;
    const { data, error } = await supabase.rpc(
      'find_customer_service_by_interstellio_id',
      { p_interstellio_id: id }
    );
    if (error || !data || !Array.isArray(data) || data.length === 0) continue;
    const first = data[0] as {
      customer_service_id?: string;
      customer_id?: string;
    };
    if (first.customer_service_id && first.customer_id) {
      map.set(id, {
        service_id: first.customer_service_id,
        customer_id: first.customer_id,
      });
    }
  }

  return map;
}

export async function publishInterstellioFromStage(
  db: Database.Database
): Promise<InterstellioPublishResult> {
  const errors: string[] = [];
  const supabase = await createClient();
  const syncedAt = new Date().toISOString();

  const subRows = db
    .prepare(
      `SELECT id, payload_json FROM stage_interstellio_subscribers ORDER BY id`
    )
    .all() as Array<{ id: string; payload_json: string }>;

  let subscribersUpserted = 0;
  const cacheRows: Array<Record<string, unknown>> = [];

  for (const row of subRows) {
    let sub: InterstellioSubscriber;
    try {
      sub = JSON.parse(row.payload_json) as InterstellioSubscriber;
    } catch (err) {
      errors.push(
        `Invalid subscriber JSON ${row.id}: ${err instanceof Error ? err.message : String(err)}`
      );
      continue;
    }

    cacheRows.push({
      id: sub.id,
      username: sub.username ?? null,
      name: sub.name ?? null,
      enabled: sub.enabled ?? false,
      domain: sub.domain ?? null,
      tenant_id: sub.tenant_id ?? null,
      service: sub.service ?? null,
      profile: sub.profile ?? null,
      virtual: sub.virtual ?? null,
      last_seen: sub.last_seen || null,
      expire: sub.expire || null,
      static_ip4: sub.static_ip4 ?? null,
      uncapped_data: sub.uncapped_data ?? null,
      raw_json: sub,
      synced_at: syncedAt,
      updated_at: syncedAt,
    });
  }

  // Upsert in batches of 100
  const batchSize = 100;
  for (let i = 0; i < cacheRows.length; i += batchSize) {
    const batch = cacheRows.slice(i, i + batchSize);
    const { error } = await supabase
      .from('interstellio_subscriber_cache')
      .upsert(batch, { onConflict: 'id' });
    if (error) {
      errors.push(`Subscriber cache upsert failed: ${error.message}`);
    } else {
      subscribersUpserted += batch.length;
    }
  }

  db.prepare(
    `UPDATE stage_interstellio_subscribers SET published_at = ? WHERE published_at IS NULL`
  ).run(syncedAt);

  // Usage → usage_history for linked services only
  const usageRows = db
    .prepare(
      `SELECT subscriber_id, date, upload_mb, download_mb
       FROM stage_interstellio_usage ORDER BY subscriber_id, date`
    )
    .all() as Array<{
    subscriber_id: string;
    date: string;
    upload_mb: number;
    download_mb: number;
  }>;

  const uniqueSubIds = [...new Set(usageRows.map((u) => u.subscriber_id))];
  const linkMap = await buildSubscriberServiceMap(supabase, uniqueSubIds);

  let usageUpserted = 0;
  let usageSkippedUnlinked = 0;

  for (const row of usageRows) {
    const link = linkMap.get(row.subscriber_id);
    if (!link) {
      usageSkippedUnlinked++;
      continue;
    }

    const { error } = await supabase.from('usage_history').upsert(
      {
        service_id: link.service_id,
        customer_id: link.customer_id,
        date: row.date,
        upload_mb: row.upload_mb,
        download_mb: row.download_mb,
        source: 'interstellio',
        synced_at: syncedAt,
      },
      { onConflict: 'service_id,date' }
    );

    if (error) {
      errors.push(
        `usage_history upsert failed ${row.subscriber_id}@${row.date}: ${error.message}`
      );
    } else {
      usageUpserted++;
    }
  }

  db.prepare(
    `UPDATE stage_interstellio_usage SET published_at = ? WHERE published_at IS NULL`
  ).run(syncedAt);

  console.log(
    `[VendorCache:Interstellio] Published subscribers=${subscribersUpserted} usage=${usageUpserted} skipped_unlinked=${usageSkippedUnlinked}`
  );

  return {
    published: subscribersUpserted + usageUpserted,
    subscribersUpserted,
    usageUpserted,
    usageSkippedUnlinked,
    errors,
  };
}
