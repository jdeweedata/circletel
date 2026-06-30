import { NextRequest } from "next/server";

import { GET, POST } from "../route";
import {
  authenticateAdmin,
  requirePermission,
} from "@/lib/auth/admin-api-auth";
import { svc } from "@/lib/onboarding/onboarding-service";
import { saveManualB2BIntake } from "@/lib/onboarding/manual-intake";

jest.mock("@/lib/auth/admin-api-auth", () => ({
  authenticateAdmin: jest.fn(),
  requirePermission: jest.fn(),
}));

jest.mock("@/lib/onboarding/onboarding-service", () => ({
  svc: jest.fn(),
}));

jest.mock("@/lib/onboarding/manual-intake", () => {
  const actual = jest.requireActual("@/lib/onboarding/manual-intake");
  return {
    ...actual,
    saveManualB2BIntake: jest.fn(),
  };
});

jest.mock("@/lib/logging/logger", () => ({
  apiLogger: {
    error: jest.fn(),
    info: jest.fn(),
  },
}));

const mockAuthenticateAdmin = authenticateAdmin as jest.MockedFunction<
  typeof authenticateAdmin
>;
const mockRequirePermission = requirePermission as jest.MockedFunction<
  typeof requirePermission
>;
const mockSvc = svc as jest.MockedFunction<typeof svc>;
const mockSaveManualB2BIntake = saveManualB2BIntake as jest.MockedFunction<
  typeof saveManualB2BIntake
>;

function request(body: Record<string, unknown>) {
  return new Request("http://localhost/api/admin/b2b/manual-intake", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as NextRequest;
}

function getRequest(path: string) {
  return new Request(`http://localhost${path}`) as NextRequest;
}

const validBody = {
  segment: "unjani",
  business: {
    businessName: "Unjani Alexandra Clinic",
    entityType: "Private Company",
    registrationNumber: "2026/123456/07",
    vatRegistered: false,
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
};

function createManualIntakeSupabaseMock() {
  const from = jest.fn((table: string) => {
    const builder: any = {
      select: jest.fn(() => builder),
      eq: jest.fn(() => builder),
      or: jest.fn(() => builder),
      order: jest.fn((column: string) => {
        if (table === "onboarding_submissions" && column === "created_at") {
          throw new Error("onboarding_submissions.created_at does not exist");
        }
        return builder;
      }),
      limit: jest.fn(() => builder),
      maybeSingle: jest.fn(() => {
        if (table === "onboarding_submissions") {
          return Promise.resolve({
            data: {
              id: "submission-1",
              segment: "unjani",
              submission_data: {
                step1: {
                  clinicName: "Unjani Delmas",
                  province: "Mpumalanga",
                  contact: "Lesedi Mmoneng",
                  phone: "0792277729",
                  email: "delmas@unjani.org",
                  siteAddress: "Corner R42 and Nelson Mandela drive, Delmas",
                },
                step2: {
                  entityName: "Unjani Clinic - Delmas",
                  entityType: "Private Company",
                  regNumber: "2026/00033/07",
                  vat: "No",
                  regAddress: "Corner R42 and Nelson Mandela drive, Delmas",
                },
                step5: { paymentDate: "25" },
              },
            },
            error: null,
          });
        }
        if (table === "customer_services") {
          return Promise.resolve({
            data: {
              id: "service-1",
              package_name: "CircleTel ClinicConnect",
              service_type: "managed_connectivity",
              monthly_price: 650,
              activation_date: "2026-06-01",
              billing_day: 25,
              provider_name: "MTN",
            },
            error: null,
          });
        }
        if (table === "customer_payment_methods") {
          return Promise.resolve({
            data: {
              id: "payment-1",
              last_four: "1234",
              mandate_status: "pending",
              encrypted_details: {
                bank_name: "FNB",
                account_holder_name: "Unjani Clinic Delmas",
                account_type: "Cheque",
                branch_code: "250655",
              },
            },
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      }),
      single: jest.fn(() => {
        if (table === "customers") {
          return Promise.resolve({
            data: {
              id: "customer-1",
              account_number: "CT-2026-00033",
              business_name: "Unjani Clinic - Delmas",
              business_registration: "2026/00033/07",
              tax_number: null,
              first_name: "Lesedi",
              last_name: "Mmoneng",
              email: "delmas@unjani.org",
              phone: "0792277729",
              account_type: "business",
              account_status: "active",
              onboarding_status: "submitted",
              clinic_details: {
                clinic_name: "Unjani Delmas",
                province: "Mpumalanga",
                site_address: "Corner R42 and Nelson Mandela drive, Delmas",
              },
            },
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      }),
      then: (resolve: any) => {
        if (table === "customers") {
          return Promise.resolve({
            data: [
              {
                id: "customer-1",
                account_number: "CT-2026-00033",
                business_name: "Unjani Clinic - Delmas",
                email: "delmas@unjani.org",
                phone: "0792277729",
                business_registration: "2026/00033/07",
                onboarding_status: "submitted",
              },
            ],
            error: null,
          }).then(resolve);
        }
        return Promise.resolve({ data: [], error: null }).then(resolve);
      },
    };
    return builder;
  });

  return { from } as any;
}

describe("POST /api/admin/b2b/manual-intake", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticateAdmin.mockResolvedValue({
      success: true,
      user: { id: "user-1", email: "admin@circletel.co.za" } as any,
      adminUser: {
        id: "admin-1",
        email: "admin@circletel.co.za",
        role: "admin",
      } as any,
    });
    mockRequirePermission.mockReturnValue(null);
    mockSvc.mockReturnValue({ from: jest.fn() } as any);
    mockSaveManualB2BIntake.mockResolvedValue({
      customerId: "customer-1",
      accountNumber: "CT-2026-00042",
      submissionId: "submission-1",
      createdCustomer: true,
      createdSubmission: true,
    });
  });

  it("requires customer write or KYC verification permission", async () => {
    await POST(request(validBody));

    expect(mockRequirePermission).toHaveBeenCalledWith(
      expect.objectContaining({ email: "admin@circletel.co.za" }),
      ["customers:write", "kyc:verify"],
    );
  });

  it("delegates valid manual intake payloads to the domain service", async () => {
    const response = await POST(request(validBody));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      intake: {
        customerId: "customer-1",
        accountNumber: "CT-2026-00042",
        submissionId: "submission-1",
        createdCustomer: true,
        createdSubmission: true,
      },
    });
    expect(mockSaveManualB2BIntake).toHaveBeenCalledWith(
      expect.any(Object),
      validBody,
      { adminId: "admin-1", adminEmail: "admin@circletel.co.za" },
    );
  });

  it("rejects malformed payloads before touching Supabase", async () => {
    const response = await POST(request({ business: { businessName: "A" } }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe("validation_failed");
    expect(mockSvc).not.toHaveBeenCalled();
    expect(mockSaveManualB2BIntake).not.toHaveBeenCalled();
  });
});

describe("GET /api/admin/b2b/manual-intake", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticateAdmin.mockResolvedValue({
      success: true,
      user: { id: "user-1", email: "admin@circletel.co.za" } as any,
      adminUser: {
        id: "admin-1",
        email: "admin@circletel.co.za",
        role: "admin",
      } as any,
    });
    mockRequirePermission.mockReturnValue(null);
    mockSvc.mockReturnValue(createManualIntakeSupabaseMock());
  });

  it("searches existing B2B customers for manual intake selection", async () => {
    const response = await GET(
      getRequest("/api/admin/b2b/manual-intake?q=delmas"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.results).toEqual([
      expect.objectContaining({
        id: "customer-1",
        accountNumber: "CT-2026-00033",
        businessName: "Unjani Clinic - Delmas",
        email: "delmas@unjani.org",
      }),
    ]);
  });

  it("returns existing customer details mapped to manual-intake form fields", async () => {
    const response = await GET(
      getRequest("/api/admin/b2b/manual-intake?customerId=customer-1"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.prefill).toEqual(
      expect.objectContaining({
        customer: expect.objectContaining({
          id: "customer-1",
          accountNumber: "CT-2026-00033",
          businessName: "Unjani Clinic - Delmas",
          latestSubmissionId: "submission-1",
          activeServiceId: "service-1",
          paymentMethodId: "payment-1",
          paymentLastFour: "1234",
        }),
        form: expect.objectContaining({
          customerId: "customer-1",
          submissionId: "submission-1",
          serviceId: "service-1",
          paymentMethodId: "payment-1",
          segment: "unjani",
          businessName: "Unjani Clinic - Delmas",
          entityType: "Private Company",
          registrationNumber: "2026/00033/07",
          vatRegistered: false,
          registeredAddress: "Corner R42 and Nelson Mandela drive, Delmas",
          contactName: "Lesedi Mmoneng",
          email: "delmas@unjani.org",
          phone: "0792277729",
          clinicName: "Unjani Delmas",
          province: "Mpumalanga",
          siteAddress: "Corner R42 and Nelson Mandela drive, Delmas",
          packageName: "CircleTel ClinicConnect",
          serviceType: "managed_connectivity",
          monthlyPrice: "650",
          activationDate: "2026-06-01",
          billingDay: "25",
          includeDebitOrder: false,
          bankName: "FNB",
          accountHolderName: "Unjani Clinic Delmas",
          accountType: "Cheque",
          branchCode: "250655",
        }),
      }),
    );
  });
});
