// lib/sanity/schemas/documents/campaign.ts
import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'campaign',
  title: 'Campaign',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
    }),
    defineField({
      name: 'isEnabled',
      title: 'Enabled',
      type: 'boolean',
      description: 'Manual override to enable/disable campaign',
      initialValue: true,
    }),
    defineField({
      name: 'campaignType',
      title: 'Campaign Type',
      type: 'string',
      options: {
        list: [
          { title: 'Banner', value: 'banner' },
          { title: 'Popup', value: 'popup' },
          { title: 'Inline', value: 'inline' },
          { title: 'Landing Page', value: 'landing-page' },
        ],
      },
      initialValue: 'banner',
    }),
    // Scheduling
    defineField({
      name: 'startDate',
      title: 'Start Date',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'endDate',
      title: 'End Date',
      type: 'datetime',
      description: 'Leave empty for ongoing campaigns',
    }),
    // Targeting
    defineField({
      name: 'targetPages',
      title: 'Target Pages',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'URL patterns: /, /packages/*, /business/*',
    }),
    defineField({
      name: 'targetAudience',
      title: 'Target Audience',
      type: 'string',
      options: {
        list: [
          { title: 'All', value: 'all' },
          { title: 'Consumer', value: 'consumer' },
          { title: 'Business', value: 'business' },
          { title: 'Partner', value: 'partner' },
        ],
      },
      initialValue: 'all',
    }),
    // Display settings
    defineField({
      name: 'priority',
      title: 'Priority',
      type: 'number',
      description: 'Higher priority campaigns display first (1-10)',
      initialValue: 5,
      validation: (Rule) => Rule.min(1).max(10),
    }),
    defineField({
      name: 'isDismissible',
      title: 'Dismissible',
      type: 'boolean',
      description: 'Allow users to close this campaign',
      initialValue: true,
    }),
    defineField({
      name: 'placement',
      title: 'Placement',
      type: 'string',
      options: {
        list: [
          { title: 'Top', value: 'top' },
          { title: 'Bottom', value: 'bottom' },
          { title: 'Center', value: 'center' },
          { title: 'Sidebar', value: 'sidebar' },
        ],
      },
      initialValue: 'top',
    }),
    // Content
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
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alt Text',
        },
      ],
    }),
    defineField({
      name: 'cta',
      title: 'Call to Action',
      type: 'cta',
    }),
    defineField({
      name: 'backgroundColor',
      title: 'Background Color',
      type: 'string',
      description: 'Hex color code, e.g. #FF6B00',
    }),
    // Tracking
    defineField({
      name: 'utmCampaign',
      title: 'UTM Campaign',
      type: 'string',
      description: 'UTM campaign parameter for tracking',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      startDate: 'startDate',
      endDate: 'endDate',
      isEnabled: 'isEnabled',
    },
    prepare({ title, startDate, endDate, isEnabled }) {
      const start = startDate ? new Date(startDate).toLocaleDateString() : 'No start'
      const end = endDate ? new Date(endDate).toLocaleDateString() : 'Ongoing'
      const status = isEnabled ? '' : ' [DISABLED]'
      return {
        title: `${title}${status}`,
        subtitle: `${start} → ${end}`,
      }
    },
  },
})
