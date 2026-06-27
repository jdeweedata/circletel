'use client';

/**
 * No Coverage Options (Phase 1 — no-coverage cross-sell)
 *
 * Shown when SkyFibre/primary coverage is NOT available at an address.
 * Instead of dropping the visitor straight into a lead-capture dead-end, this
 * runs a live MTN mobile check (5G / LTE / Fixed-LTE) and surfaces any available
 * mobile internet options. The existing NoCoverageLeadCapture form is always
 * rendered below as the capture mechanism + graceful fallback — if the MTN check
 * finds nothing (or fails), the visitor sees exactly the previous experience.
 *
 * Scope note: there is no Satellite/Wireless provider API wired into this flow,
 * so only MTN mobile services are offered here. Only 5G has buyable products
 * today; LTE/Fixed-LTE surface as a "register interest" option.
 */

import { useEffect, useRef, useState } from 'react';
import {
  PiSpinnerBold,
  PiCheckCircleBold,
  PiLightningBold,
  PiArrowRightBold,
} from 'react-icons/pi';
import { NoCoverageLeadCapture } from './NoCoverageLeadCapture';

interface NoCoverageOptionsProps {
  address: string;
  latitude?: number;
  longitude?: number;
}

interface MtnService {
  type: string;
  available: boolean;
  signal?: string;
  estimatedSpeed?: { download: number; upload: number; unit: string };
}

interface CrossSellPackage {
  id: string;
  name: string;
  download_speed: number;
  upload_speed: number;
  price: number; // ex-VAT, per service_packages convention
  description?: string;
}

const VAT_RATE = 0.15;
const inclVAT = (exVat: number): number => Math.round(exVat * (1 + VAT_RATE));

function serviceLabel(type: string): string {
  switch (type) {
    case '5g':
      return '5G';
    case 'lte':
      return 'LTE';
    case 'fixed_lte':
      return 'Fixed LTE';
    default:
      return type.toUpperCase();
  }
}

export function NoCoverageOptions({ address, latitude, longitude }: NoCoverageOptionsProps) {
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<MtnService[]>([]);
  const [products, setProducts] = useState<CrossSellPackage[]>([]);
  const [selectedService, setSelectedService] = useState<string | undefined>(undefined);
  const [selectedPackageLabel, setSelectedPackageLabel] = useState<string | undefined>(undefined);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkMobile() {
      // No coordinates → can't run a mobile check; fall straight to the lead form.
      if (latitude === undefined || longitude === undefined) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [checkRes, pkgRes] = await Promise.all([
          fetch('/api/coverage/mtn/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              coordinates: { lat: latitude, lng: longitude },
              serviceTypes: ['5g', 'lte', 'fixed_lte'],
              includeSignalStrength: true,
            }),
          }),
          fetch('/api/coverage/mtn/packages'),
        ]);

        const checkData = await checkRes.json();
        const pkgData = await pkgRes.json();
        if (cancelled) return;

        const found: MtnService[] = Array.isArray(checkData?.data?.services)
          ? checkData.data.services.filter((s: MtnService) => s?.available)
          : [];
        setServices(found);
        setProducts(Array.isArray(pkgData?.products) ? pkgData.products : []);
      } catch (err) {
        // Graceful: any failure leaves the lead form as the experience (no regression).
        console.error('[NoCoverageOptions] MTN mobile check failed:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    checkMobile();
    return () => {
      cancelled = true;
    };
  }, [latitude, longitude]);

  const fiveGAvailable = services.some((s) => s.type === '5g' && s.available);
  const showFiveG = fiveGAvailable && products.length > 0;
  const otherMobile = services.filter(
    (s) => (s.type === 'lte' || s.type === 'fixed_lte') && s.available
  );
  const showOther = !showFiveG && otherMobile.length > 0;
  const hasOffer = showFiveG || showOther;

  function selectPackage(pkg: CrossSellPackage) {
    setSelectedService('5g');
    setSelectedPackageLabel(
      `${pkg.name} (${pkg.download_speed}/${pkg.upload_speed} Mbps) — R${inclVAT(pkg.price)}/mo incl VAT`
    );
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function selectService(type: string) {
    setSelectedService(type);
    setSelectedPackageLabel(`${serviceLabel(type)} mobile internet`);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="space-y-6">
      {loading && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
          <PiSpinnerBold className="h-8 w-8 text-circleTel-orange animate-spin mx-auto mb-3" />
          <p className="text-gray-600 text-sm">
            Checking for mobile internet options at your address…
          </p>
        </div>
      )}

      {!loading && hasOffer && (
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm overflow-hidden text-left">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4">
            <div className="flex items-center gap-2 text-white">
              <PiCheckCircleBold className="h-5 w-5 shrink-0" />
              <p className="font-bold text-lg">Good news — mobile internet is available here</p>
            </div>
            <p className="text-white/85 text-sm mt-0.5">
              SkyFibre isn&apos;t at this address yet, but MTN mobile data reaches it.
            </p>
          </div>

          <div className="p-6 space-y-5">
            {showFiveG && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                  <PiLightningBold className="text-circleTel-orange" /> 5G packages you can order
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map((pkg) => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => selectPackage(pkg)}
                      className="text-left rounded-xl border-2 border-gray-200 hover:border-circleTel-orange p-4 transition-colors group"
                    >
                      <p className="text-xs font-semibold text-gray-400">
                        {pkg.download_speed > 0
                          ? `${pkg.download_speed}/${pkg.upload_speed} Mbps`
                          : 'Best effort'}
                      </p>
                      <p className="text-sm font-bold text-gray-900 leading-tight mt-0.5">
                        {pkg.name}
                      </p>
                      <p className="text-lg font-extrabold text-circleTel-orange mt-1">
                        R{inclVAT(pkg.price)}
                        <span className="text-xs font-medium text-gray-400">/mo</span>
                      </p>
                      <span className="text-xs font-semibold text-circleTel-orange mt-2 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                        Register interest <PiArrowRightBold />
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Prices incl. VAT. A consultant confirms availability before activation.
                </p>
              </div>
            )}

            {showOther && (
              <div className="rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {otherMobile.map((s) => serviceLabel(s.type)).join(' / ')} coverage available
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Register your interest and we&apos;ll match you to a mobile plan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => selectService(otherMobile[0].type)}
                  className="shrink-0 bg-circleTel-orange hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lead capture — always present as the capture mechanism + graceful fallback */}
      <div ref={formRef}>
        <NoCoverageLeadCapture
          address={address}
          latitude={latitude}
          longitude={longitude}
          defaultServiceType={selectedService}
          selectedPackageLabel={selectedPackageLabel}
          title={hasOffer ? 'Register your interest' : undefined}
          description={
            hasOffer
              ? `Leave your details and a CircleTel consultant will set up ${
                  selectedPackageLabel ? 'your selected plan' : 'mobile internet'
                } at ${address}.`
              : undefined
          }
        />
      </div>
    </div>
  );
}
