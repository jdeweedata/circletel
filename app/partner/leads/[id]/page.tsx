'use client'

import React, { useState, useEffect } from 'react'
import { use } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  Building2,
  Clock,
  MessageSquare,
  Plus,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ACTIVITY_TYPE_LABELS, type ActivityType } from '@/lib/partners/types'

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
  province?: string
  postal_code?: string
  customer_type: 'consumer' | 'business'
  status: string
  requested_service_type?: string
  requested_speed?: string
  budget_range?: string
  lead_source: string
  contact_preference?: string
  best_contact_time?: string
  follow_up_notes?: string
  partner_notes?: string
  partner_last_contact?: string
  next_follow_up_at?: string
  created_at: string
  updated_at: string
}

interface Activity {
  id: string
  activity_type: ActivityType
  subject?: string
  description: string
  outcome?: string
  next_action?: string
  next_action_date?: string
  created_at: string
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

const ACTIVITY_ICONS: Record<ActivityType, any> = {
  call: Phone,
  email: Mail,
  meeting: User,
  quote_sent: Building2,
  follow_up: Clock,
  note: MessageSquare,
}

export default function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [lead, setLead] = useState<Lead | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showActivityForm, setShowActivityForm] = useState(false)

  // Activity form state
  const [activityType, setActivityType] = useState<ActivityType>('note')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [outcome, setOutcome] = useState('')
  const [nextAction, setNextAction] = useState('')
  const [nextActionDate, setNextActionDate] = useState('')

  // Fetch lead and activities
  const fetchLeadData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/partners/leads/${resolvedParams.id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch lead')
      }

      setLead(data.lead)
      setActivities(data.activities)
    } catch (error) {
      console.error('Error fetching lead:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to fetch lead')
      router.push('/partners/leads')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeadData()
  }, [resolvedParams.id])

  // Submit activity
  const handleSubmitActivity = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!description.trim()) {
      toast.error('Description is required')
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch(`/api/partners/leads/${resolvedParams.id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_type: activityType,
          subject: subject || undefined,
          description,
          outcome: outcome || undefined,
          next_action: nextAction || undefined,
          next_action_date: nextActionDate || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create activity')
      }

      toast.success('Activity added successfully')

      // Reset form
      setSubject('')
      setDescription('')
      setOutcome('')
      setNextAction('')
      setNextActionDate('')
      setShowActivityForm(false)

      // Refresh data
      fetchLeadData()
    } catch (error) {
      console.error('Error creating activity:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create activity')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-circleTel-orange" />
          <p className="mt-4 text-circleTel-secondaryNeutral">Loading lead details...</p>
        </div>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="text-center py-12">
        <p className="text-circleTel-secondaryNeutral">Lead not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.push('/partners/leads')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leads
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-circleTel-darkNeutral">
              {lead.first_name} {lead.last_name}
            </h1>
            <p className="text-circleTel-secondaryNeutral mt-1">
              Lead #{lead.id.slice(0, 8)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={STATUS_COLORS[lead.status]}>
            {lead.status.replace(/_/g, ' ')}
          </Badge>
          <Button variant="outline" onClick={fetchLeadData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Lead Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Full Name</Label>
                  <div className="flex items-center mt-1">
                    <User className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="font-medium">
                      {lead.first_name} {lead.last_name}
                    </span>
                  </div>
                </div>
                {lead.company_name && (
                  <div>
                    <Label className="text-gray-600">Company</Label>
                    <div className="flex items-center mt-1">
                      <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="font-medium">{lead.company_name}</span>
                    </div>
                  </div>
                )}
                <div>
                  <Label className="text-gray-600">Email</Label>
                  <div className="flex items-center mt-1">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    <a
                      href={`mailto:${lead.email}`}
                      className="text-circleTel-orange hover:underline"
                    >
                      {lead.email}
                    </a>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-600">Phone</Label>
                  <div className="flex items-center mt-1">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    <a
                      href={`tel:${lead.phone}`}
                      className="text-circleTel-orange hover:underline"
                    >
                      {lead.phone}
                    </a>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-gray-600">Address</Label>
                <div className="flex items-start mt-1">
                  <MapPin className="h-4 w-4 mr-2 mt-1 text-gray-400" />
                  <div>
                    <p className="font-medium">{lead.address}</p>
                    {(lead.suburb || lead.city || lead.province) && (
                      <p className="text-sm text-gray-600">
                        {[lead.suburb, lead.city, lead.province].filter(Boolean).join(', ')}
                        {lead.postal_code && ` • ${lead.postal_code}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {(lead.contact_preference || lead.best_contact_time) && (
                <>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lead.contact_preference && (
                      <div>
                        <Label className="text-gray-600">Contact Preference</Label>
                        <p className="mt-1 font-medium capitalize">{lead.contact_preference}</p>
                      </div>
                    )}
                    {lead.best_contact_time && (
                      <div>
                        <Label className="text-gray-600">Best Contact Time</Label>
                        <p className="mt-1 font-medium">{lead.best_contact_time}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Service Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>Service Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-gray-600">Service Type</Label>
                  <p className="mt-1 font-medium">{lead.requested_service_type || 'Not specified'}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Speed</Label>
                  <p className="mt-1 font-medium">{lead.requested_speed || 'Not specified'}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Budget</Label>
                  <p className="mt-1 font-medium">{lead.budget_range || 'Not specified'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activities */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Activity Timeline</CardTitle>
                  <CardDescription>
                    Track all interactions with this lead
                  </CardDescription>
                </div>
                <Button onClick={() => setShowActivityForm(!showActivityForm)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Activity
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showActivityForm && (
                <form onSubmit={handleSubmitActivity} className="mb-6 p-4 border rounded-lg bg-gray-50">
                  <h3 className="font-semibold mb-4">New Activity</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="activityType">Activity Type *</Label>
                      <Select value={activityType} onValueChange={(val) => setActivityType(val as ActivityType)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ACTIVITY_TYPE_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Brief subject line"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Details of the activity..."
                        rows={3}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="outcome">Outcome</Label>
                      <Input
                        id="outcome"
                        value={outcome}
                        onChange={(e) => setOutcome(e.target.value)}
                        placeholder="What was the result?"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="nextAction">Next Action</Label>
                        <Input
                          id="nextAction"
                          value={nextAction}
                          onChange={(e) => setNextAction(e.target.value)}
                          placeholder="Follow-up required?"
                        />
                      </div>
                      <div>
                        <Label htmlFor="nextActionDate">Next Action Date</Label>
                        <Input
                          id="nextActionDate"
                          type="date"
                          value={nextActionDate}
                          onChange={(e) => setNextActionDate(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowActivityForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submitting}>
                        {submitting ? 'Saving...' : 'Save Activity'}
                      </Button>
                    </div>
                  </div>
                </form>
              )}

              {activities.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No activities yet. Add your first activity above.
                </p>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => {
                    const Icon = ACTIVITY_ICONS[activity.activity_type]
                    return (
                      <div key={activity.id} className="flex space-x-4 p-4 border rounded-lg">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-circleTel-orange/10 flex items-center justify-center">
                            <Icon className="h-5 w-5 text-circleTel-orange" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-semibold">
                                {ACTIVITY_TYPE_LABELS[activity.activity_type]}
                              </span>
                              {activity.subject && (
                                <span className="text-gray-600"> • {activity.subject}</span>
                              )}
                            </div>
                            <span className="text-sm text-gray-500">
                              {format(new Date(activity.created_at), 'MMM d, yyyy h:mm a')}
                            </span>
                          </div>
                          <p className="mt-2 text-gray-700">{activity.description}</p>
                          {activity.outcome && (
                            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                              <span className="text-sm font-medium text-green-800">Outcome: </span>
                              <span className="text-sm text-green-700">{activity.outcome}</span>
                            </div>
                          )}
                          {activity.next_action && (
                            <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded">
                              <span className="text-sm font-medium text-orange-800">Next: </span>
                              <span className="text-sm text-orange-700">{activity.next_action}</span>
                              {activity.next_action_date && (
                                <span className="text-sm text-orange-600">
                                  {' '}by {format(new Date(activity.next_action_date), 'MMM d, yyyy')}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Metadata */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lead Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-gray-600">Customer Type</Label>
                <p className="mt-1">
                  <Badge variant={lead.customer_type === 'business' ? 'default' : 'secondary'}>
                    {lead.customer_type === 'business' ? 'Business' : 'Consumer'}
                  </Badge>
                </p>
              </div>

              <div>
                <Label className="text-gray-600">Lead Source</Label>
                <p className="mt-1 font-medium capitalize">{lead.lead_source.replace(/_/g, ' ')}</p>
              </div>

              <Separator />

              <div>
                <Label className="text-gray-600">Created</Label>
                <p className="mt-1 text-sm">{format(new Date(lead.created_at), 'PPp')}</p>
              </div>

              {lead.partner_last_contact && (
                <div>
                  <Label className="text-gray-600">Last Contact</Label>
                  <p className="mt-1 text-sm">{format(new Date(lead.partner_last_contact), 'PPp')}</p>
                </div>
              )}

              {lead.next_follow_up_at && (
                <div>
                  <Label className="text-gray-600">Next Follow-up</Label>
                  <p className="mt-1 text-sm font-medium text-orange-600">
                    {format(new Date(lead.next_follow_up_at), 'PPp')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {lead.partner_notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.partner_notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
