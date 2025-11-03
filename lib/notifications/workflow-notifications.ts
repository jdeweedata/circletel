/**
 * B2B Quote-to-Contract Workflow Notification Service
 * 
 * Handles email notifications for:
 * - KYC completion
 * - Contract ready for signature
 * - Service activation
 * 
 * Integrates with React Email templates
 */

import { Resend } from 'resend';
import { render } from '@react-email/render';
import KYCCompletedEmail from '@/emails/kyc-completed';
import ContractReadyEmail from '@/emails/contract-ready';
import ServiceActivatedEmail from '@/emails/service-activated';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'CircleTel <noreply@circletel.co.za>';

interface KYCSessionData {
  id: string;
  quote_id: string;
  verification_result: string;
  risk_tier: string;
  completed_at: string;
  customer_name?: string;
  customer_email?: string;
  quote_number?: string;
}

interface ContractData {
  id: string;
  contract_number: string;
  quote_id: string;
  customer_name?: string;
  customer_email?: string;
  package_name?: string;
  monthly_price?: number;
  installation_fee?: number;
  zoho_sign_url?: string;
  signature_expires_at?: string;
}

interface OrderData {
  id: string;
  order_number: string;
  account_number: string;
  first_name: string;
  last_name: string;
  email: string;
  package_name: string;
  package_speed: string;
  username: string;
  temporary_password: string;
  activation_date: string;
}

/**
 * Send KYC Completion Email
 * Triggered when Didit verification completes successfully
 */
export async function sendKYCCompletedEmail(kycSession: KYCSessionData) {
  try {
    // Generate email HTML from React template
    const emailHtml = render(
      KYCCompletedEmail({
        customerName: kycSession.customer_name || 'Valued Customer',
        verificationDate: kycSession.completed_at,
        riskTier: kycSession.risk_tier as 'low' | 'medium' | 'high',
        contractUrl: `${process.env.NEXT_PUBLIC_APP_URL}/customer/quotes/${kycSession.quote_id}`,
        quoteNumber: kycSession.quote_number || 'Your Quote',
      })
    );

    // Send via Resend
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: kycSession.customer_email || '',
      subject: 'Verification Complete ✅ - Your Contract is Being Prepared',
      html: emailHtml,
      tags: [
        {
          name: 'category',
          value: 'kyc_completion',
        },
        {
          name: 'quote_id',
          value: kycSession.quote_id,
        },
      ],
    });

    if (error) {
      console.error('[Workflow Notifications] KYC email failed:', error);
      return { success: false, error: error.message };
    }

    console.log('[Workflow Notifications] KYC email sent:', data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('[Workflow Notifications] KYC email error:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Send Contract Ready Email
 * Triggered when contract is generated and Zoho Sign session created
 */
export async function sendContractReadyEmail(contract: ContractData) {
  try {
    // Generate email HTML from React template
    const emailHtml = render(
      ContractReadyEmail({
        customerName: contract.customer_name || 'Valued Customer',
        contractNumber: contract.contract_number,
        zohoSignUrl: contract.zoho_sign_url || '',
        packageName: contract.package_name || 'Internet Service',
        monthlyPrice: contract.monthly_price || 0,
        installationFee: contract.installation_fee || 0,
        expiresAt: contract.signature_expires_at || 
                   new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
    );

    // Send via Resend
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: contract.customer_email || '',
      subject: `Contract Ready to Sign: ${contract.contract_number}`,
      html: emailHtml,
      tags: [
        {
          name: 'category',
          value: 'contract_ready',
        },
        {
          name: 'contract_id',
          value: contract.id,
        },
      ],
    });

    if (error) {
      console.error('[Workflow Notifications] Contract email failed:', error);
      return { success: false, error: error.message };
    }

    console.log('[Workflow Notifications] Contract email sent:', data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('[Workflow Notifications] Contract email error:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Send Service Activated Email
 * Triggered when RICA is approved and service is activated
 */
export async function sendServiceActivatedEmail(order: OrderData) {
  try {
    // Generate email HTML from React template
    const emailHtml = render(
      ServiceActivatedEmail({
        customerName: `${order.first_name} ${order.last_name}`,
        orderNumber: order.order_number,
        accountNumber: order.account_number,
        packageName: order.package_name,
        packageSpeed: order.package_speed,
        username: order.username,
        temporaryPassword: order.temporary_password,
        supportUrl: `${process.env.NEXT_PUBLIC_APP_URL}/customer/support`,
        installationDate: order.activation_date,
      })
    );

    // Send via Resend
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: order.email,
      subject: `Welcome to CircleTel! Your Service is Active 🎉`,
      html: emailHtml,
      tags: [
        {
          name: 'category',
          value: 'service_activation',
        },
        {
          name: 'order_id',
          value: order.id,
        },
      ],
    });

    if (error) {
      console.error('[Workflow Notifications] Activation email failed:', error);
      return { success: false, error: error.message };
    }

    console.log('[Workflow Notifications] Activation email sent:', data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('[Workflow Notifications] Activation email error:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Send all three emails in sequence (testing/demo purpose)
 */
export async function sendWorkflowEmailSequence(
  kycSession: KYCSessionData,
  contract: ContractData,
  order: OrderData
) {
  const results = {
    kyc: await sendKYCCompletedEmail(kycSession),
    contract: await sendContractReadyEmail(contract),
    activation: await sendServiceActivatedEmail(order),
  };

  return results;
}

/**
 * Helper to test email templates locally
 * Returns rendered HTML for preview
 */
export function renderEmailPreview(
  template: 'kyc' | 'contract' | 'activation',
  data: Record<string, any>
) {
  switch (template) {
    case 'kyc':
      return render(KYCCompletedEmail(data));
    case 'contract':
      return render(ContractReadyEmail(data));
    case 'activation':
      return render(ServiceActivatedEmail(data));
    default:
      throw new Error(`Unknown template: ${template}`);
  }
}
