"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { DEFAULT_WHATSAPP_TEMPLATE, renderWhatsappMessage } from "@/lib/utils";
import { saveWhatsappTemplateAction } from "@/app/(app)/settings/whatsapp/actions";

const PREVIEW_NAME = "Ahmad";

/**
 * Render WhatsApp *bold* markup so the preview matches the real chat. Only the
 * `*...*` bold form is supported here — enough to preview the {name} emphasis.
 */
function PreviewText({ text }: { text: string }) {
  const parts = text.split(/(\*[^*\n]+\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("*") && part.endsWith("*") && part.length > 2 ? (
          <strong key={i}>{part.slice(1, -1)}</strong>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        ),
      )}
    </>
  );
}

export function WhatsappTemplateForm({ template }: { template: string }) {
  const router = useRouter();
  const [value, setValue] = React.useState(template);
  const [saving, setSaving] = React.useState(false);

  const dirty = value !== template;
  const preview = renderWhatsappMessage(value, PREVIEW_NAME);

  async function save() {
    setSaving(true);
    const res = await saveWhatsappTemplateAction(value);
    setSaving(false);
    if (!res.ok) toast.error(res.error ?? "Could not save");
    else {
      toast.success("WhatsApp message saved");
      router.refresh();
    }
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-6 p-4 md:grid-cols-2 md:p-6">
      {/* Editor */}
      <div className="flex flex-col gap-2">
        <label htmlFor="wa-template" className="text-sm font-medium">
          Opening message
        </label>
        <Textarea
          id="wa-template"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={8}
          className="min-h-[180px] font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Use{" "}
          <code className="rounded bg-muted px-1 py-0.5">{"{name}"}</code> where
          the client&rsquo;s name should go. Wrap it in{" "}
          <code className="rounded bg-muted px-1 py-0.5">*</code> for{" "}
          <strong>bold</strong>, like{" "}
          <code className="rounded bg-muted px-1 py-0.5">*{"{name}"}*</code>.
        </p>
        <div className="flex items-center gap-2 pt-1">
          <Button onClick={save} disabled={!dirty || saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setValue(DEFAULT_WHATSAPP_TEMPLATE)}
            disabled={value === DEFAULT_WHATSAPP_TEMPLATE}
          >
            <RotateCcw /> Reset to default
          </Button>
        </div>
      </div>

      {/* Live preview — a little WhatsApp chat bubble */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Preview</span>
        <div className="rounded-xl bg-[#e5ddd5] p-4 dark:bg-[#0b141a]">
          <div className="ml-auto max-w-[85%] rounded-lg rounded-tr-none bg-[#d9fdd3] px-3 py-2 text-sm whitespace-pre-wrap text-[#111b21] shadow-sm dark:bg-[#005c4b] dark:text-white">
            <PreviewText text={preview} />
          </div>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <WhatsAppIcon className="size-3.5 text-[#25D366]" />
          This is what opens when you tap the WhatsApp button on a client (shown
          here with the sample name &ldquo;{PREVIEW_NAME}&rdquo;).
        </p>
      </div>
    </div>
  );
}
