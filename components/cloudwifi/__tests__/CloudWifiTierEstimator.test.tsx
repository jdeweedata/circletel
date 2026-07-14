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

describe("CloudWifiTierEstimator", () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const originalDocument = Object.getOwnPropertyDescriptor(
    globalThis,
    "document",
  );
  let scrollIntoView: jest.Mock;
  let focus: jest.Mock;
  let animationFrames: FrameRequestCallback[];
  let mobile = false;
  let reducedMotion = false;

  beforeEach(() => {
    scrollIntoView = jest.fn();
    focus = jest.fn();
    animationFrames = [];
    mobile = false;
    reducedMotion = false;

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

    act(() => {
      renderer.root.findByProps({ "aria-label": "Venue type" }).props.onChange({
        target: { value: "hospitality" },
      });
      renderer.root
        .findByProps({ "aria-label": "Usable floor area" })
        .props.onChange({
          target: { value: "450" },
        });
      renderer.root
        .findByProps({ "aria-label": "Expected peak concurrent users" })
        .props.onChange({ target: { value: "120" } });
      renderer.root
        .findByProps({ "aria-label": "Internet backhaul" })
        .props.onChange({
          target: { value: "lte" },
        });
    });

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

    act(() =>
      buttonWithText(renderer, "Use this recommendation").props.onClick({}),
    );

    expect(surveyContext.draft.venue).toMatchObject({
      venueType: "hospitality",
      floorArea: 450,
      peakUsers: 120,
      backhaul: "lte",
    });
  });

  it("returns to the incomplete state when a number is cleared or made invalid", () => {
    const renderer = renderHarness(<CloudWifiTierEstimator />);
    const floorArea = renderer.root.findByProps({
      "aria-label": "Usable floor area",
    });

    act(() => floorArea.props.onChange({ target: { value: "0" } }));
    expect(floorArea.props.value).toBe("");
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

  it("uses a real reusable button CTA to prefill and request the survey", () => {
    const renderer = renderHarness(
      <CloudWifiSurveyCta prefill={{ venueType: "retail" }}>
        Request a site survey
      </CloudWifiSurveyCta>,
    );
    const cta = buttonWithText(renderer, "Request a site survey");

    expect(cta.type).toBe("button");
    expect(cta.props.type).toBe("button");

    act(() => cta.props.onClick({ defaultPrevented: false }));

    expect(surveyContext.draft.venue.venueType).toBe("retail");
  });
});
