'use client';

/**
 * Admin B2B Site Details View Page
 *
 * Detailed view of a single site details submission for admin review.
 *
 * @module app/admin/b2b-customers/site-details/[id]/page
 */

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Camera,
  DoorOpen,
  User,
  Phone,
  Mail,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  SiteDetails,
  RFI_STATUS_LABELS,
  SITE_DETAILS_STATUS_LABELS,
  PREMISES_OWNERSHIP_LABELS,
  PROPERTY_TYPE_LABELS,
  EQUIPMENT_LOCATION_LABELS,
  ACCESS_TYPE_LABELS,
  RFI_CHECKLIST_CONFIG,
} from '@/types/site-details';

// ============================================================================
// Types
// ============================================================================

interface PageData {
  siteDetails: SiteDetails & {
    business_customers: {
      company_name: string;
      account_number: string;
      primary_contact_name: string;
      primary_contact_email: string;
      primary_contact_phone: string;
    };
  };
}

// ============================================================================
// Main Component
// ============================================================================

export default function AdminSiteDetailsViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action dialog state
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: 'approve' | 'reject' | null;
    notes: string;
    rejectionReason: string;
    isSubmitting: boolean;
  }>({
    open: false,
    action: null,
    notes: '',
    rejectionReason: '',
    isSubmitting: false,
  });

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/admin/b2b-customers/site-details/${resolvedParams.id}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load site details');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching site details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [resolvedParams.id]);

  // Handle approve
  const handleApprove = async () => {
    setActionDialog((prev) => ({ ...prev, isSubmitting: true }));

    try {
      const response = await fetch(
        `/api/admin/b2b-customers/site-details/${resolvedParams.id}/approve`,
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

      router.push('/admin/b2b-customers/site-details');
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
    if (!actionDialog.rejectionReason) return;

    setActionDialog((prev) => ({ ...prev, isSubmitting: true }));

    try {
      const response = await fetch(
        `/api/admin/b2b-customers/site-details/${resolvedParams.id}/reject`,
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

      router.push('/admin/b2b-customers/site-details');
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

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href="/admin/b2b-customers/site-details" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Site Details
          </Link>
        </Button>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || 'Site details not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const { siteDetails } = data;
  const customer = siteDetails.business_customers;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/b2b-customers/site-details">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MapPin className="h-6 w-6 text-circleTel-orange" />
              Site Details Review
            </h1>
            <p className="text-sm text-gray-500">
              {customer.company_name} ({customer.account_number})
            </p>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-2">
          <Badge
            variant={
              siteDetails.status === 'approved'
                ? 'default'
                : siteDetails.status === 'rejected'
                ? 'destructive'
                : 'secondary'
            }
            className={
              siteDetails.status === 'approved' ? 'bg-green-500 hover:bg-green-600' : ''
            }
          >
            {SITE_DETAILS_STATUS_LABELS[siteDetails.status]}
          </Badge>
          <Badge
            variant={
              siteDetails.rfi_status === 'ready'
                ? 'default'
                : siteDetails.rfi_status === 'pending'
                ? 'secondary'
                : 'destructive'
            }
            className={
              siteDetails.rfi_status === 'ready' ? 'bg-green-500 hover:bg-green-600' : ''
            }
          >
            RFI: {RFI_STATUS_LABELS[siteDetails.rfi_status]}
          </Badge>
        </div>
      </div>

      {/* Customer Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-circleTel-orange" />
            Customer Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Company</p>
              <p className="font-medium">{customer.company_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Account Number</p>
              <p className="font-medium">{customer.account_number}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Contact Person</p>
              <p className="font-medium flex items-center gap-1">
                <User className="h-4 w-4" />
                {customer.primary_contact_name}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Contact</p>
              <p className="text-sm flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {customer.primary_contact_email}
              </p>
              {customer.primary_contact_phone && (
                <p className="text-sm flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {customer.primary_contact_phone}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Premises Information */}
        <Card>
          <CardHeader>
            <CardTitle>Premises Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Ownership</p>
                <p className="font-medium">
                  {PREMISES_OWNERSHIP_LABELS[siteDetails.premises_ownership]}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Property Type</p>
                <p className="font-medium">
                  {PROPERTY_TYPE_LABELS[siteDetails.property_type]}
                </p>
              </div>
            </div>
            {siteDetails.building_name && (
              <div>
                <p className="text-sm text-gray-500">Building Name</p>
                <p className="font-medium">{siteDetails.building_name}</p>
              </div>
            )}
            {siteDetails.floor_level && (
              <div>
                <p className="text-sm text-gray-500">Floor Level</p>
                <p className="font-medium">{siteDetails.floor_level}</p>
              </div>
            )}
            {siteDetails.installation_address && (
              <div>
                <p className="text-sm text-gray-500">Installation Address</p>
                <p className="font-medium">
                  {siteDetails.installation_address.street}
                  {siteDetails.installation_address.suburb && `, ${siteDetails.installation_address.suburb}`}
                  <br />
                  {siteDetails.installation_address.city}, {siteDetails.installation_address.province}
                  <br />
                  {siteDetails.installation_address.postal_code}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Equipment Location */}
        <Card>
          <CardHeader>
            <CardTitle>Equipment Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Room/Area Name</p>
              <p className="font-medium">{siteDetails.room_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Mounting Type</p>
              <p className="font-medium">
                {EQUIPMENT_LOCATION_LABELS[siteDetails.equipment_location]}
              </p>
            </div>
            {siteDetails.cable_entry_point && (
              <div>
                <p className="text-sm text-gray-500">Cable Entry Point</p>
                <p className="font-medium">{siteDetails.cable_entry_point}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* RFI Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>RFI Checklist</span>
            <Badge
              variant={
                siteDetails.rfi_status === 'ready'
                  ? 'default'
                  : siteDetails.rfi_status === 'pending'
                  ? 'secondary'
                  : 'destructive'
              }
              className={
                siteDetails.rfi_status === 'ready' ? 'bg-green-500 hover:bg-green-600' : ''
              }
            >
              {RFI_STATUS_LABELS[siteDetails.rfi_status]}
            </Badge>
          </CardTitle>
          <CardDescription>
            Ready for Installation requirements status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {RFI_CHECKLIST_CONFIG.map((item) => {
              const value = siteDetails[item.id as keyof SiteDetails] as boolean;
              return (
                <div
                  key={item.id}
                  className={`flex items-start gap-3 p-4 rounded-lg border ${
                    value ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  {value ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={`font-medium ${value ? 'text-green-700' : 'text-red-700'}`}>
                      {item.label}
                    </p>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {siteDetails.rfi_notes && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Additional Notes</p>
              <p className="text-sm">{siteDetails.rfi_notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Access Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DoorOpen className="h-5 w-5 text-circleTel-orange" />
              Access Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Access Type</p>
              <p className="font-medium">{ACCESS_TYPE_LABELS[siteDetails.access_type]}</p>
            </div>
            {siteDetails.access_instructions && (
              <div>
                <p className="text-sm text-gray-500">Access Instructions</p>
                <p className="font-medium">{siteDetails.access_instructions}</p>
              </div>
            )}
            {(siteDetails.building_manager_name ||
              siteDetails.building_manager_phone ||
              siteDetails.building_manager_email) && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-gray-700 mb-2">Building Manager</p>
                {siteDetails.building_manager_name && (
                  <p className="text-sm flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {siteDetails.building_manager_name}
                  </p>
                )}
                {siteDetails.building_manager_phone && (
                  <p className="text-sm flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {siteDetails.building_manager_phone}
                  </p>
                )}
                {siteDetails.building_manager_email && (
                  <p className="text-sm flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {siteDetails.building_manager_email}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Landlord Information (for leased premises) */}
        {siteDetails.premises_ownership === 'leased' && (
          <Card>
            <CardHeader>
              <CardTitle>Landlord Information</CardTitle>
              <CardDescription>
                {siteDetails.landlord_consent_signed ? (
                  <Badge className="bg-green-500">Consent Signed</Badge>
                ) : (
                  <Badge variant="destructive">Consent Pending</Badge>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {siteDetails.landlord_name && (
                <div>
                  <p className="text-sm text-gray-500">Landlord Name</p>
                  <p className="font-medium">{siteDetails.landlord_name}</p>
                </div>
              )}
              {siteDetails.landlord_contact && (
                <div>
                  <p className="text-sm text-gray-500">Landlord Contact</p>
                  <p className="font-medium">{siteDetails.landlord_contact}</p>
                </div>
              )}
              {siteDetails.landlord_consent_signed && siteDetails.landlord_consent_signed_at && (
                <div>
                  <p className="text-sm text-gray-500">Consent Signed</p>
                  <p className="font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(siteDetails.landlord_consent_signed_at).toLocaleDateString()}
                  </p>
                </div>
              )}
              {siteDetails.landlord_consent_url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={siteDetails.landlord_consent_url} target="_blank" rel="noopener noreferrer">
                    View Consent Document
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Site Photos */}
      {siteDetails.site_photos && siteDetails.site_photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-circleTel-orange" />
              Site Photos ({siteDetails.site_photos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {siteDetails.site_photos.map((photo, index) => (
                <a
                  key={photo.url}
                  href={photo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <img
                    src={photo.url}
                    alt={photo.filename || `Site photo ${index + 1}`}
                    className="w-full h-40 object-cover rounded-lg hover:opacity-80 transition-opacity"
                  />
                  <p className="text-xs text-gray-500 mt-1 truncate">{photo.filename}</p>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {siteDetails.status === 'submitted' && (
        <Card className="border-circleTel-orange/30 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Review Actions</p>
                <p className="text-sm text-gray-500">
                  Approve or reject this site details submission
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    setActionDialog({
                      open: true,
                      action: 'reject',
                      notes: '',
                      rejectionReason: '',
                      isSubmitting: false,
                    })
                  }
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  className="bg-green-500 hover:bg-green-600"
                  onClick={() =>
                    setActionDialog({
                      open: true,
                      action: 'approve',
                      notes: '',
                      rejectionReason: '',
                      isSubmitting: false,
                    })
                  }
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approve/Reject Dialog */}
      <Dialog
        open={actionDialog.open}
        onOpenChange={(open) =>
          !actionDialog.isSubmitting &&
          setActionDialog({
            open,
            action: null,
            notes: '',
            rejectionReason: '',
            isSubmitting: false,
          })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === 'approve'
                ? 'Approve Site Details'
                : 'Reject Site Details'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.action === 'approve'
                ? 'Confirm approval. The customer will be notified and can proceed to the next stage.'
                : 'Provide a reason for rejection. The customer will be notified.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
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
                setActionDialog({
                  open: false,
                  action: null,
                  notes: '',
                  rejectionReason: '',
                  isSubmitting: false,
                })
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
                {actionDialog.isSubmitting && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Approve
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={actionDialog.isSubmitting || !actionDialog.rejectionReason}
              >
                {actionDialog.isSubmitting && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Reject
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
