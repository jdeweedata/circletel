import { defineType, defineField } from 'sanity';
import { CogIcon } from '@sanity/icons';

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  icon: CogIcon,
  fields: [
    defineField({
      name: 'siteName',
      title: 'Site Name',
      type: 'string',
      initialValue: 'CircleTel',
    }),
    defineField({
      name: 'tagline',
      title: 'Site Tagline',
      type: 'string',
      description: 'Default tagline for SEO',
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
    }),
    defineField({
      name: 'logoDark',
      title: 'Logo (Dark Mode)',
      type: 'image',
    }),
    defineField({
      name: 'favicon',
      title: 'Favicon',
      type: 'image',
    }),
    defineField({
      name: 'defaultSeo',
      title: 'Default SEO Settings',
      type: 'seo',
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social Media Links',
      type: 'object',
      fields: [
        { name: 'facebook', type: 'url', title: 'Facebook' },
        { name: 'twitter', type: 'url', title: 'Twitter/X' },
        { name: 'instagram', type: 'url', title: 'Instagram' },
        { name: 'linkedin', type: 'url', title: 'LinkedIn' },
        { name: 'youtube', type: 'url', title: 'YouTube' },
      ],
    }),
    defineField({
      name: 'contactInfo',
      title: 'Contact Information',
      type: 'object',
      fields: [
        { name: 'phone', type: 'string', title: 'Phone Number' },
        { name: 'email', type: 'string', title: 'Email Address' },
        { name: 'address', type: 'text', title: 'Physical Address', rows: 3 },
        { name: 'supportHours', type: 'string', title: 'Support Hours' },
      ],
    }),
    defineField({
      name: 'announcement',
      title: 'Site-wide Announcement',
      type: 'object',
      fields: [
        { name: 'enabled', type: 'boolean', title: 'Show Announcement Bar' },
        { name: 'message', type: 'string', title: 'Announcement Message' },
        { name: 'link', type: 'string', title: 'Link URL' },
        { name: 'backgroundColor', type: 'string', title: 'Background Color', description: 'Hex code (e.g., #FF6B00)' },
      ],
    }),
    defineField({
      name: 'footerCta',
      title: 'Footer CTA',
      type: 'object',
      fields: [
        { name: 'headline', type: 'string', title: 'CTA Headline' },
        { name: 'description', type: 'text', title: 'CTA Description', rows: 2 },
        { name: 'cta', type: 'cta', title: 'CTA Button' },
      ],
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Site Settings',
        subtitle: 'Global configuration',
      };
    },
  },
});
