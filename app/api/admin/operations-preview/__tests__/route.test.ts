import { NextRequest, NextResponse } from "next/server";

import * as route from "../route";
import {
  authenticateAdmin,
  requirePermission,
} from "@/lib/auth/admin-api-auth";
import { apiLogger } from "@/lib/logging/logger";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { readOperationsPreview } from "@/lib/admin/operations-preview/read";
import type { OperationsPreviewData } from "@/lib/admin/operations-preview/types";

jest.mock("@/lib/auth/admin-api-auth", () => ({
  authenticateAdmin: jest.fn(),
  requirePermission: jest.fn(),
}));

jest.mock("@/lib/admin/operations-preview/read", () => ({
  readOperationsPreview: jest.fn(),
}));

jest.mock("@/lib/logging/logger", () => ({
  apiLogger: {
    error: jest.fn(),
  },
}));

const mockAuthenticateAdmin = authenticateAdmin as jest.MockedFunction<
  typeof authenticateAdmin
>;
const mockRequirePermission = requirePermission as jest.MockedFunction<
  typeof requirePermission
>;
const mockReadOperationsPreview = readOperationsPreview as jest.MockedFunction<
  typeof readOperationsPreview
>;
const mockApiLoggerError = apiLogger.error as jest.MockedFunction<
  typeof apiLogger.error
>;

const adminUser = {
  id: "a8dd2fcb-b776-4e33-a20f-2f3342ee9371",
  email: "operations@example.test",
  full_name: "Operations Admin",
  role: "operations",
  permissions: [PERMISSIONS.DASHBOARD.VIEW_ANALYTICS],
  is_active: true,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

const previewData: OperationsPreviewData = {
  generatedAt: "2026-07-13T10:00:00.000Z",
  source: "production",
  timeZone: "Africa/Johannesburg",
  kpis: {
    activeCustomers: 120,
    activeMrrCents: 4_500_000,
    openTickets: 8,
    needsAttention: 3,
    networkIncidents: 2,
    servicesImpacted: 11,
  },
  growth: [
    {
      month: "2026-07",
      label: "Jul",
      totalCustomers: 120,
      billedCents: 4_700_000,
    },
  ],
  operations: {
    scheduledInstalls: 9,
    ordersInProgress: 14,
    priorityTickets: 3,
    availableTechnicians: 6,
  },
  finance: {
    periodStart: "2026-07-01",
    periodEnd: "2026-08-01",
    billedCents: 4_700_000,
    collectedCents: 4_100_000,
    outstandingCents: 600_000,
    paidInvoices: 98,
  },
};

function request() {
  return new NextRequest("http://localhost/api/admin/operations-preview");
}

function expectPrivateNoStore(response: Response) {
  expect(response.headers.get("cache-control")).toBe(
    "private, no-store, max-age=0",
  );
  expect(response.headers.get("pragma")).toBe("no-cache");
  expect(response.headers.get("x-request-id")).toMatch(/^[0-9a-f-]{36}$/);
}

describe("GET /api/admin/operations-preview", () => {
  const previousFlag = process.env.OPERATIONS_PREVIEW_ENABLED;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPERATIONS_PREVIEW_ENABLED = "true";
    mockAuthenticateAdmin.mockResolvedValue({
      success: true,
      user: { id: "user-1" } as never,
      adminUser,
    });
    mockRequirePermission.mockReturnValue(null);
    mockReadOperationsPreview.mockResolvedValue(previewData);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  afterAll(() => {
    if (previousFlag === undefined) {
      delete process.env.OPERATIONS_PREVIEW_ENABLED;
    } else {
      process.env.OPERATIONS_PREVIEW_ENABLED = previousFlag;
    }
  });

  it.each([undefined, "false"])(
    "returns 404 before authentication or data access when the flag is %s",
    async (flagValue) => {
      if (flagValue === undefined) {
        delete process.env.OPERATIONS_PREVIEW_ENABLED;
      } else {
        process.env.OPERATIONS_PREVIEW_ENABLED = flagValue;
      }

      const response = await route.GET(request());

      expect(response.status).toBe(404);
      expectPrivateNoStore(response);
      expect(mockAuthenticateAdmin).not.toHaveBeenCalled();
      expect(mockRequirePermission).not.toHaveBeenCalled();
      expect(mockReadOperationsPreview).not.toHaveBeenCalled();
    },
  );

  it("returns the authentication failure with private no-store headers", async () => {
    mockAuthenticateAdmin.mockResolvedValue({
      success: false,
      response: NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      ),
      error: "No session",
    });

    const response = await route.GET(request());

    expect(response.status).toBe(401);
    expectPrivateNoStore(response);
    expect(mockRequirePermission).not.toHaveBeenCalled();
    expect(mockReadOperationsPreview).not.toHaveBeenCalled();
  });

  it("requires dashboard analytics permission and returns a protected 403", async () => {
    mockRequirePermission.mockReturnValue(
      NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      ),
    );

    const response = await route.GET(request());

    expect(mockRequirePermission).toHaveBeenCalledWith(
      adminUser,
      PERMISSIONS.DASHBOARD.VIEW_ANALYTICS,
    );
    expect(response.status).toBe(403);
    expectPrivateNoStore(response);
    expect(mockReadOperationsPreview).not.toHaveBeenCalled();
  });

  it("returns only the PII-free operations aggregate contract", async () => {
    mockReadOperationsPreview.mockResolvedValue({
      ...previewData,
      email: "customer@example.test",
      growth: previewData.growth.map((month) => ({
        ...month,
        customer_id: "customer-1",
      })),
    } as unknown as OperationsPreviewData);

    const response = await route.GET(request());
    const body = await response.json();
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(200);
    expectPrivateNoStore(response);
    expect(body).toEqual({ success: true, data: previewData });
    expect(mockRequirePermission).toHaveBeenCalledWith(
      adminUser,
      PERMISSIONS.DASHBOARD.VIEW_ANALYTICS,
    );
    for (const forbiddenKey of [
      "email",
      "phone",
      "address",
      "subject",
      "description",
      "invoice_number",
      "order_number",
      "customer_id",
    ]) {
      expect(serialized).not.toContain(forbiddenKey);
    }
  });

  it("fails closed with a 503 and a normalized log when the reader rejects", async () => {
    mockReadOperationsPreview.mockRejectedValue(
      new Error("customer email and raw database error"),
    );

    const response = await route.GET(request());
    const body = await response.json();

    expect(response.status).toBe(503);
    expectPrivateNoStore(response);
    expect(body).toEqual({
      success: false,
      error: "Operations preview data is temporarily unavailable",
      code: "OPERATIONS_PREVIEW_DATA_UNAVAILABLE",
      requestId: response.headers.get("x-request-id"),
    });
    expect(mockApiLoggerError).toHaveBeenCalledWith(
      "Operations preview request failed",
      {
        requestId: response.headers.get("x-request-id"),
        adminId: adminUser.id,
        durationMs: expect.any(Number),
        category: "data",
      },
    );
    expect(JSON.stringify(mockApiLoggerError.mock.calls)).not.toContain(
      "raw database error",
    );
  });

  it("clears the timeout immediately when the reader resolves early", async () => {
    jest.useFakeTimers();

    const response = await route.GET(request());

    expect(response.status).toBe(200);
    expectPrivateNoStore(response);
    expect(jest.getTimerCount()).toBe(0);
  });

  it("times out after eight seconds, clears its timer, and returns a 503", async () => {
    jest.useFakeTimers();
    mockReadOperationsPreview.mockImplementation(
      () => new Promise<OperationsPreviewData>(() => undefined),
    );

    const responsePromise = route.GET(request());
    await jest.advanceTimersByTimeAsync(route.OPERATIONS_PREVIEW_TIMEOUT_MS);
    const response = await responsePromise;
    const body = await response.json();

    expect(route.OPERATIONS_PREVIEW_TIMEOUT_MS).toBe(8_000);
    expect(response.status).toBe(503);
    expectPrivateNoStore(response);
    expect(body.code).toBe("OPERATIONS_PREVIEW_DATA_UNAVAILABLE");
    expect(body.requestId).toBe(response.headers.get("x-request-id"));
    expect(jest.getTimerCount()).toBe(0);
    expect(mockApiLoggerError).toHaveBeenCalledWith(
      "Operations preview request failed",
      expect.objectContaining({
        requestId: response.headers.get("x-request-id"),
        adminId: adminUser.id,
        category: "timeout",
      }),
    );
  });

  it("exports only the GET HTTP method", () => {
    expect(route).not.toHaveProperty("POST");
    expect(route).not.toHaveProperty("PUT");
    expect(route).not.toHaveProperty("PATCH");
    expect(route).not.toHaveProperty("DELETE");
  });
});
