'use client';

/**
 * AR Analytics Dashboard
 * /admin/finance/ar-analytics
 *
 * Comprehensive Accounts Receivable analytics including:
 * - AR Aging breakdown
 * - DSO (Days Sales Outstanding) metrics
 * - Notification tracking and effectiveness
 * - Collection performance
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Clock,
  Mail,
  MessageSquare,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  Target,
  Activity,
} from 'lucide-react';

// Types
interface ARAnalyticsData {
  ar_aging: {
    total_outstanding_invoices: number;
    total_outstanding_amount: number;
    current_count: number;
    current_amount: number;
    overdue_1_30_count: number;
    overdue_1_30_amount: number;
    overdue_31_60_count: number;
    overdue_31_60_amount: number;
    overdue_61_90_count: number;
    overdue_61_90_amount: number;
    overdue_90_plus_count: number;
    overdue_90_plus_amount: number;
    avg_days_overdue: number;
  };
  dso: {
    dso_current: number;
    dso_30_day_avg: number;
    dso_trend: 'improving' | 'stable' | 'worsening';
    best_possible_dso: number;
    collection_effectiveness_index: number;
  };
  collection: {
    total_notifications_sent: number;
    total_amount_collected: number;
    collection_rate: number;
    avg_days_to_payment: number;
    response_rate: number;
  };
  notifications: {
    total_sms: number;
    total_email: number;
    total_delivered: number;
    total_failed: number;
    delivery_rate: number;
  };
  daily_analytics: Array<{
    date: string;
    notification_type: string;
    total_sent: number;
    delivered: number;
    failed: number;
    total_amount_notified: number;
  }>;
  recent_notifications: Array<{
    id: string;
    invoice_number: string;
    notification_type: string;
    recipient: string;
    status: string;
    amount_due: number;
    days_overdue: number;
    created_at: string;
  }>;
  historical: Array<{
    snapshot_date: string;
    total_outstanding: number;
    dso_current: number;
    sms_sent_count: number;
    email_sent_count: number;
    payments_received_amount: number;
  }> | null;
}

const COLORS = {
  current: '#22c55e',
  overdue_1_30: '#eab308',
  overdue_31_60: '#f97316',
  overdue_61_90: '#ef4444',
  overdue_90_plus: '#991b1b',
  sms: '#3b82f6',
  email: '#8b5cf6',
};

export default function ARAnalyticsPage() {
  const [data, setData] = useState<ARAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/admin/finance/ar-analytics?days=${period}&history=true`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch AR analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-ZA', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      case 'worsening':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <Badge variant="default" className="bg-green-500">Delivered</Badge>;
      case 'failed':
      case 'bounced':
        return <Badge variant="destructive">Failed</Badge>;
      case 'opened':
        return <Badge variant="default" className="bg-blue-500">Opened</Badge>;
      case 'clicked':
        return <Badge variant="default" className="bg-purple-500">Clicked</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-10 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
            <p className="text-muted-foreground">Failed to load AR analytics</p>
            <Button onClick={handleRefresh} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare chart data
  const agingChartData = [
    { name: 'Current', amount: data.ar_aging.current_amount, count: data.ar_aging.current_count, fill: COLORS.current },
    { name: '1-30 Days', amount: data.ar_aging.overdue_1_30_amount, count: data.ar_aging.overdue_1_30_count, fill: COLORS.overdue_1_30 },
    { name: '31-60 Days', amount: data.ar_aging.overdue_31_60_amount, count: data.ar_aging.overdue_31_60_count, fill: COLORS.overdue_31_60 },
    { name: '61-90 Days', amount: data.ar_aging.overdue_61_90_amount, count: data.ar_aging.overdue_61_90_count, fill: COLORS.overdue_61_90 },
    { name: '90+ Days', amount: data.ar_aging.overdue_90_plus_amount, count: data.ar_aging.overdue_90_plus_count, fill: COLORS.overdue_90_plus },
  ];

  const notificationPieData = [
    { name: 'SMS', value: data.notifications.total_sms, fill: COLORS.sms },
    { name: 'Email', value: data.notifications.total_email, fill: COLORS.email },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">AR Analytics & Collections</h1>
          <p className="text-muted-foreground">
            Accounts Receivable, DSO tracking, and notification effectiveness
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 Days</SelectItem>
              <SelectItem value="30">30 Days</SelectItem>
              <SelectItem value="60">60 Days</SelectItem>
              <SelectItem value="90">90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Outstanding */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Outstanding
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(data.ar_aging.total_outstanding_amount)}
            </div>
            <p className="text-sm text-muted-foreground">
              {data.ar_aging.total_outstanding_invoices} invoices
            </p>
          </CardContent>
        </Card>

        {/* DSO */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Days Sales Outstanding
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{data.dso.dso_current.toFixed(1)}</span>
              {getTrendIcon(data.dso.dso_trend)}
            </div>
            <p className="text-sm text-muted-foreground">
              30-day avg: {data.dso.dso_30_day_avg.toFixed(1)} days
            </p>
          </CardContent>
        </Card>

        {/* Collection Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Collection Rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data.collection.collection_rate.toFixed(1)}%
            </div>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(data.collection.total_amount_collected)} collected
            </p>
          </CardContent>
        </Card>

        {/* Notifications Sent */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Notifications Sent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.notifications.total_sms + data.notifications.total_email}
            </div>
            <p className="text-sm text-muted-foreground">
              {data.notifications.delivery_rate.toFixed(1)}% delivery rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="aging" className="space-y-4">
        <TabsList>
          <TabsTrigger value="aging">AR Aging</TabsTrigger>
          <TabsTrigger value="dso">DSO & Metrics</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* AR Aging Tab */}
        <TabsContent value="aging" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Aging Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>AR Aging Breakdown</CardTitle>
                <CardDescription>Outstanding amounts by aging bucket</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={agingChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), 'Amount']}
                    />
                    <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                      {agingChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Aging Table */}
            <Card>
              <CardHeader>
                <CardTitle>Aging Summary</CardTitle>
                <CardDescription>Invoice counts and amounts by bucket</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bucket</TableHead>
                      <TableHead className="text-right">Invoices</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agingChartData.map((bucket) => (
                      <TableRow key={bucket.name}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: bucket.fill }}
                            />
                            {bucket.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{bucket.count}</TableCell>
                        <TableCell className="text-right">{formatCurrency(bucket.amount)}</TableCell>
                        <TableCell className="text-right">
                          {data.ar_aging.total_outstanding_amount > 0
                            ? ((bucket.amount / data.ar_aging.total_outstanding_amount) * 100).toFixed(1)
                            : 0}%
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right">{data.ar_aging.total_outstanding_invoices}</TableCell>
                      <TableCell className="text-right">{formatCurrency(data.ar_aging.total_outstanding_amount)}</TableCell>
                      <TableCell className="text-right">100%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* DSO & Metrics Tab */}
        <TabsContent value="dso" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current DSO</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{data.dso.dso_current.toFixed(1)}</div>
                <p className="text-muted-foreground">days</p>
                <div className="mt-4 flex items-center gap-2">
                  {getTrendIcon(data.dso.dso_trend)}
                  <span className="text-sm capitalize">{data.dso.dso_trend}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Best Possible DSO</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-green-600">{data.dso.best_possible_dso.toFixed(1)}</div>
                <p className="text-muted-foreground">days</p>
                <p className="mt-4 text-sm text-muted-foreground">
                  Gap: {(data.dso.dso_current - data.dso.best_possible_dso).toFixed(1)} days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Collection Effectiveness</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-blue-600">{data.dso.collection_effectiveness_index.toFixed(1)}%</div>
                <p className="text-muted-foreground">CEI</p>
                <p className="mt-4 text-sm text-muted-foreground">
                  Target: 80%+
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Collection Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">{data.collection.total_notifications_sent}</div>
                  <p className="text-sm text-muted-foreground">Notifications Sent</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">{formatCurrency(data.collection.total_amount_collected)}</div>
                  <p className="text-sm text-muted-foreground">Amount Collected</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">{data.collection.avg_days_to_payment.toFixed(1)}</div>
                  <p className="text-sm text-muted-foreground">Avg Days to Payment</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">{data.collection.response_rate.toFixed(1)}%</div>
                  <p className="text-sm text-muted-foreground">Response Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
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
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">SMS: {data.notifications.total_sms}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-purple-500" />
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
                    <CheckCircle className="h-6 w-6 mx-auto text-green-500 mb-2" />
                    <div className="text-xl font-bold">{data.notifications.total_delivered}</div>
                    <p className="text-sm text-muted-foreground">Delivered</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    <XCircle className="h-6 w-6 mx-auto text-red-500 mb-2" />
                    <div className="text-xl font-bold">{data.notifications.total_failed}</div>
                    <p className="text-sm text-muted-foreground">Failed</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <Activity className="h-6 w-6 mx-auto text-blue-500 mb-2" />
                    <div className="text-xl font-bold">{data.notifications.delivery_rate.toFixed(1)}%</div>
                    <p className="text-sm text-muted-foreground">Delivery Rate</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                    <Calendar className="h-6 w-6 mx-auto text-purple-500 mb-2" />
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
                              <MessageSquare className="h-3 w-3" /> SMS
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1">
                              <Mail className="h-3 w-3" /> Email
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
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          {data.historical && data.historical.length > 0 ? (
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
                      <XAxis dataKey="snapshot_date" tickFormatter={formatDate} />
                      <YAxis yAxisId="left" tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`} />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          name === 'total_outstanding' ? formatCurrency(value) : value.toFixed(1),
                          name === 'total_outstanding' ? 'Outstanding' : 'DSO',
                        ]}
                        labelFormatter={formatDate}
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
                      <XAxis dataKey="snapshot_date" tickFormatter={formatDate} />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`} />
                      <Tooltip labelFormatter={formatDate} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="sms_sent_count" name="SMS" fill={COLORS.sms} />
                      <Bar yAxisId="left" dataKey="email_sent_count" name="Email" fill={COLORS.email} />
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
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No historical data available yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Historical snapshots are created daily by the system
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
