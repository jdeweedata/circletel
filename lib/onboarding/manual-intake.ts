import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { addBusinessDays, now } from "@/lib/dates";

const billingDaySchema = z.enum(["1", "15", "20", "25"]);

export const manualB2BIntakeSchema = z.object({
  customerId: z.string().uuid().optional(),
  submissionId: z.string().uuid().optional(),
  segment: z.string().min(2).default("unjani"),
  business: z.object({
    businessName: z.string().min(2),
    entityType: z.string().min(2),
    registrationNumber: z.string().min(2),
    vatRegistered: z.boolean().default(false),
    vatNumber: z.string().optional().nullable(),
    registeredAddress: z.string().min(5),
  }),
  contact: z.object({
    contactName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(9),
  }),
  site: z
    .object({
      clinicName: z.string().min(2).optional(),
      province: z.string().min(2).optional(),
      siteAddress: z.string().min(5).optional(),
      lat: z.string().optional().nullable(),
      lng: z.string().optional().nullable(),
    })
    .default({}),
  service: z
    .object({
      serviceId: z.string().uuid().optional(),
      packageName: z.string().min(2).default("CircleTel ClinicConnect"),
      serviceType: z.string().min(2).default("managed_connectivity"),
      productCategory: z.string().min(2).default("business_connectivity"),
      monthlyPrice: z.coerce.number().nonnegative().default(450),
      activationDate: z.string().optional().nullable(),
      billingDay: billingDaySchema.default("1"),
      providerName: z.string().optional().nullable(),
    })
    .optional(),
  debitOrder: z
    .object({
      paymentMethodId: z.string().uuid().optional(),
      accountHolderName: z.string().min(2),
      bankName: z.string().min(2),
      accountType: z.string().min(2),
      accountNumber: z.string().min(6),
      branchCode: z.string().min(5),
    })
    .optional(),
});

export type ManualB2BIntakeInput = z.infer<typeof manualB2BIntakeSchema>;

export interface ManualB2BIntakeAdmin {
  adminId: string;
  adminEmail: string;
}

export interface ManualB2BIntakeResult {
  customerId: string;
  accountNumber: string | null;
  submissionId: string;
  createdCustomer: boolean;
  createdSubmission: boolean;
  serviceId?: string;
  paymentMethodId?: string;
}

function splitContactName(name: string): {
  firstName: string;
  lastName: string;
} {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "Business", lastName: "Contact" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "Contact" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function maskAccountNumber(accountNumber: string): string {
  return `****${accountNumber.slice(-4)}`;
}

function errorMessage(
  error: { message?: string } | null | undefined,
  fallback: string,
): string {
  return error?.message || fallback;
}

function buildClinicDetails(input: ManualB2BIntakeInput) {
  return {
    clinic_name: input.site.clinicName ?? input.business.businessName,
    province: input.site.province ?? null,
    nurse_owner_name: input.contact.contactName,
    site_address: input.site.siteAddress ?? input.business.registeredAddress,
    lat: input.site.lat ?? null,
    lng: input.site.lng ?? null,
    capture_method: "admin_manual_intake",
  };
}

function buildSubmissionData(
  input: ManualB2BIntakeInput,
  admin: ManualB2BIntakeAdmin,
  capturedAt: string,
) {
  const billingDay = input.service?.billingDay ?? "1";
  return {
    capture_method: "admin_manual_intake",
    source: "email",
    captured_by: admin.adminEmail,
    captured_by_id: admin.adminId,
    captured_at: capturedAt,
    step1: {
      clinicName: input.site.clinicName ?? input.business.businessName,
      province: input.site.province ?? "",
      contact: input.contact.contactName,
      phone: input.contact.phone,
      email: input.contact.email,
      siteAddress: input.site.siteAddress ?? input.business.registeredAddress,
      lat: input.site.lat ?? undefined,
      lng: input.site.lng ?? undefined,
    },
    step2: {
      entityName: input.business.businessName,
      entityType: input.business.entityType,
      regNumber: input.business.registrationNumber,
      vat: input.business.vatRegistered ? "Yes" : "No",
      vatNumber: input.business.vatNumber ?? undefined,
      regAddress: input.business.registeredAddress,
    },
    step3: input.debitOrder
      ? {
          accHolder: input.debitOrder.accountHolderName,
          bank: input.debitOrder.bankName,
          accType: input.debitOrder.accountType,
          accNumber: maskAccountNumber(input.debitOrder.accountNumber),
          branchCode: input.debitOrder.branchCode,
          mandate: true,
        }
      : undefined,
    step5: {
      paymentDate: billingDay,
      soAccept: false,
    },
    manual_intake: {
      segment: input.segment,
      service_captured: Boolean(input.service),
      debit_order_captured: Boolean(input.debitOrder),
      service_order_signoff_status: "pending",
    },
  };
}

export async function saveManualB2BIntake(
  supabase: SupabaseClient,
  rawInput: unknown,
  admin: ManualB2BIntakeAdmin,
): Promise<ManualB2BIntakeResult> {
  const input = manualB2BIntakeSchema.parse(rawInput);
  const capturedAt = now().toISOString();
  const clinicDetails = buildClinicDetails(input);
  const { firstName, lastName } = splitContactName(input.contact.contactName);

  const customerPayload = {
    first_name: firstName,
    last_name: lastName,
    email: input.contact.email,
    phone: input.contact.phone,
    account_type: "business",
    status: "active",
    account_status: "active",
    business_name: input.business.businessName,
    business_registration: input.business.registrationNumber,
    tax_number: input.business.vatRegistered
      ? (input.business.vatNumber ?? null)
      : null,
    onboarding_status: "submitted",
    clinic_details: clinicDetails,
  };

  let customerId = input.customerId;
  let accountNumber: string | null = null;
  let createdCustomer = false;

  if (customerId) {
    const { data, error } = await supabase
      .from("customers")
      .update(customerPayload)
      .eq("id", customerId)
      .select("id, account_number")
      .single();
    if (error || !data) {
      throw new Error(
        errorMessage(error, "Failed to update business customer"),
      );
    }
    accountNumber = data.account_number ?? null;
  } else {
    const { data, error } = await supabase
      .from("customers")
      .insert(customerPayload)
      .select("id, account_number")
      .single();
    if (error || !data) {
      throw new Error(
        errorMessage(error, "Failed to create business customer"),
      );
    }
    customerId = data.id;
    accountNumber = data.account_number ?? null;
    createdCustomer = true;
  }

  const submissionData = buildSubmissionData(input, admin, capturedAt);
  let submissionId = input.submissionId;
  let createdSubmission = false;

  if (!submissionId) {
    const { data: existing, error: existingError } = await supabase
      .from("onboarding_submissions")
      .select("id")
      .eq("customer_id", customerId)
      .order("submitted_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    if (existingError) {
      throw new Error(
        errorMessage(existingError, "Failed to find onboarding submission"),
      );
    }
    submissionId = existing?.id;
  }

  const submissionPayload = {
    customer_id: customerId,
    segment: input.segment,
    status: "submitted",
    document_vetting_status: "documents_pending",
    submitted_at: capturedAt,
    vetting_due_date: addBusinessDays(now(), 2).toISOString(),
    submission_data: submissionData,
  };

  if (submissionId) {
    const { error } = await supabase
      .from("onboarding_submissions")
      .update(submissionPayload)
      .eq("id", submissionId);
    if (error) {
      throw new Error(
        errorMessage(error, "Failed to update onboarding submission"),
      );
    }
  } else {
    const { data, error } = await supabase
      .from("onboarding_submissions")
      .insert(submissionPayload)
      .select("id")
      .single();
    if (error || !data) {
      throw new Error(
        errorMessage(error, "Failed to create onboarding submission"),
      );
    }
    submissionId = data.id;
    createdSubmission = true;
  }

  let serviceId: string | undefined;
  if (input.service) {
    const servicePayload = {
      customer_id: customerId,
      package_name: input.service.packageName,
      service_type: input.service.serviceType,
      product_category: input.service.productCategory,
      monthly_price: input.service.monthlyPrice,
      setup_fee: 0,
      status: "active",
      active: true,
      installation_address:
        input.site.siteAddress ?? input.business.registeredAddress,
      activation_date: input.service.activationDate ?? capturedAt.slice(0, 10),
      provider_name: input.service.providerName ?? null,
      contract_months: 0,
      billing_day: Number(input.service.billingDay),
    };
    if (input.service.serviceId) {
      const { error } = await supabase
        .from("customer_services")
        .update(servicePayload)
        .eq("id", input.service.serviceId);
      if (error) {
        throw new Error(errorMessage(error, "Failed to update active service"));
      }
      serviceId = input.service.serviceId;
    } else {
      const { data, error } = await supabase
        .from("customer_services")
        .insert(servicePayload)
        .select("id")
        .single();
      if (error || !data) {
        throw new Error(errorMessage(error, "Failed to create active service"));
      }
      serviceId = data.id;
    }
  }

  let paymentMethodId: string | undefined;
  if (input.debitOrder) {
    const paymentPayload = {
      customer_id: customerId,
      onboarding_submission_id: submissionId,
      method_type: "debit_order",
      display_name: `Debit Order - ${input.debitOrder.bankName} ${maskAccountNumber(input.debitOrder.accountNumber)}`,
      last_four: input.debitOrder.accountNumber.slice(-4),
      encrypted_details: {
        bank_name: input.debitOrder.bankName,
        account_holder_name: input.debitOrder.accountHolderName,
        account_type: input.debitOrder.accountType,
        account_number: input.debitOrder.accountNumber,
        branch_code: input.debitOrder.branchCode,
        verified: false,
        source: "admin_manual_intake",
      },
      mandate_status: "pending",
      is_primary: true,
      is_active: true,
    };

    if (input.debitOrder.paymentMethodId) {
      const { error } = await supabase
        .from("customer_payment_methods")
        .update(paymentPayload)
        .eq("id", input.debitOrder.paymentMethodId);
      if (error) {
        throw new Error(
          errorMessage(error, "Failed to update debit-order payment method"),
        );
      }
      paymentMethodId = input.debitOrder.paymentMethodId;
    } else {
      const { data: existingPm, error: existingPmError } = await supabase
        .from("customer_payment_methods")
        .select("id")
        .eq("onboarding_submission_id", submissionId)
        .eq("method_type", "debit_order")
        .maybeSingle();
      if (existingPmError) {
        throw new Error(
          errorMessage(
            existingPmError,
            "Failed to find debit-order payment method",
          ),
        );
      }

      if (existingPm?.id) {
        const { error } = await supabase
          .from("customer_payment_methods")
          .update(paymentPayload)
          .eq("id", existingPm.id);
        if (error) {
          throw new Error(
            errorMessage(error, "Failed to update debit-order payment method"),
          );
        }
        paymentMethodId = existingPm.id;
      } else {
        const { data, error } = await supabase
          .from("customer_payment_methods")
          .insert(paymentPayload)
          .select("id")
          .single();
        if (error || !data) {
          throw new Error(
            errorMessage(error, "Failed to create debit-order payment method"),
          );
        }
        paymentMethodId = data.id;
      }
    }
  }

  if (!customerId || !submissionId) {
    throw new Error("Manual intake did not produce a customer and submission");
  }

  return {
    customerId,
    accountNumber,
    submissionId,
    createdCustomer,
    createdSubmission,
    serviceId,
    paymentMethodId,
  };
}
