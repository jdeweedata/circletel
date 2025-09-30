declare module '@tabler/icons-react' {
  import { ComponentProps } from 'react';

  interface IconProps extends ComponentProps<'svg'> {
    size?: number;
    stroke?: number;
    className?: string;
  }

  // Navigation icons
  export const IconArrowLeft: React.FC<IconProps>;
  export const IconChevronLeft: React.FC<IconProps>;
  export const IconChevronRight: React.FC<IconProps>;

  // Menu icons
  export const IconMenu2: React.FC<IconProps>;
  export const IconX: React.FC<IconProps>;

  // Content icons
  export const IconBrandTabler: React.FC<IconProps>;
  export const IconSettings: React.FC<IconProps>;
  export const IconUserBolt: React.FC<IconProps>;
}