'use client';

/**
 * Admin B2B Site Details Page
 *
 * Displays all site detail submissions with RFI status for admin review.
 *
 * @module app/admin/b2b-customers/site-details/page
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Building2,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  RFIStatus,
  SiteDetailsStatus,
  RFI_STATUS_LABELS,
  SITE_DETAILS_STATUS_LABELS,
  PREMISES_OWNERSHIP_LABELS,
  PROPERTY_TYPE_LABELS,
} from '@/types/site-details';

// ============================================================================
// Types
// ============================================================================

interface SiteDetailsListItem {
  id: string;
  business_customer_id: string;
  company_name: string;
  account_number: string;
  premises_ownership: string;
  property_type: string;
  room_name: string;
  rfi_status: RFIStatus;
  status: SiteDetailsStatus;
  submitted_at: string | null;
  created_at: string;
  has_rack_facility: boolean;
  has_access_control: boolean;
  has_air_conditioning: boolean;
  has_ac_power: boolean;
}

interface Stats {
  total: number;
  byStatus: Record<string, number>;
  byRfiStatus: Record<string, number>;
  pending_review: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getStatusBadge(status: SiteDetailsStatus) {
  const variants: Record<SiteDetailsStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    draft: 'outline',
    submitted: 'secondary',
    under_review: 'default',
    approved: 'default',
    rejected: 'destructive',
  };

  const colors: Record<SiteDetailsStatus, string> = {
    draft: '',
    submitted: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    under_review: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
    approved: 'bg-green-500 hover:bg-green-600',
    rejected: '',
  };

  return (
    <Badge variant={variants[status]} className={colors[status]}>
      {SITE_DETAILS_STATUS_LABELS[status]}
    </Badge>
  );
}

function getRFIBadge(status: RFIStatus) {
  const styles: Record<RFIStatus, string> = {
    ready: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    not_ready: 'bg-red-100 text-red-700',
  };

  return (
    <Badge variant="outline" className={styles[status]}>
      {RFI_STATUS_LABELS[status]}
    </Badge>
  );
}

function formatDate(dateString: string | null) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ============================================================================
// Main Component
// ============================================================================

export default function AdminSiteDetailsPage() {
  const { toast } = useToast();
  const [siteDetailsList, setSiteDetailsList] = useState<SiteDetailsListItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [rfiFilter, setRfiFilter] = useState<string>('all');

  // Action dialog state
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: 'approve' | 'reject' | null;
    siteDetails: SiteDetailsListItem | null;
    notes: string;
    rejectionReason: string;
    isSubmitting: boolean;
  }>({
    open: false,
    action: null,
    siteDetails: null,
    notes: '',
    rejectionReason: '',
    isSubmitting: false,
  });

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/b2b-customers/site-details');

      if (!response.ok) {
        throw new Error('Failed to fetch site details');
      }

      const data = await response.json();
      setSiteDetailsList(data.data || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error('Error fetching site details:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch site details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle approve
  const handleApprove = async () => {
    if (!actionDialog.siteDetails) return;

    setActionDialog((prev) => ({ ...prev, isSubmitting: true }));

    try {
      const response = await fetch(
        `/api/admin/b2b-customers/site-details/${actionDialog.siteDetails.id}/approve`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: actionDialog.notes }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to approve site details');
      }

      toast({
        title: 'Site Details Approved',
        description: 'The site details have been approved.',
      });

      setActionDialog({ open: false, action: null, siteDetails: null, notes: '', rejectionReason: '', isSubmitting: false });
      fetchData();
    } catch (error) {
      console.error('Error approving site details:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve site details',
        variant: 'destructive',
      });
    } finally {
      setActionDialog((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  // Handle reject
  const handleReject = async () => {
    if (!actionDialog.siteDetails || !actionDialog.rejectionReason) return;

    setActionDialog((prev) => ({ ...prev, isSubmitting: true }));

    try {
      const response = await fetch(
        `/api/admin/b2b-customers/site-details/${actionDialog.siteDetails.id}/reject`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reason: actionDialog.rejectionReason,
            notes: actionDialog.notes,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to reject site details');
      }

      toast({
        title: 'Site Details Rejected',
        description: 'The site details have been rejected.',
      });

      setActionDialog({ open: false, action: null, siteDetails: null, notes: '', rejectionReason: '', isSubmitting: false });
      fetchData();
    } catch (error) {
      console.error('Error rejecting site details:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject site details',
        variant: 'destructive',
      });
    } finally {
      setActionDialog((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  // Filter data
  const filteredList = siteDetailsList.filter((item) => {
    const matchesSearch =
      searchQuery === '' ||
      item.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.account_number.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesRfi = rfiFilter === 'all' || item.rfi_status === rfiFilter;

    return matchesSearch && matchesStatus && matchesRfi;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="h-6 w-6 text-circleTel-orange" />
            Site Details Review
          </h1>
          <p className="text-sm text-gray-500">
            Review and approve B2B customer site details submissions
          </p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Submissions</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Building2 className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pending Review</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats.pending_review}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">RFI Ready</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.byRfiStatus?.ready || 0}
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">RFI Issues</p>
                  <p className="text-2xl font-bold text-red-600">
                    {(stats.byRfiStatus?.pending || 0) + (stats.byRfiStatus?.not_ready || 0)}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by company name or account number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>

            <Select value={rfiFilter} onValueChange={setRfiFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="RFI Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All RFI Status</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="not_ready">Not Ready</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredList.length === 0 ? (
            <div className="p-12 text-center">
              <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No site details found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>RFI Status</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredList.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.company_name}</p>
                        <p className="text-sm text-gray-500">{item.account_number}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{PROPERTY_TYPE_LABELS[item.property_type as keyof typeof PROPERTY_TYPE_LABELS] || item.property_type}</p>
                        <p className="text-xs text-gray-500">
                          {PREMISES_OWNERSHIP_LABELS[item.premises_ownership as keyof typeof PREMISES_OWNERSHIP_LABELS] || item.premises_ownership} • {item.room_name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getRFIBadge(item.rfi_status)}
                        <div className="flex gap-1 mt-1">
                          <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center ${item.has_rack_facility ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                            R
                          </span>
                          <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center ${item.has_access_control ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                            A
                          </span>
                          <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center ${item.has_air_conditioning ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                            C
                          </span>
                          <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center ${item.has_ac_power ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                            P
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatDate(item.submitted_at)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/b2b-customers/site-details/${item.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          {item.status === 'submitted' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  setActionDialog({
                                    open: true,
                                    action: 'approve',
                                    siteDetails: item,
                                    notes: '',
                                    rejectionReason: '',
                                    isSubmitting: false,
                                  })
                                }
                                className="text-green-600"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  setActionDialog({
                                    open: true,
                                    action: 'reject',
                                    siteDetails: item,
                                    notes: '',
                                    rejectionReason: '',
                                    isSubmitting: false,
                                  })
                                }
                                className="text-red-600"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Approve/Reject Dialog */}
      <Dialog
        open={actionDialog.open}
        onOpenChange={(open) =>
          !actionDialog.isSubmitting &&
          setActionDialog({ open, action: null, siteDetails: null, notes: '', rejectionReason: '', isSubmitting: false })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === 'approve' ? 'Approve Site Details' : 'Reject Site Details'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.action === 'approve'
                ? 'Confirm approval of these site details. The customer will be notified and can proceed to the next stage.'
                : 'Provide a reason for rejection. The customer will be notified and can update their submission.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {actionDialog.siteDetails && (
              <div className="bg-gray-50 p-3 rounded-lg text-sm">
                <p className="font-medium">{actionDialog.siteDetails.company_name}</p>
                <p className="text-gray-500">{actionDialog.siteDetails.account_number}</p>
              </div>
            )}

            {actionDialog.action === 'reject' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Rejection Reason *</label>
                <Textarea
                  placeholder="Explain why the site details are being rejected..."
                  value={actionDialog.rejectionReason}
                  onChange={(e) =>
                    setActionDialog((prev) => ({ ...prev, rejectionReason: e.target.value }))
                  }
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Admin Notes (Optional)</label>
              <Textarea
                placeholder="Internal notes..."
                value={actionDialog.notes}
                onChange={(e) =>
                  setActionDialog((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setActionDialog({ open: false, action: null, siteDetails: null, notes: '', rejectionReason: '', isSubmitting: false })
              }
              disabled={actionDialog.isSubmitting}
            >
              Cancel
            </Button>
            {actionDialog.action === 'approve' ? (
              <Button
                onClick={handleApprove}
                disabled={actionDialog.isSubmitting}
                className="bg-green-500 hover:bg-green-600"
              >
                {actionDialog.isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Approve
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={actionDialog.isSubmitting || !actionDialog.rejectionReason}
              >
                {actionDialog.isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Reject
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
