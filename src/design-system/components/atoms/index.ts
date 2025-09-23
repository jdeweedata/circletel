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
export { Icon } from './Icon';
export { Text } from './Text';
export { Heading } from './Heading';
export { Link } from './Link';
export { Image } from './Image';
export { Logo } from './Logo';
export { Spinner } from './Spinner';

// Atom type exports
export type { IconProps } from './Icon';
export type { TextProps } from './Text';
export type { HeadingProps } from './Heading';
export type { LinkProps } from './Link';
export type { ImageProps } from './Image';
export type { LogoProps } from './Logo';
export type { SpinnerProps } from './Spinner';