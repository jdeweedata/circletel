import { defineType, defineField } from 'sanity';
import { ChatIcon } from '@sanity/icons';

export default defineType({
  name: 'whatsappQuoteBlock',
  title: 'WhatsApp Quote Form',
  type: 'object',
  icon: ChatIcon,
  fields: [
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow Text',
      type: 'string',
      description: 'Small label above the headline (e.g., "Get a Quote in 2 Minutes")',
      initialValue: 'Get a Quote in 2 Minutes',
    }),
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'bundleOptions',
      title: 'Bundle Options',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Options shown in the "Which plan?" dropdown. Leave empty to hide the dropdown.',
    }),
    defineField({
      name: 'phoneNumber',
      title: 'WhatsApp Number Override',
      type: 'string',
      description: 'Optional. Overrides the global CONTACT.WHATSAPP_LINK. Format: 27824873900',
    }),
  ],
  preview: {
    select: { title: 'headline' },
    prepare({ title }) {
      return {
        title: title || 'WhatsApp Quote Form',
      };
    },
  },
});
