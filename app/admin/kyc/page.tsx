'use client';

/**
 * Admin KYC Review Page
 * Allows admins to review, approve, or reject KYC documents and sessions
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Eye,
  Filter,
  Download,
  RefreshCw,
  ExternalLink,
  Shield
} from 'lucide-react';
import DocumentViewer from '@/components/admin/kyc/DocumentViewer';
import SessionViewer from '@/components/admin/kyc/SessionViewer';

interface KycDocument {
  id: string;
  consumer_order_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  document_type: string;
  document_title: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  verification_status: 'pending' | 'under_review' | 'approved' | 'rejected';
  verified_by: string | null;
  verified_at: string | null;
  verification_notes: string | null;
  rejection_reason: string | null;
  created_at: string;
}

interface KycSession {
  id: string;
  didit_session_id: string;
  flow_type: string;
  user_type: string;
  status: string;
  extracted_data?: any;
  verification_result?: 'approved' | 'declined' | 'pending_review' | null;
  risk_tier?: string | null;
  created_at: string;
  completed_at?: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  order?: {
    id: string;
    order_number: string;
    status: string;
  } | null;
  quote?: any;
}

export default function AdminKycPage() {
  const [documents, setDocuments] = useState<KycDocument[]>([]);
  const [sessions, setSessions] = useState<KycSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedVerificationResult, setSelectedVerificationResult] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<KycDocument | null>(null);
  const [selectedSession, setSelectedSession] = useState<KycSession | null>(null);
  const [activeTab, setActiveTab] = useState<string>('sessions');

  // Fetch documents
  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/kyc/documents');
      const data = await response.json();

      if (data.success) {
        setDocuments(data.documents);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch sessions
  const fetchSessions = async () => {
    setSessionsLoading(true);
    try {
      const response = await fetch('/api/admin/kyc/sessions');
      const data = await response.json();

      if (data.success) {
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchSessions();
  }, []);

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesStatus = selectedStatus === 'all' || doc.verification_status === selectedStatus;
    const matchesSearch =
      doc.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.customer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.file_name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  // Filter sessions
  const filteredSessions = sessions.filter((session) => {
    const matchesStatus = selectedStatus === 'all' || session.status === selectedStatus;
    const matchesVerification = selectedVerificationResult === 'all' || session.verification_result === selectedVerificationResult;
    const matchesSearch =
      session.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.customer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.didit_session_id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesVerification && matchesSearch;
  });

  // Get status badge
  const getStatusBadge = (status: string) => {
    const badges = {
      pending: <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>,
      under_review: <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Eye className="w-3 h-3 mr-1" />Under Review</Badge>,
      approved: <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>,
      rejected: <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>,
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get document type label
  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      id_document: 'ID Document',
      proof_of_address: 'Proof of Address',
      bank_statement: 'Bank Statement',
      company_registration: 'Company Registration',
      tax_certificate: 'Tax Certificate',
      vat_certificate: 'VAT Certificate',
      director_id: 'Director ID',
      shareholder_agreement: 'Shareholder Agreement',
      other: 'Other',
    };
    return labels[type] || type;
  };

  // Count by status - Documents
  const documentStatusCounts = {
    all: documents.length,
    pending: documents.filter(d => d.verification_status === 'pending').length,
    under_review: documents.filter(d => d.verification_status === 'under_review').length,
    approved: documents.filter(d => d.verification_status === 'approved').length,
    rejected: documents.filter(d => d.verification_status === 'rejected').length,
  };

  // Count by status - Sessions
  const sessionStatusCounts = {
    all: sessions.length,
    completed: sessions.filter(s => s.status === 'completed').length,
    in_progress: sessions.filter(s => s.status === 'in_progress').length,
    not_started: sessions.filter(s => s.status === 'not_started').length,
    abandoned: sessions.filter(s => s.status === 'abandoned').length,
    declined: sessions.filter(s => s.status === 'declined').length,
  };

  // Count by verification result - Sessions
  const verificationResultCounts = {
    all: sessions.length,
    approved: sessions.filter(s => s.verification_result === 'approved').length,
    declined: sessions.filter(s => s.verification_result === 'declined').length,
    pending_review: sessions.filter(s => s.verification_result === 'pending_review').length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">KYC Review</h1>
          <p className="text-gray-600 mt-1">Review and verify customer KYC documents and Didit sessions</p>
        </div>
        <Button onClick={() => { fetchDocuments(); fetchSessions(); }} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Didit Sessions ({sessions.length})
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Documents ({documents.length})
          </TabsTrigger>
        </TabsList>

        {/* SESSIONS TAB */}
        <TabsContent value="sessions" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{sessionStatusCounts.all}</div>
                <p className="text-sm text-gray-600">Total Sessions</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{verificationResultCounts.approved}</div>
                <p className="text-sm text-gray-600">Approved</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">{sessionStatusCounts.completed}</div>
                <p className="text-sm text-gray-600">Completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-yellow-600">{verificationResultCounts.pending_review}</div>
                <p className="text-sm text-gray-600">Pending Review</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by customer name, email, or session ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedVerificationResult} onValueChange={setSelectedVerificationResult}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Verification Result" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Results ({verificationResultCounts.all})</SelectItem>
                    <SelectItem value="approved">Approved ({verificationResultCounts.approved})</SelectItem>
                    <SelectItem value="declined">Declined ({verificationResultCounts.declined})</SelectItem>
                    <SelectItem value="pending_review">Pending Review ({verificationResultCounts.pending_review})</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Sessions List */}
          <Card>
            <CardHeader>
              <CardTitle>Didit KYC Sessions ({filteredSessions.length})</CardTitle>
              <CardDescription>
                Click on a session to view Didit verification details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sessionsLoading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                  <p className="text-gray-600 mt-2">Loading sessions...</p>
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="w-12 h-12 mx-auto text-gray-300" />
                  <p className="text-gray-600 mt-2">No sessions found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedSession(session)}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Shield className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-medium truncate">{session.customer_name}</p>
                            {getStatusBadge(session.status)}
                            {session.verification_result === 'approved' && (
                              <Badge variant="default" className="bg-green-500">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 truncate">{session.customer_email}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                            <span>{session.flow_type.replace('_', ' ').toUpperCase()}</span>
                            <span>•</span>
                            <span>{session.user_type === 'business' ? 'Business' : 'Consumer'}</span>
                            <span>•</span>
                            <span>{formatDate(session.created_at)}</span>
                            {session.extracted_data?.didit_console_links && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-blue-600">
                                  <ExternalLink className="w-3 h-3" />
                                  Didit Links Available
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* DOCUMENTS TAB */}
        <TabsContent value="documents" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{documentStatusCounts.all}</div>
                <p className="text-sm text-gray-600">Total Documents</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-yellow-600">{documentStatusCounts.pending}</div>
                <p className="text-sm text-gray-600">Pending</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">{documentStatusCounts.under_review}</div>
                <p className="text-sm text-gray-600">Under Review</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{documentStatusCounts.approved}</div>
                <p className="text-sm text-gray-600">Approved</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-600">{documentStatusCounts.rejected}</div>
                <p className="text-sm text-gray-600">Rejected</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by customer name, email, or filename..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses ({documentStatusCounts.all})</SelectItem>
                    <SelectItem value="pending">Pending ({documentStatusCounts.pending})</SelectItem>
                    <SelectItem value="under_review">Under Review ({documentStatusCounts.under_review})</SelectItem>
                    <SelectItem value="approved">Approved ({documentStatusCounts.approved})</SelectItem>
                    <SelectItem value="rejected">Rejected ({documentStatusCounts.rejected})</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Documents List */}
          <Card>
            <CardHeader>
              <CardTitle>Documents ({filteredDocuments.length})</CardTitle>
              <CardDescription>
                Click on a document to view details and take action
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                  <p className="text-gray-600 mt-2">Loading documents...</p>
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto text-gray-300" />
                  <p className="text-gray-600 mt-2">No documents found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedDocument(doc)}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <FileText className="w-10 h-10 text-gray-400" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium truncate">{doc.customer_name}</p>
                            {getStatusBadge(doc.verification_status)}
                          </div>
                          <p className="text-sm text-gray-600 truncate">{doc.file_name}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                            <span>{getDocumentTypeLabel(doc.document_type)}</span>
                            <span>•</span>
                            <span>{formatFileSize(doc.file_size)}</span>
                            <span>•</span>
                            <span>{formatDate(doc.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          Review
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
          onStatusChange={() => {
            fetchDocuments(); // Refresh list after status change
          }}
        />
      )}

      {/* Session Viewer Modal */}
      {selectedSession && (
        <SessionViewer
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  );
}
