'use client';

import { Cell, Pie, PieChart } from 'recharts';
import { PiCalendarBold, PiChatBold, PiCheckCircleBold, PiEnvelopeBold, PiPulseBold, PiXCircleBold } from 'react-icons/pi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { StatusBadge, type StatusVariant } from '@/components/backend';
import { CHANNEL_COLORS, formatCurrency, type ARAnalyticsData } from './shared';

const chartConfig = {
  value: { label: 'Sent' },
  SMS: { label: 'SMS', color: CHANNEL_COLORS.sms },
  Email: { label: 'Email', color: CHANNEL_COLORS.email },
} satisfies ChartConfig;

const NOTIF_STATUS_VARIANT: Record<string, StatusVariant> = {
  sent: 'success',
  delivered: 'success',
  failed: 'error',
  bounced: 'error',
  opened: 'info',
  clicked: 'info',
};

function notifStatusBadge(status: string) {
  const label =
    status === 'sent' || status === 'delivered'
      ? 'Delivered'
      : status.charAt(0).toUpperCase() + status.slice(1);
  return <StatusBadge status={label} variant={NOTIF_STATUS_VARIANT[status] ?? 'neutral'} />;
}

export function NotificationsPanel({ data }: { data: ARAnalyticsData }) {
  const channelData = [
    { name: 'SMS', value: data.notifications.total_sms, fill: CHANNEL_COLORS.sms },
    { name: 'Email', value: data.notifications.total_email, fill: CHANNEL_COLORS.email },
  ];

  const deliveryTiles = [
    {
      label: 'Delivered',
      value: `${data.notifications.total_delivered}`,
      icon: <PiCheckCircleBold className="h-5 w-5 text-emerald-600" aria-hidden="true" />,
    },
    {
      label: 'Failed',
      value: `${data.notifications.total_failed}`,
      icon: <PiXCircleBold className="h-5 w-5 text-red-600" aria-hidden="true" />,
    },
    {
      label: 'Delivery rate',
      value: `${data.notifications.delivery_rate.toFixed(1)}%`,
      icon: <PiPulseBold className="h-5 w-5 text-blue-600" aria-hidden="true" />,
    },
    {
      label: 'Avg days overdue',
      value: data.ar_aging.avg_days_overdue.toFixed(0),
      icon: <PiCalendarBold className="h-5 w-5 text-amber-600" aria-hidden="true" />,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="rounded-xl border-slate-200/80 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-900">
              Notification Channels
            </CardTitle>
            <p className="text-xs text-slate-500">Share of sends by channel</p>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="aspect-auto h-[200px] w-full">
              <PieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                <Pie data={channelData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} strokeWidth={2}>
                  {channelData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="mt-3 flex justify-center gap-4 text-sm">
              <span className="inline-flex items-center gap-2 text-slate-600">
                <PiChatBold className="h-4 w-4" style={{ color: CHANNEL_COLORS.sms }} aria-hidden="true" />
                SMS: <span className="tabular-nums font-medium text-slate-900">{data.notifications.total_sms}</span>
              </span>
              <span className="inline-flex items-center gap-2 text-slate-600">
                <PiEnvelopeBold className="h-4 w-4" style={{ color: CHANNEL_COLORS.email }} aria-hidden="true" />
                Email: <span className="tabular-nums font-medium text-slate-900">{data.notifications.total_email}</span>
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 rounded-xl border-slate-200/80 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-900">
              Delivery Statistics
            </CardTitle>
            <p className="text-xs text-slate-500">Outcome of sends in the selected window</p>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {deliveryTiles.map(({ label, value, icon }) => (
              <div key={label} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                {icon}
                <p className="text-xs text-slate-500 mt-2">{label}</p>
                <p className="text-xl font-semibold tabular-nums text-slate-900 mt-0.5">{value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl border-slate-200/80 shadow-sm bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">
              Recent Notifications
            </CardTitle>
            <p className="text-xs text-slate-500">Last 20 notifications sent</p>
          </div>
          <span className="text-xs font-medium text-slate-500">
            {data.recent_notifications.length} shown
          </span>
        </CardHeader>
        <CardContent>
          {data.recent_notifications.length === 0 ? (
            <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 py-10 text-sm text-slate-400">
              No notifications sent yet
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200/80">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    {['Invoice', 'Type', 'Recipient', 'Amount', 'Days overdue', 'Status', 'Sent'].map((h, i) => (
                      <th
                        key={h}
                        className={`px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500 ${
                          i === 3 || i === 4 ? 'text-right' : 'text-left'
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.recent_notifications.map((notif) => (
                    <tr key={notif.id} className="transition-colors hover:bg-slate-50">
                      <td className="whitespace-nowrap px-3 py-2.5 font-medium text-slate-900">
                        {notif.invoice_number}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-600">
                          {notif.notification_type === 'sms' ? (
                            <>
                              <PiChatBold className="h-3 w-3" style={{ color: CHANNEL_COLORS.sms }} aria-hidden="true" />
                              SMS
                            </>
                          ) : (
                            <>
                              <PiEnvelopeBold className="h-3 w-3" style={{ color: CHANNEL_COLORS.email }} aria-hidden="true" />
                              Email
                            </>
                          )}
                        </span>
                      </td>
                      <td className="max-w-[180px] truncate px-3 py-2.5 text-slate-700">
                        {notif.recipient}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold tabular-nums text-slate-900">
                        {formatCurrency(notif.amount_due)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-slate-600">
                        {notif.days_overdue}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">{notifStatusBadge(notif.status)}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-xs text-slate-500">
                        {new Date(notif.created_at).toLocaleString('en-ZA')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
