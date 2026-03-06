import { ContentPageData } from '@/lib/content/types';
import {
  PiHandshakeBold,
  PiBookOpenBold,
  PiShieldCheckBold,
  PiCreditCardBold,
  PiScalesBold,
  PiPackageBold,
  PiWarningBold,
  PiSignOutBold,
  PiFileTextBold,
  PiClockBold,
  PiCheckCircleBold,
} from 'react-icons/pi';

export const termsOfServiceData: ContentPageData = {
  meta: {
    title: 'Terms of Service',
    pageTitle: 'Terms of Service | CircleTel',
    description:
      'CircleTel Terms of Service — General Terms, Acceptable Use Policy, Billing Terms, and Dispute Resolution for all services.',
    lastUpdated: 'March 2026',
    canonicalPath: '/terms-of-service',
  },
  intro: {
    description:
      'Please read these terms carefully before using CircleTel services. By accessing our services, you agree to these Terms of Service.',
  },
  keyPoints: [
    {
      icon: PiClockBold,
      title: '30-day cancellation',
      description: 'Cancel anytime with notice',
    },
    {
      icon: PiCheckCircleBold,
      title: 'No lock-in contracts',
      description: 'Month-to-month billing',
    },
    {
      icon: PiShieldCheckBold,
      title: 'Consumer Protection Act',
      description: 'CPA compliant',
    },
  ],
  sections: [
    {
      id: 'general-terms',
      title: '1. General Terms and Conditions',
      icon: PiHandshakeBold,
      content: (
        <>
          <h3>1.1 Agreement Scope</h3>
          <p>
            This is an agreement between you (&quot;Customer&quot;, &quot;you&quot;, &quot;your&quot;) and CircleTel (Pty) Ltd
            (&quot;CircleTel&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;) regarding your use of CircleTel&apos;s
            telecommunications products, services, connectivity solutions, and IT management services.
          </p>

          <h3>1.2 Agreement Applicability</h3>
          <p>
            This Agreement applies to all accounts, sub-accounts, and alternative account names associated with your
            principal account. The Account Holder is responsible for the use of each account.
          </p>

          <h3>1.3 Consumer Protection Act Compliance</h3>
          <p>
            In circumstances where the Consumer Protection Act, 2008 (&quot;the CPA&quot;) applies to this Agreement, the
            provisions of the CPA shall prevail in the event of a conflict between any provision of this Agreement and
            the provisions of the CPA.
          </p>

          <h3>1.4 Service Provision</h3>
          <p>CircleTel provides telecommunications services including but not limited to:</p>
          <ul>
            <li>Fibre Internet Connectivity</li>
            <li>Fixed Wireless (5G/LTE) Internet</li>
            <li>VoIP Telephony Services</li>
            <li>Cloud Hosting and Migration Services</li>
            <li>Managed IT Services</li>
            <li>Business Connectivity Solutions</li>
          </ul>
        </>
      ),
    },
    {
      id: 'definitions',
      title: '2. Definitions and Interpretation',
      icon: PiBookOpenBold,
      content: (
        <>
          <dl className="space-y-4">
            <div>
              <dt className="font-semibold text-circleTel-navy">Account Holder</dt>
              <dd className="text-gray-700 ml-4">
                The person or entity who has registered for CircleTel services and is responsible for all usage and
                payments.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-circleTel-navy">Services</dt>
              <dd className="text-gray-700 ml-4">
                All telecommunications, connectivity, hosting, and IT management services provided by CircleTel.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-circleTel-navy">FNO (Fibre Network Operator)</dt>
              <dd className="text-gray-700 ml-4">
                Third-party infrastructure providers such as Vumatel, Openserve, DFA, Frogfoot, and MetroFibre who own
                and operate fibre networks.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-circleTel-navy">Due Date</dt>
              <dd className="text-gray-700 ml-4">
                The date by which payment for services is due as specified on your invoice.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-circleTel-navy">CGNAT (Carrier-Grade NAT)</dt>
              <dd className="text-gray-700 ml-4">
                A network address translation mechanism used to manage IPv4 address limitations.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-circleTel-navy">RICA</dt>
              <dd className="text-gray-700 ml-4">
                Regulation of Interception of Communications and Provision of Communication-Related Information Act,
                governing the registration of telecommunications services.
              </dd>
            </div>
          </dl>
        </>
      ),
    },
    {
      id: 'acceptable-use',
      title: '3. Acceptable Use Policy (AUP)',
      icon: PiShieldCheckBold,
      content: (
        <>
          <h3>3.1 General Acceptable Use</h3>
          <p>
            You are expected to use the Internet and other networks and services accessed through CircleTel services
            with respect, courtesy, and responsibility, giving due regard to the rights of other Internet users.
          </p>

          <h3>3.2 Prohibited Activities</h3>
          <p>
            The following activities are strictly prohibited and may result in immediate service suspension or
            termination:
          </p>

          <h4 className="font-semibold text-red-900 mt-4">Illegal Activities</h4>
          <ul>
            <li>Unauthorized distribution of copyrighted material</li>
            <li>Harassment, fraud, or impersonation</li>
            <li>Distribution of obscene or illegal content</li>
            <li>Child sexual abuse imagery (CSAM)</li>
            <li>Illegal drug trafficking or related activities</li>
            <li>Pirated software, hacker programs, or warez distribution</li>
          </ul>

          <h4 className="font-semibold text-orange-900 mt-4">Network Security Violations</h4>
          <ul>
            <li>Unauthorized access, use, probing, or scanning of security measures</li>
            <li>Mail bombing, flooding, or broadcast attacks</li>
            <li>Forging TCP-IP packet headers or email headers</li>
            <li>Excessive CPU time or storage space consumption</li>
            <li>Denial of Service (DoS) attacks</li>
          </ul>

          <h4 className="font-semibold text-yellow-900 mt-4">Spam and Unsolicited Communications</h4>
          <ul>
            <li>Sending unsolicited commercial email (spam)</li>
            <li>Using third-party mail servers to relay mail without permission</li>
            <li>Off-topic posts to newsgroups, forums, or mailing lists</li>
            <li>Mass emailing that provokes complaints</li>
            <li>Falsifying user information in emails</li>
          </ul>

          <h3>3.3 Enforcement and Penalties</h3>
          <p>CircleTel takes violations of this Acceptable Use Policy seriously. Upon receiving notice of an alleged violation:</p>

          <h4 className="font-semibold mt-4">Investigation Process</h4>
          <ol>
            <li>CircleTel will investigate alleged violations within 24-48 hours</li>
            <li>Services may be restricted or suspended during the investigation</li>
            <li>Customer will be notified of the investigation and findings</li>
            <li>Evidence and documentation will be collected and preserved</li>
          </ol>

          <h4 className="font-semibold mt-4">Violation Penalties</h4>
          <ul>
            <li>
              <strong>First Violation:</strong> R2,000 cleanup fee + account review for potential termination
            </li>
            <li>
              <strong>Second Violation:</strong> R5,000 cleanup fee + immediate service termination
            </li>
            <li>
              <strong>Investigation Fees:</strong> Up to R2,000 per hour for violation investigation
            </li>
            <li>
              <strong>Legal Costs:</strong> Customer liable for all attorney fees and legal expenses
            </li>
          </ul>

          <h3>3.4 Abuse Reporting</h3>
          <p>To report violations of this Acceptable Use Policy, please contact:</p>
          <p>
            <strong>Email:</strong> abuse@circletel.co.za
          </p>
          <p>Please include all relevant details, evidence, and timestamps in your report.</p>
        </>
      ),
    },
    {
      id: 'billing',
      title: '4. Billing Terms',
      icon: PiCreditCardBold,
      content: (
        <>
          <h3>4.1 General Billing</h3>
          <p>
            CircleTel provides itemized bills/invoices in your Customer Portal. All accounts are due on the invoice
            presentation date (&quot;Due Date&quot;). Payment must be received by the Due Date to avoid service interruption.
          </p>

          <h3>4.2 Payment Methods</h3>
          <p>CircleTel accepts the following payment methods:</p>
          <ul>
            <li>
              <strong>Card Payments:</strong> Visa, Mastercard, American Express, Diners Club via NetCash Pay Now (3D
              Secure)
            </li>
            <li>
              <strong>Debit Order:</strong> Automatic monthly deduction from your bank account
            </li>
            <li>
              <strong>Instant EFT:</strong> Real-time bank payments via Ozow
            </li>
            <li>
              <strong>Manual EFT:</strong> Traditional online banking transfers (proof of payment required)
            </li>
            <li>
              <strong>Cash Options:</strong> 1Voucher, paymyway, SCode at retail outlets
            </li>
            <li>
              <strong>Buy Now Pay Later:</strong> Payflex (4 interest-free installments)
            </li>
          </ul>

          <h3>4.3 Failed Payments</h3>
          <p>
            <strong>Failed Payment Fee:</strong> R65.00 (incl. VAT) will be charged for all returned debit orders or
            failed payments.
          </p>

          <h3>4.4 Effect of Non-Payment</h3>
          <p>If payment is not received by the Due Date, the following consequences apply:</p>
          <ul>
            <li>
              <strong>Interest Charges:</strong> 2% per month (24% per annum) interest on overdue accounts
            </li>
            <li>
              <strong>Service Suspension:</strong> Services may be suspended or terminated if payment is not received by
              the Due Date
            </li>
            <li>
              <strong>Debt Collection:</strong> Outstanding balances may be submitted to debt collection agencies, and
              customer is liable for all collection costs
            </li>
            <li>
              <strong>Reconnection Fee:</strong> R250.00 reconnection fee applies if service is suspended due to
              non-payment
            </li>
          </ul>

          <h3>4.5 Refunds and Money-Back Guarantee</h3>
          <p>CircleTel offers a 30-day money-back guarantee on select services, subject to the following conditions:</p>

          <h4 className="font-semibold text-green-900 mt-4">Eligible for Refund:</h4>
          <ul>
            <li>Monthly recurring charges for standard packages</li>
            <li>Services cancelled within 30 days of activation</li>
            <li>Accounts with credit balance</li>
          </ul>

          <h4 className="font-semibold text-red-900 mt-4">Not Eligible for Refund:</h4>
          <ul>
            <li>Installation fees and setup charges</li>
            <li>Router purchases and hardware</li>
            <li>Contract cancellation fees</li>
            <li>Third-party charges (FNO installation fees)</li>
            <li>Services used beyond 30 days</li>
          </ul>

          <h3>4.6 Cancellations and Notice Period</h3>
          <p>
            Cancellations must be submitted through your Customer Portal or in writing. The following notice periods
            apply:
          </p>
          <ul>
            <li>
              <strong>Month-to-Month Services:</strong> One full calendar month&apos;s notice required
            </li>
            <li>
              <strong>Contract Services:</strong> Services continue until contract end date unless early termination
              fees are paid
            </li>
            <li>
              <strong>Cancellation Processing Fees:</strong> May apply depending on FNO requirements (e.g., Vumatel:
              R999)
            </li>
            <li>
              <strong>Clawback Fees:</strong> Apply if canceling within 12 months of activation where installation fees
              were waived
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'dispute-resolution',
      title: '5. Dispute Resolution',
      icon: PiScalesBold,
      content: (
        <>
          <h3>5.1 General Dispute Resolution</h3>
          <p>CircleTel is committed to resolving disputes fairly and efficiently. If you have a complaint or dispute:</p>

          <h4 className="font-semibold mt-4">Step 1: Initial Resolution Attempt</h4>
          <p>Contact our customer support team to attempt resolution in the spirit of cooperation.</p>
          <p>
            <strong>WhatsApp:</strong> 082 487 3900
            <br />
            <strong>Email:</strong> support@circletel.co.za
          </p>

          <h4 className="font-semibold mt-4">Step 2: Formal Complaint Submission</h4>
          <p>If the initial attempt is unsuccessful, submit a formal complaint to:</p>
          <p>
            <strong>Email:</strong> complaints@circletel.co.za
          </p>
          <p>Your complaint must include:</p>
          <ul>
            <li>Full particulars and contact details</li>
            <li>Your relationship with CircleTel and customer reference number</li>
            <li>Statement of reasons with sufficient detail</li>
            <li>Relevant evidence or documentation</li>
          </ul>

          <h4 className="font-semibold mt-4">Response Timeline (ICASA Regulations)</h4>
          <ul>
            <li>
              <strong>Acknowledgment:</strong> Within 3 working days of receiving your complaint
            </li>
            <li>
              <strong>Resolution:</strong> Within 14 working days of receiving your complaint
            </li>
          </ul>

          <h3>5.2 Escalation to ICASA</h3>
          <p>
            If you are not satisfied with CircleTel&apos;s resolution, you may escalate the matter to the Independent
            Communications Authority of South Africa (ICASA) after allowing the 14-day resolution period.
          </p>

          <h4 className="font-semibold mt-4">ICASA Contact Information</h4>
          <ul>
            <li>
              <strong>Telephone:</strong> +27 12 568 3000 / 3001
            </li>
            <li>
              <strong>Email:</strong> consumer@icasa.org.za
            </li>
            <li>
              <strong>Website:</strong> www.icasa.org.za
            </li>
            <li>
              <strong>Physical Address:</strong> 350 Witch-Hazel Avenue, Eco Point Office Park, Centurion, 0157
            </li>
          </ul>

          <h3>5.3 Billing Dispute Resolution</h3>
          <p>Billing disputes follow a specific procedure to protect both parties:</p>

          <h4 className="font-semibold mt-4">Time Limits</h4>
          <ul>
            <li>Billing disputes must be submitted within 60 days of invoice date</li>
            <li>Disputes must be received 5 business days before Due Date to withhold disputed amount</li>
          </ul>

          <h4 className="font-semibold mt-4">Required Information</h4>
          <ul>
            <li>Invoice number and date</li>
            <li>Disputed amount (specific charges)</li>
            <li>Undisputed amount (must still be paid)</li>
            <li>Full details of the dispute with supporting evidence</li>
          </ul>

          <h4 className="font-semibold mt-4">Service Continuity During Dispute</h4>
          <ul>
            <li>CircleTel will not suspend service during the dispute resolution period</li>
            <li>No late payment penalties will be imposed during resolution</li>
            <li>Undisputed amounts must be paid on time</li>
          </ul>

          <h3>5.4 Investigation Fees</h3>
          <p>If an investigation proves the billing was accurate (within 5% tolerance), the following fees apply:</p>
          <ul>
            <li>
              <strong>Usage Disputes:</strong> R200 investigation fee
            </li>
            <li>
              <strong>Reconciliation Requests:</strong> R200 administration fee
            </li>
            <li>
              <strong>Historical Information Requests:</strong> R200 per request
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'product-terms',
      title: '6. Product-Specific Terms',
      icon: PiPackageBold,
      content: (
        <>
          <h3>6.1 Fibre Internet Services</h3>

          <h4 className="font-semibold mt-4">Network Operators</h4>
          <p>CircleTel provides fibre services over the following FNO networks:</p>
          <ul>
            <li>Vumatel</li>
            <li>Openserve (Telkom)</li>
            <li>Dark Fibre Africa (DFA)</li>
            <li>Frogfoot</li>
            <li>MetroFibre</li>
            <li>Link Africa</li>
            <li>Evotel</li>
          </ul>

          <h4 className="font-semibold mt-4">Installation</h4>
          <ul>
            <li>Installation fees range from R0 to R2,000 depending on FNO and promotions</li>
            <li>Installation typically takes 5-15 business days from order confirmation</li>
            <li>Customer must be present during FNO installation</li>
            <li>Installation includes fibre ONT (Optical Network Terminal) installation by FNO</li>
          </ul>

          <h4 className="font-semibold mt-4">Service Level Agreement (SLA)</h4>
          <ul>
            <li>
              <strong>Uptime Target:</strong> 99.5% monthly uptime (excluding planned maintenance)
            </li>
            <li>
              <strong>Fault Response:</strong> 24-48 hours for residential, 4-24 hours for business
            </li>
            <li>
              <strong>Planned Maintenance:</strong> Communicated 48 hours in advance
            </li>
          </ul>

          <h4 className="font-semibold mt-4">Router Options</h4>
          <ul>
            <li>Optional router purchase: R899 - R2,499 depending on model</li>
            <li>Use your own router (must support PPPoE configuration)</li>
            <li>Router warranty: 12 months manufacturer warranty</li>
          </ul>

          <h4 className="font-semibold mt-4">Fair Usage Policy (Uncapped Packages)</h4>
          <p>Uncapped packages are subject to fair usage limits to ensure network quality for all users:</p>
          <ul>
            <li>
              <strong>Uncapped Packages:</strong> 1TB - 2TB monthly threshold (speed-based)
            </li>
            <li>
              <strong>After Threshold:</strong> Speeds may be reduced during peak hours (18:00-23:00)
            </li>
            <li>
              <strong>Off-Peak:</strong> Full speeds maintained 23:00-18:00
            </li>
            <li>
              <strong>Commercial Use:</strong> Hosting servers, reselling prohibited on residential packages
            </li>
          </ul>

          <h3>6.2 Fixed Wireless (5G/LTE) Services</h3>

          <h4 className="font-semibold mt-4">Installation Options</h4>
          <ul>
            <li>
              <strong>Self-Installation:</strong> Free - DIY kit with router and SIM card
            </li>
            <li>
              <strong>Professional Installation:</strong> R750 - Includes site survey, antenna installation, and
              configuration
            </li>
          </ul>

          <h4 className="font-semibold mt-4">Coverage and Performance</h4>
          <p>Wireless service performance depends on:</p>
          <ul>
            <li>Signal strength and tower distance</li>
            <li>Building materials and obstacles</li>
            <li>Network congestion during peak times</li>
            <li>Weather conditions</li>
          </ul>
          <p>
            <strong>Note:</strong> Speeds are &quot;up to&quot; advertised speeds and may vary based on coverage conditions.
          </p>

          <h4 className="font-semibold mt-4">CGNAT (Carrier-Grade NAT)</h4>
          <p>Wireless services use CGNAT due to IPv4 address limitations. This may affect:</p>
          <ul>
            <li>Hosting services (web servers, mail servers)</li>
            <li>Remote access applications</li>
            <li>CCTV and DVR remote viewing</li>
            <li>VPN configurations</li>
            <li>Gaming server hosting</li>
          </ul>
          <p>
            <strong>Static IP Option:</strong> Available on business packages for additional R350/month
          </p>

          <h4 className="font-semibold mt-4">RICA Compliance</h4>
          <p>All wireless services must be RICA registered as required by South African law. Required documents:</p>
          <ul>
            <li>Copy of South African ID or passport</li>
            <li>Proof of residence (not older than 3 months)</li>
            <li>Service will be activated only after successful RICA registration</li>
          </ul>

          <h3>6.3 VoIP Telephony Services</h3>

          <h4 className="font-semibold mt-4">Service Features</h4>
          <ul>
            <li>Geographic and non-geographic number options</li>
            <li>Call forwarding, voicemail, call waiting</li>
            <li>Call recording (business packages)</li>
            <li>Multi-channel support (business packages)</li>
            <li>Mobile and desktop applications</li>
          </ul>

          <h4 className="font-semibold text-red-900 mt-4">Emergency Services Limitation</h4>
          <p>
            <strong>Important:</strong> VoIP services may not support emergency calling (10111, 10177, etc.) in the
            event of power or Internet outages. Maintain alternative communication methods for emergencies.
          </p>

          <h4 className="font-semibold mt-4">Number Portability</h4>
          <ul>
            <li>Port existing landline numbers to CircleTel VoIP</li>
            <li>Porting takes 7-15 business days</li>
            <li>R150 porting fee applies</li>
            <li>Temporary number provided during porting period</li>
          </ul>

          <h3>6.4 Business Services</h3>

          <h4 className="font-semibold mt-4">Enhanced Support</h4>
          <ul>
            <li>Dedicated account manager</li>
            <li>Priority fault resolution (4-hour response time)</li>
            <li>24/7 technical support</li>
            <li>Proactive network monitoring</li>
          </ul>

          <h4 className="font-semibold mt-4">Business SLA</h4>
          <ul>
            <li>
              <strong>Uptime Target:</strong> 99.9% monthly uptime
            </li>
            <li>
              <strong>Fault Response:</strong> 4 hours acknowledgment, 24 hours resolution target
            </li>
            <li>
              <strong>SLA Credits:</strong> Available for extended outages (pro-rata credit based on downtime)
            </li>
          </ul>

          <h4 className="font-semibold mt-4">Static IP Addresses</h4>
          <p>Available on business packages:</p>
          <ul>
            <li>Single static IP: R350/month</li>
            <li>Multiple static IPs: Custom pricing</li>
            <li>Required for hosting services, VPNs, remote access</li>
          </ul>

          <h3>6.5 Cloud Services</h3>

          <h4 className="font-semibold mt-4">Cloud Hosting</h4>
          <ul>
            <li>Virtual servers (VPS) with scalable resources</li>
            <li>Dedicated servers for high-performance needs</li>
            <li>Managed hosting with automatic updates and backups</li>
            <li>99.9% uptime SLA on dedicated and VPS hosting</li>
          </ul>

          <h4 className="font-semibold mt-4">Backup and Recovery</h4>
          <ul>
            <li>Daily automated backups (retained for 7-30 days based on package)</li>
            <li>Off-site backup storage</li>
            <li>Disaster recovery planning available</li>
            <li>Self-service restore from backup portal</li>
          </ul>

          <h4 className="font-semibold mt-4">Cloud Migration Services</h4>
          <ul>
            <li>Assessment and planning phase (free consultation)</li>
            <li>Data migration with minimal downtime</li>
            <li>Application reconfiguration and testing</li>
            <li>Post-migration support (30 days included)</li>
          </ul>
        </>
      ),
    },
    {
      id: 'liability',
      title: '7. Liability and Indemnity',
      icon: PiWarningBold,
      content: (
        <>
          <h3>7.1 Limitation of Liability</h3>
          <p>
            <strong>CircleTel&apos;s entire liability</strong> for any claim arising out of or in connection with this
            Agreement is limited to the amount paid by you for the services in the month in which the claim arose.
          </p>
          <p>
            This limitation applies to all causes of action in aggregate, including breach of contract, breach of
            warranty, negligence, strict liability, misrepresentation, and other torts.
          </p>

          <h3>7.2 Exclusions from Liability</h3>
          <p>CircleTel shall not be liable for:</p>

          <h4 className="font-semibold mt-4">Service Interruptions</h4>
          <ul>
            <li>Access delays or interruptions to services</li>
            <li>Data non-delivery, mis-delivery, corruption, or loss</li>
            <li>Network congestion or third-party network issues</li>
          </ul>

          <h4 className="font-semibold mt-4">Force Majeure Events</h4>
          <ul>
            <li>Acts of God (floods, earthquakes, storms)</li>
            <li>Utility interruptions (power outages, grid failures)</li>
            <li>Equipment failure due to external factors</li>
            <li>Labor strikes, riots, civil unrest</li>
            <li>Government actions or regulatory changes</li>
          </ul>

          <h4 className="font-semibold mt-4">Customer Responsibilities</h4>
          <ul>
            <li>Unauthorized use of your account credentials</li>
            <li>Customer equipment failure or misconfiguration</li>
            <li>Viruses or malware on customer devices</li>
            <li>Loss of data due to customer actions</li>
          </ul>

          <h4 className="font-semibold mt-4">Third-Party Services</h4>
          <ul>
            <li>FNO (Fibre Network Operator) installation delays or faults</li>
            <li>Third-party equipment failures</li>
            <li>Content or services accessed through CircleTel network</li>
          </ul>

          <h3>7.3 Service Provision &quot;As Is&quot;</h3>
          <p>
            Services are provided <strong>&quot;as is, as available&quot;</strong> without warranties of any kind, either
            express or implied, including but not limited to:
          </p>
          <ul>
            <li>Warranties of merchantability</li>
            <li>Fitness for a particular purpose</li>
            <li>Non-infringement</li>
            <li>Uninterrupted or error-free operation</li>
          </ul>

          <h3>7.4 Customer Indemnity</h3>
          <p>
            You agree to indemnify and hold CircleTel harmless from any claims, damages, losses, liabilities, and
            expenses (including attorney fees) arising from:
          </p>
          <ul>
            <li>Your use or misuse of CircleTel services</li>
            <li>Your violation of this Agreement or any applicable laws</li>
            <li>Your violation of any third-party rights, including intellectual property rights</li>
            <li>Content you upload, transmit, or make available through CircleTel services</li>
            <li>Actions of anyone using your account with or without your authorization</li>
          </ul>

          <h3>7.5 Password Security</h3>
          <p>
            <strong>You are responsible</strong> for maintaining the confidentiality of your account password and for
            all activities that occur under your account.
          </p>
          <p>
            CircleTel will not change passwords without proof of identification. In partnership disputes, CircleTel
            remains neutral and may suspend account access until the dispute is resolved.
          </p>
          <p>
            <strong>You agree to:</strong>
          </p>
          <ul>
            <li>Immediately notify CircleTel of any unauthorized use of your account</li>
            <li>Ensure your password meets security requirements (minimum 8 characters, mixed case, numbers)</li>
            <li>Not share your password with any third party</li>
            <li>Change your password regularly (recommended every 90 days)</li>
          </ul>
        </>
      ),
    },
    {
      id: 'termination',
      title: '8. Termination and Suspension',
      icon: PiSignOutBold,
      content: (
        <>
          <h3>8.1 Termination by Customer</h3>
          <p>You may terminate this Agreement at any time by:</p>
          <ul>
            <li>Submitting a cancellation request through your Customer Portal, or</li>
            <li>Sending written notice to support@circletel.co.za</li>
          </ul>
          <p>
            <strong>Notice Period:</strong> One full calendar month&apos;s notice is required for month-to-month services.
            Contract services continue until the end of the contract term unless early termination fees are paid.
          </p>

          <h3>8.2 Termination by CircleTel</h3>
          <p>CircleTel may terminate or suspend your services immediately if you:</p>

          <h4 className="font-semibold text-red-900 mt-4">Payment-Related Termination</h4>
          <ul>
            <li>Fail to pay any amount due within 10 days of written demand</li>
            <li>Have two or more consecutive failed payments</li>
            <li>Refuse to update payment information after failed payment</li>
          </ul>

          <h4 className="font-semibold text-red-900 mt-4">Breach of Agreement</h4>
          <ul>
            <li>Violate any provision of this Agreement and fail to remedy within 30 days of notice</li>
            <li>Commit serious violations of the Acceptable Use Policy</li>
            <li>Engage in fraudulent or illegal activities</li>
          </ul>

          <h4 className="font-semibold text-red-900 mt-4">Insolvency Events</h4>
          <ul>
            <li>Are placed under liquidation, judicial management, or business rescue</li>
            <li>Commit any act of insolvency</li>
            <li>Compromise or attempt to compromise with creditors</li>
            <li>Have an unsatisfied judgment against you for 30 days after granting</li>
          </ul>

          <h3>8.3 Effect of Termination</h3>
          <p>Upon termination of this Agreement:</p>
          <ul>
            <li>All outstanding amounts become immediately due and payable</li>
            <li>Your access to services will be discontinued</li>
            <li>CircleTel may delete your data after 30 days (backup your data before termination)</li>
            <li>Email addresses and accounts will be deactivated</li>
            <li>Refunds (if applicable) will be processed according to Section 4.5</li>
            <li>You remain liable for any charges incurred before termination</li>
          </ul>

          <h3>8.4 Service Suspension</h3>
          <p>
            <strong>CircleTel may suspend</strong> (rather than terminate) your services for:
          </p>
          <ul>
            <li>Non-payment pending resolution (after Due Date)</li>
            <li>Investigation of Acceptable Use Policy violations</li>
            <li>Security concerns or suspected account compromise</li>
            <li>Maintenance or network upgrades (with advance notice when possible)</li>
          </ul>
          <p>
            <strong>Reconnection Fee:</strong> R250 applies if service is suspended due to non-payment and requires
            reactivation.
          </p>

          <h3>8.5 Data Retention After Termination</h3>
          <p>After service termination:</p>
          <ul>
            <li>
              <strong>30-Day Grace Period:</strong> Your data is retained for 30 days to allow for reactivation or data
              export
            </li>
            <li>
              <strong>Data Export:</strong> You may request a data export within the 30-day period (R500 administrative
              fee)
            </li>
            <li>
              <strong>Permanent Deletion:</strong> After 30 days, all data is permanently deleted and cannot be
              recovered
            </li>
            <li>
              <strong>Legal Retention:</strong> Some data may be retained for legal/regulatory compliance (e.g.,
              invoices, RICA records)
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'general-provisions',
      title: '9. General Provisions',
      icon: PiFileTextBold,
      content: (
        <>
          <h3>9.1 Entire Agreement</h3>
          <p>
            This Agreement constitutes the entire agreement between you and CircleTel regarding the use of our services
            and supersedes all prior agreements, whether written or oral, relating to the same subject matter.
          </p>

          <h3>9.2 Amendment of Terms</h3>
          <p>CircleTel may amend this Agreement from time to time. We will:</p>
          <ul>
            <li>Provide 30 days&apos; notice of material changes by posting the updated terms on our website</li>
            <li>Send email notification to your registered email address for significant changes</li>
            <li>Update the &quot;Last Updated&quot; date at the top of this document</li>
          </ul>
          <p>
            <strong>Your continued use</strong> of CircleTel services after the notice period constitutes acceptance of
            the amended terms. If you do not agree with the amendments, you may terminate this Agreement in accordance
            with Section 8.1.
          </p>

          <h3>9.3 Governing Law and Jurisdiction</h3>
          <p>
            This Agreement is governed by the laws of the Republic of South Africa. You consent to the exclusive
            jurisdiction of the South African courts for any disputes arising out of or relating to this Agreement.
          </p>
          <p>For legal purposes, this Agreement is deemed to have been entered into in Johannesburg, South Africa.</p>

          <h3>9.4 Notices</h3>
          <p>All notices under this Agreement must be in writing and delivered via:</p>
          <ul>
            <li>Personal delivery</li>
            <li>Email to your registered email address</li>
            <li>Registered mail to your registered physical address</li>
          </ul>

          <p>Notices are deemed received:</p>
          <ul>
            <li>
              <strong>Personal Delivery:</strong> On the date of delivery
            </li>
            <li>
              <strong>Email (sent before 16:00):</strong> Same business day
            </li>
            <li>
              <strong>Email (sent after 16:00 or on non-business day):</strong> Next business day
            </li>
            <li>
              <strong>Registered Mail:</strong> 5th business day after posting
            </li>
          </ul>

          <h3>9.5 Non-Transferability</h3>
          <p>
            Your rights and privileges under this Agreement cannot be sold, assigned, or transferred to any third party
            without CircleTel&apos;s prior written consent. CircleTel may assign this Agreement to any successor or affiliate
            without your consent.
          </p>

          <h3>9.6 Severability</h3>
          <p>
            If any provision of this Agreement is found to be invalid, illegal, or unenforceable, the remaining
            provisions shall continue in full force and effect. The invalid provision shall be replaced with a valid
            provision that most closely approximates the intent and economic effect of the invalid provision.
          </p>

          <h3>9.7 Waiver</h3>
          <p>
            No waiver of any term or condition of this Agreement shall be deemed a further or continuing waiver of such
            term or condition or any other term or condition. CircleTel&apos;s failure to assert any right or provision under
            this Agreement shall not constitute a waiver of such right or provision.
          </p>

          <h3>9.8 Use of Customer Information</h3>
          <p>CircleTel may:</p>
          <ul>
            <li>Include your name and contact information in service directories for administrative purposes</li>
            <li>Use anonymized usage data for service improvement and network optimization</li>
            <li>Share information as required by law or regulatory authorities</li>
          </ul>
          <p>
            CircleTel will <strong>not</strong> print your name, trademarks, or logos in advertising or promotional
            materials without your explicit written consent.
          </p>

          <h3>9.9 Protection of Personal Information</h3>
          <p>
            CircleTel complies with the Protection of Personal Information Act (POPIA), 2013. We are committed to:
          </p>
          <ul>
            <li>Protecting your personal information from unauthorized access, use, or disclosure</li>
            <li>Processing your information only for lawful purposes related to service provision</li>
            <li>Maintaining the accuracy and completeness of your information</li>
            <li>Retaining your information only as long as necessary for business or legal purposes</li>
            <li>Allowing you to access, correct, or delete your personal information</li>
          </ul>
          <p>
            For POPIA-related inquiries or to exercise your rights, contact: <strong>privacy@circletel.co.za</strong>
          </p>

          <h3>9.10 Electronic Communications and Transactions</h3>
          <p>
            This Agreement complies with the Electronic Communications and Transactions Act (ECTA), 2002. By using
            CircleTel services, you:
          </p>
          <ul>
            <li>
              Consent to receiving communications from CircleTel via electronic means (email, SMS, in-app notifications)
            </li>
            <li>
              Agree that electronic signatures and records have the same legal effect as physical signatures and paper
              records
            </li>
            <li>
              Acknowledge that you have the necessary hardware, software, and Internet access to receive electronic
              communications
            </li>
          </ul>
        </>
      ),
    },
  ],
};
