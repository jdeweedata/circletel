import { saveManualB2BIntake } from "../manual-intake";

type Operation = {
  table: string;
  action: "insert" | "update" | "select";
  payload?: unknown;
  filters: Array<{ column: string; value: unknown }>;
};

function createMockSupabase() {
  const operations: Operation[] = [];

  const responseFor = (table: string, action: string) => {
    if (table === "customers" && action === "single") {
      return Promise.resolve({
        data: { id: "customer-1", account_number: "CT-2026-00042" },
        error: null,
      });
    }
    if (table === "onboarding_submissions" && action === "maybeSingle") {
      return Promise.resolve({ data: null, error: null });
    }
    if (table === "onboarding_submissions" && action === "single") {
      return Promise.resolve({ data: { id: "submission-1" }, error: null });
    }
    if (table === "customer_services" && action === "single") {
      return Promise.resolve({ data: { id: "service-1" }, error: null });
    }
    if (table === "customer_payment_methods" && action === "maybeSingle") {
      return Promise.resolve({ data: null, error: null });
    }
    if (table === "customer_payment_methods" && action === "single") {
      return Promise.resolve({ data: { id: "payment-method-1" }, error: null });
    }
    return Promise.resolve({ data: null, error: null });
  };

  const from = jest.fn((table: string) => {
    const state: Operation = { table, action: "select", filters: [] };
    const builder: any = {
      insert: jest.fn((payload) => {
        state.action = "insert";
        state.payload = payload;
        operations.push(state);
        return builder;
      }),
      update: jest.fn((payload) => {
        state.action = "update";
        state.payload = payload;
        operations.push(state);
        return builder;
      }),
      select: jest.fn(() => {
        if (!operations.includes(state)) operations.push(state);
        return builder;
      }),
      eq: jest.fn((column, value) => {
        state.filters.push({ column, value });
        return builder;
      }),
      order: jest.fn((column: string) => {
        if (table === "onboarding_submissions" && column === "created_at") {
          throw new Error("onboarding_submissions.created_at does not exist");
        }
        return builder;
      }),
      limit: jest.fn(() => builder),
      maybeSingle: jest.fn(() => responseFor(table, "maybeSingle")),
      single: jest.fn(() => responseFor(table, "single")),
    };
    return builder;
  });

  return { supabase: { from } as any, operations };
}

describe("saveManualB2BIntake", () => {
  it("creates a business customer, submission, active service, and debit-order payment method", async () => {
    const { supabase, operations } = createMockSupabase();

    const result = await saveManualB2BIntake(
      supabase,
      {
        segment: "unjani",
        business: {
          businessName: "Unjani Alexandra Clinic",
          entityType: "Private Company",
          registrationNumber: "2026/123456/07",
          vatRegistered: true,
          vatNumber: "4123456789",
          registeredAddress: "10 Clinic Road, Alexandra",
        },
        contact: {
          contactName: "Thandi Maseko",
          email: "thandi@example.co.za",
          phone: "0821234567",
        },
        site: {
          clinicName: "Unjani Alexandra",
          province: "Gauteng",
          siteAddress: "10 Clinic Road, Alexandra",
        },
        service: {
          packageName: "CircleTel ClinicConnect",
          serviceType: "managed_connectivity",
          monthlyPrice: 450,
          activationDate: "2026-07-01",
          billingDay: "25",
        },
        debitOrder: {
          accountHolderName: "Unjani Alexandra Clinic",
          bankName: "FNB",
          accountType: "Cheque",
          accountNumber: "1234567890",
          branchCode: "250655",
        },
      },
      { adminId: "admin-1", adminEmail: "admin@example.co.za" },
    );

    expect(result).toEqual({
      customerId: "customer-1",
      accountNumber: "CT-2026-00042",
      submissionId: "submission-1",
      createdCustomer: true,
      createdSubmission: true,
      serviceId: "service-1",
      paymentMethodId: "payment-method-1",
    });

    const customerInsert = operations.find(
      (op) => op.table === "customers" && op.action === "insert",
    );
    expect(customerInsert?.payload).toEqual(
      expect.objectContaining({
        account_type: "business",
        business_name: "Unjani Alexandra Clinic",
        email: "thandi@example.co.za",
        phone: "0821234567",
        onboarding_status: "submitted",
      }),
    );

    const submissionInsert = operations.find(
      (op) => op.table === "onboarding_submissions" && op.action === "insert",
    );
    expect(submissionInsert?.payload).toEqual(
      expect.objectContaining({
        customer_id: "customer-1",
        segment: "unjani",
        status: "submitted",
        document_vetting_status: "documents_pending",
        submission_data: expect.objectContaining({
          capture_method: "admin_manual_intake",
          captured_by: "admin@example.co.za",
          step3: expect.objectContaining({ accNumber: "****7890" }),
        }),
      }),
    );

    const paymentInsert = operations.find(
      (op) => op.table === "customer_payment_methods" && op.action === "insert",
    );
    expect(paymentInsert?.payload).toEqual(
      expect.objectContaining({
        customer_id: "customer-1",
        onboarding_submission_id: "submission-1",
        method_type: "debit_order",
        display_name: "Debit Order - FNB ****7890",
        encrypted_details: expect.objectContaining({
          account_number: "1234567890",
          branch_code: "250655",
          verified: false,
        }),
        mandate_status: "pending",
      }),
    );
  });
});
