import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { presentationTool } from 'sanity/presentation';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './schemas';
import { structure } from './structure';

// Preview URL for live editing
const PREVIEW_URL = process.env.SANITY_STUDIO_PREVIEW_URL || 'https://www.circletel.co.za';

export default defineConfig({
  name: 'circletel',
  title: 'CircleTel CMS',

  projectId: '7iqq2t7l',
  dataset: 'production',

  plugins: [
    structureTool({ structure }),
    presentationTool({
      previewUrl: {
        draftMode: {
          enable: `${PREVIEW_URL}/api/sanity/preview`,
        },
      },
      resolve: {
        mainDocuments: [
          {
            route: '/products/:slug',
            filter: '_type == "productPage" && slug.current == $slug',
          },
        ],
      },
    }),
    visionTool(), // GROQ query playground
  ],

  schema: {
    types: schemaTypes,
  },

  // Studio customization
  studio: {
    components: {
      // Can add custom logo, navbar etc here
    },
  },

  // Document actions (publish, delete, etc)
  document: {
    // Disable actions for singleton documents
    actions: (prev, context) => {
      if (context.schemaType === 'siteSettings' || context.schemaType === 'homepage') {
        return prev.filter(({ action }) => action !== 'delete' && action !== 'duplicate');
      }
      return prev;
    },
  },
});
