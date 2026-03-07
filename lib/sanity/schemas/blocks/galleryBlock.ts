// lib/sanity/schemas/blocks/galleryBlock.ts
import { defineField, defineType } from 'sanity'
import { blockFields } from '../objects/blockFields'

export default defineType({
  name: 'galleryBlock',
  title: 'Gallery Block',
  type: 'object',
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
    }),
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [
        {
          type: 'image',
          options: {
            hotspot: true,
          },
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alt Text',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'caption',
              type: 'string',
              title: 'Caption',
            },
          ],
        },
      ],
      validation: (Rule) => Rule.min(1).max(12),
    }),
    defineField({
      name: 'layout',
      title: 'Layout',
      type: 'string',
      options: {
        list: [
          { title: 'Grid', value: 'grid' },
          { title: 'Masonry', value: 'masonry' },
          { title: 'Carousel', value: 'carousel' },
        ],
      },
      initialValue: 'grid',
    }),
    defineField({
      name: 'lightbox',
      title: 'Enable Lightbox',
      type: 'boolean',
      description: 'Allow clicking images to view full size',
      initialValue: true,
    }),
    defineField({
      name: 'columns',
      title: 'Columns',
      type: 'number',
      options: {
        list: [
          { title: '2', value: 2 },
          { title: '3', value: 3 },
          { title: '4', value: 4 },
        ],
      },
      initialValue: 3,
      hidden: ({ parent }) => parent?.layout === 'carousel',
    }),
    defineField({
      name: 'gap',
      title: 'Gap',
      type: 'string',
      options: {
        list: [
          { title: 'None', value: 'none' },
          { title: 'Small', value: 'sm' },
          { title: 'Medium', value: 'md' },
          { title: 'Large', value: 'lg' },
        ],
      },
      initialValue: 'md',
    }),
    defineField({
      name: 'aspectRatio',
      title: 'Aspect Ratio',
      type: 'string',
      options: {
        list: [
          { title: 'Auto', value: 'auto' },
          { title: 'Square', value: 'square' },
          { title: '4:3', value: '4:3' },
          { title: '16:9', value: '16:9' },
        ],
      },
      initialValue: 'auto',
    }),
    ...blockFields,
  ],
  preview: {
    select: {
      images: 'images',
      layout: 'layout',
      heading: 'heading',
    },
    prepare({ images, layout, heading }) {
      return {
        title: heading || 'Gallery',
        subtitle: `${images?.length || 0} images • ${layout}`,
        media: images?.[0],
      }
    },
  },
})
