'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Clock, CheckCircle } from 'lucide-react';

interface CPQSession {
  id: string;
  created_at: string;
  status: string;
  step_data?: {
    customer?: {
      company_name?: string;
      contact_name?: string;
    };
    pricing?: {
      total_annual_cost?: number;
    };
  };
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  description?: string;
}

function StatCard({ icon, label, value, description }: StatCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="text-slate-600">
          {icon}
        </div>
      </div>
      <div className="mb-2">
        <p className="text-3xl font-bold text-slate-900">{value}</p>
      </div>
      <p className="text-sm font-medium text-slate-600">{label}</p>
      {description && (
        <p className="text-xs text-slate-500 mt-2">{description}</p>
      )}
    </div>
  );
}

export default function MITSCPQDashboard() {
  const [sessions, setSessions] = useState<CPQSession[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    submitted: 0,
    monthlyRevenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/mits-cpq/sessions');
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to fetch sessions');
        }

        const fetchedSessions = result.sessions || [];
        setSessions(fetchedSessions);

        // Calculate stats
        const total = fetchedSessions.length;
        const inProgress = fetchedSessions.filter((s: CPQSession) => s.status === 'draft').length;
        const submitted = fetchedSessions.filter((s: CPQSession) => s.status === 'submitted').length;

        // Calculate monthly revenue (sum of pricing totals created this month)
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyRevenue = fetchedSessions
          .filter((s: CPQSession) => new Date(s.created_at) >= monthStart)
          .reduce((sum, s) => sum + (s.step_data?.pricing?.total_annual_cost || 0), 0);

        setStats({
          total,
          inProgress,
          submitted,
          monthlyRevenue,
        });
      } catch (err) {
        console.error('Error fetching sessions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load sessions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Managed IT Services CPQ
          </h1>
          <p className="text-slate-600 mt-2">
            Create and manage MITS quotes
          </p>
        </div>
        <Link href="/admin/mits-cpq/new">
          <Button className="flex items-center gap-2 bg-orange text-white hover:bg-orange/90">
            <Plus className="h-4 w-4" />
            New Quote
          </Button>
        </Link>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">
            {error}
          </p>
        </div>
      )}

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm animate-pulse">
              <div className="h-10 w-10 bg-slate-200 rounded mb-4" />
              <div className="h-8 bg-slate-200 rounded w-20 mb-2" />
              <div className="h-4 bg-slate-200 rounded w-32" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={<FileText className="h-5 w-5" />}
            label="Total Quotes"
            value={stats.total}
            description={`${stats.submitted} submitted`}
          />
          <StatCard
            icon={<Clock className="h-5 w-5" />}
            label="In Progress"
            value={stats.inProgress}
            description="Drafts pending completion"
          />
          <StatCard
            icon={<CheckCircle className="h-5 w-5" />}
            label="Submitted"
            value={stats.submitted}
            description="Quotes sent to customers"
          />
          <StatCard
            icon={<FileText className="h-5 w-5" />}
            label="This Month Revenue"
            value={`R${stats.monthlyRevenue.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`}
            description="ARR from new quotes"
          />
        </div>
      )}

      {/* Recent Sessions */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Recent Quotes
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-600 mb-4">
              No sessions yet. Create your first quote!
            </p>
            <Link href="/admin/mits-cpq/new">
              <Button className="bg-orange text-white hover:bg-orange/90">
                Create Quote
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Company</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Contact</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Created</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Value</th>
                </tr>
              </thead>
              <tbody>
                {sessions.slice(0, 5).map((session) => (
                  <tr key={session.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      {session.step_data?.customer?.company_name || 'Untitled'}
                    </td>
                    <td className="py-3 px-4">
                      {session.step_data?.customer?.contact_name || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        session.status === 'submitted'
                          ? 'bg-green-100 text-green-700'
                          : session.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-slate-100 text-slate-700'
                      }`}>
                        {session.status === 'draft' ? 'In Progress' : session.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {new Date(session.created_at).toLocaleDateString('en-ZA')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {session.step_data?.pricing?.total_annual_cost
                        ? `R${session.step_data.pricing.total_annual_cost.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
