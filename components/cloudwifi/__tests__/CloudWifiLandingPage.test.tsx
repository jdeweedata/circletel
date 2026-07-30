import React from "react";
import TestRenderer, { act } from "react-test-renderer";

import CloudWiFiPage, { metadata } from "@/app/products/cloudwifi/page";
import WifiToolkitRedirect from "@/app/resources/wifi-toolkit/page";
import { includedFeatures, pricingTiers } from "@/components/cloudwifi/content";
import { getWhatsAppLink } from "@/lib/constants/contact";
import { permanentRedirect } from "next/navigation";

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

jest.mock("next/navigation", () => ({
  permanentRedirect: jest.fn(),
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
  CloudWifiSurveyCta: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" {...props}>
      {children}
    </button>
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

function textOf(node: TestRenderer.ReactTestInstance): string {
  return node.children
    .map((child) =>
      typeof child === "string" || typeof child === "number"
        ? String(child)
        : textOf(child),
    )
    .join("");
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
      ["Essential", "Up to 300 sqm", "1–2 APs", "R1,499", "Up to 2 APs"],
      ["Professional", "300–800 sqm", "3–5 APs", "R3,499", "Up to 5 APs"],
      ["Enterprise", "800–2,000 sqm", "6–12 APs", "R7,999", "Up to 12 APs"],
      [
        "Campus",
        "Large or multi-building sites",
        "12–30+ APs",
        "R14,999",
        "Up to 20 APs before custom expansion",
      ],
    ]) {
      for (const detail of tier) expect(text).toContain(detail);
    }

    expect(text).toContain("What drives the price?");
    expect(text).toContain("Fully managed Wi-Fi, end to end.");
    expect(text).toContain("Powerful add-ons");
    expect(text).toContain("Optional enhancements");
    expect(text).toContain("Prices exclude VAT.");
    expect(text).toContain("Fair-usage terms apply.");
    expect(text).toContain(
      "Additional access points are available at extra cost.",
    );
    expect(text).toContain("A site survey confirms the final tier and price.");

    for (const step of ["Site survey", "Design", "Installation", "Manage"]) {
      expect(text).toContain(step);
    }

    expect(text).toContain("Request a site survey");
    expect(text).toContain("Open connectivity guide");
    expect(text).toContain("Let's get your venue's Wi-Fi right.");
    expect(text).toContain("Talk to an expert");
    expect(text).toContain("Production navigation");
    expect(text).toContain("Production footer");
    expect(text).not.toContain(
      "CloudWiFi for venues that cannot afford messy guest Wi-Fi",
    );

    expect(includedFeatures).not.toContain("Guest and staff separation");
    expect(pricingTiers.map((tier) => tier.capacity)).toEqual([
      "Up to 2 APs",
      "Up to 5 APs",
      "Up to 12 APs",
      "Up to 20 APs before custom expansion",
    ]);
    expect(
      pricingTiers.find((tier) => tier.name === "Campus")?.features,
    ).not.toContain("Multi-site management");
  });

  it("provides safe destinations, image formats, landmarks, and accessible CloudWiFi actions", () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<CloudWiFiPage />);
    });

    const anchors = renderer!.root.findAllByType("a");
    const toolkit = anchors.find((anchor) =>
      textOf(anchor).includes("Open connectivity guide"),
    );
    expect(toolkit?.props.href).toBe("/resources/connectivity-guide");

    const expert = anchors.find((anchor) =>
      textOf(anchor).includes("Talk to an expert"),
    );
    expect(expert?.props.href).toBe(
      getWhatsAppLink(
        "Hi CircleTel, I would like to speak to an expert about CloudWiFi.",
      ),
    );
    expect(expert?.props.target).toBe("_blank");
    expect(expert?.props.rel).toBe("noopener noreferrer");

    const sources = renderer!.root.findAllByType("source");
    expect(sources.slice(0, 3).map((source) => source.props.type)).toEqual([
      "image/avif",
      "image/webp",
      "image/jpeg",
    ]);

    const imageAlts = renderer!.root
      .findAllByType("img")
      .map((image) => image.props.alt);
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

    for (const section of renderer!.root.findAllByType("section")) {
      const labelledBy = section.props["aria-labelledby"];
      if (!labelledBy) continue;
      const heading = renderer!.root.findAll(
        (node) =>
          (node.type === "h1" || node.type === "h2") &&
          node.props.id === labelledBy,
      );
      expect(heading).toHaveLength(1);
    }

    const skipLink = renderer!.root.findByProps({ href: "#main-content" });
    expect(skipLink.props.className).toContain(
      "focus:ring-circleTel-orange-accessible",
    );
    expect(skipLink.props.className).not.toMatch(
      /focus:ring-circleTel-orange(?:\s|$)/,
    );
    expect(renderer!.root.findByProps({ id: "main-content" }).type).toBe(
      "main",
    );
    const shell = renderer!.root
      .findAllByType("div")
      .find((node) => node.props.className?.includes("min-h-screen"));
    expect((shell?.children[0] as TestRenderer.ReactTestInstance).type).toBe(
      "a",
    );
    expect(
      textOf(shell?.children[1] as TestRenderer.ReactTestInstance),
    ).toContain("Production navigation");

    const primaryActions = renderer!.root
      .findAllByType("button")
      .filter((button) => textOf(button).includes("Request a site survey"));
    expect(primaryActions).toHaveLength(2);
    for (const action of primaryActions) {
      expect(action.props.className).toContain(
        "bg-circleTel-orange-accessible",
      );
      expect(action.props.className).not.toContain("bg-circleTel-orange ");
    }

    const processNumbers = renderer!.root.findAll(
      (node) =>
        node.type === "div" &&
        typeof node.props.className === "string" &&
        node.props.className.includes("h-12 w-12 flex-none") &&
        ["1", "2", "3", "4"].includes(textOf(node)),
    );
    expect(processNumbers).toHaveLength(4);
    for (const number of processNumbers) {
      expect(number.props.className).toContain(
        "bg-circleTel-orange-accessible",
      );
    }
  });

  it("owns canonical and social metadata for the replacement page", () => {
    expect(metadata).toMatchObject({
      alternates: { canonical: "/products/cloudwifi" },
      openGraph: {
        title: "CloudWiFi Managed Wi-Fi as a Service | CircleTel",
        url: "/products/cloudwifi",
        type: "website",
        images: ["/images/cloudwifi/cloudwifi-hero.jpg"],
      },
      twitter: {
        card: "summary_large_image",
        title: "CloudWiFi Managed Wi-Fi as a Service | CircleTel",
        images: ["/images/cloudwifi/cloudwifi-hero.jpg"],
      },
    });
    expect(metadata.openGraph).toHaveProperty(
      "description",
      metadata.description,
    );
    expect(metadata.twitter).toHaveProperty(
      "description",
      metadata.description,
    );
  });

  it("keeps the Wi-Fi toolkit URL functional with a permanent redirect", () => {
    WifiToolkitRedirect();
    expect(permanentRedirect).toHaveBeenCalledWith(
      "/resources/connectivity-guide",
    );
  });
});
