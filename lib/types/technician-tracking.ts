/**
 * Technician Tracking System Types
 * For field operations management with GPS tracking
 */

// ============================================================================
// TECHNICIAN TYPES
// ============================================================================

export type TechnicianStatus = 'available' | 'on_job' | 'on_break' | 'offline' | 'inactive';

export type TechnicianSkill = 
  | 'fibre_splicing'
  | 'router_config'
  | 'aerial_install'
  | 'wireless_install'
  | 'fault_diagnosis'
  | 'network_testing'
  | 'cpe_install';

export type TechnicianTeam = 
  | 'Fibre Installation'
  | 'Wireless'
  | 'Maintenance'
  | 'Site Survey'
  | 'Enterprise';

export interface Technician {
  id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string;
  employee_id: string | null;
  team: TechnicianTeam | null;
  skills: TechnicianSkill[];
  status: TechnicianStatus;
  is_active: boolean;
  current_latitude: number | null;
  current_longitude: number | null;
  current_location_accuracy: number | null;
  location_updated_at: string | null;
  device_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TechnicianWithStats extends Technician {
  full_name: string;
  current_job_id: string | null;
  current_job_number: string | null;
  current_job_title: string | null;
  current_job_address: string | null;
  current_job_status: FieldJobStatus | null;
  jobs_completed_today: number;
  pending_jobs: number;
}

export interface CreateTechnicianInput {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  employee_id?: string;
  team?: TechnicianTeam;
  skills?: TechnicianSkill[];
  user_id?: string;
}

export interface UpdateTechnicianInput {
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  employee_id?: string;
  team?: TechnicianTeam;
  skills?: TechnicianSkill[];
  status?: TechnicianStatus;
  is_active?: boolean;
}

// ============================================================================
// FIELD JOB TYPES
// ============================================================================

export type FieldJobType = 
  | 'fibre_installation'
  | 'wireless_installation'
  | 'router_setup'
  | 'fault_repair'
  | 'maintenance'
  | 'site_survey'
  | 'equipment_collection'
  | 'other';

export type FieldJobStatus = 
  | 'pending'
  | 'assigned'
  | 'en_route'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'on_hold';

export type FieldJobPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface FieldJob {
  id: string;
  job_number: string;
  order_id: string | null;
  customer_id: string | null;
  job_type: FieldJobType;
  title: string;
  description: string | null;
  priority: FieldJobPriority;
  address: string;
  latitude: number | null;
  longitude: number | null;
  address_notes: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  scheduled_date: string | null;
  scheduled_time_start: string | null;
  scheduled_time_end: string | null;
  estimated_duration_minutes: number;
  assigned_technician_id: string | null;
  assigned_at: string | null;
  assigned_by: string | null;
  status: FieldJobStatus;
  started_at: string | null;
  completed_at: string | null;
  completion_notes: string | null;
  completion_photos: string[];
  customer_signature_url: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface FieldJobWithTechnician extends FieldJob {
  technician_name: string | null;
  technician_phone: string | null;
  technician_latitude: number | null;
  technician_longitude: number | null;
}

export interface CreateFieldJobInput {
  job_type: FieldJobType;
  title: string;
  description?: string;
  priority?: FieldJobPriority;
  address: string;
  latitude?: number;
  longitude?: number;
  address_notes?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  scheduled_date?: string;
  scheduled_time_start?: string;
  scheduled_time_end?: string;
  estimated_duration_minutes?: number;
  assigned_technician_id?: string;
  order_id?: string;
  customer_id?: string;
}

export interface UpdateFieldJobInput {
  job_type?: FieldJobType;
  title?: string;
  description?: string;
  priority?: FieldJobPriority;
  address?: string;
  latitude?: number;
  longitude?: number;
  address_notes?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  scheduled_date?: string;
  scheduled_time_start?: string;
  scheduled_time_end?: string;
  estimated_duration_minutes?: number;
  assigned_technician_id?: string;
  status?: FieldJobStatus;
  completion_notes?: string;
  completion_photos?: string[];
  customer_signature_url?: string;
}

// ============================================================================
// LOCATION TRACKING TYPES
// ============================================================================

export type LocationEventType = 
  | 'periodic'
  | 'job_start'
  | 'job_arrive'
  | 'job_complete'
  | 'check_in'
  | 'check_out';

export interface TechnicianLocationLog {
  id: string;
  technician_id: string;
  job_id: string | null;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  heading: number | null;
  speed: number | null;
  event_type: LocationEventType;
  battery_level: number | null;
  is_charging: boolean | null;
  network_type: string | null;
  recorded_at: string;
}

export interface CreateLocationLogInput {
  technician_id: string;
  job_id?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  event_type: LocationEventType;
  battery_level?: number;
  is_charging?: boolean;
  network_type?: string;
}

// ============================================================================
// JOB STATUS HISTORY
// ============================================================================

export interface FieldJobStatusHistory {
  id: string;
  job_id: string;
  previous_status: FieldJobStatus | null;
  new_status: FieldJobStatus;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  changed_by: string | null;
  changed_by_technician_id: string | null;
  created_at: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface TechnicianDashboardData {
  technician: Technician;
  assigned_jobs: FieldJob[];
  current_job: FieldJob | null;
  todays_jobs: FieldJob[];
  completed_today: number;
}

export interface AdminFieldOpsData {
  technicians: TechnicianWithStats[];
  todays_jobs: FieldJobWithTechnician[];
  stats: {
    total_technicians: number;
    available_technicians: number;
    on_job_technicians: number;
    pending_jobs: number;
    in_progress_jobs: number;
    completed_today: number;
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const JOB_TYPE_LABELS: Record<FieldJobType, string> = {
  fibre_installation: 'Fibre Installation',
  wireless_installation: 'Wireless Installation',
  router_setup: 'Router Setup',
  fault_repair: 'Fault Repair',
  maintenance: 'Maintenance',
  site_survey: 'Site Survey',
  equipment_collection: 'Equipment Collection',
  other: 'Other',
};

export const JOB_STATUS_LABELS: Record<FieldJobStatus, string> = {
  pending: 'Pending',
  assigned: 'Assigned',
  en_route: 'En Route',
  arrived: 'Arrived',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  on_hold: 'On Hold',
};

export const JOB_STATUS_COLORS: Record<FieldJobStatus, string> = {
  pending: 'bg-gray-100 text-gray-800',
  assigned: 'bg-blue-100 text-blue-800',
  en_route: 'bg-yellow-100 text-yellow-800',
  arrived: 'bg-purple-100 text-purple-800',
  in_progress: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  on_hold: 'bg-gray-100 text-gray-600',
};

export const TECHNICIAN_STATUS_LABELS: Record<TechnicianStatus, string> = {
  available: 'Available',
  on_job: 'On Job',
  on_break: 'On Break',
  offline: 'Offline',
  inactive: 'Inactive',
};

export const TECHNICIAN_STATUS_COLORS: Record<TechnicianStatus, string> = {
  available: 'bg-green-100 text-green-800',
  on_job: 'bg-blue-100 text-blue-800',
  on_break: 'bg-yellow-100 text-yellow-800',
  offline: 'bg-gray-100 text-gray-600',
  inactive: 'bg-red-100 text-red-800',
};

export const PRIORITY_LABELS: Record<FieldJobPriority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
};

export const PRIORITY_COLORS: Record<FieldJobPriority, string> = {
  low: 'bg-gray-100 text-gray-800',
  normal: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

// Location tracking interval in milliseconds (5 minutes)
export const LOCATION_UPDATE_INTERVAL = 5 * 60 * 1000;

// Minimum accuracy required for location updates (meters)
export const MIN_LOCATION_ACCURACY = 100;
