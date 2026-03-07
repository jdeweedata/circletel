// lib/sanity/schemas/blocks/formBlock.ts
import { defineField, defineType } from 'sanity'
import { blockFields } from '../objects/blockFields'

export default defineType({
  name: 'formBlock',
  title: 'Form Block',
  type: 'object',
  fields: [
    defineField({
      name: 'formProvider',
      title: 'Form Provider',
      type: 'string',
      options: {
        list: [
          { title: 'CircleTel Contact', value: 'circletel-contact' },
          { title: 'CircleTel Callback', value: 'circletel-callback' },
          { title: 'CircleTel Newsletter', value: 'circletel-newsletter' },
          { title: 'HubSpot', value: 'hubspot' },
          { title: 'Typeform', value: 'typeform' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'formId',
      title: 'Form ID',
      type: 'string',
      description: 'Provider-specific form identifier',
    }),
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'variant',
      title: 'Variant',
      type: 'string',
      options: {
        list: [
          { title: 'Card', value: 'card' },
          { title: 'Inline', value: 'inline' },
          { title: 'Split (image + form)', value: 'split' },
        ],
      },
      initialValue: 'card',
    }),
    defineField({
      name: 'submitText',
      title: 'Submit Button Text',
      type: 'string',
      initialValue: 'Submit',
    }),
    defineField({
      name: 'successMessage',
      title: 'Success Message',
      type: 'text',
      rows: 2,
      initialValue: 'Thank you! We will be in touch soon.',
    }),
    defineField({
      name: 'backgroundImage',
      title: 'Background Image',
      type: 'image',
      description: 'For split variant',
      hidden: ({ parent }) => parent?.variant !== 'split',
    }),
    ...blockFields,
  ],
  preview: {
    select: {
      headline: 'headline',
      formProvider: 'formProvider',
    },
    prepare({ headline, formProvider }) {
      return {
        title: 'Form Block',
        subtitle: `${formProvider}: ${headline || 'No headline'}`,
      }
    },
  },
})
