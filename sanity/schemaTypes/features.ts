import { defineField, defineType } from 'sanity'

export const features = defineType({
  name: 'features',
  title: 'Features Section',
  type: 'object',
  fields: [
    defineField({
      name: 'heading',
      title: 'Section Heading',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Section Description',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'layout',
      title: 'Layout',
      type: 'string',
      options: {
        list: [
          { title: '3 Column Grid', value: 'grid3' },
          { title: '2 Column Grid', value: 'grid2' },
          { title: 'List with Icons', value: 'list' },
        ]
      },
      initialValue: 'grid3'
    }),
    defineField({
      name: 'items',
      title: 'Feature Items',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'title', type: 'string', title: 'Title' },
            { name: 'text', type: 'text', rows: 2, title: 'Description' },
            { 
              name: 'icon', 
              type: 'string', 
              title: 'Icon Name (Lucide)',
              description: 'e.g. "Shield", "Zap", "Globe"'
            },
            { name: 'image', type: 'image', title: 'Image (Optional)' }
          ]
        }
      ]
    })
  ],
  preview: {
    select: {
      title: 'heading',
    },
    prepare({ title }) {
      return {
        title: title || 'Features Section',
        subtitle: 'Features Grid/List',
      }
    },
  },
})
