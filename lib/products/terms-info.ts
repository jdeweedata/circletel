export const TERMS_AND_CONDITIONS_LABEL = 'T&Cs apply';
export const TERMS_AND_CONDITIONS_URL = '/terms-of-service';

export interface TermsInfoItem {
  text: string;
  href?: string;
  tooltipTitle?: string;
  tooltipDescription?: string;
}

const TERMS_TEXT_PATTERN = /t&cs?\s+apply|terms and conditions apply/i;

function normalizeItem(item: string | TermsInfoItem): TermsInfoItem {
  if (typeof item === 'string') {
    return { text: item };
  }
  return {
    text: item.text,
    ...(item.href ? { href: item.href } : {}),
    ...(item.tooltipTitle ? { tooltipTitle: item.tooltipTitle } : {}),
    ...(item.tooltipDescription ? { tooltipDescription: item.tooltipDescription } : {}),
  };
}

/**
 * Ensure "What else you should know" always includes a T&Cs apply item
 * that links to the public terms page.
 */
export function appendTermsAndConditions(
  items: Array<string | TermsInfoItem> = []
): TermsInfoItem[] {
  const normalized = items.map(normalizeItem);
  const hasTerms = normalized.some((item) => TERMS_TEXT_PATTERN.test(item.text));
  if (hasTerms) {
    return normalized;
  }
  return [
    ...normalized,
    { text: TERMS_AND_CONDITIONS_LABEL, href: TERMS_AND_CONDITIONS_URL },
  ];
}
