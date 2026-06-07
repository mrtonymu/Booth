"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  deleteDocumentAction,
  uploadDocumentAction,
} from "@/app/(app)/clients/documents-actions";
import { formatBytes } from "@/lib/utils";
import type { ClientDocument } from "@/lib/types";

export function ClientDocuments({
  clientId,
  documents,
}: {
  clientId: string;
  documents: ClientDocument[];
}) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.set("clientId", clientId);
    fd.set("file", file);
    const res = await uploadDocumentAction(fd);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
    if (!res.ok) {
      setError(res.error ?? "Upload failed");
      return;
    }
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this file?")) return;
    const res = await deleteDocumentAction(id, clientId);
    if (!res.ok) alert(res.error);
    else router.refresh();
  }

  return (
    <div className="space-y-3">
      <div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={onFile}
          disabled={busy}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          <Upload /> {busy ? "Uploading…" : "Upload file"}
        </Button>
        <span className="ml-2 text-xs text-muted-foreground">Max 10 MB</span>
        {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
      </div>

      {documents.length > 0 && (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {documents.map((d) => (
            <li key={d.id} className="group flex items-center gap-3 px-3 py-2">
              <FileText className="size-4 shrink-0 text-muted-foreground" />
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
          ))}
        </ul>
      )}
    </div>
  );
}
