'use client';
import { useEffect, useState, useMemo } from 'react';
import { step1Schema, step2Schema, step3Schema, step5Schema } from '@/lib/onboarding/schemas';
import { requiredDocsFor } from '@/lib/onboarding/document-requirements';
import { useOnboardingState } from './useOnboardingState';
import { OrderWizard } from '@/components/order/OrderWizard';
import { Step1Clinic } from './steps/Step1Clinic';
import { Step2Business } from './steps/Step2Business';
import { Step3Banking } from './steps/Step3Banking';
import { Step4Documents } from './steps/Step4Documents';
import { Step5ServiceOrder } from './steps/Step5ServiceOrder';
import { Step6Done } from './steps/Step6Done';
import { Card, CardContent } from '@/components/ui/card';
import { PiWarningCircle, PiSpinnerGap } from 'react-icons/pi';

const STEPS = [
  { number: 1, title: 'Clinic details', description: 'Confirm clinic info' },
  { number: 2, title: 'Business', description: 'Entity & registration' },
  { number: 3, title: 'Banking', description: 'Account details' },
  { number: 4, title: 'Documents', description: 'Supporting docs' },
  { number: 5, title: 'Service Order', description: 'Terms & payment date' },
  { number: 6, title: 'Done', description: 'Complete' },
];

export interface OnboardingWizardProps {
  token: string;
}

export function OnboardingWizard({ token }: OnboardingWizardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<any>(null);
  const [alreadyComplete, setAlreadyComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successAccountNumber, setSuccessAccountNumber] = useState<string | null>(null);

  const wizard = useOnboardingState(prefill || { customer: {}, service: {} });
  const { current, setCurrent, state, updateStep } = wizard;

  // Fetch clinic details on mount
  useEffect(() => {
    async function fetchClinic() {
      try {
        const res = await fetch(`/api/onboarding/get-clinic?token=${token}`);
        const json = await res.json();

        if (res.status === 401) {
          setError('Invalid or expired link. Please request a new one from your admin.');
          setLoading(false);
          return;
        }

        if (json.alreadyComplete) {
          setAlreadyComplete(true);
          setLoading(false);
          return;
        }

        if (!res.ok) {
          setError(json.error || 'Failed to load clinic details');
          setLoading(false);
          return;
        }

        setPrefill(json);

        // Create a draft submission for document uploads
        const submitRes = await fetch('/api/onboarding/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, mode: 'draft' }),
        });
        const submitJson = await submitRes.json();
        if (!submitRes.ok || !submitJson.success) {
          setError('Could not start your onboarding session. Please refresh and try again.');
          setLoading(false);
          return;
        }

        wizard.patch('submissionId', submitJson.submissionId);
        setLoading(false);
      } catch (err) {
        setError('Network error loading clinic details');
        setLoading(false);
        console.error(err);
      }
    }

    fetchClinic();
  }, [token]);

  // Step 4 canGoNext: all required docs present (memoized).
  // MUST be declared before any early return so the hook order is stable across renders (React #310).
  const { s4RequiredDocs, s4DocsUploaded } = useMemo(() => {
    const requiredDocs = requiredDocsFor('unjani', {
      vatRegistered: state.step2.vat === 'Yes',
      entityType: state.step2.entityType || '',
    }).filter((d) => d.required);
    const docsUploaded = requiredDocs.every((d) => state.documents[d.type]);
    return { s4RequiredDocs: requiredDocs, s4DocsUploaded: docsUploaded };
  }, [state.step2.vat, state.step2.entityType, state.documents]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <PiSpinnerGap className="w-6 h-6 text-circleTel-orange animate-spin" />
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  if (alreadyComplete) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold text-green-900 mb-2">
            Already set up
          </h2>
          <p className="text-green-800">
            Your clinic billing is already activated. If you need to make changes,
            please contact support at{' '}
            <a
              href="https://wa.me/27824873900"
              className="font-semibold underline"
            >
              082 487 3900
            </a>
            .
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6 flex gap-3">
          <PiWarningCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <div>
            <h2 className="text-lg font-semibold text-red-900 mb-1">
              Unable to load
            </h2>
            <p className="text-red-800">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step validation
  const s1Valid = step1Schema.safeParse(state.step1).success;
  const s2Valid = step2Schema.safeParse(state.step2).success;
  const s3Valid = step3Schema.safeParse(state.step3).success;
  const s5Valid = step5Schema.safeParse(state.step5).success;

  const canGoNextByStep: Record<number, boolean> = {
    1: s1Valid,
    2: s2Valid,
    3: s3Valid,
    4: s4DocsUploaded && s4RequiredDocs.length > 0,
    5: s5Valid,
    6: false,
  };

  const handleNext = async () => {
    if (current === 5) {
      // Final submit
      setSubmitting(true);
      try {
        const submitRes = await fetch('/api/onboarding/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            submissionId: state.submissionId,
            step1: state.step1,
            step2: state.step2,
            step3: state.step3,
            step5: state.step5,
            mode: 'final',
          }),
        });

        const json = await submitRes.json();

        if (!json.success) {
          setError(json.error || 'Submission failed');
          setSubmitting(false);
          return;
        }

        setSuccessAccountNumber(json.accountNumber);
        setCurrent(6);
      } catch (err) {
        setError('Network error submitting. Please try again.');
        console.error(err);
      } finally {
        setSubmitting(false);
      }
    } else {
      setCurrent(current + 1);
    }
  };

  const handlePrevious = () => {
    setCurrent(current - 1);
  };

  return (
    <div className="space-y-6">
      {/* Intro section with branding */}
      <div>
        <p className="text-sm font-semibold text-circleTel-orange uppercase tracking-widest">
          Unjani Clinic Network · Billing setup
        </p>
        <h1 className="text-3xl font-bold text-gray-900 mt-1 mb-2">
          Let's set up your clinic for billing
        </h1>
        <p className="text-gray-600 max-w-2xl">
          We already hold your clinic and contact details from the Unjani network
          record. Confirm what we have, add your business and banking details, and
          accept your Service Order to activate billing.
        </p>
      </div>

      {/* Wizard container */}
      <OrderWizard
        currentStep={current}
        steps={STEPS}
        canGoNext={canGoNextByStep[current]}
        canGoPrevious={current > 1}
        onNext={handleNext}
        onPrevious={handlePrevious}
        isSubmitting={submitting}
        showNavigation={current !== 6}
      >
        {/* Step 1 */}
        {current === 1 && (
          <Step1Clinic
            value={state.step1}
            onChange={(vals) => updateStep('step1', vals)}
            canGoNext={canGoNextByStep[1]}
          />
        )}

        {/* Step 2 */}
        {current === 2 && (
          <Step2Business
            value={state.step2}
            onChange={(vals) => updateStep('step2', vals)}
            canGoNext={canGoNextByStep[2]}
          />
        )}

        {/* Step 3 */}
        {current === 3 && (
          <Step3Banking
            value={state.step3}
            onChange={(vals) => updateStep('step3', vals)}
            step2EntityName={state.step2.entityName}
            canGoNext={canGoNextByStep[3]}
          />
        )}

        {/* Step 4 */}
        {current === 4 && (
          <Step4Documents
            token={token}
            submissionId={state.submissionId}
            step2={state.step2}
            documents={state.documents}
            onChange={(docs) => wizard.patch('documents', docs)}
            canGoNext={canGoNextByStep[4]}
          />
        )}

        {/* Step 5 */}
        {current === 5 && (
          <Step5ServiceOrder
            value={state.step5}
            onChange={(vals) => updateStep('step5', vals)}
            monthlyPrice={typeof state.service?.monthly_price === 'number' ? state.service.monthly_price : 450}
            activationDate={state.service?.activation_date ?? new Date().toISOString().split('T')[0]}
            canGoNext={canGoNextByStep[5]}
          />
        )}

        {/* Step 6 */}
        {current === 6 && successAccountNumber && (
          <Step6Done accountNumber={successAccountNumber} />
        )}
      </OrderWizard>
    </div>
  );
}
