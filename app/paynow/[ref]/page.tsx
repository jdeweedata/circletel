/**
 * Pay Now Redirect Page
 *
 * Short URL handler for Pay Now payment links.
 * Looks up paynow_transaction_ref in customer_invoices and redirects to full payment URL.
 *
 * URL: circletel.co.za/paynow/CT-{invoiceId}-{timestamp}
 *
 * This allows SMS messages to use short URLs instead of full NetCash URLs.
 */

import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

interface PageProps {
  params: Promise<{ ref: string }>;
}

export default async function PayNowRedirectPage({ params }: PageProps) {
  const { ref } = await params;

  if (!ref) {
    notFound();
  }

  const supabase = await createClient();

  // Look up invoice by transaction reference
  const { data: invoice, error } = await supabase
    .from('customer_invoices')
    .select('paynow_url, status')
    .eq('paynow_transaction_ref', ref)
    .single();

  if (error || !invoice) {
    // Transaction ref not found
    notFound();
  }

  if (!invoice.paynow_url) {
    // No payment URL stored
    notFound();
  }

  // Check if already paid
  if (invoice.status === 'paid') {
    redirect('/dashboard/billing?already_paid=true');
  }

  // Redirect to full NetCash payment URL
  redirect(invoice.paynow_url);
}

// Generate metadata for the page (shown briefly before redirect)
export async function generateMetadata({ params }: PageProps) {
  const { ref } = await params;
  return {
    title: 'Redirecting to Payment - CircleTel',
    description: `Payment reference: ${ref}`,
    robots: 'noindex, nofollow',
  };
}
