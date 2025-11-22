import { defineField, defineType } from 'sanity'

export const promotionCard = defineType({
  name: 'promotionCard',
  title: 'Promotion Card',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Product Title',
      type: 'string',
      initialValue: 'MTN Uncapped 5G FWA',
    }),
    defineField({
      name: 'badge',
      title: 'Red Badge Text',
      type: 'string',
      description: 'e.g. SAVE R2 400 YAY!',
    }),
    defineField({
      name: 'wasPrice',
      title: 'Was Price (R)',
      type: 'number',
    }),
    defineField({
      name: 'nowPrice',
      title: 'Now Price (R)',
      type: 'number',
    }),
    defineField({
      name: 'specs',
      title: 'Key Specs',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'e.g. ["35Mbps", "Uncapped Data", "Fair Usage Policy"]'
    }),
    defineField({
      name: 'routerName',
      title: 'Router Name',
      type: 'string',
    }),
    defineField({
      name: 'routerImage',
      title: 'Router Image',
      type: 'image',
      options: { hotspot: true },
    }),
  ],
})

export const promotionSection = defineType({
  name: 'promotionSection',
  title: 'Promotion / Black Friday Section',
  type: 'object',
  fields: [
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'string',
      initialValue: 'Business Capped & Uncapped'
    }),
    defineField({
      name: 'theme',
      title: 'Theme',
      type: 'string',
      options: {
        list: [
          { title: 'Black Friday (Dark/Gold)', value: 'blackFriday' },
          { title: 'Standard (Light)', value: 'standard' },
        ],
      },
      initialValue: 'blackFriday',
    }),
    defineField({
      name: 'cards',
      title: 'Product Cards',
      type: 'array',
      of: [{ type: 'promotionCard' }],
    }),
  ],
  preview: {
    select: {
      title: 'headline',
      cards: 'cards',
    },
    prepare({ title, cards }) {
      return {
        title: title || 'Promotion Section',
        subtitle: `${cards?.length || 0} cards - Black Friday Style`,
      }
    },
  },
})
