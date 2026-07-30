'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { buildAgingBuckets, formatCurrency, type ARAnalyticsData } from './shared';

export function ArAgingPanel({ data }: { data: ARAnalyticsData }) {
  const agingChartData = buildAgingBuckets(data.ar_aging);

  return (
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
  );
}
