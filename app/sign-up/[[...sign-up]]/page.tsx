import { redirect } from "next/navigation";
import { SignUp } from "@clerk/nextjs";
import { DEMO_MODE } from "@/lib/demo";

export default function SignUpPage() {
  // No Clerk keys in demo mode — never render the Clerk widget.
  if (DEMO_MODE) redirect("/clients");
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background p-4">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Client CRM</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create your account to get started.
        </p>
      </div>
      <SignUp />
    </div>
  );
}
