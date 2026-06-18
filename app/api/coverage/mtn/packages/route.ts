// MTN LTE/5G package catalogue — returns active 5G packages for the admin
// coverage checker's "Recommended packages" section. Only 5G has an active
// catalogue today (LTE/Fixed-LTE are surfaced as empty states by the UI).
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging';

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('service_packages')
      .select('id, name, service_type, speed_down, speed_up, price, description')
      .eq('service_type', '5G')
      .eq('active', true)
      .order('price', { ascending: true });

    if (error) {
      apiLogger.error('MTN packages query failed', { error: error.message });
      return NextResponse.json({ success: false, error: 'Failed to load packages' }, { status: 500 });
    }

    const products = (data || []).map((p) => ({
      id: p.id,
      name: p.name,
      download_speed: p.speed_down ?? 0,
      upload_speed: p.speed_up ?? 0,
      price: Number(p.price) || 0,
      description: p.description ?? undefined,
    }));

    return NextResponse.json({ success: true, products });
  } catch (error) {
    apiLogger.error('MTN packages error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
