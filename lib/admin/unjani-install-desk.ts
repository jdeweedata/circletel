import { assertScheduleAllowed } from '@/lib/admin/unjani-warehouse';

export type FulfilmentDesk = 'ops' | 'scheduler' | 'onsite';

export function isKitBookedOut(stockStatus: string): boolean {
  return stockStatus === 'reserved';
}

export function fulfilmentDesk(order: {
  stock_status: string;
  field_job_id?: string | null;
  visit_date?: string | null;
  technician_id?: string | null;
}): FulfilmentDesk {
  if (order.visit_date) return 'onsite';
  if (order.field_job_id) return 'scheduler';
  return 'ops';
}

export function assertOpenJobAllowed(input: {
  stockStatus: string;
  technicianId: string;
  proposedDate: string;
  fulfilByMax: string;
}): true {
  if (!isKitBookedOut(input.stockStatus)) {
    throw new Error('Open a job card after the kit is booked out against the site');
  }
  if (!input.technicianId.trim()) {
    throw new Error('Assign a technician before opening the job card');
  }
  assertScheduleAllowed({
    stockStatus: input.stockStatus,
    visitDate: input.proposedDate,
    fulfilByMax: input.fulfilByMax,
  });
  return true;
}

export function assertConfirmSlotAllowed(input: {
  fieldJobId: string | null | undefined;
  technicianId: string | null | undefined;
  stockStatus: string;
  visitDate: string;
  fulfilByMax: string;
}): true {
  if (!input.fieldJobId) {
    throw new Error('Confirm the booking slot after the job card is open');
  }
  if (!input.technicianId) {
    throw new Error('A technician must be assigned before the scheduler confirms the slot');
  }
  assertScheduleAllowed({
    stockStatus: input.stockStatus,
    visitDate: input.visitDate,
    fulfilByMax: input.fulfilByMax,
  });
  return true;
}
