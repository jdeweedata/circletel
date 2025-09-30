// Netcash Payment Gateway Configuration

/**
 * Get the base URL for the application
 * Handles both development and production environments
 */
function getBaseUrl(): string {
  // Check for explicitly set base URL
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL
  }
  
  // Check for Vercel URL (production/preview deployments)
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  }
  
  // Default to localhost for development
  return process.env.NODE_ENV === 'production' 
    ? 'https://circletel.com' // Update with your production domain
    : 'http://localhost:3007'
}

const baseUrl = getBaseUrl()

export const netcashConfig = {
  // PCI Vault Configuration
  pciVault: {
    key: process.env.NEXT_PUBLIC_NETCASH_PCI_VAULT_KEY || '3143ee79-0c96-4909-968e-5a716fd19a65',
    apiUrl: process.env.NEXT_PUBLIC_NETCASH_API_URL || 'https://api.netcash.co.za',
    environment: process.env.NEXT_PUBLIC_NETCASH_ENV || 'staging'
  },
  
  // Pay Now Service Configuration
  payNow: {
    serviceKey: process.env.NEXT_PUBLIC_NETCASH_SERVICE_KEY || '7928c6de-219f-4b75-9408-ea0e53be8c87',
    
    // CircleTel App Webhook URLs (New endpoints)
    acceptUrl: process.env.NEXT_PUBLIC_NETCASH_ACCEPT_URL || `${baseUrl}/api/payment/netcash/accepted`,
    declineUrl: process.env.NEXT_PUBLIC_NETCASH_DECLINE_URL || `${baseUrl}/api/payment/netcash/declined`,
    notifyUrl: process.env.NEXT_PUBLIC_NETCASH_NOTIFY_URL || `${baseUrl}/api/payment/netcash/notify`,
    redirectUrl: process.env.NEXT_PUBLIC_NETCASH_REDIRECT_URL || `${baseUrl}/api/payment/netcash/redirect`,
    
    // User-facing return URLs
    returnUrl: process.env.NEXT_PUBLIC_NETCASH_RETURN_URL || `${baseUrl}/wireless/order/success`,
    cancelUrl: process.env.NEXT_PUBLIC_NETCASH_CANCEL_URL || `${baseUrl}/wireless/checkout`,
    
    // Legacy Agility GIS URLs (kept for reference/fallback)
    legacyUrls: {
      acceptUrl: 'https://integration-staging.agilitygis.com/api/paymentgateway/webhook/netcash/paynow/accepted?integratorKey=gFExoQEvXrsdu8Fp6a234f8ErfsusF5LTaEDF',
      declineUrl: 'https://integration-staging.agilitygis.com/api/paymentgateway/webhook/netcash/paynow/rejected?integratorKey=gFExoQEvXrsdu8Fp6a234f8ErfsusF5LTaEDF',
      notifyUrl: 'https://integration-staging.agilitygis.com/api/paymentgateway/webhook/netcash/notify?integratorKey=gFExoQEvXrsdu8Fp6a234f8ErfsusF5LTaEDF'
    }
  },
  
  // Gateway URLs
  urls: {
    tokenization: 'https://api.netcash.co.za/v1/tokenization',
    paymentSubmit: 'https://paynow.netcash.co.za/site/paynow.aspx',
    validateCard: 'https://api.netcash.co.za/v1/validate',
    recurringPayment: 'https://api.netcash.co.za/v1/recurring'
  },
  
  // Test Card Numbers for Staging
  testCards: {
    visa: {
      number: '4242424242424242',
      cvv: '123',
      expiry: '12/25'
    },
    mastercard: {
      number: '5555555555554444',
      cvv: '123',
      expiry: '12/25'
    }
  }
}

// Helper function to format amount for Netcash (in cents)
export const formatAmountForNetcash = (amount: number): number => {
  return Math.round(amount * 100)
}

// Helper function to generate unique reference
export const generatePaymentReference = (): string => {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substr(2, 5)
  return `CWT-${timestamp}-${random}`.toUpperCase()
}

// Helper function to get webhook URLs for display/configuration
export const getWebhookUrls = () => {
  const base = getBaseUrl()
  return {
    accepted: `${base}/api/payment/netcash/accepted`,
    declined: `${base}/api/payment/netcash/declined`, 
    notify: `${base}/api/payment/netcash/notify`,
    redirect: `${base}/api/payment/netcash/redirect`
  }
}

// Helper function to get test webhook URLs for local development
export const getTestWebhookUrls = () => {
  return {
    accepted: 'http://localhost:3007/api/payment/netcash/accepted',
    declined: 'http://localhost:3007/api/payment/netcash/declined',
    notify: 'http://localhost:3007/api/payment/netcash/notify',
    redirect: 'http://localhost:3007/api/payment/netcash/redirect',
    // Test endpoints with simulation
    testSuccess: 'http://localhost:3007/api/payment/netcash/notify?test=success',
    testFailure: 'http://localhost:3007/api/payment/netcash/notify?test=failure'
  }
}

// Validate Netcash configuration
export const validateNetcashConfig = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (!netcashConfig.pciVault.key) {
    errors.push('PCI Vault key is missing')
  }
  
  if (!netcashConfig.payNow.serviceKey) {
    errors.push('PayNow service key is missing')
  }
  
  if (!netcashConfig.payNow.acceptUrl) {
    errors.push('Accept URL is missing')
  }
  
  if (!netcashConfig.payNow.notifyUrl) {
    errors.push('Notify URL is missing')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}