/**
 * CircleTel Design System - Iconography Foundation
 *
 * Defines icon standards, sizing, usage guidelines, and semantic mappings
 * for the CircleTel application. Uses Lucide React icons as the primary icon library.
 */

// Icon Size Standards
export const iconSizes = {
  xs: '12px',      // 0.75rem - Small inline icons
  sm: '16px',      // 1rem - Default inline icons, form inputs
  md: '20px',      // 1.25rem - Button icons, navigation
  lg: '24px',      // 1.5rem - Section headers, cards
  xl: '32px',      // 2rem - Page headers, hero sections
  '2xl': '40px',   // 2.5rem - Feature highlights
  '3xl': '48px',   // 3rem - Landing page features
  '4xl': '64px',   // 4rem - Hero icons, empty states
} as const;

// Icon sizing classes for Tailwind
export const iconClasses = {
  xs: 'w-3 h-3',      // 12px
  sm: 'w-4 h-4',      // 16px
  md: 'w-5 h-5',      // 20px
  lg: 'w-6 h-6',      // 24px
  xl: 'w-8 h-8',      // 32px
  '2xl': 'w-10 h-10', // 40px
  '3xl': 'w-12 h-12', // 48px
  '4xl': 'w-16 h-16', // 64px
} as const;

// Semantic Icon Mapping
// Maps business concepts to specific Lucide icons for consistency
export const semanticIcons = {
  // Navigation & Actions
  menu: 'Menu',
  close: 'X',
  back: 'ArrowLeft',
  forward: 'ArrowRight',
  up: 'ArrowUp',
  down: 'ArrowDown',
  expand: 'ChevronDown',
  collapse: 'ChevronUp',
  external: 'ExternalLink',
  home: 'Home',

  // Content & Communication
  add: 'Plus',
  remove: 'Minus',
  delete: 'Trash2',
  edit: 'Edit',
  copy: 'Copy',
  share: 'Share',
  save: 'Save',
  download: 'Download',
  upload: 'Upload',
  search: 'Search',
  filter: 'Filter',
  sort: 'ArrowUpDown',

  // User & Account
  user: 'User',
  users: 'Users',
  profile: 'UserCircle',
  login: 'LogIn',
  logout: 'LogOut',
  account: 'Settings',

  // Business & Services
  business: 'Building2',
  office: 'Building',
  enterprise: 'Factory',
  support: 'Headphones',
  phone: 'Phone',
  email: 'Mail',
  chat: 'MessageCircle',
  contact: 'Contact',

  // Technology & Connectivity
  wifi: 'Wifi',
  network: 'Network',
  server: 'Server',
  cloud: 'Cloud',
  database: 'Database',
  security: 'Shield',
  lock: 'Lock',
  unlock: 'Unlock',
  key: 'Key',
  monitor: 'Monitor',
  laptop: 'Laptop',
  smartphone: 'Smartphone',
  tablet: 'Tablet',

  // Status & Feedback
  success: 'CheckCircle',
  error: 'XCircle',
  warning: 'AlertTriangle',
  info: 'Info',
  help: 'HelpCircle',
  question: 'CircleHelp',
  notification: 'Bell',
  star: 'Star',
  heart: 'Heart',
  thumbsUp: 'ThumbsUp',
  thumbsDown: 'ThumbsDown',

  // Files & Documents
  file: 'File',
  document: 'FileText',
  image: 'Image',
  video: 'Video',
  audio: 'Music',
  pdf: 'FileText',
  folder: 'Folder',
  archive: 'Archive',

  // E-commerce & Pricing
  cart: 'ShoppingCart',
  payment: 'CreditCard',
  currency: 'DollarSign',
  price: 'Tag',
  discount: 'Percent',
  gift: 'Gift',

  // Time & Calendar
  calendar: 'Calendar',
  clock: 'Clock',
  timer: 'Timer',
  schedule: 'CalendarDays',

  // Location & Geography
  location: 'MapPin',
  globe: 'Globe',
  map: 'Map',

  // Analytics & Data
  chart: 'BarChart3',
  analytics: 'TrendingUp',
  report: 'FileBarChart',
  dashboard: 'LayoutDashboard',

  // Settings & Configuration
  settings: 'Settings',
  config: 'Cog',
  tools: 'Wrench',
  customize: 'Palette',

  // Social & Sharing
  facebook: 'Facebook',
  twitter: 'Twitter',
  linkedin: 'Linkedin',
  instagram: 'Instagram',
  youtube: 'Youtube',
  github: 'Github',
} as const;

// Icon Usage Context
export const iconUsage = {
  // Button Icons
  button: {
    size: 'sm',           // Default button icon size
    position: 'leading',  // Default position in button
    spacing: 'gap-2',     // Space between icon and text
  },

  // Navigation Icons
  navigation: {
    size: 'md',
    activeColor: 'text-circleTel-orange',
    inactiveColor: 'text-muted-foreground',
  },

  // Form Icons
  form: {
    input: {
      size: 'sm',
      position: 'leading',
      color: 'text-muted-foreground',
    },
    validation: {
      success: { icon: 'CheckCircle', color: 'text-green-600', size: 'sm' },
      error: { icon: 'XCircle', color: 'text-red-600', size: 'sm' },
      warning: { icon: 'AlertTriangle', color: 'text-yellow-600', size: 'sm' },
    },
  },

  // Card Icons
  card: {
    size: 'lg',
    position: 'header',
    color: 'text-circleTel-orange',
  },

  // Status Icons
  status: {
    online: { icon: 'CheckCircle', color: 'text-green-600' },
    offline: { icon: 'XCircle', color: 'text-red-600' },
    pending: { icon: 'Clock', color: 'text-yellow-600' },
    maintenance: { icon: 'Wrench', color: 'text-blue-600' },
  },

  // Feature Icons
  feature: {
    size: '2xl',
    color: 'text-circleTel-orange',
    background: 'bg-circleTel-orange/10',
    padding: 'p-3',
    rounded: 'rounded-lg',
  },
} as const;

// Icon Accessibility Guidelines
export const iconAccessibility = {
  // ARIA labels for common icons
  ariaLabels: {
    menu: 'Open menu',
    close: 'Close',
    search: 'Search',
    user: 'User profile',
    settings: 'Settings',
    help: 'Help',
    home: 'Home',
    back: 'Go back',
    next: 'Go forward',
    expand: 'Expand section',
    collapse: 'Collapse section',
    external: 'Open in new window',
    download: 'Download file',
    edit: 'Edit item',
    delete: 'Delete item',
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Information',
  },

  // When to use aria-hidden="true"
  decorative: [
    'Icons that are purely decorative and next to text that explains the action',
    'Icons in buttons where the button text already describes the action',
    'Icons that are part of a larger interactive element with descriptive text',
  ],

  // When to provide aria-label or aria-labelledby
  meaningful: [
    'Icon-only buttons',
    'Icons that convey status or state',
    'Icons that are the only way to understand the content',
    'Interactive icons without accompanying text',
  ],
} as const;

// Color Guidelines for Icons
export const iconColors = {
  // Primary brand colors
  primary: 'text-circleTel-orange',
  primarySubdued: 'text-circleTel-orange/70',

  // Semantic colors
  success: 'text-green-600',
  warning: 'text-yellow-600',
  error: 'text-red-600',
  info: 'text-blue-600',

  // Neutral colors
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  subtle: 'text-muted-foreground/70',
  inverse: 'text-white',

  // Interactive states
  interactive: 'text-muted-foreground hover:text-circleTel-orange transition-colors',
  active: 'text-circleTel-orange',
  disabled: 'text-muted-foreground/50',
} as const;

// Animation Guidelines for Icons
export const iconAnimations = {
  // Hover animations
  hover: {
    scale: 'hover:scale-110 transition-transform duration-200',
    rotate: 'hover:rotate-12 transition-transform duration-200',
    bounce: 'hover:animate-bounce',
  },

  // Loading animations
  loading: {
    spin: 'animate-spin',
    pulse: 'animate-pulse',
    bounce: 'animate-bounce',
  },

  // State transitions
  transition: {
    color: 'transition-colors duration-200',
    transform: 'transition-transform duration-200',
    all: 'transition-all duration-200',
  },
} as const;

// Export combined iconography system
export const iconography = {
  sizes: iconSizes,
  classes: iconClasses,
  semantic: semanticIcons,
  usage: iconUsage,
  accessibility: iconAccessibility,
  colors: iconColors,
  animations: iconAnimations,
} as const;

export type IconSize = keyof typeof iconSizes;
export type SemanticIcon = keyof typeof semanticIcons;
export type IconColor = keyof typeof iconColors;