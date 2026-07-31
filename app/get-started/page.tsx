import type { Metadata } from 'next';
import Link from 'next/link';
import { WhatsAppF1StartForm } from '@/components/leads/WhatsAppF1StartForm';
import { CONTACT } from '@/lib/constants/contact';

export const metadata: Metadata = {
  title: 'Get started on WhatsApp | CircleTel',
  description:
    'Share a few details on WhatsApp so CircleTel can check coverage and recommend the right package.',
  robots: { index: true, follow: true },
};

type SearchParams = Promise<{ src?: string; campaign?: string; c?: string }>;

function mapEntrySource(
  src: string | undefined
): 'website' | 'qr' | 'manual' | 'ctwa_ad' {
  const s = (src || '').toLowerCase();
  if (s === 'qr') return 'qr';
  if (s === 'ctwa' || s === 'ctwa_ad' || s === 'ad') return 'ctwa_ad';
  if (s === 'manual') return 'manual';
  return 'website';
}

export default async function GetStartedPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const entrySource = mapEntrySource(params.src);
  const campaign =
    params.campaign || params.c || `get-started-${entrySource}`;

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#1B2A4A] to-[#0f1a2e]">
      <div className="max-w-lg mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <span className="text-white font-extrabold text-xl tracking-tight">
              Circle<span className="text-[#E87A1E]">Tel</span>
            </span>
          </Link>
          <p className="text-white/70 text-sm">
            Fibre · Fixed wireless · Business connectivity
          </p>
        </div>

        <WhatsAppF1StartForm
          entrySource={entrySource}
          sourceCampaign={campaign}
          eyebrow={entrySource === 'qr' ? 'Scan · WhatsApp form' : 'WhatsApp · 1 minute'}
          headline="Start your CircleTel enquiry"
          description="Enter your name and WhatsApp number. We'll send a short form — no app download needed."
        />

        <p className="text-center text-white/50 text-xs mt-8">
          Prefer email?{' '}
          <a
            href={`mailto:${CONTACT.EMAIL_PRIMARY}`}
            className="text-[#E87A1E] hover:underline"
          >
            {CONTACT.EMAIL_PRIMARY}
          </a>
        </p>
      </div>
    </main>
  );
}
