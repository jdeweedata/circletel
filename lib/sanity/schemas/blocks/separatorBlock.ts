// lib/sanity/schemas/blocks/separatorBlock.ts
import { defineField, defineType } from 'sanity'
import { blockFields } from '../objects/blockFields'

export default defineType({
  name: 'separatorBlock',
  title: 'Separator Block',
  type: 'object',
  fields: [
    defineField({
      name: 'mode',
      title: 'Mode',
      type: 'string',
      options: {
        list: [
          { title: 'Divider (visible line)', value: 'divider' },
          { title: 'Spacer (invisible space)', value: 'spacer' },
        ],
      },
      initialValue: 'divider',
    }),
    defineField({
      name: 'style',
      title: 'Style',
      type: 'string',
      options: {
        list: [
          { title: 'Line', value: 'line' },
          { title: 'Gradient', value: 'gradient' },
          { title: 'Dashed', value: 'dashed' },
          { title: 'Dots', value: 'dots' },
        ],
      },
      initialValue: 'line',
      hidden: ({ parent }) => parent?.mode !== 'divider',
    }),
    defineField({
      name: 'width',
      title: 'Width',
      type: 'string',
      options: {
        list: [
          { title: 'Full', value: 'full' },
          { title: 'Three Quarters', value: 'three-quarters' },
          { title: 'Half', value: 'half' },
          { title: 'Quarter', value: 'quarter' },
        ],
      },
      initialValue: 'full',
      hidden: ({ parent }) => parent?.mode !== 'divider',
    }),
    defineField({
      name: 'spacing',
      title: 'Spacing',
      type: 'string',
      options: {
        list: [
          { title: 'Small', value: 'sm' },
          { title: 'Medium', value: 'md' },
          { title: 'Large', value: 'lg' },
          { title: 'Extra Large', value: 'xl' },
        ],
      },
      initialValue: 'md',
    }),
    defineField({
      name: 'color',
      title: 'Color',
      type: 'string',
      description: 'Hex color for divider line',
      hidden: ({ parent }) => parent?.mode !== 'divider',
    }),
    ...blockFields,
  ],
  preview: {
    select: {
      mode: 'mode',
      style: 'style',
      spacing: 'spacing',
    },
    prepare({ mode, style, spacing }) {
      return {
        title: mode === 'divider' ? 'Divider' : 'Spacer',
        subtitle: mode === 'divider' ? `${style} • ${spacing}` : spacing,
      }
    },
  },
})
