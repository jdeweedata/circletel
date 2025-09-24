import { supabase } from '@/lib/supabase';

export interface ZohoResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SupportTicketData {
  subject: string;
  description: string;
  email: string;
  phone?: string;
  serviceType?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  category?: string;
  source?: string;
}

export interface OrderData {
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    company?: string;
    preferredContact?: 'email' | 'phone' | 'whatsapp';
  };
  services: Array<{
    name: string;
    description: string;
    price: number;
    quantity?: number;
    taxId?: string;
  }>;
  orderData: {
    orderId: string;
    totalAmount: number;
    bundleType: string;
    customerTier?: 'Standard' | 'SMME' | 'Enterprise';
  };
  billingInfo: {
    paymentTerms?: number;
  };
}

export interface LeadData {
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  leadSource?: string;
  leadStatus?: string;
  description?: string;
  availableServices?: string[];
  requestedServices?: string[];
  estimatedValue?: number;
  priority?: 'Low' | 'Medium' | 'High';
  tags?: string[];
}

export interface CoverageCheckData {
  email: string;
  phone?: string;
  address: string;
  hasConcentration: boolean;
  availableServices: string[];
  requestedServices: string[];
}

export interface InvoiceData {
  customerName: string;
  customerEmail: string;
  invoiceDate?: string;
  lineItems: Array<{
    item_name: string;
    description: string;
    rate: number;
    quantity: number;
    tax_id?: string;
  }>;
  paymentTerms?: number;
  isRecurring?: boolean;
  recurrenceFrequency?: 'monthly' | 'quarterly' | 'yearly';
  notes?: string;
  customFields?: Record<string, any>;
}

export interface TicketUpdateData {
  ticketId: string;
  status?: string;
  comment?: string;
  assigneeId?: string;
  priority?: string;
  customFields?: Record<string, any>;
}

export interface NotificationData {
  type: 'email' | 'cliq';
  params: {
    to?: string;
    subject?: string;
    body?: string;
    channel?: string;
    message?: string;
    from?: string;
  };
}

class ZohoIntegrationService {
  private async callEdgeFunction<T = any>(
    functionName: string,
    action: string,
    data: any
  ): Promise<ZohoResponse<T>> {
    try {
      const { data: result, error } = await supabase.functions.invoke(functionName, {
        body: { action, data }
      });

      if (error) {
        console.error(`Zoho ${action} error:`, error);
        return {
          success: false,
          error: error.message || 'Unknown error occurred'
        };
      }

      return result as ZohoResponse<T>;
    } catch (error) {
      console.error(`Zoho ${action} exception:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }

  // Support Ticket Operations
  async createSupportTicket(ticketData: SupportTicketData): Promise<ZohoResponse> {
    return this.callEdgeFunction('zoho-integration', 'create_support_ticket', ticketData);
  }

  async updateTicketStatus(updateData: TicketUpdateData): Promise<ZohoResponse> {
    return this.callEdgeFunction('zoho-integration', 'update_ticket_status', updateData);
  }

  // Order Processing
  async processOrder(orderData: OrderData): Promise<ZohoResponse> {
    return this.callEdgeFunction('zoho-integration', 'process_order', orderData);
  }

  // Lead Management
  async createLead(leadData: LeadData): Promise<ZohoResponse> {
    return this.callEdgeFunction('zoho-integration', 'create_lead', leadData);
  }

  async convertLead(leadId: string, dealData?: {
    dealName?: string;
    dealAmount?: number;
    closeDate?: string;
    createDeal?: boolean;
  }): Promise<ZohoResponse> {
    return this.callEdgeFunction('zoho-integration', 'convert_lead', {
      leadId,
      ...dealData
    });
  }

  // Coverage Check Integration
  async handleCoverageCheck(coverageData: CoverageCheckData): Promise<ZohoResponse> {
    return this.callEdgeFunction('zoho-integration', 'coverage_check', coverageData);
  }

  // Billing Operations
  async createInvoice(invoiceData: InvoiceData): Promise<ZohoResponse> {
    return this.callEdgeFunction('zoho-integration', 'create_invoice', invoiceData);
  }

  // Notification System
  async sendNotification(notificationData: NotificationData): Promise<ZohoResponse> {
    return this.callEdgeFunction('zoho-integration', 'send_notification', notificationData);
  }

  // Utility Methods
  async sendEmailNotification(
    to: string,
    subject: string,
    body: string,
    from?: string
  ): Promise<ZohoResponse> {
    return this.sendNotification({
      type: 'email',
      params: { to, subject, body, from: from || 'support@circletel.co.za' }
    });
  }

  async sendTeamMessage(channel: string, message: string): Promise<ZohoResponse> {
    return this.sendNotification({
      type: 'cliq',
      params: { channel, message }
    });
  }

  // Service-specific helpers
  async createFibreActivationTicket(customerData: {
    email: string;
    phone: string;
    address: string;
    serviceType: 'SkyFibre' | 'HomeFibreConnect' | 'BizFibreConnect';
    bundleType: string;
  }): Promise<ZohoResponse> {
    return this.createSupportTicket({
      subject: `${customerData.serviceType} Activation - ${customerData.address}`,
      description: `New ${customerData.serviceType} activation required:\n\nAddress: ${customerData.address}\nBundle: ${customerData.bundleType}\nContact: ${customerData.email}, ${customerData.phone}\n\nTarget: 3-day activation`,
      email: customerData.email,
      phone: customerData.phone,
      serviceType: customerData.serviceType,
      priority: 'High',
      category: 'Service Activation',
      source: 'Website Order'
    });
  }

  async createITServicesOnboardingTicket(customerData: {
    email: string;
    company: string;
    services: string[];
    userCount: number;
  }): Promise<ZohoResponse> {
    return this.createSupportTicket({
      subject: `IT Services Onboarding - ${customerData.company}`,
      description: `New managed IT services customer:\n\nCompany: ${customerData.company}\nServices: ${customerData.services.join(', ')}\nUser Count: ${customerData.userCount}\n\nOnboarding checklist:\n- IT Assessment\n- Microsoft 365 Setup\n- Security Configuration\n- User Training`,
      email: customerData.email,
      serviceType: 'it_services',
      priority: 'High',
      category: 'Onboarding',
      source: 'Website Order'
    });
  }

  async createSMMEQuoteRequest(customerData: {
    email: string;
    company: string;
    phone: string;
    requirements: string;
    estimatedUsers: number;
  }): Promise<ZohoResponse> {
    const leadData: LeadData = {
      email: customerData.email,
      phone: customerData.phone,
      company: customerData.company,
      leadSource: 'SMME Quote Request',
      leadStatus: 'Qualified',
      description: `SMME Quote Request:\nRequirements: ${customerData.requirements}\nEstimated Users: ${customerData.estimatedUsers}`,
      priority: 'High',
      tags: ['SMME', 'quote_request', 'qualified']
    };

    return this.createLead(leadData);
  }

  // Error handling and retry logic
  async retryOperation<T>(
    operation: () => Promise<ZohoResponse<T>>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<ZohoResponse<T>> {
    let lastError: string = '';

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        if (result.success) {
          return result;
        }
        lastError = result.error || 'Unknown error';
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Network error';
      }

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }

    return {
      success: false,
      error: `Failed after ${maxRetries} attempts. Last error: ${lastError}`
    };
  }

  // Batch operations
  async createMultipleTickets(tickets: SupportTicketData[]): Promise<ZohoResponse[]> {
    const results = await Promise.allSettled(
      tickets.map(ticket => this.createSupportTicket(ticket))
    );

    return results.map(result =>
      result.status === 'fulfilled'
        ? result.value
        : { success: false, error: result.reason }
    );
  }

  // Analytics and tracking
  async trackCustomerJourney(journeyData: {
    customerId?: string;
    email: string;
    stage: string;
    action: string;
    data?: Record<string, any>;
  }): Promise<void> {
    // This could be used to track customer journey through analytics
    console.log('Customer Journey Tracked:', journeyData);

    // Optionally send to Zoho Analytics or CRM custom fields
    // Implementation depends on your analytics requirements
  }
}

// Export singleton instance
export const ZohoService = new ZohoIntegrationService();

// Export types for use in components
export type {
  ZohoResponse,
  SupportTicketData,
  OrderData,
  LeadData,
  CoverageCheckData,
  InvoiceData,
  TicketUpdateData,
  NotificationData
};

export default ZohoService;