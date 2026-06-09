"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteDocumentAction } from "@/app/(app)/clients/documents-actions";
import { formatBytes } from "@/lib/utils";
import type { ClientDocument } from "@/lib/types";

const MAX_BYTES = 25 * 1024 * 1024; // keep in sync with the route handler

export function ClientDocuments({
  clientId,
  documents,
}: {
  clientId: string;
  documents: ClientDocument[];
}) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  // null = idle; 0-100 = uploading
  const [progress, setProgress] = React.useState<number | null>(null);

  function reset() {
    setProgress(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast.error("File too large (max 25 MB)");
      reset();
      return;
    }

    setProgress(0);
    const fd = new FormData();
    fd.set("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/clients/${clientId}/documents`);
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) {
        setProgress(Math.round((ev.loaded / ev.total) * 100));
      }
    };
    xhr.onload = () => {
      let res: { ok?: boolean; error?: string } = {};
      try {
        res = JSON.parse(xhr.responseText);
      } catch {
        res = { ok: xhr.status >= 200 && xhr.status < 300 };
      }
      reset();
      if (xhr.status >= 200 && xhr.status < 300 && res.ok) {
        toast.success(`Uploaded ${file.name}`);
        router.refresh();
      } else {
        toast.error(res.error ?? `Upload failed (${xhr.status})`);
      }
    };
    xhr.onerror = () => {
      reset();
      toast.error("Upload failed — network error");
    };
    xhr.send(fd);
  }

  async function remove(id: string) {
    if (!confirm("Delete this file?")) return;
    const res = await deleteDocumentAction(id, clientId);
    if (!res.ok) toast.error(res.error ?? "Could not delete file");
    else router.refresh();
  }

  const uploading = progress !== null;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <input
          ref={inputRef}
          type="file"
          aria-label="Upload file"
          className="hidden"
          onChange={onFile}
          disabled={uploading}
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            <Upload /> {uploading ? `Uploading ${progress}%` : "Upload file"}
          </Button>
          <span className="text-xs text-muted-foreground">
            Photos &amp; files, max 25 MB
          </span>
        </div>

        {uploading && (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {documents.length > 0 && (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {documents.map((d) => {
            const isImage = d.mime?.startsWith("image/");
            return (
              <li
                key={d.id}
                className="group flex items-center gap-3 px-3 py-2"
              >
                {isImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={d.url}
                    alt={d.name}
                    className="size-9 shrink-0 rounded object-cover"
                  />
                ) : (
                  <FileText className="size-9 shrink-0 rounded bg-muted p-2 text-muted-foreground" />
                )}
                <a
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={d.name}
                  className="min-w-0 flex-1 truncate text-sm hover:text-primary hover:underline"
                >
                  {d.name}
                </a>
                {d.size != null && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatBytes(d.size)}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => remove(d.id)}
                  aria-label="Delete file"
                  className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground opacity-100 transition hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
