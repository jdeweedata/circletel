'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Briefcase,
  Plus,
  RefreshCw,
  MapPin,
  Phone,
  MoreHorizontal,
  Eye,
  UserPlus,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  FieldJob,
  Technician,
  CreateFieldJobInput,
  FieldJobType,
  FieldJobPriority,
  JOB_TYPE_LABELS,
  JOB_STATUS_LABELS,
  JOB_STATUS_COLORS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  TECHNICIAN_STATUS_LABELS,
  TECHNICIAN_STATUS_COLORS,
} from '@/lib/types/technician-tracking';

const JOB_TYPE_OPTIONS: { value: FieldJobType; label: string }[] = [
  { value: 'fibre_installation', label: 'Fibre Installation' },
  { value: 'wireless_installation', label: 'Wireless Installation' },
  { value: 'router_setup', label: 'Router Setup' },
  { value: 'fault_repair', label: 'Fault Repair' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'site_survey', label: 'Site Survey' },
  { value: 'equipment_collection', label: 'Equipment Collection' },
  { value: 'other', label: 'Other' },
];

const PRIORITY_OPTIONS: { value: FieldJobPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export default function JobsPage() {
  const [jobs, setJobs] = useState<FieldJob[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<FieldJob | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form state
  const [formData, setFormData] = useState<CreateFieldJobInput>({
    job_type: 'fibre_installation',
    title: '',
    description: '',
    priority: 'normal',
    address: '',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    scheduled_date: '',
    scheduled_time_start: '',
    estimated_duration_minutes: 60,
  });

  const fetchJobs = useCallback(async () => {
    try {
      let url = '/api/admin/field-ops/jobs';
      if (statusFilter !== 'all') {
        url += `?status=${statusFilter}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch jobs');
      const data = await response.json();
      setJobs(data);
    } catch (err) {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const fetchTechnicians = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/field-ops/technicians');
      if (!response.ok) throw new Error('Failed to fetch technicians');
      const data = await response.json();
      setTechnicians(data);
    } catch (err) {
      console.error('Failed to load technicians');
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    fetchTechnicians();
  }, [fetchJobs, fetchTechnicians]);

  const resetForm = () => {
    setFormData({
      job_type: 'fibre_installation',
      title: '',
      description: '',
      priority: 'normal',
      address: '',
      customer_name: '',
      customer_phone: '',
      customer_email: '',
      scheduled_date: '',
      scheduled_time_start: '',
      estimated_duration_minutes: 60,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/admin/field-ops/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create job');
      }

      toast.success('Job created successfully');
      setDialogOpen(false);
      resetForm();
      fetchJobs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create job');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssign = async (technicianId: string) => {
    if (!selectedJob) return;
    setSubmitting(true);

    try {
      const response = await fetch(`/api/admin/field-ops/jobs/${selectedJob.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_technician_id: technicianId }),
      });

      if (!response.ok) throw new Error('Failed to assign job');

      toast.success('Job assigned successfully');
      setAssignDialogOpen(false);
      setSelectedJob(null);
      fetchJobs();
    } catch (err) {
      toast.error('Failed to assign job');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (jobId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/field-ops/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      toast.success('Job status updated');
      fetchJobs();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  // Stats
  const stats = {
    total: jobs.length,
    pending: jobs.filter(j => j.status === 'pending').length,
    assigned: jobs.filter(j => j.status === 'assigned').length,
    inProgress: jobs.filter(j => ['en_route', 'arrived', 'in_progress'].includes(j.status)).length,
    completed: jobs.filter(j => j.status === 'completed').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-circleTel-orange" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Field Jobs</h1>
          <p className="text-gray-500">Manage installation and service jobs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchJobs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Job
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Create New Job</DialogTitle>
                  <DialogDescription>
                    Create a new field job for technicians
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="job_type">Job Type *</Label>
                      <Select
                        value={formData.job_type}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, job_type: value as FieldJobType }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {JOB_TYPE_OPTIONS.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as FieldJobPriority }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRIORITY_OPTIONS.map((p) => (
                            <SelectItem key={p.value} value={p.value}>
                              {p.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Job Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Fibre Installation - 123 Main St"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Additional details about the job..."
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      placeholder="Full address"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Customer Details</h4>
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="customer_name">Customer Name</Label>
                        <Input
                          id="customer_name"
                          value={formData.customer_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="customer_phone">Phone</Label>
                          <Input
                            id="customer_phone"
                            type="tel"
                            value={formData.customer_phone}
                            onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="customer_email">Email</Label>
                          <Input
                            id="customer_email"
                            type="email"
                            value={formData.customer_email}
                            onChange={(e) => setFormData(prev => ({ ...prev, customer_email: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Scheduling</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="scheduled_date">Date</Label>
                        <Input
                          id="scheduled_date"
                          type="date"
                          value={formData.scheduled_date}
                          onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="scheduled_time_start">Time</Label>
                        <Input
                          id="scheduled_time_start"
                          type="time"
                          value={formData.scheduled_time_start}
                          onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time_start: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2 mt-4">
                      <Label htmlFor="estimated_duration">Estimated Duration (minutes)</Label>
                      <Input
                        id="estimated_duration"
                        type="number"
                        min={15}
                        step={15}
                        value={formData.estimated_duration_minutes}
                        onChange={(e) => setFormData(prev => ({ ...prev, estimated_duration_minutes: parseInt(e.target.value) || 60 }))}
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting && <RefreshCw className="h-4 w-4 animate-spin mr-2" />}
                    Create Job
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-gray-500">Total Jobs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.assigned}</p>
                <p className="text-xs text-gray-500">Assigned</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
                <p className="text-xs text-gray-500">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="en_route">En Route</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job #</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Technician</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => {
                const assignedTech = technicians.find(t => t.id === job.assigned_technician_id);
                return (
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
                      {job.customer_name ? (
                        <div>
                          <p className="text-sm">{job.customer_name}</p>
                          {job.customer_phone && (
                            <a href={`tel:${job.customer_phone}`} className="text-xs text-circleTel-orange">
                              {job.customer_phone}
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {job.scheduled_date ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {new Date(job.scheduled_date).toLocaleDateString()}
                          {job.scheduled_time_start && (
                            <span className="text-gray-500"> {job.scheduled_time_start}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">Not scheduled</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {assignedTech ? (
                        <span className="text-sm">{assignedTech.first_name} {assignedTech.last_name}</span>
                      ) : (
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedJob(job);
                            setAssignDialogOpen(true);
                          }}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Assign Technician
                          </DropdownMenuItem>
                          {job.latitude && job.longitude && (
                            <DropdownMenuItem onClick={() => {
                              window.open(`https://www.google.com/maps?q=${job.latitude},${job.longitude}`, '_blank');
                            }}>
                              <MapPin className="h-4 w-4 mr-2" />
                              View on Map
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {job.status !== 'cancelled' && job.status !== 'completed' && (
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleStatusChange(job.id, 'cancelled')}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancel Job
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
              {jobs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                    <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No jobs found</p>
                    <p className="text-sm">Create your first job to get started</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Assign Technician Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Technician</DialogTitle>
            <DialogDescription>
              Select a technician to assign to job {selectedJob?.job_number}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              {technicians.filter(t => t.is_active).map((tech) => (
                <div
                  key={tech.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleAssign(tech.id)}
                >
                  <div>
                    <p className="font-medium">{tech.first_name} {tech.last_name}</p>
                    <p className="text-sm text-gray-500">{tech.team || 'No team'}</p>
                  </div>
                  <Badge className={TECHNICIAN_STATUS_COLORS[tech.status]}>
                    {TECHNICIAN_STATUS_LABELS[tech.status]}
                  </Badge>
                </div>
              ))}
              {technicians.filter(t => t.is_active).length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  No technicians available. Add technicians first.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
