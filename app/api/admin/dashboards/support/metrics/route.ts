import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // For now, return mock data structure
    // In production, this would fetch from Zoho Desk API
    const mockMetrics = {
      openTickets: 12,
      avgResponseTime: 1800, // 30 minutes in seconds
      slaAdherence: 94.5,
      csat: 4.2,
    };

    const mockTicketVolume = [
      { date: 'Day 1', created: 5, resolved: 3, overdue: 1 },
      { date: 'Day 2', created: 8, resolved: 6, overdue: 2 },
      { date: 'Day 3', created: 6, resolved: 5, overdue: 1 },
      { date: 'Day 4', created: 9, resolved: 7, overdue: 2 },
      { date: 'Day 5', created: 7, resolved: 8, overdue: 1 },
    ];

    const mockStatusDistribution = [
      { name: 'Open', value: 12, fill: '#ef4444' },
      { name: 'On Hold', value: 5, fill: '#f59e0b' },
      { name: 'Escalated', value: 3, fill: '#f97316' },
      { name: 'Closed', value: 45, fill: '#10b981' },
    ];

    const mockResponseTimeDistribution = [
      { range: '<1h', count: 8 },
      { range: '1-4h', count: 15 },
      { range: '4-24h', count: 12 },
      { range: '>24h', count: 5 },
    ];

    const mockTopIssues = [
      { category: 'Technical Support', count: 18 },
      { category: 'Billing Issues', count: 12 },
      { category: 'Account Access', count: 9 },
      { category: 'Feature Request', count: 7 },
      { category: 'Configuration', count: 5 },
    ];

    const mockOpenTickets = [
      {
        id: '1',
        ticketNumber: 'TKT-001',
        subject: 'Cannot connect to VPN',
        status: 'Open',
        customerEmail: 'john.doe@example.com',
        customerName: 'John Doe',
        createdTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        assigneeId: 'agent-001',
        responseTime: 900,
        escalated: false,
      },
      {
        id: '2',
        ticketNumber: 'TKT-002',
        subject: 'Billing discrepancy on invoice',
        status: 'On Hold',
        customerEmail: 'jane.smith@example.com',
        customerName: 'Jane Smith',
        createdTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        assigneeId: undefined,
        responseTime: 1800,
        escalated: false,
      },
      {
        id: '3',
        ticketNumber: 'TKT-003',
        subject: 'Service outage affecting production',
        status: 'Escalated',
        customerEmail: 'admin@company.com',
        customerName: 'Company Admin',
        createdTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        assigneeId: 'agent-002',
        responseTime: 300,
        escalated: true,
      },
    ];

    const mockEscalationQueue = [
      {
        id: '3',
        ticketNumber: 'TKT-003',
        subject: 'Service outage affecting production',
        status: 'Escalated',
        customerEmail: 'admin@company.com',
        customerName: 'Company Admin',
        createdTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        assigneeId: 'agent-002',
        responseTime: 300,
        escalated: true,
      },
    ];

    return NextResponse.json({
      metrics: mockMetrics,
      ticketVolume: mockTicketVolume,
      statusDistribution: mockStatusDistribution,
      responseTimeDistribution: mockResponseTimeDistribution,
      topIssues: mockTopIssues,
      openTickets: mockOpenTickets,
      escalationQueue: mockEscalationQueue,
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard metrics' },
      { status: 500 }
    );
  }
}
