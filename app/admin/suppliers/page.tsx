import { redirect } from 'next/navigation';

export default function SuppliersPage() {
  redirect('/admin/products?section=suppliers');
}
