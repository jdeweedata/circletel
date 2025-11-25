/**
 * Legacy Sanity CMS Page
 * TODO: Migrate to new AI-powered CMS system
 */

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function CMSPage({ params }: Props) {
  const { slug } = await params;

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-4">Page: {slug}</h1>
      <p className="text-gray-600">
        This page is being migrated to the new AI-powered CMS system.
        Please use <a href="/admin/cms" className="text-circleTel-orange underline">/admin/cms</a> for content management.
      </p>
    </div>
  );
}
