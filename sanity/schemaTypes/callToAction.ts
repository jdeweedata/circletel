import { defineField, defineType } from 'sanity'

export const callToAction = defineType({
  name: 'callToAction',
  title: 'Call To Action',
  type: 'object',
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
    }),
    defineField({
      name: 'text',
      title: 'Text',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'buttonText',
      title: 'Button Text',
      type: 'string',
    }),
    defineField({
      name: 'buttonUrl',
      title: 'Button URL',
      type: 'string',
    }),
    defineField({
      name: 'style',
      title: 'Background Style',
      type: 'string',
      options: {
        list: [
          { title: 'Brand Orange', value: 'orange' },
          { title: 'Brand Blue', value: 'blue' },
          { title: 'Dark Gray', value: 'dark' },
          { title: 'Simple White', value: 'white' },
        ]
      },
      initialValue: 'orange'
    })
  ],
  preview: {
    select: {
      title: 'heading',
      style: 'style'
    },
    prepare({ title, style }) {
      return {
        title: title || 'Call To Action',
        subtitle: `Style: ${style}`,
      }
    },
  },
})
