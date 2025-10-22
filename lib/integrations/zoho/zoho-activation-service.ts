/**
 * Zoho Activation Service
 * Handles Zoho CRM, Books, and Billing integration for service activation
 *
 * Flow:
 * 1. Create/Update CRM Contact
 * 2. Create Books Customer
 * 3. Generate Books Invoice (installation + router)
 * 4. Create Billing Subscription (monthly recurring)
 * 5. Send Invoice PDF via Zoho Mail
 * 6. Update order with Zoho IDs
 */

import { ZohoAPIClient } from '@/lib/zoho-api-client';

// =============================================================================
// TYPES
// =============================================================================

export interface ZohoActivationInput {
  orderId: string;
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;

  // Package details
  packageName: string;
  monthlyPrice: number;
  installationFee: number;
  routerFee?: number;

  // Account details
  accountNumber?: string;
  serviceStartDate: string;
}

export interface ZohoActivationResult {
  success: boolean;

  // Zoho IDs
  crmContactId?: string;
  booksCustomerId?: string;
  booksInvoiceId?: string;
  billingSubscriptionId?: string;

  // Invoice details
  invoiceNumber?: string;
  invoiceTotal?: number;
  invoicePdfUrl?: string;

  // Errors
  errors?: {
    crm?: string;
    books?: string;
    billing?: string;
    mail?: string;
  };

  // Status
  partialSuccess?: boolean;
  message?: string;
}

interface ZohoCRMContact {
  id: string;
  First_Name: string;
  Last_Name: string;
  Email: string;
  Phone: string;
  Mailing_Street?: string;
  Mailing_City?: string;
  Mailing_Code?: string;
}

interface ZohoBooksCustomer {
  contact_id: string;
  contact_name: string;
  company_name?: string;
  email: string;
  phone: string;
  billing_address: {
    address: string;
    city: string;
    zip: string;
    country: string;
  };
}

interface ZohoBooksInvoice {
  invoice_id: string;
  invoice_number: string;
  total: number;
  status: string;
  invoice_url?: string;
}

interface ZohoBillingSubscription {
  subscription_id: string;
  subscription_number: string;
  status: string;
  next_billing_at?: string;
}

// =============================================================================
// ZOHO ACTIVATION SERVICE
// =============================================================================

export class ZohoActivationService {
  private zohoClient: ZohoAPIClient;

  constructor() {
    // Initialize Zoho API client from environment variables
    if (!process.env.ZOHO_CLIENT_ID || !process.env.ZOHO_CLIENT_SECRET || !process.env.ZOHO_REFRESH_TOKEN) {
      console.warn('Zoho credentials not configured. Activation service will fail gracefully.');
    }

    this.zohoClient = new ZohoAPIClient({
      clientId: process.env.ZOHO_CLIENT_ID || '',
      clientSecret: process.env.ZOHO_CLIENT_SECRET || '',
      refreshToken: process.env.ZOHO_REFRESH_TOKEN || '',
      orgId: process.env.ZOHO_ORG_ID,
      region: (process.env.ZOHO_REGION as 'US' | 'EU' | 'IN' | 'AU' | 'CN') || 'US',
    });
  }

  /**
   * Main activation function - orchestrates all Zoho integrations
   * Uses graceful degradation - doesn't block activation if Zoho fails
   */
  async activateService(input: ZohoActivationInput): Promise<ZohoActivationResult> {
    const result: ZohoActivationResult = {
      success: false,
      errors: {},
    };

    try {
      // Step 1: Create/Update CRM Contact
      try {
        const crmContact = await this.createOrUpdateCRMContact(input);
        result.crmContactId = crmContact.id;
      } catch (error: any) {
        console.error('Failed to create CRM contact:', error);
        result.errors!.crm = error.message;
      }

      // Step 2: Create Books Customer
      try {
        const booksCustomer = await this.createBooksCustomer(input);
        result.booksCustomerId = booksCustomer.contact_id;
      } catch (error: any) {
        console.error('Failed to create Books customer:', error);
        result.errors!.books = error.message;
      }

      // Step 3: Generate Books Invoice
      if (result.booksCustomerId) {
        try {
          const invoice = await this.generateBooksInvoice(input, result.booksCustomerId);
          result.booksInvoiceId = invoice.invoice_id;
          result.invoiceNumber = invoice.invoice_number;
          result.invoiceTotal = invoice.total;
          result.invoicePdfUrl = invoice.invoice_url;
        } catch (error: any) {
          console.error('Failed to generate Books invoice:', error);
          result.errors!.books = error.message;
        }
      }

      // Step 4: Create Billing Subscription
      if (result.booksCustomerId) {
        try {
          const subscription = await this.createBillingSubscription(input, result.booksCustomerId);
          result.billingSubscriptionId = subscription.subscription_id;
        } catch (error: any) {
          console.error('Failed to create Billing subscription:', error);
          result.errors!.billing = error.message;
        }
      }

      // Step 5: Send Invoice via Zoho Mail
      if (result.invoicePdfUrl) {
        try {
          await this.sendInvoiceEmail(input, result.invoicePdfUrl);
        } catch (error: any) {
          console.error('Failed to send invoice email:', error);
          result.errors!.mail = error.message;
        }
      }

      // Determine success
      const hasErrors = Object.keys(result.errors || {}).length > 0;
      const hasAnySuccess = !!(result.crmContactId || result.booksCustomerId || result.billingSubscriptionId);

      result.success = !hasErrors;
      result.partialSuccess = hasErrors && hasAnySuccess;

      if (hasErrors) {
        result.message = result.partialSuccess
          ? 'Service activated with some Zoho integration warnings'
          : 'Service activated, but Zoho integration failed';
      } else {
        result.message = 'Service activated successfully with full Zoho integration';
      }

      return result;

    } catch (error: any) {
      console.error('Zoho activation service error:', error);
      return {
        success: false,
        message: 'Service activation failed',
        errors: { crm: error.message },
      };
    }
  }

  /**
   * Create or update CRM contact
   */
  private async createOrUpdateCRMContact(input: ZohoActivationInput): Promise<ZohoCRMContact> {
    // Split name into first and last
    const nameParts = input.customerName.split(' ');
    const firstName = nameParts[0] || input.customerName;
    const lastName = nameParts.slice(1).join(' ') || '';

    // Check if contact already exists
    const existingContact = await this.zohoClient.searchCRMRecords('Contacts', `(Email:equals:${input.email})`);

    const contactData = {
      First_Name: firstName,
      Last_Name: lastName || 'Customer',
      Email: input.email,
      Phone: input.phone,
      Mailing_Street: input.address,
      Mailing_City: input.city,
      Mailing_Code: input.postalCode,
      Mailing_Country: 'South Africa',

      // Custom fields
      Customer_Type: 'Consumer',
      Service_Status: 'Active',
      Monthly_Recurring_Revenue: input.monthlyPrice,
      Package_Name: input.packageName,
      Account_Number: input.accountNumber,
      Service_Start_Date: input.serviceStartDate,
    };

    if (existingContact.success && existingContact.data && existingContact.data.length > 0) {
      // Update existing contact
      const contactId = existingContact.data[0].id;
      await this.zohoClient.updateCRMRecord('Contacts', contactId, contactData);

      return {
        id: contactId,
        First_Name: firstName,
        Last_Name: lastName || 'Customer',
        Email: input.email,
        Phone: input.phone,
      };
    } else {
      // Create new contact
      const response = await this.zohoClient.createCRMRecord('Contacts', contactData);

      if (!response.success || !response.data) {
        throw new Error('Failed to create CRM contact');
      }

      return {
        id: response.data.details?.id || response.data.id,
        First_Name: firstName,
        Last_Name: lastName || 'Customer',
        Email: input.email,
        Phone: input.phone,
      };
    }
  }

  /**
   * Create Books customer
   */
  private async createBooksCustomer(input: ZohoActivationInput): Promise<ZohoBooksCustomer> {
    const customerData = {
      contact_name: input.customerName,
      email: input.email,
      phone: input.phone,
      contact_type: 'customer',
      billing_address: {
        address: input.address,
        city: input.city,
        zip: input.postalCode,
        country: 'South Africa',
      },
      notes: `CircleTel Customer - Order: ${input.orderNumber}`,
    };

    const response = await this.zohoClient.createBooksContact(customerData);

    if (!response.success || !response.data) {
      throw new Error('Failed to create Books customer');
    }

    return {
      contact_id: response.data.contact?.contact_id || response.data.contact_id,
      contact_name: input.customerName,
      email: input.email,
      phone: input.phone,
      billing_address: customerData.billing_address,
    };
  }

  /**
   * Generate Books invoice
   */
  private async generateBooksInvoice(
    input: ZohoActivationInput,
    customerId: string
  ): Promise<ZohoBooksInvoice> {
    const lineItems = [
      {
        name: input.packageName,
        description: `Monthly subscription for ${input.packageName}`,
        rate: input.monthlyPrice,
        quantity: 1,
        item_total: input.monthlyPrice,
      },
      {
        name: 'Installation Fee',
        description: 'One-time installation and activation fee',
        rate: input.installationFee,
        quantity: 1,
        item_total: input.installationFee,
      },
    ];

    // Add router fee if applicable
    if (input.routerFee && input.routerFee > 0) {
      lineItems.push({
        name: 'Router/Equipment',
        description: 'Customer premises equipment',
        rate: input.routerFee,
        quantity: 1,
        item_total: input.routerFee,
      });
    }

    const subtotal = lineItems.reduce((sum, item) => sum + item.item_total, 0);
    const vatRate = 0.15; // 15% VAT for South Africa
    const vatAmount = subtotal * vatRate;
    const total = subtotal + vatAmount;

    const invoiceData = {
      customer_id: customerId,
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days
      line_items: lineItems,
      notes: `Thank you for choosing CircleTel!\n\nOrder: ${input.orderNumber}\nAccount: ${input.accountNumber || 'Pending'}`,
      terms: 'Payment due within 7 days',
      discount_type: 'item_level',
      is_discount_before_tax: true,
      discount: 0,
    };

    const response = await this.zohoClient.createBooksInvoice(invoiceData);

    if (!response.success || !response.data) {
      throw new Error('Failed to generate Books invoice');
    }

    const invoice = response.data.invoice || response.data;

    return {
      invoice_id: invoice.invoice_id,
      invoice_number: invoice.invoice_number,
      total,
      status: invoice.status || 'draft',
      invoice_url: invoice.invoice_url,
    };
  }

  /**
   * Create Billing subscription
   */
  private async createBillingSubscription(
    input: ZohoActivationInput,
    customerId: string
  ): Promise<ZohoBillingSubscription> {
    // Calculate next billing date (start of next month)
    const startDate = new Date(input.serviceStartDate);
    const nextBillingDate = new Date(startDate);
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    nextBillingDate.setDate(1);

    const subscriptionData = {
      customer_id: customerId,
      plan_code: this.generatePlanCode(input.packageName),
      plan_description: `${input.packageName} - Monthly Subscription`,
      amount: input.monthlyPrice,
      interval: 1,
      interval_unit: 'months',
      start_date: nextBillingDate.toISOString().split('T')[0],
      billing_cycles: -1, // Indefinite
      auto_collect: true,
      currency_code: 'ZAR',
      reference_id: input.orderNumber,
      notes: `CircleTel Subscription - ${input.packageName}`,
    };

    const response = await this.zohoClient.createBillingSubscription(subscriptionData);

    if (!response.success || !response.data) {
      throw new Error('Failed to create Billing subscription');
    }

    const subscription = response.data.subscription || response.data;

    return {
      subscription_id: subscription.subscription_id,
      subscription_number: subscription.subscription_number || subscription.subscription_id,
      status: subscription.status || 'live',
      next_billing_at: subscription.next_billing_at,
    };
  }

  /**
   * Send invoice email via Zoho Mail
   */
  private async sendInvoiceEmail(input: ZohoActivationInput, invoicePdfUrl: string): Promise<void> {
    const mailData = {
      toAddress: input.email,
      fromAddress: 'billing@circletel.co.za',
      ccAddress: '',
      bccAddress: 'accounts@circletel.co.za',
      subject: `CircleTel Invoice - ${input.orderNumber}`,
      content: `
        <html>
        <body>
          <h2>Your CircleTel Invoice</h2>
          <p>Dear ${input.customerName},</p>

          <p>Thank you for activating your CircleTel service! Please find your invoice attached.</p>

          <p><strong>Order Details:</strong></p>
          <ul>
            <li>Order Number: ${input.orderNumber}</li>
            <li>Package: ${input.packageName}</li>
            <li>Monthly Fee: R ${input.monthlyPrice.toFixed(2)}</li>
            <li>Service Start: ${input.serviceStartDate}</li>
          </ul>

          <p>You can view and download your invoice here: <a href="${invoicePdfUrl}">View Invoice</a></p>

          <p>If you have any questions about your invoice, please contact our billing department at billing@circletel.co.za</p>

          <p>Thank you for choosing CircleTel!</p>

          <p>Best regards,<br>
          The CircleTel Team<br>
          billing@circletel.co.za<br>
          0860 CIRCLE (0860 247 253)</p>
        </body>
        </html>
      `,
    };

    const response = await this.zohoClient.sendMail(mailData);

    if (!response.success) {
      throw new Error('Failed to send invoice email via Zoho Mail');
    }
  }

  /**
   * Generate Zoho Billing plan code from package name
   */
  private generatePlanCode(packageName: string): string {
    return packageName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Retry logic wrapper for resilience
   */
  private async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        console.warn(`Attempt ${attempt}/${maxRetries} failed:`, error.message);

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }
}
