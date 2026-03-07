// lib/sanity/schemas/objects/link.ts
import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'link',
  title: 'Link',
  type: 'object',
  fields: [
    defineField({
      name: 'linkType',
      title: 'Link Type',
      type: 'string',
      options: {
        list: [
          { title: 'Internal', value: 'internal' },
          { title: 'External', value: 'external' },
        ],
      },
      initialValue: 'internal',
    }),
    defineField({
      name: 'internalLink',
      title: 'Internal Page',
      type: 'reference',
      to: [
        { type: 'page' },
        { type: 'productPage' },
        { type: 'post' },
        { type: 'resource' },
      ],
      hidden: ({ parent }) => parent?.linkType !== 'internal',
    }),
    defineField({
      name: 'externalUrl',
      title: 'External URL',
      type: 'url',
      hidden: ({ parent }) => parent?.linkType !== 'external',
    }),
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
    }),
    defineField({
      name: 'openInNewTab',
      title: 'Open in New Tab',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'utmSource',
      title: 'UTM Source',
      type: 'string',
      description: 'For tracking',
    }),
  ],
  preview: {
    select: {
      label: 'label',
      linkType: 'linkType',
    },
    prepare({ label, linkType }) {
      return {
        title: label || 'Link',
        subtitle: linkType,
      }
    },
  },
})
