import { defineType, defineField } from 'sanity';
import { HomeIcon } from '@sanity/icons';

export default defineType({
  name: 'heroBlock',
  title: 'Hero Section',
  type: 'object',
  icon: HomeIcon,
  fields: [
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow Text',
      type: 'string',
      description: 'Small text above the headline (e.g., "NEW" or "SPECIAL OFFER")',
    }),
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'subheadline',
      title: 'Subheadline',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'backgroundImage',
      title: 'Background Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'primaryCta',
      title: 'Primary Button',
      type: 'cta',
    }),
    defineField({
      name: 'secondaryCta',
      title: 'Secondary Button',
      type: 'cta',
    }),
    defineField({
      name: 'trustBadges',
      title: 'Trust Badges',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'text', type: 'string', title: 'Badge Text' },
            { name: 'icon', type: 'string', title: 'Icon Name', description: 'e.g., check, shield, clock' },
          ],
        },
      ],
    }),
    defineField({
      name: 'variant',
      title: 'Hero Variant',
      type: 'string',
      options: {
        list: [
          { title: 'Full Width', value: 'fullWidth' },
          { title: 'Split (Image Right)', value: 'splitRight' },
          { title: 'Split (Image Left)', value: 'splitLeft' },
          { title: 'Centered', value: 'centered' },
        ],
      },
      initialValue: 'fullWidth',
    }),
  ],
  preview: {
    select: {
      title: 'headline',
      media: 'backgroundImage',
    },
    prepare({ title, media }) {
      return {
        title: title || 'Hero Section',
        subtitle: 'Hero',
        media,
      };
    },
  },
});
