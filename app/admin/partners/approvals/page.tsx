'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Building,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  Handshake,
  Loader2,
  MapPin,
} from 'lucide-react';

interface Partner {
  id: string;
  partner_number: string | null;
  business_name: string;
  business_type: string;
  contact_person: string;
  email: string;
  phone: string;
  city: string;
  province: string;
  status: string;
  compliance_status: string;
  tier: string;
  commission_rate: number;
  created_at: string;
}

export default function PendingApprovalsPage() {
  const router = useRouter();
  const [partners, setPartners] = React.useState<Partner[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [processingId, setProcessingId] = React.useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = React.useState('');
  const [selectedPartnerId, setSelectedPartnerId] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchPendingPartners();
  }, []);

  const fetchPendingPartners = async () => {
    setLoading(true);
    try {
      // Fetch both pending and under_review partners
      const response = await fetch('/api/admin/partners?status=pending&limit=100');
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch partners');
      }

      let allPending = result.data || [];

      // Also fetch under_review
      const reviewResponse = await fetch('/api/admin/partners?status=under_review&limit=100');
      const reviewResult = await reviewResponse.json();

      if (reviewResult.success && reviewResult.data) {
        allPending = [...allPending, ...reviewResult.data];
      }

      // Sort by created_at (oldest first for FIFO processing)
      allPending.sort((a: Partner, b: Partner) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      setPartners(allPending);
    } catch (error) {
      console.error('Error fetching pending partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (partnerId: string) => {
    setProcessingId(partnerId);
    try {
      const response = await fetch(`/api/admin/partners/${partnerId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          tier: 'bronze',
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to approve partner');
      }

      // Remove from list
      setPartners((prev) => prev.filter((p) => p.id !== partnerId));
    } catch (error) {
      console.error('Error approving partner:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedPartnerId || !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setProcessingId(selectedPartnerId);
    try {
      const response = await fetch(`/api/admin/partners/${selectedPartnerId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          rejection_reason: rejectionReason,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to reject partner');
      }

      // Remove from list
      setPartners((prev) => prev.filter((p) => p.id !== selectedPartnerId));
      setRejectionReason('');
      setSelectedPartnerId(null);
    } catch (error) {
      console.error('Error rejecting partner:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      pending: { variant: 'secondary', icon: <Clock className="h-3 w-3 mr-1" /> },
      under_review: { variant: 'outline', icon: <AlertCircle className="h-3 w-3 mr-1" /> },
    };

    const { variant, icon } = config[status] || { variant: 'outline' as const, icon: null };

    return (
      <Badge variant={variant} className="flex items-center w-fit">
        {icon}
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
      </Badge>
    );
  };

  const getComplianceStatus = (status: string) => {
    const config: Record<string, { color: string; label: string }> = {
      not_started: { color: 'text-gray-500', label: 'Not Started' },
      incomplete: { color: 'text-yellow-600', label: 'Incomplete' },
      under_review: { color: 'text-blue-600', label: 'Under Review' },
      verified: { color: 'text-green-600', label: 'Verified' },
    };

    const { color, label } = config[status] || { color: 'text-gray-500', label: status };

    return <span className={`text-sm font-medium ${color}`}>{label}</span>;
  };

  const getDaysSinceApplication = (dateString: string) => {
    const days = Math.floor(
      (Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push('/admin/partners')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
            <p className="text-gray-600 mt-1">
              {partners.length} application{partners.length !== 1 ? 's' : ''} awaiting review
            </p>
          </div>
        </div>
      </div>

      {/* Applications Queue */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : partners.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">All Caught Up!</h2>
              <p className="text-gray-600">No pending partner applications to review.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push('/admin/partners')}
              >
                View All Partners
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {partners.map((partner) => (
            <Card key={partner.id} className="overflow-hidden">
              <div className="flex flex-col lg:flex-row">
                {/* Partner Info */}
                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-circleTel-orange/10 flex items-center justify-center">
                        <Handshake className="h-6 w-6 text-circleTel-orange" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">
                          {partner.business_name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(partner.status)}
                          <span className="text-sm text-gray-500">
                            Applied {getDaysSinceApplication(partner.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label className="text-gray-500 text-xs uppercase">Contact Person</Label>
                      <p className="font-medium">{partner.contact_person}</p>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-gray-500 text-xs uppercase">Email</Label>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <a href={`mailto:${partner.email}`} className="text-blue-600 hover:underline text-sm">
                          {partner.email}
                        </a>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-gray-500 text-xs uppercase">Phone</Label>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{partner.phone}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-gray-500 text-xs uppercase">Business Type</Label>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span className="text-sm capitalize">{partner.business_type.replace('_', ' ')}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-gray-500 text-xs uppercase">Location</Label>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{partner.city}, {partner.province}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-gray-500 text-xs uppercase">Compliance Status</Label>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        {getComplianceStatus(partner.compliance_status)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex lg:flex-col items-center justify-center gap-2 p-4 lg:p-6 bg-gray-50 border-t lg:border-t-0 lg:border-l min-w-[200px]">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => router.push(`/admin/partners/${partner.id}`)}
                  >
                    View Details
                  </Button>

                  <Button
                    size="sm"
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => handleApprove(partner.id)}
                    disabled={processingId === partner.id}
                  >
                    {processingId === partner.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Quick Approve
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        disabled={processingId === partner.id}
                        onClick={() => setSelectedPartnerId(partner.id)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reject Partner Application</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to reject the application from{' '}
                          <strong>{partner.business_name}</strong>? This action will notify the applicant.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="py-4">
                        <Label htmlFor="rejection-reason">Rejection Reason *</Label>
                        <Textarea
                          id="rejection-reason"
                          placeholder="Please provide a reason for rejection..."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="mt-2"
                        />
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => {
                          setRejectionReason('');
                          setSelectedPartnerId(null);
                        }}>
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleReject}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Reject Application
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
