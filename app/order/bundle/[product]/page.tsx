'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  PiArrowLeftBold,
  PiArrowRightBold,
  PiCheckCircleBold,
  PiLightningBold,
  PiMapPinBold,
  PiShieldCheckBold,
  PiStarBold,
} from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useOrderContext } from '@/components/order/context/OrderContext';
import {
  getBundleProduct,
  isValidBundleSlug,
  BundleTier,
  AddOn,
} from '@/lib/products/bundles';
import { toast } from 'sonner';

// VAT rate for South Africa
const VAT_RATE = 0.15;
const addVAT = (price: number) => Math.round(price * (1 + VAT_RATE));

export default function BundleTierSelectionPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const productSlug = params.product as string;

  const { state, actions } = useOrderContext();

  const [selectedTier, setSelectedTier] = useState<BundleTier | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [address, setAddress] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get bundle configuration
  const bundle = isValidBundleSlug(productSlug)
    ? getBundleProduct(productSlug)
    : null;

  // Load address from session/context
  useEffect(() => {
    const storedAddress = sessionStorage.getItem('circletel_coverage_address');
    if (storedAddress) {
      const parsed = JSON.parse(storedAddress);
      setAddress(parsed.address || '');
    } else if (state.orderData.coverage?.address) {
      setAddress(state.orderData.coverage.address);
    }

    // Pre-select recommended tier
    if (bundle) {
      const recommended = bundle.tiers.find((t) => t.recommended);
      if (recommended) {
        setSelectedTier(recommended);
      }
    }
  }, [bundle, state.orderData.coverage?.address]);

  // Redirect if invalid product
  if (!bundle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold mb-4">Product Not Found</h2>
            <p className="text-gray-600 mb-6">
              The product you're looking for doesn't exist.
            </p>
            <Button asChild>
              <Link href="/products">View All Products</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const toggleAddOn = (addOnId: string) => {
    setSelectedAddOns((prev) =>
      prev.includes(addOnId)
        ? prev.filter((id) => id !== addOnId)
        : [...prev, addOnId]
    );
  };

  const calculateTotal = () => {
    if (!selectedTier) return 0;
    let total = selectedTier.monthlyPrice;
    selectedAddOns.forEach((addOnId) => {
      const addOn = bundle.addOns.find((a) => a.id === addOnId);
      if (addOn) total += addOn.monthlyPrice;
    });
    return total;
  };

  const handleContinue = async () => {
    if (!selectedTier) {
      toast.error('Please select a tier');
      return;
    }

    setIsSubmitting(true);

    try {
      // Store selection in order context
      actions.updateOrderData({
        package: {
          selectedPackage: {
            id: selectedTier.id,
            name: `${bundle.name} - ${selectedTier.name}`,
            description: selectedTier.description,
            monthlyPrice: calculateTotal(),
            speed: selectedTier.speed,
            type: 'wireless',
            speed_down: selectedTier.speedDown,
            speed_up: selectedTier.speedUp,
            features: selectedTier.features,
          },
        },
      });

      // Store add-ons in session for checkout
      sessionStorage.setItem(
        'circletel_bundle_addons',
        JSON.stringify(selectedAddOns)
      );

      actions.markStepComplete(2);

      // Navigate to account creation
      router.push('/order/checkout');
    } catch (error) {
      console.error('Failed to save selection:', error);
      toast.error('Failed to save selection. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">
                  <PiArrowLeftBold className="h-4 w-4 mr-2" />
                  Back
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {bundle.name}
                </h1>
                <p className="text-gray-600">{bundle.tagline}</p>
              </div>
            </div>
            {address && (
              <div className="hidden md:flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
                <PiMapPinBold className="h-4 w-4 text-circleTel-orange" />
                <span className="max-w-xs truncate">{address}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center gap-2 text-green-600">
              <div className="h-8 w-8 rounded-full bg-green-600 text-white flex items-center justify-center">
                <PiCheckCircleBold className="h-5 w-5" />
              </div>
              <span className="font-medium">Coverage</span>
            </div>
            <div className="w-12 h-0.5 bg-circleTel-orange" />
            <div className="flex items-center gap-2 text-circleTel-orange">
              <div className="h-8 w-8 rounded-full bg-circleTel-orange text-white flex items-center justify-center font-semibold">
                2
              </div>
              <span className="font-medium">Select Tier</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-200" />
            <div className="flex items-center gap-2 text-gray-400">
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center font-semibold">
                3
              </div>
              <span>Account</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-200" />
            <div className="flex items-center gap-2 text-gray-400">
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center font-semibold">
                4
              </div>
              <span>Payment</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Tier Selection */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-6">Choose Your Tier</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {bundle.tiers.map((tier) => (
              <Card
                key={tier.id}
                className={cn(
                  'relative cursor-pointer transition-all hover:shadow-lg',
                  selectedTier?.id === tier.id
                    ? 'ring-2 ring-circleTel-orange border-circleTel-orange'
                    : 'hover:border-gray-300'
                )}
                onClick={() => setSelectedTier(tier)}
              >
                {tier.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-circleTel-orange text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                      <PiStarBold className="h-3 w-3" />
                      Recommended
                    </span>
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">{tier.name}</h3>
                    <div
                      className={cn(
                        'h-5 w-5 rounded-full border-2 flex items-center justify-center',
                        selectedTier?.id === tier.id
                          ? 'border-circleTel-orange bg-circleTel-orange'
                          : 'border-gray-300'
                      )}
                    >
                      {selectedTier?.id === tier.id && (
                        <PiCheckCircleBold className="h-3 w-3 text-white" />
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{tier.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">
                        R{tier.monthlyPrice.toLocaleString()}
                      </span>
                      <span className="text-gray-500">/mo</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      R{addVAT(tier.monthlyPrice).toLocaleString()} incl. VAT
                    </p>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <PiLightningBold className="h-4 w-4 text-circleTel-orange" />
                      <span className="font-medium">{tier.speed}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      <div>Primary: {tier.primaryConnection}</div>
                      <div>Backup: {tier.backupConnection}</div>
                    </div>
                  </div>

                  <ul className="space-y-2">
                    {tier.features.map((feature, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm text-gray-700"
                      >
                        <PiCheckCircleBold className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Add-ons */}
        {bundle.addOns.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-6">Optional Add-ons</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {bundle.addOns.map((addOn) => (
                <Card
                  key={addOn.id}
                  className={cn(
                    'cursor-pointer transition-all',
                    selectedAddOns.includes(addOn.id)
                      ? 'ring-2 ring-circleTel-orange border-circleTel-orange bg-orange-50'
                      : 'hover:border-gray-300'
                  )}
                  onClick={() => toggleAddOn(addOn.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold">{addOn.name}</h4>
                      <div
                        className={cn(
                          'h-5 w-5 rounded border-2 flex items-center justify-center',
                          selectedAddOns.includes(addOn.id)
                            ? 'border-circleTel-orange bg-circleTel-orange'
                            : 'border-gray-300'
                        )}
                      >
                        {selectedAddOns.includes(addOn.id) && (
                          <PiCheckCircleBold className="h-3 w-3 text-white" />
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {addOn.description}
                    </p>
                    <p className="font-medium text-circleTel-orange">
                      +R{addOn.monthlyPrice}/mo
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Summary & Continue */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              {selectedTier ? (
                <>
                  <p className="text-sm text-gray-600 mb-1">Monthly Total</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">
                      R{calculateTotal().toLocaleString()}
                    </span>
                    <span className="text-gray-500">/month excl. VAT</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    R{addVAT(calculateTotal()).toLocaleString()}/month incl. VAT
                  </p>
                  {selectedAddOns.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Includes {selectedAddOns.length} add-on
                      {selectedAddOns.length > 1 ? 's' : ''}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-gray-500">Select a tier to continue</p>
              )}
            </div>
            <Button
              size="lg"
              onClick={handleContinue}
              disabled={!selectedTier || isSubmitting}
              className="w-full md:w-auto bg-circleTel-orange hover:bg-orange-600"
            >
              {isSubmitting ? (
                'Processing...'
              ) : (
                <>
                  Continue to Account
                  <PiArrowRightBold className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Trust Signals */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <PiShieldCheckBold className="h-5 w-5 text-green-600" />
            <span>Free installation on 24-month contracts</span>
          </div>
          <div className="flex items-center gap-2">
            <PiLightningBold className="h-5 w-5 text-circleTel-orange" />
            <span>Automatic failover in under 30 seconds</span>
          </div>
        </div>
      </div>
    </div>
  );
}
