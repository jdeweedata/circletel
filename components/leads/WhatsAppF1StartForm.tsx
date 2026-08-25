'use client';

import { useMemo, useState } from 'react';
import { CONTACT } from '@/lib/constants/contact';

export interface WhatsAppF1StartFormProps {
  /** Stored as entry_source on the flow session */
  entrySource?: 'website' | 'qr' | 'manual' | 'ctwa_ad';
  /** Campaign tag for attribution */
  sourceCampaign?: string;
  eyebrow?: string;
  headline?: string;
  description?: string;
  submitLabel?: string;
  className?: string;
  /** Compact layout for embedding in other blocks */
  compact?: boolean;
}

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function WhatsAppF1StartForm({
  entrySource = 'website',
  sourceCampaign,
  eyebrow = 'WhatsApp · 1 minute',
  headline = 'Get a personalised quote on WhatsApp',
  description = 'We send a short form to your WhatsApp. Complete it and our team follows up.',
  submitLabel = 'Send me the form on WhatsApp',
  className = '',
  compact = false,
}: WhatsAppF1StartFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const campaign = useMemo(
    () => sourceCampaign || `web-${entrySource}`,
    [sourceCampaign, entrySource]
  );

  const isValid = name.trim().length > 1 && phone.replace(/\D/g, '').length >= 10;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || status === 'submitting') return;

    setStatus('submitting');
    setError(null);

    try {
      const res = await fetch('/api/leads/whatsapp-f1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          first_name: name.trim(),
          entry_source: entrySource,
          source_campaign: campaign,
          website: honeypot,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not send WhatsApp form');
      }

      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  if (status === 'success') {
    return (
      <div
        className={`rounded-2xl bg-white border border-gray-100 shadow-sm text-center ${
          compact ? 'p-6' : 'p-8 md:p-12'
        } ${className}`}
      >
        <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl" aria-hidden="true">
            ✓
          </span>
        </div>
        <h3 className="text-xl font-bold text-[#1B2A4A] mb-2">Check your WhatsApp</h3>
        <p className="text-sm text-gray-600 max-w-md mx-auto">
          We sent a message from <strong>{CONTACT.WHATSAPP_NUMBER}</strong>. Open it and tap{' '}
          <strong>Get started</strong> to complete the short form.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl bg-[#F8F9FA] border border-gray-100 ${
        compact ? 'p-6' : 'p-8 md:p-12'
      } ${className}`}
    >
      <div className={`text-center ${compact ? 'mb-5' : 'mb-8'}`}>
        {eyebrow ? (
          <span className="inline-block px-3 py-1 rounded-full bg-orange-50 text-[#E87A1E] text-xs font-bold border border-orange-100 mb-3">
            {eyebrow}
          </span>
        ) : null}
        <h2
          className={`font-extrabold text-[#1B2A4A] ${compact ? 'text-xl' : 'text-2xl md:text-3xl'}`}
          style={{ letterSpacing: '-0.02em' }}
        >
          {headline}
        </h2>
        {description ? (
          <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">{description}</p>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="relative space-y-4 max-w-md mx-auto">
        {/* Honeypot */}
        <div className="absolute -left-[9999px] opacity-0 h-0 overflow-hidden" aria-hidden="true">
          <label htmlFor="f1-website">Website</label>
          <input
            id="f1-website"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="f1-name" className="block text-sm font-medium text-[#1B2A4A] mb-1.5">
            Your name
          </label>
          <input
            id="f1-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="e.g. Thabo Dlamini"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full h-12 px-4 rounded-xl border border-gray-300 bg-white text-base focus:outline-none focus:border-[#E87A1E] focus:ring-2 focus:ring-[#E87A1E]/20"
          />
        </div>

        <div>
          <label htmlFor="f1-phone" className="block text-sm font-medium text-[#1B2A4A] mb-1.5">
            WhatsApp number
          </label>
          <input
            id="f1-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="e.g. 065 895 6080"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="w-full h-12 px-4 rounded-xl border border-gray-300 bg-white text-base focus:outline-none focus:border-[#E87A1E] focus:ring-2 focus:ring-[#E87A1E]/20"
          />
        </div>

        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={!isValid || status === 'submitting'}
          className="w-full h-12 rounded-full bg-[#16A34A] text-white font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {status === 'submitting' ? 'Sending…' : submitLabel}
        </button>

        <p className="text-center text-xs text-gray-500">
          Free WhatsApp form · No spam · Hours {CONTACT.SUPPORT_HOURS}
        </p>
      </form>
    </div>
  );
}
