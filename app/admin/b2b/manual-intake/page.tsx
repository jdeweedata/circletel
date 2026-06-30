'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  PiArrowRightBold,
  PiBankBold,
  PiBuildingsBold,
  PiCheckCircleBold,
  PiClipboardTextBold,
  PiFileTextBold,
  PiFloppyDiskBold,
} from 'react-icons/pi';
import { PageHeader, SectionCard, StatusBadge } from '@/components/backend';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type BillingDay = '1' | '15' | '20' | '25';

interface FormState {
  customerId: string;
  segment: string;
  businessName: string;
  entityType: string;
  registrationNumber: string;
  vatRegistered: boolean;
  vatNumber: string;
  registeredAddress: string;
  contactName: string;
  email: string;
  phone: string;
  clinicName: string;
  province: string;
  siteAddress: string;
  packageName: string;
  serviceType: string;
  monthlyPrice: string;
  activationDate: string;
  billingDay: BillingDay;
  includeDebitOrder: boolean;
  accountHolderName: string;
  bankName: string;
  accountType: string;
  accountNumber: string;
  branchCode: string;
}

interface IntakeResult {
  customerId: string;
  accountNumber: string | null;
  submissionId: string;
  createdCustomer: boolean;
  createdSubmission: boolean;
  serviceId?: string;
  paymentMethodId?: string;
}

const initialState: FormState = {
  customerId: '',
  segment: 'unjani',
  businessName: '',
  entityType: 'Private Company',
  registrationNumber: '',
  vatRegistered: false,
  vatNumber: '',
  registeredAddress: '',
  contactName: '',
  email: '',
  phone: '',
  clinicName: '',
  province: '',
  siteAddress: '',
  packageName: 'CircleTel ClinicConnect',
  serviceType: 'managed_connectivity',
  monthlyPrice: '450',
  activationDate: '',
  billingDay: '25',
  includeDebitOrder: true,
  accountHolderName: '',
  bankName: '',
  accountType: 'Cheque',
  accountNumber: '',
  branchCode: '',
};

function trimOrUndefined(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </Label>
      {children}
    </div>
  );
}

export default function ManualB2BIntakePage() {
  const [form, setForm] = useState<FormState>(initialState);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<IntakeResult | null>(null);

  const serviceMonthlyPrice = useMemo(() => {
    const parsed = Number(form.monthlyPrice);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [form.monthlyPrice]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setResult(null);

    const payload = {
      customerId: trimOrUndefined(form.customerId),
      segment: form.segment,
      business: {
        businessName: form.businessName.trim(),
        entityType: form.entityType,
        registrationNumber: form.registrationNumber.trim(),
        vatRegistered: form.vatRegistered,
        vatNumber: form.vatRegistered ? trimOrUndefined(form.vatNumber) : undefined,
        registeredAddress: form.registeredAddress.trim(),
      },
      contact: {
        contactName: form.contactName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      },
      site: {
        clinicName: trimOrUndefined(form.clinicName),
        province: trimOrUndefined(form.province),
        siteAddress: trimOrUndefined(form.siteAddress),
      },
      service: {
        packageName: form.packageName.trim(),
        serviceType: form.serviceType.trim(),
        monthlyPrice: serviceMonthlyPrice || 450,
        activationDate: trimOrUndefined(form.activationDate),
        billingDay: form.billingDay,
      },
      debitOrder: form.includeDebitOrder
        ? {
            accountHolderName: form.accountHolderName.trim(),
            bankName: form.bankName.trim(),
            accountType: form.accountType,
            accountNumber: form.accountNumber.trim(),
            branchCode: form.branchCode.trim(),
          }
        : undefined,
    };

    try {
      const response = await fetch('/api/admin/b2b/manual-intake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('admin_token') || ''}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Manual intake failed');
      }
      setResult(data.intake);
      toast.success(
        data.intake.createdCustomer
          ? `Business customer created: ${data.intake.accountNumber || data.intake.customerId}`
          : 'Business customer updated'
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Manual intake failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader
        title="Manual B2B Intake"
        subtitle="Admin-assisted capture for emailed onboarding packs"
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/unjani/onboarding">
                <PiBuildingsBold className="mr-2 h-4 w-4" />
                Pipeline
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/b2b/vetting">
                <PiFileTextBold className="mr-2 h-4 w-4" />
                Vetting
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <SectionCard title="Customer Record" icon={PiClipboardTextBold}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field id="customerId" label="Existing customer ID">
                <Input
                  id="customerId"
                  value={form.customerId}
                  onChange={(event) => update('customerId', event.target.value)}
                  placeholder="Leave blank for a new customer"
                />
              </Field>
              <Field id="segment" label="Segment">
                <Select value={form.segment} onValueChange={(value) => update('segment', value)}>
                  <SelectTrigger id="segment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unjani">Unjani</SelectItem>
                    <SelectItem value="smb">SMB</SelectItem>
                    <SelectItem value="edu">Education</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field id="businessName" label="Registered business name">
                <Input
                  id="businessName"
                  value={form.businessName}
                  onChange={(event) => update('businessName', event.target.value)}
                  required
                />
              </Field>
              <Field id="entityType" label="Entity type">
                <Select value={form.entityType} onValueChange={(value) => update('entityType', value)}>
                  <SelectTrigger id="entityType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Private Company">Private Company</SelectItem>
                    <SelectItem value="Sole Proprietor">Sole Proprietor</SelectItem>
                    <SelectItem value="Non-Profit Company">Non-Profit Company</SelectItem>
                    <SelectItem value="Partnership">Partnership</SelectItem>
                    <SelectItem value="Trust">Trust</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field id="registrationNumber" label="Registration or owner ID">
                <Input
                  id="registrationNumber"
                  value={form.registrationNumber}
                  onChange={(event) => update('registrationNumber', event.target.value)}
                  required
                />
              </Field>
              <Field id="vatNumber" label="VAT number">
                <div className="flex gap-3">
                  <div className="flex h-10 items-center gap-2 rounded-md border border-gray-200 px-3">
                    <Checkbox
                      id="vatRegistered"
                      checked={form.vatRegistered}
                      onCheckedChange={(checked) => update('vatRegistered', checked === true)}
                    />
                    <Label htmlFor="vatRegistered" className="text-sm text-gray-700">
                      VAT
                    </Label>
                  </div>
                  <Input
                    id="vatNumber"
                    value={form.vatNumber}
                    onChange={(event) => update('vatNumber', event.target.value)}
                    disabled={!form.vatRegistered}
                  />
                </div>
              </Field>
              <Field id="registeredAddress" label="Registered address">
                <Textarea
                  id="registeredAddress"
                  value={form.registeredAddress}
                  onChange={(event) => update('registeredAddress', event.target.value)}
                  required
                  className="min-h-24 md:col-span-2"
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Contact And Site" icon={PiBuildingsBold}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field id="contactName" label="Authorized contact">
                <Input
                  id="contactName"
                  value={form.contactName}
                  onChange={(event) => update('contactName', event.target.value)}
                  required
                />
              </Field>
              <Field id="email" label="Email">
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => update('email', event.target.value)}
                  required
                />
              </Field>
              <Field id="phone" label="Phone">
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(event) => update('phone', event.target.value)}
                  required
                />
              </Field>
              <Field id="clinicName" label="Trading or clinic name">
                <Input
                  id="clinicName"
                  value={form.clinicName}
                  onChange={(event) => update('clinicName', event.target.value)}
                />
              </Field>
              <Field id="province" label="Province">
                <Input
                  id="province"
                  value={form.province}
                  onChange={(event) => update('province', event.target.value)}
                />
              </Field>
              <Field id="siteAddress" label="Service address">
                <Input
                  id="siteAddress"
                  value={form.siteAddress}
                  onChange={(event) => update('siteAddress', event.target.value)}
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Billable Service" icon={PiCheckCircleBold}>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Field id="packageName" label="Package">
                <Input
                  id="packageName"
                  value={form.packageName}
                  onChange={(event) => update('packageName', event.target.value)}
                  required
                />
              </Field>
              <Field id="serviceType" label="Service type">
                <Input
                  id="serviceType"
                  value={form.serviceType}
                  onChange={(event) => update('serviceType', event.target.value)}
                  required
                />
              </Field>
              <Field id="monthlyPrice" label="Monthly ex VAT">
                <Input
                  id="monthlyPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.monthlyPrice}
                  onChange={(event) => update('monthlyPrice', event.target.value)}
                  required
                />
              </Field>
              <Field id="billingDay" label="Billing day">
                <Select
                  value={form.billingDay}
                  onValueChange={(value) => update('billingDay', value as BillingDay)}
                >
                  <SelectTrigger id="billingDay">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1st</SelectItem>
                    <SelectItem value="15">15th</SelectItem>
                    <SelectItem value="20">20th</SelectItem>
                    <SelectItem value="25">25th</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field id="activationDate" label="Activation date">
                <Input
                  id="activationDate"
                  type="date"
                  value={form.activationDate}
                  onChange={(event) => update('activationDate', event.target.value)}
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            title="Debit Order"
            icon={PiBankBold}
            action={
              <div className="flex items-center gap-2">
                <Checkbox
                  id="includeDebitOrder"
                  checked={form.includeDebitOrder}
                  onCheckedChange={(checked) => update('includeDebitOrder', checked === true)}
                />
                <Label htmlFor="includeDebitOrder" className="text-sm text-gray-700">
                  Capture
                </Label>
              </div>
            }
          >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Field id="accountHolderName" label="Account holder">
                <Input
                  id="accountHolderName"
                  value={form.accountHolderName}
                  onChange={(event) => update('accountHolderName', event.target.value)}
                  required={form.includeDebitOrder}
                  disabled={!form.includeDebitOrder}
                />
              </Field>
              <Field id="bankName" label="Bank">
                <Input
                  id="bankName"
                  value={form.bankName}
                  onChange={(event) => update('bankName', event.target.value)}
                  required={form.includeDebitOrder}
                  disabled={!form.includeDebitOrder}
                />
              </Field>
              <Field id="accountType" label="Account type">
                <Select
                  value={form.accountType}
                  onValueChange={(value) => update('accountType', value)}
                  disabled={!form.includeDebitOrder}
                >
                  <SelectTrigger id="accountType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                    <SelectItem value="Savings">Savings</SelectItem>
                    <SelectItem value="Transmission">Transmission</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field id="accountNumber" label="Account number">
                <Input
                  id="accountNumber"
                  value={form.accountNumber}
                  onChange={(event) => update('accountNumber', event.target.value)}
                  required={form.includeDebitOrder}
                  disabled={!form.includeDebitOrder}
                />
              </Field>
              <Field id="branchCode" label="Branch code">
                <Input
                  id="branchCode"
                  value={form.branchCode}
                  onChange={(event) => update('branchCode', event.target.value)}
                  required={form.includeDebitOrder}
                  disabled={!form.includeDebitOrder}
                />
              </Field>
            </div>
          </SectionCard>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              <PiFloppyDiskBold className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Intake'}
            </Button>
          </div>
        </form>

        <aside className="space-y-4">
          <SectionCard title="Capture Status" icon={PiClipboardTextBold} compact>
            <div className="space-y-4">
              <StatusBadge
                status={result ? (result.createdCustomer ? 'New customer' : 'Updated customer') : 'Not saved'}
                variant={result ? 'success' : 'neutral'}
              />
              {result ? (
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Account
                    </p>
                    <p className="font-medium text-gray-900">{result.accountNumber || result.customerId}</p>
                  </div>
                  <div className="grid gap-2">
                    <Button asChild variant="outline" size="sm" className="justify-between">
                      <Link href={`/admin/customers/${result.customerId}`}>
                        Customer Record
                        <PiArrowRightBold className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="justify-between">
                      <Link href={`/admin/b2b/vetting/${result.submissionId}`}>
                        Vetting Workbench
                        <PiArrowRightBold className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-2">
                  <StatusBadge status="Customer pending" variant="neutral" />
                  <StatusBadge status="Submission pending" variant="neutral" />
                  <StatusBadge status="Service order pending" variant="warning" />
                </div>
              )}
            </div>
          </SectionCard>
        </aside>
      </div>
    </main>
  );
}
