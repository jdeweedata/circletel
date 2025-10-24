"use client";

import Image from "next/image";

export default function DetailsPanel() {
  return (
    <aside className="hidden xl:block w-[360px]">
      <div className="sticky top-14 space-y-4">
        <div className="rounded-lg border bg-white">
          <div className="px-4 py-3 border-b">
            <h3 className="font-semibold text-gray-900">Details</h3>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">Add a new note…</label>
              <textarea className="w-full rounded-md border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" rows={3} placeholder="Type a note"/>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-200" aria-hidden>
                  <Image src="/icons/avatar-placeholder.svg" alt="" width={32} height={32} />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Josefa Gutierrez</div>
                  <div className="text-xs text-gray-500">Today, 9:22 AM</div>
                  <p className="text-sm text-gray-700 mt-1">We noticed that the customer had a disconnected router. We could proactively reach out to help set it up.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-200" aria-hidden>
                  <Image src="/icons/avatar-placeholder.svg" alt="" width={32} height={32} />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Johnny Abbott</div>
                  <div className="text-xs text-gray-500">Mar 30, 2025, 5:45 PM</div>
                  <p className="text-sm text-gray-700 mt-1">This customer may need an additional router after the move to his new address.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
