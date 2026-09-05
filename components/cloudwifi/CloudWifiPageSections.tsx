"use client";

import Image from "next/image";
import Link from "next/link";
import { PiArrowRightBold, PiCheckBold, PiChatCircleDotsBold } from "react-icons/pi";
import {
  BuildingIcon as PiBuildingsBold,
  GlobeIcon as PiGlobeHemisphereWestBold,
  MapIcon as PiMapTrifoldBold,
  ShieldIcon as PiShieldCheckBold,
  RetailIcon as PiStorefrontBold,
} from "@/components/cloudwifi/CloudWifiIcons";

import { CloudWifiSurveyCta } from "@/components/cloudwifi/CloudWifiSurveyCta";
import { useCloudWifiSurvey } from "@/components/cloudwifi/CloudWifiSurveyProvider";
import {
  priceDrivers,
  pricingTiers,
  processSteps,
  venueTypes,
} from "@/components/cloudwifi/content";
import { Button } from "@/components/ui/button";
import { getWhatsAppLink } from "@/lib/constants/contact";
import { getTenantConfig } from "@/lib/tenant";

const expertMessage = `Hi ${getTenantConfig().branding.companyName}, I would like to speak to an expert about CloudWiFi.`;

function SectionIntro({
  id,
  eyebrow,
  title,
  description,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="mx-auto max-w-3xl text-center">
      <p className="font-heading text-sm font-bold uppercase tracking-[0.14em] text-circleTel-orange-accessible">
        {eyebrow}
      </p>
      <h2
        id={id}
        className="mt-3 font-heading text-3xl font-bold tracking-[-0.01em] text-circleTel-navy md:text-4xl"
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-lg leading-8 text-circleTel-secondaryNeutral">
          {description}
        </p>
      ) : null}
    </header>
  );
}

function CheckList({ items }: { items: readonly string[] }) {
  return (
    <ul className="mt-5 space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-base leading-6">
          <PiCheckBold
            aria-hidden="true"
            className="mt-1 h-4 w-4 flex-none text-circleTel-orange-accessible"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function VenueSection() {
  const { requestSurvey } = useCloudWifiSurvey();

  return (
    <section
      aria-labelledby="cloudwifi-venues-heading"
      className="bg-circleTel-lightNeutral py-16 md:py-24"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SectionIntro
          id="cloudwifi-venues-heading"
          eyebrow="For retail and property teams"
          title="Managed Wi-Fi built around the spaces you look after."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-circleTel-navy/10 bg-white p-6 shadow-sm sm:p-8">
            <PiStorefrontBold
              aria-hidden="true"
              className="h-10 w-10 text-circleTel-orange-accessible"
            />
            <h3 className="mt-5 font-heading text-2xl font-bold text-circleTel-navy">
              Guest Wi-Fi is part of your customer experience.
            </h3>
            <p className="mt-4 text-base leading-7 text-circleTel-secondaryNeutral">
              {`Give customers a dedicated guest network, with installation and ongoing management handled by ${getTenantConfig().branding.companyName}.`}
            </p>
          </article>
          <article className="rounded-2xl border border-circleTel-navy/10 bg-white p-6 shadow-sm sm:p-8">
            <PiBuildingsBold
              aria-hidden="true"
              className="h-10 w-10 text-circleTel-navy"
            />
            <h3 className="mt-5 font-heading text-2xl font-bold text-circleTel-navy">
              A clear plan for your building’s Wi-Fi.
            </h3>
            <p className="mt-4 text-base leading-7 text-circleTel-secondaryNeutral">
              Start with a site survey that considers your layout and usage,
              backed by ongoing monitoring and maintenance.
            </p>
          </article>
        </div>

        <div
          id="venues"
          className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
        >
          {venueTypes.map((venue) => {
            const Icon = venue.icon;
            return (
              <button
                key={venue.title}
                type="button"
                data-cloudwifi-survey-opener="true"
                className="overflow-hidden rounded-lg border border-ui-border bg-white text-left outline-none transition hover:border-circleTel-orange-accessible hover:shadow-md focus-visible:ring-2 focus-visible:ring-circleTel-orange-accessible focus-visible:ring-offset-2"
                onClick={(event) =>
                  requestSurvey({ venueType: venue.value }, event.currentTarget)
                }
              >
                <picture className="relative block aspect-[4/3] overflow-hidden bg-circleTel-lightNeutral">
                  <source
                    srcSet={`${venue.imageBase}.avif`}
                    type="image/avif"
                  />
                  <source
                    srcSet={`${venue.imageBase}.webp`}
                    type="image/webp"
                  />
                  <source srcSet={`${venue.imageBase}.jpg`} type="image/jpeg" />
                  <Image
                    src={`${venue.imageBase}.jpg`}
                    alt={venue.imageAlt}
                    fill
                    sizes="(min-width: 1280px) 16vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                </picture>
                <div className="p-5">
                  <div className="flex items-center gap-3">
                    <Icon
                      aria-hidden="true"
                      className="h-7 w-7 flex-none text-circleTel-navy"
                    />
                    <h3 className="font-heading text-lg font-bold text-circleTel-navy">
                      {venue.title}
                    </h3>
                  </div>
                  <p className="mt-3 text-base leading-6 text-circleTel-secondaryNeutral">
                    {venue.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section
      aria-labelledby="cloudwifi-pricing-heading"
      className="py-16 md:py-24"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SectionIntro
          id="cloudwifi-pricing-heading"
          eyebrow="Simple, transparent pricing"
          title="Survey-led and access point based."
          description="Choose a guide tier now. The site survey confirms the network design and your final monthly price."
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {pricingTiers.map((tier) => (
            <article
              key={tier.name}
              className={`flex h-full flex-col rounded-lg border border-t-4 border-ui-border bg-white p-6 shadow-sm ${tier.accentClassName}`}
            >
              <h3 className="font-heading text-xl font-bold text-circleTel-navy">
                {tier.name}
              </h3>
              <p className="mt-5 text-base font-semibold tabular-nums text-circleTel-secondaryNeutral">
                {tier.guide}
              </p>
              <p className="mt-1 text-base tabular-nums text-circleTel-secondaryNeutral">
                {tier.apRange}
              </p>
              <p className="mt-7 text-base text-circleTel-secondaryNeutral">
                from
              </p>
              <p className="mt-1 font-heading text-3xl font-bold tabular-nums text-circleTel-navy">
                {tier.price}
                <span className="ml-1 font-body text-base font-normal text-circleTel-secondaryNeutral">
                  /mo
                </span>
              </p>
              <p className="mt-2 text-base font-medium tabular-nums text-circleTel-navy">
                {tier.capacity}
              </p>
              <p className="mt-2 text-sm font-medium text-circleTel-secondaryNeutral">Excl. VAT · {tier.term}</p>
              <dl className="mt-5 divide-y divide-circleTel-navy/10 border-y border-circleTel-navy/10 text-sm">
                {[
                  ["Access points", tier.capacity],
                  ["Internet", tier.internet],
                  ["Support", tier.support],
                  ["Contract", tier.term],
                ].map(([label, value]) => (
                  <div key={label} className="py-3">
                    <dt className="font-semibold text-circleTel-navy">{label}</dt>
                    <dd className="mt-1 leading-6 text-circleTel-secondaryNeutral">{value}</dd>
                  </div>
                ))}
              </dl>
              <CheckList items={tier.features} />
              <CloudWifiSurveyCta
                variant="outline"
                planInterest={tier.name}
                className="mt-auto min-h-11 border-circleTel-navy/20 pt-0 text-base font-semibold text-circleTel-navy hover:bg-circleTel-lightNeutral"
              >
                {`Check ${tier.name} fit`}
              </CloudWifiSurveyCta>
            </article>
          ))}
        </div>

        <section
          aria-labelledby="cloudwifi-commercial-heading"
          className="mt-8 overflow-hidden rounded-2xl border border-circleTel-navy/10 bg-white shadow-sm"
        >
          <div className="border-b border-circleTel-navy/10 bg-circleTel-navy px-6 py-5 text-white sm:px-8">
            <h3
              id="cloudwifi-commercial-heading"
              className="font-heading text-2xl font-bold"
            >
              What your monthly service covers
            </h3>
            <p className="mt-2 max-w-3xl text-base leading-7 text-white/80">
              CloudWiFi is a managed service: {getTenantConfig().branding.companyName} designs, installs, owns
              and looks after the Wi-Fi network.
            </p>
          </div>
          <div className="grid md:grid-cols-3">
            <div className="p-6 sm:p-8">
              <h4 className="font-heading text-lg font-bold text-circleTel-navy">
                Included in every tier
              </h4>
              <CheckList
                items={[
                  `${getTenantConfig().branding.companyName}-owned Wi-Fi 6 equipment`,
                  "Separate guest access",
                  "Remote Wi-Fi management",
                  "Maintenance and security updates",
                ]}
              />
              <p className="mt-4 text-sm leading-6 text-circleTel-secondaryNeutral">
                Site assessment confirms your installation scope. Any installation and once-off charges are listed separately in your quotation.
              </p>
            </div>
            <div className="border-t border-circleTel-navy/10 p-6 sm:p-8 md:border-l md:border-t-0">
              <h4 className="font-heading text-lg font-bold text-circleTel-navy">
                Internet connection
              </h4>
              <p className="mt-5 text-base leading-7 text-circleTel-secondaryNeutral">
                CloudWiFi manages the Wi-Fi network inside your space. The Professional retail bundle includes SkyFibre Business 100, subject to coverage. Other tiers and business fibre are quoted with their connectivity requirements.
              </p>
              <p className="mt-3 text-base leading-7 text-circleTel-secondaryNeutral">
                Additional access points are available at extra cost. Optional
                enhancements are quoted separately. A site survey confirms the
                final tier and price.
              </p>
            </div>
            <div className="border-t border-circleTel-navy/10 p-6 sm:p-8 md:border-l md:border-t-0">
              <h4 className="font-heading text-lg font-bold text-circleTel-navy">
                Built for ongoing confidence
              </h4>
              <CheckList
                items={[
                  "South African team and support",
                  "Vendor-agnostic design",
                  "Proactive monitoring and maintenance",
                  "Monthly performance reporting",
                ]}
              />
            </div>
          </div>
          <p className="border-t border-circleTel-navy/10 px-6 py-4 text-center text-base leading-7 text-circleTel-secondaryNeutral sm:px-8">
            Prices exclude VAT. Fair-usage terms apply. A site survey confirms
            the final design, tier and price.
          </p>
        </section>
      </div>
    </section>
  );
}

function ProcessSection() {
  return (
    <section
      aria-labelledby="cloudwifi-process-heading"
      className="pt-16 md:pt-20"
    >
      <header>
        <p className="font-heading text-sm font-bold uppercase tracking-[0.14em] text-circleTel-orange-accessible">
          Our process
        </p>
        <h2
          id="cloudwifi-process-heading"
          className="mt-3 font-heading text-3xl font-bold text-circleTel-navy"
        >
          From survey to seamless operation.
        </h2>
      </header>

      <ol className="mt-10 grid gap-8 md:grid-cols-4 md:gap-5">
        {processSteps.map((step, index) => {
          const Icon = step.icon;
          return (
            <li key={step.title} className="relative flex gap-4 md:block">
              {index < processSteps.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute left-[calc(50%+2.25rem)] right-[-50%] top-6 hidden border-t border-dashed border-circleTel-navy/35 md:block"
                />
              ) : null}
              <div className="relative z-10 flex h-12 w-12 flex-none items-center justify-center rounded-full bg-circleTel-orange-accessible font-heading font-bold text-white">
                {index + 1}
              </div>
              <div className="md:mt-5">
                <Icon
                  aria-hidden="true"
                  className="mb-3 h-8 w-8 text-circleTel-navy"
                />
                <h3 className="font-heading text-lg font-bold text-circleTel-navy">
                  {step.title}
                </h3>
                <p className="mt-2 text-base leading-6 text-circleTel-secondaryNeutral">
                  {step.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

const commercialQuestions = [
  {
    question: "Do I own the Wi-Fi equipment?",
    answer:
      `${getTenantConfig().branding.companyName} owns the equipment supplied under the managed service and looks after its configuration and maintenance. Equipment return and end-of-contract arrangements are set out in your quotation and service agreement.`,
  },
  {
    question: "Is internet connectivity included?",
    answer:
      "The Professional retail bundle includes SkyFibre Business 100, subject to coverage. Business fibre and connectivity for other tiers are quoted separately. Your quotation confirms the connection, monthly charges and any once-off fees before you commit.",
  },
  {
    question: "What support can I expect?",
    answer:
      "Professional includes business-hours assisted support, remote monitoring, maintenance and security updates. Monitoring is not a promise of 24/7 staffed support. Your service agreement confirms support hours and response commitments.",
  },
  {
    question: "Can I access my network remotely?",
    answer:
      "We check your remote-access requirements during assessment. The standard connection uses shared public addressing (CGNAT), with no static public IP or direct inbound access included. Tell us if your application requires a fixed public address so we can assess an appropriate option before quoting.",
  },
  {
    question: "Is the estimate my final quote?",
    answer:
      "No. The estimator suggests a starting plan and monthly guide price. A site survey confirms the final design, tier and price.",
  },
  {
    question: "How is indoor Wi-Fi different from my internet connection?",
    answer:
      "CloudWiFi distributes your internet connection through access points inside your space. A stronger Wi-Fi signal alone cannot resolve every problem with the incoming internet connection.",
  },
  {
    question: "What is included in the monthly service?",
    answer:
        "Every tier provides managed Wi-Fi equipment, guest access, monitoring and maintenance. Installation scope and fees are confirmed in the quotation. Professional retail adds SkyFibre Business 100, separate staff and guest networks, a standard guest portal and business-hours assisted support on a 24-month combined contract.",
  },
  {
    question: "What can cost extra?",
    answer:
        "Published guide prices exclude VAT. Extra access points, cabling beyond the standard allowance, difficult access, after-hours work, travel and any once-off fees are confirmed in your quotation. Custom portal integrations, advanced analytics, LTE/5G failover and multi-site management are quoted separately. Content filtering, advanced traffic policies, LAN optimisation and custom integrations can also be scoped in your quotation. The standard guest portal is included in Professional retail.",
  },
] as const;

function CommercialFaq() {
  return (
    <section
      aria-labelledby="cloudwifi-faq-heading"
      className="border-t border-ui-border pt-16 md:pt-20"
    >
      <header className="max-w-2xl">
        <p className="font-heading text-sm font-bold uppercase tracking-[0.14em] text-circleTel-orange-accessible">
          Before you enquire
        </p>
        <h2
          id="cloudwifi-faq-heading"
          className="mt-3 font-heading text-3xl font-bold text-circleTel-navy"
        >
          CloudWiFi questions, answered.
        </h2>
      </header>
      <div className="mt-8 divide-y divide-circleTel-navy/10 overflow-hidden rounded-2xl border border-circleTel-navy/10 bg-white">
        {commercialQuestions.map((item, index) => (
          <details key={item.question} className="group" open={index === 0}>
            <summary className="cursor-pointer list-none px-6 py-5 font-heading text-lg font-bold text-circleTel-navy outline-none marker:content-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-circleTel-orange-accessible sm:px-8">
              <span className="flex items-center justify-between gap-4">
                {item.question}
                <span
                  aria-hidden="true"
                  className="text-2xl font-normal text-circleTel-orange-accessible group-open:rotate-45"
                >
                  +
                </span>
              </span>
            </summary>
            <p className="px-6 pb-6 text-base leading-7 text-circleTel-secondaryNeutral sm:px-8">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

function LowerInformationSection() {
  return (
    <section
      aria-labelledby="cloudwifi-price-drivers-heading"
      className="bg-circleTel-lightNeutral py-16 md:py-24"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <header>
            <h2
              id="cloudwifi-price-drivers-heading"
              className="font-heading text-3xl font-bold text-circleTel-navy md:text-4xl"
            >
              What drives the price?
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-circleTel-secondaryNeutral">
              Every site is different. These factors determine the right tier
              and final cost.
            </p>
          </header>

          <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-ui-border bg-ui-border sm:grid-cols-2 xl:grid-cols-4">
            {priceDrivers.map((driver) => {
              const Icon = driver.icon;
              return (
                <article key={driver.title} className="bg-white p-6">
                  <Icon
                    aria-hidden="true"
                    className="h-10 w-10 text-circleTel-navy"
                  />
                  <h3 className="mt-5 font-heading text-lg font-bold text-circleTel-navy">
                    {driver.title}
                  </h3>
                  <p className="mt-3 text-base leading-6 text-circleTel-secondaryNeutral">
                    {driver.description}
                  </p>
                </article>
              );
            })}
          </div>
          <p className="mt-6 flex max-w-3xl gap-3 text-base leading-7 text-circleTel-secondaryNeutral">
            <PiShieldCheckBold
              aria-hidden="true"
              className="mt-1 h-5 w-5 flex-none text-circleTel-navy"
            />
            The estimator is a guide. Only a site survey can confirm your
            environment, final tier and price.
          </p>

          <ProcessSection />
          <CommercialFaq />
        </div>
      </div>
    </section>
  );
}

function FinalCtaSection() {
  const trustMarkers = [
    { label: "Local experts", icon: PiMapTrifoldBold },
    { label: "Nationwide support", icon: PiGlobeHemisphereWestBold },
    { label: "Monthly reporting", icon: PiShieldCheckBold },
  ] as const;

  return (
    <section
      aria-labelledby="cloudwifi-final-cta-heading"
      className="px-4 pb-8 sm:px-6 lg:px-8"
    >
      <div className="container mx-auto rounded-2xl bg-circleTel-navy px-6 py-10 text-white sm:px-10 lg:px-14 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
          <div>
            <h2
              id="cloudwifi-final-cta-heading"
              className="font-heading text-3xl font-bold md:text-4xl"
            >
              Ready for less Wi-Fi admin?
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-white/80">
              Start with a plan estimate for your store or property. Your site
              survey then confirms the final design and price.
            </p>
            <ul className="mt-7 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:gap-x-8">
              {trustMarkers.map((marker) => {
                const Icon = marker.icon;
                return (
                  <li
                    key={marker.label}
                    className="flex items-center gap-2 text-base text-white/90"
                  >
                    <Icon
                      aria-hidden="true"
                      className="h-5 w-5 text-circleTel-orange-light"
                    />
                    {marker.label}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <CloudWifiSurveyCta
              variant="cta"
              size="xl"
              className="min-h-12 w-full rounded-xl bg-circleTel-orange-accessible hover:bg-circleTel-orange-accessible hover:brightness-90 focus-visible:ring-white"
            >
              Find my recommended plan
              <PiArrowRightBold aria-hidden="true" />
            </CloudWifiSurveyCta>
            <Button
              asChild
              variant="outline"
              size="xl"
              className="min-h-12 w-full rounded-xl border-2 border-white/75 bg-transparent text-white hover:bg-white hover:text-circleTel-navy focus-visible:ring-white"
            >
              <Link
                href={getWhatsAppLink(expertMessage)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <PiChatCircleDotsBold aria-hidden="true" />
                Talk to a CloudWiFi expert
              </Link>
            </Button>
            <p className="text-center text-base text-white/75">
              Answer 5 quick questions. No commitment.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function MobileEstimateAction() {
  const { mobileOpen } = useCloudWifiSurvey();

  if (mobileOpen) return null;

  return (
    <CloudWifiSurveyCta
      variant="cta"
      size="lg"
      aria-label="Find my recommended CloudWiFi plan"
      className="fixed inset-x-3 bottom-0 z-40 mb-[calc(0.75rem+env(safe-area-inset-bottom))] min-h-12 w-auto rounded-xl bg-circleTel-orange-accessible px-6 text-base shadow-2xl hover:bg-circleTel-orange-accessible hover:brightness-90 focus-visible:ring-circleTel-orange-accessible focus-visible:ring-offset-2 lg:hidden print:hidden"
    >
      Find my recommended plan
      <PiArrowRightBold aria-hidden="true" />
    </CloudWifiSurveyCta>
  );
}

export function CloudWifiPageSections() {
  return (
    <div className="pb-24 lg:pb-0">
      <PricingSection />
      <VenueSection />
      <LowerInformationSection />
      <FinalCtaSection />
      <MobileEstimateAction />
    </div>
  );
}
