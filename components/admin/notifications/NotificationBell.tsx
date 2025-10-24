'use client';

/**
 * CircleTel Notification System - Notification Bell Component
 *
 * Displays notification bell icon with unread count badge in admin header.
 * Opens dropdown with recent notifications on click.
 */

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { NotificationDropdown } from './NotificationDropdown';
import { useQuery } from '@tanstack/react-query';

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
// COMPONENT
// ============================================================================

export function NotificationBell() {
  const [open, setOpen] = useState(false);

  // Fetch notifications
  const { data, isLoading, error, refetch } = useQuery<NotificationResponse>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await fetch('/api/notifications?limit=10');
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const unreadCount = data?.pagination.unread_count || 0;
  const notifications = data?.data || [];

  // Handle notification click
  const handleNotificationClick = async (notificationId: string) => {
    try {
      // Mark as read
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: true }),
      });

      // Refetch notifications
      refetch();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Handle mark all as read
  const handleMarkAllRead = async () => {
    try {
      const unreadIds = notifications
        .filter((n) => !n.is_read && !n.is_dismissed)
        .map((n) => n.id);

      if (unreadIds.length === 0) return;

      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_ids: unreadIds }),
      });

      // Refetch notifications
      refetch();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Handle dismiss
  const handleDismiss = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_dismissed: true }),
      });

      // Refetch notifications
      refetch();
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-96 p-0"
        align="end"
        sideOffset={8}
      >
        <NotificationDropdown
          notifications={notifications}
          unreadCount={unreadCount}
          isLoading={isLoading}
          error={error as Error | null}
          onNotificationClick={handleNotificationClick}
          onMarkAllRead={handleMarkAllRead}
          onDismiss={handleDismiss}
          onClose={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}
