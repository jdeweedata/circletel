import { UnifiedProductDetailPage } from '@/components/admin/products/unified/UnifiedProductDetailPage';

export const metadata = {
  title: 'Product detail | CircleTel Admin',
};

export default async function UnifiedProductItemPage({
  params,
}: {
  params: Promise<{ sourceTable: string; id: string }>;
}) {
  const { sourceTable, id } = await params;
  return <UnifiedProductDetailPage sourceTable={sourceTable} id={id} />;
}
