import Link from 'next/link';
import { CreditCard, Shield, AlertTriangle, Clock, FileText, DollarSign, Ban } from 'lucide-react';

export const metadata = {
  title: 'Payment Terms | CircleTel',
  description: 'CircleTel Payment Terms - Information about payment methods, processing, security, and policies via NetCash payment gateway.',
};

export default function PaymentTermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-circleTel-orange to-orange-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-4">
            <CreditCard className="h-12 w-12" />
            <h1 className="text-4xl md:text-5xl font-extrabold">Payment Terms</h1>
          </div>
          <p className="text-xl opacity-95 max-w-2xl">
            Secure payment processing via NetCash - Understanding how your payments are handled
          </p>
          <p className="mt-4 text-sm opacity-90">
            Last updated: 20 January 2025 | Version 1.0
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Introduction */}
        <section className="mb-12">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8">
            <div className="flex items-start gap-3">
              <Shield className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold text-blue-900 mb-2">Secure Payment Gateway</h2>
                <p className="text-blue-800">
                  CircleTel uses <strong>NetCash (Pty) Ltd</strong>, a PCI DSS Level 1 certified payment gateway, to process all customer payments. By making a payment through our website, you agree to these Payment Terms.
                </p>
              </div>
            </div>
          </div>

          <p className="text-gray-700 leading-relaxed mb-4">
            These Payment Terms govern all financial transactions between you and CircleTel (Pty) Ltd. For general service terms, please refer to our <Link href="/terms" className="text-circleTel-orange hover:underline">Terms & Conditions</Link>.
          </p>
        </section>

        {/* Section 1: Payment Gateway & Merchant of Record */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="h-8 w-8 text-circleTel-orange" />
            <h2 className="text-3xl font-bold text-circleTel-darkNeutral">1. Payment Gateway & Merchant of Record</h2>
          </div>

          <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">1.1 NetCash Payment Gateway</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            All payments are processed by <strong>NetCash (Pty) Ltd</strong>, an authorized Financial Services Provider (FSP 47350) regulated by the South African Reserve Bank.
          </p>

          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
            <li><strong>PCI DSS Certified:</strong> NetCash holds PCI DSS Level 1 certification, the highest security standard for payment processors</li>
            <li><strong>Secure Transmission:</strong> All payment data is transmitted via encrypted HTTPS/TLS 1.3 connections</li>
            <li><strong>Tokenization:</strong> Card details are converted to secure tokens; CircleTel never stores full card information</li>
            <li><strong>3D Secure:</strong> Card transactions may require 3D Secure (Verified by Visa, Mastercard SecureCode) authentication</li>
          </ul>

          <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">1.2 Merchant of Record</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            <strong>CircleTel (Pty) Ltd</strong> is the merchant of record for all transactions. Your bank statement will show the payment as:
          </p>

          <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mb-6 font-mono text-sm">
            <p className="mb-2"><strong>Payment Method Validation:</strong> CircleTel - Payment Verification</p>
            <p className="mb-2"><strong>Order Payments:</strong> CT-{'{'}account{'}'} {'{'}package{'}'} {'{'}city{'}'}</p>
            <p><strong>Invoice Payments:</strong> CircleTel - INV-{'{'}number{'}'}</p>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 mb-6">
            <p className="text-yellow-900">
              <strong>Important:</strong> NetCash processes payments on behalf of CircleTel but is not responsible for service delivery, billing disputes, or refunds. All service-related inquiries should be directed to CircleTel.
            </p>
          </div>
        </section>

        {/* Section 2: Supported Payment Methods */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <CreditCard className="h-8 w-8 text-circleTel-orange" />
            <h2 className="text-3xl font-bold text-circleTel-darkNeutral">2. Supported Payment Methods</h2>
          </div>

          <p className="text-gray-700 leading-relaxed mb-6">
            NetCash supports 20+ payment methods for CircleTel customers:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-circleTel-darkNeutral mb-3">Card Payments</h4>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>✓ Visa Credit & Debit Cards</li>
                <li>✓ Mastercard Credit & Debit Cards</li>
                <li>✓ American Express</li>
                <li>✓ Diners Club</li>
              </ul>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-circleTel-darkNeutral mb-3">Instant EFT</h4>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>✓ Ozow Instant EFT</li>
                <li>✓ Bank EFT</li>
                <li>✓ Scan to Pay (QR Code)</li>
                <li>✓ Capitec Pay</li>
              </ul>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-circleTel-darkNeutral mb-3">Digital Wallets</h4>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>✓ Masterpass</li>
                <li>✓ Visa Click to Pay</li>
                <li>✓ SnapScan</li>
              </ul>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-circleTel-darkNeutral mb-3">Other Methods</h4>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>✓ Retail Payments (Checkers, Pick n Pay, etc.)</li>
                <li>✓ Mobicred (Credit facility)</li>
                <li>✓ Debit Order (Monthly subscriptions)</li>
              </ul>
            </div>
          </div>

          <p className="text-gray-700 text-sm italic">
            Payment method availability may vary based on your location, bank, and transaction amount.
          </p>
        </section>

        {/* Section 3: Payment Processing */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="h-8 w-8 text-circleTel-orange" />
            <h2 className="text-3xl font-bold text-circleTel-darkNeutral">3. Payment Processing Timeline</h2>
          </div>

          <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">3.1 Real-Time Payments</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            The following payment methods are processed in real-time:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
            <li><strong>Credit/Debit Cards:</strong> Instant authorization (1-5 seconds)</li>
            <li><strong>Instant EFT (Ozow):</strong> Immediate confirmation (10-30 seconds)</li>
            <li><strong>Capitec Pay:</strong> Real-time processing</li>
            <li><strong>Scan to Pay:</strong> Instant verification</li>
          </ul>

          <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">3.2 Delayed Payments</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            Some payment methods require additional processing time:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
            <li><strong>Bank EFT:</strong> 2-3 business days for confirmation</li>
            <li><strong>Retail Payments:</strong> Up to 48 hours for processing</li>
            <li><strong>Debit Order:</strong> Processed on agreed collection date (monthly)</li>
          </ul>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-6">
            <p className="text-blue-900">
              <strong>Service Activation:</strong> Your CircleTel service will only be activated after successful payment confirmation. For real-time payment methods, this is typically within minutes. For delayed methods, activation may take 2-3 business days.
            </p>
          </div>
        </section>

        {/* Section 4: Payment Verification */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-6">4. Payment Method Verification</h2>

          <p className="text-gray-700 leading-relaxed mb-4">
            When you add a payment method to your CircleTel account, we perform a R1.00 verification charge:
          </p>

          <div className="bg-green-50 border border-green-500 rounded-lg p-6 mb-6">
            <h4 className="font-semibold text-green-900 mb-3">How Verification Works</h4>
            <ol className="list-decimal pl-6 space-y-2 text-green-800">
              <li>You add a new card or payment method to your account</li>
              <li>NetCash charges R1.00 to verify the payment method is active</li>
              <li>The R1.00 is immediately refunded to your account</li>
              <li>Your payment method is now saved for future transactions</li>
            </ol>
          </div>

          <p className="text-gray-700 text-sm">
            <strong>Bank Statement Description:</strong> "CircleTel - Payment Verification"
          </p>
        </section>

        {/* Section 5: Payment Security */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-8 w-8 text-circleTel-orange" />
            <h2 className="text-3xl font-bold text-circleTel-darkNeutral">5. Payment Security & Data Protection</h2>
          </div>

          <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">5.1 PCI DSS Compliance</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            NetCash maintains PCI DSS Level 1 certification, ensuring:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
            <li>Secure storage of cardholder data</li>
            <li>Encrypted transmission of payment information</li>
            <li>Regular security testing and monitoring</li>
            <li>Strict access controls and authentication</li>
            <li>Annual third-party security audits</li>
          </ul>

          <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">5.2 What CircleTel Stores</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-red-50 border border-red-300 rounded-lg p-4">
              <h4 className="font-semibold text-red-900 mb-2">❌ NOT Stored</h4>
              <ul className="space-y-1 text-red-800 text-sm">
                <li>• Full credit card numbers</li>
                <li>• CVV/CVC security codes</li>
                <li>• Card PINs</li>
                <li>• 3D Secure passwords</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-300 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">✓ Stored Securely</h4>
              <ul className="space-y-1 text-green-800 text-sm">
                <li>• Last 4 digits of card number</li>
                <li>• Card type (Visa, Mastercard, etc.)</li>
                <li>• Card expiry month/year</li>
                <li>• Encrypted payment tokens</li>
              </ul>
            </div>
          </div>

          <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">5.3 Fraud Prevention</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            NetCash employs advanced fraud detection systems:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
            <li>Real-time transaction monitoring</li>
            <li>Velocity checks (multiple rapid transactions)</li>
            <li>Geolocation verification</li>
            <li>Device fingerprinting</li>
            <li>Machine learning fraud detection</li>
          </ul>
        </section>

        {/* Section 6: Transaction Fees */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <DollarSign className="h-8 w-8 text-circleTel-orange" />
            <h2 className="text-3xl font-bold text-circleTel-darkNeutral">6. Transaction Fees</h2>
          </div>

          <p className="text-gray-700 leading-relaxed mb-4">
            CircleTel absorbs all NetCash payment processing fees. <strong>Customers are not charged any additional transaction fees</strong> for using our payment gateway.
          </p>

          <div className="bg-green-50 border-l-4 border-green-500 p-6 mb-6">
            <p className="text-green-900">
              ✓ No transaction fees for credit/debit cards<br />
              ✓ No fees for instant EFT payments<br />
              ✓ No fees for digital wallet payments<br />
              ✓ No monthly fees for saved payment methods
            </p>
          </div>

          <p className="text-gray-700 text-sm italic">
            Note: Your bank may charge their own fees for certain payment types (e.g., overseas cards). Please check with your bank for details.
          </p>
        </section>

        {/* Section 7: Failed Payments */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="h-8 w-8 text-circleTel-orange" />
            <h2 className="text-3xl font-bold text-circleTel-darkNeutral">7. Failed Payments & Declined Transactions</h2>
          </div>

          <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">7.1 Common Decline Reasons</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
            <li><strong>Insufficient Funds:</strong> Not enough balance or credit limit</li>
            <li><strong>Card Expired:</strong> Payment card has passed expiry date</li>
            <li><strong>Incorrect Details:</strong> Wrong card number, CVV, or expiry date</li>
            <li><strong>3D Secure Failed:</strong> Incorrect OTP or authentication failure</li>
            <li><strong>Bank Declined:</strong> Transaction blocked by your bank (suspected fraud, overseas transaction, etc.)</li>
            <li><strong>Daily Limit Exceeded:</strong> Transaction exceeds your daily spending limit</li>
          </ul>

          <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">7.2 What Happens if Payment Fails</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
            <li>You will be notified immediately of the payment failure</li>
            <li>Your order will remain in "Payment Pending" status</li>
            <li>You can retry the payment with the same or different payment method</li>
            <li>Service activation will not proceed until payment is successful</li>
            <li>Orders are held for 48 hours before automatic cancellation</li>
          </ul>

          <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">7.3 Recurring Payment Failures (Debit Orders)</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            For monthly subscription services via debit order:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
            <li>Failed debit order collections are retried 3 days later</li>
            <li>After 2 failed attempts, your account is suspended</li>
            <li>You will receive email and SMS notifications before suspension</li>
            <li>Service is restored once payment is successful</li>
            <li>Reconnection fees may apply for extended suspensions</li>
          </ul>
        </section>

        {/* Section 8: Chargebacks & Disputes */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Ban className="h-8 w-8 text-circleTel-orange" />
            <h2 className="text-3xl font-bold text-circleTel-darkNeutral">8. Chargebacks & Payment Disputes</h2>
          </div>

          <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">8.1 Dispute Process</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            If you believe there is an error with a charge on your account:
          </p>

          <ol className="list-decimal pl-6 space-y-3 text-gray-700 mb-6">
            <li>
              <strong>Contact CircleTel First:</strong> Email billing@circletel.co.za with your transaction details. Most billing issues are resolved within 2 business days.
            </li>
            <li>
              <strong>Bank Dispute (if unresolved):</strong> If we cannot resolve the issue, you may dispute the charge with your bank. Provide all correspondence with CircleTel to your bank.
            </li>
            <li>
              <strong>Chargeback Investigation:</strong> NetCash and your bank will investigate the dispute. We will provide transaction records and supporting documentation.
            </li>
            <li>
              <strong>Resolution:</strong> The bank's decision is final. If the chargeback is approved, funds are returned to you. If denied, the charge stands.
            </li>
          </ol>

          <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-6">
            <h4 className="font-semibold text-red-900 mb-2">⚠️ Fraudulent Chargeback Warning</h4>
            <p className="text-red-800">
              Filing a fraudulent chargeback (for services you actually received) is illegal and may result in:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-red-800 mt-2">
              <li>Immediate account termination</li>
              <li>Blacklisting from CircleTel services</li>
              <li>Legal action for fraud</li>
              <li>Reporting to credit bureaus</li>
            </ul>
          </div>

          <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">8.2 Legitimate Chargeback Reasons</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            Valid reasons for initiating a chargeback:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
            <li>Unauthorized transaction (card used without your permission)</li>
            <li>Duplicate charge for the same service</li>
            <li>Charged incorrect amount</li>
            <li>Service not provided after payment</li>
            <li>Subscription charged after cancellation</li>
          </ul>
        </section>

        {/* Section 9: Liability Limitations */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-6">9. Liability Limitations</h2>

          <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">9.1 CircleTel Liability</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            CircleTel is <strong>not liable</strong> for:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
            <li>Payment processing delays caused by NetCash, your bank, or card network</li>
            <li>Declined transactions due to insufficient funds, bank restrictions, or card issues</li>
            <li>Fees charged by your bank for overseas transactions or currency conversion</li>
            <li>Service interruptions during payment processing failures</li>
            <li>Lost revenue or business opportunities due to payment delays</li>
          </ul>

          <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">9.2 NetCash Liability</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            NetCash payment gateway is provided "as is." NetCash is responsible for:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
            <li>Maintaining PCI DSS compliance and security standards</li>
            <li>Processing payments in accordance with card network rules</li>
            <li>Protecting cardholder data from unauthorized access</li>
          </ul>

          <p className="text-gray-700 leading-relaxed">
            NetCash is <strong>not responsible</strong> for CircleTel service delivery, billing disputes, refunds, or customer support issues.
          </p>
        </section>

        {/* Section 10: Currency & Exchange Rates */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-6">10. Currency & Exchange Rates</h2>

          <p className="text-gray-700 leading-relaxed mb-4">
            All prices are quoted in South African Rand (ZAR). If you pay with a card issued outside South Africa:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
            <li>Your bank will convert the charge to your local currency</li>
            <li>Exchange rates are determined by your card issuer</li>
            <li>Your bank may charge foreign transaction fees (typically 2-3%)</li>
            <li>CircleTel does not control currency conversion rates or fees</li>
          </ul>
        </section>

        {/* Section 11: Changes to Payment Terms */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-6">11. Changes to Payment Terms</h2>

          <p className="text-gray-700 leading-relaxed mb-4">
            We may update these Payment Terms periodically. Changes will be effective immediately upon posting on our website. For material changes, we will:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
            <li>Email registered customers at least 30 days before implementation</li>
            <li>Post a notice on our website homepage</li>
            <li>Update the "Last updated" date at the top of this page</li>
          </ul>

          <p className="text-gray-700 leading-relaxed">
            Your continued use of CircleTel payment services after changes constitutes acceptance of the updated Payment Terms.
          </p>
        </section>

        {/* Contact Footer */}
        <div className="bg-gradient-to-r from-circleTel-orange to-orange-600 text-white rounded-lg p-8 mt-12">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="h-8 w-8" />
            <h3 className="text-2xl font-bold">Payment Support</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Billing Inquiries</h4>
              <p className="mb-2">Email: billing@circletel.co.za</p>
              <p className="mb-2">Phone: 087 087 6305</p>
              <p className="mb-2">Support: support@circletel.co.za</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Related Policies</h4>
              <p className="mb-2">
                <Link href="/terms" className="underline hover:opacity-80">Terms & Conditions</Link>
              </p>
              <p className="mb-2">
                <Link href="/privacy-policy" className="underline hover:opacity-80">Privacy Policy</Link>
              </p>
              <p className="mb-2">
                <Link href="/refund-policy" className="underline hover:opacity-80">Refund Policy</Link>
              </p>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-white border-opacity-30">
            <p className="text-sm opacity-90">
              CircleTel (Pty) Ltd | Payments processed by NetCash (Pty) Ltd (FSP 47350)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
