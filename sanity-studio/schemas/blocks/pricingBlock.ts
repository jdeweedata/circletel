import { defineType, defineField } from 'sanity';
import { TagIcon } from '@sanity/icons';

export default defineType({
  name: 'pricingBlock',
  title: 'Pricing Section',
  type: 'object',
  icon: TagIcon,
  fields: [
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow Text',
      type: 'string',
    }),
    defineField({
      name: 'headline',
      title: 'Section Headline',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Section Description',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'plans',
      title: 'Pricing Plans',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'name', type: 'string', title: 'Plan Name', validation: (Rule) => Rule.required() },
            { name: 'price', type: 'number', title: 'Monthly Price (ZAR)', validation: (Rule) => Rule.required() },
            { name: 'originalPrice', type: 'number', title: 'Original Price (for discounts)' },
            { name: 'speed', type: 'string', title: 'Speed', description: 'e.g., 50/12.5Mbps' },
            { name: 'description', type: 'text', title: 'Plan Description', rows: 2 },
            {
              name: 'features',
              type: 'array',
              title: 'Features',
              of: [{ type: 'string' }],
            },
            { name: 'isPopular', type: 'boolean', title: 'Mark as Popular', initialValue: false },
            { name: 'ctaLabel', type: 'string', title: 'Button Label', initialValue: 'Get Started' },
            { name: 'ctaUrl', type: 'string', title: 'Button URL' },
          ],
          preview: {
            select: {
              title: 'name',
              price: 'price',
              isPopular: 'isPopular',
            },
            prepare({ title, price, isPopular }) {
              return {
                title: `${title}${isPopular ? ' ⭐' : ''}`,
                subtitle: price ? `R${price}/mo` : 'No price set',
              };
            },
          },
        },
      ],
      validation: (Rule) => Rule.min(1).max(5),
    }),
    defineField({
      name: 'showComparison',
      title: 'Show Comparison Toggle',
      type: 'boolean',
      description: 'Allow users to compare plans side-by-side',
      initialValue: false,
    }),
    defineField({
      name: 'footnote',
      title: 'Footnote',
      type: 'text',
      rows: 2,
      description: 'Additional info (e.g., "All prices exclude VAT")',
    }),
  ],
  preview: {
    select: {
      title: 'headline',
      plans: 'plans',
    },
    prepare({ title, plans }) {
      return {
        title: title || 'Pricing Section',
        subtitle: `${plans?.length || 0} plans`,
      };
    },
  },
});
