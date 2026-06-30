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
  PiWarningCircleBold,
  PiXBold,
} from "react-icons/pi";
import { UploadDocumentModal } from "@/components/admin/onboarding/UploadDocumentModal";
import { SectionCard } from "@/components/backend";
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
type IntakeStepId =
  | "customer"
  | "contact"
  | "service"
  | "documents"
  | "debit"
  | "review";

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

const intakeSteps: {
  id: IntakeStepId;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: "customer",
    label: "Customer & Business",
    description: "Customer record and legal details",
    icon: PiClipboardTextBold,
  },
  {
    id: "contact",
    label: "Contact & Site",
    description: "Primary contact and service location",
    icon: PiBuildingsBold,
  },
  {
    id: "service",
    label: "Billable Service",
    description: "Commercial package and billing schedule",
    icon: PiCheckCircleBold,
  },
  {
    id: "documents",
    label: "Documents",
    description: "Onboarding pack uploads for vetting",
    icon: PiFileTextBold,
  },
  {
    id: "debit",
    label: "Debit Order",
    description: "Banking details and mandate readiness",
    icon: PiBankBold,
  },
  {
    id: "review",
    label: "Review & Submit",
    description: "Final validation before vetting",
    icon: PiCheckCircleBold,
  },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(value);
}

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

function StepStatusPill({
  ready,
  active,
}: {
  ready: boolean;
  active: boolean;
}) {
  if (ready) {
    return (
      <span className="text-xs font-semibold text-emerald-700">Completed</span>
    );
  }

  return (
    <span
      className={
        active
          ? "text-xs font-semibold text-circleTel-orange"
          : "text-xs text-gray-500"
      }
    >
      {active ? "In progress" : "Not started"}
    </span>
  );
}

function StatusPill({
  ready,
  warning,
  label,
}: {
  ready?: boolean;
  warning?: boolean;
  label?: string;
}) {
  if (ready) {
    return (
      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
        {label ?? "Ready"}
      </span>
    );
  }

  if (warning) {
    return (
      <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-circleTel-orange-dark">
        {label ?? "In progress"}
      </span>
    );
  }

  return (
    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
      {label ?? "Pending"}
    </span>
  );
}

function ReviewRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 whitespace-pre-line text-sm font-medium text-gray-900">
        {value?.trim() || "Not captured"}
      </p>
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
  const [activeStep, setActiveStep] = useState<IntakeStepId>("customer");

  const serviceMonthlyPrice = useMemo(() => {
    const parsed = Number(form.monthlyPrice);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [form.monthlyPrice]);
  const activeStepIndex = intakeSteps.findIndex(
    (step) => step.id === activeStep,
  );
  const activeStepMeta = intakeSteps[activeStepIndex] ?? intakeSteps[0];

  const canUploadDocuments = form.customerId.trim().length > 0;
  const documentCustomerName =
    form.businessName ||
    form.clinicName ||
    selectedCustomer?.businessName ||
    "Business customer";
  const contactLabel =
    [form.email, form.phone].filter(Boolean).join(" - ") || "Contact pending";
  const accountLabel =
    selectedCustomer?.accountNumber ||
    result?.accountNumber ||
    (form.customerId ? "Customer linked" : "New customer");
  const customerReady = Boolean(
    form.businessName.trim() &&
    form.registrationNumber.trim() &&
    form.registeredAddress.trim(),
  );
  const contactReady = Boolean(
    form.contactName.trim() &&
    form.email.trim() &&
    form.phone.trim() &&
    form.siteAddress.trim(),
  );
  const serviceReady = Boolean(
    form.packageName.trim() &&
    form.serviceType.trim() &&
    Number(form.monthlyPrice) > 0,
  );
  const documentsReady = uploadedCount > 0;
  const debitReady =
    !form.includeDebitOrder ||
    Boolean(
      form.accountHolderName.trim() &&
      form.bankName.trim() &&
      form.accountNumber.trim() &&
      form.branchCode.trim(),
    );
  const stepReadiness: Record<IntakeStepId, boolean> = {
    customer: customerReady,
    contact: contactReady,
    service: serviceReady,
    documents: documentsReady,
    debit: debitReady,
    review:
      customerReady &&
      contactReady &&
      serviceReady &&
      documentsReady &&
      debitReady,
  };
  const allRequiredReady = stepReadiness.review;
  const missingItems = [
    !customerReady ? "Customer record" : null,
    !contactReady ? "Contact & site details" : null,
    !serviceReady ? "Billable service" : null,
    !documentsReady ? "Documents" : null,
    !debitReady ? "Debit order" : null,
  ].filter((item): item is string => item !== null);
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
  const checklist = [
    { label: "Customer record is complete", ready: customerReady },
    { label: "Contact and site details are complete", ready: contactReady },
    { label: "Billable service is defined", ready: serviceReady },
    { label: "Required documents are uploaded", ready: documentsReady },
    { label: "Debit order details are provided", ready: debitReady },
  ];

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function goToStep(index: number) {
    const next = intakeSteps[index];
    if (next) setActiveStep(next.id);
  }

  function goToNextStep() {
    goToStep(Math.min(activeStepIndex + 1, intakeSteps.length - 1));
  }

  function goToPreviousStep() {
    goToStep(Math.max(activeStepIndex - 1, 0));
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
      toast.success("Customer details loaded into manual onboarding");
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

    const submitter =
      "submitter" in event.nativeEvent
        ? (event.nativeEvent as SubmitEvent).submitter
        : null;
    const submitIntent =
      submitter instanceof HTMLButtonElement
        ? submitter.dataset.intent
        : "save";

    if (!customerReady || !contactReady) {
      setActiveStep(!customerReady ? "customer" : "contact");
      toast.error(
        "Complete customer, contact, and site details before saving onboarding.",
      );
      return;
    }

    if (submitIntent === "vetting" && !allRequiredReady) {
      const firstMissingStep = intakeSteps
        .slice(0, 5)
        .find((step) => !stepReadiness[step.id]);
      if (firstMissingStep) setActiveStep(firstMissingStep.id);
      toast.error(
        "Complete all required onboarding items before submitting for vetting.",
      );
      return;
    }

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
        throw new Error(data.error || "Manual onboarding failed");
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
      if (allRequiredReady) setActiveStep("review");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Manual onboarding failed",
      );
    } finally {
      setSaving(false);
    }
  }

  const ActiveIcon = activeStepMeta.icon;

  return (
    <main className="mx-auto max-w-[1500px] px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-950">
            Manual B2B Onboarding
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Admin-assisted capture for emailed client onboarding packs
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            form="manual-b2b-intake-form"
            data-intent="save"
            variant="outline"
            disabled={saving}
          >
            <PiFloppyDiskBold className="h-4 w-4" />
            {saving ? "Saving..." : "Save Onboarding"}
          </Button>
          <Button
            type="submit"
            form="manual-b2b-intake-form"
            data-intent="vetting"
            disabled={saving || !allRequiredReady}
            className="bg-circleTel-orange text-white hover:bg-circleTel-orange-dark"
          >
            {saving ? "Saving..." : "Submit for Vetting"}
            <PiArrowRightBold className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,760px)_320px]">
        <aside className="space-y-4">
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="text-base font-semibold text-gray-950">
                Onboarding Progress
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Step {activeStepIndex + 1} of {intakeSteps.length}
              </p>
            </div>
            <div className="space-y-1 px-4 py-4">
              {intakeSteps.map((step, index) => {
                const active = step.id === activeStep;
                const ready = stepReadiness[step.id];
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setActiveStep(step.id)}
                    className="grid w-full grid-cols-[32px_minmax(0,1fr)] gap-3 rounded-md px-2 py-3 text-left transition hover:bg-gray-50"
                  >
                    <span
                      className={
                        ready
                          ? "flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-semibold text-white"
                          : active
                            ? "flex h-7 w-7 items-center justify-center rounded-full bg-circleTel-orange text-xs font-semibold text-white"
                            : "flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600"
                      }
                    >
                      {ready ? (
                        <PiCheckCircleBold className="h-4 w-4" />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-gray-950">
                        {step.label}
                      </span>
                      <StepStatusPill ready={ready} active={active} />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-orange-100 bg-orange-50/60 p-4 text-sm">
            <PiWarningCircleBold className="h-5 w-5 text-circleTel-orange" />
            <p className="mt-3 font-semibold text-gray-950">Need help?</p>
            <p className="mt-1 text-gray-600">
              Use the onboarding guide when emailed packs are incomplete.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4 w-full">
              <Link href="/admin/unjani/onboarding">
                View pipeline
                <PiArrowRightBold className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </aside>

        <form
          id="manual-b2b-intake-form"
          className="space-y-6"
          onSubmit={handleSubmit}
        >
          <SectionCard
            title={activeStepMeta.label}
            icon={ActiveIcon}
            action={
              activeStep === "customer" && selectedCustomer ? (
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
            <p className="-mt-2 mb-6 text-sm text-gray-500">
              {activeStepMeta.description}
            </p>

            {activeStep === "customer" && (
              <div className="space-y-6">
                <div className="space-y-3 border-b border-gray-100 pb-6">
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
                          {selectedCustomer.accountNumber ||
                            "No account number"}
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
                          Leave unlinked to create a new customer when this
                          onboarding is saved.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <p className="text-sm font-semibold text-gray-950">
                    Business details
                  </p>
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
                          <SelectItem value="Partnership">
                            Partnership
                          </SelectItem>
                          <SelectItem value="Trust">Trust</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field
                      id="registrationNumber"
                      label="Registration or owner ID"
                    >
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
                        className="min-h-28"
                      />
                    </Field>
                  </div>
                </div>
              </div>
            )}

            {activeStep === "contact" && (
              <div className="space-y-6">
                {(selectedCustomer || form.businessName) && (
                  <div className="flex items-start gap-3 rounded-md border border-gray-200 border-l-4 border-l-circleTel-orange bg-gray-50 px-4 py-4 text-sm">
                    <PiUserCircleBold className="mt-0.5 h-5 w-5 shrink-0 text-circleTel-orange" />
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-950">
                        {documentCustomerName}
                        <span className="ml-2 rounded-full bg-circleTel-orange-light px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-circleTel-orange-dark">
                          Linked
                        </span>
                      </p>
                      <p className="mt-1 text-gray-600">
                        {accountLabel} - {contactLabel}
                      </p>
                    </div>
                  </div>
                )}

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
                      onChange={(event) =>
                        update("clinicName", event.target.value)
                      }
                    />
                  </Field>
                  <Field id="province" label="Province">
                    <Input
                      id="province"
                      value={form.province}
                      onChange={(event) =>
                        update("province", event.target.value)
                      }
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
                      className="min-h-28"
                    />
                  </Field>
                </div>
              </div>
            )}

            {activeStep === "service" && (
              <div className="space-y-6">
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

                <div className="ml-auto rounded-lg border border-orange-100 bg-orange-50 p-4 text-sm md:w-80">
                  <p className="font-semibold text-circleTel-orange-dark">
                    Monthly Pricing Summary
                  </p>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between gap-3">
                      <span className="text-gray-600">Base package</span>
                      <span className="font-semibold text-gray-950">
                        {formatCurrency(serviceMonthlyPrice || 450)}
                      </span>
                    </div>
                    <div className="border-t border-orange-200 pt-2">
                      <div className="flex justify-between gap-3 text-base">
                        <span className="font-semibold text-circleTel-orange-dark">
                          Total ex VAT
                        </span>
                        <span className="font-semibold text-circleTel-orange-dark">
                          {formatCurrency(serviceMonthlyPrice || 450)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeStep === "documents" && (
              <div className="space-y-6">
                <button
                  type="button"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-9 text-center transition hover:border-circleTel-orange hover:bg-orange-50"
                  onClick={() => {
                    if (canUploadDocuments) setUploadOpen(true);
                  }}
                  disabled={!canUploadDocuments}
                >
                  <PiUploadSimpleBold className="h-9 w-9 text-circleTel-orange" />
                  <span className="mt-3 font-semibold text-gray-950">
                    Open the document uploader
                  </span>
                  <span className="mt-1 text-sm text-gray-500">
                    Drag and drop PDF, JPG, or PNG files, then classify each
                    document inside this client onboarding pack.
                  </span>
                </button>

                <div className="rounded-lg border border-gray-200">
                  <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-gray-100 px-4 py-3">
                    <div>
                      <p className="font-semibold text-gray-950">
                        Upload target
                      </p>
                      <p className="text-sm text-gray-500">
                        {canUploadDocuments
                          ? documentCustomerName
                          : "Save this onboarding first to create an upload target."}
                      </p>
                    </div>
                    <StatusPill
                      ready={documentsReady}
                      warning={canUploadDocuments && !documentsReady}
                      label={
                        documentsReady
                          ? `${uploadedCount} uploaded`
                          : canUploadDocuments
                            ? "Ready to upload"
                            : "Pending"
                      }
                    />
                  </div>
                  <div className="grid gap-3 p-4 md:grid-cols-3">
                    {[
                      "Company registration",
                      "VAT certificate",
                      "Owner / Director ID",
                      "Proof of address",
                      "Bank confirmation",
                      "Other supporting docs",
                    ].map((item) => (
                      <div
                        key={item}
                        className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  type="button"
                  className="w-full bg-circleTel-orange text-white hover:bg-circleTel-orange-dark"
                  disabled={!canUploadDocuments}
                  onClick={() => setUploadOpen(true)}
                >
                  <PiUploadSimpleBold className="h-4 w-4" />
                  Upload documents
                </Button>
              </div>
            )}

            {activeStep === "debit" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
                  <div>
                    <p className="font-semibold text-gray-950">
                      Capture debit order
                    </p>
                    <p className="text-sm text-gray-500">
                      Required before the service can become billable.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="includeDebitOrder"
                      checked={form.includeDebitOrder}
                      onCheckedChange={(checked) =>
                        update("includeDebitOrder", checked === true)
                      }
                    />
                    <Label htmlFor="includeDebitOrder" className="text-sm">
                      Capture
                    </Label>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
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
                      onChange={(event) =>
                        update("bankName", event.target.value)
                      }
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
                        <SelectItem value="Transmission">
                          Transmission
                        </SelectItem>
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
                      onChange={(event) =>
                        update("branchCode", event.target.value)
                      }
                      required={form.includeDebitOrder}
                      disabled={!form.includeDebitOrder}
                    />
                  </Field>
                </div>

                <div className="rounded-md border border-gray-200 p-4">
                  <label className="flex items-start gap-2 text-sm text-gray-700">
                    <Checkbox disabled={!form.includeDebitOrder} />
                    <span>
                      I/we authorise CircleTel to debit the customer account
                      according to the selected billable service.
                    </span>
                  </label>
                </div>
              </div>
            )}

            {activeStep === "review" && (
              <div className="space-y-5">
                {allRequiredReady ? (
                  <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <PiCheckCircleBold className="mt-0.5 h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="font-semibold text-emerald-900">
                        Ready for vetting
                      </p>
                      <p className="text-sm text-emerald-800">
                        All required information has been captured. Please
                        review and submit.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
                    <PiWarningCircleBold className="mt-0.5 h-5 w-5 text-circleTel-orange" />
                    <div>
                      <p className="font-semibold text-circleTel-orange-dark">
                        Missing required items
                      </p>
                      <p className="text-sm text-gray-700">
                        Complete the highlighted steps before submitting for
                        vetting.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid gap-4">
                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-950">
                        Customer Record
                      </h3>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveStep("customer")}
                      >
                        Edit
                      </Button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <ReviewRow
                        label="Customer"
                        value={documentCustomerName}
                      />
                      <ReviewRow
                        label="Registered business name"
                        value={form.businessName}
                      />
                      <ReviewRow label="Entity type" value={form.entityType} />
                      <ReviewRow
                        label="Registration or owner ID"
                        value={form.registrationNumber}
                      />
                      <ReviewRow
                        label="VAT number"
                        value={
                          form.vatRegistered
                            ? form.vatNumber || "VAT registered"
                            : "Not VAT registered"
                        }
                      />
                      <ReviewRow
                        label="Registered address"
                        value={form.registeredAddress}
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-950">
                        Contact & Site
                      </h3>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveStep("contact")}
                      >
                        Edit
                      </Button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <ReviewRow
                        label="Authorized contact"
                        value={form.contactName}
                      />
                      <ReviewRow label="Email" value={form.email} />
                      <ReviewRow label="Phone" value={form.phone} />
                      <ReviewRow
                        label="Trading or clinic name"
                        value={form.clinicName}
                      />
                      <ReviewRow label="Province" value={form.province} />
                      <ReviewRow
                        label="Service address"
                        value={form.siteAddress}
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-950">
                        Billable Service
                      </h3>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveStep("service")}
                      >
                        Edit
                      </Button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <ReviewRow label="Package" value={form.packageName} />
                      <ReviewRow
                        label="Service type"
                        value={form.serviceType}
                      />
                      <ReviewRow
                        label="Monthly ex VAT"
                        value={String(serviceMonthlyPrice || 450)}
                      />
                      <ReviewRow label="Billing day" value={form.billingDay} />
                      <ReviewRow
                        label="Activation date"
                        value={form.activationDate}
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-950">
                        Documents
                      </h3>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveStep("documents")}
                      >
                        Edit
                      </Button>
                    </div>
                    <ReviewRow
                      label="Uploaded documents"
                      value={
                        uploadedCount > 0
                          ? `${uploadedCount} uploaded in this session`
                          : "No documents uploaded in this session"
                      }
                    />
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-950">
                        Debit Order
                      </h3>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveStep("debit")}
                      >
                        Edit
                      </Button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <ReviewRow
                        label="Account holder"
                        value={form.accountHolderName}
                      />
                      <ReviewRow label="Bank" value={form.bankName} />
                      <ReviewRow
                        label="Account type"
                        value={form.accountType}
                      />
                      <ReviewRow
                        label="Account number"
                        value={form.accountNumber}
                      />
                      <ReviewRow label="Branch code" value={form.branchCode} />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-gray-200 p-4">
                      <h3 className="mb-3 text-base font-semibold text-gray-950">
                        Final validation checklist
                      </h3>
                      <div className="space-y-3">
                        {checklist.map((item) => (
                          <div
                            key={item.label}
                            className="flex items-center gap-2 text-sm"
                          >
                            <PiCheckCircleBold
                              className={
                                item.ready
                                  ? "h-4 w-4 text-emerald-600"
                                  : "h-4 w-4 text-gray-300"
                              }
                            />
                            <span className="text-gray-700">{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-4">
                      <h3 className="mb-3 text-base font-semibold text-gray-950">
                        Activity timeline
                      </h3>
                      <div className="space-y-3 text-sm text-gray-600">
                        <p>Customer record loaded by admin</p>
                        <p>Onboarding details captured</p>
                        <p>Documents uploaded through manual onboarding</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-5">
              <Button
                type="button"
                variant="outline"
                disabled={activeStepIndex === 0}
                onClick={goToPreviousStep}
              >
                Back
              </Button>
              {activeStepIndex < intakeSteps.length - 1 ? (
                <Button
                  type="button"
                  className="bg-circleTel-orange text-white hover:bg-circleTel-orange-dark"
                  onClick={goToNextStep}
                >
                  Next
                  <PiArrowRightBold className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  data-intent="vetting"
                  disabled={saving || !allRequiredReady}
                  className="bg-circleTel-orange text-white hover:bg-circleTel-orange-dark"
                >
                  {saving ? "Saving..." : "Submit for Vetting"}
                  <PiArrowRightBold className="h-4 w-4" />
                </Button>
              )}
            </div>
          </SectionCard>
        </form>

        <aside className="space-y-4">
          <SectionCard
            title="Capture Status"
            icon={PiClipboardTextBold}
            compact
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-gray-950">
                  Overall status
                </p>
                <StatusPill
                  ready={allRequiredReady}
                  warning={!allRequiredReady}
                  label={allRequiredReady ? "Ready" : "In progress"}
                />
              </div>

              {result && (
                <div className="rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm">
                  <p className="font-semibold text-emerald-800">
                    {result.createdCustomer
                      ? "New customer created"
                      : "Customer updated"}
                  </p>
                  <p className="mt-1 text-emerald-700">
                    {result.accountNumber || documentCustomerName}
                  </p>
                </div>
              )}

              <div className="border-t border-gray-100 pt-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Required items
                </p>
                <div className="space-y-3">
                  {intakeSteps.slice(0, 5).map((step) => {
                    const active = activeStep === step.id;
                    const ready = stepReadiness[step.id];
                    return (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => setActiveStep(step.id)}
                        className="flex w-full items-center justify-between gap-3 text-left text-sm"
                      >
                        <span className="font-medium text-gray-800">
                          {step.label}
                        </span>
                        <StatusPill ready={ready} warning={active && !ready} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Linked records
                </p>
                <div className="space-y-3">
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
                      <StatusPill ready={record.ready} />
                    </div>
                  ))}
                </div>
              </div>

              {missingItems.length > 0 ? (
                <div className="rounded-lg border border-orange-100 bg-orange-50 p-4 text-sm">
                  <div className="flex items-center gap-2 font-semibold text-circleTel-orange-dark">
                    <PiWarningCircleBold className="h-4 w-4" />
                    Missing required details
                  </div>
                  <ul className="mt-3 space-y-1 text-gray-700">
                    {missingItems.map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm">
                  <div className="flex items-center gap-2 font-semibold text-emerald-800">
                    <PiCheckCircleBold className="h-4 w-4" />
                    All set
                  </div>
                  <p className="mt-2 text-emerald-700">
                    The onboarding pack is ready to submit for vetting.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Button
                  type="submit"
                  form="manual-b2b-intake-form"
                  data-intent="vetting"
                  disabled={saving || !allRequiredReady}
                  className="w-full bg-circleTel-orange text-white hover:bg-circleTel-orange-dark"
                >
                  <PiArrowRightBold className="h-4 w-4" />
                  {saving ? "Saving..." : "Submit for Vetting"}
                </Button>
                <Button
                  type="submit"
                  form="manual-b2b-intake-form"
                  data-intent="save"
                  variant="outline"
                  disabled={saving}
                  className="w-full"
                >
                  <PiFloppyDiskBold className="h-4 w-4" />
                  {saving ? "Saving..." : "Save Onboarding"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={clearSelectedCustomer}
                >
                  Discard Onboarding
                </Button>
              </div>

              {result && (
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
              )}
            </div>
          </SectionCard>

          <SectionCard title="Guidance" icon={PiFileTextBold} compact>
            <div className="space-y-3 text-sm">
              <p className="text-gray-600">
                Follow each step to complete the onboarding pack before vetting.
              </p>
              <Button asChild variant="ghost" size="sm" className="px-0">
                <Link href="/admin/unjani/onboarding">
                  View onboarding guide
                  <PiArrowRightBold className="h-4 w-4" />
                </Link>
              </Button>
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
