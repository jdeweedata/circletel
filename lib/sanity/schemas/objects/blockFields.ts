// lib/sanity/schemas/objects/blockFields.ts
import { defineField } from 'sanity'

/**
 * Cross-cutting fields shared by all page builder blocks.
 * Import and spread into each block's fields array.
 */
export const blockFields = [
  defineField({
    name: 'anchorId',
    title: 'Anchor ID',
    type: 'string',
    description: 'For in-page navigation links (e.g., "pricing")',
  }),
  defineField({
    name: 'theme',
    title: 'Theme',
    type: 'string',
    options: {
      list: [
        { title: 'Default', value: 'default' },
        { title: 'Light', value: 'light' },
        { title: 'Dark', value: 'dark' },
        { title: 'Brand', value: 'brand' },
      ],
    },
    initialValue: 'default',
  }),
  defineField({
    name: 'paddingTop',
    title: 'Padding Top',
    type: 'string',
    options: {
      list: [
        { title: 'None', value: 'none' },
        { title: 'Small', value: 'sm' },
        { title: 'Medium', value: 'md' },
        { title: 'Large', value: 'lg' },
        { title: 'Extra Large', value: 'xl' },
      ],
    },
    initialValue: 'md',
  }),
  defineField({
    name: 'paddingBottom',
    title: 'Padding Bottom',
    type: 'string',
    options: {
      list: [
        { title: 'None', value: 'none' },
        { title: 'Small', value: 'sm' },
        { title: 'Medium', value: 'md' },
        { title: 'Large', value: 'lg' },
        { title: 'Extra Large', value: 'xl' },
      ],
    },
    initialValue: 'md',
  }),
  defineField({
    name: 'hideOn',
    title: 'Hide On',
    type: 'string',
    options: {
      list: [
        { title: 'Never hide', value: 'none' },
        { title: 'Mobile', value: 'mobile' },
        { title: 'Desktop', value: 'desktop' },
      ],
    },
    initialValue: 'none',
  }),
]
