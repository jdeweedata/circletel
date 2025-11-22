import { defineField, defineType } from 'sanity'

export const hero = defineType({
  name: 'hero',
  title: 'Hero Section',
  type: 'object',
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'subheading',
      title: 'Subheading',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'image',
      title: 'Hero Image',
      type: 'image',
      options: { hotspot: true },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative text',
        }
      ]
    }),
    defineField({
      name: 'layout',
      title: 'Layout Style',
      type: 'string',
      options: {
        list: [
          { title: 'Center Aligned', value: 'center' },
          { title: 'Image Right, Text Left', value: 'imageRight' },
          { title: 'Image Left, Text Right', value: 'imageLeft' },
        ],
      },
      initialValue: 'center',
    }),
    defineField({
      name: 'actions',
      title: 'Call to Actions',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'label', type: 'string', title: 'Label' },
            { name: 'url', type: 'string', title: 'URL' },
            { 
              name: 'style', 
              type: 'string', 
              options: { 
                list: [
                  { title: 'Primary (Orange)', value: 'primary' }, 
                  { title: 'Secondary (Blue)', value: 'secondary' },
                  { title: 'Outline', value: 'outline' }
                ] 
              },
              initialValue: 'primary'
            }
          ]
        }
      ]
    }),
  ],
  preview: {
    select: {
      title: 'heading',
      media: 'image',
    },
    prepare({ title, media }) {
      return {
        title: title || 'Hero Section',
        subtitle: 'Hero Component',
        media,
      }
    },
  },
})
