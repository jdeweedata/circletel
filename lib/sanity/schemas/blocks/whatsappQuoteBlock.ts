import { defineType, defineField } from 'sanity';
import { ComposeIcon } from '@sanity/icons';
import { blockFields } from '../objects/blockFields';

export default defineType({
  name: 'whatsappQuoteBlock',
  title: 'WhatsApp Quote Form',
  type: 'object',
  icon: ComposeIcon,
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow Text', type: 'string' }),
    defineField({
      name: 'headline',
      title: 'Form Heading',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Form Subheading',
      type: 'string',
    }),
    defineField({
      name: 'bundleOptions',
      title: 'Bundle Dropdown Options',
      type: 'array',
      of: [{ type: 'string' }],
      description:
        'Plan names shown in the dropdown, e.g. "BusinessMobile", "OfficeConnect". Leave empty to hide the dropdown.',
    }),
    defineField({
      name: 'phoneNumber',
      title: 'WhatsApp Phone Number',
      type: 'string',
      description:
        'Overrides default contact number. Format: 27824873900 (no spaces, country code first). Leave blank to use the default.',
    }),
    ...blockFields,
  ],
  preview: {
    select: { title: 'headline' },
    prepare({ title }: { title?: string }) {
      return { title: title || 'WhatsApp Quote Form' };
    },
  },
});
