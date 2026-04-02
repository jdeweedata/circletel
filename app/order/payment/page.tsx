import { redirect } from 'next/navigation';

export default function OrderPaymentPage() {
  redirect('/order/checkout');
}
