import { Metadata } from 'next';
import {
  ContentPageLayout,
  ContentSidebar,
  ContentBody,
  ContentSection,
  SidebarIntro,
  SidebarNav,
  SidebarKeyPoints,
  SidebarContact,
} from '@/components/content';
import {
  generateWebPageSchema,
  generateBreadcrumbSchema,
} from '@/lib/content/schema';
import { privacyPolicyData } from './content-data';

const { meta, intro, keyPoints, sections } = privacyPolicyData;

export const metadata: Metadata = {
  title: meta.pageTitle,
  description: meta.description,
  openGraph: {
    title: meta.pageTitle,
    description: meta.description,
    url: `https://www.circletel.co.za${meta.canonicalPath}`,
    type: 'website',
    siteName: 'CircleTel',
  },
  alternates: {
    canonical: `https://www.circletel.co.za${meta.canonicalPath}`,
  },
};

export default function PrivacyPolicyPage() {
  return (
    <>
      {/* JSON-LD Structured Data - Safe: generated from static content data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateWebPageSchema(meta)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateBreadcrumbSchema(meta)),
        }}
      />

      <ContentPageLayout title={meta.title} lastUpdated={meta.lastUpdated}>
        {/* Left Sidebar */}
        <ContentSidebar>
          <SidebarIntro description={intro.description} />
          <SidebarNav sections={sections} />
          {keyPoints && <SidebarKeyPoints points={keyPoints} />}
          <SidebarContact />
        </ContentSidebar>

        {/* Right Content */}
        <ContentBody>
          {sections.map((section) => (
            <ContentSection
              key={section.id}
              id={section.id}
              title={section.title}
              icon={section.icon}
            >
              {section.content}
            </ContentSection>
          ))}
        </ContentBody>
      </ContentPageLayout>
    </>
  );
}
