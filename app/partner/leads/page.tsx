'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import { Search, Phone, Mail, MapPin, Calendar, RefreshCw, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Lead {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  company_name?: string
  address: string
  suburb?: string
  city?: string
  customer_type: 'consumer' | 'business'
  status: string
  requested_service_type?: string
  requested_speed?: string
  budget_range?: string
  lead_source: string
  partner_notes?: string
  partner_last_contact?: string
  next_follow_up_at?: string
  created_at: string
}

interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  interested: 'bg-green-100 text-green-800',
  not_interested: 'bg-gray-100 text-gray-800',
  coverage_available: 'bg-purple-100 text-purple-800',
  converted_to_order: 'bg-emerald-100 text-emerald-800',
  lost: 'bg-red-100 text-red-800',
  follow_up_scheduled: 'bg-orange-100 text-orange-800',
}

export default function PartnerLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  })

  // Filters
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch leads
  const fetchLeads = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        status: statusFilter,
        search: searchQuery,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      const response = await fetch(`/api/partners/leads?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch leads')
      }

      setLeads(data.leads)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching leads:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to fetch leads')
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchLeads()
  }, [pagination.page, statusFilter])

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== undefined) {
        fetchLeads()
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleRefresh = () => {
    fetchLeads()
    toast.success('Leads refreshed')
  }

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-circleTel-darkNeutral">
          My Leads
        </h1>
        <p className="text-circleTel-secondaryNeutral mt-2">
          Manage your assigned leads and track your progress
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-circleTel-darkNeutral">
              {pagination.total}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              New
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {leads.filter((l) => l.status === 'new').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Interested
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {leads.filter((l) => l.status === 'interested').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Converted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {leads.filter((l) => l.status === 'converted_to_order').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, phone, or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="interested">Interested</SelectItem>
                  <SelectItem value="not_interested">Not Interested</SelectItem>
                  <SelectItem value="coverage_available">Coverage Available</SelectItem>
                  <SelectItem value="converted_to_order">Converted</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                  <SelectItem value="follow_up_scheduled">Follow-up Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Refresh Button */}
            <Button variant="outline" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leads ({pagination.total})</CardTitle>
          <CardDescription>
            Click on a lead to view details and add activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-circleTel-orange" />
              <p className="mt-4 text-circleTel-secondaryNeutral">Loading leads...</p>
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-circleTel-secondaryNeutral">No leads found</p>
              <p className="text-sm text-gray-400 mt-2">
                Leads will appear here once they are assigned to you
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead) => (
                      <TableRow key={lead.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div>
                            <div className="font-medium text-circleTel-darkNeutral">
                              {lead.first_name} {lead.last_name}
                            </div>
                            {lead.company_name && (
                              <div className="text-sm text-gray-500">{lead.company_name}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={lead.customer_type === 'business' ? 'default' : 'secondary'}>
                            {lead.customer_type === 'business' ? 'Business' : 'Consumer'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center text-sm">
                              <Mail className="h-3 w-3 mr-1 text-gray-400" />
                              <a href={`mailto:${lead.email}`} className="text-circleTel-orange hover:underline">
                                {lead.email}
                              </a>
                            </div>
                            <div className="flex items-center text-sm">
                              <Phone className="h-3 w-3 mr-1 text-gray-400" />
                              <a href={`tel:${lead.phone}`} className="text-circleTel-orange hover:underline">
                                {lead.phone}
                              </a>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-start text-sm text-gray-600 max-w-xs">
                            <MapPin className="h-3 w-3 mr-1 mt-1 text-gray-400 flex-shrink-0" />
                            <span className="line-clamp-2">
                              {lead.address}
                              {lead.city && `, ${lead.city}`}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_COLORS[lead.status] || 'bg-gray-100 text-gray-800'}>
                            {lead.status.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{lead.requested_service_type || 'N/A'}</div>
                            {lead.requested_speed && (
                              <div className="text-gray-500">{lead.requested_speed}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                            {format(new Date(lead.created_at), 'MMM d, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.location.href = `/partners/leads/${lead.id}`}
                          >
                            View
                          </Button>
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
                    {pagination.total} leads
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
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <Button
                          key={pageNum}
                          variant={pageNum === pagination.page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className={pageNum === pagination.page ? 'bg-circleTel-orange' : ''}
                        >
                          {pageNum}
                        </Button>
                      ))}
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
    </div>
  )
}
