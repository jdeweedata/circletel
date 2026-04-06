import { defineType, defineField } from 'sanity';
import { ThListIcon } from '@sanity/icons';
import { blockFields } from '../objects/blockFields';

export default defineType({
  name: 'dualListBlock',
  title: 'Dual List (Managed vs DIY)',
  type: 'object',
  icon: ThListIcon,
  fields: [
    defineField({ name: 'headline', title: 'Section Headline', type: 'string' }),
    defineField({
      name: 'description',
      title: 'Section Description',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'leftColumn',
      title: 'Left Column (green check icons)',
      type: 'object',
      fields: [
        {
          name: 'label',
          type: 'string',
          title: 'Column Heading',
          validation: (Rule) => Rule.required(),
        },
        { name: 'badgeLabel', type: 'string', title: 'Badge Label' },
        {
          name: 'items',
          type: 'array',
          title: 'Items',
          of: [{ type: 'string' }],
          validation: (Rule) => Rule.min(1),
        },
      ],
    }),
    defineField({
      name: 'rightColumn',
      title: 'Right Column (grey cross icons)',
      type: 'object',
      fields: [
        {
          name: 'label',
          type: 'string',
          title: 'Column Heading',
          validation: (Rule) => Rule.required(),
        },
        { name: 'badgeLabel', type: 'string', title: 'Badge Label' },
        {
          name: 'items',
          type: 'array',
          title: 'Items',
          of: [{ type: 'string' }],
          validation: (Rule) => Rule.min(1),
        },
      ],
    }),
    ...blockFields,
  ],
  preview: {
    select: { title: 'headline' },
    prepare({ title }: { title?: string }) {
      return { title: title || 'Dual List Comparison' };
    },
  },
});
