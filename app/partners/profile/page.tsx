'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  CreditCard,
  Edit,
  Save,
  X,
  CheckCircle,
  Award,
  Calendar,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Partner {
  id: string
  business_name: string
  registration_number?: string
  vat_number?: string
  business_type: string
  contact_person: string
  email: string
  phone: string
  alternative_phone?: string
  street_address: string
  suburb?: string
  city: string
  province: string
  postal_code: string
  bank_name?: string
  account_holder?: string
  account_number?: string
  account_type?: string
  branch_code?: string
  partner_number?: string
  commission_rate: number
  tier: string
  status: string
  compliance_status: string
  total_leads: number
  converted_leads: number
  total_commission_earned: number
  pending_commission: number
  created_at: string
  approved_at?: string
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  under_review: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  suspended: 'bg-gray-100 text-gray-800',
}

const TIER_COLORS: Record<string, string> = {
  bronze: 'text-amber-700',
  silver: 'text-gray-500',
  gold: 'text-yellow-500',
  platinum: 'text-purple-600',
}

export default function PartnerProfilePage() {
  const [partner, setPartner] = useState<Partner | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Edit form state
  const [formData, setFormData] = useState({
    contact_person: '',
    email: '',
    phone: '',
    alternative_phone: '',
    street_address: '',
    suburb: '',
    city: '',
    province: '',
    postal_code: '',
  })

  // Fetch profile
  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/partners/profile')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch profile')
      }

      setPartner(data.partner)
      setFormData({
        contact_person: data.partner.contact_person || '',
        email: data.partner.email || '',
        phone: data.partner.phone || '',
        alternative_phone: data.partner.alternative_phone || '',
        street_address: data.partner.street_address || '',
        suburb: data.partner.suburb || '',
        city: data.partner.city || '',
        province: data.partner.province || '',
        postal_code: data.partner.postal_code || '',
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to fetch profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleEdit = () => {
    if (partner?.status !== 'pending') {
      toast.error('Profile can only be edited while status is pending. Contact support for changes.')
      return
    }
    setEditing(true)
  }

  const handleCancel = () => {
    setEditing(false)
    // Reset form to original values
    if (partner) {
      setFormData({
        contact_person: partner.contact_person || '',
        email: partner.email || '',
        phone: partner.phone || '',
        alternative_phone: partner.alternative_phone || '',
        street_address: partner.street_address || '',
        suburb: partner.suburb || '',
        city: partner.city || '',
        province: partner.province || '',
        postal_code: partner.postal_code || '',
      })
    }
  }

  const handleSave = async () => {
    try {
      setSubmitting(true)
      const response = await fetch('/api/partners/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      toast.success('Profile updated successfully')
      setEditing(false)
      fetchProfile()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-circleTel-orange" />
          <p className="mt-4 text-circleTel-secondaryNeutral">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!partner) {
    return (
      <div className="text-center py-12">
        <p className="text-circleTel-secondaryNeutral">Profile not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-circleTel-darkNeutral">
            My Profile
          </h1>
          <p className="text-circleTel-secondaryNeutral mt-2">
            Manage your partner account information
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={STATUS_COLORS[partner.status]}>
            {partner.status.replace(/_/g, ' ')}
          </Badge>
          {!editing && partner.status === 'pending' && (
            <Button onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
          {editing && (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={submitting}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={submitting}>
                <Save className="h-4 w-4 mr-2" />
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Status Alert */}
      {partner.status === 'pending' && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-yellow-200 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-700" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-yellow-900">Application Under Review</h3>
                <p className="text-sm text-yellow-800 mt-1">
                  Your partner application is being reviewed by our team. You'll be notified once approved.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {partner.status === 'approved' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-700" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-green-900">Active Partner</h3>
                  {partner.partner_number && (
                    <Badge variant="outline" className="text-green-800">
                      {partner.partner_number}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-green-800 mt-1">
                  Your partner account is active. You can now manage leads and earn commissions.
                </p>
                {partner.approved_at && (
                  <p className="text-xs text-green-700 mt-2">
                    Approved on {format(new Date(partner.approved_at), 'MMMM d, yyyy')}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Your registered business details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Business Name</Label>
                  <div className="flex items-center mt-1">
                    <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="font-medium">{partner.business_name}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-600">Business Type</Label>
                  <p className="mt-1 font-medium capitalize">
                    {partner.business_type.replace(/_/g, ' ')}
                  </p>
                </div>
                {partner.registration_number && (
                  <div>
                    <Label className="text-gray-600">Registration Number</Label>
                    <p className="mt-1 font-medium">{partner.registration_number}</p>
                  </div>
                )}
                {partner.vat_number && (
                  <div>
                    <Label className="text-gray-600">VAT Number</Label>
                    <p className="mt-1 font-medium">{partner.vat_number}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              {editing && (
                <CardDescription>Update your contact details</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_person">Contact Person {editing && '*'}</Label>
                  {editing ? (
                    <Input
                      id="contact_person"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      required
                    />
                  ) : (
                    <div className="flex items-center mt-1">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="font-medium">{partner.contact_person}</span>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email {editing && '*'}</Label>
                  {editing ? (
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  ) : (
                    <div className="flex items-center mt-1">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      <a href={`mailto:${partner.email}`} className="text-circleTel-orange hover:underline">
                        {partner.email}
                      </a>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">Phone {editing && '*'}</Label>
                  {editing ? (
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  ) : (
                    <div className="flex items-center mt-1">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      <a href={`tel:${partner.phone}`} className="text-circleTel-orange hover:underline">
                        {partner.phone}
                      </a>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="alternative_phone">Alternative Phone</Label>
                  {editing ? (
                    <Input
                      id="alternative_phone"
                      type="tel"
                      value={formData.alternative_phone}
                      onChange={(e) => setFormData({ ...formData, alternative_phone: e.target.value })}
                    />
                  ) : partner.alternative_phone ? (
                    <div className="flex items-center mt-1">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="font-medium">{partner.alternative_phone}</span>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-gray-400">Not provided</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle>Business Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="street_address">Street Address {editing && '*'}</Label>
                {editing ? (
                  <Input
                    id="street_address"
                    value={formData.street_address}
                    onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                    required
                  />
                ) : (
                  <div className="flex items-start mt-1">
                    <MapPin className="h-4 w-4 mr-2 mt-1 text-gray-400" />
                    <div>
                      <p className="font-medium">{partner.street_address}</p>
                      {partner.suburb && <p className="text-sm text-gray-600">{partner.suburb}</p>}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City {editing && '*'}</Label>
                  {editing ? (
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                    />
                  ) : (
                    <p className="mt-1 font-medium">{partner.city}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="province">Province {editing && '*'}</Label>
                  {editing ? (
                    <Input
                      id="province"
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      required
                    />
                  ) : (
                    <p className="mt-1 font-medium">{partner.province}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="postal_code">Postal Code {editing && '*'}</Label>
                  {editing ? (
                    <Input
                      id="postal_code"
                      value={formData.postal_code}
                      onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                      required
                    />
                  ) : (
                    <p className="mt-1 font-medium">{partner.postal_code}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Banking Details */}
          <Card>
            <CardHeader>
              <CardTitle>Banking Details</CardTitle>
              <CardDescription>For commission payouts (encrypted)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {partner.bank_name && (
                  <div>
                    <Label className="text-gray-600">Bank Name</Label>
                    <div className="flex items-center mt-1">
                      <CreditCard className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="font-medium">{partner.bank_name}</span>
                    </div>
                  </div>
                )}
                {partner.account_holder && (
                  <div>
                    <Label className="text-gray-600">Account Holder</Label>
                    <p className="mt-1 font-medium">{partner.account_holder}</p>
                  </div>
                )}
                {partner.account_number && (
                  <div>
                    <Label className="text-gray-600">Account Number</Label>
                    <p className="mt-1 font-medium font-mono">{partner.account_number}</p>
                  </div>
                )}
                {partner.account_type && (
                  <div>
                    <Label className="text-gray-600">Account Type</Label>
                    <p className="mt-1 font-medium capitalize">{partner.account_type}</p>
                  </div>
                )}
                {partner.branch_code && (
                  <div>
                    <Label className="text-gray-600">Branch Code</Label>
                    <p className="mt-1 font-medium">{partner.branch_code}</p>
                  </div>
                )}
              </div>
              {(!partner.bank_name || !partner.account_number) && (
                <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded">
                  Banking details not provided. Please contact support to add payment information.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Stats */}
        <div className="space-y-6">
          {/* Partner Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className={`h-5 w-5 mr-2 ${TIER_COLORS[partner.tier]}`} />
                <span className="capitalize">{partner.tier} Partner</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-gray-600">Commission Rate</Label>
                <p className="mt-1 text-2xl font-bold text-circleTel-orange">
                  {partner.commission_rate}%
                </p>
              </div>

              <Separator />

              <div>
                <Label className="text-gray-600">Total Leads</Label>
                <p className="mt-1 text-xl font-bold">{partner.total_leads}</p>
              </div>

              <div>
                <Label className="text-gray-600">Converted Leads</Label>
                <p className="mt-1 text-xl font-bold text-green-600">
                  {partner.converted_leads}
                </p>
              </div>

              <Separator />

              <div>
                <Label className="text-gray-600">Total Earned</Label>
                <p className="mt-1 text-xl font-bold text-green-700">
                  R{partner.total_commission_earned.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div>
                <Label className="text-gray-600">Pending Commission</Label>
                <p className="mt-1 text-xl font-bold text-blue-700">
                  R{partner.pending_commission.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {partner.partner_number && (
                <div>
                  <Label className="text-gray-600">Partner Number</Label>
                  <p className="mt-1 font-mono font-semibold">{partner.partner_number}</p>
                </div>
              )}

              <div>
                <Label className="text-gray-600">Status</Label>
                <div className="mt-1">
                  <Badge className={STATUS_COLORS[partner.status]}>
                    {partner.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-gray-600">Compliance</Label>
                <div className="mt-1">
                  <Badge variant="outline">
                    {partner.compliance_status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-gray-600">Member Since</Label>
                <div className="flex items-center mt-1 text-sm text-gray-700">
                  <Calendar className="h-3 w-3 mr-1" />
                  {format(new Date(partner.created_at), 'MMMM yyyy')}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
