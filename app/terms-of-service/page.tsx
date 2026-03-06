import { Metadata } from 'next';
import {
  ContentPageLayout,
  ContentSidebar,
  ContentBody,
  SidebarIntro,
  SidebarNav,
  SidebarKeyPoints,
  SidebarContact,
} from '@/components/content';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  generateWebPageSchema,
  generateBreadcrumbSchema,
} from '@/lib/content/schema';
import { termsOfServiceData } from './content-data';

const { meta, intro, keyPoints, sections } = termsOfServiceData;

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

export default function TermsOfServicePage() {
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
          <Accordion type="single" collapsible className="space-y-0">
            {sections.map((section, index) => {
              const sectionNumber = String(index + 1).padStart(2, '0');
              const Icon = section.icon;

              return (
                <AccordionItem
                  key={section.id}
                  value={section.id}
                  id={section.id}
                  className="scroll-mt-24 border-b border-gray-100 last:border-b-0"
                >
                  <AccordionTrigger className="text-left text-circleTel-navy hover:no-underline py-5 gap-4 [&[data-state=open]]:text-circleTel-orange">
                    <div className="flex items-start gap-4 flex-1">
                      <span className="text-gray-400 text-sm font-mono flex-shrink-0 mt-0.5">
                        {sectionNumber}.
                      </span>
                      {Icon && <Icon className="w-5 h-5 text-circleTel-orange flex-shrink-0 mt-0.5" />}
                      <span className="font-medium text-[15px] leading-relaxed">
                        {section.title}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="prose prose-gray max-w-none pl-16 pr-4 pb-6 text-gray-600 leading-relaxed prose-headings:text-circleTel-navy prose-headings:font-semibold prose-h3:text-base prose-h3:mt-6 prose-h3:mb-3 prose-h4:text-sm prose-h4:mt-4 prose-h4:mb-2 prose-p:my-3 prose-ul:my-3 prose-ul:pl-5 prose-ol:my-3 prose-ol:pl-5 prose-li:my-1 prose-dl:my-3">
                    {section.content}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </ContentBody>
      </ContentPageLayout>
    </>
  );
}
