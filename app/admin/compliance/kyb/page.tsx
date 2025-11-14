'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Shield, Search, RefreshCw, Users } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { createClient } from '@/lib/supabase/client';
import { KYBSubjectKYCStatus } from '@/components/admin/compliance/KYBSubjectKYCStatus';

interface KYBSubject {
  id: string;
  subject_type: 'ubo' | 'director';
  full_name: string;
  kyc_status:
    | 'not_started'
    | 'in_progress'
    | 'approved'
    | 'declined'
    | 'pending_review'
    | 'abandoned'
    | 'expired'
    | null;
  risk_tier: 'low' | 'medium' | 'high' | null;
  didit_session_id: string | null;
  created_at: string;
  business_quotes: {
    quote_number: string;
    customer_name: string;
    company_name?: string | null;
  } | null;
}

interface KYBStats {
  total: number;
  approved: number;
  pending: number;
  highRisk: number;
}

export default function AdminKYBCompliancePage() {
  const { hasPermission } = useAdminAuth();
  const [subjects, setSubjects] = useState<KYBSubject[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<KYBSubject[]>([]);
  const [stats, setStats] = useState<KYBStats>({
    total: 0,
    approved: 0,
    pending: 0,
    highRisk: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'ubo' | 'director'>('all');

  const supabase = createClient();
  const canViewCompliance = hasPermission('compliance:approve');

  useEffect(() => {
    if (canViewCompliance) {
      fetchSubjects();
    }
  }, [canViewCompliance]);

  useEffect(() => {
    filterSubjects();
  }, [subjects, searchQuery, typeFilter]);

  const fetchSubjects = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('kyb_subjects')
        .select(
          `
          id,
          subject_type,
          full_name,
          kyc_status,
          risk_tier,
          didit_session_id,
          created_at,
          business_quotes (
            quote_number,
            customer_name,
            company_name
          )
        `,
        )
        .order('created_at', { ascending: false });

      if (error) throw error;

      const subjectsData = (data || []) as KYBSubject[];
      setSubjects(subjectsData);

      const total = subjectsData.length;
      const approved = subjectsData.filter((s) => s.kyc_status === 'approved').length;
      const pending = subjectsData.filter(
        (s) => !s.kyc_status || s.kyc_status === 'not_started' || s.kyc_status === 'in_progress'
      ).length;
      const highRisk = subjectsData.filter((s) => s.risk_tier === 'high').length;

      setStats({ total, approved, pending, highRisk });
    } catch (error) {
      console.error('Error fetching KYB subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSubjects = () => {
    let filtered = [...subjects];

    if (typeFilter !== 'all') {
      filtered = filtered.filter((s) => s.subject_type === typeFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((subject) => {
        const quoteNumber = subject.business_quotes?.quote_number?.toLowerCase() || '';
        const customerName = subject.business_quotes?.customer_name?.toLowerCase() || '';
        const companyName = subject.business_quotes?.company_name?.toLowerCase() || '';
        const fullName = subject.full_name?.toLowerCase() || '';

        return (
          quoteNumber.includes(query) ||
          customerName.includes(query) ||
          companyName.includes(query) ||
          fullName.includes(query)
        );
      });
    }

    setFilteredSubjects(filtered);
  };

  if (!canViewCompliance) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">KYB Compliance</h1>
        <p className="text-gray-600 text-sm">
          You do not have permission to view KYB compliance data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-8 w-8 text-circleTel-orange" />
            KYB Compliance
          </h1>
          <p className="text-gray-600 mt-1">
            View KYC status and risk for UBOs and Directors.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSubjects}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Subjects</p>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </div>
            <div className="p-2 rounded-lg bg-gray-50">
              <Users className="h-5 w-5 text-gray-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold mt-1">{stats.approved}</p>
            </div>
            <div className="p-2 rounded-lg bg-green-50">
              <Shield className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending / In Progress</p>
              <p className="text-2xl font-bold mt-1">{stats.pending}</p>
            </div>
            <div className="p-2 rounded-lg bg-yellow-50">
              <Shield className="h-5 w-5 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">High Risk</p>
              <p className="text-2xl font-bold mt-1">{stats.highRisk}</p>
            </div>
            <div className="p-2 rounded-lg bg-red-50">
              <Shield className="h-5 w-5 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by subject, quote, customer, or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={typeFilter}
              onValueChange={(value) => setTypeFilter(value as 'all' | 'ubo' | 'director')}
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Subject type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                <SelectItem value="ubo">UBOs</SelectItem>
                <SelectItem value="director">Directors</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Subjects Table */}
      <Card>
        <CardHeader>
          <CardTitle>KYB Subjects</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-gray-600 text-sm py-8">Loading KYB subjects...</div>
          ) : filteredSubjects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 font-medium">No KYB subjects found</p>
              <p className="text-gray-500 text-sm mt-1">
                {searchQuery || typeFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Once you create UBOs or Directors on quotes, they will appear here.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Quote #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status / Risk
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSubjects.map((subject) => (
                    <tr key={subject.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {subject.business_quotes?.quote_number || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {subject.business_quotes?.company_name || subject.business_quotes?.customer_name || ''}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{subject.full_name}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className="bg-gray-100 text-gray-800">
                          {subject.subject_type === 'ubo' ? 'UBO' : 'Director'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <KYBSubjectKYCStatus
                          kycStatus={subject.kyc_status}
                          riskTier={subject.risk_tier}
                          verifiedDate={null}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">
                          {new Date(subject.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(subject.created_at).toLocaleTimeString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
