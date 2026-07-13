import { Geist } from "next/font/google";
import { notFound } from "next/navigation";

import { OperationsPreviewClient } from "./OperationsPreviewClient";

export const dynamic = "force-dynamic";

const geist = Geist({ subsets: ["latin"], display: "swap" });

export default function OperationsPreviewPage() {
  if (process.env.OPERATIONS_PREVIEW_ENABLED !== "true") notFound();

  return (
    <div className={geist.className}>
      <OperationsPreviewClient />
    </div>
  );
}
