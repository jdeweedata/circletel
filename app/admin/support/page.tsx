'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  Ticket,
  Plus,
  Search,
  Filter,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  ArrowUpRight,
} from 'lucide-react';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  account_number: string;
}

interface SupportTicket {
  id: string;
  ticket_number: string;
  customer_id: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  assigned_agent_id: string | null;
  attachments: any[];
  created_at: string;
  updated_at: string;
  customers?: Customer;
}

interface Stats {
  total: number;
  open: number;
  pending: number;
  resolved: number;
  closed: number;
}

export default function SupportPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [tickets, searchQuery, statusFilter, priorityFilter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/support/tickets');
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch tickets');
      }

      setTickets(result.data || []);
      setStats(result.stats || null);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const filterTickets = () => {
    let filtered = [...tickets];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.ticket_number.toLowerCase().includes(query) ||
          t.subject.toLowerCase().includes(query) ||
          t.customers?.first_name?.toLowerCase().includes(query) ||
          t.customers?.last_name?.toLowerCase().includes(query) ||
          t.customers?.email?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter((t) => t.priority === priorityFilter);
    }

    setFilteredTickets(filtered);
    setCurrentPage(1);
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return 'bg-red-50 text-red-600 border-red-200';
      case 'high':
        return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'medium':
        return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      default:
        return 'bg-green-50 text-green-600 border-green-200';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'bg-green-50 text-green-600 border-green-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      case 'resolved':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'closed':
        return 'bg-gray-50 text-gray-600 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTickets = filteredTickets.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-circleTel-orange" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin" className="hover:text-gray-700">
          Home
        </Link>
        <span>/</span>
        <span className="text-gray-900">Support</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-sm text-gray-500 mt-1">Manage customer support requests</p>
        </div>
        <Link href="/admin/support/tickets/new">
          <Button className="bg-circleTel-orange hover:bg-circleTel-orange/90">
            <Plus className="w-4 h-4 mr-2" />
            New Ticket
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div
            className={cn(
              'relative overflow-hidden border border-gray-200 bg-white',
              'shadow-sm transition-all duration-200 rounded-lg p-4'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Ticket className="h-5 w-5 text-circleTel-orange" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
            </div>
          </div>
          <div
            className={cn(
              'relative overflow-hidden border border-gray-200 bg-white',
              'shadow-sm transition-all duration-200 rounded-lg p-4'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.open}</p>
                <p className="text-xs text-gray-500">Open</p>
              </div>
            </div>
          </div>
          <div
            className={cn(
              'relative overflow-hidden border border-gray-200 bg-white',
              'shadow-sm transition-all duration-200 rounded-lg p-4'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
            </div>
          </div>
          <div
            className={cn(
              'relative overflow-hidden border border-gray-200 bg-white',
              'shadow-sm transition-all duration-200 rounded-lg p-4'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.resolved}</p>
                <p className="text-xs text-gray-500">Resolved</p>
              </div>
            </div>
          </div>
          <div
            className={cn(
              'relative overflow-hidden border border-gray-200 bg-white',
              'shadow-sm transition-all duration-200 rounded-lg p-4'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.closed}</p>
                <p className="text-xs text-gray-500">Closed</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters Card */}
      <div
        className={cn(
          'relative overflow-hidden border border-gray-200 bg-white',
          'shadow-sm transition-all duration-200 rounded-lg'
        )}
      >
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Filter className="h-5 w-5 text-circleTel-orange" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Filters</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tickets Table Card */}
      <div
        className={cn(
          'relative overflow-hidden border border-gray-200 bg-white',
          'shadow-sm transition-all duration-200 rounded-lg'
        )}
      >
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Ticket className="h-5 w-5 text-circleTel-orange" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Tickets</h3>
            </div>
            <span className="text-sm text-gray-500">
              {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          {error ? (
            <div className="p-6 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 text-red-400" />
              <p className="text-sm text-red-600">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchTickets} className="mt-4">
                Retry
              </Button>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-6 text-center">
              <Ticket className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-500">No tickets found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Ticket
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/admin/support/tickets/${ticket.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{ticket.ticket_number}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[200px]">{ticket.subject}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {ticket.customers ? (
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {ticket.customers.first_name} {ticket.customers.last_name}
                            </p>
                            <p className="text-xs text-gray-500">{ticket.customers.email}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={getStatusBadgeClass(ticket.status)}>
                        {ticket.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={getPriorityBadgeClass(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 capitalize">{ticket.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {formatDate(ticket.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/support/tickets/${ticket.id}`);
                        }}
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredTickets.length)} of{' '}
              {filteredTickets.length} tickets
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
