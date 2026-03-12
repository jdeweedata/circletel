/**
 * API Route: Generate Managed Service Agreement
 *
 * POST /api/contracts/generate-managed
 *
 * Generates a PDF contract for managed connectivity services without
 * requiring a quote in the database. For manual B2B contract generation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  generateManagedServiceAgreementPDF,
  generateManagedServiceAgreementBlob,
} from '@/lib/contracts/managed-service-agreement-pdf';
import type { ManagedServiceContractInput } from '@/lib/contracts/types';

/**
 * Generate next contract number in sequence
 * Format: CT-YYYY-NNN
 */
async function getNextContractNumber(): Promise<string> {
  const supabase = await createClient();
  const year = new Date().getFullYear();

  // Get the latest contract number for this year
  const { data, error } = await supabase
    .from('contracts')
    .select('contract_number')
    .ilike('contract_number', `CT-${year}-%`)
    .order('contract_number', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error fetching latest contract number:', error);
    // Fallback to random
    const random = Math.floor(Math.random() * 900) + 100;
    return `CT-${year}-${random}`;
  }

  if (!data || data.length === 0) {
    return `CT-${year}-001`;
  }

  // Extract number and increment
  const lastNumber = data[0].contract_number;
  const match = lastNumber.match(/CT-\d{4}-(\d+)/);
  if (match) {
    const nextNum = parseInt(match[1], 10) + 1;
    return `CT-${year}-${nextNum.toString().padStart(3, '0')}`;
  }

  return `CT-${year}-001`;
}

/**
 * Validate request body
 */
function validateInput(body: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Request body must be a JSON object'] };
  }

  const input = body as Partial<ManagedServiceContractInput>;

  // Customer validation
  if (!input.customer) {
    errors.push('customer object is required');
  } else {
    if (!input.customer.companyName) errors.push('customer.companyName is required');
    if (!input.customer.contactPerson) errors.push('customer.contactPerson is required');
    if (!input.customer.email) errors.push('customer.email is required');
    if (!input.customer.address) errors.push('customer.address is required');
  }

  // Service validation
  if (!input.service) {
    errors.push('service object is required');
  } else {
    if (!input.service.type) errors.push('service.type is required');
    if (typeof input.service.speedDown !== 'number') errors.push('service.speedDown must be a number');
    if (typeof input.service.speedUp !== 'number') errors.push('service.speedUp must be a number');
  }

  // Pricing validation
  if (!input.pricing) {
    errors.push('pricing object is required');
  } else {
    if (typeof input.pricing.monthlyFee !== 'number') errors.push('pricing.monthlyFee must be a number');
    if (typeof input.pricing.installationFee !== 'number') errors.push('pricing.installationFee must be a number');
  }

  // SLA validation
  if (!input.sla) {
    errors.push('sla object is required');
  } else {
    if (typeof input.sla.uptimeGuarantee !== 'number') errors.push('sla.uptimeGuarantee must be a number');
  }

  // Contract validation
  if (!input.contract) {
    errors.push('contract object is required');
  } else {
    if (!input.contract.term) errors.push('contract.term is required');
    if (!input.contract.commencementDate) errors.push('contract.commencementDate is required');
  }

  // Equipment validation
  if (!input.equipment) {
    errors.push('equipment object is required');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * POST /api/contracts/generate-managed
 *
 * Generate a managed service agreement PDF
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = validateInput(body);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, errors: validation.errors },
        { status: 400 }
      );
    }

    const input = body as ManagedServiceContractInput;

    // Apply defaults
    const contractInput: ManagedServiceContractInput = {
      ...input,
      customer: {
        ...input.customer,
        phone: input.customer.phone || '',
      },
      service: {
        ...input.service,
        description: input.service.description || `${input.service.speedDown}/${input.service.speedUp} Mbps Managed Connectivity`,
        dataPolicy: input.service.dataPolicy || 'Uncapped',
        staticIp: input.service.staticIp ?? true,
        router: input.service.router || 'Business router with cloud management',
        monitoring: input.service.monitoring || '24/7 proactive monitoring',
      },
      pricing: {
        ...input.pricing,
        vatRate: input.pricing.vatRate ?? 0.15,
      },
      sla: {
        ...input.sla,
        faultResponse: input.sla.faultResponse || '4 hours',
        faultResolution: input.sla.faultResolution || '3 business days',
        creditCap: input.sla.creditCap ?? 25,
      },
      contract: {
        ...input.contract,
        contractNumber: input.contract.contractNumber || await getNextContractNumber(),
        noticePeriod: input.contract.noticePeriod ?? 30,
      },
      equipment: {
        description: input.equipment.description || 'Business router with cloud management',
        ownership: input.equipment.ownership || 'CircleTel retains ownership',
        returnPeriod: input.equipment.returnPeriod || '14 days after termination',
        replacementFee: input.equipment.replacementFee ?? 2500,
      },
    };

    // Check output format preference
    const outputFormat = request.nextUrl.searchParams.get('format') || 'blob';

    if (outputFormat === 'base64') {
      // Return as base64 data URI
      const pdf = generateManagedServiceAgreementPDF(contractInput);
      const base64 = pdf.output('datauristring');
      return NextResponse.json({
        success: true,
        contractNumber: contractInput.contract.contractNumber,
        data: base64,
        filename: `CircleTel_MSA_${contractInput.customer.companyName.replace(/[^a-zA-Z0-9]/g, '_')}_${contractInput.contract.contractNumber}.pdf`,
      });
    }

    // Return as PDF blob
    const blob = generateManagedServiceAgreementBlob(contractInput);
    const arrayBuffer = await blob.arrayBuffer();

    const filename = `CircleTel_MSA_${contractInput.customer.companyName.replace(/[^a-zA-Z0-9]/g, '_')}_${contractInput.contract.contractNumber}.pdf`;

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Contract-Number': contractInput.contract.contractNumber || '',
      },
    });
  } catch (error) {
    console.error('Error generating managed service agreement:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate contract',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/contracts/generate-managed
 *
 * Returns the schema for the request body
 */
export async function GET() {
  return NextResponse.json({
    description: 'Generate a Managed Service Agreement PDF',
    method: 'POST',
    contentType: 'application/json',
    queryParams: {
      format: {
        type: 'string',
        enum: ['blob', 'base64'],
        default: 'blob',
        description: 'Output format. blob returns PDF file, base64 returns JSON with data URI',
      },
    },
    schema: {
      customer: {
        companyName: { type: 'string', required: true },
        registrationNumber: { type: 'string', required: false },
        vatNumber: { type: 'string', required: false },
        contactPerson: { type: 'string', required: true },
        email: { type: 'string', required: true },
        phone: { type: 'string', required: false },
        address: { type: 'string', required: true },
      },
      service: {
        type: { type: 'string', required: true, example: 'Managed Business Connectivity' },
        description: { type: 'string', required: false },
        speedDown: { type: 'number', required: true, example: 100 },
        speedUp: { type: 'number', required: true, example: 40 },
        dataPolicy: { type: 'string', required: false, default: 'Uncapped' },
        staticIp: { type: 'boolean', required: false, default: true },
        router: { type: 'string', required: false },
        monitoring: { type: 'string', required: false },
      },
      pricing: {
        monthlyFee: { type: 'number', required: true, description: 'Excl. VAT in ZAR' },
        installationFee: { type: 'number', required: true, description: 'Excl. VAT in ZAR' },
        vatRate: { type: 'number', required: false, default: 0.15 },
      },
      sla: {
        uptimeGuarantee: { type: 'number', required: true, example: 99.5 },
        faultResponse: { type: 'string', required: false, default: '4 hours' },
        faultResolution: { type: 'string', required: false, default: '3 business days' },
        creditCap: { type: 'number', required: false, default: 25 },
      },
      contract: {
        term: { type: 'string', required: true, example: 'Month-to-month' },
        noticePeriod: { type: 'number', required: false, default: 30 },
        commencementDate: { type: 'string', required: true, format: 'ISO date', example: '2026-03-01' },
        contractNumber: { type: 'string', required: false, description: 'Auto-generated if not provided' },
      },
      equipment: {
        description: { type: 'string', required: false },
        ownership: { type: 'string', required: false, default: 'CircleTel retains ownership' },
        returnPeriod: { type: 'string', required: false, default: '14 days after termination' },
        replacementFee: { type: 'number', required: false, default: 2500 },
      },
    },
    example: {
      customer: {
        companyName: 'Delphius (Pty) Ltd',
        contactPerson: 'P.J Phike',
        email: 'pj@delphius.co.za',
        address: 'Unit F2, Tilbury Business Park, 16th Road, Randjespark, Midrand, 1685',
      },
      service: {
        type: 'Managed Business Connectivity',
        speedDown: 100,
        speedUp: 40,
        dataPolicy: 'Truly Uncapped (No FUP)',
        staticIp: true,
        router: 'Business router with cloud management',
        monitoring: '24/7 proactive monitoring + monthly reports',
      },
      pricing: {
        monthlyFee: 1899,
        installationFee: 3500,
        vatRate: 0.15,
      },
      sla: {
        uptimeGuarantee: 99.5,
        faultResponse: '4 hours',
        faultResolution: '3 business days',
        creditCap: 25,
      },
      contract: {
        term: 'Month-to-month',
        noticePeriod: 30,
        commencementDate: '2026-03-01',
      },
      equipment: {
        description: 'Business router with cloud management',
        ownership: 'CircleTel retains ownership',
        returnPeriod: '14 days after termination',
        replacementFee: 2500,
      },
    },
  });
}
