'use client';

/**
 * CircleTel Notification System - Notification Preferences Component
 *
 * Allows users to configure which notifications they receive and how.
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Save } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface NotificationPreference {
  user_id: string;
  notification_type: string;
  in_app_enabled: boolean;
  email_enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface PreferencesResponse {
  success: boolean;
  data: NotificationPreference[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const NOTIFICATION_TYPE_LABELS: Record<string, { title: string; description: string }> = {
  product_approval: {
    title: 'Product Approval Requests',
    description: 'When a product is submitted for your approval',
  },
  price_change: {
    title: 'Price Change Alerts',
    description: 'When product prices change by more than 10%',
  },
  system_update: {
    title: 'System Updates',
    description: 'Platform deployments and new features',
  },
  user_activity: {
    title: 'User Activity',
    description: 'New customer signups and large orders',
  },
  error_alert: {
    title: 'Error Alerts',
    description: 'API failures, coverage check failures, payment errors',
  },
  performance_warning: {
    title: 'Performance Warnings',
    description: 'Slow API responses and cache performance issues',
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function NotificationPreferences() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);

  // Fetch preferences
  const { data, isLoading, error } = useQuery<PreferencesResponse>({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const response = await fetch('/api/notifications/preferences');
      if (!response.ok) {
        throw new Error('Failed to fetch preferences');
      }
      return response.json();
    },
  });

  // Update local state when data is fetched
  useEffect(() => {
    if (data?.data) {
      setPreferences(data.data);
    }
  }, [data]);

  // Save preferences mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: preferences.map((p) => ({
            notification_type: p.notification_type,
            in_app_enabled: p.in_app_enabled,
            email_enabled: p.email_enabled,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Preferences saved',
        description: 'Your notification preferences have been updated.',
      });
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to save preferences. Please try again.',
        variant: 'destructive',
      });
      console.error('Error saving preferences:', error);
    },
  });

  // Handle preference toggle
  const handleToggle = (notificationType: string, channel: 'in_app' | 'email', enabled: boolean) => {
    setPreferences((prev) =>
      prev.map((pref) =>
        pref.notification_type === notificationType
          ? {
              ...pref,
              ...(channel === 'in_app'
                ? { in_app_enabled: enabled }
                : { email_enabled: enabled }),
            }
          : pref
      )
    );
  };

  // Check if all notifications are disabled
  const allDisabled = preferences.every((p) => !p.in_app_enabled && !p.email_enabled);

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle className="text-circleTel-orange">Notification Preferences</CardTitle>
        <CardDescription>
          Configure which notifications you receive and how you want to be notified.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Loading preferences...
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Failed to load preferences</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            {/* Warning if all disabled */}
            {allDisabled && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You have disabled all notifications. You won't receive any alerts.
                </AlertDescription>
              </Alert>
            )}

            {/* Preferences list */}
            <div className="space-y-6">
              {preferences.map((pref, index) => {
                const info = NOTIFICATION_TYPE_LABELS[pref.notification_type];
                if (!info) return null;

                return (
                  <div key={pref.notification_type}>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-circleTel-darkNeutral">
                          {info.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">{info.description}</p>
                      </div>

                      <div className="flex items-center gap-8 pl-4">
                        {/* In-App toggle */}
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`${pref.notification_type}-in-app`}
                            checked={pref.in_app_enabled}
                            onCheckedChange={(checked) =>
                              handleToggle(pref.notification_type, 'in_app', checked)
                            }
                          />
                          <Label
                            htmlFor={`${pref.notification_type}-in-app`}
                            className="text-sm cursor-pointer"
                          >
                            In-App
                          </Label>
                        </div>

                        {/* Email toggle */}
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`${pref.notification_type}-email`}
                            checked={pref.email_enabled}
                            onCheckedChange={(checked) =>
                              handleToggle(pref.notification_type, 'email', checked)
                            }
                          />
                          <Label
                            htmlFor={`${pref.notification_type}-email`}
                            className="text-sm cursor-pointer"
                          >
                            Email
                          </Label>
                        </div>
                      </div>
                    </div>

                    {index < preferences.length - 1 && <Separator className="mt-6" />}
                  </div>
                );
              })}
            </div>

            {/* Save button */}
            <div className="flex justify-end pt-4">
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="bg-circleTel-orange hover:bg-circleTel-orange/90"
              >
                <Save className="h-4 w-4 mr-2" />
                {saveMutation.isPending ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
