'use client';
import { useState } from 'react';
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

export function useOnboardingState(prefill: { customer: any; service: any }) {
  const [current, setCurrent] = useState(1);
  const [state, setState] = useState<OnboardingState>({
    clinic: prefill.customer,
    service: prefill.service,
    step1: {
      clinicName: prefill.customer.business_name?.replace(/^Unjani Clinic — /, '') ?? '',
      unjaniAcc: prefill.customer.clinic_details?.unjani_account ?? '',
      province: prefill.customer.clinic_details?.province ?? '',
      contact: prefill.customer.clinic_details?.nurse_owner_name ?? '',
      phone: prefill.customer.phone ?? '',
      email: prefill.customer.email ?? '',
      siteAddress: prefill.customer.clinic_details?.site_address ?? '',
      lat: prefill.customer.clinic_details?.lat ?? '',
      lng: prefill.customer.clinic_details?.lng ?? '',
    },
    step2: {
      entityName: prefill.customer.business_name ?? '',
      entityType: '',
      regNumber: prefill.customer.business_registration ?? '',
      vat: prefill.customer.tax_number ? 'Yes' : 'No',
      vatNumber: prefill.customer.tax_number ?? '',
      regAddress: '',
    },
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

  const patch = (key: keyof OnboardingState, value: any) =>
    setState((s) => ({ ...s, [key]: value }));

  const updateStep = (stepKey: 'step1' | 'step2' | 'step3' | 'step5', values: any) =>
    setState((s) => ({ ...s, [stepKey]: { ...s[stepKey], ...values } }));

  return { current, setCurrent, state, patch, updateStep, setState };
}
