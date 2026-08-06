// __tests__/lib/billing/modernist/customer-register.test.ts
import { describe, it, expect } from '@jest/globals';
import {
  filterCustomers,
  sortCustomers,
  summarizeCustomers,
  type RegisterCustomer,
} from '@/lib/billing/modernist/customer-register';

const sample: RegisterCustomer[] = [
  { id: '1', name: 'A', email: 'a@x.com', phone: null, company: 'Co', account_number: 'CT-1', status: 'active', created_at: '2026-08-02', outstanding_amount: 100, active_services: 1 },
  { id: '2', name: 'B', email: 'b@x.com', phone: null, company: null, account_number: 'CT-2', status: 'inactive', created_at: '2026-07-01', outstanding_amount: 0, active_services: 0 },
];

describe('filterCustomers', () => {
  it('filters owing', () => {
    expect(filterCustomers(sample, 'owing', '').map((c) => c.id)).toEqual(['1']);
  });
  it('searches code', () => {
    expect(filterCustomers(sample, 'all', 'ct-2').map((c) => c.id)).toEqual(['2']);
  });
});

describe('sortCustomers', () => {
  it('sorts owing desc', () => {
    expect(sortCustomers(sample, 'due').map((c) => c.id)).toEqual(['1', '2']);
  });
});

describe('summarizeCustomers', () => {
  it('counts owing and services', () => {
    const s = summarizeCustomers(sample);
    expect(s.owingCount).toBe(1);
    expect(s.activeServices).toBe(1);
    expect(s.largestBalance).toBe(100);
  });
});
