'use client';

import { WhatsAppF1StartForm } from '@/components/leads/WhatsAppF1StartForm';

interface WhatsAppQuoteBlockProps {
  eyebrow?: string;
  headline?: string;
  description?: string;
  /** Optional interest note appended to campaign attribution */
  bundleOptions?: string[];
  /** @deprecated Ignored — F1 cold template uses Cloud API, not wa.me */
  phoneNumber?: string;
  sourceCampaign?: string;
}

/**
 * Marketing quote block — sends cold F1 WhatsApp Flow template (MARKETING).
 * Replaces previous wa.me open which only prefilled chat without a form.
 */
export function WhatsAppQuoteBlock({
  eyebrow = 'Get a Quote in 2 Minutes',
  headline = 'Tell us what your business needs',
  description = "We'll send a short form on WhatsApp — complete it and we'll follow up within 1 business hour.",
  sourceCampaign = 'whatsapp-quote-block',
}: WhatsAppQuoteBlockProps) {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-[640px] mx-auto px-6">
        <WhatsAppF1StartForm
          entrySource="website"
          sourceCampaign={sourceCampaign}
          eyebrow={eyebrow}
          headline={headline}
          description={description}
          submitLabel="Get My Quote via WhatsApp"
        />
      </div>
    </section>
  );
}
