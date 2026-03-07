// sanity.config.ts
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './lib/sanity/schemas'
import { structure } from './lib/sanity/structure'

export default defineConfig({
  name: 'circletel',
  title: 'CircleTel CMS',

  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',

  basePath: '/studio',

  plugins: [
    structureTool({ structure }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },

  document: {
    actions: (prev, context) => {
      // Singletons: no delete/duplicate
      if (['siteSettings', 'homepage'].includes(context.schemaType)) {
        return prev.filter(({ action }) =>
          !['delete', 'duplicate'].includes(action!)
        )
      }
      return prev
    },
    // Hide singletons from "new document" menu
    newDocumentOptions: (prev, { creationContext }) => {
      if (creationContext.type === 'global') {
        return prev.filter(
          (item) => !['siteSettings', 'homepage'].includes(item.templateId)
        )
      }
      return prev
    },
  },
})
