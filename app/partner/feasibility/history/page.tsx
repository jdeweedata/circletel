'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Building2,
  Calendar,
  MapPin,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  PartnerFeasibilityRequest,
  STATUS_LABELS,
  STATUS_COLORS,
} from '@/lib/partners/feasibility-types';
import { toast } from 'sonner';

interface RequestWithSiteCount extends PartnerFeasibilityRequest {
  site_count: number;
}

interface HistoryResponse {
  success: boolean;
  requests?: RequestWithSiteCount[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
  error?: string;
}

export default function FeasibilityHistoryPage() {
  const [requests, setRequests] = useState<RequestWithSiteCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/partners/feasibility/history?page=${page}&limit=10`
        );
        const data: HistoryResponse = await response.json();

        if (!data.success) {
          toast.error(data.error || 'Failed to load history');
          return;
        }

        setRequests(data.requests || []);
        setTotalPages(data.pagination?.total_pages || 1);
      } catch (error) {
        toast.error('Failed to load history');
        console.error('History error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [page]);

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/partner/feasibility">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Feasibility History
            </h1>
            <p className="text-gray-600 mt-1">
              View your past coverage check requests
            </p>
          </div>
        </div>
        <Link href="/partner/feasibility">
          <Button className="bg-circleTel-orange hover:bg-circleTel-orange-dark">
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </Button>
        </Link>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {loading ? (
          <>
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-32 mb-4" />
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : requests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No feasibility requests yet</p>
              <Link href="/partner/feasibility">
                <Button className="mt-4 bg-circleTel-orange hover:bg-circleTel-orange-dark">
                  Create Your First Request
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          requests.map((request) => (
            <Link
              key={request.id}
              href={`/partner/feasibility/${request.id}`}
            >
              <Card className="hover:border-circleTel-orange/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {request.client_company_name}
                        </h3>
                        <Badge
                          className={STATUS_COLORS[request.status]}
                          variant="secondary"
                        >
                          {STATUS_LABELS[request.status]}
                        </Badge>
                      </div>
                      {request.client_contact_name && (
                        <p className="text-sm text-gray-500 mt-1">
                          {request.client_contact_name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {request.site_count}{' '}
                      {request.site_count === 1 ? 'site' : 'sites'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(request.created_at)}
                    </div>
                    {request.bandwidth_required && (
                      <div className="text-circleTel-orange font-medium">
                        {request.bandwidth_required} Mbps
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
