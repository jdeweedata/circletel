'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  ScatterChart,
  Scatter,
} from 'recharts';
import { PiNetworkBold, PiCpuBold, PiPackageBold, PiCheckCircleBold } from 'react-icons/pi';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { StatCard } from '@/components/backend/StatCard';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DeviceStat {
  device_id: string;
  device_name: string;
  location: string;
  status: 'online' | 'offline' | 'maintenance';
  last_sync: string | null;
  cpu_usage: number | null;
  memory_usage: number | null;
  signal_strength: number | null;
}

interface InstallationJob {
  order_id: string;
  customer_name: string;
  site_address: string;
  scheduled_date: string | null;
  assigned_tech: string | null;
  status: string;
}

interface DashboardData {
  networkUptime: number;
  devicesOnline: number;
  totalDevices: number;
  pendingActivations: number;
  installationSlaAdherence: number;
  devices: DeviceStat[];
  installationJobs: InstallationJob[];
  deviceStatusCounts: { name: string; value: number }[];
  fulfillmentPipeline: { stage: string; count: number }[];
  technicianUtilization: { technician: string; booked: number; available: number }[];
  slaMetrics: { week: string; adherence: number }[];
}

export default function OperationsDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deviceSearch, setDeviceSearch] = useState('');
  const [jobSearch, setJobSearch] = useState('');
  const [deviceSort, setDeviceSort] = useState<'name' | 'status' | 'cpu'>('name');
  const [jobSort, setJobSort] = useState<'date' | 'tech' | 'status'>('date');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/dashboards/ops');
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const filteredDevices = useMemo(() => {
    if (!data?.devices) return [];
    return data.devices
      .filter(
        (d) =>
          d.device_name.toLowerCase().includes(deviceSearch.toLowerCase()) ||
          d.location.toLowerCase().includes(deviceSearch.toLowerCase()),
      )
      .sort((a, b) => {
        switch (deviceSort) {
          case 'status':
            return a.status.localeCompare(b.status);
          case 'cpu':
            return (b.cpu_usage ?? 0) - (a.cpu_usage ?? 0);
          default:
            return a.device_name.localeCompare(b.device_name);
        }
      });
  }, [data?.devices, deviceSearch, deviceSort]);

  const filteredJobs = useMemo(() => {
    if (!data?.installationJobs) return [];
    return data.installationJobs
      .filter(
        (j) =>
          j.customer_name.toLowerCase().includes(jobSearch.toLowerCase()) ||
          j.site_address.toLowerCase().includes(jobSearch.toLowerCase()),
      )
      .sort((a, b) => {
        switch (jobSort) {
          case 'tech':
            return (a.assigned_tech ?? '').localeCompare(b.assigned_tech ?? '');
          case 'status':
            return a.status.localeCompare(b.status);
          default:
            return (new Date(a.scheduled_date || '').getTime() || 0) -
              (new Date(b.scheduled_date || '').getTime() || 0);
        }
      });
  }, [data?.installationJobs, jobSearch, jobSort]);

  if (loading)
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Loading Operations Dashboard...</p>
      </div>
    );

  if (error)
    return (
      <div className="p-8 text-center text-red-500">
        <p>Error: {error}</p>
        <button
          onClick={fetchData}
          className="mt-4 px-4 py-2 bg-circleTel-orange text-white rounded hover:bg-orange-600"
        >
          Retry
        </button>
      </div>
    );

  if (!data)
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No data available</p>
      </div>
    );

  return (
    <div className="space-y-8 p-8 bg-gray-50">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Operations Dashboard</h1>
        <p className="text-gray-600 mt-2">Network health, fulfillment status, and field operations</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Network Uptime"
          value={`${data.networkUptime}%`}
          icon={<PiNetworkBold className="h-6 w-6" />}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
          trend={{
            value: data.networkUptime >= 99.5 ? 1 : data.networkUptime < 99 ? -1 : 0,
            isPositive: data.networkUptime >= 99.5,
          }}
        />

        <StatCard
          label="Devices Online"
          value={`${data.devicesOnline}/${data.totalDevices}`}
          icon={<PiCpuBold className="h-6 w-6" />}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
          subtitle={`${data.totalDevices > 0 ? Math.round((data.devicesOnline / data.totalDevices) * 100) : 0}% online`}
        />

        <StatCard
          label="Pending Activations"
          value={data.pendingActivations}
          icon={<PiPackageBold className="h-6 w-6" />}
          iconBgColor="bg-amber-100"
          iconColor="text-amber-600"
          indicator={data.pendingActivations > 0 ? 'pulse' : 'none'}
        />

        <StatCard
          label="Installation SLA Adherence"
          value={`${data.installationSlaAdherence}%`}
          icon={<PiCheckCircleBold className="h-6 w-6" />}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
          trend={{
            value: data.installationSlaAdherence >= 95 ? 1 : data.installationSlaAdherence < 90 ? -1 : 0,
            isPositive: data.installationSlaAdherence >= 95,
          }}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Network Health Gauge */}
        <Card>
          <CardHeader>
            <CardTitle>Network Health (Last 30 Days)</CardTitle>
            <CardDescription>Uptime percentage with color bands</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    {
                      name: 'Uptime',
                      value: data.networkUptime,
                      fill:
                        data.networkUptime >= 99.9
                          ? '#10b981'
                          : data.networkUptime >= 99
                            ? '#3b82f6'
                            : data.networkUptime >= 95
                              ? '#f59e0b'
                              : '#ef4444',
                    },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(val) => `${val}%`} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Device Status Pie */}
        <Card>
          <CardHeader>
            <CardTitle>Device Status Distribution</CardTitle>
            <CardDescription>Online, offline, and maintenance devices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.deviceStatusCounts}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#10b981" /> {/* online */}
                    <Cell fill="#ef4444" /> {/* offline */}
                    <Cell fill="#f59e0b" /> {/* maintenance */}
                  </Pie>
                  <Tooltip formatter={(val) => `${val} devices`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Fulfillment Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle>Fulfillment Pipeline</CardTitle>
            <CardDescription>Orders by fulfillment stage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.fulfillmentPipeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="stage"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Technician Utilization */}
        <Card>
          <CardHeader>
            <CardTitle>Technician Utilization</CardTitle>
            <CardDescription>Hours booked vs available</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.technicianUtilization}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="technician" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="booked" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="available" stackId="a" fill="#e5e7eb" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device Status Table */}
      <Card>
        <CardHeader>
          <CardTitle>Device Status</CardTitle>
          <CardDescription>Real-time device health and metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Input
                placeholder="Search by device name or location..."
                value={deviceSearch}
                onChange={(e) => setDeviceSearch(e.target.value)}
                className="flex-1"
              />
              <select
                value={deviceSort}
                onChange={(e) => setDeviceSort(e.target.value as 'name' | 'status' | 'cpu')}
                className="px-3 py-2 border border-gray-300 rounded"
              >
                <option value="name">Sort by Name</option>
                <option value="status">Sort by Status</option>
                <option value="cpu">Sort by CPU</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device ID</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Sync</TableHead>
                    <TableHead>CPU %</TableHead>
                    <TableHead>Memory %</TableHead>
                    <TableHead>Signal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDevices.length > 0 ? (
                    filteredDevices.map((device) => (
                      <TableRow key={device.device_id}>
                        <TableCell className="font-mono text-sm">{device.device_id}</TableCell>
                        <TableCell>{device.location}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              device.status === 'online'
                                ? 'default'
                                : device.status === 'offline'
                                  ? 'secondary'
                                  : 'outline'
                            }
                            className={
                              device.status === 'online'
                                ? 'bg-green-100 text-green-800'
                                : device.status === 'offline'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                            }
                          >
                            {device.status.charAt(0).toUpperCase() + device.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {device.last_sync
                            ? new Date(device.last_sync).toLocaleString()
                            : 'Never'}
                        </TableCell>
                        <TableCell>
                          {device.cpu_usage !== null ? `${device.cpu_usage}%` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {device.memory_usage !== null ? `${device.memory_usage}%` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {device.signal_strength !== null ? `${device.signal_strength}%` : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500">
                        No devices found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Installation Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Installation Jobs</CardTitle>
          <CardDescription>Scheduled installations and assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Input
                placeholder="Search by customer or site..."
                value={jobSearch}
                onChange={(e) => setJobSearch(e.target.value)}
                className="flex-1"
              />
              <select
                value={jobSort}
                onChange={(e) => setJobSort(e.target.value as 'date' | 'tech' | 'status')}
                className="px-3 py-2 border border-gray-300 rounded"
              >
                <option value="date">Sort by Date</option>
                <option value="tech">Sort by Technician</option>
                <option value="status">Sort by Status</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Site Address</TableHead>
                    <TableHead>Scheduled Date</TableHead>
                    <TableHead>Assigned Tech</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobs.length > 0 ? (
                    filteredJobs.map((job) => (
                      <TableRow key={job.order_id}>
                        <TableCell className="font-mono text-sm">{job.order_id}</TableCell>
                        <TableCell>{job.customer_name}</TableCell>
                        <TableCell className="text-sm">{job.site_address}</TableCell>
                        <TableCell>
                          {job.scheduled_date
                            ? new Date(job.scheduled_date).toLocaleDateString()
                            : 'Unscheduled'}
                        </TableCell>
                        <TableCell>{job.assigned_tech || 'Unassigned'}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              job.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : job.status === 'in_progress'
                                  ? 'bg-blue-100 text-blue-800'
                                  : job.status === 'pending'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {job.status.replace(/_/g, ' ').toUpperCase()}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500">
                        No jobs found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
