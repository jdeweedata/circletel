'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { OrderWizard } from '@/components/order/OrderWizard';
import { Step1PackageConfirmation } from '@/components/order/Step1PackageConfirmation';
import { Step2CustomerDetails } from '@/components/order/Step2CustomerDetails';
import { Step3OrderConfirmation } from '@/components/order/Step3OrderConfirmation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ServicePackage {
  id: string;
  name: string;
  service_type: string;
  speed_down: number;
  speed_up: number;
  price: number;
  promotion_price?: number;
  promotion_months?: number;
  description: string;
  features: string[];
  installation_fee?: number;
  router_included?: boolean;
}

interface CustomerDetails {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  alternate_phone?: string;
  installation_address: string;
  suburb?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  special_instructions?: string;
  billing_same_as_installation: boolean;
  billing_address?: string;
  billing_suburb?: string;
  billing_city?: string;
  billing_province?: string;
  billing_postal_code?: string;
  preferred_installation_date?: string;
  contact_preference: 'email' | 'phone' | 'sms' | 'whatsapp';
  marketing_opt_in: boolean;
  whatsapp_opt_in: boolean;
}

const STEPS = [
  {
    number: 1,
    title: 'Package',
    description: 'Review your selection',
  },
  {
    number: 2,
    title: 'Details',
    description: 'Your information',
  },
  {
    number: 3,
    title: 'Confirm',
    description: 'Review and submit',
  },
];

const INITIAL_CUSTOMER_DETAILS: CustomerDetails = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  installation_address: '',
  billing_same_as_installation: true,
  contact_preference: 'email',
  marketing_opt_in: false,
  whatsapp_opt_in: false,
};

function ConsumerOrderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const packageId = searchParams.get('package');
  const leadId = searchParams.get('lead');

  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>(INITIAL_CUSTOMER_DETAILS);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!packageId) {
      toast.error('No package selected');
      router.push('/coverage');
      return;
    }

    fetchPackageDetails();
  }, [packageId, router]);

  const fetchPackageDetails = async () => {
    setLoading(true);
    try {
      // Fetch package details
      const response = await fetch(`/api/coverage/packages?leadId=${leadId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch package details');
      }

      const data = await response.json();
      const pkg = data.packages?.find((p: ServicePackage) => p.id === packageId);

      if (!pkg) {
        throw new Error('Package not found');
      }

      setSelectedPackage(pkg);

      // Pre-fill address if we have lead data
      if (data.address) {
        setCustomerDetails((prev) => ({
          ...prev,
          installation_address: data.address,
        }));
      }
    } catch (error) {
      console.error('Error fetching package:', error);
      toast.error('Failed to load package details');
      router.push('/coverage');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleSubmitOrder();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCustomerDetailsChange = (details: Partial<CustomerDetails>) => {
    setCustomerDetails((prev) => ({ ...prev, ...details }));
  };

  const validateStep = (): boolean => {
    switch (currentStep) {
      case 1:
        return selectedPackage !== null;
      case 2:
        return !!(
          customerDetails.first_name &&
          customerDetails.last_name &&
          customerDetails.email &&
          customerDetails.phone &&
          customerDetails.installation_address
        );
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleSubmitOrder = async () => {
    if (!selectedPackage) {
      toast.error('No package selected');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderData = {
        // Customer details
        first_name: customerDetails.first_name,
        last_name: customerDetails.last_name,
        email: customerDetails.email,
        phone: customerDetails.phone,
        alternate_phone: customerDetails.alternate_phone,

        // Installation address
        installation_address: customerDetails.installation_address,
        suburb: customerDetails.suburb,
        city: customerDetails.city,
        province: customerDetails.province,
        postal_code: customerDetails.postal_code,
        special_instructions: customerDetails.special_instructions,

        // Billing address
        billing_same_as_installation: customerDetails.billing_same_as_installation,
        billing_address: customerDetails.billing_address,
        billing_suburb: customerDetails.billing_suburb,
        billing_city: customerDetails.billing_city,
        billing_province: customerDetails.billing_province,
        billing_postal_code: customerDetails.billing_postal_code,

        // Package details
        service_package_id: selectedPackage.id,
        package_name: selectedPackage.name,
        package_speed: `${selectedPackage.speed_down}/${selectedPackage.speed_up}Mbps`,
        package_price: selectedPackage.promotion_price || selectedPackage.price,
        installation_fee: selectedPackage.installation_fee || 0,
        router_included: selectedPackage.router_included || false,

        // Lead reference
        coverage_lead_id: leadId || null,

        // Preferences
        preferred_installation_date: customerDetails.preferred_installation_date,
        contact_preference: customerDetails.contact_preference,
        marketing_opt_in: customerDetails.marketing_opt_in,
        whatsapp_opt_in: customerDetails.whatsapp_opt_in,

        // Lead source
        lead_source: 'coverage_checker',
      };

      const response = await fetch('/api/orders/consumer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      const result = await response.json();

      // Success! Redirect to order confirmation page
      toast.success('Order created successfully!');
      router.push(`/orders/${result.order.id}?new=true`);
    } catch (error) {
      console.error('Order submission failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-circleTel-lightNeutral via-white to-circleTel-lightNeutral flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-circleTel-orange mx-auto mb-4" />
          <p className="text-lg text-circleTel-secondaryNeutral">Loading package details...</p>
        </div>
      </div>
    );
  }

  if (!selectedPackage) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-circleTel-lightNeutral via-white to-circleTel-lightNeutral">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <img src="/images/circletel-enclosed-logo.png" alt="CircleTel" className="h-8 w-auto" />
              <span className="text-xl font-bold text-circleTel-darkNeutral">CircleTel</span>
            </Link>
            <nav className="hidden md:flex items-center space-x-6">
              <span className="text-circleTel-orange font-semibold">Checkout</span>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-circleTel-darkNeutral mb-2">
            Complete Your Order
          </h1>
          <p className="text-circleTel-secondaryNeutral">
            Just a few steps to get you connected
          </p>
        </div>

        {/* Order Wizard */}
        <OrderWizard
          currentStep={currentStep}
          steps={STEPS}
          onNext={handleNext}
          onPrevious={handlePrevious}
          canGoNext={validateStep()}
          canGoPrevious={currentStep > 1}
          showNavigation={true}
          isSubmitting={isSubmitting}
        >
          {currentStep === 1 && (
            <Step1PackageConfirmation
              package={selectedPackage}
              onEdit={() => router.push(`/coverage/results?leadId=${leadId}`)}
            />
          )}

          {currentStep === 2 && (
            <Step2CustomerDetails
              details={customerDetails}
              onChange={handleCustomerDetailsChange}
            />
          )}

          {currentStep === 3 && (
            <Step3OrderConfirmation
              package={selectedPackage}
              customerDetails={customerDetails}
              onEdit={(step) => setCurrentStep(step)}
            />
          )}
        </OrderWizard>

        {/* Security Notice */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>🔒 Your information is secure and encrypted</p>
          <p className="mt-1">
            By completing this order, you agree to our{' '}
            <Link href="/terms" className="text-circleTel-orange hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-circleTel-orange hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default function ConsumerOrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-circleTel-orange" />
      </div>
    }>
      <ConsumerOrderContent />
    </Suspense>
  );
}
