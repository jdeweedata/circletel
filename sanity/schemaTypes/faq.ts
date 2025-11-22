import { defineField, defineType } from 'sanity'

export const faq = defineType({
  name: 'faq',
  title: 'FAQ Section',
  type: 'object',
  fields: [
    defineField({
      name: 'heading',
      title: 'Section Heading',
      type: 'string',
      initialValue: 'Frequently Asked Questions'
    }),
    defineField({
      name: 'items',
      title: 'Questions',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'question', type: 'string', title: 'Question' },
            { name: 'answer', type: 'text', rows: 3, title: 'Answer' },
          ]
        }
      ]
    })
  ],
  preview: {
    select: {
      title: 'heading',
      items: 'items'
    },
    prepare({ title, items }) {
      return {
        title: title || 'FAQ Section',
        subtitle: `${items?.length || 0} questions`,
      }
    },
  },
})
