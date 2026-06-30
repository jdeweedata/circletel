import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { resolveTokenForPurpose, svc } from '@/lib/onboarding/onboarding-service';
import {
  SERVICE_ORDER_TERMS,
  getServiceOrderReference,
  stripHtmlFromTerms,
} from '@/lib/onboarding/service-order-terms';
import { ServiceOrderSignoffClient } from './ServiceOrderSignoffClient';

function formatDate(value: string | null | undefined): string {
  if (!value) return 'Not set';
  return new Date(value).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function billingDayLabel(value: string | null | undefined): string {
  if (value === '1') return '1st';
  if (value === '15') return '15th';
  if (value === '20') return '20th';
  if (value === '25') return '25th';
  return value || 'Not set';
}

function InvalidLink() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F9FAFB] px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <h1 className="text-2xl font-bold text-gray-900">Service Order Link Unavailable</h1>
              <p className="mt-2 text-gray-700">
                This signoff link is invalid, expired, or already used.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default async function ServiceOrderSignoffPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const resolved = await resolveTokenForPurpose(token, 'service_order_signoff');
  if (!resolved) return <InvalidLink />;

  const supabase = svc();
  const { data: customer } = await supabase
    .from('customers')
    .select('id, account_number, business_name, email')
    .eq('id', resolved.customerId)
    .single();
  if (!customer) return <InvalidLink />;

  let submissionQuery = supabase
    .from('onboarding_submissions')
    .select('id, segment, submission_data')
    .eq('customer_id', resolved.customerId);
  if (resolved.onboardingSubmissionId) {
    submissionQuery = submissionQuery.eq('id', resolved.onboardingSubmissionId);
  } else {
    submissionQuery = submissionQuery
      .order('submitted_at', { ascending: false, nullsFirst: false })
      .limit(1);
  }
  const { data: submission } = await submissionQuery.single();
  if (!submission) return <InvalidLink />;

  const { data: service } = await supabase
    .from('customer_services')
    .select('monthly_price, activation_date, package_name')
    .eq('customer_id', resolved.customerId)
    .order('activation_date', { ascending: false })
    .limit(1)
    .single();
  if (!service) return <InvalidLink />;

  const submissionData = (submission.submission_data ?? {}) as Record<string, any>;
  const billingDay = submissionData.step5?.paymentDate ?? '1';
  const segment = submission.segment ?? 'unjani';

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F9FAFB] px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <ServiceOrderSignoffClient
            token={token}
            businessName={customer.business_name}
            accountNumber={customer.account_number}
            serviceName={
              service.package_name ||
              (segment === 'unjani'
                ? 'CircleTel ClinicConnect — Managed Connectivity'
                : 'CircleTel Business Connectivity Service')
            }
            monthlyFeeExVat={Number(service.monthly_price ?? 450)}
            billingDay={billingDayLabel(billingDay)}
            activationDate={formatDate(service.activation_date)}
            terms={stripHtmlFromTerms(SERVICE_ORDER_TERMS)}
            serviceReference={getServiceOrderReference(segment)}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
