import React from "react";
import TestRenderer, { act } from "react-test-renderer";

import type { OperationsPreviewData } from "@/lib/admin/operations-preview/types";
import { OperationsPreviewClient } from "../OperationsPreviewClient";

(
  globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const mockReplace = jest.fn();
const mockOperationsDashboard = jest.fn();

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
      {mockOperationsDashboard({ data, onRefresh, isRefreshing })}
      <p>{data.generatedAt}</p>
      <p>{data.kpis.activeCustomers}</p>
      <p data-testid="growth-labels">
        {data.growth.map((item) => item.label).join("|")}
      </p>
      <p>{isRefreshing ? "refreshing" : "current"}</p>
      <button data-testid="dashboard-refresh" onClick={onRefresh}>
        Refresh dashboard
      </button>
    </section>
  ),
}));

const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat("en-ZA", {
  month: "short",
  timeZone: "Africa/Johannesburg",
});

function expectedMonthLabel(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  return MONTH_LABEL_FORMATTER.format(
    new Date(Date.UTC(year, monthNumber - 1, 1, 12)),
  );
}

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
  growth: Array.from({ length: 12 }, (_, index) => {
    const month = new Date(Date.UTC(2025, 7 + index, 1))
      .toISOString()
      .slice(0, 7);
    return {
      month,
      label: expectedMonthLabel(month),
      totalCustomers: index + 1,
      billedCents: (index + 1) * 10_000,
    };
  }),
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

  async function expectMalformedDataUnavailable(
    mutate: (data: OperationsPreviewData) => void,
  ) {
    const data = cloneData();
    mutate(data);
    mockFetch.mockResolvedValue(success(data));

    const renderer = await renderClient();

    expect(serialized(renderer)).toContain("Operations data unavailable");
    expect(serialized(renderer)).not.toContain(DATA.generatedAt);
    expect(mockOperationsDashboard).not.toHaveBeenCalled();
  }

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
    expect(mockOperationsDashboard).toHaveBeenCalledTimes(1);
  });

  it("accepts exact server month labels and keeps January and December timezone-stable", async () => {
    mockFetch.mockResolvedValue(success());

    const renderer = await renderClient();
    const labels = renderer.root
      .findByProps({
        "data-testid": "growth-labels",
      })
      .children.join("");

    expect(labels).toContain(expectedMonthLabel("2025-12"));
    expect(labels).toContain(expectedMonthLabel("2026-01"));
    expect(labels).toContain("Dec|Jan");
  });

  it.each([
    ["a PII-looking label", "customer@example.test"],
    ["a control-character label", "J\u0000an"],
  ])("rejects %s at the growth-label boundary", async (_label, wireLabel) => {
    await expectMalformedDataUnavailable((data) => {
      data.growth[0].label = wireLabel;
    });
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
    expect(mockOperationsDashboard).not.toHaveBeenCalled();
  });

  const invalidDataMutations: Array<
    [string, (data: OperationsPreviewData) => void]
  > = [
    [
      "wrong source",
      (data: OperationsPreviewData) =>
        (data.source = "fixture" as "production"),
    ],
    [
      "wrong timezone",
      (data: OperationsPreviewData) =>
        (data.timeZone = "UTC" as "Africa/Johannesburg"),
    ],
    ...(
      [
        "activeCustomers",
        "activeMrrCents",
        "openTickets",
        "needsAttention",
        "networkIncidents",
        "servicesImpacted",
      ] as const
    ).map<[string, (data: OperationsPreviewData) => void]>((key) => [
      `negative KPI ${key}`,
      (data: OperationsPreviewData) => (data.kpis[key] = -1),
    ]),
    ...(
      [
        "scheduledInstalls",
        "ordersInProgress",
        "priorityTickets",
        "availableTechnicians",
      ] as const
    ).map<[string, (data: OperationsPreviewData) => void]>((key) => [
      `negative operations ${key}`,
      (data: OperationsPreviewData) => (data.operations[key] = -1),
    ]),
    ...(
      [
        "billedCents",
        "collectedCents",
        "outstandingCents",
        "paidInvoices",
      ] as const
    ).map<[string, (data: OperationsPreviewData) => void]>((key) => [
      `negative finance ${key}`,
      (data: OperationsPreviewData) => (data.finance[key] = -1),
    ]),
    [
      "unsafe KPI value",
      (data: OperationsPreviewData) =>
        (data.kpis.activeCustomers = Number.MAX_SAFE_INTEGER + 1),
    ],
    [
      "unsafe operations value",
      (data: OperationsPreviewData) =>
        (data.operations.ordersInProgress = Number.MAX_SAFE_INTEGER + 1),
    ],
    [
      "unsafe finance value",
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
      "reversed finance period",
      (data: OperationsPreviewData) => {
        data.finance.periodStart = "2026-08-01";
      },
    ],
    [
      "invalid growth month",
      (data: OperationsPreviewData) => (data.growth[0].month = "2026-13"),
    ],
    [
      "duplicate growth month",
      (data: OperationsPreviewData) => {
        data.growth[1].month = data.growth[0].month;
        data.growth[1].label = data.growth[0].label;
      },
    ],
    [
      "out-of-order growth months",
      (data: OperationsPreviewData) => {
        [data.growth[0], data.growth[1]] = [data.growth[1], data.growth[0]];
      },
    ],
    [
      "missing growth row",
      (data: OperationsPreviewData) => {
        data.growth.pop();
      },
    ],
    [
      "extra root data key",
      (data: OperationsPreviewData) => {
        (data as OperationsPreviewData & { email: string }).email =
          "customer@example.test";
      },
    ],
    [
      "extra KPI key",
      (data: OperationsPreviewData) => {
        (data.kpis as OperationsPreviewData["kpis"] & { email: string }).email =
          "customer@example.test";
      },
    ],
    [
      "extra growth-row key",
      (data: OperationsPreviewData) => {
        (
          data.growth[0] as OperationsPreviewData["growth"][number] & {
            customerId: string;
          }
        ).customerId = "customer-1";
      },
    ],
    [
      "extra operations key",
      (data: OperationsPreviewData) => {
        (
          data.operations as OperationsPreviewData["operations"] & {
            technicianName: string;
          }
        ).technicianName = "Private Person";
      },
    ],
    [
      "extra finance key",
      (data: OperationsPreviewData) => {
        (
          data.finance as OperationsPreviewData["finance"] & {
            invoiceNumber: string;
          }
        ).invoiceNumber = "INV-PRIVATE";
      },
    ],
  ];

  it.each(invalidDataMutations)(
    "fails closed for %s",
    async (_label, mutate) => {
      await expectMalformedDataUnavailable(mutate);
    },
  );

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

  it("state-suppresses obsolete responses without aborting the exact fetch contract", async () => {
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

    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      "/api/admin/operations-preview",
      FETCH_OPTIONS,
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      3,
      "/api/admin/operations-preview",
      FETCH_OPTIONS,
    );
    expect(mockFetch.mock.calls[1][1]).not.toHaveProperty("signal");
    expect(mockFetch.mock.calls[2][1]).not.toHaveProperty("signal");

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
