import type { Metadata } from "next";

import { CloudWifiEstimateModal } from "@/components/cloudwifi/CloudWifiEstimateModal";
import { CloudWifiLandingPage } from "@/components/cloudwifi/CloudWifiLandingPage";
import { CloudWifiSurveyProvider } from "@/components/cloudwifi/CloudWifiSurveyProvider";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { getTenantConfig } from "@/lib/tenant";

const companyName = getTenantConfig().branding.companyName;
const title = `CloudWiFi Managed Wi-Fi as a Service | ${companyName}`;
const description = `Find the right managed CloudWiFi tier for your venue and request a survey-led Wi-Fi design from ${companyName}.`;
const heroImage = "/images/cloudwifi/cloudwifi-hero.jpg";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/products/cloudwifi" },
  openGraph: {
    title,
    description,
    url: "/products/cloudwifi",
    type: "website",
    images: [heroImage],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [heroImage],
  },
};

export default function CloudWiFiPage() {
  return (
    <div className="min-h-screen bg-circleTel-lightNeutral text-circleTel-navy">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-white px-4 py-3 font-semibold text-circleTel-navy shadow-lg focus:fixed focus:left-4 focus:top-4 focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-circleTel-orange-accessible"
      >
        Skip to main content
      </a>
      <Navbar />
      <CloudWifiSurveyProvider>
        <CloudWifiLandingPage />
        <CloudWifiEstimateModal />
      </CloudWifiSurveyProvider>
      <Footer />
    </div>
  );
}
