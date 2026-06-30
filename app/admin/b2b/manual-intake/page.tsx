"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  PiArrowRightBold,
  PiBankBold,
  PiBuildingsBold,
  PiCheckCircleBold,
  PiClipboardTextBold,
  PiFileTextBold,
  PiFloppyDiskBold,
  PiMagnifyingGlassBold,
  PiUserCircleBold,
  PiUploadSimpleBold,
  PiXBold,
} from "react-icons/pi";
import { UploadDocumentModal } from "@/components/admin/onboarding/UploadDocumentModal";
import { PageHeader, SectionCard, StatusBadge } from "@/components/backend";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type BillingDay = "1" | "15" | "20" | "25";

interface FormState {
  customerId: string;
  submissionId: string;
  serviceId: string;
  paymentMethodId: string;
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

interface CustomerSearchResult {
  id: string;
  accountNumber: string | null;
  businessName: string;
  email: string | null;
  phone: string | null;
  registrationNumber: string | null;
  onboardingStatus: string | null;
}

interface SelectedCustomer extends CustomerSearchResult {
  latestSubmissionId?: string | null;
  activeServiceId?: string | null;
  paymentMethodId?: string | null;
  paymentLastFour?: string | null;
}

interface ManualIntakePrefill {
  customer: SelectedCustomer;
  form: Partial<FormState>;
}

const initialState: FormState = {
  customerId: "",
  submissionId: "",
  serviceId: "",
  paymentMethodId: "",
  segment: "unjani",
  businessName: "",
  entityType: "Private Company",
  registrationNumber: "",
  vatRegistered: false,
  vatNumber: "",
  registeredAddress: "",
  contactName: "",
  email: "",
  phone: "",
  clinicName: "",
  province: "",
  siteAddress: "",
  packageName: "CircleTel ClinicConnect",
  serviceType: "managed_connectivity",
  monthlyPrice: "450",
  activationDate: "",
  billingDay: "25",
  includeDebitOrder: true,
  accountHolderName: "",
  bankName: "",
  accountType: "Cheque",
  accountNumber: "",
  branchCode: "",
};

function trimOrUndefined(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function authHeaders() {
  return {
    Authorization: `Bearer ${localStorage.getItem("admin_token") || ""}`,
  };
}

function hasTypedFormValues(form: FormState) {
  return (Object.keys(initialState) as (keyof FormState)[]).some((key) => {
    const current = form[key];
    const initial = initialState[key];
    if (typeof current === "string") {
      return current.trim().length > 0 && current !== initial;
    }
    return current !== initial;
  });
}

function Field({
  id,
  label,
  children,
  className,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label
        htmlFor={id}
        className="text-xs font-semibold uppercase tracking-wide text-gray-500"
      >
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
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<
    CustomerSearchResult[]
  >([]);
  const [customerSearching, setCustomerSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] =
    useState<SelectedCustomer | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);

  const serviceMonthlyPrice = useMemo(() => {
    const parsed = Number(form.monthlyPrice);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [form.monthlyPrice]);

  const canUploadDocuments = form.customerId.trim().length > 0;
  const documentCustomerName =
    form.businessName ||
    form.clinicName ||
    selectedCustomer?.businessName ||
    "Business customer";
  const accountLabel =
    selectedCustomer?.accountNumber ||
    result?.accountNumber ||
    (form.customerId ? "Customer linked" : "New customer");
  const linkedRecords = [
    {
      label: "Customer",
      value: form.customerId ? accountLabel : "Will be created on save",
      ready: Boolean(form.customerId),
    },
    {
      label: "Submission",
      value: form.submissionId ? "Linked" : "Will be created or matched",
      ready: Boolean(form.submissionId),
    },
    {
      label: "Active service",
      value: form.serviceId ? "Linked" : "Will be created or updated",
      ready: Boolean(form.serviceId),
    },
    {
      label: "Debit order",
      value: form.paymentMethodId
        ? `Linked${selectedCustomer?.paymentLastFour ? ` ending ${selectedCustomer.paymentLastFour}` : ""}`
        : form.includeDebitOrder
          ? "Capture required"
          : "Not captured",
      ready: Boolean(form.paymentMethodId) || !form.includeDebitOrder,
    },
  ];

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleCustomerSearch() {
    const query = customerSearch.trim();
    if (query.length < 2) {
      toast.error("Enter at least 2 characters to search");
      return;
    }

    setCustomerSearching(true);
    try {
      const response = await fetch(
        `/api/admin/b2b/manual-intake?q=${encodeURIComponent(query)}`,
        { headers: authHeaders() },
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Customer search failed");
      }
      setCustomerResults(data.results || []);
      if ((data.results || []).length === 0) {
        toast.info("No existing business customers found");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Customer search failed",
      );
    } finally {
      setCustomerSearching(false);
    }
  }

  async function loadCustomerPrefill(customerId: string) {
    if (
      hasTypedFormValues(form) &&
      !window.confirm(
        "Replace the current form fields with this customer record?",
      )
    ) {
      return;
    }

    setCustomerSearching(true);
    try {
      const response = await fetch(
        `/api/admin/b2b/manual-intake?customerId=${encodeURIComponent(customerId)}`,
        { headers: authHeaders() },
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Customer details could not be loaded");
      }

      const prefill = data.prefill as ManualIntakePrefill;
      setForm((current) => ({ ...current, ...prefill.form }));
      setSelectedCustomer(prefill.customer);
      setResult(null);
      setCustomerResults([]);
      setCustomerSearch(prefill.customer.businessName);
      toast.success("Customer details loaded into manual intake");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Customer details could not be loaded",
      );
    } finally {
      setCustomerSearching(false);
    }
  }

  function clearSelectedCustomer() {
    setForm(initialState);
    setSelectedCustomer(null);
    setCustomerResults([]);
    setCustomerSearch("");
    setResult(null);
    setUploadedCount(0);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setResult(null);

    const payload = {
      customerId: trimOrUndefined(form.customerId),
      submissionId: trimOrUndefined(form.submissionId),
      segment: form.segment,
      business: {
        businessName: form.businessName.trim(),
        entityType: form.entityType,
        registrationNumber: form.registrationNumber.trim(),
        vatRegistered: form.vatRegistered,
        vatNumber: form.vatRegistered
          ? trimOrUndefined(form.vatNumber)
          : undefined,
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
        serviceId: trimOrUndefined(form.serviceId),
        packageName: form.packageName.trim(),
        serviceType: form.serviceType.trim(),
        monthlyPrice: serviceMonthlyPrice || 450,
        activationDate: trimOrUndefined(form.activationDate),
        billingDay: form.billingDay,
      },
      debitOrder: form.includeDebitOrder
        ? {
            paymentMethodId: trimOrUndefined(form.paymentMethodId),
            accountHolderName: form.accountHolderName.trim(),
            bankName: form.bankName.trim(),
            accountType: form.accountType,
            accountNumber: form.accountNumber.trim(),
            branchCode: form.branchCode.trim(),
          }
        : undefined,
    };

    try {
      const response = await fetch("/api/admin/b2b/manual-intake", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admin_token") || ""}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Manual intake failed");
      }
      const intake = data.intake as IntakeResult;
      setResult(intake);
      setForm((current) => ({
        ...current,
        customerId: intake.customerId,
        submissionId: intake.submissionId,
        serviceId: intake.serviceId ?? current.serviceId,
        paymentMethodId: intake.paymentMethodId ?? current.paymentMethodId,
      }));
      setSelectedCustomer((current) => ({
        id: intake.customerId,
        accountNumber: intake.accountNumber,
        businessName: form.businessName,
        email: form.email,
        phone: form.phone,
        registrationNumber: form.registrationNumber,
        onboardingStatus: current?.onboardingStatus ?? "submitted",
        latestSubmissionId: intake.submissionId,
        activeServiceId: intake.serviceId ?? current?.activeServiceId ?? null,
        paymentMethodId:
          intake.paymentMethodId ?? current?.paymentMethodId ?? null,
        paymentLastFour: current?.paymentLastFour ?? null,
      }));
      toast.success(
        intake.createdCustomer
          ? `Business customer created: ${intake.accountNumber || intake.customerId}`
          : "Business customer updated",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Manual intake failed",
      );
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
        <form
          id="manual-b2b-intake-form"
          className="space-y-6"
          onSubmit={handleSubmit}
        >
          <SectionCard
            title="Customer Record"
            icon={PiClipboardTextBold}
            action={
              selectedCustomer ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearSelectedCustomer}
                >
                  <PiXBold className="h-4 w-4" />
                  Clear
                </Button>
              ) : null
            }
          >
            <div className="space-y-5">
              <div className="space-y-3">
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                  <Field id="customerSearch" label="Find existing customer">
                    <Input
                      id="customerSearch"
                      value={customerSearch}
                      onChange={(event) =>
                        setCustomerSearch(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void handleCustomerSearch();
                        }
                      }}
                      placeholder="Search name, account number, email, phone, or registration"
                    />
                  </Field>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void handleCustomerSearch()}
                      disabled={customerSearching}
                    >
                      <PiMagnifyingGlassBold className="h-4 w-4" />
                      {customerSearching ? "Searching..." : "Search"}
                    </Button>
                  </div>
                </div>

                {customerResults.length > 0 && (
                  <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
                    {customerResults.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => void loadCustomerPrefill(customer.id)}
                        className="flex w-full items-center justify-between gap-3 border-b border-gray-100 px-3 py-2.5 text-left last:border-b-0 hover:bg-gray-50"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-gray-900">
                            {customer.businessName}
                          </span>
                          <span className="block truncate text-sm text-gray-600">
                            {customer.accountNumber || "No account number"}
                            {customer.email ? ` - ${customer.email}` : ""}
                            {customer.phone ? ` - ${customer.phone}` : ""}
                          </span>
                        </span>
                        {customer.onboardingStatus && (
                          <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                            {customer.onboardingStatus.replace(/_/g, " ")}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {selectedCustomer && (
                  <div className="flex items-start gap-3 rounded-md border border-gray-200 border-l-4 border-l-circleTel-orange bg-gray-50 px-3 py-3 text-sm">
                    <PiUserCircleBold className="mt-0.5 h-5 w-5 shrink-0 text-circleTel-orange" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold text-gray-900">
                          {selectedCustomer.businessName}
                        </p>
                        <span className="rounded-full bg-circleTel-orange-light px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-circleTel-orange-dark">
                          Linked
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-gray-600">
                        {selectedCustomer.accountNumber || "No account number"}
                        {selectedCustomer.email
                          ? ` - ${selectedCustomer.email}`
                          : ""}
                        {selectedCustomer.phone
                          ? ` - ${selectedCustomer.phone}`
                          : ""}
                      </p>
                    </div>
                  </div>
                )}

                {!selectedCustomer && !form.customerId && (
                  <div className="flex items-start gap-3 rounded-md border border-dashed border-gray-200 px-3 py-3 text-sm">
                    <PiUserCircleBold className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
                    <div>
                      <p className="font-semibold text-gray-900">
                        New business customer
                      </p>
                      <p className="mt-0.5 text-gray-500">
                        Leave unlinked to create a new customer when this intake
                        is saved.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field id="segment" label="Segment">
                  <Select
                    value={form.segment}
                    onValueChange={(value) => update("segment", value)}
                  >
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
                    onChange={(event) =>
                      update("businessName", event.target.value)
                    }
                    required
                  />
                </Field>
                <Field id="entityType" label="Entity type">
                  <Select
                    value={form.entityType}
                    onValueChange={(value) => update("entityType", value)}
                  >
                    <SelectTrigger id="entityType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Private Company">
                        Private Company
                      </SelectItem>
                      <SelectItem value="Sole Proprietor">
                        Sole Proprietor
                      </SelectItem>
                      <SelectItem value="Non-Profit Company">
                        Non-Profit Company
                      </SelectItem>
                      <SelectItem value="Partnership">Partnership</SelectItem>
                      <SelectItem value="Trust">Trust</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field id="registrationNumber" label="Registration or owner ID">
                  <Input
                    id="registrationNumber"
                    value={form.registrationNumber}
                    onChange={(event) =>
                      update("registrationNumber", event.target.value)
                    }
                    required
                  />
                </Field>
                <Field id="vatNumber" label="VAT number">
                  <div className="flex gap-3">
                    <div className="flex h-10 items-center gap-2 rounded-md border border-gray-200 px-3">
                      <Checkbox
                        id="vatRegistered"
                        checked={form.vatRegistered}
                        onCheckedChange={(checked) =>
                          update("vatRegistered", checked === true)
                        }
                      />
                      <Label
                        htmlFor="vatRegistered"
                        className="text-sm text-gray-700"
                      >
                        VAT
                      </Label>
                    </div>
                    <Input
                      id="vatNumber"
                      value={form.vatNumber}
                      onChange={(event) =>
                        update("vatNumber", event.target.value)
                      }
                      disabled={!form.vatRegistered}
                    />
                  </div>
                </Field>
                <Field
                  id="registeredAddress"
                  label="Registered address"
                  className="md:col-span-2"
                >
                  <Textarea
                    id="registeredAddress"
                    value={form.registeredAddress}
                    onChange={(event) =>
                      update("registeredAddress", event.target.value)
                    }
                    required
                    className="min-h-24"
                  />
                </Field>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Contact And Site" icon={PiBuildingsBold}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field id="contactName" label="Authorized contact">
                <Input
                  id="contactName"
                  value={form.contactName}
                  onChange={(event) =>
                    update("contactName", event.target.value)
                  }
                  required
                />
              </Field>
              <Field id="email" label="Email">
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => update("email", event.target.value)}
                  required
                />
              </Field>
              <Field id="phone" label="Phone">
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(event) => update("phone", event.target.value)}
                  required
                />
              </Field>
              <Field id="clinicName" label="Trading or clinic name">
                <Input
                  id="clinicName"
                  value={form.clinicName}
                  onChange={(event) => update("clinicName", event.target.value)}
                />
              </Field>
              <Field id="province" label="Province">
                <Input
                  id="province"
                  value={form.province}
                  onChange={(event) => update("province", event.target.value)}
                />
              </Field>
              <Field
                id="siteAddress"
                label="Service address"
                className="md:col-span-2"
              >
                <Textarea
                  id="siteAddress"
                  value={form.siteAddress}
                  onChange={(event) =>
                    update("siteAddress", event.target.value)
                  }
                  className="min-h-20"
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Billable Service" icon={PiCheckCircleBold}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field id="packageName" label="Package">
                <Input
                  id="packageName"
                  value={form.packageName}
                  onChange={(event) =>
                    update("packageName", event.target.value)
                  }
                  required
                />
              </Field>
              <Field id="serviceType" label="Service type">
                <Input
                  id="serviceType"
                  value={form.serviceType}
                  onChange={(event) =>
                    update("serviceType", event.target.value)
                  }
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
                  onChange={(event) =>
                    update("monthlyPrice", event.target.value)
                  }
                  required
                />
              </Field>
              <Field id="billingDay" label="Billing day">
                <Select
                  value={form.billingDay}
                  onValueChange={(value) =>
                    update("billingDay", value as BillingDay)
                  }
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
                  onChange={(event) =>
                    update("activationDate", event.target.value)
                  }
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
                  onCheckedChange={(checked) =>
                    update("includeDebitOrder", checked === true)
                  }
                />
                <Label
                  htmlFor="includeDebitOrder"
                  className="text-sm text-gray-700"
                >
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
                  onChange={(event) =>
                    update("accountHolderName", event.target.value)
                  }
                  required={form.includeDebitOrder}
                  disabled={!form.includeDebitOrder}
                />
              </Field>
              <Field id="bankName" label="Bank">
                <Input
                  id="bankName"
                  value={form.bankName}
                  onChange={(event) => update("bankName", event.target.value)}
                  required={form.includeDebitOrder}
                  disabled={!form.includeDebitOrder}
                />
              </Field>
              <Field id="accountType" label="Account type">
                <Select
                  value={form.accountType}
                  onValueChange={(value) => update("accountType", value)}
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
                  onChange={(event) =>
                    update("accountNumber", event.target.value)
                  }
                  required={form.includeDebitOrder}
                  disabled={!form.includeDebitOrder}
                />
              </Field>
              <Field id="branchCode" label="Branch code">
                <Input
                  id="branchCode"
                  value={form.branchCode}
                  onChange={(event) => update("branchCode", event.target.value)}
                  required={form.includeDebitOrder}
                  disabled={!form.includeDebitOrder}
                />
              </Field>
            </div>
          </SectionCard>
        </form>

        <aside className="space-y-4">
          <SectionCard
            title="Capture Status"
            icon={PiClipboardTextBold}
            compact
          >
            <div className="space-y-4">
              <StatusBadge
                status={
                  result
                    ? result.createdCustomer
                      ? "New customer"
                      : "Updated customer"
                    : "Not saved"
                }
                variant={result ? "success" : "neutral"}
              />
              {result ? (
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Account
                    </p>
                    <p className="font-medium text-gray-900">
                      {result.accountNumber || documentCustomerName}
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="justify-between"
                    >
                      <Link href={`/admin/customers/${result.customerId}`}>
                        Customer Record
                        <PiArrowRightBold className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="justify-between"
                    >
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
                  <StatusBadge
                    status="Service order pending"
                    variant="warning"
                  />
                </div>
              )}

              <div className="border-t border-gray-100 pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Linked records
                </p>
                <div className="space-y-2">
                  {linkedRecords.map((record) => (
                    <div
                      key={record.label}
                      className="flex items-start justify-between gap-3 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900">
                          {record.label}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {record.value}
                        </p>
                      </div>
                      <span
                        className={
                          record.ready
                            ? "mt-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
                            : "mt-0.5 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600"
                        }
                      >
                        {record.ready ? "Ready" : "Pending"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                form="manual-b2b-intake-form"
                disabled={saving}
                className="w-full bg-circleTel-orange text-white hover:bg-circleTel-orange-dark"
              >
                <PiFloppyDiskBold className="h-4 w-4" />
                {saving ? "Saving..." : "Save intake"}
              </Button>
            </div>
          </SectionCard>

          <SectionCard title="Documents" icon={PiUploadSimpleBold} compact>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Upload target
                </p>
                <p className="font-medium text-gray-900">
                  {canUploadDocuments
                    ? documentCustomerName
                    : "No customer selected"}
                </p>
                {uploadedCount > 0 && (
                  <p className="mt-1 text-xs font-medium text-emerald-700">
                    {uploadedCount} document{uploadedCount === 1 ? "" : "s"}{" "}
                    uploaded in this session
                  </p>
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full justify-between"
                disabled={!canUploadDocuments}
                onClick={() => setUploadOpen(true)}
              >
                Upload documents
                <PiUploadSimpleBold className="h-4 w-4" />
              </Button>

              {!canUploadDocuments && (
                <p className="text-xs leading-5 text-gray-500">
                  Select an existing customer or save this intake first.
                </p>
              )}
            </div>
          </SectionCard>
        </aside>
      </div>

      {canUploadDocuments && (
        <UploadDocumentModal
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          customerId={form.customerId}
          clinicName={documentCustomerName}
          submissionId={trimOrUndefined(form.submissionId)}
          defaultSegment={form.segment}
          authHeaders={authHeaders}
          onUploaded={(count) => {
            if (count > 0) setUploadedCount((current) => current + count);
          }}
        />
      )}
    </main>
  );
}
