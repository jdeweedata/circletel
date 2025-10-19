/**
 * TypeScript types for Product Approval System
 */

export interface ProductImport {
  id: string;
  source_file: string;
  product_category: string;
  import_date: string;
  imported_by: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'archived';
  total_products: number;
  metadata: {
    title?: string;
    version?: string;
    excelSheets?: string[];
    importNotes?: string;
  };
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductApprovalQueue {
  id: string;
  import_id: string;
  product_name: string;
  product_data: {
    name: string;
    speed: string;
    regularPrice: number;
    promoPrice?: number;
    router: {
      model: string;
      included: boolean;
      rentalFee?: number;
      upfrontContribution?: number;
    };
    installationFee: number;
    totalFirstMonth: number;
    costBreakdown?: {
      dfaWholesale?: number;
      staticIP?: number;
      infrastructure?: number;
      markup?: number;
      [key: string]: number | undefined;
    };
    features?: string[];
    notes?: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'needs_review';
  assigned_to: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  approval_deadline: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  approval_notes: string | null;
  rejection_reason: string | null;
  service_package_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'reminder';
  category: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
  read: boolean;
  read_at: string | null;
  archived: boolean;
  action_url: string | null;
  action_label: string | null;
  created_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string;
  reminder_type: 'one_time' | 'recurring';
  recurrence_pattern: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  status: 'pending' | 'completed' | 'snoozed' | 'cancelled';
  completed_at: string | null;
  snoozed_until: string | null;
  notify_email: boolean;
  notify_in_app: boolean;
  notification_sent: boolean;
  notification_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductApprovalActivityLog {
  id: string;
  import_id: string | null;
  approval_queue_id: string | null;
  user_id: string | null;
  action: string;
  details: Record<string, any>;
  created_at: string;
}

// API Request/Response types
export interface CreateProductImportRequest {
  sourceFile: string;
  productCategory: string;
  products: any[];
  metadata?: Record<string, any>;
  notes?: string;
}

export interface CreateProductImportResponse {
  success: boolean;
  import_id?: string;
  error?: string;
}

export interface ApproveProductRequest {
  approval_queue_id: string;
  approval_notes?: string;
  map_to_existing_package?: string; // Existing service_package_id
}

export interface ApproveProductResponse {
  success: boolean;
  service_package_id?: string;
  error?: string;
}

export interface RejectProductRequest {
  approval_queue_id: string;
  rejection_reason: string;
}

export interface RejectProductResponse {
  success: boolean;
  error?: string;
}

export interface GetPendingApprovalsResponse {
  success: boolean;
  approvals?: ProductApprovalQueue[];
  total_count?: number;
  error?: string;
}

export interface GetNotificationsResponse {
  success: boolean;
  notifications?: Notification[];
  unread_count?: number;
  error?: string;
}

export interface GetRemindersResponse {
  success: boolean;
  reminders?: Reminder[];
  pending_count?: number;
  error?: string;
}
