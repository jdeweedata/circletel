import { z, type ZodError } from 'zod';

import {
  CLOUDWIFI_BACKHAUL_TYPES,
  CLOUDWIFI_VENUE_TYPES,
} from './types';

const WALL_MATERIALS = [
  'drywall',
  'brick_concrete',
  'glass_metal',
  'mixed',
  'unknown',
] as const;

const NETWORKS = ['staff', 'guest', 'operations', 'other'] as const;

const ADD_ONS = [
  'captive_portal',
  'analytics',
  'content_filtering',
  'failover',
  'bandwidth_shaping',
  'lan_wifi_optimisation',
  'multi_site_management',
  'integrations',
] as const;

const PREFERRED_CONTACT_TIMES = ['morning', 'afternoon', 'anytime'] as const;

const optionalAttribution = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .transform((value) => value || undefined)
    .optional();

const finitePositiveNumber = (label: string, maximum: number) =>
  z.coerce
    .number({ invalid_type_error: `${label} must be a number.` })
    .finite(`${label} must be finite.`)
    .positive(`${label} must be greater than 0.`)
    .max(maximum, `${label} must be at most ${maximum}.`);

const uniqueValues = <T>(values: T[]): T[] => Array.from(new Set(values));

const phoneSchema = z
  .string()
  .trim()
  .transform((phone) => phone.replace(/[\s-]/g, ''))
  .refine((phone) => /^(0\d{9}|\+27\d{9})$/.test(phone), {
    message: 'Enter a valid South African phone number.',
  })
  .transform((phone) => (phone.startsWith('0') ? `+27${phone.slice(1)}` : phone));

export const cloudWifiSurveySchema = z.object({
  venue: z.object({
    venueType: z.enum(CLOUDWIFI_VENUE_TYPES),
    floorArea: finitePositiveNumber('Floor area', 100000),
    peakUsers: finitePositiveNumber('Peak users', 100000).int(
      'Peak users must be a whole number.'
    ),
    city: z
      .string()
      .trim()
      .min(2, 'City must contain at least 2 characters.')
      .max(100, 'City must contain at most 100 characters.'),
    siteAddress: z
      .string()
      .trim()
      .min(5, 'Site address must contain at least 5 characters.')
      .max(300, 'Site address must contain at most 300 characters.'),
    postalCode: z
      .string()
      .trim()
      .regex(/^(?:|\d{4})$/, 'Postal code must be exactly four digits.')
      .optional(),
    backhaul: z.enum(CLOUDWIFI_BACKHAUL_TYPES),
  }),
  details: z.object({
    floors: finitePositiveNumber('Floors', 100).int('Floors must be a whole number.'),
    wallMaterial: z.enum(WALL_MATERIALS),
    networks: z
      .array(z.enum(NETWORKS))
      .min(1, 'Select at least one network.')
      .transform(uniqueValues),
    addOns: z.array(z.enum(ADD_ONS)).transform(uniqueValues).optional().default([]),
    requirements: z
      .string()
      .trim()
      .max(2000, 'Requirements must contain at most 2000 characters.')
      .optional()
      .default(''),
  }),
  contact: z.object({
    fullName: z
      .string()
      .trim()
      .max(120, 'Full name must contain at most 120 characters.')
      .refine((name) => name.split(/\s+/).filter(Boolean).length >= 2, {
        message: 'Enter your first name and surname.',
      }),
    companyName: z
      .string()
      .trim()
      .min(2, 'Company name must contain at least 2 characters.')
      .max(160, 'Company name must contain at most 160 characters.'),
    email: z
      .string()
      .trim()
      .email('Enter a valid email address.')
      .max(254, 'Email must contain at most 254 characters.')
      .transform((email) => email.toLowerCase()),
    phone: phoneSchema,
    preferredContactTime: z.enum(PREFERRED_CONTACT_TIMES),
    consent: z.literal(true),
    consentedAt: z
      .string()
      .trim()
      .datetime({ offset: true, message: 'Enter a valid ISO datetime.' }),
  }),
  attribution: z.object({
    pageSource: z.literal('cloudwifi_product_page'),
    utmSource: optionalAttribution(200),
    utmMedium: optionalAttribution(200),
    utmCampaign: optionalAttribution(200),
    referrer: optionalAttribution(2048),
  }),
});

export type CloudWifiSurveyRequest = z.infer<typeof cloudWifiSurveySchema>;

export function formatSurveyErrors(
  error: ZodError
): Array<{ field: string; message: string }> {
  return error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
}
