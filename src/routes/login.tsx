import { createFileRoute, Link } from "@tanstack/react-router";
import { SignIn } from "@clerk/tanstack-react-start";
import { ShieldCheck, Activity } from "lucide-react";
import { z } from "zod";
import { useEffect } from "react";

const loginSearchSchema = z.object({
  role: z.enum(["admin", "member"]).optional(),
});

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — ThreatDesk" }] }),
  validateSearch: loginSearchSchema,
  component: LoginPage,
});

function LoginPage() {
  const { role } = Route.useSearch();

  // Persist the role intent so we can show it post-login. Real role is enforced
  // server-side by signup order — first user is Admin, the rest are Analysts.
  useEffect(() => {
    if (role && typeof window !== "undefined") {
      window.localStorage.setItem("td_role_intent", role);
    }
  }, [role]);

  const intent = role ?? "admin";

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden flex-col justify-between border-r border-border bg-sidebar p-12 md:flex">
        <Link to="/" className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="font-mono text-lg">ThreatDesk</span>
        </Link>
        <div>
          <h2 className="font-mono text-3xl leading-tight">
            One console for your <span className="text-primary">network security</span> ops.
          </h2>
          <p className="mt-3 max-w-md text-muted-foreground">
            Sign in to triage findings, update task status, and keep your security
            program moving.
          </p>

          <div className="mt-6 flex gap-2">
            <Link
              to="/login"
              search={{ role: "admin" }}
              className={`flex-1 rounded-md border px-4 py-3 text-sm transition ${
                intent === "admin"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              <ShieldCheck className="mb-1 h-4 w-4" />
              <div className="font-medium">Login as Admin</div>
              <div className="font-mono text-[10px] uppercase tracking-wider">Security Lead</div>
            </Link>
            <Link
              to="/login"
              search={{ role: "member" }}
              className={`flex-1 rounded-md border px-4 py-3 text-sm transition ${
                intent === "member"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              <Activity className="mb-1 h-4 w-4" />
              <div className="font-medium">Login as Member</div>
              <div className="font-mono text-[10px] uppercase tracking-wider">Analyst</div>
            </Link>
          </div>
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          Encrypted session · role-aware access
        </p>
      </div>
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <div className="w-full max-w-sm rounded-md border border-border bg-card/50 px-4 py-3 text-center text-sm md:hidden">
          Signing in as{" "}
          <span className="font-mono uppercase text-primary">
            {intent === "admin" ? "Admin" : "Member"}
          </span>
        </div>
        <SignIn
          routing="path"
          path="/login"
          signUpUrl="/signup"
          forceRedirectUrl="/dashboard"
          appearance={{ variables: { colorPrimary: "#5ed8d8", colorBackground: "#1a1f2a" } }}
        />
      </div>
    </div>
  );
}
