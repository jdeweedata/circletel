'use client';

import { useState } from 'react';
import { CONTACT } from '@/lib/constants/contact';

interface WhatsAppQuoteBlockProps {
  eyebrow?: string;
  headline?: string;
  description?: string;
  bundleOptions?: string[];
  phoneNumber?: string;
}

interface FormState {
  name: string;
  phone: string;
  bundle: string;
}

type SubmitStatus = 'idle' | 'submitting' | 'success';

export function WhatsAppQuoteBlock({
  eyebrow = 'Get a Quote in 2 Minutes',
  headline = 'Tell us what your business needs',
  description = "We'll reply on WhatsApp within 1 business hour.",
  bundleOptions = [],
  phoneNumber,
}: WhatsAppQuoteBlockProps) {
  const [form, setForm] = useState<FormState>({ name: '', phone: '', bundle: '' });
  const [status, setStatus] = useState<SubmitStatus>('idle');

  // Derive number from Sanity override or from the canonical WHATSAPP_LINK constant
  const waNumber = phoneNumber ?? CONTACT.WHATSAPP_LINK.replace('https://wa.me/', '');

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    const message = encodeURIComponent(
      `Hi CircleTel! I'd like a quote.\n\nName: ${form.name}\nPhone: ${form.phone}\nPlan: ${
        form.bundle || 'Not sure yet — please help me choose'
      }`
    );
    window.open(`https://wa.me/${waNumber}?text=${message}`, '_blank');
    setStatus('success');
  }

  const isValid = form.name.trim().length > 1 && form.phone.trim().length >= 10;

  if (status === 'success') {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-[640px] mx-auto px-6 text-center">
          <div className="w-16 h-16 bg-[#16A34A]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <span
              className="material-symbols-outlined text-[#16A34A] text-4xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
          </div>
          <h3
            className="text-2xl font-extrabold text-[#1E293B] mb-3"
            style={{ letterSpacing: '-0.02em' }}
          >
            WhatsApp is opening now
          </h3>
          <p className="text-[#6B7280]">
            Your details are pre-filled. Send the message and our team will respond within 1
            business hour.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-white">
      <div className="max-w-[640px] mx-auto px-6">
        <div className="bg-[#F8F9FA] rounded-[2rem] p-8 md:p-12">
          <div className="text-center mb-8">
            <span className="inline-block px-4 py-1.5 rounded-full bg-orange-50 text-[#E87A1E] text-sm font-bold border border-orange-100 mb-4">
              {eyebrow}
            </span>
            <h2
              className="text-2xl md:text-3xl font-extrabold text-[#1E293B]"
              style={{ letterSpacing: '-0.02em' }}
            >
              {headline}
            </h2>
            <p className="text-[#6B7280] mt-2 text-sm">{description}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="wq-name"
                className="block text-sm font-medium text-[#1E293B] mb-1.5"
              >
                Your name
              </label>
              <input
                id="wq-name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="e.g. Thabo Dlamini"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full h-[52px] px-4 rounded-xl border border-[#D1D5DB] bg-white text-[#111827] placeholder-[#9CA3AF] text-base focus:outline-none focus:border-[#E87A1E] focus:ring-2 focus:ring-[#E87A1E]/20 transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="wq-phone"
                className="block text-sm font-medium text-[#1E293B] mb-1.5"
              >
                WhatsApp number
              </label>
              <input
                id="wq-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="e.g. 082 487 3900"
                value={form.phone}
                onChange={handleChange}
                required
                className="w-full h-[52px] px-4 rounded-xl border border-[#D1D5DB] bg-white text-[#111827] placeholder-[#9CA3AF] text-base focus:outline-none focus:border-[#E87A1E] focus:ring-2 focus:ring-[#E87A1E]/20 transition-colors"
              />
            </div>

            {bundleOptions.length > 0 && (
              <div>
                <label
                  htmlFor="wq-bundle"
                  className="block text-sm font-medium text-[#1E293B] mb-1.5"
                >
                  Which plan are you interested in?
                </label>
                <select
                  id="wq-bundle"
                  name="bundle"
                  value={form.bundle}
                  onChange={handleChange}
                  className="w-full h-[52px] px-4 rounded-xl border border-[#D1D5DB] bg-white text-[#111827] text-base focus:outline-none focus:border-[#E87A1E] focus:ring-2 focus:ring-[#E87A1E]/20 transition-colors appearance-none"
                >
                  <option value="">Not sure yet — help me choose</option>
                  {bundleOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={!isValid || status === 'submitting'}
              className="w-full h-[52px] mt-2 rounded-full bg-[#16A34A] text-white font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                chat
              </span>
              {status === 'submitting' ? 'Opening WhatsApp…' : 'Get My Quote via WhatsApp'}
            </button>

            <p className="text-center text-xs text-[#9CA3AF]">
              Opens WhatsApp with your details pre-filled. No spam.{' '}
              <a
                href={`mailto:${CONTACT.EMAIL_PRIMARY}`}
                className="text-[#E87A1E] hover:underline"
              >
                Prefer email?
              </a>
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
