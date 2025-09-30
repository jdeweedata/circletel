import { ZohoMCPRequest, ZohoMCPResponse, ZohoMCPConfig } from './types/zoho';

export class ZohoMCPClient {
  private config: ZohoMCPConfig;

  constructor(config: ZohoMCPConfig) {
    this.config = config;
  }

  /**
   * Execute a Zoho MCP action through the API route
   */
  async execute<T = any>(request: ZohoMCPRequest): Promise<ZohoMCPResponse<T>> {
    try {
      const response = await fetch('/api/zoho/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Zoho MCP Client Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Test the connection to Zoho MCP server
   */
  async testConnection(): Promise<ZohoMCPResponse> {
    try {
      const response = await fetch('/api/zoho/test-connection', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Zoho MCP Connection Test Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
      };
    }
  }
}

// Create a singleton instance
const zohoMCPClient = new ZohoMCPClient({
  baseUrl: process.env.NEXT_PUBLIC_ZOHO_MCP_URL || '',
  apiKey: process.env.NEXT_PUBLIC_ZOHO_MCP_KEY || '',
});

export default zohoMCPClient;