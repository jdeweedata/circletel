import { defineType, defineField } from 'sanity';
import { UsersIcon } from '@sanity/icons';

export default defineType({
  name: 'testimonialBlock',
  title: 'Testimonial Section',
  type: 'object',
  icon: UsersIcon,
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
      name: 'testimonials',
      title: 'Testimonials',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'testimonial' }],
        },
      ],
      description: 'Select testimonials to display',
    }),
    defineField({
      name: 'variant',
      title: 'Display Variant',
      type: 'string',
      options: {
        list: [
          { title: 'Carousel', value: 'carousel' },
          { title: 'Grid', value: 'grid' },
          { title: 'Featured (Single)', value: 'featured' },
        ],
      },
      initialValue: 'carousel',
    }),
    defineField({
      name: 'showRatings',
      title: 'Show Star Ratings',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'headline',
      testimonials: 'testimonials',
    },
    prepare({ title, testimonials }) {
      return {
        title: title || 'Testimonial Section',
        subtitle: `${testimonials?.length || 0} testimonials`,
      };
    },
  },
});
