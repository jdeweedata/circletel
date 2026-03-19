'use client';

import { useState } from 'react';
import { PiCheckCircleBold, PiSpinnerBold } from 'react-icons/pi';
import { CONTACT } from '@/lib/constants/contact';
import { isValidSAIDNumber } from '@/lib/quotes/quote-validator';
import { SignatureCanvas } from '@/components/quotes/SignatureCanvas';

interface QuoteAcceptanceFormProps {
  quoteId: string;
  quote: {
    status: string;
    valid_until: string;
    contact_name: string;
    contact_email: string;
    accepted_at?: string | null;
    company_name: string;
  };
  onAccepted?: () => void;
}

export function QuoteAcceptanceForm({ quoteId, quote, onAccepted }: QuoteAcceptanceFormProps) {
  const [signerName, setSignerName] = useState(quote.contact_name);
  const [signerEmail, setSignerEmail] = useState(quote.contact_email);
  const [signerIdNumber, setSignerIdNumber] = useState('');
  const [signerTitle, setSignerTitle] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [installationAuthorised, setInstallationAuthorised] = useState(false);
  const [signingAuthority, setSigningAuthority] = useState(false);
  const [ficaConfirmed, setFicaConfirmed] = useState(false);
  const [cipcConfirmed, setCipcConfirmed] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signatureType, setSignatureType] = useState<'drawn' | 'typed'>('drawn');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Status gate checks
  if (quote.status === 'accepted') {
    const acceptedDate = quote.accepted_at
      ? new Date(quote.accepted_at).toLocaleDateString('en-ZA', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : 'a previous date';

    return (
      <div className="bg-green-50 border-2 border-green-300 p-6 rounded-lg text-center">
        <PiCheckCircleBold className="mx-auto text-green-600 text-4xl mb-3" />
        <h3 className="text-lg font-semibold text-green-800">
          This quote was accepted on {acceptedDate}
        </h3>
      </div>
    );
  }

  const isExpired = new Date(quote.valid_until) < new Date();
  if (isExpired) {
    const expiryDate = new Date(quote.valid_until).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    return (
      <div className="bg-amber-50 border-2 border-amber-300 p-6 rounded-lg text-center">
        <h3 className="text-lg font-semibold text-amber-800 mb-2">
          This quote expired on {expiryDate}
        </h3>
        <p className="text-amber-700 mb-4">
          Please contact sales for a new quote.
        </p>
        <a
          href={CONTACT.WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-circleTel-orange text-white px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Contact Us on WhatsApp
        </a>
      </div>
    );
  }

  if (!['sent', 'viewed'].includes(quote.status)) {
    return (
      <div className="bg-gray-50 border-2 border-gray-300 p-6 rounded-lg text-center">
        <h3 className="text-lg font-semibold text-gray-700">
          This quote is being prepared and cannot be accepted yet.
        </h3>
      </div>
    );
  }

  // Validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isNameValid = signerName.trim().length >= 2;
  const isEmailValid = emailRegex.test(signerEmail);
  const isIdValid = isValidSAIDNumber(signerIdNumber);
  const allCheckboxes =
    termsAccepted &&
    addressConfirmed &&
    installationAuthorised &&
    signingAuthority &&
    ficaConfirmed &&
    cipcConfirmed;
  const isSignatureValid =
    signatureData !== null && signatureData.length < 500000;

  const canSubmit =
    isNameValid &&
    isEmailValid &&
    isIdValid &&
    allCheckboxes &&
    isSignatureValid &&
    formState !== 'submitting';

  const handleSubmit = async () => {
    setFormState('submitting');
    setErrorMessage('');

    try {
      const res = await fetch(`/api/quotes/business/${quoteId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote_id: quoteId,
          signer_name: signerName.trim(),
          signer_email: signerEmail.trim(),
          signer_id_number: signerIdNumber.trim(),
          signer_title: signerTitle.trim() || undefined,
          signature_type: signatureType,
          signature_data: signatureData,
          terms_accepted: true,
          fica_documents_confirmed: true,
          cipc_documents_confirmed: true,
          additional_notes: additionalNotes.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setFormState('success');
        onAccepted?.();
      } else {
        setFormState('error');
        setErrorMessage(data.error || 'Failed to sign quote. Please try again.');
      }
    } catch {
      setFormState('error');
      setErrorMessage('Network error. Please check your connection and try again.');
    }
  };

  // Success state
  if (formState === 'success') {
    return (
      <div className="bg-green-50 border-2 border-green-300 p-8 rounded-lg text-center">
        <PiCheckCircleBold className="mx-auto text-green-600 text-5xl mb-4" />
        <h3 className="text-xl font-semibold text-green-800 mb-2">
          Quote Accepted Successfully
        </h3>
        <p className="text-green-700 mb-6">
          Thank you for accepting this quote for {quote.company_name}.
        </p>

        <div className="text-left max-w-md mx-auto mb-6">
          <h4 className="font-semibold text-green-800 mb-3">What happens next:</h4>
          <ol className="list-decimal list-inside space-y-2 text-sm text-green-700">
            <li>Our team will review your acceptance</li>
            <li>You will be contacted for FICA/KYC document verification</li>
            <li>A formal service contract will be prepared</li>
            <li>Installation will be scheduled</li>
          </ol>
        </div>

        <a
          href={CONTACT.WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block border-2 border-circleTel-orange text-circleTel-orange px-6 py-2 rounded-lg font-medium hover:bg-circleTel-orange hover:text-white transition-colors"
        >
          Contact Us on WhatsApp
        </a>
      </div>
    );
  }

  // Acceptance form
  const inputClass =
    'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-circleTel-orange focus:border-circleTel-orange';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
  const checkboxClass =
    'mt-1 h-4 w-4 rounded border-gray-300 text-circleTel-orange focus:ring-circleTel-orange';

  return (
    <div className="bg-gray-50 border-2 border-circleTel-orange p-6 rounded-lg">
      <h3 className="text-xl font-bold text-circleTel-navy text-center mb-6">
        CUSTOMER ACCEPTANCE
      </h3>

      {/* Signer Details */}
      <h4 className="text-lg font-semibold text-circleTel-navy mb-4">
        SIGNER DETAILS
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label htmlFor="signerName" className={labelClass}>
            Full Name *
          </label>
          <input
            id="signerName"
            type="text"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            className={inputClass}
            disabled={formState === 'submitting'}
          />
        </div>
        <div>
          <label htmlFor="signerEmail" className={labelClass}>
            Email Address *
          </label>
          <input
            id="signerEmail"
            type="email"
            value={signerEmail}
            onChange={(e) => setSignerEmail(e.target.value)}
            className={inputClass}
            disabled={formState === 'submitting'}
          />
        </div>
        <div>
          <label htmlFor="signerIdNumber" className={labelClass}>
            SA ID Number *
          </label>
          <input
            id="signerIdNumber"
            type="text"
            value={signerIdNumber}
            onChange={(e) => setSignerIdNumber(e.target.value)}
            className={inputClass}
            disabled={formState === 'submitting'}
            maxLength={13}
          />
          {signerIdNumber.length > 0 && !isIdValid && (
            <p className="mt-1 text-xs text-red-600">
              Please enter a valid 13-digit South African ID number.
            </p>
          )}
        </div>
        <div>
          <label htmlFor="signerTitle" className={labelClass}>
            Title/Position
          </label>
          <input
            id="signerTitle"
            type="text"
            value={signerTitle}
            onChange={(e) => setSignerTitle(e.target.value)}
            className={inputClass}
            disabled={formState === 'submitting'}
          />
        </div>
      </div>

      {/* Acceptance Declaration */}
      <h4 className="text-lg font-semibold text-circleTel-navy mb-4">
        ACCEPTANCE DECLARATION
      </h4>
      <div className="space-y-3 text-sm mb-6">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className={checkboxClass}
            disabled={formState === 'submitting'}
          />
          <span>I accept the terms and conditions as outlined above</span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={addressConfirmed}
            onChange={(e) => setAddressConfirmed(e.target.checked)}
            className={checkboxClass}
            disabled={formState === 'submitting'}
          />
          <span>I confirm the service address and technical requirements are correct</span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={installationAuthorised}
            onChange={(e) => setInstallationAuthorised(e.target.checked)}
            className={checkboxClass}
            disabled={formState === 'submitting'}
          />
          <span>I authorize CircleTel to proceed with installation</span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={signingAuthority}
            onChange={(e) => setSigningAuthority(e.target.checked)}
            className={checkboxClass}
            disabled={formState === 'submitting'}
          />
          <span>I have authority to sign on behalf of the company</span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={ficaConfirmed}
            onChange={(e) => setFicaConfirmed(e.target.checked)}
            className={checkboxClass}
            disabled={formState === 'submitting'}
          />
          <span>I confirm I will provide the required FICA documentation</span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={cipcConfirmed}
            onChange={(e) => setCipcConfirmed(e.target.checked)}
            className={checkboxClass}
            disabled={formState === 'submitting'}
          />
          <span>I confirm the company&apos;s CIPC registration documentation</span>
        </label>
      </div>

      {/* Signature */}
      <h4 className="text-lg font-semibold text-circleTel-navy mb-4">
        SIGNATURE
      </h4>
      <div className="mb-6">
        <SignatureCanvas
          onSignatureChange={(data, mode) => {
            setSignatureData(data);
            setSignatureType(mode);
          }}
          disabled={formState === 'submitting'}
        />
      </div>

      {/* Additional Notes */}
      <div className="mb-6">
        <label htmlFor="additionalNotes" className={labelClass}>
          Additional Notes (optional)
        </label>
        <textarea
          id="additionalNotes"
          rows={3}
          value={additionalNotes}
          onChange={(e) => setAdditionalNotes(e.target.value)}
          className={inputClass}
          disabled={formState === 'submitting'}
        />
      </div>

      {/* Error message */}
      {formState === 'error' && errorMessage && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-md mb-4 text-sm">
          {errorMessage}
        </div>
      )}

      {/* Submit button */}
      <div className="text-center print:hidden">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`bg-circleTel-orange text-white px-8 py-3 rounded-lg font-medium text-lg transition-opacity ${
            !canSubmit ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
          }`}
        >
          {formState === 'submitting' ? (
            <span className="inline-flex items-center gap-2">
              <PiSpinnerBold className="animate-spin" />
              Signing...
            </span>
          ) : (
            'ACCEPT QUOTE & SIGN DIGITALLY'
          )}
        </button>
      </div>

      {/* Legal text */}
      <p className="text-xs text-gray-500 text-center mt-3 print:hidden">
        By signing, you agree to the terms above. Your IP address and timestamp will be recorded.
      </p>

      {/* Print fallback */}
      <p className="hidden print:block text-sm text-gray-600 text-center mt-4">
        This quote can be accepted digitally via the online portal or manually signed and returned.
      </p>
    </div>
  );
}
