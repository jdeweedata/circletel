import { defineType, defineField, defineArrayMember } from 'sanity';
import { TagIcon } from '@sanity/icons';

export default defineType({
  name: 'productPage',
  title: 'Product Page',
  type: 'document',
  icon: TagIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Product Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Product Category',
      type: 'string',
      options: {
        list: [
          { title: 'Consumer', value: 'consumer' },
          { title: 'SOHO / Work From Home', value: 'soho' },
          { title: 'Business', value: 'business' },
          { title: 'Enterprise', value: 'enterprise' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'tagline',
      title: 'Product Tagline',
      type: 'string',
      description: 'Short outcome-focused description (e.g., "Internet that works as hard as you do")',
    }),
    defineField({
      name: 'description',
      title: 'Product Description',
      type: 'portableText',
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'pricing',
      title: 'Pricing',
      type: 'object',
      fields: [
        { name: 'startingPrice', type: 'number', title: 'Starting Price (ZAR)' },
        { name: 'priceNote', type: 'string', title: 'Price Note', description: 'e.g., "per month" or "once-off"' },
        { name: 'showContactForPricing', type: 'boolean', title: 'Show "Contact for Pricing" instead' },
      ],
    }),
    defineField({
      name: 'keyFeatures',
      title: 'Key Features',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'title', type: 'string', title: 'Feature Title' },
            { name: 'description', type: 'text', title: 'Feature Description', rows: 2 },
            { name: 'icon', type: 'string', title: 'Icon Name' },
          ],
        },
      ],
    }),
    defineField({
      name: 'specifications',
      title: 'Technical Specifications',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'label', type: 'string', title: 'Spec Label' },
            { name: 'value', type: 'string', title: 'Spec Value' },
          ],
        },
      ],
    }),
    defineField({
      name: 'seo',
      title: 'SEO Settings',
      type: 'seo',
    }),
    defineField({
      name: 'blocks',
      title: 'Additional Sections',
      type: 'array',
      of: [
        // Core blocks
        defineArrayMember({ type: 'featureGridBlock' }),
        defineArrayMember({ type: 'pricingBlock' }),
        defineArrayMember({ type: 'faqBlock' }),
        defineArrayMember({ type: 'comparisonBlock' }),
        defineArrayMember({ type: 'testimonialBlock' }),
        // Content blocks
        defineArrayMember({ type: 'textBlock' }),
        defineArrayMember({ type: 'imageBlock' }),
        defineArrayMember({ type: 'ctaBlock' }),
        defineArrayMember({ type: 'formBlock' }),
        defineArrayMember({ type: 'separatorBlock' }),
        defineArrayMember({ type: 'galleryBlock' }),
      ],
    }),
    defineField({
      name: 'relatedProducts',
      title: 'Related Products',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'productPage' }],
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'name',
      category: 'category',
      media: 'heroImage',
    },
    prepare({ title, category, media }) {
      return {
        title,
        subtitle: category,
        media,
      };
    },
  },
});
