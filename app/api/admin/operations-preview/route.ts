import "server-only";

import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import {
  authenticateAdmin,
  requirePermission,
} from "@/lib/auth/admin-api-auth";
import { readOperationsPreview } from "@/lib/admin/operations-preview/read";
import type {
  OperationsPreviewData,
  OperationsPreviewFailure,
  OperationsPreviewSuccess,
} from "@/lib/admin/operations-preview/types";
import { apiLogger } from "@/lib/logging/logger";
import { PERMISSIONS } from "@/lib/rbac/permissions";

const OPERATIONS_PREVIEW_TIMEOUT_MS = 8_000;

class OperationsPreviewTimeoutError extends Error {
  constructor() {
    super("Operations preview request timed out");
    this.name = "OperationsPreviewTimeoutError";
  }
}

function withPrivateNoStore(
  response: NextResponse,
  requestId: string,
): NextResponse {
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("X-Request-Id", requestId);
  return response;
}

async function readWithTimeout() {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeout = setTimeout(
        () => reject(new OperationsPreviewTimeoutError()),
        OPERATIONS_PREVIEW_TIMEOUT_MS,
      );
    });

    return await Promise.race([readOperationsPreview(), timeoutPromise]);
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
  }
}

function serializeOperationsPreviewData(
  data: OperationsPreviewData,
): OperationsPreviewData {
  return {
    generatedAt: data.generatedAt,
    source: data.source,
    timeZone: data.timeZone,
    kpis: {
      activeCustomers: data.kpis.activeCustomers,
      activeMrrCents: data.kpis.activeMrrCents,
      openTickets: data.kpis.openTickets,
      needsAttention: data.kpis.needsAttention,
      networkIncidents: data.kpis.networkIncidents,
      servicesImpacted: data.kpis.servicesImpacted,
    },
    growth: data.growth.map((month) => ({
      month: month.month,
      label: month.label,
      totalCustomers: month.totalCustomers,
      billedCents: month.billedCents,
    })),
    operations: {
      scheduledInstalls: data.operations.scheduledInstalls,
      ordersInProgress: data.operations.ordersInProgress,
      priorityTickets: data.operations.priorityTickets,
      availableTechnicians: data.operations.availableTechnicians,
    },
    finance: {
      periodStart: data.finance.periodStart,
      periodEnd: data.finance.periodEnd,
      billedCents: data.finance.billedCents,
      collectedCents: data.finance.collectedCents,
      outstandingCents: data.finance.outstandingCents,
      paidInvoices: data.finance.paidInvoices,
    },
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = randomUUID();

  if (process.env.OPERATIONS_PREVIEW_ENABLED !== "true") {
    return withPrivateNoStore(
      NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 },
      ),
      requestId,
    );
  }

  const authResult = await authenticateAdmin(request);
  if (!authResult.success) {
    return withPrivateNoStore(authResult.response, requestId);
  }

  const { adminUser } = authResult;
  const permissionError = requirePermission(
    adminUser,
    PERMISSIONS.DASHBOARD.VIEW_ANALYTICS,
  );
  if (permissionError) {
    return withPrivateNoStore(permissionError, requestId);
  }

  const startTime = Date.now();

  try {
    const data = await readWithTimeout();
    const body: OperationsPreviewSuccess = {
      success: true,
      data: serializeOperationsPreviewData(data),
    };

    return withPrivateNoStore(NextResponse.json(body), requestId);
  } catch (error) {
    const category =
      error instanceof OperationsPreviewTimeoutError ? "timeout" : "data";

    apiLogger.error("Operations preview request failed", {
      requestId,
      adminId: adminUser.id,
      durationMs: Date.now() - startTime,
      category,
    });

    const body: OperationsPreviewFailure = {
      success: false,
      error: "Operations preview data is temporarily unavailable",
      code: "OPERATIONS_PREVIEW_DATA_UNAVAILABLE",
      requestId,
    };

    return withPrivateNoStore(
      NextResponse.json(body, { status: 503 }),
      requestId,
    );
  }
}

function methodNotAllowed(): NextResponse {
  const response = new NextResponse(null, { status: 405 });
  response.headers.set("Allow", "GET");
  return withPrivateNoStore(response, randomUUID());
}

export const POST = methodNotAllowed;
export const PUT = methodNotAllowed;
export const PATCH = methodNotAllowed;
export const DELETE = methodNotAllowed;
