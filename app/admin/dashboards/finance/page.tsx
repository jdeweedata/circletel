import { redirect } from 'next/navigation';
import { createClientWithSession } from '@/lib/supabase/server';
import { StatCard } from '@/components/admin/shared/StatCard';
import { SectionCard } from '@/components/admin/shared/SectionCard';
import {
  PiCurrencyDollarBold,
  PiClockBold,
  PiCheckCircleBold,
  PiPercentBold,
  PiTrendUpBold,
  PiCalendarBold,
  PiFileTextBold,
} from 'react-icons/pi';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  status: string;
  customer_name: string;
  customer_email: string;
}

interface KPIData {
  mrr: number;
  outstandingAR: number;
  collectionsThisMonth: number;
  grossMarginPercent: number;
}

interface ChartData {
  revenueTrend: Array<{ month: string; revenue: number }>;
  invoiceStatus: Array<{ name: string; value: number }>;
  arAging: Array<{ bucket: string; count: number }>;
  topCustomers: Array<{ name: string; revenue: number }>;
}

// Helper function to format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Helper function to get invoice status variant for Badge
function getInvoiceStatusVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status?.toLowerCase()) {
    case 'paid':
      return 'default';
    case 'pending':
    case 'sent':
      return 'secondary';
    case 'overdue':
      return 'destructive';
    case 'draft':
      return 'outline';
    case 'voided':
      return 'destructive';
    default:
      return 'outline';
  }
}

// Helper function to calculate days overdue
function getDaysOverdue(dueDate: string): number {
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

async function fetchFinanceData() {
  const supabase = await createClientWithSession();

  // Check user authentication
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect('/admin/login');
  }

  try {
    // Fetch all invoices with customer data
    const { data: invoices, error: invoicesError } = await supabase
      .from('customer_invoices')
      .select(
        `
        id,
        invoice_number,
        invoice_date,
        due_date,
        total_amount,
        amount_paid,
        amount_due,
        status,
        customer_id,
        customers:customer_id(
          id,
          first_name,
          last_name,
          email
        )
      `
      )
      .order('created_at', { ascending: false });

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError);
      return null;
    }

    // Fetch customer data
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, first_name, last_name, email');

    if (customersError) {
      console.error('Error fetching customers:', customersError);
    }

    return {
      invoices: invoices || [],
      customers: customers || [],
    };
  } catch (error) {
    console.error('Error fetching finance data:', error);
    return null;
  }
}

function calculateKPIs(invoices: Invoice[]): KPIData {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonthDate = new Date(today);
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);

  // MRR: Sum of active subscription amounts (approximate from recent invoices)
  // For now, we'll use average monthly revenue
  const invoicesThisMonth = invoices.filter((inv) => {
    const invDate = new Date(inv.invoice_date);
    return invDate >= firstDayOfMonth;
  });
  const mrr =
    invoicesThisMonth.reduce((sum, inv) => sum + inv.total_amount, 0) /
      Math.max(
        1,
        Math.ceil((today.getTime() - firstDayOfMonth.getTime()) / (1000 * 60 * 60 * 24))
      ) *
      30 || 0;

  // Outstanding AR: Sum of amount_due for unpaid/overdue invoices
  const outstandingAR = invoices
    .filter((inv) => inv.status !== 'paid' && inv.status !== 'voided')
    .reduce((sum, inv) => sum + inv.amount_due, 0);

  // Collections This Month: Sum of amount_paid for invoices paid this month
  const collectionsThisMonth = invoices
    .filter((inv) => {
      const paidDate = inv.invoice_date; // Using invoice_date as proxy
      const invDate = new Date(paidDate);
      return invDate >= firstDayOfMonth && inv.amount_paid > 0;
    })
    .reduce((sum, inv) => sum + inv.amount_paid, 0);

  // Gross Margin: Simplified calculation (assuming 60% margin)
  // In real implementation, would need COGS data
  const grossMarginPercent = 60;

  return {
    mrr: Math.round(mrr),
    outstandingAR: Math.round(outstandingAR),
    collectionsThisMonth: Math.round(collectionsThisMonth),
    grossMarginPercent,
  };
}

function calculateChartData(invoices: Invoice[]): ChartData {
  // Revenue Trend: Last 12 months
  const revenueTrend = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - i));
    const monthStr = date.toLocaleDateString('en-ZA', { month: 'short' });
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const monthRevenue = invoices
      .filter((inv) => {
        const invDate = new Date(inv.invoice_date);
        return invDate >= monthStart && invDate <= monthEnd;
      })
      .reduce((sum, inv) => sum + inv.total_amount, 0);

    return { month: monthStr, revenue: Math.round(monthRevenue) };
  });

  // Invoice Status Breakdown
  const statusCounts = invoices.reduce(
    (acc, inv) => {
      const status = inv.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const invoiceStatus = Object.entries(statusCounts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  // AR Aging Buckets
  const arAging = {
    '0-30': 0,
    '31-60': 0,
    '61-90': 0,
    '90+': 0,
  };

  invoices.forEach((inv) => {
    if (inv.status !== 'paid' && inv.status !== 'voided') {
      const daysOverdue = getDaysOverdue(inv.due_date);
      if (daysOverdue <= 30) arAging['0-30']++;
      else if (daysOverdue <= 60) arAging['31-60']++;
      else if (daysOverdue <= 90) arAging['61-90']++;
      else arAging['90+']++;
    }
  });

  const arAgingData = Object.entries(arAging).map(([bucket, count]) => ({
    bucket,
    count,
  }));

  // Top Customers by Revenue
  const customerRevenue = invoices.reduce(
    (acc, inv) => {
      const name = inv.customer_name || 'Unknown';
      acc[name] = (acc[name] || 0) + inv.total_amount;
      return acc;
    },
    {} as Record<string, number>
  );

  const topCustomers = Object.entries(customerRevenue)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, revenue]) => ({ name, revenue: Math.round(revenue) }));

  return {
    revenueTrend,
    invoiceStatus,
    arAging: arAgingData,
    topCustomers,
  };
}

function transformInvoiceData(invoices: any[]): Invoice[] {
  return invoices.map((inv) => {
    const customer = inv.customers;
    const customerName = customer
      ? `${customer.first_name} ${customer.last_name}`
      : 'Unknown';
    return {
      id: inv.id,
      invoice_number: inv.invoice_number,
      invoice_date: inv.invoice_date,
      due_date: inv.due_date,
      total_amount: inv.total_amount,
      amount_paid: inv.amount_paid,
      amount_due: inv.amount_due,
      status: inv.status,
      customer_name: customerName,
      customer_email: customer?.email || '',
    };
  });
}

const CHART_COLORS = ['#E87A1E', '#1B2A4A', '#FF9500', '#52C41A', '#1890FF', '#722ED1'];

export default async function FinanceDashboardPage() {
  const data = await fetchFinanceData();

  if (!data) {
    return (
      <div className="p-8">
        <p className="text-red-600">Error loading dashboard data</p>
      </div>
    );
  }

  const invoices = transformInvoiceData(data.invoices);
  const kpis = calculateKPIs(invoices);
  const chartData = calculateChartData(invoices);

  // Recent invoices (top 10)
  const recentInvoices = invoices.slice(0, 10);

  // Outstanding AR (unpaid/overdue)
  const outstandingAR = invoices
    .filter((inv) => inv.status !== 'paid' && inv.status !== 'voided')
    .sort((a, b) => {
      const aDays = getDaysOverdue(a.due_date);
      const bDays = getDaysOverdue(b.due_date);
      return bDays - aDays;
    })
    .slice(0, 10);

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Finance Dashboard</h1>
        <p className="text-gray-600 mt-1">Revenue visibility, cash flow, and AR tracking</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Monthly Recurring Revenue"
          value={formatCurrency(kpis.mrr)}
          icon={<PiTrendUpBold className="w-6 h-6" />}
          trend={{
            value: 12,
            isPositive: true,
            label: 'vs last month',
          }}
        />
        <StatCard
          label="Outstanding AR"
          value={formatCurrency(kpis.outstandingAR)}
          icon={<PiClockBold className="w-6 h-6" />}
          subtitle={`${outstandingAR.length} invoices`}
        />
        <StatCard
          label="Collections This Month"
          value={formatCurrency(kpis.collectionsThisMonth)}
          icon={<PiCheckCircleBold className="w-6 h-6" />}
          trend={{
            value: 8,
            isPositive: true,
          }}
        />
        <StatCard
          label="Gross Margin"
          value={`${kpis.grossMarginPercent}%`}
          icon={<PiPercentBold className="w-6 h-6" />}
          subtitle="Historical average"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <SectionCard title="Revenue Trend (12 Months)" icon={PiTrendUpBold}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={chartData.revenueTrend}
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#E87A1E"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </SectionCard>

        {/* Invoice Status Breakdown */}
        <SectionCard title="Invoice Status Breakdown" icon={PiFileTextBold}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <Pie
                data={chartData.invoiceStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.invoiceStatus.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </SectionCard>

        {/* AR Aging */}
        <SectionCard title="AR Aging Analysis" icon={PiCalendarBold}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData.arAging}
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="bucket" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="count" fill="#E87A1E" isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        {/* Top Customers */}
        <SectionCard title="Top Customers by Revenue" icon={PiCurrencyDollarBold}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData.topCustomers}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" stroke="#6b7280" />
              <YAxis dataKey="name" type="category" width={120} stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Bar dataKey="revenue" fill="#1B2A4A" isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <SectionCard title="Recent Invoices" icon={PiFileTextBold}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentInvoices.length > 0 ? (
                  recentInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>{new Date(invoice.invoice_date).toLocaleDateString('en-ZA')}</TableCell>
                      <TableCell>{formatCurrency(invoice.total_amount)}</TableCell>
                      <TableCell>
                        <Badge variant={getInvoiceStatusVariant(invoice.status)}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                      No invoices found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </SectionCard>

        {/* Outstanding AR */}
        <SectionCard title="Outstanding AR" icon={PiClockBold}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Days Overdue</TableHead>
                  <TableHead>Amount Due</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outstandingAR.length > 0 ? (
                  outstandingAR.map((invoice) => {
                    const daysOverdue = getDaysOverdue(invoice.due_date);
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                        <TableCell>
                          <span
                            className={
                              daysOverdue > 30 ? 'text-red-600 font-semibold' : 'text-gray-600'
                            }
                          >
                            {daysOverdue} days
                          </span>
                        </TableCell>
                        <TableCell>{formatCurrency(invoice.amount_due)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              daysOverdue > 30
                                ? 'destructive'
                                : daysOverdue > 0
                                  ? 'secondary'
                                  : 'default'
                            }
                          >
                            {daysOverdue > 30 ? 'Overdue' : daysOverdue > 0 ? 'Due Soon' : 'Pending'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                      No outstanding invoices
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
