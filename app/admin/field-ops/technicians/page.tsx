'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Users,
  Plus,
  RefreshCw,
  Phone,
  Mail,
  MoreHorizontal,
  Edit,
  Trash2,
  MapPin,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Technician,
  CreateTechnicianInput,
  TechnicianTeam,
  TechnicianSkill,
  TECHNICIAN_STATUS_LABELS,
  TECHNICIAN_STATUS_COLORS,
} from '@/lib/types/technician-tracking';

const TEAM_OPTIONS: TechnicianTeam[] = [
  'Fibre Installation',
  'Wireless',
  'Maintenance',
  'Site Survey',
  'Enterprise',
];

const SKILL_OPTIONS: { value: TechnicianSkill; label: string }[] = [
  { value: 'fibre_splicing', label: 'Fibre Splicing' },
  { value: 'router_config', label: 'Router Configuration' },
  { value: 'aerial_install', label: 'Aerial Installation' },
  { value: 'wireless_install', label: 'Wireless Installation' },
  { value: 'fault_diagnosis', label: 'Fault Diagnosis' },
  { value: 'network_testing', label: 'Network Testing' },
  { value: 'cpe_install', label: 'CPE Installation' },
];

export default function TechniciansPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState<Technician | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateTechnicianInput>({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    employee_id: '',
    team: undefined,
    skills: [],
  });

  const fetchTechnicians = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/field-ops/technicians');
      if (!response.ok) throw new Error('Failed to fetch technicians');
      const data = await response.json();
      setTechnicians(data);
    } catch (err) {
      toast.error('Failed to load technicians');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTechnicians();
  }, [fetchTechnicians]);

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      employee_id: '',
      team: undefined,
      skills: [],
    });
    setEditingTechnician(null);
  };

  const openEditDialog = (technician: Technician) => {
    setEditingTechnician(technician);
    setFormData({
      first_name: technician.first_name,
      last_name: technician.last_name,
      phone: technician.phone,
      email: technician.email || '',
      employee_id: technician.employee_id || '',
      team: technician.team || undefined,
      skills: technician.skills || [],
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingTechnician
        ? `/api/admin/field-ops/technicians/${editingTechnician.id}`
        : '/api/admin/field-ops/technicians';
      
      const method = editingTechnician ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save technician');
      }

      toast.success(editingTechnician ? 'Technician updated' : 'Technician created');
      setDialogOpen(false);
      resetForm();
      fetchTechnicians();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save technician');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this technician?')) return;

    try {
      const response = await fetch(`/api/admin/field-ops/technicians/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete technician');

      toast.success('Technician deactivated');
      fetchTechnicians();
    } catch (err) {
      toast.error('Failed to deactivate technician');
    }
  };

  const toggleSkill = (skill: TechnicianSkill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills?.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...(prev.skills || []), skill],
    }));
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
          <h1 className="text-2xl font-bold">Technicians</h1>
          <p className="text-gray-500">Manage field technicians</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchTechnicians}>
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
                Add Technician
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingTechnician ? 'Edit Technician' : 'Add Technician'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingTechnician
                      ? 'Update technician details'
                      : 'Add a new field technician to the system'}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name *</Label>
                      <Input
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name *</Label>
                      <Input
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+27..."
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="employee_id">Employee ID</Label>
                    <Input
                      id="employee_id"
                      placeholder="TECH-001"
                      value={formData.employee_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, employee_id: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="team">Team</Label>
                    <Select
                      value={formData.team || ''}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, team: value as TechnicianTeam }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                      <SelectContent>
                        {TEAM_OPTIONS.map((team) => (
                          <SelectItem key={team} value={team}>
                            {team}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Skills</Label>
                    <div className="flex flex-wrap gap-2">
                      {SKILL_OPTIONS.map((skill) => (
                        <Badge
                          key={skill.value}
                          variant={formData.skills?.includes(skill.value) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => toggleSkill(skill.value)}
                        >
                          {formData.skills?.includes(skill.value) && (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          )}
                          {skill.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {editingTechnician ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{technicians.length}</p>
                <p className="text-xs text-gray-500">Total Technicians</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-green-500 rounded-full" />
              <div>
                <p className="text-2xl font-bold">
                  {technicians.filter(t => t.status === 'available').length}
                </p>
                <p className="text-xs text-gray-500">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-blue-500 rounded-full" />
              <div>
                <p className="text-2xl font-bold">
                  {technicians.filter(t => t.status === 'on_job').length}
                </p>
                <p className="text-xs text-gray-500">On Job</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-gray-400 rounded-full" />
              <div>
                <p className="text-2xl font-bold">
                  {technicians.filter(t => t.status === 'offline').length}
                </p>
                <p className="text-xs text-gray-500">Offline</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Technicians</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Skills</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Location</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {technicians.map((tech) => (
                <TableRow key={tech.id}>
                  <TableCell className="font-medium">
                    {tech.first_name} {tech.last_name}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {tech.employee_id || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <a href={`tel:${tech.phone}`} className="flex items-center gap-1 text-sm text-circleTel-orange hover:underline">
                        <Phone className="h-3 w-3" />
                        {tech.phone}
                      </a>
                      {tech.email && (
                        <a href={`mailto:${tech.email}`} className="flex items-center gap-1 text-sm text-gray-500 hover:underline">
                          <Mail className="h-3 w-3" />
                          {tech.email}
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{tech.team || '-'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {tech.skills?.slice(0, 2).map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill.replace('_', ' ')}
                        </Badge>
                      ))}
                      {tech.skills && tech.skills.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{tech.skills.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={TECHNICIAN_STATUS_COLORS[tech.status]}>
                      {TECHNICIAN_STATUS_LABELS[tech.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {tech.location_updated_at ? (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="h-3 w-3" />
                        {new Date(tech.location_updated_at).toLocaleTimeString()}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(tech)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(tech.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Deactivate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {technicians.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No technicians yet</p>
                    <p className="text-sm">Add your first technician to get started</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
