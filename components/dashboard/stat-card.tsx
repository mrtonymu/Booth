import type { ElementType } from "react";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "default",
}: {
  label: string;
  value: number | string;
  icon: ElementType;
  hint?: string;
  tone?: "default" | "danger";
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      {hint && (
        <p
          className={
            tone === "danger"
              ? "mt-0.5 text-xs font-medium text-destructive"
              : "mt-0.5 text-xs text-muted-foreground"
          }
        >
          {hint}
        </p>
      )}
    </div>
  );
}
