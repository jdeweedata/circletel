import { NextResponse } from 'next/server';
import { ZohoMCPResponse } from '@/lib/types/zoho';
import { zohoMCPDirectClient } from '@/lib/zoho-mcp-direct-client';

export async function GET(): Promise<NextResponse> {
  try {
    // Test connection using the direct MCP client
    const result = await zohoMCPDirectClient.testConnection();

    const testResult: ZohoMCPResponse = {
      success: result.success,
      data: {
        mcpServerStatus: result.success ? 'connected' : 'error',
        crmTestStatus: result.success ? 'accessible' : 'limited_access',
        timestamp: new Date().toISOString(),
        ...result.data,
      },
      message: result.message || 'Zoho connection test completed',
      error: result.error,
    };

    return NextResponse.json(testResult);
  } catch (error) {
    console.error('Connection test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
      } as ZohoMCPResponse,
      { status: 500 }
    );
  }
}