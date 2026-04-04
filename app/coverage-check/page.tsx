import { redirect } from 'next/navigation';

/**
 * Coverage Check Redirect
 * Handles marketing URLs like /coverage-check?plan=plus
 * Maps short plan aliases to full plan IDs, then redirects to /packages?plan=<id>
 * Falls back to homepage (coverage checker) if no plan matched.
 */

const PLAN_ALIASES: Record<string, string> = {
  plus: 'skyfibre-home-plus',
  max: 'skyfibre-home-max',
  ultra: 'skyfibre-home-ultra',
  pro: 'skyfibre-home-pro-100',
};

interface CoverageCheckPageProps {
  searchParams: Promise<{ plan?: string }>;
}

export default async function CoverageCheckPage({ searchParams }: CoverageCheckPageProps) {
  const { plan } = await searchParams;
  const planId = plan ? PLAN_ALIASES[plan.toLowerCase()] ?? plan : null;

  if (planId) {
    redirect(`/packages?plan=${planId}`);
  }

  redirect('/');
}
