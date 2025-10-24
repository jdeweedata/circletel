/**
 * Validation schemas for CircleTel account creation
 * Using Zod for type-safe validation
 */

import * as z from 'zod';

/**
 * Account creation form schema
 */
export const accountFormSchema = z.object({
  accountType: z.enum(['personal', 'business'], {
    required_error: 'Please select an account type',
    invalid_type_error: 'Invalid account type',
  }),
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),
  email: z
    .string()
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  phone: z
    .string()
    .regex(/^0[0-9]{9}$/, 'Please enter a valid 10-digit South African phone number starting with 0')
    .or(z.string().regex(/^\+27[0-9]{9}$/, 'Please enter a valid South African phone number')),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type AccountFormValues = z.infer<typeof accountFormSchema>;

/**
 * Package selection schema
 */
export const packageSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number().positive(),
  originalPrice: z.number().positive(),
  downloadSpeed: z.string(),
  uploadSpeed: z.string().optional(),
  features: z.array(z.string()),
  promotionDuration: z.number().optional(),
  isAvailable: z.boolean().default(true),
});

export type Package = z.infer<typeof packageSchema>;

/**
 * Business account additional fields schema
 */
export const businessAccountSchema = accountFormSchema.extend({
  companyName: z
    .string()
    .min(2, 'Company name must be at least 2 characters')
    .max(100, 'Company name must be less than 100 characters'),
  registrationNumber: z
    .string()
    .optional(),
  vatNumber: z
    .string()
    .regex(/^[0-9]{10}$/, 'VAT number must be 10 digits')
    .optional(),
  businessType: z.enum(['sole_proprietor', 'partnership', 'company', 'npo']).optional(),
});

export type BusinessAccountFormValues = z.infer<typeof businessAccountSchema>;

/**
 * Address verification schema
 */
export const addressSchema = z.object({
  streetAddress: z.string().min(5, 'Please enter a valid street address'),
  suburb: z.string().min(2, 'Please enter a suburb'),
  city: z.string().min(2, 'Please enter a city'),
  province: z.enum([
    'Eastern Cape',
    'Free State',
    'Gauteng',
    'KwaZulu-Natal',
    'Limpopo',
    'Mpumalanga',
    'Northern Cape',
    'North West',
    'Western Cape',
  ]),
  postalCode: z.string().regex(/^[0-9]{4}$/, 'Postal code must be 4 digits'),
  complexName: z.string().optional(),
  unitNumber: z.string().optional(),
});

export type Address = z.infer<typeof addressSchema>;

/**
 * Installation preferences schema
 */
export const installationPreferencesSchema = z.object({
  preferredDate: z.date().min(new Date(), 'Installation date must be in the future'),
  preferredTimeSlot: z.enum(['morning', 'afternoon', 'evening']),
  specialInstructions: z.string().max(500, 'Special instructions must be less than 500 characters').optional(),
  contactMethod: z.enum(['phone', 'email', 'whatsapp']).default('phone'),
});

export type InstallationPreferences = z.infer<typeof installationPreferencesSchema>;

/**
 * Helper function to format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as 073 728 8616
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  
  // Format as +27 73 728 8616
  if (cleaned.startsWith('27') && cleaned.length === 11) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  
  return phone;
}

/**
 * Helper function to validate South African ID number
 */
export function validateSAIdNumber(idNumber: string): boolean {
  if (!/^[0-9]{13}$/.test(idNumber)) return false;
  
  // Luhn algorithm check
  let sum = 0;
  for (let i = 0; i < 13; i++) {
    let digit = parseInt(idNumber[i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  
  return sum % 10 === 0;
}

/**
 * Password strength calculator
 */
export function calculatePasswordStrength(password: string): {
  strength: 'weak' | 'medium' | 'strong' | 'very-strong';
  score: number;
  feedback: string[];
} {
  let score = 0;
  const feedback: string[] = [];
  
  // Length
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  
  // Character variety
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  
  // Feedback
  if (password.length < 8) feedback.push('Use at least 8 characters');
  if (!/[A-Z]/.test(password)) feedback.push('Add uppercase letters');
  if (!/[0-9]/.test(password)) feedback.push('Add numbers');
  if (!/[^a-zA-Z0-9]/.test(password)) feedback.push('Add special characters');
  
  let strength: 'weak' | 'medium' | 'strong' | 'very-strong';
  if (score <= 3) strength = 'weak';
  else if (score <= 5) strength = 'medium';
  else if (score <= 6) strength = 'strong';
  else strength = 'very-strong';
  
  return { strength, score, feedback };
}
