'use client';

/**
 * Site Details Form Component
 *
 * Multi-step form for capturing B2B customer site details and RFI status.
 * Stage 3 of the B2B customer journey.
 *
 * @module components/business-dashboard/site-details/SiteDetailsForm
 */

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import {
  Building2,
  MapPin,
  CheckSquare,
  DoorOpen,
  Camera,
  ChevronRight,
  ChevronLeft,
  Save,
  Send,
  Loader2,
  Info,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  SiteDetailsFormData,
  SitePhoto,
  PremisesOwnership,
  PropertyType,
  EquipmentLocation,
  SiteAccessType,
  PREMISES_OWNERSHIP_LABELS,
  PROPERTY_TYPE_LABELS,
  EQUIPMENT_LOCATION_LABELS,
  ACCESS_TYPE_LABELS,
  RFI_CHECKLIST_CONFIG,
  calculateRFIStatus,
} from '@/types/site-details';

// ============================================================================
// Form Validation Schema
// ============================================================================

const siteDetailsSchema = z.object({
  // Premises Information
  premises_ownership: z.enum(['owned', 'leased'] as const, {
    required_error: 'Please select premises ownership',
  }),
  property_type: z.enum(
    ['office', 'retail', 'warehouse', 'industrial', 'data_center', 'mixed_use', 'other'] as const,
    { required_error: 'Please select property type' }
  ),
  building_name: z.string().optional(),
  floor_level: z.string().optional(),
  use_different_address: z.boolean().default(false),
  installation_address: z
    .object({
      street: z.string().min(1, 'Street is required'),
      suburb: z.string().optional(),
      city: z.string().min(1, 'City is required'),
      province: z.string().min(1, 'Province is required'),
      postal_code: z.string().min(4, 'Postal code must be at least 4 characters'),
    })
    .optional(),

  // Equipment Location
  room_name: z.string().min(1, 'Room/area name is required'),
  equipment_location: z.enum(
    ['rack_mounted', 'wall_mounted', 'floor_standing', 'other'] as const,
    { required_error: 'Please select equipment location type' }
  ),
  cable_entry_point: z.string().optional(),

  // RFI Checklist
  has_rack_facility: z.boolean().default(false),
  has_access_control: z.boolean().default(false),
  has_air_conditioning: z.boolean().default(false),
  has_ac_power: z.boolean().default(false),
  rfi_notes: z.string().optional(),

  // Access Information
  access_type: z.enum(['24_7', 'business_hours', 'appointment_only'] as const, {
    required_error: 'Please select access type',
  }),
  access_instructions: z.string().optional(),

  // Building Manager (required for leased)
  building_manager_name: z.string().optional(),
  building_manager_phone: z.string().optional(),
  building_manager_email: z.string().email('Invalid email').optional().or(z.literal('')),

  // Landlord (for leased)
  landlord_name: z.string().optional(),
  landlord_contact: z.string().optional(),
});

type FormValues = z.infer<typeof siteDetailsSchema>;

// ============================================================================
// Types
// ============================================================================

interface SiteDetailsFormProps {
  initialData?: Partial<SiteDetailsFormData>;
  photos?: SitePhoto[];
  onSave: (data: SiteDetailsFormData, photos: SitePhoto[]) => Promise<void>;
  onSubmit: (data: SiteDetailsFormData, photos: SitePhoto[]) => Promise<void>;
  onPhotoUpload: (files: File[]) => Promise<SitePhoto[]>;
  onPhotoRemove: (photo: SitePhoto) => Promise<void>;
  isReadOnly?: boolean;
  className?: string;
}

interface FormStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

// ============================================================================
// Form Steps Configuration
// ============================================================================

const FORM_STEPS: FormStep[] = [
  {
    id: 'premises',
    title: 'Premises Information',
    description: 'Property ownership and type',
    icon: Building2,
  },
  {
    id: 'equipment',
    title: 'Equipment Location',
    description: 'Where equipment will be installed',
    icon: MapPin,
  },
  {
    id: 'rfi',
    title: 'RFI Checklist',
    description: 'Ready for Installation requirements',
    icon: CheckSquare,
  },
  {
    id: 'access',
    title: 'Access Information',
    description: 'Site access and contacts',
    icon: DoorOpen,
  },
  {
    id: 'photos',
    title: 'Site Photos',
    description: 'Upload site images',
    icon: Camera,
  },
];

// ============================================================================
// Step Progress Component
// ============================================================================

function StepProgress({
  steps,
  currentStep,
  onStepClick,
}: {
  steps: FormStep[];
  currentStep: number;
  onStepClick: (index: number) => void;
}) {
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isClickable = index <= currentStep;

        return (
          <div key={step.id} className="flex items-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => isClickable && onStepClick(index)}
                    disabled={!isClickable}
                    className={cn(
                      'flex flex-col items-center transition-all duration-200',
                      isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                    )}
                  >
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all',
                        isCompleted && 'bg-green-500 border-green-500 text-white',
                        isCurrent && 'bg-circleTel-orange border-circleTel-orange text-white',
                        !isCompleted && !isCurrent && 'bg-gray-100 border-gray-300 text-gray-400'
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 size={20} />
                      ) : (
                        <Icon size={18} />
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-xs mt-1 font-medium hidden sm:block',
                        isCurrent && 'text-circleTel-orange',
                        isCompleted && 'text-green-600',
                        !isCompleted && !isCurrent && 'text-gray-400'
                      )}
                    >
                      {step.title}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-semibold">{step.title}</p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {index < steps.length - 1 && (
              <div
                className={cn(
                  'w-8 sm:w-16 h-0.5 mx-2 transition-all',
                  index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// RFI Status Badge Component
// ============================================================================

function RFIStatusBadge({
  hasRackFacility,
  hasAccessControl,
  hasAirConditioning,
  hasAcPower,
}: {
  hasRackFacility: boolean;
  hasAccessControl: boolean;
  hasAirConditioning: boolean;
  hasAcPower: boolean;
}) {
  const summary = calculateRFIStatus(hasRackFacility, hasAccessControl, hasAirConditioning, hasAcPower);

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant={
          summary.status === 'ready'
            ? 'default'
            : summary.status === 'pending'
            ? 'secondary'
            : 'destructive'
        }
        className={cn(
          summary.status === 'ready' && 'bg-green-500 hover:bg-green-600'
        )}
      >
        {summary.status === 'ready'
          ? 'Ready for Installation'
          : summary.status === 'pending'
          ? `${summary.passed_count}/4 Requirements Met`
          : 'Not Ready'}
      </Badge>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function SiteDetailsForm({
  initialData,
  photos: initialPhotos = [],
  onSave,
  onSubmit,
  onPhotoUpload,
  onPhotoRemove,
  isReadOnly = false,
  className,
}: SiteDetailsFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [photos, setPhotos] = useState<SitePhoto[]>(initialPhotos);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(siteDetailsSchema),
    defaultValues: {
      premises_ownership: initialData?.premises_ownership,
      property_type: initialData?.property_type,
      building_name: initialData?.building_name || '',
      floor_level: initialData?.floor_level || '',
      use_different_address: initialData?.use_different_address || false,
      installation_address: initialData?.installation_address,
      room_name: initialData?.room_name || '',
      equipment_location: initialData?.equipment_location,
      cable_entry_point: initialData?.cable_entry_point || '',
      has_rack_facility: initialData?.has_rack_facility || false,
      has_access_control: initialData?.has_access_control || false,
      has_air_conditioning: initialData?.has_air_conditioning || false,
      has_ac_power: initialData?.has_ac_power || false,
      rfi_notes: initialData?.rfi_notes || '',
      access_type: initialData?.access_type,
      access_instructions: initialData?.access_instructions || '',
      building_manager_name: initialData?.building_manager_name || '',
      building_manager_phone: initialData?.building_manager_phone || '',
      building_manager_email: initialData?.building_manager_email || '',
      landlord_name: initialData?.landlord_name || '',
      landlord_contact: initialData?.landlord_contact || '',
    },
  });

  const premisesOwnership = form.watch('premises_ownership');
  const useDifferentAddress = form.watch('use_different_address');
  const hasRackFacility = form.watch('has_rack_facility');
  const hasAccessControl = form.watch('has_access_control');
  const hasAirConditioning = form.watch('has_air_conditioning');
  const hasAcPower = form.watch('has_ac_power');

  // Handle photo upload
  const handlePhotoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingPhotos(true);
    try {
      const uploadedPhotos = await onPhotoUpload(Array.from(files));
      setPhotos((prev) => [...prev, ...uploadedPhotos]);
    } catch (error) {
      console.error('Failed to upload photos:', error);
    } finally {
      setUploadingPhotos(false);
    }
  }, [onPhotoUpload]);

  // Handle photo remove
  const handlePhotoRemove = useCallback(async (photo: SitePhoto) => {
    try {
      await onPhotoRemove(photo);
      setPhotos((prev) => prev.filter((p) => p.url !== photo.url));
    } catch (error) {
      console.error('Failed to remove photo:', error);
    }
  }, [onPhotoRemove]);

  // Handle save draft
  const handleSaveDraft = async () => {
    const values = form.getValues();
    setIsSaving(true);
    try {
      await onSave(values as SiteDetailsFormData, photos);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle form submit
  const handleFormSubmit = async (values: FormValues) => {
    if (photos.length === 0) {
      form.setError('root', { message: 'At least one site photo is required' });
      setCurrentStep(4); // Go to photos step
      return;
    }

    // Validate building manager for leased premises
    if (values.premises_ownership === 'leased') {
      if (!values.building_manager_name) {
        form.setError('building_manager_name', { message: 'Required for leased premises' });
        setCurrentStep(3); // Go to access step
        return;
      }
      if (!values.building_manager_phone && !values.building_manager_email) {
        form.setError('building_manager_phone', { message: 'Contact required for leased premises' });
        setCurrentStep(3);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit(values as SiteDetailsFormData, photos);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigation functions
  const goNext = () => {
    if (currentStep < FORM_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const goToStep = (index: number) => {
    if (index >= 0 && index <= currentStep) {
      setCurrentStep(index);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className={cn('space-y-6', className)}>
        {/* Step Progress */}
        <StepProgress steps={FORM_STEPS} currentStep={currentStep} onStepClick={goToStep} />

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {(() => {
                const StepIcon = FORM_STEPS[currentStep].icon;
                return <StepIcon className="w-5 h-5 text-circleTel-orange" />;
              })()}
              {FORM_STEPS[currentStep].title}
            </CardTitle>
            <CardDescription>{FORM_STEPS[currentStep].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Premises Information */}
            {currentStep === 0 && (
              <>
                {/* Premises Ownership */}
                <FormField
                  control={form.control}
                  name="premises_ownership"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Premises Ownership *</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isReadOnly}
                          className="flex gap-4"
                        >
                          {Object.entries(PREMISES_OWNERSHIP_LABELS).map(([value, label]) => (
                            <div key={value} className="flex items-center space-x-2">
                              <RadioGroupItem value={value} id={`ownership-${value}`} />
                              <label
                                htmlFor={`ownership-${value}`}
                                className="text-sm font-medium cursor-pointer"
                              >
                                {label}
                              </label>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Leased premises warning */}
                {premisesOwnership === 'leased' && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Landlord Consent Required</AlertTitle>
                    <AlertDescription>
                      For leased premises, landlord consent is required before installation can proceed.
                      You&apos;ll need to provide building manager details in the Access Information step.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Property Type */}
                <FormField
                  control={form.control}
                  name="property_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Type *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isReadOnly}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select property type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Building Name */}
                <FormField
                  control={form.control}
                  name="building_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Building Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Sandton City Office Tower"
                          {...field}
                          disabled={isReadOnly}
                        />
                      </FormControl>
                      <FormDescription>Optional - Enter if applicable</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Floor Level */}
                <FormField
                  control={form.control}
                  name="floor_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Floor Level</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Ground Floor, 3rd Floor"
                          {...field}
                          disabled={isReadOnly}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Different Installation Address */}
                <FormField
                  control={form.control}
                  name="use_different_address"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isReadOnly}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0 cursor-pointer">
                        Installation address differs from registered business address
                      </FormLabel>
                    </FormItem>
                  )}
                />

                {/* Installation Address (if different) */}
                {useDifferentAddress && (
                  <div className="space-y-4 pl-6 border-l-2 border-gray-200">
                    <FormField
                      control={form.control}
                      name="installation_address.street"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="123 Main Street"
                              {...field}
                              disabled={isReadOnly}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="installation_address.suburb"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Suburb</FormLabel>
                            <FormControl>
                              <Input placeholder="Sandton" {...field} disabled={isReadOnly} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="installation_address.city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City *</FormLabel>
                            <FormControl>
                              <Input placeholder="Johannesburg" {...field} disabled={isReadOnly} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="installation_address.province"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Province *</FormLabel>
                            <FormControl>
                              <Input placeholder="Gauteng" {...field} disabled={isReadOnly} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="installation_address.postal_code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postal Code *</FormLabel>
                            <FormControl>
                              <Input placeholder="2196" {...field} disabled={isReadOnly} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Step 2: Equipment Location */}
            {currentStep === 1 && (
              <>
                <FormField
                  control={form.control}
                  name="room_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room/Area Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Server Room, IT Room, Comms Room"
                          {...field}
                          disabled={isReadOnly}
                        />
                      </FormControl>
                      <FormDescription>
                        The name of the room or area where equipment will be installed
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="equipment_location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Equipment Mounting Type *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isReadOnly}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select mounting type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(EQUIPMENT_LOCATION_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How will the equipment be mounted/installed?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cable_entry_point"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cable Entry Point</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe how/where the fibre cable will enter the building (e.g., via existing conduit, through ceiling, etc.)"
                          {...field}
                          disabled={isReadOnly}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Step 3: RFI Checklist */}
            {currentStep === 2 && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-600">
                    Please confirm the following requirements for equipment installation:
                  </p>
                  <RFIStatusBadge
                    hasRackFacility={hasRackFacility}
                    hasAccessControl={hasAccessControl}
                    hasAirConditioning={hasAirConditioning}
                    hasAcPower={hasAcPower}
                  />
                </div>

                <div className="space-y-4">
                  {RFI_CHECKLIST_CONFIG.map((item) => (
                    <FormField
                      key={item.id}
                      control={form.control}
                      name={item.id as keyof FormValues}
                      render={({ field }) => (
                        <FormItem className="flex items-start space-x-3 p-4 rounded-lg border bg-gray-50">
                          <FormControl>
                            <Checkbox
                              checked={field.value as boolean}
                              onCheckedChange={field.onChange}
                              disabled={isReadOnly}
                              className="mt-1"
                            />
                          </FormControl>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <FormLabel className="!mt-0 font-semibold cursor-pointer">
                                {item.label}
                              </FormLabel>
                              {item.helpText && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="max-w-xs">{item.helpText}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                            <FormDescription>{item.description}</FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>

                {/* RFI Notes */}
                <FormField
                  control={form.control}
                  name="rfi_notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any notes about site readiness, special requirements, or items that need attention..."
                          {...field}
                          disabled={isReadOnly}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* RFI Status Summary */}
                {!hasRackFacility || !hasAccessControl || !hasAirConditioning || !hasAcPower ? (
                  <Alert variant="default">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Partial RFI Status</AlertTitle>
                    <AlertDescription>
                      You can still submit with incomplete RFI requirements. Our team will follow up
                      to address any missing items before installation.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-700">Ready for Installation</AlertTitle>
                    <AlertDescription className="text-green-600">
                      All RFI requirements have been confirmed. Your site is ready for equipment installation.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}

            {/* Step 4: Access Information */}
            {currentStep === 3 && (
              <>
                <FormField
                  control={form.control}
                  name="access_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Site Access Type *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isReadOnly}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select access type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(ACCESS_TYPE_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="access_instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Access Instructions</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Special access requirements, parking instructions, security procedures..."
                          {...field}
                          disabled={isReadOnly}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Building Manager (required for leased) */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    Building Manager Contact
                    {premisesOwnership === 'leased' && (
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                    )}
                  </h3>

                  {premisesOwnership === 'leased' && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Building manager contact is required for leased premises to coordinate installation access.
                      </AlertDescription>
                    </Alert>
                  )}

                  <FormField
                    control={form.control}
                    name="building_manager_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Name {premisesOwnership === 'leased' && '*'}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Building manager or property manager name"
                            {...field}
                            disabled={isReadOnly}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="building_manager_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., 011 123 4567"
                              {...field}
                              disabled={isReadOnly}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="building_manager_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="manager@building.co.za"
                              {...field}
                              disabled={isReadOnly}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Landlord Info (for leased premises) */}
                {premisesOwnership === 'leased' && (
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-semibold">Landlord Information (Optional)</h3>
                    <p className="text-sm text-gray-500">
                      Provide landlord details for consent coordination
                    </p>

                    <FormField
                      control={form.control}
                      name="landlord_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Landlord/Property Owner Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Property owner or management company"
                              {...field}
                              disabled={isReadOnly}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="landlord_contact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Landlord Contact</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Email or phone number"
                              {...field}
                              disabled={isReadOnly}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </>
            )}

            {/* Step 5: Site Photos */}
            {currentStep === 4 && (
              <>
                <Alert>
                  <Camera className="h-4 w-4" />
                  <AlertTitle>Site Photos Required</AlertTitle>
                  <AlertDescription>
                    Upload at least one photo showing the proposed equipment location and cable entry points.
                    This helps our installation team prepare for your site visit.
                  </AlertDescription>
                </Alert>

                {/* Photo Upload Area */}
                <div
                  className={cn(
                    'border-2 border-dashed rounded-lg p-8 text-center',
                    'hover:border-circleTel-orange hover:bg-orange-50 transition-colors',
                    uploadingPhotos && 'opacity-50 pointer-events-none'
                  )}
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/heic"
                    multiple
                    onChange={handlePhotoUpload}
                    disabled={isReadOnly || uploadingPhotos}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    {uploadingPhotos ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-10 h-10 text-circleTel-orange animate-spin" />
                        <p className="text-sm text-gray-600">Uploading photos...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Camera className="w-10 h-10 text-gray-400" />
                        <p className="font-medium">Click to upload photos</p>
                        <p className="text-sm text-gray-500">JPG, PNG, or HEIC (max 10MB each)</p>
                      </div>
                    )}
                  </label>
                </div>

                {/* Uploaded Photos */}
                {photos.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Uploaded Photos ({photos.length})</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {photos.map((photo, index) => (
                        <div key={photo.url} className="relative group">
                          <img
                            src={photo.url}
                            alt={photo.filename || `Site photo ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() => handlePhotoRemove(photo)}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <span className="sr-only">Remove</span>
                              &times;
                            </button>
                          )}
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {photo.filename}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Photo validation error */}
                {form.formState.errors.root && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <div>
            {currentStep > 0 && (
              <Button type="button" variant="outline" onClick={goPrev} disabled={isSubmitting}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Save Draft Button */}
            {!isReadOnly && (
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isSaving || isSubmitting}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Draft
              </Button>
            )}

            {/* Next/Submit Button */}
            {currentStep < FORM_STEPS.length - 1 ? (
              <Button type="button" onClick={goNext} disabled={isSubmitting}>
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              !isReadOnly && (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Submit Site Details
                </Button>
              )
            )}
          </div>
        </div>
      </form>
    </Form>
  );
}
