// lib/sanity/schemas/documents/resource.ts
import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'resource',
  title: 'Resource',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'isEnabled',
      title: 'Enabled',
      type: 'boolean',
      description: 'Manual override to show/hide resource',
      initialValue: true,
    }),
    defineField({
      name: 'resourceType',
      title: 'Resource Type',
      type: 'string',
      options: {
        list: [
          { title: 'Whitepaper', value: 'whitepaper' },
          { title: 'Case Study', value: 'case-study' },
          { title: 'Guide', value: 'guide' },
          { title: 'Datasheet', value: 'datasheet' },
          { title: 'Video', value: 'video' },
          { title: 'Webinar', value: 'webinar' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'thumbnail',
      title: 'Thumbnail',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alt Text',
        },
      ],
    }),
    // Access control (app-layer enforcement)
    defineField({
      name: 'accessLevel',
      title: 'Access Level',
      type: 'string',
      options: {
        list: [
          { title: 'Public', value: 'public' },
          { title: 'Gated (email required)', value: 'gated' },
          { title: 'Partner Only', value: 'partner-only' },
        ],
      },
      initialValue: 'public',
      description: 'Note: Enforcement is in app layer, not CMS',
    }),
    defineField({
      name: 'gatingFormId',
      title: 'Gating Form ID',
      type: 'string',
      description: 'Form ID for gated content',
      hidden: ({ parent }) => parent?.accessLevel !== 'gated',
    }),
    // Content
    defineField({
      name: 'file',
      title: 'File',
      type: 'file',
      options: {
        accept: '.pdf,.docx,.xlsx,.zip',
      },
    }),
    defineField({
      name: 'externalUrl',
      title: 'External URL',
      type: 'url',
      description: 'For videos/webinars hosted externally',
    }),
    defineField({
      name: 'body',
      title: 'Body Content',
      type: 'portableText',
      description: 'For HTML-based resources',
    }),
    // Categorization
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'category' }] }],
    }),
    defineField({
      name: 'products',
      title: 'Related Products',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'productPage' }] }],
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
    }),
    defineField({
      name: 'language',
      title: 'Language',
      type: 'string',
      options: {
        list: [
          { title: 'English', value: 'en' },
          { title: 'Afrikaans', value: 'af' },
        ],
      },
      initialValue: 'en',
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      resourceType: 'resourceType',
      media: 'thumbnail',
      isEnabled: 'isEnabled',
    },
    prepare({ title, resourceType, media, isEnabled }) {
      const status = isEnabled ? '' : ' [HIDDEN]'
      return {
        title: `${title}${status}`,
        subtitle: resourceType,
        media,
      }
    },
  },
})
