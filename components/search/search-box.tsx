"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

/**
 * Global search input. Navigates to /search?q=… (debounced). Used both on the
 * search page and as a compact launcher in the sidebar.
 */
export function SearchBox({
  initialQuery = "",
  autoFocus = false,
  placeholder = "Search everything…",
}: {
  initialQuery?: string;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const router = useRouter();
  const [q, setQ] = React.useState(initialQuery);
  const touched = React.useRef(false);

  React.useEffect(() => {
    if (!touched.current) return; // don't navigate until the user types
    const id = setTimeout(() => {
      router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
    }, 300);
    return () => clearTimeout(id);
  }, [q, router]);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={q}
        onChange={(e) => {
          touched.current = true;
          setQ(e.target.value);
        }}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="pl-8"
      />
    </div>
  );
}
