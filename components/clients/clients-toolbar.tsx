"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, ArrowUpDown, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { FieldDefinition, Tag } from "@/lib/types";

export function ClientsToolbar({
  fields,
  tags,
}: {
  fields: FieldDefinition[];
  tags: Tag[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [q, setQ] = React.useState(params.get("q") ?? "");

  // Push a single param change onto the URL, preserving the rest.
  const setParam = React.useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router],
  );

  // Debounce the search box.
  React.useEffect(() => {
    const current = params.get("q") ?? "";
    if (q === current) return;
    const id = setTimeout(() => setParam("q", q), 300);
    return () => clearTimeout(id);
  }, [q, params, setParam]);

  const tag = params.get("tag") ?? "";
  const sort = params.get("sort") ?? "updated_at";
  const dir = params.get("dir") ?? "desc";

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative w-full sm:min-w-[200px] sm:flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, phone, email…"
          className="pl-8 pr-9"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            aria-label="Clear search"
            className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="flex gap-2">
      <Select
        value={tag}
        onChange={(e) => setParam("tag", e.target.value)}
        className="min-w-0 flex-1 sm:w-auto sm:min-w-[130px] sm:flex-none"
        aria-label="Filter by tag"
      >
        <option value="">All tags</option>
        {tags.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </Select>

      <Select
        value={sort}
        onChange={(e) => setParam("sort", e.target.value)}
        className="min-w-0 flex-1 sm:w-auto sm:min-w-[150px] sm:flex-none"
        aria-label="Sort by"
      >
        <option value="updated_at">Recently updated</option>
        <option value="created_at">Date added</option>
        <option value="name">Name</option>
        {fields
          .filter((f) => f.type !== "textarea" && f.type !== "checkbox")
          .map((f) => (
            <option key={f.id} value={`custom:${f.type}:${f.key}`}>
              {f.label}
            </option>
          ))}
      </Select>

      <Button
        variant="outline"
        size="icon"
        onClick={() => setParam("dir", dir === "asc" ? "desc" : "asc")}
        aria-label={dir === "asc" ? "Ascending" : "Descending"}
        title={dir === "asc" ? "Ascending" : "Descending"}
        className="shrink-0"
      >
        <ArrowUpDown className={dir === "asc" ? "" : "rotate-180"} />
      </Button>
      </div>
    </div>
  );
}
