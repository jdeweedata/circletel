import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'CircleTel CMS',

  projectId: '7iqq2t7l',
  dataset: 'production',

  plugins: [
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
