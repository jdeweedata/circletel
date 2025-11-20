'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  Package,
  DollarSign,
  FileText,
  AlertTriangle,
  Eye,
  MessageSquare,
  RefreshCw
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';

interface PendingApproval {
  id: string;
  type: 'product_create' | 'product_update' | 'pricing_change' | 'product_archive';
  title: string;
  description: string;
  submitted_by: {
    name: string;
    email: string;
    role: string;
  };
  submitted_at: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  changes: {
    field: string;
    old_value: string | null;
    new_value: string;
  }[];
  estimated_impact: {
    revenue: string;
    users_affected: number;
    go_live_date?: string;
  };
  requires_review_from: string[];
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
}

// Types for approval data will be fetched from API

export default function ApprovalWorkflow() {
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch approvals from API
  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/admin/workflow/approvals');

      if (!response.ok) {
        throw new Error('Failed to fetch approvals');
      }

      const data = await response.json();
      setApprovals(data.approvals || []);
    } catch (err) {
      console.error('Error fetching approvals:', err);
      setError('Failed to load approvals. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'product_create': return <Package className="h-4 w-4" />;
      case 'product_update': return <FileText className="h-4 w-4" />;
      case 'pricing_change': return <DollarSign className="h-4 w-4" />;
      case 'product_archive': return <AlertTriangle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'product_create': return 'New Product';
      case 'product_update': return 'Product Update';
      case 'pricing_change': return 'Pricing Change';
      case 'product_archive': return 'Archive Product';
      default: return 'Unknown';
    }
  };

  const handleApprove = async () => {
    if (!selectedApproval) return;

    try {
      const response = await fetch('/api/admin/workflow/approvals', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          approvalId: selectedApproval.id,
          action: 'approve',
          comment: reviewComment
        })
      });

      if (!response.ok) {
        throw new Error('Failed to approve');
      }

      // Remove the approved item from the list
      setApprovals(prev => prev.filter(approval => approval.id !== selectedApproval.id));

      setIsReviewDialogOpen(false);
      setSelectedApproval(null);
      setReviewComment('');
    } catch (err) {
      console.error('Error approving:', err);
      setError('Failed to approve. Please try again.');
    }
  };

  const handleReject = async () => {
    if (!selectedApproval) return;

    try {
      const response = await fetch('/api/admin/workflow/approvals', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          approvalId: selectedApproval.id,
          action: 'reject',
          comment: reviewComment
        })
      });

      if (!response.ok) {
        throw new Error('Failed to reject');
      }

      // Remove the rejected item from the list
      setApprovals(prev => prev.filter(approval => approval.id !== selectedApproval.id));

      setIsReviewDialogOpen(false);
      setSelectedApproval(null);
      setReviewComment('');
    } catch (err) {
      console.error('Error rejecting:', err);
      setError('Failed to reject. Please try again.');
    }
  };

  const openReviewDialog = (approval: PendingApproval, action: 'approve' | 'reject') => {
    setSelectedApproval(approval);
    setReviewAction(action);
    setIsReviewDialogOpen(true);
  };

  const refresh = () => {
    fetchApprovals();
  };

  const pendingApprovals = approvals.filter(a => a.status === 'pending' || a.status === 'under_review');

  // Calculate stats from real data
  const urgentCount = pendingApprovals.filter(a => a.priority === 'urgent').length;
  const totalUsersAffected = pendingApprovals.reduce((sum, a) => sum + a.estimated_impact.users_affected, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Approval Workflow</h1>
          <p className="text-muted-foreground">
            Review and approve pending product catalogue changes
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={isLoading}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApprovals.length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting your approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {urgentCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Impact</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pendingApprovals.length > 0 ? 'Varies' : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Estimated monthly impact
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users Affected</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsersAffected}</div>
            <p className="text-xs text-muted-foreground">
              Across all pending changes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Pending Approvals List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Pending Approvals</h2>

        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-medium">Loading approvals...</h3>
              </div>
            </CardContent>
          </Card>
        ) : pendingApprovals.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium">All caught up!</h3>
                <p className="text-muted-foreground">No pending approvals at this time.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          pendingApprovals.map((approval) => (
            <Card key={approval.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(approval.type)}
                      <CardTitle className="text-lg">{approval.title}</CardTitle>
                      <Badge variant={getPriorityColor(approval.priority)}>
                        {approval.priority}
                      </Badge>
                      <Badge variant="outline">{getTypeLabel(approval.type)}</Badge>
                    </div>
                    <CardDescription>{approval.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            {getTypeIcon(approval.type)}
                            {approval.title}
                          </DialogTitle>
                          <DialogDescription>
                            Submitted by {approval.submitted_by.name} • {approval.category}
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6">
                          {/* Submission Details */}
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <h4 className="font-medium mb-2">Submission Details</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  <span>{approval.submitted_by.name} ({approval.submitted_by.role})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  <span>{new Date(approval.submitted_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-medium mb-2">Estimated Impact</h4>
                              <div className="space-y-2 text-sm">
                                <div>Revenue: {approval.estimated_impact.revenue}</div>
                                <div>Users Affected: {approval.estimated_impact.users_affected}</div>
                                {approval.estimated_impact.go_live_date && (
                                  <div>Go Live: {new Date(approval.estimated_impact.go_live_date).toLocaleDateString()}</div>
                                )}
                              </div>
                            </div>
                          </div>

                          <Separator />

                          {/* Changes */}
                          <div>
                            <h4 className="font-medium mb-3">Proposed Changes</h4>
                            <div className="space-y-3">
                              {approval.changes.map((change, index) => (
                                <div key={index} className="border rounded-lg p-3">
                                  <div className="font-medium text-sm mb-2">{change.field.replace('_', ' ').toUpperCase()}</div>
                                  <div className="grid gap-2 md:grid-cols-2">
                                    <div>
                                      <div className="text-xs text-muted-foreground mb-1">Current Value</div>
                                      <div className="text-sm bg-red-50 p-2 rounded border">
                                        {change.old_value || 'None'}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-xs text-muted-foreground mb-1">New Value</div>
                                      <div className="text-sm bg-green-50 p-2 rounded border">
                                        {change.new_value}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {approval.priority === 'urgent' && (
                            <Alert>
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                This item is marked as urgent and requires immediate attention.
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>

                        <DialogFooter className="gap-2">
                          <Button
                            variant="outline"
                            onClick={() => openReviewDialog(approval, 'reject')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          <Button
                            onClick={() => openReviewDialog(approval, 'approve')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Submitted by</div>
                    <div className="text-sm text-muted-foreground">
                      {approval.submitted_by.name} • {approval.submitted_by.role}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm font-medium">Impact</div>
                    <div className="text-sm text-muted-foreground">
                      {approval.estimated_impact.revenue} • {approval.estimated_impact.users_affected} users
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm font-medium">Timeline</div>
                    <div className="text-sm text-muted-foreground">
                      {approval.estimated_impact.go_live_date
                        ? `Go live: ${new Date(approval.estimated_impact.go_live_date).toLocaleDateString()}`
                        : 'No deadline set'
                      }
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Review Action Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? 'Approve' : 'Reject'} Changes
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {reviewAction} &quot;{selectedApproval?.title}&quot;?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="comment">Review Comment</Label>
              <Textarea
                id="comment"
                placeholder={`Add a comment about your ${reviewAction} decision...`}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={reviewAction === 'approve' ? 'default' : 'destructive'}
              onClick={reviewAction === 'approve' ? handleApprove : handleReject}
            >
              {reviewAction === 'approve' ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}