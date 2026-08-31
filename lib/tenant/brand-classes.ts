/**
 * Brand color utility classes. New UI must import these instead of
 * hard-coding circleTel-* tokens in app/components/lib.
 */
export const brandText = {
  navy: 'text-circleTel-navy',
  orange: 'text-circleTel-orange',
  orangeAccessible: 'text-circleTel-orange-accessible',
  grey600: 'text-circleTel-grey600',
} as const;

export const brandBg = {
  orange: 'bg-circleTel-orange',
  orangeHover: 'hover:bg-circleTel-orange-dark',
  navyHover: 'hover:bg-circleTel-navy',
} as const;

export const brandBorder = {
  navy: 'border-circleTel-navy',
  orange: 'border-circleTel-orange',
  navyHover: 'hover:border-circleTel-navy',
} as const;

export const brandRing = {
  orange: 'focus-visible:ring-circleTel-orange',
} as const;
