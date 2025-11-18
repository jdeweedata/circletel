'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  Wrench,
  Plus,
  Search,
  Users,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Edit,
  Loader2,
  Star,
} from 'lucide-react';
import { TechnicianFormModal } from '@/components/admin/orders/TechnicianFormModal';

interface Technician {
  id: string;
  name: string;
  email: string;
  phone: string;
  is_active: boolean;
  specialties: string[];
  total_installations: number;
  completed_installations: number;
  average_rating: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export default function TechniciansPage() {
  const router = useRouter();
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [filteredTechnicians, setFilteredTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState<Technician | null>(null);
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchTechnicians();
  }, []);

  useEffect(() => {
    filterTechnicians();
  }, [searchQuery, filterStatus, technicians]);

  const fetchTechnicians = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/technicians?include_inactive=true');
      const result = await response.json();

      if (result.success) {
        setTechnicians(result.data || []);
      } else {
        toast.error('Failed to load technicians');
      }
    } catch (error) {
      console.error('Error fetching technicians:', error);
      toast.error('Error loading technicians');
    } finally {
      setLoading(false);
    }
  };

  const filterTechnicians = () => {
    let filtered = [...technicians];

    // Filter by status
    if (filterStatus === 'active') {
      filtered = filtered.filter((t) => t.is_active);
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter((t) => !t.is_active);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.email.toLowerCase().includes(query) ||
          t.phone.includes(query) ||
          t.specialties.some((s) => s.toLowerCase().includes(query))
      );
    }

    setFilteredTechnicians(filtered);
  };

  const handleToggleStatus = async (technician: Technician) => {
    try {
      setTogglingStatus(technician.id);
      const response = await fetch(`/api/admin/technicians/${technician.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !technician.is_active }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(
          `Technician ${!technician.is_active ? 'activated' : 'deactivated'} successfully`
        );
        fetchTechnicians();
      } else {
        toast.error(result.error || 'Failed to update technician status');
      }
    } catch (error) {
      console.error('Error toggling technician status:', error);
      toast.error('Error updating technician status');
    } finally {
      setTogglingStatus(null);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    fetchTechnicians();
  };

  const handleEditSuccess = () => {
    setEditingTechnician(null);
    fetchTechnicians();
  };

  // Calculate stats
  const stats = {
    total: technicians.length,
    active: technicians.filter((t) => t.is_active).length,
    inactive: technicians.filter((t) => !t.is_active).length,
    totalInstallations: technicians.reduce((sum, t) => sum + (t.total_installations || 0), 0),
    completedInstallations: technicians.reduce(
      (sum, t) => sum + (t.completed_installations || 0),
      0
    ),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-circleTel-orange" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-circleTel-darkNeutral flex items-center gap-2">
            <Wrench className="h-8 w-8" />
            Technicians Management
          </h1>
          <p className="text-gray-600 mt-1">Manage installation technicians and assignments</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Technician
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Technicians</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-circleTel-darkNeutral flex items-center gap-2">
              <Users className="h-5 w-5 text-circleTel-orange" />
              {stats.total}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              {stats.active}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Inactive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-500 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {stats.inactive}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Installations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-circleTel-darkNeutral">
              {stats.totalInstallations}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.completedInstallations}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Technicians List</CardTitle>
          <CardDescription>View and manage all technicians in the system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, phone, or specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('all')}
                size="sm"
              >
                All ({stats.total})
              </Button>
              <Button
                variant={filterStatus === 'active' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('active')}
                size="sm"
              >
                Active ({stats.active})
              </Button>
              <Button
                variant={filterStatus === 'inactive' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('inactive')}
                size="sm"
              >
                Inactive ({stats.inactive})
              </Button>
            </div>
          </div>

          {/* Technicians Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Specialties</TableHead>
                  <TableHead className="text-center">Installations</TableHead>
                  <TableHead className="text-center">Rating</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTechnicians.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      {searchQuery || filterStatus !== 'all'
                        ? 'No technicians found matching your filters'
                        : 'No technicians yet. Click "Add Technician" to create one.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTechnicians.map((technician) => (
                    <TableRow key={technician.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white ${
                              technician.is_active ? 'bg-circleTel-orange' : 'bg-gray-400'
                            }`}
                          >
                            {technician.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-medium text-circleTel-darkNeutral">
                              {technician.name}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Mail className="h-3 w-3" />
                            {technician.email}
                          </div>
                          <div className="flex items-center gap-1 text-gray-600">
                            <Phone className="h-3 w-3" />
                            {technician.phone}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {technician.specialties && technician.specialties.length > 0 ? (
                            technician.specialties.map((specialty, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {specialty}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-gray-400">No specialties</span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="text-sm">
                          <div className="font-semibold text-circleTel-darkNeutral">
                            {technician.completed_installations || 0}
                          </div>
                          <div className="text-xs text-gray-500">
                            of {technician.total_installations || 0}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        {technician.average_rating ? (
                          <div className="flex items-center justify-center gap-1 text-sm">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{technician.average_rating.toFixed(1)}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge
                          variant={technician.is_active ? 'default' : 'secondary'}
                          className={
                            technician.is_active
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }
                        >
                          {technician.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingTechnician(technician)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(technician)}
                            disabled={togglingStatus === technician.id}
                            className="h-8 px-3 text-xs"
                          >
                            {togglingStatus === technician.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : technician.is_active ? (
                              'Deactivate'
                            ) : (
                              'Activate'
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Modal */}
      <TechnicianFormModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit Modal */}
      {editingTechnician && (
        <TechnicianFormModal
          open={true}
          onClose={() => setEditingTechnician(null)}
          onSuccess={handleEditSuccess}
          technician={editingTechnician}
        />
      )}
    </div>
  );
}
