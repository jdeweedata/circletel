'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { PiCheckCircleBold, PiWarningBold } from 'react-icons/pi';
import Link from 'next/link';

export type PendingAlertItem = {
  id: string;
  device_sn: string;
  device_name?: string;
  customer_name?: string;
  alert_type: string;
  severity: string;
  message: string;
  created_at: string;
};

type PendingAlertsCardProps = {
  alerts: PendingAlertItem[];
  acknowledging?: string | null;
  onAcknowledge?: (id: string) => void;
  className?: string;
};

function formatRelative(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function PendingAlertsCard({
  alerts,
  acknowledging,
  onAcknowledge,
  className,
}: PendingAlertsCardProps) {
  return (
    <Card className={cn('border border-slate-200/80 shadow-sm rounded-xl bg-white', className)}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-medium text-slate-800 inline-flex items-center gap-2">
          Pending Alerts
          {alerts.length > 0 ? (
            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-0">
              {alerts.length}
            </Badge>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">
            <PiWarningBold className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            No Data
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {alerts.slice(0, 6).map((alert) => (
              <li key={alert.id} className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-slate-900 truncate">
                    <Link
                      href={`/admin/network/devices/${alert.device_sn}`}
                      className="font-medium hover:text-blue-600"
                    >
                      {alert.device_name || alert.device_sn}
                    </Link>
                    <span className="text-slate-500"> · {alert.message}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {formatRelative(alert.created_at)}
                    {alert.customer_name ? ` · ${alert.customer_name}` : ''}
                  </p>
                </div>
                {onAcknowledge ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 h-8"
                    disabled={acknowledging === alert.id}
                    onClick={() => onAcknowledge(alert.id)}
                  >
                    <PiCheckCircleBold className="w-4 h-4 mr-1" />
                    Ack
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
