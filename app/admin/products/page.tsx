import { Suspense } from 'react';
import { ProductWorkspace } from '@/components/admin/products/workspace/ProductWorkspace';

export const metadata = {
  title: 'Product Workspace | CircleTel Admin',
};

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductWorkspace />
    </Suspense>
  );
}
