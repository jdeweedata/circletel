'use client';

import { useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  PiArrowRightBold,
  PiSpinnerBold,
  PiHouseLineBold,
  PiCalendarCheckBold,
  PiHandshakeBold,
  PiWhatsappLogoBold,
} from 'react-icons/pi';
import { toast } from 'sonner';
import { AddressAutocomplete } from '@/components/coverage/AddressAutocomplete';
import { NoCoverageLeadCapture } from '@/components/coverage/NoCoverageLeadCapture';
import { getWhatsAppLink, CONTACT } from '@/lib/constants/contact';
import Link from 'next/link';

interface LocationData {
  address: string;
  latitude?: number;
  longitude?: number;
}

export function CheckCoverageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const utmRef = useRef({
    utm_source: searchParams.get('utm_source') ?? undefined,
    utm_medium: searchParams.get('utm_medium') ?? undefined,
    utm_campaign: searchParams.get('utm_campaign') ?? undefined,
  });

  const [addressValue, setAddressValue] = useState('');
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [noCoverage, setNoCoverage] = useState(false);

  function handleLocationSelect(data: {
    address: string;
    latitude?: number;
    longitude?: number;
  }) {
    setAddressValue(data.address);
    setLocation({ address: data.address, latitude: data.latitude, longitude: data.longitude });
    setNoCoverage(false);
  }

  async function handleCheckCoverage() {
    if (!location) {
      toast.error('Please enter your address first.');
      return;
    }

    setLoading(true);

    try {
      const body: Record<string, unknown> = {
        address: location.address,
        coordinates:
          location.latitude && location.longitude
            ? { lat: location.latitude, lng: location.longitude }
            : undefined,
        ...utmRef.current,
      };

      const res = await fetch('/api/coverage/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Coverage check failed');
      }

      if (data.available) {
        router.push(`/packages/${data.lead_id}`);
      } else {
        setNoCoverage(true);
        setLoading(false);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      );
      setLoading(false);
    }
  }

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="bg-[#13274A] py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <span className="inline-block bg-[#F5841E] text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
            SkyFibre Coverage
          </span>

          <h1 className="font-poppins text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Check If SkyFibre Covers Your Address
          </h1>

          <p className="text-white/70 text-base md:text-lg font-montserrat mb-10 max-w-xl mx-auto">
            Enter your address below. We'll show you available packages in 30 seconds.
          </p>

          {noCoverage ? (
            <NoCoverageLeadCapture
              address={location?.address ?? ''}
              latitude={location?.latitude}
              longitude={location?.longitude}
            />
          ) : (
            <div className="flex flex-col gap-4">
              <AddressAutocomplete
                value={addressValue}
                onLocationSelect={handleLocationSelect}
                placeholder="Enter your business address..."
                variant="hero"
                showMapButton={false}
                showLocationButton
              />

              <button
                onClick={handleCheckCoverage}
                disabled={loading || !location}
                className="w-full bg-[#F5841E] hover:bg-[#e0751a] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-base px-6 py-4 rounded-xl flex items-center justify-center gap-2 transition-colors min-h-[44px]"
              >
                {loading ? (
                  <>
                    <PiSpinnerBold className="animate-spin text-xl" />
                    Checking coverage…
                  </>
                ) : (
                  <>
                    Check Coverage
                    <PiArrowRightBold className="text-xl" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Trust Badges ──────────────────────────────────── */}
      <section className="bg-white py-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-[#13274A]/10 flex items-center justify-center">
                <PiHouseLineBold className="text-[#13274A] text-2xl" />
              </div>
              <p className="font-poppins font-bold text-[#13274A] text-lg">6 Million+ Homes Covered</p>
              <p className="text-[#747474] text-sm">Across South Africa</p>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-[#13274A]/10 flex items-center justify-center">
                <PiCalendarCheckBold className="text-[#13274A] text-2xl" />
              </div>
              <p className="font-poppins font-bold text-[#13274A] text-lg">Installed in 3–5 Days</p>
              <p className="text-[#747474] text-sm">Fast professional setup</p>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-[#13274A]/10 flex items-center justify-center">
                <PiHandshakeBold className="text-[#13274A] text-2xl" />
              </div>
              <p className="font-poppins font-bold text-[#13274A] text-lg">No Contract Required</p>
              <p className="text-[#747474] text-sm">Cancel anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── What Happens Next ─────────────────────────────── */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="font-poppins text-2xl md:text-3xl font-bold text-[#13274A] text-center mb-12">
            What Happens Next
          </h2>

          <div className="relative flex flex-col md:flex-row gap-8 md:gap-0">
            {/* connector line (desktop only) */}
            <div className="hidden md:block absolute top-8 left-[calc(16.666%+1rem)] right-[calc(16.666%+1rem)] h-px bg-[#13274A]/20" />

            {[
              {
                step: '01',
                title: 'Coverage Check',
                body: "We check your address against MTN's Tarana G1 coverage map",
              },
              {
                step: '02',
                title: 'See Your Options',
                body: "You'll see available speed tiers and pricing within 30 seconds",
              },
              {
                step: '03',
                title: 'Book Installation',
                body: "Choose your plan and we'll schedule installation within 5 business days",
              },
            ].map(({ step, title, body }) => (
              <div key={step} className="flex-1 flex flex-col items-center text-center px-4 relative">
                <div className="w-16 h-16 rounded-full bg-[#F5841E] flex items-center justify-center mb-4 z-10">
                  <span className="font-poppins font-bold text-white text-lg">{step}</span>
                </div>
                <p className="font-poppins font-bold text-[#13274A] text-lg mb-2">{title}</p>
                <p className="text-[#747474] text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Fallback CTA ──────────────────────────────────── */}
      <section className="bg-white py-12">
        <div className="max-w-lg mx-auto px-4 text-center">
          <h2 className="font-poppins text-xl md:text-2xl font-bold text-[#13274A] mb-3">
            Can't find your address?
          </h2>
          <p className="text-[#747474] mb-6">WhatsApp us and we'll check manually.</p>
          <a
            href={getWhatsAppLink('Hi CircleTel, please check coverage at my address: ')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold px-6 py-3.5 rounded-xl transition-colors min-h-[44px]"
          >
            <PiWhatsappLogoBold className="text-xl" />
            WhatsApp Us
          </a>
        </div>
      </section>

      {/* ── Footer CTA ────────────────────────────────────── */}
      <section className="bg-[#13274A] py-16">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h2 className="font-poppins text-2xl md:text-3xl font-bold text-white mb-3">
            Not sure which plan is right?
          </h2>
          <p className="text-white/70 mb-8">Talk to our team.</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white hover:bg-white/10 font-bold px-6 py-3.5 rounded-xl transition-colors min-h-[44px] w-full sm:w-auto"
            >
              View Packages
            </Link>

            <a
              href={CONTACT.WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#F5841E] hover:bg-[#e0751a] text-white font-bold px-6 py-3.5 rounded-xl transition-colors min-h-[44px] w-full sm:w-auto"
            >
              <PiWhatsappLogoBold className="text-xl" />
              WhatsApp Sales
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
