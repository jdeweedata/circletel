'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

// Order state types
export interface OrderPackage {
  id: string;
  name: string;
  service_type: string;
  product_category?: string;
  speed_down: number;
  speed_up: number;
  price: string;
  promotion_price?: string | null;
  promotion_months?: number | null;
  description?: string;
  features?: string[];
}

export interface OrderCoverageData {
  leadId: string;
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  coverage_available: boolean;
  available_services: string[];
}

export interface OrderAccountData {
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  userId?: string;
  isExistingCustomer?: boolean;
}

export interface OrderContactData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  billingAddress: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  installationAddress?: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
    sameAsBilling: boolean;
  };
}

export interface OrderInstallationData {
  preferredDate?: Date | string;
  preferredTimeSlot?: 'morning' | 'afternoon' | 'evening';
  installationNotes?: string;
  requiresRouterRental?: boolean;
  requiresTechnician?: boolean;
}

export interface OrderPaymentData {
  paymentMethod?: 'credit_card' | 'debit_card' | 'eft' | 'instant_eft';
  acceptedTerms: boolean;
  agreedToMarketing?: boolean;
}

export interface OrderState {
  // Order flow data
  coverage: OrderCoverageData | null;
  selectedPackage: OrderPackage | null;
  account: OrderAccountData | null;
  contact: OrderContactData | null;
  installation: OrderInstallationData | null;
  payment: OrderPaymentData | null;

  // Order metadata
  orderId?: string;
  createdAt?: string;
  currentStep: number; // 1-5
  completedSteps: number[]; // Array of completed step numbers

  // Calculated fields
  totalAmount: number;
  monthlyAmount: number;
}

interface OrderContextType {
  order: OrderState;

  // State setters
  setCoverageData: (data: OrderCoverageData) => void;
  setSelectedPackage: (pkg: OrderPackage | null) => void;
  setAccountData: (data: OrderAccountData) => void;
  setContactData: (data: OrderContactData) => void;
  setInstallationData: (data: OrderInstallationData) => void;
  setPaymentData: (data: OrderPaymentData) => void;

  // Navigation
  setCurrentStep: (step: number) => void;
  markStepComplete: (step: number) => void;
  isStepComplete: (step: number) => boolean;
  canNavigateToStep: (step: number) => boolean;

  // Order actions
  initializeOrder: (leadId: string, address: string, coordinates?: { lat: number; lng: number }) => void;
  resetOrder: () => void;
  saveOrder: () => Promise<string | null>; // Returns order ID

  // Utilities
  calculateTotals: () => void;
  isOrderValid: () => boolean;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

const STORAGE_KEY = 'circletel_order_state';

// Initial order state
const initialOrderState: OrderState = {
  coverage: null,
  selectedPackage: null,
  account: null,
  contact: null,
  installation: null,
  payment: null,
  currentStep: 1,
  completedSteps: [],
  totalAmount: 0,
  monthlyAmount: 0,
};

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [order, setOrder] = useState<OrderState>(initialOrderState);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load order state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedOrder = localStorage.getItem(STORAGE_KEY);
      if (savedOrder) {
        try {
          const parsedOrder = JSON.parse(savedOrder);
          setOrder(parsedOrder);
          console.log('Order state restored from localStorage:', parsedOrder);
        } catch (error) {
          console.error('Failed to parse saved order state:', error);
        }
      }
      setIsHydrated(true);
    }
  }, []);

  // Save order state to localStorage whenever it changes
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
      console.log('Order state saved to localStorage');
    }
  }, [order, isHydrated]);

  // Calculate totals whenever package changes
  useEffect(() => {
    if (order.selectedPackage) {
      const priceToUse = order.selectedPackage.promotion_price || order.selectedPackage.price;
      const monthlyAmount = parseFloat(priceToUse);
      const totalAmount = monthlyAmount; // For now, just monthly amount

      setOrder(prev => ({
        ...prev,
        monthlyAmount,
        totalAmount,
      }));
    }
  }, [order.selectedPackage]);

  // State setters
  const setCoverageData = useCallback((data: OrderCoverageData) => {
    setOrder(prev => ({
      ...prev,
      coverage: data,
    }));
  }, []);

  const setSelectedPackage = useCallback((pkg: OrderPackage | null) => {
    setOrder(prev => ({
      ...prev,
      selectedPackage: pkg,
    }));
  }, []);

  const setAccountData = useCallback((data: OrderAccountData) => {
    setOrder(prev => ({
      ...prev,
      account: data,
    }));
  }, []);

  const setContactData = useCallback((data: OrderContactData) => {
    setOrder(prev => ({
      ...prev,
      contact: data,
    }));
  }, []);

  const setInstallationData = useCallback((data: OrderInstallationData) => {
    setOrder(prev => ({
      ...prev,
      installation: data,
    }));
  }, []);

  const setPaymentData = useCallback((data: OrderPaymentData) => {
    setOrder(prev => ({
      ...prev,
      payment: data,
    }));
  }, []);

  // Navigation
  const setCurrentStep = useCallback((step: number) => {
    if (step >= 1 && step <= 5) {
      setOrder(prev => ({
        ...prev,
        currentStep: step,
      }));
    }
  }, []);

  const markStepComplete = useCallback((step: number) => {
    setOrder(prev => ({
      ...prev,
      completedSteps: prev.completedSteps.includes(step)
        ? prev.completedSteps
        : [...prev.completedSteps, step].sort(),
    }));
  }, []);

  const isStepComplete = useCallback((step: number) => {
    return order.completedSteps.includes(step);
  }, [order.completedSteps]);

  const canNavigateToStep = useCallback((targetStep: number) => {
    // Can always go back to completed steps
    if (order.completedSteps.includes(targetStep)) {
      return true;
    }

    // Can go to next step if current step is complete or if it's step 1
    if (targetStep === order.currentStep + 1 && order.completedSteps.includes(order.currentStep)) {
      return true;
    }

    // Can always access step 1
    if (targetStep === 1) {
      return true;
    }

    return false;
  }, [order.currentStep, order.completedSteps]);

  // Order actions
  const initializeOrder = useCallback((leadId: string, address: string, coordinates?: { lat: number; lng: number }) => {
    setOrder({
      ...initialOrderState,
      coverage: {
        leadId,
        address,
        coordinates,
        coverage_available: true,
        available_services: [],
      },
      createdAt: new Date().toISOString(),
    });
  }, []);

  const resetOrder = useCallback(() => {
    setOrder(initialOrderState);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const saveOrder = useCallback(async (): Promise<string | null> => {
    try {
      // TODO: Implement API call to save order to database
      // For now, just return a mock order ID
      const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      setOrder(prev => ({
        ...prev,
        orderId,
      }));

      console.log('Order saved:', orderId);
      return orderId;
    } catch (error) {
      console.error('Failed to save order:', error);
      return null;
    }
  }, []);

  const calculateTotals = useCallback(() => {
    if (order.selectedPackage) {
      const priceToUse = order.selectedPackage.promotion_price || order.selectedPackage.price;
      const monthlyAmount = parseFloat(priceToUse);
      const totalAmount = monthlyAmount;

      setOrder(prev => ({
        ...prev,
        monthlyAmount,
        totalAmount,
      }));
    }
  }, [order.selectedPackage]);

  const isOrderValid = useCallback(() => {
    // Check if all required data is present
    return !!(
      order.coverage &&
      order.selectedPackage &&
      order.account &&
      order.contact &&
      order.installation &&
      order.payment?.acceptedTerms
    );
  }, [order]);

  const value: OrderContextType = {
    order,
    setCoverageData,
    setSelectedPackage,
    setAccountData,
    setContactData,
    setInstallationData,
    setPaymentData,
    setCurrentStep,
    markStepComplete,
    isStepComplete,
    canNavigateToStep,
    initializeOrder,
    resetOrder,
    saveOrder,
    calculateTotals,
    isOrderValid,
  };

  // Don't render children until hydrated to avoid SSR mismatch
  if (!isHydrated) {
    return null;
  }

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
}
