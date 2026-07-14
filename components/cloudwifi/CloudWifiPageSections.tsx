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
  addOns,
  includedFeatures,
  priceDrivers,
  pricingTiers,
  processSteps,
  venueTypes,
  whyCircleTel,
} from "@/components/cloudwifi/content";
import { Button } from "@/components/ui/button";
import { getWhatsAppLink } from "@/lib/constants/contact";

const expertMessage =
  "Hi CircleTel, I would like to speak to an expert about CloudWiFi.";

function SectionIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="mx-auto max-w-3xl text-center">
      <p className="font-heading text-sm font-bold uppercase tracking-[0.14em] text-circleTel-orange-accessible">
        {eyebrow}
      </p>
      <h2 className="mt-3 font-heading text-3xl font-bold tracking-[-0.01em] text-circleTel-navy md:text-4xl">
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
  return (
    <section
      aria-labelledby="cloudwifi-venues-heading"
      className="bg-white py-16 md:py-24"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div id="cloudwifi-venues-heading">
          <SectionIntro
            eyebrow="Built for every venue"
            title="Great Wi-Fi experiences for your visitors and teams."
          />
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {venueTypes.map((venue) => {
            const Icon = venue.icon;
            return (
              <article
                key={venue.title}
                className="overflow-hidden rounded-lg border border-ui-border bg-white"
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
              </article>
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
        <div id="cloudwifi-pricing-heading">
          <SectionIntro
            eyebrow="Simple, transparent pricing"
            title="Survey-led and access point based."
            description="Choose a guide tier now. The site survey confirms the network design and your final monthly price."
          />
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {pricingTiers.map((tier) => (
            <article
              key={tier.name}
              className={`flex h-full flex-col rounded-lg border border-t-4 border-ui-border bg-white p-6 shadow-sm ${tier.accentClassName}`}
            >
              <h3 className="font-heading text-xl font-bold text-circleTel-navy">
                {tier.name}
              </h3>
              <p className="mt-5 text-base font-semibold text-circleTel-secondaryNeutral">
                {tier.guide}
              </p>
              <p className="mt-1 text-base text-circleTel-secondaryNeutral">
                {tier.apRange}
              </p>
              <p className="mt-7 text-base text-circleTel-secondaryNeutral">
                from
              </p>
              <p className="mt-1 font-heading text-3xl font-bold text-circleTel-navy">
                {tier.price}
                <span className="ml-1 font-body text-base font-normal text-circleTel-secondaryNeutral">
                  /mo
                </span>
              </p>
              <p className="mt-2 text-base font-medium text-circleTel-navy">
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
      <div className="grid overflow-hidden rounded-lg border border-ui-border bg-white md:grid-cols-2 xl:grid-cols-4">
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
        </div>
        <div className="border-t border-ui-border p-6 md:border-l md:border-t-0 xl:p-7">
          <h3 className="font-heading text-lg font-bold text-circleTel-navy">
            Included in every tier
          </h3>
          <CheckList items={includedFeatures} />
        </div>
        <div className="border-t border-ui-border p-6 xl:border-l xl:border-t-0 xl:p-7">
          <p className="font-heading text-sm font-bold uppercase tracking-[0.12em] text-circleTel-orange-accessible">
            Optional enhancements
          </p>
          <h3 className="mt-2 font-heading text-lg font-bold text-circleTel-navy">
            Powerful add-ons
          </h3>
          <p className="mt-2 text-base text-circleTel-secondaryNeutral">
            Quoted separately from the base tier.
          </p>
          <CheckList items={addOns} />
        </div>
        <div className="border-t border-ui-border p-6 md:border-l xl:border-t-0 xl:p-7">
          <h3 className="font-heading text-lg font-bold text-circleTel-navy">
            Why CircleTel?
          </h3>
          <CheckList items={whyCircleTel} />
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
              <div className="relative z-10 flex h-12 w-12 flex-none items-center justify-center rounded-full bg-circleTel-orange font-heading font-bold text-white">
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
      className="bg-white py-16 md:py-24"
    >
      <div className="container mx-auto grid gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8 xl:grid-cols-[minmax(0,1fr)_420px]">
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
              A site survey is the best first step to reliable, secure and
              high-performing Wi-Fi.
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
              className="min-h-12 w-full rounded-xl focus-visible:ring-white"
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
              <Link href={getWhatsAppLink(expertMessage)}>
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
      <VenueSection />
      <PricingSection />
      <LowerInformationSection />
      <FinalCtaSection />
    </>
  );
}
