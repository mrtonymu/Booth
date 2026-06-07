"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CalendarEvent {
  date: string; // YYYY-MM-DD
  title: string;
  kind: "task" | "date";
  href: string;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

export function CalendarView({
  events,
  initialYear,
  initialMonth, // 0-based
  today,
}: {
  events: CalendarEvent[];
  initialYear: number;
  initialMonth: number;
  today: string;
}) {
  const [year, setYear] = React.useState(initialYear);
  const [month, setMonth] = React.useState(initialMonth);

  const byDate = React.useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const list = map.get(e.date);
      if (list) list.push(e);
      else map.set(e.date, [e]);
    }
    return map;
  }, [events]);

  // Monday-first grid.
  const startWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  function prev() {
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else setMonth(month - 1);
  }
  function next() {
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else setMonth(month + 1);
  }

  const monthLabel = new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-3">
        <h2 className="text-sm font-semibold">{monthLabel}</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setYear(initialYear);
              setMonth(initialMonth);
            }}
            className="h-8 cursor-pointer rounded-md border border-border px-3 text-xs font-medium transition-colors hover:bg-accent"
          >
            Today
          </button>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous month"
            className="flex size-8 cursor-pointer items-center justify-center rounded-md border border-border transition-colors hover:bg-accent"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next month"
            className="flex size-8 cursor-pointer items-center justify-center rounded-md border border-border transition-colors hover:bg-accent"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 border-b border-border text-center text-[11px] font-medium text-muted-foreground">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1.5">
            <span className="hidden sm:inline">{w}</span>
            <span className="sm:hidden">{w[0]}</span>
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          const dateStr = d ? iso(year, month, d) : "";
          const dayEvents = d ? (byDate.get(dateStr) ?? []) : [];
          const isToday = dateStr === today;
          return (
            <div
              key={i}
              className={cn(
                "min-h-16 border-b border-r border-border p-1 sm:min-h-24",
                i % 7 === 6 && "border-r-0",
                !d && "bg-muted/30",
              )}
            >
              {d && (
                <>
                  <div
                    className={cn(
                      "mb-1 flex h-5 w-5 items-center justify-center rounded-full text-xs",
                      isToday
                        ? "bg-primary font-semibold text-primary-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {d}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((e, j) => (
                      <Link
                        key={`${e.kind}-${e.href}-${j}`}
                        href={e.href}
                        title={e.title}
                        className={cn(
                          "block truncate rounded px-1 py-0.5 text-[10px] leading-tight transition-opacity hover:opacity-80",
                          e.kind === "task"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                            : "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
                        )}
                      >
                        {e.title}
                      </Link>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="block px-1 text-[10px] text-muted-foreground">
                        +{dayEvents.length - 3} more
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
