import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CampaignShowcase } from '@/components/publishing/CampaignShowcase';
import { getPublicCampaignBySlug, listPublicCampaigns } from '@/lib/publishing/public-read';

export const revalidate = 300;

export async function generateStaticParams() {
  const pages = await listPublicCampaigns('promotion');
  return pages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublicCampaignBySlug(slug, 'promotion');
  if (!page) return {};

  return {
    title: page.seo.title ?? page.title,
    description: page.seo.description ?? page.summary,
  };
}

export default async function PromotionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPublicCampaignBySlug(slug, 'promotion');
  if (!page) notFound();

  return <CampaignShowcase page={page} />;
}
