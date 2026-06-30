'use client';
import { PiArrowsClockwiseBold, PiBuildingsBold, PiCheckCircleBold, PiClockBold, PiDotsThreeBold, PiEyeBold, PiFunnelBold, PiMagnifyingGlassBold, PiMapPinBold, PiSpinnerBold, PiWarningBold, PiXCircleBold } from 'react-icons/pi';

/**
 * Admin B2B Site Details Page
 *
 * Displays all site detail submissions with RFI status for admin review.
 *
 * @module app/admin/b2b-customers/site-details/page
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useToast } from '@/hooks/use-toast';
import {
  DataTable,
  FilterToolbar,
  MetricPanel,
  PageHeader,
  StatusBadge,
  type DataTableColumn,
  type StatusVariant,
} from '@/components/backend';
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
  const variants: Record<SiteDetailsStatus, StatusVariant> = {
    draft: 'neutral',
    submitted: 'info',
    under_review: 'warning',
    approved: 'success',
    rejected: 'error',
  };

  return <StatusBadge status={SITE_DETAILS_STATUS_LABELS[status]} variant={variants[status]} />;
}

function getRFIBadge(status: RFIStatus) {
  const variants: Record<RFIStatus, StatusVariant> = {
    ready: 'success',
    pending: 'warning',
    not_ready: 'error',
  };

  return <StatusBadge status={RFI_STATUS_LABELS[status]} variant={variants[status]} />;
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

  const columns: DataTableColumn<SiteDetailsListItem>[] = [
    {
      id: 'company',
      header: 'Company',
      cell: (item) => (
        <div className="min-w-[220px]">
          <p className="font-medium text-gray-900">{item.company_name}</p>
          <p className="text-xs text-gray-500">{item.account_number}</p>
        </div>
      ),
    },
    {
      id: 'property',
      header: 'Property',
      cell: (item) => (
        <div className="min-w-[220px]">
          <p className="text-sm text-gray-700">
            {PROPERTY_TYPE_LABELS[item.property_type as keyof typeof PROPERTY_TYPE_LABELS] || item.property_type}
          </p>
          <p className="text-xs text-gray-500">
            {PREMISES_OWNERSHIP_LABELS[item.premises_ownership as keyof typeof PREMISES_OWNERSHIP_LABELS] || item.premises_ownership} • {item.room_name}
          </p>
        </div>
      ),
    },
    {
      id: 'rfiStatus',
      header: 'RFI Status',
      cell: (item) => (
        <div className="space-y-1.5">
          {getRFIBadge(item.rfi_status)}
          <div className="flex gap-1">
            {[
              { label: 'R', isReady: item.has_rack_facility },
              { label: 'A', isReady: item.has_access_control },
              { label: 'C', isReady: item.has_air_conditioning },
              { label: 'P', isReady: item.has_ac_power },
            ].map(({ label, isReady }) => (
              <span
                key={label}
                className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold ${
                  isReady ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (item) => getStatusBadge(item.status),
    },
    {
      id: 'submitted',
      header: 'Submitted',
      cell: (item) => <span className="text-sm text-gray-500">{formatDate(item.submitted_at)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Site Details Review"
        subtitle="Review and approve B2B customer site details submissions"
        actions={
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <PiArrowsClockwiseBold className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricPanel
          label="Total Submissions"
          value={stats?.total ?? '...'}
          description={loading && !stats ? 'Loading...' : 'All submitted site records'}
          icon={<PiBuildingsBold className="h-4 w-4" />}
        />
        <MetricPanel
          label="Pending Review"
          value={stats?.pending_review ?? 0}
          description="Awaiting admin decision"
          icon={<PiClockBold className="h-4 w-4" />}
        />
        <MetricPanel
          label="RFI Ready"
          value={stats?.byRfiStatus?.ready ?? 0}
          description="Ready for deployment review"
          icon={<PiCheckCircleBold className="h-4 w-4" />}
        />
        <MetricPanel
          label="RFI Issues"
          value={(stats?.byRfiStatus?.pending ?? 0) + (stats?.byRfiStatus?.not_ready ?? 0)}
          description="Missing readiness inputs"
          icon={<PiWarningBold className="h-4 w-4" />}
        />
      </div>

      <FilterToolbar>
        <div className="relative min-w-0 flex-1">
          <PiMagnifyingGlassBold className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by company name or account number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-10 w-full sm:w-[180px]">
            <PiFunnelBold className="mr-2 h-4 w-4" />
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
          <SelectTrigger className="h-10 w-full sm:w-[180px]">
            <PiFunnelBold className="mr-2 h-4 w-4" />
            <SelectValue placeholder="RFI Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All RFI Status</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="not_ready">Not Ready</SelectItem>
          </SelectContent>
        </Select>
      </FilterToolbar>

      <DataTable
        columns={columns}
        rows={filteredList}
        getRowId={(item) => item.id}
        loading={loading}
        loadingMessage="Loading site details..."
        emptyIcon={<PiMapPinBold />}
        emptyTitle="No site details found"
        emptyDescription="Try adjusting the search or filters."
        onRowClick={(item) => {
          window.location.href = `/admin/b2b-customers/site-details/${item.id}`;
        }}
        rowActions={(item) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Open actions for ${item.company_name}`}>
                <PiDotsThreeBold className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/admin/b2b-customers/site-details/${item.id}`}>
                  <PiEyeBold className="mr-2 h-4 w-4" />
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
                    <PiCheckCircleBold className="mr-2 h-4 w-4" />
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
                    <PiXCircleBold className="mr-2 h-4 w-4" />
                    Reject
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />

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
                {actionDialog.isSubmitting && <PiSpinnerBold className="h-4 w-4 mr-2 animate-spin" />}
                Approve
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={actionDialog.isSubmitting || !actionDialog.rejectionReason}
              >
                {actionDialog.isSubmitting && <PiSpinnerBold className="h-4 w-4 mr-2 animate-spin" />}
                Reject
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
