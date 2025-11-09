/**
 * Email Template Variable Substitution
 *
 * Handles {{variable}} replacement in email templates
 */

export interface EmailVariables {
  // Customer information
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;

  // Order information
  orderNumber?: string;
  orderUrl?: string;
  orderDate?: string;
  orderStatus?: string;

  // Package/Service information
  packageName?: string;
  packageSpeed?: string;
  packagePrice?: string;
  providerName?: string;

  // Installation information
  installationDate?: string;
  installationTime?: string;
  installationAddress?: string;

  // Payment information
  paymentAmount?: string;
  paymentMethod?: string;
  paymentDate?: string;
  invoiceNumber?: string;
  invoiceUrl?: string;

  // Business/B2B information
  companyName?: string;
  quoteNumber?: string;
  quoteUrl?: string;
  quoteExpiryDate?: string;
  contractNumber?: string;
  contractUrl?: string;

  // Partner information
  partnerName?: string;
  partnerNumber?: string;
  leadCount?: string;
  commissionAmount?: string;

  // KYC information
  kycSessionId?: string;
  kycStatus?: string;
  kycRejectionReason?: string;

  // Service credentials
  username?: string;
  password?: string;
  accountNumber?: string;

  // Support information
  supportEmail?: string;
  supportPhone?: string;

  // Links
  loginUrl?: string;
  dashboardUrl?: string;
  trackingUrl?: string;

  // Dates and times
  currentDate?: string;
  currentYear?: string;
}

/**
 * Replace variables in a string
 *
 * Converts {{variableName}} to actual values from the variables object
 */
export function substituteVariables(
  template: string,
  variables: EmailVariables
): string {
  let result = template;

  // Replace each variable
  for (const [key, value] of Object.entries(variables)) {
    if (value !== undefined && value !== null) {
      const pattern = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(pattern, String(value));
    }
  }

  // Add default values for common variables
  const defaults: EmailVariables = {
    supportEmail: 'support@circletel.co.za',
    supportPhone: '+27 12 345 6789',
    loginUrl: 'https://www.circletel.co.za/login',
    dashboardUrl: 'https://www.circletel.co.za/dashboard',
    currentYear: new Date().getFullYear().toString(),
    currentDate: new Date().toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  };

  // Apply defaults for any remaining unsubstituted variables
  for (const [key, value] of Object.entries(defaults)) {
    const pattern = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(pattern, String(value));
  }

  return result;
}

/**
 * Validate that all required variables are provided
 */
export function validateVariables(
  requiredVariables: (keyof EmailVariables)[],
  providedVariables: EmailVariables
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  for (const variable of requiredVariables) {
    if (
      providedVariables[variable] === undefined ||
      providedVariables[variable] === null ||
      providedVariables[variable] === ''
    ) {
      missing.push(variable);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(amount);
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format time for display
 */
export function formatTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleTimeString('en-ZA', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Sanitize user input to prevent XSS in emails
 */
export function sanitizeVariable(value: string): string {
  return value
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Get email variables for order confirmation
 */
export function getOrderConfirmationVariables(order: any): EmailVariables {
  return {
    customerName: order.first_name,
    customerEmail: order.email,
    customerPhone: order.phone,
    orderNumber: order.order_number,
    orderUrl: `https://www.circletel.co.za/order/confirmation/${order.id}`,
    orderDate: formatDate(order.created_at),
    packageName: order.package_name,
    packageSpeed: order.package_speed,
    packagePrice: formatCurrency(order.package_price),
    providerName: order.provider_name || 'Multiple Providers',
    installationAddress: order.installation_address,
    paymentAmount: formatCurrency(order.total_paid),
    paymentMethod: order.payment_method,
  };
}

/**
 * Get email variables for quote sent
 */
export function getQuoteSentVariables(quote: any): EmailVariables {
  return {
    customerName: quote.contact_name,
    customerEmail: quote.contact_email,
    companyName: quote.company_name,
    quoteNumber: quote.quote_number,
    quoteUrl: `https://www.circletel.co.za/quotes/${quote.id}`,
    quoteExpiryDate: formatDate(quote.valid_until),
    paymentAmount: formatCurrency(quote.total_amount),
  };
}

/**
 * Get email variables for KYC updates
 */
export function getKYCVariables(session: any): EmailVariables {
  return {
    customerName: session.customer_name,
    kycSessionId: session.session_id,
    kycStatus: session.status,
    kycRejectionReason: session.rejection_reason,
  };
}

/**
 * Get email variables for service activation
 */
export function getServiceActivationVariables(service: any): EmailVariables {
  return {
    customerName: service.customer_name,
    packageName: service.package_name,
    packageSpeed: service.package_speed,
    username: service.username,
    password: service.temporary_password,
    accountNumber: service.account_number,
    loginUrl: 'https://www.circletel.co.za/login',
    dashboardUrl: 'https://www.circletel.co.za/dashboard',
  };
}
