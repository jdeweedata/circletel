/**
 * South African Rand (ZAR) Icon
 *
 * Custom icon matching Phosphor Bold style.
 * SVG based on: https://www.svgrepo.com/svg/223072/south-african-rand
 */

import { cn } from '@/lib/utils';

interface RandIconProps {
  className?: string;
  size?: number;
}

export function RandIcon({ className, size = 24 }: RandIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={cn('inline-block', className)}
    >
      {/* Circle background */}
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      {/* R symbol for Rand */}
      <path
        d="M9 7h4a3 3 0 0 1 0 6h-2l4 4M9 7v10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Bold variant matching Phosphor Bold weight
 */
export function RandIconBold({ className, size = 24 }: RandIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={cn('inline-block', className)}
    >
      {/* Circle background - bold stroke */}
      <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="2.5" />
      {/* R symbol for Rand - bold stroke */}
      <path
        d="M9 7h4a3 3 0 0 1 0 6h-2l4 4M9 7v10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default RandIconBold;
