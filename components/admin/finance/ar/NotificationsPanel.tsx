'use client';

import { PiCalendarBold, PiChatBold, PiCheckCircleBold, PiEnvelopeBold, PiPulseBold, PiXCircleBold } from 'react-icons/pi';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { StatusBadge, type StatusVariant } from '@/components/backend';
import { CHANNEL_COLORS, formatCurrency, type ARAnalyticsData } from './shared';

export function NotificationsPanel({ data }: { data: ARAnalyticsData }) {
  const notificationPieData = [
    { name: 'SMS', value: data.notifications.total_sms, fill: CHANNEL_COLORS.sms },
    { name: 'Email', value: data.notifications.total_email, fill: CHANNEL_COLORS.email },
  ];

  const NOTIF_STATUS_VARIANT: Record<string, StatusVariant> = {
    sent: 'success',
    delivered: 'success',
    failed: 'error',
    bounced: 'error',
    opened: 'info',
    clicked: 'info',
  };

  const getStatusBadge = (status: string) => {
    const label =
      status === 'sent' || status === 'delivered'
        ? 'Delivered'
        : status.charAt(0).toUpperCase() + status.slice(1);
    return <StatusBadge status={label} variant={NOTIF_STATUS_VARIANT[status] ?? 'neutral'} />;
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Notification Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Channels</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={notificationPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {notificationPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <PiChatBold className="h-4 w-4 text-blue-500" />
                <span className="text-sm">SMS: {data.notifications.total_sms}</span>
              </div>
              <div className="flex items-center gap-2">
                <PiEnvelopeBold className="h-4 w-4 text-purple-500" />
                <span className="text-sm">Email: {data.notifications.total_email}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Stats */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Delivery Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <PiCheckCircleBold className="h-6 w-6 mx-auto text-green-500 mb-2" />
                <div className="text-xl font-bold">{data.notifications.total_delivered}</div>
                <p className="text-sm text-muted-foreground">Delivered</p>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <PiXCircleBold className="h-6 w-6 mx-auto text-red-500 mb-2" />
                <div className="text-xl font-bold">{data.notifications.total_failed}</div>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <PiPulseBold className="h-6 w-6 mx-auto text-blue-500 mb-2" />
                <div className="text-xl font-bold">{data.notifications.delivery_rate.toFixed(1)}%</div>
                <p className="text-sm text-muted-foreground">Delivery Rate</p>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <PiCalendarBold className="h-6 w-6 mx-auto text-purple-500 mb-2" />
                <div className="text-xl font-bold">{data.ar_aging.avg_days_overdue.toFixed(0)}</div>
                <p className="text-sm text-muted-foreground">Avg Days Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Notifications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
          <CardDescription>Last 20 notifications sent</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Days Overdue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recent_notifications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No notifications sent yet
                  </TableCell>
                </TableRow>
              ) : (
                data.recent_notifications.map((notif) => (
                  <TableRow key={notif.id}>
                    <TableCell className="font-medium">{notif.invoice_number}</TableCell>
                    <TableCell>
                      {notif.notification_type === 'sms' ? (
                        <Badge variant="outline" className="gap-1">
                          <PiChatBold className="h-3 w-3" /> SMS
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <PiEnvelopeBold className="h-3 w-3" /> Email
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">{notif.recipient}</TableCell>
                    <TableCell>{formatCurrency(notif.amount_due)}</TableCell>
                    <TableCell>{notif.days_overdue} days</TableCell>
                    <TableCell>{getStatusBadge(notif.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(notif.created_at).toLocaleString('en-ZA')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
