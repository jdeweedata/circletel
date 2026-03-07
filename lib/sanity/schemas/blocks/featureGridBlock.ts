import { defineType, defineField } from 'sanity';
import { ComponentIcon } from '@sanity/icons';

export default defineType({
  name: 'featureGridBlock',
  title: 'Feature Grid',
  type: 'object',
  icon: ComponentIcon,
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
      name: 'features',
      title: 'Features',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'title', type: 'string', title: 'Feature Title', validation: (Rule) => Rule.required() },
            { name: 'description', type: 'text', title: 'Feature Description', rows: 2 },
            { name: 'icon', type: 'string', title: 'Icon Name', description: 'e.g., wifi, shield, clock, zap' },
            { name: 'image', type: 'image', title: 'Feature Image', options: { hotspot: true } },
          ],
          preview: {
            select: {
              title: 'title',
              subtitle: 'description',
              media: 'image',
            },
          },
        },
      ],
      validation: (Rule) => Rule.min(2).max(12),
    }),
    defineField({
      name: 'columns',
      title: 'Grid Columns',
      type: 'number',
      options: {
        list: [
          { title: '2 Columns', value: 2 },
          { title: '3 Columns', value: 3 },
          { title: '4 Columns', value: 4 },
        ],
      },
      initialValue: 3,
    }),
    defineField({
      name: 'cta',
      title: 'Call to Action',
      type: 'cta',
    }),
  ],
  preview: {
    select: {
      title: 'headline',
      features: 'features',
    },
    prepare({ title, features }) {
      return {
        title: title || 'Feature Grid',
        subtitle: `${features?.length || 0} features`,
      };
    },
  },
});
