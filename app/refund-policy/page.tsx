import Link from 'next/link';
import { DollarSign, Calendar, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';

export const metadata = {
  title: 'Refund & Cancellation Policy | CircleTel',
  description: 'CircleTel Refund and Cancellation Policy - 30-day money-back guarantee, refund eligibility, and cancellation procedures.',
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-circleTel-orange to-orange-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-4">
            <DollarSign className="h-12 w-12" />
            <h1 className="text-4xl md:text-5xl font-extrabold">Refund & Cancellation Policy</h1>
          </div>
          <p className="text-xl opacity-95 max-w-2xl">
            30-day money-back guarantee and transparent cancellation procedures
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
          <div className="bg-green-50 border-l-4 border-green-500 p-6 mb-8">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold text-green-900 mb-2">30-Day Money-Back Guarantee</h2>
                <p className="text-green-800">
                  CircleTel offers a 30-day money-back guarantee on select services. If you're not satisfied with your Internet connection, you can cancel within 30 days for a full refund of monthly recurring charges.
                </p>
              </div>
            </div>
          </div>

          <p className="text-gray-700 leading-relaxed mb-4">
            This Refund & Cancellation Policy outlines our policies for refunds, service cancellations, and contract terminations. Please read carefully to understand your rights and obligations.
          </p>

          <p className="text-gray-700 leading-relaxed">
            For general service terms, refer to our <Link href="/terms" className="text-circleTel-orange hover:underline">Terms & Conditions</Link>.
          </p>
        </section>

        {/* Section 1: Refund Eligibility */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-6">1. Refund Eligibility</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Eligible for Refund */}
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <h3 className="text-xl font-bold text-green-900">✓ Eligible for Refund</h3>
              </div>
              <ul className="space-y-3 text-green-900">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Monthly recurring charges for standard packages</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Services cancelled within 30 days of activation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Accounts with credit balance (pro-rata refunds)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Duplicate charges or billing errors</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Service not delivered after payment</span>
                </li>
              </ul>
            </div>

            {/* NOT Eligible for Refund */}
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <XCircle className="h-8 w-8 text-red-600" />
                <h3 className="text-xl font-bold text-red-900">✗ NOT Eligible for Refund</h3>
              </div>
              <ul className="space-y-3 text-red-900">
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <span>Installation fees and setup charges</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <span>Router purchases and hardware equipment</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <span>Contract cancellation fees</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <span>Third-party charges (FNO installation fees)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <span>Services used beyond 30 days</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <span>Promotional discounts (non-refundable)</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-6">
            <h4 className="font-semibold text-blue-900 mb-2">Pro-Rata Refunds</h4>
            <p className="text-blue-800">
              If you cancel mid-month and have already paid for the full month, you may be eligible for a pro-rata refund for unused days, less any administrative fees. Refunds are calculated from the date we process your cancellation request.
            </p>
          </div>
        </section>

        {/* Section 2: 30-Day Money-Back Guarantee */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="h-8 w-8 text-circleTel-orange" />
            <h2 className="text-3xl font-bold text-circleTel-darkNeutral">2. 30-Day Money-Back Guarantee</h2>
          </div>

          <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">2.1 How It Works</h3>
          <ol className="list-decimal pl-6 space-y-3 text-gray-700 mb-6">
            <li>
              <strong>Activate Service:</strong> Your CircleTel Internet service is installed and activated
            </li>
            <li>
              <strong>30-Day Trial Period:</strong> You have 30 calendar days from activation to evaluate the service
            </li>
            <li>
              <strong>Request Cancellation:</strong> If not satisfied, request cancellation via Customer Portal or email
            </li>
            <li>
              <strong>Full Refund:</strong> We refund your monthly recurring charges within 14 business days
            </li>
          </ol>

          <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">2.2 Conditions</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
            <li>Money-back guarantee applies only to monthly recurring service charges</li>
            <li>Installation fees, router purchases, and third-party charges are non-refundable</li>
            <li>You must return any CircleTel-owned equipment in good condition</li>
            <li>Guarantee does not apply if service was suspended due to Terms of Service violation</li>
            <li>One money-back guarantee per customer (not applicable to repeat customers)</li>
          </ul>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6">
            <h4 className="font-semibold text-yellow-900 mb-2">⏰ Important Timing Note</h4>
            <p className="text-yellow-800">
              The 30-day period starts from your <strong>service activation date</strong>, not your payment date. If installation takes 5 days after payment, your 30-day trial starts when your Internet goes live.
            </p>
          </div>
        </section>

        {/* Section 3: Cancellation Procedures */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-6">3. Cancellation Procedures</h2>

          <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">3.1 How to Cancel</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            You can cancel your CircleTel service through the following methods:
          </p>

          <div className="space-y-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-circleTel-darkNeutral mb-2">✓ Recommended: Customer Portal</h4>
              <p className="text-gray-700">Log in to your account → Manage Services → Request Cancellation</p>
              <p className="text-sm text-gray-600 mt-2">Fastest method with instant confirmation email</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-circleTel-darkNeutral mb-2">✓ Email Request</h4>
              <p className="text-gray-700">
                Send cancellation request to: <a href="mailto:support@circletel.co.za" className="text-circleTel-orange hover:underline">support@circletel.co.za</a>
              </p>
              <p className="text-sm text-gray-600 mt-2">Include account number, reason for cancellation, and preferred cancellation date</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-circleTel-darkNeutral mb-2">✓ Phone Support</h4>
              <p className="text-gray-700">Call 087 087 6305 (Mon-Fri, 8am-5pm)</p>
              <p className="text-sm text-gray-600 mt-2">Verbal cancellations must be confirmed via email</p>
            </div>
          </div>

          <div className="bg-red-50 border-l-4 border-red-500 p-6">
            <p className="text-red-900">
              <strong>❌ Invalid Cancellation Methods:</strong> Cancellation requests via social media, WhatsApp, or informal channels are <strong>not valid</strong>. You must use one of the official methods above to ensure proper processing.
            </p>
          </div>
        </section>

        {/* Section 4: Notice Periods */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="h-8 w-8 text-circleTel-orange" />
            <h2 className="text-3xl font-bold text-circleTel-darkNeutral">4. Notice Periods & Effective Dates</h2>
          </div>

          <table className="w-full border-collapse border border-gray-300 mb-6">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-3 text-left font-semibold">Service Type</th>
                <th className="border border-gray-300 p-3 text-left font-semibold">Notice Period</th>
                <th className="border border-gray-300 p-3 text-left font-semibold">Effective Date</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-3">Month-to-Month Services</td>
                <td className="border border-gray-300 p-3">One full calendar month</td>
                <td className="border border-gray-300 p-3">Last day of notice period</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 p-3">12-Month Contract Services</td>
                <td className="border border-gray-300 p-3">Service continues until contract end</td>
                <td className="border border-gray-300 p-3">Contract expiry date</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-3">Early Contract Termination</td>
                <td className="border border-gray-300 p-3">Immediate (with fees)</td>
                <td className="border border-gray-300 p-3">Upon fee payment</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 p-3">Within 30-Day Guarantee</td>
                <td className="border border-gray-300 p-3">No notice required</td>
                <td className="border border-gray-300 p-3">Immediate</td>
              </tr>
            </tbody>
          </table>

          <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">4.1 Calendar Month Notice Example</h3>
          <div className="bg-blue-50 border border-blue-300 rounded-lg p-6 mb-6">
            <p className="text-blue-900 mb-3">
              <strong>Scenario:</strong> You request cancellation on 15 March 2025
            </p>
            <ul className="list-disc pl-6 space-y-2 text-blue-800">
              <li><strong>Notice Period:</strong> Full month of March + Full month of April</li>
              <li><strong>Last Billing Date:</strong> April 2025 (you pay for March and April)</li>
              <li><strong>Service Disconnection:</strong> 30 April 2025</li>
              <li><strong>Final Invoice:</strong> Issued 1 May 2025</li>
            </ul>
          </div>
        </section>

        {/* Section 5: Cancellation Fees */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-6">5. Cancellation Fees</h2>

          <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">5.1 Early Contract Termination Fees</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            If you cancel a contract service before the contract end date, you will be charged:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
            <li><strong>Remaining Contract Value:</strong> Monthly fee × remaining months (up to R2,500 maximum)</li>
            <li><strong>FNO Cancellation Fee:</strong> Charged by network provider if applicable (e.g., Vumatel: R999)</li>
            <li><strong>Clawback Fee:</strong> If installation fees were waived as promotion (varies by provider)</li>
          </ul>

          <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">5.2 Other Fees</h3>
          <table className="w-full border-collapse border border-gray-300 mb-6">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-3 text-left font-semibold">Fee Type</th>
                <th className="border border-gray-300 p-3 text-left font-semibold">Amount</th>
                <th className="border border-gray-300 p-3 text-left font-semibold">When Applicable</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-3">Equipment Return Failure</td>
                <td className="border border-gray-300 p-3">R2,500 - R5,000</td>
                <td className="border border-gray-300 p-3">If router not returned within 14 days</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 p-3">Damaged Equipment</td>
                <td className="border border-gray-300 p-3">Actual replacement cost</td>
                <td className="border border-gray-300 p-3">If returned equipment is damaged</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-3">Outstanding Balance</td>
                <td className="border border-gray-300 p-3">Full outstanding amount</td>
                <td className="border border-gray-300 p-3">Must be paid before disconnection</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Section 6: Refund Processing */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <DollarSign className="h-8 w-8 text-circleTel-orange" />
            <h2 className="text-3xl font-bold text-circleTel-darkNeutral">6. Refund Processing</h2>
          </div>

          <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">6.1 Processing Timeline</h3>
          <ol className="list-decimal pl-6 space-y-3 text-gray-700 mb-6">
            <li>
              <strong>Cancellation Request Received:</strong> We confirm cancellation via email within 24 hours
            </li>
            <li>
              <strong>Refund Approval:</strong> Refund is approved within 3-5 business days
            </li>
            <li>
              <strong>Payment to NetCash:</strong> Refund is processed to NetCash payment gateway
            </li>
            <li>
              <strong>Return to Your Account:</strong> Funds reflect in your bank account within 7-14 business days
            </li>
          </ol>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 mb-6">
            <p className="text-yellow-900">
              <strong>Bank Processing Time:</strong> The 7-14 business day timeline after step 3 is controlled by your bank and card network (Visa, Mastercard, etc.), not CircleTel. We cannot expedite this process.
            </p>
          </div>

          <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">6.2 Refund Method</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            Refunds are processed to the <strong>original payment method</strong>:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
            <li><strong>Credit Card:</strong> Credited back to the same card</li>
            <li><strong>Debit Card:</strong> Credited back to your bank account</li>
            <li><strong>EFT Payment:</strong> Refunded via EFT to your bank account</li>
            <li><strong>Cash/Retail Payments:</strong> Refunded via EFT (provide bank details)</li>
          </ul>

          <p className="text-gray-700 text-sm">
            We cannot refund to a different payment method or account due to anti-fraud regulations.
          </p>
        </section>

        {/* Section 7: Equipment Return */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-6">7. Equipment Return Procedure</h2>

          <p className="text-gray-700 leading-relaxed mb-4">
            If you have CircleTel-owned equipment (router, ONT, etc.), you must return it within <strong>14 days</strong> of cancellation:
          </p>

          <div className="space-y-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-circleTel-darkNeutral mb-2">Step 1: Request Return Label</h4>
              <p className="text-gray-700">Email support@circletel.co.za to request a prepaid shipping label</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-circleTel-darkNeutral mb-2">Step 2: Package Equipment</h4>
              <p className="text-gray-700">Include router, power adapter, cables, and original packaging (if available)</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-circleTel-darkNeutral mb-2">Step 3: Ship Equipment</h4>
              <p className="text-gray-700">Drop off at courier location or schedule pickup</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-circleTel-darkNeutral mb-2">Step 4: Receive Confirmation</h4>
              <p className="text-gray-700">We confirm receipt and inspect equipment condition</p>
            </div>
          </div>

          <div className="bg-red-50 border-l-4 border-red-500 p-6">
            <p className="text-red-900">
              <strong>Failure to Return:</strong> If equipment is not returned within 14 days, you will be charged the full replacement cost (R2,500 - R5,000) and may be blacklisted from future CircleTel services.
            </p>
          </div>
        </section>

        {/* Section 8: Exceptions and Special Cases */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <AlertCircle className="h-8 w-8 text-circleTel-orange" />
            <h2 className="text-3xl font-bold text-circleTel-darkNeutral">8. Exceptions and Special Cases</h2>
          </div>

          <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">8.1 Service Not Available After Payment</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            If we are unable to activate your service due to lack of infrastructure coverage:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
            <li><strong>Full refund</strong> of all payments (including installation fees)</li>
            <li>Processed within 5-7 business days</li>
            <li>No cancellation fees apply</li>
          </ul>

          <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">8.2 Service Quality Issues</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            If you experience ongoing service quality issues that we cannot resolve:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
            <li>Document issues via support tickets</li>
            <li>Allow CircleTel reasonable time to resolve (14-30 days)</li>
            <li>If unresolved, you may be eligible for cancellation without early termination fees</li>
          </ul>

          <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">8.3 Death or Permanent Disability</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            In cases of customer death or permanent disability:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
            <li>Contract termination fees are waived</li>
            <li>Requires submission of death certificate or medical documentation</li>
            <li>Pro-rata refund issued for unused portion of prepaid services</li>
          </ul>
        </section>

        {/* Section 9: Dispute Resolution */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-6">9. Refund Disputes</h2>

          <p className="text-gray-700 leading-relaxed mb-4">
            If you disagree with a refund decision or amount:
          </p>

          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-circleTel-darkNeutral mb-2">Step 1: Contact Billing Department</h4>
              <p className="text-gray-700">
                Email: billing@circletel.co.za<br />
                Phone: 087 087 6305<br />
                Provide: Account number, cancellation date, dispute details
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-circleTel-darkNeutral mb-2">Step 2: Formal Complaint</h4>
              <p className="text-gray-700">
                If not resolved within 5 business days, escalate to: complaints@circletel.co.za
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-circleTel-darkNeutral mb-2">Step 3: External Dispute Resolution</h4>
              <p className="text-gray-700">
                File complaint with ICASA (Independent Communications Authority of South Africa)<br />
                Website: <a href="https://www.icasa.org.za" className="text-circleTel-orange hover:underline">www.icasa.org.za</a>
              </p>
            </div>
          </div>
        </section>

        {/* Contact Footer */}
        <div className="bg-gradient-to-r from-circleTel-orange to-orange-600 text-white rounded-lg p-8 mt-12">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="h-8 w-8" />
            <h3 className="text-2xl font-bold">Cancellation & Refund Support</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Request Cancellation</h4>
              <p className="mb-2">Portal: <Link href="/dashboard" className="underline hover:opacity-80">Customer Dashboard</Link></p>
              <p className="mb-2">Email: support@circletel.co.za</p>
              <p className="mb-2">Phone: 087 087 6305</p>
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
                <Link href="/payment-terms" className="underline hover:opacity-80">Payment Terms</Link>
              </p>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-white border-opacity-30">
            <p className="text-sm opacity-90">
              CircleTel (Pty) Ltd | All refunds processed via NetCash payment gateway
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
