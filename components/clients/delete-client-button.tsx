"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteClientAction } from "@/app/(app)/clients/actions";

export function DeleteClientButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const [pending, setPending] = React.useState(false);

  async function handle() {
    if (
      !confirm(
        `Delete "${name}"? This permanently removes the client and all their activity.`,
      )
    )
      return;
    setPending(true);
    // Server action redirects to /clients on success.
    await deleteClientAction(id);
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handle}
      disabled={pending}
      className="text-destructive hover:bg-destructive/10"
    >
      <Trash2 /> {pending ? "Deleting…" : "Delete"}
    </Button>
  );
}
