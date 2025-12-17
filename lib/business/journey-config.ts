/**
 * B2B Business Journey Configuration
 *
 * Defines the 6-step customer journey for all CircleTel B2B products and services.
 * This configuration is reusable across different B2B product offerings.
 *
 * @module lib/business/journey-config
 */

import {
  FileText,
  Building2,
  MapPin,
  FileSignature,
  Wrench,
  Zap,
  LucideIcon,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export type JourneyStageId =
  | 'quote_request'
  | 'business_verification'
  | 'site_details'
  | 'contract'
  | 'installation'
  | 'go_live';

export type JourneyStageStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'blocked'
  | 'skipped';

export interface JourneyStage {
  id: JourneyStageId;
  step: number;
  title: string;
  shortTitle: string;
  description: string;
  customerDescription: string; // What the customer sees
  adminDescription: string; // What admin sees
  icon: LucideIcon;
  requiredDocuments: RequiredDocument[];
  rfiChecklist?: RFIChecklistItem[]; // RFI checklist for site_details stage
  nextAction: string;
  estimatedDuration: string;
  slaHours: number; // SLA in hours for this stage
}

export interface RFIChecklistItem {
  id: string;
  label: string;
  description: string;
  helpText?: string;
}

export interface RequiredDocument {
  id: string;
  name: string;
  description: string;
  required: boolean;
  acceptedFormats: string[];
}

export interface JourneyProgress {
  customerId: string;
  quoteId?: string;
  currentStage: JourneyStageId;
  currentStep: number;
  completedStages: JourneyStageId[];
  blockedStage?: JourneyStageId;
  blockedReason?: string;
  progressPercentage: number;
  stages: StageProgress[];
  journeyStartedAt?: string;
  journeyCompletedAt?: string;
}

export interface StageProgress {
  stageId: JourneyStageId;
  status: JourneyStageStatus;
  startedAt?: string;
  completedAt?: string;
  notes?: string;
  blockedReason?: string;
}

// ============================================================================
// Journey Stage Definitions
// ============================================================================

export const B2B_JOURNEY_STAGES: JourneyStage[] = [
  {
    id: 'quote_request',
    step: 1,
    title: 'Request Quote',
    shortTitle: 'Quote',
    description: 'Check coverage & submit your business details',
    customerDescription:
      'Submit your business details and service requirements to receive a customized quote.',
    adminDescription:
      'Customer has submitted a quote request. Review and prepare quote.',
    icon: FileText,
    requiredDocuments: [],
    nextAction: 'Submit quote request',
    estimatedDuration: '1-2 days',
    slaHours: 48,
  },
  {
    id: 'business_verification',
    step: 2,
    title: 'Verify Business',
    shortTitle: 'Verify',
    description: 'CIPC registration & ID verification',
    customerDescription:
      'Complete business verification by uploading your company registration documents and completing ID verification.',
    adminDescription:
      'Customer is completing KYC verification. Review submitted documents.',
    icon: Building2,
    requiredDocuments: [
      {
        id: 'cipc_registration',
        name: 'CIPC Registration',
        description: 'Company registration certificate (CK1 or CoR14.1)',
        required: true,
        acceptedFormats: ['pdf', 'jpg', 'png'],
      },
      {
        id: 'director_id',
        name: 'Director ID',
        description: 'ID document of company director or authorized signatory',
        required: true,
        acceptedFormats: ['pdf', 'jpg', 'png'],
      },
      {
        id: 'proof_of_address',
        name: 'Proof of Address',
        description: 'Utility bill or bank statement (not older than 3 months)',
        required: true,
        acceptedFormats: ['pdf', 'jpg', 'png'],
      },
      {
        id: 'vat_certificate',
        name: 'VAT Registration',
        description: 'VAT registration certificate (if VAT registered)',
        required: false,
        acceptedFormats: ['pdf', 'jpg', 'png'],
      },
    ],
    nextAction: 'Complete KYC verification',
    estimatedDuration: '1-3 days',
    slaHours: 72,
  },
  {
    id: 'site_details',
    step: 3,
    title: 'Site Details',
    shortTitle: 'Site',
    description: 'Confirm property type & equipment location',
    customerDescription:
      'Provide details about your installation site including property type, access requirements, and preferred equipment location.',
    adminDescription:
      'Customer is providing site details. Schedule site survey if required.',
    icon: MapPin,
    requiredDocuments: [
      {
        id: 'site_photos',
        name: 'Site Photos',
        description: 'Photos of proposed equipment location and cable entry points',
        required: true,
        acceptedFormats: ['jpg', 'png', 'heic'],
      },
      {
        id: 'building_access_info',
        name: 'Building Access',
        description: 'Building manager contact or access instructions',
        required: false,
        acceptedFormats: ['pdf', 'txt'],
      },
    ],
    rfiChecklist: [
      {
        id: 'has_rack_facility',
        label: 'Rack or Facility Available',
        description: 'Is there a rack or facility available to install the equipment?',
        helpText: 'This includes server racks, network cabinets, or dedicated mounting space.',
      },
      {
        id: 'has_access_control',
        label: 'Access Control Documented',
        description: 'Is there access control to the room/facility?',
        helpText: 'Access procedures, key cards, or security requirements for the installation area.',
      },
      {
        id: 'has_air_conditioning',
        label: 'Air Conditioning / Ventilation',
        description: 'Is the room air-conditioned or well ventilated?',
        helpText: 'Equipment requires proper cooling to operate reliably.',
      },
      {
        id: 'has_ac_power',
        label: 'AC Power Available',
        description: 'Is there a 220V 50Hz AC power plug for the PSU?',
        helpText: 'Standard South African power outlet required for our Power Supply Unit.',
      },
    ],
    nextAction: 'Submit site details',
    estimatedDuration: '1-2 days',
    slaHours: 48,
  },
  {
    id: 'contract',
    step: 4,
    title: 'Contract',
    shortTitle: 'Contract',
    description: 'Review and digitally sign your agreement',
    customerDescription:
      'Review your service agreement and sign digitally. Your contract includes all terms, pricing, and SLA commitments.',
    adminDescription:
      'Contract sent for signature. Monitor signing status.',
    icon: FileSignature,
    requiredDocuments: [],
    nextAction: 'Sign contract',
    estimatedDuration: '1-2 days',
    slaHours: 48,
  },
  {
    id: 'installation',
    step: 5,
    title: 'Installation',
    shortTitle: 'Install',
    description: 'Professional on-site fibre installation',
    customerDescription:
      'Our certified technicians will install your fibre connection at the scheduled date and time.',
    adminDescription:
      'Installation scheduled. Assign technician and track progress.',
    icon: Wrench,
    requiredDocuments: [],
    nextAction: 'Schedule installation',
    estimatedDuration: '3-7 days',
    slaHours: 168, // 7 days
  },
  {
    id: 'go_live',
    step: 6,
    title: 'Go Live',
    shortTitle: 'Live',
    description: 'Connect and enjoy enterprise-grade fibre',
    customerDescription:
      'Your service is now active! Access your dashboard to manage your connection.',
    adminDescription:
      'Service activated. RICA submitted and credentials generated.',
    icon: Zap,
    requiredDocuments: [],
    nextAction: 'Activate service',
    estimatedDuration: '1 day',
    slaHours: 24,
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get a specific journey stage by ID
 */
export function getStageById(stageId: JourneyStageId): JourneyStage | undefined {
  return B2B_JOURNEY_STAGES.find((s) => s.id === stageId);
}

/**
 * Get a specific journey stage by step number
 */
export function getStageByStep(step: number): JourneyStage | undefined {
  return B2B_JOURNEY_STAGES.find((s) => s.step === step);
}

/**
 * Get the next stage after a given stage
 */
export function getNextStage(currentStageId: JourneyStageId): JourneyStage | undefined {
  const currentStage = getStageById(currentStageId);
  if (!currentStage || currentStage.step >= 6) return undefined;
  return getStageByStep(currentStage.step + 1);
}

/**
 * Get the previous stage before a given stage
 */
export function getPreviousStage(currentStageId: JourneyStageId): JourneyStage | undefined {
  const currentStage = getStageById(currentStageId);
  if (!currentStage || currentStage.step <= 1) return undefined;
  return getStageByStep(currentStage.step - 1);
}

/**
 * Calculate progress percentage based on completed stages
 */
export function calculateProgress(completedStages: JourneyStageId[]): number {
  return Math.round((completedStages.length / B2B_JOURNEY_STAGES.length) * 100);
}

/**
 * Get all required documents for a stage
 */
export function getRequiredDocuments(stageId: JourneyStageId): RequiredDocument[] {
  const stage = getStageById(stageId);
  return stage?.requiredDocuments.filter((d) => d.required) || [];
}

/**
 * Get all documents (required + optional) for a stage
 */
export function getAllDocuments(stageId: JourneyStageId): RequiredDocument[] {
  const stage = getStageById(stageId);
  return stage?.requiredDocuments || [];
}

/**
 * Check if a stage has all required documents submitted
 */
export function hasAllRequiredDocuments(
  stageId: JourneyStageId,
  submittedDocIds: string[]
): boolean {
  const requiredDocs = getRequiredDocuments(stageId);
  return requiredDocs.every((doc) => submittedDocIds.includes(doc.id));
}

/**
 * Get status color for UI display
 */
export function getStatusColor(status: JourneyStageStatus): string {
  const colors: Record<JourneyStageStatus, string> = {
    pending: 'gray',
    in_progress: 'blue',
    completed: 'green',
    blocked: 'red',
    skipped: 'yellow',
  };
  return colors[status];
}

/**
 * Get status badge variant for UI
 */
export function getStatusBadgeVariant(
  status: JourneyStageStatus
): 'default' | 'secondary' | 'destructive' | 'outline' {
  const variants: Record<JourneyStageStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'secondary',
    in_progress: 'default',
    completed: 'default',
    blocked: 'destructive',
    skipped: 'outline',
  };
  return variants[status];
}

// ============================================================================
// Export all types and constants
// ============================================================================

export const TOTAL_STAGES = B2B_JOURNEY_STAGES.length;
export const STAGE_IDS = B2B_JOURNEY_STAGES.map((s) => s.id);
