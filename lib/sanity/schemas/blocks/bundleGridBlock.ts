import { defineType, defineField, defineArrayMember } from 'sanity';
import { ComponentIcon } from '@sanity/icons';
import { blockFields } from '../objects/blockFields';

export default defineType({
  name: 'bundleGridBlock',
  title: 'Bundle Grid',
  type: 'object',
  icon: ComponentIcon,
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow Text', type: 'string' }),
    defineField({ name: 'headline', title: 'Section Headline', type: 'string' }),
    defineField({
      name: 'description',
      title: 'Section Description',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'bundles',
      title: 'Bundles',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            {
              name: 'name',
              type: 'string',
              title: 'Bundle Name',
              validation: (Rule) => Rule.required(),
            },
            { name: 'tagline', type: 'string', title: 'Tagline' },
            { name: 'badge', type: 'string', title: 'Badge Label' },
            {
              name: 'badgeColor',
              type: 'string',
              title: 'Badge Colour',
              options: {
                list: [
                  { title: 'Orange (Primary)', value: 'primary' },
                  { title: 'Blue (Secondary)', value: 'secondary' },
                  { title: 'Navy', value: 'navy' },
                  { title: 'Purple', value: 'purple' },
                ],
              },
              initialValue: 'primary',
            },
            {
              name: 'icon',
              type: 'string',
              title: 'Material Symbols Icon Name',
              description: 'e.g. smartphone, corporate_fare, local_shipping',
            },
            {
              name: 'priceFrom',
              type: 'string',
              title: 'Price Label',
              description: 'e.g. "From R455"',
            },
            {
              name: 'priceSuffix',
              type: 'string',
              title: 'Price Suffix',
              description: 'e.g. "/mo"',
            },
            {
              name: 'features',
              type: 'array',
              title: 'Features',
              of: [{ type: 'string' }],
            },
            { name: 'ctaLabel', type: 'string', title: 'CTA Button Label' },
            { name: 'ctaUrl', type: 'string', title: 'CTA Button URL' },
            {
              name: 'featured',
              type: 'boolean',
              title: 'Featured Card',
              description: 'Highlighted with orange border and floating badge',
              initialValue: false,
            },
          ],
          preview: {
            select: {
              title: 'name',
              subtitle: 'badge',
              featured: 'featured',
            },
            prepare({ title, subtitle, featured }: { title?: string; subtitle?: string; featured?: boolean }) {
              return { title: `${title || '(Untitled Bundle)'}${featured ? ' ⭐' : ''}`, subtitle: subtitle || 'No badge' };
            },
          },
        }),
      ],
      validation: (Rule) => Rule.min(1).max(6),
    }),
    defineField({
      name: 'columns',
      title: 'Grid Columns',
      type: 'number',
      options: {
        list: [
          { title: '2 Columns', value: 2 },
          { title: '3 Columns', value: 3 },
          { title: '4 Columns', value: 4 },
        ],
      },
      initialValue: 4,
    }),
    ...blockFields,
  ],
  preview: {
    select: { title: 'headline', bundles: 'bundles' },
    prepare({ title, bundles }: { title?: string; bundles?: unknown[] }) {
      return {
        title: title || 'Bundle Grid',
        subtitle: `${bundles?.length ?? 0} bundles`,
      };
    },
  },
});
