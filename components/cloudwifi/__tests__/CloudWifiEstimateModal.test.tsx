import React from "react";
import TestRenderer, { act } from "react-test-renderer";

import { CloudWifiEstimateModal } from "@/components/cloudwifi/CloudWifiEstimateModal";
import { CloudWifiSurveyCta } from "@/components/cloudwifi/CloudWifiSurveyCta";
import {
  CloudWifiSurveyProvider,
  type CloudWifiSurveyContextValue,
  useCloudWifiSurvey,
} from "@/components/cloudwifi/CloudWifiSurveyProvider";

(
  globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({
    open,
    children,
  }: {
    open: boolean;
    children: React.ReactNode;
  }) => (
    <section data-testid="estimate-dialog">{open ? children : null}</section>
  ),
  DialogContent: ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <header>{children}</header>
  ),
  DialogTitle: ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 {...props}>{children}</h2>
  ),
  DialogDescription: ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  ),
}));

let surveyContext: CloudWifiSurveyContextValue;

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

describe("CloudWifiEstimateModal", () => {
  it("opens from a plan-specific CTA and preserves the plan through the enquiry draft", () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <CloudWifiSurveyProvider>
          <CloudWifiSurveyCta
            prefill={{ venueType: "hospitality" }}
            planInterest="Professional"
          >
            Check Professional fit
          </CloudWifiSurveyCta>
          <CloudWifiEstimateModal />
          <ContextProbe />
        </CloudWifiSurveyProvider>,
      );
    });

    expect(JSON.stringify(renderer!.toJSON())).not.toContain(
      "Estimate your CloudWiFi tier",
    );

    const cta = renderer!.root
      .findAllByType("button")
      .find((candidate) =>
        textOf(candidate).includes("Check Professional fit"),
      );
    expect(cta).toBeDefined();

    act(() =>
      cta!.props.onClick({
        defaultPrevented: false,
        currentTarget: { focus: jest.fn(), isConnected: true },
      }),
    );

    expect(surveyContext.mobileOpen).toBe(true);
    expect(surveyContext.draft.venue.venueType).toBe("hospitality");
    expect(surveyContext.draft.details.requirements).toBe(
      "Pricing plan selected: CloudWiFi Professional",
    );
    const serialized = JSON.stringify(renderer!.toJSON());
    const renderedText = textOf(renderer!.root);
    expect(serialized).toContain("Find your recommended CloudWiFi plan");
    expect(renderedText).toContain("Checking the Professional plan");
    expect(serialized).toContain(
      "Answer 5 quick questions to see your starting Wi-Fi plan and monthly price, excluding internet connectivity.",
    );
    expect(serialized).toContain("What internet do you have today?");
    expect(serialized).not.toContain("Ruijie");
    expect(serialized).not.toContain("Backhaul capacity");
  });
});
