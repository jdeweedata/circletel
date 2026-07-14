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
          <p className="font-heading text-sm font-bold uppercase tracking-[0.16em] text-circleTel-orange-light">
            Tier finder
          </p>
          <h1
            id="cloudwifi-hero-heading"
            className="mt-4 max-w-2xl font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.08] tracking-[-0.02em] text-white"
          >
            Find your CloudWiFi tier in minutes.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-white/85">
            Managed Wi-Fi as a Service for South African venues. We design,
            install, own, monitor and manage your network, so every visitor and
            team member gets reliable connectivity.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <CloudWifiSurveyCta
              variant="cta"
              size="xl"
              className="min-h-12 rounded-xl bg-circleTel-orange-accessible px-8 hover:bg-circleTel-orange-accessible hover:brightness-90 focus-visible:ring-white"
            >
              Request a site survey
              <PiArrowRightBold aria-hidden="true" />
            </CloudWifiSurveyCta>
            <Link
              href="/resources/wifi-toolkit"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-white/75 px-8 py-3 font-semibold text-white outline-none hover:bg-white hover:text-circleTel-navy focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-circleTel-navy"
            >
              Open Wi-Fi toolkit
              <PiArrowRightBold aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>

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
