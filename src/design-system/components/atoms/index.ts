/**
 * CircleTel Design System - Atoms
 *
 * Atoms are the smallest functional units in the design system.
 * They include basic HTML elements like buttons, inputs, labels, and icons.
 * Atoms are the building blocks for all larger components.
 */

// Re-export existing UI atoms from shadcn/ui
export { Button, buttonVariants } from '@/components/ui/button';
export { Input } from '@/components/ui/input';
export { Label } from '@/components/ui/label';
export { Textarea } from '@/components/ui/textarea';
export { Checkbox } from '@/components/ui/checkbox';
export { Switch } from '@/components/ui/switch';
export { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
export { Badge } from '@/components/ui/badge';
export { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
export { Separator } from '@/components/ui/separator';
export { Skeleton } from '@/components/ui/skeleton';
export { Progress } from '@/components/ui/progress';
export { Slider } from '@/components/ui/slider';

// Custom CircleTel atoms
export { default as TrustBadge } from './TrustBadge';
export { default as PromoBadge } from './PromoBadge';

// Atom type exports
export type { TrustBadgeType, TrustBadgeProps } from './TrustBadge';
export type { PromoBadgeType, PromoBadgeProps } from './PromoBadge';