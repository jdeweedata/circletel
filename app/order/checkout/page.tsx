'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { PiCreditCardBold, PiLockSimpleBold } from 'react-icons/pi';
import { CheckoutProgressBar } from '@/components/order/CheckoutProgressBar';
import { useOrderContext } from '@/components/order/context/OrderContext';
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';
import { AccountSection } from '@/components/order/checkout/AccountSection';
import { OrderingAsCard } from '@/components/order/checkout/OrderingAsCard';
import { OrderSummarySidebar } from '@/components/order/checkout/OrderSummarySidebar';
import { PaymentDetailCard } from '@/components/order/checkout/PaymentDetailCard';
import { Checkbox } from '@/components/ui/checkbox';
import { checkoutSchema, CheckoutFormValues } from '@/components/order/checkout/types';

export default function CheckoutPage() {
  const router = useRouter();
  const { state: orderState, actions } = useOrderContext();
  const { isAuthenticated, customer, user, signOut, signUp, signInWithGoogle } = useCustomerAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

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

  // Existing user: place order directly
  const handleExistingUserOrder = async () => {
    setIsSubmitting(true);
    setErrorMessage(undefined);
    try {
      const email = customer?.email || user?.email || '';
      const phone = customer?.phone || '';
      const firstName = customer?.first_name || '';
      const lastName = customer?.last_name || '';

      if (!email) {
        toast.error('No account found. Please sign in again.');
        return;
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
    <div className="py-8 sm:py-10">
      <div className="mb-10">
        <CheckoutProgressBar currentStage="checkout" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-12">
        {/* Main column */}
        <div className="lg:col-span-3 flex flex-col gap-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 sm:p-8">
            {isAuthenticated ? (
              <>
                <OrderingAsCard
                  fullName={fullName || 'You'}
                  email={customer?.email || user?.email || ''}
                  onSignOut={handleSignOut}
                />

                {/* Payment method */}
                <div className="mt-6">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Payment method</p>
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
                  className="mt-6 w-full bg-circleTel-orange hover:bg-orange-600 disabled:opacity-60 text-white font-semibold rounded-xl px-4 py-3.5 text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <PiLockSimpleBold className="w-4 h-4" />
                  {isSubmitting ? 'Processing…' : 'Place Order'}
                </button>
                <p className="text-center text-xs text-gray-400 mt-3">
                  R{monthlyPrice}/month billed after activation · No lock-in
                </p>
              </>
            ) : (
              <form onSubmit={handleSubmit(handleNewUserSubmit)} noValidate>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">Your details</p>

                <AccountSection
                  register={register}
                  errors={errors}
                  showPassword={showPassword}
                  onTogglePassword={() => setShowPassword((v) => !v)}
                  onGoogleSignIn={handleGoogleSignIn}
                  isSubmitting={isSubmitting}
                />

                {/* Payment method */}
                <div className="mt-6">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Payment method</p>
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
                  className="mt-6 w-full bg-circleTel-orange hover:bg-orange-600 disabled:opacity-60 text-white font-semibold rounded-xl px-4 py-3.5 text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <PiLockSimpleBold className="w-4 h-4" />
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
    </div>
  );
}
