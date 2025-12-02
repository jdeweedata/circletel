'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  Play,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { format, subDays } from 'date-fns';

interface ReconciliationResult {
  date: string;
  totalProcessed: number;
  successful: number;
  unpaid: number;
  notFound: number;
  errors: string[];
}

interface StatementTransaction {
  date: string;
  transactionCode: string;
  description: string;
  amount: number;
  effect: '+' | '-';
  reference?: string;
  accountReference?: string;
}

interface StatementData {
  success: boolean;
  date: string;
  openingBalance?: number;
  closingBalance?: number;
  totalTransactions: number;
  debitOrderTransactions: number;
  transactions: StatementTransaction[];
  error?: string;
}

export default function ReconciliationPage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    format(subDays(new Date(), 1), 'yyyy-MM-dd')
  );
  const [loading, setLoading] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [statementData, setStatementData] = useState<StatementData | null>(null);
  const [reconciliationResult, setReconciliationResult] = useState<ReconciliationResult | null>(null);
  const [recentReconciliations, setRecentReconciliations] = useState<ReconciliationResult[]>([]);

  useEffect(() => {
    // Load recent reconciliation history
    loadRecentReconciliations();
  }, []);

  const loadRecentReconciliations = async () => {
    // In a real implementation, this would fetch from the cron_execution_log table
    // For now, we'll leave it empty
  };

  const fetchStatement = async () => {
    setLoading(true);
    setStatementData(null);

    try {
      const response = await fetch(`/api/admin/payments/verify?date=${selectedDate}`);
      const data = await response.json();
      setStatementData(data);
    } catch (error) {
      console.error('Failed to fetch statement:', error);
      setStatementData({
        success: false,
        date: selectedDate,
        totalTransactions: 0,
        debitOrderTransactions: 0,
        transactions: [],
        error: 'Failed to fetch statement',
      });
    } finally {
      setLoading(false);
    }
  };

  const runReconciliation = async () => {
    setReconciling(true);
    setReconciliationResult(null);

    try {
      const response = await fetch('/api/cron/payment-reconciliation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate }),
      });
      const data = await response.json();
      setReconciliationResult(data);
    } catch (error) {
      console.error('Reconciliation failed:', error);
      setReconciliationResult({
        date: selectedDate,
        totalProcessed: 0,
        successful: 0,
        unpaid: 0,
        notFound: 0,
        errors: ['Reconciliation request failed'],
      });
    } finally {
      setReconciling(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);
  };

  const getTransactionCodeBadge = (code: string) => {
    const successCodes = ['TDD', 'SDD', 'TDC', 'SDC', 'DCS'];
    const failedCodes = ['DRU', 'DCX', 'DCD', 'DCU'];

    if (successCodes.includes(code)) {
      return <Badge className="bg-green-500">{code}</Badge>;
    }
    if (failedCodes.includes(code)) {
      return <Badge variant="destructive">{code}</Badge>;
    }
    return <Badge variant="secondary">{code}</Badge>;
  };

  const getTransactionDescription = (code: string) => {
    const descriptions: Record<string, string> = {
      TDD: 'Two-day debit order',
      SDD: 'Same-day debit order',
      TDC: 'Two-day credit card debit',
      SDC: 'Same-day credit card debit',
      DCS: 'DebiCheck successful',
      DRU: 'Debit order unpaid',
      DCX: 'DebiCheck unsuccessful',
      DCD: 'DebiCheck disputed',
      DCU: 'Credit card unpaid',
    };
    return descriptions[code] || code;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Reconciliation</h1>
          <p className="text-gray-600">
            Reconcile debit order payments with NetCash merchant statements
          </p>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Reconciliation Controls</CardTitle>
          <CardDescription>
            Select a date to view the NetCash statement and run reconciliation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="date">Statement Date</Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={format(subDays(new Date(), 1), 'yyyy-MM-dd')}
                  className="w-48"
                />
              </div>
              <p className="text-xs text-gray-500">
                Statements available from 08:30 for the previous day
              </p>
            </div>

            <Button
              onClick={fetchStatement}
              disabled={loading}
              variant="outline"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Fetch Statement
            </Button>

            <Button
              onClick={runReconciliation}
              disabled={reconciling}
              className="bg-circleTel-orange hover:bg-circleTel-orange/90"
            >
              {reconciling ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Run Reconciliation
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reconciliation Result */}
      {reconciliationResult && (
        <Card className={reconciliationResult.errors.length > 0 ? 'border-orange-200' : 'border-green-200'}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {reconciliationResult.errors.length > 0 ? (
                <AlertCircle className="h-5 w-5 text-orange-500" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
              Reconciliation Result - {reconciliationResult.date}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold">{reconciliationResult.totalProcessed}</div>
                <div className="text-sm text-gray-600">Total Processed</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{reconciliationResult.successful}</div>
                <div className="text-sm text-gray-600">Successful</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{reconciliationResult.unpaid}</div>
                <div className="text-sm text-gray-600">Unpaid</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{reconciliationResult.notFound}</div>
                <div className="text-sm text-gray-600">Not Found</div>
              </div>
            </div>

            {reconciliationResult.errors.length > 0 && (
              <div className="mt-4 p-4 bg-orange-50 rounded-lg">
                <h4 className="font-medium text-orange-800 mb-2">Errors</h4>
                <ul className="list-disc list-inside text-sm text-orange-700">
                  {reconciliationResult.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Statement Data */}
      {statementData && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg">
                  NetCash Statement - {statementData.date}
                </CardTitle>
                <CardDescription>
                  {statementData.success
                    ? `${statementData.debitOrderTransactions} debit order transactions found`
                    : statementData.error}
                </CardDescription>
              </div>
              {statementData.success && (
                <div className="text-right">
                  <div className="text-sm text-gray-500">Closing Balance</div>
                  <div className="text-xl font-bold">
                    {formatCurrency(statementData.closingBalance || 0)}
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!statementData.success ? (
              <div className="text-center py-8 text-gray-500">
                <XCircle className="h-12 w-12 mx-auto mb-4 text-red-300" />
                <p>{statementData.error || 'Failed to load statement'}</p>
              </div>
            ) : statementData.transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No debit order transactions found for this date</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Effect</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statementData.transactions.map((tx, index) => (
                    <TableRow key={index}>
                      <TableCell>{getTransactionCodeBadge(tx.transactionCode)}</TableCell>
                      <TableCell>
                        <div>{getTransactionDescription(tx.transactionCode)}</div>
                        <div className="text-xs text-gray-500">{tx.description}</div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {tx.accountReference || tx.reference || '-'}
                        </code>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(tx.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={tx.effect === '+' ? 'default' : 'secondary'}>
                          {tx.effect === '+' ? 'Credit' : 'Debit'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg text-blue-800">About Payment Reconciliation</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-700 space-y-2">
          <p>
            <strong>Automatic Reconciliation:</strong> A daily cron job runs at 09:00 SAST to
            reconcile payments from the previous day's NetCash statement.
          </p>
          <p>
            <strong>Manual Reconciliation:</strong> Use this page to manually trigger reconciliation
            for a specific date or to investigate payment discrepancies.
          </p>
          <p>
            <strong>Transaction Codes:</strong>
          </p>
          <ul className="list-disc list-inside ml-4">
            <li><strong>TDD/SDD</strong> - Successful debit orders (Two-day/Same-day)</li>
            <li><strong>DCS</strong> - DebiCheck successful</li>
            <li><strong>DRU</strong> - Debit order unpaid (insufficient funds, etc.)</li>
            <li><strong>DCX</strong> - DebiCheck unsuccessful</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
