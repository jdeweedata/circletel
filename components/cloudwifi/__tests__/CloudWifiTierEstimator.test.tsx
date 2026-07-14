import React from "react";
import TestRenderer, { act } from "react-test-renderer";

import { CloudWifiSurveyCta } from "@/components/cloudwifi/CloudWifiSurveyCta";
import { CloudWifiTierEstimator } from "@/components/cloudwifi/CloudWifiTierEstimator";
import {
  CloudWifiSurveyProvider,
  type CloudWifiSurveyContextValue,
  useCloudWifiSurvey,
} from "@/components/cloudwifi/CloudWifiSurveyProvider";

(
  globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

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

let surveyContext: CloudWifiSurveyContextValue;

function ContextProbe() {
  surveyContext = useCloudWifiSurvey();
  return (
    <output data-testid="draft">{JSON.stringify(surveyContext.draft)}</output>
  );
}

function renderHarness(children: React.ReactNode) {
  let renderer: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <CloudWifiSurveyProvider>
        {children}
        <ContextProbe />
      </CloudWifiSurveyProvider>,
    );
  });
  return renderer!;
}

function buttonWithText(
  renderer: TestRenderer.ReactTestRenderer,
  label: string,
) {
  const button = renderer.root
    .findAllByType("button")
    .find((candidate) => textOf(candidate).includes(label));
  expect(button).toBeDefined();
  return button!;
}

function setCompleteEstimator(
  renderer: TestRenderer.ReactTestRenderer,
  values: { floorArea?: string; peakUsers?: string } = {},
) {
  act(() => {
    renderer.root.findByProps({ "aria-label": "Venue type" }).props.onChange({
      target: { value: "hospitality" },
    });
    renderer.root
      .findByProps({ "aria-label": "Usable floor area" })
      .props.onChange({ target: { value: values.floorArea ?? "450" } });
    renderer.root
      .findByProps({ "aria-label": "Expected peak concurrent users" })
      .props.onChange({ target: { value: values.peakUsers ?? "120" } });
    renderer.root
      .findByProps({ "aria-label": "Internet backhaul" })
      .props.onChange({ target: { value: "lte" } });
  });
}

describe("CloudWifiTierEstimator", () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const originalDocument = Object.getOwnPropertyDescriptor(
    globalThis,
    "document",
  );
  let scrollIntoView: jest.Mock;
  let focus: jest.Mock;
  let animationFrames: FrameRequestCallback[];
  let fallbackOpener: { focus: jest.Mock; isConnected: boolean } | null;
  let mobile = false;
  let reducedMotion = false;

  beforeEach(() => {
    scrollIntoView = jest.fn();
    focus = jest.fn();
    animationFrames = [];
    mobile = false;
    reducedMotion = false;
    fallbackOpener = null;

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        matchMedia: jest.fn((query: string) => ({
          matches: query === "(max-width: 767px)" ? mobile : reducedMotion,
        })),
        requestAnimationFrame: jest.fn((callback: FrameRequestCallback) => {
          animationFrames.push(callback);
          return animationFrames.length;
        }),
      },
    });
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: {
        getElementById: jest.fn((id: string) => {
          if (id === "cloudwifi-survey") return { scrollIntoView };
          if (id === "cloudwifi-survey-heading") return { focus };
          return null;
        }),
        querySelector: jest.fn(() => fallbackOpener),
      },
    });
  });

  afterEach(() => {
    if (originalWindow)
      Object.defineProperty(globalThis, "window", originalWindow);
    else delete (globalThis as { window?: unknown }).window;
    if (originalDocument)
      Object.defineProperty(globalThis, "document", originalDocument);
    else delete (globalThis as { document?: unknown }).document;
  });

  it("keeps all labels visible and shows the incomplete state initially", () => {
    const renderer = renderHarness(<CloudWifiTierEstimator />);
    const serialized = JSON.stringify(renderer.toJSON());

    expect(serialized).toContain("Venue type");
    expect(serialized).toContain("Usable floor area");
    expect(serialized).toContain("Expected peak concurrent users");
    expect(serialized).toContain("Internet backhaul");
    expect(serialized).toContain("Select your details to see a recommendation");
    expect(serialized).toContain("Public venue");
    expect(serialized).toContain("Licensed wireless");
    expect(serialized).toContain("Fixed wireless");
    expect(serialized).toContain("5G");
    expect(serialized).toContain("LTE");
    expect(serialized).toContain("Not sure");
  });

  it("renders a deterministic recommendation and transfers it into the survey draft", () => {
    const renderer = renderHarness(<CloudWifiTierEstimator />);
    setCompleteEstimator(renderer);

    const serialized = JSON.stringify(renderer.toJSON());
    expect(serialized).toContain("Professional");
    expect(serialized).toContain("R3,499");
    expect(serialized).toContain("/mo");
    expect(serialized).toContain("3–5 APs");
    expect(serialized).toContain(
      "Floor area and peak users both support the Professional tier.",
    );
    expect(serialized).toContain("A site survey must confirm");
    expect(serialized).toContain(
      "A site survey confirms the final tier and price.",
    );
    const recommendationCta = buttonWithText(
      renderer,
      "Use this recommendation",
    );
    expect(recommendationCta.props.className).toContain(
      "bg-circleTel-orange-accessible",
    );
    for (const node of renderer.root.findAll(
      (candidate) => typeof candidate.props.className === "string",
    )) {
      expect(node.props.className).not.toMatch(
        /focus-visible:ring-circleTel-orange(?:\s|$)/,
      );
    }
    expect(recommendationCta.props.className).toContain(
      "focus-visible:ring-circleTel-orange-accessible",
    );

    const estimatorOpener = { focus: jest.fn(), isConnected: true };
    mobile = true;
    act(() =>
      recommendationCta.props.onClick({ currentTarget: estimatorOpener }),
    );

    expect(surveyContext.draft.venue).toMatchObject({
      venueType: "hospitality",
      floorArea: 450,
      peakUsers: 120,
      backhaul: "lte",
    });
    expect(surveyContext.mobileOpen).toBe(true);
    expect(surveyContext.restoreSurveyFocus()).toBe(true);
    expect(estimatorOpener.focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it("preserves raw decimal input while deriving only valid positive values", () => {
    const renderer = renderHarness(<CloudWifiTierEstimator />);
    const floorArea = renderer.root.findByProps({
      "aria-label": "Usable floor area",
    });

    act(() => floorArea.props.onChange({ target: { value: "0" } }));
    expect(floorArea.props.value).toBe("0");

    act(() => floorArea.props.onChange({ target: { value: "0." } }));
    expect(floorArea.props.value).toBe("0.");
    expect(JSON.stringify(renderer.toJSON())).toContain(
      "Select your details to see a recommendation",
    );

    setCompleteEstimator(renderer, { floorArea: "0.5", peakUsers: "1" });
    expect(floorArea.props.value).toBe("0.5");
    expect(JSON.stringify(renderer.toJSON())).toContain("Essential");

    act(() =>
      buttonWithText(renderer, "Use this recommendation").props.onClick({}),
    );
    expect(surveyContext.draft.venue.floorArea).toBe(0.5);
  });

  it("removes a stale recommendation after clearing or invalidating a number", () => {
    const renderer = renderHarness(<CloudWifiTierEstimator />);
    setCompleteEstimator(renderer);
    expect(JSON.stringify(renderer.toJSON())).toContain("Professional");

    const floorArea = renderer.root.findByProps({
      "aria-label": "Usable floor area",
    });
    act(() => floorArea.props.onChange({ target: { value: "" } }));

    let serialized = JSON.stringify(renderer.toJSON());
    expect(floorArea.props.value).toBe("");
    expect(serialized).toContain("Select your details to see a recommendation");
    expect(serialized).not.toContain("Professional");
    expect(renderer.root.findAllByType("button").map(textOf)).not.toContain(
      "Use this recommendation",
    );

    act(() => floorArea.props.onChange({ target: { value: "450" } }));
    expect(JSON.stringify(renderer.toJSON())).toContain("Professional");

    const peakUsers = renderer.root.findByProps({
      "aria-label": "Expected peak concurrent users",
    });
    act(() => peakUsers.props.onChange({ target: { value: "1.5" } }));

    serialized = JSON.stringify(renderer.toJSON());
    expect(peakUsers.props.value).toBe("1.5");
    expect(serialized).toContain("Select your details to see a recommendation");
    expect(serialized).not.toContain("Professional");

    for (const invalidValue of ["1e3", "Infinity", "-1"]) {
      act(() => peakUsers.props.onChange({ target: { value: invalidValue } }));
      expect(peakUsers.props.value).toBe(invalidValue);
      expect(JSON.stringify(renderer.toJSON())).toContain(
        "Select your details to see a recommendation",
      );
    }
  });

  it("accepts the shared numeric maximum and rejects values above it", () => {
    const renderer = renderHarness(<CloudWifiTierEstimator />);
    setCompleteEstimator(renderer, {
      floorArea: "100000",
      peakUsers: "100000",
    });

    const floorArea = renderer.root.findByProps({
      "aria-label": "Usable floor area",
    });
    const peakUsers = renderer.root.findByProps({
      "aria-label": "Expected peak concurrent users",
    });
    expect(floorArea.props.max).toBe(100000);
    expect(peakUsers.props.max).toBe(100000);
    expect(JSON.stringify(renderer.toJSON())).toContain("Campus");

    act(() => peakUsers.props.onChange({ target: { value: "100001" } }));
    expect(peakUsers.props.value).toBe("100001");
    expect(JSON.stringify(renderer.toJSON())).toContain(
      "Select your details to see a recommendation",
    );
  });

  it("scrolls smoothly on desktop and focuses the survey heading on the next frame", () => {
    renderHarness(<CloudWifiTierEstimator />);

    act(() => surveyContext.requestSurvey({ city: "Cape Town" }));

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
    expect(focus).not.toHaveBeenCalled();
    expect(surveyContext.draft.venue.city).toBe("Cape Town");

    act(() => animationFrames[0](0));
    expect(focus).toHaveBeenCalledTimes(1);
  });

  it("uses automatic scrolling for reduced motion", () => {
    reducedMotion = true;
    renderHarness(<CloudWifiTierEstimator />);

    act(() => surveyContext.requestSurvey());

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "auto",
      block: "start",
    });
  });

  it("opens the mobile survey instead of scrolling", () => {
    mobile = true;
    renderHarness(<CloudWifiTierEstimator />);

    act(() => surveyContext.requestSurvey());

    expect(surveyContext.mobileOpen).toBe(true);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("merges prefill, resets to a fresh complete draft, and closes mobile state", () => {
    mobile = true;
    renderHarness(<CloudWifiTierEstimator />);

    act(() => {
      surveyContext.setDraft((current) => ({
        ...current,
        venue: {
          ...current.venue,
          city: "Durban",
          siteAddress: "1 Beach Road",
        },
        contact: { ...current.contact, email: "venue@example.co.za" },
      }));
    });
    act(() => surveyContext.requestSurvey({ floorArea: 800 }));

    expect(surveyContext.draft.venue).toMatchObject({
      city: "Durban",
      siteAddress: "1 Beach Road",
      floorArea: 800,
    });
    expect(surveyContext.draft.contact.email).toBe("venue@example.co.za");

    act(() => surveyContext.resetSurvey());

    expect(surveyContext.mobileOpen).toBe(false);
    expect(surveyContext.draft.venue.city).toBe("");
    expect(surveyContext.draft.contact.email).toBe("");
    expect(surveyContext.draft.attribution.pageSource).toBe(
      "cloudwifi_product_page",
    );
    expect(surveyContext.draft.details.networks).toEqual([]);
  });

  it("captures privacy-safe attribution after hydration and preserves it across reset", () => {
    const campaign = "c".repeat(205);
    (
      globalThis as unknown as { window: { location: { search: string } } }
    ).window.location = {
      search: `?utm_source=%20google%20&utm_medium=%20%20&utm_campaign=${campaign}`,
    };
    (
      globalThis as unknown as { document: { referrer: string } }
    ).document.referrer =
      "https://partner.example/path/to/page?token=secret#private";

    renderHarness(<CloudWifiTierEstimator />);

    expect(surveyContext.draft.attribution).toEqual({
      pageSource: "cloudwifi_product_page",
      utmSource: "google",
      utmCampaign: "c".repeat(200),
      referrer: "https://partner.example/path/to/page",
    });

    act(() => {
      surveyContext.setDraft((current) => ({
        ...current,
        venue: { ...current.venue, city: "Pretoria" },
      }));
      surveyContext.setMobileOpen(true);
    });
    act(() => surveyContext.resetSurvey());

    expect(surveyContext.mobileOpen).toBe(false);
    expect(surveyContext.draft.venue.city).toBe("");
    expect(surveyContext.draft.attribution).toEqual({
      pageSource: "cloudwifi_product_page",
      utmSource: "google",
      utmCampaign: "c".repeat(200),
      referrer: "https://partner.example/path/to/page",
    });
  });

  it("uses a real reusable button CTA to prefill and request the survey", () => {
    mobile = true;
    const renderer = renderHarness(
      <CloudWifiSurveyCta prefill={{ venueType: "retail" }}>
        Request a site survey
      </CloudWifiSurveyCta>,
    );
    const cta = buttonWithText(renderer, "Request a site survey");

    expect(cta.type).toBe("button");
    expect(cta.props.type).toBe("button");

    const ctaOpener = { focus: jest.fn(), isConnected: true };
    act(() =>
      cta.props.onClick({
        defaultPrevented: false,
        currentTarget: ctaOpener,
      }),
    );

    expect(surveyContext.draft.venue.venueType).toBe("retail");
    expect(surveyContext.mobileOpen).toBe(true);
    expect(surveyContext.restoreSurveyFocus()).toBe(true);
    expect(ctaOpener.focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it("falls back to a connected survey CTA when the original opener unmounts", () => {
    mobile = true;
    const detachedOpener = { focus: jest.fn(), isConnected: false };
    fallbackOpener = { focus: jest.fn(), isConnected: true };
    renderHarness(<CloudWifiTierEstimator />);

    act(() =>
      surveyContext.requestSurvey(
        undefined,
        detachedOpener as unknown as HTMLElement,
      ),
    );

    expect(surveyContext.restoreSurveyFocus()).toBe(true);
    expect(detachedOpener.focus).not.toHaveBeenCalled();
    expect(fallbackOpener.focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it("does not request the survey when a CTA click handler prevents default", () => {
    const renderer = renderHarness(
      <CloudWifiSurveyCta
        prefill={{ venueType: "retail" }}
        onClick={(event) => event.preventDefault()}
      >
        Cancelled survey request
      </CloudWifiSurveyCta>,
    );
    const cta = buttonWithText(renderer, "Cancelled survey request");
    const clickEvent = {
      defaultPrevented: false,
      preventDefault() {
        this.defaultPrevented = true;
      },
    };

    act(() => cta.props.onClick(clickEvent));

    expect(clickEvent.defaultPrevented).toBe(true);
    expect(surveyContext.draft.venue.venueType).toBe("");
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
