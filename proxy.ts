import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { DEMO_MODE } from "@/lib/demo";

// In Next.js 16 the "middleware" convention is renamed to "proxy".
// Clerk 7 is Next 16-aware, so clerkMiddleware() runs here unchanged.
const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

const clerkProxy = clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

// Demo mode bypasses auth entirely so the app runs without Clerk keys.
export default DEMO_MODE
  ? function proxy() {
      return NextResponse.next();
    }
  : clerkProxy;

export const config = {
  matcher: [
    // Skip Next.js internals and static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
