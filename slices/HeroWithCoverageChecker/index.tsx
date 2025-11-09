/**
 * HeroWithCoverageChecker Slice
 *
 * CRITICAL: This is a THIN WRAPPER around the existing HeroWithTabs component.
 * ALL FUNCTIONALITY remains in HeroWithTabs.tsx - this only passes Prismic content as props.
 *
 * Coverage Check Guarantee:
 * - Google Maps Autocomplete: UNCHANGED (uses NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)
 * - Coverage API calls: UNCHANGED (/api/coverage/lead)
 * - OrderContext state: UNCHANGED
 * - Navigation flow: UNCHANGED
 * - Interactive features: UNCHANGED
 *
 * What Prismic Controls (CMS-Editable):
 * - Hero heading text
 * - Hero subheading text
 * - Background image URL
 * - CTA button text
 * - Show/hide residential tab
 * - Show/hide business tab
 */

import { Content } from '@prismicio/client';
import { SliceComponentProps } from '@prismicio/react';
import HeroWithTabs from '@/components/home/HeroWithTabs';

export type HeroWithCoverageCheckerSlice =
  SliceComponentProps<Content.HeroWithCoverageCheckerSlice>;

/**
 * Prismic Slice Component
 *
 * This component receives content from Prismic and passes it to the existing
 * HeroWithTabs component. No business logic is duplicated here.
 */
const HeroWithCoverageChecker = ({ slice }: HeroWithCoverageCheckerSlice): JSX.Element => {
  return (
    <HeroWithTabs
      // Content from Prismic (editable by marketing team)
      heading={slice.primary.heading || 'Connectivity that fits your budget'}
      subheading={slice.primary.subheading || 'Check coverage at your address'}
      backgroundImage={slice.primary.background_image?.url}
      ctaText={slice.primary.cta_text || 'Check Coverage'}
      showResidentialTab={slice.primary.show_residential_tab ?? true}
      showBusinessTab={slice.primary.show_business_tab ?? true}

      // ALL FUNCTIONALITY stays in HeroWithTabs component:
      // - Google Maps Autocomplete integration
      // - Address selection and validation
      // - Coverage API call to /api/coverage/lead
      // - Lead creation and storage
      // - OrderContext state management
      // - Navigation to /packages/[leadId]
      // - Interactive coverage map modal
      // - Residential/Business tab switching
      // - Form validation and error handling
      // - Loading states
    />
  );
};

export default HeroWithCoverageChecker;
