'use client';

/**
 * CMS Media Library Page
 *
 * Admin page for managing all media files.
 */

import { MediaLibrary } from '@/components/admin/cms/MediaLibrary';

export default function MediaLibraryPage() {
  return (
    <div className="h-[calc(100vh-64px)]">
      <MediaLibrary />
    </div>
  );
}
