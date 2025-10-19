'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ProductApprovalQueue } from '@/lib/types/product-approval';

export default function ProductApprovalsPage() {
  const [approvals, setApprovals] = useState<ProductApprovalQueue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const { toast } = useToast();

  useEffect(() => {
    fetchApprovals();
  }, [filter]);

  async function fetchApprovals() {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/product-approvals?status=${filter}`);
      const data = await response.json();

      if (data.success) {
        setApprovals(data.approvals);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to load approvals',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(approvalId: string, productName: string) {
    if (!confirm(`Approve product "${productName}"?`)) return;

    try {
      const response = await fetch(`/api/admin/product-approvals/${approvalId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approval_notes: 'Approved via admin panel'
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Product Approved',
          description: `${productName} has been added to the catalog.`,
          variant: 'default'
        });
        fetchApprovals();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to approve product',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  }

  async function handleReject(approvalId: string, productName: string) {
    const reason = prompt(`Reject "${productName}"? Enter rejection reason:`);
    if (!reason) return;

    try {
      const response = await fetch(`/api/admin/product-approvals/${approvalId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejection_reason: reason })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Product Rejected',
          description: `${productName} has been rejected.`,
          variant: 'default'
        });
        fetchApprovals();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to reject product',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  }

  function formatPrice(price: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(price);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Product Approvals</h1>
        <p className="text-muted-foreground">Review and approve imported products</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['pending', 'approved', 'rejected'] as const).map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            onClick={() => setFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      {/* Approvals List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Clock className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading approvals...</p>
          </div>
        </div>
      ) : approvals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No {filter} products found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {approvals.map((approval) => {
            const product = approval.product_data;

            return (
              <Card key={approval.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle>{product.name}</CardTitle>
                      <CardDescription>
                        {product.speed} | {formatPrice(product.regularPrice)}/month
                      </CardDescription>
                    </div>
                    <Badge variant={
                      approval.status === 'approved' ? 'default' :
                      approval.status === 'rejected' ? 'destructive' :
                      'secondary'
                    }>
                      {approval.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Product Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Regular Price</span>
                      <p className="font-medium">{formatPrice(product.regularPrice)}</p>
                    </div>
                    {product.promoPrice && (
                      <div>
                        <span className="text-muted-foreground">Promo Price</span>
                        <p className="font-medium text-green-600">{formatPrice(product.promoPrice)}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Installation</span>
                      <p className="font-medium">{formatPrice(product.installationFee)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">First Month Total</span>
                      <p className="font-medium">{formatPrice(product.totalFirstMonth)}</p>
                    </div>
                  </div>

                  {/* Router Info */}
                  <div>
                    <span className="text-sm text-muted-foreground">Router</span>
                    <p className="font-medium">{product.router.model}</p>
                    {product.router.rentalFee && (
                      <p className="text-sm text-muted-foreground">
                        Rental: {formatPrice(product.router.rentalFee)}/month
                      </p>
                    )}
                    {product.router.upfrontContribution && (
                      <p className="text-sm text-muted-foreground">
                        Upfront contribution: {formatPrice(product.router.upfrontContribution)}
                      </p>
                    )}
                  </div>

                  {/* Cost Breakdown */}
                  {product.costBreakdown && (
                    <div>
                      <span className="text-sm text-muted-foreground">Cost Breakdown</span>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-sm">
                        {product.costBreakdown.dfaWholesale && (
                          <div>DFA: {formatPrice(product.costBreakdown.dfaWholesale)}</div>
                        )}
                        {product.costBreakdown.staticIP && (
                          <div>Static IP: {formatPrice(product.costBreakdown.staticIP)}</div>
                        )}
                        {product.costBreakdown.infrastructure && (
                          <div>Infra: {formatPrice(product.costBreakdown.infrastructure)}</div>
                        )}
                        {product.costBreakdown.markup && (
                          <div>Markup: {formatPrice(product.costBreakdown.markup)}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {approval.status === 'pending' && (
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        onClick={() => handleApprove(approval.id, product.name)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleReject(approval.id, product.name)}
                        variant="destructive"
                        className="flex-1"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  )}

                  {/* Review Notes */}
                  {approval.status === 'approved' && approval.approval_notes && (
                    <div className="text-sm text-muted-foreground border-t pt-4">
                      <strong>Approval notes:</strong> {approval.approval_notes}
                    </div>
                  )}
                  {approval.status === 'rejected' && approval.rejection_reason && (
                    <div className="text-sm text-destructive border-t pt-4">
                      <strong>Rejection reason:</strong> {approval.rejection_reason}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
