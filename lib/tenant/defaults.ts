import type { TenantConfig } from './types';

/**
 * CircleTel — tenant #1 default identity.
 * This file is the ONE place brand literals are allowed
 * (excluded from the brand-literal CI ratchet).
 */
export const CIRCLETEL_DEFAULTS: TenantConfig = {
  branding: {
    companyName: 'CircleTel',
    legalName: 'Circle Tel SA (Pty) Ltd',
    websiteUrl: 'https://www.circletel.co.za',
    websiteShort: 'circletel.co.za',
    colors: {
      primary: '#F5841E', // Circle Tel Orange (lib/design-system.ts BRAND_COLORS.orange)
      navy: '#13274A',
      gray: '#747474',
    },
  },
  contacts: {
    WHATSAPP_NUMBER: '082 487 3900',
    WHATSAPP_LINK: 'https://wa.me/27824873900',
    WHATSAPP_INTERNATIONAL: '+27 82 487 3900',
    PHONE_SALES_OUTBOUND: '010 880 3663',
    EMAIL_PRIMARY: 'contactus@circletel.co.za',
    EMAIL_SUPPORT: 'contactus@circletel.co.za',
    EMAIL_SALES: 'sales@circletel.co.za',
    EMAIL_BILLING: 'billing@circletel.co.za',
    EMAIL_LEGAL: 'legal@circletelsa.co.za',
    EMAIL_NOTIFICATIONS: 'no-reply@notify.circletel.co.za',
    BUSINESS_HOURS: 'Monday - Friday: 08:00 - 17:00 SAST',
    SUPPORT_HOURS: 'Mon-Fri, 8am-5pm',
    PHYSICAL_ADDRESS: {
      name: 'Circle Tel SA (Pty) Ltd',
      attention: 'Contracts and Commercial Manager',
      building: 'Imagine House',
      street: '2 Mellis Road',
      suburb: 'Rivonia',
      city: 'Sandton',
      province: 'Gauteng',
      postalCode: '2191',
      country: 'South Africa',
    },
    POSTAL_ADDRESS: {
      street: '2 Mellis Road',
      building: 'Imagine House',
      suburb: 'Rivonia',
      city: 'Sandton',
      postalCode: '2191',
    },
    PHONE_FORMAL: '+27 87 087 6307',
    WEBSITE: 'https://www.circletel.co.za',
    WEBSITE_SHORT: 'circletel.co.za',
  },
};
