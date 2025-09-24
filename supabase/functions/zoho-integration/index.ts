import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

const ZOHO_MCP_URL = 'https://circletel-zoho-900485550.zohomcp.com/mcp/message';
const ZOHO_MCP_KEY = 'e2f4039d67d5fb236177fbce811a0ff0';

interface MCPRequest {
  tool: string;
  params: Record<string, any>;
}

interface MCPResponse {
  success: boolean;
  data?: any;
  error?: string;
}

class ZohoMCPClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async execute(request: MCPRequest): Promise<MCPResponse> {
    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Zoho MCP Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async executeMultiple(requests: MCPRequest[]): Promise<MCPResponse[]> {
    const results = await Promise.allSettled(
      requests.map(request => this.execute(request))
    );

    return results.map(result =>
      result.status === 'fulfilled'
        ? result.value
        : { success: false, error: result.reason }
    );
  }
}

const zohoClient = new ZohoMCPClient(ZOHO_MCP_URL, ZOHO_MCP_KEY);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();
    console.log(`Processing action: ${action}`, data);

    let result: any;

    switch (action) {
      case 'create_support_ticket':
        result = await createSupportTicket(data);
        break;

      case 'process_order':
        result = await processOrder(data);
        break;

      case 'coverage_check':
        result = await handleCoverageCheck(data);
        break;

      case 'create_lead':
        result = await createLead(data);
        break;

      case 'convert_lead':
        result = await convertLead(data);
        break;

      case 'create_invoice':
        result = await createInvoice(data);
        break;

      case 'update_ticket_status':
        result = await updateTicketStatus(data);
        break;

      case 'send_notification':
        result = await sendNotification(data);
        break;

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Support Ticket Creation
async function createSupportTicket(data: any): Promise<MCPResponse> {
  const {
    subject,
    description,
    email,
    phone,
    serviceType,
    priority = 'Medium',
    category = 'General',
    source = 'Website'
  } = data;

  // Determine department based on service type
  const getDepartmentId = (serviceType: string): string => {
    switch (serviceType?.toLowerCase()) {
      case 'skyfibre':
      case 'wireless':
        return 'wireless_support';
      case 'homefibreconnect':
      case 'bizfibreconnect':
      case 'fibre':
        return 'fibre_support';
      case 'it_services':
      case 'managed_it':
        return 'it_support';
      case 'billing':
      case 'payment':
        return 'billing';
      default:
        return 'general_support';
    }
  };

  const ticketRequest: MCPRequest = {
    tool: 'zoho_desk_create_ticket',
    params: {
      subject,
      description,
      contactEmail: email,
      phone,
      departmentId: getDepartmentId(serviceType),
      priority,
      category,
      status: 'Open',
      channel: source,
      customFields: {
        service_type: serviceType,
        customer_source: 'CircleTel Website',
        created_via: 'MCP Integration'
      },
      tags: ['circletel', serviceType?.toLowerCase(), source.toLowerCase()]
    }
  };

  const result = await zohoClient.execute(ticketRequest);

  // If high priority, send notification to team
  if (priority === 'High' || priority === 'Critical') {
    await sendTeamNotification({
      type: 'high_priority_ticket',
      ticketId: result.data?.id,
      subject,
      email
    });
  }

  return result;
}

// Order Processing Workflow
async function processOrder(data: any): Promise<MCPResponse> {
  const {
    customer,
    services,
    orderData,
    billingInfo
  } = data;

  const workflows: MCPRequest[] = [
    // 1. Create/Update CRM Contact
    {
      tool: 'zoho_crm_create_contact',
      params: {
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        company: customer.company,
        leadSource: 'Website Order',
        description: `Order for: ${services.map((s: any) => s.name).join(', ')}`,
        tags: ['CircleTel Customer', 'New Order'],
        customFields: {
          order_value: orderData.totalAmount,
          service_bundle: orderData.bundleType,
          preferred_contact: customer.preferredContact || 'email'
        }
      }
    },

    // 2. Create Invoice in Zoho Books
    {
      tool: 'zoho_books_create_invoice',
      params: {
        customer_name: customer.company || `${customer.firstName} ${customer.lastName}`,
        customer_email: customer.email,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        line_items: services.map((service: any) => ({
          item_name: service.name,
          description: service.description,
          rate: service.price,
          quantity: service.quantity || 1,
          tax_id: service.taxId || 'VAT_15'
        })),
        payment_terms: billingInfo.paymentTerms || 30,
        is_recurring: true,
        recurrence_frequency: 'monthly',
        notes: 'Thank you for choosing CircleTel',
        terms: 'Payment due within 30 days. Late payments subject to interest.',
        customFields: {
          order_id: orderData.orderId,
          service_bundle: orderData.bundleType
        }
      }
    },

    // 3. Create Onboarding Ticket
    {
      tool: 'zoho_desk_create_ticket',
      params: {
        subject: `New Customer Onboarding - ${customer.company || customer.email}`,
        description: `New customer onboarding required for:\n\nCustomer: ${customer.firstName} ${customer.lastName}\nEmail: ${customer.email}\nServices: ${services.map((s: any) => s.name).join(', ')}\n\nTarget Activation: 3 days from order date`,
        contactEmail: customer.email,
        departmentId: 'onboarding',
        priority: 'High',
        category: 'Service Request',
        status: 'Open',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
        tags: ['new_customer', 'onboarding', orderData.bundleType, '3_day_sla'],
        customFields: {
          order_id: orderData.orderId,
          service_bundle: orderData.bundleType,
          target_activation: '72_hours',
          customer_tier: orderData.customerTier || 'Standard'
        }
      }
    }
  ];

  // Execute all workflows in parallel
  const results = await zohoClient.executeMultiple(workflows);

  // Check if all succeeded
  const allSucceeded = results.every(result => result.success);

  if (allSucceeded) {
    // Send confirmation notification
    await sendCustomerConfirmation({
      email: customer.email,
      orderId: orderData.orderId,
      services: services.map((s: any) => s.name),
      ticketNumber: results[2].data?.id
    });
  }

  return {
    success: allSucceeded,
    data: {
      contact: results[0].data,
      invoice: results[1].data,
      onboardingTicket: results[2].data,
      results
    },
    error: allSucceeded ? undefined : 'Some workflows failed'
  };
}

// Coverage Check to Lead Conversion
async function handleCoverageCheck(data: any): Promise<MCPResponse> {
  const {
    email,
    phone,
    address,
    hasConcentration,
    availableServices,
    requestedServices
  } = data;

  if (hasConcentration && availableServices.length > 0) {
    // Coverage available - create hot lead
    return await createLead({
      email,
      phone,
      address,
      leadSource: 'Coverage Check - Available',
      leadStatus: 'Hot',
      description: `Coverage available at ${address}. Interested in: ${requestedServices.join(', ')}`,
      availableServices,
      requestedServices,
      priority: 'High',
      tags: ['hot_lead', 'coverage_available', 'ready_to_convert']
    });
  } else {
    // No coverage - create lead for future expansion
    return await createLead({
      email,
      phone,
      address,
      leadSource: 'Coverage Check - Unavailable',
      leadStatus: 'Future Opportunity',
      description: `No coverage at ${address}. Customer interested in: ${requestedServices.join(', ')}`,
      requestedServices,
      priority: 'Low',
      tags: ['expansion_opportunity', 'waiting_list', 'no_coverage']
    });
  }
}

// Create Lead
async function createLead(data: any): Promise<MCPResponse> {
  const leadRequest: MCPRequest = {
    tool: 'zoho_crm_create_lead',
    params: {
      email: data.email,
      phone: data.phone,
      company: data.company || 'Individual',
      leadSource: data.leadSource || 'Website',
      leadStatus: data.leadStatus || 'New',
      description: data.description,
      address: data.address,
      tags: data.tags || ['CircleTel'],
      customFields: {
        available_services: data.availableServices?.join(', ') || '',
        requested_services: data.requestedServices?.join(', ') || '',
        estimated_value: data.estimatedValue || 0,
        coverage_status: data.hasConcentration ? 'Available' : 'Not Available',
        priority: data.priority || 'Medium'
      }
    }
  };

  return await zohoClient.execute(leadRequest);
}

// Convert Lead to Customer
async function convertLead(data: any): Promise<MCPResponse> {
  const convertRequest: MCPRequest = {
    tool: 'zoho_crm_convert_lead',
    params: {
      leadId: data.leadId,
      createAccount: true,
      createContact: true,
      createDeal: data.createDeal !== false,
      dealName: data.dealName || 'CircleTel Services',
      dealAmount: data.dealAmount || 0,
      dealStage: 'Negotiation',
      dealCloseDate: data.closeDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }
  };

  return await zohoClient.execute(convertRequest);
}

// Create Invoice
async function createInvoice(data: any): Promise<MCPResponse> {
  const invoiceRequest: MCPRequest = {
    tool: 'zoho_books_create_invoice',
    params: {
      customer_name: data.customerName,
      customer_email: data.customerEmail,
      invoice_date: data.invoiceDate || new Date().toISOString().split('T')[0],
      line_items: data.lineItems,
      payment_terms: data.paymentTerms || 30,
      is_recurring: data.isRecurring || false,
      recurrence_frequency: data.recurrenceFrequency || 'monthly',
      notes: data.notes || 'Thank you for choosing CircleTel',
      customFields: data.customFields || {}
    }
  };

  return await zohoClient.execute(invoiceRequest);
}

// Update Ticket Status
async function updateTicketStatus(data: any): Promise<MCPResponse> {
  const updateRequest: MCPRequest = {
    tool: 'zoho_desk_update_ticket',
    params: {
      ticketId: data.ticketId,
      status: data.status,
      comment: data.comment,
      assigneeId: data.assigneeId,
      priority: data.priority,
      customFields: data.customFields || {}
    }
  };

  return await zohoClient.execute(updateRequest);
}

// Send Team Notification
async function sendTeamNotification(data: any): Promise<void> {
  try {
    await zohoClient.execute({
      tool: 'zoho_cliq_send_message',
      params: {
        channel: 'support-alerts',
        message: `🚨 ${data.type === 'high_priority_ticket' ? 'High Priority Ticket' : 'Alert'}\n\nTicket #${data.ticketId}\nSubject: ${data.subject}\nCustomer: ${data.email}\n\nPlease review immediately.`
      }
    });
  } catch (error) {
    console.error('Failed to send team notification:', error);
  }
}

// Send Customer Confirmation
async function sendCustomerConfirmation(data: any): Promise<void> {
  try {
    await zohoClient.execute({
      tool: 'zoho_mail_send_email',
      params: {
        to: data.email,
        subject: `Order Confirmation #${data.orderId} - CircleTel`,
        body: `Dear Customer,

Thank you for choosing CircleTel! Your order has been received and is being processed.

Order Details:
- Order ID: ${data.orderId}
- Services: ${data.services.join(', ')}
- Support Ticket: #${data.ticketNumber}

Our team will contact you within 24 hours to begin the activation process. We're committed to activating your services within 3 business days.

For any questions, please contact our support team or reference ticket #${data.ticketNumber}.

Best regards,
The CircleTel Team`,
        from: 'orders@circletel.co.za'
      }
    });
  } catch (error) {
    console.error('Failed to send customer confirmation:', error);
  }
}

// Send Notification
async function sendNotification(data: any): Promise<MCPResponse> {
  const notificationRequest: MCPRequest = {
    tool: data.type === 'email' ? 'zoho_mail_send_email' : 'zoho_cliq_send_message',
    params: data.params
  };

  return await zohoClient.execute(notificationRequest);
}