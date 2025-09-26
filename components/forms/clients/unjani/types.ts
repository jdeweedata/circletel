import { z } from 'zod';
import { phoneSchema, emailSchema, requiredStringSchema, numberSchema, dateSchema } from '../../utils/validation';

// Contract audit form data structure
export interface UnjaniAuditFormData {
  // Clinic Information
  clinicName: string;
  province: string;
  clinicCode?: string;
  auditDate: string;

  // Current Service Provider
  currentProvider: string;
  connectionType: string;
  currentSpeed?: number;
  monthlyFee: number;

  // Contract Details
  contractType: 'month-to-month' | '12-months' | '24-months' | 'other';
  contractStatus: string;
  contractStart: string;
  contractEnd?: string;

  // Migration Planning
  preferredMigrationDate?: string;
  additionalNotes?: string;

  // Contact Information
  contactName: string;
  contactPosition: string;
  contactPhone: string;
  contactEmail: string;
  alternativeContact?: string;
  alternativePhone?: string;
  bestContactTime?: string;
  siteAccessNotes?: string;

  // Computed fields
  migrationPriority?: 'high' | 'medium' | 'low';
  priorityReason?: string;
}

// Validation schema
export const unjaniAuditFormSchema = z.object({
  // Required fields
  clinicName: requiredStringSchema,
  province: requiredStringSchema,
  auditDate: dateSchema,
  currentProvider: requiredStringSchema,
  connectionType: requiredStringSchema,
  monthlyFee: numberSchema,
  contractType: z.enum(['month-to-month', '12-months', '24-months', 'other']),
  contractStatus: requiredStringSchema,
  contractStart: dateSchema,
  contactName: requiredStringSchema,
  contactPosition: requiredStringSchema,
  contactPhone: phoneSchema,
  contactEmail: emailSchema,

  // Optional fields
  clinicCode: z.string().optional(),
  currentSpeed: z.coerce.number().optional(),
  contractEnd: z.string().optional(),
  preferredMigrationDate: z.string().optional(),
  additionalNotes: z.string().optional(),
  alternativeContact: z.string().optional(),
  alternativePhone: z.string().optional(),
  bestContactTime: z.string().optional(),
  siteAccessNotes: z.string().optional(),
});

// Priority calculation logic
export function calculateMigrationPriority(data: Partial<UnjaniAuditFormData>): {
  priority: 'high' | 'medium' | 'low';
  reason: string;
} {
  if (data.contractType === 'month-to-month') {
    return {
      priority: 'high',
      reason: 'No contract restrictions - ready for immediate migration'
    };
  }

  if (data.contractStatus === 'expired' || data.contractStatus === 'month-to-month-active') {
    return {
      priority: 'high',
      reason: 'Contract expired or flexible - immediate migration possible'
    };
  }

  if (data.contractStatus === 'expiring-30') {
    return {
      priority: 'high',
      reason: 'Contract expiring soon - schedule migration to coincide'
    };
  }

  if (data.contractStatus === 'expiring-60') {
    return {
      priority: 'medium',
      reason: 'Contract expiring in 60 days - prepare for migration'
    };
  }

  if (data.monthlyFee && data.monthlyFee > 600) {
    return {
      priority: 'medium',
      reason: 'High cost site - prioritize for cost savings'
    };
  }

  return {
    priority: 'low',
    reason: 'Active contract - schedule for later phase or contract end'
  };
}

// Required fields for progress calculation
export const REQUIRED_FIELDS = [
  'clinicName',
  'province',
  'auditDate',
  'currentProvider',
  'connectionType',
  'monthlyFee',
  'contractType',
  'contractStatus',
  'contractStart',
  'contactName',
  'contactPosition',
  'contactPhone',
  'contactEmail'
];

// Options for select fields
export const CLINIC_OPTIONS = [
  // Gauteng
  { value: 'Alexandra', label: 'Alexandra', group: 'Gauteng' },
  { value: 'Barcelona', label: 'Barcelona', group: 'Gauteng' },
  { value: 'Orlando', label: 'Orlando', group: 'Gauteng' },
  { value: 'Atteridgeville', label: 'Atteridgeville', group: 'Gauteng' },
  { value: 'Benoni', label: 'Benoni', group: 'Gauteng' },
  { value: 'Boksburg', label: 'Boksburg', group: 'Gauteng' },
  { value: 'Diepsloot', label: 'Diepsloot', group: 'Gauteng' },
  { value: 'Germiston', label: 'Germiston', group: 'Gauteng' },
  { value: 'Ivory Park', label: 'Ivory Park', group: 'Gauteng' },
  { value: 'Katlehong', label: 'Katlehong', group: 'Gauteng' },
  { value: 'Mamelodi', label: 'Mamelodi', group: 'Gauteng' },
  { value: 'Midrand', label: 'Midrand', group: 'Gauteng' },
  { value: 'Orange Farm', label: 'Orange Farm', group: 'Gauteng' },
  { value: 'Pretoria CBD', label: 'Pretoria CBD', group: 'Gauteng' },
  { value: 'Randburg', label: 'Randburg', group: 'Gauteng' },
  { value: 'Roodepoort', label: 'Roodepoort', group: 'Gauteng' },
  { value: 'Soweto', label: 'Soweto', group: 'Gauteng' },
  { value: 'Springs', label: 'Springs', group: 'Gauteng' },
  { value: 'Tembisa', label: 'Tembisa', group: 'Gauteng' },
  { value: 'Vanderbijlpark', label: 'Vanderbijlpark', group: 'Gauteng' },
  { value: 'Vereeniging', label: 'Vereeniging', group: 'Gauteng' },

  // KwaZulu-Natal
  { value: 'Umlazi', label: 'Umlazi', group: 'KwaZulu-Natal' },
  { value: 'Empangeni', label: 'Empangeni', group: 'KwaZulu-Natal' },
  { value: 'Bridge City/KwaMashu', label: 'Bridge City/KwaMashu', group: 'KwaZulu-Natal' },
  { value: 'Phoenix', label: 'Phoenix', group: 'KwaZulu-Natal' },
  { value: 'Richards Bay', label: 'Richards Bay', group: 'KwaZulu-Natal' },
  { value: 'KwaDukuza', label: 'KwaDukuza', group: 'KwaZulu-Natal' },

  // Western Cape
  { value: 'Makhaza', label: 'Makhaza', group: 'Western Cape' },
  { value: 'Crossroads', label: 'Crossroads', group: 'Western Cape' },
  { value: 'Khayelitsha', label: 'Khayelitsha', group: 'Western Cape' },
  { value: 'Mitchells Plain', label: 'Mitchells Plain', group: 'Western Cape' },
  { value: 'Philippi', label: 'Philippi', group: 'Western Cape' },

  // Limpopo
  { value: 'Lebowakgomo', label: 'Lebowakgomo', group: 'Limpopo' },
  { value: 'Polokwane', label: 'Polokwane', group: 'Limpopo' },
  { value: 'Thohoyandou', label: 'Thohoyandou', group: 'Limpopo' },
  { value: 'Tzaneen', label: 'Tzaneen', group: 'Limpopo' },

  // Mpumalanga
  { value: 'Nelspruit', label: 'Nelspruit', group: 'Mpumalanga' },
  { value: 'Emalahleni', label: 'Emalahleni (Witbank)', group: 'Mpumalanga' },
  { value: 'Middelburg', label: 'Middelburg', group: 'Mpumalanga' },
  { value: 'Secunda', label: 'Secunda', group: 'Mpumalanga' },

  { value: 'Other', label: 'Other (Specify Below)', group: 'Other' }
];

export const PROVINCE_OPTIONS = [
  { value: 'Gauteng', label: 'Gauteng' },
  { value: 'KwaZulu-Natal', label: 'KwaZulu-Natal' },
  { value: 'Western Cape', label: 'Western Cape' },
  { value: 'Eastern Cape', label: 'Eastern Cape' },
  { value: 'Limpopo', label: 'Limpopo' },
  { value: 'Mpumalanga', label: 'Mpumalanga' },
  { value: 'North West', label: 'North West' },
  { value: 'Free State', label: 'Free State' },
  { value: 'Northern Cape', label: 'Northern Cape' }
];

export const PROVIDER_OPTIONS = [
  { value: 'Vodacom', label: 'Vodacom' },
  { value: 'MTN', label: 'MTN' },
  { value: 'Telkom', label: 'Telkom' },
  { value: 'Cell C', label: 'Cell C' },
  { value: 'Rain', label: 'Rain' },
  { value: 'Morclick', label: 'Morclick' },
  { value: 'Green G', label: 'Green G' },
  { value: 'Multiple', label: 'Multiple Providers' },
  { value: 'Other', label: 'Other' }
];

export const CONNECTION_TYPE_OPTIONS = [
  { value: 'Fibre', label: 'Fibre' },
  { value: '5G', label: '5G' },
  { value: '4G/LTE', label: '4G/LTE' },
  { value: 'Fixed Wireless', label: 'Fixed Wireless' },
  { value: 'ADSL', label: 'ADSL' },
  { value: 'Mixed', label: 'Mixed/Hybrid' }
];

export const CONTRACT_STATUS_OPTIONS = [
  { value: 'active', label: 'Active - In Contract Period' },
  { value: 'expiring-30', label: 'Expiring within 30 days' },
  { value: 'expiring-60', label: 'Expiring within 60 days' },
  { value: 'expiring-90', label: 'Expiring within 90 days' },
  { value: 'expired', label: 'Expired/Out of Contract' },
  { value: 'month-to-month-active', label: 'Month-to-Month Active' }
];

export const CONTACT_POSITION_OPTIONS = [
  { value: 'Clinic Manager', label: 'Clinic Manager' },
  { value: 'Operations Manager', label: 'Operations Manager' },
  { value: 'Sister in Charge', label: 'Sister in Charge' },
  { value: 'Admin Manager', label: 'Admin Manager' },
  { value: 'IT Coordinator', label: 'IT Coordinator' },
  { value: 'Facility Manager', label: 'Facility Manager' },
  { value: 'Other', label: 'Other' }
];

export const CONTACT_TIME_OPTIONS = [
  { value: 'Morning (08:00-10:00)', label: 'Morning (08:00-10:00)' },
  { value: 'Mid-Morning (10:00-12:00)', label: 'Mid-Morning (10:00-12:00)' },
  { value: 'Lunch (12:00-14:00)', label: 'Lunch (12:00-14:00)' },
  { value: 'Afternoon (14:00-16:00)', label: 'Afternoon (14:00-16:00)' },
  { value: 'Late Afternoon (16:00-17:00)', label: 'Late Afternoon (16:00-17:00)' },
  { value: 'Any Time', label: 'Any Time During Business Hours' }
];

export const CONTRACT_TYPE_OPTIONS = [
  { value: 'month-to-month', label: 'Month-to-Month' },
  { value: '12-months', label: '12 Months' },
  { value: '24-months', label: '24 Months' },
  { value: 'other', label: 'Other' }
];