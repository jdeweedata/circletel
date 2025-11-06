import { defineField, defineType } from 'sanity'

export const category = defineType({
  name: 'category',
  title: 'Category',
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
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'color',
      title: 'Color',
      type: 'string',
      options: {
        list: [
          { title: 'Orange (CircleTel Primary)', value: '#F5831F' },
          { title: 'Blue', value: '#1E4B85' },
          { title: 'Green', value: '#10B981' },
          { title: 'Red', value: '#EF4444' },
          { title: 'Purple', value: '#8B5CF6' },
          { title: 'Gray', value: '#6B7280' },
        ],
      },
      initialValue: '#F5831F',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'description',
    },
  },
})