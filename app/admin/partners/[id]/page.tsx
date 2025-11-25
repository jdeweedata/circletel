'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import {
  ArrowLeft,
  Building,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  TrendingUp,
  Users,
  DollarSign,
  Handshake,
  ExternalLink,
  Download,
  Eye,
  Loader2,
} from 'lucide-react';

interface Partner {
  id: string;
  partner_number: string | null;
  business_name: string;
  business_type: string;
  registration_number: string | null;
  vat_number: string | null;
  contact_person: string;
  email: string;
  phone: string;
  alternative_phone: string | null;
  street_address: string;
  suburb: string | null;
  city: string;
  province: string;
  postal_code: string;
  bank_name: string;
  account_holder: string;
  account_number: string;
  account_type: string;
  branch_code: string;
  status: string;
  compliance_status: string;
  tier: string;
  commission_rate: number;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  approved_by: string | null;
}

interface ComplianceDocument {
  id: string;
  document_category: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  status: string;
  uploaded_at: string;
}

interface Lead {
  id: string;
  full_name: string;
  email: string;
  status: string;
  created_at: string;
}

interface Commission {
  id: string;
  amount: number;
  status: string;
  description: string;
  created_at: string;
}

export default function PartnerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const partnerId = params.id as string;

  const [partner, setPartner] = React.useState<Partner | null>(null);
  const [documents, setDocuments] = React.useState<ComplianceDocument[]>([]);
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [commissions, setCommissions] = React.useState<Commission[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [approving, setApproving] = React.useState(false);

  // Form state for editing
  const [editTier, setEditTier] = React.useState('');
  const [editCommission, setEditCommission] = React.useState('');
  const [adminNotes, setAdminNotes] = React.useState('');
  const [rejectionReason, setRejectionReason] = React.useState('');

  React.useEffect(() => {
    fetchPartnerDetails();
  }, [partnerId]);

  const fetchPartnerDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/partners/${partnerId}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch partner details');
      }

      setPartner(result.data.partner);
      setDocuments(result.data.documents || []);
      setLeads(result.data.leads || []);
      setCommissions(result.data.commissions || []);

      // Initialize form values
      setEditTier(result.data.partner.tier);
      setEditCommission(result.data.partner.commission_rate.toString());
      setAdminNotes(result.data.partner.admin_notes || '');
    } catch (error) {
      console.error('Error fetching partner:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/partners/${partnerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: editTier,
          commission_rate: parseFloat(editCommission),
          admin_notes: adminNotes,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update partner');
      }

      // Refresh data
      fetchPartnerDetails();
    } catch (error) {
      console.error('Error updating partner:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    setApproving(true);
    try {
      const response = await fetch(`/api/admin/partners/${partnerId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          tier: editTier,
          commission_rate: parseFloat(editCommission),
          approval_notes: adminNotes,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to approve partner');
      }

      // Refresh data
      fetchPartnerDetails();
    } catch (error) {
      console.error('Error approving partner:', error);
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setApproving(true);
    try {
      const response = await fetch(`/api/admin/partners/${partnerId}/approve`, {
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

      // Refresh data
      fetchPartnerDetails();
    } catch (error) {
      console.error('Error rejecting partner:', error);
    } finally {
      setApproving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      approved: { variant: 'default', icon: <CheckCircle className="h-3 w-3 mr-1" /> },
      pending: { variant: 'secondary', icon: <Clock className="h-3 w-3 mr-1" /> },
      under_review: { variant: 'outline', icon: <AlertCircle className="h-3 w-3 mr-1" /> },
      rejected: { variant: 'destructive', icon: <XCircle className="h-3 w-3 mr-1" /> },
      suspended: { variant: 'destructive', icon: <XCircle className="h-3 w-3 mr-1" /> },
    };

    const { variant, icon } = config[status] || { variant: 'outline' as const, icon: null };

    return (
      <Badge variant={variant} className="flex items-center w-fit">
        {icon}
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
      </Badge>
    );
  };

  const getTierBadge = (tier: string) => {
    const colors: Record<string, string> = {
      bronze: 'bg-amber-100 text-amber-800',
      silver: 'bg-gray-100 text-gray-800',
      gold: 'bg-yellow-100 text-yellow-800',
      platinum: 'bg-purple-100 text-purple-800',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[tier] || 'bg-gray-100 text-gray-600'}`}>
        {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </span>
    );
  };

  const getDocumentCategoryLabel = (category: string) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold text-gray-900">Partner Not Found</h2>
          <p className="text-gray-600 mt-2">The requested partner could not be found.</p>
          <Button className="mt-4" onClick={() => router.push('/admin/partners')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Partners
          </Button>
        </div>
      </div>
    );
  }

  const canApprove = ['pending', 'under_review'].includes(partner.status);

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push('/admin/partners')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{partner.business_name}</h1>
            <div className="flex items-center gap-2 mt-1">
              {partner.partner_number && (
                <span className="text-sm text-gray-500">{partner.partner_number}</span>
              )}
              {getStatusBadge(partner.status)}
              {getTierBadge(partner.tier)}
            </div>
          </div>
        </div>

        {canApprove && (
          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={approving}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reject Partner Application</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to reject this partner application? This action will notify the applicant.
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
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReject} className="bg-red-600 hover:bg-red-700">
                    Reject Application
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button onClick={handleApprove} disabled={approving}>
              {approving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Approve Partner
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="compliance">
            Compliance
            {documents.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {documents.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Business Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Business Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500">Business Type</Label>
                    <p className="font-medium capitalize">{partner.business_type.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Registration Number</Label>
                    <p className="font-medium">{partner.registration_number || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">VAT Number</Label>
                    <p className="font-medium">{partner.vat_number || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Partner Since</Label>
                    <p className="font-medium">{formatDate(partner.created_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-500">Contact Person</Label>
                  <p className="font-medium">{partner.contact_person}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <a href={`mailto:${partner.email}`} className="text-blue-600 hover:underline">
                    {partner.email}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <a href={`tel:${partner.phone}`} className="hover:underline">
                    {partner.phone}
                  </a>
                  {partner.alternative_phone && (
                    <span className="text-gray-500">/ {partner.alternative_phone}</span>
                  )}
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p>{partner.street_address}</p>
                    {partner.suburb && <p>{partner.suburb}</p>}
                    <p>
                      {partner.city}, {partner.province} {partner.postal_code}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Banking Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Banking Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500">Bank Name</Label>
                    <p className="font-medium">{partner.bank_name}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Account Holder</Label>
                    <p className="font-medium">{partner.account_holder}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Account Number</Label>
                    <p className="font-medium">{partner.account_number}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Account Type</Label>
                    <p className="font-medium capitalize">{partner.account_type}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Branch Code</Label>
                    <p className="font-medium">{partner.branch_code}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Commission & Tier */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Commission & Tier
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500">Current Tier</Label>
                    <div className="mt-1">{getTierBadge(partner.tier)}</div>
                  </div>
                  <div>
                    <Label className="text-gray-500">Commission Rate</Label>
                    <p className="font-medium text-2xl text-green-600">{partner.commission_rate}%</p>
                  </div>
                </div>
                {partner.approved_at && (
                  <div>
                    <Label className="text-gray-500">Approved On</Label>
                    <p className="font-medium">{formatDate(partner.approved_at)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Compliance Documents
              </CardTitle>
              <CardDescription>
                FICA and CIPC documents uploaded by the partner
              </CardDescription>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No compliance documents uploaded yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document Category</TableHead>
                      <TableHead>File Name</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">
                          {getDocumentCategoryLabel(doc.document_category)}
                        </TableCell>
                        <TableCell>{doc.file_name}</TableCell>
                        <TableCell>{formatFileSize(doc.file_size)}</TableCell>
                        <TableCell>{formatDate(doc.uploaded_at)}</TableCell>
                        <TableCell>
                          <Badge variant={doc.status === 'verified' ? 'default' : 'secondary'}>
                            {doc.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Leads */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Recent Leads
                </CardTitle>
                <CardDescription>Leads assigned to this partner</CardDescription>
              </CardHeader>
              <CardContent>
                {leads.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No leads assigned yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{lead.full_name}</p>
                              <p className="text-sm text-gray-500">{lead.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{lead.status}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {formatDate(lead.created_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Commissions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Commission History
                </CardTitle>
                <CardDescription>Recent commission transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {commissions.length === 0 ? (
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No commission transactions yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Amount</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissions.map((commission) => (
                        <TableRow key={commission.id}>
                          <TableCell className="font-medium text-green-600">
                            R{commission.amount.toFixed(2)}
                          </TableCell>
                          <TableCell>{commission.description}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{commission.status}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {formatDate(commission.created_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Partner Settings</CardTitle>
              <CardDescription>Update partner tier, commission rate, and notes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="tier">Partner Tier</Label>
                  <Select value={editTier} onValueChange={setEditTier}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bronze">Bronze (5%)</SelectItem>
                      <SelectItem value="silver">Silver (7.5%)</SelectItem>
                      <SelectItem value="gold">Gold (10%)</SelectItem>
                      <SelectItem value="platinum">Platinum (15%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commission">Commission Rate (%)</Label>
                  <Input
                    id="commission"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={editCommission}
                    onChange={(e) => setEditCommission(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Admin Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Internal notes about this partner..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                />
              </div>

              <Button onClick={handleSaveChanges} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
