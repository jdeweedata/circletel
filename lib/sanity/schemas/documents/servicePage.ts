import { defineType, defineField, defineArrayMember } from 'sanity';
import { ComponentIcon } from '@sanity/icons';

export default defineType({
  name: 'servicePage',
  title: 'Service Page',
  type: 'document',
  icon: ComponentIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Service Name',
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
      title: 'Service Category',
      type: 'string',
      options: {
        list: [
          { title: 'Connectivity', value: 'connectivity' },
          { title: 'Cloud', value: 'cloud' },
          { title: 'Security', value: 'security' },
          { title: 'Managed Services', value: 'managed' },
        ],
      },
    }),
    defineField({
      name: 'tagline',
      title: 'Service Tagline',
      type: 'string',
      description: 'Outcome-focused short description',
    }),
    defineField({
      name: 'description',
      title: 'Service Description',
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
      name: 'benefits',
      title: 'Key Benefits',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'title', type: 'string', title: 'Benefit Title' },
            { name: 'description', type: 'text', title: 'Benefit Description', rows: 2 },
            { name: 'icon', type: 'string', title: 'Icon Name' },
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
