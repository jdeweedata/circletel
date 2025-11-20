import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { POLICY_URLS, POLICY_NAMES } from '@/lib/constants/policy-versions';

export interface PaymentConsents {
  terms: boolean;
  privacy: boolean;
  paymentTerms: boolean;
  refundPolicy: boolean;
  recurringPayment?: boolean;
  marketing?: boolean;
}

export interface B2BConsents extends PaymentConsents {
  dataProcessing: boolean;
  thirdPartyDisclosure: boolean;
  businessVerification: boolean;
}

interface PaymentConsentCheckboxesProps {
  consents: PaymentConsents | B2BConsents;
  onConsentChange: (consents: PaymentConsents | B2BConsents) => void;
  showRecurringPayment?: boolean;
  showMarketing?: boolean;
  variant?: 'consumer' | 'b2b';
  errors?: string[];
}

/**
 * PaymentConsentCheckboxes Component
 *
 * Displays legal consent checkboxes for payment flows.
 * Supports both B2C and B2B consent requirements.
 *
 * @param consents - Current consent state
 * @param onConsentChange - Callback when consents change
 * @param showRecurringPayment - Show debit order authorization checkbox
 * @param showMarketing - Show marketing consent checkbox (optional)
 * @param variant - 'consumer' for B2C, 'b2b' for B2B (adds extra checkboxes)
 * @param errors - Validation errors to display
 */
export function PaymentConsentCheckboxes({
  consents,
  onConsentChange,
  showRecurringPayment = false,
  showMarketing = false,
  variant = 'consumer',
  errors = [],
}: PaymentConsentCheckboxesProps) {
  const updateConsent = (key: keyof (PaymentConsents | B2BConsents), value: boolean) => {
    onConsentChange({
      ...consents,
      [key]: value,
    });
  };

  const isB2B = variant === 'b2b';
  const b2bConsents = isB2B ? (consents as B2BConsents) : null;

  return (
    <div className="space-y-4">
      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
          <p className="text-sm font-semibold text-red-900 mb-2">Please review the following:</p>
          <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Section Header */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Legal Agreements {isB2B && '(Business Customers)'}
        </h3>
        <p className="text-xs text-gray-600 mb-4">
          Please review and accept the following policies to continue with payment:
        </p>
      </div>

      {/* Required Consents */}
      <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <p className="text-xs font-semibold text-gray-700 mb-2">Required *</p>

        {/* Terms & Conditions */}
        <div className="flex items-start gap-3">
          <Checkbox
            id="consent-terms"
            checked={consents.terms}
            onCheckedChange={(checked) => updateConsent('terms', checked as boolean)}
            required
            className="mt-0.5"
          />
          <Label
            htmlFor="consent-terms"
            className="text-sm text-gray-700 cursor-pointer leading-relaxed"
          >
            I accept the{' '}
            <Link
              href={POLICY_URLS.TERMS}
              target="_blank"
              className="text-circleTel-orange hover:underline font-semibold"
            >
              {POLICY_NAMES.TERMS}
            </Link>
            {' '}*
          </Label>
        </div>

        {/* Privacy Policy */}
        <div className="flex items-start gap-3">
          <Checkbox
            id="consent-privacy"
            checked={consents.privacy}
            onCheckedChange={(checked) => updateConsent('privacy', checked as boolean)}
            required
            className="mt-0.5"
          />
          <Label
            htmlFor="consent-privacy"
            className="text-sm text-gray-700 cursor-pointer leading-relaxed"
          >
            I accept the{' '}
            <Link
              href={POLICY_URLS.PRIVACY}
              target="_blank"
              className="text-circleTel-orange hover:underline font-semibold"
            >
              {POLICY_NAMES.PRIVACY}
            </Link>
            {' '}*
          </Label>
        </div>

        {/* Payment Terms */}
        <div className="flex items-start gap-3">
          <Checkbox
            id="consent-payment-terms"
            checked={consents.paymentTerms}
            onCheckedChange={(checked) => updateConsent('paymentTerms', checked as boolean)}
            required
            className="mt-0.5"
          />
          <Label
            htmlFor="consent-payment-terms"
            className="text-sm text-gray-700 cursor-pointer leading-relaxed"
          >
            I accept the{' '}
            <Link
              href={POLICY_URLS.PAYMENT_TERMS}
              target="_blank"
              className="text-circleTel-orange hover:underline font-semibold"
            >
              {POLICY_NAMES.PAYMENT_TERMS}
            </Link>
            {' '}*
          </Label>
        </div>
      </div>

      {/* Refund Policy (Optional Acknowledgment) */}
      <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-lg border border-blue-200">
        <Checkbox
          id="consent-refund"
          checked={consents.refundPolicy}
          onCheckedChange={(checked) => updateConsent('refundPolicy', checked as boolean)}
          className="mt-0.5"
        />
        <Label
          htmlFor="consent-refund"
          className="text-sm text-gray-700 cursor-pointer leading-relaxed"
        >
          I acknowledge the{' '}
          <Link
            href={POLICY_URLS.REFUND_POLICY}
            target="_blank"
            className="text-blue-600 hover:underline font-semibold"
          >
            {POLICY_NAMES.REFUND_POLICY}
          </Link>
          {' '}(including 30-day money-back guarantee terms)
        </Label>
      </div>

      {/* Recurring Payment Authorization */}
      {showRecurringPayment && (
        <div className="flex items-start gap-3 bg-green-50 p-4 rounded-lg border border-green-200">
          <Checkbox
            id="consent-recurring"
            checked={consents.recurringPayment || false}
            onCheckedChange={(checked) => updateConsent('recurringPayment', checked as boolean)}
            required
            className="mt-0.5"
          />
          <Label
            htmlFor="consent-recurring"
            className="text-sm text-gray-700 cursor-pointer leading-relaxed"
          >
            <span className="font-semibold text-green-900">I authorize recurring payments</span>
            <br />
            <span className="text-xs text-green-800">
              I authorize CircleTel to charge my payment method monthly for subscription services.
              I understand I can cancel at any time with one month's notice.
            </span>
            {' '}*
          </Label>
        </div>
      )}

      {/* B2B-Specific Consents */}
      {isB2B && b2bConsents && (
        <div className="space-y-3 bg-purple-50 p-4 rounded-lg border border-purple-200">
          <p className="text-xs font-semibold text-purple-900 mb-2">
            Business Customer Agreements *
          </p>

          {/* Data Processing Consent */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="consent-data-processing"
              checked={b2bConsents.dataProcessing}
              onCheckedChange={(checked) => updateConsent('dataProcessing', checked as boolean)}
              required
              className="mt-0.5"
            />
            <Label
              htmlFor="consent-data-processing"
              className="text-sm text-gray-700 cursor-pointer leading-relaxed"
            >
              I authorize CircleTel to process business data in accordance with POPIA for service delivery *
            </Label>
          </div>

          {/* Third-Party Disclosure */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="consent-third-party"
              checked={b2bConsents.thirdPartyDisclosure}
              onCheckedChange={(checked) => updateConsent('thirdPartyDisclosure', checked as boolean)}
              required
              className="mt-0.5"
            />
            <Label
              htmlFor="consent-third-party"
              className="text-sm text-gray-700 cursor-pointer leading-relaxed"
            >
              I consent to sharing business information with service providers (ISPs, payment processors, KYC providers) for service delivery *
            </Label>
          </div>

          {/* Business Verification */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="consent-business-verification"
              checked={b2bConsents.businessVerification}
              onCheckedChange={(checked) => updateConsent('businessVerification', checked as boolean)}
              required
              className="mt-0.5"
            />
            <Label
              htmlFor="consent-business-verification"
              className="text-sm text-gray-700 cursor-pointer leading-relaxed"
            >
              I confirm I have the authority to bind the company/organization to this agreement *
            </Label>
          </div>
        </div>
      )}

      {/* Marketing Consent (Optional) */}
      {showMarketing && (
        <div className="flex items-start gap-3 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <Checkbox
            id="consent-marketing"
            checked={consents.marketing || false}
            onCheckedChange={(checked) => updateConsent('marketing', checked as boolean)}
            className="mt-0.5"
          />
          <Label
            htmlFor="consent-marketing"
            className="text-sm text-gray-700 cursor-pointer leading-relaxed"
          >
            <span className="font-semibold">Receive marketing communications (optional)</span>
            <br />
            <span className="text-xs text-gray-600">
              I agree to receive promotional emails, SMS, and special offers from CircleTel.
              You can unsubscribe at any time.
            </span>
          </Label>
        </div>
      )}

      {/* Footer Note */}
      <p className="text-xs text-gray-500 italic">
        * Required fields. All policies open in a new tab for your review.
      </p>
    </div>
  );
}
