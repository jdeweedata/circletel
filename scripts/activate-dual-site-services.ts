#!/usr/bin/env npx tsx
/**
 * Activate Delphius + New ExGen as billable customer_services + first invoices.
 *
 * Idempotent: skips if an active service already exists for the Interstellio connection_id.
 *
 * Usage:
 *   set -a && source .env.local && source .env.production.local && set +a
 *   npx tsx scripts/activate-dual-site-services.ts
 *   npx tsx scripts/activate-dual-site-services.ts --dry-run
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

config({ path: '.env.production.local' })
config({ path: '.env.local' })

const DRY_RUN = process.argv.includes('--dry-run')
const VAT_RATE = 0.15

const SITES = [
  {
    key: 'delphius',
    businessName: 'Delphius (Pty) Ltd',
    firstName: 'P.J',
    lastName: 'Phike',
    email: 'pj@delphius.co.za',
    phone: '0100000000',
    address: 'Unit F2, Tilbury Business Park, 16th Road, Randjespark, Midrand, 1685',
    packageName: 'SkyFibre Business 100',
    packageSku: 'SF-BIZ-100',
    serviceType: 'SkyFibre',
    productCategory: 'connectivity',
    providerName: 'MTN Tarana',
    providerCode: 'MTN_TARANA',
    speedDown: 100,
    speedUp: 40,
    monthlyPrice: 1899,
    setupFee: 3500,
    billingStartDate: '2026-03-01',
    activationDate: '2026-03-01',
    contractMonths: 0,
    connectionId: '361d49c6-43b1-11f1-95c3-00163ed48379',
    pppoeUsername: 'DelphiusCT-Midrand@circletel.co.za',
    omadaSite: 'Delphius',
    omadaGatewayMac: '10-5A-95-7C-ED-D5',
    omadaSwitchMac: 'A8-29-48-E4-A1-2C',
    contractRef: 'CT-2026-001',
    createCatalogPackage: true,
  },
  {
    key: 'newexgen',
    businessName: 'New ExGen',
    firstName: 'New',
    lastName: 'ExGen',
    email: 'billing@newgenmc.co.za',
    phone: '0112620000',
    address: 'Imagine House, 2 Mellis Road, Rivonia, Sandton, 2191',
    packageName: 'DFA BizFibreConnect 100Mbps',
    packageSku: 'DFA-BFC-100',
    serviceType: 'BizFibreConnect',
    productCategory: 'fibre_business',
    providerName: 'DFA',
    providerCode: 'DFA',
    speedDown: 100,
    speedUp: 100,
    monthlyPrice: 2999,
    setupFee: 0,
    billingStartDate: '2026-08-02',
    activationDate: '2026-08-02',
    contractMonths: 0,
    connectionId: '68822698-43b1-11f1-95c3-00163ed48379',
    pppoeUsername: 'NewExGenCT-Rivonia@circletel.co.za',
    omadaSite: 'NewGenMC',
    omadaGatewayMac: '10-5A-95-7C-EE-53',
    omadaSwitchMac: 'A8-29-48-E4-A1-CB',
    contractRef: 'CT-NEWEXGEN-2026-001',
    createCatalogPackage: false,
    existingPackageId: '5adff57d-90cd-4dc0-b099-41d47d657abf',
  },
] as const

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  return createClient(url, key, { auth: { persistSession: false } })
}

function money(n: number) {
  return Math.round(n * 100) / 100
}

function periodEnd(start: string): string {
  const d = new Date(`${start}T00:00:00Z`)
  d.setUTCMonth(d.getUTCMonth() + 1)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

async function ensurePackage(
  supabase: ReturnType<typeof getSupabase>,
  site: (typeof SITES)[number]
): Promise<string | null> {
  if ('existingPackageId' in site && site.existingPackageId) {
    return site.existingPackageId
  }

  const { data: existing } = await supabase
    .from('service_packages')
    .select('id')
    .eq('sku', site.packageSku)
    .maybeSingle()

  if (existing?.id) return existing.id

  if (!site.createCatalogPackage) return null

  if (DRY_RUN) {
    console.log(`[dry-run] would create package ${site.packageSku}`)
    return null
  }

  const { data, error } = await supabase
    .from('service_packages')
    .insert({
      name: site.packageName,
      sku: site.packageSku,
      service_type: site.serviceType,
      product_category: site.productCategory,
      speed_down: site.speedDown,
      speed_up: site.speedUp,
      price: site.monthlyPrice,
      active: true,
      status: 'active',
      description: `${site.packageName} — managed business connectivity (CT dual-site activation)`,
    })
    .select('id')
    .single()

  if (error) throw new Error(`Failed to create package ${site.packageSku}: ${error.message}`)
  return data.id
}

async function ensureCustomer(
  supabase: ReturnType<typeof getSupabase>,
  site: (typeof SITES)[number]
): Promise<string> {
  const { data: byEmail } = await supabase
    .from('customers')
    .select('id, business_name, email')
    .eq('email', site.email)
    .maybeSingle()

  if (byEmail?.id) {
    if (!DRY_RUN && !byEmail.business_name) {
      await supabase
        .from('customers')
        .update({
          business_name: site.businessName,
          account_type: 'business',
          account_status: 'active',
          status: 'active',
        })
        .eq('id', byEmail.id)
    }
    return byEmail.id
  }

  const { data: byBiz } = await supabase
    .from('customers')
    .select('id')
    .ilike('business_name', site.businessName)
    .maybeSingle()

  if (byBiz?.id) return byBiz.id

  if (DRY_RUN) {
    console.log(`[dry-run] would create customer ${site.businessName} <${site.email}>`)
    return '00000000-0000-0000-0000-000000000000'
  }

  const { data, error } = await supabase
    .from('customers')
    .insert({
      first_name: site.firstName,
      last_name: site.lastName,
      email: site.email,
      phone: site.phone || '0000000000',
      business_name: site.businessName,
      account_type: 'business',
      account_status: 'active',
      status: 'active',
      email_verified: false,
    })
    .select('id')
    .single()

  if (error) throw new Error(`Failed to create customer ${site.businessName}: ${error.message}`)
  return data.id
}

async function ensureService(
  supabase: ReturnType<typeof getSupabase>,
  site: (typeof SITES)[number],
  customerId: string,
  packageId: string | null
): Promise<{ serviceId: string; created: boolean }> {
  const { data: existing } = await supabase
    .from('customer_services')
    .select('id, status, active, monthly_price')
    .eq('connection_id', site.connectionId)
    .maybeSingle()

  if (existing?.id) {
    if (existing.status !== 'active' || !existing.active) {
      if (!DRY_RUN) {
        await supabase
          .from('customer_services')
          .update({
            status: 'active',
            active: true,
            monthly_price: site.monthlyPrice,
            billing_start_date: site.billingStartDate,
            activation_date: site.activationDate,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
      }
      console.log(`Reactivated service ${existing.id} for ${site.key}`)
    } else {
      console.log(`Service already active for ${site.key}: ${existing.id}`)
    }
    return { serviceId: existing.id, created: false }
  }

  if (DRY_RUN) {
    console.log(`[dry-run] would create customer_services for ${site.key}`)
    return { serviceId: '00000000-0000-0000-0000-000000000001', created: true }
  }

  const { data, error } = await supabase
    .from('customer_services')
    .insert({
      customer_id: customerId,
      package_id: packageId,
      package_name: site.packageName,
      service_type: site.serviceType,
      product_category: site.productCategory,
      monthly_price: site.monthlyPrice,
      setup_fee: site.setupFee,
      status: 'active',
      active: true,
      installation_address: site.address,
      installation_date: site.activationDate,
      activation_date: site.activationDate,
      billing_start_date: site.billingStartDate,
      billing_day: 1,
      speed_down: site.speedDown,
      speed_up: site.speedUp,
      provider_code: site.providerCode,
      provider_name: site.providerName,
      contract_months: site.contractMonths || null,
      contract_start_date: site.billingStartDate,
      connection_id: site.connectionId,
    })
    .select('id')
    .single()

  if (error) throw new Error(`Failed to create service for ${site.key}: ${error.message}`)
  return { serviceId: data.id, created: true }
}

async function ensureIdentifiers(
  supabase: ReturnType<typeof getSupabase>,
  serviceId: string,
  site: (typeof SITES)[number]
) {
  if (DRY_RUN || serviceId.startsWith('00000000')) return

  // Allowed types observed in prod: interstellio_uuid, tarana_serial, ruijie_sn, iccid
  const rows = [
    {
      identifier_type: 'interstellio_uuid',
      identifier_value: site.connectionId,
      source: `activation_script:${site.omadaSite}:${site.omadaGatewayMac}:${site.pppoeUsername}:${site.contractRef}`,
    },
  ]

  for (const row of rows) {
    const { data: existing } = await supabase
      .from('service_network_identifiers')
      .select('id')
      .eq('service_id', serviceId)
      .eq('identifier_type', row.identifier_type)
      .eq('identifier_value', row.identifier_value)
      .maybeSingle()

    if (existing?.id) continue

    const { error } = await supabase.from('service_network_identifiers').insert({
      service_id: serviceId,
      ...row,
    })
    if (error) {
      console.warn(`SNI ${row.identifier_type} warn: ${error.message}`)
    }
  }
}

async function ensureInvoice(
  supabase: ReturnType<typeof getSupabase>,
  site: (typeof SITES)[number],
  customerId: string,
  serviceId: string
): Promise<string | null> {
  const { data: existing } = await supabase
    .from('customer_invoices')
    .select('id, invoice_number, status')
    .eq('service_id', serviceId)
    .eq('invoice_type', 'recurring')
    .limit(1)
    .maybeSingle()

  if (existing?.id) {
    console.log(`Invoice already exists for ${site.key}: ${existing.invoice_number}`)
    return existing.id
  }

  const lineItems: Array<Record<string, unknown>> = [
    {
      description: `${site.packageName} — ${site.address}`,
      quantity: 1,
      unit_price: site.monthlyPrice,
      amount: site.monthlyPrice,
      total: site.monthlyPrice,
    },
  ]

  if (site.setupFee > 0) {
    lineItems.push({
      description: `Installation — ${site.contractRef}`,
      quantity: 1,
      unit_price: site.setupFee,
      amount: site.setupFee,
      total: site.setupFee,
    })
  }

  const subtotal = money(lineItems.reduce((s, i) => s + Number(i.amount), 0))
  const tax = money(subtotal * VAT_RATE)
  const total = money(subtotal + tax)
  const period_start = site.billingStartDate
  const period_end = periodEnd(site.billingStartDate)

  if (DRY_RUN) {
    console.log(`[dry-run] would invoice ${site.key}: R${total} incl. VAT`)
    return null
  }

  const due = new Date()
  due.setDate(due.getDate() + 7)

  // Prefer next number after max existing INV-YYYY-##### (RPC sequence can be stale)
  const year = new Date().getFullYear()
  const prefix = `INV-${year}-`
  const { data: latestRows } = await supabase
    .from('customer_invoices')
    .select('invoice_number')
    .like('invoice_number', `${prefix}%`)
    .order('invoice_number', { ascending: false })
    .limit(50)

  let nextSeq = 1
  for (const row of latestRows || []) {
    const m = String(row.invoice_number).match(/^INV-\d{4}-0*(\d+)$/)
    if (m) nextSeq = Math.max(nextSeq, parseInt(m[1], 10) + 1)
  }
  const invNum = `${prefix}${String(nextSeq).padStart(5, '0')}`

  const { data, error } = await supabase
    .from('customer_invoices')
    .insert({
      customer_id: customerId,
      service_id: serviceId,
      invoice_number: invNum as string,
      invoice_type: 'recurring',
      invoice_date: new Date().toISOString().slice(0, 10),
      due_date: due.toISOString().slice(0, 10),
      period_start,
      period_end,
      subtotal,
      vat_rate: VAT_RATE * 100,
      tax_amount: tax,
      total_amount: total,
      amount_paid: 0,
      amount_due: total,
      line_items: lineItems,
      status: 'sent',
      notes: `Dual-site activation ${site.contractRef}; Interstellio ${site.connectionId}; Omada ${site.omadaSite}`,
    })
    .select('id, invoice_number')
    .single()

  if (error) throw new Error(`Failed to create invoice for ${site.key}: ${error.message}`)
  console.log(`Created invoice ${data.invoice_number} for ${site.key}`)
  return data.id
}

async function main() {
  const supabase = getSupabase()
  const results: Record<string, unknown>[] = []

  console.log(DRY_RUN ? 'DRY RUN — no writes\n' : 'Activating dual-site billable services\n')

  for (const site of SITES) {
    console.log(`── ${site.key} ──`)
    const packageId = await ensurePackage(supabase, site)
    const customerId = await ensureCustomer(supabase, site)
    const { serviceId, created } = await ensureService(supabase, site, customerId, packageId)
    await ensureIdentifiers(supabase, serviceId, site)
    const invoiceId = await ensureInvoice(supabase, site, customerId, serviceId)

    results.push({
      key: site.key,
      customerId,
      packageId,
      serviceId,
      serviceCreated: created,
      invoiceId,
      connectionId: site.connectionId,
      monthlyPrice: site.monthlyPrice,
    })
  }

  const outDir = join(process.cwd(), '.docs', 'ops')
  mkdirSync(outDir, { recursive: true })
  const outPath = join(outDir, `2026-08-02-dual-site-activation-result.json`)
  writeFileSync(outPath, JSON.stringify({ dryRun: DRY_RUN, activatedAt: new Date().toISOString(), results }, null, 2))
  console.log('\nWrote', outPath)
  console.log(JSON.stringify(results, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
