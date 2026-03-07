import { defineType, defineField, defineArrayMember } from 'sanity';
import { BookIcon } from '@sanity/icons';

export default defineType({
  name: 'resourcePage',
  title: 'Resource Page',
  type: 'document',
  icon: BookIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Resource Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'resourceType',
      title: 'Resource Type',
      type: 'string',
      options: {
        list: [
          { title: 'Guide', value: 'guide' },
          { title: 'How-To', value: 'how-to' },
          { title: 'FAQ', value: 'faq' },
          { title: 'Case Study', value: 'case-study' },
          { title: 'Whitepaper', value: 'whitepaper' },
        ],
      },
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      description: 'Brief summary for listings and SEO',
    }),
    defineField({
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'portableText',
    }),
    defineField({
      name: 'downloadFile',
      title: 'Downloadable File',
      type: 'file',
      description: 'For whitepapers, PDFs, etc.',
    }),
    defineField({
      name: 'seo',
      title: 'SEO Settings',
      type: 'seo',
    }),
    defineField({
      name: 'relatedResources',
      title: 'Related Resources',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'resourcePage' }],
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      resourceType: 'resourceType',
      media: 'featuredImage',
    },
    prepare({ title, resourceType, media }) {
      return {
        title,
        subtitle: resourceType,
        media,
      };
    },
  },
});
