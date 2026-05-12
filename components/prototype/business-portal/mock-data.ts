export interface BusinessService {
  id: string;
  name: string;
  type: 'fibre' | 'wireless' | 'voip' | 'iot';
  status: 'active' | 'provisioning' | 'degraded' | 'down';
  speed: string;
  monthlyPrice: number;
  site: string;
  uptime30d: number;
  lastIncident: string | null;
}

export interface BusinessInvoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  amount: number;
  amountDue: number;
  status: 'paid' | 'pending' | 'overdue';
}

export interface SupportTicket {
  id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt: string;
  assignee: string;
}

export interface BusinessContract {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  value: number;
  status: 'active' | 'expiring_soon' | 'expired';
  slaUptime: number;
}

export interface ActivityEvent {
  id: string;
  type: 'invoice' | 'ticket' | 'service' | 'contract' | 'payment';
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, string>;
}

export interface BusinessPortalData {
  company: {
    name: string;
    accountNumber: string;
    accountManager: string;
    accountManagerEmail: string;
    tier: 'standard' | 'premium' | 'enterprise';
    slaUptime: number;
  };
  stats: {
    activeSites: number;
    totalServices: number;
    monthlySpend: number;
    avgUptime: number;
    openTickets: number;
    unresolvedCritical: number;
  };
  services: BusinessService[];
  invoices: BusinessInvoice[];
  tickets: SupportTicket[];
  contracts: BusinessContract[];
  activity: ActivityEvent[];
}

export const MOCK_DATA: BusinessPortalData = {
  company: {
    name: 'Ndaba & Associates Legal',
    accountNumber: 'CT-BIZ-2024-0847',
    accountManager: 'Themba Nkosi',
    accountManagerEmail: 'themba@circletel.co.za',
    tier: 'premium',
    slaUptime: 99.95,
  },
  stats: {
    activeSites: 4,
    totalServices: 12,
    monthlySpend: 28450,
    avgUptime: 99.97,
    openTickets: 3,
    unresolvedCritical: 0,
  },
  services: [
    {
      id: 's1',
      name: 'Business Fibre 200/200',
      type: 'fibre',
      status: 'active',
      speed: '200/200 Mbps',
      monthlyPrice: 4999,
      site: 'Sandton HQ',
      uptime30d: 99.99,
      lastIncident: null,
    },
    {
      id: 's2',
      name: 'Business Fibre 100/100',
      type: 'fibre',
      status: 'active',
      speed: '100/100 Mbps',
      monthlyPrice: 3499,
      site: 'Pretoria Branch',
      uptime30d: 99.95,
      lastIncident: '2026-05-02',
    },
    {
      id: 's3',
      name: 'Business LTE Backup',
      type: 'wireless',
      status: 'active',
      speed: '50/20 Mbps',
      monthlyPrice: 1599,
      site: 'Sandton HQ',
      uptime30d: 100,
      lastIncident: null,
    },
    {
      id: 's4',
      name: 'Business Fibre 50/50',
      type: 'fibre',
      status: 'degraded',
      speed: '50/50 Mbps',
      monthlyPrice: 2499,
      site: 'Durban Branch',
      uptime30d: 98.2,
      lastIncident: '2026-05-10',
    },
    {
      id: 's5',
      name: 'VoIP PBX - 20 Extensions',
      type: 'voip',
      status: 'active',
      speed: 'N/A',
      monthlyPrice: 3999,
      site: 'Sandton HQ',
      uptime30d: 99.99,
      lastIncident: null,
    },
    {
      id: 's6',
      name: 'Business LTE Primary',
      type: 'wireless',
      status: 'provisioning',
      speed: '100/30 Mbps',
      monthlyPrice: 2499,
      site: 'Cape Town (New)',
      uptime30d: 0,
      lastIncident: null,
    },
  ],
  invoices: [
    { id: 'inv1', number: 'INV-2026-0523', date: '2026-05-01', dueDate: '2026-05-15', amount: 28450, amountDue: 28450, status: 'pending' },
    { id: 'inv2', number: 'INV-2026-0498', date: '2026-04-01', dueDate: '2026-04-15', amount: 25950, amountDue: 0, status: 'paid' },
    { id: 'inv3', number: 'INV-2026-0471', date: '2026-03-01', dueDate: '2026-03-15', amount: 25950, amountDue: 0, status: 'paid' },
    { id: 'inv4', number: 'INV-2026-0445', date: '2026-02-01', dueDate: '2026-02-15', amount: 22450, amountDue: 0, status: 'paid' },
  ],
  tickets: [
    { id: 't1', subject: 'Durban branch speed degradation', status: 'in_progress', priority: 'high', createdAt: '2026-05-10T09:30:00Z', updatedAt: '2026-05-11T08:15:00Z', assignee: 'Network Ops' },
    { id: 't2', subject: 'VoIP call quality on ext 14-18', status: 'open', priority: 'medium', createdAt: '2026-05-09T14:00:00Z', updatedAt: '2026-05-09T14:00:00Z', assignee: 'Unassigned' },
    { id: 't3', subject: 'Cape Town site provisioning ETA', status: 'open', priority: 'low', createdAt: '2026-05-08T11:00:00Z', updatedAt: '2026-05-10T16:30:00Z', assignee: 'Provisioning' },
  ],
  contracts: [
    { id: 'c1', name: 'Enterprise Connectivity SLA', startDate: '2024-06-01', endDate: '2027-05-31', value: 682800, status: 'active', slaUptime: 99.95 },
    { id: 'c2', name: 'VoIP Service Agreement', startDate: '2025-01-01', endDate: '2026-12-31', value: 95976, status: 'expiring_soon', slaUptime: 99.9 },
  ],
  activity: [
    { id: 'a1', type: 'service', title: 'Service degraded', description: 'Durban Branch fibre experiencing reduced throughput', timestamp: '2026-05-10T09:30:00Z', metadata: { site: 'Durban Branch', service: 'Business Fibre 50/50' } },
    { id: 'a2', type: 'ticket', title: 'Ticket opened', description: 'Durban branch speed degradation reported', timestamp: '2026-05-10T09:30:00Z', metadata: { ticketId: 't1', priority: 'high' } },
    { id: 'a3', type: 'invoice', title: 'Invoice generated', description: 'INV-2026-0523 for R28,450.00', timestamp: '2026-05-01T06:00:00Z', metadata: { amount: '28450' } },
    { id: 'a4', type: 'payment', title: 'Payment received', description: 'R25,950.00 via EFT for INV-2026-0498', timestamp: '2026-04-14T10:22:00Z', metadata: { method: 'EFT' } },
    { id: 'a5', type: 'contract', title: 'Contract expiring soon', description: 'VoIP Service Agreement expires 31 Dec 2026', timestamp: '2026-05-01T00:00:00Z', metadata: { contractId: 'c2' } },
    { id: 'a6', type: 'service', title: 'New service ordered', description: 'Business LTE Primary for Cape Town site', timestamp: '2026-04-28T11:00:00Z', metadata: { site: 'Cape Town (New)', status: 'provisioning' } },
    { id: 'a7', type: 'ticket', title: 'Ticket resolved', description: 'Pretoria branch brief outage resolved', timestamp: '2026-04-25T16:45:00Z', metadata: { ticketId: 't0', priority: 'high' } },
    { id: 'a8', type: 'payment', title: 'Payment received', description: 'R25,950.00 via EFT for INV-2026-0471', timestamp: '2026-03-13T09:15:00Z', metadata: { method: 'EFT' } },
  ],
};

export function formatZAR(cents: number): string {
  return `R${(cents).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}
