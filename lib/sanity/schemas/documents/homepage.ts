import { defineType, defineField, defineArrayMember } from 'sanity';
import { HomeIcon } from '@sanity/icons';

export default defineType({
  name: 'homepage',
  title: 'Homepage',
  type: 'document',
  icon: HomeIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Internal Title',
      type: 'string',
      description: 'For internal reference only',
      initialValue: 'Homepage',
    }),
    defineField({
      name: 'seo',
      title: 'SEO Settings',
      type: 'seo',
    }),
    defineField({
      name: 'blocks',
      title: 'Page Sections',
      type: 'array',
      of: [
        // Core blocks
        defineArrayMember({ type: 'heroBlock' }),
        defineArrayMember({ type: 'featureGridBlock' }),
        defineArrayMember({ type: 'pricingBlock' }),
        defineArrayMember({ type: 'faqBlock' }),
        defineArrayMember({ type: 'comparisonBlock' }),
        defineArrayMember({ type: 'testimonialBlock' }),
        defineArrayMember({ type: 'productShowcaseBlock' }),
        // Content blocks
        defineArrayMember({ type: 'textBlock' }),
        defineArrayMember({ type: 'imageBlock' }),
        defineArrayMember({ type: 'ctaBlock' }),
        defineArrayMember({ type: 'formBlock' }),
        defineArrayMember({ type: 'separatorBlock' }),
        defineArrayMember({ type: 'galleryBlock' }),
      ],
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Homepage',
        subtitle: 'Site homepage',
      };
    },
  },
});
