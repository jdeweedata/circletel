'use client';

import Link from 'next/link';
import { PiEyeBold, PiFileTextBold } from 'react-icons/pi';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { OverdueInvoiceRow } from '@/lib/billing/health/types';
import { AgingBadge } from './AgingBadge';
import { formatDueDate, formatRand } from './format';

interface OverdueInvoiceRegisterProps {
  rows: OverdueInvoiceRow[];
  totalOverdue: number;
}

export function OverdueInvoiceRegister({ rows, totalOverdue }: OverdueInvoiceRegisterProps) {
  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 className="text-base font-semibold text-slate-900">Overdue Invoice Register</h2>
        <p className="mt-0.5 text-sm text-slate-500">All unpaid invoices past due date</p>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-12 text-center">
          <PiFileTextBold className="h-8 w-8 text-slate-300" aria-hidden="true" />
          <p className="text-sm font-medium text-slate-600">No overdue invoices</p>
          <p className="text-xs text-slate-400">Every unpaid invoice is still inside its due date.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="pl-6 text-xs font-medium uppercase tracking-wide text-slate-400">Invoice #</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-slate-400">Customer</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-slate-400">Package</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-slate-400">Due date</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-slate-400">Days overdue</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-slate-400">Aging</TableHead>
                  <TableHead className="text-right text-xs font-medium uppercase tracking-wide text-slate-400">Amount</TableHead>
                  <TableHead className="pr-6 text-right text-xs font-medium uppercase tracking-wide text-slate-400">
                    <span className="sr-only">View</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id} className="border-slate-100">
                    <TableCell className="pl-6 text-sm font-medium text-slate-900">
                      {row.invoiceNumber}
                    </TableCell>
                    <TableCell className="max-w-[160px] truncate text-sm text-slate-600">
                      {row.customerName}
                    </TableCell>
                    <TableCell className="max-w-[160px] truncate text-sm text-slate-500">
                      {row.packageName ?? '—'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-slate-500">
                      {formatDueDate(row.dueDate)}
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-red-600">
                      {row.daysOverdue}d
                    </TableCell>
                    <TableCell>
                      <AgingBadge bucket={row.agingBucket} />
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold text-red-600">
                      {formatRand(row.amountDue)}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <Link
                        href={row.href}
                        aria-label={`View invoice ${row.invoiceNumber}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                      >
                        <PiEyeBold className="h-4 w-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="border-t border-slate-100 px-6 py-3 text-xs text-slate-400">
            Showing {rows.length} of {totalOverdue} overdue invoice{totalOverdue === 1 ? '' : 's'}
          </p>
        </>
      )}
    </div>
  );
}
