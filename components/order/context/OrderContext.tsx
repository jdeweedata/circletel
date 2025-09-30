'use client';

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { OrderData, OrderStage, ValidationErrors } from '@/lib/order/types';

interface OrderState {
  currentStage: number;
  orderData: OrderData;
  errors: ValidationErrors;
  isLoading: boolean;
  savedAt?: Date;
}

type OrderAction =
  | { type: 'SET_STAGE'; payload: number }
  | { type: 'UPDATE_DATA'; payload: Partial<OrderData> }
  | { type: 'SET_ERRORS'; payload: ValidationErrors }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SAVE_SUCCESS'; payload: Date };

const initialState: OrderState = {
  currentStage: 1,
  orderData: {
    coverage: {},
    account: {},
    contact: {},
    installation: {},
  },
  errors: {},
  isLoading: false,
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
  };
} | null>(null);

export function OrderContextProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(orderReducer, initialState);

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
  }), []);

  const contextValue = React.useMemo(() => ({
    state,
    dispatch,
    actions
  }), [state, actions]);

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