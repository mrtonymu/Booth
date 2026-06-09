"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateClientAppointmentAction } from "@/app/(app)/clients/actions";
import { formatDateTime, isoToLocalInput, localInputToISO } from "@/lib/utils";

export function AppointmentScheduler({
  clientId,
  appointmentAt,
}: {
  clientId: string;
  appointmentAt: string | null;
}) {
  const router = useRouter();
  const [value, setValue] = React.useState(isoToLocalInput(appointmentAt));
  const [saving, setSaving] = React.useState(false);

  async function save(next: string | null) {
    setSaving(true);
    const res = await updateClientAppointmentAction(clientId, next);
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error ?? "Could not save appointment");
      return;
    }
    toast.success(next ? "Appointment set" : "Appointment cleared");
    router.refresh();
  }

  return (
    <div className="space-y-2 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <CalendarClock className="size-4 text-muted-foreground" />
        Appointment
      </div>

      {appointmentAt && (
        <p className="text-sm">
          <span className="rounded bg-orange-100 px-2 py-0.5 font-medium text-orange-800 dark:bg-orange-950 dark:text-orange-300">
            {formatDateTime(appointmentAt)}
          </span>
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          type="datetime-local"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label="Appointment date and time"
          className="flex-1"
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            disabled={saving || !value}
            onClick={() => save(localInputToISO(value))}
          >
            Save
          </Button>
          {appointmentAt && (
            <Button
              size="sm"
              variant="outline"
              disabled={saving}
              onClick={() => {
                setValue("");
                save(null);
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Set a date &amp; time to see this client on the Calendar.
      </p>
    </div>
  );
}
