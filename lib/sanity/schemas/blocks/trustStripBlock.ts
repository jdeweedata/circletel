import { defineType, defineField, defineArrayMember } from 'sanity';
import { StarIcon } from '@sanity/icons';
import { blockFields } from '../objects/blockFields';

export default defineType({
  name: 'trustStripBlock',
  title: 'Trust Strip',
  type: 'object',
  icon: StarIcon,
  fields: [
    defineField({
      name: 'badges',
      title: 'Trust Badges',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            {
              name: 'icon',
              type: 'string',
              title: 'Material Symbols Icon Name',
              description: 'e.g. signal_cellular_alt, verified, bolt',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'text',
              type: 'string',
              title: 'Badge Text',
              validation: (Rule) => Rule.required(),
            },
          ],
          preview: {
            select: { title: 'text', subtitle: 'icon' },
          },
        }),
      ],
      validation: (Rule) => Rule.min(1),
    }),
    ...blockFields,
  ],
  preview: {
    select: { badges: 'badges' },
    prepare({ badges }: { badges?: unknown[] }) {
      return {
        title: 'Trust Strip',
        subtitle: `${badges?.length ?? 0} badges`,
      };
    },
  },
});
