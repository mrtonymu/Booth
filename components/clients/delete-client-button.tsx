"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  deleteClientAction,
  restoreClientAction,
} from "@/app/(app)/clients/actions";

export function DeleteClientButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function handle() {
    setPending(true);
    const res = await deleteClientAction(id);
    if (!res.ok) {
      setPending(false);
      toast.error(res.error ?? "Could not delete");
      return;
    }
    toast.success(`"${name}" moved to trash`, {
      action: {
        label: "Undo",
        onClick: async () => {
          await restoreClientAction(id);
          router.refresh();
          toast.success("Restored");
        },
      },
    });
    router.push("/clients");
    router.refresh();
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
