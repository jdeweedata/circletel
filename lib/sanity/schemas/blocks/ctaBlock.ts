// lib/sanity/schemas/blocks/ctaBlock.ts
import { defineField, defineType } from 'sanity'
import { blockFields } from '../objects/blockFields'

export default defineType({
  name: 'ctaBlock',
  title: 'Call to Action Block',
  type: 'object',
  fields: [
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'variant',
      title: 'Variant',
      type: 'string',
      options: {
        list: [
          { title: 'Banner', value: 'banner' },
          { title: 'Card', value: 'card' },
          { title: 'Inline', value: 'inline' },
          { title: 'Split', value: 'split' },
        ],
      },
      initialValue: 'banner',
    }),
    defineField({
      name: 'primaryButton',
      title: 'Primary Button',
      type: 'cta',
    }),
    defineField({
      name: 'secondaryButton',
      title: 'Secondary Button',
      type: 'cta',
    }),
    defineField({
      name: 'backgroundImage',
      title: 'Background Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'backgroundColor',
      title: 'Background Color',
      type: 'string',
      description: 'Hex color code, e.g. #FF6B00',
    }),
    defineField({
      name: 'textColor',
      title: 'Text Color',
      type: 'string',
      options: {
        list: [
          { title: 'Light (white)', value: 'light' },
          { title: 'Dark (black)', value: 'dark' },
        ],
      },
      initialValue: 'light',
    }),
    ...blockFields,
  ],
  preview: {
    select: {
      title: 'headline',
      variant: 'variant',
    },
    prepare({ title, variant }) {
      return {
        title: 'CTA Block',
        subtitle: `${variant}: ${title || 'No headline'}`,
      }
    },
  },
})
