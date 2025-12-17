'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { adminFetch } from '@/lib/auth/admin-api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  MapPin,
  Briefcase,
  CheckCircle2,
  Clock,
  RefreshCw,
  Plus,
  Navigation,
  Phone,
  Eye,
} from 'lucide-react';
import {
  SharedStatCard,
  SharedPageHeader,
  SharedEmptyStateInline,
} from '@/components/shared/dashboard';
import { toast } from 'sonner';
import {
  AdminFieldOpsData,
  TechnicianWithStats,
  FieldJobWithTechnician,
  JOB_STATUS_LABELS,
  JOB_STATUS_COLORS,
  JOB_TYPE_LABELS,
  TECHNICIAN_STATUS_LABELS,
  TECHNICIAN_STATUS_COLORS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
} from '@/lib/types/technician-tracking';

export default function FieldOpsPage() {
  const router = useRouter();
  const [data, setData] = useState<AdminFieldOpsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTechnician, setSelectedTechnician] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      // Use adminFetch to automatically include Authorization header
      const response = await adminFetch('/api/admin/field-ops');

      if (response.status === 401) {
        stopPolling();
        setAuthError(true);
        router.push('/admin/login');
        return;
      }

      if (response.status === 403) {
        stopPolling();
        setAuthError(true);
        toast.error('Admin access required');
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch data');
      const result = await response.json();
      setData(result);
    } catch (err) {
      if (!authError) {
        toast.error('Failed to load field operations data');
      }
    } finally {
      setLoading(false);
    }
  }, [stopPolling, router, authError]);

  useEffect(() => {
    fetchData();
    // Refresh every 30 seconds
    intervalRef.current = setInterval(fetchData, 30000);
    return () => stopPolling();
  }, [fetchData, stopPolling]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-circleTel-orange" />
      </div>
    );
  }

  if (!data) return null;

  const { technicians, todays_jobs, stats } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <SharedPageHeader
        title="Field Operations"
        subtitle="Manage technicians and field jobs"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button className="bg-circleTel-orange hover:bg-circleTel-orange/90">
              <Plus className="h-4 w-4 mr-2" />
              New Job
            </Button>
          </div>
        }
      />

      {/* Stats Cards - Using SharedStatCard with hover effects */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <SharedStatCard
          title="Total Technicians"
          value={stats.total_technicians}
          icon={<Users className="h-4 w-4 text-blue-500" />}
          href="/admin/field-ops/technicians"
        />
        <SharedStatCard
          title="Available"
          value={stats.available_technicians}
          icon={<div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />}
          subtitle="Ready to dispatch"
        />
        <SharedStatCard
          title="On Job"
          value={stats.on_job_technicians}
          icon={<Navigation className="h-4 w-4 text-circleTel-orange" />}
          subtitle="Currently working"
        />
        <SharedStatCard
          title="Pending Jobs"
          value={stats.pending_jobs}
          icon={<Clock className="h-4 w-4 text-yellow-500" />}
          href="/admin/field-ops/jobs"
        />
        <SharedStatCard
          title="In Progress"
          value={stats.in_progress_jobs}
          icon={<Briefcase className="h-4 w-4 text-blue-500" />}
          href="/admin/field-ops/jobs"
        />
        <SharedStatCard
          title="Completed Today"
          value={stats.completed_today}
          icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
          subtitle="Jobs finished"
        />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="map" className="space-y-4">
        <TabsList>
          <TabsTrigger value="map">Map View</TabsTrigger>
          <TabsTrigger value="technicians">Technicians</TabsTrigger>
          <TabsTrigger value="jobs">Today's Jobs</TabsTrigger>
        </TabsList>

        {/* Map View Tab */}
        <TabsContent value="map">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Map */}
            <Card className="lg:col-span-2 border border-gray-200 hover:shadow-lg hover:border-circleTel-orange/30 transition-all duration-200">
              <CardHeader>
                <CardTitle>Live Map</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[500px] bg-gray-50 rounded-lg flex items-center justify-center">
                  <SharedEmptyStateInline
                    title="Map integration coming soon"
                    description="Will display technician locations in real-time"
                    icon={MapPin}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Technician List */}
            <Card className="border border-gray-200 hover:shadow-lg hover:border-circleTel-orange/30 transition-all duration-200">
              <CardHeader>
                <CardTitle>Technicians</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[500px] overflow-y-auto">
                  {technicians.map((tech) => (
                    <div
                      key={tech.id}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                        selectedTechnician === tech.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedTechnician(tech.id)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{tech.full_name}</span>
                        <Badge className={TECHNICIAN_STATUS_COLORS[tech.status]}>
                          {TECHNICIAN_STATUS_LABELS[tech.status]}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        {tech.current_job_title ? (
                          <span className="text-circleTel-orange">{tech.current_job_title}</span>
                        ) : (
                          <span>No active job</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {tech.location_updated_at ? (
                          `Last seen: ${new Date(tech.location_updated_at).toLocaleTimeString()}`
                        ) : (
                          'Location not available'
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Technicians Tab */}
        <TabsContent value="technicians">
          <Card className="border border-gray-200 hover:shadow-lg hover:border-circleTel-orange/30 transition-all duration-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Technicians</CardTitle>
                <Button size="sm" className="bg-circleTel-orange hover:bg-circleTel-orange/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Technician
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Current Job</TableHead>
                    <TableHead>Completed Today</TableHead>
                    <TableHead>Pending</TableHead>
                    <TableHead>Last Location</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {technicians.map((tech) => (
                    <TableRow key={tech.id}>
                      <TableCell className="font-medium">{tech.full_name}</TableCell>
                      <TableCell>{tech.employee_id || '-'}</TableCell>
                      <TableCell>{tech.team || '-'}</TableCell>
                      <TableCell>
                        <Badge className={TECHNICIAN_STATUS_COLORS[tech.status]}>
                          {TECHNICIAN_STATUS_LABELS[tech.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {tech.current_job_number ? (
                          <span className="text-circleTel-orange">{tech.current_job_number}</span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{tech.jobs_completed_today}</TableCell>
                      <TableCell>{tech.pending_jobs}</TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {tech.location_updated_at
                          ? new Date(tech.location_updated_at).toLocaleTimeString()
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" asChild>
                            <a href={`tel:${tech.phone}`}>
                              <Phone className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Jobs Tab */}
        <TabsContent value="jobs">
          <Card className="border border-gray-200 hover:shadow-lg hover:border-circleTel-orange/30 transition-all duration-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Today's Jobs</CardTitle>
                <div className="flex gap-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filter status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" className="bg-circleTel-orange hover:bg-circleTel-orange/90">
                    <Plus className="h-4 w-4 mr-2" />
                    New Job
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Technician</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todays_jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-mono text-sm">{job.job_number}</TableCell>
                      <TableCell>{JOB_TYPE_LABELS[job.job_type]}</TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {job.title}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-gray-500">
                        {job.address}
                      </TableCell>
                      <TableCell>
                        {job.scheduled_time_start || '-'}
                      </TableCell>
                      <TableCell>
                        {job.technician_name || (
                          <span className="text-gray-400">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={PRIORITY_COLORS[job.priority]}>
                          {PRIORITY_LABELS[job.priority]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={JOB_STATUS_COLORS[job.status]}>
                          {JOB_STATUS_LABELS[job.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {job.latitude && job.longitude && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                window.open(
                                  `https://www.google.com/maps?q=${job.latitude},${job.longitude}`,
                                  '_blank'
                                );
                              }}
                            >
                              <MapPin className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {todays_jobs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                        No jobs scheduled for today
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
