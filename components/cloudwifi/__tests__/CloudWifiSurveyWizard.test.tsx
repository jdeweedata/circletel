import React from "react";
import TestRenderer, { act } from "react-test-renderer";

import {
  CloudWifiSurveyProvider,
  type CloudWifiSurveyContextValue,
  useCloudWifiSurvey,
} from "@/components/cloudwifi/CloudWifiSurveyProvider";
import { CloudWifiSurveyWizard } from "@/components/cloudwifi/CloudWifiSurveyWizard";
import { useIsMobile } from "@/hooks/use-mobile";

jest.mock("@/hooks/use-mobile", () => ({ useIsMobile: jest.fn() }));

jest.mock("@/components/ui/sheet", () => ({
  Sheet: ({
    open,
    onOpenChange,
    children,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
  }) => (
    <section
      data-testid="mobile-sheet"
      data-open={open}
      data-on-open-change={onOpenChange}
    >
      {open ? children : null}
    </section>
  ),
  SheetContent: ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  SheetHeader: ({ children }: { children: React.ReactNode }) => (
    <header>{children}</header>
  ),
  SheetTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
  SheetDescription: ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  ),
}));

(
  globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const mockUseIsMobile = useIsMobile as jest.MockedFunction<typeof useIsMobile>;

let surveyContext: CloudWifiSurveyContextValue;
let renderer: TestRenderer.ReactTestRenderer;
let animationFrames: FrameRequestCallback[];
let focusById: Record<string, jest.Mock>;

function ContextProbe() {
  surveyContext = useCloudWifiSurvey();
  return null;
}

function textOf(
  node: TestRenderer.ReactTestInstance | string | number,
): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  return node.children
    .map((child) =>
      textOf(child as TestRenderer.ReactTestInstance | string | number),
    )
    .join("");
}

function renderWizard() {
  act(() => {
    renderer = TestRenderer.create(
      <CloudWifiSurveyProvider>
        <CloudWifiSurveyWizard />
        <ContextProbe />
      </CloudWifiSurveyProvider>,
      {
        createNodeMock: (element) => {
          const elementProps = element.props as { id?: unknown };
          const id = typeof elementProps.id === "string" ? elementProps.id : "";
          if (!id) return null;
          const focus = jest.fn();
          focusById[id] = focus;
          return { focus };
        },
      },
    );
  });
  return renderer;
}

function control(label: string) {
  return renderer.root.findByProps({ "aria-label": label });
}

function change(label: string, value: string) {
  act(() => control(label).props.onChange({ target: { value } }));
}

function toggle(label: string, checked: boolean) {
  act(() => control(label).props.onChange({ target: { checked } }));
}

function button(label: string) {
  const match = renderer.root
    .findAllByType("button")
    .find((candidate) => textOf(candidate).includes(label));
  expect(match).toBeDefined();
  return match!;
}

function click(label: string) {
  act(() => button(label).props.onClick?.({ preventDefault: jest.fn() }));
}

function flushFrame() {
  const callbacks = animationFrames.splice(0);
  act(() => callbacks.forEach((callback) => callback(0)));
}

function fillVenue() {
  change("Venue type", "hospitality");
  change("Usable floor area in square metres", "450");
  change("City", "Cape Town");
  change("Expected peak concurrent users", "120");
  change("Internet backhaul", "fibre");
}

function fillDetails() {
  change("Site address", "10 Loop Street");
  change("Postal code (optional)", "8001");
  change("Number of floors", "3");
  change("Main wall or building material", "brick_concrete");
  toggle("Staff network", true);
  toggle("Analytics", true);
  change("Additional requirements (optional)", "Coverage in the courtyard");
}

function fillContact({ consent = true }: { consent?: boolean } = {}) {
  change("Full name", "Nandi Dlamini");
  change("Venue or company name", "Loop House");
  change("Email address", "nandi@example.co.za");
  change("South African phone number", "082 123 4567");
  change("Preferred contact time", "morning");
  if (consent) toggle("Consent to contact", true);
}

function reachDetails() {
  fillVenue();
  click("Continue");
  flushFrame();
}

function reachContact() {
  reachDetails();
  fillDetails();
  click("Continue");
  flushFrame();
}

function reachReview() {
  reachContact();
  fillContact();
  click("Continue");
  flushFrame();
}

function deferredResponse() {
  let resolve!: (response: Response) => void;
  const promise = new Promise<Response>((settle) => {
    resolve = settle;
  });
  return { promise, resolve };
}

describe("CloudWifiSurveyWizard", () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const originalDocument = Object.getOwnPropertyDescriptor(
    globalThis,
    "document",
  );
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    mockUseIsMobile.mockReturnValue(false);
    animationFrames = [];
    focusById = {};
    globalThis.fetch = jest.fn();

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        location: { search: "" },
        requestAnimationFrame: jest.fn((callback: FrameRequestCallback) => {
          animationFrames.push(callback);
          return animationFrames.length;
        }),
        matchMedia: jest.fn(() => ({ matches: false })),
      },
    });
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: { referrer: "", getElementById: jest.fn(() => null) },
    });
  });

  afterEach(() => {
    if (renderer) act(() => renderer.unmount());
    jest.restoreAllMocks();
    globalThis.fetch = originalFetch;
    if (originalWindow)
      Object.defineProperty(globalThis, "window", originalWindow);
    else delete (globalThis as { window?: unknown }).window;
    if (originalDocument)
      Object.defineProperty(globalThis, "document", originalDocument);
    else delete (globalThis as { document?: unknown }).document;
  });

  it("starts on Venue with text-labelled progress and one desktop form", () => {
    renderWizard();

    expect(textOf(renderer.root)).toContain("Tell us about your venue");
    expect(textOf(renderer.root)).toContain("VenueDetailsContactReview");
    expect(
      renderer.root.findByProps({ "aria-current": "step" }).children,
    ).toContain("Venue");
    expect(renderer.root.findAllByType("form")).toHaveLength(1);
    const aside = renderer.root.findByType("aside");
    expect(aside.props.id).toBe("cloudwifi-survey");
    expect(aside.props.className).toContain("lg:sticky");
    expect(aside.props.className).toContain("lg:top-24");
    expect(animationFrames).toHaveLength(0);
    expect(focusById["cloudwifi-survey-heading"]).not.toHaveBeenCalled();
    expect(control("Venue type").props).toMatchObject({
      name: "venue.venueType",
      required: true,
      "aria-required": "true",
    });
    expect(control("City").props).toMatchObject({
      name: "venue.city",
      autoComplete: "address-level2",
    });
    expect(
      renderer.root.findByProps({ id: "cloudwifi-survey-heading" }).props
        .className,
    ).toContain("focus-visible:ring-2");
  });

  it("shows exact required errors, links them accessibly, and focuses the first invalid field", () => {
    renderWizard();
    click("Continue");
    flushFrame();

    expect(textOf(renderer.root)).toContain("Select the type of venue.");
    expect(textOf(renderer.root)).toContain(
      "Enter the usable floor area in square metres.",
    );
    const venue = control("Venue type");
    expect(venue.props["aria-invalid"]).toBe(true);
    expect(venue.props["aria-describedby"]).toBe("cloudwifi-venueType-error");
    expect(
      renderer.root.findByProps({ id: "cloudwifi-venueType-error" }).props.role,
    ).toBe("alert");
    expect(focusById["cloudwifi-venueType"]).toHaveBeenCalledTimes(1);
  });

  it("uses estimator-prefilled shared values and preserves them through back navigation", () => {
    renderWizard();
    act(() =>
      surveyContext.requestSurvey({
        venueType: "education",
        floorArea: 800,
        peakUsers: 150,
        backhaul: "licensed_wireless",
        city: "Pretoria",
      }),
    );

    expect(control("Venue type").props.value).toBe("education");
    expect(control("Usable floor area in square metres").props.value).toBe(800);
    click("Continue");
    flushFrame();
    expect(textOf(renderer.root)).toContain("Site and network details");
    expect(focusById["cloudwifi-survey-heading"]).toHaveBeenCalled();
    expect(control("Site address").props).toMatchObject({
      name: "venue.siteAddress",
      required: true,
      autoComplete: "street-address",
    });
    click("Back");
    flushFrame();
    expect(control("City").props.value).toBe("Pretoria");
    expect(control("Internet backhaul").props.value).toBe("licensed_wireless");
  });

  it("captures step-two fields, immutable network/add-on toggles, and validates limits", () => {
    renderWizard();
    reachDetails();

    expect(control("Staff network").props.checked).toBe(false);
    fillDetails();
    expect(surveyContext.draft.details.networks).toEqual(["staff"]);
    expect(surveyContext.draft.details.addOns).toEqual(["analytics"]);

    toggle("Staff network", false);
    expect(surveyContext.draft.details.networks).toEqual([]);
    toggle("Staff network", true);
    change("Postal code (optional)", "12");
    click("Continue");
    expect(textOf(renderer.root)).toContain("Enter a four-digit postal code.");

    change("Postal code (optional)", "8001");
    change("Number of floors", "101");
    click("Continue");
    expect(textOf(renderer.root)).toContain("Enter no more than 100 floors.");
    expect(control("Staff network").props.name).toBe("details.networks");
  });

  it("requires consent and records or clears its timestamp", () => {
    jest
      .spyOn(Date.prototype, "toISOString")
      .mockReturnValue("2026-07-14T12:00:00.000Z");
    renderWizard();
    reachContact();
    fillContact({ consent: false });
    click("Continue");

    expect(textOf(renderer.root)).toContain(
      "Consent is required so CircleTel can arrange the survey.",
    );
    expect(control("Consent to contact").props["aria-invalid"]).toBe(true);

    toggle("Consent to contact", true);
    expect(surveyContext.draft.contact.consentedAt).toBe(
      "2026-07-14T12:00:00.000Z",
    );
    toggle("Consent to contact", false);
    expect(surveyContext.draft.contact.consentedAt).toBe("");
    expect(textOf(renderer.root)).toContain(
      "Consent is required so CircleTel can arrange the survey.",
    );
    expect(control("Consent to contact").props.name).toBe("contact.consent");
  });

  it("retains a live field error until the changed value becomes valid", () => {
    renderWizard();
    reachContact();
    fillContact({ consent: false });
    change("Email address", "a@b.c");
    click("Continue");

    expect(textOf(renderer.root)).toContain(
      "Enter a valid email such as name@company.co.za.",
    );
    change("Email address", "a..b@example.com");
    expect(textOf(renderer.root)).toContain(
      "Enter a valid email such as name@company.co.za.",
    );
    expect(control("Email address").props["aria-invalid"]).toBe(true);

    change("Email address", "first.last+survey@example.co.za");
    expect(textOf(renderer.root)).not.toContain(
      "Enter a valid email such as name@company.co.za.",
    );
    expect(control("Email address").props).toMatchObject({
      name: "contact.email",
      required: true,
      autoComplete: "email",
      "aria-invalid": false,
    });
  });

  it("reviews captured information and its deterministic recommendation", () => {
    renderWizard();
    reachReview();

    const text = textOf(renderer.root);
    expect(text).toContain("Review your site survey request");
    expect(text).toContain("Hospitality");
    expect(text).toContain("10 Loop Street");
    expect(text).toContain("8001");
    expect(text).toContain("Nandi Dlamini");
    expect(text).toContain("nandi@example.co.za");
    expect(text).toContain("082 123 4567");
    expect(text).toContain("Professional");
    expect(text).toContain("R3,499");
    expect(text).toContain("3–5 APs");
    expect(text).toContain("A site survey confirms the final tier and price.");
    const review = renderer.root.findByProps({
      "data-testid": "cloudwifi-review",
    });
    expect(review.props.className).toContain("min-w-0");
    expect(review.props.className).toContain("break-words");
  });

  it("keeps long valid review values in overflow-safe containers", () => {
    renderWizard();
    reachReview();
    const longRequirements = "Courtyard coverage ".repeat(50);
    act(() =>
      surveyContext.setDraft((current) => ({
        ...current,
        venue: {
          ...current.venue,
          siteAddress: `${"Long Building Name ".repeat(10)}Cape Town`,
        },
        details: { ...current.details, requirements: longRequirements },
        contact: {
          ...current.contact,
          email: `${"long".repeat(20)}@example.co.za`,
        },
      })),
    );

    const review = renderer.root.findByProps({
      "data-testid": "cloudwifi-review",
    });
    expect(review.props.className).toContain("min-w-0");
    expect(review.props.className).toContain("break-words");
    expect(textOf(review)).toContain(longRequirements);
  });

  it("posts the exact complete draft contract and prevents duplicate submission", async () => {
    const pending = deferredResponse();
    (globalThis.fetch as jest.MockedFunction<typeof fetch>).mockReturnValue(
      pending.promise,
    );
    renderWizard();
    reachReview();
    const expectedDraft = JSON.parse(JSON.stringify(surveyContext.draft));

    let firstSubmit!: Promise<void>;
    await act(async () => {
      firstSubmit = renderer.root.findByType("form").props.onSubmit({
        preventDefault: jest.fn(),
      });
      renderer.root
        .findByType("form")
        .props.onSubmit({ preventDefault: jest.fn() });
    });

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch).toHaveBeenCalledWith("/api/leads/cloudwifi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expectedDraft),
    });
    expect(textOf(renderer.root)).toContain("Sending request…");
    expect(button("Sending request…").props.disabled).toBe(true);

    pending.resolve(
      new Response(JSON.stringify({ success: true, leadId: "CW-100" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );
    await act(async () => firstSubmit);
  });

  it("keeps the draft after an API error and retries successfully", async () => {
    const fetchMock = globalThis.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Service unavailable" }), {
          status: 503,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, leadId: "CW-RETRY" }), {
          status: 201,
        }),
      );
    renderWizard();
    reachReview();

    await act(async () =>
      renderer.root
        .findByType("form")
        .props.onSubmit({ preventDefault: jest.fn() }),
    );
    expect(renderer.root.findByProps({ role: "alert" })).toBeDefined();
    expect(textOf(renderer.root)).toContain("Please try again");
    expect(surveyContext.draft.contact.email).toBe("nandi@example.co.za");

    await act(async () => button("Retry submission").props.onClick());
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(textOf(renderer.root)).toContain("CW-RETRY");
  });

  it("maps bounded API field errors to the earliest relevant step and focus target", async () => {
    (globalThis.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          error: "raw server body must not be displayed",
          fields: [
            { field: "contact.email", message: "x".repeat(5000) },
            { field: "venue.postalCode", message: "unsafe raw detail" },
            ...Array.from({ length: 30 }, (_, index) => ({
              field: `unknown.${index}`,
              message: "private raw value",
            })),
          ],
        }),
        { status: 400 },
      ),
    );
    renderWizard();
    reachReview();

    await act(async () =>
      renderer.root
        .findByType("form")
        .props.onSubmit({ preventDefault: jest.fn() }),
    );
    flushFrame();

    expect(textOf(renderer.root)).toContain("Site and network details");
    expect(textOf(renderer.root)).toContain("Check the highlighted fields");
    expect(textOf(renderer.root)).not.toContain("unsafe raw detail");
    expect(textOf(renderer.root)).not.toContain("private raw value");
    expect(control("Postal code (optional)").props["aria-invalid"]).toBe(true);
    expect(focusById["cloudwifi-postalCode"]).toHaveBeenCalled();
    expect(surveyContext.draft.contact.email).toBe("nandi@example.co.za");
  });

  it("revalidates every client step before fetch after shared draft mutation", async () => {
    renderWizard();
    reachReview();
    act(() =>
      surveyContext.setDraft((current) => ({
        ...current,
        contact: { ...current.contact, email: "a@b.c" },
      })),
    );

    await act(async () =>
      renderer.root
        .findByType("form")
        .props.onSubmit({ preventDefault: jest.fn() }),
    );
    flushFrame();

    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(textOf(renderer.root)).toContain("How should we contact you?");
    expect(control("Email address").props["aria-invalid"]).toBe(true);
    expect(focusById["cloudwifi-email"]).toHaveBeenCalled();
  });

  it.each([
    ["malformed JSON", new Response("not-json", { status: 201 })],
    [
      "missing lead reference",
      new Response(JSON.stringify({ success: true }), { status: 201 }),
    ],
    [
      "explicit failure with a lead reference",
      new Response(JSON.stringify({ success: false, leadId: "CW-NO" }), {
        status: 201,
      }),
    ],
    [
      "unsafe lead reference",
      new Response(JSON.stringify({ success: true, leadId: "../../private" }), {
        status: 201,
      }),
    ],
    [
      "oversized lead reference",
      new Response(JSON.stringify({ success: true, leadId: "A".repeat(129) }), {
        status: 201,
      }),
    ],
  ])("does not claim success for %s", async (_case, response) => {
    (globalThis.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
      response,
    );
    renderWizard();
    reachReview();

    await act(async () =>
      renderer.root
        .findByType("form")
        .props.onSubmit({ preventDefault: jest.fn() }),
    );
    expect(textOf(renderer.root)).toContain(
      "We could not confirm your request",
    );
    expect(textOf(renderer.root)).not.toContain("Request received");
  });

  it("recovers from a thrown network request without clearing the draft", async () => {
    (globalThis.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(
      new TypeError("network unavailable"),
    );
    renderWizard();
    reachReview();

    await act(async () =>
      renderer.root
        .findByType("form")
        .props.onSubmit({ preventDefault: jest.fn() }),
    );

    expect(textOf(renderer.root)).toContain("We could not send your request");
    expect(textOf(renderer.root)).toContain("Retry submission");
    expect(surveyContext.draft.venue.siteAddress).toBe("10 Loop Street");
  });

  it("shows the lead reference, WhatsApp fallback, and resets without exposing contact data", async () => {
    (globalThis.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
      new Response(JSON.stringify({ success: true, leadId: "CW-SAFE-42" }), {
        status: 201,
      }),
    );
    renderWizard();
    reachReview();

    await act(async () =>
      renderer.root
        .findByType("form")
        .props.onSubmit({ preventDefault: jest.fn() }),
    );
    const successText = textOf(renderer.root);
    expect(successText).toContain("Request received");
    expect(successText).toContain("CW-SAFE-42");
    expect(successText).toContain("within one business day");
    expect(successText).not.toContain("nandi@example.co.za");
    expect(renderer.root.findByType("a").props.href).toContain("wa.me");
    expect(renderer.root.findByType("a").props.className).toContain(
      "text-circleTel-orange-accessible",
    );
    expect(renderer.root.findByType("a").props.className).toContain(
      "focus-visible:ring-2",
    );
    expect(
      renderer.root.findByProps({ id: "cloudwifi-survey-heading" }).props
        .tabIndex,
    ).toBe(-1);
    flushFrame();
    expect(focusById["cloudwifi-survey-heading"]).toHaveBeenCalled();

    click("Reset survey");
    expect(textOf(renderer.root)).toContain("Tell us about your venue");
    expect(surveyContext.draft.contact.email).toBe("");
  });

  it("renders a controlled full-width mobile sheet with exactly one form", () => {
    mockUseIsMobile.mockReturnValue(true);
    renderWizard();
    expect(renderer.root.findAllByType("form")).toHaveLength(0);

    act(() => surveyContext.setMobileOpen(true));
    const sheet = renderer.root.findByProps({ "data-testid": "mobile-sheet" });
    expect(sheet.props["data-open"]).toBe(true);
    expect(renderer.root.findAllByType("form")).toHaveLength(1);
    expect(renderer.root.findAllByType("aside")).toHaveLength(0);
    expect(JSON.stringify(renderer.toJSON())).toContain("w-full");
    const sheetContent = renderer.root
      .findAllByType("div")
      .find((node) =>
        String(node.props.className).includes("overscroll-contain"),
      );
    expect(sheetContent).toBeDefined();
    expect(sheetContent!.props.className).toContain("[&>button]:h-11");
    expect(sheetContent!.props.className).toContain("[&>button]:w-11");
    expect(sheetContent!.props.className).toContain("safe-area-inset-top");
    expect(sheetContent!.props.className).toContain("safe-area-inset-right");
    expect(sheetContent!.props.className).toContain("safe-area-inset-bottom");
    expect(sheetContent!.props.className).toContain("[&>button]:!top-");
    expect(sheetContent!.props.className).toContain("[&>button]:!right-");

    act(() => sheet.props["data-on-open-change"](false));
    expect(surveyContext.mobileOpen).toBe(false);
  });
});
