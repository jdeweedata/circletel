import { NextRequest, NextResponse } from 'next/server';
import { ZohoMCPRequest, ZohoMCPResponse } from '@/lib/types/zoho';
import { zohoMCPDirectClient } from '@/lib/zoho-mcp-direct-client';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: ZohoMCPRequest = await request.json();

    // Validate the request
    if (!body.action || !body.app || !body.parameters) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: action, app, or parameters',
        } as ZohoMCPResponse,
        { status: 400 }
      );
    }

    let result: any;

    // Route the action to the appropriate method
    switch (body.action) {
      case 'create_lead':
        result = await zohoMCPDirectClient.createLead(body.parameters);
        break;

      case 'create_contact':
        result = await zohoMCPDirectClient.createContact(body.parameters);
        break;

      case 'create_deal':
        result = await zohoMCPDirectClient.createDeal(body.parameters);
        break;

      case 'send_email':
        result = await zohoMCPDirectClient.sendEmail(body.parameters);
        break;

      case 'create_event':
        result = await zohoMCPDirectClient.createEvent(body.parameters);
        break;

      case 'get_records':
        result = await zohoMCPDirectClient.getRecords(
          body.parameters.module || 'Leads',
          body.parameters
        );
        break;

      case 'search_records':
        result = await zohoMCPDirectClient.searchRecords(
          body.parameters.module || 'Leads',
          body.parameters.criteria
        );
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unsupported action: ${body.action}`,
          } as ZohoMCPResponse,
          { status: 400 }
        );
    }

    // Transform the response to match our interface
    const response: ZohoMCPResponse = {
      success: result.success,
      data: result.data,
      error: result.error,
      message: result.message,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } as ZohoMCPResponse,
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed. Use POST to execute Zoho MCP actions.',
    } as ZohoMCPResponse,
    { status: 405 }
  );
}