'use client';

import { useState, useEffect } from 'react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Users,
  Search,
  MoreHorizontal,
  Edit,
  Shield,
  UserX,
  UserCheck,
  RefreshCw,
  Mail
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGate } from '@/components/rbac/PermissionGate';
import { PERMISSIONS } from '@/lib/rbac/permissions';

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  role_template_id: string | null;
  role_template_name: string | null;
  department: string | null;
  job_title: string | null;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

export default function AdminUsersPage() {
  const { hasPermission } = usePermissions();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call
      // For now, fetch from Supabase MCP
      const mockUsers: AdminUser[] = [
        {
          id: '172c9f7c-7c32-43bd-8782-278df0d4a322',
          email: 'admin@circletel.co.za',
          full_name: 'Development Admin',
          role: 'super_admin',
          role_template_id: 'super_admin',
          role_template_name: 'Super Administrator',
          department: 'IT',
          job_title: 'System Administrator',
          is_active: true,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString()
        },
        {
          id: '2bcb64fc-c092-4657-80f3-df0ee33661d2',
          email: 'product.manager@circletel.co.za',
          full_name: 'Product Manager',
          role: 'product_manager',
          role_template_id: 'product_manager',
          role_template_name: 'Product Manager',
          department: 'Product',
          job_title: 'Product Manager',
          is_active: true,
          created_at: new Date().toISOString(),
          last_login: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: '689f0121-bd54-4b8c-aefb-cf0c288cefcc',
          email: 'editor@circletel.co.za',
          full_name: 'Content Editor',
          role: 'editor',
          role_template_id: 'content_editor',
          role_template_name: 'Content Editor',
          department: 'Marketing',
          job_title: 'Content Editor',
          is_active: true,
          created_at: new Date().toISOString(),
          last_login: null
        },
        {
          id: 'a7ef7c3c-1d7b-4eb6-8060-ec2ad9736bd4',
          email: 'viewer@circletel.co.za',
          full_name: 'Viewer User',
          role: 'viewer',
          role_template_id: 'viewer',
          role_template_name: 'Viewer',
          department: 'General',
          job_title: 'Observer',
          is_active: true,
          created_at: new Date().toISOString(),
          last_login: null
        }
      ];

      setUsers(mockUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role_template_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      super_admin: 'bg-red-100 text-red-800',
      product_manager: 'bg-blue-100 text-blue-800',
      editor: 'bg-purple-100 text-purple-800',
      viewer: 'bg-gray-100 text-gray-800'
    };

    return (
      <Badge className={colors[role] || 'bg-gray-100 text-gray-800'}>
        {role.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
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
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="h-8 w-8 text-purple-600" />
            User Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage admin users, roles, and permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
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
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-green-600">
                  {users.filter(u => u.is_active).length}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-red-600">
                  {users.filter(u => u.role === 'super_admin').length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recent Logins</p>
                <p className="text-2xl font-bold text-purple-600">
                  {users.filter(u => u.last_login &&
                    (new Date().getTime() - new Date(u.last_login).getTime()) < 86400000
                  ).length}
                </p>
              </div>
              <Mail className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Admin Users</CardTitle>
              <CardDescription>
                Manage user accounts and role assignments
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
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
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.full_name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getRoleBadge(user.role)}
                        {user.role_template_name && (
                          <div className="text-xs text-gray-500">
                            {user.role_template_name}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {user.department && (
                          <div className="text-sm">{user.department}</div>
                        )}
                        {user.job_title && (
                          <div className="text-xs text-gray-500">{user.job_title}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.is_active ? (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {formatDate(user.last_login)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <PermissionGate permissions={[PERMISSIONS.USERS.EDIT]}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {hasPermission(PERMISSIONS.USERS.EDIT) && (
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit User
                              </DropdownMenuItem>
                            )}
                            {hasPermission(PERMISSIONS.USERS.MANAGE_ROLES) && (
                              <DropdownMenuItem>
                                <Shield className="w-4 h-4 mr-2" />
                                Change Role
                              </DropdownMenuItem>
                            )}
                            {hasPermission(PERMISSIONS.USERS.DELETE) && (
                              <DropdownMenuItem className="text-red-600">
                                <UserX className="w-4 h-4 mr-2" />
                                Deactivate
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </PermissionGate>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
