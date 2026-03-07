import { defineType, defineField } from 'sanity';
import { HelpCircleIcon } from '@sanity/icons';

export default defineType({
  name: 'faqBlock',
  title: 'FAQ Section',
  type: 'object',
  icon: HelpCircleIcon,
  fields: [
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow Text',
      type: 'string',
    }),
    defineField({
      name: 'headline',
      title: 'Section Headline',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Section Description',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'questions',
      title: 'FAQ Items',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'question', type: 'string', title: 'Question', validation: (Rule) => Rule.required() },
            { name: 'answer', type: 'portableText', title: 'Answer' },
            {
              name: 'category',
              type: 'string',
              title: 'Category',
              options: {
                list: [
                  { title: 'General', value: 'general' },
                  { title: 'Pricing', value: 'pricing' },
                  { title: 'Technical', value: 'technical' },
                  { title: 'Installation', value: 'installation' },
                  { title: 'Support', value: 'support' },
                ],
              },
            },
          ],
          preview: {
            select: {
              title: 'question',
              category: 'category',
            },
            prepare({ title, category }) {
              return {
                title,
                subtitle: category || 'General',
              };
            },
          },
        },
      ],
    }),
    defineField({
      name: 'showCategories',
      title: 'Show Category Tabs',
      type: 'boolean',
      description: 'Allow filtering by category',
      initialValue: false,
    }),
    defineField({
      name: 'cta',
      title: 'Still Have Questions CTA',
      type: 'cta',
    }),
  ],
  preview: {
    select: {
      title: 'headline',
      questions: 'questions',
    },
    prepare({ title, questions }) {
      return {
        title: title || 'FAQ Section',
        subtitle: `${questions?.length || 0} questions`,
      };
    },
  },
});
