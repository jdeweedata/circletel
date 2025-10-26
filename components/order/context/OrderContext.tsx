'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { createClient } from '@/integrations/supabase/client';

import { OrderData, OrderStage, ValidationErrors } from '@/lib/order/types';

const STORAGE_KEY = 'circletel_order_state';

interface OrderState {
  currentStage: number;
  orderData: OrderData;
  errors: ValidationErrors;
  isLoading: boolean;
  savedAt?: Date;
  completedSteps: number[]; // Track completed steps for navigation
}

type OrderAction =
  | { type: 'SET_STAGE'; payload: number }
  | { type: 'UPDATE_DATA'; payload: Partial<OrderData> }
  | { type: 'SET_ERRORS'; payload: ValidationErrors }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SAVE_SUCCESS'; payload: Date }
  | { type: 'MARK_STEP_COMPLETE'; payload: number }
  | { type: 'RESET_ORDER' }
  | { type: 'HYDRATE_STATE'; payload: OrderState };

const initialState: OrderState = {
  currentStage: 1,
  orderData: {
    coverage: {},
    package: {},
    account: {},
    contact: {},
    installation: {},
  },
  errors: {},
  isLoading: false,
  completedSteps: [],
};

function orderReducer(state: OrderState, action: OrderAction): OrderState {
  switch (action.type) {
    case 'SET_STAGE':
      return { ...state, currentStage: action.payload };
    case 'UPDATE_DATA':
      return {
        ...state,
        orderData: { ...state.orderData, ...action.payload },
      };
    case 'SET_ERRORS':
      return { ...state, errors: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SAVE_SUCCESS':
      return { ...state, savedAt: action.payload };
    case 'MARK_STEP_COMPLETE':
      if (state.completedSteps.includes(action.payload)) {
        return state;
      }
      return {
        ...state,
        completedSteps: [...state.completedSteps, action.payload].sort(),
      };
    case 'RESET_ORDER':
      return initialState;
    case 'HYDRATE_STATE':
      return action.payload;
    default:
      return state;
  }
}

const OrderContext = createContext<{
  state: OrderState;
  dispatch: React.Dispatch<OrderAction>;
  actions: {
    setCurrentStage: (stage: number) => void;
    updateOrderData: (data: Partial<OrderData>) => void;
    setErrors: (errors: ValidationErrors) => void;
    setLoading: (loading: boolean) => void;
    markStepComplete: (step: number) => void;
    resetOrder: () => void;
  };
} | null>(null);

export function OrderContextProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(orderReducer, initialState);
  const [isHydrated, setIsHydrated] = React.useState(false);

  // Load order state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState);
          dispatch({ type: 'HYDRATE_STATE', payload: parsedState });
          console.log('Order state restored from localStorage:', parsedState);
        } catch (error) {
          console.error('Failed to restore order state:', error);
        }
      }
      setIsHydrated(true);
    }
  }, []);

  // Save order state to localStorage whenever it changes
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      console.log('Order state saved to localStorage');
    }
  }, [state, isHydrated]);

  // Helpers
  const hasLocalOrder = (s: OrderState) => {
    return (
      (s.completedSteps?.length ?? 0) > 0 ||
      Object.keys(s.orderData?.account || {}).length > 0 ||
      Object.keys(s.orderData?.contact || {}).length > 0 ||
      Object.keys(s.orderData?.installation || {}).length > 0 ||
      Object.keys(s.orderData?.coverage || {}).length > 0
    );
  };

  // On hydrate, if authenticated: load server draft and hydrate if local is empty; otherwise push local to server
  useEffect(() => {
    if (!isHydrated) return;
    const run = async () => {
      try {
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;
        const res = await fetch('/api/order-drafts', { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        const serverDraft = json?.draft as { data?: OrderState } | null;
        const localHas = hasLocalOrder(state);
        if (!localHas && serverDraft?.data) {
          dispatch({ type: 'HYDRATE_STATE', payload: serverDraft.data });
          return;
        }
        if (localHas && !serverDraft) {
          await fetch('/api/order-drafts', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: state }),
          });
        }
      } catch (e) {
        console.error('Order draft init sync failed:', e);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated]);

  // Debounced sync to server when state changes and user is authenticated
  useEffect(() => {
    if (!isHydrated) return;
    const timer = setTimeout(async () => {
      try {
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;
        if (!hasLocalOrder(state)) return;
        await fetch('/api/order-drafts', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: state }),
        });
      } catch (e) {
        console.error('Order draft sync failed:', e);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [state, isHydrated]);

  const actions = React.useMemo(() => ({
    setCurrentStage: (stage: number) => {
      dispatch({ type: 'SET_STAGE', payload: stage });
    },

    updateOrderData: (data: Partial<OrderData>) => {
      dispatch({ type: 'UPDATE_DATA', payload: data });
    },

    setErrors: (errors: ValidationErrors) => {
      dispatch({ type: 'SET_ERRORS', payload: errors });
    },

    setLoading: (loading: boolean) => {
      dispatch({ type: 'SET_LOADING', payload: loading });
    },

    markStepComplete: (step: number) => {
      dispatch({ type: 'MARK_STEP_COMPLETE', payload: step });
    },

    resetOrder: () => {
      dispatch({ type: 'RESET_ORDER' });
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
        console.log('Order state reset and cleared from localStorage');
      }
      (async () => {
        try {
          const supabase = createClient();
          const { data: userData } = await supabase.auth.getUser();
          if (!userData?.user) return;
          await fetch('/api/order-drafts', { method: 'DELETE' });
        } catch (e) {
          console.error('Failed to delete server order draft:', e);
        }
      })();
    },
  }), []);

  const contextValue = React.useMemo(() => ({
    state,
    dispatch,
    actions
  }), [state, actions]);

  // Don't render children until hydrated to avoid SSR mismatch
  if (!isHydrated) {
    return null;
  }

  return (
    <OrderContext.Provider value={contextValue}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrderContext() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrderContext must be used within OrderContextProvider');
  }
  return context;
}