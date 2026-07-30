'use client';

import { PiCalendarBold } from 'react-icons/pi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { CHANNEL_COLORS, formatCurrency, formatShortDate, type ARAnalyticsData } from './shared';

export function HistoryPanel({ data }: { data: ARAnalyticsData }) {
  return data.historical && data.historical.length > 0 ? (
    <>
      <Card>
        <CardHeader>
          <CardTitle>AR & DSO Trend</CardTitle>
          <CardDescription>Historical outstanding amount and DSO</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.historical}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="snapshot_date" tickFormatter={formatShortDate} />
              <YAxis yAxisId="left" tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`} />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip
                formatter={(value: number, name: string) => [
                  name === 'total_outstanding' ? formatCurrency(value) : value.toFixed(1),
                  name === 'total_outstanding' ? 'Outstanding' : 'DSO',
                ]}
                labelFormatter={formatShortDate}
              />
              <Legend />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="total_outstanding"
                name="Outstanding"
                stroke="#F5831F"
                fill="#F5831F"
                fillOpacity={0.3}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="dso_current"
                name="DSO"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications & Collections</CardTitle>
          <CardDescription>Daily notification activity and payments received</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.historical}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="snapshot_date" tickFormatter={formatShortDate} />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`} />
              <Tooltip labelFormatter={formatShortDate} />
              <Legend />
              <Bar yAxisId="left" dataKey="sms_sent_count" name="SMS" fill={CHANNEL_COLORS.sms} />
              <Bar yAxisId="left" dataKey="email_sent_count" name="Email" fill={CHANNEL_COLORS.email} />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="payments_received_amount"
                name="Payments"
                stroke="#22c55e"
                strokeWidth={2}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </>
  ) : (
    <Card>
      <CardContent className="py-10 text-center">
        <PiCalendarBold className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No historical data available yet</p>
        <p className="text-sm text-muted-foreground mt-2">
          Historical snapshots are created daily by the system
        </p>
      </CardContent>
    </Card>
  );
}
