/**
 * Contract Templates
 * Task Group 6: Contract Generation & PDF with KYC Badge
 *
 * Defines Terms & Conditions for each service type (fibre, wireless, hybrid)
 */

import type { ContractTemplate, ServiceType } from './types';

const COMMON_TERMS = [
  '1. DEFINITIONS: "Service" refers to the telecommunications connectivity provided by CircleTel. "Customer" refers to the business entity contracting for Service.',
  '2. TERM: This Contract is binding for the Contract Term specified. Early termination is subject to Early Termination Fees.',
  '3. PAYMENT: Customer agrees to pay all Monthly Recurring Charges by the due date specified on each invoice. Late payments incur a 2% monthly interest charge.',
  '4. INSTALLATION: Installation fees are payable upfront. CircleTel will install Service within 30 business days of Contract execution, subject to feasibility.',
  '5. SERVICE USAGE: Customer agrees to use Service in accordance with all applicable laws and regulations. Unlawful use will result in immediate termination.',
  '6. INTELLECTUAL PROPERTY: All equipment, software, and materials provided by CircleTel remain the property of CircleTel or its suppliers.',
  '7. CONFIDENTIALITY: Both parties agree to keep confidential all non-public information disclosed during the Contract Term.',
  '8. DATA PROTECTION: CircleTel will process Customer data in accordance with POPIA (Protection of Personal Information Act).',
  '9. LIABILITY LIMITATION: CircleTel\'s total liability under this Contract is limited to 3 months of Monthly Recurring Charges.',
  '10. FORCE MAJEURE: Neither party is liable for delays or failures due to circumstances beyond reasonable control (natural disasters, strikes, etc.).',
  '11. DISPUTE RESOLUTION: Any disputes shall first be resolved through good-faith negotiation. If unresolved, disputes shall be arbitrated under South African law.',
  '12. ENTIRE AGREEMENT: This Contract, together with any referenced Master Service Agreement, constitutes the entire agreement between parties.',
  '13. AMENDMENTS: No amendments to this Contract are valid unless signed in writing by authorized representatives of both parties.',
  '14. NOTICES: All notices must be sent in writing to the addresses specified in this Contract.',
  '15. ASSIGNMENT: Customer may not assign this Contract without CircleTel\'s prior written consent. CircleTel may assign to any affiliate or successor.',
];

const FIBRE_TEMPLATE: ContractTemplate = {
  serviceType: 'fibre',
  termsAndConditions: [
    ...COMMON_TERMS,
    '16. FIBRE-SPECIFIC TERMS: Service is provided via fibre-optic infrastructure. Customer acknowledges that fibre installation requires physical cabling to premises.',
    '17. NETWORK MAINTENANCE: CircleTel may perform scheduled maintenance with 48 hours notice. Emergency maintenance may be performed without notice.',
    '18. EQUIPMENT: Customer is responsible for maintaining all Customer-Premises Equipment (CPE). CircleTel-provided routers remain property of CircleTel.',
    '19. RELOCATION: Service relocation to a new address requires feasibility assessment and may incur additional installation fees.',
    '20. NETWORK PROVIDER: Service is delivered via CircleTel\'s partner network providers (MTN, Openserve, Vumatel, DFA, Metrofibre, etc.).',
  ],
  slaTerms: [
    'Network Uptime: 99.5% monthly uptime guarantee (excludes scheduled maintenance)',
    'Fault Response: 4-hour response time for reported faults (business hours: Mon-Fri 8AM-5PM)',
    'Fault Resolution: 24-hour resolution target for network-related faults',
    'Support Hours: 24/7 technical support via email and phone',
    'Service Credits: 5% monthly charge credited for each 1% below 99.5% uptime (max 50% monthly credit)',
  ],
  cancellationPolicy: 'Customer may cancel Service with 30 days written notice. Cancellation before Contract Term end is subject to Early Termination Fee. No refunds for partial months. Equipment must be returned within 14 days of cancellation.',
  earlyTerminationFee: 'Early Termination Fee equals 50% of remaining Monthly Recurring Charges for the Contract Term. Example: For a 24-month contract cancelled after 12 months, ETF = (Monthly Recurring x 12 months) x 50%.',
};

const WIRELESS_TEMPLATE: ContractTemplate = {
  serviceType: 'wireless',
  termsAndConditions: [
    ...COMMON_TERMS,
    '16. WIRELESS-SPECIFIC TERMS: Service is provided via cellular/LTE/5G wireless technology. Signal strength depends on tower proximity and environmental factors.',
    '17. FAIR USAGE POLICY: Uncapped services are subject to Fair Usage Policy. Excessive usage (>1TB/month) may be throttled during peak hours.',
    '18. NETWORK COVERAGE: Service availability depends on network coverage in Customer area. CircleTel is not liable for coverage gaps or signal degradation.',
    '19. EQUIPMENT: Customer receives a wireless router. Router must be returned upon Service termination or Customer will be charged R2,500 replacement fee.',
    '20. SIGNAL INTERFERENCE: Customer acknowledges that buildings, weather, and other factors may affect wireless signal quality.',
  ],
  slaTerms: [
    'Network Uptime: 99.0% monthly uptime guarantee (excludes network provider outages)',
    'Fault Response: 8-hour response time for reported faults (business hours: Mon-Fri 8AM-5PM)',
    'Fault Resolution: 48-hour resolution target for equipment-related faults',
    'Support Hours: Business hours technical support (Mon-Fri 8AM-5PM)',
    'Service Credits: 5% monthly charge credited for each 1% below 99.0% uptime (max 50% monthly credit)',
  ],
  cancellationPolicy: 'Customer may cancel Service with 30 days written notice. Cancellation before Contract Term end is subject to Early Termination Fee. Wireless router must be returned within 14 days or R2,500 replacement fee applies.',
  earlyTerminationFee: 'Early Termination Fee equals 60% of remaining Monthly Recurring Charges for the Contract Term. Example: For a 36-month contract cancelled after 12 months, ETF = (Monthly Recurring x 24 months) x 60%.',
};

const HYBRID_TEMPLATE: ContractTemplate = {
  serviceType: 'hybrid',
  termsAndConditions: [
    ...COMMON_TERMS,
    '16. HYBRID-SPECIFIC TERMS: Service combines fibre (primary) and wireless (failover) connectivity. Automatic failover activates when primary fibre connection fails.',
    '17. FAILOVER DATA LIMITS: Wireless failover includes 50GB monthly data. Excess usage charged at R150/GB. Customer may purchase additional failover data bundles.',
    '18. EQUIPMENT: Customer receives both fibre CPE and wireless router. Both devices must be returned upon Service termination or Customer will be charged equipment fees.',
    '19. PRIMARY/FAILOVER PRIORITY: Fibre is always primary connection. Wireless activates only when fibre is unavailable. Manual switching is not supported.',
    '20. NETWORK DEPENDENCIES: Service quality depends on both fibre and wireless network availability. CircleTel is not liable for dual-network outages.',
  ],
  slaTerms: [
    'Network Uptime: 99.7% monthly uptime guarantee (combined fibre + wireless)',
    'Fault Response: 4-hour response time for fibre faults, 8-hour for wireless faults (business hours: Mon-Fri 8AM-5PM)',
    'Fault Resolution: 24-hour resolution target for primary fibre faults',
    'Support Hours: 24/7 technical support via email and phone',
    'Service Credits: 5% monthly charge credited for each 1% below 99.7% uptime (max 50% monthly credit)',
  ],
  cancellationPolicy: 'Customer may cancel Service with 30 days written notice. Cancellation before Contract Term end is subject to Early Termination Fee. All equipment (fibre CPE and wireless router) must be returned within 14 days or replacement fees apply (R1,500 fibre CPE + R2,500 wireless router).',
  earlyTerminationFee: 'Early Termination Fee equals 55% of remaining Monthly Recurring Charges for the Contract Term. Example: For a 24-month contract cancelled after 6 months, ETF = (Monthly Recurring x 18 months) x 55%.',
};

/**
 * Managed Wireless Service Template
 *
 * For month-to-month managed connectivity services with no lock-in.
 * Includes proactive monitoring, cloud-managed router, and static IP.
 */
const MANAGED_WIRELESS_TEMPLATE: ContractTemplate = {
  serviceType: 'managed_wireless',
  contractModel: 'month-to-month',
  termsAndConditions: [
    '1. DEFINITIONS: "Service" refers to the managed business connectivity provided by CircleTel. "Customer" refers to the business entity contracting for Service. "Equipment" refers to the managed router provided by CircleTel.',
    '2. TERM: This is a month-to-month agreement with no minimum commitment. Either party may terminate with 30 calendar days written notice.',
    '3. PAYMENT: Customer agrees to pay all Monthly Recurring Charges by the due date specified on each invoice (15 days from invoice date). Late payments incur a 2% monthly interest charge.',
    '4. INSTALLATION: Installation fee is payable upfront. CircleTel will install Service within 10 business days of payment confirmation, subject to site survey.',
    '5. SERVICE USAGE: Customer agrees to use Service in accordance with all applicable laws and regulations. Unlawful use will result in immediate termination.',
    '6. INTELLECTUAL PROPERTY: All equipment, software, and materials provided by CircleTel remain the property of CircleTel.',
    '7. CONFIDENTIALITY: Both parties agree to keep confidential all non-public information disclosed during the Service period.',
    '8. DATA PROTECTION: CircleTel will process Customer data in accordance with POPIA (Protection of Personal Information Act).',
    '9. LIABILITY LIMITATION: CircleTel\'s total liability under this Agreement is limited to 12 months of Monthly Recurring Charges.',
    '10. FORCE MAJEURE: Neither party is liable for delays or failures due to circumstances beyond reasonable control.',
    '11. DISPUTE RESOLUTION: Any disputes shall first be resolved through good-faith negotiation. If unresolved, disputes shall be arbitrated under South African law.',
    '12. ENTIRE AGREEMENT: This Agreement constitutes the entire agreement between parties regarding the Service.',
    '13. AMENDMENTS: No amendments to this Agreement are valid unless signed in writing by authorized representatives of both parties.',
    '14. NOTICES: All notices must be sent in writing to the email addresses specified in this Agreement.',
    '15. ASSIGNMENT: Customer may not assign this Agreement without CircleTel\'s prior written consent.',
    '16. MANAGED SERVICE: Service includes proactive 24/7 network monitoring, cloud-based router management, and monthly performance reports.',
    '17. STATIC IP: A static public IP address is included with the Service at no additional charge.',
    '18. UNCAPPED DATA: Service includes truly uncapped data with no Fair Usage Policy (FUP) throttling.',
    '19. SUPPORT: Dedicated support desk available during business hours (Mon-Fri 8AM-5PM SAST). Emergency support available 24/7.',
    '20. SERVICE CREDITS: Service credits for SLA breaches are applied to the next invoice. Credits do not accumulate beyond the credit cap.',
  ],
  slaTerms: [
    'Network Uptime: 99.5% monthly uptime guarantee (excludes scheduled maintenance with 48h notice)',
    'Fault Response: 4-hour response time during business hours (Mon-Fri 8AM-5PM SAST)',
    'Fault Resolution: 3 business days target for equipment and connectivity faults',
    'Proactive Monitoring: 24/7 automated monitoring with monthly performance reports',
    'Service Credits: 5% monthly charge credited for each 0.5% below 99.5% uptime (maximum 25% monthly credit)',
  ],
  cancellationPolicy: 'Either party may cancel Service with 30 calendar days written notice to the other party\'s registered email address. No early termination fees apply as this is a month-to-month service. Equipment must be returned within 14 days of Service termination date.',
  earlyTerminationFee: 'Not applicable. This is a month-to-month service with no minimum commitment period. No early termination fees apply.',
  equipmentClause: 'CircleTel provides and retains ownership of the managed business router. Customer is responsible for the safekeeping of equipment during the Service period. Customer must return equipment within 14 days of Service termination. Failure to return equipment or return of damaged equipment will result in a replacement fee of R2,500 (incl. VAT).',
};

export function getTemplateForServiceType(
  serviceType: ServiceType
): ContractTemplate {
  switch (serviceType) {
    case 'fibre':
      return FIBRE_TEMPLATE;
    case 'wireless':
      return WIRELESS_TEMPLATE;
    case 'hybrid':
      return HYBRID_TEMPLATE;
    case 'managed_wireless':
      return MANAGED_WIRELESS_TEMPLATE;
    default:
      throw new Error(`Unknown service type: ${serviceType}`);
  }
}

// Export templates for testing
export const CONTRACT_TEMPLATES = {
  fibre: FIBRE_TEMPLATE,
  wireless: WIRELESS_TEMPLATE,
  hybrid: HYBRID_TEMPLATE,
  managed_wireless: MANAGED_WIRELESS_TEMPLATE,
};
