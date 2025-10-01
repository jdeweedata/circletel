// Zoho MCP Integration Types
export interface ZohoMCPConfig {
  baseUrl: string;
  apiKey: string;
}

// Common Zoho Response Types
export interface ZohoResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// Zoho CRM Types
export interface ZohoLead {
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  leadSource?: string;
  status?: string;
  layout?: string;
}

export interface ZohoContact {
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  accountName?: string;
  phone?: string;
  mailingStreet?: string;
  mailingCity?: string;
  mailingState?: string;
  mailingCountry?: string;
}

export interface ZohoDeal {
  id?: string;
  dealName: string;
  accountName?: string;
  contactName?: string;
  amount?: number;
  stage?: string;
  closingDate?: string;
  probability?: number;
}

// Zoho Mail Types
export interface ZohoEmail {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  content: string;
  contentType?: 'text' | 'html';
  attachments?: ZohoAttachment[];
}

export interface ZohoAttachment {
  fileName: string;
  content: string; // base64 encoded
  contentType: string;
}

// Zoho Calendar Types
export interface ZohoEvent {
  id?: string;
  title: string;
  startDateTime: string;
  endDateTime: string;
  location?: string;
  description?: string;
  attendees?: string[];
  isAllDay?: boolean;
  recurrence?: string;
}

// Zoho Desk Types
export interface ZohoTicket {
  id?: string;
  subject: string;
  description: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
  status?: 'Open' | 'In Progress' | 'Waiting on Customer' | 'Closed';
  contactId?: string;
  departmentId?: string;
  category?: string;
  assigneeId?: string;
}

// Zoho Projects Types
export interface ZohoProject {
  id?: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: 'Active' | 'Inactive' | 'Completed';
  ownerId?: string;
}

export interface ZohoTask {
  id?: string;
  name: string;
  description?: string;
  projectId: string;
  assigneeId?: string;
  priority?: 'Low' | 'Medium' | 'High';
  status?: 'Not Started' | 'In Progress' | 'Completed';
  startDate?: string;
  endDate?: string;
}

// MCP Action Types
export type ZohoAction =
  | 'create_lead'
  | 'convert_lead'
  | 'create_contact'
  | 'create_deal'
  | 'send_email'
  | 'create_event'
  | 'create_ticket'
  | 'create_project'
  | 'create_task'
  | 'get_records'
  | 'update_record'
  | 'search_records';

export interface ZohoMCPRequest {
  action: ZohoAction;
  app: 'crm' | 'mail' | 'calendar' | 'desk' | 'projects';
  parameters: Record<string, unknown>;
}

export interface ZohoMCPResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}