import React from "react";
import TestRenderer, { act } from "react-test-renderer";

import type { OperationsPreviewData } from "@/lib/admin/operations-preview/types";
import { OperationsPreviewClient } from "../OperationsPreviewClient";

(
  globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock("../OperationsDashboard", () => ({
  OperationsDashboard: ({
    data,
    onRefresh,
    isRefreshing,
  }: {
    data: OperationsPreviewData;
    onRefresh: () => void;
    isRefreshing: boolean;
  }) => (
    <section data-testid="dashboard">
      <p>{data.generatedAt}</p>
      <p>{data.kpis.activeCustomers}</p>
      <p>{isRefreshing ? "refreshing" : "current"}</p>
      <button data-testid="dashboard-refresh" onClick={onRefresh}>
        Refresh dashboard
      </button>
    </section>
  ),
}));

const DATA: OperationsPreviewData = {
  generatedAt: "2026-07-13T10:00:00.000Z",
  source: "production",
  timeZone: "Africa/Johannesburg",
  kpis: {
    activeCustomers: 25,
    activeMrrCents: 1_244_600,
    openTickets: 8,
    needsAttention: 3,
    networkIncidents: 2,
    servicesImpacted: 11,
  },
  growth: Array.from({ length: 12 }, (_, index) => ({
    month: new Date(Date.UTC(2025, 7 + index, 1)).toISOString().slice(0, 7),
    label: `M${index + 1}`,
    totalCustomers: index + 1,
    billedCents: (index + 1) * 10_000,
  })),
  operations: {
    scheduledInstalls: 2,
    ordersInProgress: 17,
    priorityTickets: 3,
    availableTechnicians: 1,
  },
  finance: {
    periodStart: "2026-07-01",
    periodEnd: "2026-07-31",
    billedCents: 100_000,
    collectedCents: 75_000,
    outstandingCents: 25_000,
    paidInvoices: 3,
  },
};

const FETCH_OPTIONS = {
  method: "GET",
  credentials: "include",
  cache: "no-store",
  headers: { Accept: "application/json" },
} as const;

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
};

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function response(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

function jsonFailure(status: number): Response {
  return {
    ok: false,
    status,
    json: jest.fn().mockRejectedValue(new SyntaxError("invalid json")),
  } as unknown as Response;
}

function success(data: OperationsPreviewData = DATA): Response {
  return response(200, { success: true, data });
}

function cloneData(): OperationsPreviewData {
  return JSON.parse(JSON.stringify(DATA)) as OperationsPreviewData;
}

async function renderClient() {
  let renderer!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(<OperationsPreviewClient />);
  });
  return renderer;
}

function serialized(renderer: TestRenderer.ReactTestRenderer): string {
  return JSON.stringify(renderer.toJSON());
}

describe("OperationsPreviewClient", () => {
  const originalFetch = global.fetch;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("shows loading before the protected GET resolves", async () => {
    const pending = deferred<Response>();
    mockFetch.mockReturnValue(pending.promise);

    const renderer = await renderClient();

    expect(serialized(renderer)).toContain("Loading operations data");
    expect(serialized(renderer)).not.toContain("dashboard");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/admin/operations-preview",
      FETCH_OPTIONS,
    );
  });

  it("redirects 401 to the admin login with the preview return path", async () => {
    mockFetch.mockResolvedValue(response(401, { error: "Unauthorized" }));

    const renderer = await renderClient();

    expect(mockReplace).toHaveBeenCalledWith(
      "/admin/login?redirect=/admin/operations-preview",
    );
    expect(serialized(renderer)).toContain("Loading operations data");
    expect(serialized(renderer)).not.toContain("Unauthorized");
  });

  it("renders Access denied for 403 without dashboard values", async () => {
    mockFetch.mockResolvedValue(response(403, { error: "database detail" }));

    const renderer = await renderClient();

    expect(serialized(renderer)).toContain("Access denied");
    expect(serialized(renderer)).not.toContain(DATA.generatedAt);
    expect(serialized(renderer)).not.toContain("database detail");
  });

  it("renders a sanitized request ID and Retry for 503, then issues one new GET", async () => {
    mockFetch
      .mockResolvedValueOnce(
        response(503, {
          success: false,
          error: "raw database detail",
          requestId: "request-503",
        }),
      )
      .mockResolvedValueOnce(success());

    const renderer = await renderClient();

    expect(serialized(renderer)).toContain("Operations data unavailable");
    expect(serialized(renderer)).toContain("request-503");
    expect(serialized(renderer)).not.toContain("raw database detail");

    await act(async () => {
      renderer.root.findByProps({ "data-testid": "retry" }).props.onClick();
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      "/api/admin/operations-preview",
      FETCH_OPTIONS,
    );
    expect(serialized(renderer)).toContain(DATA.generatedAt);
  });

  it("drops unsafe request IDs instead of rendering arbitrary server text", async () => {
    mockFetch.mockResolvedValue(
      response(503, {
        success: false,
        requestId: "<script>database rows</script>",
      }),
    );

    const renderer = await renderClient();

    expect(serialized(renderer)).toContain("Operations data unavailable");
    expect(serialized(renderer)).not.toContain("script");
    expect(serialized(renderer)).not.toContain("database rows");
  });

  it("passes a reconstructed, typed success response to the dashboard", async () => {
    mockFetch.mockResolvedValue(success());

    const renderer = await renderClient();

    expect(serialized(renderer)).toContain(DATA.generatedAt);
    expect(serialized(renderer)).toContain(String(DATA.kpis.activeCustomers));
    expect(serialized(renderer)).toContain("current");
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["null body", null],
    ["failure body on 200", { success: false, error: "no" }],
    ["missing data", { success: true }],
    ["extra root field", { success: true, data: DATA, leaked: "value" }],
  ])("fails closed for an invalid 200 %s", async (_label, body) => {
    mockFetch.mockResolvedValue(response(200, body));

    const renderer = await renderClient();

    expect(serialized(renderer)).toContain("Operations data unavailable");
    expect(serialized(renderer)).not.toContain(DATA.generatedAt);
  });

  it.each([
    [
      "negative count",
      (data: OperationsPreviewData) => (data.kpis.openTickets = -1),
    ],
    [
      "unsafe cents",
      (data: OperationsPreviewData) =>
        (data.finance.billedCents = Number.MAX_SAFE_INTEGER + 1),
    ],
    [
      "invalid generated timestamp",
      (data: OperationsPreviewData) => (data.generatedAt = "not-a-date"),
    ],
    [
      "invalid date-only period",
      (data: OperationsPreviewData) => (data.finance.periodEnd = "2026-02-31"),
    ],
    [
      "invalid growth month",
      (data: OperationsPreviewData) => (data.growth[0].month = "2026-13"),
    ],
    [
      "missing growth row",
      (data: OperationsPreviewData) => {
        data.growth.pop();
      },
    ],
    [
      "extra nested field",
      (data: OperationsPreviewData) => {
        (data.kpis as OperationsPreviewData["kpis"] & { email: string }).email =
          "customer@example.test";
      },
    ],
  ])("fails closed for %s", async (_label, mutate) => {
    const data = cloneData();
    mutate(data);
    mockFetch.mockResolvedValue(success(data));

    const renderer = await renderClient();

    expect(serialized(renderer)).toContain("Operations data unavailable");
    expect(serialized(renderer)).not.toContain(DATA.generatedAt);
  });

  it("fails closed when response JSON is malformed", async () => {
    mockFetch.mockResolvedValue(jsonFailure(200));

    const renderer = await renderClient();

    expect(serialized(renderer)).toContain("Operations data unavailable");
  });

  it("fails closed on a network error without rendering its details", async () => {
    mockFetch.mockRejectedValue(new Error("database host and credentials"));

    const renderer = await renderClient();

    expect(serialized(renderer)).toContain("Operations data unavailable");
    expect(serialized(renderer)).not.toContain("database host");
  });

  it("keeps a successful dashboard during refresh, then clears stale values on failure", async () => {
    const refresh = deferred<Response>();
    mockFetch
      .mockResolvedValueOnce(success())
      .mockReturnValueOnce(refresh.promise);
    const renderer = await renderClient();

    act(() => {
      renderer.root
        .findByProps({ "data-testid": "dashboard-refresh" })
        .props.onClick();
    });

    expect(serialized(renderer)).toContain(DATA.generatedAt);
    expect(serialized(renderer)).toContain("refreshing");

    await act(async () => {
      refresh.resolve(response(503, { requestId: "refresh-failure" }));
      await refresh.promise;
    });

    expect(serialized(renderer)).toContain("Operations data unavailable");
    expect(serialized(renderer)).toContain("refresh-failure");
    expect(serialized(renderer)).not.toContain(DATA.generatedAt);
  });

  it("clears a successful dashboard and redirects when refresh returns 401", async () => {
    mockFetch
      .mockResolvedValueOnce(success())
      .mockResolvedValueOnce(response(401, {}));
    const renderer = await renderClient();

    await act(async () => {
      renderer.root
        .findByProps({ "data-testid": "dashboard-refresh" })
        .props.onClick();
    });

    expect(mockReplace).toHaveBeenCalledWith(
      "/admin/login?redirect=/admin/operations-preview",
    );
    expect(serialized(renderer)).toContain("Loading operations data");
    expect(serialized(renderer)).not.toContain(DATA.generatedAt);
  });

  it("clears a successful dashboard and renders forbidden when refresh returns 403", async () => {
    mockFetch
      .mockResolvedValueOnce(success())
      .mockResolvedValueOnce(response(403, {}));
    const renderer = await renderClient();

    await act(async () => {
      renderer.root
        .findByProps({ "data-testid": "dashboard-refresh" })
        .props.onClick();
    });

    expect(serialized(renderer)).toContain("Access denied");
    expect(serialized(renderer)).not.toContain(DATA.generatedAt);
  });

  it("does not poll or issue extra requests after a successful load", async () => {
    jest.useFakeTimers();
    mockFetch.mockResolvedValue(success());

    await renderClient();
    await act(async () => {
      jest.advanceTimersByTime(60_000);
      await Promise.resolve();
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("ignores an older refresh response when a newer request finishes first", async () => {
    const older = deferred<Response>();
    const newer = deferred<Response>();
    const newerData = cloneData();
    newerData.generatedAt = "2026-07-13T11:00:00.000Z";
    const olderData = cloneData();
    olderData.generatedAt = "2026-07-13T10:30:00.000Z";
    mockFetch
      .mockResolvedValueOnce(success())
      .mockReturnValueOnce(older.promise)
      .mockReturnValueOnce(newer.promise);
    const renderer = await renderClient();
    const refresh = renderer.root.findByProps({
      "data-testid": "dashboard-refresh",
    }).props.onClick;

    act(() => {
      refresh();
      refresh();
    });

    await act(async () => {
      newer.resolve(success(newerData));
      await newer.promise;
    });
    expect(serialized(renderer)).toContain(newerData.generatedAt);

    await act(async () => {
      older.resolve(success(olderData));
      await older.promise;
    });
    expect(serialized(renderer)).toContain(newerData.generatedAt);
    expect(serialized(renderer)).not.toContain(olderData.generatedAt);
  });

  it("does not update state after unmounting with a request in flight", async () => {
    const pending = deferred<Response>();
    mockFetch.mockReturnValue(pending.promise);
    const renderer = await renderClient();

    act(() => renderer.unmount());
    await act(async () => {
      pending.resolve(success());
      await pending.promise;
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
