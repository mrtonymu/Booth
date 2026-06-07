import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Contact, Settings } from "lucide-react";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { BottomTabs } from "@/components/layout/bottom-tabs";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { requireUserId } from "@/lib/auth";
import { DEMO_MODE } from "@/lib/demo";

// Always render on demand so pages reflect live data (in demo mode the data
// access has no dynamic API, which would otherwise prerender these as static).
export const dynamic = "force-dynamic";

/** Clerk's user menu in real mode; a static badge in demo mode (no Clerk keys). */
function Account() {
  if (DEMO_MODE) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-semibold">
          D
        </span>
        <span>Demo</span>
      </div>
    );
  }
  return <UserButton />;
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Proxy already protects these routes; this also guarantees a userId exists.
  await requireUserId();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-sidebar md:flex">
        <div className="flex h-14 items-center gap-2 px-4">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Contact className="size-4" />
          </span>
          <Link href="/clients" className="text-sm font-semibold">
            Client CRM
          </Link>
        </div>
        <div className="flex-1 py-2">
          <SidebarNav />
        </div>
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <Account />
          <ThemeToggle />
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur md:hidden">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Contact className="size-4" />
            </span>
            <span className="text-sm font-semibold">Client CRM</span>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href="/settings/fields"
              aria-label="Settings"
              className="flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Settings className="size-5" />
            </Link>
            <ThemeToggle />
            <Account />
          </div>
        </header>

        {/* Content — extra bottom padding on mobile so the tab bar never covers it */}
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
      </div>

      {/* Mobile bottom tab bar */}
      <BottomTabs />
    </div>
  );
}
