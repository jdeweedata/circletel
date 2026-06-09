'use client';

import React from 'react';
import {
  PiArrowRightBold,
  PiCheckCircleBold,
  PiMapPinBold,
  PiPhoneBold,
  PiShieldCheckBold,
} from 'react-icons/pi';

import { AddressAutocomplete } from '@/components/coverage/AddressAutocomplete';
import { InteractiveCoverageMapModal } from '@/components/coverage/InteractiveCoverageMapModal';
import { Button } from '@/components/ui/button';
import { FAQ } from './FAQ';
import { HowItWorks } from './HowItWorks';
import { PlanCards } from './PlanCards';
import { Testimonials } from './Testimonials';
import type { SegmentType } from './NewHero';

const ASSET_BASE = '/images/home/2026-06-07';

interface ResponsiveImage {
  avif: string;
  webp: string;
  png: string;
  width: number;
  height: number;
}

const responsiveImage = (name: string, width: number, height: number): ResponsiveImage => ({
  avif: `${ASSET_BASE}/${name}.avif`,
  webp: `${ASSET_BASE}/${name}.webp`,
  png: `${ASSET_BASE}/${name}.png`,
  width,
  height,
});

const HERO_IMAGE = responsiveImage('hero-connectivity', 1717, 916);

const SEGMENT_CONFIG: Record<SegmentType, {
  placeholder: string;
}> = {
  home: {
    placeholder: 'Enter your home address',
  },
  wfh: {
    placeholder: 'Enter your home office address',
  },
  business: {
    placeholder: 'Enter your business address',
  },
};

const AUDIENCE_CARDS: Array<{
  segment: SegmentType;
  tag: string;
  title: string;
  description: string;
  image: ResponsiveImage;
  targetId: string;
}> = [
  {
    segment: 'home',
    tag: 'Home fibre',
    title: 'Stream, game and work at once.',
    description: 'Uncapped packages for homes that need stable speed without a contract.',
    image: responsiveImage('card-home-fibre', 1024, 1536),
    targetId: 'plans',
  },
  {
    segment: 'wfh',
    tag: 'Work from home',
    title: 'Your office should not drop calls.',
    description: 'Managed WiFi, better support and bandwidth for video-first workdays.',
    image: responsiveImage('card-work-from-home', 1024, 1536),
    targetId: 'plans',
  },
  {
    segment: 'business',
    tag: 'Business',
    title: 'Connectivity for teams and sites.',
    description: 'Fibre, fixed wireless, telephony and managed IT under one provider.',
    image: responsiveImage('card-business-it', 1024, 1536),
    targetId: 'business-proof',
  },
];

const BUSINESS_PROOF = [
  {
    title: 'Connectivity + managed IT',
    description: 'Internet, telephony, cloud and support are connected instead of fragmented.',
  },
  {
    title: 'Local support',
    description: 'Human support with clear hours, clear escalation and a WhatsApp-first path.',
  },
  {
    title: 'No-contract simplicity',
    description: 'Lower perceived risk for homes and small businesses comparing ISPs.',
  },
  {
    title: 'Fast install path',
    description: 'Coverage check, plan choice and installation expectations stay visible early.',
  },
];

interface HomeLanding20260607Props {
  activeSegment: SegmentType;
  onSegmentChange: (segment: SegmentType) => void;
}

function BackgroundPicture({
  image,
  className,
  imgClassName,
  loading = 'lazy',
}: {
  image: ResponsiveImage;
  className: string;
  imgClassName: string;
  loading?: 'eager' | 'lazy';
}) {
  return (
    <picture className={className}>
      <source srcSet={image.avif} type="image/avif" />
      <source srcSet={image.webp} type="image/webp" />
      <img
        src={image.png}
        alt=""
        aria-hidden="true"
        width={image.width}
        height={image.height}
        loading={loading}
        decoding="async"
        className={imgClassName}
      />
    </picture>
  );
}

export function HomeLanding20260607({
  activeSegment,
  onSegmentChange,
}: HomeLanding20260607Props) {
  const [address, setAddress] = React.useState('');
  const [coordinates, setCoordinates] = React.useState<{ lat: number; lng: number } | null>(null);
  const [addressComponents, setAddressComponents] = React.useState<Record<string, string>>({});
  const [isChecking, setIsChecking] = React.useState(false);
  const [showMapModal, setShowMapModal] = React.useState(false);

  const activeConfig = SEGMENT_CONFIG[activeSegment];

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedData = sessionStorage.getItem('circletel_coverage_address');
    if (!savedData) return;

    try {
      const parsed = JSON.parse(savedData);
      const timestamp = new Date(parsed.timestamp);
      const hoursDiff = (Date.now() - timestamp.getTime()) / (1000 * 60 * 60);

      if (hoursDiff < 24 && parsed.address) {
        setAddress(parsed.address);
        if (parsed.coordinates) setCoordinates(parsed.coordinates);
      }
    } catch (error) {
      console.error('Failed to load saved address:', error);
    }
  }, []);

  const handleLocationSelect = (data: {
    address: string;
    latitude?: number;
    longitude?: number;
    suburb?: string;
    town?: string;
    province?: string;
    postalCode?: string;
  }) => {
    setAddress(data.address);

    if (data.latitude && data.longitude) {
      setCoordinates({ lat: data.latitude, lng: data.longitude });
    }

    setAddressComponents({
      suburb: data.suburb || data.town || '',
      city: data.town || '',
      province: data.province || '',
      postalCode: data.postalCode || '',
    });
  };

  const runCoverageCheck = async (
    nextAddress = address,
    nextCoordinates = coordinates
  ) => {
    if (!nextAddress.trim()) return;

    setIsChecking(true);

    try {
      const coverageType = activeSegment === 'business' ? 'business' : 'residential';

      sessionStorage.setItem('circletel_coverage_address', JSON.stringify({
        address: nextAddress.trim(),
        coordinates: nextCoordinates,
        type: coverageType,
        addressComponents,
        timestamp: new Date().toISOString(),
      }));

      const response = await fetch('/api/coverage/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: nextAddress.trim(),
          coordinates: nextCoordinates,
          coverageType,
        }),
      });

      if (!response.ok) throw new Error('Failed to create coverage lead');

      const data = await response.json();
      window.location.href = `/packages/${data.leadId}?type=${coverageType}`;
    } catch (error) {
      console.error('Coverage check failed:', error);
      alert('Coverage check failed. Please try again.');
      setIsChecking(false);
    }
  };

  const scrollToSection = (id: string) => {
    if (typeof document === 'undefined') return;
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const chooseSegment = (segment: SegmentType, targetId = 'plans') => {
    onSegmentChange(segment);
    setAddress('');
    scrollToSection(targetId);
  };

  const handleMapSearch = (searchAddress: string, searchCoordinates: { lat: number; lng: number }) => {
    setAddress(searchAddress);
    setCoordinates(searchCoordinates);
    void runCoverageCheck(searchAddress, searchCoordinates);
  };

  return (
    <div className="min-h-screen bg-white">
      <section
        className="relative isolate overflow-hidden bg-circleTel-midnight-navy text-white"
      >
        <BackgroundPicture
          image={HERO_IMAGE}
          loading="eager"
          className="absolute inset-0 z-0 block"
          imgClassName="h-full w-full object-cover object-center md:object-right"
        />
        <div className="absolute inset-0 z-10 bg-[linear-gradient(95deg,rgba(15,20,39,.98)_0%,rgba(15,20,39,.94)_38%,rgba(27,42,74,.62)_62%,rgba(232,122,30,.18)_100%),linear-gradient(0deg,rgba(15,20,39,.24),rgba(15,20,39,.08))]" />
        <div className="absolute inset-0 z-10 bg-[linear-gradient(rgba(255,255,255,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.055)_1px,transparent_1px)] bg-[length:76px_76px] [mask-image:linear-gradient(90deg,rgba(0,0,0,.75),rgba(0,0,0,.1))]" />
        <div className="absolute -bottom-[22vw] -right-[18vw] z-10 h-[42vw] w-[42vw] rounded-full bg-circleTel-orange/35 blur-3xl" />

        <div className="container relative z-20 mx-auto px-4 pb-20 pt-10 md:pb-20 md:pt-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 font-heading text-xs font-bold uppercase tracking-widest text-orange-100 backdrop-blur">
            <PiShieldCheckBold className="h-4 w-4 text-circleTel-orange" />
            Residential + business connectivity
          </div>

          <h1 className="mt-6 max-w-4xl font-heading text-[3rem] font-extrabold leading-[.96] tracking-[-0.04em] text-white sm:text-6xl lg:text-[5.375rem]">
            Internet that works as hard as you do.
          </h1>

          <p className="mt-5 max-w-2xl font-body text-base leading-8 text-white/80 md:text-lg">
            Fast, uncapped connectivity for homes, remote workers and growing teams. No contracts,
            R0 setup, and professional installation without the usual runaround.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              size="xl"
              className="rounded-full bg-circleTel-orange px-7 text-white shadow-xl shadow-circleTel-orange/25 hover:bg-circleTel-orange-dark"
              onClick={() => scrollToSection('coverage-checker')}
            >
              Check coverage
              <PiArrowRightBold className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="xl"
              className="rounded-full bg-white px-7 text-circleTel-navy hover:bg-white/90"
              onClick={() => scrollToSection('plans')}
            >
              View packages
            </Button>
          </div>

        </div>
      </section>

      <section id="coverage-checker" className="relative z-10 -mt-14 px-4">
        <div className="container mx-auto">
          <form
            className="grid gap-3 rounded-3xl border border-circleTel-lightNeutral bg-white p-4 shadow-2xl shadow-circleTel-navy/15 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end md:p-5"
            onSubmit={(event) => {
              event.preventDefault();
              void runCoverageCheck();
            }}
          >
            <label className="grid gap-2 font-heading text-xs font-extrabold uppercase tracking-widest text-circleTel-navy">
              Coverage check
              <span className="relative block">
                <PiMapPinBold className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-circleTel-orange" />
                <AddressAutocomplete
                  value={address}
                  onLocationSelect={handleLocationSelect}
                  placeholder={activeConfig.placeholder}
                  className="w-full [&_input]:h-12 [&_input]:rounded-full [&_input]:border-circleTel-lightNeutral [&_input]:pl-11 [&_input]:pr-4 [&_input]:text-sm [&_input]:focus:border-circleTel-orange"
                  showLocationButton={false}
                  showMapButton={false}
                />
              </span>
            </label>

            <Button
              type="submit"
              disabled={!address.trim() || isChecking}
              size="xl"
              className="h-12 rounded-full bg-circleTel-orange px-7 font-heading font-extrabold text-white hover:bg-circleTel-orange-dark disabled:opacity-60"
            >
              {isChecking ? 'Checking...' : 'Find my plan'}
              {!isChecking && <PiArrowRightBold className="h-4 w-4" />}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="h-12 rounded-full px-5 font-heading font-extrabold text-circleTel-orange hover:bg-circleTel-orange-light hover:text-circleTel-orange-accessible"
              onClick={() => setShowMapModal(true)}
            >
              Use map
            </Button>
          </form>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-8 grid gap-5 md:grid-cols-[1fr_minmax(280px,440px)] md:items-end">
            <div>
              <div className="mb-2 font-heading text-xs font-extrabold uppercase tracking-widest text-circleTel-orange">
                Choose your lane
              </div>
              <h2 className="max-w-3xl font-heading text-4xl font-extrabold leading-none tracking-[-0.03em] text-circleTel-navy md:text-5xl">
                Built around how you actually connect.
              </h2>
            </div>
            <p className="font-body text-sm leading-7 text-circleTel-dark-gray md:text-base">
              Route people fast, then show the exact offer that fits them: home internet, serious
              remote work, or business connectivity with managed support.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {AUDIENCE_CARDS.map((card) => (
              <button
                key={card.segment}
                type="button"
                onClick={() => chooseSegment(card.segment, card.targetId)}
                className="group relative isolate min-h-[320px] overflow-hidden rounded-3xl p-6 text-left text-white shadow-xl shadow-circleTel-navy/10 transition hover:-translate-y-1 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-circleTel-orange focus:ring-offset-2"
              >
                <BackgroundPicture
                  image={card.image}
                  className="absolute inset-0 z-0 block scale-[1.01] transition duration-300 group-hover:scale-105"
                  imgClassName="h-full w-full object-cover object-center"
                />
                <span className="absolute inset-0 z-10 bg-[linear-gradient(180deg,rgba(15,20,39,.08),rgba(15,20,39,.22)_42%,rgba(15,20,39,.9))]" />
                <span className="absolute inset-0 z-10 bg-[linear-gradient(135deg,rgba(255,255,255,.13)_0_1px,transparent_1px),linear-gradient(45deg,transparent_0_45%,rgba(255,255,255,.18)_45%_48%,transparent_48%)] bg-[length:28px_28px,100%_100%] opacity-35" />
                <span className="relative z-20 flex items-start justify-between gap-4">
                  <span className="rounded-full border border-white/20 bg-white/20 px-3 py-1.5 font-heading text-xs font-extrabold backdrop-blur">
                    {card.tag}
                  </span>
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-circleTel-orange transition group-hover:rotate-6">
                    <PiArrowRightBold className="h-5 w-5" />
                  </span>
                </span>
                <span className="absolute bottom-6 left-6 right-6 z-20">
                  <span className="block font-heading text-3xl font-extrabold leading-none tracking-[-0.03em]">
                    {card.title}
                  </span>
                  <span className="mt-3 block text-sm leading-6 text-white/80">
                    {card.description}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="plans">
        <PlanCards activeSegment={activeSegment} />
      </section>

      <section id="business-proof" className="bg-[#F3F7FF] py-16 md:py-24">
        <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <div className="mb-2 font-heading text-xs font-extrabold uppercase tracking-widest text-circleTel-orange">
              Why CircleTel
            </div>
            <h2 className="font-heading text-4xl font-extrabold leading-none tracking-[-0.03em] text-circleTel-navy md:text-5xl">
              One provider. One bill. Your office runs.
            </h2>
            <p className="mt-5 max-w-xl font-body text-base leading-8 text-circleTel-dark-gray">
              CircleTel wins by owning the operational promise: connectivity, IT, support and
              accountability in one place.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {BUSINESS_PROOF.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-[#DDE8FF] bg-white p-5 shadow-sm"
              >
                <PiCheckCircleBold className="mb-4 h-6 w-6 text-circleTel-orange" />
                <h3 className="font-heading text-lg font-bold text-circleTel-navy">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-circleTel-dark-gray">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <HowItWorks />
      <Testimonials activeSegment={activeSegment} />

      <section className="bg-circleTel-orange py-14 text-white md:py-20">
        <div className="container mx-auto flex flex-col gap-6 px-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="max-w-3xl font-heading text-4xl font-extrabold leading-none tracking-[-0.03em] text-white md:text-5xl">
              Ready to stop babysitting your connection?
            </h2>
            <p className="mt-4 max-w-2xl text-white/85">
              Check coverage, get the right plan, and let CircleTel handle the setup.
            </p>
          </div>
          <Button
            asChild
            size="xl"
            className="rounded-full bg-circleTel-midnight-navy px-7 text-white hover:bg-circleTel-navy"
          >
            <a href="mailto:sales@circletel.co.za">
              Get my quote
              <PiPhoneBold className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </section>

      <FAQ />

      <InteractiveCoverageMapModal
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
        onSearch={handleMapSearch}
        initialAddress={address}
        initialCoordinates={coordinates || undefined}
        layout="horizontal"
      />
    </div>
  );
}
