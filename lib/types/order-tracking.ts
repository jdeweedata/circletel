// =====================================================
// Order Tracking System Types
// Purpose: TypeScript definitions for order tracking
// Date: 2025-10-28
// =====================================================

export type OrderType = 'fiber' | 'wireless' | 'lte' | '5g';

export type FulfillmentStatus =
  | 'order_confirmed'
  | 'equipment_prepared'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'site_survey_scheduled'
  | 'site_survey_completed'
  | 'installation_scheduled'
  | 'installation_in_progress'
  | 'installation_completed'
  | 'activation_scheduled'
  | 'service_activated'
  | 'completed'
  | 'cancelled';

export type DeliveryStatus =
  | 'pending'
  | 'prepared'
  | 'shipped'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed'
  | 'returned';

export type SiteSurveyStatus =
  | 'scheduled'
  | 'in_progress'
  | 'passed'
  | 'failed'
  | 'rescheduled';

export type TrackingEventType =
  | 'order_confirmed'
  | 'payment_received'
  | 'equipment_prepared'
  | 'equipment_shipped'
  | 'delivery_out'
  | 'delivery_completed'
  | 'delivery_failed'
  | 'site_survey_scheduled'
  | 'site_survey_completed'
  | 'site_survey_failed'
  | 'installation_scheduled'
  | 'installation_started'
  | 'installation_completed'
  | 'installation_failed'
  | 'activation_scheduled'
  | 'service_activated'
  | 'order_completed'
  | 'order_cancelled'
  | 'status_update'
  | 'note_added';

export type TrackingEventStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

export interface OrderTrackingEvent {
  id: string;
  order_id: string;
  event_type: TrackingEventType;
  event_status: TrackingEventStatus;
  event_title: string;
  event_description?: string;
  event_data?: Record<string, any>;
  scheduled_date?: string;
  completed_date?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  visible_to_customer: boolean;
}

export interface OrderWithTracking {
  id: string;
  order_number: string;

  // Order Type
  order_type: OrderType;

  // Status
  status: string;
  payment_status: string;
  fulfillment_status: FulfillmentStatus;

  // Customer Info
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  installation_address: string;

  // Package Info
  package_name: string;
  service_type: string;
  speed_down: number;
  speed_up: number;

  // Pricing
  base_price: number;
  total_amount: number;

  // Delivery Tracking
  delivery_status?: DeliveryStatus;
  delivery_tracking_number?: string;
  delivery_carrier?: string;
  delivery_date?: string;

  // Site Survey (Fiber only)
  site_survey_scheduled_date?: string;
  site_survey_completed_date?: string;
  site_survey_status?: SiteSurveyStatus;
  site_survey_notes?: string;

  // Installation
  installation_scheduled_date?: string;
  installation_completed_date?: string;
  installation_technician?: string;
  installation_notes?: string;

  // Activation
  activation_date?: string;
  billing_start_date?: string;
  expected_completion_date?: string;

  // Timestamps
  created_at: string;
  updated_at: string;

  // Related data
  tracking_events?: OrderTrackingEvent[];
}

export interface OrderNotificationPreferences {
  id: string;
  customer_email: string;
  email_notifications: boolean;
  sms_notifications: boolean;
  notify_order_confirmed: boolean;
  notify_shipped: boolean;
  notify_delivered: boolean;
  notify_survey_scheduled: boolean;
  notify_installation_scheduled: boolean;
  notify_service_activated: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateTrackingEventInput {
  order_id: string;
  event_type: TrackingEventType;
  event_status: TrackingEventStatus;
  event_title: string;
  event_description?: string;
  event_data?: Record<string, any>;
  scheduled_date?: string;
  visible_to_customer?: boolean;
}

export interface UpdateFulfillmentStatusInput {
  order_id: string;
  fulfillment_status: FulfillmentStatus;
  event_title: string;
  event_description?: string;
}

export interface UpdateDeliveryInput {
  order_id: string;
  delivery_status: DeliveryStatus;
  tracking_number?: string;
  carrier?: string;
  delivery_date?: string;
  notes?: string;
}

export interface ScheduleSiteSurveyInput {
  order_id: string;
  scheduled_date: string;
  technician?: string;
  notes?: string;
}

export interface CompleteSiteSurveyInput {
  order_id: string;
  completed_date: string;
  status: 'passed' | 'failed';
  notes: string;
}

export interface ScheduleInstallationInput {
  order_id: string;
  scheduled_date: string;
  technician: string;
  notes?: string;
}

export interface CompleteInstallationInput {
  order_id: string;
  completed_date: string;
  success: boolean;
  notes: string;
}

export interface ActivateServiceInput {
  order_id: string;
  activation_date: string;
  billing_start_date: string;
  notes?: string;
}

// Helper function to get status display info
export function getFulfillmentStatusInfo(status: FulfillmentStatus): {
  label: string;
  color: string;
  icon: string;
} {
  const statusMap: Record<FulfillmentStatus, { label: string; color: string; icon: string }> = {
    order_confirmed: { label: 'Order Confirmed', color: 'blue', icon: 'CheckCircle' },
    equipment_prepared: { label: 'Equipment Prepared', color: 'blue', icon: 'Package' },
    shipped: { label: 'Shipped', color: 'purple', icon: 'Truck' },
    out_for_delivery: { label: 'Out for Delivery', color: 'orange', icon: 'Navigation' },
    delivered: { label: 'Delivered', color: 'green', icon: 'Home' },
    site_survey_scheduled: { label: 'Survey Scheduled', color: 'blue', icon: 'Calendar' },
    site_survey_completed: { label: 'Survey Completed', color: 'green', icon: 'ClipboardCheck' },
    installation_scheduled: { label: 'Installation Scheduled', color: 'blue', icon: 'Calendar' },
    installation_in_progress: { label: 'Installation In Progress', color: 'orange', icon: 'Wrench' },
    installation_completed: { label: 'Installation Completed', color: 'green', icon: 'CheckCircle2' },
    activation_scheduled: { label: 'Activation Scheduled', color: 'blue', icon: 'Clock' },
    service_activated: { label: 'Service Activated', color: 'green', icon: 'Wifi' },
    completed: { label: 'Completed', color: 'green', icon: 'CheckCircle' },
    cancelled: { label: 'Cancelled', color: 'red', icon: 'XCircle' },
  };

  return statusMap[status];
}

// Helper function to determine order workflow based on type
export function getOrderWorkflow(orderType: OrderType): FulfillmentStatus[] {
  const wirelessWorkflow: FulfillmentStatus[] = [
    'order_confirmed',
    'equipment_prepared',
    'shipped',
    'out_for_delivery',
    'delivered',
    'activation_scheduled',
    'service_activated',
    'completed',
  ];

  const fiberWorkflow: FulfillmentStatus[] = [
    'order_confirmed',
    'site_survey_scheduled',
    'site_survey_completed',
    'installation_scheduled',
    'installation_in_progress',
    'installation_completed',
    'service_activated',
    'completed',
  ];

  if (orderType === 'wireless' || orderType === 'lte' || orderType === '5g') {
    return wirelessWorkflow;
  }

  return fiberWorkflow;
}

// Helper function to get next expected status
export function getNextExpectedStatus(
  orderType: OrderType,
  currentStatus: FulfillmentStatus
): FulfillmentStatus | null {
  const workflow = getOrderWorkflow(orderType);
  const currentIndex = workflow.indexOf(currentStatus);

  if (currentIndex === -1 || currentIndex === workflow.length - 1) {
    return null;
  }

  return workflow[currentIndex + 1];
}
