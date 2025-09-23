/**
 * CircleTel Design System - Molecules
 *
 * Molecules are groups of atoms that function together as a unit.
 * They represent simple combinations of atoms that have a specific purpose.
 */

// Re-export existing UI molecules from shadcn/ui
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from '@/components/ui/dropdown-menu';

export {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';

export {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

// Custom CircleTel molecules
export { SearchField } from './SearchField';
export { FormField } from './FormField';
export { IconButton } from './IconButton';
export { ButtonGroup } from './ButtonGroup';
export { StatCard } from './StatCard';
export { FeatureCard } from './FeatureCard';
export { Breadcrumbs } from './Breadcrumbs';
export { LoadingButton } from './LoadingButton';
export { EmptyState } from './EmptyState';

// Molecule type exports
export type { SearchFieldProps } from './SearchField';
export type { FormFieldProps } from './FormField';
export type { IconButtonProps } from './IconButton';
export type { ButtonGroupProps } from './ButtonGroup';
export type { StatCardProps } from './StatCard';
export type { FeatureCardProps } from './FeatureCard';
export type { BreadcrumbsProps } from './Breadcrumbs';
export type { LoadingButtonProps } from './LoadingButton';
export type { EmptyStateProps } from './EmptyState';