import Image from "next/image";
import Link from "next/link";
import { PiArrowRightBold } from "react-icons/pi";

import { CloudWifiSurveyCta } from "@/components/cloudwifi/CloudWifiSurveyCta";
import { CloudWifiTierEstimator } from "@/components/cloudwifi/CloudWifiTierEstimator";
import { serviceAssurances } from "@/components/cloudwifi/content";

export function CloudWifiHero() {
  return (
    <section
      aria-labelledby="cloudwifi-hero-heading"
      className="relative isolate overflow-hidden bg-circleTel-navy text-white"
    >
      <picture className="absolute inset-0 -z-30 block">
        <source
          srcSet="/images/cloudwifi/cloudwifi-hero.avif"
          type="image/avif"
        />
        <source
          srcSet="/images/cloudwifi/cloudwifi-hero.webp"
          type="image/webp"
        />
        <source
          srcSet="/images/cloudwifi/cloudwifi-hero.jpg"
          type="image/jpeg"
        />
        <Image
          src="/images/cloudwifi/cloudwifi-hero.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </picture>
      <div className="absolute inset-0 -z-20 bg-circleTel-navy/80" />
      <div className="absolute inset-y-0 left-0 -z-10 w-2/3 bg-circleTel-navy/35" />

      <div className="container mx-auto grid min-h-[720px] items-center gap-12 px-4 py-16 sm:px-6 md:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(380px,0.78fr)] lg:px-8 lg:py-24">
        <div className="max-w-3xl">
          <p className="font-heading text-2xl font-extrabold tracking-[-0.03em] text-white sm:text-3xl md:text-4xl">
            CircleTel{" "}
            <span className="text-circleTel-orange-light">CloudWiFi</span>
          </p>
          <h1
            id="cloudwifi-hero-heading"
            className="mt-4 max-w-2xl font-heading text-3xl font-bold leading-[1.08] tracking-[-0.02em] text-white sm:text-4xl md:text-5xl"
          >
            Managed Wi-Fi we design, install and run for your venue.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-white/85">
            Reliable guest and staff connectivity for South African venues. One
            local team owns the network end to end, so you stop firefighting
            Wi-Fi.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <CloudWifiSurveyCta
              variant="cta"
              size="xl"
              className="min-h-12 rounded-xl bg-circleTel-orange-accessible px-8 hover:bg-circleTel-orange-accessible hover:brightness-90 focus-visible:ring-white"
            >
              Request a site survey
              <PiArrowRightBold aria-hidden="true" />
            </CloudWifiSurveyCta>
            <Link
              href="#cloudwifi-pricing"
              className="inline-flex min-h-12 items-center justify-center px-2 text-base font-semibold text-white/85 underline decoration-white/50 underline-offset-4 outline-none transition hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-circleTel-navy"
            >
              See guide pricing
            </Link>
          </div>

          <p className="mt-4 text-sm text-white/70">
            Prefer a deeper read?{" "}
            <Link
              href="/resources/connectivity-guide"
              className="font-semibold text-white/85 underline decoration-white/40 underline-offset-4 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-circleTel-navy"
            >
              Open connectivity guide
            </Link>
          </p>

          <ul className="mt-10 grid gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
            {serviceAssurances.map((assurance) => {
              const Icon = assurance.icon;
              return (
                <li key={assurance.title} className="flex items-center gap-3">
                  <Icon
                    aria-hidden="true"
                    className="h-6 w-6 flex-none text-circleTel-orange-light"
                  />
                  <span className="text-base leading-6 text-white/90">
                    {assurance.title}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="relative z-10 w-full lg:justify-self-end">
          <CloudWifiTierEstimator />
        </div>
      </div>
    </section>
  );
}
