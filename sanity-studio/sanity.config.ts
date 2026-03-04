import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './schemas';
import { structure } from './structure';

export default defineConfig({
  name: 'circletel',
  title: 'CircleTel CMS',

  projectId: '7iqq2t7l',
  dataset: 'production',

  plugins: [
    structureTool({ structure }),
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
