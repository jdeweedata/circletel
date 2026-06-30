"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { toast } from "sonner";
import {
  PiCheckCircleBold,
  PiFileBold,
  PiUploadSimpleBold,
  PiWarningCircleBold,
  PiXBold,
} from "react-icons/pi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DOC_TYPE_OPTIONS,
  buildDocumentUploadQueue,
  type DocType,
  type QueuedDocumentUpload,
} from "@/lib/onboarding/document-upload";
import { cn } from "@/lib/utils";

interface UploadDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  clinicName: string;
  submissionId?: string;
  defaultSegment?: string;
  authHeaders: () => Record<string, string>;
  onUploaded: (count: number) => void;
}

type UploadQueueItem = QueuedDocumentUpload & {
  docType: DocType;
  uploadError?: string;
};

export function UploadDocumentModal({
  open,
  onOpenChange,
  customerId,
  clinicName,
  submissionId,
  defaultSegment = "unjani",
  authHeaders,
  onUploaded,
}: UploadDocumentModalProps) {
  const [segment, setSegment] = useState(defaultSegment);
  const [emailFrom, setEmailFrom] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailReceivedAt, setEmailReceivedAt] = useState("");
  const [queuedFiles, setQueuedFiles] = useState<UploadQueueItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentUpload, setCurrentUpload] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<{ type: string; name: string }[]>(
    [],
  );

  useEffect(() => {
    if (open) setSegment(defaultSegment);
  }, [defaultSegment, open]);

  const validFileCount = useMemo(
    () => queuedFiles.filter((item) => item.valid).length,
    [queuedFiles],
  );

  const reset = () => {
    setSegment(defaultSegment);
    setEmailFrom("");
    setEmailSubject("");
    setEmailReceivedAt("");
    setQueuedFiles([]);
    setDragging(false);
    setUploading(false);
    setCurrentUpload(null);
    setUploaded([]);
  };

  const addFiles = (files: File[]) => {
    if (files.length === 0) return;
    const batchStamp = Date.now();
    const next = buildDocumentUploadQueue(files).map((item, index) => ({
      ...item,
      id: `${item.id}-${batchStamp}-${index}`,
      docType: "company_registration" as DocType,
    }));
    setQueuedFiles((current) => [...current, ...next]);

    const invalidCount = next.filter((item) => !item.valid).length;
    if (invalidCount > 0) {
      toast.warning(
        `${invalidCount} file${invalidCount === 1 ? "" : "s"} need attention`,
      );
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    addFiles(Array.from(event.dataTransfer.files));
  };

  const removeQueuedFile = (id: string) => {
    setQueuedFiles((current) => current.filter((item) => item.id !== id));
  };

  const updateQueuedFileDocType = (id: string, docType: DocType) => {
    setQueuedFiles((current) =>
      current.map((item) => (item.id === id ? { ...item, docType } : item)),
    );
  };

  const uploadOne = async (item: UploadQueueItem) => {
    const fd = new FormData();
    fd.append("customerId", customerId);
    fd.append("documentType", item.docType);
    fd.append("segment", segment);
    if (emailFrom.trim()) fd.append("emailFrom", emailFrom.trim());
    if (emailSubject.trim()) fd.append("emailSubject", emailSubject.trim());
    if (emailReceivedAt.trim())
      fd.append("emailReceivedAt", emailReceivedAt.trim());
    if (submissionId) fd.append("submissionId", submissionId);
    fd.append("file", item.file);

    const res = await fetch("/api/admin/b2b/upload-document", {
      method: "POST",
      headers: { ...authHeaders() },
      body: fd,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Upload failed");
    }
  };

  const handleUpload = async () => {
    const ready = queuedFiles.filter((item) => item.valid);
    if (ready.length === 0) {
      toast.error("Add a JPG, PNG, or PDF before uploading");
      return;
    }

    const successfulIds = new Set<string>();
    const failures = new Map<string, string>();

    setUploading(true);
    try {
      for (const item of ready) {
        setCurrentUpload(item.name);
        try {
          await uploadOne(item);
          const label =
            DOC_TYPE_OPTIONS.find((o) => o.value === item.docType)?.label ??
            item.docType;
          successfulIds.add(item.id);
          setUploaded((current) => [
            ...current,
            { type: label, name: item.name },
          ]);
        } catch (error) {
          failures.set(
            item.id,
            error instanceof Error ? error.message : "Upload failed",
          );
        }
      }

      setQueuedFiles((current) =>
        current
          .filter((item) => !successfulIds.has(item.id))
          .map((item) => ({
            ...item,
            uploadError: failures.get(item.id),
          })),
      );

      if (successfulIds.size > 0) {
        toast.success(
          `Uploaded ${successfulIds.size} document${successfulIds.size === 1 ? "" : "s"}`,
        );
      }
      if (failures.size > 0) {
        toast.error(
          `${failures.size} upload${failures.size === 1 ? "" : "s"} failed`,
        );
      }
    } finally {
      setUploading(false);
      setCurrentUpload(null);
    }
  };

  const handleClose = () => {
    onUploaded(uploaded.length);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) =>
        nextOpen ? onOpenChange(nextOpen) : handleClose()
      }
    >
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            Upload client onboarding documents - {clinicName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Client onboarding pack
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label
                  htmlFor="upload-segment"
                  className="text-xs font-semibold text-gray-500"
                >
                  Segment
                </Label>
                <select
                  id="upload-segment"
                  value={segment}
                  onChange={(e) => setSegment(e.target.value)}
                  className="h-10 w-full rounded-md border border-gray-300 px-2 py-2 text-sm"
                >
                  <option value="unjani">Unjani</option>
                  <option value="smb">SMB</option>
                  <option value="edu">Education</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="upload-email-received-at"
                  className="text-xs font-semibold text-gray-500"
                >
                  Email received
                </Label>
                <Input
                  id="upload-email-received-at"
                  type="datetime-local"
                  value={emailReceivedAt}
                  onChange={(event) => setEmailReceivedAt(event.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label
                  htmlFor="upload-email-from"
                  className="text-xs font-semibold text-gray-500"
                >
                  Email from
                </Label>
                <Input
                  id="upload-email-from"
                  type="email"
                  value={emailFrom}
                  onChange={(event) => setEmailFrom(event.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="upload-email-subject"
                  className="text-xs font-semibold text-gray-500"
                >
                  Email subject
                </Label>
                <Input
                  id="upload-email-subject"
                  value={emailSubject}
                  onChange={(event) => setEmailSubject(event.target.value)}
                />
              </div>
            </div>
          </div>

          <label
            htmlFor="upload-files"
            onDragEnter={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => {
              event.preventDefault();
              setDragging(false);
            }}
            onDrop={handleDrop}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-4 py-8 text-center transition",
              dragging
                ? "border-circleTel-orange bg-orange-50"
                : "border-gray-300 bg-gray-50 hover:border-circleTel-orange hover:bg-orange-50",
            )}
          >
            <PiUploadSimpleBold className="mb-2 h-8 w-8 text-circleTel-orange" />
            <span className="font-semibold text-gray-900">
              Drag documents here or browse
            </span>
            <span className="mt-1 text-sm text-gray-500">
              JPG, PNG, or PDF up to 5MB each
            </span>
            <input
              id="upload-files"
              type="file"
              multiple
              accept="image/jpeg,image/png,application/pdf"
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>

          {queuedFiles.length > 0 && (
            <div className="overflow-hidden rounded-md border border-gray-200">
              <div className="border-b border-gray-100 bg-gray-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Documents in this pack ({queuedFiles.length})
              </div>
              <div className="max-h-52 divide-y divide-gray-100 overflow-y-auto">
                {queuedFiles.map((item) => (
                  <div
                    key={item.id}
                    className="grid gap-3 px-3 py-3 md:grid-cols-[minmax(0,1fr)_260px_auto]"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <PiFileBold className="mt-0.5 h-5 w-5 flex-none text-gray-400" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.sizeLabel}
                        </p>
                        {item.error && (
                          <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600">
                            <PiWarningCircleBold className="h-3.5 w-3.5" />
                            {item.error}
                          </p>
                        )}
                        {item.uploadError && (
                          <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600">
                            <PiWarningCircleBold className="h-3.5 w-3.5" />
                            {item.uploadError}
                          </p>
                        )}
                        {currentUpload === item.name && (
                          <p className="mt-1 text-xs font-medium text-circleTel-orange">
                            Uploading...
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor={`queued-document-type-${item.id}`}
                        className="text-[11px] font-semibold uppercase tracking-wide text-gray-500"
                      >
                        Document type
                      </Label>
                      <select
                        id={`queued-document-type-${item.id}`}
                        value={item.docType}
                        onChange={(event) =>
                          updateQueuedFileDocType(
                            item.id,
                            event.target.value as DocType,
                          )
                        }
                        disabled={uploading || !item.valid}
                        className="h-9 w-full rounded-md border border-gray-300 px-2 text-sm disabled:bg-gray-50 disabled:text-gray-400"
                      >
                        {DOC_TYPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeQueuedFile(item.id)}
                        disabled={uploading}
                        aria-label={`Remove ${item.name}`}
                      >
                        <PiXBold className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            className="w-full bg-circleTel-orange text-white hover:bg-circleTel-orange-dark"
            disabled={uploading || validFileCount === 0}
            onClick={handleUpload}
          >
            <PiUploadSimpleBold className="h-4 w-4" />
            {uploading
              ? currentUpload
                ? `Uploading ${currentUpload}`
                : "Uploading..."
              : `Upload ${validFileCount || "queued"} document${validFileCount === 1 ? "" : "s"}`}
          </Button>
        </div>

        {uploaded.length > 0 && (
          <div className="rounded-md border border-emerald-100 bg-emerald-50 p-3 text-sm">
            <p className="mb-1 flex items-center gap-2 font-semibold text-emerald-800">
              <PiCheckCircleBold className="h-4 w-4" />
              Uploaded ({uploaded.length})
            </p>
            <ul className="space-y-1">
              {uploaded.map((u, i) => (
                <li
                  key={`${u.name}-${i}`}
                  className="truncate text-emerald-700"
                >
                  {u.type} - {u.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
