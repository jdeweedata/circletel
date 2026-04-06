/**
 * Embedded Sanity Studio
 *
 * Accessible at /studio (internal) and via sanity.circletel.co.za (subdomain).
 * Config: sanity.config.ts (root) — basePath: '/studio'
 */

import { NextStudio } from 'next-sanity/studio';
import config from '@/sanity.config';

export { metadata, viewport } from 'next-sanity/studio';

export const dynamic = 'force-static';

export default function StudioPage() {
  return <NextStudio config={config} />;
}
