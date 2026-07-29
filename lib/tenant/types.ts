/**
 * Tenant Config Layer — the ONLY legal source of platform identity.
 *
 * Whitelabel baseline design §2:
 * docs/superpowers/specs/2026-07-09-whitelabel-platform-design.md
 *
 * Rule: no component or API route hard-codes brand strings or reads
 * process.env for identity/branding. Everything goes through
 * getTenantConfig(). Instance-per-tenant: each deployment injects its
 * own values via NEXT_PUBLIC_TENANT_* env vars.
 */

import type { ModuleId } from '@/lib/admin/feature-registry';

export interface TenantAddress {
  name?: string;
  attention?: string;
  building: string;
  street: string;
  suburb: string;
  city: string;
  province?: string;
  postalCode: string;
  country?: string;
}

/** Shape mirrors the legacy CONTACT constant exactly (lib/constants/contact.ts). */
export interface TenantContacts {
  WHATSAPP_NUMBER: string;
  WHATSAPP_LINK: string;
  WHATSAPP_INTERNATIONAL: string;
  PHONE_SALES_OUTBOUND: string;
  EMAIL_PRIMARY: string;
  EMAIL_SUPPORT: string;
  EMAIL_SALES: string;
  EMAIL_BILLING: string;
  EMAIL_LEGAL: string;
  EMAIL_NOTIFICATIONS: string;
  BUSINESS_HOURS: string;
  SUPPORT_HOURS: string;
  PHYSICAL_ADDRESS: TenantAddress;
  POSTAL_ADDRESS: TenantAddress;
  PHONE_FORMAL: string;
  WEBSITE: string;
  WEBSITE_SHORT: string;
}

export interface TenantBrandColors {
  primary: string;
  navy: string;
  gray: string;
}

export interface TenantBranding {
  companyName: string;
  legalName: string;
  websiteUrl: string;
  websiteShort: string;
  colors: TenantBrandColors;
}

export interface TenantConfig {
  /** Sellable modules enabled for this tenant ('core' is always present). */
  modules: ModuleId[];
  branding: TenantBranding;
  contacts: TenantContacts;
}
