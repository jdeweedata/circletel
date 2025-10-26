# CircleTel Demo Pages

> **Purpose**: Interactive demonstration pages showcasing CircleTel's order flow and UI components
> **Status**: Production-safe (isolated from real order flow)
> **Last Updated**: 2025-10-26

---

## 📁 Available Demos

### 1. Order Flow Journey (`OrderFlowJourney.tsx`)

**Location**: `/demo/order-flow`

**Purpose**: Complete interactive demonstration of the consumer order flow from account creation to confirmation.

**Features**:
- ✅ **4-Step Journey**: Account → Service Address → Payment → Confirmation
- ✅ **Dual Authentication**: Email/Password OR Google OAuth
- ✅ **Service Types**: Residential vs Business with property type selection
- ✅ **9 Payment Methods**: Card, Instant EFT, Capitec Pay, Bank EFT, Scan to Pay, Payflex, 1Voucher, paymyway, SCode
- ✅ **Form Validation**: Real-time error handling with Zod-style validation
- ✅ **Animations**: Framer Motion transitions between tabs
- ✅ **Demo Warning Banner**: Clear indication this is a demo environment

**Safety Guarantees**:
- ❌ Does NOT use `OrderContext` (won't interfere with real orders)
- ❌ Does NOT make API calls (won't affect database)
- ❌ Does NOT save data (self-contained state only)
- ✅ Uses mock data only
- ✅ Completely isolated from production order flow

---

## 🔗 Access Points

### Direct URL
```
http://localhost:3000/demo/order-flow
```

### From UI Components Demo
Navigate to: `http://localhost:3000/demo/ui-components`
- Scroll to bottom
- Click "Launch Interactive Demo" button

---

## 📋 Technical Details

### File Structure
```
docs/demo-pages/
├── OrderFlowJourney.tsx    # Main demo component
├── NetcashPaymentInterface.jsx  # Payment demo reference
└── README.md               # This file

app/demo/
├── order-flow/
│   └── page.tsx            # Next.js page wrapper
└── ui-components/
    └── page.tsx            # UI components showcase (with link to order flow)
```

### Dependencies
All dependencies already in project:
- `react` - Core React
- `framer-motion` - Animations
- `lucide-react` - Icons
- No additional packages required

### State Management
```typescript
// Self-contained useState - does NOT use OrderContext
const [formData, setFormData] = useState<FormData>({
  // Account
  authMethod: "email" | "google",
  email: string,
  password: string,
  phone: string,
  acceptTerms: boolean,

  // Service Address
  serviceType: "residential" | "business",
  propertyType: string,
  street: string,
  suburb: string,
  city: string,
  province: string,
  postalCode: string,

  // Payment
  paymentMethod: string,
  acceptPaymentTerms: boolean,
  cardNumber: string,
  cardExpiry: string,
  cardCVV: string,
  cardName: string,
});
```

---

## 🎨 Design System

### Colors (CircleTel Branding)
- **Primary Orange**: `#F5831F` (CircleTel brand color)
- **Gradients**: `from-orange-500 to-orange-600`
- **Warning Banner**: `from-blue-500 to-blue-600`

### Components
- **Progress Bar**: 4-step horizontal navigation with checkmarks
- **Tab Navigation**: Click previous steps to navigate back
- **Form Validation**: Real-time error messages below fields
- **Animations**: Smooth slide transitions (Framer Motion)

---

## 🔒 Safety & Isolation

### Why This Demo is Safe

1. **No OrderContext Usage**
   - Production order flow uses `OrderContext` from `components/order/context/OrderContext.tsx`
   - Demo uses plain `useState` - completely separate state
   - No risk of interfering with real orders

2. **No API Calls**
   - No `fetch()` calls to `/api/*` endpoints
   - No database writes
   - All data is mock/example data

3. **No Authentication Integration**
   - Google OAuth button is visual only
   - Email/Password form doesn't create real accounts
   - "Complete Payment" is demo-only

4. **Clear Warning Banner**
   - Blue banner at top: "⚡ DEMO MODE - Interactive Preview Only"
   - Explains no real orders will be created
   - Directs users to homepage for real orders

### Verification
```bash
# Verify no OrderContext usage
grep -r "OrderContext\|useOrderContext" docs/demo-pages/OrderFlowJourney.tsx
# Result: No matches (safe!)

# Verify no API calls
grep -r "/api/" docs/demo-pages/OrderFlowJourney.tsx
# Result: No matches (safe!)
```

---

## 📖 User Flow

### Demo Journey (4 Steps)

```
┌──────────────────────────────────────────────────────┐
│  Step 1: Account Creation                            │
│  ─────────────────────────                           │
│  ⬤──○──○──○                                          │
│                                                       │
│  • Toggle: Email/Password OR Google OAuth            │
│  • Form: Email, Password, Phone, Terms               │
│  • Validation: Real-time error messages              │
│                                                       │
│  [Continue] → Step 2                                 │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  Step 2: Service Address                             │
│  ────────────────────                                │
│  ○──⬤──○──○                                          │
│                                                       │
│  • Toggle: Residential OR Business                   │
│  • Property Type: Dropdown (context-aware)           │
│  • Address Form: Street, Suburb, City, Province, PC  │
│                                                       │
│  [Back] [Continue] → Step 3                          │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  Step 3: Payment                                     │
│  ───────────────                                     │
│  ○──○──⬤──○                                          │
│                                                       │
│  LEFT SIDEBAR (1/3):                                 │
│  • Package Card (Fibre 100Mbps)                      │
│  • Installation Address                              │
│  • Order Summary (pricing breakdown)                 │
│                                                       │
│  RIGHT CONTENT (2/3):                                │
│  • 9 Payment Method Cards (grid layout)              │
│  • Card Form (if card selected)                      │
│  • Security Features (SSL, PCI DSS, Verified)        │
│  • Terms Checkbox                                    │
│                                                       │
│  [Back] [Complete Secure Payment] → Step 4          │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  Step 4: Confirmation                                │
│  ─────────────────                                   │
│  ○──○──○──⬤                                          │
│                                                       │
│  ✓ Order Confirmed!                                  │
│                                                       │
│  • Order Number                                      │
│  • Package Details                                   │
│  • Installation Address                              │
│  • Payment Method                                    │
│  • Total Amount                                      │
│  • Next Steps (what happens next)                    │
│                                                       │
│  [Place Another Order] [View Dashboard]             │
└──────────────────────────────────────────────────────┘
```

---

## 🛠️ Customization

### Changing Package Data
Edit the `selectedPackage` constant in `OrderFlowJourney.tsx`:

```typescript
const selectedPackage: Package = {
  id: "fibre-100",
  name: "Fibre 100Mbps",    // ← Change package name
  speed: "100/100 Mbps",     // ← Change speed
  monthlyPrice: 799,         // ← Change pricing
  installationFee: 0,
  routerFee: 0,
  features: [                // ← Change features
    "100Mbps symmetrical speed",
    "Unlimited data",
    // Add more...
  ],
};
```

### Adding Payment Methods
Edit the `paymentMethods` array:

```typescript
const paymentMethods = [
  {
    id: "new-method",
    icon: <Icon className="w-6 h-6" />,
    label: "New Payment",
    description: "Description",
    color: "orange"
  },
  // Add more...
];
```

### Changing Provinces
Edit the `provinces` array for different regions.

---

## 🧪 Testing

### Manual Testing Checklist

**Tab 1: Account**
- [ ] Email/Password form validates correctly
- [ ] Google OAuth button displays (visual only)
- [ ] Terms checkbox is required
- [ ] Cannot proceed without valid data

**Tab 2: Service Address**
- [ ] Residential/Business toggle works
- [ ] Property type options change based on service type
- [ ] All address fields validate
- [ ] Postal code requires 4 digits

**Tab 3: Payment**
- [ ] All 9 payment methods display
- [ ] Card form appears when "Card Payment" selected
- [ ] Order summary shows correct totals
- [ ] Package and address cards display correctly
- [ ] Terms checkbox is required

**Tab 4: Confirmation**
- [ ] Success message displays
- [ ] Order details are correct
- [ ] "Place Another Order" resets demo
- [ ] All data from previous steps shown

**Navigation**
- [ ] Can click previous step buttons to go back
- [ ] Cannot click future step buttons
- [ ] Progress bar updates correctly
- [ ] Back/Continue buttons work

**Warning Banner**
- [ ] Demo warning banner is visible
- [ ] Banner clearly states this is demo-only
- [ ] Banner directs to homepage for real orders

---

## 🚀 Deployment

### Production Considerations

1. **Demo Pages are Safe**
   - No impact on production order flow
   - Can be deployed to production safely
   - Clearly marked as demo

2. **Access Control** (Optional)
   - Currently public access at `/demo/order-flow`
   - Consider adding to admin menu if you want to restrict access
   - Or leave public for customer preview

3. **SEO**
   - Add `robots.txt` entry to prevent indexing:
     ```
     User-agent: *
     Disallow: /demo/
     ```

4. **Analytics**
   - Track demo usage separately from real orders
   - Monitor user behavior in demo to improve real flow

---

## 📚 Related Documentation

- **Real Order Flow**: `docs/features/customer-journey/CONSUMER_ORDER_FLOW_2025.md`
- **OrderContext**: `components/order/context/OrderContext.tsx`
- **Payment Integration**: `components/order/stages/PaymentStage.tsx`
- **UI Components**: `/demo/ui-components`

---

## 🐛 Troubleshooting

### Demo Not Loading

**Issue**: 404 error on `/demo/order-flow`

**Solutions**:
1. Verify file exists: `app/demo/order-flow/page.tsx`
2. Check for TypeScript errors: `npm run type-check`
3. Restart dev server: `npm run dev:memory`

### Animations Not Working

**Issue**: No smooth transitions between tabs

**Solutions**:
1. Verify `framer-motion` is installed: `npm list framer-motion`
2. Check browser console for errors
3. Clear browser cache

### Styling Issues

**Issue**: Components look broken or unstyled

**Solutions**:
1. Verify Tailwind CSS is working
2. Check for CSS conflicts
3. Clear `.next` cache: `npm run clean && npm run dev:memory`

---

## 📝 Change Log

### 2025-10-26 - Initial Release
- ✅ Created OrderFlowJourney.tsx component
- ✅ Added demo page at /demo/order-flow
- ✅ Integrated with UI components demo page
- ✅ Added demo warning banner
- ✅ Verified isolation from production order flow
- ✅ Created comprehensive documentation

---

## 👥 Maintainers

- **Development Team**
- **Contact**: See project README

## 📄 License

Same as main project (CircleTel)

---

**Happy Demoing! 🎉**
