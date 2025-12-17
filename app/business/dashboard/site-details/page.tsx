'use client';

/**
 * Business Dashboard - Site Details Page
 *
 * Stage 3 of B2B customer journey: Site details and RFI checklist.
 *
 * @module app/business/dashboard/site-details/page
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { JourneyProgressTracker } from '@/components/business-dashboard/journey';
import { SiteDetailsForm } from '@/components/business-dashboard/site-details';
import {
  SiteDetailsFormData,
  SitePhoto,
  SiteDetails,
  RFI_STATUS_LABELS,
  SITE_DETAILS_STATUS_LABELS,
} from '@/types/site-details';
import { JourneyProgress, B2B_JOURNEY_STAGES } from '@/lib/business/journey-config';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// Types
// ============================================================================

interface PageData {
  businessCustomer: {
    id: string;
    company_name: string;
    account_number: string;
  } | null;
  journey: JourneyProgress | null;
  siteDetails: SiteDetails | null;
}

// ============================================================================
// Main Component
// ============================================================================

export default function SiteDetailsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch page data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/business-dashboard/site-details');

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load site details');
        }

        const result = await response.json();
        setData(result.data);
      } catch (err) {
        console.error('Error fetching site details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Handle save draft
  const handleSave = useCallback(async (formData: SiteDetailsFormData, photos: SitePhoto[]) => {
    try {
      const response = await fetch('/api/business-dashboard/site-details', {
        method: data?.siteDetails ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: data?.siteDetails?.id,
          data: formData,
          photos,
          status: 'draft',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save');
      }

      const result = await response.json();
      setData((prev) => prev ? { ...prev, siteDetails: result.data } : null);

      toast({
        title: 'Draft Saved',
        description: 'Your site details have been saved as a draft.',
      });
    } catch (err) {
      console.error('Error saving site details:', err);
      toast({
        title: 'Save Failed',
        description: err instanceof Error ? err.message : 'Failed to save site details',
        variant: 'destructive',
      });
      throw err;
    }
  }, [data?.siteDetails, toast]);

  // Handle submit
  const handleSubmit = useCallback(async (formData: SiteDetailsFormData, photos: SitePhoto[]) => {
    try {
      const response = await fetch('/api/business-dashboard/site-details', {
        method: data?.siteDetails ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: data?.siteDetails?.id,
          data: formData,
          photos,
          status: 'submitted',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit');
      }

      const result = await response.json();
      setData((prev) => prev ? { ...prev, siteDetails: result.data } : null);

      toast({
        title: 'Site Details Submitted',
        description: 'Your site details have been submitted for review.',
      });

      // Redirect to dashboard after successful submission
      setTimeout(() => {
        router.push('/business/dashboard');
      }, 1500);
    } catch (err) {
      console.error('Error submitting site details:', err);
      toast({
        title: 'Submission Failed',
        description: err instanceof Error ? err.message : 'Failed to submit site details',
        variant: 'destructive',
      });
      throw err;
    }
  }, [data?.siteDetails, toast, router]);

  // Handle photo upload
  const handlePhotoUpload = useCallback(async (files: File[]): Promise<SitePhoto[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    const response = await fetch('/api/business-dashboard/site-details/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload photos');
    }

    const result = await response.json();
    return result.photos;
  }, []);

  // Handle photo remove
  const handlePhotoRemove = useCallback(async (photo: SitePhoto): Promise<void> => {
    const response = await fetch('/api/business-dashboard/site-details/upload', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: photo.url }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to remove photo');
    }
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href="/business/dashboard" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Site Details</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Check if user is at the right stage
  const canAccessPage = data?.journey?.currentStage === 'site_details' ||
    data?.journey?.completedStages.includes('site_details') ||
    data?.siteDetails !== null;

  if (!canAccessPage) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href="/business/dashboard" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Stage Not Available</AlertTitle>
          <AlertDescription>
            You need to complete the previous stages before accessing site details.
            Please complete Business Verification (Stage 2) first.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const isReadOnly = data?.siteDetails?.status === 'approved' ||
    data?.siteDetails?.status === 'under_review';

  const currentStage = B2B_JOURNEY_STAGES.find((s) => s.id === 'site_details');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/business/dashboard">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to Dashboard</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MapPin className="h-6 w-6 text-circleTel-orange" />
              Site Details
            </h1>
            <p className="text-sm text-gray-500">
              Stage 3: {currentStage?.description}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        {data?.siteDetails && (
          <div className="flex items-center gap-2">
            <Badge
              variant={
                data.siteDetails.status === 'approved'
                  ? 'default'
                  : data.siteDetails.status === 'submitted'
                  ? 'secondary'
                  : data.siteDetails.status === 'rejected'
                  ? 'destructive'
                  : 'outline'
              }
              className={
                data.siteDetails.status === 'approved'
                  ? 'bg-green-500 hover:bg-green-600'
                  : ''
              }
            >
              {SITE_DETAILS_STATUS_LABELS[data.siteDetails.status]}
            </Badge>
            <Badge
              variant={
                data.siteDetails.rfi_status === 'ready'
                  ? 'default'
                  : data.siteDetails.rfi_status === 'pending'
                  ? 'secondary'
                  : 'destructive'
              }
              className={
                data.siteDetails.rfi_status === 'ready'
                  ? 'bg-green-500 hover:bg-green-600'
                  : ''
              }
            >
              RFI: {RFI_STATUS_LABELS[data.siteDetails.rfi_status]}
            </Badge>
          </div>
        )}
      </div>

      {/* Journey Progress */}
      {data?.journey && (
        <Card>
          <CardContent className="pt-6">
            <JourneyProgressTracker
              progress={data.journey}
              variant="horizontal"
              showLabels
            />
          </CardContent>
        </Card>
      )}

      {/* Submitted/Approved Alert */}
      {data?.siteDetails?.status === 'submitted' && (
        <Alert className="border-blue-200 bg-blue-50">
          <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
          <AlertTitle className="text-blue-700">Under Review</AlertTitle>
          <AlertDescription className="text-blue-600">
            Your site details have been submitted and are under review. You will be
            notified once the review is complete.
          </AlertDescription>
        </Alert>
      )}

      {data?.siteDetails?.status === 'approved' && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-700">Site Details Approved</AlertTitle>
          <AlertDescription className="text-green-600">
            Your site details have been approved. You can proceed to the next stage.
          </AlertDescription>
        </Alert>
      )}

      {data?.siteDetails?.status === 'rejected' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Site Details Rejected</AlertTitle>
          <AlertDescription>
            {data.siteDetails.rejection_reason ||
              'Your site details were rejected. Please review and update the information.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <SiteDetailsForm
        initialData={data?.siteDetails ? {
          premises_ownership: data.siteDetails.premises_ownership,
          property_type: data.siteDetails.property_type,
          building_name: data.siteDetails.building_name || undefined,
          floor_level: data.siteDetails.floor_level || undefined,
          use_different_address: !!data.siteDetails.installation_address,
          installation_address: data.siteDetails.installation_address || undefined,
          room_name: data.siteDetails.room_name,
          equipment_location: data.siteDetails.equipment_location,
          cable_entry_point: data.siteDetails.cable_entry_point || undefined,
          has_rack_facility: data.siteDetails.has_rack_facility,
          has_access_control: data.siteDetails.has_access_control,
          has_air_conditioning: data.siteDetails.has_air_conditioning,
          has_ac_power: data.siteDetails.has_ac_power,
          rfi_notes: data.siteDetails.rfi_notes || undefined,
          access_type: data.siteDetails.access_type,
          access_instructions: data.siteDetails.access_instructions || undefined,
          building_manager_name: data.siteDetails.building_manager_name || undefined,
          building_manager_phone: data.siteDetails.building_manager_phone || undefined,
          building_manager_email: data.siteDetails.building_manager_email || undefined,
          landlord_name: data.siteDetails.landlord_name || undefined,
          landlord_contact: data.siteDetails.landlord_contact || undefined,
        } : undefined}
        photos={data?.siteDetails?.site_photos || []}
        onSave={handleSave}
        onSubmit={handleSubmit}
        onPhotoUpload={handlePhotoUpload}
        onPhotoRemove={handlePhotoRemove}
        isReadOnly={isReadOnly}
      />
    </div>
  );
}
