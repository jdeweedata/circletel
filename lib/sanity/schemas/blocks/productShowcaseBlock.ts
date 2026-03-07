import { defineType, defineField } from 'sanity';
import { PackageIcon } from '@sanity/icons';
import { blockFields } from '../objects/blockFields';

export default defineType({
  name: 'productShowcaseBlock',
  title: 'Product Showcase',
  type: 'object',
  icon: PackageIcon,
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
      name: 'products',
      title: 'Products',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'productPage' }],
        },
      ],
      description: 'Select products to showcase',
    }),
    defineField({
      name: 'variant',
      title: 'Display Variant',
      type: 'string',
      options: {
        list: [
          { title: 'Cards Grid', value: 'grid' },
          { title: 'Featured List', value: 'list' },
          { title: 'Carousel', value: 'carousel' },
        ],
      },
      initialValue: 'grid',
    }),
    defineField({
      name: 'cta',
      title: 'View All CTA',
      type: 'cta',
    }),
    ...blockFields,
  ],
  preview: {
    select: {
      title: 'headline',
      products: 'products',
    },
    prepare({ title, products }) {
      return {
        title: title || 'Product Showcase',
        subtitle: `${products?.length || 0} products`,
      };
    },
  },
});
