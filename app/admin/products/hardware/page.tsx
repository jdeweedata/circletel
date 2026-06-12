import { redirect } from 'next/navigation';

export default function HardwareProductsPage() {
  redirect('/admin/products?source=hardware');
}
