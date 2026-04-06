import { defineType, defineField } from 'sanity';
import { StarIcon } from '@sanity/icons';

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
        {
          type: 'object',
          fields: [
            {
              name: 'icon',
              type: 'string',
              title: 'Material Symbol Icon Name',
              description: 'e.g. "verified", "speed", "support_agent", "swap_vert"',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'text',
              type: 'string',
              title: 'Badge Text',
              description: 'e.g. "99.9% Uptime SLA"',
              validation: (Rule) => Rule.required(),
            },
          ],
          preview: {
            select: { title: 'text', subtitle: 'icon' },
          },
        },
      ],
      validation: (Rule) => Rule.min(1).max(8),
    }),
  ],
  preview: {
    select: { badges: 'badges' },
    prepare({ badges }) {
      return {
        title: 'Trust Strip',
        subtitle: `${badges?.length || 0} badges`,
      };
    },
  },
});
