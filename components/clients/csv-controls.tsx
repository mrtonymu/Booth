"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  importClientsAction,
  type ImportResult,
} from "@/app/(app)/clients/actions";

export function CsvControls({ hasClients }: { hasClients: boolean }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<ImportResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    setResult(null);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (parsed) => {
        try {
          const rows = parsed.data.filter(
            (r) => r && Object.keys(r).length > 0,
          );
          if (rows.length === 0) {
            setError("No rows found. Make sure the file has a header row.");
            setBusy(false);
            return;
          }
          const res = await importClientsAction(rows);
          setResult(res);
          router.refresh();
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setBusy(false);
          if (inputRef.current) inputRef.current.value = "";
        }
      },
      error: (err) => {
        setError(err.message);
        setBusy(false);
      },
    });
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setResult(null);
          setError(null);
          setOpen(true);
        }}
      >
        <Upload /> Import
      </Button>
      <a
        href="/api/clients/export"
        className={
          "inline-flex h-8 cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-transparent px-3 text-xs font-medium transition-colors hover:bg-accent" +
          (hasClients ? "" : " pointer-events-none opacity-50")
        }
        aria-disabled={!hasClients}
      >
        <Download className="size-4" /> Export
      </a>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Import clients from CSV"
        description="The first row must be headers. Use column names that match your fields (Name, Phone, Email, your custom field labels, and Tags)."
      >
        <div className="space-y-4">
          <a
            href="/api/clients/export"
            className="text-sm text-primary hover:underline"
          >
            Tip: export first to get a template with the right columns.
          </a>

          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-8 text-center transition hover:bg-accent/40">
            <Upload className="size-5 text-muted-foreground" />
            <span className="text-sm font-medium">
              {busy ? "Importing…" : "Choose a CSV file"}
            </span>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={onFile}
              disabled={busy}
            />
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {result && (
            <p className="text-sm text-foreground">
              Imported <strong>{result.imported}</strong> client
              {result.imported === 1 ? "" : "s"}.
              {result.skipped > 0 && (
                <span className="text-muted-foreground">
                  {" "}
                  Skipped {result.skipped} (missing name or duplicate).
                </span>
              )}
            </p>
          )}

          <div className="flex justify-end">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
