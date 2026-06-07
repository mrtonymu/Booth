"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/settings/fields", label: "Custom fields" },
  { href: "/settings/tags", label: "Tags" },
  { href: "/settings/stages", label: "Pipeline stages" },
];

/** Small switcher between settings pages (handy on mobile without a sidebar). */
export function SettingsTabs() {
  const pathname = usePathname();
  return (
    <div className="flex gap-1 border-b border-border px-6 py-2">
      {TABS.map((t) => {
        const active = pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
