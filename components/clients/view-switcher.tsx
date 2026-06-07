"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";

const VIEWS = [
  { key: "table", label: "Table", icon: Table2 },
  { key: "gallery", label: "Gallery", icon: LayoutGrid },
];

export function ViewSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get("view") === "gallery" ? "gallery" : "table";

  function setView(view: string) {
    const next = new URLSearchParams(params.toString());
    if (view === "table") next.delete("view");
    else next.set("view", view);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  return (
    <div className="inline-flex rounded-md border border-border p-0.5">
      {VIEWS.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => setView(key)}
          aria-pressed={current === key}
          className={cn(
            "flex h-7 cursor-pointer items-center gap-1.5 rounded px-2.5 text-xs font-medium transition-colors",
            current === key
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="size-3.5" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
