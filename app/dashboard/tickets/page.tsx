'use client';

/**
 * Customer Tickets Page
 * View and manage support tickets from ZOHO Desk
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Ticket,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MessageSquare,
  Calendar,
} from 'lucide-react';
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';
import type { ZohoDeskTicket } from '@/lib/integrations/zoho/desk-service';

export default function TicketsPage() {
  const router = useRouter();
  const { user } = useCustomerAuth();
  const [tickets, setTickets] = useState<ZohoDeskTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  useEffect(() => {
    loadTickets();
  }, [user]);

  const loadTickets = async () => {
    if (!user?.email) return;

    try {
      setError(null);

      const response = await fetch(`/api/support/tickets/list?email=${encodeURIComponent(user.email)}`);

      if (!response.ok) {
        throw new Error('Failed to load tickets');
      }

      const data = await response.json();
      setTickets(data.tickets || []);
    } catch (err) {
      console.error('Failed to load tickets:', err);
      setError('Failed to load your tickets. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadTickets();
  };

  const statusColors = {
    Open: 'bg-blue-100 text-blue-800 border-blue-200',
    'On Hold': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Escalated: 'bg-red-100 text-red-800 border-red-200',
    Closed: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const priorityColors = {
    Low: 'bg-gray-100 text-gray-700',
    Medium: 'bg-blue-100 text-blue-700',
    High: 'bg-orange-100 text-orange-700',
    Urgent: 'bg-red-100 text-red-700',
  };

  const statusOptions = ['All', 'Open', 'On Hold', 'Escalated', 'Closed'];

  const filteredTickets = tickets.filter((ticket) => {
    if (selectedStatus === 'All') return true;
    return ticket.status === selectedStatus;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-circleTel-orange mx-auto mb-4" />
          <p className="text-gray-600">Loading your tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
          <p className="mt-2 text-gray-600">View and manage your support requests</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => router.push('/dashboard/support')}>
            <Plus className="mr-2 h-4 w-4" />
            New Ticket
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-900">
              {tickets.length}
            </div>
            <p className="text-xs text-gray-600">Total Tickets</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {tickets.filter((t) => t.status === 'Open').length}
            </div>
            <p className="text-xs text-gray-600">Open</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {tickets.filter((t) => t.status === 'On Hold' || t.status === 'Escalated').length}
            </div>
            <p className="text-xs text-gray-600">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {tickets.filter((t) => t.status === 'Closed').length}
            </div>
            <p className="text-xs text-gray-600">Resolved</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {statusOptions.map((status) => (
          <Button
            key={status}
            variant={selectedStatus === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedStatus(status)}
            className="whitespace-nowrap"
          >
            {status}
            {status !== 'All' && (
              <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                {tickets.filter((t) => t.status === status).length}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {selectedStatus === 'All' ? 'No Tickets Yet' : `No ${selectedStatus} Tickets`}
                </h3>
                <p className="text-gray-600 mb-6">
                  {selectedStatus === 'All'
                    ? "You haven't created any support tickets yet."
                    : `You don't have any ${selectedStatus.toLowerCase()} tickets.`}
                </p>
                <Button onClick={() => router.push('/dashboard/support')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Ticket
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredTickets.map((ticket) => (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        #{ticket.ticketNumber}
                      </Badge>
                      <Badge className={statusColors[ticket.status] || statusColors.Open}>
                        {ticket.status}
                      </Badge>
                      <Badge variant="outline" className={priorityColors[ticket.priority]}>
                        {ticket.priority}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                    <CardDescription className="mt-1">
                      {ticket.description.substring(0, 150)}
                      {ticket.description.length > 150 && '...'}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/dashboard/tickets/${ticket.id}`)}
                  >
                    View Details
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Created {formatDate(ticket.createdTime)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>Updated {formatDate(ticket.modifiedTime)}</span>
                  </div>
                  {ticket.commentCount !== undefined && ticket.commentCount > 0 && (
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>{ticket.commentCount} comments</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Help Text */}
      {tickets.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Need Help?</h3>
                <p className="text-sm text-blue-800">
                  Our support team typically responds within 24-48 hours. For urgent issues, please call
                  us at <a href="tel:0871503000" className="font-bold underline">087 150 3000</a>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
