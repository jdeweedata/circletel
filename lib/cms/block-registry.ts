/**
 * CMS Page Builder - Block Registry
 *
 * Defines all available block types for the drag-and-drop page builder.
 */

import {
  Layout,
  Type,
  Image,
  MousePointer,
  Grid3X3,
  Quote,
  DollarSign,
  Video,
  Images,
  FormInput,
  Minus,
  Space,
  LucideIcon,
} from 'lucide-react';
import type {
  BlockType,
  BlockCategory,
  BlockSettings,
  HeroContent,
  TextContent,
  ImageContent,
  CTAContent,
  FeatureGridContent,
  TestimonialContent,
  PricingContent,
  VideoContent,
  GalleryContent,
  FormContent,
  DividerContent,
  SpacerContent,
} from './types';

// ============================================
// Block Definition Interface
// ============================================

export interface BlockDefinition<T = Record<string, unknown>> {
  type: BlockType;
  label: string;
  description: string;
  icon: LucideIcon;
  category: BlockCategory;
  defaultContent: T;
  defaultSettings: BlockSettings;
  thumbnail?: string;
  // Schema for validation
  contentSchema?: {
    required: string[];
    properties: Record<string, { type: string; description?: string }>;
  };
}

// ============================================
// Block Definitions
// ============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const BLOCK_DEFINITIONS: Record<BlockType, BlockDefinition<any>> = {
  hero: {
    type: 'hero',
    label: 'Hero Section',
    description: 'Large header section with headline, subline, and CTA',
    icon: Layout,
    category: 'layout',
    defaultContent: {
      headline: 'Your Headline Here',
      subheadline: 'Supporting text that explains your value proposition',
      ctaText: 'Get Started',
      ctaUrl: '#',
      backgroundType: 'gradient',
      alignment: 'center',
      variant: 'standard',
    } as HeroContent,
    defaultSettings: {
      padding: 'lg',
      animation: 'fade',
    },
    contentSchema: {
      required: ['headline'],
      properties: {
        headline: { type: 'string', description: 'Main headline text' },
        subheadline: { type: 'string', description: 'Supporting subtitle' },
        ctaText: { type: 'string', description: 'Call-to-action button text' },
        ctaUrl: { type: 'string', description: 'CTA button link' },
      },
    },
  },

  text: {
    type: 'text',
    label: 'Text Block',
    description: 'Rich text content with formatting options',
    icon: Type,
    category: 'content',
    defaultContent: {
      html: '<p>Start typing your content here...</p>',
      variant: 'paragraph',
    } as TextContent,
    defaultSettings: {
      padding: 'md',
    },
    contentSchema: {
      required: ['html'],
      properties: {
        html: { type: 'string', description: 'HTML content' },
        variant: { type: 'string', description: 'Text style variant' },
      },
    },
  },

  image: {
    type: 'image',
    label: 'Image',
    description: 'Single image with optional caption and link',
    icon: Image,
    category: 'media',
    defaultContent: {
      src: '',
      alt: 'Image description',
      caption: '',
      variant: 'full',
    } as ImageContent,
    defaultSettings: {
      padding: 'md',
    },
    contentSchema: {
      required: ['src', 'alt'],
      properties: {
        src: { type: 'string', description: 'Image URL' },
        alt: { type: 'string', description: 'Alt text for accessibility' },
        caption: { type: 'string', description: 'Image caption' },
      },
    },
  },

  cta: {
    type: 'cta',
    label: 'Call to Action',
    description: 'Prominent CTA section with buttons',
    icon: MousePointer,
    category: 'conversion',
    defaultContent: {
      headline: 'Ready to Get Started?',
      description: 'Take the next step and join thousands of satisfied customers.',
      primaryButtonText: 'Sign Up Now',
      primaryButtonUrl: '#',
      variant: 'banner',
    } as CTAContent,
    defaultSettings: {
      padding: 'lg',
      background: 'gradient',
    },
    contentSchema: {
      required: ['headline', 'primaryButtonText', 'primaryButtonUrl'],
      properties: {
        headline: { type: 'string', description: 'CTA headline' },
        description: { type: 'string', description: 'Supporting description' },
        primaryButtonText: { type: 'string', description: 'Primary button label' },
        primaryButtonUrl: { type: 'string', description: 'Primary button link' },
      },
    },
  },

  feature_grid: {
    type: 'feature_grid',
    label: 'Feature Grid',
    description: 'Grid of features with icons and descriptions',
    icon: Grid3X3,
    category: 'content',
    defaultContent: {
      columns: 3,
      features: [
        { icon: 'Zap', title: 'Fast & Reliable', description: 'Lightning-fast performance you can count on' },
        { icon: 'Shield', title: 'Secure', description: 'Enterprise-grade security for your data' },
        { icon: 'Clock', title: '24/7 Support', description: 'Round-the-clock support when you need it' },
      ],
    } as FeatureGridContent,
    defaultSettings: {
      padding: 'lg',
    },
    contentSchema: {
      required: ['columns', 'features'],
      properties: {
        columns: { type: 'number', description: 'Number of columns (2-4)' },
        features: { type: 'array', description: 'List of features' },
      },
    },
  },

  testimonial: {
    type: 'testimonial',
    label: 'Testimonial',
    description: 'Customer quotes and testimonials',
    icon: Quote,
    category: 'content',
    defaultContent: {
      testimonials: [
        {
          quote: 'This product has completely transformed our business. Highly recommended!',
          author: 'John Doe',
          role: 'CEO',
          company: 'Acme Inc',
        },
      ],
      variant: 'single',
    } as TestimonialContent,
    defaultSettings: {
      padding: 'lg',
    },
    contentSchema: {
      required: ['testimonials'],
      properties: {
        testimonials: { type: 'array', description: 'List of testimonials' },
        variant: { type: 'string', description: 'Display style' },
      },
    },
  },

  pricing: {
    type: 'pricing',
    label: 'Pricing Table',
    description: 'Pricing plans comparison',
    icon: DollarSign,
    category: 'conversion',
    defaultContent: {
      headline: 'Choose Your Plan',
      plans: [
        {
          name: 'Basic',
          price: 'R99',
          period: '/month',
          features: ['Feature 1', 'Feature 2', 'Feature 3'],
          ctaText: 'Get Started',
          ctaUrl: '#',
        },
        {
          name: 'Pro',
          price: 'R199',
          period: '/month',
          features: ['Everything in Basic', 'Feature 4', 'Feature 5', 'Priority Support'],
          ctaText: 'Get Started',
          ctaUrl: '#',
          highlighted: true,
        },
        {
          name: 'Enterprise',
          price: 'Custom',
          features: ['Everything in Pro', 'Custom integrations', 'Dedicated support'],
          ctaText: 'Contact Us',
          ctaUrl: '#',
        },
      ],
      variant: 'cards',
    } as PricingContent,
    defaultSettings: {
      padding: 'lg',
    },
    contentSchema: {
      required: ['plans'],
      properties: {
        headline: { type: 'string', description: 'Section headline' },
        plans: { type: 'array', description: 'Pricing plans' },
      },
    },
  },

  video: {
    type: 'video',
    label: 'Video',
    description: 'Embedded video from YouTube or Vimeo',
    icon: Video,
    category: 'media',
    defaultContent: {
      url: '',
      platform: 'youtube',
      title: 'Video Title',
      autoplay: false,
    } as VideoContent,
    defaultSettings: {
      padding: 'md',
    },
    contentSchema: {
      required: ['url'],
      properties: {
        url: { type: 'string', description: 'Video URL' },
        platform: { type: 'string', description: 'Video platform' },
        title: { type: 'string', description: 'Video title' },
      },
    },
  },

  gallery: {
    type: 'gallery',
    label: 'Image Gallery',
    description: 'Multiple images in grid or carousel',
    icon: Images,
    category: 'media',
    defaultContent: {
      images: [],
      layout: 'grid',
      columns: 3,
    } as GalleryContent,
    defaultSettings: {
      padding: 'md',
    },
    contentSchema: {
      required: ['images'],
      properties: {
        images: { type: 'array', description: 'Gallery images' },
        layout: { type: 'string', description: 'Gallery layout style' },
      },
    },
  },

  form: {
    type: 'form',
    label: 'Form',
    description: 'Contact form or lead generation form',
    icon: FormInput,
    category: 'conversion',
    defaultContent: {
      formType: 'contact',
      fields: [
        { name: 'name', type: 'text', label: 'Name', required: true },
        { name: 'email', type: 'email', label: 'Email', required: true },
        { name: 'message', type: 'textarea', label: 'Message', required: false },
      ],
      submitText: 'Send Message',
      successMessage: 'Thank you for your message! We will get back to you soon.',
    } as FormContent,
    defaultSettings: {
      padding: 'lg',
    },
    contentSchema: {
      required: ['formType', 'fields', 'submitText'],
      properties: {
        formType: { type: 'string', description: 'Type of form' },
        fields: { type: 'array', description: 'Form fields' },
        submitText: { type: 'string', description: 'Submit button text' },
      },
    },
  },

  divider: {
    type: 'divider',
    label: 'Divider',
    description: 'Visual separator between sections',
    icon: Minus,
    category: 'utility',
    defaultContent: {
      style: 'line',
      width: 'full',
    } as DividerContent,
    defaultSettings: {
      padding: 'sm',
    },
    contentSchema: {
      required: [],
      properties: {
        style: { type: 'string', description: 'Divider style' },
        width: { type: 'string', description: 'Divider width' },
      },
    },
  },

  spacer: {
    type: 'spacer',
    label: 'Spacer',
    description: 'Vertical spacing between blocks',
    icon: Space,
    category: 'utility',
    defaultContent: {
      size: 'md',
    } as SpacerContent,
    defaultSettings: {
      padding: 'none',
    },
    contentSchema: {
      required: ['size'],
      properties: {
        size: { type: 'string', description: 'Spacer size' },
      },
    },
  },
};

// ============================================
// Block Categories
// ============================================

export const BLOCK_CATEGORIES: Record<BlockCategory, { label: string; description: string }> = {
  layout: {
    label: 'Layout',
    description: 'Structure and layout blocks',
  },
  content: {
    label: 'Content',
    description: 'Text and content blocks',
  },
  media: {
    label: 'Media',
    description: 'Images, videos, and galleries',
  },
  conversion: {
    label: 'Conversion',
    description: 'CTAs, forms, and pricing',
  },
  utility: {
    label: 'Utility',
    description: 'Dividers and spacers',
  },
};

// ============================================
// Helper Functions
// ============================================

/**
 * Get all blocks grouped by category
 */
export function getBlocksByCategory(): Record<BlockCategory, BlockDefinition[]> {
  const categories: Record<BlockCategory, BlockDefinition[]> = {
    layout: [],
    content: [],
    media: [],
    conversion: [],
    utility: [],
  };

  Object.values(BLOCK_DEFINITIONS).forEach((block) => {
    categories[block.category].push(block);
  });

  return categories;
}

/**
 * Get a block definition by type
 */
export function getBlockDefinition(type: BlockType): BlockDefinition | undefined {
  return BLOCK_DEFINITIONS[type];
}

/**
 * Create a new block instance with default content
 */
export function createBlock(type: BlockType, customContent?: Record<string, unknown>): {
  id: string;
  type: BlockType;
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
} {
  const definition = BLOCK_DEFINITIONS[type];
  if (!definition) {
    throw new Error(`Unknown block type: ${type}`);
  }

  return {
    id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    content: { ...definition.defaultContent, ...customContent },
    settings: { ...definition.defaultSettings },
  };
}

/**
 * Validate block content against schema
 */
export function validateBlockContent(
  type: BlockType,
  content: Record<string, unknown>
): { valid: boolean; errors: string[] } {
  const definition = BLOCK_DEFINITIONS[type];
  if (!definition || !definition.contentSchema) {
    return { valid: true, errors: [] };
  }

  const errors: string[] = [];
  const { required } = definition.contentSchema;

  // Check required fields
  required.forEach((field) => {
    if (content[field] === undefined || content[field] === null || content[field] === '') {
      errors.push(`${field} is required`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get all available block types
 */
export function getAllBlockTypes(): BlockType[] {
  return Object.keys(BLOCK_DEFINITIONS) as BlockType[];
}
