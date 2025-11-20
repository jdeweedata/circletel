'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Shield,
  Search,
  Eye,
  Users,
  RefreshCw,
  ChevronLeft,
  CheckCircle2,
  Plus,
  Edit,
  Trash2,
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGate } from '@/components/rbac/PermissionGate';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { createClient } from '@/lib/supabase/client';
import { RoleFormDialog } from '@/components/admin/roles/RoleFormDialog';
import { DeleteRoleDialog } from '@/components/admin/roles/DeleteRoleDialog';
import type { RoleWithUserCount } from '@/lib/types/role';

interface RoleTemplate {
  id: string;
  name: string;
  description: string;
  department: string;
  level: 'executive' | 'management' | 'staff' | 'support';
  permissions: string[];
  is_default: boolean;
  is_active: boolean;
  color: string;
  icon: string;
  user_count?: number;
}

export default function RolesManagementPage() {
  const { hasPermission } = usePermissions();
  const [roles, setRoles] = useState<RoleTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<RoleTemplate | null>(null);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // CRUD Dialog States
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState<RoleTemplate | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<RoleWithUserCount | null>(null);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();

      // Fetch role templates
      const { data: rolesData, error: rolesError } = await supabase
        .from('role_templates')
        .select('*')
        .eq('is_active', true)
        .order('level', { ascending: true })
        .order('name', { ascending: true });

      if (rolesError) throw rolesError;

      // Fetch user counts for each role
      const { data: userCounts, error: countsError } = await supabase
        .from('admin_users')
        .select('role_template_id')
        .eq('is_active', true);

      if (countsError) {
        console.error('Error fetching user counts:', countsError);
      }

      // Map user counts to roles
      const countMap = new Map<string, number>();
      userCounts?.forEach((user) => {
        const count = countMap.get(user.role_template_id) || 0;
        countMap.set(user.role_template_id, count + 1);
      });

      const rolesWithCounts = rolesData?.map((role) => ({
        ...role,
        user_count: countMap.get(role.id) || 0
      })) || [];

      setRoles(rolesWithCounts);
    } catch (err) {
      console.error('Error fetching roles:', err);
      setError('Failed to load role templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLevelBadge = (level: string) => {
    const colors: Record<string, string> = {
      executive: 'bg-red-100 text-red-800',
      management: 'bg-blue-100 text-blue-800',
      staff: 'bg-green-100 text-green-800',
      support: 'bg-gray-100 text-gray-800'
    };

    return (
      <Badge className={colors[level] || 'bg-gray-100 text-gray-800'}>
        {level.toUpperCase()}
      </Badge>
    );
  };

  const getDepartmentColor = (dept: string) => {
    const colors: Record<string, string> = {
      'IT': 'text-red-600',
      'Executive': 'text-purple-600',
      'Product': 'text-orange-600',
      'Sales': 'text-rose-600',
      'Finance': 'text-emerald-600',
      'Support': 'text-sky-600',
      'Marketing': 'text-purple-600',
      'General': 'text-gray-600'
    };
    return colors[dept] || 'text-gray-600';
  };

  const viewPermissions = (role: RoleTemplate) => {
    setSelectedRole(role);
    setShowPermissionsDialog(true);
  };

  // CRUD Handlers
  const handleCreateRole = () => {
    setRoleToEdit(null);
    setShowFormDialog(true);
  };

  const handleEditRole = (role: RoleTemplate) => {
    setRoleToEdit(role);
    setShowFormDialog(true);
  };

  const handleDeleteRole = (role: RoleTemplate) => {
    setRoleToDelete(role as RoleWithUserCount);
    setShowDeleteDialog(true);
  };

  const handleCrudSuccess = () => {
    fetchRoles();
  };

  const groupPermissionsByCategory = (permissions: string[]) => {
    const grouped: Record<string, string[]> = {};

    permissions.forEach((perm) => {
      const [category] = perm.split(':');
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(perm);
    });

    return grouped;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/admin/users">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Users
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="h-8 w-8 text-purple-600" />
            Role Templates
          </h1>
          <p className="text-gray-600 mt-1">
            View and manage role-based access control templates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRoles}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <PermissionGate permission={PERMISSIONS.SYSTEM.MANAGE_ROLES}>
            <Button
              size="sm"
              onClick={handleCreateRole}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Role
            </Button>
          </PermissionGate>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Roles</p>
                <p className="text-2xl font-bold">{roles.length}</p>
              </div>
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-green-600">
                  {roles.reduce((sum, role) => sum + (role.user_count || 0), 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Departments</p>
                <p className="text-2xl font-bold text-blue-600">
                  {new Set(roles.map(r => r.department)).size}
                </p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Default Roles</p>
                <p className="text-2xl font-bold text-orange-600">
                  {roles.filter(r => r.is_default).length}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Role Templates</CardTitle>
              <CardDescription>
                Predefined role templates with associated permissions
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search roles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No roles found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {role.name}
                            {role.is_default && (
                              <Badge variant="outline" className="text-xs">
                                Default
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {role.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${getDepartmentColor(role.department)}`}>
                        {role.department}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getLevelBadge(role.level)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {role.user_count || 0} {role.user_count === 1 ? 'user' : 'users'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {role.permissions.length} permissions
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewPermissions(role)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <PermissionGate permission={PERMISSIONS.SYSTEM.MANAGE_ROLES}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditRole(role)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRole(role)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </PermissionGate>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Permissions Dialog */}
      <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" />
              {selectedRole?.name} Permissions
            </DialogTitle>
            <DialogDescription>
              {selectedRole?.description}
            </DialogDescription>
          </DialogHeader>

          {selectedRole && (
            <div className="space-y-4 mt-4">
              {/* Role Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Department</p>
                  <p className="font-medium">{selectedRole.department}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Level</p>
                  <div className="mt-1">{getLevelBadge(selectedRole.level)}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Users</p>
                  <p className="font-medium">{selectedRole.user_count || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Permissions</p>
                  <p className="font-medium">{selectedRole.permissions.length}</p>
                </div>
              </div>

              {/* Grouped Permissions */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-gray-700">Permissions by Category</h4>
                {Object.entries(groupPermissionsByCategory(selectedRole.permissions)).map(([category, perms]) => (
                  <div key={category} className="border rounded-lg p-3">
                    <div className="font-medium text-sm text-gray-900 mb-2 capitalize flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      {category.replace('_', ' ')}
                      <Badge variant="secondary" className="ml-auto">
                        {perms.length}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {perms.map((perm) => (
                        <div key={perm} className="text-xs text-gray-600 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                          {perm.split(':')[1].replace('_', ' ')}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Role Dialog */}
      <RoleFormDialog
        open={showFormDialog}
        onOpenChange={setShowFormDialog}
        role={roleToEdit}
        onSuccess={handleCrudSuccess}
      />

      {/* Delete Role Dialog */}
      <DeleteRoleDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        role={roleToDelete}
        onSuccess={handleCrudSuccess}
      />
    </div>
  );
}
