import { z } from 'zod';

export const step1Schema = z.object({
  clinicName: z.string().min(3),
  unjaniAcc: z.string().min(2),
  province: z.string().min(2),
  contact: z.string().min(2),
  phone: z.string().min(9),
  email: z.string().email(),
  siteAddress: z.string().min(5),
  lat: z.string().optional(),
  lng: z.string().optional(),
});

export const step2Schema = z.object({
  entityName: z.string().min(2),
  entityType: z.string().min(2),
  regNumber: z.string().min(4), // CIPC reg OR owner ID (sole prop)
  vat: z.enum(['No', 'Yes']),
  vatNumber: z.string().optional(),
  regAddress: z.string().min(5),
}).refine(v => v.vat === 'No' || (v.vatNumber && v.vatNumber.length >= 9), {
  message: 'VAT number required when VAT registered', path: ['vatNumber'],
});

export const step3Schema = z.object({
  accHolder: z.string().min(2),
  bank: z.string().min(2),
  accType: z.string().min(2),
  accNumber: z.string().min(6),
  branchCode: z.string().min(5),
  mandate: z.literal(true), // DebiCheck consent checkbox
});

export const step5Schema = z.object({
  paymentDate: z.enum(['1', '15', '20', '25']),
  soAccept: z.literal(true),
});

export type Step1 = z.infer<typeof step1Schema>;
export type Step2 = z.infer<typeof step2Schema>;
export type Step3 = z.infer<typeof step3Schema>;
export type Step5 = z.infer<typeof step5Schema>;
