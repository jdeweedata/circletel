'use client';
import { PiArrowsClockwiseBold, PiCheckCircleBold, PiClockBold, PiDotsThreeVerticalBold, PiEyeBold, PiFileTextBold, PiFunnelBold, PiMagnifyingGlassBold, PiPlusBold, PiSpinnerBold, PiTrashBold, PiWarningCircleBold, PiXCircleBold } from 'react-icons/pi';

/**
 * CPQ Dashboard
 *
 * Lists all CPQ sessions with filtering and stats
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import type { CPQSession, CPQSessionStatus } from '@/lib/cpq/types';

const STATUS_CONFIG: Record<
  CPQSessionStatus,
  { label: string; color: string; icon: typeof PiCheckCircleBold }
> = {
  draft: { label: 'Draft', color: 'text-gray-500 bg-gray-100', icon: PiFileTextBold },
  in_progress: { label: 'In Progress', color: 'text-blue-700 bg-blue-100', icon: PiClockBold },
  pending_approval: {
    label: 'Pending Approval',
    color: 'text-amber-700 bg-amber-100',
    icon: PiWarningCircleBold,
  },
  approved: { label: 'Approved', color: 'text-green-700 bg-green-100', icon: PiCheckCircleBold },
  converted: { label: 'Converted', color: 'text-purple-700 bg-purple-100', icon: PiCheckCircleBold },
  expired: { label: 'Expired', color: 'text-red-700 bg-red-100', icon: PiXCircleBold },
  cancelled: { label: 'Cancelled', color: 'text-red-700 bg-red-100', icon: PiXCircleBold },
};

export default function CPQDashboardPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<CPQSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    pendingApproval: 0,
    converted: 0,
  });

  // Load sessions
  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }

      const response = await fetch(`/api/cpq/sessions?${params.toString()}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error(result.error || 'Failed to load sessions');
        return;
      }

      setSessions(result.sessions || []);
      setTotal(result.total || 0);

      // Calculate stats
      const allSessions = result.sessions || [];
      setStats({
        total: allSessions.length,
        inProgress: allSessions.filter((s: CPQSession) => s.status === 'in_progress').length,
        pendingApproval: allSessions.filter((s: CPQSession) => s.status === 'pending_approval')
          .length,
        converted: allSessions.filter((s: CPQSession) => s.status === 'converted').length,
      });
    } catch (error) {
      console.error('Load sessions error:', error);
      toast.error('Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Handle create new
  const handleCreateNew = () => {
    router.push('/admin/cpq/new');
  };

  // Handle view session
  const handleViewSession = (sessionId: string) => {
    router.push(`/admin/cpq/${sessionId}`);
  };

  // Handle cancel session
  const handleCancelSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to cancel this session?')) return;

    try {
      const response = await fetch(`/api/cpq/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Session cancelled');
        loadSessions();
      } else {
        const result = await response.json();
        toast.error(result.error || 'Failed to cancel session');
      }
    } catch (error) {
      toast.error('Failed to cancel session');
    }
  };

  // Filter sessions by search
  const filteredSessions = sessions.filter((session) => {
    if (!searchQuery) return true;

    const customerName =
      session.step_data?.customer_details?.company_name?.toLowerCase() || '';
    const contactName =
      session.step_data?.customer_details?.primary_contact?.name?.toLowerCase() || '';

    return (
      customerName.includes(searchQuery.toLowerCase()) ||
      contactName.includes(searchQuery.toLowerCase()) ||
      session.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CPQ Sessions</h1>
          <p className="text-sm text-gray-500">Configure, Price, Quote wizard sessions</p>
        </div>
        <Button onClick={handleCreateNew} className="bg-circleTel-orange hover:bg-orange-600">
          <PiPlusBold className="h-4 w-4 mr-2" />
          New Quote
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Total Sessions</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-blue-600">In Progress</p>
          <p className="text-2xl font-bold text-blue-700">{stats.inProgress}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-amber-600">Pending Approval</p>
          <p className="text-2xl font-bold text-amber-700">{stats.pendingApproval}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-green-600">Converted</p>
          <p className="text-2xl font-bold text-green-700">{stats.converted}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 bg-white rounded-lg border p-4">
        <div className="flex-1">
          <div className="relative">
            <PiMagnifyingGlassBold className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by company, contact, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PiFunnelBold className="h-4 w-4 text-gray-400" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="pending_approval">Pending Approval</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={loadSessions} disabled={isLoading}>
          <PiArrowsClockwiseBold className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Sessions List */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <PiSpinnerBold className="h-8 w-8 animate-spin text-circleTel-orange" />
            <span className="ml-2 text-gray-500">Loading sessions...</span>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-12">
            <PiFileTextBold className="h-12 w-12 mx-auto text-gray-300" />
            <p className="mt-4 text-gray-500">No sessions found</p>
            <Button onClick={handleCreateNew} className="mt-4">
              <PiPlusBold className="h-4 w-4 mr-2" />
              Create Your First Quote
            </Button>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Session ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Step
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Created
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredSessions.map((session) => {
                const statusConfig = STATUS_CONFIG[session.status];
                const StatusIcon = statusConfig.icon;
                const customerName =
                  session.step_data?.customer_details?.company_name || 'No customer yet';

                return (
                  <tr
                    key={session.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleViewSession(session.id)}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-gray-600">
                        {session.id.slice(0, 8)}...
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{customerName}</p>
                        {session.step_data?.customer_details?.primary_contact?.name && (
                          <p className="text-sm text-gray-500">
                            {session.step_data.customer_details.primary_contact.name}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        Step {session.current_step} of 7
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(session.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <PiDotsThreeVerticalBold className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewSession(session.id);
                            }}
                          >
                            <PiEyeBold className="h-4 w-4 mr-2" />
                            View / Edit
                          </DropdownMenuItem>
                          {!['converted', 'cancelled'].includes(session.status) && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelSession(session.id);
                              }}
                              className="text-red-600"
                            >
                              <PiTrashBold className="h-4 w-4 mr-2" />
                              Cancel
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination placeholder */}
      {filteredSessions.length > 0 && (
        <div className="text-sm text-gray-500 text-center">
          Showing {filteredSessions.length} of {total} sessions
        </div>
      )}
    </div>
  );
}
