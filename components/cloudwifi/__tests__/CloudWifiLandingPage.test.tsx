import React from "react";
import TestRenderer, { act } from "react-test-renderer";

import CloudWiFiPage from "@/app/products/cloudwifi/page";

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
}));

jest.mock("@/components/cloudwifi/CloudWifiSurveyCta", () => ({
  CloudWifiSurveyCta: ({ children }: { children: React.ReactNode }) => (
    <button type="button">{children}</button>
  ),
}));

jest.mock("@/components/cloudwifi/CloudWifiTierEstimator", () => ({
  CloudWifiTierEstimator: () => <aside>Interactive tier estimator</aside>,
}));

jest.mock("@/components/cloudwifi/CloudWifiSurveyWizard", () => ({
  CloudWifiSurveyWizard: () => <aside>Interactive site survey</aside>,
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

describe("CloudWiFi product page", () => {
  it("renders the approved product narrative and conversion journey", () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<CloudWiFiPage />);
    });

    const text = pageText(renderer!);
    const h1s = renderer!.root.findAllByType("h1");

    expect(h1s).toHaveLength(1);
    expect(h1s[0].children.join("")).toBe(
      "Find your CloudWiFi tier in minutes.",
    );
    expect(h1s[0].props.className).toContain(
      "text-3xl sm:text-4xl md:text-5xl lg:text-6xl",
    );

    for (const venue of [
      "Hospitality",
      "Retail",
      "Property",
      "Healthcare",
      "Education",
      "Public venues",
    ]) {
      expect(text).toContain(venue);
    }

    for (const tier of [
      ["Essential", "Up to 300 sqm", "1–2 APs", "R1,499"],
      ["Professional", "300–800 sqm", "3–5 APs", "R3,499"],
      ["Enterprise", "800–2,000 sqm", "6–12 APs", "R7,999"],
      ["Campus", "Large or multi-building sites", "12–30+ APs", "R14,999"],
    ]) {
      for (const detail of tier) expect(text).toContain(detail);
    }

    expect(text).toContain("What drives the price?");
    expect(text).toContain("Fully managed Wi-Fi, end to end.");
    expect(text).toContain("Powerful add-ons");
    expect(text).toContain("Optional enhancements");

    for (const step of ["Site survey", "Design", "Installation", "Manage"]) {
      expect(text).toContain(step);
    }

    expect(text).toContain("Request a site survey");
    expect(text).toContain("Open Wi-Fi toolkit");
    expect(text).toContain("Let's get your venue's Wi-Fi right.");
    expect(text).toContain("Talk to an expert");
    expect(text).toContain("Production navigation");
    expect(text).toContain("Production footer");
    expect(text).not.toContain(
      "CloudWiFi for venues that cannot afford messy guest Wi-Fi",
    );
  });
});
