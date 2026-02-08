/**
 * Aceternity UI Utilities
 *
 * Animation and random generation helpers for Aceternity-style UI components.
 * Note: cn() is re-exported from @/lib/utils for convenience.
 *
 * @module lib/utils/aceternity
 */

// Re-export cn from the canonical source
export { cn } from '@/lib/utils';

// Aceternity-style utility functions
export const generateRandomString = (length: number): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export const getRandomFloat = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

export const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};