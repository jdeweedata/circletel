import React from 'react';

export interface WorkflowStep {
  id: number;
  label: string;
  subLabel: string;
  status: 'completed' | 'active' | 'pending';
  icon?: React.ElementType;
  date?: string;
}

export interface TimelineEvent {
  id: number;
  title: string;
  description: string;
  date: string;
  iconType: 'doc' | 'calendar' | 'check';
}

export interface OrderData {
  id: string;
  createdDate: string;
  status: string;
  paymentStatus: {
    status: string;
    mandate: string;
    method: string;
  };
  totalAmount: string;
  workflow: WorkflowStep[];
  customer: {
    name: string;
    email: string;
    phone: string;
    contactPref: string;
    marketingOptIn: string;
    whatsappOptIn: string;
  };
  address: {
    street: string;
  };
  package: {
    name: string;
    speed: string;
    price: string;
    installFee: string;
    routerIncluded: string;
  };
  paymentInfo: {
    method: string;
    reference: string;
    status: string;
    totalPaid: string;
  };
  installation: {
    status: string;
    date: string;
    slot: string;
    technician: string;
    techPhone: string;
    techEmail: string;
  };
  paymentMethodDetails: {
    bank: string;
    accountName: string;
    accountNumber: string;
    accountType: string;
    amount: string;
    frequency: string;
    day: string;
    signed: string;
  };
  timeline: TimelineEvent[];
  source: {
    lead: string;
  };
  timestamps: {
    createdAt: string;
    updatedAt: string;
  };
}