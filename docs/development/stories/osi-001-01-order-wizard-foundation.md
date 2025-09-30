# Story: Order Wizard Foundation and Routing

**Story ID**: OSI-001-01
**Epic**: Order System Implementation (OSI-001)
**Created**: September 27, 2025
**Status**: Ready for Development
**Points**: 5 (2 days)
**Assignee**: Full-Stack Developer

## Story Overview

As a **CircleTel customer**, I need to **navigate through a multi-stage order wizard** so that **I can complete my internet service order in a structured, user-friendly way**.

### Business Value
- Provides foundation for entire order system
- Enables structured customer journey with progress tracking
- Reduces order abandonment through clear navigation
- Supports mobile and desktop experiences

## Context Engineering

### Current Architecture Context
```typescript
// Existing routing structure: app/
app/
├── (auth)/                 # Authentication pages
├── admin/                  # Admin dashboard
├── connectivity/           # Service information pages
├── services/              # Service category pages
└── layout.tsx             # Root layout with navigation

// Existing form components: components/forms/
components/forms/
├── common/
│   ├── FormLayout.tsx      # Main form layout with CircleTel branding
│   ├── FormSection.tsx     # Section wrapper component
│   └── FormFields.tsx      # Input, Select, Textarea components
└── clients/               # Specialized form components

// Existing layout components: components/layout/
components/layout/
├── Navbar.tsx             # Main navigation
├── Footer.tsx             # Footer component
└── Logo.tsx               # CircleTel logo component
```

### Required Extensions
```typescript
// New order routing structure
app/order/
├── layout.tsx             # Order-specific layout
├── page.tsx               # Order landing/start page
├── coverage/
│   └── page.tsx           # Stage 1: Coverage check
├── account/
│   └── page.tsx           # Stage 2: Account registration
├── contact/
│   └── page.tsx           # Stage 3: Contact information
├── installation/
│   └── page.tsx           # Stage 4: Installation & payment
└── confirmation/
    └── page.tsx           # Order confirmation

// New order components
components/order/
├── wizard/
│   ├── OrderWizard.tsx    # Main wizard container
│   ├── ProgressIndicator.tsx # Progress tracking
│   └── StageNavigation.tsx   # Stage navigation buttons
├── stages/
│   ├── CoverageStage.tsx     # Coverage checking stage
│   ├── AccountStage.tsx      # Account registration stage
│   ├── ContactStage.tsx      # Contact information stage
│   └── InstallationStage.tsx # Installation & payment stage
└── context/
    └── OrderContext.tsx      # Order state management
```

### Integration Pattern
```typescript
// Order context for state management
interface OrderContextType {
  currentStage: number;
  totalStages: number;
  orderData: OrderData;
  progress: number;
  canProceed: boolean;
  errors: ValidationErrors;
  isLoading: boolean;

  // Actions
  setCurrentStage: (stage: number) => void;
  updateOrderData: (data: Partial<OrderData>) => void;
  validateStage: (stage: number) => boolean;
  saveProgress: () => Promise<void>;
}

// Stage component interface
interface StageComponentProps {
  data: any;
  onNext: () => void;
  onBack: () => void;
  onUpdate: (data: any) => void;
  canProceed: boolean;
  isLoading: boolean;
}
```

## Technical Implementation

### Step 1: Create Order Layout
**File**: `app/order/layout.tsx`

```typescript
import { OrderContextProvider } from '@/components/order/context/OrderContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

interface OrderLayoutProps {
  children: React.ReactNode;
}

export default function OrderLayout({ children }: OrderLayoutProps) {
  return (
    <OrderContextProvider>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
        <Footer />
      </div>
    </OrderContextProvider>
  );
}
```

### Step 2: Create Order Context
**File**: `components/order/context/OrderContext.tsx`

```typescript
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

  const actions = {
    setCurrentStage: useCallback((stage: number) => {
      dispatch({ type: 'SET_STAGE', payload: stage });
    }, []),

    updateOrderData: useCallback((data: Partial<OrderData>) => {
      dispatch({ type: 'UPDATE_DATA', payload: data });
    }, []),

    setErrors: useCallback((errors: ValidationErrors) => {
      dispatch({ type: 'SET_ERRORS', payload: errors });
    }, []),

    setLoading: useCallback((loading: boolean) => {
      dispatch({ type: 'SET_LOADING', payload: loading });
    }, []),
  };

  return (
    <OrderContext.Provider value={{ state, dispatch, actions }}>
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
```

### Step 3: Create Progress Indicator
**File**: `components/order/wizard/ProgressIndicator.tsx`

```typescript
'use client';

import React from 'react';
import { Check, Circle } from 'lucide-react';

interface ProgressIndicatorProps {
  currentStage: number;
  totalStages: number;
  stageNames: string[];
}

export function ProgressIndicator({
  currentStage,
  totalStages,
  stageNames
}: ProgressIndicatorProps) {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {Array.from({ length: totalStages }, (_, i) => i + 1).map((stage, index) => (
          <React.Fragment key={stage}>
            <div className="flex flex-col items-center">
              {/* Stage Circle */}
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors duration-200
                ${stage < currentStage
                  ? 'bg-circleTel-orange border-circleTel-orange text-white'
                  : stage === currentStage
                    ? 'bg-white border-circleTel-orange text-circleTel-orange'
                    : 'bg-white border-gray-300 text-gray-500'
                }
              `}>
                {stage < currentStage ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-semibold">{stage}</span>
                )}
              </div>

              {/* Stage Name */}
              <span className={`
                mt-2 text-xs font-medium text-center max-w-20
                ${stage <= currentStage ? 'text-gray-900' : 'text-gray-500'}
              `}>
                {stageNames[index]}
              </span>
            </div>

            {/* Progress Line */}
            {stage < totalStages && (
              <div className={`
                flex-1 h-0.5 mx-4 transition-colors duration-200
                ${stage < currentStage ? 'bg-circleTel-orange' : 'bg-gray-300'}
              `} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
```

### Step 4: Create Stage Navigation
**File**: `components/order/wizard/StageNavigation.tsx`

```typescript
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface StageNavigationProps {
  currentStage: number;
  totalStages: number;
  canProceed: boolean;
  isLoading: boolean;
  onNext: () => void;
  onBack: () => void;
  nextLabel?: string;
  backLabel?: string;
}

export function StageNavigation({
  currentStage,
  totalStages,
  canProceed,
  isLoading,
  onNext,
  onBack,
  nextLabel = 'Continue',
  backLabel = 'Back'
}: StageNavigationProps) {
  const isFirstStage = currentStage === 1;
  const isLastStage = currentStage === totalStages;

  return (
    <div className="flex justify-between items-center pt-6 border-t border-gray-200">
      {/* Back Button */}
      <Button
        variant="outline"
        onClick={onBack}
        disabled={isFirstStage || isLoading}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        {backLabel}
      </Button>

      {/* Next/Complete Button */}
      <Button
        onClick={onNext}
        disabled={!canProceed || isLoading}
        className="flex items-center gap-2 bg-circleTel-orange hover:bg-circleTel-orange/90"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing...
          </>
        ) : (
          <>
            {isLastStage ? 'Complete Order' : nextLabel}
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Button>
    </div>
  );
}
```

### Step 5: Create Order Wizard Container
**File**: `components/order/wizard/OrderWizard.tsx`

```typescript
'use client';

import React from 'react';
import { useOrderContext } from '@/components/order/context/OrderContext';
import { ProgressIndicator } from './ProgressIndicator';
import { StageNavigation } from './StageNavigation';

interface OrderWizardProps {
  children: React.ReactNode;
  onStageComplete?: (stage: number) => void;
  onOrderComplete?: () => void;
}

const STAGE_NAMES = ['Coverage', 'Account', 'Contact', 'Installation'];
const TOTAL_STAGES = 4;

export function OrderWizard({
  children,
  onStageComplete,
  onOrderComplete
}: OrderWizardProps) {
  const { state, actions } = useOrderContext();
  const { currentStage, isLoading } = state;

  const handleNext = () => {
    if (currentStage < TOTAL_STAGES) {
      const nextStage = currentStage + 1;
      actions.setCurrentStage(nextStage);
      onStageComplete?.(currentStage);
    } else {
      onOrderComplete?.();
    }
  };

  const handleBack = () => {
    if (currentStage > 1) {
      actions.setCurrentStage(currentStage - 1);
    }
  };

  // TODO: Implement validation logic for each stage
  const canProceed = true; // Placeholder - will be implemented in stage-specific stories

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Progress Indicator */}
      <ProgressIndicator
        currentStage={currentStage}
        totalStages={TOTAL_STAGES}
        stageNames={STAGE_NAMES}
      />

      {/* Stage Content */}
      <div className="mt-8">
        {children}
      </div>

      {/* Navigation */}
      <StageNavigation
        currentStage={currentStage}
        totalStages={TOTAL_STAGES}
        canProceed={canProceed}
        isLoading={isLoading}
        onNext={handleNext}
        onBack={handleBack}
      />
    </div>
  );
}
```

### Step 6: Create Order Data Types
**File**: `lib/order/types.ts`

```typescript
// Order data structure
export interface OrderData {
  coverage: CoverageData;
  account: AccountData;
  contact: ContactData;
  installation: InstallationData;
}

export interface CoverageData {
  address?: string;
  coordinates?: { lat: number; lng: number };
  selectedPackage?: PackageDetails;
  pricing?: PricingDetails;
}

export interface AccountData {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  accountType?: 'personal' | 'business';
  isAuthenticated?: boolean;
}

export interface ContactData {
  customerType?: 'personal' | 'business';
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  businessName?: string;
  businessRegistration?: string;
  taxNumber?: string;
  billingAddress?: Address;
}

export interface InstallationData {
  preferredDate?: Date;
  alternativeDate?: Date;
  onsiteContact?: {
    name: string;
    phone: string;
    isAccountHolder: boolean;
  };
  specialInstructions?: string;
  paymentMethod?: PaymentMethod;
  termsAccepted?: boolean;
}

export interface ValidationErrors {
  [key: string]: string[];
}

// Supporting types
export interface PackageDetails {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  onceOffPrice: number;
  speed: string;
  type: 'fibre' | 'wireless' | 'mobile';
}

export interface PricingDetails {
  monthly: number;
  onceOff: number;
  vatIncluded: boolean;
  breakdown: FeeBreakdown[];
}

export interface FeeBreakdown {
  name: string;
  amount: number;
  type: 'monthly' | 'once_off';
}

export interface Address {
  street: string;
  suburb: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

export interface PaymentMethod {
  type: 'card' | 'eft' | 'debit_order';
  details?: any; // Payment provider specific
}
```

### Step 7: Create Order Landing Page
**File**: `app/order/page.tsx`

```typescript
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOrderContext } from '@/components/order/context/OrderContext';
import { OrderWizard } from '@/components/order/wizard/OrderWizard';

export default function OrderPage() {
  const router = useRouter();
  const { state } = useOrderContext();

  // Redirect to first stage
  useEffect(() => {
    router.push('/order/coverage');
  }, [router]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Order Your Internet Service
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Get connected with CircleTel's reliable internet services
        </p>
      </div>

      <OrderWizard
        onStageComplete={(stage) => {
          console.log(`Stage ${stage} completed`);
        }}
        onOrderComplete={() => {
          router.push('/order/confirmation');
        }}
      >
        <div className="text-center py-8">
          <p className="text-gray-500">Redirecting to coverage check...</p>
        </div>
      </OrderWizard>
    </div>
  );
}
```

## Implementation Steps

1. **Create Order Layout**: Set up order-specific layout with CircleTel branding
2. **Implement Order Context**: State management for order data and navigation
3. **Build Progress Indicator**: Visual progress tracking component
4. **Create Stage Navigation**: Navigation buttons with validation
5. **Develop Order Wizard**: Main container component
6. **Define Data Types**: TypeScript interfaces for order data
7. **Set up Routing**: Order pages structure with Next.js app router

## Acceptance Criteria

### Functional Requirements
- [ ] Order wizard displays 4 stages with clear progress indication
- [ ] Navigation between stages works (forward/backward)
- [ ] Progress indicator shows current stage and completion status
- [ ] Order context maintains state across stage transitions
- [ ] Mobile-responsive design works on all screen sizes

### Technical Requirements
- [ ] TypeScript strict mode compliance
- [ ] Integration with existing CircleTel components
- [ ] Proper error boundaries and error handling
- [ ] Performance: <3s initial load time

### Quality Requirements
- [ ] Accessible navigation (keyboard, screen readers)
- [ ] Consistent with CircleTel design system
- [ ] Clean code following established patterns
- [ ] Comprehensive error handling

## Testing Strategy

### Unit Tests
```typescript
describe('OrderWizard', () => {
  it('should render progress indicator with correct stage', () => {
    // Test implementation
  });

  it('should handle stage navigation correctly', () => {
    // Test implementation
  });

  it('should maintain order state across stages', () => {
    // Test implementation
  });
});
```

### Integration Tests
```typescript
describe('Order Context', () => {
  it('should update order data correctly', () => {
    // Test implementation
  });

  it('should validate stage progression', () => {
    // Test implementation
  });
});
```

## Dependencies

### External Dependencies
- **Next.js 15**: App router for page navigation
- **React**: Context API for state management
- **Lucide React**: Icons for UI elements

### Internal Dependencies
- **CircleTel Components**: FormLayout, Button, existing UI components
- **Design System**: CircleTel colors and styling patterns
- **TypeScript**: Type definitions for order data

## Definition of Done

- [ ] Order wizard foundation components created
- [ ] Navigation between stages functional
- [ ] Progress tracking implemented
- [ ] Order context state management working
- [ ] Mobile-responsive design complete
- [ ] TypeScript types defined
- [ ] Unit tests written and passing
- [ ] Integration with existing components verified
- [ ] Code review completed
- [ ] Documentation updated

## Notes

- This story provides the foundation for all subsequent order stages
- Focus on reusing existing CircleTel components and patterns
- Ensure mobile-first responsive design
- Keep order state management flexible for future enhancements