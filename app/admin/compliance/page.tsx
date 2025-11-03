'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Shield,
  Search,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Calendar
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { createClient } from '@/lib/supabase/client';
import { KYCDetailPanel } from '@/components/admin/compliance/KYCDetailPanel';

interface KYCSession {
  id: string;
  quote_id: string;
  didit_session_id: string;
  status: string;
  verification_result: 'approved' | 'declined' | 'pending_review';
  risk_tier: 'low' | 'medium' | 'high';
  flow_type: string;
  extracted_data: {
    id_number?: string;
    full_name?: string;
    company_registration?: string;
    proof_of_address?: string;
    liveness_score?: number;
    aml_flags?: string[];
  };
  created_at: string;
  completed_at: string | null;
  business_quotes: {
    quote_number: string;
    customer_name: string;
    company_name?: string;
  };
}

interface ComplianceStats {
  pending: number;
  approved: number;
  declined: number;
  highRisk: number;
}

export default function AdminCompliancePage() {
  const { user, hasPermission } = useAdminAuth();
  const [sessions, setSessions] = useState<KYCSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<KYCSession[]>([]);
  const [stats, setStats] = useState<ComplianceStats>({
    pending: 0,
    approved: 0,
    declined: 0,
    highRisk: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [selectedSession, setSelectedSession] = useState<KYCSession | null>(null);
  const [activeTab, setActiveTab] = useState('pending');

  const supabase = createClient();
  const canApproveCompliance = hasPermission('compliance:approve');

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    filterSessions();
  }, [sessions, searchQuery, riskFilter, activeTab]);

  const fetchSessions = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('kyc_sessions')
        .select(`
          *,
          business_quotes (
            quote_number,
            customer_name,
            company_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const sessionsData = (data || []) as KYCSession[];
      setSessions(sessionsData);

      // Calculate stats
      const pending = sessionsData.filter(s => s.verification_result === 'pending_review').length;
      const approved = sessionsData.filter(s => s.verification_result === 'approved').length;
      const declined = sessionsData.filter(s => s.verification_result === 'declined').length;
      const highRisk = sessionsData.filter(s => s.risk_tier === 'high').length;

      setStats({ pending, approved, declined, highRisk });
    } catch (error) {
      console.error('Error fetching KYC sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSessions = () => {
    let filtered = [...sessions];

    // Filter by tab (verification_result)
    if (activeTab === 'pending') {
      filtered = filtered.filter(s => s.verification_result === 'pending_review');
    } else if (activeTab === 'approved') {
      filtered = filtered.filter(s => s.verification_result === 'approved');
    } else if (activeTab === 'declined') {
      filtered = filtered.filter(s => s.verification_result === 'declined');
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        session =>
          session.business_quotes?.quote_number.toLowerCase().includes(query) ||
          session.business_quotes?.customer_name.toLowerCase().includes(query) ||
          session.business_quotes?.company_name?.toLowerCase().includes(query)
      );
    }

    // Risk tier filter
    if (riskFilter !== 'all') {
      filtered = filtered.filter(session => session.risk_tier === riskFilter);
    }

    setFilteredSessions(filtered);
  };

  const getRiskBadge = (tier: 'low' | 'medium' | 'high') => {
    const config = {
      low: { label: 'Low Risk', className: 'bg-green-100 text-green-800', icon: CheckCircle },
      medium: { label: 'Medium Risk', className: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
      high: { label: 'High Risk', className: 'bg-red-100 text-red-800', icon: XCircle }
    };

    const { label, className, icon: Icon } = config[tier];
    return (
      <Badge className={`${className} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const getVerificationBadge = (result: 'approved' | 'declined' | 'pending_review') => {
    const config = {
      approved: { label: 'Approved', className: 'bg-green-100 text-green-800' },
      declined: { label: 'Declined', className: 'bg-red-100 text-red-800' },
      pending_review: { label: 'Pending Review', className: 'bg-circleTel-orange/20 text-circleTel-orange' }
    };

    const { label, className } = config[result];
    return <Badge className={className}>{label}</Badge>;
  };

  const getReviewDeadline = (createdAt: string) => {
    const created = new Date(createdAt);
    const deadline = new Date(created);
    deadline.setDate(deadline.getDate() + 3); // 3-day review deadline

    const now = new Date();
    const isOverdue = now > deadline;

    return {
      date: deadline.toLocaleDateString(),
      isOverdue
    };
  };

  const statsCards = [
    {
      title: 'Pending Review',
      value: stats.pending,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Approved',
      value: stats.approved,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Declined',
      value: stats.declined,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'High Risk',
      value: stats.highRisk,
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Compliance Queue</h1>
            <p className="text-gray-600 mt-1">Loading KYC sessions...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
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
            Compliance Queue
          </h1>
          <p className="text-gray-600 mt-1">
            Review and approve KYC verification sessions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSessions}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by quote number, customer name, or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Risk Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Tiers</SelectItem>
                <SelectItem value="low">Low Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs and Table */}
      <Card>
        <CardHeader>
          <CardTitle>KYC Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending">
                Pending Review ({stats.pending})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved ({stats.approved})
              </TabsTrigger>
              <TabsTrigger value="declined">
                Declined ({stats.declined})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {filteredSessions.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">No sessions found</p>
                  <p className="text-gray-500 text-sm mt-1">
                    {searchQuery || riskFilter !== 'all'
                      ? 'Try adjusting your filters'
                      : `No ${activeTab} KYC sessions`}
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
                          Customer
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Company
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Risk Tier
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Submitted Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Review Deadline
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredSessions.map((session) => {
                        const deadline = getReviewDeadline(session.created_at);
                        return (
                          <tr
                            key={session.id}
                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => setSelectedSession(session)}
                          >
                            <td className="px-4 py-4">
                              <div className="font-medium text-gray-900">
                                {session.business_quotes?.quote_number || 'N/A'}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="font-medium text-gray-900">
                                {session.business_quotes?.customer_name || 'N/A'}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900">
                                {session.business_quotes?.company_name || 'N/A'}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              {getVerificationBadge(session.verification_result)}
                            </td>
                            <td className="px-4 py-4">
                              {getRiskBadge(session.risk_tier)}
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900">
                                {new Date(session.created_at).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(session.created_at).toLocaleTimeString()}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className={`text-sm flex items-center gap-1 ${deadline.isOverdue ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                                <Calendar className="h-4 w-4" />
                                {deadline.date}
                                {deadline.isOverdue && (
                                  <Badge className="bg-red-100 text-red-800 ml-2">Overdue</Badge>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* KYC Detail Panel */}
      {selectedSession && (
        <KYCDetailPanel
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
          onApprove={async () => {
            await fetchSessions();
            setSelectedSession(null);
          }}
          onDecline={async () => {
            await fetchSessions();
            setSelectedSession(null);
          }}
          canApprove={canApproveCompliance}
        />
      )}
    </div>
  );
}
