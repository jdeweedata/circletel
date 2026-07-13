"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { OperationsPreviewData } from "@/lib/admin/operations-preview/types";
import { OperationsDashboard } from "./OperationsDashboard";

type PreviewState =
  | { status: "loading" }
  | { status: "success"; data: OperationsPreviewData }
  | { status: "forbidden" }
  | { status: "unavailable"; requestId?: string };

const OPERATIONS_PREVIEW_ENDPOINT = "/api/admin/operations-preview";
const ADMIN_LOGIN_REDIRECT = "/admin/login?redirect=/admin/operations-preview";
const EXPECTED_GROWTH_MONTHS = 12;
const SAFE_REQUEST_ID = /^[A-Za-z0-9._:-]{1,128}$/;
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat("en-ZA", {
  month: "short",
  timeZone: "Africa/Johannesburg",
});

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(
  value: UnknownRecord,
  expectedKeys: readonly string[],
): boolean {
  const actualKeys = Object.keys(value).sort();
  const sortedExpected = [...expectedKeys].sort();
  return (
    actualKeys.length === sortedExpected.length &&
    actualKeys.every((key, index) => key === sortedExpected[index])
  );
}

function readNonNegativeSafeInteger(value: unknown): number | null {
  return Number.isSafeInteger(value) && (value as number) >= 0
    ? (value as number)
    : null;
}

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_TIMESTAMP.test(value)) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
}

function isDateOnly(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) &&
    date.getUTCFullYear() === Number(match[1]) &&
    date.getUTCMonth() + 1 === Number(match[2]) &&
    date.getUTCDate() === Number(match[3])
  );
}

function isMonth(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return false;
  const month = Number(match[2]);
  return month >= 1 && month <= 12;
}

function deriveMonthLabel(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  return MONTH_LABEL_FORMATTER.format(
    new Date(Date.UTC(year, monthNumber - 1, 1, 12)),
  );
}

function parseKpis(value: unknown): OperationsPreviewData["kpis"] | null {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "activeCustomers",
      "activeMrrCents",
      "openTickets",
      "needsAttention",
      "networkIncidents",
      "servicesImpacted",
    ])
  ) {
    return null;
  }

  const activeCustomers = readNonNegativeSafeInteger(value.activeCustomers);
  const activeMrrCents = readNonNegativeSafeInteger(value.activeMrrCents);
  const openTickets = readNonNegativeSafeInteger(value.openTickets);
  const needsAttention = readNonNegativeSafeInteger(value.needsAttention);
  const networkIncidents = readNonNegativeSafeInteger(value.networkIncidents);
  const servicesImpacted = readNonNegativeSafeInteger(value.servicesImpacted);

  if (
    activeCustomers === null ||
    activeMrrCents === null ||
    openTickets === null ||
    needsAttention === null ||
    networkIncidents === null ||
    servicesImpacted === null
  ) {
    return null;
  }

  return {
    activeCustomers,
    activeMrrCents,
    openTickets,
    needsAttention,
    networkIncidents,
    servicesImpacted,
  };
}

function parseGrowth(value: unknown): OperationsPreviewData["growth"] | null {
  if (!Array.isArray(value) || value.length !== EXPECTED_GROWTH_MONTHS) {
    return null;
  }

  const growth: OperationsPreviewData["growth"] = [];
  let previousMonth = "";

  for (const item of value) {
    if (
      !isRecord(item) ||
      !hasExactKeys(item, [
        "month",
        "label",
        "totalCustomers",
        "billedCents",
      ]) ||
      !isMonth(item.month) ||
      (previousMonth !== "" && item.month <= previousMonth)
    ) {
      return null;
    }

    const label = deriveMonthLabel(item.month);
    if (item.label !== label) return null;

    const totalCustomers = readNonNegativeSafeInteger(item.totalCustomers);
    const billedCents = readNonNegativeSafeInteger(item.billedCents);
    if (totalCustomers === null || billedCents === null) return null;

    growth.push({
      month: item.month,
      label,
      totalCustomers,
      billedCents,
    });
    previousMonth = item.month;
  }

  return growth;
}

function parseOperations(
  value: unknown,
): OperationsPreviewData["operations"] | null {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "scheduledInstalls",
      "ordersInProgress",
      "priorityTickets",
      "availableTechnicians",
    ])
  ) {
    return null;
  }

  const scheduledInstalls = readNonNegativeSafeInteger(value.scheduledInstalls);
  const ordersInProgress = readNonNegativeSafeInteger(value.ordersInProgress);
  const priorityTickets = readNonNegativeSafeInteger(value.priorityTickets);
  const availableTechnicians = readNonNegativeSafeInteger(
    value.availableTechnicians,
  );

  if (
    scheduledInstalls === null ||
    ordersInProgress === null ||
    priorityTickets === null ||
    availableTechnicians === null
  ) {
    return null;
  }

  return {
    scheduledInstalls,
    ordersInProgress,
    priorityTickets,
    availableTechnicians,
  };
}

function parseFinance(value: unknown): OperationsPreviewData["finance"] | null {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "periodStart",
      "periodEnd",
      "billedCents",
      "collectedCents",
      "outstandingCents",
      "paidInvoices",
    ]) ||
    !isDateOnly(value.periodStart) ||
    !isDateOnly(value.periodEnd) ||
    value.periodStart > value.periodEnd
  ) {
    return null;
  }

  const billedCents = readNonNegativeSafeInteger(value.billedCents);
  const collectedCents = readNonNegativeSafeInteger(value.collectedCents);
  const outstandingCents = readNonNegativeSafeInteger(value.outstandingCents);
  const paidInvoices = readNonNegativeSafeInteger(value.paidInvoices);

  if (
    billedCents === null ||
    collectedCents === null ||
    outstandingCents === null ||
    paidInvoices === null
  ) {
    return null;
  }

  return {
    periodStart: value.periodStart,
    periodEnd: value.periodEnd,
    billedCents,
    collectedCents,
    outstandingCents,
    paidInvoices,
  };
}

function parseOperationsPreviewData(
  value: unknown,
): OperationsPreviewData | null {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "generatedAt",
      "source",
      "timeZone",
      "kpis",
      "growth",
      "operations",
      "finance",
    ]) ||
    !isIsoTimestamp(value.generatedAt) ||
    value.source !== "production" ||
    value.timeZone !== "Africa/Johannesburg"
  ) {
    return null;
  }

  const kpis = parseKpis(value.kpis);
  const growth = parseGrowth(value.growth);
  const operations = parseOperations(value.operations);
  const finance = parseFinance(value.finance);
  if (!kpis || !growth || !operations || !finance) return null;

  return {
    generatedAt: value.generatedAt,
    source: "production",
    timeZone: "Africa/Johannesburg",
    kpis,
    growth,
    operations,
    finance,
  };
}

function parseSuccessBody(value: unknown): OperationsPreviewData | null {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ["success", "data"]) ||
    value.success !== true
  ) {
    return null;
  }
  return parseOperationsPreviewData(value.data);
}

function safeRequestId(value: unknown): string | undefined {
  if (!isRecord(value)) return undefined;
  return typeof value.requestId === "string" &&
    SAFE_REQUEST_ID.test(value.requestId)
    ? value.requestId
    : undefined;
}

async function readFailureRequestId(
  response: Response,
): Promise<string | undefined> {
  try {
    return safeRequestId(await response.json());
  } catch {
    return undefined;
  }
}

function LoadingState() {
  return (
    <main
      className="flex min-h-svh items-center justify-center bg-muted/30 p-4"
      aria-busy="true"
    >
      <h1 className="sr-only">Loading operations data</h1>
      <Card
        className="w-full max-w-xl"
        aria-label="Loading operations data"
        role="status"
      >
        <CardHeader>
          <CardTitle>Loading operations data</CardTitle>
          <CardDescription>
            Requesting the protected production aggregate.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3" aria-hidden="true">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-5 w-1/2" />
        </CardContent>
      </Card>
    </main>
  );
}

function ForbiddenState() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <h1 className="sr-only">Access denied</h1>
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Access denied</CardTitle>
          <CardDescription>
            Your admin account cannot view operations analytics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTitle>Permission required</AlertTitle>
            <AlertDescription>
              Ask an administrator for dashboard analytics access.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </main>
  );
}

function UnavailableState({
  requestId,
  onRetry,
}: {
  requestId?: string;
  onRetry: () => void;
}) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <h1 className="sr-only">Operations data unavailable</h1>
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Operations data unavailable</CardTitle>
          <CardDescription>
            The protected production aggregate could not be loaded.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert role="status">
            <AlertTitle>Try again</AlertTitle>
            <AlertDescription>
              Refresh the data manually. No cached or fixture values are shown.
              {requestId ? (
                <span className="mt-2 block">
                  Support request ID: <code>{requestId}</code>
                </span>
              ) : null}
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button type="button" onClick={onRetry} data-testid="retry">
            Retry
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}

export function OperationsPreviewClient() {
  const { replace } = useRouter();
  const [state, setState] = useState<PreviewState>({ status: "loading" });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const stateRef = useRef<PreviewState>(state);
  const requestSequence = useRef(0);
  const mounted = useRef(false);

  const transition = useCallback((nextState: PreviewState) => {
    stateRef.current = nextState;
    setState(nextState);
  }, []);

  const load = useCallback(async () => {
    const requestNumber = ++requestSequence.current;
    const refreshing = stateRef.current.status === "success";

    if (refreshing) {
      setIsRefreshing(true);
    } else {
      transition({ status: "loading" });
    }

    try {
      const response = await fetch(OPERATIONS_PREVIEW_ENDPOINT, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      if (!mounted.current || requestSequence.current !== requestNumber) return;

      if (response.status === 401) {
        setIsRefreshing(false);
        transition({ status: "loading" });
        replace(ADMIN_LOGIN_REDIRECT);
        return;
      }

      if (response.status === 403) {
        setIsRefreshing(false);
        transition({ status: "forbidden" });
        return;
      }

      if (!response.ok) {
        const requestId = await readFailureRequestId(response);
        if (!mounted.current || requestSequence.current !== requestNumber)
          return;
        setIsRefreshing(false);
        transition({ status: "unavailable", requestId });
        return;
      }

      const data = parseSuccessBody(await response.json());
      if (!mounted.current || requestSequence.current !== requestNumber) return;
      setIsRefreshing(false);
      transition(
        data ? { status: "success", data } : { status: "unavailable" },
      );
    } catch {
      if (!mounted.current || requestSequence.current !== requestNumber) return;
      setIsRefreshing(false);
      transition({ status: "unavailable" });
    }
  }, [replace, transition]);

  useEffect(() => {
    mounted.current = true;
    void load();

    return () => {
      mounted.current = false;
      requestSequence.current += 1;
    };
  }, [load]);

  if (state.status === "success") {
    return (
      <OperationsDashboard
        data={state.data}
        onRefresh={() => void load()}
        isRefreshing={isRefreshing}
      />
    );
  }

  if (state.status === "forbidden") return <ForbiddenState />;
  if (state.status === "unavailable") {
    return (
      <UnavailableState
        requestId={state.requestId}
        onRetry={() => void load()}
      />
    );
  }
  return <LoadingState />;
}
