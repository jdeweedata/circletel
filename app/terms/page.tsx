import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, FileText, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const metadata: Metadata = {
  title: 'Terms and Conditions | CircleTel',
  description: 'CircleTel Terms and Conditions - General Terms, Acceptable Use Policy, Billing Terms, and Dispute Resolution for all CircleTel services.',
  openGraph: {
    title: 'Terms and Conditions | CircleTel',
    description: 'Review CircleTel\'s comprehensive terms and conditions for our telecommunications services.',
    url: 'https://www.circletel.co.za/terms',
  }
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-circleTel-orange to-orange-600 text-white py-16">
        <div className="container mx-auto px-4">
          <Link
            href="/"
            className="inline-flex items-center text-white hover:text-gray-200 mb-6 transition-colors"
          >
            <ArrowLeft className="mr-2" size={20} />
            Back to Home
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <FileText size={48} />
            <h1 className="text-4xl md:text-5xl font-bold">Terms and Conditions</h1>
          </div>

          <p className="text-xl opacity-90 max-w-4xl">
            Please read these terms and conditions carefully before using CircleTel services.
          </p>

          <div className="mt-6 text-sm opacity-80">
            Last Updated: {new Date().toLocaleDateString('en-ZA', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Important Notice */}
          <Alert className="mb-8 bg-blue-50 border-blue-200">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <strong>Consumer Protection Act Notice:</strong> Where the Consumer Protection Act, 2008 (CPA) applies to this Agreement,
              the provisions of the CPA shall prevail in the event of any conflict between any provision of this Agreement and the provisions of the CPA.
            </AlertDescription>
          </Alert>

          {/* Table of Contents */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8 mb-8">
            <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-6">Table of Contents</h2>
            <nav className="space-y-2">
              <a href="#section-1" className="block text-circleTel-orange hover:underline">1. General Terms and Conditions</a>
              <a href="#section-2" className="block text-circleTel-orange hover:underline">2. Definitions and Interpretation</a>
              <a href="#section-3" className="block text-circleTel-orange hover:underline">3. Acceptable Use Policy (AUP)</a>
              <a href="#section-4" className="block text-circleTel-orange hover:underline">4. Billing Terms</a>
              <a href="#section-5" className="block text-circleTel-orange hover:underline">5. Dispute Resolution</a>
              <a href="#section-6" className="block text-circleTel-orange hover:underline">6. Product-Specific Terms</a>
              <a href="#section-7" className="block text-circleTel-orange hover:underline">7. Liability and Indemnity</a>
              <a href="#section-8" className="block text-circleTel-orange hover:underline">8. Termination and Suspension</a>
              <a href="#section-9" className="block text-circleTel-orange hover:underline">9. General Provisions</a>
            </nav>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8 prose prose-lg max-w-none">

            {/* Section 1: General Terms */}
            <section id="section-1" className="mb-12 scroll-mt-20">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-6 pb-3 border-b-2 border-circleTel-orange">
                1. General Terms and Conditions
              </h2>

              <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">1.1 Agreement Scope</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                This is an agreement between you ("Customer", "you", "your") and CircleTel (Pty) Ltd ("CircleTel", "we", "us", "our")
                regarding your use of CircleTel's telecommunications products, services, connectivity solutions, and IT management services.
              </p>

              <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">1.2 Agreement Applicability</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                This Agreement applies to all accounts, sub-accounts, and alternative account names associated with your principal account.
                The Account Holder is responsible for the use of each account.
              </p>

              <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">1.3 Consumer Protection Act Compliance</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                In circumstances where the Consumer Protection Act, 2008 ("the CPA") applies to this Agreement, the provisions of the CPA
                shall prevail in the event of a conflict between any provision of this Agreement and the provisions of the CPA.
              </p>

              <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">1.4 Service Provision</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                CircleTel provides telecommunications services including but not limited to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>Fibre Internet Connectivity</li>
                <li>Fixed Wireless (5G/LTE) Internet</li>
                <li>VoIP Telephony Services</li>
                <li>Cloud Hosting and Migration Services</li>
                <li>Managed IT Services</li>
                <li>Business Connectivity Solutions</li>
              </ul>
            </section>

            {/* Section 2: Definitions */}
            <section id="section-2" className="mb-12 scroll-mt-20">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-6 pb-3 border-b-2 border-circleTel-orange">
                2. Definitions and Interpretation
              </h2>

              <div className="bg-gray-50 rounded-lg p-6 mb-4">
                <dl className="space-y-4">
                  <div>
                    <dt className="font-semibold text-circleTel-darkNeutral">Account Holder</dt>
                    <dd className="text-gray-700 ml-4">The person or entity who has registered for CircleTel services and is responsible for all usage and payments.</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-circleTel-darkNeutral">Services</dt>
                    <dd className="text-gray-700 ml-4">All telecommunications, connectivity, hosting, and IT management services provided by CircleTel.</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-circleTel-darkNeutral">FNO (Fibre Network Operator)</dt>
                    <dd className="text-gray-700 ml-4">Third-party infrastructure providers such as Vumatel, Openserve, DFA, Frogfoot, and MetroFibre who own and operate fibre networks.</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-circleTel-darkNeutral">Due Date</dt>
                    <dd className="text-gray-700 ml-4">The date by which payment for services is due as specified on your invoice.</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-circleTel-darkNeutral">CGNAT (Carrier-Grade NAT)</dt>
                    <dd className="text-gray-700 ml-4">A network address translation mechanism used to manage IPv4 address limitations.</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-circleTel-darkNeutral">RICA</dt>
                    <dd className="text-gray-700 ml-4">Regulation of Interception of Communications and Provision of Communication-Related Information Act, governing the registration of telecommunications services.</dd>
                  </div>
                </dl>
              </div>
            </section>

            {/* Section 3: Acceptable Use Policy */}
            <section id="section-3" className="mb-12 scroll-mt-20">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-6 pb-3 border-b-2 border-circleTel-orange">
                3. Acceptable Use Policy (AUP)
              </h2>

              <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">3.1 General Acceptable Use</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You are expected to use the Internet and other networks and services accessed through CircleTel services with respect,
                courtesy, and responsibility, giving due regard to the rights of other Internet users.
              </p>

              <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">3.2 Prohibited Activities</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                The following activities are strictly prohibited and may result in immediate service suspension or termination:
              </p>

              <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-6">
                <h4 className="font-semibold text-red-900 mb-3">Illegal Activities</h4>
                <ul className="list-disc pl-6 space-y-2 text-red-900">
                  <li>Unauthorized distribution of copyrighted material</li>
                  <li>Harassment, fraud, or impersonation</li>
                  <li>Distribution of obscene or illegal content</li>
                  <li>Child sexual abuse imagery (CSAM)</li>
                  <li>Illegal drug trafficking or related activities</li>
                  <li>Pirated software, hacker programs, or warez distribution</li>
                </ul>
              </div>

              <div className="bg-orange-50 border-l-4 border-circleTel-orange p-6 mb-6">
                <h4 className="font-semibold text-orange-900 mb-3">Network Security Violations</h4>
                <ul className="list-disc pl-6 space-y-2 text-orange-900">
                  <li>Unauthorized access, use, probing, or scanning of security measures</li>
                  <li>Mail bombing, flooding, or broadcast attacks</li>
                  <li>Forging TCP-IP packet headers or email headers</li>
                  <li>Excessive CPU time or storage space consumption</li>
                  <li>Denial of Service (DoS) attacks</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 mb-6">
                <h4 className="font-semibold text-yellow-900 mb-3">Spam and Unsolicited Communications</h4>
                <ul className="list-disc pl-6 space-y-2 text-yellow-900">
                  <li>Sending unsolicited commercial email (spam)</li>
                  <li>Using third-party mail servers to relay mail without permission</li>
                  <li>Off-topic posts to newsgroups, forums, or mailing lists</li>
                  <li>Mass emailing that provokes complaints</li>
                  <li>Falsifying user information in emails</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">3.3 Enforcement and Penalties</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                CircleTel takes violations of this Acceptable Use Policy seriously. Upon receiving notice of an alleged violation:
              </p>

              <div className="bg-gray-100 rounded-lg p-6 mb-4">
                <h4 className="font-semibold text-circleTel-darkNeutral mb-3">Investigation Process</h4>
                <ol className="list-decimal pl-6 space-y-2 text-gray-700">
                  <li>CircleTel will investigate alleged violations within 24-48 hours</li>
                  <li>Services may be restricted or suspended during the investigation</li>
                  <li>Customer will be notified of the investigation and findings</li>
                  <li>Evidence and documentation will be collected and preserved</li>
                </ol>
              </div>

              <div className="bg-gray-100 rounded-lg p-6 mb-4">
                <h4 className="font-semibold text-circleTel-darkNeutral mb-3">Violation Penalties</h4>
                <ul className="space-y-3 text-gray-700">
                  <li>
                    <strong className="text-circleTel-darkNeutral">First Violation:</strong>
                    <span className="ml-2">R2,000 cleanup fee + account review for potential termination</span>
                  </li>
                  <li>
                    <strong className="text-circleTel-darkNeutral">Second Violation:</strong>
                    <span className="ml-2">R5,000 cleanup fee + immediate service termination</span>
                  </li>
                  <li>
                    <strong className="text-circleTel-darkNeutral">Investigation Fees:</strong>
                    <span className="ml-2">Up to R2,000 per hour for violation investigation</span>
                  </li>
                  <li>
                    <strong className="text-circleTel-darkNeutral">Legal Costs:</strong>
                    <span className="ml-2">Customer liable for all attorney fees and legal expenses</span>
                  </li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">3.4 Abuse Reporting</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                To report violations of this Acceptable Use Policy, please contact:
              </p>
              <div className="bg-circleTel-orange bg-opacity-10 rounded-lg p-4 mb-4">
                <p className="font-semibold text-circleTel-darkNeutral">Email: <a href="mailto:abuse@circletel.co.za" className="text-circleTel-orange hover:underline">abuse@circletel.co.za</a></p>
                <p className="text-gray-700 mt-2">Please include all relevant details, evidence, and timestamps in your report.</p>
              </div>
            </section>

            {/* Section 4: Billing Terms */}
            <section id="section-4" className="mb-12 scroll-mt-20">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-6 pb-3 border-b-2 border-circleTel-orange">
                4. Billing Terms
              </h2>

              <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">4.1 General Billing</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                CircleTel provides itemized bills/invoices in your Customer Portal. All accounts are due on the invoice presentation
                date ("Due Date"). Payment must be received by the Due Date to avoid service interruption.
              </p>

              <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">4.2 Payment Methods</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                CircleTel accepts the following payment methods:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-circleTel-darkNeutral mb-2">Card Payments</h4>
                  <p className="text-sm text-gray-700">Visa, Mastercard, American Express, Diners Club via NetCash Pay Now (3D Secure)</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-circleTel-darkNeutral mb-2">Debit Order</h4>
                  <p className="text-sm text-gray-700">Automatic monthly deduction from your bank account</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-circleTel-darkNeutral mb-2">Instant EFT</h4>
                  <p className="text-sm text-gray-700">Real-time bank payments via Ozow</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-circleTel-darkNeutral mb-2">Manual EFT</h4>
                  <p className="text-sm text-gray-700">Traditional online banking transfers (proof of payment required)</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-circleTel-darkNeutral mb-2">Cash Options</h4>
                  <p className="text-sm text-gray-700">1Voucher, paymyway, SCode at retail outlets</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-circleTel-darkNeutral mb-2">Buy Now Pay Later</h4>
                  <p className="text-sm text-gray-700">Payflex (4 interest-free installments)</p>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">4.3 Failed Payments</h3>
              <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-6">
                <p className="text-red-900">
                  <strong>Failed Payment Fee:</strong> R65.00 (incl. VAT) will be charged for all returned debit orders or failed payments.
                </p>
              </div>

              <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">4.4 Effect of Non-Payment</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                If payment is not received by the Due Date, the following consequences apply:
              </p>
              <div className="space-y-4 mb-6">
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-900 mb-2">Interest Charges</h4>
                  <p className="text-yellow-900">2% per month (24% per annum) interest on overdue accounts</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-900 mb-2">Service Suspension</h4>
                  <p className="text-orange-900">Services may be suspended or terminated if payment is not received by the Due Date</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 mb-2">Debt Collection</h4>
                  <p className="text-red-900">Outstanding balances may be submitted to debt collection agencies, and customer is liable for all collection costs</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 mb-2">Reconnection Fee</h4>
                  <p className="text-red-900">R250.00 reconnection fee applies if service is suspended due to non-payment</p>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">4.5 Refunds and Money-Back Guarantee</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                CircleTel offers a 30-day money-back guarantee on select services, subject to the following conditions:
              </p>
              <div className="bg-green-50 border-l-4 border-green-500 p-6 mb-4">
                <h4 className="font-semibold text-green-900 mb-3">Eligible for Refund:</h4>
                <ul className="list-disc pl-6 space-y-1 text-green-900">
                  <li>Monthly recurring charges for standard packages</li>
                  <li>Services cancelled within 30 days of activation</li>
                  <li>Accounts with credit balance</li>
                </ul>
              </div>
              <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-4">
                <h4 className="font-semibold text-red-900 mb-3">Not Eligible for Refund:</h4>
                <ul className="list-disc pl-6 space-y-1 text-red-900">
                  <li>Installation fees and setup charges</li>
                  <li>Router purchases and hardware</li>
                  <li>Contract cancellation fees</li>
                  <li>Third-party charges (FNO installation fees)</li>
                  <li>Services used beyond 30 days</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">4.6 Cancellations and Notice Period</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Cancellations must be submitted through your Customer Portal or in writing. The following notice periods apply:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li><strong>Month-to-Month Services:</strong> One full calendar month's notice required</li>
                <li><strong>Contract Services:</strong> Services continue until contract end date unless early termination fees are paid</li>
                <li><strong>Cancellation Processing Fees:</strong> May apply depending on FNO requirements (e.g., Vumatel: R999)</li>
                <li><strong>Clawback Fees:</strong> Apply if canceling within 12 months of activation where installation fees were waived</li>
              </ul>
            </section>

            {/* Section 5: Dispute Resolution */}
            <section id="section-5" className="mb-12 scroll-mt-20">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-6 pb-3 border-b-2 border-circleTel-orange">
                5. Dispute Resolution
              </h2>

              <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">5.1 General Dispute Resolution</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                CircleTel is committed to resolving disputes fairly and efficiently. If you have a complaint or dispute:
              </p>

              <div className="bg-blue-50 rounded-lg p-6 mb-6">
                <h4 className="font-semibold text-blue-900 mb-3">Step 1: Initial Resolution Attempt</h4>
                <p className="text-blue-900 mb-3">Contact our customer support team to attempt resolution in the spirit of cooperation.</p>
                <p className="text-blue-900">
                  <strong>Phone:</strong> 087 087 6305<br />
                  <strong>Email:</strong> support@circletel.co.za
                </p>
              </div>

              <div className="bg-blue-50 rounded-lg p-6 mb-6">
                <h4 className="font-semibold text-blue-900 mb-3">Step 2: Formal Complaint Submission</h4>
                <p className="text-blue-900 mb-3">If the initial attempt is unsuccessful, submit a formal complaint to:</p>
                <p className="text-blue-900 font-semibold">
                  Email: <a href="mailto:complaints@circletel.co.za" className="underline">complaints@circletel.co.za</a>
                </p>
                <p className="text-blue-900 mt-3">Your complaint must include:</p>
                <ul className="list-disc pl-6 space-y-1 text-blue-900 mt-2">
                  <li>Full particulars and contact details</li>
                  <li>Your relationship with CircleTel and customer reference number</li>
                  <li>Statement of reasons with sufficient detail</li>
                  <li>Relevant evidence or documentation</li>
                </ul>
              </div>

              <div className="bg-green-50 rounded-lg p-6 mb-6">
                <h4 className="font-semibold text-green-900 mb-3">Response Timeline (ICASA Regulations)</h4>
                <ul className="space-y-2 text-green-900">
                  <li><strong>Acknowledgment:</strong> Within 3 working days of receiving your complaint</li>
                  <li><strong>Resolution:</strong> Within 14 working days of receiving your complaint</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">5.2 Escalation to ICASA</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you are not satisfied with CircleTel's resolution, you may escalate the matter to the Independent Communications
                Authority of South Africa (ICASA) after allowing the 14-day resolution period.
              </p>

              <div className="bg-orange-50 border-l-4 border-circleTel-orange p-6 mb-6">
                <h4 className="font-semibold text-orange-900 mb-3">ICASA Contact Information</h4>
                <div className="space-y-2 text-orange-900">
                  <p><strong>Telephone:</strong> +27 12 568 3000 / 3001</p>
                  <p><strong>Email:</strong> consumer@icasa.org.za</p>
                  <p><strong>Website:</strong> <a href="https://www.icasa.org.za" target="_blank" rel="noopener noreferrer" className="underline">www.icasa.org.za</a></p>
                  <p><strong>Physical Address:</strong> 350 Witch-Hazel Avenue, Eco Point Office Park, Centurion, 0157</p>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">5.3 Billing Dispute Resolution</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Billing disputes follow a specific procedure to protect both parties:
              </p>

              <div className="space-y-4 mb-6">
                <div className="bg-gray-100 rounded-lg p-4">
                  <h4 className="font-semibold text-circleTel-darkNeutral mb-2">Time Limits</h4>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Billing disputes must be submitted within 60 days of invoice date</li>
                    <li>Disputes must be received 5 business days before Due Date to withhold disputed amount</li>
                  </ul>
                </div>

                <div className="bg-gray-100 rounded-lg p-4">
                  <h4 className="font-semibold text-circleTel-darkNeutral mb-2">Required Information</h4>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Invoice number and date</li>
                    <li>Disputed amount (specific charges)</li>
                    <li>Undisputed amount (must still be paid)</li>
                    <li>Full details of the dispute with supporting evidence</li>
                  </ul>
                </div>

                <div className="bg-gray-100 rounded-lg p-4">
                  <h4 className="font-semibold text-circleTel-darkNeutral mb-2">Service Continuity During Dispute</h4>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>CircleTel will not suspend service during the dispute resolution period</li>
                    <li>No late payment penalties will be imposed during resolution</li>
                    <li>Undisputed amounts must be paid on time</li>
                  </ul>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">5.4 Investigation Fees</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                If an investigation proves the billing was accurate (within 5% tolerance), the following fees apply:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li><strong>Usage Disputes:</strong> R200 investigation fee</li>
                <li><strong>Reconciliation Requests:</strong> R200 administration fee</li>
                <li><strong>Historical Information Requests:</strong> R200 per request</li>
              </ul>
            </section>

            {/* Section 6: Product-Specific Terms */}
            <section id="section-6" className="mb-12 scroll-mt-20">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-6 pb-3 border-b-2 border-circleTel-orange">
                6. Product-Specific Terms
              </h2>

              <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">6.1 Fibre Internet Services</h3>

              <div className="bg-blue-50 rounded-lg p-6 mb-6">
                <h4 className="font-semibold text-blue-900 mb-3">Network Operators</h4>
                <p className="text-blue-900 mb-2">CircleTel provides fibre services over the following FNO networks:</p>
                <ul className="list-disc pl-6 space-y-1 text-blue-900">
                  <li>Vumatel</li>
                  <li>Openserve (Telkom)</li>
                  <li>Dark Fibre Africa (DFA)</li>
                  <li>Frogfoot</li>
                  <li>MetroFibre</li>
                  <li>Link Africa</li>
                  <li>Evotel</li>
                </ul>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-gray-100 rounded-lg p-4">
                  <h4 className="font-semibold text-circleTel-darkNeutral mb-2">Installation</h4>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Installation fees range from R0 to R2,000 depending on FNO and promotions</li>
                    <li>Installation typically takes 5-15 business days from order confirmation</li>
                    <li>Customer must be present during FNO installation</li>
                    <li>Installation includes fibre ONT (Optical Network Terminal) installation by FNO</li>
                  </ul>
                </div>

                <div className="bg-gray-100 rounded-lg p-4">
                  <h4 className="font-semibold text-circleTel-darkNeutral mb-2">Service Level Agreement (SLA)</h4>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li><strong>Uptime Target:</strong> 99.5% monthly uptime (excluding planned maintenance)</li>
                    <li><strong>Fault Response:</strong> 24-48 hours for residential, 4-24 hours for business</li>
                    <li><strong>Planned Maintenance:</strong> Communicated 48 hours in advance</li>
                  </ul>
                </div>

                <div className="bg-gray-100 rounded-lg p-4">
                  <h4 className="font-semibold text-circleTel-darkNeutral mb-2">Router Options</h4>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Optional router purchase: R899 - R2,499 depending on model</li>
                    <li>Use your own router (must support PPPoE configuration)</li>
                    <li>Router warranty: 12 months manufacturer warranty</li>
                  </ul>
                </div>

                <div className="bg-gray-100 rounded-lg p-4">
                  <h4 className="font-semibold text-circleTel-darkNeutral mb-2">Fair Usage Policy (Uncapped Packages)</h4>
                  <p className="text-gray-700 mb-2">Uncapped packages are subject to fair usage limits to ensure network quality for all users:</p>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li><strong>Uncapped Packages:</strong> 1TB - 2TB monthly threshold (speed-based)</li>
                    <li><strong>After Threshold:</strong> Speeds may be reduced during peak hours (18:00-23:00)</li>
                    <li><strong>Off-Peak:</strong> Full speeds maintained 23:00-18:00</li>
                    <li><strong>Commercial Use:</strong> Hosting servers, reselling prohibited on residential packages</li>
                  </ul>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">6.2 Fixed Wireless (5G/LTE) Services</h3>

              <div className="space-y-4 mb-6">
                <div className="bg-gray-100 rounded-lg p-4">
                  <h4 className="font-semibold text-circleTel-darkNeutral mb-2">Installation Options</h4>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li><strong>Self-Installation:</strong> Free - DIY kit with router and SIM card</li>
                    <li><strong>Professional Installation:</strong> R750 - Includes site survey, antenna installation, and configuration</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-500">
                  <h4 className="font-semibold text-yellow-900 mb-2">Coverage and Performance</h4>
                  <p className="text-yellow-900 mb-2">Wireless service performance depends on:</p>
                  <ul className="list-disc pl-6 space-y-1 text-yellow-900">
                    <li>Signal strength and tower distance</li>
                    <li>Building materials and obstacles</li>
                    <li>Network congestion during peak times</li>
                    <li>Weather conditions</li>
                  </ul>
                  <p className="text-yellow-900 mt-2">
                    <strong>Note:</strong> Speeds are "up to" advertised speeds and may vary based on coverage conditions.
                  </p>
                </div>

                <div className="bg-gray-100 rounded-lg p-4">
                  <h4 className="font-semibold text-circleTel-darkNeutral mb-2">CGNAT (Carrier-Grade NAT)</h4>
                  <p className="text-gray-700 mb-2">
                    Wireless services use CGNAT due to IPv4 address limitations. This may affect:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Hosting services (web servers, mail servers)</li>
                    <li>Remote access applications</li>
                    <li>CCTV and DVR remote viewing</li>
                    <li>VPN configurations</li>
                    <li>Gaming server hosting</li>
                  </ul>
                  <p className="text-gray-700 mt-2">
                    <strong>Static IP Option:</strong> Available on business packages for additional R350/month
                  </p>
                </div>

                <div className="bg-gray-100 rounded-lg p-4">
                  <h4 className="font-semibold text-circleTel-darkNeutral mb-2">RICA Compliance</h4>
                  <p className="text-gray-700 mb-2">
                    All wireless services must be RICA registered as required by South African law. Required documents:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Copy of South African ID or passport</li>
                    <li>Proof of residence (not older than 3 months)</li>
                    <li>Service will be activated only after successful RICA registration</li>
                  </ul>
                </div>
              </div>

              <h4 className="text-lg font-semibold text-circleTel-darkNeutral mt-8 mb-4 bg-orange-50 p-4 rounded-lg border-l-4 border-circleTel-orange">
                6.2.5 MTN Network Services - Specific Terms
              </h4>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-6">
                <p className="text-blue-900 font-semibold mb-3">
                  CircleTel provides 5G and LTE wireless services as an authorized service provider using MTN South Africa's mobile network infrastructure.
                </p>
                <p className="text-blue-900">
                  By subscribing to CircleTel's wireless services, you acknowledge and agree to the following MTN-specific terms and conditions:
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-gray-100 rounded-lg p-4">
                  <h5 className="font-semibold text-circleTel-darkNeutral mb-2">MTN Network Infrastructure</h5>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li><strong>Network Provider:</strong> MTN South Africa (Pty) Ltd operates the underlying mobile network infrastructure</li>
                    <li><strong>Service Relationship:</strong> CircleTel is an independent service provider; MTN is not responsible for CircleTel's billing, customer service, or contractual obligations</li>
                    <li><strong>Network Access:</strong> Subject to MTN's network availability and coverage maps</li>
                    <li><strong>Technology Standards:</strong> Services provided over MTN's 4G LTE, LTE-Advanced, and 5G networks</li>
                  </ul>
                </div>

                <div className="bg-gray-100 rounded-lg p-4">
                  <h5 className="font-semibold text-circleTel-darkNeutral mb-2">Coverage and Network Performance</h5>
                  <p className="text-gray-700 mb-2">
                    Service availability and performance depend on MTN's network coverage:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li><strong>Coverage Maps:</strong> Indicative only; actual coverage may vary based on location, terrain, and environmental factors</li>
                    <li><strong>5G Coverage:</strong> Limited to specific metropolitan and urban areas as deployed by MTN</li>
                    <li><strong>LTE Coverage:</strong> Nationwide coverage with varying speeds (4G, 4G+, LTE-Advanced)</li>
                    <li><strong>Signal Quality:</strong> Affected by building materials, weather conditions, network congestion, and distance from towers</li>
                    <li><strong>Speed Variations:</strong> Advertised speeds are maximum theoretical speeds; actual speeds vary based on network conditions</li>
                  </ul>
                </div>

                <div className="bg-orange-50 rounded-lg p-4 border-l-4 border-circleTel-orange">
                  <h5 className="font-semibold text-orange-900 mb-2">MTN Fair Usage Policy</h5>
                  <p className="text-orange-900 mb-2">
                    CircleTel's wireless services are subject to MTN's network management policies:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-orange-900">
                    <li><strong>Network Management:</strong> MTN may implement traffic management during peak times to ensure network quality for all users</li>
                    <li><strong>Priority Traffic:</strong> Emergency services and critical communications receive priority access</li>
                    <li><strong>Throttling:</strong> Excessive usage or bandwidth-intensive applications (torrenting, constant streaming) may be throttled during peak hours</li>
                    <li><strong>Peak Hours:</strong> Typically 18:00-23:00 weekdays; network congestion may affect speeds</li>
                  </ul>
                </div>

                <div className="bg-gray-100 rounded-lg p-4">
                  <h5 className="font-semibold text-circleTel-darkNeutral mb-2">MTN Network Maintenance and Upgrades</h5>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li><strong>Scheduled Maintenance:</strong> MTN performs regular network maintenance which may cause temporary service interruptions</li>
                    <li><strong>Notice Period:</strong> CircleTel will communicate planned MTN maintenance where possible, typically 48-72 hours advance notice</li>
                    <li><strong>Network Upgrades:</strong> MTN continuously upgrades its network; service may be temporarily unavailable during tower upgrades</li>
                    <li><strong>Emergency Maintenance:</strong> Unplanned maintenance for network faults may occur without prior notice</li>
                  </ul>
                </div>

                <div className="bg-gray-100 rounded-lg p-4">
                  <h5 className="font-semibold text-circleTel-darkNeutral mb-2">MTN Acceptable Use Policy Compliance</h5>
                  <p className="text-gray-700 mb-2">
                    In addition to CircleTel's AUP (Section 3), you must comply with MTN's network usage policies:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li><strong>Prohibited Uses:</strong> Network scanning, port scanning, or any activity that compromises MTN's network security</li>
                    <li><strong>Commercial Reselling:</strong> Residential packages cannot be used for commercial resale of bandwidth</li>
                    <li><strong>SIM Sharing:</strong> SIM cards must not be used in multiple devices simultaneously (excluding mobile hotspot feature)</li>
                    <li><strong>Unauthorized Tethering:</strong> Tethering restrictions apply to certain package types as specified</li>
                  </ul>
                </div>

                <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
                  <h5 className="font-semibold text-red-900 mb-2">Service Limitations</h5>
                  <ul className="list-disc pl-6 space-y-1 text-red-900">
                    <li><strong>No Guaranteed Speeds:</strong> All speed specifications are "up to" maximum speeds; actual speeds depend on MTN network conditions</li>
                    <li><strong>Coverage Gaps:</strong> Service may be unavailable in underground areas, rural areas, or areas with limited MTN coverage</li>
                    <li><strong>Load Shedding Impact:</strong> MTN towers have limited battery backup (2-4 hours); extended power outages may affect service</li>
                    <li><strong>International Roaming:</strong> Not included; requires separate activation and incurs additional charges</li>
                    <li><strong>VPN Restrictions:</strong> Some VPN protocols may be blocked or throttled by MTN for network security</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-500">
                  <h5 className="font-semibold text-yellow-900 mb-2">MTN Network Changes and Migration</h5>
                  <p className="text-yellow-900 mb-2">
                    MTN reserves the right to:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-yellow-900">
                    <li><strong>Technology Sunset:</strong> Discontinue older technologies (e.g., 3G shutdown) with advance notice</li>
                    <li><strong>Frequency Refarming:</strong> Reallocate network frequencies for improved services</li>
                    <li><strong>Coverage Changes:</strong> Modify coverage areas based on network optimization</li>
                    <li><strong>Migration Requirements:</strong> Customers may be required to upgrade equipment for continued service</li>
                  </ul>
                  <p className="text-yellow-900 mt-2">
                    <strong>Note:</strong> CircleTel will provide at least 90 days' notice for any mandatory technology migrations.
                  </p>
                </div>

                <div className="bg-gray-100 rounded-lg p-4">
                  <h5 className="font-semibold text-circleTel-darkNeutral mb-2">RICA and MTN SIM Compliance</h5>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li><strong>RICA Registration:</strong> Mandatory for all MTN SIM cards as per South African law</li>
                    <li><strong>MTN SIM Ownership:</strong> SIM cards remain property of MTN South Africa</li>
                    <li><strong>SIM Replacement:</strong> Lost or damaged SIMs: R150 replacement fee + RICA re-registration required</li>
                    <li><strong>SIM Deactivation:</strong> Unused SIMs may be deactivated by MTN after 6 months of inactivity</li>
                    <li><strong>Fraudulent Registration:</strong> Providing false information during RICA registration may result in criminal charges and immediate service termination</li>
                  </ul>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                  <h5 className="font-semibold text-blue-900 mb-2">Data Usage and Billing on MTN Network</h5>
                  <ul className="list-disc pl-6 space-y-1 text-blue-900">
                    <li><strong>Usage Measurement:</strong> Data usage measured by MTN's billing systems; CircleTel relies on MTN data for billing accuracy</li>
                    <li><strong>Rounding:</strong> Data sessions rounded up to nearest megabyte</li>
                    <li><strong>Background Data:</strong> Device updates, app syncing, and background processes consume data and are billable</li>
                    <li><strong>Usage Disputes:</strong> Refer to MTN usage logs; CircleTel cannot override MTN's usage measurements</li>
                    <li><strong>Zero-Rating:</strong> No zero-rated services unless explicitly stated in package description</li>
                  </ul>
                </div>

                <div className="bg-gray-100 rounded-lg p-4">
                  <h5 className="font-semibold text-circleTel-darkNeutral mb-2">Customer Responsibilities</h5>
                  <p className="text-gray-700 mb-2">
                    When using CircleTel services over MTN's network, you agree to:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Use services in compliance with both CircleTel and MTN policies</li>
                    <li>Not attempt to bypass MTN's network security measures</li>
                    <li>Report any SIM card loss or theft immediately to prevent unauthorized use</li>
                    <li>Maintain compatible equipment (LTE/5G capable devices)</li>
                    <li>Accept that CircleTel cannot control MTN's network performance or availability</li>
                    <li>Understand that MTN network outages are beyond CircleTel's control and do not constitute grounds for refund</li>
                  </ul>
                </div>

                <div className="bg-orange-50 rounded-lg p-4 border-l-4 border-circleTel-orange">
                  <h5 className="font-semibold text-orange-900 mb-2">Limitation of Liability - MTN Network</h5>
                  <p className="text-orange-900 mb-2">
                    CircleTel is not liable for:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-orange-900">
                    <li>MTN network outages, coverage gaps, or performance issues</li>
                    <li>MTN network congestion or throttling</li>
                    <li>MTN technology changes, upgrades, or migrations</li>
                    <li>MTN's enforcement of its acceptable use policies</li>
                    <li>MTN SIM card deactivation or replacement requirements</li>
                    <li>Data usage discrepancies arising from MTN's measurement systems</li>
                  </ul>
                  <p className="text-orange-900 mt-2">
                    <strong>Your remedy for MTN-related issues is limited to service credit as outlined in Section 7 (Liability and Indemnity).</strong>
                  </p>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">6.3 VoIP Telephony Services</h3>

              <div className="space-y-4 mb-6">
                <div className="bg-gray-100 rounded-lg p-4">
                  <h4 className="font-semibold text-circleTel-darkNeutral mb-2">Service Features</h4>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Geographic and non-geographic number options</li>
                    <li>Call forwarding, voicemail, call waiting</li>
                    <li>Call recording (business packages)</li>
                    <li>Multi-channel support (business packages)</li>
                    <li>Mobile and desktop applications</li>
                  </ul>
                </div>

                <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
                  <h4 className="font-semibold text-red-900 mb-2">Emergency Services Limitation</h4>
                  <p className="text-red-900">
                    <strong>Important:</strong> VoIP services may not support emergency calling (10111, 10177, etc.) in the event of power
                    or Internet outages. Maintain alternative communication methods for emergencies.
                  </p>
                </div>

                <div className="bg-gray-100 rounded-lg p-4">
                  <h4 className="font-semibold text-circleTel-darkNeutral mb-2">Number Portability</h4>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Port existing landline numbers to CircleTel VoIP</li>
                    <li>Porting takes 7-15 business days</li>
                    <li>R150 porting fee applies</li>
                    <li>Temporary number provided during porting period</li>
                  </ul>
                </div>

                <div className="bg-gray-100 rounded-lg p-4">
                  <h4 className="font-semibold text-circleTel-darkNeutral mb-2">RICA Compliance</h4>
                  <p className="text-gray-700">
                    VoIP services must be RICA registered. Registration completed during account setup using your provided identification documents.
                  </p>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">6.4 Business Services</h3>

              <div className="space-y-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Enhanced Support</h4>
                  <ul className="list-disc pl-6 space-y-1 text-blue-900">
                    <li>Dedicated account manager</li>
                    <li>Priority fault resolution (4-hour response time)</li>
                    <li>24/7 technical support</li>
                    <li>Proactive network monitoring</li>
                  </ul>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Business SLA</h4>
                  <ul className="list-disc pl-6 space-y-1 text-blue-900">
                    <li><strong>Uptime Target:</strong> 99.9% monthly uptime</li>
                    <li><strong>Fault Response:</strong> 4 hours acknowledgment, 24 hours resolution target</li>
                    <li><strong>SLA Credits:</strong> Available for extended outages (pro-rata credit based on downtime)</li>
                  </ul>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Static IP Addresses</h4>
                  <p className="text-blue-900 mb-2">Available on business packages:</p>
                  <ul className="list-disc pl-6 space-y-1 text-blue-900">
                    <li>Single static IP: R350/month</li>
                    <li>Multiple static IPs: Custom pricing</li>
                    <li>Required for hosting services, VPNs, remote access</li>
                  </ul>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">6.5 Cloud Services</h3>

              <div className="space-y-4 mb-6">
                <div className="bg-gray-100 rounded-lg p-4">
                  <h4 className="font-semibold text-circleTel-darkNeutral mb-2">Cloud Hosting</h4>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Virtual servers (VPS) with scalable resources</li>
                    <li>Dedicated servers for high-performance needs</li>
                    <li>Managed hosting with automatic updates and backups</li>
                    <li>99.9% uptime SLA on dedicated and VPS hosting</li>
                  </ul>
                </div>

                <div className="bg-gray-100 rounded-lg p-4">
                  <h4 className="font-semibold text-circleTel-darkNeutral mb-2">Backup and Recovery</h4>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Daily automated backups (retained for 7-30 days based on package)</li>
                    <li>Off-site backup storage</li>
                    <li>Disaster recovery planning available</li>
                    <li>Self-service restore from backup portal</li>
                  </ul>
                </div>

                <div className="bg-gray-100 rounded-lg p-4">
                  <h4 className="font-semibold text-circleTel-darkNeutral mb-2">Cloud Migration Services</h4>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Assessment and planning phase (free consultation)</li>
                    <li>Data migration with minimal downtime</li>
                    <li>Application reconfiguration and testing</li>
                    <li>Post-migration support (30 days included)</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 7: Liability and Indemnity */}
            <section id="section-7" className="mb-12 scroll-mt-20">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-6 pb-3 border-b-2 border-circleTel-orange">
                7. Liability and Indemnity
              </h2>

              <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">7.1 Limitation of Liability</h3>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 mb-6">
                <p className="text-yellow-900 mb-3">
                  <strong>CircleTel's entire liability</strong> for any claim arising out of or in connection with this Agreement is limited
                  to the amount paid by you for the services in the month in which the claim arose.
                </p>
                <p className="text-yellow-900">
                  This limitation applies to all causes of action in aggregate, including breach of contract, breach of warranty, negligence,
                  strict liability, misrepresentation, and other torts.
                </p>
              </div>

              <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">7.2 Exclusions from Liability</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                CircleTel shall not be liable for:
              </p>

              <div className="space-y-3 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-circleTel-darkNeutral mb-2">Service Interruptions</h4>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Access delays or interruptions to services</li>
                    <li>Data non-delivery, mis-delivery, corruption, or loss</li>
                    <li>Network congestion or third-party network issues</li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-circleTel-darkNeutral mb-2">Force Majeure Events</h4>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Acts of God (floods, earthquakes, storms)</li>
                    <li>Utility interruptions (power outages, Eskom load shedding)</li>
                    <li>Equipment failure due to external factors</li>
                    <li>Labor strikes, riots, civil unrest</li>
                    <li>Government actions or regulatory changes</li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-circleTel-darkNeutral mb-2">Customer Responsibilities</h4>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Unauthorized use of your account credentials</li>
                    <li>Customer equipment failure or misconfiguration</li>
                    <li>Viruses or malware on customer devices</li>
                    <li>Loss of data due to customer actions</li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-circleTel-darkNeutral mb-2">Third-Party Services</h4>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>FNO (Fibre Network Operator) installation delays or faults</li>
                    <li>Third-party equipment failures</li>
                    <li>Content or services accessed through CircleTel network</li>
                  </ul>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">7.3 Service Provision "As Is"</h3>
              <div className="bg-orange-50 border-l-4 border-circleTel-orange p-6 mb-6">
                <p className="text-orange-900 mb-3">
                  Services are provided <strong>"as is, as available"</strong> without warranties of any kind, either express or implied, including but not limited to:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-orange-900">
                  <li>Warranties of merchantability</li>
                  <li>Fitness for a particular purpose</li>
                  <li>Non-infringement</li>
                  <li>Uninterrupted or error-free operation</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">7.4 Customer Indemnity</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You agree to indemnify and hold CircleTel harmless from any claims, damages, losses, liabilities, and expenses
                (including attorney fees) arising from:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>Your use or misuse of CircleTel services</li>
                <li>Your violation of this Agreement or any applicable laws</li>
                <li>Your violation of any third-party rights, including intellectual property rights</li>
                <li>Content you upload, transmit, or make available through CircleTel services</li>
                <li>Actions of anyone using your account with or without your authorization</li>
              </ul>

              <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">7.5 Password Security</h3>
              <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-6">
                <p className="text-red-900 mb-3">
                  <strong>You are responsible</strong> for maintaining the confidentiality of your account password and for all activities
                  that occur under your account.
                </p>
                <p className="text-red-900 mb-3">
                  CircleTel will not change passwords without proof of identification. In partnership disputes, CircleTel remains neutral
                  and may suspend account access until the dispute is resolved.
                </p>
                <p className="text-red-900">
                  <strong>You agree to:</strong>
                </p>
                <ul className="list-disc pl-6 space-y-1 text-red-900 mt-2">
                  <li>Immediately notify CircleTel of any unauthorized use of your account</li>
                  <li>Ensure your password meets security requirements (minimum 8 characters, mixed case, numbers)</li>
                  <li>Not share your password with any third party</li>
                  <li>Change your password regularly (recommended every 90 days)</li>
                </ul>
              </div>
            </section>

            {/* Section 8: Termination and Suspension */}
            <section id="section-8" className="mb-12 scroll-mt-20">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-6 pb-3 border-b-2 border-circleTel-orange">
                8. Termination and Suspension
              </h2>

              <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">8.1 Termination by Customer</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You may terminate this Agreement at any time by:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>Submitting a cancellation request through your Customer Portal, or</li>
                <li>Sending written notice to support@circletel.co.za</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Notice Period:</strong> One full calendar month's notice is required for month-to-month services.
                Contract services continue until the end of the contract term unless early termination fees are paid.
              </p>

              <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">8.2 Termination by CircleTel</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                CircleTel may terminate or suspend your services immediately if you:
              </p>

              <div className="space-y-3 mb-6">
                <div className="bg-red-50 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 mb-2">Payment-Related Termination</h4>
                  <ul className="list-disc pl-6 space-y-1 text-red-900">
                    <li>Fail to pay any amount due within 10 days of written demand</li>
                    <li>Have two or more consecutive failed payments</li>
                    <li>Refuse to update payment information after failed payment</li>
                  </ul>
                </div>

                <div className="bg-red-50 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 mb-2">Breach of Agreement</h4>
                  <ul className="list-disc pl-6 space-y-1 text-red-900">
                    <li>Violate any provision of this Agreement and fail to remedy within 30 days of notice</li>
                    <li>Commit serious violations of the Acceptable Use Policy</li>
                    <li>Engage in fraudulent or illegal activities</li>
                  </ul>
                </div>

                <div className="bg-red-50 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 mb-2">Insolvency Events</h4>
                  <ul className="list-disc pl-6 space-y-1 text-red-900">
                    <li>Are placed under liquidation, judicial management, or business rescue</li>
                    <li>Commit any act of insolvency</li>
                    <li>Compromise or attempt to compromise with creditors</li>
                    <li>Have an unsatisfied judgment against you for 30 days after granting</li>
                  </ul>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">8.3 Effect of Termination</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Upon termination of this Agreement:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>All outstanding amounts become immediately due and payable</li>
                <li>Your access to services will be discontinued</li>
                <li>CircleTel may delete your data after 30 days (backup your data before termination)</li>
                <li>Email addresses and accounts will be deactivated</li>
                <li>Refunds (if applicable) will be processed according to Section 4.5</li>
                <li>You remain liable for any charges incurred before termination</li>
              </ul>

              <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">8.4 Service Suspension</h3>
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 mb-6">
                <p className="text-yellow-900 mb-3">
                  <strong>CircleTel may suspend</strong> (rather than terminate) your services for:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-yellow-900">
                  <li>Non-payment pending resolution (after Due Date)</li>
                  <li>Investigation of Acceptable Use Policy violations</li>
                  <li>Security concerns or suspected account compromise</li>
                  <li>Maintenance or network upgrades (with advance notice when possible)</li>
                </ul>
                <p className="text-yellow-900 mt-4">
                  <strong>Reconnection Fee:</strong> R250 applies if service is suspended due to non-payment and requires reactivation.
                </p>
              </div>

              <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">8.5 Data Retention After Termination</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                After service termination:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li><strong>30-Day Grace Period:</strong> Your data is retained for 30 days to allow for reactivation or data export</li>
                <li><strong>Data Export:</strong> You may request a data export within the 30-day period (R500 administrative fee)</li>
                <li><strong>Permanent Deletion:</strong> After 30 days, all data is permanently deleted and cannot be recovered</li>
                <li><strong>Legal Retention:</strong> Some data may be retained for legal/regulatory compliance (e.g., invoices, RICA records)</li>
              </ul>
            </section>

            {/* Section 9: General Provisions */}
            <section id="section-9" className="mb-12 scroll-mt-20">
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-6 pb-3 border-b-2 border-circleTel-orange">
                9. General Provisions
              </h2>

              <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">9.1 Entire Agreement</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                This Agreement constitutes the entire agreement between you and CircleTel regarding the use of our services and supersedes
                all prior agreements, whether written or oral, relating to the same subject matter.
              </p>

              <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">9.2 Amendment of Terms</h3>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-6">
                <p className="text-blue-900 mb-3">
                  CircleTel may amend this Agreement from time to time. We will:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-blue-900">
                  <li>Provide 30 days' notice of material changes by posting the updated terms on our website</li>
                  <li>Send email notification to your registered email address for significant changes</li>
                  <li>Update the "Last Updated" date at the top of this document</li>
                </ul>
                <p className="text-blue-900 mt-4">
                  <strong>Your continued use</strong> of CircleTel services after the notice period constitutes acceptance of the amended terms.
                  If you do not agree with the amendments, you may terminate this Agreement in accordance with Section 8.1.
                </p>
              </div>

              <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">9.3 Governing Law and Jurisdiction</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                This Agreement is governed by the laws of the Republic of South Africa. You consent to the exclusive jurisdiction of the
                South African courts for any disputes arising out of or relating to this Agreement.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                For legal purposes, this Agreement is deemed to have been entered into in Johannesburg, South Africa.
              </p>

              <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">9.4 Notices</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                All notices under this Agreement must be in writing and delivered via:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>Personal delivery</li>
                <li>Email to your registered email address</li>
                <li>Registered mail to your registered physical address</li>
              </ul>

              <p className="text-gray-700 leading-relaxed mb-4">
                Notices are deemed received:
              </p>
              <div className="bg-gray-100 rounded-lg p-4 mb-6">
                <ul className="space-y-2 text-gray-700">
                  <li><strong>Personal Delivery:</strong> On the date of delivery</li>
                  <li><strong>Email (sent before 16:00):</strong> Same business day</li>
                  <li><strong>Email (sent after 16:00 or on non-business day):</strong> Next business day</li>
                  <li><strong>Registered Mail:</strong> 5th business day after posting</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">9.5 Non-Transferability</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Your rights and privileges under this Agreement cannot be sold, assigned, or transferred to any third party without
                CircleTel's prior written consent. CircleTel may assign this Agreement to any successor or affiliate without your consent.
              </p>

              <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">9.6 Severability</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                If any provision of this Agreement is found to be invalid, illegal, or unenforceable, the remaining provisions shall
                continue in full force and effect. The invalid provision shall be replaced with a valid provision that most closely
                approximates the intent and economic effect of the invalid provision.
              </p>

              <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">9.7 Waiver</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                No waiver of any term or condition of this Agreement shall be deemed a further or continuing waiver of such term or
                condition or any other term or condition. CircleTel's failure to assert any right or provision under this Agreement
                shall not constitute a waiver of such right or provision.
              </p>

              <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">9.8 Use of Customer Information</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                CircleTel may:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>Include your name and contact information in service directories for administrative purposes</li>
                <li>Use anonymized usage data for service improvement and network optimization</li>
                <li>Share information as required by law or regulatory authorities</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                CircleTel will <strong>not</strong> print your name, trademarks, or logos in advertising or promotional materials
                without your explicit written consent.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                For detailed information on how we collect, use, and protect your personal information, please refer to our
                <Link href="/privacy-policy" className="text-circleTel-orange hover:underline"> Privacy Policy</Link>.
              </p>

              <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">9.9 Protection of Personal Information</h3>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-6">
                <p className="text-blue-900 mb-3">
                  CircleTel complies with the Protection of Personal Information Act (POPIA), 2013. We are committed to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-blue-900">
                  <li>Protecting your personal information from unauthorized access, use, or disclosure</li>
                  <li>Processing your information only for lawful purposes related to service provision</li>
                  <li>Maintaining the accuracy and completeness of your information</li>
                  <li>Retaining your information only as long as necessary for business or legal purposes</li>
                  <li>Allowing you to access, correct, or delete your personal information</li>
                </ul>
                <p className="text-blue-900 mt-4">
                  For POPIA-related inquiries or to exercise your rights, contact: <strong>privacy@circletel.co.za</strong>
                </p>
              </div>

              <h3 className="text-xl font-semibold text-circleTel-darkNeutral mt-6 mb-4">9.10 Electronic Communications and Transactions</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                This Agreement complies with the Electronic Communications and Transactions Act (ECTA), 2002. By using CircleTel services, you:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>Consent to receiving communications from CircleTel via electronic means (email, SMS, in-app notifications)</li>
                <li>Agree that electronic signatures and records have the same legal effect as physical signatures and paper records</li>
                <li>Acknowledge that you have the necessary hardware, software, and Internet access to receive electronic communications</li>
              </ul>
            </section>

            {/* Contact Information Footer */}
            <div className="bg-gradient-to-r from-circleTel-orange to-orange-600 text-white rounded-lg p-8 mt-12">
              <h3 className="text-2xl font-bold mb-6">Contact CircleTel</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">General Inquiries</h4>
                  <p className="mb-2">Phone: 087 087 6305</p>
                  <p className="mb-2">Email: contactus@circletel.co.za</p>
                  <p className="mb-2">Support: support@circletel.co.za</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Specialized Contacts</h4>
                  <p className="mb-2">Abuse Reports: abuse@circletel.co.za</p>
                  <p className="mb-2">Complaints: complaints@circletel.co.za</p>
                  <p className="mb-2">Privacy: privacy@circletel.co.za</p>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-white border-opacity-30">
                <p className="text-sm opacity-90">
                  <strong>CircleTel (Pty) Ltd</strong><br />
                  West House, 7 Autumn Road, Rivonia, Johannesburg, 2128<br />
                  Website: <a href="https://www.circletel.co.za" className="underline hover:text-gray-200">www.circletel.co.za</a>
                </p>
              </div>
            </div>

            {/* Document Information */}
            <div className="bg-gray-100 rounded-lg p-6 mt-8 text-sm text-gray-600">
              <p className="mb-2">
                <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-ZA', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <p className="mb-2">
                <strong>Document Version:</strong> 1.0
              </p>
              <p>
                <strong>Questions?</strong> If you have any questions about these Terms and Conditions, please contact us at
                <a href="mailto:legal@circletel.co.za" className="text-circleTel-orange hover:underline ml-1">legal@circletel.co.za</a>
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      <div className="fixed bottom-8 right-8">
        <a
          href="#"
          className="bg-circleTel-orange text-white rounded-full p-4 shadow-lg hover:bg-orange-600 transition-colors duration-300 flex items-center justify-center"
          aria-label="Back to top"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </a>
      </div>
    </div>
  );
}
