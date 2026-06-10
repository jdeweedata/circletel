'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PiCheckCircleBold,
  PiClockBold,
  PiXCircleBold,
  PiCaretRightBold,
  PiWarningBold,
} from 'react-icons/pi';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface PipelineClinic {
  account_number: string;
  customer_id: string;
  business_name: string;
  province: string;
  stage: string;
  document_vetting_status: string | null;
  mandate_status: string | null;
  vetting_due_date: string | null;
  submitted_at: string | null;
  sla: {
    dueDate: string | null;
    overdue: boolean;
    businessDaysLeft: number | null;
  };
  submission_id: string | null;
}

interface PipelineResponse {
  clinics: PipelineClinic[];
  stageCounts: {
    invited: number;
    submitted: number;
    changes_requested: number;
    docs_approved: number;
    mandate_active: number;
    billing_ready: number;
    pending: number;
  };
  overdueCount: number;
}

function getStageBadge(stage: string) {
  const variants: Record<
    string,
    { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }
  > = {
    invited: { variant: 'secondary', label: 'Invited' },
    submitted: { variant: 'secondary', label: 'Submitted' },
    changes_requested: { variant: 'destructive', label: 'Changes Requested' },
    docs_approved: { variant: 'outline', label: 'Docs Approved' },
    mandate_active: { variant: 'outline', label: 'Mandate Active' },
    billing_ready: { variant: 'default', label: 'Billing Ready' },
    pending: { variant: 'outline', label: 'Pending' },
  };
  const config = variants[stage] || { variant: 'outline', label: stage };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function getStageIcon(stage: string) {
  switch (stage) {
    case 'billing_ready':
      return <PiCheckCircleBold className="w-4 h-4 text-green-600" />;
    case 'changes_requested':
      return <PiXCircleBold className="w-4 h-4 text-red-600" />;
    default:
      return <PiClockBold className="w-4 h-4 text-amber-600" />;
  }
}

function formatSLADisplay(clinic: PipelineClinic): string {
  if (!clinic.sla.dueDate) {
    return '-';
  }

  if (clinic.sla.overdue && clinic.sla.businessDaysLeft !== null) {
    return `${Math.abs(clinic.sla.businessDaysLeft)} days overdue`;
  }

  if (clinic.sla.businessDaysLeft !== null) {
    return `${clinic.sla.businessDaysLeft} days left`;
  }

  return '-';
}

export default function UnjanionboardingPipelinePage() {
  const router = useRouter();
  const [data, setData] = useState<PipelineResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPipeline() {
      setLoading(true);
      try {
        const response = await fetch('/api/admin/b2b/onboarding-pipeline', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('admin_token') || ''}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch pipeline');
        }

        const result: PipelineResponse = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching pipeline:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPipeline();
  }, []);

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Clinic Onboarding Pipeline</h1>
          <p className="text-gray-600">Track Unjani clinic onboarding progress</p>
        </div>

        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-8 text-gray-500">Failed to load pipeline data</div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Clinic Onboarding Pipeline</h1>
        <p className="text-gray-600">Track Unjani clinic onboarding progress and SLAs</p>
      </div>

      {/* Stage Count Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{data.stageCounts.invited}</div>
              <div className="text-xs text-gray-600">Invited</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{data.stageCounts.submitted}</div>
              <div className="text-xs text-gray-600">Submitted</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {data.stageCounts.changes_requested}
              </div>
              <div className="text-xs text-gray-600">Changes Req.</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{data.stageCounts.docs_approved}</div>
              <div className="text-xs text-gray-600">Docs Approved</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{data.stageCounts.mandate_active}</div>
              <div className="text-xs text-gray-600">Mandate Active</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {data.stageCounts.billing_ready}
              </div>
              <div className="text-xs text-gray-600">Ready</div>
            </div>
          </CardContent>
        </Card>
        <Card className={data.overdueCount > 0 ? 'border-red-300 bg-red-50' : ''}>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className={`text-2xl font-bold ${data.overdueCount > 0 ? 'text-red-600' : ''}`}>
                {data.overdueCount}
              </div>
              <div className="text-xs text-gray-600">Overdue</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Table */}
      <Card>
        <CardHeader>
          <CardTitle>Clinics</CardTitle>
          <CardDescription>{data.clinics.length} total clinics</CardDescription>
        </CardHeader>
        <CardContent>
          {data.clinics.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No clinics in pipeline</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead>Clinic</TableHead>
                    <TableHead>Province</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>SLA</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.clinics.map((clinic) => (
                    <TableRow
                      key={clinic.customer_id}
                      className={clinic.sla.overdue ? 'bg-red-50' : 'hover:bg-gray-50'}
                    >
                      <TableCell className="font-mono text-sm">{clinic.account_number}</TableCell>
                      <TableCell className="font-medium">{clinic.business_name}</TableCell>
                      <TableCell className="text-sm text-gray-600">{clinic.province}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStageIcon(clinic.stage)}
                          {getStageBadge(clinic.stage)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {clinic.sla.overdue ? (
                            <div className="flex items-center gap-1 text-red-600 font-medium">
                              <PiWarningBold className="w-4 h-4" />
                              {formatSLADisplay(clinic)}
                            </div>
                          ) : (
                            <span className="text-gray-600">{formatSLADisplay(clinic)}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {clinic.submission_id ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              router.push(`/admin/b2b/vetting/${clinic.submission_id}`)
                            }
                          >
                            <PiCaretRightBold className="w-4 h-4" />
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-400">No submission</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
