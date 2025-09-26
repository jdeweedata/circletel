# CircleTel Design System

A comprehensive design system for CircleTel's digital products, built on atomic design principles with React, TypeScript, and Tailwind CSS.

## 🎯 Overview

The CircleTel Design System provides a complete set of design standards, reusable components, and documentation to ensure consistency across all digital touchpoints. It follows atomic design methodology and leverages modern web technologies for optimal developer experience.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Design Foundations](#design-foundations)
- [Component Library](#component-library)
- [Usage Guidelines](#usage-guidelines)
- [Development](#development)
- [Contributing](#contributing)

## 🚀 Getting Started

### Installation

The design system is already integrated into your CircleTel project. Import components and tokens as needed:

```typescript
// Import design tokens
import { colors, typography, spacing } from '@/design-system/tokens';

// Import components
import { Button, Card, Heading, Text } from '@/design-system';

// Import specific foundations
import { iconography } from '@/design-system/foundations/iconography';
```

### Basic Usage

```tsx
import { Button, Heading, Text, Card } from '@/design-system';

function ExampleComponent() {
  return (
    <Card className="p-6">
      <Heading level={2} variant="section">
        Welcome to CircleTel
      </Heading>
      <Text variant="body-large" color="secondary" className="mb-4">
        Your reliable telecommunications partner
      </Text>
      <Button variant="default" size="lg">
        Get Started
      </Button>
    </Card>
  );
}
```

## 🎨 Design Foundations

### Typography

Our typography system uses **Inter** as the primary font family and **Space Mono** for monospace text.

#### Hierarchy
- **Display**: `text-5xl lg:text-6xl` - Hero sections, landing pages
- **H1**: `text-4xl lg:text-5xl` - Page titles
- **H2**: `text-2xl lg:text-3xl` - Section headings
- **H3**: `text-xl lg:text-2xl` - Subsection headings
- **Body Large**: `text-lg` - Hero descriptions, important content
- **Body Medium**: `text-base` - Default body text
- **Body Small**: `text-sm` - Supporting text, captions

#### Implementation
```tsx
// Using Heading component
<Heading level={1} variant="hero">Page Title</Heading>

// Using Text component
<Text variant="body-large" color="secondary">
  Supporting description text
</Text>

// Using typography classes directly
<h2 className="text-2xl font-bold font-inter lg:text-3xl">
  Section Title
</h2>
```

### Color Palette

#### Brand Colors
- **Primary Orange**: `#F5831F` (`circleTel-orange`)
- **Dark Neutral**: `#1F2937` (`circleTel-darkNeutral`)
- **Secondary Neutral**: `#4B5563` (`circleTel-secondaryNeutral`)
- **Light Neutral**: `#E6E9EF` (`circleTel-lightNeutral`)

#### Semantic Colors
- **Success**: `text-green-600`
- **Warning**: `text-yellow-600`
- **Error**: `text-red-600`
- **Info**: `text-blue-600`

#### Usage Examples
```tsx
// Using color variants
<Text color="accent">CircleTel Orange Text</Text>
<Text color="error">Error message</Text>

// Using Tailwind classes
<div className="bg-circleTel-orange text-white">
  Brand colored background
</div>
```

### Spacing & Layout

Based on a consistent 4px scale with semantic naming:

#### Component Spacing
- **XS**: `4px` (`space-1`) - Tight internal spacing
- **SM**: `8px` (`space-2`) - Small internal spacing
- **MD**: `16px` (`space-4`) - Default internal spacing
- **LG**: `24px` (`space-6`) - Large internal spacing
- **XL**: `32px` (`space-8`) - Extra large internal spacing

#### Layout Spacing
- **Section**: `48px` (`space-12`) - Between major sections
- **Page**: `80px` (`space-20`) - Between page sections
- **Content**: `16px` (`space-4`) - Default content spacing

### Iconography

We use **Lucide React** icons with consistent sizing and semantic mapping.

#### Icon Sizes
- **XS**: `12px` (`w-3 h-3`) - Inline icons
- **SM**: `16px` (`w-4 h-4`) - Form inputs, buttons
- **MD**: `20px` (`w-5 h-5`) - Navigation, cards
- **LG**: `24px` (`w-6 h-6`) - Section headers
- **XL**: `32px` (`w-8 h-8`) - Feature highlights

#### Usage
```tsx
import { Icon } from '@/design-system';
import { Search, User, Settings } from 'lucide-react';

// Using Icon component
<Icon icon={Search} size="md" color="primary" />

// Direct Lucide icon usage
<Search className="w-5 h-5 text-circleTel-orange" />
```

## 🧩 Component Library

### Atomic Design Structure

#### Atoms (Basic Building Blocks)
- **Button** - All button variants and states
- **Input** - Text inputs, textareas, form controls
- **Text** - Typography component with variants
- **Heading** - Semantic headings (H1-H6)
- **Icon** - Standardized icon wrapper
- **Link** - Internal and external links
- **Image** - Responsive images with loading states
- **Logo** - CircleTel branding component

#### Molecules (Simple Combinations)
- **SearchField** - Search input with icon and clear button
- **FormField** - Complete form field with validation
- **Card** - Content containers with header/footer
- **ButtonGroup** - Related button groupings
- **Breadcrumbs** - Navigation breadcrumbs
- **Alert** - Status messages and notifications

#### Organisms (Complex Sections)
- **Header** - Site navigation and branding
- **Footer** - Site footer with links and info
- **HeroSection** - Landing page hero areas
- **FeatureGrid** - Product feature showcases
- **ContactForm** - Contact and lead forms
- **PricingTable** - Service pricing displays

### Component Examples

#### Button Component
```tsx
import { Button } from '@/design-system';

// Primary button
<Button variant="default" size="lg">
  Get Started
</Button>

// Secondary button
<Button variant="outline" size="md">
  Learn More
</Button>

// Icon button
<Button variant="ghost" size="icon">
  <Icon icon={Search} />
</Button>
```

#### Form Components
```tsx
import { FormField, SearchField } from '@/design-system';

// Complete form field
<FormField
  label="Email Address"
  type="email"
  required
  helpText="We'll never share your email"
  error={errors.email}
  value={email}
  onChange={setEmail}
/>

// Search field
<SearchField
  placeholder="Search products..."
  clearable
  onClear={() => setQuery('')}
/>
```

#### Card Component
```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/design-system';

<Card>
  <CardHeader>
    <CardTitle>Service Package</CardTitle>
  </CardHeader>
  <CardContent>
    <Text>Complete business connectivity solution</Text>
  </CardContent>
</Card>
```

## 📐 Usage Guidelines

### Responsive Design

All components are built mobile-first with responsive breakpoints:

- **SM**: `640px` - Small tablets
- **MD**: `768px` - Tablets
- **LG**: `1024px` - Small laptops
- **XL**: `1280px` - Desktops
- **2XL**: `1536px` - Large screens

### Accessibility

All components follow WCAG 2.1 AA guidelines:

- Semantic HTML structure
- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance
- Focus management

### Performance

- Tree-shakeable exports
- Lazy loading for heavy components
- Optimized bundle sizes
- Minimal runtime overhead

## 🛠 Development

### File Structure

```
src/design-system/
├── tokens.ts                 # Design tokens
├── foundations/
│   ├── typography.ts         # Typography scale
│   ├── spacing.ts            # Spacing system
│   └── iconography.ts        # Icon standards
├── components/
│   ├── atoms/               # Basic components
│   ├── molecules/           # Composite components
│   └── organisms/           # Complex sections
└── index.ts                 # Main exports
```

### Adding New Components

1. **Determine atomic level** (atom, molecule, or organism)
2. **Create component file** in appropriate directory
3. **Follow naming conventions** (PascalCase)
4. **Add TypeScript interfaces** for props
5. **Use CVA for variants** when applicable
6. **Export from index file**
7. **Update documentation**

### Example Component Template

```tsx
/**
 * CircleTel Design System - ComponentName
 *
 * Brief description of component purpose and usage.
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const componentVariants = cva('base-classes', {
  variants: {
    variant: {
      default: 'variant-classes',
      // Add more variants
    },
    size: {
      sm: 'size-classes',
      md: 'size-classes',
      lg: 'size-classes',
    }
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

export interface ComponentNameProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof componentVariants> {
  // Define custom props
}

export const ComponentName = React.forwardRef<HTMLDivElement, ComponentNameProps>(
  ({ variant, size, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(componentVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);

ComponentName.displayName = 'ComponentName';
```

### Testing Components

- **Unit tests** for component logic
- **Visual regression tests** for UI consistency
- **Accessibility tests** for WCAG compliance
- **Integration tests** for complex interactions

## 🤝 Contributing

### Design Changes
1. Propose changes via design reviews
2. Update design tokens if needed
3. Test across all breakpoints
4. Verify accessibility compliance

### Code Changes
1. Follow atomic design principles
2. Maintain backward compatibility
3. Add proper TypeScript types
4. Update documentation
5. Test thoroughly

### Review Process
- Design review for visual changes
- Code review for implementation
- Accessibility audit
- Performance impact assessment

## 📚 Resources

### Documentation
- [Atomic Design Methodology](https://atomicdesign.bradfrost.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Components](https://www.radix-ui.com/)
- [Lucide Icons](https://lucide.dev/)

### Tools
- **CVA**: Class Variance Authority for component variants
- **clsx**: Utility for constructing className strings
- **React Hook Form**: Form state management
- **Zod**: Schema validation

---

**Version**: 1.0.0
**Last Updated**: 2024
**Maintained by**: CircleTel Development Team