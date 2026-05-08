import { createFileRoute, Link } from "@tanstack/react-router";
import { SignIn } from "@clerk/tanstack-react-start";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — ThreatDesk" }] }),
  component: LoginPage,
});

function LoginPage() {
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
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          Encrypted session · role-aware access
        </p>
      </div>
      <div className="flex items-center justify-center p-8">
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
