'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { PiCreditCardBold, PiLockSimpleBold, PiLightningBold, PiShieldBold, PiWifiHighBold, PiMapPinBold } from 'react-icons/pi';
import { CheckoutProgressBar } from '@/components/order/CheckoutProgressBar';
import { useOrderContext } from '@/components/order/context/OrderContext';
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';
import { AccountSection } from '@/components/order/checkout/AccountSection';
import { OrderingAsCard } from '@/components/order/checkout/OrderingAsCard';
import { OrderSummarySidebar } from '@/components/order/checkout/OrderSummarySidebar';
import { PaymentDetailCard } from '@/components/order/checkout/PaymentDetailCard';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { checkoutSchema, CheckoutFormValues } from '@/components/order/checkout/types';

interface PhoneSignupResult {
  session: { access_token: string; refresh_token: string };
  customer: { id: string; first_name: string; last_name: string; email: string; phone: string };
  isExistingUser: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { state: orderState, actions } = useOrderContext();
  const { isAuthenticated, customer, user, signOut, signUp, signInWithGoogle } = useCustomerAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  // Missing profile fields for returning/OAuth customers
  const [profileFirstName, setProfileFirstName] = useState('');
  const [profileLastName, setProfileLastName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileErrors, setProfileErrors] = useState<{ firstName?: string; lastName?: string; phone?: string }>({});

  const pkg = orderState.orderData.package?.selectedPackage;
  const coverage = orderState.orderData.coverage;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
  });

  const termsAccepted = watch('termsAccepted');

  // Guard: require package + coverage
  useEffect(() => {
    if (!pkg && !coverage?.leadId) {
      router.replace('/order/coverage');
    }
  }, [pkg, coverage?.leadId, router]);

  const handleGoogleSignIn = async () => {
    await signInWithGoogle();
  };

  // Phone OTP signup: set the Supabase session from API tokens, then place the order
  const handlePhoneSignupComplete = async (result: PhoneSignupResult) => {
    setIsSubmitting(true);
    setErrorMessage(undefined);
    try {
      const supabase = createClient();
      // Restore the session into the client — onAuthStateChange in CustomerAuthProvider will pick this up
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

      await placeOrder(
        result.customer.email,
        result.customer.phone,
        result.customer.first_name,
        result.customer.last_name,
      );
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.info('Signed out.');
  };

  const placeOrder = async (email: string, phone: string, firstName: string, lastName: string) => {
    if (!pkg || !coverage?.address) {
      toast.error('Missing package or address. Please start over.');
      return;
    }

    // Create order
    const orderRes = await fetch('/api/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        service_package_id: pkg.id,
        package_name: pkg.name,
        package_speed: pkg.speed,
        package_price: pkg.monthlyPrice,
        installation_fee: pkg.installation_fee ?? 0,
        payment_amount: 1.00,
        is_validation_charge: true,
        installation_address: coverage.address,
        coordinates: coverage.coordinates,
        installation_location_type: coverage.propertyType,
        account_type: coverage.coverageType === 'business' ? 'business' : 'personal',
      }),
    });

    if (!orderRes.ok) {
      const err = await orderRes.json();
      throw new Error(err.error || 'Failed to create order');
    }
    const { order } = await orderRes.json();

    // Initiate payment
    const paymentRes = await fetch('/api/payment/netcash/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: order.id,
        amount: 1.00,
        customerEmail: email,
        customerName: `${firstName} ${lastName}`.trim(),
        paymentReference: order.payment_reference,
      }),
    });

    if (!paymentRes.ok) throw new Error('Failed to initiate payment');
    const { paymentUrl } = await paymentRes.json();

    window.location.href = paymentUrl;
  };

  // New user: create account then place order
  const handleNewUserSubmit = async (values: CheckoutFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(undefined);
    try {
      const result = await signUp(values.email, values.password, {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
      });
      if (result.error) throw new Error(result.error);

      actions.updateOrderData({
        account: {
          email: values.email,
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone,
          isAuthenticated: true,
          accountType: coverage?.coverageType === 'business' ? 'business' : 'personal',
          termsAccepted: true,
        },
      });

      await placeOrder(values.email, values.phone, values.firstName, values.lastName);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Existing user: save profile if incomplete, then place order
  const handleExistingUserOrder = async () => {
    const email = customer?.email || user?.email || '';
    if (!email) {
      toast.error('No account found. Please sign in again.');
      return;
    }

    const needsProfile = !customer?.first_name || !customer?.phone;

    // Validate missing profile fields before submitting
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
    setErrorMessage(undefined);
    try {
      let firstName = customer?.first_name || profileFirstName.trim();
      let lastName = customer?.last_name || profileLastName.trim();
      let phone = customer?.phone || profilePhone.trim();

      // Save profile if we collected new data
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
    }
  };

  const fullName = customer
    ? `${customer.first_name ?? ''} ${customer.last_name ?? ''}`.trim()
    : '';

  const monthlyPrice = pkg?.monthlyPrice ?? 0;

  return (
    <div className="pb-24 lg:pb-0">
      {/* Orange gradient hero */}
      <div className="relative bg-gradient-to-br from-circleTel-orange to-orange-600 rounded-3xl p-8 lg:p-12 mb-8 text-white overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="relative z-10 text-center">
          <CheckoutProgressBar currentStage="checkout" variant="hero" className="mb-6" />
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">Complete Your Order</h1>
          {pkg && (
            <p className="text-lg text-orange-100 font-medium">{pkg.name} · {pkg.speed}</p>
          )}
          {coverage?.address && (
            <p className="flex items-center justify-center gap-1.5 text-sm text-orange-100/80 mt-2">
              <PiMapPinBold className="w-4 h-4 flex-shrink-0" />
              {coverage.address}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-12">
        {/* Main column */}
        <div className="lg:col-span-3 flex flex-col gap-5">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7 sm:p-8">
            {isAuthenticated ? (
              <>
                <OrderingAsCard
                  fullName={fullName || 'You'}
                  email={customer?.email || user?.email || ''}
                  onSignOut={handleSignOut}
                />

                {/* Collect missing profile details (Google OAuth users) */}
                {(!customer?.first_name || !customer?.phone) && (
                  <div className="mt-5 space-y-3">
                    <p className="text-sm font-bold text-circleTel-navy">Your details</p>
                    {!customer?.first_name && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="profileFirstName" className="text-xs font-medium text-gray-600">First name</Label>
                          <Input
                            id="profileFirstName"
                            placeholder="Jane"
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

                {errorMessage && (
                  <div className="mt-5 bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700">
                    {errorMessage}{' '}
                    <a href="https://wa.me/27824873900" target="_blank" rel="noopener noreferrer" className="underline font-medium">
                      Contact support
                    </a>
                  </div>
                )}

                <button
                  onClick={handleExistingUserOrder}
                  disabled={isSubmitting}
                  className="mt-6 w-full bg-gradient-to-r from-circleTel-orange to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-60 text-white font-bold rounded-xl px-4 py-4 text-base shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <PiLockSimpleBold className="w-5 h-5" />
                  {isSubmitting ? 'Processing…' : 'Place Order'}
                </button>
                <p className="text-center text-xs text-gray-400 mt-3">
                  R{monthlyPrice}/month billed after activation · No lock-in
                </p>
              </>
            ) : (
              <form id="checkout-form" onSubmit={handleSubmit(handleNewUserSubmit)} noValidate>
                <p className="text-sm font-bold text-circleTel-navy mb-5">Your details</p>

                <AccountSection
                  register={register}
                  errors={errors}
                  showPassword={showPassword}
                  onTogglePassword={() => setShowPassword((v) => !v)}
                  onGoogleSignIn={handleGoogleSignIn}
                  isSubmitting={isSubmitting}
                  onPhoneSignupComplete={handlePhoneSignupComplete}
                  onPhoneSignupError={(msg) => setErrorMessage(msg)}
                />

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
                    checked={termsAccepted === true}
                    onCheckedChange={(checked) =>
                      setValue('termsAccepted', checked === true ? true : (undefined as unknown as true))
                    }
                    className="mt-0.5"
                  />
                  <label htmlFor="termsAccepted" className="text-xs text-gray-500 leading-relaxed cursor-pointer">
                    I accept the{' '}
                    <a href="/terms-of-service" target="_blank" className="text-circleTel-orange underline">Terms &amp; Conditions</a>
                    {' '}and{' '}
                    <a href="/privacy-policy" target="_blank" className="text-circleTel-orange underline">Privacy Policy</a>
                  </label>
                </div>
                {errors.termsAccepted && (
                  <p className="text-red-500 text-xs mt-1.5">{errors.termsAccepted.message}</p>
                )}

                {errorMessage && (
                  <div className="mt-5 bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700">
                    {errorMessage}{' '}
                    <a href="https://wa.me/27824873900" target="_blank" rel="noopener noreferrer" className="underline font-medium">
                      Contact support
                    </a>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-6 w-full bg-gradient-to-r from-circleTel-orange to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-60 text-white font-bold rounded-xl px-4 py-4 text-base shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <PiLockSimpleBold className="w-5 h-5" />
                  {isSubmitting ? 'Processing…' : 'Place Order'}
                </button>
                <p className="text-center text-xs text-gray-400 mt-3">
                  R{monthlyPrice}/month billed after activation · No lock-in
                </p>
              </form>
            )}
          </div>

          {/* Mobile payment detail card — below form on small screens */}
          {pkg && (
            <div className="lg:hidden">
              <PaymentDetailCard
                packageName={pkg.name}
                speed={pkg.speed}
                monthlyPrice={pkg.monthlyPrice}
                promotionPrice={typeof pkg.promotion_price === 'number' ? pkg.promotion_price : undefined}
                installationFee={pkg.installation_fee ?? 0}
                isSimOnly={pkg.type === 'mobile'}
              />
            </div>
          )}

          {/* Trust / feature strip */}
          <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-100 rounded-full mb-3">
                  <PiLightningBold className="w-7 h-7 text-circleTel-orange" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">Fast Activation</h3>
                <p className="text-xs text-gray-600">Get connected within 24-48 hours of order confirmation.</p>
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
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block lg:col-span-2">
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

      {/* Floating mobile CTA bar */}
      {pkg && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-circleTel-orange shadow-2xl px-4 py-3 z-40">
          <div className="flex items-center gap-4 max-w-lg mx-auto">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-gray-900 truncate">{pkg.name}</p>
              <p className="text-xs text-gray-500">R{monthlyPrice}/mo · R1.00 today</p>
            </div>
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleExistingUserOrder}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-circleTel-orange to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-60 text-white font-bold rounded-xl px-5 py-3 text-sm flex items-center gap-2 flex-shrink-0 min-h-[44px]"
              >
                <PiLockSimpleBold className="w-4 h-4" />
                {isSubmitting ? 'Processing…' : 'Place Order'}
              </button>
            ) : (
              <button
                type="submit"
                form="checkout-form"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-circleTel-orange to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-60 text-white font-bold rounded-xl px-5 py-3 text-sm flex items-center gap-2 flex-shrink-0 min-h-[44px]"
              >
                <PiLockSimpleBold className="w-4 h-4" />
                {isSubmitting ? 'Processing…' : 'Place Order'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
