import { redirect } from 'next/navigation';

export default function ArchivedProductsPage() {
  redirect('/admin/products?status=archived');
}
