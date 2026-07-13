export const OPERATIONS_PREVIEW_TIME_ZONE = 'Africa/Johannesburg' as const;

export type MoneyValue = string | number;

export interface ActiveServiceRow {
  customer_id: string;
  monthly_price: MoneyValue;
}

export interface IncidentRow {
  affected_customer_count: number | null;
}

export interface InvoiceRow {
  invoice_date: string;
  total_amount: MoneyValue;
  amount_paid: MoneyValue;
  amount_due: MoneyValue;
  status: string;
}

export interface OperationsPreviewData {
  generatedAt: string;
  source: 'production';
  timeZone: typeof OPERATIONS_PREVIEW_TIME_ZONE;
  kpis: {
    activeCustomers: number;
    activeMrrCents: number;
    openTickets: number;
    needsAttention: number;
    networkIncidents: number;
    servicesImpacted: number;
  };
  growth: Array<{
    month: string;
    label: string;
    totalCustomers: number;
    billedCents: number;
  }>;
  operations: {
    scheduledInstalls: number;
    ordersInProgress: number;
    priorityTickets: number;
    availableTechnicians: number;
  };
  finance: {
    periodStart: string;
    periodEnd: string;
    billedCents: number;
    collectedCents: number;
    outstandingCents: number;
    paidInvoices: number;
  };
}

export interface OperationsPreviewSuccess {
  success: true;
  data: OperationsPreviewData;
}

export interface OperationsPreviewFailure {
  success: false;
  error: string;
  code?: 'OPERATIONS_PREVIEW_DATA_UNAVAILABLE';
  requestId?: string;
}
