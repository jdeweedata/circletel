'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DollarSign, TrendingUp, Clock, CheckCircle, RefreshCw, ChevronLeft, ChevronRight, Award, Info } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Transaction {
  id: string
  transaction_type: string
  amount: number
  currency: string
  commission_rate?: number
  status: 'pending' | 'approved' | 'paid' | 'cancelled'
  description?: string
  lead_id?: string
  order_id?: string
  created_at: string
  paid_at?: string
  coverage_leads?: {
    first_name: string
    last_name: string
    email: string
  }
}

interface Summary {
  total_earned: number
  pending_approval: number
  pending_payment: number
  total_transactions: number
}

interface Partner {
  business_name: string
  commission_rate: number
  tier: string
}

interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  lead_conversion: 'Lead Conversion',
  monthly_recurring: 'Monthly Recurring',
  installation_fee: 'Installation Fee',
  upgrade: 'Upgrade',
  adjustment: 'Adjustment',
  payout: 'Payout',
}

const TIER_COLORS: Record<string, string> = {
  bronze: 'text-amber-700',
  silver: 'text-gray-500',
  gold: 'text-yellow-500',
  platinum: 'text-purple-600',
}

export default function PartnerCommissionsPage() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [summary, setSummary] = useState<Summary>({
    total_earned: 0,
    pending_approval: 0,
    pending_payment: 0,
    total_transactions: 0,
  })
  const [partner, setPartner] = useState<Partner | null>(null)
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  })

  // Filters
  const [statusFilter, setStatusFilter] = useState('all')

  // Fetch commissions
  const fetchCommissions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        status: statusFilter,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      const response = await fetch(`/api/partners/commissions?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch commissions')
      }

      setTransactions(data.transactions)
      setSummary(data.summary)
      setPartner(data.partner)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching commissions:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to fetch commissions')
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchCommissions()
  }, [pagination.page, statusFilter])

  const handleRefresh = () => {
    fetchCommissions()
    toast.success('Commissions refreshed')
  }

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-circleTel-darkNeutral">
            Commissions
          </h1>
          <p className="text-circleTel-secondaryNeutral mt-2">
            Track your earnings and commission history
          </p>
        </div>
        {partner && (
          <div className="text-right">
            <div className="flex items-center justify-end space-x-2">
              <Award className={`h-5 w-5 ${TIER_COLORS[partner.tier]}`} />
              <span className={`font-semibold ${TIER_COLORS[partner.tier]} capitalize`}>
                {partner.tier} Partner
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Commission Rate: {partner.commission_rate}%
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => router.push('/partner/commissions/tiers')}
            >
              <Info className="h-4 w-4 mr-2" />
              View Commission Tiers
            </Button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Total Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">
              {formatCurrency(summary.total_earned)}
            </div>
            <p className="text-xs text-green-600 mt-1">
              Paid out commissions
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Pending Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">
              {formatCurrency(summary.pending_payment)}
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Approved, awaiting payout
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Pending Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-800">
              {formatCurrency(summary.pending_approval)}
            </div>
            <p className="text-xs text-yellow-600 mt-1">
              Awaiting admin approval
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-circleTel-orange/20 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-circleTel-orange flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Total Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-circleTel-orange">
              {summary.total_transactions}
            </div>
            <p className="text-xs text-orange-700 mt-1">
              All-time transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending Approval</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Detailed breakdown of all your commission transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-circleTel-orange" />
              <p className="mt-4 text-circleTel-secondaryNeutral">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-circleTel-secondaryNeutral">No commission transactions yet</p>
              <p className="text-sm text-gray-400 mt-2">
                Transactions will appear here when leads convert to orders
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="text-sm text-gray-600">
                          {format(new Date(transaction.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium">
                            {TRANSACTION_TYPE_LABELS[transaction.transaction_type] || transaction.transaction_type}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <span className="text-sm text-gray-700">
                            {transaction.description || 'No description'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {transaction.coverage_leads ? (
                            <div className="text-sm">
                              <div className="font-medium">
                                {transaction.coverage_leads.first_name} {transaction.coverage_leads.last_name}
                              </div>
                              <div className="text-gray-500 text-xs">
                                {transaction.coverage_leads.email}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {transaction.commission_rate ? `${transaction.commission_rate}%` : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold text-green-700">
                            {formatCurrency(transaction.amount)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_COLORS[transaction.status]}>
                            {transaction.status}
                          </Badge>
                          {transaction.paid_at && (
                            <div className="text-xs text-gray-500 mt-1">
                              Paid: {format(new Date(transaction.paid_at), 'MMM d')}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-600">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} transactions
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="text-sm text-gray-600">
                      Page {pagination.page} of {pagination.totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">How Commissions Work</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>• Commissions are earned when your assigned leads convert to orders</p>
          <p>• Your commission rate is based on your partner tier: <strong className="capitalize">{partner?.tier} ({partner?.commission_rate}%)</strong></p>
          <p>• Commissions go through 3 stages: <strong>Pending Approval</strong> → <strong>Approved</strong> → <strong>Paid</strong></p>
          <p>• Payouts are processed monthly on the 25th of each month</p>
          <p>• Contact your sales manager to discuss upgrading your tier for better commission rates</p>
        </CardContent>
      </Card>
    </div>
  )
}
