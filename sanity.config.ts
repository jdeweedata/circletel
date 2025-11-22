'use client'

import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {presentationTool} from 'sanity/presentation'
import {schemaTypes} from './sanity/schemaTypes'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '7iqq2t7l'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'

// Determine basePath based on hostname (client-side)
const isStudioSubdomain = typeof window !== 'undefined' && window.location.hostname.startsWith('studio.')
const basePath = isStudioSubdomain ? '/' : '/admin/cms'

export default defineConfig({
  name: 'circletel-cms',
  title: 'CircleTel CMS',
  projectId,
  dataset,
  basePath,

  plugins: [
    presentationTool({
      previewUrl: {
        preview: "/",
        previewMode: {
          enable: "/api/draft-mode/enable",
          disable: "/api/draft-mode/disable",
        },
      },
    }),
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            // Website Pages
            S.listItem()
              .title('📄 Pages')
              .child(
                S.documentTypeList('page')
                  .title('Website Pages')
                  .filter('_type == "page"')
              ),
            
            // Products & Services
            S.listItem()
              .title('📦 Products & Services')
              .child(
                S.documentTypeList('product')
                  .title('Products & Services')
                  .filter('_type == "product"')
              ),
            
            // Blog Content
            S.divider(),
            S.listItem()
              .title('📝 Blog Posts')
              .child(
                S.documentTypeList('post')
                  .title('Blog Posts')
                  .filter('_type == "post"')
              ),
            
            // Team & Organization
            S.divider(),
            S.listItem()
              .title('👥 Authors')
              .child(
                S.documentTypeList('author')
                  .title('Authors & Team Members')
                  .filter('_type == "author"')
              ),
            
            // Content Organization
            S.listItem()
              .title('🏷️ Categories')
              .child(
                S.documentTypeList('category')
                  .title('Content Categories')
                  .filter('_type == "category"')
              ),
          ])
    }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },
})
