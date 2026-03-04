'use client';
import { PiArrowLeftBold, PiArrowsClockwiseBold, PiBuildingsBold, PiCalendarBold, PiClockBold, PiEnvelopeBold, PiGaugeBold, PiPhoneBold, PiShieldBold, PiSpinnerBold, PiUserBold, PiWifiBold } from 'react-icons/pi';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CoverageResults } from '@/components/partners/feasibility';
import {
  PartnerFeasibilityRequest,
  PartnerFeasibilitySite,
  STATUS_LABELS,
  STATUS_COLORS,
  CONTENTION_OPTIONS,
  SLA_OPTIONS,
} from '@/lib/partners/feasibility-types';
import { toast } from 'sonner';

interface RequestWithSites extends PartnerFeasibilityRequest {
  sites: PartnerFeasibilitySite[];
}

export default function FeasibilityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [request, setRequest] = useState<RequestWithSites | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequest = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    else setRefreshing(true);

    try {
      const response = await fetch(`/api/partners/feasibility/${id}`);
      const data = await response.json();

      if (!data.success) {
        if (data.error === 'Request not found') {
          router.push('/partner/feasibility/history');
          return;
        }
        toast.error(data.error || 'Failed to load request');
        return;
      }

      setRequest(data.request);
    } catch (error) {
      toast.error('Failed to load request');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequest();

    // Poll if status is checking
    let interval: NodeJS.Timeout | null = null;
    const checkStatus = async () => {
      const response = await fetch(`/api/partners/feasibility/${id}`);
      const data = await response.json();
      if (data.success && data.request) {
        setRequest(data.request);
        if (data.request.status !== 'checking') {
          if (interval) clearInterval(interval);
        }
      }
    };

    // Start polling after initial load
    setTimeout(() => {
      if (request?.status === 'checking') {
        interval = setInterval(checkStatus, 3000);
      }
    }, 1000);

    return () => {
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getContentionLabel = (value: string | undefined) => {
    if (!value) return '-';
    const opt = CONTENTION_OPTIONS.find((o) => o.value === value);
    return opt?.label || value;
  };

  const getSlaLabel = (value: string | undefined) => {
    if (!value) return '-';
    const opt = SLA_OPTIONS.find((o) => o.value === value);
    return opt?.label || value;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded" />
          <div>
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32 mt-1" />
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Request not found</p>
        <Link href="/partner/feasibility/history">
          <Button className="mt-4">Go to History</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/partner/feasibility/history">
            <Button variant="ghost" size="icon">
              <PiArrowLeftBold className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {request.client_company_name}
              </h1>
              <Badge
                className={STATUS_COLORS[request.status]}
                variant="secondary"
              >
                {STATUS_LABELS[request.status]}
              </Badge>
            </div>
            <p className="text-gray-500 text-sm mt-1">
              Created {formatDate(request.created_at)}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => fetchRequest(false)}
          disabled={refreshing}
        >
          {refreshing ? (
            <PiSpinnerBold className="w-4 h-4 animate-spin" />
          ) : (
            <PiArrowsClockwiseBold className="w-4 h-4" />
          )}
          <span className="ml-2">Refresh</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Request Details - Left Column */}
        <div className="space-y-6">
          {/* Client Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <PiBuildingsBold className="w-4 h-4 text-circleTel-orange" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <PiBuildingsBold className="w-4 h-4 text-gray-400" />
                <span>{request.client_company_name}</span>
              </div>
              {request.client_contact_name && (
                <div className="flex items-center gap-2 text-sm">
                  <PiUserBold className="w-4 h-4 text-gray-400" />
                  <span>{request.client_contact_name}</span>
                </div>
              )}
              {request.client_email && (
                <div className="flex items-center gap-2 text-sm">
                  <PiEnvelopeBold className="w-4 h-4 text-gray-400" />
                  <span>{request.client_email}</span>
                </div>
              )}
              {request.client_phone && (
                <div className="flex items-center gap-2 text-sm">
                  <PiPhoneBold className="w-4 h-4 text-gray-400" />
                  <span>{request.client_phone}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <PiGaugeBold className="w-4 h-4 text-circleTel-orange" />
                Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Bandwidth</span>
                  <p className="font-medium">
                    {request.bandwidth_required
                      ? `${request.bandwidth_required} Mbps`
                      : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Contention</span>
                  <p className="font-medium">
                    {getContentionLabel(request.contention)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">SLA</span>
                  <p className="font-medium">
                    {getSlaLabel(request.sla_level)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Contract</span>
                  <p className="font-medium">{request.contract_term} months</p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">Failover</span>
                  <p className="font-medium">
                    {request.failover_required ? 'Required' : 'Not required'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coverage Results - Right Columns */}
        <div className="lg:col-span-2">
          <CoverageResults
            sites={request.sites || []}
            onGenerateQuote={() => {
              toast.info('Quote generation coming soon!');
            }}
            canGenerateQuote={
              request.status === 'complete' &&
              (request.sites || []).some(
                (s) =>
                  s.coverage_status === 'complete' &&
                  (s.coverage_results || []).some((r) => r.is_feasible)
              )
            }
          />
        </div>
      </div>
    </div>
  );
}
