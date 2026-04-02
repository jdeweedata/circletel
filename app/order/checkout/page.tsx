'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CheckoutProgressBar } from '@/components/order/CheckoutProgressBar';
import { useOrderContext } from '@/components/order/context/OrderContext';
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';
import { AccountSection, AccountFormValues } from '@/components/order/checkout/AccountSection';
import { OrderingAsCard } from '@/components/order/checkout/OrderingAsCard';
import { PaymentSection } from '@/components/order/checkout/PaymentSection';
import { OrderSummarySidebar } from '@/components/order/checkout/OrderSummarySidebar';

export default function CheckoutPage() {
  const router = useRouter();
  const { state: orderState, actions } = useOrderContext();
  const { isAuthenticated, customer, user, signOut, signUp, signInWithGoogle } = useCustomerAuth();

  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | undefined>();
  const [accountCreated, setAccountCreated] = useState(false);

  const pkg = orderState.orderData.package?.selectedPackage;
  const coverage = orderState.orderData.coverage;

  // Guard: require coverage check first
  useEffect(() => {
    if (!pkg && !orderState.orderData.coverage?.leadId) {
      router.replace('/order/coverage');
    }
  }, [pkg, orderState.orderData.coverage?.leadId, router]);

  const handleAccountSubmit = async (values: AccountFormValues) => {
    setIsCreatingAccount(true);
    try {
      const result = await signUp(values.email, values.password, {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
      });
      if (result.error) {
        throw new Error(result.error);
      }
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
      setAccountCreated(true);
      toast.success('Account created! Proceeding to payment...');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Account creation failed';
      toast.error(message);
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const handleGoogleSignIn = async () => {
    await signInWithGoogle();
  };

  const handleSignOut = async () => {
    await signOut();
    toast.info('Signed out. Please create an account to continue.');
  };

  const handleProceedToPayment = async () => {
    const email = customer?.email || user?.email;
    const phone = customer?.phone || orderState.orderData.account?.phone;
    const firstName = customer?.first_name || orderState.orderData.account?.firstName || '';
    const lastName = customer?.last_name || orderState.orderData.account?.lastName || '';

    if (!email) {
      toast.error('Please create an account or sign in first.');
      return;
    }
    if (!pkg) {
      toast.error('No package selected. Please go back and choose a plan.');
      return;
    }
    if (!coverage?.address) {
      toast.error('No service address found. Please start from the coverage check.');
      return;
    }

    setIsProcessingPayment(true);
    setPaymentError(undefined);

    try {
      // Step 1: Create order
      const orderRes = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          phone: phone || '',
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
      toast.success(`Order ${order.order_number} created`);

      // Step 2: Initiate payment
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

      if (!paymentRes.ok) {
        throw new Error('Failed to initiate payment');
      }
      const { paymentUrl } = await paymentRes.json();

      // Step 3: Redirect to NetCash
      window.location.href = paymentUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setPaymentError(message);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const showAccountSection = !isAuthenticated && !accountCreated;
  const showPaymentSection = isAuthenticated || accountCreated;

  const fullName = customer
    ? `${customer.first_name ?? ''} ${customer.last_name ?? ''}`.trim()
    : `${orderState.orderData.account?.firstName ?? ''} ${orderState.orderData.account?.lastName ?? ''}`.trim();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <CheckoutProgressBar currentStage="checkout" />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main column */}
        <div className="lg:col-span-2">
          {isAuthenticated && (
            <OrderingAsCard
              fullName={fullName || 'You'}
              email={customer?.email || user?.email || ''}
              onSignOut={handleSignOut}
            />
          )}

          {showAccountSection && (
            <AccountSection
              onSubmit={handleAccountSubmit}
              onGoogleSignIn={handleGoogleSignIn}
              isSubmitting={isCreatingAccount}
            />
          )}

          {showPaymentSection && pkg && (
            <PaymentSection
              monthlyPrice={pkg.monthlyPrice}
              packageName={pkg.name}
              onProceed={handleProceedToPayment}
              isProcessing={isProcessingPayment}
              errorMessage={paymentError}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          {pkg && (
            <OrderSummarySidebar
              packageName={pkg.name}
              speed={pkg.speed}
              monthlyPrice={pkg.monthlyPrice}
              promotionPrice={typeof pkg.promotion_price === 'number' ? pkg.promotion_price : undefined}
              promotionMonths={pkg.promotion_months ?? undefined}
              installationFee={pkg.installation_fee ?? 0}
            />
          )}
        </div>
      </div>
    </div>
  );
}
