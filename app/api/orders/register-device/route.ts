/**
 * POST /api/orders/register-device
 *
 * Registers SIM cards and routers against a consumer order.
 * Updates both consumer_orders (quick-access fields) and
 * network_devices (full device inventory).
 *
 * Device types by order package:
 *   5G/LTE orders  → sim_card + router
 *   Fibre orders   → router (ONT/CPE)
 *   Wireless       → router (CPE)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RegisterDeviceRequest {
  orderId: string;
  devices: DeviceEntry[];
}

interface DeviceEntry {
  deviceType: 'sim_card' | 'router';
  serialNumber: string;       // SIM serial or router serial
  model?: string;             // Router model (e.g., "Huawei 5G CPE Pro")
  simNumber?: string;         // SIM ICCID (for SIM cards)
  mtnReference?: string;      // MTN SIM reference number
  deviceName?: string;        // Friendly name
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const body: RegisterDeviceRequest = await request.json();
    const { orderId, devices } = body;

    // 1. Validate input
    if (!orderId || !devices || !Array.isArray(devices) || devices.length === 0) {
      return NextResponse.json(
        { success: false, error: 'orderId and devices[] are required' },
        { status: 400 }
      );
    }

    // 2. Fetch order to determine package type
    const { data: order, error: orderError } = await supabase
      .from('consumer_orders')
      .select('id, order_number, package_name, sim_serial, router_serial')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // 3. Detect order type from package name
    const is5GorLTE = order.package_name?.toLowerCase().includes('5g') ||
                      order.package_name?.toLowerCase().includes('lte');
    const isFibre = order.package_name?.toLowerCase().includes('fibre') ||
                    order.package_name?.toLowerCase().includes('skyfibre');

    const results: Array<{ device: string; success: boolean; id?: string; error?: string }> = [];

    for (const device of devices) {
      try {
        // Map generic device types to DB enum values
        const dbDeviceType = device.deviceType === 'router'
          ? 'tozed_cpe'
          : device.deviceType === 'sim_card'
            ? 'sim_card'
            : device.deviceType;

        // Validate device type against order type
        if (device.deviceType === 'sim_card' && !is5GorLTE) {
          results.push({
            device: device.serialNumber,
            success: false,
            error: `SIM cards are only valid for 5G/LTE orders. This order is: ${order.package_name}`,
          });
          continue;
        }

        // Insert into network_devices inventory
        const { data: networkDevice, error: insertError } = await supabase
          .from('network_devices')
          .insert({
            consumer_order_id: orderId,
            device_type: dbDeviceType,
            serial_number: device.serialNumber,
            sim_number: device.simNumber || null,
            model: device.model || null,
            device_name: device.deviceName || `${device.deviceType === 'sim_card' ? 'SIM' : 'Router'} for ${order.order_number}`,
            mtn_reference: device.mtnReference || null,
            status: 'deployed',
          })
          .select('id')
          .single();

        if (insertError) {
          throw new Error(insertError.message);
        }

        // Update consumer_orders quick-access fields
        const orderUpdate: Record<string, string> = {};
        if (device.deviceType === 'sim_card') {
          orderUpdate.sim_serial = device.serialNumber;
        } else if (device.deviceType === 'router') {
          orderUpdate.router_serial = device.serialNumber;
          if (device.model) orderUpdate.router_model = device.model;
        }

        await supabase
          .from('consumer_orders')
          .update({ ...orderUpdate, updated_at: new Date().toISOString() })
          .eq('id', orderId);

        results.push({
          device: device.serialNumber,
          success: true,
          id: networkDevice?.id,
        });

        console.log(`[Device] Registered ${device.deviceType} ${device.serialNumber} → ${order.order_number}`);
      } catch (err) {
        results.push({
          device: device.serialNumber,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    const allSucceeded = results.every((r) => r.success);
    const succeededCount = results.filter((r) => r.success).length;

    return NextResponse.json({
      success: allSucceeded,
      message: `${succeededCount}/${results.length} devices registered`,
      orderNumber: order.order_number,
      results,
    });
  } catch (error) {
    console.error('[Device] Registration failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to register devices',
      },
      { status: 500 }
    );
  }
}
