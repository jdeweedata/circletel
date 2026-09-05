import Image from "next/image";
import Link from "next/link";
import { PiArrowRightBold } from "react-icons/pi";

import { CloudWifiSurveyCta } from "@/components/cloudwifi/CloudWifiSurveyCta";
import { serviceAssurances } from "@/components/cloudwifi/content";
import { getWhatsAppLink } from "@/lib/constants/contact";
import { getTenantConfig } from "@/lib/tenant";

const expertMessage = `Hi ${getTenantConfig().branding.companyName}, I would like to speak to an expert about CloudWiFi.`;

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

      <div className="container mx-auto min-h-[560px] px-4 py-16 sm:px-6 md:py-20 lg:px-8 lg:py-24">
        <div className="max-w-3xl">
          <p className="font-heading text-sm font-bold uppercase tracking-[0.16em] text-circleTel-orange-light">
            Managed Wi-Fi for retail and property
          </p>
          <h1
            id="cloudwifi-hero-heading"
            className="mt-4 max-w-2xl font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.08] tracking-[-0.02em] text-white"
          >
            Reliable Wi-Fi for staff and guests.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-white/85">
            Keep your team connected and give guests a network of their own. {getTenantConfig().branding.companyName} plans your Wi-Fi around your building, installs the equipment and manages it day to day, with remote monitoring and maintenance.
          </p>

          <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
            <CloudWifiSurveyCta
              variant="cta"
              size="xl"
              className="h-14 min-h-14 w-full gap-2 whitespace-nowrap rounded-xl border-2 border-transparent bg-circleTel-orange-accessible px-4 py-0 text-sm font-semibold leading-5 lg:text-base [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 hover:bg-circleTel-orange-accessible hover:brightness-90 focus-visible:ring-white"
            >
              Find my recommended plan
              <PiArrowRightBold aria-hidden="true" />
            </CloudWifiSurveyCta>
            <Link
              href={getWhatsAppLink(expertMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-14 min-h-14 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl border-2 border-white/75 px-4 py-0 text-sm font-semibold leading-5 lg:text-base text-white outline-none hover:bg-white hover:text-circleTel-navy focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-circleTel-navy"
            >
              Talk to a CloudWiFi expert
              <PiArrowRightBold aria-hidden="true" className="h-4 w-4 shrink-0" />
            </Link>
          </div>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/80">
            Find a recommended plan for your space. A site survey confirms the
            design and final price.
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
      </div>
    </section>
  );
}
