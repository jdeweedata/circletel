import React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const cardVariants = cva(
  "rounded-lg bg-card text-card-foreground transition-all duration-300 cursor-pointer",
  {
    variants: {
      variant: {
        default: "border bg-white shadow-sm hover:shadow-md",
        elevated: "border bg-white shadow-lg hover:shadow-xl transform hover:-translate-y-1",
        tier: "border-2 bg-white shadow-md hover:shadow-lg transform hover:scale-105",
        featured: "border-2 border-circleTel-orange bg-gradient-to-br from-white to-orange-50 shadow-lg hover:shadow-xl transform hover:scale-105",
        recipe: "border bg-white shadow-md hover:shadow-lg transform hover:scale-102 hover:-translate-y-0.5",
        promo: "border-2 border-circleTel-orange bg-gradient-to-br from-orange-50 to-white shadow-lg hover:shadow-xl animate-pulse",
      },
      tier: {
        basic: "border-blue-200 hover:border-blue-400 hover:bg-blue-50",
        advanced: "border-purple-200 hover:border-purple-400 hover:bg-purple-50",
        scale: "border-green-200 hover:border-green-400 hover:bg-green-50",
      },
      size: {
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface EnhancedCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  ribbon?: {
    text: string;
    color?: 'orange' | 'blue' | 'purple' | 'green' | 'red';
  };
  glow?: boolean;
  interactive?: boolean;
}

const ribbonColors = {
  orange: 'bg-circleTel-orange',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  green: 'bg-green-500',
  red: 'bg-red-500',
};

const EnhancedCard = React.forwardRef<HTMLDivElement, EnhancedCardProps>(
  ({ className, variant, tier, size, ribbon, glow = false, interactive = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ variant, tier, size }),
          glow && "ring-2 ring-circleTel-orange/20 ring-offset-2",
          !interactive && "cursor-default transform-none hover:transform-none",
          "relative overflow-hidden",
          className
        )}
        {...props}
      >
        {ribbon && (
          <div className={cn(
            "absolute top-0 right-0 text-white text-xs font-bold py-1 px-3 rounded-bl-lg z-10",
            ribbonColors[ribbon.color || 'orange']
          )}>
            {ribbon.text}
          </div>
        )}
        {children}
      </div>
    );
  }
);
EnhancedCard.displayName = "EnhancedCard";

// Enhanced Card Header with tier colors
const EnhancedCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { tier?: 'basic' | 'advanced' | 'scale' }
>(({ className, tier, ...props }, ref) => {
  const tierColors = {
    basic: 'border-b border-blue-100',
    advanced: 'border-b border-purple-100',
    scale: 'border-b border-green-100',
  };

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col space-y-1.5 p-6",
        tier && tierColors[tier],
        className
      )}
      {...props}
    />
  );
});
EnhancedCardHeader.displayName = "EnhancedCardHeader";

// Enhanced Card Title with tier colors
const EnhancedCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & { tier?: 'basic' | 'advanced' | 'scale' }
>(({ className, tier, ...props }, ref) => {
  const tierColors = {
    basic: 'text-blue-600',
    advanced: 'text-purple-600',
    scale: 'text-green-600',
  };

  return (
    <h3
      ref={ref}
      className={cn(
        "text-2xl font-semibold leading-none tracking-tight",
        tier && tierColors[tier],
        className
      )}
      {...props}
    />
  );
});
EnhancedCardTitle.displayName = "EnhancedCardTitle";

const EnhancedCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
EnhancedCardContent.displayName = "EnhancedCardContent";

const EnhancedCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
EnhancedCardFooter.displayName = "EnhancedCardFooter";

export {
  EnhancedCard,
  EnhancedCardHeader,
  EnhancedCardFooter,
  EnhancedCardTitle,
  EnhancedCardContent,
  cardVariants,
};