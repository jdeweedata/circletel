/**
 * Technician Service
 * Handles all technician-related operations
 */

import { createClient } from '@/lib/supabase/server';
import {
  Technician,
  TechnicianWithStats,
  CreateTechnicianInput,
  UpdateTechnicianInput,
  FieldJob,
  FieldJobWithTechnician,
  CreateFieldJobInput,
  UpdateFieldJobInput,
  CreateLocationLogInput,
  TechnicianLocationLog,
  FieldJobStatus,
  TechnicianStatus,
  AdminFieldOpsData,
  TechnicianDashboardData,
} from '@/lib/types/technician-tracking';

// ============================================================================
// TECHNICIAN OPERATIONS
// ============================================================================

export async function getTechnicians(): Promise<Technician[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('technicians')
    .select('*')
    .eq('is_active', true)
    .order('first_name');
  
  if (error) throw new Error(`Failed to fetch technicians: ${error.message}`);
  return data || [];
}

export async function getTechnicianById(id: string): Promise<Technician | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('technicians')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to fetch technician: ${error.message}`);
  }
  return data;
}

export async function getTechnicianByUserId(userId: string): Promise<Technician | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('technicians')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to fetch technician: ${error.message}`);
  }
  return data;
}

export async function getTechniciansWithStats(): Promise<TechnicianWithStats[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('v_technician_status')
    .select('*')
    .order('full_name');
  
  if (error) throw new Error(`Failed to fetch technician status: ${error.message}`);
  return data || [];
}

export async function createTechnician(input: CreateTechnicianInput): Promise<Technician> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('technicians')
    .insert(input)
    .select()
    .single();
  
  if (error) throw new Error(`Failed to create technician: ${error.message}`);
  return data;
}

export async function updateTechnician(id: string, input: UpdateTechnicianInput): Promise<Technician> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('technicians')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw new Error(`Failed to update technician: ${error.message}`);
  return data;
}

export async function updateTechnicianStatus(id: string, status: TechnicianStatus): Promise<void> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('technicians')
    .update({ status })
    .eq('id', id);
  
  if (error) throw new Error(`Failed to update technician status: ${error.message}`);
}

// ============================================================================
// FIELD JOB OPERATIONS
// ============================================================================

export async function getFieldJobs(filters?: {
  status?: FieldJobStatus | FieldJobStatus[];
  technician_id?: string;
  scheduled_date?: string;
  limit?: number;
}): Promise<FieldJob[]> {
  const supabase = await createClient();
  
  let query = supabase
    .from('field_jobs')
    .select('*')
    .order('scheduled_date', { ascending: true })
    .order('scheduled_time_start', { ascending: true });
  
  if (filters?.status) {
    if (Array.isArray(filters.status)) {
      query = query.in('status', filters.status);
    } else {
      query = query.eq('status', filters.status);
    }
  }
  
  if (filters?.technician_id) {
    query = query.eq('assigned_technician_id', filters.technician_id);
  }
  
  if (filters?.scheduled_date) {
    query = query.eq('scheduled_date', filters.scheduled_date);
  }
  
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  
  const { data, error } = await query;
  
  if (error) throw new Error(`Failed to fetch field jobs: ${error.message}`);
  return data || [];
}

export async function getFieldJobById(id: string): Promise<FieldJob | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('field_jobs')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to fetch field job: ${error.message}`);
  }
  return data;
}

export async function getTodaysJobs(): Promise<FieldJobWithTechnician[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('v_todays_jobs')
    .select('*');
  
  if (error) throw new Error(`Failed to fetch today's jobs: ${error.message}`);
  return data || [];
}

export async function createFieldJob(input: CreateFieldJobInput): Promise<FieldJob> {
  const supabase = await createClient();

  const jobData: any = {
    ...input,
    status: input.assigned_technician_id ? 'assigned' : 'pending',
  };

  if (input.assigned_technician_id) {
    jobData.assigned_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('field_jobs')
    .insert(jobData)
    .select()
    .single();

  if (error) throw new Error(`Failed to create field job: ${error.message}`);

  // If this is for an order, also create installation_tasks entry and update order status
  const isInstallationJob = input.job_type === 'fibre_installation' || input.job_type === 'wireless_installation';
  if (input.order_id && isInstallationJob) {
    // Get order details for installation task
    const { data: order } = await supabase
      .from('consumer_orders')
      .select('first_name, last_name, email, phone, installation_address, suburb, city, province, postal_code, coordinates')
      .eq('id', input.order_id)
      .single();

    if (order) {
      // Create installation_tasks entry
      const installationTaskData = {
        order_id: input.order_id,
        technician_id: input.assigned_technician_id || null,
        scheduled_date: input.scheduled_date,
        scheduled_time_slot: input.scheduled_time_start || null,
        status: input.assigned_technician_id ? 'assigned' : 'pending',
        installation_address: {
          street: order.installation_address,
          suburb: order.suburb,
          city: order.city,
          province: order.province,
          postal_code: order.postal_code,
          coordinates: order.coordinates,
        },
        customer_contact_name: `${order.first_name} ${order.last_name}`,
        customer_contact_phone: order.phone,
        customer_contact_email: order.email,
      };

      const { error: taskError } = await supabase
        .from('installation_tasks')
        .insert(installationTaskData);

      if (taskError) {
        console.error('Failed to create installation_tasks entry:', taskError);
      }

      // Update order status to installation_scheduled
      const { error: orderError } = await supabase
        .from('consumer_orders')
        .update({
          status: 'installation_scheduled',
          installation_scheduled_date: input.scheduled_date,
          installation_time_slot: input.scheduled_time_start || null,
        })
        .eq('id', input.order_id);

      if (orderError) {
        console.error('Failed to update order status:', orderError);
      }
    }
  }

  return data;
}

export async function updateFieldJob(id: string, input: UpdateFieldJobInput): Promise<FieldJob> {
  const supabase = await createClient();
  
  const updateData: any = { ...input };
  
  // If assigning technician, set assigned_at
  if (input.assigned_technician_id && input.status === undefined) {
    updateData.assigned_at = new Date().toISOString();
    updateData.status = 'assigned';
  }
  
  const { data, error } = await supabase
    .from('field_jobs')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw new Error(`Failed to update field job: ${error.message}`);
  return data;
}

export async function updateJobStatus(
  id: string, 
  status: FieldJobStatus,
  location?: { latitude: number; longitude: number },
  notes?: string
): Promise<FieldJob> {
  const supabase = await createClient();
  
  const updateData: any = { status };
  
  if (notes) {
    updateData.completion_notes = notes;
  }
  
  const { data, error } = await supabase
    .from('field_jobs')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw new Error(`Failed to update job status: ${error.message}`);
  
  // Log location if provided
  if (location && data.assigned_technician_id) {
    const eventType = status === 'arrived' ? 'job_arrive' 
      : status === 'in_progress' ? 'job_start'
      : status === 'completed' ? 'job_complete'
      : 'periodic';
    
    await logTechnicianLocation({
      technician_id: data.assigned_technician_id,
      job_id: id,
      latitude: location.latitude,
      longitude: location.longitude,
      event_type: eventType,
    });
  }
  
  return data;
}

export async function assignJob(jobId: string, technicianId: string): Promise<FieldJob> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('field_jobs')
    .update({
      assigned_technician_id: technicianId,
      assigned_at: new Date().toISOString(),
      status: 'assigned',
    })
    .eq('id', jobId)
    .select()
    .single();
  
  if (error) throw new Error(`Failed to assign job: ${error.message}`);
  return data;
}

export async function unassignJob(jobId: string): Promise<FieldJob> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('field_jobs')
    .update({
      assigned_technician_id: null,
      assigned_at: null,
      status: 'pending',
    })
    .eq('id', jobId)
    .select()
    .single();
  
  if (error) throw new Error(`Failed to unassign job: ${error.message}`);
  return data;
}

// ============================================================================
// LOCATION TRACKING
// ============================================================================

export async function logTechnicianLocation(input: CreateLocationLogInput): Promise<TechnicianLocationLog> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('technician_location_logs')
    .insert(input)
    .select()
    .single();
  
  if (error) throw new Error(`Failed to log location: ${error.message}`);
  return data;
}

export async function getTechnicianLocationHistory(
  technicianId: string,
  options?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }
): Promise<TechnicianLocationLog[]> {
  const supabase = await createClient();
  
  let query = supabase
    .from('technician_location_logs')
    .select('*')
    .eq('technician_id', technicianId)
    .order('recorded_at', { ascending: false });
  
  if (options?.startDate) {
    query = query.gte('recorded_at', options.startDate);
  }
  
  if (options?.endDate) {
    query = query.lte('recorded_at', options.endDate);
  }
  
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  
  const { data, error } = await query;
  
  if (error) throw new Error(`Failed to fetch location history: ${error.message}`);
  return data || [];
}

// ============================================================================
// DASHBOARD DATA
// ============================================================================

export async function getAdminFieldOpsData(): Promise<AdminFieldOpsData> {
  const supabase = await createClient();
  
  // Get technicians with stats
  const technicians = await getTechniciansWithStats();
  
  // Get today's jobs
  const todaysJobs = await getTodaysJobs();
  
  // Calculate stats
  const stats = {
    total_technicians: technicians.length,
    available_technicians: technicians.filter(t => t.status === 'available').length,
    on_job_technicians: technicians.filter(t => t.status === 'on_job').length,
    pending_jobs: todaysJobs.filter(j => j.status === 'pending' || j.status === 'assigned').length,
    in_progress_jobs: todaysJobs.filter(j => ['en_route', 'arrived', 'in_progress'].includes(j.status)).length,
    completed_today: todaysJobs.filter(j => j.status === 'completed').length,
  };
  
  return {
    technicians,
    todays_jobs: todaysJobs,
    stats,
  };
}

export async function getTechnicianDashboardData(technicianId: string): Promise<TechnicianDashboardData> {
  const supabase = await createClient();
  
  // Get technician
  const technician = await getTechnicianById(technicianId);
  if (!technician) {
    throw new Error('Technician not found');
  }
  
  // Get assigned jobs
  const assignedJobs = await getFieldJobs({
    technician_id: technicianId,
    status: ['assigned', 'en_route', 'arrived', 'in_progress'],
  });
  
  // Get today's jobs
  const today = new Date().toISOString().split('T')[0];
  const todaysJobs = await getFieldJobs({
    technician_id: technicianId,
    scheduled_date: today,
  });
  
  // Get current active job
  const currentJob = assignedJobs.find(j => 
    ['en_route', 'arrived', 'in_progress'].includes(j.status)
  ) || null;
  
  // Count completed today
  const { count } = await supabase
    .from('field_jobs')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_technician_id', technicianId)
    .eq('status', 'completed')
    .gte('completed_at', `${today}T00:00:00`);
  
  return {
    technician,
    assigned_jobs: assignedJobs,
    current_job: currentJob,
    todays_jobs: todaysJobs,
    completed_today: count || 0,
  };
}

// ============================================================================
// JOB CREATION FROM ORDER
// ============================================================================

export async function createJobFromOrder(
  orderId: string,
  jobType: 'fibre_installation' | 'wireless_installation',
  scheduledDate?: string,
  technicianId?: string
): Promise<FieldJob> {
  const supabase = await createClient();
  
  // Fetch order details
  const { data: order, error: orderError } = await supabase
    .from('consumer_orders')
    .select(`
      *,
      customers (
        id,
        first_name,
        last_name,
        email,
        phone
      )
    `)
    .eq('id', orderId)
    .single();
  
  if (orderError) throw new Error(`Failed to fetch order: ${orderError.message}`);
  
  const customer = order.customers;
  
  const jobInput: CreateFieldJobInput = {
    job_type: jobType,
    title: `${jobType === 'fibre_installation' ? 'Fibre' : 'Wireless'} Installation - ${order.order_number}`,
    description: `Installation for order ${order.order_number}`,
    priority: 'normal',
    address: order.service_address || order.installation_address || '',
    latitude: order.latitude,
    longitude: order.longitude,
    customer_name: customer ? `${customer.first_name} ${customer.last_name}` : undefined,
    customer_phone: customer?.phone || order.customer_phone || undefined,
    customer_email: customer?.email || order.customer_email || undefined,
    scheduled_date: scheduledDate,
    order_id: orderId,
    customer_id: customer?.id,
    assigned_technician_id: technicianId,
  };
  
  return createFieldJob(jobInput);
}
