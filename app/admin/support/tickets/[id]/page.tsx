'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, User, Tag, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Ticket {
  id: string;
  ticket_number: string;
  customer_id: string;
  customer_name?: string;
  customer_email?: string;
  subject: string;
  description: string;
  priority: string;
  category: string;
  status: string;
  assigned_agent_id: string | null;
  attachments: { name: string; size: number; type: string }[];
  created_at: string;
  updated_at: string;
}

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For now, show a placeholder since the ticket system is new
    setLoading(false);
    setTicket({
      id: ticketId,
      ticket_number: `TKT-${ticketId.slice(-7).toUpperCase()}`,
      customer_id: '',
      customer_name: 'Customer',
      customer_email: '',
      subject: 'Support Ticket',
      description: 'This ticket was recently created.',
      priority: 'medium',
      category: 'technical',
      status: 'open',
      assigned_agent_id: null,
      attachments: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }, [ticketId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-600 mb-4">Ticket not found</p>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin" className="hover:text-gray-700">Home</Link>
        <span>›</span>
        <Link href="/admin/support" className="hover:text-gray-700">Support</Link>
        <span>›</span>
        <span className="text-gray-900">{ticket.ticket_number}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{ticket.ticket_number}</h1>
            <p className="text-sm text-gray-500">{ticket.subject}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={getPriorityBadgeClass(ticket.priority)}>
            {ticket.priority}
          </Badge>
          <Badge variant="outline" className={getStatusBadgeClass(ticket.status)}>
            {ticket.status}
          </Badge>
        </div>
      </div>

      {/* Ticket Details */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Customer</p>
                <p className="text-sm font-medium text-gray-900">{ticket.customer_name || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Category</p>
                <p className="text-sm font-medium text-gray-900 capitalize">{ticket.category}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Created</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(ticket.created_at)}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Description</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {ticket.description || 'No description provided.'}
            </p>
          </div>

          {ticket.attachments && ticket.attachments.length > 0 && (
            <div className="border-t border-gray-100 pt-6 mt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Attachments</h3>
              <div className="space-y-2">
                {ticket.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>{attachment.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Actions</h3>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              Assign Agent
            </Button>
            <Button variant="outline" size="sm">
              Change Status
            </Button>
            <Button variant="outline" size="sm">
              Add Note
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
