'use client';

import type { FormEvent, ReactNode } from 'react';
import { useState } from 'react';
import { PiCheckCircleBold, PiSpinnerBold, PiWarningCircleBold } from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type FormState = {
  name: string;
  email: string;
  phone: string;
  company: string;
  employees: string;
  location: string;
  priority: string;
  concern: string;
  consent: boolean;
};

const initialState: FormState = {
  name: '',
  email: '',
  phone: '',
  company: '',
  employees: '',
  location: '',
  priority: 'Security and data protection',
  concern: '',
  consent: false,
};

const priorityOptions = [
  'Security and data protection',
  'Unstable internet or Wi-Fi',
  'Microsoft 365 and email issues',
  'Backup and recovery risk',
  'IT support responsiveness',
  'Cost and vendor sprawl',
];

export function ITHealthLeadForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const updateField = (field: keyof FormState, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (status === 'error') {
      setStatus('idle');
      setError('');
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.consent) {
      setStatus('error');
      setError('Please confirm that CircleTel may contact you about the IT Health Assessment.');
      return;
    }

    setStatus('submitting');
    setError('');

    const message = [
      'Lead magnet: IT Health Assessment request',
      `Location: ${form.location || 'Not supplied'}`,
      `Primary concern: ${form.priority}`,
      `Current IT health notes: ${form.concern || 'Not supplied'}`,
      'Requested next step: qualify the lead and schedule an IT health assessment before any audit work begins.',
    ].join('\n');

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          company: form.company,
          employees: form.employees,
          source: 'IT Health Assessment Lead Magnet',
          message,
        }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || 'We could not submit your request. Please try again.');
      }

      setStatus('success');
      setForm(initialState);
    } catch (submitError) {
      setStatus('error');
      setError(submitError instanceof Error ? submitError.message : 'We could not submit your request. Please try again.');
    }
  };

  if (status === 'success') {
    return <AssessmentSuccess />;
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-ui-border bg-white p-5 shadow-2xl md:p-6">
      <FormHeader />

      <div className="grid gap-4">
        <ContactFields form={form} updateField={updateField} />
        <AssessmentContextFields form={form} updateField={updateField} />
        <ConsentPanel checked={form.consent} updateField={updateField} />
        <StatusAlert status={status} error={error} />
        <SubmitButton status={status} />

        <p className="text-center text-xs leading-5 text-ui-text-muted">
          No automated audit is released before we have confirmed the scope with your team.
        </p>
      </div>
    </form>
  );
}

function AssessmentSuccess() {
  return (
    <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center shadow-lg">
      <PiCheckCircleBold className="mx-auto mb-4 h-12 w-12 text-green-600" />
      <h2 className="font-heading text-2xl font-bold text-circleTel-navy">Your assessment request is in.</h2>
      <p className="mt-3 text-sm leading-6 text-circleTel-secondaryNeutral">
        A CircleTel specialist will review your details and contact you to confirm the scope before the IT Health Assessment is done.
      </p>
    </div>
  );
}

function FormHeader() {
  return (
    <div className="mb-5">
      <p className="text-sm font-semibold uppercase text-circleTel-orange-accessible">Free request</p>
      <h2 className="mt-2 font-heading text-2xl font-bold text-circleTel-navy">Book your IT Health Assessment</h2>
      <p className="mt-2 text-sm leading-6 text-circleTel-secondaryNeutral">
        Share a few details first. We will qualify the request, then schedule the assessment or audit with the right specialist.
      </p>
    </div>
  );
}

type FieldUpdater = (field: keyof FormState, value: string | boolean) => void;

type FieldGroupProps = {
  form: FormState;
  updateField: FieldUpdater;
};

function ContactFields({ form, updateField }: FieldGroupProps) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Full name" htmlFor="it-health-name">
          <Input
            id="it-health-name"
            name="name"
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
            autoComplete="name"
            required
            placeholder="Jane Mokoena"
          />
        </FormField>
        <FormField label="Work email" htmlFor="it-health-email">
          <Input
            id="it-health-email"
            name="email"
            type="email"
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
            autoComplete="email"
            required
            placeholder="jane@company.co.za"
          />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Phone number" htmlFor="it-health-phone">
          <Input
            id="it-health-phone"
            name="phone"
            value={form.phone}
            onChange={(event) => updateField('phone', event.target.value)}
            autoComplete="tel"
            placeholder="+27 82 000 0000"
          />
        </FormField>
        <FormField label="Company" htmlFor="it-health-company">
          <Input
            id="it-health-company"
            name="company"
            value={form.company}
            onChange={(event) => updateField('company', event.target.value)}
            autoComplete="organization"
            required
            placeholder="Company name"
          />
        </FormField>
      </div>
    </>
  );
}

function AssessmentContextFields({ form, updateField }: FieldGroupProps) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Team size" htmlFor="it-health-employees">
          <SelectInput
            id="it-health-employees"
            name="employees"
            value={form.employees}
            onChange={(value) => updateField('employees', value)}
            required
          >
            <option value="" disabled>Select size</option>
            <option value="1-9">1-9 employees</option>
            <option value="10-24">10-24 employees</option>
            <option value="25-49">25-49 employees</option>
            <option value="50-99">50-99 employees</option>
            <option value="100+">100+ employees</option>
          </SelectInput>
        </FormField>
        <FormField label="Business location" htmlFor="it-health-location">
          <Input
            id="it-health-location"
            name="location"
            value={form.location}
            onChange={(event) => updateField('location', event.target.value)}
            autoComplete="address-level2"
            placeholder="Johannesburg, Cape Town, Durban"
          />
        </FormField>
      </div>

      <FormField label="Biggest IT concern" htmlFor="it-health-priority">
        <SelectInput
          id="it-health-priority"
          name="priority"
          value={form.priority}
          onChange={(value) => updateField('priority', value)}
        >
          {priorityOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </SelectInput>
      </FormField>

      <FormField label="What should we look at first?" htmlFor="it-health-concern">
        <Textarea
          id="it-health-concern"
          name="concern"
          value={form.concern}
          onChange={(event) => updateField('concern', event.target.value)}
          placeholder="Tell us about outages, slow Wi-Fi, email risk, backups, support delays, or upcoming growth."
          className="min-h-28"
        />
      </FormField>
    </>
  );
}

type SelectInputProps = {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  required?: boolean;
};

function SelectInput({ id, name, value, onChange, children, required }: SelectInputProps) {
  return (
    <select
      id={id}
      name={name}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      required={required}
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {children}
    </select>
  );
}

type ConsentPanelProps = {
  checked: boolean;
  updateField: FieldUpdater;
};

function ConsentPanel({ checked, updateField }: ConsentPanelProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-ui-border bg-ui-bg p-3">
      <Checkbox
        id="it-health-consent"
        checked={checked}
        onCheckedChange={(value) => updateField('consent', value === true)}
        className="mt-1"
      />
      <Label htmlFor="it-health-consent" className="text-sm font-normal leading-6 text-circleTel-secondaryNeutral">
        I agree that CircleTel may contact me about this IT Health Assessment request and process my details according to the privacy policy.
      </Label>
    </div>
  );
}

type StatusAlertProps = {
  status: 'idle' | 'submitting' | 'success' | 'error';
  error: string;
};

function StatusAlert({ status, error }: StatusAlertProps) {
  if (status !== 'error') {
    return null;
  }

  return (
    <div className="flex gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      <PiWarningCircleBold className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <span>{error}</span>
    </div>
  );
}

function SubmitButton({ status }: { status: 'idle' | 'submitting' | 'success' | 'error' }) {
  return (
    <Button
      type="submit"
      size="lg"
      disabled={status === 'submitting'}
      className="h-12 w-full bg-circleTel-orange font-semibold text-white hover:bg-circleTel-orange-dark"
    >
      {status === 'submitting' ? (
        <>
          <PiSpinnerBold className="mr-2 h-5 w-5 animate-spin" />
          Sending request
        </>
      ) : (
        'Request my assessment'
      )}
    </Button>
  );
}

type FormFieldProps = {
  label: string;
  htmlFor: string;
  children: ReactNode;
};

function FormField({ label, htmlFor, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="text-sm font-semibold text-circleTel-navy">
        {label}
      </Label>
      {children}
    </div>
  );
}
