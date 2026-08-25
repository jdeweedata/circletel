// lib/billing/modernist/customer-register.ts
export type CustomerFilter = 'all' | 'owing' | 'clear' | 'noservice' | 'nonactive';
export type CustomerSort = 'due' | 'new' | 'name';

export interface RegisterCustomer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  account_number: string | null;
  status: string;
  created_at: string;
  outstanding_amount: number;
  active_services: number;
}

export function filterCustomers(
  rows: RegisterCustomer[],
  filter: CustomerFilter,
  q: string
): RegisterCustomer[] {
  const query = q.trim().toLowerCase();
  return rows.filter((c) => {
    if (filter === 'owing' && !(c.outstanding_amount > 0)) return false;
    if (filter === 'clear' && c.outstanding_amount !== 0) return false;
    if (filter === 'noservice' && c.active_services !== 0) return false;
    if (filter === 'nonactive' && c.status === 'active') return false;
    if (!query) return true;
    const hay = [c.name, c.company ?? '', c.account_number ?? '', c.email]
      .join(' ')
      .toLowerCase();
    return hay.includes(query);
  });
}

export function sortCustomers(
  rows: RegisterCustomer[],
  sort: CustomerSort
): RegisterCustomer[] {
  const copy = rows.slice();
  if (sort === 'due') copy.sort((a, b) => b.outstanding_amount - a.outstanding_amount);
  if (sort === 'name') copy.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === 'new')
    copy.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  return copy;
}

export function summarizeCustomers(rows: RegisterCustomer[]) {
  return {
    owingCount: rows.filter((c) => c.outstanding_amount > 0).length,
    clearCount: rows.filter((c) => c.outstanding_amount === 0).length,
    noServiceCount: rows.filter((c) => c.active_services === 0).length,
    nonActiveCount: rows.filter((c) => c.status !== 'active').length,
    activeServices: rows.reduce((s, c) => s + c.active_services, 0),
    largestBalance: rows.reduce((m, c) => Math.max(m, c.outstanding_amount), 0),
    totalOutstanding: rows.reduce((s, c) => s + c.outstanding_amount, 0),
  };
}
