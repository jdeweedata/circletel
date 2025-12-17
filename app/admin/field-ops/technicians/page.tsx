'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Search,
  Wrench,
  UserCheck,
  UserX,
  Eye,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  Technician,
  CreateTechnicianInput,
  TechnicianTeam,
  TechnicianSkill,
} from '@/lib/types/technician-tracking';
import { cn } from '@/lib/utils';

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

function TechnicianStatCard({
  title,
  value,
  subtitle,
  icon,
  iconBgColor,
  iconColor,
}: {
  title: string;
  value: number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
}) {
  return (
    <Card className="relative overflow-hidden border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={cn("p-3 rounded-xl", iconBgColor)}>
            <div className={iconColor}>{icon}</div>
          </div>
        </div>
        <div className="mb-1">
          <p className="text-3xl font-bold text-gray-900 tracking-tight tabular-nums">{value}</p>
        </div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </Card>
  );
}

function TechnicianAvatar({ name, status }: { name: string; status: string }) {
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const statusColors: Record<string, string> = {
    available: 'bg-green-500',
    on_job: 'bg-blue-500',
    en_route: 'bg-yellow-500',
    offline: 'bg-gray-400',
    break: 'bg-orange-400',
  };

  return (
    <div className="relative">
      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-circleTel-orange to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
        {initials}
      </div>
      <div className={cn("absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white shadow-sm", statusColors[status] || 'bg-gray-400')} />
    </div>
  );
}

function TechnicianCard({
  tech,
  onEdit,
  onDelete,
}: {
  tech: Technician;
  onEdit: (tech: Technician) => void;
  onDelete: (id: string) => void;
}) {
  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    available: { bg: 'bg-green-100', text: 'text-green-800', label: 'Available' },
    on_job: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'On Job' },
    en_route: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'En Route' },
    offline: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Offline' },
    break: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'On Break' },
  };
  const config = statusConfig[tech.status] || statusConfig.offline;

  return (
    <div className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <TechnicianAvatar name={`${tech.first_name} ${tech.last_name}`} status={tech.status} />
          <div>
            <h3 className="font-bold text-lg text-gray-900">{tech.first_name} {tech.last_name}</h3>
            {tech.employee_id && <p className="text-sm text-gray-500 font-mono">{tech.employee_id}</p>}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(tech)}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
            <DropdownMenuItem><Eye className="h-4 w-4 mr-2" />View Schedule</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600" onClick={() => onDelete(tech.id)}><Trash2 className="h-4 w-4 mr-2" />Deactivate</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <Badge className={cn(config.bg, config.text, "font-medium")}>{config.label}</Badge>
        {tech.team && <Badge variant="outline" className="font-medium">{tech.team}</Badge>}
      </div>
      <div className="space-y-2 mb-4">
        <a href={`tel:${tech.phone}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-circleTel-orange transition-colors">
          <div className="h-8 w-8 bg-orange-50 rounded-lg flex items-center justify-center"><Phone className="h-4 w-4 text-circleTel-orange" /></div>
          <span>{tech.phone}</span>
        </a>
        {tech.email && (
          <a href={`mailto:${tech.email}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-circleTel-orange transition-colors">
            <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center"><Mail className="h-4 w-4 text-blue-600" /></div>
            <span className="truncate">{tech.email}</span>
          </a>
        )}
      </div>
      {tech.skills && tech.skills.length > 0 && (
        <div className="pt-4 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 mb-2">Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {tech.skills.slice(0, 3).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs bg-gray-100 text-gray-700 font-normal">{skill.replace(/_/g, ' ')}</Badge>
            ))}
            {tech.skills.length > 3 && <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700">+{tech.skills.length - 3}</Badge>}
          </div>
        </div>
      )}
      {tech.location_updated_at && (
        <div className="pt-4 mt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
          <MapPin className="h-3.5 w-3.5" /><span>Last seen: {new Date(tech.location_updated_at).toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}

export default function TechniciansPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState<Technician | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');

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

  useEffect(() => { fetchTechnicians(); }, [fetchTechnicians]);

  const resetForm = () => {
    setFormData({ first_name: '', last_name: '', phone: '', email: '', employee_id: '', team: undefined, skills: [] });
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
      const url = editingTechnician ? `/api/admin/field-ops/technicians/${editingTechnician.id}` : '/api/admin/field-ops/technicians';
      const method = editingTechnician ? 'PUT' : 'POST';
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (!response.ok) { const error = await response.json(); throw new Error(error.error || 'Failed to save technician'); }
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
      const response = await fetch(`/api/admin/field-ops/technicians/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete technician');
      toast.success('Technician deactivated');
      fetchTechnicians();
    } catch (err) {
      toast.error('Failed to deactivate technician');
    }
  };

  const toggleSkill = (skill: TechnicianSkill) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills?.includes(skill) ? prev.skills.filter((s) => s !== skill) : [...(prev.skills || []), skill],
    }));
  };

  const filteredTechnicians = technicians.filter((tech) => {
    const matchesSearch = !searchQuery || `${tech.first_name} ${tech.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) || tech.employee_id?.toLowerCase().includes(searchQuery.toLowerCase()) || tech.phone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || tech.status === statusFilter;
    const matchesTeam = teamFilter === 'all' || tech.team === teamFilter;
    return matchesSearch && matchesStatus && matchesTeam;
  });

  const stats = {
    total: technicians.length,
    available: technicians.filter((t) => t.status === 'available').length,
    onJob: technicians.filter((t) => t.status === 'on_job').length,
    offline: technicians.filter((t) => t.status === 'offline').length,
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><RefreshCw className="h-8 w-8 animate-spin text-circleTel-orange" /></div>;
  }

  return (
    <div className="space-y-8">
      <div className="mb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Field Technicians</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your team of {technicians.length} field technicians</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={fetchTechnicians} className="gap-2"><RefreshCw className="h-4 w-4" />Refresh</Button>
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="bg-circleTel-orange hover:bg-orange-600 gap-2 shadow-md"><Plus className="h-4 w-4" />Add Technician</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-circleTel-orange/10 rounded-lg"><Users className="h-5 w-5 text-circleTel-orange" /></div>
                      <div>
                        <DialogTitle>{editingTechnician ? 'Edit Technician' : 'Add Technician'}</DialogTitle>
                        <DialogDescription>{editingTechnician ? 'Update technician details' : 'Add a new field technician to the system'}</DialogDescription>
                      </div>
                    </div>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">First Name *</Label>
                        <Input id="first_name" value={formData.first_name} onChange={(e) => setFormData((prev) => ({ ...prev, first_name: e.target.value }))} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Last Name *</Label>
                        <Input id="last_name" value={formData.last_name} onChange={(e) => setFormData((prev) => ({ ...prev, last_name: e.target.value }))} required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone *</Label>
                      <Input id="phone" type="tel" placeholder="+27..." value={formData.phone} onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employee_id">Employee ID</Label>
                      <Input id="employee_id" placeholder="TECH-001" value={formData.employee_id} onChange={(e) => setFormData((prev) => ({ ...prev, employee_id: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="team">Team</Label>
                      <Select value={formData.team || ''} onValueChange={(value) => setFormData((prev) => ({ ...prev, team: value as TechnicianTeam }))}>
                        <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                        <SelectContent>{TEAM_OPTIONS.map((team) => (<SelectItem key={team} value={team}>{team}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Skills</Label>
                      <div className="flex flex-wrap gap-2">
                        {SKILL_OPTIONS.map((skill) => (
                          <Badge key={skill.value} variant={formData.skills?.includes(skill.value) ? 'default' : 'outline'} className={cn("cursor-pointer transition-colors", formData.skills?.includes(skill.value) && "bg-circleTel-orange hover:bg-orange-600")} onClick={() => toggleSkill(skill.value)}>
                            {formData.skills?.includes(skill.value) && <CheckCircle className="h-3 w-3 mr-1" />}{skill.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={submitting} className="bg-circleTel-orange hover:bg-orange-600">
                      {submitting ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}{editingTechnician ? 'Update' : 'Create'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <TechnicianStatCard title="Total Technicians" value={stats.total} subtitle="Active team members" icon={<Users className="h-5 w-5" />} iconBgColor="bg-blue-100" iconColor="text-blue-600" />
        <TechnicianStatCard title="Available" value={stats.available} subtitle="Ready for assignment" icon={<UserCheck className="h-5 w-5" />} iconBgColor="bg-green-100" iconColor="text-green-600" />
        <TechnicianStatCard title="On Job" value={stats.onJob} subtitle="Currently working" icon={<Wrench className="h-5 w-5" />} iconBgColor="bg-orange-100" iconColor="text-circleTel-orange" />
        <TechnicianStatCard title="Offline" value={stats.offline} subtitle="Not on duty" icon={<UserX className="h-5 w-5" />} iconBgColor="bg-gray-100" iconColor="text-gray-600" />
      </div>

      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search by name, employee ID, or phone..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filter by status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="on_job">On Job</SelectItem>
                <SelectItem value="en_route">En Route</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="break">On Break</SelectItem>
              </SelectContent>
            </Select>
            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filter by team" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {TEAM_OPTIONS.map((team) => (<SelectItem key={team} value={team}>{team}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredTechnicians.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTechnicians.map((tech) => (<TechnicianCard key={tech.id} tech={tech} onEdit={openEditDialog} onDelete={handleDelete} />))}
        </div>
      ) : (
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="py-12">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-gray-100 rounded-xl flex items-center justify-center mb-4"><Users className="h-8 w-8 text-gray-400" /></div>
              {technicians.length === 0 ? (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No technicians yet</h3>
                  <p className="text-gray-500 mb-4">Add your first technician to start managing field operations</p>
                  <Button onClick={() => setDialogOpen(true)} className="bg-circleTel-orange hover:bg-orange-600"><Plus className="h-4 w-4 mr-2" />Add Technician</Button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No matches found</h3>
                  <p className="text-gray-500">Try adjusting your search or filters</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
        <p>Showing {filteredTechnicians.length} of {technicians.length} technicians</p>
        <Link href="/admin/field-ops" className="text-circleTel-orange hover:underline font-medium">Back to Field Operations</Link>
      </div>
    </div>
  );
}
