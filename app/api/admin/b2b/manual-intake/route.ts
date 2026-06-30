/**
 * /api/admin/b2b/manual-intake
 *
 * Admin-assisted B2B onboarding capture for business details received by email.
 * Supports creating a new business customer record or updating an existing one.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  authenticateAdmin,
  requirePermission,
} from "@/lib/auth/admin-api-auth";
import { svc } from "@/lib/onboarding/onboarding-service";
import {
  manualB2BIntakeSchema,
  saveManualB2BIntake,
} from "@/lib/onboarding/manual-intake";
import { apiLogger } from "@/lib/logging/logger";

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function nullableString(value: unknown): string | null {
  const text = stringValue(value).trim();
  return text.length > 0 ? text : null;
}

function boolFromVat(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return ["yes", "true", "registered"].includes(value.toLowerCase());
  }
  return fallback;
}

function normalizeBillingDay(value: unknown): "1" | "15" | "20" | "25" {
  const text = String(value ?? "").trim();
  if (text === "15" || text === "20" || text === "25") return text;
  return "1";
}

function fullName(firstName: unknown, lastName: unknown): string {
  return [stringValue(firstName), stringValue(lastName)]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function mapSearchCustomer(row: JsonRecord) {
  return {
    id: stringValue(row.id),
    accountNumber: nullableString(row.account_number),
    businessName: stringValue(row.business_name) || "Unnamed business",
    email: nullableString(row.email),
    phone: nullableString(row.phone),
    registrationNumber: nullableString(row.business_registration),
    onboardingStatus: nullableString(row.onboarding_status),
  };
}

function mapCustomerPrefill({
  customer,
  submission,
  service,
  paymentMethod,
}: {
  customer: JsonRecord;
  submission: JsonRecord | null;
  service: JsonRecord | null;
  paymentMethod: JsonRecord | null;
}) {
  const submissionData = asRecord(submission?.submission_data);
  const step1 = asRecord(submissionData.step1);
  const step2 = asRecord(submissionData.step2);
  const step5 = asRecord(submissionData.step5);
  const clinicDetails = asRecord(customer.clinic_details);
  const paymentDetails = asRecord(paymentMethod?.encrypted_details);

  const businessName =
    stringValue(step2.entityName) ||
    stringValue(submissionData.business_name) ||
    stringValue(customer.business_name);
  const registeredAddress =
    stringValue(step2.regAddress) ||
    stringValue(clinicDetails.site_address) ||
    stringValue(step1.siteAddress);
  const contactName =
    stringValue(step1.contact) ||
    fullName(customer.first_name, customer.last_name) ||
    businessName;
  const clinicName =
    stringValue(step1.clinicName) ||
    stringValue(clinicDetails.clinic_name) ||
    businessName;
  const province =
    stringValue(step1.province) || stringValue(clinicDetails.province);
  const siteAddress =
    stringValue(step1.siteAddress) ||
    stringValue(clinicDetails.site_address) ||
    registeredAddress;
  const taxNumber = stringValue(customer.tax_number);
  const latestSubmissionId = nullableString(submission?.id);
  const activeServiceId = nullableString(service?.id);
  const paymentMethodId = nullableString(paymentMethod?.id);

  return {
    customer: {
      id: stringValue(customer.id),
      accountNumber: nullableString(customer.account_number),
      businessName,
      email: nullableString(customer.email),
      phone: nullableString(customer.phone),
      latestSubmissionId,
      activeServiceId,
      paymentMethodId,
      paymentLastFour: nullableString(paymentMethod?.last_four),
    },
    form: {
      customerId: stringValue(customer.id),
      submissionId: latestSubmissionId ?? "",
      serviceId: activeServiceId ?? "",
      paymentMethodId: paymentMethodId ?? "",
      segment: stringValue(submission?.segment) || "unjani",
      businessName,
      entityType: stringValue(step2.entityType) || "Private Company",
      registrationNumber:
        stringValue(step2.regNumber) ||
        stringValue(customer.business_registration),
      vatRegistered: boolFromVat(step2.vat, Boolean(taxNumber)),
      vatNumber: stringValue(step2.vatNumber) || taxNumber,
      registeredAddress,
      contactName,
      email: stringValue(step1.email) || stringValue(customer.email),
      phone: stringValue(step1.phone) || stringValue(customer.phone),
      clinicName,
      province,
      siteAddress,
      packageName:
        stringValue(service?.package_name) || "CircleTel ClinicConnect",
      serviceType: stringValue(service?.service_type) || "managed_connectivity",
      monthlyPrice: String(service?.monthly_price ?? 450),
      activationDate: stringValue(service?.activation_date),
      billingDay: normalizeBillingDay(
        service?.billing_day ?? step5.paymentDate,
      ),
      includeDebitOrder: !paymentMethodId,
      accountHolderName: stringValue(paymentDetails.account_holder_name),
      bankName: stringValue(paymentDetails.bank_name),
      accountType: stringValue(paymentDetails.account_type) || "Cheque",
      accountNumber: "",
      branchCode: stringValue(paymentDetails.branch_code),
    },
  };
}

async function authenticateManualIntake(request: NextRequest) {
  const auth = await authenticateAdmin(request);
  if (!auth.success) return { auth, response: auth.response };

  const perm = requirePermission(auth.adminUser, [
    "customers:write",
    "kyc:verify",
  ]);
  if (perm) return { auth, response: perm };

  return { auth, response: null };
}

export async function GET(request: NextRequest) {
  try {
    const { auth, response } = await authenticateManualIntake(request);
    if (response) return response;

    const supabase = svc();
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId")?.trim();
    const query = searchParams.get("q")?.trim();

    if (customerId) {
      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .select(
          "id, account_number, business_name, business_registration, tax_number, first_name, last_name, email, phone, account_type, account_status, onboarding_status, clinic_details",
        )
        .eq("id", customerId)
        .single();

      if (customerError || !customer) {
        return NextResponse.json(
          { success: false, error: "customer_not_found" },
          { status: 404 },
        );
      }

      const { data: submission, error: submissionError } = await supabase
        .from("onboarding_submissions")
        .select("id, segment, submission_data")
        .eq("customer_id", customerId)
        .order("submitted_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (submissionError) throw submissionError;

      const { data: service, error: serviceError } = await supabase
        .from("customer_services")
        .select(
          "id, package_name, service_type, monthly_price, activation_date, billing_day, provider_name",
        )
        .eq("customer_id", customerId)
        .eq("status", "active")
        .order("activation_date", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (serviceError) throw serviceError;

      const { data: paymentMethod, error: paymentError } = await supabase
        .from("customer_payment_methods")
        .select("id, last_four, mandate_status, encrypted_details")
        .eq("customer_id", customerId)
        .eq("method_type", "debit_order")
        .eq("is_active", true)
        .order("is_primary", { ascending: false })
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (paymentError) throw paymentError;

      return NextResponse.json({
        success: true,
        prefill: mapCustomerPrefill({
          customer: asRecord(customer),
          submission: submission ? asRecord(submission) : null,
          service: service ? asRecord(service) : null,
          paymentMethod: paymentMethod ? asRecord(paymentMethod) : null,
        }),
      });
    }

    if (!query || query.length < 2) {
      return NextResponse.json(
        { success: false, error: "search_query_too_short" },
        { status: 400 },
      );
    }

    const search = query.replace(/[%,]/g, " ").trim();
    const { data, error } = await supabase
      .from("customers")
      .select(
        "id, account_number, business_name, email, phone, business_registration, onboarding_status",
      )
      .eq("account_type", "business")
      .or(
        [
          `business_name.ilike.%${search}%`,
          `account_number.ilike.%${search}%`,
          `email.ilike.%${search}%`,
          `phone.ilike.%${search}%`,
          `business_registration.ilike.%${search}%`,
        ].join(","),
      )
      .order("updated_at", { ascending: false })
      .limit(12);

    if (error) throw error;

    apiLogger.info("[Manual B2B Intake] customer search", {
      q: query,
      resultCount: Array.isArray(data) ? data.length : 0,
      by: auth.adminUser.email,
    });

    return NextResponse.json({
      success: true,
      results: (Array.isArray(data) ? data : []).map((row) =>
        mapSearchCustomer(asRecord(row)),
      ),
    });
  } catch (error) {
    apiLogger.error("[Manual B2B Intake] lookup failed", { error });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { auth, response } = await authenticateManualIntake(request);
    if (response) return response;

    const body = await request.json();
    const parsed = manualB2BIntakeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "validation_failed",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const result = await saveManualB2BIntake(svc(), body, {
      adminId: auth.adminUser.id ?? auth.user.id,
      adminEmail: auth.adminUser.email,
    });

    apiLogger.info("[Manual B2B Intake] captured", {
      customerId: result.customerId,
      submissionId: result.submissionId,
      createdCustomer: result.createdCustomer,
      by: auth.adminUser.email,
    });

    return NextResponse.json({ success: true, intake: result });
  } catch (error) {
    apiLogger.error("[Manual B2B Intake] failed", { error });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
