/**
 * Generate Delphius Contract PDF
 *
 * Usage: npx tsx scripts/generate-delphius-contract.ts
 *
 * Outputs: .docs/contracts/Delphius_CT-2026-XXX.pdf
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { generateManagedServiceAgreementPDF } from '../lib/contracts/managed-service-agreement-pdf';
import type { ManagedServiceContractInput } from '../lib/contracts/types';

// Delphius contract details (confirmed from email)
const delphiusContract: ManagedServiceContractInput = {
  customer: {
    companyName: 'Delphius (Pty) Ltd',
    contactPerson: 'P.J Phike',
    email: 'pj@delphius.co.za',
    phone: '',
    address: 'Unit F2, Tilbury Business Park, 16th Road, Randjespark, Midrand, 1685',
  },
  service: {
    type: 'Managed Business Connectivity',
    description: '100/40 Mbps Managed Business Connectivity',
    speedDown: 100,
    speedUp: 40,
    dataPolicy: 'Truly Uncapped (No FUP)',
    staticIp: true,
    router: 'Business router with cloud management',
    monitoring: '24/7 proactive monitoring + monthly reports',
  },
  pricing: {
    monthlyFee: 1899,         // R1,899 excl. VAT
    installationFee: 3500,    // R3,500 excl. VAT (premium with site survey)
    vatRate: 0.15,
  },
  sla: {
    uptimeGuarantee: 99.5,
    faultResponse: '4 hours',
    faultResolution: '3 business days',
    creditCap: 25,            // Max 25% of monthly fee
  },
  contract: {
    term: 'Month-to-month',
    noticePeriod: 30,         // 30 calendar days
    commencementDate: '2026-03-01',
    contractNumber: 'CT-2026-001', // First contract of 2026
  },
  equipment: {
    description: 'Business router with cloud management',
    ownership: 'CircleTel retains ownership',
    returnPeriod: '14 days after termination',
    replacementFee: 2500,     // R2,500 if not returned
  },
};

async function main() {
  console.log('Generating Delphius Managed Service Agreement...\n');

  // Generate the PDF
  const pdf = generateManagedServiceAgreementPDF(delphiusContract);

  // Ensure output directory exists
  const outputDir = join(process.cwd(), '.docs', 'contracts');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
    console.log(`Created directory: ${outputDir}`);
  }

  // Generate filename
  const filename = `Delphius_${delphiusContract.contract.contractNumber}.pdf`;
  const outputPath = join(outputDir, filename);

  // Get PDF as array buffer and write to file
  const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));
  writeFileSync(outputPath, pdfBuffer);

  console.log('Contract Details:');
  console.log('─────────────────────────────────────────');
  console.log(`Customer:        ${delphiusContract.customer.companyName}`);
  console.log(`Contact:         ${delphiusContract.customer.contactPerson}`);
  console.log(`Email:           ${delphiusContract.customer.email}`);
  console.log(`Address:         ${delphiusContract.customer.address}`);
  console.log('');
  console.log('Service:');
  console.log(`  Speed:         ${delphiusContract.service.speedDown}/${delphiusContract.service.speedUp} Mbps`);
  console.log(`  Data:          ${delphiusContract.service.dataPolicy}`);
  console.log(`  Static IP:     ${delphiusContract.service.staticIp ? 'Yes' : 'No'}`);
  console.log('');
  console.log('Pricing (excl. VAT):');
  console.log(`  Monthly:       R${delphiusContract.pricing.monthlyFee.toLocaleString()}`);
  console.log(`  Installation:  R${delphiusContract.pricing.installationFee.toLocaleString()}`);
  console.log('');
  console.log('Pricing (incl. VAT):');
  const monthlyTotal = delphiusContract.pricing.monthlyFee * (1 + delphiusContract.pricing.vatRate);
  const installTotal = delphiusContract.pricing.installationFee * (1 + delphiusContract.pricing.vatRate);
  console.log(`  Monthly:       R${monthlyTotal.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`);
  console.log(`  Installation:  R${installTotal.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`);
  console.log('');
  console.log('SLA:');
  console.log(`  Uptime:        ${delphiusContract.sla.uptimeGuarantee}%`);
  console.log(`  Response:      ${delphiusContract.sla.faultResponse}`);
  console.log(`  Resolution:    ${delphiusContract.sla.faultResolution}`);
  console.log(`  Credit Cap:    ${delphiusContract.sla.creditCap}%`);
  console.log('');
  console.log('Contract:');
  console.log(`  Number:        ${delphiusContract.contract.contractNumber}`);
  console.log(`  Term:          ${delphiusContract.contract.term}`);
  console.log(`  Notice:        ${delphiusContract.contract.noticePeriod} days`);
  console.log(`  Commencement:  ${delphiusContract.contract.commencementDate}`);
  console.log('─────────────────────────────────────────');
  console.log('');
  console.log(`PDF generated: ${outputPath}`);
  console.log('');
  console.log('Next steps:');
  console.log('1. Review the PDF for accuracy');
  console.log('2. Send to Delphius for signature');
  console.log('3. Once signed, upload to Supabase storage');
}

main().catch(console.error);
