import type { Metadata } from "next";

import { CloudWifiLandingPage } from "@/components/cloudwifi/CloudWifiLandingPage";
import { CloudWifiSurveyProvider } from "@/components/cloudwifi/CloudWifiSurveyProvider";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "CloudWiFi Managed Wi-Fi as a Service | CircleTel",
  description:
    "Find the right managed CloudWiFi tier for your venue and request a survey-led Wi-Fi design from CircleTel.",
};

export default function CloudWiFiPage() {
  return (
    <div className="min-h-screen bg-circleTel-lightNeutral text-circleTel-navy">
      <Navbar />
      <CloudWifiSurveyProvider>
        <CloudWifiLandingPage />
      </CloudWifiSurveyProvider>
      <Footer />
    </div>
  );
}
