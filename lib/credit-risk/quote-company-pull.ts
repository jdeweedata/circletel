import type { CreditPullResult } from './netcash-risk-client';
import { requestCompanyCreditReport } from './netcash-risk-client';
import {
  adminFieldsToKeepOnPull,
  getQuoteCreditReview,
  upsertQuoteCreditReview,
} from './review-store';
import type { CreditReviewInput, QuoteCreditReview } from './types';

type SupabaseLike = {
  from: (table: string) => any;
};

export function quoteReviewInputFromCompanyPull(input: {
  businessQuoteId: string;
  pull: Pick<CreditPullResult, 'fileToken' | 'pdfStoragePath' | 'flags' | 'decision'>;
  existing?: QuoteCreditReview | null;
  purpose?: string;
}): CreditReviewInput {
  return {
    business_quote_id: input.businessQuoteId,
    flags: input.pull.flags,
    decision: input.pull.decision,
    bureau: 'CIPC',
    transaction_id: input.pull.fileToken,
    pdf_storage_path: input.pull.pdfStoragePath,
    purpose: input.purpose ?? 'CD32',
    requested_at: new Date().toISOString(),
    ...adminFieldsToKeepOnPull(input.existing),
  };
}

export async function persistCompanyCreditPullOnQuote(
  supabase: SupabaseLike,
  businessQuoteId: string,
  pull: Pick<CreditPullResult, 'fileToken' | 'pdfStoragePath' | 'flags' | 'decision'>,
  purpose?: string
): Promise<QuoteCreditReview> {
  const existing = await getQuoteCreditReview(supabase, businessQuoteId);
  return upsertQuoteCreditReview(
    supabase,
    quoteReviewInputFromCompanyPull({
      businessQuoteId,
      pull,
      existing,
      purpose,
    })
  );
}

export async function runSignedQuoteCompanyPull(input: {
  supabase: SupabaseLike;
  quoteId: string;
  registrationNumber: string;
  accountReference: string;
  purpose?: string;
  requestCompany?: typeof requestCompanyCreditReport;
}): Promise<QuoteCreditReview> {
  const request = input.requestCompany ?? requestCompanyCreditReport;
  const pull = await request({
    registrationNumber: input.registrationNumber,
    accountReference: input.accountReference,
    instruction: 'CD32',
  });
  return persistCompanyCreditPullOnQuote(
    input.supabase,
    input.quoteId,
    pull,
    input.purpose
  );
}
