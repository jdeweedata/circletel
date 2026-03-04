import { defineType, defineField } from 'sanity';
import { ThListIcon } from '@sanity/icons';

export default defineType({
  name: 'comparisonBlock',
  title: 'Comparison Table',
  type: 'object',
  icon: ThListIcon,
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
      name: 'columns',
      title: 'Comparison Columns',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'name', type: 'string', title: 'Column Name', validation: (Rule) => Rule.required() },
            { name: 'isHighlighted', type: 'boolean', title: 'Highlight Column', initialValue: false },
            { name: 'price', type: 'string', title: 'Price Label' },
          ],
          preview: {
            select: {
              title: 'name',
              isHighlighted: 'isHighlighted',
            },
            prepare({ title, isHighlighted }) {
              return {
                title: `${title}${isHighlighted ? ' ⭐' : ''}`,
              };
            },
          },
        },
      ],
      validation: (Rule) => Rule.min(2).max(5),
    }),
    defineField({
      name: 'rows',
      title: 'Feature Rows',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'feature', type: 'string', title: 'Feature Name', validation: (Rule) => Rule.required() },
            { name: 'tooltip', type: 'string', title: 'Tooltip/Help Text' },
            {
              name: 'values',
              type: 'array',
              title: 'Values per Column',
              of: [
                {
                  type: 'object',
                  fields: [
                    {
                      name: 'type',
                      type: 'string',
                      title: 'Value Type',
                      options: {
                        list: [
                          { title: 'Check (Yes)', value: 'check' },
                          { title: 'Cross (No)', value: 'cross' },
                          { title: 'Text', value: 'text' },
                        ],
                      },
                    },
                    { name: 'text', type: 'string', title: 'Text Value', hidden: ({ parent }) => parent?.type !== 'text' },
                  ],
                },
              ],
            },
          ],
          preview: {
            select: {
              title: 'feature',
            },
          },
        },
      ],
    }),
    defineField({
      name: 'footnote',
      title: 'Footnote',
      type: 'text',
      rows: 2,
    }),
  ],
  preview: {
    select: {
      title: 'headline',
      columns: 'columns',
      rows: 'rows',
    },
    prepare({ title, columns, rows }) {
      return {
        title: title || 'Comparison Table',
        subtitle: `${columns?.length || 0} columns, ${rows?.length || 0} rows`,
      };
    },
  },
});
