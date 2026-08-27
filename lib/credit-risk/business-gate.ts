import type { CreditDecision } from './types';

export type BusinessQuoteKind = 'credit' | 'skip';
export type CompanyPullInstruction = 'CD32' | 'CD31' | 'CD23';
export const MINI_COMPANY_INSTRUCTION = 'CD35';

export function quoteIncludesCpe(
  items?: Array<{
    product_category?: string | null;
    service_type?: string | null;
    service_name?: string | null;
  }> | null
): boolean {
  return (items || []).some((item) => {
    const haystack = [item.product_category, item.service_type, item.service_name]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return /hardware|cpe|router|outdoor|onu|ont|equipment/.test(haystack);
  });
}

export function resolveBusinessQuoteKind(input: {
  onAccount?: boolean;
  includesCpe?: boolean;
  prepaidSimOnly?: boolean;
  contractTerm?: number | null;
}): BusinessQuoteKind {
  if (input.prepaidSimOnly && !input.onAccount && !input.includesCpe) return 'skip';
  if (input.onAccount || input.includesCpe) return 'credit';
  if ((input.contractTerm ?? 0) >= 12) return 'credit';
  return 'skip';
}

export function shouldPullCompanyCredit(input: {
  signedAt?: string | null;
  termsAccepted?: boolean;
  registrationNumber?: string | null;
}): boolean {
  return Boolean(input.signedAt && input.termsAccepted && String(input.registrationNumber || '').trim());
}

export function shouldPullDirectorCompanyCredit(input: {
  quoteKind: BusinessQuoteKind;
  directorDocsReady?: boolean;
}): boolean {
  return input.quoteKind === 'credit' && Boolean(input.directorDocsReady);
}

export function shouldPullDirectorConsumerCredit(input: {
  quoteKind: BusinessQuoteKind;
  directorDocsReady?: boolean;
  directorIsPayer?: boolean;
}): boolean {
  return shouldPullDirectorCompanyCredit(input) && Boolean(input.directorIsPayer);
}

export function shouldPullMiniCompany(): boolean {
  return false;
}

export function resolveCompanyCreditPulls(input: {
  signedAt?: string | null;
  termsAccepted?: boolean;
  registrationNumber?: string | null;
  quoteKind: BusinessQuoteKind;
  directorDocsReady?: boolean;
  directorIsPayer?: boolean;
}): CompanyPullInstruction[] {
  const pulls: CompanyPullInstruction[] = [];
  if (shouldPullCompanyCredit(input)) pulls.push('CD32');
  if (shouldPullDirectorCompanyCredit(input)) pulls.push('CD31');
  if (shouldPullDirectorConsumerCredit(input)) pulls.push('CD23');
  return pulls;
}

export function formalContractBlockedReason(input: {
  quoteKind: BusinessQuoteKind;
  review?: { decision?: CreditDecision | null } | null;
}): string | null {
  if (input.quoteKind === 'skip') return null;
  const decision = input.review?.decision;
  if (!decision) {
    return 'Credit quote cannot become a contract until a credit review exists.';
  }
  if (decision === 'UNCHECKED') {
    return 'Credit quote cannot become a contract until the company result is on the quote.';
  }
  if (decision === 'PASS' || decision === 'MARGINAL') return null;
  return `Credit quote cannot become a contract while decision is ${decision}.`;
}
