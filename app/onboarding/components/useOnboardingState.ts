'use client';
import { useState, useEffect, useRef } from 'react';
import type { Step1, Step2 } from '@/lib/onboarding/schemas';

// Working state types: allow boolean for mandate/soAccept (not just literal true)
export interface Step3Working {
  accHolder?: string;
  bank?: string;
  accType?: string;
  accNumber?: string;
  branchCode?: string;
  mandate: boolean;
}

export interface Step5Working {
  paymentDate?: '1' | '15' | '20' | '25';
  soAccept: boolean;
}

export interface OnboardingState {
  clinic: any;
  service: any;
  step1: Partial<Step1>;
  step2: Partial<Step2>;
  step3: Step3Working;
  documents: Record<string, { documentId: string; fileName: string } | undefined>;
  step5: Step5Working;
  submissionId: string | null;
}

function buildStep1(customer: any): Partial<Step1> {
  return {
    clinicName:
      customer?.business_name?.replace(/^Unjani Clinic — /, '').replace(/^Unjani Clinic - /, '') ?? '',
    province: customer?.clinic_details?.province ?? '',
    contact: customer?.clinic_details?.nurse_owner_name ?? '',
    phone: customer?.phone ?? '',
    email: customer?.email ?? '',
    siteAddress: customer?.clinic_details?.site_address ?? '',
    lat: customer?.clinic_details?.lat ?? '',
    lng: customer?.clinic_details?.lng ?? '',
  };
}

function buildStep2(customer: any): Partial<Step2> {
  return {
    entityName: customer?.business_name ?? '',
    entityType: '',
    regNumber: customer?.business_registration ?? '',
    vat: customer?.tax_number ? 'Yes' : 'No',
    vatNumber: customer?.tax_number ?? '',
    regAddress: '',
  };
}

export function useOnboardingState(prefill: { customer: any; service: any }) {
  const [current, setCurrent] = useState(1);
  const [state, setState] = useState<OnboardingState>({
    clinic: prefill.customer,
    service: prefill.service,
    step1: buildStep1(prefill.customer),
    step2: buildStep2(prefill.customer),
    step3: {
      accHolder: '',
      bank: '',
      accType: '',
      accNumber: '',
      branchCode: '',
      mandate: false,
    },
    documents: {},
    step5: {
      paymentDate: '1' as const,
      soAccept: false,
    },
    submissionId: null,
  });

  // The useState initializer runs once — on first render prefill is still empty
  // (clinic data is fetched after mount). Seed the form from prefill once it
  // loads. Guarded by a ref so it runs exactly once, before the form is
  // interactive (the wizard shows "Loading…" until prefill is set), so this
  // never clobbers a nurse's edits.
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    const c = prefill?.customer;
    if (c && (c.id || c.business_name || c.email)) {
      seeded.current = true;
      setState((s) => ({
        ...s,
        clinic: c,
        service: prefill.service,
        step1: buildStep1(c),
        step2: buildStep2(c),
      }));
    }
  }, [prefill]);

  const patch = (key: keyof OnboardingState, value: any) =>
    setState((s) => ({ ...s, [key]: value }));

  const updateStep = (stepKey: 'step1' | 'step2' | 'step3' | 'step5', values: any) =>
    setState((s) => ({ ...s, [stepKey]: { ...s[stepKey], ...values } }));

  return { current, setCurrent, state, patch, updateStep, setState };
}
