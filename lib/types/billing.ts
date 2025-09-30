// Core billing entities for CircleTel admin
export interface Customer {
  id: string;
  name: string;
  email: string;
  company?: string;
  address?: Address;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'inactive' | 'suspended';
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Subscription {
  id: string;
  customerId: string;
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'paused';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
  trialEnd?: Date;
  canceledAt?: Date;
}

export interface Plan {
  id: string;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  interval: 'month' | 'year' | 'week' | 'day';
  intervalCount: number;
  trialPeriodDays?: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  customerId: string;
  subscriptionId?: string;
  number: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  dueDate: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  items: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitAmount: number;
  amount: number;
}

export interface Payment {
  id: string;
  customerId: string;
  invoiceId?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  paymentMethod: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  date: Date;
  type: 'Debit' | 'Credit' | 'Discount' | 'Refund';
  detail: string;
  amount: number;
  tags: string[];
}

export interface CallDetailRecord {
  id: string;
  callDate: Date;
  originatingNumber: string;
  receivingNumber: string;
  duration: number; // in seconds
  charge: number;
  direction: 'Inbound' | 'Outbound';
  voiceProduct: string;
  carrier: string;
  usageModifier: string;
  rateSchedule: string;
  invoiceNumber: string;
}

export interface CustomerDetails {
  accountType: string;
  firstName: string;
  lastName: string;
  email: string;
  mobilePhone: string;
  homePhone?: string;
  physicalAddress: Address;
  mailingAddress: Address;
}

export interface BillingOverviewData {
  currentInvoicePeriod: string;
  dueDate: string;
  balanceDue: number;
  unpaid: boolean;
  nextRecurringCharge: number;
  nextChargeDate: string;
  currentBalance: number;
  availableFunds: number;
}

export interface Revenue {
  period: string;
  amount: number;
  currency: string;
  subscriptionRevenue: number;
  oneTimeRevenue: number;
  refunds: number;
  netRevenue: number;
}

export interface Analytics {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  customerCount: number;
  activeSubscriptions: number;
  churnRate: number;
  averageRevenuePerUser: number;
  lifetimeValue: number;
}