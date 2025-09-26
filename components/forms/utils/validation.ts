import { z } from 'zod';

// Common validation schemas
export const phoneSchema = z.string()
  .min(10, 'Phone number must be at least 10 digits')
  .regex(/^[\d\s\-+()]+$/, 'Invalid phone number format');

export const emailSchema = z.string()
  .email('Invalid email address');

export const requiredStringSchema = z.string()
  .min(1, 'This field is required');

export const optionalStringSchema = z.string().optional();

export const numberSchema = z.coerce.number()
  .min(0, 'Must be a positive number');

export const dateSchema = z.string()
  .min(1, 'Date is required')
  .refine((date) => !isNaN(Date.parse(date)), 'Invalid date format');

// Calculate form completion percentage
export function calculateProgress(data: Record<string, unknown>, requiredFields: string[]): number {
  const completedFields = requiredFields.filter(field => {
    const value = data[field];
    return value !== undefined && value !== null && value !== '';
  });

  return Math.round((completedFields.length / requiredFields.length) * 100);
}

// Validate individual field
export function validateField(value: unknown, schema: z.ZodSchema): string | null {
  try {
    schema.parse(value);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message || 'Invalid value';
    }
    return 'Validation error';
  }
}