'use client';

/**
 * CircleTel Notification System - Notification Dropdown Component
 *
 * Displays list of recent notifications in dropdown panel.
 */

import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import {
  Bell,
  AlertCircle,
  AlertTriangle,
  Info,
  DollarSign,
  User,
  Activity,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: Error | null;
  onNotificationClick: (notificationId: string) => void;
  onMarkAllRead: () => void;
  onDismiss: (notificationId: string) => void;
  onClose: () => void;
}

// ============================================================================
// HELPERS
// ============================================================================

function getNotificationIcon(type: string, priority: string) {
  const iconClass = priority === 'critical' || priority === 'high'
    ? 'text-red-500'
    : priority === 'medium'
    ? 'text-yellow-500'
    : 'text-blue-500';

  switch (type) {
    case 'product_approval':
      return <AlertTriangle className={`h-4 w-4 ${iconClass}`} />;
    case 'price_change':
      return <DollarSign className={`h-4 w-4 ${iconClass}`} />;
    case 'system_update':
      return <Info className={`h-4 w-4 ${iconClass}`} />;
    case 'user_activity':
      return <User className={`h-4 w-4 ${iconClass}`} />;
    case 'error_alert':
      return <AlertCircle className={`h-4 w-4 ${iconClass}`} />;
    case 'performance_warning':
      return <Activity className={`h-4 w-4 ${iconClass}`} />;
    default:
      return <Bell className={`h-4 w-4 ${iconClass}`} />;
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function NotificationDropdown({
  notifications,
  unreadCount,
  isLoading,
  error,
  onNotificationClick,
  onMarkAllRead,
  onDismiss,
  onClose,
}: NotificationDropdownProps) {
  // Filter out dismissed notifications
  const visibleNotifications = notifications.filter((n) => !n.is_dismissed);

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-circleTel-orange" />
          <h3 className="font-semibold text-circleTel-darkNeutral">Notifications</h3>
          {unreadCount > 0 && (
            <span className="text-xs text-muted-foreground">
              ({unreadCount} unread)
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMarkAllRead}
            className="text-xs text-circleTel-orange hover:text-circleTel-orange/90"
          >
            Mark all read
          </Button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          Loading notifications...
        </div>
      ) : error ? (
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load notifications</AlertDescription>
        </Alert>
      ) : visibleNotifications.length === 0 ? (
        <div className="p-8 text-center">
          <Bell className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No notifications</p>
        </div>
      ) : (
        <ScrollArea className="max-h-96">
          <div className="divide-y">
            {visibleNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => {
                  onNotificationClick(notification.id);
                  if (notification.link_url) {
                    onClose();
                  }
                }}
                onDismiss={() => onDismiss(notification.id)}
              />
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Footer */}
      <Separator />
      <div className="p-2">
        <Link href="/admin/notifications" onClick={onClose}>
          <Button
            variant="ghost"
            className="w-full text-sm text-circleTel-orange hover:text-circleTel-orange/90 hover:bg-circleTel-orange/10"
          >
            View all notifications
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ============================================================================
// NOTIFICATION ITEM COMPONENT
// ============================================================================

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
  onDismiss: () => void;
}

function NotificationItem({ notification, onClick, onDismiss }: NotificationItemProps) {
  const content = (
    <div
      className={`flex gap-3 p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
        !notification.is_read ? 'bg-circleTel-orange/5' : ''
      }`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-1">
        {getNotificationIcon(notification.type, notification.priority)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-sm font-medium ${
              !notification.is_read
                ? 'text-circleTel-darkNeutral'
                : 'text-muted-foreground'
            }`}
          >
            {notification.title}
          </p>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            aria-label="Dismiss notification"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          {formatDistanceToNow(new Date(notification.created_at), {
            addSuffix: true,
          })}
        </p>
      </div>

      {/* Unread indicator */}
      {!notification.is_read && (
        <div className="flex-shrink-0">
          <div className="h-2 w-2 rounded-full bg-circleTel-orange" />
        </div>
      )}
    </div>
  );

  // Wrap in Link if there's a link_url
  if (notification.link_url) {
    return <Link href={notification.link_url}>{content}</Link>;
  }

  return content;
}
