// Direct MCP Client for Zoho using your hosted MCP server
import { ZohoMCPResponse } from './types/zoho';

const ZOHO_MCP_URL = 'https://circletel-zoho-900485550.zohomcp.com/mcp/message?key=e2f4039d67d5fb236177fbce811a0ff0';

interface MCPRequest {
  method: string;
  params?: {
    name?: string;
    arguments?: Record<string, any>;
  };
}

interface MCPResponse {
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export class ZohoMCPDirectClient {
  private async sendMCPRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      // Try different request formats that might work with the Zoho MCP server
      const mcpPayload = {
        jsonrpc: '2.0',
        id: Date.now(),
        ...request,
      };

      console.log('Sending MCP request:', JSON.stringify(mcpPayload, null, 2));

      const response = await fetch(ZOHO_MCP_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'CircleTel-NextJS-App/1.0',
        },
        body: JSON.stringify(mcpPayload),
      });

      console.log('MCP response status:', response.status, response.statusText);

      if (!response.ok) {
        // Let's see what the server returns
        const errorText = await response.text();
        console.log('MCP error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('MCP response data:', JSON.stringify(data, null, 2));
      return data;
    } catch (error) {
      console.error('MCP request failed:', error);
      throw error;
    }
  }

  async testConnection(): Promise<ZohoMCPResponse> {
    try {
      // Try multiple approaches to connect to the Zoho MCP server

      // Approach 1: Standard MCP tools/list
      try {
        const response = await this.sendMCPRequest({
          method: 'tools/list',
        });

        if (!response.error) {
          return {
            success: true,
            data: {
              status: 'connected',
              timestamp: new Date().toISOString(),
              availableTools: response.result?.tools || [],
              approach: 'mcp_tools_list',
            },
            message: 'Successfully connected to Zoho MCP server',
          };
        }
      } catch (e) {
        console.log('tools/list approach failed, trying alternative...');
      }

      // Approach 2: Try a simple ping-like request
      try {
        const response = await this.sendMCPRequest({
          method: 'ping',
        });

        if (!response.error) {
          return {
            success: true,
            data: {
              status: 'connected',
              timestamp: new Date().toISOString(),
              approach: 'ping',
            },
            message: 'Successfully connected to Zoho MCP server via ping',
          };
        }
      } catch (e) {
        console.log('ping approach failed, trying direct tool call...');
      }

      // Approach 3: Try a direct tool call as test
      try {
        const response = await this.callTool('get_records', {
          module: 'Leads',
          page: 1,
          per_page: 1,
        });

        if (response.success) {
          return {
            success: true,
            data: {
              status: 'connected',
              timestamp: new Date().toISOString(),
              approach: 'direct_tool_call',
            },
            message: 'Successfully connected to Zoho MCP server via tool call',
          };
        }
      } catch (e) {
        console.log('direct tool call approach failed');
      }

      return {
        success: false,
        error: 'All connection attempts failed',
        data: {
          status: 'error',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
        data: {
          status: 'error',
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  async callTool(toolName: string, arguments_: Record<string, any>): Promise<ZohoMCPResponse> {
    try {
      const response = await this.sendMCPRequest({
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: arguments_,
        },
      });

      if (response.error) {
        return {
          success: false,
          error: response.error.message,
          data: response.error.data,
        };
      }

      return {
        success: true,
        data: response.result,
        message: `Successfully executed ${toolName}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Tool execution failed',
      };
    }
  }

  // Zoho CRM methods using MCP tools
  async createLead(leadData: any): Promise<ZohoMCPResponse> {
    return this.callTool('create_lead', {
      email: leadData.email,
      first_name: leadData.firstName,
      last_name: leadData.lastName,
      company: leadData.company,
      phone: leadData.phone,
      lead_source: leadData.leadSource,
      layout: leadData.layout || 'standard',
    });
  }

  async createContact(contactData: any): Promise<ZohoMCPResponse> {
    return this.callTool('create_contact', {
      email: contactData.email,
      first_name: contactData.firstName,
      last_name: contactData.lastName,
      account_name: contactData.accountName,
      phone: contactData.phone,
    });
  }

  async createDeal(dealData: any): Promise<ZohoMCPResponse> {
    return this.callTool('create_deal', {
      deal_name: dealData.dealName,
      account_name: dealData.accountName,
      contact_name: dealData.contactName,
      amount: dealData.amount,
      stage: dealData.stage,
      closing_date: dealData.closingDate,
    });
  }

  async sendEmail(emailData: any): Promise<ZohoMCPResponse> {
    return this.callTool('send_email', {
      to: Array.isArray(emailData.to) ? emailData.to : [emailData.to],
      cc: emailData.cc || [],
      bcc: emailData.bcc || [],
      subject: emailData.subject,
      content: emailData.content,
      content_type: emailData.contentType || 'html',
    });
  }

  async createEvent(eventData: any): Promise<ZohoMCPResponse> {
    return this.callTool('create_event', {
      title: eventData.title,
      start_date_time: eventData.startDateTime,
      end_date_time: eventData.endDateTime,
      location: eventData.location,
      description: eventData.description,
      attendees: eventData.attendees || [],
      is_all_day: eventData.isAllDay || false,
    });
  }

  async createTicket(ticketData: any): Promise<ZohoMCPResponse> {
    return this.callTool('create_ticket', {
      subject: ticketData.subject,
      description: ticketData.description,
      priority: ticketData.priority,
      status: ticketData.status,
      contact_id: ticketData.contactId,
      department_id: ticketData.departmentId,
    });
  }

  async getRecords(module: string, options?: any): Promise<ZohoMCPResponse> {
    return this.callTool('get_records', {
      module: module,
      page: options?.page || 1,
      per_page: options?.per_page || 10,
      sort_order: options?.sort_order || 'desc',
      sort_by: options?.sort_by || 'Modified_Time',
      ...options,
    });
  }

  async searchRecords(module: string, criteria: string): Promise<ZohoMCPResponse> {
    return this.callTool('search_records', {
      module: module,
      criteria: criteria,
    });
  }
}

// Export the direct MCP client
export const zohoMCPDirectClient = new ZohoMCPDirectClient();