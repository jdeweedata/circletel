import {
  computeMonthlyInvoiceAmounts,
  resolveServicePriceVatBasis,
  type ServicePriceVatBasis,
} from '@/lib/billing/invoice-vat-contract';

export interface PlatformAmounts {
  exVat: number;
  inclVat: number;
  basis: ServicePriceVatBasis;
}

/**
 * Convert customer_services.monthly_price into excl/incl VAT using the
 * same basis as invoice generation (consumer inclusive vs Unjani exclusive).
 */
export function normalizePlatformAmounts(
  monthlyPrice: number,
  service: {
    package_name?: string | null;
    package?: { name?: string | null } | null;
    service_type?: string | null;
    product_category?: string | null;
  }
): PlatformAmounts {
  const basis = resolveServicePriceVatBasis(service);
  const amounts = computeMonthlyInvoiceAmounts(monthlyPrice, basis);
  return {
    exVat: amounts.subtotal,
    inclVat: amounts.totalAmount,
    basis,
  };
}
