import Image from "next/image";
import Link from "next/link";
import {
  PiArrowRightBold,
  PiCheckBold,
  PiChatCircleDotsBold,
  PiGlobeHemisphereWestBold,
  PiMapTrifoldBold,
  PiShieldCheckBold,
} from "react-icons/pi";

import { CloudWifiSurveyCta } from "@/components/cloudwifi/CloudWifiSurveyCta";
import { CloudWifiSurveyWizard } from "@/components/cloudwifi/CloudWifiSurveyWizard";
import {
  addOnHighlights,
  includedFeatureHighlights,
  priceDrivers,
  pricingTiers,
  primaryVenueTypes,
  processSteps,
  proofStripCopy,
  secondaryVenueLabels,
  whyCircleTel,
} from "@/components/cloudwifi/content";
import { Button } from "@/components/ui/button";
import { getWhatsAppLink } from "@/lib/constants/contact";

const expertMessage =
  "Hi CircleTel, I would like to speak to an expert about CloudWiFi.";

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

function ProofStrip() {
  return (
    <aside
      aria-label="Social proof"
      className="border-y border-ui-border bg-white py-8"
    >
      <div className="container mx-auto flex flex-col gap-6 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p className="max-w-md text-base font-semibold leading-7 text-circleTel-navy">
          {proofStripCopy}
        </p>
        <ul className="flex flex-wrap gap-3" aria-label="Customer logos pending">
          {["Operator", "Clinic group", "Retail group", "Campus"].map(
            (label) => (
              <li
                key={label}
                className="flex h-11 min-w-[7.5rem] items-center justify-center rounded-md border border-dashed border-ui-border bg-circleTel-lightNeutral px-3 text-sm font-bold text-circleTel-secondaryNeutral"
              >
                {label}
              </li>
            ),
          )}
        </ul>
      </div>
    </aside>
  );
}

function VenueSection() {
  return (
    <section
      aria-labelledby="cloudwifi-venues-heading"
      className="bg-circleTel-lightNeutral py-16 md:py-24"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SectionIntro
          id="cloudwifi-venues-heading"
          eyebrow="Built for venues"
          title="Wi-Fi that matches how your space actually runs."
          description="Start with the story that fits you. The site survey tunes coverage, capacity and segmentation."
        />

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {primaryVenueTypes.map((venue) => {
            const Icon = venue.icon;
            return (
              <article
                key={venue.title}
                className="overflow-hidden rounded-lg border border-ui-border bg-white transition-transform duration-200 hover:-translate-y-0.5"
              >
                <picture className="relative block aspect-[16/10] overflow-hidden bg-circleTel-lightNeutral">
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
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover transition-transform duration-300 hover:scale-[1.02]"
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
              </article>
            );
          })}
        </div>

        <ul
          className="mt-6 flex flex-wrap gap-2"
          aria-label="Also suited to"
        >
          {secondaryVenueLabels.map((label) => (
            <li
              key={label}
              className="rounded-full border border-ui-border bg-white px-3.5 py-2 text-sm font-semibold text-circleTel-navy"
            >
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section
      id="cloudwifi-pricing"
      aria-labelledby="cloudwifi-pricing-heading"
      className="py-16 md:py-24"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SectionIntro
          id="cloudwifi-pricing-heading"
          eyebrow="Guide pricing"
          title="Survey-led and access point based."
          description="Choose a guide tier now. The site survey confirms the network design and your final monthly price."
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {pricingTiers.map((tier) => (
            <article
              key={tier.name}
              className={`relative flex h-full flex-col rounded-lg border border-t-4 bg-white p-6 shadow-sm ${
                tier.recommended
                  ? "border-[#e2b48a] border-t-circleTel-orange bg-gradient-to-b from-circleTel-orange-light to-white xl:-translate-y-1"
                  : `border-ui-border ${tier.accentClassName}`
              }`}
            >
              {tier.recommended ? (
                <span className="absolute right-4 top-4 rounded-full bg-circleTel-orange-accessible px-2.5 py-1 text-xs font-extrabold uppercase tracking-wide text-white">
                  Most venues
                </span>
              ) : null}
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
              <CheckList items={tier.features} />
              <p className="mt-auto border-t border-ui-border pt-6 text-base text-circleTel-secondaryNeutral">
                Survey required
              </p>
            </article>
          ))}
        </div>

        <p className="mx-auto mt-8 max-w-4xl text-center text-base leading-7 text-circleTel-secondaryNeutral">
          Prices exclude VAT. Fair-usage terms apply. Additional access points
          are available at extra cost. A site survey confirms the final tier and
          price.
        </p>
      </div>
    </section>
  );
}

function ManagedServiceDetail() {
  return (
    <section
      aria-labelledby="cloudwifi-managed-heading"
      className="border-t border-ui-border pt-16"
    >
      <div className="grid overflow-hidden rounded-lg border border-ui-border bg-white md:grid-cols-2">
        <div className="p-6 xl:p-7">
          <h2
            id="cloudwifi-managed-heading"
            className="font-heading text-2xl font-bold text-circleTel-navy"
          >
            Fully managed Wi-Fi, end to end.
          </h2>
          <p className="mt-4 text-base leading-7 text-circleTel-secondaryNeutral">
            We take care of every stage so your team can focus on the venue.
          </p>
          <h3 className="mt-8 font-heading text-lg font-bold text-circleTel-navy">
            Every tier includes
          </h3>
          <CheckList items={includedFeatureHighlights} />
          <p className="mt-4 text-sm text-circleTel-secondaryNeutral">
            Plus guest network, Wi-Fi 6 access points, maintenance and monthly
            reporting.
          </p>
        </div>
        <div className="border-t border-ui-border p-6 md:border-l md:border-t-0 xl:p-7">
          <h3 className="font-heading text-lg font-bold text-circleTel-navy">
            Why CircleTel
          </h3>
          <CheckList items={whyCircleTel} />
          <p className="mt-8 font-heading text-sm font-bold uppercase tracking-[0.12em] text-circleTel-orange-accessible">
            Optional add-ons
          </p>
          <p className="mt-2 text-base text-circleTel-secondaryNeutral">
            Quoted separately from the base tier.
          </p>
          <CheckList items={addOnHighlights} />
        </div>
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
          From survey to steady operation.
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

function LowerInformationSection() {
  return (
    <section
      aria-labelledby="cloudwifi-price-drivers-heading"
      className="bg-circleTel-lightNeutral py-16 md:py-24"
    >
      <div className="container mx-auto grid gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="min-w-0">
          <header>
            <h2
              id="cloudwifi-price-drivers-heading"
              className="font-heading text-3xl font-bold text-circleTel-navy md:text-4xl"
            >
              What shapes the final quote?
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-circleTel-secondaryNeutral">
              Three things matter most. Everything else we settle on the survey.
            </p>
          </header>

          <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-ui-border bg-ui-border sm:grid-cols-3">
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

          <ManagedServiceDetail />
          <ProcessSection />
        </div>

        <div className="min-w-0 lg:pt-1">
          <CloudWifiSurveyWizard />
        </div>
      </div>
    </section>
  );
}

function FinalCtaSection() {
  const trustMarkers = [
    { label: "Local experts", icon: PiMapTrifoldBold },
    { label: "Nationwide support", icon: PiGlobeHemisphereWestBold },
    { label: "Secure and compliant", icon: PiShieldCheckBold },
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
              Let&apos;s get your venue&apos;s Wi-Fi right.
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-white/80">
              A site survey is the clearest first step to reliable, secure
              connectivity.
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
              Request a site survey
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
                Talk to an expert
              </Link>
            </Button>
            <p className="text-center text-base text-white/75">
              Takes two minutes. No commitment.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CloudWifiPageSections() {
  return (
    <>
      <ProofStrip />
      <VenueSection />
      <PricingSection />
      <LowerInformationSection />
      <FinalCtaSection />
    </>
  );
}
