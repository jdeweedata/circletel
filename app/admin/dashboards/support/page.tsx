'use client';

import React, { useEffect, useState } from 'react';
import { PiTicketBold, PiClockBold, PiCheckBold, PiSmileySadBold } from 'react-icons/pi';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatCard } from '@/components/admin/shared';
import { StatusBadge } from '@/components/backend/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SupportMetrics {
  openTickets: number;
  avgResponseTime: number;
  slaAdherence: number;
  csat: number;
}

interface TicketData {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  customerEmail: string;
  customerName: string;
  createdTime: string;
  assigneeId?: string;
  responseTime?: number;
  escalated?: boolean;
}

interface ChartDataPoint {
  date: string;
  created?: number;
  resolved?: number;
  overdue?: number;
}

interface StatusDistribution {
  name: string;
  value: number;
  fill: string;
}

interface ResponseTimeDistribution {
  range: string;
  count: number;
}

interface TopIssue {
  category: string;
  count: number;
}

const STATUS_COLORS: Record<string, string> = {
  Open: '#ef4444',
  'On Hold': '#f59e0b',
  Escalated: '#f97316',
  Closed: '#10b981',
  Resolved: '#10b981',
};

export default function SupportDashboardPage() {
  const [metrics, setMetrics] = useState<SupportMetrics>({
    openTickets: 0,
    avgResponseTime: 0,
    slaAdherence: 0,
    csat: 0,
  });

  const [ticketVolume, setTicketVolume] = useState<ChartDataPoint[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<StatusDistribution[]>([]);
  const [responseTimeDistribution, setResponseTimeDistribution] = useState<ResponseTimeDistribution[]>([]);
  const [topIssues, setTopIssues] = useState<TopIssue[]>([]);
  const [openTickets, setOpenTickets] = useState<TicketData[]>([]);
  const [escalationQueue, setEscalationQueue] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'priority'>('date');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch dashboard data from API
      const response = await fetch('/api/admin/dashboards/support/metrics');
      if (!response.ok) throw new Error('Failed to load dashboard data');

      const data = await response.json();

      setMetrics(data.metrics);
      setTicketVolume(data.ticketVolume || []);
      setStatusDistribution(data.statusDistribution || []);
      setResponseTimeDistribution(data.responseTimeDistribution || []);
      setTopIssues(data.topIssues || []);
      setOpenTickets(data.openTickets || []);
      setEscalationQueue(data.escalationQueue || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOpenTickets = openTickets.filter(
    (ticket) =>
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedOpenTickets = [...filteredOpenTickets].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime();
    }
    return 0;
  });

  const formatTimeSeconds = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: '2-digit',
    });
  };

  const getStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'info' | 'neutral' => {
    switch (status?.toLowerCase()) {
      case 'open':
        return 'error';
      case 'on hold':
        return 'warning';
      case 'escalated':
        return 'warning';
      case 'closed':
      case 'resolved':
        return 'success';
      default:
        return 'neutral';
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Support Workspace</h1>
        <p className="text-gray-600 mt-2">Customer support metrics, ticket status, and team performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Open Tickets"
          value={metrics.openTickets}
          icon={<PiTicketBold className="w-6 h-6" />}
          iconBgColor="bg-red-100"
          iconColor="text-red-600"
        />
        <StatCard
          label="Avg Response Time"
          value={formatTimeSeconds(metrics.avgResponseTime)}
          icon={<PiClockBold className="w-6 h-6" />}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          label="SLA Adherence"
          value={`${Math.round(metrics.slaAdherence)}%`}
          icon={<PiCheckBold className="w-6 h-6" />}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard
          label="Customer Satisfaction"
          value={metrics.csat > 0 ? `${metrics.csat.toFixed(1)}/5` : 'N/A'}
          icon={<PiSmileySadBold className="w-6 h-6" />}
          iconBgColor="bg-yellow-100"
          iconColor="text-yellow-600"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Volume Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Ticket Volume (30 Days)</CardTitle>
            <CardDescription>Created, Resolved, and Overdue tickets</CardDescription>
          </CardHeader>
          <CardContent>
            {ticketVolume.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={ticketVolume}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="created" stroke="#3b82f6" name="Created" />
                  <Line type="monotone" dataKey="resolved" stroke="#10b981" name="Resolved" />
                  <Line type="monotone" dataKey="overdue" stroke="#ef4444" name="Overdue" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-gray-500">No data available</div>
            )}
          </CardContent>
        </Card>

        {/* Ticket Status Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Ticket Status Distribution</CardTitle>
            <CardDescription>Current ticket breakdown by status</CardDescription>
          </CardHeader>
          <CardContent>
            {statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-gray-500">No data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response Time Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Response Time Distribution</CardTitle>
            <CardDescription>Time to first response</CardDescription>
          </CardHeader>
          <CardContent>
            {responseTimeDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={responseTimeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-gray-500">No data available</div>
            )}
          </CardContent>
        </Card>

        {/* Top Issues Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Top Issues</CardTitle>
            <CardDescription>Most common ticket categories</CardDescription>
          </CardHeader>
          <CardContent>
            {topIssues.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topIssues} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="category" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-gray-500">No data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 gap-6">
        {/* Open Tickets Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Open Tickets</CardTitle>
              <CardDescription>Active support tickets requiring attention</CardDescription>
            </div>
            <Input
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
          </CardHeader>
          <CardContent>
            {sortedOpenTickets.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-gray-100"
                        onClick={() => setSortBy(sortBy === 'date' ? 'priority' : 'date')}
                      >
                        Opened {sortBy === 'date' ? '↓' : ''}
                      </TableHead>
                      <TableHead>Assigned Agent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedOpenTickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-mono text-sm">
                          <Badge variant="outline">{ticket.ticketNumber}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{ticket.customerName}</div>
                            <div className="text-gray-500">{ticket.customerEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{ticket.subject}</TableCell>
                        <TableCell>
                          <StatusBadge status={ticket.status} variant={getStatusVariant(ticket.status)} />
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDate(ticket.createdTime)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {ticket.assigneeId ? `Agent ${ticket.assigneeId}` : 'Unassigned'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">No open tickets</div>
            )}
          </CardContent>
        </Card>

        {/* Escalation Queue Table */}
        <Card>
          <CardHeader>
            <CardTitle>Escalation Queue</CardTitle>
            <CardDescription>Tickets that have been escalated</CardDescription>
          </CardHeader>
          <CardContent>
            {escalationQueue.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time in Queue</TableHead>
                      <TableHead>Severity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {escalationQueue.map((ticket) => {
                      const hoursOpen = Math.floor(
                        (new Date().getTime() - new Date(ticket.createdTime).getTime()) / (1000 * 60 * 60)
                      );
                      return (
                        <TableRow key={ticket.id}>
                          <TableCell className="font-mono text-sm">
                            <Badge variant="outline">{ticket.ticketNumber}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{ticket.customerName}</div>
                              <div className="text-gray-500">{ticket.customerEmail}</div>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{ticket.subject}</TableCell>
                          <TableCell>
                            <StatusBadge status={ticket.status} variant={getStatusVariant(ticket.status)} />
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">{hoursOpen}h</TableCell>
                          <TableCell>
                            <Badge
                              variant={hoursOpen > 24 ? 'destructive' : hoursOpen > 12 ? 'secondary' : 'default'}
                            >
                              {hoursOpen > 24 ? 'Critical' : hoursOpen > 12 ? 'High' : 'Medium'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">No escalated tickets</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
