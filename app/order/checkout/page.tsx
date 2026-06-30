'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  PiCreditCardBold,
  PiLockSimpleBold,
  PiLightningBold,
  PiShieldBold,
  PiWifiHighBold,
} from 'react-icons/pi';
import { CheckoutProgressBar } from '@/components/order/CheckoutProgressBar';
import { useOrderContext } from '@/components/order/context/OrderContext';
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';
import { AccountSection } from '@/components/order/checkout/AccountSection';
import { OrderingAsCard } from '@/components/order/checkout/OrderingAsCard';
import { OrderSummarySidebar } from '@/components/order/checkout/OrderSummarySidebar';
import { ServiceAddressSection } from '@/components/order/checkout/ServiceAddressSection';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import {
  ORDER_PROCESSING_FEE_AMOUNT,
  ORDER_PROCESSING_FEE_LABEL,
} from '@/lib/payments/payment-amounts';
import type { PackageDetails } from '@/lib/order/types';
import type {
  SkyFibreCapacityMbps,
  SkyFibreOrderabilityResult,
  SkyFibreSegment,
} from '@/lib/coverage/skyfibre/types';

type CheckoutStep = 'account' | 'confirm';
type SubmitStatus = 'idle' | 'creating_order' | 'redirecting';

interface PhoneSignupResult {
  session: { access_token: string; refresh_token: string };
  customer: { id: string; first_name: string; last_name: string; email: string; phone: string };
  isExistingUser: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { state: orderState, actions } = useOrderContext();
  const { isAuthenticated, customer, user, signOut, signUp, signIn, signInWithGoogle, loading: authLoading } = useCustomerAuth();

  // Auth-after-cart: everyone starts on the review/confirm step. A guest reviews
  // and accepts terms first, then authenticates inline at Place Order. The
  // 'account' step survives only as the post-sign-out re-auth screen.
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('confirm');
  const [showInlineAuth, setShowInlineAuth] = useState(false);
  const pendingPlaceOrder = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  // Missing profile fields for returning/OAuth customers
  const [profileFirstName, setProfileFirstName] = useState('');
  const [profileLastName, setProfileLastName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileErrors, setProfileErrors] = useState<{ firstName?: string; lastName?: string; phone?: string }>({});

  // Terms (only needed on confirm step for new users before first order)
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState<string | undefined>();

  const pkg = orderState.orderData.package?.selectedPackage;
  const coverage = orderState.orderData.coverage;

  const [serviceAddress, setServiceAddress] = useState(coverage?.address ?? '');
  const [serviceCoordinates, setServiceCoordinates] = useState(coverage?.coordinates);
  const [propertyType, setPropertyType] = useState(coverage?.propertyType ?? '');
  const [propertyTypeError, setPropertyTypeError] = useState<string | undefined>();
  const [sameAsServiceAddress, setSameAsServiceAddress] = useState(true);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [skyFibreOrderability, setSkyFibreOrderability] = useState<SkyFibreOrderabilityResult | null>(null);

  const isWirelessOrMobile =
    pkg?.type === 'wireless' || pkg?.type === 'mobile' ||
    (pkg?.service_type || '').toLowerCase().includes('lte') ||
    (pkg?.service_type || '').toLowerCase().includes('5g') ||
    (pkg?.product_category || '').toLowerCase().includes('mobile');

  const isSkyFibreSelected =
    hasSkyFibreSignal(pkg?.name) ||
    hasSkyFibreSignal(pkg?.service_type) ||
    hasSkyFibreSignal(pkg?.product_category);

  // Guard: require package + coverage
  // Wait for auth to settle before redirecting — on return from Google OAuth,
  // OrderContextProvider's state starts as initialState (empty) while the
  // localStorage load effect hasn't run yet. authLoading=true covers that window.
  useEffect(() => {
    if (authLoading) return;
    if (!pkg && !coverage?.leadId) {
      router.replace('/');
    }
  }, [pkg, coverage?.leadId, router, authLoading]);

  // Auto-advance to confirm when user authenticates (Google OAuth return, OTP, etc.)
  useEffect(() => {
    if (isAuthenticated && checkoutStep === 'account') {
      setCheckoutStep('confirm');
    }
  }, [isAuthenticated, checkoutStep]);

  // Save local checkout state before Google OAuth redirect
  const handleGoogleSignIn = async () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(
        'circletel_checkout_return',
        JSON.stringify({ serviceAddress, propertyType, pendingPlaceOrder: pendingPlaceOrder.current })
      );
    }
    await signInWithGoogle();
  };

  // Restore local checkout state after Google OAuth returns
  useEffect(() => {
    if (!isAuthenticated) return;
    if (typeof window === 'undefined') return;
    const raw = sessionStorage.getItem('circletel_checkout_return');
    if (!raw) return;
    sessionStorage.removeItem('circletel_checkout_return');
    try {
      const saved = JSON.parse(raw) as { serviceAddress?: string; propertyType?: string };
      if (saved.serviceAddress && !serviceAddress) setServiceAddress(saved.serviceAddress);
      if (saved.propertyType && !propertyType) setPropertyType(saved.propertyType);
    } catch {
      // Ignore malformed saved state
    }
  // Only run once when isAuthenticated first becomes true (OAuth return)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Phone OTP signup complete: restore session then advance
  const handlePhoneSignupComplete = async (result: PhoneSignupResult) => {
    setErrorMessage(undefined);
    try {
      const supabase = createClient();
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: result.session.access_token,
        refresh_token: result.session.refresh_token,
      });
      if (sessionError) throw new Error(sessionError.message);

      actions.updateOrderData({
        account: {
          email: result.customer.email,
          firstName: result.customer.first_name,
          lastName: result.customer.last_name,
          phone: result.customer.phone,
          isAuthenticated: true,
          accountType: coverage?.coverageType === 'business' ? 'business' : 'personal',
          termsAccepted: true,
        },
      });
      // Auto-advance effect will fire when isAuthenticated becomes true
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  // Email/password sign in
  const handleSignIn = async (email: string, password: string) => {
    const result = await signIn(email, password);
    if (result.error) throw new Error(result.error);
    // auto-advance handled by useEffect
  };

  // Email/password sign up (from AccountSection, advances to confirm)
  const handleSignUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phone: string
  ) => {
    const result = await signUp(email, password, { firstName, lastName, email, phone });
    if (result.error && !result.emailSendFailed) throw new Error(result.error);
    if (!result.customer?.id) {
      throw new Error(
        result.error ||
        'Account was created but your profile is still being set up. Please wait a moment and try again.'
      );
    }
    if (result.emailSendFailed) {
      toast.info(
        'Account created! We had trouble sending the verification email — you can resend it from your dashboard.',
        { duration: 8000 }
      );
    }
    actions.updateOrderData({
      account: {
        email,
        firstName,
        lastName,
        phone,
        isAuthenticated: true,
        accountType: coverage?.coverageType === 'business' ? 'business' : 'personal',
        termsAccepted: false,
      },
    });
    // auto-advance handled by useEffect
  };

  const handleSignOut = async () => {
    await signOut();
    setCheckoutStep('account');
    toast.info('Signed out.');
  };

  const validateBeforeOrder = (): boolean => {
    let valid = true;
    if (!propertyType) {
      setPropertyTypeError('Please select a property type');
      valid = false;
    } else {
      setPropertyTypeError(undefined);
    }
    if (!termsAccepted) {
      setTermsError('Please accept the Terms & Conditions');
      valid = false;
    } else {
      setTermsError(undefined);
    }
    return valid;
  };

  const placeOrder = async (email: string, phone: string, firstName: string, lastName: string) => {
    if (!pkg || !serviceAddress) {
      toast.error('Missing package or address. Please start over.');
      return;
    }

    const finalDeliveryAddress =
      isWirelessOrMobile && !sameAsServiceAddress ? deliveryAddress : serviceAddress;

    // Phase 2: attach the authenticated session so the order is created owned
    // (orders/create stamps auth_user_id + customer_id) and payment initiation can
    // enforce the owner-gate. The just-in-time auth step guarantees a session here.
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const authHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    };

    setSubmitStatus('creating_order');

    let confirmedSkyFibreOrderability = skyFibreOrderability;
    if (isSkyFibreSelected) {
      const capacityMbps = getSkyFibreCapacity(pkg);
      if (!capacityMbps) {
        setSubmitStatus('idle');
        throw new Error('Unable to confirm the selected SkyFibre speed. Please choose the package again.');
      }

      const orderabilityRes = await fetch('/api/coverage/skyfibre/orderability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: coverage?.leadId,
          latitude: serviceCoordinates?.lat,
          longitude: serviceCoordinates?.lng,
          capacityMbps,
          segment: getSkyFibreSegment(coverage?.coverageType),
        }),
      });

      const orderabilityBody = await orderabilityRes.json().catch(() => ({}));
      if (!orderabilityRes.ok || !orderabilityBody?.success) {
        setSubmitStatus('idle');
        throw new Error(orderabilityBody?.error || 'Unable to confirm SkyFibre orderability. Please contact support.');
      }

      confirmedSkyFibreOrderability = orderabilityBody.data as SkyFibreOrderabilityResult;
      setSkyFibreOrderability(confirmedSkyFibreOrderability);

      if (confirmedSkyFibreOrderability.decision !== 'orderable') {
        setSubmitStatus('idle');
        throw new Error(getSkyFibreDecisionMessage(confirmedSkyFibreOrderability));
      }
    }

    const orderRes = await fetch('/api/orders/create', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        service_package_id: pkg.id,
        package_name: pkg.name,
        package_speed: pkg.speed,
        package_price: pkg.monthlyPrice,
        service_type: pkg.service_type,
        product_category: pkg.product_category,
        speed_down: pkg.speed_down,
        installation_fee: pkg.installation_fee ?? 0,
        payment_amount: ORDER_PROCESSING_FEE_AMOUNT,
        checkout_charge_type: 'order_processing_fee',
        installation_address: serviceAddress,
        delivery_address: finalDeliveryAddress,
        coordinates: serviceCoordinates,
        installation_location_type: propertyType,
        account_type: coverage?.coverageType === 'business' ? 'business' : 'personal',
        coverage_lead_id: coverage?.leadId,
        metadata: confirmedSkyFibreOrderability
          ? { skyfibre_orderability: confirmedSkyFibreOrderability }
          : {},
      }),
    });

    if (!orderRes.ok) {
      setSubmitStatus('idle');
      const err = await orderRes.json();
      throw new Error(err.error || 'Failed to create order');
    }
    const { order } = await orderRes.json();

    setSubmitStatus('redirecting');

    let paymentRes: Response;
    try {
      paymentRes = await fetch('/api/payment/netcash/initiate', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          orderId: order.id,
          amount: ORDER_PROCESSING_FEE_AMOUNT,
          customerEmail: email,
          customerName: `${firstName} ${lastName}`.trim(),
          paymentReference: order.payment_reference,
        }),
      });
    } catch {
      console.error(`[placeOrder] Network error during payment. Compensating orderId: ${order.id}`);
      fetch('/api/orders/create', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id, status: 'failed', payment_status: 'failed' }),
      }).catch(() => console.error(`[placeOrder] Compensation also failed. Orphaned orderId: ${order.id}`));
      setSubmitStatus('idle');
      throw new Error('Payment gateway unreachable. Please try again.');
    }

    if (!paymentRes.ok) {
      const errBody = await paymentRes.json().catch(() => ({})) as { error?: string };
      console.error(`[placeOrder] Payment initiation failed. Compensating orderId: ${order.id}`);
      fetch('/api/orders/create', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id, status: 'failed', payment_status: 'failed' }),
      }).catch(() => console.error(`[placeOrder] Compensation also failed. Orphaned orderId: ${order.id}`));
      setSubmitStatus('idle');
      throw new Error(errBody.error || 'Failed to initiate payment. Please try again.');
    }

    const { paymentUrl, formData } = await paymentRes.json();

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = paymentUrl;
    form.style.display = 'none';
    for (const [key, value] of Object.entries(formData as Record<string, string>)) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      form.appendChild(input);
    }
    document.body.appendChild(form);
    form.submit();
  };

  const handlePlaceOrder = async () => {
    if (!validateBeforeOrder()) return;

    // Auth-after-cart: a guest reviews the order + accepts terms first, then signs
    // in inline. Defer placement until a session exists; the auto-resume effect
    // below finishes the order once isAuthenticated flips true (inline OTP/email).
    if (!isAuthenticated) {
      pendingPlaceOrder.current = true;
      setShowInlineAuth(true);
      setErrorMessage(undefined);
      return;
    }

    const email = customer?.email || user?.email || '';
    if (!email) {
      toast.error('No account found. Please sign in again.');
      return;
    }

    const needsProfile = !customer?.first_name || !customer?.phone;
    if (needsProfile) {
      const errs: { firstName?: string; lastName?: string; phone?: string } = {};
      if (!customer?.first_name && !profileFirstName.trim()) errs.firstName = 'Required';
      if (!customer?.last_name && !profileLastName.trim()) errs.lastName = 'Required';
      if (!customer?.phone && !/^[0-9+\s()-]{10,}$/.test(profilePhone.trim())) errs.phone = 'Enter a valid phone number';
      if (Object.keys(errs).length) {
        setProfileErrors(errs);
        return;
      }
      setProfileErrors({});
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage(undefined);
    try {
      let firstName = customer?.first_name || profileFirstName.trim();
      let lastName = customer?.last_name || profileLastName.trim();
      let phone = customer?.phone || profilePhone.trim();

      if (needsProfile) {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          await fetch('/api/customers', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ first_name: firstName, last_name: lastName, phone }),
          });
        }
      }

      await placeOrder(email, phone, firstName, lastName);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
      setSubmitStatus('idle');
    }
  };

  // Auto-resume an inline (no-redirect) sign-in: when a guest authenticates via
  // OTP/email after clicking Place Order, finish the order automatically. Google
  // OAuth does NOT auto-resume — pendingPlaceOrder.current resets across the page
  // redirect, so the returning user lands on review with the Pay button ready (§D).
  useEffect(() => {
    if (isAuthenticated && pendingPlaceOrder.current) {
      pendingPlaceOrder.current = false;
      setShowInlineAuth(false);
      void handlePlaceOrder();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const fullName = customer
    ? `${customer.first_name ?? ''} ${customer.last_name ?? ''}`.trim()
    : '';

  const monthlyPrice = pkg?.monthlyPrice ?? 0;

  const needsProfile = isAuthenticated && (!customer?.first_name || !customer?.phone);
  const profileComplete = !needsProfile || (
    (customer?.first_name || profileFirstName.trim().length >= 2) &&
    (customer?.last_name || profileLastName.trim().length >= 2) &&
    (customer?.phone || /^[0-9+\s()-]{10,}$/.test(profilePhone.trim()))
  );
  const placeOrderBlocked = needsProfile && !profileComplete;

  const submitLabel = isSubmitting
    ? submitStatus === 'redirecting'
      ? 'Redirecting to payment…'
      : submitStatus === 'creating_order'
      ? 'Creating order…'
      : 'Processing…'
    : 'Place Order';

  const currentProgressStage = checkoutStep === 'account' ? 'account' : 'checkout';

  return (
    <div className="pb-24 lg:pb-0">
      {/* Slim checkout band */}
      <div className="relative left-1/2 -mt-8 mb-9 w-screen -translate-x-1/2 bg-circleTel-orange text-white">
        <div className="mx-auto max-w-screen-xl px-4 py-7 text-center sm:px-8 lg:px-16">
          <CheckoutProgressBar
            currentStage={currentProgressStage}
            variant="hero"
            className="mb-4 flex-wrap gap-x-2 gap-y-2"
          />
          <h1 className="font-heading text-2xl font-bold leading-tight text-white lg:text-3xl">
            {checkoutStep === 'account' ? 'Sign in or create account' : 'Confirm and pay'}
          </h1>
        </div>
      </div>

      {pkg && (
        <div className="mb-5 lg:hidden">
          <OrderSummarySidebar
            packageName={pkg.name}
            speed={pkg.speed}
            monthlyPrice={pkg.monthlyPrice}
            promotionPrice={typeof pkg.promotion_price === 'number' ? pkg.promotion_price : undefined}
            promotionMonths={pkg.promotion_months ?? undefined}
            installationFee={pkg.installation_fee ?? 0}
            isSimOnly={pkg.type === 'mobile'}
            address={coverage?.address}
          />
        </div>
      )}

      <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-7 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Main column */}
        <div className="flex flex-col gap-5">

          {/* Step: Account (auth) */}
          {checkoutStep === 'account' && (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg shadow-gray-200/60 sm:p-8">
              <AccountSection
                isSubmitting={isSubmitting}
                onGoogleSignIn={handleGoogleSignIn}
                onSignIn={handleSignIn}
                onSignUp={handleSignUp}
                onPhoneSignupComplete={handlePhoneSignupComplete}
                onPhoneSignupError={(msg) => setErrorMessage(msg)}
              />
              {errorMessage && (
                <div className="mt-5 bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700">
                  {errorMessage}{' '}
                  <a href="https://wa.me/27824873900" target="_blank" rel="noopener noreferrer" className="underline font-medium">
                    Contact support
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Step: Confirm & Pay */}
          {checkoutStep === 'confirm' && (
            <>
              <ServiceAddressSection
                serviceAddress={serviceAddress}
                propertyType={propertyType}
                coverageType={coverage?.coverageType ?? 'residential'}
                showDeliveryAddress={isWirelessOrMobile}
                deliveryAddress={deliveryAddress}
                sameAsServiceAddress={sameAsServiceAddress}
                propertyTypeError={propertyTypeError}
                onServiceAddressChange={(address, coords) => {
                  setServiceAddress(address);
                  if (coords) setServiceCoordinates(coords);
                }}
                onPropertyTypeChange={(val) => {
                  setPropertyType(val);
                  setPropertyTypeError(undefined);
                }}
                onDeliveryAddressChange={setDeliveryAddress}
                onSameAsServiceAddressChange={setSameAsServiceAddress}
              />

              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7 sm:p-8">
                {isAuthenticated && (
                  <OrderingAsCard
                    fullName={fullName || 'You'}
                    email={customer?.email || user?.email || ''}
                    onSignOut={handleSignOut}
                  />
                )}

                {/* Collect missing profile details (Google OAuth users) */}
                {isAuthenticated && (!customer?.first_name || !customer?.phone) && (
                  <div className="mt-5 space-y-3">
                    <p className="text-sm font-bold text-circleTel-navy">Your details</p>
                    {!customer?.first_name && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="profileFirstName" className="text-xs font-medium text-gray-600">First name</Label>
                          <Input
                            id="profileFirstName"
                            placeholder="Jane"
                            autoComplete="given-name"
                            value={profileFirstName}
                            onChange={(e) => setProfileFirstName(e.target.value)}
                            className="mt-1 h-10 text-sm"
                          />
                          {profileErrors.firstName && <p className="text-red-500 text-xs mt-1">{profileErrors.firstName}</p>}
                        </div>
                        <div>
                          <Label htmlFor="profileLastName" className="text-xs font-medium text-gray-600">Last name</Label>
                          <Input
                            id="profileLastName"
                            placeholder="Smith"
                            autoComplete="family-name"
                            value={profileLastName}
                            onChange={(e) => setProfileLastName(e.target.value)}
                            className="mt-1 h-10 text-sm"
                          />
                          {profileErrors.lastName && <p className="text-red-500 text-xs mt-1">{profileErrors.lastName}</p>}
                        </div>
                      </div>
                    )}
                    {!customer?.phone && (
                      <div>
                        <Label htmlFor="profilePhone" className="text-xs font-medium text-gray-600">Phone number</Label>
                        <Input
                          id="profilePhone"
                          type="tel"
                          placeholder="0821234567"
                          autoComplete="tel"
                          inputMode="numeric"
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(e.target.value)}
                          className="mt-1 h-10 text-sm"
                        />
                        {profileErrors.phone && <p className="text-red-500 text-xs mt-1">{profileErrors.phone}</p>}
                      </div>
                    )}
                  </div>
                )}

                {/* Payment method */}
                <div className="mt-6">
                  <p className="text-sm font-bold text-circleTel-navy mb-3">Payment method</p>
                  <div className="flex items-center gap-3 border border-gray-100 rounded-xl px-4 py-3.5 bg-gray-50">
                    <PiCreditCardBold className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">Credit or Debit Card</p>
                      <p className="text-xs text-gray-400 mt-0.5">Visa · Mastercard · 3D Secure</p>
                    </div>
                  </div>
                </div>

                {/* Terms */}
                <div className="flex items-start gap-3 mt-6">
                  <Checkbox
                    id="termsAccepted"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => {
                      setTermsAccepted(checked === true);
                      if (checked) setTermsError(undefined);
                    }}
                    className="mt-0.5"
                  />
                  <label htmlFor="termsAccepted" className="text-xs text-gray-500 leading-relaxed cursor-pointer">
                    I accept the{' '}
                    <a href="/terms-of-service" target="_blank" className="text-circleTel-orange underline">Terms &amp; Conditions</a>
                    {' '}and{' '}
                    <a href="/privacy-policy" target="_blank" className="text-circleTel-orange underline">Privacy Policy</a>
                  </label>
                </div>
                {termsError && <p className="text-red-500 text-xs mt-1.5">{termsError}</p>}

                {errorMessage && (
                  <div className="mt-5 bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700">
                    {errorMessage}{' '}
                    <a href="https://wa.me/27824873900" target="_blank" rel="noopener noreferrer" className="underline font-medium">
                      Contact support
                    </a>
                  </div>
                )}

                {showInlineAuth && !isAuthenticated ? (
                  /* Auth-after-cart: reveal sign-in inline once the guest commits */
                  <div className="mt-6 border-t border-gray-100 pt-6">
                    <p className="text-sm font-bold text-circleTel-navy mb-1">Sign in to place your order</p>
                    <p className="text-xs text-gray-500 mb-4">
                      Your selection is saved — sign in or create an account to finish.
                    </p>
                    <AccountSection
                      isSubmitting={isSubmitting}
                      onGoogleSignIn={handleGoogleSignIn}
                      onSignIn={handleSignIn}
                      onSignUp={handleSignUp}
                      onPhoneSignupComplete={handlePhoneSignupComplete}
                      onPhoneSignupError={(msg) => setErrorMessage(msg)}
                    />
                  </div>
                ) : (
                  <>
                    {placeOrderBlocked && (
                      <p className="mt-5 text-xs text-amber-600 text-center font-medium">
                        Please complete your profile details above before placing your order.
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={handlePlaceOrder}
                      disabled={isSubmitting || placeOrderBlocked}
                      className="mt-4 w-full bg-gradient-to-r from-circleTel-orange to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-60 text-white font-bold rounded-xl px-4 py-4 text-base shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <PiLockSimpleBold className="w-5 h-5" />
                      {submitLabel}
                    </button>
                    <p className="text-center text-xs text-gray-400 mt-3">
                      R{monthlyPrice}/month billed after activation · No lock-in
                    </p>
                  </>
                )}
              </div>

              {/* Trust strip */}
              <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-gray-100">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-100 rounded-full mb-3">
                      <PiLightningBold className="w-7 h-7 text-circleTel-orange" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">Fast Activation</h3>
                    <p className="text-xs text-gray-600">Get connected within 3-5 days from order confirmation.</p>
                  </div>
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-100 rounded-full mb-3">
                      <PiShieldBold className="w-7 h-7 text-circleTel-orange" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">Secure Payment</h3>
                    <p className="text-xs text-gray-600">3D Secure verified. Your card details are never stored.</p>
                  </div>
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-100 rounded-full mb-3">
                      <PiWifiHighBold className="w-7 h-7 text-circleTel-orange" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">No Lock-In</h3>
                    <p className="text-xs text-gray-600">Month-to-month. Cancel anytime with no penalties.</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block">
          {pkg && (
            <OrderSummarySidebar
              packageName={pkg.name}
              speed={pkg.speed}
              monthlyPrice={pkg.monthlyPrice}
              promotionPrice={typeof pkg.promotion_price === 'number' ? pkg.promotion_price : undefined}
              promotionMonths={pkg.promotion_months ?? undefined}
              installationFee={pkg.installation_fee ?? 0}
              isSimOnly={pkg.type === 'mobile'}
              address={coverage?.address}
            />
          )}
        </div>
      </div>

      {/* Floating mobile CTA bar — hidden while inline auth is showing */}
      {pkg && checkoutStep === 'confirm' && !showInlineAuth && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-circleTel-orange shadow-2xl px-4 py-3 z-40">
          <div className="flex items-center gap-4 max-w-lg mx-auto">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-gray-900 truncate">{pkg.name}</p>
              <p className="text-xs text-gray-500">
                R{monthlyPrice}/mo · {ORDER_PROCESSING_FEE_LABEL} R{ORDER_PROCESSING_FEE_AMOUNT.toFixed(2)}
              </p>
            </div>
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={isSubmitting || placeOrderBlocked}
              className="flex min-h-[44px] flex-shrink-0 items-center gap-2 rounded-xl bg-circleTel-orange px-5 py-3 text-sm font-bold text-white hover:bg-circleTel-orange-dark disabled:opacity-60"
            >
              <PiLockSimpleBold className="w-4 h-4" />
              {submitLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function getSkyFibreCapacity(pkg: PackageDetails): SkyFibreCapacityMbps | null {
  if (pkg.speed_down === 50 || pkg.speed_down === 100 || pkg.speed_down === 200) {
    return pkg.speed_down;
  }

  const match = `${pkg.speed || ''} ${pkg.name || ''}`.match(/\b(50|100|200)\b/);
  if (!match) return null;

  const parsed = Number(match[1]);
  return parsed === 50 || parsed === 100 || parsed === 200 ? parsed : null;
}

function getSkyFibreSegment(coverageType: string | undefined): SkyFibreSegment {
  return coverageType === 'business' ? 'business' : 'residential';
}

function getSkyFibreDecisionMessage(result: SkyFibreOrderabilityResult): string {
  switch (result.decision) {
    case 'covered_not_orderable':
      return 'SkyFibre coverage looks possible, but MTN CSP is not allowing an order for this address yet. Our sales team will need to review it.';
    case 'manual_review':
      return 'SkyFibre needs a manual feasibility review for this address before an order can be placed.';
    case 'not_covered':
      return 'SkyFibre is not currently covered at this address.';
    default:
      return 'SkyFibre orderability could not be confirmed for this address.';
  }
}

function hasSkyFibreSignal(value: unknown): boolean {
  const normalized = String(value || '').toLowerCase();
  const compact = normalized.replace(/[^a-z0-9]/g, '');
  return compact.includes('skyfibre') || normalized.includes('tarana');
}
