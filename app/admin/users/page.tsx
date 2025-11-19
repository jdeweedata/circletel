'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Settings
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGate } from '@/components/rbac/PermissionGate';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

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

interface PendingRequest {
  id: string;
  email: string;
  full_name: string;
  requested_role: string;
  requested_role_template_id: string | null;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  role_template?: {
    name: string;
    department: string;
    level: string;
    color: string;
  };
}

export default function AdminUsersPage() {
  const { hasPermission } = usePermissions();
  const [activeTab, setActiveTab] = useState<'users' | 'pending'>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Approval dialog state
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  // Rejection dialog state
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();

      const { data, error: usersError } = await supabase
        .from('admin_users')
        .select(`
          *,
          role_template:role_templates!admin_users_role_template_id_fkey(
            id,
            name,
            department
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      const formattedUsers = data?.map((user: any) => ({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        role_template_id: user.role_template_id,
        role_template_name: user.role_template?.name || null,
        department: user.role_template?.department || user.department,
        job_title: user.job_title,
        is_active: user.is_active,
        created_at: user.created_at,
        last_login: user.last_login
      })) || [];

      setUsers(formattedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/users/pending');
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        const message = result?.error || `Failed to fetch pending requests (status ${response.status})`;
        console.warn('Failed to fetch pending requests:', {
          status: response.status,
          error: message,
          result,
        });
        setError(message);
        return;
      }

      setPendingRequests(result?.data || []);
    } catch (err) {
      console.error('Error fetching pending requests:', err);
      if (!error) {
        setError('Failed to load pending requests');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else {
      fetchPendingRequests();
    }
  }, [activeTab]);

  const openApproveDialog = (request: PendingRequest) => {
    setSelectedRequest(request);
    setApprovalNotes('');
    setShowApproveDialog(true);
  };

  const openRejectDialog = (request: PendingRequest) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setShowRejectDialog(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest) {
      toast.error('No request selected');
      return;
    }

    setIsApproving(true);
    try {
      const response = await fetch(`/api/admin/users/pending/${selectedRequest.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: approvalNotes,
          request: {
            id: selectedRequest.id,
            email: selectedRequest.email,
            full_name: selectedRequest.full_name,
            requested_role: selectedRequest.requested_role,
            requested_role_template_id: selectedRequest.requested_role_template_id,
            role_template_name: selectedRequest.role_template?.name ?? null,
          },
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to approve user');
      }

      toast.success(`${selectedRequest.full_name} has been approved and notified via email!`);
      setShowApproveDialog(false);
      fetchPendingRequests();
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to approve user');
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }

    setIsRejecting(true);
    try {
      const response = await fetch(`/api/admin/users/pending/${selectedRequest.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reject request');
      }

      toast.success(`Request from ${selectedRequest.full_name} has been rejected`);
      setShowRejectDialog(false);
      fetchPendingRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reject request');
    } finally {
      setIsRejecting(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role_template_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPendingRequests = pendingRequests.filter(request =>
    request.status === 'pending' && (
      request.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    )
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

  const pendingCount = pendingRequests.filter(r => r.status === 'pending').length;

  if (loading && activeTab === 'users' && users.length === 0) {
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
            Manage admin users, roles, and access requests
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/users/roles">
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Manage Roles
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => activeTab === 'users' ? fetchUsers() : fetchPendingRequests()}
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
                <p className="text-sm text-gray-600">Pending Requests</p>
                <p className="text-2xl font-bold text-orange-600">
                  {pendingCount}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Super Admins</p>
                <p className="text-2xl font-bold text-red-600">
                  {users.filter(u => u.role === 'super_admin' || u.role_template_id === 'super_admin').length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Active Users ({users.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            <Clock className="h-4 w-4 mr-2" />
            Pending Requests
            {pendingCount > 0 && (
              <Badge className="ml-2 bg-orange-500">{pendingCount}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Active Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Admin Users</CardTitle>
                  <CardDescription>
                    Active admin user accounts and role assignments
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
        </TabsContent>

        {/* Pending Requests Tab */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Pending Access Requests</CardTitle>
                  <CardDescription>
                    Review and approve or reject admin access requests
                  </CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search requests..."
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
                    <TableHead>Applicant</TableHead>
                    <TableHead>Requested Role</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPendingRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        {loading ? 'Loading...' : 'No pending requests'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPendingRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{request.full_name}</div>
                            <div className="text-sm text-gray-500">{request.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {request.role_template?.name || request.requested_role}
                            </div>
                            {request.role_template && (
                              <div className="text-xs text-gray-500">
                                {request.role_template.department} • {request.role_template.level}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            {request.reason ? (
                              <p className="text-sm text-gray-600 truncate">
                                {request.reason}
                              </p>
                            ) : (
                              <span className="text-sm text-gray-400 italic">No reason provided</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {formatDate(request.created_at)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openApproveDialog(request)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openRejectDialog(request)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Admin Access Request</DialogTitle>
            <DialogDescription>
              Approve this request and automatically generate a temporary password for {selectedRequest?.full_name}. They will be notified via email and required to change it on first login.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Applicant</Label>
              <p className="text-sm font-medium">{selectedRequest?.full_name}</p>
              <p className="text-sm text-gray-500">{selectedRequest?.email}</p>
            </div>

            <div className="space-y-2">
              <Label>Requested Role</Label>
              <p className="text-sm font-medium">
                {selectedRequest?.role_template?.name || selectedRequest?.requested_role}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this approval..."
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isApproving}
              className="bg-green-600 hover:bg-green-700"
            >
              {isApproving ? 'Approving...' : 'Approve & Send Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Admin Access Request</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting {selectedRequest?.full_name}'s request. They will be notified via email.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Applicant</Label>
              <p className="text-sm font-medium">{selectedRequest?.full_name}</p>
              <p className="text-sm text-gray-500">{selectedRequest?.email}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">
                Rejection Reason <span className="text-red-600">*</span>
              </Label>
              <Textarea
                id="reason"
                placeholder="Explain why this request is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={isRejecting || !rejectionReason.trim()}
              variant="destructive"
            >
              {isRejecting ? 'Rejecting...' : 'Reject & Send Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
