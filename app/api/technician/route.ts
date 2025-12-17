/**
 * Technician Dashboard API
 * GET - Get technician's dashboard data (jobs, status)
 * PUT - Update technician status/location
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getTechnicianByUserId,
  getTechnicianDashboardData,
  updateTechnicianStatus,
  logTechnicianLocation,
} from '@/lib/services/technician-service';
import { TechnicianStatus, LocationEventType } from '@/lib/types/technician-tracking';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get technician by user ID
    const technician = await getTechnicianByUserId(user.id);
    if (!technician) {
      return NextResponse.json({ error: 'Technician profile not found' }, { status: 404 });
    }
    
    // Get dashboard data
    const dashboardData = await getTechnicianDashboardData(technician.id);
    
    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('[Technician API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get technician by user ID
    const technician = await getTechnicianByUserId(user.id);
    if (!technician) {
      return NextResponse.json({ error: 'Technician profile not found' }, { status: 404 });
    }
    
    const body = await request.json();
    const { status, location, event_type } = body;
    
    // Update status if provided
    if (status) {
      await updateTechnicianStatus(technician.id, status as TechnicianStatus);
    }
    
    // Log location if provided
    if (location?.latitude && location?.longitude) {
      await logTechnicianLocation({
        technician_id: technician.id,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        altitude: location.altitude,
        heading: location.heading,
        speed: location.speed,
        event_type: (event_type as LocationEventType) || 'periodic',
        battery_level: location.battery_level,
        is_charging: location.is_charging,
        network_type: location.network_type,
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Technician API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
