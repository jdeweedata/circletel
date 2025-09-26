# CircleTel Order System Feature Specification

## Overview

The CircleTel Order System is a multi-step ordering flow that guides users through service selection, account creation, contact information collection, and order completion. This system builds on existing CircleTel components and patterns to maintain consistency with the current codebase.

## Business Requirements

### Primary Goals
- **Conversion Optimization**: Maximize successful order completion using existing form patterns
- **User Experience**: Intuitive ordering process using familiar CircleTel components
- **Data Accuracy**: Ensure all customer and order data is captured correctly
- **Consistency**: Maintain existing CircleTel branding and user experience patterns

### Key Features
- **Multi-step Wizard**: 4-stage guided ordering process using existing FormLayout
- **Progress Tracking**: Visual progress indicator using existing ProgressBar component
- **Form Validation**: Real-time validation using existing form components
- **Responsive Design**: Mobile-first approach consistent with current site
- **Data Persistence**: Auto-save functionality to prevent data loss

## Current Implementation Foundation

### Existing Components to Leverage
- **FormLayout**: Existing layout with Navbar/Footer and CircleTel branding
- **FormSection**: Existing section component with CircleTel styling
- **FormFields**: Existing InputField, SelectField, TextareaField components
- **ProgressBar**: Existing progress tracking component
- **Supabase Integration**: Existing database and authentication setup

### Order Flow Stages (Aligned with Current Architecture)

#### Stage 1: Coverage & Pricing
**Purpose**: Confirm service availability and display pricing options

**Components**: Use existing CoverageCheck, AddressAutocomplete components
**Layout**: Existing FormLayout with CircleTel branding
**Styling**: Consistent with current orange CircleTel theme

**Data Collected**:
```typescript
interface CoverageData {
  address: string;
  coordinates: { lat: number; lng: number };
  availableServices: ServiceType[];
  selectedPackage: PackageDetails;
  pricing: {
    monthly: number;
    onceOff: number;
    vatIncluded: boolean;
    breakdown: FeeBreakdown[];
  };
}
```

#### Stage 2: Account Registration
**Purpose**: Create or authenticate user account

**Components**: Use existing form components with Supabase Auth
**Layout**: Existing FormLayout structure
**Integration**: Build on existing Supabase setup

**Data Collected**:
```typescript
interface AccountData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  accountType: 'personal' | 'business';
  emailVerified: boolean;
  preferences: UserPreferences;
}
```

#### Stage 3: Contact Information
**Purpose**: Collect customer contact details

**Components**: Use existing InputField, SelectField components
**Layout**: Existing FormSection structure
**Validation**: Use existing form validation patterns

**Data Collected**:
```typescript
interface ContactData {
  customerType: 'personal' | 'business';
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  businessName?: string;
  businessRegistration?: string;
  taxNumber?: string;
  billingAddress: Address;
}
```

#### Stage 4: Installation & Payment
**Purpose**: Schedule installation and process payment

**Components**: Use existing form components and add order-specific ones
**Layout**: Existing FormLayout with progress tracking
**Integration**: Connect with existing Supabase tables

**Data Collected**:
```typescript
interface InstallationData {
  preferredDate: Date;
  alternativeDate?: Date;
  onsiteContact: {
    name: string;
    phone: string;
    isAccountHolder: boolean;
  };
  specialInstructions?: string;
  paymentMethod: PaymentMethod;
  termsAccepted: boolean;
  referralSource?: string;
}
```

## Technical Implementation

### State Management

#### Order Context
```typescript
interface OrderContextType {
  currentStage: number;
  orderData: {
    coverage: CoverageData;
    account: AccountData;
    contact: ContactData;
    installation: InstallationData;
  };
  progress: number;
  canProceed: boolean;
  errors: ValidationErrors;
  isLoading: boolean;
}
```

#### Progress Calculation
```typescript
const calculateProgress = (orderData: OrderData): number => {
  let completedStages = 0;
  const totalStages = 4;

  if (orderData.coverage.selectedPackage) completedStages++;
  if (orderData.account.emailVerified) completedStages++;
  if (orderData.contact.contactName) completedStages++;
  if (orderData.installation.preferredDate) completedStages++;

  return (completedStages / totalStages) * 100;
};
```

### Component Architecture

#### Order Wizard Container
```typescript
// Main container component
interface OrderWizardProps {
  initialStage?: number;
  onComplete: (orderData: OrderData) => void;
  onCancel: () => void;
}

const OrderWizard: React.FC<OrderWizardProps> = ({
  initialStage = 1,
  onComplete,
  onCancel
}) => {
  // State management and stage navigation logic
};
```

#### Stage Components
```typescript
// Individual stage components
const CoverageStage: React.FC<StageProps> = ({ data, onNext, onBack }) => {
  // Coverage checking and package selection
};

const AccountStage: React.FC<StageProps> = ({ data, onNext, onBack }) => {
  // Account registration and verification
};

const ContactStage: React.FC<StageProps> = ({ data, onNext, onBack }) => {
  // Contact information collection
};

const InstallationStage: React.FC<StageProps> = ({ data, onNext, onBack }) => {
  // Installation scheduling and payment
};
```

### Form Validation

#### Validation Schema
```typescript
const coverageSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  selectedPackage: z.object({
    id: z.string(),
    name: z.string(),
    monthlyPrice: z.number().positive(),
    onceOffPrice: z.number().min(0)
  })
});

const accountSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().regex(/^(\+27|0)[6-8][0-9]{8}$/, 'Invalid South African phone number')
});

const contactSchema = z.object({
  customerType: z.enum(['personal', 'business']),
  contactName: z.string().min(2, 'Contact name is required'),
  contactEmail: z.string().email('Invalid email address'),
  contactPhone: z.string().regex(/^(\+27|0)[6-8][0-9]{8}$/, 'Invalid phone number')
});

const installationSchema = z.object({
  preferredDate: z.date().min(new Date(), 'Date must be in the future'),
  onsiteContact: z.object({
    name: z.string().min(1, 'Onsite contact name is required'),
    phone: z.string().regex(/^(\+27|0)[6-8][0-9]{8}$/, 'Invalid phone number')
  }),
  termsAccepted: z.boolean().refine(val => val === true, 'Terms must be accepted')
});
```

### Data Persistence

#### Auto-save Functionality
```typescript
const useOrderPersistence = (orderId: string) => {
  const saveDraft = useCallback((data: OrderData, stage: number) => {
    const draft = {
      id: orderId,
      data,
      stage,
      lastSaved: new Date().toISOString()
    };

    // Save to localStorage and/or server
    localStorage.setItem(`order_draft_${orderId}`, JSON.stringify(draft));

    // Optionally sync to server
    supabase.from('order_drafts').upsert(draft);
  }, [orderId]);

  const loadDraft = useCallback(() => {
    // Load from localStorage first, then server
    const localDraft = localStorage.getItem(`order_draft_${orderId}`);
    return localDraft ? JSON.parse(localDraft) : null;
  }, [orderId]);

  return { saveDraft, loadDraft };
};
```

### API Integration

#### Order API Endpoints
```typescript
// Create new order
POST /api/orders
{
  "userId": "string",
  "orderData": OrderData,
  "stage": number
}

// Update existing order
PUT /api/orders/:id
{
  "orderData": OrderData,
  "stage": number
}

// Get order status
GET /api/orders/:id

// Submit order for processing
POST /api/orders/:id/submit
{
  "paymentMethod": PaymentMethod,
  "termsAccepted": boolean
}
```

#### Coverage API
```typescript
// Check coverage availability
POST /api/coverage/check
{
  "address": string,
  "coordinates": { lat: number, lng: number }
}

// Get available packages
GET /api/packages?serviceType=string&location=string

// Calculate pricing
POST /api/pricing/calculate
{
  "packageId": string,
  "location": string,
  "addOns": string[]
}
```

## User Experience Design

### Progress Indicator
```typescript
const ProgressIndicator: React.FC<{ currentStage: number; totalStages: number }> = ({
  currentStage,
  totalStages
}) => {
  return (
    <div className="flex items-center justify-between mb-8">
      {Array.from({ length: totalStages }, (_, i) => i + 1).map((stage) => (
        <React.Fragment key={stage}>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
            stage < currentStage ? 'bg-green-500 text-white' :
            stage === currentStage ? 'bg-blue-500 text-white' :
            'bg-gray-200 text-gray-500'
          }`}>
            {stage < currentStage ? '✓' : stage}
          </div>
          {stage < totalStages && (
            <div className={`flex-1 h-1 mx-4 ${
              stage < currentStage ? 'bg-green-500' : 'bg-gray-200'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
```

### Stage Navigation
```typescript
const StageNavigation: React.FC<{
  canProceed: boolean;
  onNext: () => void;
  onBack: () => void;
  isLoading?: boolean;
}> = ({ canProceed, onNext, onBack, isLoading }) => {
  return (
    <div className="flex justify-between mt-8">
      <Button
        variant="outline"
        onClick={onBack}
        disabled={isLoading}
      >
        Back
      </Button>
      <Button
        onClick={onNext}
        disabled={!canProceed || isLoading}
        className="bg-circleTel-orange hover:bg-circleTel-orange/90"
      >
        {isLoading ? 'Processing...' : 'Continue'}
      </Button>
    </div>
  );
};
```

## Error Handling

### Validation Errors
```typescript
const ValidationError: React.FC<{ error: string }> = ({ error }) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-4">
      <div className="flex">
        <AlertCircle className="h-5 w-5 text-red-400" />
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            Please correct the following errors:
          </h3>
          <div className="mt-2 text-sm text-red-700">
            {error}
          </div>
        </div>
      </div>
    </div>
  );
};
```

### Network Errors
```typescript
const NetworkError: React.FC<{ onRetry: () => void }> = ({ onRetry }) => {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mt-4">
      <div className="flex">
        <Wifi className="h-5 w-5 text-yellow-400" />
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">
            Connection Error
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            Unable to save your progress. Please check your internet connection.
          </div>
          <div className="mt-4">
            <Button onClick={onRetry} size="sm">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

## Security Considerations

### Data Protection
- **Input Sanitization**: All user inputs sanitized before processing
- **CSRF Protection**: CSRF tokens for state-changing operations
- **Rate Limiting**: API rate limiting to prevent abuse
- **Data Encryption**: Sensitive data encrypted at rest and in transit

### Payment Security
- **PCI Compliance**: Payment data handling according to PCI DSS
- **Tokenization**: Payment information tokenized and not stored
- **Fraud Detection**: Basic fraud detection measures implemented
- **Audit Logging**: All payment-related actions logged

## Testing Strategy

### Unit Testing
```typescript
describe('OrderWizard', () => {
  it('should render coverage stage by default', () => {
    // Test implementation
  });

  it('should validate required fields before proceeding', () => {
    // Test implementation
  });

  it('should save draft data automatically', () => {
    // Test implementation
  });
});
```

### Integration Testing
```typescript
describe('Order Flow Integration', () => {
  it('should complete full order flow successfully', () => {
    // Test implementation
  });

  it('should handle network errors gracefully', () => {
    // Test implementation
  });

  it('should persist data across browser sessions', () => {
    // Test implementation
  });
});
```

### End-to-End Testing
```typescript
describe('Complete Order Journey', () => {
  it('should allow user to complete order from start to finish', () => {
    // E2E test implementation
  });

  it('should handle mobile responsive design', () => {
    // Mobile testing implementation
  });
});
```

## Performance Optimization

### Frontend Optimization
- **Code Splitting**: Each stage loaded dynamically
- **Lazy Loading**: Components loaded on demand
- **Memoization**: Expensive calculations memoized
- **Debouncing**: Auto-save debounced to reduce API calls

### Backend Optimization
- **Database Indexing**: Optimized queries with proper indexing
- **Caching**: Redis caching for frequently accessed data
- **Background Processing**: Heavy operations moved to background jobs
- **API Optimization**: Efficient API endpoints with minimal data transfer

## Deployment & Monitoring

### Deployment Strategy
- **Staged Rollout**: Gradual feature rollout with monitoring
- **Feature Flags**: Ability to enable/disable features remotely
- **Rollback Plan**: Quick rollback capability if issues arise
- **Blue-Green Deployment**: Zero-downtime deployment strategy

### Monitoring & Analytics
- **Conversion Tracking**: Track conversion rates at each stage
- **Performance Monitoring**: Monitor page load times and user interactions
- **Error Tracking**: Comprehensive error logging and alerting
- **User Behavior Analytics**: Track user interactions and drop-off points

## Future Enhancements

### Planned Features
- **A/B Testing**: Different UI variations for optimization
- **Personalization**: Customized experience based on user behavior
- **Mobile App**: Native mobile ordering experience
- **AI-Powered Recommendations**: Smart package suggestions

### Scalability Considerations
- **Microservices**: Potential migration to microservices architecture
- **Event-Driven Architecture**: Implementation of event sourcing
- **Multi-Region Deployment**: Global expansion support
- **Advanced Analytics**: Machine learning-powered insights

---

## Related Documentation

- [System Architecture](../architecture/system-overview.md)
- [Component Architecture](../architecture/component-architecture.md)
- [API Design](../api/api-design.md)
- [Testing Standards](../standards/testing-standards.md)

---

*This specification is maintained by the CircleTel product team and should be updated as requirements evolve.*
