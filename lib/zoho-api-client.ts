// Direct Zoho API Integration
// This is an alternative to MCP for web applications

interface ZohoAPIConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  orgId?: string;
  region?: 'US' | 'EU' | 'IN' | 'AU' | 'CN';
}

interface ZohoAPIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class ZohoAPIClient {
  private config: ZohoAPIConfig;
  private accessToken?: string;
  private tokenExpiry?: number;

  constructor(config: ZohoAPIConfig) {
    this.config = {
      region: 'US',
      ...config,
    };
  }

  private getBaseUrl(service: string): string {
    const regionMap = {
      US: '',
      EU: '.eu',
      IN: '.in',
      AU: '.com.au',
      CN: '.com.cn',
    };

    const region = regionMap[this.config.region || 'US'];
    return `https://www.zoho${region}.com/${service}/api/v2`;
  }

  private getAccountsUrl(): string {
    const regionMap = {
      US: 'https://accounts.zoho.com',
      EU: 'https://accounts.zoho.eu',
      IN: 'https://accounts.zoho.in',
      AU: 'https://accounts.zoho.com.au',
      CN: 'https://accounts.zoho.com.cn',
    };

    return regionMap[this.config.region || 'US'] || regionMap.US;
  }

  protected async refreshAccessToken(): Promise<string> {
    try {
      const accountsUrl = this.getAccountsUrl();

      // Build request body for refresh token request
      // NOTE: redirect_uri should NOT be included in refresh requests for Zoho OAuth
      const params: Record<string, string> = {
        grant_type: 'refresh_token',
        refresh_token: this.config.refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      };

      const response = await fetch(`${accountsUrl}/oauth/v2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(params),
      });

      const data: any = await response.json();

      if (!response.ok) {
        console.error('[ZohoAPI] Token refresh failed:', {
          status: response.status,
          response: data
        });
        throw new Error(`Token refresh failed: ${response.status} - ${JSON.stringify(data)}`);
      }

      if (!data || typeof data.access_token !== 'string') {
        const errorMessage =
          (data && typeof data.error === 'string') || (data && typeof data.error_description === 'string')
            ? `Zoho error: ${data.error || data.error_description}`
            : 'Zoho token response missing access_token';
        throw new Error(`Token refresh failed: ${errorMessage}`);
      }

      const expiresInSeconds =
        typeof data.expires_in === 'number'
          ? data.expires_in
          : Number.parseInt(String(data.expires_in ?? '0'), 10) || 3600;

      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + expiresInSeconds * 1000;

      return this.accessToken!;
    } catch (error) {
      console.error('Failed to refresh access token:', error);
      throw error;
    }
  }

  private async getValidAccessToken(): Promise<string> {
    if (!this.accessToken || !this.tokenExpiry || Date.now() >= this.tokenExpiry) {
      return await this.refreshAccessToken();
    }
    return this.accessToken;
  }

  /**
   * Get a valid access token (for use by child classes like ZohoBillingClient)
   * @protected
   */
  protected async getAccessToken(): Promise<string> {
    return this.getValidAccessToken();
  }

  private async makeRequest<T = unknown>(
    service: string,
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: Record<string, unknown>
  ): Promise<ZohoAPIResponse<T>> {
    try {
      const token = await this.getValidAccessToken();
      const url = `${this.getBaseUrl(service)}${endpoint}`;

      const headers: Record<string, string> = {
        'Authorization': `Zoho-oauthtoken ${token}`,
        'Content-Type': 'application/json',
      };

      if (this.config.orgId) {
        headers['orgId'] = this.config.orgId;
      }

      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        return {
          success: false,
          error: `API request failed: ${response.status} ${response.statusText}`,
        };
      }

      const responseData = await response.json();

      return {
        success: true,
        data: responseData.data || responseData,
        message: responseData.message,
      };
    } catch (error) {
      console.error('Zoho API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // CRM Methods
  async createLead(leadData: Record<string, unknown>): Promise<ZohoAPIResponse> {
    return this.makeRequest('crm', '/Leads', 'POST', { data: [leadData] });
  }

  async getLeads(options?: Record<string, string>): Promise<ZohoAPIResponse> {
    const queryParams = new URLSearchParams(options || {});
    return this.makeRequest('crm', `/Leads?${queryParams.toString()}`);
  }

  async createContact(contactData: Record<string, unknown>): Promise<ZohoAPIResponse> {
    return this.makeRequest('crm', '/Contacts', 'POST', { data: [contactData] });
  }

  async createDeal(dealData: Record<string, unknown>): Promise<ZohoAPIResponse> {
    return this.makeRequest('crm', '/Deals', 'POST', { data: [dealData] });
  }

  async searchCRMRecords(module: string, criteria: string): Promise<ZohoAPIResponse> {
    return this.makeRequest('crm', `/${module}/search?criteria=${encodeURIComponent(criteria)}`);
  }

  async updateCRMRecord(module: string, recordId: string, data: Record<string, unknown>): Promise<ZohoAPIResponse> {
    return this.makeRequest('crm', `/${module}/${recordId}`, 'PUT', { data: [data] });
  }

  async createCRMRecord(module: string, data: Record<string, unknown>): Promise<ZohoAPIResponse> {
    return this.makeRequest('crm', `/${module}`, 'POST', { data: [data] });
  }

  // Books Methods
  async createBooksContact(contactData: Record<string, unknown>): Promise<ZohoAPIResponse> {
    return this.makeRequest('books', '/contacts', 'POST', contactData);
  }

  async createBooksInvoice(invoiceData: Record<string, unknown>): Promise<ZohoAPIResponse> {
    return this.makeRequest('books', '/invoices', 'POST', invoiceData);
  }

  // Billing Methods
  async createBillingSubscription(subscriptionData: Record<string, unknown>): Promise<ZohoAPIResponse> {
    return this.makeRequest('billing', '/subscriptions', 'POST', subscriptionData);
  }

  // Mail Methods
  async sendMail(mailData: Record<string, unknown>): Promise<ZohoAPIResponse> {
    return this.makeRequest('mail', '/messages', 'POST', mailData);
  }

  async sendEmail(emailData: Record<string, unknown>): Promise<ZohoAPIResponse> {
    return this.sendMail(emailData);
  }

  // Calendar Methods
  async createEvent(eventData: Record<string, unknown>): Promise<ZohoAPIResponse> {
    return this.makeRequest('calendar', '/calendars/primary/events', 'POST', eventData);
  }

  // Test connection
  async testConnection(): Promise<ZohoAPIResponse> {
    try {
      // Test with a simple API call to get user info
      const response = await this.makeRequest('crm', '/org');
      return {
        success: response.success,
        data: {
          status: response.success ? 'connected' : 'error',
          timestamp: new Date().toISOString(),
          orgInfo: response.data,
        },
        message: response.success ? 'Connection successful' : 'Connection failed',
        error: response.error,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
      };
    }
  }
}

// Create a mock client for development/demo purposes
export class ZohoMockClient {
  async testConnection(): Promise<ZohoAPIResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      success: true,
      data: {
        status: 'connected',
        timestamp: new Date().toISOString(),
        orgInfo: { org_name: 'CircleTel Demo', org_id: 'demo_123' },
      },
      message: 'Mock connection successful',
    };
  }

  async createLead(leadData: Record<string, unknown>): Promise<ZohoAPIResponse> {
    await new Promise(resolve => setTimeout(resolve, 800));

    return {
      success: true,
      data: {
        id: `demo_lead_${Date.now()}`,
        ...leadData,
        created_time: new Date().toISOString(),
      },
      message: 'Lead created successfully (demo mode)',
    };
  }

  async sendEmail(emailData: Record<string, unknown>): Promise<ZohoAPIResponse> {
    await new Promise(resolve => setTimeout(resolve, 1200));

    return {
      success: true,
      data: {
        message_id: `demo_email_${Date.now()}`,
        status: 'sent',
      },
      message: 'Email sent successfully (demo mode)',
    };
  }

  async createEvent(eventData: Record<string, unknown>): Promise<ZohoAPIResponse> {
    await new Promise(resolve => setTimeout(resolve, 900));

    return {
      success: true,
      data: {
        event_id: `demo_event_${Date.now()}`,
        ...eventData,
        created_time: new Date().toISOString(),
      },
      message: 'Event created successfully (demo mode)',
    };
  }

  async makeRequest(): Promise<ZohoAPIResponse> {
    return this.testConnection();
  }
}

// Export the appropriate client based on environment
const isDevelopment = process.env.NODE_ENV === 'development';
const hasZohoCredentials = process.env.ZOHO_CLIENT_ID &&
                          process.env.ZOHO_CLIENT_SECRET &&
                          process.env.ZOHO_REFRESH_TOKEN;

export const zohoClient = hasZohoCredentials
  ? new ZohoAPIClient({
      clientId: process.env.ZOHO_CLIENT_ID!,
      clientSecret: process.env.ZOHO_CLIENT_SECRET!,
      refreshToken: process.env.ZOHO_REFRESH_TOKEN!,
      orgId: process.env.ZOHO_ORG_ID,
      region: (process.env.ZOHO_REGION as 'US' | 'EU' | 'IN' | 'AU' | 'CN') || 'US',
    })
  : new ZohoMockClient();