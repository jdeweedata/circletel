import type { CollectionConfig } from 'payload'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'status', 'startingPrice', 'updatedAt'],
    group: 'Content',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  versions: {
    drafts: true,
  },
  fields: [
    // --- Identity ---
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Home Fibre', value: 'home' },
        { label: 'Business Fibre', value: 'business' },
        { label: 'Wireless / 5G', value: 'wireless' },
        { label: 'Hardware', value: 'hardware' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'tagline',
      type: 'text',
      label: 'Tagline',
    },
    {
      name: 'description',
      type: 'richText',
      label: 'Full Description',
    },
    // --- Media ---
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'gallery',
      type: 'array',
      label: 'Image Gallery',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
        },
        {
          name: 'caption',
          type: 'text',
        },
      ],
    },
    // --- Pricing ---
    {
      name: 'pricing',
      type: 'group',
      label: 'Pricing',
      fields: [
        {
          name: 'startingPrice',
          type: 'number',
          label: 'Starting Price (ZAR)',
          admin: { description: 'Monthly price in Rands, incl VAT' },
        },
        {
          name: 'priceNote',
          type: 'text',
          label: 'Price Note',
          admin: { description: 'e.g. "per month" or "one-time"' },
        },
        {
          name: 'showContactForPricing',
          type: 'checkbox',
          label: 'Show "Contact for Pricing" instead of price',
          defaultValue: false,
        },
      ],
    },
    // --- Features ---
    {
      name: 'keyFeatures',
      type: 'array',
      label: 'Key Features',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
        },
        {
          name: 'icon',
          type: 'select',
          options: [
            { label: 'Speed', value: 'speed' },
            { label: 'Shield (Security)', value: 'shield' },
            { label: 'WiFi', value: 'wifi' },
            { label: 'Phone (Support)', value: 'phone' },
            { label: 'Globe (Coverage)', value: 'globe' },
            { label: 'Arrow Up (Upload)', value: 'arrow-up' },
            { label: 'Devices', value: 'devices' },
            { label: 'Clock (Uptime)', value: 'clock' },
            { label: 'Lock', value: 'lock' },
            { label: 'Chart', value: 'chart' },
          ],
        },
      ],
    },
    // --- Specifications ---
    {
      name: 'specifications',
      type: 'array',
      label: 'Technical Specifications',
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
        },
        {
          name: 'value',
          type: 'text',
          required: true,
        },
      ],
    },
    // --- Publishing ---
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
      defaultValue: 'draft',
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
  ],
}
