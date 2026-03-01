# Segment-Aware Homepage Implementation

**Date**: 2026-03-01
**Context**: CircleTel homepage UX/UI improvement - making components segment-aware

## Problem

CircleTel serves 3 market segments (Business, SOHO, Home) but the homepage showed the same content to all. Business users saw consumer pricing (R299) first, causing confusion and lower conversions.

## Solution Patterns

### 1. Segment State at Page Level

Keep segment state in the page component and pass down to children:

```typescript
// app/(marketing)/page.tsx
export default function Home() {
  const searchParams = useSearchParams();
  const urlSegment = searchParams.get('segment');
  const [activeSegment, setActiveSegment] = useState<SegmentType>(
    isValidSegment(urlSegment) ? urlSegment : 'home'
  );

  return (
    <>
      <NewHero activeSegment={activeSegment} onSegmentChange={handleSegmentChange} />
      <PlanCards activeSegment={activeSegment} />
      <Testimonials activeSegment={activeSegment} />
    </>
  );
}
```

### 2. URL Param Persistence (No Page Reload)

```typescript
const handleSegmentChange = useCallback((segment: SegmentType) => {
  setActiveSegment(segment);

  const url = new URL(window.location.href);
  if (segment === 'home') {
    url.searchParams.delete('segment'); // Keep default URLs clean
  } else {
    url.searchParams.set('segment', segment);
  }
  window.history.replaceState({}, '', url.toString());
}, []);
```

### 3. Controlled/Uncontrolled Component Hybrid

Support both modes for backwards compatibility:

```typescript
interface NewHeroProps {
  activeSegment?: SegmentType;
  onSegmentChange?: (segment: SegmentType) => void;
}

export function NewHero({ activeSegment: externalSegment, onSegmentChange }: NewHeroProps) {
  const [internalSegment, setInternalSegment] = useState<SegmentType>('home');
  const activeSegment = externalSegment ?? internalSegment;
  const setActiveSegment = onSegmentChange ?? setInternalSegment;
  // ... rest of component works with either mode
}
```

### 4. Segment-Specific Data Structure

Define data per segment, then select based on active:

```typescript
const BUSINESS_PLANS: Plan[] = [...];
const WFH_PLANS: Plan[] = [...];
const HOME_PLANS: Plan[] = [...];

export function PlanCards({ activeSegment = 'home' }: Props) {
  const plans = activeSegment === 'business'
    ? BUSINESS_PLANS
    : activeSegment === 'wfh'
    ? WFH_PLANS
    : HOME_PLANS;

  // Render plans
}
```

### 5. Mobile Carousel with Scroll Indicators

```typescript
// Container
<div
  ref={scrollContainerRef}
  className="overflow-x-auto snap-x snap-mandatory scrollbar-hide"
>
  {items.map(item => (
    <button className="snap-center flex-shrink-0 w-[140px]">...</button>
  ))}
</div>

// Dot indicators
<div className="flex justify-center gap-2 mt-3">
  {items.map(item => (
    <button
      className={cn(
        'w-2 h-2 rounded-full transition-all',
        active === item.id ? 'bg-orange w-4' : 'bg-gray-300'
      )}
    />
  ))}
</div>

// Auto-center on selection
useEffect(() => {
  if (!isMobile || !scrollContainerRef.current) return;
  const activeIndex = items.findIndex(i => i.id === activeSegment);
  const cardWidth = container.scrollWidth / items.length;
  container.scrollTo({
    left: activeIndex * cardWidth - (container.clientWidth - cardWidth) / 2,
    behavior: 'smooth',
  });
}, [activeSegment, isMobile]);
```

## Implementation Order

When making homepage segment-aware, follow this order (dependency chain):

1. **Page** (`page.tsx`) - Add state, URL persistence, pass props
2. **SegmentTabs** - Enhanced selector with pricing/value props
3. **NewHero** - Accept controlled props, backward compatible
4. **PlanCards** - Segment-specific plan arrays
5. **Testimonials** - Segment-specific quotes and trust metrics
6. **Landing Pages** - Create `/soho` and `/enterprise` routes

## Type Check Verification Pattern

With pre-existing type errors, filter to verify only your changes:

```bash
# Check specific paths
npm run type-check 2>&1 | grep -E "^(app/\(marketing\)|components/home/)"

# Should return empty if your changes are clean
```

## Files Modified

- `app/(marketing)/page.tsx` - Segment state + URL persistence
- `components/home/SegmentTabs.tsx` - Larger cards, mobile carousel
- `components/home/NewHero.tsx` - Controlled/uncontrolled hybrid
- `components/home/PlanCards.tsx` - Segment-aware plans
- `components/home/Testimonials.tsx` - Segment-aware testimonials

## Files Created

- `app/(marketing)/soho/page.tsx` - WorkConnect landing page
- `app/(marketing)/enterprise/page.tsx` - Enterprise solutions + contact form

## Time Savings

Next segment-aware implementation: ~60 min saved by reusing patterns.
