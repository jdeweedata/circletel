import React from "react";
import TestRenderer, { act } from "react-test-renderer";

import CloudWifiGuidePage from "@/app/resources/cloudwifi-guide/page";

(
  globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("@/components/layout/Navbar", () => ({
  Navbar: () => <nav>Production navigation</nav>,
}));

jest.mock("@/components/layout/Footer", () => ({
  Footer: () => <footer>Production footer</footer>,
}));

jest.mock("@/components/cloudwifi/CloudWifiSurveyProvider", () => ({
  CloudWifiSurveyProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useCloudWifiSurvey: () => ({
    requestSurvey: jest.fn(),
    draft: { venue: { venueType: "" }, contact: {}, details: {}, attribution: {} },
    setDraft: jest.fn(),
    mobileOpen: false,
    setMobileOpen: jest.fn(),
    restoreSurveyFocus: jest.fn(),
    resetSurvey: jest.fn(),
  }),
}));

jest.mock("@/components/cloudwifi/CloudWifiSurveyCta", () => ({
  CloudWifiSurveyCta: ({
    children,
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button">{children}</button>
  ),
}));

jest.mock("@/components/cloudwifi/CloudWifiEstimateModal", () => ({
  CloudWifiEstimateModal: () => null,
}));

function pageText(renderer: TestRenderer.ReactTestRenderer): string {
  return renderer.root
    .findAll((node) => typeof node.type === "string")
    .flatMap((node) => node.children)
    .filter((child): child is string | number =>
      ["string", "number"].includes(typeof child),
    )
    .join(" ");
}

describe("CloudWiFi buying guide", () => {
  it("shows venue photos and teaching-card copy without vendor jargon", () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<CloudWifiGuidePage />);
    });

    const text = pageText(renderer!);
    const imageAlts = renderer!.root
      .findAllByType("img")
      .map((image) => image.props.alt);

    expect(text).toContain("How to choose CloudWiFi for your venue");
    expect(text).toContain("Who it is for");
    expect(text).toContain("What you get");
    expect(text).toContain("How we size a site");
    expect(text).toContain("Your internet connection");
    expect(text).toContain("1–2 APs");
    expect(text).not.toContain("Ruijie");
    expect(text).not.toContain("Backhaul");

    for (const alt of [
      "Guests dining in a warmly lit hospitality venue",
      "Customers browsing a contemporary retail store",
      "Modern multi-storey residential property",
      "Bright modern healthcare reception and waiting area",
      "Students learning together in a connected classroom",
      "Audience gathered in a large public venue",
    ]) {
      expect(imageAlts).toContain(alt);
    }

    const sources = renderer!.root.findAllByType("source");
    expect(sources.slice(0, 3).map((source) => source.props.type)).toEqual([
      "image/avif",
      "image/webp",
      "image/jpeg",
    ]);
  });
});
