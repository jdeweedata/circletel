import { defineType, defineField } from 'sanity';
import { UsersIcon } from '@sanity/icons';

export default defineType({
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  icon: UsersIcon,
  fields: [
    defineField({
      name: 'quote',
      title: 'Testimonial Quote',
      type: 'text',
      rows: 4,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'author',
      title: 'Author Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'role',
      title: 'Role / Title',
      type: 'string',
      description: 'e.g., "CEO, TechCorp" or "Homeowner, Sandton"',
    }),
    defineField({
      name: 'company',
      title: 'Company Name',
      type: 'string',
    }),
    defineField({
      name: 'avatar',
      title: 'Author Photo',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'companyLogo',
      title: 'Company Logo',
      type: 'image',
    }),
    defineField({
      name: 'rating',
      title: 'Star Rating',
      type: 'number',
      options: {
        list: [
          { title: '5 Stars', value: 5 },
          { title: '4 Stars', value: 4 },
          { title: '3 Stars', value: 3 },
        ],
      },
      initialValue: 5,
    }),
    defineField({
      name: 'segment',
      title: 'Customer Segment',
      type: 'string',
      options: {
        list: [
          { title: 'Home / Consumer', value: 'home' },
          { title: 'SOHO / Work From Home', value: 'wfh' },
          { title: 'Business', value: 'business' },
          { title: 'Enterprise', value: 'enterprise' },
        ],
      },
      description: 'Which segment does this testimonial apply to?',
    }),
    defineField({
      name: 'product',
      title: 'Related Product',
      type: 'reference',
      to: [{ type: 'productPage' }],
      description: 'Optional: Link to specific product',
    }),
    defineField({
      name: 'featured',
      title: 'Featured Testimonial',
      type: 'boolean',
      description: 'Show prominently on homepage',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'author',
      subtitle: 'company',
      media: 'avatar',
    },
    prepare({ title, subtitle, media }) {
      return {
        title,
        subtitle: subtitle || 'No company',
        media,
      };
    },
  },
});
