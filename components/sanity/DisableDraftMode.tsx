"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { disableDraftMode } from "@/app/actions";
import { useDraftModeEnvironment } from "next-sanity/hooks";

export function DisableDraftMode() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const environment = useDraftModeEnvironment();
  
  // Only show the disable draft mode button when outside of Presentation Tool
  if (environment !== "live" && environment !== "unknown") {
    return null;
  }

  const disable = () =>
    startTransition(async () => {
      await disableDraftMode();
      router.refresh();
    });

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button 
        type="button" 
        onClick={disable}
        className="bg-gray-900 text-white px-4 py-2 rounded shadow hover:bg-gray-800 transition-colors text-sm font-medium"
      >
        {pending ? "Disabling..." : "Disable Draft Mode"}
      </button>
    </div>
  );
}
