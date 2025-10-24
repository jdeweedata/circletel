/**
 * CircleTel Admin - Notification History Page
 *
 * Displays full notification history with filtering and search
 */

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertCircle,
  Bell,
  Search,
  Filter,
  AlertTriangle,
  Info,
  DollarSign,
  User,
  Activity,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

// ============================================================================
// TYPES
// ============================================================================

interface Notification {
  id: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  icon: string | null;
  metadata: Record<string, any>;
  link_url: string | null;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
}

interface NotificationResponse {
  success: boolean;
  data: Notification[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    unread_count: number;
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function getNotificationIcon(type: string, priority: string) {
  const iconClass =
    priority === 'critical' || priority === 'high'
      ? 'text-red-500'
      : priority === 'medium'
      ? 'text-yellow-500'
      : 'text-blue-500';

  switch (type) {
    case 'product_approval':
      return <AlertTriangle className={`h-5 w-5 ${iconClass}`} />;
    case 'price_change':
      return <DollarSign className={`h-5 w-5 ${iconClass}`} />;
    case 'system_update':
      return <Info className={`h-5 w-5 ${iconClass}`} />;
    case 'user_activity':
      return <User className={`h-5 w-5 ${iconClass}`} />;
    case 'error_alert':
      return <AlertCircle className={`h-5 w-5 ${iconClass}`} />;
    case 'performance_warning':
      return <Activity className={`h-5 w-5 ${iconClass}`} />;
    default:
      return <Bell className={`h-5 w-5 ${iconClass}`} />;
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function NotificationHistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Build query params
  const queryParams = new URLSearchParams();
  if (typeFilter !== 'all') queryParams.set('type', typeFilter);
  if (statusFilter === 'read') queryParams.set('is_read', 'true');
  if (statusFilter === 'unread') queryParams.set('is_read', 'false');

  // Fetch notifications
  const { data, isLoading, error, refetch } = useQuery<NotificationResponse>({
    queryKey: ['notifications-history', typeFilter, statusFilter],
    queryFn: async () => {
      const response = await fetch(`/api/notifications?limit=50&${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      return response.json();
    },
  });

  const notifications = data?.data || [];

  // Filter by search query
  const filteredNotifications = notifications.filter((n) =>
    searchQuery
      ? n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-circleTel-darkNeutral">Notifications</h1>
        <p className="text-muted-foreground mt-1">
          View and manage all your notifications
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Type filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="product_approval">Product Approval</SelectItem>
                <SelectItem value="price_change">Price Change</SelectItem>
                <SelectItem value="system_update">System Update</SelectItem>
                <SelectItem value="user_activity">User Activity</SelectItem>
                <SelectItem value="error_alert">Error Alert</SelectItem>
                <SelectItem value="performance_warning">Performance Warning</SelectItem>
              </SelectContent>
            </Select>

            {/* Status filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Notification History</span>
            {data && (
              <Badge variant="secondary">
                {data.pagination.total} total, {data.pagination.unread_count} unread
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Failed to load notifications</AlertDescription>
            </Alert>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? 'No notifications match your search'
                  : 'No notifications found'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onUpdate={refetch}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// NOTIFICATION ITEM COMPONENT
// ============================================================================

interface NotificationItemProps {
  notification: Notification;
  onUpdate: () => void;
}

function NotificationItem({ notification, onUpdate }: NotificationItemProps) {
  const handleMarkRead = async () => {
    try {
      await fetch(`/api/notifications/${notification.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: true }),
      });
      onUpdate();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const content = (
    <div
      className={`flex gap-4 p-4 rounded-lg border transition-colors hover:bg-muted/50 ${
        !notification.is_read ? 'bg-circleTel-orange/5 border-circleTel-orange/20' : ''
      }`}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-1">
        {getNotificationIcon(notification.type, notification.priority)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p
              className={`text-sm font-medium ${
                !notification.is_read ? 'text-circleTel-darkNeutral' : 'text-muted-foreground'
              }`}
            >
              {notification.title}
            </p>
            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!notification.is_read && (
              <Button variant="ghost" size="sm" onClick={handleMarkRead}>
                Mark as Read
              </Button>
            )}
            <Badge variant={notification.is_read ? 'secondary' : 'default'}>
              {notification.is_read ? 'Read' : 'Unread'}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );

  if (notification.link_url) {
    return <Link href={notification.link_url}>{content}</Link>;
  }

  return content;
}
