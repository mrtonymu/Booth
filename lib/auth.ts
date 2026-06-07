import "server-only";
import { auth } from "@clerk/nextjs/server";
import { DEMO_MODE, DEMO_USER_ID } from "@/lib/demo";

/**
 * Returns the current Clerk user id, redirecting to sign-in if absent.
 * Use this in Server Components and Server Actions to scope every query.
 */
export async function requireUserId(): Promise<string> {
  if (DEMO_MODE) return DEMO_USER_ID;
  const { userId, redirectToSignIn } = await auth();
  if (!userId) {
    // redirectToSignIn throws, so this never returns past here.
    redirectToSignIn();
    throw new Error("Not authenticated");
  }
  return userId;
}
