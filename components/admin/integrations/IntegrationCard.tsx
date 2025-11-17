'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ExternalLink,
  Activity,
  Key,
  Webhook,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Integration {
  id: string;
  name: string;
  slug: string;
  category: string;
  health_status: 'healthy' | 'degraded' | 'down' | 'unknown';
  health_last_checked_at: string | null;
  description: string;
  has_oauth: boolean;
  has_webhook: boolean;
  is_enabled: boolean;
  consecutive_failures: number;
}

interface IntegrationCardProps {
  integration: Integration;
  onRefresh?: () => void;
}

export function IntegrationCard({ integration, onRefresh }: IntegrationCardProps) {
  // Health status configuration
  const healthConfig = {
    healthy: {
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      label: 'Healthy',
    },
    degraded: {
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      label: 'Degraded',
    },
    down: {
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      label: 'Down',
    },
    unknown: {
      icon: HelpCircle,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      label: 'Unknown',
    },
  };

  const status = healthConfig[integration.health_status];
  const HealthIcon = status.icon;

  return (
    <Card className={`border-l-4 ${status.borderColor} hover:shadow-lg transition-shadow`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900">{integration.name}</h3>
              {!integration.is_enabled && (
                <Badge variant="secondary" className="text-xs">
                  Disabled
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {integration.category}
              </Badge>
            </div>
          </div>
          <div className={`p-2 rounded-lg ${status.bgColor}`}>
            <HealthIcon className={`h-5 w-5 ${status.color}`} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        {integration.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {integration.description}
          </p>
        )}

        {/* Health Status */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Activity className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">Status:</span>
          </div>
          <Badge
            variant="outline"
            className={`${status.color} ${status.bgColor} border-0`}
          >
            {status.label}
          </Badge>
        </div>

        {/* Last Health Check */}
        {integration.health_last_checked_at && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>
              Checked{' '}
              {formatDistanceToNow(new Date(integration.health_last_checked_at), {
                addSuffix: true,
              })}
            </span>
          </div>
        )}

        {/* Consecutive Failures Warning */}
        {integration.consecutive_failures > 0 && (
          <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-md">
            <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <span className="text-xs text-red-700">
              {integration.consecutive_failures} consecutive failure
              {integration.consecutive_failures > 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Features */}
        <div className="flex items-center gap-2 flex-wrap">
          {integration.has_oauth && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Key className="h-3 w-3" />
              <span>OAuth</span>
            </div>
          )}
          {integration.has_webhook && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Webhook className="h-3 w-3" />
              <span>Webhook</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Link href={`/admin/integrations/${integration.slug}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
