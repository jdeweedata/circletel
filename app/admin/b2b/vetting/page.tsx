'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PiCheckCircleBold,
  PiClockBold,
  PiXCircleBold,
  PiCaretRightBold,
  PiFunnelBold,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

interface Submission {
  id: string;
  customer_id: string;
  segment: string;
  status: string;
  document_vetting_status: string;
  submitted_at: string;
  customers: {
    id: string;
    account_number: string;
    business_name: string;
    onboarding_status: string;
  } | null;
}

function getVettingBadge(status: string) {
  const variants: Record<
    string,
    { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }
  > = {
    documents_pending: { variant: 'secondary', label: 'Documents Pending' },
    under_review: { variant: 'secondary', label: 'Under Review' },
    approved: { variant: 'default', label: 'Approved' },
    rejected: { variant: 'destructive', label: 'Rejected' },
    not_started: { variant: 'outline', label: 'Not Started' },
  };
  const config = variants[status] || { variant: 'outline', label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'approved':
      return <PiCheckCircleBold className="w-4 h-4 text-green-600" />;
    case 'rejected':
      return <PiXCircleBold className="w-4 h-4 text-red-600" />;
    default:
      return <PiClockBold className="w-4 h-4 text-amber-600" />;
  }
}

export default function B2BVettingQueuePage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [segment, setSegment] = useState<string>('');

  useEffect(() => {
    async function fetchSubmissions() {
      setLoading(true);
      try {
        const url = new URL('/api/admin/b2b/vetting', window.location.origin);
        if (segment) {
          url.searchParams.set('segment', segment);
        }

        const response = await fetch(url.toString(), {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('admin_token') || ''}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch submissions');
        }

        const data = await response.json();
        setSubmissions(data.submissions || []);
      } catch (error) {
        console.error('Error fetching submissions:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSubmissions();
  }, [segment]);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">B2B Document Vetting Queue</h1>
        <p className="text-gray-600">Review and approve onboarding submissions</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <PiFunnelBold /> Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="w-full max-w-xs">
              <label className="block text-sm font-medium mb-2">Segment</label>
              <Select value={segment} onValueChange={setSegment}>
                <SelectTrigger>
                  <SelectValue placeholder="All segments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All segments</SelectItem>
                  <SelectItem value="unjani">Unjani</SelectItem>
                  <SelectItem value="smb">SMB</SelectItem>
                  <SelectItem value="edu">Education</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Queue Table */}
      <Card>
        <CardHeader>
          <CardTitle>Submissions</CardTitle>
          <CardDescription>{submissions.length} total submissions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No submissions to review
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Number</TableHead>
                    <TableHead>Business Name</TableHead>
                    <TableHead>Segment</TableHead>
                    <TableHead>Vetting Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Onboarding Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission.id} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-sm">
                        {submission.customers?.account_number || '-'}
                      </TableCell>
                      <TableCell>{submission.customers?.business_name || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{submission.segment}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(submission.document_vetting_status)}
                          {getVettingBadge(submission.document_vetting_status)}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {submission.submitted_at
                          ? new Date(submission.submitted_at).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {submission.customers?.onboarding_status || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            router.push(`/admin/b2b/vetting/${submission.id}`)
                          }
                        >
                          <PiCaretRightBold className="w-4 h-4" />
                        </Button>
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
