/**
 * Inngest API Route
 *
 * This route serves the Inngest functions and handles incoming events.
 * Inngest will call this endpoint to execute background jobs.
 *
 * @see https://www.inngest.com/docs/reference/serve
 */

import { serve } from 'inngest/next';
import { inngest, functions } from '@/lib/inngest';

// Create and export the serve handler
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});
