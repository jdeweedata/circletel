import { redirect } from 'next/navigation';

export default function MTNDealerProductsPage() {
  redirect('/admin/products?source=mtn');
}
