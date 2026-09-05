import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { IconType } from "react-icons";
import {
  PiBlueprintBold,
  PiChartBarBold,
  PiClipboardTextBold,
  PiCloudBold,
  PiGearBold,
  PiPulseBold,
  PiShieldCheckBold,
  PiUsersThreeBold,
  PiUserSwitchBold,
  PiWallBold,
  PiWifiHighBold,
  PiWrenchBold,
} from "react-icons/pi";

import { CloudWifiEstimateModal } from "@/components/cloudwifi/CloudWifiEstimateModal";
import { CloudWifiSurveyCta } from "@/components/cloudwifi/CloudWifiSurveyCta";
import { CloudWifiSurveyProvider } from "@/components/cloudwifi/CloudWifiSurveyProvider";
import {
  includedFeatures,
  pricingTiers,
  processSteps,
  venueTypes,
} from "@/components/cloudwifi/content";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { getTenantConfig } from "@/lib/tenant";

const companyName = getTenantConfig().branding.companyName;
const title = `CloudWiFi buying guide | ${companyName}`;
const description =
  "How to choose managed CloudWiFi for a South African venue, understand guide pricing, and book a site survey.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/resources/cloudwifi-guide" },
};

const includedFeatureIcons = {
  "Wi-Fi design based on your site survey": PiClipboardTextBold,
  "Professional installation — scope and fees quoted": PiWrenchBold,
  "Enterprise Wi-Fi 6 access points": PiWifiHighBold,
  "Guest network": PiUserSwitchBold,
  "Managed cloud platform": PiCloudBold,
  "Proactive monitoring": PiPulseBold,
  "Proactive maintenance": PiGearBold,
  "Firmware and security updates": PiShieldCheckBold,
  "Monthly reporting": PiChartBarBold,
} as const satisfies Record<(typeof includedFeatures)[number], IconType>;

const sizingGuides = [
  {
    title: "Floor area",
    description: "How much usable space needs coverage.",
    icon: PiBlueprintBold,
  },
  {
    title: "How many people",
    description: "Peak visitors and staff using Wi-Fi at the same time.",
    icon: PiUsersThreeBold,
  },
  {
    title: "Walls and materials",
    description:
      "Thick walls, glass and metal can block signal and need extra access points.",
    icon: PiWallBold,
  },
  {
    title: "Your internet connection",
    description:
      "How fast and reliable the internet coming into the building is. Fibre is usually strongest.",
    icon: PiWifiHighBold,
  },
] as const;

function GuideCta() {
  return (
    <CloudWifiSurveyCta
      variant="cta"
      size="xl"
      className="min-h-12 rounded-xl bg-circleTel-orange-accessible px-8"
    >
      Request a site survey
    </CloudWifiSurveyCta>
  );
}

function IconWell({ icon: Icon }: { icon: IconType }) {
  return (
    <span className="flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-circleTel-navy text-white">
      <Icon aria-hidden="true" className="h-5 w-5" />
    </span>
  );
}

function CoverageScale({ level }: { level: number }) {
  return (
    <div
      aria-hidden="true"
      className="flex h-10 items-end gap-1"
    >
      {[1, 2, 3, 4].map((bar) => (
        <span
          key={bar}
          className={`w-2 rounded-sm ${
            bar <= level
              ? "bg-circleTel-orange-accessible"
              : "bg-circleTel-navy/15"
          }`}
          style={{ height: `${10 + bar * 6}px` }}
        />
      ))}
    </div>
  );
}

export default function CloudWifiGuidePage() {
  return (
    <div className="min-h-screen bg-circleTel-lightNeutral text-circleTel-navy">
      <Navbar />
      <CloudWifiSurveyProvider>
        <main id="main-content" className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <p className="font-heading text-sm font-bold uppercase tracking-[0.14em] text-circleTel-orange-accessible">
            Buying guide
          </p>
          <h1 className="mt-3 max-w-3xl font-heading text-4xl font-bold md:text-5xl">
            How to choose CloudWiFi for your venue
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-circleTel-secondaryNeutral">
            CloudWiFi is managed Wi-Fi as a service. {companyName} designs,
            installs, owns and looks after the network. You get reliable guest
            and staff Wi-Fi without buying or running the equipment yourself.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <GuideCta />
            <Link
              href="/products/cloudwifi#venues"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-circleTel-navy/20 px-6 font-semibold"
            >
              See venue examples
            </Link>
          </div>

          <section className="mt-16" aria-labelledby="guide-who">
            <h2 id="guide-who" className="font-heading text-3xl font-bold">
              Who it is for
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-circleTel-secondaryNeutral">
              Typical sites are hotels, shops, residential and commercial
              property, clinics, schools, and public venues. If visitors or
              staff need reliable Wi-Fi every day, a site survey is the right
              first step.
            </p>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {venueTypes.map((venue) => {
                const Icon = venue.icon;
                return (
                  <li
                    key={venue.value}
                    className="overflow-hidden rounded-lg border border-ui-border bg-white"
                  >
                    <div className="relative aspect-[4/3] bg-circleTel-lightNeutral">
                      <picture className="absolute inset-0 block">
                        <source
                          srcSet={`${venue.imageBase}.avif`}
                          type="image/avif"
                        />
                        <source
                          srcSet={`${venue.imageBase}.webp`}
                          type="image/webp"
                        />
                        <source
                          srcSet={`${venue.imageBase}.jpg`}
                          type="image/jpeg"
                        />
                        <Image
                          src={`${venue.imageBase}.jpg`}
                          alt={venue.imageAlt}
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover"
                        />
                      </picture>
                      <span className="absolute bottom-3 left-3 flex h-10 w-10 items-center justify-center rounded-lg bg-circleTel-navy text-white shadow-sm">
                        <Icon aria-hidden="true" className="h-5 w-5" />
                      </span>
                    </div>
                    <div className="p-5">
                      <p className="font-heading text-lg font-bold">
                        {venue.title}
                      </p>
                      <p className="mt-2 text-base text-circleTel-secondaryNeutral">
                        {venue.description}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="mt-16" aria-labelledby="guide-included">
            <h2 id="guide-included" className="font-heading text-3xl font-bold">
              What you get
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-circleTel-secondaryNeutral">
              Every tier includes design, Wi-Fi 6 access points, a
              guest network, and a vendor-neutral managed cloud platform. We
              choose hardware that fits the site. You are not locked to one
              brand. Installation scope and once-off fees are confirmed in your quote.
            </p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {includedFeatures.map((feature) => {
                const Icon = includedFeatureIcons[feature];
                return (
                  <li
                    key={feature}
                    className="flex items-center gap-3 rounded-lg border border-ui-border bg-white px-4 py-3"
                  >
                    <IconWell icon={Icon} />
                    <span className="text-base font-medium">{feature}</span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="mt-16" aria-labelledby="guide-sizing">
            <h2 id="guide-sizing" className="font-heading text-3xl font-bold">
              How we size a site
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-circleTel-secondaryNeutral">
              The online estimator is a guide only. These are the things that
              change the final design and monthly price:
            </p>
            <ul className="mt-8 grid gap-4 md:grid-cols-2">
              {sizingGuides.map((guide) => (
                <li
                  key={guide.title}
                  className="rounded-lg border border-ui-border bg-white p-5"
                >
                  <IconWell icon={guide.icon} />
                  <p className="mt-4 font-heading text-lg font-bold">
                    {guide.title}
                  </p>
                  <p className="mt-2 text-base text-circleTel-secondaryNeutral">
                    {guide.description}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-16" aria-labelledby="guide-tiers">
            <h2 id="guide-tiers" className="font-heading text-3xl font-bold">
              Guide prices
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-circleTel-secondaryNeutral">
              These starting prices cover Wi-Fi only and exclude VAT. Internet connectivity is quoted and billed separately. A site survey confirms the
              final tier and monthly amount.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {pricingTiers.map((tier, index) => (
                <article
                  key={tier.name}
                  className={`rounded-lg border border-t-4 border-ui-border bg-white p-5 ${tier.accentClassName}`}
                >
                  <CoverageScale level={index + 1} />
                  <h3 className="mt-4 font-heading text-xl font-bold">
                    {tier.name}
                  </h3>
                  <p className="mt-2 text-base text-circleTel-secondaryNeutral">
                    {tier.guide}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-circleTel-navy">
                    {tier.apRange}
                  </p>
                  <p className="mt-4 font-heading text-2xl font-bold">
                    {tier.price}
                    <span className="ml-1 text-base font-normal text-circleTel-secondaryNeutral">
                      /mo
                    </span>
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-16" aria-labelledby="guide-survey">
            <h2 id="guide-survey" className="font-heading text-3xl font-bold">
              What happens on a site survey
            </h2>
            <ol className="relative mt-8 grid gap-4 md:grid-cols-4">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-[12%] right-[12%] top-10 hidden h-0.5 bg-circleTel-orange-accessible/30 md:block"
              />
              {processSteps.map((step, index) => (
                <li
                  key={step.title}
                  className="relative rounded-lg border border-ui-border bg-white p-5"
                >
                  <IconWell icon={step.icon} />
                  <p className="mt-4 font-heading text-sm font-bold text-circleTel-orange-accessible">
                    Step {index + 1}
                  </p>
                  <h3 className="mt-2 font-heading text-lg font-bold">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-base text-circleTel-secondaryNeutral">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-16 rounded-2xl bg-circleTel-navy px-6 py-10 text-white sm:px-10">
            <h2 className="font-heading text-3xl font-bold">
              Ready to book a site survey?
            </h2>
            <p className="mt-3 max-w-2xl text-lg text-white/80">
              Takes about two minutes. No commitment. We will confirm the right
              design and price on site.
            </p>
            <div className="mt-6">
              <GuideCta />
            </div>
          </section>
        </main>
        <CloudWifiEstimateModal />
      </CloudWifiSurveyProvider>
      <Footer />
    </div>
  );
}
