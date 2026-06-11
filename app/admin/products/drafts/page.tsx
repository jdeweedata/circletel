import { redirect } from 'next/navigation';

export default function DraftProductsPage() {
  redirect('/admin/products?status=draft');
}
