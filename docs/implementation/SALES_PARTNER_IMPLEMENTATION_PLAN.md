# Sales Partner Implementation Plan

**Document Version**: 1.0
**Date**: 2025-10-27
**Source**: Circle Tel Business Requirements Specification (Updated 25102025.md)
**Status**: Ready for Implementation

---

## Executive Summary

This document provides a comprehensive implementation plan for the Sales Partner Portal based on the user stories defined in Section 5.3 of the Circle Tel BRS. The implementation will enable sales partners to onboard, manage leads, track commissions, and access marketing resources through a dedicated portal.

---

## User Stories Overview

### 5.3.1 Partner Onboarding
**User Story**: As a partner, I want to register and upload verification documents.
**Acceptance Criteria**: Supabase user creation; KYC upload; approval notification.
**Process Flow**: `/admin/kyc/documents` → RBAC role=partner

### 5.3.2 Lead Management
**User Story**: As a partner, I want to manage leads through the portal.
**Acceptance Criteria**: Leads fetched from Supabase; status updates reflected in Zoho MCP.
**Process Flow**: `/admin/coverage-leads` → MCP

### 5.3.3 Commission Tracking
**User Story**: As a partner, I want to view commission history.
**Acceptance Criteria**: Data from MCP synced to Supabase dashboard.
**Process Flow**: MCP → `/admin/products`

### 5.3.4 Resource Access
**User Story**: As a partner, I want to access brochures and media.
**Acceptance Criteria**: Resources fetched from Strapi CMS.
**Process Flow**: `/admin/providers/logo` → Strapi

---

## Architecture Overview

### Technology Stack
- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Integrations**: Zoho MCP (CRM), Strapi (CMS), Resend (Email)
- **State Management**: React Query, Zustand (if needed)
- **UI Components**: shadcn/ui with CircleTel design system

### Directory Structure
```
app/
  partners/                          # Partner portal root
    page.tsx                         # Dashboard overview
    onboarding/                      # Registration flow
      page.tsx
      verify/page.tsx
    leads/                           # Lead management
      page.tsx
      [leadId]/page.tsx
    commissions/                     # Commission tracking
      page.tsx
      [commissionId]/page.tsx
    resources/                       # Resource library
      page.tsx
    layout.tsx                       # Partner portal layout
  api/
    partners/
      onboarding/route.ts
      leads/route.ts
      commissions/route.ts
      resources/route.ts

components/
  partners/                          # Partner-specific components
    onboarding/
      RegistrationForm.tsx
      KYCUpload.tsx
      ApprovalStatus.tsx
    leads/
      LeadsDashboard.tsx
      LeadsTable.tsx
      LeadDetails.tsx
    commissions/
      CommissionDashboard.tsx
      CommissionsList.tsx
      CommissionBreakdown.tsx
      PendingPayouts.tsx
    resources/
      ResourceLibrary.tsx
      ResourceCard.tsx
    PartnerNav.tsx
    PartnerStats.tsx

lib/
  partners/
    types.ts                         # Partner-related types
    api-client.ts                    # API client functions
    validations.ts                   # Form validations
```

---

## Phase 1: Foundation & RBAC Setup

### 1.1 RBAC Permissions

**File**: `lib/rbac/permissions.ts`

Add new permissions section:

```typescript
// Partners Management
PARTNERS: {
  VIEW: 'partners:view',                       // View partner portal
  REGISTER: 'partners:register',               // Register as partner
  VIEW_OWN_DATA: 'partners:view_own_data',     // View own data only
  MANAGE_LEADS: 'partners:manage_leads',       // Manage assigned leads
  VIEW_COMMISSIONS: 'partners:view_commissions', // View own commissions
  ACCESS_RESOURCES: 'partners:access_resources', // Access marketing materials
  UPDATE_PROFILE: 'partners:update_profile',   // Update partner profile
},

PARTNERS_ADMIN: {
  VIEW_ALL: 'partners_admin:view_all',         // View all partners
  APPROVE: 'partners_admin:approve',           // Approve partner applications
  REJECT: 'partners_admin:reject',             // Reject partner applications
  ASSIGN_LEADS: 'partners_admin:assign_leads', // Assign leads to partners
  MANAGE_COMMISSIONS: 'partners_admin:manage_commissions', // Manage commissions
  APPROVE_PAYOUTS: 'partners_admin:approve_payouts', // Approve commission payouts
  VIEW_ANALYTICS: 'partners_admin:view_analytics', // View partner analytics
},
```

### 1.2 Role Template

**File**: `lib/rbac/role-templates.ts`

Add Sales Partner role:

```typescript
{
  name: 'Sales Partner',
  description: 'External sales partners managing leads and tracking commissions',
  permissions: [
    PERMISSIONS.PARTNERS.VIEW,
    PERMISSIONS.PARTNERS.VIEW_OWN_DATA,
    PERMISSIONS.PARTNERS.MANAGE_LEADS,
    PERMISSIONS.PARTNERS.VIEW_COMMISSIONS,
    PERMISSIONS.PARTNERS.ACCESS_RESOURCES,
    PERMISSIONS.PARTNERS.UPDATE_PROFILE,
    PERMISSIONS.DASHBOARD.VIEW,
    PERMISSIONS.CUSTOMERS.VIEW, // Limited to own leads
    PERMISSIONS.ORDERS.VIEW,    // Limited to own orders
  ]
}
```

### 1.3 Portal Layout

**File**: `app/partners/layout.tsx`

```typescript
import { PermissionGate } from '@/components/rbac/PermissionGate'
import { PartnerNav } from '@/components/partners/PartnerNav'
import { PERMISSIONS } from '@/lib/rbac/permissions'

export default function PartnersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PermissionGate permissions={[PERMISSIONS.PARTNERS.VIEW]}>
      <div className="flex min-h-screen">
        <PartnerNav />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </PermissionGate>
  )
}
```

---

## Phase 2: Partner Onboarding (5.3.1)

### 2.1 Database Schema

**File**: `supabase/migrations/20251027000001_create_partners_system.sql`

```sql
-- Partners table
CREATE TABLE partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- Business Information
  business_name TEXT NOT NULL,
  registration_number TEXT,
  vat_number TEXT,
  business_type TEXT CHECK (business_type IN ('sole_proprietor', 'company', 'partnership')),

  -- Contact Information
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  alternative_phone TEXT,

  -- Address
  street_address TEXT NOT NULL,
  suburb TEXT,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  postal_code TEXT NOT NULL,

  -- Banking Details (encrypted)
  bank_name TEXT,
  account_holder TEXT,
  account_number TEXT,
  account_type TEXT,
  branch_code TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'under_review', 'approved', 'rejected', 'suspended')
  ),
  approval_notes TEXT,
  approved_by UUID REFERENCES admin_users(id),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,

  -- KYC Documents
  kyc_status TEXT DEFAULT 'incomplete' CHECK (
    kyc_status IN ('incomplete', 'submitted', 'verified', 'rejected')
  ),
  kyc_verified_at TIMESTAMPTZ,

  -- Performance Metrics
  total_leads INTEGER DEFAULT 0,
  converted_leads INTEGER DEFAULT 0,
  total_commission_earned DECIMAL(10, 2) DEFAULT 0,
  pending_commission DECIMAL(10, 2) DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- KYC Documents table
CREATE TABLE partner_kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,

  -- Document Details
  document_type TEXT NOT NULL CHECK (
    document_type IN (
      'id_document',
      'proof_of_address',
      'business_registration',
      'tax_certificate',
      'bank_statement',
      'other'
    )
  ),
  document_name TEXT NOT NULL,
  file_path TEXT NOT NULL,  -- Supabase Storage path
  file_size INTEGER,
  mime_type TEXT,

  -- Verification
  verification_status TEXT DEFAULT 'pending' CHECK (
    verification_status IN ('pending', 'approved', 'rejected')
  ),
  verified_by UUID REFERENCES admin_users(id),
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Metadata
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_partners_user_id ON partners(user_id);
CREATE INDEX idx_partners_status ON partners(status);
CREATE INDEX idx_partners_kyc_status ON partners(kyc_status);
CREATE INDEX idx_partner_kyc_partner_id ON partner_kyc_documents(partner_id);

-- RLS Policies
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_kyc_documents ENABLE ROW LEVEL SECURITY;

-- Partners can view/update own data
CREATE POLICY "partners_view_own_data"
  ON partners FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "partners_update_own_data"
  ON partners FOR UPDATE
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid());

-- Partners can view/upload own documents
CREATE POLICY "partners_view_own_documents"
  ON partner_kyc_documents FOR SELECT
  USING (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "partners_upload_documents"
  ON partner_kyc_documents FOR INSERT
  WITH CHECK (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

-- Admins can view/manage all partners
CREATE POLICY "admins_view_all_partners"
  ON partners FOR SELECT
  USING (user_has_permission('partners_admin:view_all'));

CREATE POLICY "admins_manage_partners"
  ON partners FOR ALL
  USING (user_has_permission('partners_admin:approve'))
  WITH CHECK (user_has_permission('partners_admin:approve'));
```

### 2.2 Registration API

**File**: `app/api/partners/onboarding/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const registrationSchema = z.object({
  business_name: z.string().min(2),
  registration_number: z.string().optional(),
  vat_number: z.string().optional(),
  business_type: z.enum(['sole_proprietor', 'company', 'partnership']),
  contact_person: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  street_address: z.string().min(5),
  city: z.string().min(2),
  province: z.string().min(2),
  postal_code: z.string().min(4),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate request body
    const body = await request.json()
    const validatedData = registrationSchema.parse(body)

    // Check if partner already exists
    const { data: existingPartner } = await supabase
      .from('partners')
      .select('id, status')
      .eq('user_id', user.id)
      .single()

    if (existingPartner) {
      return NextResponse.json(
        { error: 'Partner application already exists', status: existingPartner.status },
        { status: 400 }
      )
    }

    // Create partner record
    const { data: partner, error: insertError } = await supabase
      .from('partners')
      .insert({
        user_id: user.id,
        ...validatedData,
        status: 'pending',
        kyc_status: 'incomplete',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Partner creation error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create partner application' },
        { status: 500 }
      )
    }

    // Send notification email (via Resend)
    // TODO: Implement email notification

    return NextResponse.json({
      success: true,
      partner,
      message: 'Partner application submitted successfully'
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get partner status
    const { data: partner, error } = await supabase
      .from('partners')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Partner not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ partner })

  } catch (error) {
    console.error('Get partner error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### 2.3 KYC Document Upload

**File**: `app/api/partners/kyc/upload/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get partner ID
    const { data: partner } = await supabase
      .from('partners')
      .select('id, status')
      .eq('user_id', user.id)
      .single()

    if (!partner) {
      return NextResponse.json(
        { error: 'Partner not found' },
        { status: 404 }
      )
    }

    // Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const documentType = formData.get('document_type') as string

    if (!file || !documentType) {
      return NextResponse.json(
        { error: 'File and document type are required' },
        { status: 400 }
      )
    }

    // Upload to Supabase Storage
    const fileName = `${partner.id}/${documentType}_${Date.now()}_${file.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('partner-kyc-documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload document' },
        { status: 500 }
      )
    }

    // Create document record
    const { data: document, error: dbError } = await supabase
      .from('partner_kyc_documents')
      .insert({
        partner_id: partner.id,
        document_type: documentType,
        document_name: file.name,
        file_path: uploadData.path,
        file_size: file.size,
        mime_type: file.type,
        verification_status: 'pending',
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to save document record' },
        { status: 500 }
      )
    }

    // Update partner KYC status
    await supabase
      .from('partners')
      .update({ kyc_status: 'submitted' })
      .eq('id', partner.id)

    return NextResponse.json({
      success: true,
      document,
      message: 'Document uploaded successfully'
    })

  } catch (error) {
    console.error('KYC upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### 2.4 Registration Form Component

**File**: `components/partners/onboarding/RegistrationForm.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface RegistrationFormData {
  business_name: string
  registration_number?: string
  vat_number?: string
  business_type: 'sole_proprietor' | 'company' | 'partnership'
  contact_person: string
  email: string
  phone: string
  street_address: string
  city: string
  province: string
  postal_code: string
}

export function RegistrationForm() {
  const router = useRouter()
  const [formData, setFormData] = useState<RegistrationFormData>({
    business_name: '',
    business_type: 'sole_proprietor',
    contact_person: '',
    email: '',
    phone: '',
    street_address: '',
    city: '',
    province: '',
    postal_code: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/partners/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit application')
      }

      // Redirect to KYC upload
      router.push('/partners/onboarding/verify')

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Partner Registration</CardTitle>
        <CardDescription>
          Complete your business information to become a CircleTel sales partner
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Business Information</h3>

            <div>
              <Label htmlFor="business_name">Business Name *</Label>
              <Input
                id="business_name"
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="business_type">Business Type *</Label>
              <Select
                value={formData.business_type}
                onValueChange={(value: any) => setFormData({ ...formData, business_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sole_proprietor">Sole Proprietor</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="partnership">Partnership</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="registration_number">Registration Number</Label>
                <Input
                  id="registration_number"
                  value={formData.registration_number || ''}
                  onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="vat_number">VAT Number</Label>
                <Input
                  id="vat_number"
                  value={formData.vat_number || ''}
                  onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Information</h3>

            <div>
              <Label htmlFor="contact_person">Contact Person *</Label>
              <Input
                id="contact_person"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Business Address</h3>

            <div>
              <Label htmlFor="street_address">Street Address *</Label>
              <Input
                id="street_address"
                value={formData.street_address}
                onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="province">Province *</Label>
                <Input
                  id="province"
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="postal_code">Postal Code *</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Continue to Verification'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

---

## Phase 3: Lead Management (5.3.2)

### 3.1 Database Schema

**File**: Add to `supabase/migrations/20251027000001_create_partners_system.sql`

```sql
-- Partner Leads (extends existing coverage_leads)
ALTER TABLE coverage_leads
ADD COLUMN IF NOT EXISTS assigned_partner_id UUID REFERENCES partners(id),
ADD COLUMN IF NOT EXISTS partner_assigned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS partner_notes TEXT,
ADD COLUMN IF NOT EXISTS partner_last_contact TIMESTAMPTZ;

-- Lead Activities (tracking partner interactions)
CREATE TABLE partner_lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES coverage_leads(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,

  -- Activity Details
  activity_type TEXT NOT NULL CHECK (
    activity_type IN ('call', 'email', 'meeting', 'quote_sent', 'follow_up', 'note')
  ),
  subject TEXT,
  description TEXT,
  outcome TEXT,

  -- Next Action
  next_action TEXT,
  next_action_date TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_coverage_leads_partner ON coverage_leads(assigned_partner_id);
CREATE INDEX idx_partner_activities_lead ON partner_lead_activities(lead_id);
CREATE INDEX idx_partner_activities_partner ON partner_lead_activities(partner_id);

-- RLS Policies
ALTER TABLE partner_lead_activities ENABLE ROW LEVEL SECURITY;

-- Partners can view/manage own assigned leads
CREATE POLICY "partners_view_assigned_leads"
  ON coverage_leads FOR SELECT
  USING (
    assigned_partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

-- Partners can add activities to own leads
CREATE POLICY "partners_add_activities"
  ON partner_lead_activities FOR INSERT
  WITH CHECK (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "partners_view_own_activities"
  ON partner_lead_activities FOR SELECT
  USING (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );
```

### 3.2 Lead Management API

**File**: `app/api/partners/leads/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get partner ID
    const { data: partner } = await supabase
      .from('partners')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!partner) {
      return NextResponse.json(
        { error: 'Partner not found' },
        { status: 404 }
      )
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('coverage_leads')
      .select('*', { count: 'exact' })
      .eq('assigned_partner_id', partner.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: leads, error, count } = await query

    if (error) {
      console.error('Leads query error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      leads,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Get leads error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## Phase 4: Commission Tracking (5.3.3)

This phase is already well-documented in `/docs/features/backlog/COMMISSION_TRACKING_FEATURE_SPEC.md`.

**Key Implementation Files**:
- Database: `supabase/migrations/20251027000002_create_commission_tracking.sql`
- API: `app/api/partners/commissions/*`
- UI: `components/partners/commissions/*`
- Types: `lib/types/commission-types.ts`

**Reference**: See COMMISSION_TRACKING_FEATURE_SPEC.md for complete implementation details.

---

## Phase 5: Resource Access (5.3.4)

### 5.1 Database Schema

**File**: `supabase/migrations/20251027000003_create_partner_resources.sql`

```sql
-- Partner Resources
CREATE TABLE partner_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Resource Details
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL CHECK (
    resource_type IN (
      'brochure',
      'presentation',
      'price_list',
      'product_sheet',
      'case_study',
      'training_video',
      'template',
      'other'
    )
  ),
  category TEXT,
  tags TEXT[],

  -- File Information
  file_path TEXT,  -- Supabase Storage or Strapi URL
  file_size INTEGER,
  file_type TEXT,
  thumbnail_url TEXT,

  -- Strapi Integration
  strapi_id TEXT,

  -- Access Control
  is_public BOOLEAN DEFAULT false,
  requires_approval BOOLEAN DEFAULT false,

  -- Analytics
  download_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,

  -- Status
  status TEXT DEFAULT 'published' CHECK (
    status IN ('draft', 'published', 'archived')
  ),

  -- Metadata
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resource Downloads (tracking)
CREATE TABLE partner_resource_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID REFERENCES partner_resources(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,

  -- Download Details
  download_type TEXT CHECK (download_type IN ('view', 'download')),
  ip_address INET,
  user_agent TEXT,

  -- Metadata
  downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_partner_resources_type ON partner_resources(resource_type);
CREATE INDEX idx_partner_resources_status ON partner_resources(status);
CREATE INDEX idx_resource_downloads_resource ON partner_resource_downloads(resource_id);
CREATE INDEX idx_resource_downloads_partner ON partner_resource_downloads(partner_id);

-- RLS Policies
ALTER TABLE partner_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_resource_downloads ENABLE ROW LEVEL SECURITY;

-- Partners can view published resources
CREATE POLICY "partners_view_resources"
  ON partner_resources FOR SELECT
  USING (status = 'published');

-- Partners can track downloads
CREATE POLICY "partners_track_downloads"
  ON partner_resource_downloads FOR INSERT
  WITH CHECK (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

-- Partners can view own download history
CREATE POLICY "partners_view_own_downloads"
  ON partner_resource_downloads FOR SELECT
  USING (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );
```

### 5.2 Resource Library API

**File**: `app/api/partners/resources/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')
    const category = searchParams.get('category')

    // Build query
    let query = supabase
      .from('partner_resources')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    if (type) {
      query = query.eq('resource_type', type)
    }

    if (category) {
      query = query.eq('category', category)
    }

    const { data: resources, error } = await query

    if (error) {
      console.error('Resources query error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch resources' },
        { status: 500 }
      )
    }

    return NextResponse.json({ resources })

  } catch (error) {
    console.error('Get resources error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## Phase 6: Partner Dashboard

### 6.1 Dashboard Overview Page

**File**: `app/partners/page.tsx`

```typescript
'use client'

import { PermissionGate } from '@/components/rbac/PermissionGate'
import { PartnerStats } from '@/components/partners/PartnerStats'
import { RecentLeads } from '@/components/partners/RecentLeads'
import { CommissionSummary } from '@/components/partners/CommissionSummary'
import { QuickActions } from '@/components/partners/QuickActions'
import { PERMISSIONS } from '@/lib/rbac/permissions'

export default function PartnerDashboard() {
  return (
    <PermissionGate permissions={[PERMISSIONS.PARTNERS.VIEW]}>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Partner Dashboard</h1>

        {/* Key Metrics */}
        <PartnerStats />

        {/* Quick Actions */}
        <QuickActions />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Leads */}
          <RecentLeads />

          {/* Commission Summary */}
          <CommissionSummary />
        </div>
      </div>
    </PermissionGate>
  )
}
```

---

## Implementation Timeline

| Phase | Description | Estimated Time | Priority |
|-------|-------------|----------------|----------|
| **Phase 1** | Foundation & RBAC Setup | 4 hours | Critical |
| **Phase 2** | Partner Onboarding | 12 hours | Critical |
| **Phase 3** | Lead Management | 10 hours | High |
| **Phase 4** | Commission Tracking | 15 hours | High |
| **Phase 5** | Resource Access | 8 hours | Medium |
| **Phase 6** | Partner Dashboard | 6 hours | High |
| **Testing** | E2E & Integration Tests | 8 hours | Critical |
| **Documentation** | User Guides & API Docs | 4 hours | Medium |
| **Total** | | **67 hours** | |

---

## Testing Strategy

### Unit Tests
- API route handlers
- Form validations
- Business logic functions

### Integration Tests
- Partner registration flow
- KYC document upload
- Lead assignment and tracking
- Commission calculations
- Zoho MCP sync

### E2E Tests (Playwright)
```typescript
test('Partner onboarding flow', async ({ page }) => {
  // 1. Register as partner
  await page.goto('/partners/onboarding')
  await page.fill('[name="business_name"]', 'Test Business')
  // ... fill form
  await page.click('button[type="submit"]')

  // 2. Upload KYC documents
  await expect(page).toHaveURL('/partners/onboarding/verify')
  await page.setInputFiles('[name="file"]', './test-docs/id.pdf')
  await page.click('button:has-text("Upload")')

  // 3. Check status
  await expect(page.locator('.status')).toHaveText('Under Review')
})

test('Partner lead management', async ({ page }) => {
  // Login as partner
  await page.goto('/partners/leads')

  // View leads
  await expect(page.locator('.leads-table')).toBeVisible()

  // Filter leads
  await page.selectOption('[name="status"]', 'new')
  await page.click('button:has-text("Filter")')

  // Open lead details
  await page.click('.lead-row:first-child')
  await expect(page).toHaveURL(/\/partners\/leads\/[a-z0-9-]+/)
})
```

---

## Documentation Deliverables

### User Documentation
1. **Partner Onboarding Guide** (`docs/user-guides/PARTNER_ONBOARDING_GUIDE.md`)
2. **Lead Management Guide** (`docs/user-guides/PARTNER_LEAD_MANAGEMENT_GUIDE.md`)
3. **Commission Tracking Guide** (`docs/user-guides/PARTNER_COMMISSION_GUIDE.md`)
4. **Resource Library Guide** (`docs/user-guides/PARTNER_RESOURCES_GUIDE.md`)

### Technical Documentation
1. **API Documentation** (`docs/api/PARTNERS_API.md`)
2. **Database Schema** (`docs/database/PARTNERS_SCHEMA.md`)
3. **Integration Guide** (Zoho MCP sync)
4. **RBAC Configuration** (Partner permissions)

### Admin Documentation
1. **Partner Approval Process** (`docs/admin/PARTNER_APPROVAL_GUIDE.md`)
2. **Lead Assignment** (`docs/admin/PARTNER_LEAD_ASSIGNMENT.md`)
3. **Commission Management** (`docs/admin/PARTNER_COMMISSION_MANAGEMENT.md`)

---

## Integration Requirements

### Zoho MCP Integration
- Sync partner data to Zoho Contacts
- Sync leads between CircleTel and Zoho
- Sync commission calculations from Zoho to Supabase
- Webhook handlers for real-time updates

### Strapi CMS Integration
- Fetch partner resources from Strapi
- Category and tag management
- Media library access

### Resend Email Integration
- Partner welcome emails
- Application status updates
- KYC verification notifications
- Lead assignment notifications
- Commission payout notifications

---

## Security Considerations

### Data Protection
- Encrypt banking details at rest
- Secure KYC document storage (Supabase Storage with RLS)
- Audit trail for all partner actions
- POPIA compliance for personal information

### Access Control
- Row Level Security (RLS) on all partner tables
- Permission checks at 3 layers (UI, API, Database)
- Partners can only access own data
- Admin oversight capabilities

### File Upload Security
- File type validation
- Size limits (10MB per document)
- Virus scanning (future enhancement)
- Secure URLs with time-limited access

---

## Success Metrics

### Partner Onboarding
- Time to complete registration: < 10 minutes
- Time to approval: < 48 hours
- Onboarding completion rate: > 80%

### Lead Management
- Lead response time: < 24 hours
- Lead conversion rate: Track and improve
- Average leads per partner: Monitor distribution

### Commission Tracking
- Commission calculation accuracy: 100%
- Payout processing time: < 7 days
- Partner satisfaction with transparency: > 90%

### Resource Access
- Resource download rate: Monitor engagement
- Most popular resources: Track and optimize
- Resource effectiveness: Survey partners

---

## Next Steps

1. **Review and Approve** this implementation plan
2. **Set up development branch** for partner portal
3. **Begin Phase 1** (Foundation & RBAC)
4. **Create Supabase Storage buckets** for KYC documents
5. **Configure Zoho MCP** integration endpoints
6. **Set up Strapi** for partner resources
7. **Configure Resend** email templates

---

**Document Status**: Ready for Implementation
**Last Updated**: 2025-10-27
**Approved By**: Pending
**Implementation Start Date**: TBD
